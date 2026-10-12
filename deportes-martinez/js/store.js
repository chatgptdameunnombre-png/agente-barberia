import { db, MODO } from "./db.js?v=83";
import { setProductos, initCart, enCarrito } from "./cart.js?v=83";
import { tieneTallas, stockTotal, precioDesde, preciosVarian, etiquetaStock, tallasDisponibles } from "./tallas.js?v=83";
import { onMayoreo, precioHTML } from "./mayoreo.js?v=83";
import { track } from "./track.js?v=83";
import { tarjetaSugerenciaHTML, conectarFormulario } from "./sugerencias.js?v=83";

const $ = s => document.querySelector(s);
const CAT = document.querySelector("#catalogo")?.dataset.categoria || null;
const base = () => productos.filter(p => p.categoria === CAT);

let productos = [];
let io;
let panelListo = false;
const qs = new URLSearchParams(location.search);
let f = {
  sub: qs.get("version") || "Todas",
  liga: qs.get("liga") || "Todas",
  equipo: qs.get("equipo") || "Todos",
  temporada: "Todas",
  marca: qs.get("marca") || "Todas",
  talla: "Todas",
  orden: "rel"
};
let q = qs.get("q") || "";
let qTimer;

const norm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ").trim();
const VACIAS = new Set(["playera", "playeras", "jersey", "jerseys", "camiseta", "camisetas", "camisa", "uniforme",
  "quiero", "busco", "buscar", "tienes", "tienen", "tiene", "hay", "venden", "de", "del", "la", "el", "los", "las",
  "un", "una", "unos", "y", "con", "para", "en", "por", "que", "me", "mi", "talla", "tallas", "version", "equipo"]);
const TALLA = { s: "S", ch: "S", chica: "S", m: "M", med: "M", mediana: "M", l: "L", g: "L", grande: "L",
  xl: "XL", xxl: "2XL", "2xl": "2XL", xxxl: "3XL", "3xl": "3XL" };
const SINON = {
  barca: ["barcelona"], fcb: ["barcelona"], madrid: ["madrid"], merengue: ["madrid"], rm: ["madrid"],
  chivas: ["chivas", "guadalajara"], rebano: ["chivas"], guadalajara: ["chivas"], aguilas: ["america"],
  rayados: ["monterrey"], monterrey: ["monterrey"], unam: ["pumas"], maquina: ["cruz"], cementeros: ["cruz"],
  bvb: ["dortmund"], borussia: ["dortmund"], dortmund: ["dortmund"], united: ["manchester"], manu: ["manchester"],
  spurs: ["tottenham"], wolves: ["wolverhampton"], juve: ["juventus"], rossoneri: ["milan"],
  holanda: ["holanda", "paises"], netherlands: ["paises"], germany: ["alemania"], england: ["inglaterra"],
  spain: ["espana"], tri: ["mexico"], mx: ["mexico"], seleccion: ["seleccion"], miami: ["miami"],
  spiderman: ["spider"], arana: ["spider"], aranas: ["spider"], ml: ["larga"], largas: ["larga"],
  visitante: ["visita"], away: ["visita"], home: ["local"], casa: ["local"], third: ["tercera"], "3ra": ["tercera"],
  tercer: ["tercera"], vintage: ["retro"], clasica: ["retro"], clasico: ["retro"], antigua: ["retro"],
  bca: ["blanca", "blanco"], blanca: ["blanca", "blanco"], blanco: ["blanca", "blanco"], negra: ["negra", "negro"],
  negro: ["negra", "negro"], roja: ["roja", "rojo", "rojas"], rojo: ["roja", "rojo"], verde: ["verde"],
  rosa: ["rosa"], rojiblanca: ["chivas", "rojiblanca"], rojiblancas: ["chivas"], azul: ["azul"], amarilla: ["amarilla", "amarillo"], dorada: ["dorada", "dorado", "oro"],
  nino: ["nino"], ninos: ["nino"], infantil: ["nino"], kids: ["nino"], dama: ["mujer"], mujeres: ["mujer"],
  cr7: ["cristiano", "ronaldo"], portero: ["portero"], arquero: ["portero"], basquet: ["basket"], basketball: ["basket"]
};

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function palabraCoincide(t, w, conErrores = true) {
  if (/^\d+$/.test(t)) return w === t || (t.length === 2 && /^\d{4}$/.test(w) && w.endsWith(t));
  if (w.startsWith(t)) return true;
  if (!conErrores || t.length < 4) return false;
  const tope = t.length >= 7 ? 2 : 1;
  return lev(t, w.slice(0, t.length)) <= tope || lev(t, w) <= tope;
}

