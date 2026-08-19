import { CATALOGO, PLANOS, porId, EUR_RATE, MONTH_MULTIPLIER } from "./catalogo.js?v=2";
import { WHATSAPP_NUMERO, PAQUETES, NEGOCIO } from "./config.js?v=2";

const estado = {};
PLANOS.forEach(s => { estado[s.id] = { checked: false, qty: s.defaultQty || 1 }; });

const mxn = n => "$" + Math.round(n).toLocaleString("es-MX") + " MXN";
const eur = n => "€" + (n / EUR_RATE).toFixed(2) + " EUR";

const HORAS = [
  { min: 20, label: "20 minutos al mes" },
  { min: 100, label: "1.7 horas al mes" },
  { min: 400, label: "6.7 horas al mes" },
  { min: 800, label: "13.3 horas al mes" },
  { min: 1200, label: "20 horas al mes" },
  { min: 1600, label: "26.7 horas al mes" },
  { min: 2000, label: "33.3 horas al mes" },
  { min: 2400, label: "40 horas al mes" },
  { min: 3000, label: "50 horas al mes" }
];

const PERIODO = { weekly: "por semana", monthly: "por mes", onetime: "pago único" };
const ETIQUETA = { weekly: "SEMANAL", monthly: "MENSUAL", onetime: "PAGO ÚNICO" };

function cantidadTexto(s) {
  const q = estado[s.id].qty;
  if (s.special === "humanHours") {
    const o = HORAS.find(x => x.min === q);
    return o ? o.label : q + " minutos al mes";
  }
  if (s.unit === "20 grupos") return (q * 20) + " grupos";
  return q + " " + s.unit + (q === 1 ? "" : "s");
}

function subtotal(s) { return s.price * estado[s.id].qty; }

function totales() {
  let semanal = 0, mensual = 0, unico = 0;
  const elegidos = [];
  PLANOS.forEach(s => {
    if (!estado[s.id].checked) return;
    const st = subtotal(s);
    if (s.period === "weekly") semanal += st;
    else if (s.period === "monthly") mensual += st;
    else unico += st;
    elegidos.push({ cat: s.cat, nombre: s.name, cantidad: cantidadTexto(s), subtotal: st, periodo: PERIODO[s.period] });
  });
  const semanalMes = semanal * MONTH_MULTIPLIER;
  const totalMes = semanalMes + mensual;
  return { semanal, mensual, unico, semanalMes, totalMes, primerMes: totalMes + unico, elegidos };
}

function mensajeWA() {
  const t = totales();
  let m = `Hola, quiero solicitar una cotización de ${NEGOCIO.nombre}.\n\nSELECCIÓN DE SERVICIOS\n${"━".repeat(20)}\n`;
  let cat = "";
  t.elegidos.forEach(e => {
    if (e.cat !== cat) { cat = e.cat; m += `\n${cat.toUpperCase()}\n`; }
    m += `• ${e.nombre}\n  ${e.cantidad} — ${mxn(e.subtotal)} ${e.periodo}\n`;
  });
  m += `\n${"━".repeat(20)}\nRESUMEN ESTIMADO\n\n`;
  m += `• Servicios semanales: ${mxn(t.semanal)}\n`;
  m += `• Servicios mensuales: ${mxn(t.mensual)}\n`;
  m += `• Equivalente mensual de lo semanal: ${mxn(t.semanalMes)}\n`;
  m += `• Total mensual estimado: ${mxn(t.totalMes)}\n`;
  m += `• Pagos únicos: ${mxn(t.unico)}\n`;
  m += `• TOTAL DEL PRIMER MES: ${mxn(t.primerMes)}\n\n`;
  m += `Me gustaría confirmar disponibilidad, tiempos de entrega y cotización final.`;
  return m;
}

