import { db } from "./db.js?v=39";
import { pintarEstadisticas } from "./estadisticas.js?v=39";
import "./panel-nav.js?v=39";

const $ = s => document.querySelector(s);
const money = n => "$" + Number(n).toLocaleString("es-MX");

const TAXONOMIA = {
  "futbol": ["Retro", "Actual", "Versión jugador", "Versión fan", "Entrenamiento", "Portero"],
  "basket": ["NBA", "Retro", "Universitario", "Edición especial"],
  "americano": ["NFL", "Retro", "Colegial", "Edición especial"]
};
const KITS = ["Local", "Visita", "Tercera", "Portero", "Especial"];
const MAX_BYTES = 950000;

let productos = [];
let inicializado = false;
let fotosActuales = [];

const OWNER_EMAILS = ["admindeportesmartinez@gmail.com"];
const esDueno = u => !!u && OWNER_EMAILS.includes((u.email || "").toLowerCase());

db.onAuth(user => {
  if (!user) { window.location.replace("admin.html"); return; }
  if (!esDueno(user)) { window.location.replace("index.html"); return; }
  $("#loader").hidden = true;
  $("#dash").hidden = false;
  window.scrollTo(0, 0);
  arrancarDash();
});

$("#logout").onclick = async () => { await db.logout(); window.location.replace("admin.html"); };

async function arrancarDash() {
  if (inicializado) return;
  inicializado = true;
  await db.seedIfEmpty();
  db.onProducts(list => { productos = list; render(); });
  pintarEstadisticas(db);
}

function stockPill(s) {
  if (s <= 0) return `<span class="stock-pill" style="color:var(--danger)">Agotado</span>`;
  if (s <= 3) return `<span class="stock-pill" style="color:var(--warn)">${s} · bajo</span>`;
  return `<span class="stock-pill" style="color:var(--ink)">${s}</span>`;
}

const ORDEN_DEPORTE = { futbol: 0, basket: 1, americano: 2 };

/* primero futbol, luego basketball, luego americano; dentro de cada uno por liga (A-Z) y nombre */
function ordenar(lista) {
  return lista.slice().sort((a, b) => {
    const d = (ORDEN_DEPORTE[a.categoria] ?? 9) - (ORDEN_DEPORTE[b.categoria] ?? 9);
    if (d) return d;
    const l = String(a.liga || "zzz").localeCompare(String(b.liga || "zzz"), "es");
    if (l) return l;
    return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
  });
}

function render() {
  $("#stTotal").textContent = productos.length;
  $("#stStock").textContent = productos.reduce((a, p) => a + Number(p.stock || 0), 0);
  $("#stOut").textContent = productos.filter(p => p.stock <= 0).length;

  const DEPORTE_TXT = { futbol: "Futbol", basket: "Basketball", americano: "Americano" };
  const enOrden = ordenar(productos);

  const porDeporte = new Map();
  for (const p of enOrden) {
    const d = p.categoria || "otros";
    if (!porDeporte.has(d)) porDeporte.set(d, new Map());
    const ligas = porDeporte.get(d);
    const l = p.liga || "Sin liga";
    if (!ligas.has(l)) ligas.set(l, []);
    ligas.get(l).push(p);
  }

  const fila = p => `
    <div class="p-row">
      <img class="p-thumb" src="${p.imagen || ''}" alt="" onerror="this.style.visibility='hidden'">
      <div class="p-name"><b>${p.nombre}${p.retro ? ` <span style="font-size:10px;font-weight:700;color:#b8860b;border:1px solid #b8860b;border-radius:5px;padding:1px 5px;vertical-align:middle;letter-spacing:.05em">RETRO</span>` : ""}${p.personalizable === false ? ` <span style="font-size:10px;font-weight:700;color:#8a8a92;border:1px solid #3a3a42;border-radius:5px;padding:1px 5px;vertical-align:middle;letter-spacing:.05em">SIN NOMBRE</span>` : ""}</b><span>${[p.equipo, p.liga, p.temporada, p.subcategoria].filter(Boolean).join(" · ") || p.marca || ""}</span></div>
      <span class="hide-sm">${p.categoria}</span>
      <span class="hide-sm">${money(p.precio)}</span>
      <span>${stockPill(p.stock)}</span>
      <div class="p-actions">
        <button class="edit-a" data-edit="${p.id}">Editar</button>
        <button class="del-a" data-del="${p.id}">Borrar</button>
      </div>
    </div>`;

  /* todo cerrado al entrar: el catálogo es largo y así se ve de un vistazo */
  const html = [...porDeporte.entries()].map(([dep, ligas]) => {
    const cuantos = [...ligas.values()].reduce((a, l) => a + l.length, 0);
    const dentro = [...ligas.entries()].map(([liga, lista]) => `
      <details class="p-liga">
        <summary class="p-liga__cab">${liga} <span class="p-cuenta">${lista.length}</span></summary>
        ${lista.map(fila).join("")}
      </details>`).join("");
    return `<details class="p-dep">
      <summary class="p-grupo">
        <span class="p-grupo__txt">${DEPORTE_TXT[dep] || dep}</span>
        <span class="p-cuenta">${cuantos}</span>
        <button class="p-todas" data-todas="${dep}" type="button">Abrir todas</button>
      </summary>
      ${dentro}
    </details>`;
  }).join("");

  const barra = html
    ? `<div class="p-barra"><button class="p-todas p-todas--all" data-todo="1" type="button">Abrir todo</button></div>`
    : "";
  $("#pList").innerHTML = (barra + html) || `<div style="padding:40px;text-align:center;color:var(--muted)">Sin jerseys todavía. Agrega el primero.</div>`;
}

