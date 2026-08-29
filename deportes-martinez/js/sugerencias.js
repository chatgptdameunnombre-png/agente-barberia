/* Lo que la gente pide y todavía no hay.
   Vive en las páginas de "Próximamente" y dentro del asistente.
   Escribe directo a Firestore: la regla deja crear a cualquiera pero solo el
   dueño puede leer, y ahí mismo se valida el tope de 200 caracteres. */

import { firebaseConfig } from "./config.js?v=72";

const PROJ = firebaseConfig.projectId;
const KEY = firebaseConfig.apiKey;
const URL = `https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents/sugerencias?key=${KEY}`;

const LS_ENVIOS = "dm_sug_envios";
const LIMITE = 3;              // por persona
const VENTANA = 10 * 60 * 1000; // cada 10 minutos

/* Freno del lado del navegador para que nadie mande veinte seguidas por juego.
   No es seguridad de verdad (eso vive en la regla de Firestore), es cortesía. */
function puedeMandar() {
  try {
    const previos = JSON.parse(localStorage.getItem(LS_ENVIOS) || "[]")
      .filter(t => Date.now() - t < VENTANA);
    localStorage.setItem(LS_ENVIOS, JSON.stringify(previos));
    return previos.length < LIMITE;
  } catch { return true; }
}

function anotarEnvio() {
  try {
    const previos = JSON.parse(localStorage.getItem(LS_ENVIOS) || "[]").filter(t => Date.now() - t < VENTANA);
    previos.push(Date.now());
    localStorage.setItem(LS_ENVIOS, JSON.stringify(previos));
  } catch { }
}

export async function mandarSugerencia({ texto, nombre = "", deporte = "" }) {
  const limpio = String(texto || "").trim().slice(0, 200);
  if (limpio.length < 3) throw new Error("corto");
  if (!puedeMandar()) throw new Error("muchos");

  const r = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        texto: { stringValue: limpio },
        nombre: { stringValue: String(nombre || "").trim().slice(0, 60) },
        deporte: { stringValue: String(deporte || "") },
        fecha: { stringValue: new Date().toISOString() },
        atendida: { booleanValue: false }
      }
    })
  });
  if (!r.ok) throw new Error("firestore");
  anotarEnvio();
  return true;
}

/* Conecta cualquier formulario que tenga la forma de arriba. Se usa igual en las
   páginas de Próximamente y en la tarjeta que pinta el asistente. */
export function conectarFormulario(form) {
  if (!form || form.dataset.listo) return;
  form.dataset.listo = "1";
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const msg = form.querySelector(".sug__msg");
    const texto = form.querySelector("[name=texto]")?.value || "";
    const nombre = form.querySelector("[name=nombre]")?.value || "";
    msg.className = "sug__msg";
    if (texto.trim().length < 3) { msg.textContent = "Escribe qué jersey te gustaría."; msg.classList.add("sug__msg--mal"); return; }
    btn.disabled = true; btn.textContent = "Enviando…";
    try {
      await mandarSugerencia({ texto, nombre, deporte: form.dataset.deporte || "" });
      form.querySelector(".sug__campos")?.remove();
      msg.innerHTML = "¡Gracias! Ya quedó anotado.<br><span>Si lo conseguimos, lo verás aquí pronto.</span>";
      msg.classList.add("sug__msg--bien");
      btn.remove();
      form.querySelectorAll(".sug__in, .sug__lb").forEach(el => el.remove());
    } catch (err) {
      const m = String(err.message);
      msg.textContent = m === "muchos"
        ? "Ya mandaste varias seguidas. Inténtalo en un rato."
        : "No se pudo enviar. Revisa tu internet e inténtalo otra vez.";
      msg.classList.add("sug__msg--mal");
      btn.disabled = false; btn.textContent = "Enviar";
    }
  });
}

/* HTML de la tarjeta que el asistente pinta dentro del chat */
export function tarjetaSugerenciaHTML(deporte) {
  const QUE = { basket: "de basketball", americano: "de futbol americano" }[deporte] || "";
  return `<form class="sug sug--chat" data-deporte="${deporte}" autocomplete="off">
    <b class="sug__t">¿Cuál te gustaría que trajéramos?</b>
    <p class="sug__ayuda">Todavía no tenemos jerseys ${QUE}. Dinos cuál buscas y lo tomamos en cuenta.</p>
    <input class="sug__in" name="texto" maxlength="200" placeholder="Ej. playera Chiefs 2010" required>
    <input class="sug__in" name="nombre" maxlength="60" placeholder="Tu nombre (opcional)">
    <button class="btn sug__btn" type="submit">Enviar</button>
    <p class="sug__msg" role="status"></p>
  </form>`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form.sug").forEach(conectarFormulario);
});
if (document.readyState !== "loading") document.querySelectorAll("form.sug").forEach(conectarFormulario);
