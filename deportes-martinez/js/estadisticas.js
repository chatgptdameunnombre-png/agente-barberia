const $ = s => document.querySelector(s);
const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;

let sesiones = [];

function resumen(list) {
  const r = {
    visitas: list.length,
    personas: new Set(list.map(s => s.clienteUid || s.uid)).size,
    vieron: 0, carrito: 0, checkout: 0, compraron: 0,
    segundos: 0,
    productos: {},
    sinResultado: [],
    tallas: {},
    dispositivos: {},
    origenes: {}
  };
  for (const s of list) {
    const prods = s.productos || {};
    const claves = Object.keys(prods);
    if (claves.length) r.vieron++;
    if (claves.some(k => prods[k].carrito)) r.carrito++;
    if ((s.eventos || []).some(e => e.e === "checkout" || e.e === "comprar_directo")) r.checkout++;
    if (s.compro) r.compraron++;
    r.segundos += Number(s.duracion || 0);
    r.dispositivos[s.dispositivo || "?"] = (r.dispositivos[s.dispositivo || "?"] || 0) + 1;
    r.origenes[s.origen || "?"] = (r.origenes[s.origen || "?"] || 0) + 1;
    for (const [id, d] of Object.entries(prods)) {
      const p = r.productos[id] || { nombre: d.nombre || id, vistas: 0, segundos: 0, carrito: 0, equipo: d.equipo || "" };
      p.vistas += Number(d.vistas || 0);
      p.segundos += Number(d.segundos || 0);
      if (d.carrito) p.carrito++;
      if (d.nombre) p.nombre = d.nombre;
      r.productos[id] = p;
    }
    (s.sinResultado || []).forEach(t => r.sinResultado.push(t));
    (s.eventos || []).forEach(e => {
      if (e.e === "filtro" && e.campo === "talla" && e.valor && e.valor !== "Todas") {
        r.tallas[e.valor] = (r.tallas[e.valor] || 0) + 1;
      }
      if (e.e === "busqueda_sin_resultado" && e.texto) r.sinResultado.push(e.texto);
      if (e.e === "filtro_sin_resultado" && e.filtros) {
        const txt = Object.entries(e.filtros)
          .filter(([k, v]) => v && !["Todas", "Todos", "rel"].includes(v))
          .map(([k, v]) => v).join(" + ");
        if (txt) r.sinResultado.push(txt);
      }
    });
  }
  return r;
}

function tarjeta(num, txt) {
  return `<div class="stat"><div class="n">${num}</div><div class="l">${txt}</div></div>`;
}

