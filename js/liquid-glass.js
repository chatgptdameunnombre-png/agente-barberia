(function () {
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  svg.innerHTML =
    '<filter id="lgRefraccion" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="11" result="ruido"/>' +
    '<feGaussianBlur in="ruido" stdDeviation="3" result="suave"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="suave" scale="42" xChannelSelector="R" yChannelSelector="G"/>' +
    "</filter>";
  function monta() {
    document.body.appendChild(svg);
    var nav = document.getElementById("site-nav"), btn = document.querySelector(".lg-menu");
    if (nav && btn) {
      var pon = function (abre) {
        nav.classList.toggle("abierto", abre);
        btn.setAttribute("aria-expanded", abre ? "true" : "false");
      };
      btn.addEventListener("click", function (e) { e.stopPropagation(); pon(!nav.classList.contains("abierto")); });
      nav.addEventListener("click", function (e) { if (e.target.closest(".lg-secs a")) pon(false); });
      document.addEventListener("click", function (e) { if (!nav.contains(e.target)) pon(false); });
      window.addEventListener("scroll", function () { if (nav.classList.contains("abierto") && nav.classList.contains("nav-hidden")) pon(false); }, { passive: true });
    }
    var links = document.querySelectorAll(".lg-secs a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var mapa = {};
    Array.prototype.forEach.call(links, function (l) {
      var sec = document.querySelector(l.getAttribute("href"));
      if (sec) mapa[sec.id] = l;
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        Array.prototype.forEach.call(links, function (l) { l.classList.remove("on"); });
        var l = mapa[e.target.id];
        if (l) {
          l.classList.add("on");
          if (l.parentNode.scrollWidth > l.parentNode.clientWidth) {
            l.parentNode.scrollTo({ left: l.offsetLeft - 20, behavior: "smooth" });
          }
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    Object.keys(mapa).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
  if (document.body) monta(); else document.addEventListener("DOMContentLoaded", monta);

  if (!window.matchMedia || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  var SEL = ".pcard,.ccard,.rbox,.fstep,.ctac,.frm-lado,.frm,.diff-card,.card,.blq,.cli,.msg,.pet,.v,.hist,.deben,.gan,.res,.cuadro,.prox,.srv,.pago,.pide,.atraso,.caja,#login";
  var pend = null, ultimo = null;
  document.addEventListener("pointermove", function (e) {
    pend = e;
    if (ultimo) return;
    ultimo = requestAnimationFrame(function () {
      ultimo = null;
      var el = pend.target && pend.target.closest ? pend.target.closest(SEL) : null;
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (pend.clientX - r.left) + "px");
      el.style.setProperty("--my", (pend.clientY - r.top) + "px");
    });
  }, { passive: true });
})();
