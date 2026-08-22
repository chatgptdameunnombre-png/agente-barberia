import { firebaseConfig } from "./config.js?v=1";

const $ = s => document.querySelector(s);
const PROJ = firebaseConfig.projectId;
const KEY = firebaseConfig.apiKey;
const RAIZ = `https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents`;

/* Campos ligeros: se pide TODO menos `eventos`, que es lo pesado.
   El detalle de una visita se baja solo cuando el dueño la abre. */
const CAMPOS = ["inicio", "fin", "duracion", "dispositivo", "origen", "entrada", "paginas",
  "compro", "clienteEmail", "vistos", "alCarrito", "favorito", "busquedas", "sinResultado", "tallas", "productos"];

let sesiones = [];
let cargando = false;
let bd = null;

/* ---------------- helpers ---------------- */
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const esc = t => String(t ?? "").replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

function tiempo(seg) {
  seg = Math.round(Number(seg) || 0);
  if (seg < 60) return seg + "s";
  const m = Math.floor(seg / 60);
  if (m < 60) return m + "m " + (seg % 60) + "s";
  return Math.floor(m / 60) + "h " + (m % 60) + "m";
}

function hace(iso) {
  const t = new Date(iso || 0).getTime();
  if (!t) return "—";
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "ahorita";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

/* ---------------- conversión Firestore ---------------- */
function fsVal(v) {
  if (!v || typeof v !== "object") return v;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fsVal);
  if ("mapValue" in v) return fsFields(v.mapValue.fields || {});
  return undefined;
}
const fsFields = f => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fsVal(v)]));

