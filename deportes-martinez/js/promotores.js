import { db } from "./db.js?v=104";
import { KIKI_EMAIL } from "./config.js?v=104";
import { limpiarSlug, codigoDe } from "./promotor.js?v=104";

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => "$" + Number(n || 0).toLocaleString("es-MX");
const BASE = location.origin + location.pathname.replace(/promotores\.html$/, "");
const linkDe = slug => `${BASE}?p=${slug}`;

db.onAuth(user => {
  if (!user) { location.replace("admin.html"); return; }
  if ((user.email || "").toLowerCase() !== KIKI_EMAIL) { location.replace("panel.html"); return; }
  $("#loader").hidden = true;
  $("#dash").hidden = false;
  cargar();
});

function copiarBtn(txt, etiqueta) {
  return `<button type="button" class="btn btn--ghost prm__copiar" data-copiar="${esc(txt)}">${etiqueta}</button>`;
}

async function cargar() {
  $("#prmTabla").textContent = "Cargando…";
  try {
    const [proms, ses, ventas] = await Promise.all([db.listarPromotores(), db.sesionesDePromotores(), db.listarVentas()]);
    const porRef = new Map(ventas.filter(v => v.estado !== "cancelada").map(v => [String(v.folio || v.id).replace(/^TR-/, ""), v]));
    const filas = proms.map(p => {
      const suyas = ses.filter(s => s.promotor === p.slug);
      const personas = new Set(suyas.map(s => s.uid || s.id)).size;
      const refs = new Set(suyas.map(s => String(s.refPedido || "").replace(/^TR-/, "")).filter(Boolean));
      const vendidas = [...refs].map(r => porRef.get(r)).filter(Boolean);
      const compras = new Set([...suyas.filter(s => s.compro || s.compraPorConfirmar).map(s => s.refPedido || s.id), ...vendidas.map(v => v.folio || v.id)]).size;
      return { ...p, visitas: suyas.length, personas, compras, vendido: vendidas.reduce((a, v) => a + Number(v.total || 0), 0) };
    }).sort((a, b) => b.vendido - a.vendido || b.visitas - a.visitas);
    if (!filas.length) { $("#prmTabla").innerHTML = `<p class="prm__p">Todavía no hay promotores.</p>`; return; }
    $("#prmTabla").innerHTML = `<div class="prm__tabla">
      <div class="prm__fila prm__fila--cab"><span>Promotor</span><span>Visitas</span><span>Personas</span><span>Compras</span><span>Vendido</span><span></span></div>
      ${filas.map(f => `<div class="prm__fila${f.activo === false ? " prm__fila--off" : ""}">
        <span><b>${esc(f.nombre)}</b><small>${esc(f.codigo || codigoDe(f.slug))}</small></span>
        <span data-k="Visitas">${f.visitas}</span>
        <span data-k="Personas">${f.personas}</span>
        <span data-k="Compras">${f.compras}</span>
        <span data-k="Vendido"><b>${money(f.vendido)}</b></span>
        <span class="prm__acc">${copiarBtn(linkDe(f.slug), "Copiar link")}
          <button type="button" class="btn btn--ghost" data-activo="${esc(f.slug)}" data-on="${f.activo === false ? "1" : "0"}">${f.activo === false ? "Activar" : "Pausar"}</button></span>
      </div>`).join("")}
    </div>`;
  } catch (e) {
    $("#prmTabla").textContent = "No se pudo cargar: " + (e?.code || e?.message || e);
  }
}

$("#prmForm").addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = $("#prmNombre").value.trim();
  const slug = limpiarSlug(nombre.split(/\s+/)[0]) || limpiarSlug(nombre);
  if (slug.length < 2) return;
  const existentes = await db.listarPromotores().catch(() => []);
  let final = slug, n = 2;
  while (existentes.some(p => p.slug === final)) final = slug + n++;
  const codigo = codigoDe(final);
  $("#prmCrear").disabled = true;
  try {
    await db.guardarPromotorDoc(final, { nombre, codigo, activo: true, creado: new Date().toISOString() });
    const link = linkDe(final);
    $("#prmNuevo").innerHTML = `<div class="prm__listo">
      <div><span>Link</span><b>${esc(link)}</b>${copiarBtn(link, "Copiar")}</div>
      <div><span>Código</span><b>${esc(codigo)}</b>${copiarBtn(codigo, "Copiar")}</div>
    </div>`;
    $("#prmNombre").value = "";
    cargar();
  } catch (err) {
    $("#prmNuevo").textContent = "No se pudo crear: " + (err?.code || err?.message || err);
  }
  $("#prmCrear").disabled = false;
});

document.addEventListener("click", async e => {
  const c = e.target.closest("[data-copiar]");
  if (c) {
    try { await navigator.clipboard.writeText(c.dataset.copiar); c.textContent = "Copiado ✓"; } catch { }
    return;
  }
  const a = e.target.closest("[data-activo]");
  if (a) {
    await db.guardarPromotorDoc(a.dataset.activo, { activo: a.dataset.on === "1" });
    cargar();
    return;
  }
  if (e.target.closest("#prmRecargar")) cargar();
});
