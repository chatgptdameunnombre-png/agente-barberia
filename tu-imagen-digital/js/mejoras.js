/* ============================================================
   mejoras.js — capa aditiva de presentación (NO toca el cotizador)
   · Acordeón "una categoría a la vez" (estilo Pizza 38)
   · Nav con sombra al hacer scroll
   · Animaciones de entrada con IntersectionObserver + red de seguridad
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1) Acordeón: ninguna abierta al inicio + una a la vez ---------- */
  var lista = document.getElementById("cotizadorLista");
  if (lista) {
    var quiereAbierta = false; // ¿el usuario tiene una categoría abierta a propósito?

    var cerrarTodas = function () {
      lista.querySelectorAll("details.cat[open]").forEach(function (c) { c.open = false; });
    };

    // el usuario abre/cierra una categoría
    lista.addEventListener("toggle", function (e) {
      var d = e.target;
      if (!d || !d.classList || !d.classList.contains("cat")) return;
      if (d.open) {
        lista.querySelectorAll("details.cat[open]").forEach(function (otra) {
          if (otra !== d) otra.open = false;
        });
      }
      quiereAbierta = !!lista.querySelector("details.cat[open]");
    }, true); // captura: el evento toggle no burbujea

    // el cotizador re-renderiza en cada cambio y reabre la primera categoría;
    // si el usuario no tenía ninguna abierta, la volvemos a cerrar
    new MutationObserver(function () {
      if (!quiereAbierta) cerrarTodas();
    }).observe(lista, { childList: true });

    // arranque: nada abierto
    cerrarTodas();
  }

  /* ---------- 2) Nav con sombra al hacer scroll ---------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 10); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 3) Animaciones de entrada ---------- */
  if (reduce) return; // respeta prefers-reduced-motion (queda todo visible por el CSS)

  document.documentElement.classList.add("anim");

  var revelar = function (el) {
    var d = parseInt(el.getAttribute("data-reveal-d") || "0", 10);
    if (d) el.style.transitionDelay = (d * 0.09) + "s";
    el.classList.add("visible");
  };

  var nodos = function () { return Array.prototype.slice.call(document.querySelectorAll(".reveal[data-reveal]")); };

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { revelar(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    nodos().forEach(function (el) {
      // lo que ya está en pantalla al cargar (hero) se revela de inmediato
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) revelar(el);
      else io.observe(el);
    });
  } else {
    nodos().forEach(revelar);
  }

  /* red de seguridad: pase lo que pase, a los 1.6s todo queda visible */
  setTimeout(function () { nodos().forEach(function (el) { el.classList.add("visible"); }); }, 1600);
})();
