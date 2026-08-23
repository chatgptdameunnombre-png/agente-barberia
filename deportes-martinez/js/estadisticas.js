import { firebaseConfig } from "./config.js?v=32";

const $ = s => document.querySelector(s);
const PROJ = firebaseConfig.projectId;
const KEY = firebaseConfig.apiKey;
const RAIZ = `https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents`;

/* Campos ligeros: se pide TODO menos `eventos`, que es lo pesado.
   El detalle de una visita se baja solo cuando el dueño la abre. */
const CAMPOS = ["inicio", "fin", "duracion", "dispositivo", "origen", "entrada", "paginas",
  "compro", "compraPorConfirmar", "clienteEmail", "vistos", "alCarrito", "favorito", "busquedas", "sinResultado", "tallas", "productos"];

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

function hora12(iso) {
  const d = new Date(iso || 0);
  if (!d.getTime()) return "";
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
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
    productos: {}, faltantes: {}, busquedas: {}, tallas: {}, origenes: {}, dispositivos: {}
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
    const APARATO = { movil: "Teléfono", tablet: "Tablet", escritorio: "Computadora" };
    const ap = APARATO[s.dispositivo] || "Otro";
    r.dispositivos[ap] = (r.dispositivos[ap] || 0) + 1;
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
    (s.busquedas || []).forEach(t => { r.busquedas[t] = (r.busquedas[t] || 0) + 1; });
    (s.tallas || []).forEach(t => { r.tallas[t] = (r.tallas[t] || 0) + 1; });
  }
  r.personas = r.personas.size;
  return r;
}

/* ---------------- cada acción, contada en español ---------------- */
const PAGINA = {
  "index.html": "al home", "": "al home",
  "futbol.html": "a playeras de futbol", "basket.html": "a playeras de basketball",
  "americano.html": "a playeras de americano", "producto.html": "a una playera",
  "cuenta.html": "a su cuenta", "legales.html": "a los términos"
};
const ENTREGA = { tienda: "recoger en tienda", domicilio: "envío a domicilio" };
const PAGO = { tarjeta: "tarjeta", transferencia: "transferencia" };

export function paso(ev) {
  const h = hora12(ev.t);
  const n = ev.nombre ? esc(ev.nombre) : "";
  const frase = (() => {
    switch (ev.e) {
      case "pagina": return `Entró ${PAGINA[ev.url] || "a " + esc(ev.url || "la tienda")}`;
      case "navega": return "";
      case "ver_producto": return `Abrió <b>${n}</b>`;
      case "ver_foto": return "Vio otra foto del jersey";
      case "elige_talla": return `Eligió la talla <b>${esc(ev.talla)}</b>`;
      case "cambia_talla": return `Cambió de la talla ${esc(ev.antes)} a la <b>${esc(ev.talla)}</b>`;
      case "personalizacion": return ev.activada ? "Activó ponerle nombre y número" : "Quitó lo del nombre y número";
      case "agregar_carrito": return `Puso <b>${n}</b>${ev.talla ? " talla " + esc(ev.talla) : ""} en el carrito${ev.personalizado ? " (con nombre y número)" : ""}`;
      case "carrito_abrir": return "Abrió el carrito";
      case "carrito_cerrar": return "Cerró el carrito";
      case "carrito_quitar": return `Quitó <b>${n}</b> del carrito`;
      case "carrito_cantidad": return `Cambió la cantidad a ${esc(ev.cantidad)}`;
      case "elige_entrega": return `Eligió ${ENTREGA[ev.entrega] || esc(ev.entrega)}`;
      case "elige_pago": return `Eligió pagar con ${PAGO[ev.metodo] || esc(ev.metodo)}`;
      case "filtros_abrir": return "Abrió los filtros";
      case "filtro": return `Filtró por ${esc(ev.campoTxt || ev.campo)}: <b>${esc(ev.valor)}</b>`;
      case "filtro_sin_resultado": return "Con esos filtros no le salió nada";
      case "asesor_abrir": return "Abrió el asistente";
      case "asesor_cerrar": return "Cerró el asistente";
      case "asesor": return `Le preguntó al asistente: “${esc(ev.pregunta)}”${ev.resultados ? ` (le mostró ${ev.resultados})` : " (no encontró nada)"}`;
      case "checkout": case "va_a_pagar": case "comprar_directo": return "Se fue a pagar";
      case "transferencia": return "Vio los datos para transferir";
      case "transferencia_fin": return "Terminó la transferencia (seguramente mandó su comprobante)";
      case "pago_mercadopago": return "Eligió pagar con tarjeta";
      case "sale_a_pagar": return `Salió a <b>${esc(ev.proveedor || "pagar")}</b> para pagar`;
      case "vuelve_de_pago": {
        const est = { approved: "el pago salió bien ✅", pending: "el pago quedó pendiente", in_process: "el pago quedó en revisión", rejected: "el pago fue rechazado ❌", failure: "el pago falló ❌" };
        return `Volvió de Mercado Pago: ${est[ev.estado] || esc(ev.estado)}`;
      }
      case "comprobante_whatsapp": return "Se fue a WhatsApp a mandar su comprobante de transferencia";
      case "compra": return ev.porConfirmar
        ? `<b>Compró por transferencia</b> — falta que confirmes el comprobante`
        : `<b>Compró</b>${ev.via ? " con " + esc(ev.via) : ""}`;
      case "salida": return ev.conCarrito ? "Se fue dejando cosas en el carrito" : "Se fue sin comprar";
      default: return "";
    }
  })();
  return frase ? `<span class="st-hora">${h}</span> ${frase}` : "";
}

