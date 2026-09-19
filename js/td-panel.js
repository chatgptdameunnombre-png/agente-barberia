(function () {
  var API = "AIzaSyDZZK2IeuHYrvFSn-R-9v6xfY33s1X7vjo";
  var PID = "tuagentedeia-4f2a1";
  var FS = "https://firestore.googleapis.com/v1/projects/" + PID + "/databases/(default)/documents";
  var IDT = "https://identitytoolkit.googleapis.com/v1/accounts";
  var TOK = "https://securetoken.googleapis.com/v1/token?key=" + API;
  var K_RT = "td_panel_rt";
  var TZ = "America/Mexico_City";

  var token = null, visitas = [], mostradas = 0, PAGINA = 25;

  var $ = function (id) { return document.getElementById(id); };
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ls_(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ═══ sesión del dueño ═══ */
  function entrar(mail, pass) {
    return fetch(IDT + ":signInWithPassword?key=" + API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: mail, password: pass, returnSecureToken: true })
    }).then(function (r) {
      if (!r.ok) throw new Error("credenciales");
      return r.json();
    }).then(function (d) {
      token = d.idToken;
      ls_(K_RT, d.refreshToken);
    });
  }

  function refrescar() {
    var rt = ls(K_RT);
    if (!rt) return Promise.reject();
    return fetch(TOK, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(rt)
    }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { token = d.id_token; });
  }

  /* ═══ lectura ═══ */
  var CAMPOS = ["inicio", "fin", "duracion", "aparato", "origen", "pantalla",
    "maxScroll", "secciones", "hitos", "form", "nombre", "mensajes"];

  function leer() {
    return fetch(FS + ":runQuery", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "sesiones" }],
          orderBy: [{ field: { fieldPath: "inicio" }, direction: "DESCENDING" }],
          limit: 400,
          select: { fields: CAMPOS.map(function (f) { return { fieldPath: f }; }) }
        }
      })
    }).then(function (r) {
      if (!r.ok) throw new Error("lectura " + r.status);
      return r.json();
    }).then(function (j) {
      return (j || []).filter(function (x) { return x.document; }).map(function (x) {
        var d = plano(x.document.fields || {});
        d.id = x.document.name.split("/").pop();
        return d;
      });
    });
  }

  function eventosDe(id) {
    return fetch(FS + "/sesiones/" + id + "?mask.fieldPaths=eventos", {
      headers: { Authorization: "Bearer " + token }
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.fields || !j.fields.eventos) return [];
        return plano(j.fields).eventos || [];
      });
  }

  function valor(v) {
    if (!v || typeof v !== "object") return v;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return parseInt(v.integerValue, 10);
    if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("timestampValue" in v) return v.timestampValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(valor);
    if ("mapValue" in v) return plano(v.mapValue.fields || {});
    return null;
  }
  function plano(f) {
    var o = {};
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) o[k] = valor(f[k]);
    return o;
  }

  /* ═══ formato ═══ */
  function fecha(iso) {
    try {
      return new Date(iso).toLocaleString("es-MX", {
        timeZone: TZ, day: "numeric", month: "short",
        hour: "numeric", minute: "2-digit", hour12: true
      }).replace(/\./g, "");
    } catch (e) { return "\u2014"; }
  }
  function dur(s) {
    s = Math.round(s || 0);
    if (s < 60) return s + " s";
    var m = Math.floor(s / 60);
    return m + " min" + (s % 60 ? " " + (s % 60) + " s" : "");
  }
  function reloj(ms) {
    var s = Math.round((ms || 0) / 1000);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  function mismoDia(iso, d) {
    try {
      return new Date(iso).toLocaleDateString("es-MX", { timeZone: TZ })
        === d.toLocaleDateString("es-MX", { timeZone: TZ });
    } catch (e) { return false; }
  }
  function haceDias(iso, n) { return (Date.now() - new Date(iso).getTime()) < n * 86400000; }

  var SECS = {
    inicio: "el inicio", problema: "el problema", "wa-demo": "la demo de WhatsApp",
    llamadas: "la demo de llamadas", comp: "la comparaci\u00f3n", "videos-ia": "los videos con IA",
    industrias: "las industrias", stats: "los n\u00fameros", extras: "las automatizaciones",
    flow: "c\u00f3mo funciona", contacto: "el formulario"
  };

  function frase(e) {
    var n = e.e, d = e.d || "";
    if (n === "entro") return "Entr\u00f3 a la p\u00e1gina";
    if (n === "seccion") return "Estuvo en " + (SECS[d] || d);
    if (n === "scroll") return "Baj\u00f3 el " + d;
    if (n === "click_whatsapp") return "Toc\u00f3 WhatsApp" + (d ? " (" + d + ")" : "");
    if (n === "click_telefono") return "Toc\u00f3 llamar";
    if (n === "form_inicio") return "Empez\u00f3 a llenar el formulario";
    if (n === "form_negocio") return /si/.test(d) ? "Dijo que s\u00ed es para un negocio" : "Dijo que no es para un negocio";
    if (n === "form_interes") return "Marc\u00f3: " + d.replace(/^v:\s*/, "");
    if (n === "form_enviado") return "Mand\u00f3 el formulario";
    if (n === "se_fue") return "Se fue";
    return n + (d ? " \u00b7 " + d : "");
  }

  /* ═══ pintado ═══ */
  function cuenta(a, f) { return a.filter(f).length; }
  function tiene(v, h) { return (v.hitos || []).indexOf(h) !== -1; }
  function quien(v) {
    return (v.nombre && v.nombre.trim()) || (v.form && v.form.nombre) || "";
  }

  function pinta() {
    var hoy = new Date();
    var deHoy = cuenta(visitas, function (v) { return mismoDia(v.inicio, hoy); });
    var de7 = cuenta(visitas, function (v) { return haceDias(v.inicio, 7); });
    var forms = cuenta(visitas, function (v) { return tiene(v, "Mand\u00f3 el formulario"); });
    var was = cuenta(visitas, function (v) { return tiene(v, "Toc\u00f3 WhatsApp"); });
    var prom = visitas.length
      ? visitas.reduce(function (a, v) { return a + (v.duracion || 0); }, 0) / visitas.length : 0;

    $("sub").textContent = visitas.length
      ? visitas.length + " visitas registradas \u00b7 la m\u00e1s reciente el " + fecha(visitas[0].inicio)
      : "Todav\u00eda no hay visitas registradas.";

    $("cards").innerHTML = [
      ["" + deHoy, "Visitas hoy"],
      ["" + de7, "Visitas en 7 d\u00edas"],
      ["" + forms, "Formularios enviados"],
      ["" + was, "Tocaron WhatsApp"],
      [dur(prom), "Tiempo promedio"]
    ].map(function (c) {
      return '<div class="card"><div class="n">' + esc(c[0]) + '</div><div class="t">' + c[1] + "</div></div>";
    }).join("");

    var tot = visitas.length || 1;
    [
      ["Entraron a la p\u00e1gina", visitas.length],
      ["Vieron la demo de WhatsApp", cuenta(visitas, function (v) { return tiene(v, "Vio la demo de WhatsApp"); })],
      ["Vieron la demo de llamadas", cuenta(visitas, function (v) { return tiene(v, "Vio la demo de llamadas"); })],
      ["Llegaron al formulario", cuenta(visitas, function (v) { return tiene(v, "Lleg\u00f3 al formulario"); })],
      ["Lo empezaron a llenar", cuenta(visitas, function (v) { return tiene(v, "Empez\u00f3 el formulario"); })],
      ["Lo mandaron", forms]
    ].forEach(function (p, i, arr) {
      if (i === 0) $("embudo").innerHTML = "";
      var pc = Math.round((p[1] / tot) * 100);
      $("embudo").insertAdjacentHTML("beforeend",
        '<div class="paso"><div class="paso-top"><b>' + p[0] + "</b><span>" + p[1] + " \u00b7 " + pc +
        '%</span></div><div class="barra"><i style="width:' + pc + '%"></i></div></div>');
    });

    $("origenes").innerHTML = lista(agrupa(visitas, function (v) { return v.origen || "Directo"; }));
    $("aparatos").innerHTML = lista(agrupa(visitas, function (v) { return v.aparato || "\u2014"; }));

    var ints = {};
    visitas.forEach(function (v) {
      var s = v.form && v.form.interes;
      if (!s) return;
      s.split(",").forEach(function (x) { x = x.trim(); if (x) ints[x] = (ints[x] || 0) + 1; });
    });
    var ordI = Object.keys(ints).map(function (k) { return [k, ints[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });
    $("intereses").innerHTML = ordI.length ? lista(ordI)
      : '<p class="vacio">Nadie ha mandado el formulario todav\u00eda.</p>';

    pintaMensajes();

    $("numVis").textContent = visitas.length;
    mostradas = 0;
    $("visitas").innerHTML = "";
    masVisitas();
  }

  function agrupa(arr, f) {
    var m = {};
    arr.forEach(function (v) { var k = f(v); m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return [k, m[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });
  }
  function lista(pares) {
    if (!pares.length) return '<p class="vacio">Sin datos todav\u00eda.</p>';
    return pares.map(function (p) {
      return '<div class="fila"><b>' + esc(p[0]) + "</b><span>" + p[1] + "</span></div>";
    }).join("");
  }

  /* ═══ mensajes ═══ */
  function pintaMensajes() {
    var todos = [];
    visitas.forEach(function (v) {
      (v.mensajes || []).forEach(function (m) {
        todos.push({
          nombre: m.nombre || quien(v) || "Sin nombre",
          negocio: m.negocio || (v.form && v.form.negocio) || "",
          giro: (v.form && v.form.giro) || "",
          maps: (v.form && v.form.maps) || "",
          texto: m.texto || "",
          cuando: m.cuando || v.inicio,
          origen: v.origen || "Directo",
          aparato: v.aparato || ""
        });
      });
    });
    todos.sort(function (a, b) { return new Date(b.cuando) - new Date(a.cuando); });

    $("numMsg").textContent = todos.length;
    $("mensajes").innerHTML = todos.length ? todos.map(function (m) {
      var sub = m.negocio ? m.negocio + (m.giro ? " \u00b7 " + m.giro : "") : (m.giro || "");
      var pie = '<button class="lnk" data-copiar="1">Copiar mensaje</button>';
      if (m.maps && /^https?:/.test(m.maps)) {
        pie += '<a class="lnk" href="' + esc(m.maps) + '" target="_blank" rel="noopener">Ver en Google Maps \u2197</a>';
      }
      return '<article class="msg"><div class="msg-top"><div><div class="msg-nom">' + esc(m.nombre) + "</div>" +
        (sub ? '<div class="msg-neg">' + esc(sub) + "</div>" : "") +
        '</div><div class="msg-cuando">' + esc(fecha(m.cuando)) + "</div></div>" +
        '<div class="msg-txt">' + esc(m.texto) + "</div>" +
        '<div class="msg-pie">' + pie + "</div></article>";
    }).join("") : '<p class="vacio">Todav\u00eda nadie ha mandado el formulario.<br>Cuando alguien lo haga, aqu\u00ed aparece su nombre y el mensaje completo que se llev\u00f3 a WhatsApp.</p>';

    Array.prototype.forEach.call($("mensajes").querySelectorAll("[data-copiar]"), function (b) {
      b.onclick = function () {
        var t = b.closest(".msg").querySelector(".msg-txt").textContent;
        try {
          navigator.clipboard.writeText(t);
          b.textContent = "Copiado";
          setTimeout(function () { b.textContent = "Copiar mensaje"; }, 1800);
        } catch (e) { }
      };
    });
  }

  /* ═══ visitas ═══ */
  function masVisitas() {
    var cont = $("visitas");
    var btn = cont.querySelector(".mas");
    if (btn) btn.remove();
    if (!visitas.length) {
      cont.innerHTML = '<p class="vacio">Todav\u00eda no hay visitas registradas.</p>';
      return;
    }

    visitas.slice(mostradas, mostradas + PAGINA).forEach(function (v) {
      var tags = (v.hitos || []).map(function (h) {
        var c = h === "Mand\u00f3 el formulario" ? "tag ok" : (h === "Toc\u00f3 WhatsApp" ? "tag wa" : "tag");
        return '<span class="' + c + '">' + esc(h) + "</span>";
      }).join("");
      var nom = quien(v);
      var d = document.createElement("div");
      d.className = "v";
      d.innerHTML =
        '<div class="v-h"><div class="v-i"><span class="v-t">' +
        (nom ? "<em>" + esc(nom) + "</em> \u00b7 " : "") + esc(fecha(v.inicio)) + "</span>" +
        '<span class="v-d">' + esc(v.origen || "Directo") + " \u00b7 " + esc(v.aparato || "") +
        " \u00b7 " + dur(v.duracion) + " \u00b7 baj\u00f3 " + (v.maxScroll || 0) + '%</span></div>' +
        '<div class="v-tags">' + (tags || '<span class="tag">Solo mir\u00f3</span>') + "</div></div>" +
        '<div class="v-b"><p class="vacio">Cargando&hellip;</p></div>';
      var cuerpo = d.querySelector(".v-b");
      d.querySelector(".v-h").onclick = function () {
        d.classList.toggle("on");
        if (d.classList.contains("on") && !d.dataset.listo) {
          d.dataset.listo = "1";
          eventosDe(v.id).then(function (evs) { cuerpo.innerHTML = detalle(v, evs); })
            .catch(function () { cuerpo.innerHTML = '<p class="vacio">No se pudo leer el detalle.</p>'; });
        }
      };
      cont.appendChild(d);
    });
    mostradas += PAGINA;
    if (mostradas < visitas.length) {
      var b = document.createElement("button");
      b.className = "mas";
      b.textContent = "Ver m\u00e1s visitas";
      b.onclick = masVisitas;
      cont.appendChild(b);
    }
  }

  function detalle(v, evs) {
    var html = "";
    if (v.form && v.form.interes) {
      html += '<div class="v-form">';
      if (v.form.nombre) html += "<b>Se llama:</b> " + esc(v.form.nombre) + "<br>";
      if (v.form.negocio) html += "<b>Negocio:</b> " + esc(v.form.negocio) + "<br>";
      if (v.form.giro) html += "<b>Giro:</b> " + esc(v.form.giro) + "<br>";
      if (v.form.tema) html += "<b>Es sobre:</b> " + esc(v.form.tema) + "<br>";
      if (v.form.automatizar) html += "<b>Quiere automatizar:</b> " + esc(v.form.automatizar) + "<br>";
      html += "<b>Le interesa:</b> " + esc(v.form.interes);
      if (v.form.maps) {
        html += '<br><b>Google Maps:</b> <a href="' + esc(v.form.maps) +
          '" target="_blank" rel="noopener" style="color:#dfc06a">abrir \u2197</a>';
      }
      html += "</div>";
    }
    evs = (evs || []).slice().sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    var lineas = [], ultimo = "";
    evs.forEach(function (e) {
      var f = frase(e);
      if (f === ultimo) return;
      ultimo = f;
      lineas.push("<li><em>" + reloj(e.t) + "</em><span>" + esc(f) + "</span></li>");
    });
    html += lineas.length ? "<ol>" + lineas.join("") + "</ol>"
      : '<p class="vacio">Sin paso a paso guardado.</p>';
    return html;
  }

  /* ═══ navegación ═══ */
  var SEC = {
    resumen: ["secResumen", "Resumen"],
    mensajes: ["secMensajes", "Mensajes"],
    visitas: ["secVisitas", "Visitas"],
    origen: ["secOrigen", "De d\u00f3nde llegan"]
  };
  function abreSec(k) {
    Object.keys(SEC).forEach(function (x) { $(SEC[x][0]).hidden = (x !== k); });
    Array.prototype.forEach.call(document.querySelectorAll(".nav-it[data-sec]"), function (b) {
      b.classList.toggle("on", b.dataset.sec === k);
    });
    $("topTtl").textContent = SEC[k][1];
    cierraNav();
    window.scrollTo(0, 0);
  }
  function abreNav() { $("nav").classList.add("abierto"); $("navFondo").classList.add("on"); }
  function cierraNav() { $("nav").classList.remove("abierto"); $("navFondo").classList.remove("on"); }

  Array.prototype.forEach.call(document.querySelectorAll(".nav-it[data-sec]"), function (b) {
    b.onclick = function () { abreSec(b.dataset.sec); };
  });
  $("ham").onclick = function () {
    $("nav").classList.contains("abierto") ? cierraNav() : abreNav();
  };
  $("navFondo").onclick = cierraNav;

  /* ═══ arranque ═══ */
  function cargar() {
    $("login").hidden = true;
    $("app").hidden = false;
    leer().then(function (d) { visitas = d; pinta(); })
      .catch(function () {
        $("sub").textContent = "No se pudieron leer las visitas. Revisa que tu correo est\u00e9 en las reglas de Firestore.";
      });
  }

  $("entrar").onclick = function () {
    var e = $("loginErr");
    e.hidden = true;
    var m = $("mail").value.trim(), p = $("pass").value;
    if (!m || !p) { e.textContent = "Escribe tu correo y contrase\u00f1a."; e.hidden = false; return; }
    entrar(m, p).then(cargar).catch(function () {
      e.textContent = "Correo o contrase\u00f1a incorrectos.";
      e.hidden = false;
    });
  };
  $("pass").addEventListener("keydown", function (ev) { if (ev.key === "Enter") $("entrar").click(); });

  $("salir").onclick = function () {
    lsDel(K_RT); token = null;
    $("app").hidden = true;
    $("login").hidden = false;
  };

  refrescar().then(cargar).catch(function () { });
})();