/* ============================================================
   Jerseys de jugador: si ya traen nombre y número estampado,
   no se les puede poner otro. El panel lo detecta solo.
   ============================================================ */
const JUGADORES = [
  "messi", "cristiano", "ronaldo", "haaland", "mbappe", "mbappé", "neymar", "benzema", "modric", "modrić",
  "kaka", "kaká", "zidane", "ronaldinho", "beckham", "maradona", "pele", "pelé", "salah", "vinicius",
  "bellingham", "lewandowski", "suarez", "suárez", "iniesta", "xavi", "pique", "piqué", "ramos", "buffon",
  "totti", "del piero", "raul", "raúl", "figo", "henry", "drogba", "gerrard", "lampard", "rooney",
  "chicharito", "hernandez", "hernández", "campos", "marquez", "márquez", "blanco", "borgetti", "ochoa",
  "lozano", "jimenez", "jiménez", "alvarez", "álvarez", "gimenez", "giménez",
  "tatum", "curry", "doncic", "dončić", "lebron", "james", "jordan", "kobe", "bryant", "durant",
  "giannis", "antetokounmpo", "wembanyama", "shai", "gilgeous", "harden", "embiid", "jokic", "jokić",
  "allen", "brady", "mahomes", "watt", "kelce", "burrow", "jefferson", "rodgers", "manning", "montana"
];

