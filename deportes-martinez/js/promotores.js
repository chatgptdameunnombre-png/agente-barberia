import { limpiarSlug } from "./promotor.js?v=105";

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => "$" + Number(n || 0).toLocaleString("es-MX");
const BASE = location.origin + location.pathname.replace(/[^/]*$/, "");
const linkDe = slug => `${BASE}?p=${slug}`;
const copiarBtn = (txt, etiqueta) => `<button type="button" class="btn btn--ghost prm__copiar" data-copiar="${esc(txt)}">${etiqueta}</button>`;

let db = null;

async function cargar() {
  $("#prmTabla").innerHTML = `<p class="st-vacio">Cargando…</p>`;
  try {
    const [proms, ses, ventas] = await Promise.all([db.listarPromotores(), db.sesionesDePromotores(), db.listarVentas()]);
    const porRef = new Map(ventas.filter(v => v.estado !== "cancelada").map(v => [String(v.folio || v.id).replace(/^TR-/, ""), v]));
    const filas = proms.map(p => {
      const suyas = ses.filter(s => s.promotor === p.slug);
      const refs = new Set(suyas.map(s => String(s.refPedido || "").replace(/^TR-/, "")).filter(Boolean));
      const vendidas = [...refs].map(r => porRef.get(r)).filter(Boolean);
      return {
        ...p,
        visitas: suyas.length,
        personas: new Set(suyas.map(s => s.uid || s.id)).size,
        compras: vendidas.length,
        vendido: vendidas.reduce((a, v) => a + Number(v.total || 0), 0)
      };
    }).sort((a, b) => b.vendido - a.vendido || b.visitas - a.visitas);
    if (!filas.length) { $("#prmTabla").innerHTML = `<p class="st-vacio">Todavía no hay promotores. Crea el primero arriba.</p>`; return; }
    $("#prmTabla").innerHTML = filas.map(f => `
      <article class="prm__card${f.activo === false ? " prm__card--off" : ""}">
        <div class="prm__quien">
          <b>${esc(f.nombre)}</b>
          <span>Código <b class="prm__cod">${esc(f.codigo || f.slug.toUpperCase())}</b>${f.activo === false ? " · pausado" : ""}</span>
        </div>
        <div class="prm__nums">
          <div><b>${f.visitas}</b><span>visitas</span></div>
          <div><b>${f.personas}</b><span>personas</span></div>
          <div><b>${f.compras}</b><span>compras</span></div>
          <div><b>${money(f.vendido)}</b><span>vendido</span></div>
        </div>
        <div class="prm__acc">
          ${copiarBtn(linkDe(f.slug), "Copiar link")}
          <button type="button" class="btn btn--ghost" data-activo="${esc(f.slug)}" data-on="${f.activo === false ? "1" : "0"}">${f.activo === false ? "Reactivar" : "Pausar"}</button>
        </div>
      </article>`).join("");
  } catch (e) {
    $("#prmTabla").innerHTML = `<p class="st-vacio">No se pudo cargar (${esc(e?.code || e?.message || e)}). Revisa que estén publicadas las reglas nuevas.</p>`;
  }
}

async function crear(e) {
  e.preventDefault();
  const nombre = $("#prmNombre").value.trim();
  const slug = limpiarSlug($("#prmCodigo").value);
  const err = $("#prmErr");
  err.textContent = "";
  if (!nombre) return;
  if (slug.length < 3) { err.textContent = "El código necesita al menos 3 letras o números."; return; }
  const codigo = slug.toUpperCase();
  $("#prmCrear").disabled = true;
  try {
    const existentes = await db.listarPromotores();
    if (existentes.some(p => p.slug === slug)) { err.textContent = `El código ${codigo} ya lo tiene otro promotor.`; return; }
    await db.guardarPromotorDoc(slug, { nombre, codigo, activo: true, creado: new Date().toISOString() });
    const link = linkDe(slug);
    $("#prmNuevo").innerHTML = `<div class="prm__listo">
      <p>Listo. Mándale esto a <b>${esc(nombre)}</b>:</p>
      <div><span>Link</span><b>${esc(link)}</b>${copiarBtn(link, "Copiar")}</div>
      <div><span>Código</span><b>${esc(codigo)}</b>${copiarBtn(codigo, "Copiar")}</div>
    </div>`;
    $("#prmNombre").value = "";
    $("#prmCodigo").value = "";
    cargar();
  } catch (x) {
    err.textContent = "No se pudo crear: " + (x?.code || x?.message || x);
  } finally {
    $("#prmCrear").disabled = false;
  }
}

export function iniciarPromotores(base) {
  db = base;
  $("#prmForm")?.addEventListener("submit", crear);
  $("#prmCodigo")?.addEventListener("input", e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
  document.addEventListener("panel:seccion", e => { if (e.detail?.sec === "promotores") cargar(); });
  document.addEventListener("click", async e => {
    const c = e.target.closest("[data-copiar]");
    if (c) {
      try { await navigator.clipboard.writeText(c.dataset.copiar); c.textContent = "Copiado ✓"; } catch { }
      return;
    }
    const a = e.target.closest("[data-activo]");
    if (a) { await db.guardarPromotorDoc(a.dataset.activo, { activo: a.dataset.on === "1" }); cargar(); return; }
    if (e.target.closest("#prmRecargar")) cargar();
  });
  if (!$("#secPromotores")?.hidden) cargar();
}