async function bajarSesiones(dias) {
  const token = await bd.token();
  if (!token) throw new Error("inicia sesión otra vez");
  const desde = dias === "todo" ? "2020-01-01" : new Date(Date.now() - Number(dias) * 86400e3).toISOString();
  const query = {
    structuredQuery: {
      from: [{ collectionId: "sesiones" }],
      select: { fields: CAMPOS.map(f => ({ fieldPath: f })) },
      where: { fieldFilter: { field: { fieldPath: "inicio" }, op: "GREATER_THAN_OR_EQUAL", value: { stringValue: desde } } },
      orderBy: [{ field: { fieldPath: "inicio" }, direction: "DESCENDING" }],
      limit: 500
    }
  };
  const r = await fetch(`${RAIZ}:runQuery?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(query)
  });
  if (!r.ok) throw new Error("no se pudo leer (" + r.status + ")");
  const data = await r.json();
  return (data || []).filter(x => x.document)
    .map(x => ({ id: x.document.name.split("/").pop(), ...fsFields(x.document.fields || {}) }));
}

async function bajarEventos(id) {
  const token = await bd.token();
  const r = await fetch(`${RAIZ}/sesiones/${id}?key=${KEY}&mask.fieldPaths=eventos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return [];
  const d = await r.json();
  return fsVal(d.fields?.eventos) || [];
}

/* ---------------- cálculo ---------------- */
function resumen(list) {
  const r = {
    visitas: list.length, personas: new Set(), segundos: 0,
    vieron: 0, carrito: 0, compraron: 0, rebotes: 0,
    productos: {}, faltantes: {}, tallas: {}, origenes: {}, dispositivos: {}
  };
  for (const s of list) {
    r.personas.add(s.clienteEmail || s.id);
    r.segundos += Number(s.duracion || 0);
    const prods = s.productos || {};
    const claves = Object.keys(prods);
    if (claves.length) r.vieron++;
    if (claves.some(k => prods[k].carrito)) r.carrito++;
    if (s.compro) r.compraron++;
    if (!claves.length && Number(s.duracion || 0) < 10) r.rebotes++;
    r.origenes[s.origen || "?"] = (r.origenes[s.origen || "?"] || 0) + 1;
    r.dispositivos[s.dispositivo || "?"] = (r.dispositivos[s.dispositivo || "?"] || 0) + 1;
    for (const [id, d] of Object.entries(prods)) {
      const p = r.productos[id] || { nombre: d.nombre || id, personas: 0, vistas: 0, segundos: 0, carrito: 0, equipo: d.equipo || "" };
      p.personas += 1;
      p.vistas += Number(d.vistas || 0);
      p.segundos += Number(d.segundos || 0);
      if (d.carrito) p.carrito += 1;
      if (d.nombre) p.nombre = d.nombre;
      r.productos[id] = p;
    }
    (s.sinResultado || []).forEach(t => { r.faltantes[t] = (r.faltantes[t] || 0) + 1; });
    (s.tallas || []).forEach(t => { r.tallas[t] = (r.tallas[t] || 0) + 1; });
  }
  r.personas = r.personas.size;
  return r;
}

/* ---------------- pintado ---------------- */
function tarjeta(num, txt, pie) {
  return `<div class="stat">
    <div class="n">${num}</div>
    <div class="l">${txt}</div>
    ${pie ? `<div style="font-size:12px;color:#8a8a90;margin-top:4px">${pie}</div>` : ""}
  </div>`;
}

function barra(valor, max, texto, color = "#c9a227") {
  const w = max ? Math.max(2, Math.round((valor / max) * 100)) : 0;
  return `<div style="display:flex;align-items:center;gap:10px">
    <div style="flex:1;min-width:60px;background:#f0f0f2;border-radius:6px;height:22px;position:relative;overflow:hidden">
      <div style="width:${w}%;height:100%;background:${color};border-radius:6px"></div>
    </div>
    <span style="min-width:76px;font-size:13px;color:#444">${texto}</span>
  </div>`;
}

function bloque(titulo, ayuda, cuerpo) {
  return `<section style="margin:26px 0">
    <h3 style="font-size:17px;margin:0 0 2px">${titulo}</h3>
    ${ayuda ? `<p style="color:#777;font-size:13px;margin:0 0 12px">${ayuda}</p>` : '<div style="height:8px"></div>'}
    ${cuerpo}
  </section>`;
}

function vacio(txt) {
  return `<p style="color:#9a9aa2;font-size:14px;background:#fafafa;border:1px dashed #e2e2e6;border-radius:12px;padding:16px;margin:0">${txt}</p>`;
}

function embudo(r) {
  const pasos = [
    ["Entraron a la tienda", r.visitas, "#5b8def"],
    ["Abrieron un jersey", r.vieron, "#7a63d6"],
    ["Lo pusieron en el carrito", r.carrito, "#c9a227"],
    ["Compraron", r.compraron, "#2e9e5b"]
  ];
  return `<div style="display:grid;gap:10px">${pasos.map(([txt, n, c]) => `
    <div style="display:grid;grid-template-columns:200px 1fr;gap:12px;align-items:center">
      <span style="font-size:14px;color:#333">${txt}</span>
      ${barra(n, r.visitas, `${n} · ${pct(n, r.visitas)}%`, c)}
    </div>`).join("")}</div>`;
}

function tablaProductos(prods, r) {
  if (!prods.length) return vacio("Todavía nadie ha abierto un jersey.");
  const max = Math.max(...prods.map(p => p.personas));
  return `<div style="display:grid;gap:12px">${prods.map(p => `
    <div style="display:grid;grid-template-columns:1fr 220px 130px;gap:14px;align-items:center;padding:12px 14px;background:#fff;border:1px solid #ececf0;border-radius:12px">
      <div>
        <div style="font-weight:600;font-size:14.5px">${esc(p.nombre)}</div>
        <div style="font-size:12.5px;color:#888">${esc(p.equipo || "")}</div>
      </div>
      ${barra(p.personas, max, `${p.personas} ${p.personas === 1 ? "persona" : "personas"}`)}
      <div style="font-size:13px;color:#555;text-align:right">
        ${tiempo(p.segundos / Math.max(1, p.personas))} de vista<br>
        <b style="color:${p.carrito ? "#2e9e5b" : "#c62828"}">${p.carrito} al carrito</b>
      </div>
    </div>`).join("")}</div>`;
}

function chips(pares, colorFondo = "#fff6e0", colorTexto = "#7a5c00") {
  if (!pares.length) return null;
  return `<div style="display:flex;flex-wrap:wrap;gap:8px">${pares.map(([t, n]) => `
    <span style="background:${colorFondo};color:${colorTexto};border-radius:999px;padding:8px 14px;font-size:13.5px">
      ${esc(t)} <b style="margin-left:4px">×${n}</b>
    </span>`).join("")}</div>`;
}

function listaBarras(obj, total) {
  const e = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!e.length) return vacio("Sin datos todavía.");
  const max = e[0][1];
  return `<div style="display:grid;gap:9px">${e.map(([t, n]) => `
    <div style="display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:center">
      <span style="font-size:13.5px;color:#333;text-transform:capitalize">${esc(t)}</span>
      ${barra(n, max, `${n} · ${pct(n, total)}%`, "#5b8def")}
    </div>`).join("")}</div>`;
}

