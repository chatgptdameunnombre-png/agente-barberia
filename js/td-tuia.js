/* Tuia — la mascota que acompaña al visitante por tuagentedeia.com
   Se inyecta sola: basta con cargar este archivo. Funciona en el index
   y también en legales.html (donde no hay hero ni secciones). */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var HERO = 168, FLOTA = 132;

  /* ── qué dice: siempre EXPLICA EL SERVICIO, nunca el dolor ── */
  var TEXTOS = {
    hero:      { k: 'Soy Tuia', t: 'Si necesitas ayuda para entender algo, haz clic en mí.', g: 'feliz' },
    problema:  { k: 'Qué hacemos', t: 'Para que tu negocio avance más rápido hacen falta las piezas correctas: alguien que conteste, alguien que agende y una página que te haga visible. Nosotros te las montamos y las dejamos trabajando juntas.', g: 'pensando' },
    'wa-demo': { k: 'Qué hacemos', t: 'Te armamos un agente adaptado a tu negocio. Contesta con tu información — precios, horarios, servicios — y agenda la cita solo en tu calendario.', g: 'feliz' },
    flow:      { k: 'Qué hacemos', t: 'Todo funciona con lo que ya usas: tu mismo WhatsApp y tu mismo calendario. No instalas nada nuevo.', g: 'pensando' },
    llamadas:  { k: 'Qué hacemos', t: 'Aquí tienes un ejemplo de cómo se oiría una llamada a tu negocio: la voz contesta, resuelve la duda y aparta la cita sola. Así de natural.', g: 'pensando' },
    pwsec:     { k: 'Qué hacemos', t: 'Así construimos tu página: con tus fotos, tus videos y tus servicios reales. Hecha para que la gente te ubique y te encuentre en Google, no una plantilla.', g: 'feliz' },
    comp:      { k: 'Qué hacemos', t: 'Te dejamos un negocio que contesta siempre, no cuando alguien alcanza.', g: 'pensando' },
    'videos-ia': { k: 'Qué hacemos', t: 'Te hacemos los videos de tus redes con IA. Nos das una foto de tu producto y te lo entregamos listo para publicar.', g: 'guino' },
    industrias:{ k: 'Qué hacemos', t: 'Adaptamos el agente al giro de tu negocio: no le habla igual al cliente de una barbería que al de una clínica.', g: 'pensando' },
    stats:     { k: 'Qué esperar', t: 'Estos números salen de negocios que ya trabajan así. El tuyo puede dar más o menos, pero la idea de fondo no cambia: dejar de perder a quien ya te estaba buscando.', g: 'pensando' },
    extras:    { k: 'Qué hacemos', t: 'Conectamos las apps que ya usas para que lo repetitivo se haga solo: facturas, reportes, inventario y avisos.', g: 'pensando' },
    contacto:  { k: 'Qué hacemos', t: 'Llenas cuatro datos, se abre tu WhatsApp con el mensaje ya escrito, y nosotros te armamos la preview sin costo.', g: 'feliz' },
    legales:   { k: 'Aviso de privacidad', t: '&Eacute;ste es nuestro aviso de privacidad. Léelo para saber a detalle qué datos guardamos, cuáles no, y cómo puedes pedirnos que los borremos.', g: 'pensando' }
  };

  var PASEO = {
    problema: [0.74, 0.24], 'wa-demo': [0.28, 0.58], flow: [0.80, 0.30],
    llamadas: [0.34, 0.62], pwsec: [0.72, 0.26], comp: [0.30, 0.55],
    'videos-ia': [0.82, 0.30], industrias: [0.36, 0.62], stats: [0.70, 0.27],
    extras: [0.32, 0.58], contacto: [0.66, 0.40], legales: [0.70, 0.34]
  };

  var CSS = '' +
    '#tuia{position:fixed;left:0;top:0;z-index:70;will-change:transform;pointer-events:none}' +
    '#tuiaSvg{display:block;width:100%;height:100%;overflow:visible;cursor:pointer;pointer-events:auto;' +
      'filter:drop-shadow(0 14px 40px rgba(201,168,76,.32))}' +
    '#tuia .ojos{transition:transform .32s cubic-bezier(.2,.8,.2,1)}' +
    '#tuia .ojo{display:none}' +
    '#tuiaSvg[data-gesto="normal"] .g-normal{display:block}' +
    '#tuiaSvg[data-gesto="feliz"] .g-feliz{display:block}' +
    '#tuiaSvg[data-gesto="guino"] .g-guino{display:block}' +
    '#tuiaSvg[data-gesto="pensando"] .g-pensando{display:block}' +
    '#tuiaSvg[data-gesto="dormido"] .g-dormido{display:block}' +
    '@keyframes tuiaParpadea{0%,93%,100%{transform:scaleY(1)}96.5%{transform:scaleY(.1)}}' +
    '#tuiaSvg[data-gesto="normal"] .g-normal{animation:tuiaParpadea 5.2s infinite;transform-origin:60px 61px}' +
    '@keyframes tuiaZzz{0%,100%{opacity:.2;transform:translate(0,0)}50%{opacity:.9;transform:translate(3px,-7px)}}' +
    '#tuia .zzz{animation:tuiaZzz 2.6s ease-in-out infinite}' +
    '#tuiaGlobo{position:fixed;z-index:71;max-width:300px;' +
      'background:linear-gradient(168deg,rgba(23,19,11,.985),rgba(11,11,11,.985));' +
      'border:1px solid rgba(201,168,76,.34);border-radius:18px;padding:16px 42px 17px 19px;' +
      'box-shadow:0 22px 60px rgba(0,0,0,.66),inset 0 1px 0 rgba(255,244,207,.07);' +
      'opacity:0;transform:translateY(8px) scale(.96);' +
      'transition:opacity .38s cubic-bezier(.2,.8,.2,1),transform .38s cubic-bezier(.2,.8,.2,1);' +
      'pointer-events:none;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
      "font-family:'Instrument Sans',system-ui,sans-serif}" +
    '#tuiaGlobo.on{opacity:1;transform:none;pointer-events:auto}' +
    "#tuiaGlobo b{display:block;font-family:'Space Grotesk',sans-serif;font-size:.76rem;font-weight:700;" +
      'letter-spacing:.15em;text-transform:uppercase;color:#dfc06a;margin-bottom:9px}' +
    '#tuiaGlobo span{display:block;font-size:.98rem;line-height:1.62;color:#e4e4e4}' +
    '#tuiaX{position:absolute;top:9px;right:9px;width:26px;height:26px;border:none;border-radius:50%;' +
      'background:rgba(255,255,255,.06);color:#9c9c9c;font-size:17px;line-height:1;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;padding:0;transition:background .2s,color .2s;' +
      "font-family:'Instrument Sans',system-ui,sans-serif}" +
    '#tuiaX:hover{background:rgba(201,168,76,.18);color:#dfc06a}' +
    '#tuiaGlobo::before{content:"";position:absolute;left:var(--px,26px);width:11px;height:11px;' +
      'background:rgb(23,19,11);transform:translateX(-50%) rotate(45deg);border-radius:2px}' +
    '#tuiaGlobo:not(.abajo)::before{top:-6px;border-left:1px solid rgba(201,168,76,.34);border-top:1px solid rgba(201,168,76,.34)}' +
    '#tuiaGlobo.abajo::before{bottom:-6px;border-right:1px solid rgba(201,168,76,.34);border-bottom:1px solid rgba(201,168,76,.34)}';

  var SVG = '' +
    '<svg id="tuiaSvg" data-gesto="normal" viewBox="0 0 120 120" role="img" aria-label="Tuia, asistente de la página">' +
    '<defs><linearGradient id="tuiaOro" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#fff4cf"/><stop offset="48%" stop-color="#dfc06a"/><stop offset="100%" stop-color="#ab8636"/>' +
    '</linearGradient>' +
    '<filter id="tuiaBr" x="-60%" y="-60%" width="220%" height="220%">' +
    '<feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<path id="tuiaAro" d="M114 60 a54 20 0 1 1 -108 0 a54 20 0 1 1 108 0"/></defs>' +
    '<ellipse cx="60" cy="60" rx="54" ry="20" fill="none" stroke="#c9a84c" stroke-width="2" opacity=".26"/>' +
    '<circle cx="60" cy="60" r="34" fill="url(#tuiaOro)" filter="url(#tuiaBr)"/>' +
    '<g class="ojos" id="tuiaOjos">' +
    '<g class="ojo g-normal"><rect x="45" y="52" width="9" height="18" rx="4.5" fill="#0a0a0a"/>' +
    '<rect x="66" y="52" width="9" height="18" rx="4.5" fill="#0a0a0a"/></g>' +
    '<g class="ojo g-feliz" fill="none" stroke="#0a0a0a" stroke-width="5.4" stroke-linecap="round">' +
    '<path d="M44 65 q5.5 -9 11 0"/><path d="M65 65 q5.5 -9 11 0"/></g>' +
    '<g class="ojo g-guino"><rect x="45" y="52" width="9" height="18" rx="4.5" fill="#0a0a0a"/>' +
    '<path d="M65 62 q5.5 -7 11 0" fill="none" stroke="#0a0a0a" stroke-width="5.4" stroke-linecap="round"/></g>' +
    '<g class="ojo g-pensando"><rect x="45" y="50" width="9" height="15" rx="4.5" fill="#0a0a0a"/>' +
    '<rect x="66" y="50" width="9" height="15" rx="4.5" fill="#0a0a0a"/></g>' +
    '<g class="ojo g-dormido" fill="none" stroke="#0a0a0a" stroke-width="5" stroke-linecap="round">' +
    '<path d="M44 61 q5.5 6 11 0"/><path d="M65 61 q5.5 6 11 0"/>' +
    '<g class="zzz" fill="#0a0a0a" stroke="none" font-family="\'Space Grotesk\',sans-serif" font-weight="700">' +
    '<text x="86" y="36" font-size="11">z</text><text x="95" y="27" font-size="8">z</text></g></g></g>' +
    '<circle cx="49" cy="48" r="6" fill="#fff8e2" opacity=".34"/>' +
    '<g>' +
    '<circle r="4.6" fill="#fff8e2">' +
    '<animateMotion dur="6s" begin="-0.42s" repeatCount="indefinite"><mpath href="#tuiaAro"/></animateMotion>' +
    '<animate attributeName="opacity" values="1;1;.12;.12;1" keyTimes="0;.5;.62;.9;1" dur="6s" repeatCount="indefinite"/>' +
    '<animate attributeName="r" values="4.6;4.6;2.3;2.3;4.6" keyTimes="0;.5;.62;.9;1" dur="6s" repeatCount="indefinite"/></circle>' +
    '<circle r="3.9" fill="#fff4cf" opacity=".62">' +
    '<animateMotion dur="6s" begin="-0.28s" repeatCount="indefinite"><mpath href="#tuiaAro"/></animateMotion>' +
    '<animate attributeName="opacity" values=".62;.62;.07;.07;.62" keyTimes="0;.5;.62;.9;1" dur="6s" repeatCount="indefinite"/></circle>' +
    '<circle r="3.2" fill="#fff4cf" opacity=".38">' +
    '<animateMotion dur="6s" begin="-0.15s" repeatCount="indefinite"><mpath href="#tuiaAro"/></animateMotion>' +
    '<animate attributeName="opacity" values=".38;.38;.05;.05;.38" keyTimes="0;.5;.62;.9;1" dur="6s" repeatCount="indefinite"/></circle>' +
    '<circle r="2.5" fill="#fff4cf" opacity=".2">' +
    '<animateMotion dur="6s" repeatCount="indefinite"><mpath href="#tuiaAro"/></animateMotion>' +
    '<animate attributeName="opacity" values=".2;.2;.03;.03;.2" keyTimes="0;.5;.62;.9;1" dur="6s" repeatCount="indefinite"/></circle>' +
    '</g></svg>';

  function arranca() {
    if (document.getElementById('tuia')) return;

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var cont = document.createElement('div'); cont.id = 'tuia'; cont.innerHTML = SVG;
    document.body.appendChild(cont);
    var globo = document.createElement('div'); globo.id = 'tuiaGlobo';
    globo.innerHTML = '<button id="tuiaX" type="button" aria-label="Cerrar mensaje">&times;</button>' +
                      '<b></b><span></span>';
    document.body.appendChild(globo);

    var svg = document.getElementById('tuiaSvg'),
        ojos = document.getElementById('tuiaOjos'),
        gTit = globo.querySelector('b'),
        gTxt = globo.querySelector('span'),
        gX   = document.getElementById('tuiaX'),
        hero = document.querySelector('.hero'),
        titulo = hero ? hero.querySelector('h1') : null;

    /* en legales.html no hay hero: Tuia arranca ya flotando */
    var suelta = !hero || !titulo;

    var x = 0, y = 0, tam = suelta ? FLOTA : HERO, tx = 0, ty = 0, ttam = tam, rx = 0, ry = 0;
    var px0 = 0.7, py0 = 0.42, tpx = 0.7, tpy = 0.42;
    var mx = null, my = null, t0 = performance.now();
    var sec = suelta ? 'legales' : 'hero', gestoHasta = 0, hablando = false;
    var ultima = Date.now(), dormida = false;
    var vuelta = 0, vueltaIni = 0, girando = false, yaGiro = suelta, yaFinal = false;

    if (suelta) { tpx = PASEO.legales[0]; tpy = PASEO.legales[1]; px0 = tpx; py0 = tpy; }

    function chica() { return window.innerWidth < 900; }

    function columna() {
      var c = document.querySelector('#contacto .ctn') || document.querySelector('.ctn') ||
              document.querySelector('.wrap') || document.body;
      var r = c.getBoundingClientRect();
      var pad = parseFloat(getComputedStyle(c).paddingRight) || 0;
      var d = Math.min(r.right - pad, window.innerWidth);
      return { d: d, libre: window.innerWidth - d };
    }

    function gesto(g, ms) { svg.dataset.gesto = g; gestoHasta = Date.now() + (ms || 1400); }
    setInterval(function () {
      if (Date.now() < gestoHasta) return;
      svg.dataset.gesto = dormida ? 'dormido' : 'normal';
    }, 250);
    setInterval(function () {
      if (dormida || Date.now() < gestoHasta) return;
      if (Math.random() < 0.45) gesto('guino', 950);
    }, 21000);
    function despierta() {
      ultima = Date.now();
      if (dormida) { dormida = false; gesto('pensando', 900); }
    }
    setInterval(function () {
      if (!dormida && Date.now() - ultima > 30000 && !hablando) { dormida = true; svg.dataset.gesto = 'dormido'; }
    }, 1000);
    ['mousemove', 'scroll', 'touchstart', 'keydown'].forEach(function (e) {
      window.addEventListener(e, despierta, { passive: true });
    });

    /* la vuelta: un giro COMPLETO recorriendo un rizo, para que se vea
       que da la vuelta y no que se teletransporta */
    function daVuelta() {
      if (yaGiro) return;
      yaGiro = true; girando = true; vueltaIni = performance.now();
      gesto('pensando', 1200);
    }
    window.addEventListener('scroll', function () { if (window.scrollY > 40) daVuelta(); }, { passive: true });

    var tHablar = null;
    function cierra() {
      globo.classList.remove('on'); hablando = false; clearTimeout(tHablar);
    }
    gX.addEventListener('click', function (e) { e.stopPropagation(); cierra(); });

    function hablar(k, t, g, ms) {
      gTit.innerHTML = k; gTxt.innerHTML = t;
      globo.classList.add('on');
      colocaGlobo();                 /* se fija aqui y ya no se mueve */
      hablando = true;
      gesto(g || 'feliz', 1500);
      clearTimeout(tHablar);
      tHablar = setTimeout(function () { globo.classList.remove('on'); hablando = false; }, ms || 7500);
    }
    function diSeccion() { var d = TEXTOS[sec] || TEXTOS.hero; hablar(d.k, d.t, d.g, 8000); }
    svg.addEventListener('click', function () {
      despierta();
      if (globo.classList.contains('on')) { cierra(); return; }
      diSeccion();
      try { if (window.TD && TD.ev) TD.ev('tuia_click', sec); } catch (e) { }
    });

    /* Qué sección se está viendo. NO se usa IntersectionObserver: las demos
       de WhatsApp y llamadas son más altas que varias pantallas y nunca
       llegan al umbral de visibilidad, así que nunca disparaban. Se busca
       la sección que cruza el centro de la pantalla, que sí funciona
       con secciones de cualquier alto. */
    if (!suelta) {
      var secciones = [];
      Object.keys(TEXTOS).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) secciones.push({ id: id, el: el });
      });
      if (hero) secciones.unshift({ id: 'hero', el: hero });

      function cual() {
        var centro = window.innerHeight / 2;
        for (var i = 0; i < secciones.length; i++) {
          var r = secciones[i].el.getBoundingClientRect();
          if (r.top <= centro && r.bottom >= centro) return secciones[i].id;
        }
        return null;
      }

      var revisando = false;
      function revisa() {
        var s = cual();
        if (!s || s === sec) return;
        sec = s;
        if (s in PASEO) { tpx = PASEO[s][0]; tpy = PASEO[s][1]; }
        if (!hablando && s !== 'hero') gesto('pensando', 900);
        /* si el globo está abierto, cambia el mensaje al de la sección nueva */
        if (hablando && TEXTOS[s]) diSeccion();
        if (s === 'contacto' && !yaFinal) { yaFinal = true; setTimeout(diSeccion, 900); }
      }
      window.addEventListener('scroll', function () {
        if (revisando) return;
        revisando = true;
        requestAnimationFrame(function () { revisando = false; revisa(); });
      }, { passive: true });
      setTimeout(revisa, 400);
    }

    function objetivo() {
      var W = window.innerWidth, H = window.innerHeight;
      var e = 1;
      if (!suelta) {
        var p = Math.max(0, Math.min(1, window.scrollY / (hero.offsetHeight * 0.5)));
        e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      }

      var col = columna();
      var cabe = Math.max(96, Math.min(FLOTA, col.libre - 22));
      var heroTam = chica() ? 104 : HERO;
      var flotaTam = chica() ? 78 : cabe;
      ttam = suelta ? flotaTam : heroTam + (flotaTam - heroTam) * e;

      var hx = 0, hy = 0;
      if (!suelta) {
        var r = titulo.getBoundingClientRect();
        hx = Math.min(r.right - ttam * 0.34, W - ttam - 12);
        hy = Math.max(r.top - ttam * 0.60, 12);
      }

      var ax, ay;
      if (chica()) {
        ax = W - ttam - 14;
        ay = H - ttam - 16;
      } else {
        var x0 = col.d + 10, x1 = W - ttam - 12;
        if (x1 < x0) { x0 = x1 = Math.max(8, W - ttam - 12); }
        ax = x0 + (x1 - x0) * px0;
        ay = 16 + (H - ttam - 32) * py0;
      }

      tx = suelta ? ax : hx + (ax - hx) * e;
      ty = suelta ? ay : hy + (ay - hy) * e;
      ty = Math.max(8, Math.min(H - ttam - 8, ty));
    }

    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
    }, { passive: true });
    function mirar() {
      if (mx === null) return;
      var ox = rx + tam / 2, oy = ry + tam / 2;
      var dx = (mx - ox) / (tam / 2), dy = (my - oy) / (tam / 2);
      dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
      ojos.style.transform = 'translate(' + (dx * 4.6).toFixed(2) + 'px,' + (dy * 3.5).toFixed(2) + 'px)';
    }

    function colocaGlobo() {
      var W = window.innerWidth, H = window.innerHeight, cx = rx + tam / 2;
      globo.style.right = 'auto';
      var col = columna();
      globo.style.maxWidth = chica() ? Math.min(300, W - 28) + 'px'
        : Math.max(210, Math.min(320, W - col.d - 32)) + 'px';
      var bw = globo.offsetWidth || 260, bh = globo.offsetHeight || 96;
      var arriba, top;
      if (chica()) { arriba = true; top = Math.max(14, ry - bh - 14); }
      else {
        arriba = false; top = ry + tam + 14;
        if (top + bh > H - 14) { arriba = true; top = Math.max(14, ry - bh - 14); }
      }
      var left = Math.max(14, Math.min(W - bw - 14, cx - bw / 2));
      globo.style.left = left + 'px';
      globo.style.top = Math.max(14, Math.min(H - bh - 14, top)) + 'px';
      globo.classList.toggle('abajo', arriba);
      globo.style.setProperty('--px', Math.max(16, Math.min(bw - 16, cx - left)) + 'px');
    }

    function paso() {
      px0 += (tpx - px0) * 0.022;
      py0 += (tpy - py0) * 0.022;
      objetivo();
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      tam += (ttam - tam) * 0.06;

      var t = (performance.now() - t0) / 1000, amp = chica() ? 6 : 15;
      var fx = Math.sin(t * 0.62) * amp * 0.8 + Math.sin(t * 0.34 + 2.1) * amp * 0.55;
      var fy = Math.sin(t * 0.83 + 1.3) * amp + Math.sin(t * 0.47 + 0.6) * amp * 0.6;
      var giro = Math.sin(t * 0.44 + 0.9) * 3;

      /* el rizo: mientras gira, recorre un círculo pequeño. Así se ve que
         DA la vuelta; sin esto un giro de 360° en una bola parece un salto. */
      var lx = 0, ly = 0;
      if (girando) {
        var v = (performance.now() - vueltaIni) / 1500;
        if (v >= 1) { girando = false; vuelta = 0; }
        else {
          var s = v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
          vuelta = 360 * s;
          var a = s * Math.PI * 2, R = tam * 0.34;
          lx = Math.sin(a) * R;
          ly = (Math.cos(a) - 1) * R;
        }
      }

      rx = x + fx + lx; ry = y + fy + ly;
      var W2 = window.innerWidth;
      rx = Math.max(6, Math.min(W2 - tam - 6, rx));
      ry = Math.max(6, Math.min(window.innerHeight - tam - 6, ry));
      if (!chica() && (suelta || window.scrollY > 40) && !girando) {
        var lim = columna().d + 6;
        if (lim + tam <= W2 - 6) rx = Math.max(lim, rx);
      }

      cont.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0) rotate(' + (giro + vuelta).toFixed(2) + 'deg)';
      cont.style.width = tam.toFixed(1) + 'px';
      cont.style.height = tam.toFixed(1) + 'px';
      mirar();
      if (!globo.classList.contains('on')) colocaGlobo();
      requestAnimationFrame(paso);
    }

    if (suelta) {
      x = tx = window.innerWidth - FLOTA - 40; y = ty = window.innerHeight * 0.36;
    } else {
      x = tx = window.innerWidth - HERO; y = ty = window.innerHeight * 0.4;
    }
    rx = x; ry = y;
    requestAnimationFrame(paso);

    setTimeout(function () { var d = TEXTOS[sec] || TEXTOS.hero; hablar(d.k, d.t, d.g, 7500); }, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca);
  else arranca();
  /* si vuelves con el botón de atrás, la página sale del caché: hay que
     asegurarse de que Tuia siga ahí */
  window.addEventListener('pageshow', function (e) { if (e.persisted) arranca(); });
})();