/* dos veces lo mismo seguido (recargó, o el aviso se mandó dos veces) = una sola línea */
function sinRepetidos(lista) {
  const fuera = [];
  let anterior = "";
  /* los avisos llegan por lotes y no siempre en orden: se acomodan por hora */
  const ordenada = lista.slice().sort((a, b) => String(a.t || "").localeCompare(String(b.t || "")));
  for (const ev of ordenada) {
    const linea = paso(ev);
    if (!linea) continue;
    const cuerpo = linea.replace(/<span class="st-hora">.*?<\/span> /, "");
    if (cuerpo === anterior) continue;
    anterior = cuerpo;
    fuera.push(linea);
  }
  return fuera;
}

/* ---------------- pintado ---------------- */
function tarjeta(num, txt, pie) {
  return `<div class="stat">
    <div class="n">${num}</div>
    <div class="l">${txt}</div>
    ${pie ? `<div class="st-pie">${pie}</div>` : ""}
  </div>`;
}

function barra(valor, max, texto, tono = "oro") {
  const w = max ? Math.max(2, Math.round((valor / max) * 100)) : 0;
  return `<div class="st-barra">
    <div class="st-barra__riel"><div class="st-barra__fill st-barra__fill--${tono}" style="width:${w}%"></div></div>
    <span class="st-barra__txt">${texto}</span>
  </div>`;
}

function bloque(titulo, ayuda, cuerpo, id) {
  return `<section class="st-bloque"${id ? ` id="${id}" data-sub="${id}"` : ""}>
    <h3 class="st-bloque__h">${titulo}</h3>
    ${ayuda ? `<p class="st-bloque__ayuda">${ayuda}</p>` : ""}
    ${cuerpo}
  </section>`;
}

function vacio(txt) {
  return `<p class="st-vacio">${txt}</p>`;
}

function embudo(r) {
  const pasos = [
    ["Entraron a la tienda", r.visitas, "azul"],
    ["Abrieron un jersey", r.vieron, "morado"],
    ["Lo pusieron en el carrito", r.carrito, "oro"],
    ["Compraron", r.compraron, "verde"]
  ];
  return `<div class="st-embudo">${pasos.map(([txt, n, tono]) => `
    <div class="st-embudo__fila">
      <span class="st-embudo__paso">${txt}</span>
      ${barra(n, r.visitas, `${n} · ${pct(n, r.visitas)}%`, tono)}
    </div>`).join("")}</div>`;
}

function tablaProductos(prods, r) {
  if (!prods.length) return vacio("Todavía nadie ha abierto un jersey.");
  const max = Math.max(...prods.map(p => p.personas));
  return `<div class="st-prods">${prods.map(p => `
    <div class="st-prod">
      <div class="st-prod__id">
        <div class="st-prod__nombre">${esc(p.nombre)}</div>
        <div class="st-prod__equipo">${esc(p.equipo || "")}</div>
      </div>
      ${barra(p.personas, max, `${p.personas} ${p.personas === 1 ? "persona" : "personas"}`)}
      <div class="st-prod__dato">
        ${tiempo(p.segundos / Math.max(1, p.personas))} de vista<br>
        <b class="${p.carrito ? "st-ok" : "st-mal"}">${p.carrito} al carrito</b>
      </div>
    </div>`).join("")}</div>`;
}

function chips(pares) {
  if (!pares.length) return null;
  return `<div class="st-chips">${pares.map(([t, n]) => `
    <span class="st-chip">${esc(t)} <b>×${n}</b></span>`).join("")}</div>`;
}

function listaBarras(obj, total) {
  const e = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!e.length) return vacio("Sin datos todavía.");
  const max = e[0][1];
  return `<div class="st-lista">${e.map(([t, n]) => `
    <div class="st-lista__fila">
      <span class="st-lista__et">${esc(t)}</span>
      ${barra(n, max, `${n} · ${pct(n, total)}%`, "azul")}
    </div>`).join("")}</div>`;
}

