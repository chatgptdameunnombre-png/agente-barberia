import { ASESOR_WEBHOOK, NEGOCIO } from "./config.js?v=2";
import { porId, EUR_RATE, MONTH_MULTIPLIER } from "./catalogo.js?v=2";

const SID_KEY = "tid_asesor_sid";
const SALUDO = `¡Hola! 👋 Soy la IA de ${NEGOCIO.nombre}. Dime qué tipo de negocio tienes y qué quieres lograr en redes — yo te armo el paquete y te digo cuánto sale.`;
const PERIODO = { weekly: "por semana", monthly: "al mes", onetime: "pago único" };
const mxn = n => "$" + Math.round(n).toLocaleString("es-MX");

function sessionId() {
  let s = localStorage.getItem(SID_KEY);
  if (!s) { s = "web-" + Math.random().toString(36).slice(2) + "-" + (performance.now() | 0); localStorage.setItem(SID_KEY, s); }
  return s;
}

function totalPaquete(lista) {
  let semanal = 0, mensual = 0, unico = 0;
  lista.forEach(({ id, qty }) => {
    const s = porId(id); if (!s) return;
    const st = s.price * (Number(qty) || 1);
    if (s.period === "weekly") semanal += st;
    else if (s.period === "monthly") mensual += st;
    else unico += st;
  });
  const mes = semanal * MONTH_MULTIPLIER + mensual;
  return { mes, unico, primerMes: mes + unico };
}

let abierto = false;

function montar() {
  if (document.getElementById("asesorBtn")) return;

  const btn = document.createElement("button");
  btn.id = "asesorBtn";
  btn.type = "button";
  btn.setAttribute("aria-label", `Abrir la IA de ${NEGOCIO.nombre}`);
  btn.innerHTML = `<span class="asesor-dot"></span><span class="asesor-lbl">Arma mi paquete con IA</span>`;

  const panel = document.createElement("div");
  panel.id = "asesorPanel";
  panel.innerHTML = `
    <div class="asesor-head">
      <div>
        <div class="asesor-title">IA de ${NEGOCIO.nombre}</div>
        <div class="asesor-sub">Te digo qué necesitas y cuánto cuesta</div>
      </div>
      <div class="asesor-head-btns">
        <button class="asesor-reset" type="button" aria-label="Empezar de nuevo" title="Empezar de nuevo">↻</button>
        <button class="asesor-x" type="button" aria-label="Cerrar">✕</button>
      </div>
    </div>
    <div class="asesor-body" id="asesorBody"></div>
    <form class="asesor-input" id="asesorForm">
      <input id="asesorText" type="text" placeholder="Ej: tengo una barbería y quiero más clientes…" autocomplete="off" maxlength="240">
      <button type="submit" aria-label="Enviar">➤</button>
    </form>`;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  const body = panel.querySelector("#asesorBody");
  const form = panel.querySelector("#asesorForm");
  const input = panel.querySelector("#asesorText");

  const toggle = () => {
    abierto = !abierto;
    panel.classList.toggle("open", abierto);
    btn.classList.toggle("hide", abierto);
    if (abierto) {
      if (!body.dataset.saludo) { body.dataset.saludo = "1"; pintarBot(SALUDO); sugerencias(); }
      setTimeout(() => input.focus(), 120);
    }
  };
  btn.addEventListener("click", toggle);
  panel.querySelector(".asesor-x").addEventListener("click", toggle);
  panel.querySelector(".asesor-reset").addEventListener("click", () => {
    localStorage.removeItem(SID_KEY);
    body.innerHTML = "";
    body.dataset.saludo = "1";
    pintarBot(SALUDO);
    sugerencias();
    setTimeout(() => input.focus(), 60);
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const txt = input.value.trim();
    if (!txt) return;
    input.value = "";
    pintarUser(txt);
    enviar(txt);
  });

  function scroll() { body.scrollTop = body.scrollHeight; }

  function pintarUser(txt) {
    const el = document.createElement("div");
    el.className = "msg msg--user";
    el.textContent = txt;
    body.appendChild(el); scroll();
  }

  function pintarBot(txt) {
    const el = document.createElement("div");
    el.className = "msg msg--bot";
    el.textContent = txt;
    body.appendChild(el); scroll();
    return el;
  }

  function typing() {
    const el = document.createElement("div");
    el.className = "msg msg--bot asesor-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(el); scroll();
    return el;
  }

  function sugerencias() {
    const chips = ["Tengo una barbería", "Vendo ropa en Instagram", "Quiero delegar todo", "Solo necesito videos"];
    const wrap = document.createElement("div");
    wrap.className = "asesor-chips";
    wrap.innerHTML = chips.map(c => `<button type="button">${c}</button>`).join("");
    wrap.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      wrap.remove(); pintarUser(b.textContent); enviar(b.textContent);
    }));
    body.appendChild(wrap); scroll();
  }

  function tarjetas(lista) {
    const validos = lista.map(x => ({ s: porId(x.id), qty: Number(x.qty) || 1 })).filter(x => x.s);
    if (!validos.length) return;
    const t = totalPaquete(validos.map(v => ({ id: v.s.id, qty: v.qty })));

    const wrap = document.createElement("div");
    wrap.className = "asesor-cards";
    wrap.innerHTML = `
      ${validos.map(({ s, qty }) => `
        <div class="ac-card">
          <div class="ac-cat">${s.cat}</div>
          <div class="ac-name">${s.name}</div>
          <div class="ac-line">
            <span class="ac-qty">${qty} × ${s.unit}</span>
            <span class="ac-price">${mxn(s.price * qty)} <small>${PERIODO[s.period]}</small></span>
          </div>
        </div>`).join("")}
      <div class="ac-total">
        <div class="ac-total-row"><span>Mensual estimado</span><b>${mxn(t.mes)} MXN</b></div>
        ${t.unico ? `<div class="ac-total-row"><span>Pago único</span><b>${mxn(t.unico)} MXN</b></div>` : ""}
        <div class="ac-total-row ac-total-row--big"><span>Primer mes</span><b>${mxn(t.primerMes)} MXN</b></div>
      </div>
      <div class="ac-actions">
        <button class="ac-btn ac-btn--ghost" type="button" data-aplicar>Verlo en el cotizador</button>
        <button class="ac-btn" type="button" data-wa>Pedirlo por WhatsApp</button>
      </div>`;

    const aplicar = () => window.TID?.seleccionar(validos.map(v => ({ id: v.s.id, qty: v.qty })), true);
    wrap.querySelector("[data-aplicar]").addEventListener("click", () => {
      aplicar();
      document.getElementById("cotizador")?.scrollIntoView({ behavior: "smooth" });
    });
    wrap.querySelector("[data-wa]").addEventListener("click", () => { aplicar(); window.TID?.abrirWA(); });

    body.appendChild(wrap); scroll();
  }

  async function enviar(txt) {
    const t = typing();
    try {
      const r = await fetch(ASESOR_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: txt, sessionId: sessionId() })
      });
      const d = await r.json();
      t.remove();
      pintarBot(d.reply || "Perdón, no te entendí bien. ¿Me lo dices de otra forma?");
      if (Array.isArray(d.servicios) && d.servicios.length) tarjetas(d.servicios);
    } catch {
      t.remove();
      pintarBot("Uy, se me fue la señal 📶. Inténtalo de nuevo en un momento.");
    }
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
else montar();
