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
  function durCorto(sg) {
    sg = Math.round(sg || 0);
    if (sg < 60) return sg + "s";
    var m = Math.floor(sg / 60), r = sg % 60;
    return m + "m" + (r ? " " + r + "s" : "");
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
    flow: "c\u00f3mo funciona", pwsec: "las p\u00e1ginas web", "llamadas-demo": "la demo de la llamada", contacto: "el formulario"
  };

  function frase(e) {
    var n = e.e, d = e.d || "";
    if (n === "entro") return "Entr\u00f3 a la p\u00e1gina";
    if (n === "pagina") return "Abri\u00f3 " + (d === "index.html" ? "el inicio" : d);
    if (n === "navega") return "Se fue a " + (d === "legales.html" ? "el aviso de privacidad" : d);
    if (n === "clic") return "Toc\u00f3 \u00ab" + d + "\u00bb";
    if (n === "tuia_click") return "Le pregunt\u00f3 a Tuia en " + (SECS[d] || d);
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
      [durCorto(prom), "Tiempo promedio"]
    ].map(function (c) {
      return '<div class="card"><div class="n">' + esc(c[0]) + '</div><div class="t">' + c[1] + "</div></div>";
    }).join("");

    var tot = visitas.length || 1;
    var pasos = [
      ["Entraron a la p\u00e1gina", visitas.length],
      ["Vieron la demo de WhatsApp", cuenta(visitas, function (v) { return tiene(v, "Vio la demo de WhatsApp"); })],
      ["Vieron la demo de llamadas", cuenta(visitas, function (v) { return tiene(v, "Vio la demo de llamadas"); })],
      ["Llegaron al formulario", cuenta(visitas, function (v) { return tiene(v, "Lleg\u00f3 al formulario"); })],
      ["Lo empezaron a llenar", cuenta(visitas, function (v) { return tiene(v, "Empez\u00f3 el formulario"); })],
      ["Lo mandaron", forms]
    ];
    $("embudo").innerHTML = visitas.length ? pasos.map(function (p, i) {
      var pc = Math.round((p[1] / tot) * 100);
      return '<div class="paso"><div class="paso-top"><b>' + p[0] + "</b><span>" + p[1] + " \u00b7 " + pc +
        '%</span></div><div class="barra"><i class="b' + (i || 1) + '" style="width:' + pc + '%"></i></div></div>';
    }).join("") : '<p class="vacio">Cuando alguien entre a tu p\u00e1gina, aqu\u00ed ves en qu\u00e9 paso se te va.</p>';

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
  function iniciales(n) {
    var ps = String(n || "").trim().split(/\s+/).filter(Boolean);
    if (!ps.length) return "?";
    return (ps[0][0] + (ps.length > 1 ? ps[ps.length - 1][0] : "")).toUpperCase();
  }

  /* El mensaje del formulario en renglones claros, en vez del texto corrido. */
  function estructura(m) {
    var filas = [];
    var quiere = String(m.interes || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    if (quiere.length) {
      filas.push(["Quiere", quiere.map(function (x) {
        return '<span class="tag oro">' + esc(x) + "</span>";
      }).join(" ")]);
    }
    if (m.auto) filas.push(["Automatizar", esc(m.auto)]);
    if (m.negocio) filas.push(["Negocio", esc(m.negocio) + (m.giro ? ' <span style="color:var(--muted)">\u00b7 ' + esc(m.giro) + "</span>" : "")]);
    else if (m.tema) filas.push(["Es para", esc(m.tema)]);
    if (m.maps && /^https?:/.test(m.maps)) {
      filas.push(["Ubicaci\u00f3n", '<a href="' + esc(m.maps) + '" target="_blank" rel="noopener" style="color:var(--gold2)">Abrir en Google Maps \u2197</a>']);
    }
    if (!filas.length) return '<div class="msg-txt">' + esc(m.texto) + "</div>";
    return '<div class="msg-est">' + filas.map(function (f) {
      return '<div class="me"><b>' + f[0] + "</b><div>" + f[1] + "</div></div>";
    }).join("") + "</div>";
  }

  function pintaMensajes() {
    var todos = [];
    visitas.forEach(function (v) {
      (v.mensajes || []).forEach(function (m) {
        todos.push({
          sid: v.id,
          nombre: m.nombre || quien(v) || "Sin nombre",
          negocio: m.negocio || (v.form && v.form.negocio) || "",
          giro: (v.form && v.form.giro) || "",
          interes: (v.form && v.form.interes) || "",
          maps: (v.form && v.form.maps) || "",
          texto: m.texto || "",
          interes: (v.form && v.form.interes) || "",
          auto: (v.form && v.form.automatizar) || "",
          tema: (v.form && v.form.tema) || "",
          cuando: m.cuando || v.inicio,
          origen: v.origen || "Directo",
          aparato: v.aparato || ""
        });
      });
    });
    todos.sort(function (a, b) { return new Date(b.cuando) - new Date(a.cuando); });

    $("numMsg").textContent = todos.length;
    $("mensajes").innerHTML = todos.length ? todos.map(function (m) {
      var chips = "";
      if (m.giro) chips += '<span class="tag oro">' + esc(m.giro) + "</span>";
      if (m.origen) chips += '<span class="tag">' + esc(m.origen) + "</span>";
      if (m.aparato) chips += '<span class="tag">' + esc(m.aparato) + "</span>";

      var pie = '<button class="lnk" data-copiar="1">Copiar mensaje</button>';
      if (m.maps && /^https?:/.test(m.maps) && !m.interes) {
        pie += '<a class="lnk" href="' + esc(m.maps) + '" target="_blank" rel="noopener">Ver en Google Maps \u2197</a>';
      }
      pie += '<button class="lnk mal sep" data-borrar="' + esc(m.sid) + '">Borrar registro</button>';

      return '<article class="msg"><div class="msg-top">' +
        '<div class="msg-id"><span class="ini">' + esc(iniciales(m.nombre)) + "</span><div>" +
        '<div class="msg-nom">' + esc(m.nombre) + "</div>" +
        (m.negocio ? '<div class="msg-neg">' + esc(m.negocio) + "</div>" : "") +
        "</div></div>" +
        '<div class="msg-der"><span class="msg-cuando">' + esc(fecha(m.cuando)) + "</span>" +
        (chips ? '<div class="msg-chips">' + chips + "</div>" : "") + "</div></div>" +
        estructura(m) +
        '<details class="msg-raw"><summary>Ver el mensaje tal cual</summary><div class="msg-txt">' +
        esc(m.texto) + "</div></details>" +
        '<div class="msg-pie">' + pie + "</div></article>";
    }).join("") : '<p class="vacio">Todav\u00eda nadie ha llenado el formulario.</p>';

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

    Array.prototype.forEach.call($("mensajes").querySelectorAll("[data-borrar]"), function (b) {
      b.onclick = function () {
        var art = b.closest(".msg");
        var nom = art.querySelector(".msg-nom").textContent;
        confirmar("Borrar este registro",
          "Se borra el mensaje de <b>" + esc(nom) + "</b> y tambi\u00e9n su visita con el paso a paso. No se puede deshacer.",
          "S\u00ed, borrar").then(function (ok) {
            if (!ok) return;
            borrarSesion(b.dataset.borrar).then(function () {
              toast("Registro borrado", "bien");
            }).catch(function () { toast("No se pudo borrar", "mal"); });
          });
      };
    });
  }

  function borrarSesion(id) {
    return fetch(FS + "/sesiones/" + id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token }
    }).then(function (r) {
      if (!r.ok) throw new Error("borrado " + r.status);
      visitas = visitas.filter(function (v) { return v.id !== id; });
      pinta();
    });
  }

  /* ═══ visitas ═══ */
  function hora12(ms) {
    try {
      return new Date(ms).toLocaleTimeString("es-MX", {
        timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true
      }).replace(/\./g, "").replace(/\s+/g, " ");
    } catch (e) { return ""; }
  }
  function horaDe(inicioIso, t) {
    var base = new Date(inicioIso).getTime();
    if (!base) return "";
    return hora12(base + (t || 0));
  }
  function hace(iso) {
    var t = new Date(iso || 0).getTime();
    if (!t) return "\u2014";
    var min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return "ahorita";
    if (min < 60) return "hace " + min + " min";
    var h = Math.round(min / 60);
    if (h < 24) return "hace " + h + " h";
    var d = Math.round(h / 24);
    return d === 1 ? "ayer" : "hace " + d + " d\u00edas";
  }
  function etiquetaDe(v) {
    if (tiene(v, "Mand\u00f3 el formulario")) return ["ok", "Pidi\u00f3 su preview"];
    if (tiene(v, "Toc\u00f3 WhatsApp")) return ["wa", "Toc\u00f3 WhatsApp"];
    if (tiene(v, "Empez\u00f3 el formulario")) return ["oro", "Empez\u00f3 el formulario"];
    if (tiene(v, "Lleg\u00f3 al formulario")) return ["", "Lleg\u00f3 al formulario"];
    if ((v.duracion || 0) >= 30) return ["", "Le dio una le\u00edda"];
    return ["", "Solo pas\u00f3"];
  }

  function masVisitas() {
    var cont = $("visitas");
    var btn = cont.querySelector(".mas");
    if (btn) btn.remove();
    if (!visitas.length) {
      cont.innerHTML = '<p class="vacio">Todav\u00eda no hay visitas registradas.</p>';
      return;
    }

    visitas.slice(mostradas, mostradas + PAGINA).forEach(function (v) {
      var et = etiquetaDe(v);
      var nom = quien(v);
      var d = document.createElement("div");
      d.className = "v";
      d.innerHTML =
        '<div class="v-h"><div class="v-i">' +
        '<span class="v-t"><em class="v-cuando">' + esc(hace(v.inicio)) + "</em>" +
        (nom ? " <b>" + esc(nom) + "</b>" : " Visitante") + "</span>" +
        '<span class="v-d">' + esc(fecha(v.inicio)) + " \u00b7 " + dur(v.duracion) +
        " \u00b7 " + esc(v.aparato || "") + "</span></div>" +
        '<div class="v-tags"><span class="tag ' + et[0] + '">' + esc(et[1]) + "</span></div></div>" +
        '<div class="v-b"><p class="v-res">Lleg\u00f3 de <b>' + esc(v.origen || "directo") +
        "</b> \u00b7 estuvo <b>" + dur(v.duracion) + "</b> \u00b7 baj\u00f3 el <b>" +
        (v.maxScroll || 0) + "%</b> de la p\u00e1gina</p>" +
        (v.hitos && v.hitos.length
          ? '<div class="v-hitos">' + v.hitos.map(function (x) {
              return '<span class="tag">' + esc(x) + "</span>";
            }).join("") + "</div>"
          : "") +
        '<div class="v-acc">' +
        '<button class="lnk" data-paso="1">Ver qu\u00e9 hizo paso a paso</button>' +
        '<button class="lnk mal" data-borravis="1">Borrar esta visita</button></div>' +
        '<div class="v-paso" hidden></div></div>';

      var cuerpo = d.querySelector(".v-paso");
      d.querySelector(".v-h").onclick = function () { d.classList.toggle("on"); };

      d.querySelector("[data-paso]").onclick = function (ev) {
        ev.stopPropagation();
        var b = ev.currentTarget;
        if (!cuerpo.hidden) {
          cuerpo.hidden = true;
          b.textContent = "Ver qu\u00e9 hizo paso a paso";
          return;
        }
        cuerpo.hidden = false;
        b.textContent = "Ocultar el paso a paso";
        if (d.dataset.listo) return;
        d.dataset.listo = "1";
        cuerpo.innerHTML = '<p class="vacio">Cargando&hellip;</p>';
        eventosDe(v.id).then(function (evs) { cuerpo.innerHTML = detalle(v, evs); })
          .catch(function () { cuerpo.innerHTML = '<p class="vacio">No se pudo leer el detalle.</p>'; });
      };

      d.querySelector("[data-borravis]").onclick = function (ev) {
        ev.stopPropagation();
        confirmar("Borrar esta visita",
          "Se borra " + (nom ? "la visita de <b>" + esc(nom) + "</b>" : "esta visita") + ". No se puede deshacer.",
          "S\u00ed, borrar").then(function (ok) {
            if (!ok) return;
            borrarSesion(v.id).then(function () { toast("Visita borrada", "bien"); })
              .catch(function () { toast("No se pudo borrar", "mal"); });
          });
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
      lineas.push("<li><em>" + esc(horaDe(v.inicio, e.t) || reloj(e.t)) + "</em><span>" +
        esc(f) + "</span></li>");
    });
    html += lineas.length ? "<ol>" + lineas.join("") + "</ol>"
      : '<p class="vacio">Sin paso a paso guardado.</p>';
    return html;
  }

  /* ═══ avisos, modal y confirmación ═══ */
  var tToast = null;
  function toast(txt, tipo) {
    var t = $("toast");
    if (!t) return;
    t.textContent = txt;
    t.className = "toast on" + (tipo ? " " + tipo : "");
    clearTimeout(tToast);
    tToast = setTimeout(function () { t.className = "toast"; }, 2600);
  }

  function abreModal(html) {
    $("modal").innerHTML = html;
    $("modalFondo").classList.add("on");
    var pri = $("modal").querySelector("input,select,textarea");
    if (pri) setTimeout(function () { pri.focus(); }, 60);
  }
  function cierraModal() {
    $("modalFondo").classList.remove("on");
    $("modal").innerHTML = "";
  }

  function confirmar(titulo, htmlTexto, textoOk) {
    return new Promise(function (res) {
      abreModal('<h3>' + esc(titulo) + '</h3><p class="sub">' + htmlTexto + '</p>' +
        '<div class="modal-acc"><button class="lnk" data-no="1">Cancelar</button>' +
        '<button class="lnk mal" data-si="1">' + esc(textoOk || "Borrar") + '</button></div>');
      $("modal").querySelector("[data-no]").onclick = function () { cierraModal(); res(false); };
      $("modal").querySelector("[data-si]").onclick = function () { cierraModal(); res(true); };
    });
  }

  /* ═══ navegación ═══ */
  var SEC_NEGOCIO = ["finanzas", "clientes", "prospectos", "resenas", "piden"];
  var SEC = {
    resumen: ["secResumen", "Resumen"],
    origen: ["secOrigen", "De d\u00f3nde llegan"],
    mensajes: ["secMensajes", "Mensajes"],
    visitas: ["secVisitas", "Visitas"],
    finanzas: ["secFinanzas", "Finanzas"],
    clientes: ["secClientes", "Clientes"],
    prospectos: ["secProspectos", "Prospectos"],
    resenas: ["secResenas", "Rese\u00f1as"],
    piden: ["secPiden", "Lo que te piden"]
  };
  function abreSec(k) {
    Object.keys(SEC).forEach(function (x) { $(SEC[x][0]).hidden = (x !== k); });
    Array.prototype.forEach.call(document.querySelectorAll(".nav-it[data-sec]"), function (b) {
      b.classList.toggle("on", b.dataset.sec === k);
    });
    $("topTtl").textContent = SEC[k][1];
    cierraNav();
    window.scrollTo(0, 0);
    if (window.TDN && SEC_NEGOCIO.indexOf(k) !== -1) window.TDN.abre(k);
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
    avisaListo();
    leer().then(function (d) { visitas = d; pinta(); })
      .catch(function () {
        $("sub").textContent = "No se pudieron leer las visitas. Revisa las reglas de Firebase.";
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

  $("modalFondo").onclick = function (ev) { if (ev.target === $("modalFondo")) cierraModal(); };
  $("fichaFondo").onclick = function () {
    $("ficha").classList.remove("on");
    $("fichaFondo").classList.remove("on");
  };
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if ($("modalFondo").classList.contains("on")) return cierraModal();
    if ($("ficha").classList.contains("on")) {
      $("ficha").classList.remove("on");
      $("fichaFondo").classList.remove("on");
    }
  });

  /* ═══ lo que usa td-negocio.js ═══ */
  window.TDP = {
    FS: FS,
    TZ: TZ,
    tok: function () { return token; },
    esc: esc,
    plano: plano,
    fecha: fecha,
    toast: toast,
    modal: abreModal,
    cierraModal: cierraModal,
    confirmar: confirmar,
    listo: function (f) { pendientes.push(f); if (token) f(); }
  };

  var pendientes = [];
  function avisaListo() { pendientes.forEach(function (f) { try { f(); } catch (e) { } }); }

  refrescar().then(cargar).catch(function () { });
})();