function visitas(list) {
  if (!list.length) return vacio("Todavía no hay visitas en este periodo.");
  return `<div class="st-visitas">${list.slice(0, 30).map(s => {
    const clase = s.compro ? (s.compraPorConfirmar ? "porconfirmar" : "compro") : (s.alCarrito ? "carrito" : (s.vistos ? "miro" : "paso"));
    const etiqueta = { compro: "Compró", porconfirmar: "Compró · por confirmar", carrito: "Dejó el carrito", miro: "Miró jerseys", paso: "Solo pasó" }[clase];
    return `<details class="st-visita">
      <summary class="st-visita__cab">
        <span class="st-visita__cuando">${hace(s.inicio)}</span>
        <span class="st-visita__quien">${esc(s.clienteEmail || "Visitante")}${s.favorito ? `<span class="st-visita__vio"> · vio ${esc(s.favorito)}</span>` : ""}</span>
        <span class="st-visita__tiempo">${tiempo(s.duracion)} · ${esc(s.dispositivo || "")}</span>
        <span class="st-tag st-tag--${clase}">${etiqueta}</span>
      </summary>
      <div class="st-visita__cuerpo">
        Llegó de <b>${esc(s.origen || "directo")}</b> · entró por <b>${esc(s.entrada || "index.html")}</b> · vio ${s.vistos || 0} jersey(s)
        ${(s.busquedas || []).length ? `<br>Buscó: ${(s.busquedas || []).map(esc).join(", ")}` : ""}
        <br><button class="btn btn--ghost st-vermas" data-ver="${s.id}">Ver qué hizo paso a paso</button>
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
  const faltantes = Object.entries(r.faltantes).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const preguntas = Object.entries(r.busquedas).sort((a, b) => b[1] - a[1]).slice(0, 12);

  cont.innerHTML = `
    <div class="stat-row st-tarjetas">
      ${tarjeta(r.visitas, "Visitas", `${r.personas} ${r.personas === 1 ? "persona" : "personas"} distintas`)}
      ${tarjeta(tiempo(r.visitas ? r.segundos / r.visitas : 0), "Se quedan en promedio", "solo el tiempo que están activos")}
      ${tarjeta(r.carrito, "Llenaron el carrito", `${pct(r.carrito, r.visitas)}% de las visitas`)}
      ${tarjeta(r.compraron, "Compras", r.visitas ? `${pct(r.compraron, r.visitas)}% de las visitas` : "")}
    </div>

    ${bloque("¿Dónde se te va la gente?",
      "El camino que sigue una persona hasta comprarte. Cada barra es cuántos llegaron a ese paso. Donde la barra se hace chica de golpe, ahí es donde los estás perdiendo.",
      embudo(r), "embudo")}

    ${bloque("Los jerseys que más miran",
      "Cuántas personas distintas lo abrieron, cuánto tiempo lo estuvieron viendo y cuántas lo pusieron en el carrito.",
      tablaProductos(top, r), "vistos")}

    ${bloque("Te están pidiendo esto y no lo tienes",
      "Búsquedas que no encontraron nada. Esto es lo que deberías conseguir para la próxima.",
      chips(faltantes) || vacio("Nadie ha buscado algo que no tengas."), "piden")}

    ${bloque("Lo que le preguntan al asistente",
      "Todo lo que la gente escribe en el chat de la tienda, encuentre o no. Aquí ves con qué palabras te buscan.",
      preguntas.length ? chips(preguntas) : vacio("Todavía nadie le ha escrito al asistente."), "preguntas")}

    ${bloque("Tallas que más buscan",
      "Las tallas que la gente filtra en el catálogo y las que elige dentro de cada jersey.", Object.keys(r.tallas).length ? listaBarras(r.tallas, r.visitas) : vacio("Todavía nadie ha elegido talla."), "tallas")}

    ${bloque("Desde qué aparato entran", "", listaBarras(r.dispositivos, r.visitas), "aparatos")}

    ${bloque("Visita por visita", "Abre cualquiera para ver, paso a paso, qué hizo esa persona.", visitas(list), "detalle")}
  `;
}

/* ---------------- carga ---------------- */
export async function pintarEstadisticas(db) {
  bd = db;
  const cont = $("#estadBody");
  if (!cont) return;
  if (cargando) return;
  cargando = true;
  cont.innerHTML = `<p class="st-cargando">Cargando…</p>`;
  const dias = $("#estadRango")?.value || "30";
  try {
    sesiones = await bajarSesiones(dias);
    pintarLista(sesiones);
    const sello = $("#estadSello");
    if (sello) sello.textContent = `${sesiones.length} visitas · actualizado ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (e) {
    cont.innerHTML = `<p class="st-error">No se pudieron leer las estadísticas: ${esc(e.message)}</p>`;
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
  cont.innerHTML += eventos.length
    ? `<ol class="st-pasos">${sinRepetidos(eventos).map(t => `<li>${t}</li>`).join("")}</ol>`
    : `<p class="st-vacio">Sin detalle guardado.</p>`;
  b.remove();
});
