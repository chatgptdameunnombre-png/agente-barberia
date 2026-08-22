import { firebaseConfig, usaFirebase } from "./config.js?v=1";
import { permiteMedicion } from "./cookies.js?v=1";

const KEY = firebaseConfig.apiKey;
const PROJ = firebaseConfig.projectId;
const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents`;
const LS_ID = "dm_track_id";
const SS_SES = "dm_track_ses";
const MAX_EVENTOS = 300;

let ident = null;
let ses = null;
let sucio = false;
let enVuelo = false;
let ultimoPing = 0;

/* ---------- identidad anónima (Firebase Auth REST) ---------- */
async function pedirAnonimo() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  if (!r.ok) throw new Error("anon");
  const d = await r.json();
  return { uid: d.localId, idToken: d.idToken, refreshToken: d.refreshToken, exp: Date.now() + 3300e3 };
}

async function refrescar(refreshToken) {
  const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
  });
  if (!r.ok) throw new Error("refresh");
  const d = await r.json();
  return { uid: d.user_id, idToken: d.id_token, refreshToken: d.refresh_token, exp: Date.now() + 3300e3 };
}

async function identidad() {
  if (ident && ident.exp > Date.now()) return ident;
  let guardada = null;
  try { guardada = JSON.parse(localStorage.getItem(LS_ID) || "null"); } catch { }
  try {
    ident = guardada?.refreshToken
      ? (guardada.exp > Date.now() ? guardada : await refrescar(guardada.refreshToken))
      : await pedirAnonimo();
  } catch {
    ident = await pedirAnonimo();
  }
  localStorage.setItem(LS_ID, JSON.stringify(ident));
  return ident;
}

/* ---------- sesión ---------- */
function nuevoId() {
  return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function dispositivo() {
  const w = window.innerWidth;
  if (w < 768) return "movil";
  if (w < 1100) return "tablet";
  return "escritorio";
}

function origen() {
  const u = new URLSearchParams(location.search);
  const utm = u.get("utm_source") || u.get("fbclid") ? "campaña" : null;
  if (utm) return utm;
  const r = document.referrer || "";
  if (!r) return "directo";
  try {
    const h = new URL(r).hostname.replace("www.", "");
    if (h.includes(location.hostname)) return "interno";
    if (h.includes("instagram")) return "instagram";
    if (h.includes("facebook")) return "facebook";
    if (h.includes("google")) return "google";
    return h;
  } catch { return "directo"; }
}

function cargarSesion() {
  try {
    const g = JSON.parse(sessionStorage.getItem(SS_SES) || "null");
    if (g && g.id) return g;
  } catch { }
  return {
    id: nuevoId(),
    inicio: new Date().toISOString(),
    dispositivo: dispositivo(),
    origen: origen(),
    entrada: location.pathname.split("/").pop() || "index.html",
    eventos: [],
    productos: {},
    busquedas: [],
    sinResultado: [],
    compro: false,
    clienteUid: "",
    clienteEmail: ""
  };
}

function guardarLocal() {
  try { sessionStorage.setItem(SS_SES, JSON.stringify(ses)); } catch { }
}

/* ---------- Firestore ---------- */
function val(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(val) } };
  if (typeof v === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } };
  return { stringValue: String(v) };
}

async function enviar(keepalive = false) {
  if (!usaFirebase || enVuelo || !sucio || !permiteMedicion()) return;
  enVuelo = true;
  try {
    const id = await identidad();
    const cuerpo = {
      fields: {
        uid: val(id.uid),
        inicio: val(ses.inicio),
        fin: val(new Date().toISOString()),
        duracion: val(Math.round((Date.now() - new Date(ses.inicio).getTime()) / 1000)),
        dispositivo: val(ses.dispositivo),
        origen: val(ses.origen),
        entrada: val(ses.entrada),
        compro: val(ses.compro),
        clienteUid: val(ses.clienteUid || ""),
        clienteEmail: val(ses.clienteEmail || ""),
        busquedas: val(ses.busquedas.slice(-40)),
        sinResultado: val(ses.sinResultado.slice(-40)),
        productos: val(ses.productos),
        eventos: val(ses.eventos.slice(-MAX_EVENTOS))
      }
    };
    const campos = Object.keys(cuerpo.fields).map(k => `updateMask.fieldPaths=${k}`).join("&");
    const r = await fetch(`${DOCS}/sesiones/${ses.id}?key=${KEY}&${campos}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${id.idToken}` },
      body: JSON.stringify(cuerpo),
      keepalive
    });
    if (r.ok) sucio = false;
  } catch { /* el tracking nunca debe romper la tienda */ }
  enVuelo = false;
}

/* ---------- API pública ---------- */
export function track(evento, datos = {}) {
  if (!ses) return;
  ses.eventos.push({ e: evento, t: new Date().toISOString(), ...datos });
  if (ses.eventos.length > MAX_EVENTOS) ses.eventos = ses.eventos.slice(-MAX_EVENTOS);
  if (evento === "busqueda" && datos.texto) ses.busquedas.push(String(datos.texto).slice(0, 80));
  if (evento === "busqueda_sin_resultado" && datos.texto) ses.sinResultado.push(String(datos.texto).slice(0, 80));
  if (evento === "compra") ses.compro = true;
  sucio = true;
  guardarLocal();
  if (ses.eventos.length % 12 === 0) enviar();
}

export function trackProducto(p, segundos) {
  if (!ses || !p) return;
  const id = p.id || p;
  const prev = ses.productos[id] || { nombre: p.nombre || "", vistas: 0, segundos: 0, carrito: false, comprado: false };
  prev.vistas += segundos === undefined ? 1 : 0;
  if (segundos) prev.segundos += Math.round(segundos);
  if (p.nombre) prev.nombre = p.nombre;
  if (p.equipo) prev.equipo = p.equipo;
  if (p.categoria) prev.categoria = p.categoria;
  ses.productos[id] = prev;
  sucio = true;
  guardarLocal();
}

export function marcarProducto(id, campo) {
  if (!ses || !ses.productos[id]) ses.productos[id] = { nombre: "", vistas: 0, segundos: 0, carrito: false, comprado: false };
  ses.productos[id][campo] = true;
  sucio = true;
  guardarLocal();
  enviar();
}

export function setCliente(uid, email) {
  if (!ses) return;
  ses.clienteUid = uid || "";
  ses.clienteEmail = email || "";
  sucio = true;
  guardarLocal();
  enviar();
}

/* ---------- arranque ---------- */
ses = cargarSesion();
guardarLocal();
track("pagina", { url: location.pathname.split("/").pop() || "index.html" });

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") enviar(true);
});
window.addEventListener("pagehide", () => enviar(true));
setInterval(() => {
  if (Date.now() - ultimoPing > 25000) { ultimoPing = Date.now(); enviar(); }
}, 25000);

document.addEventListener("click", e => {
  const b = e.target.closest("button, a");
  if (!b) return;
  const txt = (b.textContent || "").trim().slice(0, 40);
  if (!txt) return;
  track("click", { texto: txt, id: b.id || b.dataset.add || "" });
}, true);

window.dmTrack = { track, trackProducto, marcarProducto, setCliente };