function visitas(list) {
  if (!list.length) return vacio("Todavía no hay visitas en este periodo.");
  return `<div style="display:grid;gap:8px">${list.slice(0, 30).map(s => {
    const estado = s.compro
      ? `<span style="background:#e6f6ec;color:#1d7a43;border-radius:999px;padding:4px 10px;font-size:12.5px">Compró</span>`
      : (s.alCarrito
        ? `<span style="background:#fff4e0;color:#9a6b00;border-radius:999px;padding:4px 10px;font-size:12.5px">Dejó el carrito</span>`
        : (s.vistos
          ? `<span style="background:#eef1fb;color:#3a55a8;border-radius:999px;padding:4px 10px;font-size:12.5px">Miró jerseys</span>`
          : `<span style="background:#f4f4f5;color:#777;border-radius:999px;padding:4px 10px;font-size:12.5px">Solo pasó</span>`));
    return `<details style="background:#fff;border:1px solid #ececf0;border-radius:12px;padding:12px 14px">
      <summary style="cursor:pointer;display:grid;grid-template-columns:130px 1fr 150px 150px;gap:12px;align-items:center;list-style:none">
        <span style="font-size:13px;color:#777">${hace(s.inicio)}</span>
        <span style="font-size:14px">${esc(s.clienteEmail || "Visitante")}${s.favorito ? ` <span style="color:#888">· vio ${esc(s.favorito)}</span>` : ""}</span>
        <span style="font-size:13px;color:#555">${tiempo(s.duracion)} · ${esc(s.dispositivo || "")}</span>
        <span style="text-align:right">${estado}</span>
      </summary>
      <div style="margin-top:10px;font-size:13.5px;color:#555" data-detalle="${s.id}">
        Llegó de <b>${esc(s.origen || "directo")}</b> · entró por <b>${esc(s.entrada || "index.html")}</b> · vio ${s.vistos || 0} jersey(s)
        ${(s.busquedas || []).length ? `<br>Buscó: ${(s.busquedas || []).map(esc).join(", ")}` : ""}
        <br><button class="btn btn--ghost" data-ver="${s.id}" style="width:auto;margin-top:8px;padding:6px 12px">Ver qué hizo paso a paso</button>
      </div>
    </details>`;
  }).join("")}</div>`;
}

