(function () {
  var API = "AIzaSyDZZK2IeuHYrvFSn-R-9v6xfY33s1X7vjo";
  var PID = "tuagentedeia-4f2a1";
  var FS = "https://firestore.googleapis.com/v1/projects/" + PID + "/databases/(default)/documents";
  var IDT = "https://identitytoolkit.googleapis.com/v1/accounts";
  var TOK = "https://securetoken.googleapis.com/v1/token?key=" + API;

  var K_OPT = "td_medicion", K_RT = "td_rt", K_UID = "td_uid", K_SES = "td_ses", K_PEND = "td_pend", K_MSG = "td_msg";
  var VIDA = 3 * 60 * 60 * 1000;
  var INACTIVO = 45000;
  var TICK = 5000;

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ls_(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }

  /* ---------- aviso de medición ---------- */
  function permite() { return ls(K_OPT) !== "no"; }
  window.TDmedicion = {
    apagar: function () { ls_(K_OPT, "no"); },
    prender: function () { ls_(K_OPT, "si"); },
    estado: function () { return ls(K_OPT); }
  };

  function banner() {
    if (ls(K_OPT)) return;
    var b = document.createElement("div");
    b.id = "tdCk";
    b.style.cssText = "position:fixed;left:16px;right:16px;bottom:18px;z-index:9998;max-width:660px;margin:0 auto;background:#0c0c0c;border:1px solid #262626;border-radius:16px;padding:15px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;box-shadow:0 20px 50px rgba(0,0,0,.6);font-family:'Instrument Sans',system-ui,sans-serif";
    b.innerHTML = '<p style="flex:1;min-width:230px;margin:0;font-size:13px;color:#999;line-height:1.55">Medimos de forma anónima cómo se usa esta página para mejorarla. <a href="legales.html#medicion" style="color:#c9a84c;text-decoration:underline;white-space:nowrap">Cómo lo usamos</a></p><div style="display:flex;gap:8px"><button type="button" id="tdCkNo" style="background:none;border:1px solid #262626;color:#999;border-radius:99px;padding:9px 16px;font-size:13px;cursor:pointer;font-family:inherit">Solo lo necesario</button><button type="button" id="tdCkSi" style="background:linear-gradient(135deg,#c9a84c,#dfc06a);border:none;color:#0a0a0a;border-radius:99px;padding:9px 20px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit">Entendido</button></div>';
    document.body.appendChild(b);
    b.querySelector("#tdCkSi").onclick = function () { ls_(K_OPT, "si"); b.remove(); arranca(); };
    b.querySelector("#tdCkNo").onclick = function () {
      ls_(K_OPT, "no");
      lsDel(K_SES); lsDel(K_PEND); lsDel(K_MSG);
      ses = null; pend = []; msgs = [];
      b.remove();
    };
  }

  /* ---------- identidad ---------- */
  var token = null, uid = null;

  function post(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.ok ? r.json() : r.json().then(function (j) { throw j; }); });
  }

  function nuevoAnonimo() {
    return post(IDT + ":signUp?key=" + API, { returnSecureToken: true }).then(function (d) {
      token = d.idToken; uid = d.localId;
      ls_(K_RT, d.refreshToken); ls_(K_UID, uid);
      return uid;
    });
  }

  function identidad() {
    var rt = ls(K_RT);
    if (!rt) return nuevoAnonimo();
    return fetch(TOK, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(rt)
    }).then(function (r) {
      if (!r.ok) throw 0;
      return r.json();
    }).then(function (d) {
      token = d.id_token; uid = d.user_id;
      ls_(K_UID, uid);
      return uid;
    }).catch(function () {
      lsDel(K_RT); lsDel(K_UID); lsDel(K_SES);
      return nuevoAnonimo();
    });
  }

  /* ---------- sesión ---------- */
  var ses = null, pend = [], msgs = [], t0 = Date.now(), enviando = false, intentos = 0;

  function idNuevo() {
    var s = "abcdefghijklmnopqrstuvwxyz0123456789", r = "";
    for (var i = 0; i < 20; i++) r += s[Math.floor(Math.random() * s.length)];
    return r;
  }

  function aparato() {
    var w = window.innerWidth || screen.width;
    if (w < 768) return "Teléfono";
    if (w < 1100) return "Tablet";
    return "Computadora";
  }

  function origen() {
    try {
      var p = new URLSearchParams(location.search);
      var u = p.get("utm_source");
      if (u) return u;
      var r = document.referrer;
      if (!r) return "Directo";
      var h = new URL(r).hostname.replace(/^www\./, "");
      if (h === location.hostname) return "Directo";
      if (/instagram/.test(h)) return "Instagram";
      if (/google/.test(h)) return "Google";
      if (/facebook|fb\./.test(h)) return "Facebook";
      if (/whatsapp|wa\.me/.test(h)) return "WhatsApp";
      if (/t\.co|twitter|x\.com/.test(h)) return "X";
      if (/tiktok/.test(h)) return "TikTok";
      if (/linkedin/.test(h)) return "LinkedIn";
      return h;
    } catch (e) { return "Directo"; }
  }

  function sesionNueva() {
    return {
      id: idNuevo(),
      inicio: new Date().toISOString(),
      aparato: aparato(),
      origen: origen(),
      pantalla: (window.innerWidth || 0) + "x" + (window.innerHeight || 0),
      nombre: "",
      duracion: 0,
      maxScroll: 0,
      secciones: {},
      hitos: [],
      form: {},
      visto: Date.now()
    };
  }

  function cargaSesion() {
    try {
      var raw = ls(K_SES);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.id && Date.now() - (s.visto || 0) < VIDA) return s;
      }
    } catch (e) { }
    return sesionNueva();
  }

  function guardaSesion() {
    if (!ses) return;
    ses.visto = Date.now();
    ls_(K_SES, JSON.stringify(ses));
  }

  function cargaPend() {
    try { var r = ls(K_PEND); return r ? JSON.parse(r) : []; } catch (e) { return []; }
  }
  function guardaPend() { ls_(K_PEND, JSON.stringify(pend.slice(-200))); }
  function cargaMsgs() {
    try { var r = ls(K_MSG); return r ? JSON.parse(r) : []; } catch (e) { return []; }
  }
  function guardaMsgs() { ls_(K_MSG, JSON.stringify(msgs.slice(-20))); }

  /* ---------- eventos ---------- */
  function ev(nombre, datos) {
    if (!permite() || !ses) return;
    pend.push({ t: Date.now() - t0, e: String(nombre), d: datos ? txt(datos) : "" });
    guardaPend();
    if (nombre === "form_enviado" && datos) {
      ses.nombre = datos.nombre || ses.nombre || "";
      ses.form = {
        nombre: datos.nombre || "",
        negocio: datos.negocio || "",
        giro: datos.giro || "",
        interes: datos.interes || "",
        maps: datos.maps || "",
        tema: datos.tema || "",
        automatizar: datos.automatizar || ""
      };
      msgs.push({
        t: Date.now() - t0,
        cuando: new Date().toISOString(),
        nombre: datos.nombre || "",
        negocio: datos.negocio || "",
        texto: datos.mensaje || ""
      });
      guardaMsgs();
      hito("Mandó el formulario");
      guardaSesion();
      manda(true);
    }
    if (nombre === "form_inicio") hito("Empezó el formulario");
  }
  window.TD = { ev: ev };

  function txt(d) {
    if (typeof d === "string") return d;
    var o = [];
    for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) o.push(k + ": " + d[k]);
    return o.join(" · ");
  }

  function hito(h) {
    if (!ses) return;
    if (ses.hitos.indexOf(h) === -1) { ses.hitos.push(h); guardaSesion(); }
  }

  /* ---------- reloj de tiempo activo ---------- */
  var ultimaAccion = Date.now(), seccionActual = "";

  ["mousemove", "keydown", "scroll", "click", "touchstart", "pointerdown"].forEach(function (e) {
    window.addEventListener(e, function () { ultimaAccion = Date.now(); }, { passive: true });
  });

  function seccionEnPantalla() {
    var centro = window.innerHeight / 2, mejor = "";
    var secs = document.querySelectorAll("section[id]");
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= centro && r.bottom >= centro) { mejor = secs[i].id; break; }
    }
    if (!mejor && window.scrollY < window.innerHeight / 2) mejor = "inicio";
    return mejor;
  }

  function reloj() {
    if (document.visibilityState !== "visible") return;
    if (Date.now() - ultimaAccion > INACTIVO) return;
    ses.duracion += TICK / 1000;
    var s = seccionEnPantalla();
    if (s) {
      ses.secciones[s] = (ses.secciones[s] || 0) + TICK / 1000;
      if (s !== seccionActual) {
        seccionActual = s;
        ev("seccion", s);
      }
    }
    guardaSesion();
  }

  /* ---------- scroll ---------- */
  var tramos = [25, 50, 75, 100], marcados = {};
  function scrollDepth() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    var p = Math.round((window.scrollY / h) * 100);
    if (p > ses.maxScroll) ses.maxScroll = Math.min(100, p);
    tramos.forEach(function (t) {
      if (ses.maxScroll >= t && !marcados[t]) { marcados[t] = 1; ev("scroll", t + "%"); }
    });
  }

  /* ---------- envío ---------- */
  function val(v) {
    if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === "boolean") return { booleanValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(val) } };
    if (v && typeof v === "object") {
      var f = {};
      for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) f[k] = val(v[k]);
      return { mapValue: { fields: f } };
    }
    return { stringValue: String(v == null ? "" : v) };
  }

  function manda(urgente) {
    if (!permite() || !ses || !token || enviando) return;
    enviando = true;
    var lote = pend.slice(0, 120);
    var campos = {
      uid: val(uid),
      nombre: val(ses.nombre || ""),
      inicio: { timestampValue: ses.inicio },
      fin: { timestampValue: new Date().toISOString() },
      duracion: val(Math.round(ses.duracion)),
      aparato: val(ses.aparato),
      origen: val(ses.origen),
      pantalla: val(ses.pantalla),
      maxScroll: val(ses.maxScroll),
      secciones: val(ses.secciones),
      hitos: val(ses.hitos),
      form: val(ses.form)
    };
    var write = {
      update: { name: "projects/" + PID + "/databases/(default)/documents/sesiones/" + ses.id, fields: campos },
      updateMask: { fieldPaths: Object.keys(campos) }
    };
    var trans = [];
    if (lote.length) {
      trans.push({ fieldPath: "eventos", appendMissingElements: { values: lote.map(val) } });
    }
    var loteMsg = msgs.slice(0, 10);
    if (loteMsg.length) {
      trans.push({ fieldPath: "mensajes", appendMissingElements: { values: loteMsg.map(val) } });
    }
    if (trans.length) write.updateTransforms = trans;
    fetch(FS + ":commit", {
      method: "POST",
      keepalive: !!urgente,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ writes: [write] })
    }).then(function (r) {
      enviando = false;
      if (r.ok) {
        pend = pend.slice(lote.length);
        guardaPend();
        msgs = msgs.slice(loteMsg.length);
        guardaMsgs();
        intentos = 0;
        return;
      }
      if ((r.status === 401 || r.status === 403) && intentos < 2) {
        intentos++;
        lsDel(K_RT); lsDel(K_UID); lsDel(K_SES);
        ses = sesionNueva(); guardaSesion();
        return nuevoAnonimo().then(function () { manda(); });
      }
    }).catch(function () { enviando = false; });
  }

  /* ---------- arranque ---------- */
  var arrancado = false;
  function arranca() {
    if (arrancado || !permite()) return;
    arrancado = true;
    ses = cargaSesion();
    if (typeof ses.nombre !== "string") ses.nombre = "";
    pend = cargaPend();
    msgs = cargaMsgs();
    guardaSesion();

    identidad().then(function () {
      ev("entro", location.pathname);
      setTimeout(function () { manda(); }, 3500);
      setInterval(function () { manda(); }, 20000);
    });

    setInterval(reloj, TICK);
    window.addEventListener("scroll", scrollDepth, { passive: true });

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (/wa\.me|whatsapp/.test(h)) { ev("click_whatsapp", a.textContent.trim().slice(0, 40)); hito("Tocó WhatsApp"); }
      else if (/^tel:/.test(h)) { ev("click_telefono", h.replace("tel:", "")); hito("Tocó llamar"); }
    }, true);

    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        var id = x.target.id;
        if (id === "wa-demo") hito("Vio la demo de WhatsApp");
        if (id === "llamadas") hito("Vio la demo de llamadas");
        if (id === "videos-ia") hito("Vio los videos con IA");
        if (id === "contacto") hito("Llegó al formulario");
      });
    }, { threshold: 0.35 });
    ["wa-demo", "llamadas", "videos-ia", "contacto"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") manda(true);
    });
    window.addEventListener("pagehide", function () { ev("se_fue"); manda(true); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { banner(); arranca(); });
  } else { banner(); arranca(); }
})();