function analizarBusqueda(texto) {
  const tallas = [];
  const terminos = [];
  let corta = false;
  for (const t of norm(texto).split(" ").filter(Boolean)) {
    if (TALLA[t]) { tallas.push(TALLA[t]); continue; }
    if (VACIAS.has(t) || t === "manga") continue;
    if (t === "corta" || t === "cortas") { corta = true; continue; }
    terminos.push([t, ...(SINON[t] || [])]);
  }
  return { tallas, terminos, corta };
}

function textoDe(p) {
  const fuerte = norm([p.nombre, p.equipo, p.temporada, p.kit, p.subcategoria, p.retro ? "retro" : "",
    p.genero === "Niño" ? "nino" : p.genero === "Mujer" ? "mujer" : ""].join(" "));
  const debil = norm([p.liga, p.marca, p.material, p.descripcion, p.categoria === "basket" ? "basket" : ""].join(" "));
  return { fuerte: fuerte.split(" "), debil: debil.split(" ") };
}

function puntaje(p, b) {
  if (b.corta && /manga larga/i.test(p.nombre || "")) return 0;
  if (b.tallas.length && !b.tallas.some(t => tallasDisponibles(p).includes(t))) return 0;
  const { fuerte, debil } = textoDe(p);
  let total = 1;
  for (const opciones of b.terminos) {
    let mejor = 0;
    for (const o of opciones) {
      const exacta = fuerte.includes(o);
      if (exacta) { mejor = Math.max(mejor, 4); break; }
      if (fuerte.some(w => palabraCoincide(o, w))) mejor = Math.max(mejor, 3);
      else if (debil.some(w => palabraCoincide(o, w, false))) mejor = Math.max(mejor, 1);
    }
    if (!mejor) return 0;
    total += mejor;
    if (mejor === 1) total -= 100;
  }
  return total;
}

const badge = document.createElement("div");
badge.className = "mode-badge mode-badge--" + (MODO === "nube" ? "nube" : "demo");
badge.textContent = MODO === "nube" ? "● En la nube (Firebase)" : "● Modo demo (local)";
document.body.appendChild(badge);

if (MODO === "demo") await db.seedIfEmpty();
db.onProducts(list => { productos = list; setProductos(list); render(); });
onMayoreo(() => render());