export function pintarLista(list) {
  const cont = $("#estadBody");
  if (!cont) return;
  const r = resumen(list);
  const prods = Object.values(r.productos);
  const top = prods.slice().sort((a, b) => b.personas - a.personas || b.segundos - a.segundos).slice(0, 8);
  const frios = prods.filter(p => p.personas >= 3 && p.carrito === 0).sort((a, b) => b.personas - a.personas).slice(0, 6);
  const faltantes = Object.entries(r.faltantes).sort((a, b) => b[1] - a[1]).slice(0, 12);

  cont.innerHTML = `
    <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:6px">
      ${tarjeta(r.visitas, "Visitas", `${r.personas} ${r.personas === 1 ? "persona" : "personas"} distintas`)}
      ${tarjeta(tiempo(r.visitas ? r.segundos / r.visitas : 0), "Se quedan en promedio", "solo el tiempo que están activos")}
      ${tarjeta(r.carrito, "Llenaron el carrito", `${pct(r.carrito, r.visitas)}% de las visitas`)}
      ${tarjeta(r.compraron, "Compras", r.visitas ? `${pct(r.compraron, r.visitas)}% de las visitas` : "")}
    </div>

    ${bloque("¿En qué parte se te caen?",
      "De cada 100 que entran, cuántos llegan a cada paso. Donde la barra se cae de golpe, ahí está el problema.",
      embudo(r))}

    ${bloque("Los jerseys que más miran",
      "Cuántas personas distintas lo abrieron, cuánto tiempo lo estuvieron viendo y cuántas lo pusieron en el carrito.",
      tablaProductos(top, r))}

    ${bloque("Los ven y no los compran",
      "Los abrieron tres personas o más y nadie lo agregó. Casi siempre es el precio, la foto o que falta su talla.",
      frios.length ? tablaProductos(frios, r) : vacio("Ninguno por ahora. Buena señal."))}

    ${bloque("Te están pidiendo esto y no lo tienes",
      "Búsquedas que no encontraron nada. Esto es lo que deberías conseguir para la próxima.",
      chips(faltantes) || vacio("Nadie ha buscado algo que no tengas."))}

    ${bloque("Tallas que más buscan", "", Object.keys(r.tallas).length ? listaBarras(r.tallas, r.visitas) : vacio("Aún no filtran por talla."))}

    ${bloque("De dónde llegan", "", `<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
      <div>${listaBarras(r.origenes, r.visitas)}</div>
      <div>${listaBarras(r.dispositivos, r.visitas)}</div>
    </div>`)}

    ${bloque("Visita por visita", "Abre cualquiera para ver qué hizo esa persona.", visitas(list))}
  `;
}

/* ---------------- carga ---------------- */
export async function pintarEstadisticas(db) {
  bd = db;
  const cont = $("#estadBody");
  if (!cont) return;
  if (cargando) return;
  cargando = true;
  cont.innerHTML = `<p style="color:#9a9aa2;font-size:14px">Cargando…</p>`;
  const dias = $("#estadRango")?.value || "30";
  try {
    sesiones = await bajarSesiones(dias);
    pintarLista(sesiones);
    const sello = $("#estadSello");
    if (sello) sello.textContent = `${sesiones.length} visitas · actualizado ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (e) {
    cont.innerHTML = `<p style="color:#c62828;font-size:14px">No se pudieron leer las estadísticas: ${esc(e.message)}</p>`;
  }
  cargando = false;
}

document.addEventListener("change", e => {
  if (e.target.id === "estadRango" && bd) pintarEstadisticas(bd);
});

document.addEventListener("click", async e => {
  if (e.target.id === "estadRefrescar" && bd) { pintarEstadisticas(bd); return; }
  const b = e.target.closest("[data-ver]");
  if (!b) return;
  b.disabled = true;
  b.textContent = "Cargando…";
  const eventos = await bajarEventos(b.dataset.ver);
  const cont = b.parentElement;
  const nombre = { pagina: "Abrió", ver_producto: "Vio", agregar_carrito: "Agregó al carrito", filtro: "Filtró", click: "Tocó", asesor: "Le preguntó a la IA", checkout: "Fue a pagar", comprar_directo: "Fue a pagar", scroll: "Bajó hasta", personalizacion: "Personalización", transferencia: "Eligió transferencia", pago_mercadopago: "Eligió tarjeta", cotizacion_uniformes: "Pidió cotización de uniformes" };
  cont.innerHTML += eventos.length
    ? `<ol style="margin:12px 0 0 18px;font-size:13.5px;color:#555;display:grid;gap:4px">${eventos.map(ev => {
        const hora = String(ev.t || "").slice(11, 16);
        const det = ev.nombre || ev.texto || ev.valor || ev.pregunta || (ev.hasta ? ev.hasta + "%" : "") || ev.url || "";
        return `<li>${hora} — ${esc(nombre[ev.e] || ev.e)}${det ? ": " + esc(det) : ""}</li>`;
      }).join("")}</ol>`
    : `<p style="margin-top:10px;color:#999;font-size:13px">Sin detalle guardado.</p>`;
  b.remove();
});
