import { NEGOCIO } from "./config.js?v=80";
import { db } from "./db.js?v=80";

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));

const u = new URLSearchParams(location.search);
const estado = u.get("collection_status") || u.get("status") || "";
let ultimo = null;
try { ultimo = JSON.parse(localStorage.getItem("dm_ultimo_pedido") || "null"); } catch { }
const limpio = x => (x && x !== "null" ? x : "");
const ref = limpio(u.get("external_reference")) || limpio(u.get("ref"));
const datos = ultimo && ultimo.ref === ref ? ultimo : null;

const aprobado = estado === "approved";
const enRevision = ["pending", "in_process"].includes(estado);
const fallo = !aprobado && !enRevision;

if (aprobado) { try { localStorage.removeItem("dm_cart"); } catch { } }

function rutaMapa() {
  const q = (String(NEGOCIO.mapa || "").split("q=")[1] || "").split("&")[0];
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${q}` : NEGOCIO.mapa;
}

function pintar(user) {
  const cont = $("#pedido");
  if (!cont) return;

  if (!ref || fallo) {
    cont.innerHTML = `
      <div class="pd-caja">
        <div class="pd-icono pd-icono--mal">✕</div>
        <h1 class="pd-titulo">${ref ? "No se completó el pago" : "No encontramos tu pedido"}</h1>
        <p class="pd-sub">${ref
          ? "No se te cobró nada. Tu carrito sigue guardado para que lo intentes otra vez."
          : "Si ya pagaste y no ves tu número de pedido, llámanos y te ayudamos."}</p>
        <div class="pd-acciones">
          <a class="btn-cta" href="futbol.html">Volver a la tienda</a>
          <a class="pd-btn" href="tel:+52${NEGOCIO.telefono.replace(/\D/g, "")}">Llamar al ${esc(NEGOCIO.telefono)}</a>
        </div>
      </div>`;
    return;
  }

  const tienda = !datos || datos.entrega !== "domicilio";
  const invitado = datos ? datos.invitado : !user;
  const productos = (datos?.productos || []).map(p => `
    <li><b>${esc(p.title)}</b><span>${p.qty > 1 ? `${p.qty} piezas · ` : ""}${p.talla ? `Talla ${esc(p.talla)}` : ""}</span></li>`).join("");

  cont.innerHTML = `
    <div class="pd-caja">
      <div class="pd-icono ${enRevision ? "pd-icono--espera" : ""}">${enRevision ? "⏳" : "✓"}</div>
      <h1 class="pd-titulo">${enRevision ? "Tu pago está en revisión" : "¡Listo, recibimos tu pago!"}</h1>
      <p class="pd-sub">${enRevision
        ? "Mercado Pago nos avisa en cuanto se acredite. Tu jersey ya está apartado."
        : tienda ? "Tu jersey ya está apartado. Te esperamos en la tienda." : "Ya estamos preparando tu envío."}</p>

      <div class="pd-folio">
        <span class="pd-folio__k">Tu número de pedido</span>
        <b class="pd-folio__v">${esc(ref)}</b>
        <button class="pd-folio__cp" id="pdCopiar" type="button">Copiar</button>
      </div>

      ${invitado
        ? `<p class="pd-aviso"><b>Guarda este número.</b> Cópialo o tómale captura: como compraste sin cuenta, no lo vas a poder ver después en la página. Si tienes cualquier duda, llámanos y dinos tu número de pedido.</p>`
        : `<p class="pd-nota">Puedes seguir tu pedido paso a paso en tu cuenta.</p>`}

      ${productos ? `<ul class="pd-lista">${productos}</ul>` : ""}

      <div class="pd-entrega">
        <span class="pd-entrega__k">${tienda ? "Recoges en tienda" : "Envío a domicilio"}</span>
        <span class="pd-entrega__v">${tienda
          ? `Tel. ${esc(NEGOCIO.telefono)}${NEGOCIO.telefono2 ? ` · ${esc(NEGOCIO.telefono2)}` : ""}`
          : "Te avisamos cuando salga."}</span>
      </div>

      <div class="pd-acciones">
        ${tienda ? `<a class="btn-cta" href="${rutaMapa()}" target="_blank" rel="noopener">📍 Cómo llegar a la tienda</a>` : ""}
        ${invitado ? "" : `<a class="pd-btn" href="cuenta.html">Ver mis pedidos</a>`}
        <a class="pd-btn" href="futbol.html">Seguir viendo jerseys</a>
      </div>
    </div>`;

  $("#pdCopiar").onclick = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      $("#pdCopiar").textContent = "¡Copiado!";
      setTimeout(() => { const b = $("#pdCopiar"); if (b) b.textContent = "Copiar"; }, 1600);
    } catch { }
  };
}

pintar(db.usuarioAhora?.() || null);
db.onAuth(user => pintar(user));