function abrirWA() {
  if (!totales().elegidos.length) { alert("Elige al menos un servicio para cotizar."); return; }
  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensajeWA())}`, "_blank");
}

function precioPaquete(p) {
  let semanal = 0, mensual = 0, unico = 0;
  p.incluye.forEach(({ id, qty }) => {
    const s = porId(id); if (!s) return;
    const st = s.price * qty;
    if (s.period === "weekly") semanal += st;
    else if (s.period === "monthly") mensual += st;
    else unico += st;
  });
  return semanal * MONTH_MULTIPLIER + mensual + unico;
}

function aplicarPaquete(idPaquete) {
  const p = PAQUETES.find(x => x.id === idPaquete);
  if (!p) return;
  PLANOS.forEach(s => { estado[s.id].checked = false; });
  p.incluye.forEach(({ id, qty }) => { if (estado[id]) { estado[id].checked = true; estado[id].qty = qty; } });
  pintar();
  document.getElementById("cotizador").scrollIntoView({ behavior: "smooth" });
}

function seleccionar(lista, reemplazar = true) {
  if (reemplazar) PLANOS.forEach(s => { estado[s.id].checked = false; });
  let aplicados = 0;
  (lista || []).forEach(({ id, qty }) => {
    if (!estado[id]) return;
    estado[id].checked = true;
    const s = porId(id);
    const q = Number(qty) || s.defaultQty || 1;
    estado[id].qty = Math.max(s.min || 1, Math.min(s.max || 999, q));
    aplicados++;
  });
  if (aplicados) pintar();
  return aplicados;
}

function limpiar() {
  PLANOS.forEach(s => { estado[s.id].checked = false; estado[s.id].qty = s.defaultQty || 1; });
  pintar();
}

function pintarPaquetes() {
  const cont = document.getElementById("paquetes-grid");
  if (!cont) return;
  cont.innerHTML = PAQUETES.map(p => {
    const items = p.incluye.map(({ id, qty }) => {
      const s = porId(id); return s ? `<li>${qty} × ${s.name}</li>` : "";
    }).join("");
    return `
      <article class="paq${p.destacado ? " paq--destacado" : ""}">
        ${p.destacado ? '<span class="paq-tag">Más pedido</span>' : ""}
        <h3 class="paq-nombre">${p.nombre}</h3>
        <p class="paq-para">${p.para}</p>
        <div class="paq-precio"><span>desde</span> ${mxn(precioPaquete(p))} <small>al mes</small></div>
        <ul class="paq-lista">${items}</ul>
        <button class="btn btn--full" type="button" data-paquete="${p.id}">Elegir ${p.nombre}</button>
      </article>`;
  }).join("");
  cont.querySelectorAll("[data-paquete]").forEach(b => {
    b.addEventListener("click", () => aplicarPaquete(b.dataset.paquete));
  });
}

function filaServicio(s) {
  const e = estado[s.id];
  const controles = s.special === "humanHours"
    ? `<select class="sv-select" data-sel="${s.id}">${HORAS.map(o => `<option value="${o.min}"${e.qty === o.min ? " selected" : ""}>${o.label} — ${mxn(s.price * o.min)}</option>`).join("")}</select>`
    : (s.min === s.max || s.max === undefined || s.defaultQty === undefined)
      ? ""
      : `<div class="sv-qty">
           <button type="button" data-menos="${s.id}" aria-label="Menos">−</button>
           <span>${cantidadTexto(s)}</span>
           <button type="button" data-mas="${s.id}" aria-label="Más">+</button>
         </div>`;
  return `
    <div class="sv${e.checked ? " sv--on" : ""}" data-sv="${s.id}">
      <label class="sv-head">
        <input type="checkbox" data-check="${s.id}"${e.checked ? " checked" : ""}>
        <span class="sv-nombre">${s.name}</span>
        <span class="sv-badge sv-badge--${s.period}">${ETIQUETA[s.period]}</span>
      </label>
      ${s.detail ? `<p class="sv-detalle">${s.detail}</p>` : ""}
      <div class="sv-pie">
        ${controles}
        <div class="sv-precio">${mxn(s.price)} <small>/ ${s.unit} · ${PERIODO[s.period]}</small></div>
      </div>
    </div>`;
}

function pintar() {
  const app = document.getElementById("cotizadorLista");
  if (!app) return;
  const q = (document.getElementById("buscar")?.value || "").trim().toLowerCase();
  const abiertas = new Set([...app.querySelectorAll(".cat[open]")].map(d => d.dataset.cat));

  app.innerHTML = CATALOGO.map((c, i) => {
    const items = c.items.filter(s => !q || (s.name + " " + (s.detail || "") + " " + c.cat).toLowerCase().includes(q));
    if (!items.length) return "";
    const activos = items.filter(s => estado[s.id].checked).length;
    const abierta = q ? true : (abiertas.size ? abiertas.has(c.cat) : i === 0);
    return `
      <details class="cat" data-cat="${c.cat}"${abierta ? " open" : ""}>
        <summary class="cat-head">
          <span class="cat-nombre">${c.cat}</span>
          <span class="cat-meta">${activos ? `<b>${activos}</b> elegido${activos === 1 ? "" : "s"}` : `${items.length} servicios`}</span>
        </summary>
        <div class="cat-body">${items.map(filaServicio).join("")}</div>
      </details>`;
  }).join("") || `<p class="vacio">No encontramos servicios con “${q}”. Pregúntale a la IA, quizá lo cotizamos aparte.</p>`;

  app.querySelectorAll("[data-check]").forEach(el => el.addEventListener("change", () => {
    estado[el.dataset.check].checked = el.checked; pintar();
  }));
  app.querySelectorAll("[data-mas]").forEach(el => el.addEventListener("click", () => cambiarQty(el.dataset.mas, 1)));
  app.querySelectorAll("[data-menos]").forEach(el => el.addEventListener("click", () => cambiarQty(el.dataset.menos, -1)));
  app.querySelectorAll("[data-sel]").forEach(el => el.addEventListener("change", () => {
    estado[el.dataset.sel].qty = Number(el.value);
    estado[el.dataset.sel].checked = true;
    pintar();
  }));

  pintarTotales();
}

function cambiarQty(id, delta) {
  const s = porId(id);
  const e = estado[id];
  e.qty = Math.max(s.min || 1, Math.min(s.max || 999, e.qty + delta));
  e.checked = true;
  pintar();
}

function pintarTotales() {
  const t = totales();
  const set = (id, v, sub) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `${mxn(v)}<small>${sub || eur(v)}</small>`;
  };
  set("totSemana", t.semanal);
  set("totMes", t.totalMes);
  set("totUnico", t.unico);
  set("totPrimer", t.primerMes);
  const n = document.getElementById("totCuenta");
  if (n) n.textContent = t.elegidos.length ? `${t.elegidos.length} servicio${t.elegidos.length === 1 ? "" : "s"}` : "Nada elegido todavía";
  const barra = document.getElementById("barraTotales");
  if (barra) barra.classList.toggle("activa", t.elegidos.length > 0);
}

export function iniciarCotizador() {
  pintarPaquetes();
  pintar();
  document.getElementById("buscar")?.addEventListener("input", pintar);
  document.getElementById("btnWA")?.addEventListener("click", abrirWA);
  document.getElementById("btnLimpiar")?.addEventListener("click", limpiar);
}

window.TID = { seleccionar, limpiar, totales, mensajeWA, abrirWA, aplicarPaquete, porId, mxn };