function tabla(filas, cols) {
  if (!filas.length) return `<p style="color:var(--muted);font-size:14px">Todavía no hay datos.</p>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr>${cols.map(c => `<th style="text-align:left;padding:8px 6px;border-bottom:1px solid #eee;color:#666;font-weight:600">${c}</th>`).join("")}</tr></thead>
    <tbody>${filas.map(f => `<tr>${f.map(c => `<td style="padding:8px 6px;border-bottom:1px solid #f4f4f4">${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function minutos(seg) {
  seg = Math.round(seg || 0);
  if (seg < 60) return seg + " s";
  return Math.floor(seg / 60) + " min " + (seg % 60) + " s";
}

function conteo(obj, n = 6) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function pintarLista(list) {
  const r = resumen(list);
  const cont = $("#estadBody");
  if (!cont) return;

  const prods = Object.entries(r.productos).map(([id, p]) => ({ id, ...p }));
  const topVistos = prods.slice().sort((a, b) => b.vistas - a.vistas).slice(0, 10);
  const frios = prods.filter(p => p.vistas >= 3 && p.carrito === 0).sort((a, b) => b.vistas - a.vistas).slice(0, 10);
  const faltantes = conteo(r.sinResultado.reduce((a, t) => (a[t] = (a[t] || 0) + 1, a), {}), 10);

  const recientes = list.slice(0, 25).map(s => {
    const prodsS = Object.values(s.productos || {});
    const vistos = prodsS.map(p => p.nombre).filter(Boolean).slice(0, 3).join(", ");
    return [
      (s.inicio || "").replace("T", " ").slice(0, 16),
      s.clienteEmail || "visitante",
      s.dispositivo || "?",
      s.origen || "?",
      minutos(s.duracion),
      vistos || "—",
      s.compro ? "✅ compró" : (prodsS.some(p => p.carrito) ? "🛒 carrito" : "👀 solo miró")
    ];
  });

  cont.innerHTML = `
    <div class="stat-row" style="margin-bottom:18px">
      ${tarjeta(r.visitas, "Visitas")}
      ${tarjeta(r.personas, "Personas distintas")}
      ${tarjeta(minutos(r.visitas ? r.segundos / r.visitas : 0), "Tiempo promedio")}
      ${tarjeta(r.compraron, "Compras")}
    </div>

    <h3 style="font-size:16px;margin:18px 0 8px">Embudo de venta</h3>
    ${tabla([
      ["1. Entraron a la web", r.visitas, "100%"],
      ["2. Vieron un jersey", r.vieron, pct(r.vieron, r.visitas) + "%"],
      ["3. Lo agregaron al carrito", r.carrito, pct(r.carrito, r.visitas) + "%"],
      ["4. Llegaron al pago", r.checkout, pct(r.checkout, r.visitas) + "%"],
      ["5. Compraron", r.compraron, pct(r.compraron, r.visitas) + "%"]
    ], ["Paso", "Personas", "Del total"])}

    <h3 style="font-size:16px;margin:22px 0 8px">Jerseys más vistos</h3>
    ${tabla(topVistos.map(p => [p.nombre, p.vistas, minutos(p.segundos), p.carrito]), ["Jersey", "Vistas", "Tiempo mirándolo", "Veces al carrito"])}

    <h3 style="font-size:16px;margin:22px 0 8px">Los ven pero no los compran</h3>
    <p style="color:#666;font-size:13px;margin-bottom:8px">Se ven mucho y nadie los agrega al carrito: revisa precio, foto o tallas disponibles.</p>
    ${tabla(frios.map(p => [p.nombre, p.vistas, minutos(p.segundos)]), ["Jersey", "Vistas", "Tiempo"])}

    <h3 style="font-size:16px;margin:22px 0 8px">Lo que buscan y no tienes</h3>
    <p style="color:#666;font-size:13px;margin-bottom:8px">Búsquedas y filtros que no dieron resultados. Esto es lo que te están pidiendo.</p>
    ${tabla(faltantes.map(([t, n]) => [t, n]), ["Búsqueda", "Veces"])}

    <h3 style="font-size:16px;margin:22px 0 8px">Tallas más buscadas</h3>
    ${tabla(conteo(r.tallas).map(([t, n]) => [t, n]), ["Talla", "Veces filtrada"])}

    <h3 style="font-size:16px;margin:22px 0 8px">Cómo llegan</h3>
    <div style="display:flex;gap:24px;flex-wrap:wrap">
      <div style="flex:1;min-width:240px">${tabla(conteo(r.origenes).map(([t, n]) => [t, n, pct(n, r.visitas) + "%"]), ["Origen", "Visitas", "%"])}</div>
      <div style="flex:1;min-width:240px">${tabla(conteo(r.dispositivos).map(([t, n]) => [t, n, pct(n, r.visitas) + "%"]), ["Dispositivo", "Visitas", "%"])}</div>
    </div>

    <h3 style="font-size:16px;margin:22px 0 8px">Últimas visitas, una por una</h3>
    ${tabla(recientes, ["Cuándo", "Quién", "Dispositivo", "Llegó de", "Tiempo", "Qué vio", "Resultado"])}
  `;
}

export async function pintarEstadisticas(db) {
  const cont = $("#estadBody");
  if (!cont) return;
  cont.innerHTML = `<p style="color:var(--muted);font-size:14px">Cargando estadísticas…</p>`;
  try {
    sesiones = await db.listarSesiones();
  } catch (e) {
    cont.innerHTML = `<p style="color:#c62828;font-size:14px">No se pudieron leer las estadísticas (${e.message || "error"}).</p>`;
    return;
  }
  const filtro = $("#estadRango")?.value || "30";
  aplicarRango(filtro);
}

export function aplicarRango(dias) {
  if (dias === "todo") return pintarLista(sesiones);
  const limite = Date.now() - Number(dias) * 86400e3;
  pintarLista(sesiones.filter(s => new Date(s.inicio || 0).getTime() >= limite));
}

document.addEventListener("change", e => {
  if (e.target.id === "estadRango") aplicarRango(e.target.value);
});
