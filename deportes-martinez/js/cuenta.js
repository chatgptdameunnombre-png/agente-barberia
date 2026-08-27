import { db } from "./db.js?v=45";

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
  if (u) { loadPerfil(u.uid); }
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
