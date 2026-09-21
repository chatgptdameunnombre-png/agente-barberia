(function () {
  /* Tuia en la pantalla de entrar. Flota, parpadea, mira lo que escribes,
     se tapa los ojos en la contraseña y da vueltas mientras entra. */
  var caja = document.getElementById("login");
  if (!caja) return;

  var css =
    ".lt{display:flex;justify-content:center;margin:-6px 0 14px}" +
    ".lt svg{width:118px;height:118px;overflow:visible;animation:lt-flota 3.6s ease-in-out infinite}" +
    ".lt .cuerpo{transform-origin:60px 60px;transition:transform .5s cubic-bezier(.2,.8,.2,1)}" +
    ".lt .ojos{transition:transform .25s cubic-bezier(.2,.8,.2,1)}" +
    ".lt .ojo{transform-origin:center;transform-box:fill-box;animation:lt-parpadeo 5s infinite}" +
    ".lt .cara{transition:opacity .12s .2s}" +
    ".lt.tapa .cuerpo,.lt.regresa .cuerpo{animation:lt-voltea .45s cubic-bezier(.4,0,.2,1)}" +
    ".lt.tapa .cara{opacity:0}" +
    ".lt .espalda{opacity:0;transition:opacity .12s .2s}" +
    ".lt.tapa .espalda{opacity:1}" +
    ".lt .feliz{display:none}" +
    ".lt.ok .feliz{display:block}.lt.ok .ojos{display:none}" +
    ".lt.pensando .cuerpo{animation:lt-gira 1.1s cubic-bezier(.5,.1,.5,.9) infinite}" +
    ".lt.mal svg{animation:lt-no .45s ease-in-out}" +
    ".lt-globo{text-align:center;font-size:.92rem;color:var(--dim);min-height:1.4em;margin-bottom:10px;transition:opacity .2s}" +
    "@keyframes lt-flota{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}" +
    "@keyframes lt-parpadeo{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}" +
    "@keyframes lt-gira{to{transform:rotate(360deg)}}" +
    "@keyframes lt-voltea{0%{transform:scaleX(1)}50%{transform:scaleX(.06)}100%{transform:scaleX(1)}}" +
    "@keyframes lt-no{0%,100%{transform:translateX(0)}25%{transform:translateX(-9px)}75%{transform:translateX(9px)}}" +
    "@media (prefers-reduced-motion:reduce){.lt svg,.lt .ojo,.lt.pensando .cuerpo{animation:none}}";
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
    '<circle r="2.8" fill="#fff1c4"><animateMotion dur="4.5s" repeatCount="indefinite" ' +
    'path="M114,60 A54,20 0 1,1 6,60 A54,20 0 1,1 114,60"/></circle>' +
    '<g class="cuerpo"><circle cx="60" cy="60" r="34" fill="url(#ltOro)" filter="url(#ltBrillo)"/>' +
    '<g class="cara"><circle cx="49" cy="48" r="6" fill="#fff8e2" opacity=".34"/>' +
    '<g class="ojos"><rect class="ojo" x="45" y="52" width="9" height="18" rx="4.5" fill="#0a0a0a"/>' +
    '<rect class="ojo" x="66" y="52" width="9" height="18" rx="4.5" fill="#0a0a0a"/></g>' +
    '<g class="feliz" fill="none" stroke="#0a0a0a" stroke-width="5" stroke-linecap="round">' +
    '<path d="M44 62 q5 -8 10 0"/><path d="M66 62 q5 -8 10 0"/></g></g>' +
    '<g class="espalda"><circle cx="71" cy="48" r="6" fill="#fff8e2" opacity=".34"/></g></g></svg>';

  var zona = document.createElement("div");
  zona.className = "lt";
  zona.innerHTML = svg;
  var globo = document.createElement("div");
  globo.className = "lt-globo";
  globo.textContent = "Hola, soy Tuia.";
  caja.insertBefore(globo, caja.firstChild);
  caja.insertBefore(zona, caja.firstChild);

  var ojos = zona.querySelector(".ojos");
  var mail = document.getElementById("mail");
  var pass = document.getElementById("pass");
  var btn = document.getElementById("entrar");
  var err = document.getElementById("loginErr");

  function di(t) { globo.textContent = t; }
  function mira(dx, dy) { ojos.style.transform = "translate(" + dx + "px," + dy + "px)"; }

  /* los ojos siguen el cursor */
  document.addEventListener("mousemove", function (e) {
    if (zona.classList.contains("tapa") || zona.classList.contains("pensando")) return;
    var r = zona.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = Math.max(-5, Math.min(5, (e.clientX - cx) / 40));
    var dy = Math.max(-4, Math.min(4, (e.clientY - cy) / 40));
    mira(dx, dy);
  });

  if (mail) {
    mail.addEventListener("focus", function () { di("Escribe tu correo."); mira(0, 5); });
    mail.addEventListener("input", function () {
      var n = Math.min(mail.value.length, 28);
      mira(-5 + n * 0.36, 5);
    });
  }
  if (pass) {
    pass.addEventListener("focus", function () {
      zona.classList.remove("regresa");
      zona.classList.add("tapa");
      di("Me volteo, no veo nada.");
    });
    pass.addEventListener("blur", function () {
      if (!zona.classList.contains("tapa")) return;
      zona.classList.remove("tapa");
      void zona.offsetWidth;
      zona.classList.add("regresa");
      setTimeout(function () { zona.classList.remove("regresa"); }, 460);
    });
  }

  /* mientras entra: da vueltas; si falla, dice que no; si entra, sonríe */
  if (btn) {
    btn.addEventListener("click", function () {
      if (!mail || !pass || !mail.value.trim() || !pass.value) return;
      zona.classList.remove("tapa", "regresa", "mal", "ok");
      zona.classList.add("pensando");
      di("Déjame ver…");
      var t0 = Date.now();
      var vigila = setInterval(function () {
        var fallo = err && !err.hidden;
        var entro = caja.hidden;
        if (!fallo && !entro && Date.now() - t0 < 15000) return;
        clearInterval(vigila);
        zona.classList.remove("pensando");
        if (fallo) {
          zona.classList.add("mal");
          di("Mmm, eso no está bien.");
          setTimeout(function () { zona.classList.remove("mal"); }, 500);
        } else if (entro) {
          zona.classList.add("ok");
        } else {
          di("Hola, soy Tuia.");
        }
      }, 120);
    }, true);
  }
})();
