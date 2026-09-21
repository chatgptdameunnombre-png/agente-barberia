(function () {
  /* Tuia al lado del inicio de sesión. Solo flota y hace gestos; si le das
     clic, explica qué es esta pantalla. */
  var caja = document.getElementById("login");
  if (!caja) return;

  var esCliente = /cliente\.html/.test(location.pathname);
  var TEXTO = esCliente
    ? "Aquí entran nuestros clientes. Usa el correo y la contraseña que te dimos."
    : "Este es tu panel. Entra con tu correo de dueño.";

  var css =
    "#login{position:relative}" +
    ".lt{position:absolute;left:100%;top:34px;margin-left:26px;width:120px;cursor:pointer;" +
    "animation:lt-flota 4s ease-in-out infinite;-webkit-tap-highlight-color:transparent}" +
    ".lt svg{width:120px;height:120px;overflow:visible;display:block}" +
    ".lt .g{display:none}.lt[data-g=normal] .g-normal,.lt[data-g=feliz] .g-feliz," +
    ".lt[data-g=guino] .g-guino,.lt[data-g=pensando] .g-pensando{display:block}" +
    ".lt-globo{position:absolute;left:100%;top:62px;margin-left:160px;width:230px;background:#141414;" +
    "border:1px solid rgba(201,168,76,.4);border-radius:16px;padding:14px 16px;font-size:.93rem;" +
    "line-height:1.5;color:#eee;box-shadow:0 14px 34px rgba(0,0,0,.5);opacity:0;transform:translateY(6px);" +
    "pointer-events:none;transition:opacity .25s,transform .25s}" +
    ".lt-globo.on{opacity:1;transform:none}" +
    ".lt-globo::before{content:'';position:absolute;left:-7px;top:26px;width:12px;height:12px;background:#141414;" +
    "border-left:1px solid rgba(201,168,76,.4);border-bottom:1px solid rgba(201,168,76,.4);transform:rotate(45deg)}" +
    "@keyframes lt-flota{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}" +
    "@media(max-width:1180px) and (min-width:761px){" +
    ".lt-globo{top:168px;margin-left:0;width:220px}" +
    ".lt-globo::before{left:40px;top:-7px;transform:rotate(135deg)}}" +
    "@media(max-width:760px){" +
    ".lt{left:auto;right:-8px;top:-44px;margin:0;width:78px}" +
    ".lt svg{width:78px;height:78px}" +
    ".lt-globo{left:auto;right:0;top:44px;margin:0;width:220px}" +
    ".lt-globo::before{left:auto;right:28px;top:-7px;transform:rotate(135deg)}}" +
    "@media (prefers-reduced-motion:reduce){.lt{animation:none}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var svg =
    '<svg viewBox="0 0 120 120" aria-hidden="true">' +
    '<defs><linearGradient id="ltOro" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#fff4cf"/><stop offset="48%" stop-color="#dfc06a"/>' +
    '<stop offset="100%" stop-color="#ab8636"/></linearGradient>' +
    '<filter id="ltBrillo" x="-60%" y="-60%" width="220%" height="220%">' +
    '<feGaussianBlur stdDeviation="5.5" result="b"/>' +
    '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
    '<ellipse cx="60" cy="60" rx="54" ry="20" fill="none" stroke="#c9a84c" stroke-width="2.4" opacity=".62"/>' +
    '<circle cx="60" cy="60" r="34" fill="url(#ltOro)" filter="url(#ltBrillo)"/>' +
    '<circle cx="49" cy="48" r="6" fill="#fff8e2" opacity=".34"/>' +
    '<g class="g g-normal" fill="#0a0a0a"><rect x="45" y="52" width="9" height="18" rx="4.5"/>' +
    '<rect x="66" y="52" width="9" height="18" rx="4.5"/></g>' +
    '<g class="g g-feliz" fill="none" stroke="#0a0a0a" stroke-width="5" stroke-linecap="round">' +
    '<path d="M44 63 q5 -9 10 0"/><path d="M66 63 q5 -9 10 0"/></g>' +
    '<g class="g g-guino"><rect x="45" y="52" width="9" height="18" rx="4.5" fill="#0a0a0a"/>' +
    '<path d="M65 62 h11" stroke="#0a0a0a" stroke-width="5" stroke-linecap="round"/></g>' +
    '<g class="g g-pensando" fill="#0a0a0a"><rect x="47" y="50" width="9" height="15" rx="4.5"/>' +
    '<rect x="68" y="50" width="9" height="15" rx="4.5"/></g>' +
    "</svg>";

  var tuia = document.createElement("div");
  tuia.className = "lt";
  tuia.setAttribute("role", "button");
  tuia.setAttribute("aria-label", "Tuia, toca para saber qué es esta pantalla");
  tuia.dataset.g = "normal";
  tuia.innerHTML = svg;
  var globo = document.createElement("div");
  globo.className = "lt-globo";
  globo.textContent = TEXTO;
  caja.appendChild(tuia);
  caja.appendChild(globo);

  /* gestos tranquilos cada tanto: siempre regresa a la cara normal */
  var GESTOS = ["feliz", "guino", "pensando", "feliz"];
  var i = 0, tGesto = null;
  function gesto(g, ms) {
    tuia.dataset.g = g;
    clearTimeout(tGesto);
    tGesto = setTimeout(function () { tuia.dataset.g = "normal"; }, ms || 1100);
  }
  setInterval(function () {
    if (caja.hidden) return;
    gesto(GESTOS[i++ % GESTOS.length]);
  }, 3800);

  var tGlobo = null;
  tuia.addEventListener("click", function () {
    globo.classList.add("on");
    gesto("feliz", 1600);
    clearTimeout(tGlobo);
    tGlobo = setTimeout(function () { globo.classList.remove("on"); }, 5500);
  });
  document.addEventListener("click", function (e) {
    if (!tuia.contains(e.target)) globo.classList.remove("on");
  });
})();
