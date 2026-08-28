/* Menú del panel (tres rayitas).
   Todo el panel vive en una sola página: el menú solo te lleva a la sección. */

const $ = s => document.querySelector(s);

const DESTINO = {
  productos: "#secProductos",
  visitas: "#estad",
  ventas: "#secVentas",
  promos: "#secPromos",
  cuentas: "#secCuentas"
};

/* Animación propia. En esta plantilla el `scroll-behavior: smooth` del CSS no anima
   y `scrollTo(x, y)` se ignora: solo responde `scrollTo({top, behavior:"instant"})`. */
function irSuave(destinoY, ms = 480) {
  const inicio = window.scrollY;
  const dist = destinoY - inicio;
  if (Math.abs(dist) < 4) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: destinoY, behavior: "instant" });
    return;
  }
  const t0 = performance.now();
  let corrio = false;
  const suavizar = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const paso = ahora => {
    corrio = true;
    const t = Math.min(1, (ahora - t0) / ms);
    window.scrollTo({ top: inicio + dist * suavizar(t), behavior: "instant" });
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  /* si la pestaña está en segundo plano no hay cuadros de animación: saltamos directo */
  setTimeout(() => { if (!corrio) window.scrollTo({ top: destinoY, behavior: "instant" }); }, 150);
}

export function mostrarSeccion(sec, sub) {
  const destino = sub
    ? $(`#estadBody .st-bloque[data-sub="${sub}"]`)
    : (DESTINO[sec] ? $(DESTINO[sec]) : null);

  document.querySelectorAll(".pnav__item").forEach(b => b.classList.toggle("on", b.dataset.sec === sec));
  document.querySelectorAll(".pnav__sub").forEach(b => b.classList.toggle("on", !!sub && b.dataset.sub === sub));
  cerrarNav();

  if (!destino) return;
  const alto = $(".admin-top")?.offsetHeight || 68;
  const y = destino.getBoundingClientRect().top + window.scrollY - alto - 16;
  irSuave(Math.max(0, y));
  destino.classList.add("st-resalta");
  setTimeout(() => destino.classList.remove("st-resalta"), 1500);
}

function abrirNav() {
  $("#pnav").hidden = false;
  $("#pnavFondo").hidden = false;
  $("#pnavBtn")?.classList.add("on");
}

function cerrarNav() {
  $("#pnav").hidden = true;
  $("#pnavFondo").hidden = true;
  $("#pnavBtn")?.classList.remove("on");
}

function conectar() {
  $("#pnavBtn")?.addEventListener("click", () => ($("#pnav").hidden ? abrirNav() : cerrarNav()));
  $("#pnavFondo")?.addEventListener("click", cerrarNav);

  document.querySelectorAll(".pnav__item").forEach(b => {
    b.addEventListener("click", () => {
      if (b.dataset.sec === "agregar") { cerrarNav(); document.dispatchEvent(new CustomEvent("panel:nuevo")); return; }
      mostrarSeccion(b.dataset.sec);
      if (b.dataset.sec === "cuentas") document.dispatchEvent(new CustomEvent("panel:cuentas"));
    });
  });

  document.querySelectorAll(".pnav__sub").forEach(b => {
    b.addEventListener("click", () => mostrarSeccion("visitas", b.dataset.sub));
  });

  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarNav(); });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", conectar);
else conectar();