function pareceDeJugador(texto) {
  const t = " " + String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + " ";
  if (/#\s*\d{1,2}\b/.test(t)) return "trae número";
  const hit = JUGADORES.find(j => t.includes(" " + j.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  return hit ? "es de " + hit.charAt(0).toUpperCase() + hit.slice(1) : null;
}

function avisoPerso(auto) {
  const aviso = $("#persoAviso");
  if (!aviso) return;
  const motivo = pareceDeJugador($("#pNombre").value);
  if (motivo && !$("#pPerso").checked) {
    aviso.innerHTML = `<b style="color:var(--accent)">Este jersey ${motivo}</b>, así que ya trae nombre y número estampado y no se le puede poner otro. ${auto ? "Le quité la personalización." : ""}`;
  } else if (motivo && $("#pPerso").checked) {
    aviso.innerHTML = `<b style="color:#ff9b9b">Ojo:</b> este jersey ${motivo}. Si ya viene estampado, quita la palomita de arriba.`;
  } else {
    aviso.textContent = "Retro y pieza única salen con etiqueta en el catálogo.";
  }
}

let persoTocado = false;
$("#pPerso")?.addEventListener("change", () => { persoTocado = true; avisoPerso(false); });
$("#pNombre")?.addEventListener("input", () => {
  if (!persoTocado && pareceDeJugador($("#pNombre").value) && $("#pPerso").checked) {
    $("#pPerso").checked = false;
    avisoPerso(true);
    return;
  }
  avisoPerso(false);
});

/* ---------- subcategorías dependientes ---------- */
function poblarSub(categoria, seleccion = "") {
  const sub = $("#pSub");
  const opts = TAXONOMIA[categoria] || [];
  sub.innerHTML = `<option value="">—</option>` + opts.map(o => `<option ${o === seleccion ? "selected" : ""}>${o}</option>`).join("");
}
$("#pCategoria").addEventListener("change", e => poblarSub(e.target.value));

function poblarKits(seleccion = "") {
  const k = $("#pKit");
  if (!k) return;
  k.innerHTML = `<option value="">—</option>` + KITS.map(o => `<option ${o === seleccion ? "selected" : ""}>${o}</option>`).join("");
}
poblarKits();

/* ---------- tallas ---------- */
const TALLAS = ["S", "M", "L", "XL", "2XL", "3XL"];
function aplicarTallaTipo(tipo) {
  const conTallas = tipo === "tallas";
  $("#bloqueTallas").hidden = !conTallas;
  $("#bloqueUniversal").hidden = conTallas;
}
function buildTallasEditor(tallas = []) {
  const map = {};
  (tallas || []).forEach(t => { map[t.talla] = t; });
  $("#tallasEditor").innerHTML = TALLAS.map(t => {
    const on = !!map[t];
    const st = on ? (map[t].stock ?? "") : "";
    const pr = on && Number(map[t].precio) > 0 ? map[t].precio : "";
    return `<div class="talla-row" data-talla="${t}" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <label style="display:flex;gap:6px;align-items:center;min-width:64px;margin:0"><input type="checkbox" class="t-on" ${on ? "checked" : ""}> <b>${t}</b></label>
      <input class="input t-stock" type="number" min="0" placeholder="stock" value="${st}" ${on ? "" : "disabled"} style="flex:1">
      <input class="input t-precio" type="number" min="0" placeholder="precio (opcional)" value="${pr}" ${on ? "" : "disabled"} style="flex:1">
    </div>`;
  }).join("");
}
$("#pTallaTipo").addEventListener("change", e => aplicarTallaTipo(e.target.value));
$("#tallasEditor").addEventListener("change", e => {
  const cb = e.target.closest(".t-on");
  if (!cb) return;
  const row = cb.closest(".talla-row");
  row.querySelector(".t-stock").disabled = !cb.checked;
  row.querySelector(".t-precio").disabled = !cb.checked;
});

/* ---------- fotos: subir + comprimir ---------- */
function comprimirImagen(file, size = 1000, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#101013";
      ctx.fillRect(0, 0, size, size);
      const escala = Math.min(size / img.width, size / img.height);
      const w = img.width * escala, h = img.height * escala;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(c.toDataURL("image/jpeg", calidad));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function renderFotos() {
  $("#pFotos").innerHTML = fotosActuales.map((src, i) => `
    <div class="foto-mini">
      <img src="${src}" alt="">
      ${i === 0 ? '<span class="foto-badge">Principal</span>' : ''}
      <button type="button" class="foto-rm" data-rmfoto="${i}">✕</button>
    </div>`).join("");
}

$("#pFileBtn").onclick = () => $("#pFile").click();
$("#pFile").addEventListener("change", async e => {
  const files = [...e.target.files];
  e.target.value = "";
  for (const f of files) {
    try { fotosActuales.push(await comprimirImagen(f)); }
    catch { toast("No se pudo procesar una imagen"); }
  }
  renderFotos();
});

/* ---------- modal ---------- */
const ov = $("#modalOv");
const abrir = () => ov.classList.add("open");
const cerrar = () => ov.classList.remove("open");

function nuevo() {
  $("#modalTitle").textContent = "Nuevo jersey";
  $("#prodForm").reset();
  $("#pId").value = "";
  fotosActuales = [];
  poblarSub("");
  $("#pTallaTipo").value = "tallas";
  aplicarTallaTipo("tallas");
  buildTallasEditor([]);
  renderFotos();
  abrir();
}
function editar(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  $("#modalTitle").textContent = "Editar jersey";
  $("#pId").value = p.id;
  $("#pNombre").value = p.nombre;
  $("#pMarca").value = p.marca;
  $("#pCategoria").value = TAXONOMIA[p.categoria] ? p.categoria : "";
  poblarSub($("#pCategoria").value, p.subcategoria || "");
  poblarKits(p.kit || "");
  $("#pPrecio").value = p.precio;
  $("#pStock").value = p.stock;
  $("#pEquipo").value = p.equipo || "";
  $("#pLiga").value = p.liga || "";
  $("#pTemporada").value = p.temporada || "";
  $("#pKit").value = p.kit || "";
  $("#pMaterial").value = p.material || "";
  persoTocado = true;   /* al editar uno que ya existe, se respeta lo que el dueño puso */
  $("#pRetro").checked = !!p.retro;
  $("#pUnica").checked = !!p.piezaUnica;
  $("#pPerso").checked = p.personalizable !== false;
  const tipo = p.tallaTipo === "tallas" ? "tallas" : "universal";
  $("#pTallaTipo").value = tipo;
  aplicarTallaTipo(tipo);
  buildTallasEditor(p.tallas || []);
  $("#pDesc").value = p.descripcion || "";
  $("#pSpecs").value = (p.specs || []).join("\n");
  fotosActuales = p.imagenes?.length ? [...p.imagenes] : (p.imagen ? [p.imagen] : []);
  renderFotos();
  abrir();
  db.getFotos(id).then(fotos => {
    if ($("#pId").value !== id) return;
    fotosActuales = fotos;
    renderFotos();
  }).catch(() => {});
}

$("#prodForm").addEventListener("submit", async e => {
  e.preventDefault();
  const imagenes = fotosActuales;
  if (JSON.stringify(imagenes).length > MAX_BYTES) {
    toast("Demasiadas fotos o muy pesadas. Quita alguna.");
    return;
  }
  const id = $("#pId").value;
  const tipo = $("#pTallaTipo").value === "tallas" ? "tallas" : "universal";
  const data = {
    nombre: $("#pNombre").value.trim(),
    marca: $("#pMarca").value.trim(),
    categoria: $("#pCategoria").value,
    subcategoria: $("#pSub").value,
    precio: Number($("#pPrecio").value) || 0,
    descripcion: $("#pDesc").value.trim(),
    specs: $("#pSpecs").value.split("\n").map(s => s.trim()).filter(Boolean),
    imagenes,
    imagen: imagenes[0] || "",
    tallaTipo: tipo,
    equipo: $("#pEquipo").value.trim(),
    liga: $("#pLiga").value.trim(),
    temporada: $("#pTemporada").value.trim(),
    kit: $("#pKit").value,
    material: $("#pMaterial").value.trim(),
    retro: $("#pRetro").checked,
    piezaUnica: $("#pUnica").checked,
    personalizable: $("#pPerso").checked
  };
  if (tipo === "tallas") {
    const tallas = [];
    document.querySelectorAll("#tallasEditor .talla-row").forEach(row => {
      if (row.querySelector(".t-on").checked) {
        tallas.push({
          talla: row.dataset.talla,
          stock: Number(row.querySelector(".t-stock").value) || 0,
          precio: Number(row.querySelector(".t-precio").value) || 0
        });
      }
    });
    if (!tallas.length) { toast("Activa al menos una talla o cámbialo a universal."); return; }
    data.tallas = tallas;
    data.stock = tallas.reduce((a, t) => a + t.stock, 0);
  } else {
    data.tallas = [];
    data.stock = Number($("#pStock").value) || 0;
  }
  try {
    if (id) await db.updateProduct(id, data);
    else await db.addProduct(data);
    cerrar();
    toast(id ? "Producto actualizado" : "Producto agregado");
  } catch (err) { toast("Error: " + (err.message || "no se pudo guardar")); }
});

async function borrar(id) {
  const p = productos.find(x => x.id === id);
  if (!confirm(`¿Borrar "${p?.nombre}"? Esta acción no se puede deshacer.`)) return;
  try { await db.deleteProduct(id); toast("Producto borrado"); }
  catch (err) { toast("Error al borrar"); }
}

/* ---------- eventos ---------- */
$("#addBtn").onclick = nuevo;
document.addEventListener("panel:nuevo", nuevo);
$("#optBtn").onclick = async () => {
  if (!confirm("Optimiza las fotos de todos los productos para que la tienda cargue más rápido y gaste menos. Se corre una sola vez. ¿Continuar?")) return;
  const btn = $("#optBtn");
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = "Optimizando…";
  try {
    const n = await db.optimizarCatalogo(hechos => { btn.textContent = `Optimizando… ${hechos}`; });
    toast(n ? `Listo: ${n} producto${n === 1 ? "" : "s"} optimizado${n === 1 ? "" : "s"}` : "Ya estaba todo optimizado");
  } catch (err) {
    toast("Error al optimizar: " + (err.message || "reintenta"));
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
};
$("#modalClose").onclick = cerrar;
$("#modalCancel").onclick = cerrar;
ov.addEventListener("click", e => { if (e.target === ov) cerrar(); });
/* "Abrir todo": los tres deportes y todas sus ligas, en orden */
document.addEventListener("click", e => {
  const bg = e.target.closest("[data-todo]");
  if (!bg) return;
  e.preventDefault();
  const deportes = [...document.querySelectorAll(".p-dep")];
  const ligas = [...document.querySelectorAll(".p-liga")];
  const abrir = deportes.some(d => !d.open) || ligas.some(l => !l.open);
  bg.textContent = abrir ? "Cerrar todo" : "Abrir todo";
  deportes.forEach(d => { d.open = abrir; });
  document.querySelectorAll(".p-todas[data-todas]").forEach(b => { b.textContent = abrir ? "Cerrar todas" : "Abrir todas"; });
  ligas.forEach((l, i) => setTimeout(() => { l.open = abrir; }, i * 45));
});

/* "Abrir todas" dentro de un deporte: las ligas se van abriendo en orden, de arriba a abajo */
document.addEventListener("click", e => {
  const bt = e.target.closest("[data-todas]");
  if (!bt) return;
  e.preventDefault();
  e.stopPropagation();
  const dep = bt.closest(".p-dep");
  if (!dep) return;
  const ligas = [...dep.querySelectorAll(".p-liga")];
  const abrir = ligas.some(l => !l.open);
  dep.open = true;
  bt.textContent = abrir ? "Cerrar todas" : "Abrir todas";
  ligas.forEach((l, i) => setTimeout(() => { l.open = abrir; }, i * 70));
});

document.addEventListener("click", e => {
  const rm = e.target.closest("[data-rmfoto]");
  if (rm) { fotosActuales.splice(Number(rm.dataset.rmfoto), 1); renderFotos(); return; }
  const t = e.target.closest("[data-edit],[data-del]");
  if (!t) return;
  if (t.dataset.edit) editar(t.dataset.edit);
  else if (t.dataset.del) borrar(t.dataset.del);
});

function toast(html) {
  const t = document.createElement("div");
  t.className = "toast"; t.innerHTML = html;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/* ============================================================
   Cuentas de clientes (con candado de contraseña)
   ============================================================ */
let clientesCargados = null;

document.addEventListener("panel:cuentas", () => {
  if (clientesCargados) { $("#cuentasBody").hidden = false; $("#cuentasCandado").hidden = true; }
});

function filaCliente(c) {
  const campos = [
    ["Nombre", c.nombre], ["Correo", c.email], ["Teléfono", c.telefono],
    ["Calle", c.calle], ["Colonia", c.colonia], ["C.P.", c.cp],
    ["Ciudad", c.ciudad], ["Estado", c.estado], ["Referencias", c.referencias]
  ];
  const llenos = campos.filter(([, v]) => v && String(v).trim());
  const faltan = campos.filter(([, v]) => !v || !String(v).trim()).map(([k]) => k);
  const completo = Math.round((llenos.length / campos.length) * 100);
  return `<details class="st-visita">
    <summary class="st-visita__cab" style="grid-template-columns:1.2fr 1.4fr 130px 120px">
      <span class="st-visita__quien">${c.nombre || "Sin nombre"}</span>
      <span class="st-visita__tiempo" title="${c.email || c.uid}">${c.email || c.uid}</span>
      <span class="st-visita__tiempo">${c.telefono || "sin teléfono"}</span>
      <span class="st-tag st-tag--${completo === 100 ? "compro" : (completo >= 50 ? "carrito" : "paso")}">${completo}% de datos</span>
    </summary>
    <div class="st-visita__cuerpo">
      ${llenos.map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`).join("")}
      ${faltan.length ? `<div style="margin-top:8px;color:var(--muted)">Le falta llenar: ${faltan.join(", ")}</div>` : ""}
      ${c.actualizado ? `<div style="margin-top:6px;color:var(--muted)">Última actualización: ${String(c.actualizado).replace("T", " ").slice(0, 16)}</div>` : ""}
      <div class="cliente-acciones">
        <button class="btn btn--ghost" data-borrar-historial="${c.uid}" data-correo="${c.email || ""}">Borrar su historial de visitas</button>
        <button class="btn btn--danger" data-borrar-cliente="${c.uid}" data-correo="${c.email || ""}">Borrar esta cuenta</button>
      </div>
    </div>
  </details>`;
}

function pintarClientes(lista) {
  const cuerpo = $("#cuentasBody");
  const conDatos = lista.filter(c => c.nombre || c.telefono).length;
  cuerpo.innerHTML = `
    <div class="stat-row st-tarjetas" style="margin-bottom:18px">
      <div class="stat"><div class="n">${lista.length}</div><div class="l">Cuentas creadas</div></div>
      <div class="stat"><div class="n">${conDatos}</div><div class="l">Ya llenaron sus datos</div></div>
      <div class="stat"><div class="n">${lista.length - conDatos}</div><div class="l">Solo se registraron</div></div>
    </div>
    <p class="st-bloque__ayuda">Estos son los datos que cada cliente guardó en su cuenta. Trátalos con cuidado: son datos personales.</p>
    <div class="st-visitas">${lista.length ? lista.map(filaCliente).join("") : `<p class="st-vacio">Todavía nadie ha creado su cuenta.</p>`}</div>`;
  cuerpo.hidden = false;
  $("#cuentasCandado").hidden = true;
}

$("#cuentasVer")?.addEventListener("click", async () => {
  const btn = $("#cuentasVer"), msg = $("#cuentasMsg"), pass = $("#cuentasPass").value;
  if (!pass) { msg.textContent = "Escribe tu contraseña."; return; }
  btn.disabled = true; btn.textContent = "Revisando…"; msg.textContent = "";
  try {
    const usuario = await new Promise(r => { const off = db.onAuth(u => { off?.(); r(u); }); });
    await db.revalidar(usuario.email, pass);
    clientesCargados = await db.listarClientes();
    $("#cuentasPass").value = "";
    pintarClientes(clientesCargados);
  } catch (err) {
    const m = String(err?.code || err?.message || "");
    msg.textContent = m.includes("permission") || m.includes("PERMISSION")
      ? "Falta activar el permiso de lectura en la base de datos (regla de Firestore)."
      : "Contraseña incorrecta.";
  }
  btn.disabled = false; btn.textContent = "Ver los datos";
});


document.addEventListener("click", async e => {
  const h = e.target.closest("[data-borrar-historial]");
  if (h) {
    const uid = h.dataset.borrarHistorial, correo = h.dataset.correo;
    if (!confirm("¿Borrar todo el historial de visitas de esta persona?\n\nSu cuenta y sus datos se quedan; solo se borra lo que hizo en la tienda. Esto no se puede deshacer.")) return;
    h.disabled = true; h.textContent = "Borrando…";
    try {
      const n = await db.borrarHistorialCliente(uid, correo);
      h.disabled = false; h.textContent = "Borrar su historial de visitas";
      toast(n ? `Historial borrado (${n} ${n === 1 ? "visita" : "visitas"})` : "Esta persona no tenía visitas guardadas");
      document.dispatchEvent(new CustomEvent("panel:recargar-estadisticas"));
    } catch (err) {
      h.disabled = false; h.textContent = "Borrar su historial de visitas";
      const m = String(err?.code || err?.message || "");
      toast(m.includes("permission") || m.includes("PERMISSION")
        ? "Falta el permiso de borrado en la base de datos"
        : "No se pudo borrar el historial");
    }
    return;
  }
  const b = e.target.closest("[data-borrar-cliente]");
  if (!b) return;
  const uid = b.dataset.borrarCliente, correo = b.dataset.correo;
  if (!confirm("¿Borrar los datos de esta cuenta? El cliente podrá volver a llenarlos si entra otra vez.\n\nTambién se borrará su historial de visitas.")) return;
  b.disabled = true; b.textContent = "Borrando…";
  try {
    await db.borrarCliente(uid);
    let n = 0;
    try { n = await db.borrarHistorialCliente(uid, correo); } catch { }
    clientesCargados = (clientesCargados || []).filter(c => c.uid !== uid);
    pintarClientes(clientesCargados);
    toast(n ? `Cuenta borrada y ${n} ${n === 1 ? "visita" : "visitas"} de su historial` : "Cuenta borrada");
    document.dispatchEvent(new CustomEvent("panel:recargar-estadisticas"));
  } catch (err) {
    b.disabled = false; b.textContent = "Borrar esta cuenta";
    const m = String(err?.code || err?.message || "");
    toast(m.includes("permission") || m.includes("PERMISSION")
      ? "Falta el permiso de borrado en la base de datos"
      : "No se pudo borrar");
  }
});
