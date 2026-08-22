import { db } from "./db.js?v=3";
import { pintarEstadisticas } from "./estadisticas.js?v=7";
import { mostrarSeccion } from "./panel-nav.js?v=1";

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
  mostrarSeccion("productos");
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
  let deporteActual = null;
  $("#pList").innerHTML = enOrden.map(p => {
    let encabezado = "";
    if (p.categoria !== deporteActual) {
      deporteActual = p.categoria;
      encabezado = `<div class="p-grupo">${DEPORTE_TXT[p.categoria] || p.categoria || "Sin deporte"}</div>`;
    }
    return encabezado + `
    <div class="p-row">
      <img class="p-thumb" src="${p.imagen || ''}" alt="" onerror="this.style.visibility='hidden'">
      <div class="p-name"><b>${p.nombre}${p.retro ? ` <span style="font-size:10px;font-weight:700;color:#b8860b;border:1px solid #b8860b;border-radius:5px;padding:1px 5px;vertical-align:middle;letter-spacing:.05em">RETRO</span>` : ""}</b><span>${[p.equipo, p.liga, p.temporada, p.subcategoria].filter(Boolean).join(" · ") || p.marca || ""}</span></div>
      <span class="hide-sm">${p.categoria}</span>
      <span class="hide-sm">${money(p.precio)}</span>
      <span>${stockPill(p.stock)}</span>
      <div class="p-actions">
        <button class="edit-a" data-edit="${p.id}">Editar</button>
        <button class="del-a" data-del="${p.id}">Borrar</button>
      </div>
    </div>`;
  }).join("") || `<div style="padding:40px;text-align:center;color:var(--muted)">Sin jerseys todavía. Agrega el primero.</div>`;
}

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
    <summary class="st-visita__cab" style="grid-template-columns:1.4fr 1fr 140px 120px">
      <span class="st-visita__quien">${c.nombre || "Sin nombre"}</span>
      <span class="st-visita__tiempo">${c.email || c.uid}</span>
      <span class="st-visita__tiempo">${c.telefono || "sin teléfono"}</span>
      <span class="st-tag st-tag--${completo === 100 ? "compro" : (completo >= 50 ? "carrito" : "paso")}">${completo}% de datos</span>
    </summary>
    <div class="st-visita__cuerpo">
      ${llenos.map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`).join("")}
      ${faltan.length ? `<div style="margin-top:8px;color:var(--muted)">Le falta llenar: ${faltan.join(", ")}</div>` : ""}
      ${c.actualizado ? `<div style="margin-top:6px;color:var(--muted)">Última actualización: ${String(c.actualizado).replace("T", " ").slice(0, 16)}</div>` : ""}
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