function cardHTML(p) {
  const total = stockTotal(p);
  const st = etiquetaStock(total);
  const sinStock = total <= 0;
  const sized = tieneTallas(p);
  const precioTxt = (preciosVarian(p) ? "desde " : "") + precioHTML(precioDesde(p));
  const boton = sinStock
    ? `<button class="add-btn" disabled>Agotado</button>`
    : sized
      ? `<a class="add-btn" href="producto.html?id=${encodeURIComponent(p.id)}" style="display:block;text-align:center;text-decoration:none">Elegir talla</a>`
      : (enCarrito(p.id) >= total
          ? `<button class="add-btn" disabled>Máximo en carrito</button>`
          : `<button class="add-btn" data-add="${p.id}">Agregar al carrito</button>`);
  const media = p.imagen
    ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none';this.parentElement.querySelector('.card__ph').style.display='block'">
       <span class="card__ph" style="display:none">📷 Sin foto aún</span>`
    : `<span class="card__ph">📷 Foto pendiente</span>`;
  const flags = [
    p.retro ? `<span class="card__flag card__flag--pre">Retro</span>` : "",
    p.piezaUnica ? `<span class="card__flag card__flag--semi">Pieza única</span>` : ""
  ].join("");
  const tallas = tallasDisponibles(p);
  const tallasTxt = tallas.length ? `<div class="card__tallas">${tallas.map(t => `<span>${t}</span>`).join("")}</div>` : "";
  const meta = [p.equipo, p.temporada].filter(Boolean).join(" · ");
  return `
    <article class="card reveal" data-id="${p.id}">
      <div class="card__media">
        <span class="card__cat">${p.subcategoria || ""}</span>
        ${flags}
        ${media}
      </div>
      <div class="card__body">
        <span class="card__brand">${meta || p.marca || ""}</span>
        <h3 class="card__name">${p.nombre}</h3>
        <p class="card__desc">${p.descripcion || ""}</p>
        ${tallasTxt}
        <div class="card__foot">
          <div class="price">${precioTxt} <span>MXN</span></div>
          <span class="stock stock--${st.cls}">${st.txt}</span>
        </div>
        ${boton}
      </div>
    </article>`;
}

function grupo(lbl, key, valores, abierto) {
  if (valores.length <= 2) return "";
  const opts = valores.map(v =>
    `<span class="opt" data-f="${key}" data-v="${v}">${v}</span>`).join("");
  return `<div class="acc${abierto ? " open" : ""}" data-grp="${key}">
      <button class="acc__h" type="button"><span>${lbl}</span><span class="arr">▾</span></button>
      <div class="acc__b">${opts}</div></div>`;
}

function buildPanel() {
  const cont = $("#filtros");
  if (!cont) return;
  const d = base();
  const uniq = (k, todo) => [todo, ...[...new Set(d.map(p => p[k]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)))];
  const tallas = ["Todas", ...[...new Set(d.flatMap(p => tallasDisponibles(p)))]
    .sort((a, b) => ["S", "M", "L", "XL", "2XL", "3XL"].indexOf(a) - ["S", "M", "L", "XL", "2XL", "3XL"].indexOf(b))];
  cont.innerHTML = `
    <div class="filtros-fila">
      <button class="filtros-btn" type="button" id="filtrosBtn">
        <span class="fico">≡</span> Filtros <span class="fcount" id="fcount"></span>
      </button>
      <label class="buscador" id="buscar">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4.2-4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="buscarInput" type="search" enterkeyhint="search" autocomplete="off" placeholder="Busca tu jersey: equipo, año, retro…" aria-label="Buscar jersey">
        <button type="button" class="buscador__x" id="buscarX" aria-label="Borrar búsqueda" hidden>✕</button>
      </label>
    </div>
    <div class="filtros-panel" id="filtrosPanel" hidden>
      ${grupo("Versión", "sub", uniq("subcategoria", "Todas"), true)}
      ${grupo("Liga", "liga", uniq("liga", "Todas"), false)}
      ${grupo("Equipo", "equipo", uniq("equipo", "Todos"), false)}
      ${grupo("Temporada", "temporada", uniq("temporada", "Todas"), false)}
      ${grupo("Marca", "marca", uniq("marca", "Todas"), false)}
      ${grupo("Talla", "talla", tallas, false)}
      <div class="acc" data-grp="orden">
        <button class="acc__h" type="button"><span>Orden</span><span class="arr">▾</span></button>
        <div class="acc__b">
          <span class="opt" data-f="orden" data-v="rel">Relevancia</span>
          <span class="opt" data-f="orden" data-v="precio-asc">Precio: menor a mayor</span>
          <span class="opt" data-f="orden" data-v="precio-desc">Precio: mayor a menor</span>
          <span class="opt" data-f="orden" data-v="nombre">Nombre A–Z</span>
        </div>
      </div>
    </div>
    <p class="buscar-res" id="buscarRes" aria-live="polite"></p>`;
  panelListo = true;
  const inp = $("#buscarInput");
  inp.value = q;
  $("#buscarX").hidden = !q;
  inp.addEventListener("input", () => {
    q = inp.value;
    $("#buscarX").hidden = !q;
    const u = new URL(location.href);
    q.trim() ? u.searchParams.set("q", q.trim()) : u.searchParams.delete("q");
    history.replaceState(null, "", u);
    render();
    clearTimeout(qTimer);
    qTimer = setTimeout(anotarBusqueda, 1500);
  });
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { inp.blur(); clearTimeout(qTimer); anotarBusqueda(); } });
  $("#buscarX").addEventListener("click", () => { inp.value = ""; inp.dispatchEvent(new Event("input")); inp.focus(); });
  if (location.hash === "#buscar") setTimeout(() => inp.focus(), 50);
  marcarSel();
}

let ultimaAnotada = "";
let ultimosResultados = 0;
function anotarBusqueda() {
  const t = q.trim();
  if (t.length < 3 || t === ultimaAnotada) return;
  ultimaAnotada = t;
  track("busqueda", { texto: t, categoria: CAT, resultados: ultimosResultados });
  if (!ultimosResultados) track("busqueda_sin_resultado", { texto: t, categoria: CAT });
}

function activos() {
  return (f.sub !== "Todas") + (f.liga !== "Todas") + (f.equipo !== "Todos") +
         (f.temporada !== "Todas") + (f.marca !== "Todas") + (f.talla !== "Todas") + (f.orden !== "rel");
}

function marcarSel() {
  document.querySelectorAll("#filtrosPanel .opt").forEach(o => {
    o.classList.toggle("sel", f[o.dataset.f] === o.dataset.v);
  });
  const n = activos();
  const c = $("#fcount"); if (c) { c.textContent = n ? n : ""; c.style.display = n ? "" : "none"; }
}

function render() {
  const gridEl = $("#grid");
  if (!CAT || !gridEl) return;
  if (!panelListo && productos.length) buildPanel();

  let lista = base().filter(p =>
    (f.sub === "Todas" || p.subcategoria === f.sub) &&
    (f.liga === "Todas" || p.liga === f.liga) &&
    (f.equipo === "Todos" || p.equipo === f.equipo) &&
    (f.temporada === "Todas" || p.temporada === f.temporada) &&
    (f.marca === "Todas" || p.marca === f.marca) &&
    (f.talla === "Todas" || tallasDisponibles(p).includes(f.talla)));

  const b = analizarBusqueda(q);
  const buscando = b.terminos.length || b.tallas.length || b.corta;
  let lista2 = lista;
  if (buscando) {
    const pts = new Map(lista.map(p => [p, puntaje(p, b)]));
    const fuertes = lista.filter(p => pts.get(p) > 0);
    lista2 = fuertes.length ? fuertes : lista.filter(p => pts.get(p) !== 0);
    if (f.orden === "rel") lista2.sort((x, y) => pts.get(y) - pts.get(x) || stockTotal(y) - stockTotal(x));
  }
  lista = lista2;
  ultimosResultados = lista.length;

  if (f.orden === "precio-asc") lista.sort((a, b) => precioDesde(a) - precioDesde(b));
  else if (f.orden === "precio-desc") lista.sort((a, b) => precioDesde(b) - precioDesde(a));
  else if (f.orden === "nombre") lista.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  if (!productos.length) { gridEl.innerHTML = `<p style="color:var(--muted)">Cargando…</p>`; return; }
  const res = $("#buscarRes");
  if (res) res.textContent = buscando && lista.length ? `${lista.length} ${lista.length === 1 ? "jersey" : "jerseys"} para «${q.trim()}»` : "";
  if (lista.length) gridEl.innerHTML = lista.map(cardHTML).join("");
  else if (buscando) {
    gridEl.innerHTML = `<div class="buscar-vacio">
        <p class="buscar-vacio__t">No tenemos «${esc(q.trim())}» por ahora.</p>
        <p class="buscar-vacio__s">${activos() ? "Prueba quitar algún filtro, o escribe" : "Prueba con"} el nombre del equipo, el año o «retro».</p>
        ${tarjetaSugerenciaHTML(CAT)}
      </div>`;
    const form = gridEl.querySelector("form.sug");
    const campo = form?.querySelector("[name=texto]");
    if (campo) campo.value = q.trim().slice(0, 200);
    conectarFormulario(form);
  } else gridEl.innerHTML = `<p style="color:var(--muted)">Nada con esos filtros. Prueba quitar alguno.</p>`;
  if (!lista.length && activos()) track("filtro_sin_resultado", { categoria: CAT, filtros: { ...f } });
  marcarSel();
  observarReveal();
}

function esc(t) {
  return String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function observarReveal() {
  io?.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
}

document.addEventListener("click", e => {
  const lupa = e.target.closest(".hdr-buscar");
  if (lupa && $("#buscarInput")) {
    e.preventDefault();
    $("#buscarInput").scrollIntoView({ behavior: "smooth", block: "center" });
    $("#buscarInput").focus();
    return;
  }
  if (e.target.closest(".buscar-vacio")) return;
  if (e.target.closest("#filtrosBtn")) {
    const panel = $("#filtrosPanel");
    const seAbre = panel?.hasAttribute("hidden");
    if (seAbre) track("filtros_abrir", { categoria: CAT });
    panel?.toggleAttribute("hidden");
    return;
  }
  const h = e.target.closest(".acc__h");
  if (h) { h.parentElement.classList.toggle("open"); return; }
  const opt = e.target.closest("#filtrosPanel .opt");
  if (opt) {
    f[opt.dataset.f] = opt.dataset.v;
    const NOMBRE_F = { sub: "versión", liga: "liga", equipo: "equipo", temporada: "temporada", marca: "marca", talla: "talla", orden: "orden" };
    track("filtro", { categoria: CAT, campo: opt.dataset.f, campoTxt: NOMBRE_F[opt.dataset.f] || opt.dataset.f, valor: opt.dataset.v });
    render();
    return;
  }
  if (!e.target.closest("#filtros")) $("#filtrosPanel")?.setAttribute("hidden", "");
  if (e.target.closest("[data-add],[data-inc],[data-dec],[data-rm]")) return;
  const card = e.target.closest("[data-id]");
  if (card) window.location.href = `producto.html?id=${encodeURIComponent(card.dataset.id)}`;
});

window.addEventListener("hashchange", () => {
  if (location.hash === "#buscar" && $("#buscarInput")) { $("#buscarInput").scrollIntoView({ block: "center" }); $("#buscarInput").focus(); }
});

initCart();
observarReveal();
document.addEventListener("cart:add", render);
