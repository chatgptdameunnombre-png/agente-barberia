import { db } from "./db.js?v=47";

const OWNER_EMAILS = ["admindeportesmartinez@gmail.com"];
const esDueno = u => !!u && OWNER_EMAILS.includes((u.email || "").toLowerCase());

const $ = s => document.querySelector(s);
let user = null;

function set(id, v) { const e = $("#" + id); if (e && v != null) e.value = v; }
function val(id) { return ($("#" + id).value || "").trim(); }

function render() {
  $("#cuentaOut").style.display = user ? "none" : "";
  $("#cuentaIn").style.display = user ? "" : "none";
  if (user) $("#cuentaEmail").textContent = user.email;
  const panelBtn = $("#cuentaPanel");
  if (panelBtn) panelBtn.style.display = esDueno(user) ? "" : "none";
}

async function loadPerfil(uid) {
  try {
    const p = await db.getPerfil(uid);
    if (!p) return;
    set("fNombre", p.nombre); set("fTel", p.telefono); set("fCalle", p.calle);
    set("fCol", p.colonia); set("fCP", p.cp); set("fCiudad", p.ciudad);
    set("fEstado", p.estado); set("fRef", p.referencias);
  } catch (_) {}
}

function asentar(u) {
  if (user && u && user.uid === u.uid) return;
  user = u;
  render();
  if (u) { loadPerfil(u.uid); pintarCompras(u.uid); }
}

/* ---------- mis pedidos ---------- */
const ESTADO_TXT = {
  por_cobrar: { t: "Falta que pagues", c: "#f7d154" },
  pagada: { t: "Pagado", c: "#8fe0a8" },
  cancelada: { t: "Cancelado", c: "#ff9b9b" }
};

function cuando(iso) {
  const d = new Date(iso || 0);
  if (!d.getTime()) return "";
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

const dinero = n => "$" + Number(n || 0).toLocaleString("es-MX");

async function pintarCompras(uid) {
  const cont = document.getElementById("misCompras");
  if (!cont) return;
  try {
    const compras = (await db.misCompras(uid)).filter(v => !v.prueba);
    if (!compras.length) {
      cont.innerHTML = `<p style="color:#9a9aa2;font-size:13px;margin:0">Todavía no has hecho ningún pedido. Cuando compres, aquí te aparece.</p>`;
      return;
    }
    cont.innerHTML = compras.map(v => {
      const e = ESTADO_TXT[v.estado] || ESTADO_TXT.pagada;
      let lineas = [];
      try { lineas = JSON.parse(v.lineas || "[]"); } catch { }
      const detalle = lineas.length
        ? lineas.map(l => `${l.qty}× ${l.nombre || l.id}${l.talla ? ` · talla ${l.talla}` : ""}${l.perso ? ` · ${l.perso}` : ""}`).join("<br>")
        : (v.productos || "");
      return `<div style="border:1px solid #26262c;border-radius:12px;padding:13px 15px;margin-bottom:10px;background:#0f0f12">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline">
          <b style="font-size:14px">${dinero(v.total)}</b>
          <span style="font-size:12px;font-weight:700;color:${e.c}">${e.t}</span>
        </div>
        <div style="font-size:13px;color:#c8c8ce;margin-top:6px;line-height:1.6">${detalle}</div>
        <div style="font-size:12px;color:#8a8a92;margin-top:7px">
          ${cuando(v.fechaISO) || v.fecha || ""} ·
          ${v.entrega === "domicilio" ? "envío a domicilio" : "recoges en tienda"} ·
          ref ${v.id}
        </div>
        ${v.estado === "por_cobrar" ? `<div style="font-size:12.5px;color:#f7d154;margin-top:8px">Ya apartamos tu jersey. En cuanto recibamos tu pago te lo confirmamos.</div>` : ""}
      </div>`;
    }).join("");
  } catch (e) {
    cont.innerHTML = `<p style="color:#9a9aa2;font-size:13px;margin:0">No se pudieron cargar tus pedidos.</p>`;
  }
}

db.onAuth(u => asentar(u));

/* Igual que en auth.js: en Safari el aviso de Firebase puede no llegar, así que
   se revisa un par de veces si ya hay sesión puesta. */
let intentos = 0;
const revisar = setInterval(() => {
  intentos++;
  const u = db.usuarioAhora?.();
  if (u && !user) asentar(u);
  if (intentos >= 6 || (u && user)) clearInterval(revisar);
}, 700);

$("#cuentaEntrar")?.addEventListener("click", () => document.getElementById("authBtn")?.click());

$("#cuentaGuardar")?.addEventListener("click", async () => {
  if (!user) return;
  const data = {
    nombre: val("fNombre"), telefono: val("fTel"), calle: val("fCalle"),
    colonia: val("fCol"), cp: val("fCP"), ciudad: val("fCiudad"), estado: val("fEstado"),
    referencias: val("fRef"), email: user.email, actualizado: new Date().toISOString()
  };
  const btn = $("#cuentaGuardar"); btn.disabled = true; const o = btn.textContent; btn.textContent = "Guardando…";
  const msg = $("#cuentaMsg"); msg.textContent = ""; msg.style.color = "#e8b923";
  try {
    await db.guardarPerfil(user.uid, data);
    msg.textContent = "✓ Datos guardados.";
  } catch (err) {
    msg.style.color = "#ff6b6b";
    msg.textContent = (err?.code || "").includes("permission")
      ? "No se pudo guardar (permisos de Firestore). Avísale a soporte."
      : "No se pudo guardar. Intenta de nuevo.";
  }
  btn.disabled = false; btn.textContent = o;
});

$("#cuentaSalir")?.addEventListener("click", async () => { await db.logout(); });
