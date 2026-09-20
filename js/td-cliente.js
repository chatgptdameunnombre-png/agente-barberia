(function () {
  var API = "AIzaSyDZZK2IeuHYrvFSn-R-9v6xfY33s1X7vjo";
  var PID = "tuagentedeia-4f2a1";
  var FS = "https://firestore.googleapis.com/v1/projects/" + PID + "/databases/(default)/documents";
  var IDT = "https://identitytoolkit.googleapis.com/v1/accounts";
  var TOK = "https://securetoken.googleapis.com/v1/token?key=" + API;
  var K_RT = "td_cli_rt";
  var TZ = "America/Mexico_City";

  /* A dónde llega lo que pide cada cliente.
     Los de la primera camada avisan al WhatsApp personal de Kiki; el resto,
     al número del negocio. Se decide por cliente con el campo `avisaA`
     ("personal" o "negocio") desde la ficha del panel. */
  var WA = { personal: "5215563173973", negocio: "5213351261495" };

  var token = null, uid = null, cliente = null, pagos = [];
  var tipo = "", enviando = false;

  var $ = function (id) { return document.getElementById(id); };
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ls_(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var tToast = null;
  function toast(txt, clase) {
    var t = $("toast");
    t.textContent = txt;
    t.className = "toast on" + (clase ? " " + clase : "");
    clearTimeout(tToast);
    tToast = setTimeout(function () { t.className = "toast"; }, 3000);
  }

  /* ═══ sesión ═══ */
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
      uid = d.localId;
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
      .then(function (d) { token = d.id_token; uid = d.user_id; });
  }

  /* ═══ Firestore ═══ */
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
  function consulta(col, campo, val) {
    return fetch(FS + ":runQuery", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: col }],
          where: {
            fieldFilter: {
              field: { fieldPath: campo },
              op: "EQUAL",
              value: { stringValue: val }
            }
          },
          limit: 200
        }
      })
    }).then(function (r) {
      if (!r.ok) throw new Error(col + " " + r.status);
      return r.json();
    }).then(function (j) {
      return (j || []).filter(function (x) { return x.document; }).map(function (x) {
        var o = plano(x.document.fields || {});
        o.id = x.document.name.split("/").pop();
        return o;
      });
    });
  }

  /* ═══ formato ═══ */
  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function pesos(n) {
    n = Math.round(Number(n) || 0);
    return "$" + n.toLocaleString("es-MX");
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function hoyMX() {
    var f = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
    var p = f.split("-");
    return { a: +p[0], m: +p[1], d: +p[2], iso: f };
  }
  function dia(isoF) {
    if (!isoF) return "—";
    var p = String(isoF).slice(0, 10).split("-");
    if (p.length !== 3) return String(isoF);
    return +p[2] + " " + MESES[+p[1] - 1] + " " + p[0];
  }
  function diaLargo(isoF) {
    if (!isoF) return "—";
    var p = String(isoF).slice(0, 10).split("-");
    if (p.length !== 3) return String(isoF);
    return +p[2] + " de " + MESES_L[+p[1] - 1];
  }
  function ultimoDia(a, m) { return new Date(a, m, 0).getDate(); }
  function isoDe(a, m, d) {
    return a + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  function diasEntre(a, b) {
    return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
  }
  function proximaFecha(diaPago, periodicidad, inicio) {
    var h = hoyMX();
    if (periodicidad === "unico") return inicio || null;
    if (periodicidad === "anual") {
      var mesA = inicio ? +String(inicio).slice(5, 7) : h.m;
      var dA = Math.min(num(diaPago) || +String(inicio || "").slice(8, 10) || 1, ultimoDia(h.a, mesA));
      var esteAnio = isoDe(h.a, mesA, dA);
      return diasEntre(h.iso, esteAnio) >= 0 ? esteAnio
        : isoDe(h.a + 1, mesA, Math.min(num(diaPago) || dA, ultimoDia(h.a + 1, mesA)));
    }
    var d = num(diaPago) || 1;
    var esteMes = isoDe(h.a, h.m, Math.min(d, ultimoDia(h.a, h.m)));
    if (diasEntre(h.iso, esteMes) >= 0) return esteMes;
    var m = h.m + 1, a = h.a;
    if (m > 12) { m = 1; a++; }
    return isoDe(a, m, Math.min(d, ultimoDia(a, m)));
  }
  function cuando(f) {
    if (!f) return { txt: "", d: 9999 };
    var d = diasEntre(hoyMX().iso, f);
    if (d === 0) return { txt: "es hoy", d: d };
    if (d === 1) return { txt: "es mañana", d: d };
    if (d < 0) return { txt: "se pasó hace " + Math.abs(d) + " días", d: d };
    return { txt: "faltan " + d + " días", d: d };
  }
  function iniciales(n) {
    var ps = String(n || "").trim().split(/\s+/)
      .map(function (x) { return x.replace(/[^A-Za-zÀ-ſ]/g, ""); })
      .filter(Boolean);
    if (!ps.length) return "?";
    if (ps.length > 1) return (ps[0][0] + ps[1][0]).toUpperCase();
    return ps[0].slice(0, 2).toUpperCase();
  }

  /* ═══ servicios en tarjetas ═══ */
  var ICONOS = [
    [/llamad|voz|telef/i, "📞", "Contesta el teléfono por ti, a cualquier hora."],
    [/whats/i, "💬", "Responde los mensajes al instante, todos los días."],
    [/página|pagina|web|sitio/i, "🌐", "Tu página en internet, siempre disponible."],
    [/tienda|ecommerce|carrito/i, "🛒", "Tu tienda en línea con tus productos y tus cobros."],
    [/automat|proceso|reporte/i, "⚙️", "Trabajo repetitivo que ya no tienes que hacer a mano."],
    [/video/i, "🎬", "Videos para tus redes."],
    [/agenda|cita|calendar/i, "📅", "Agenda las citas solo y manda recordatorios."]
  ];
  function servicios(txt) {
    var partes = String(txt || "").split(/\s*[+,·|]\s*/).map(function (x) { return x.trim(); })
      .filter(Boolean);
    if (!partes.length) return [];
    return partes.map(function (p) {
      for (var i = 0; i < ICONOS.length; i++) {
        if (ICONOS[i][0].test(p)) return { ico: ICONOS[i][1], nom: p, des: ICONOS[i][2] };
      }
      return { ico: "✨", nom: p, des: "Servicio activo en tu cuenta." };
    });
  }

  /* ═══ pintado ═══ */
  function pinta() {
    var nombre = cliente.negocio || cliente.persona || "tu negocio";
    var saludo = cliente.persona ? "Hola, " + String(cliente.persona).split(" ")[0] : "Hola";

    $("hola").innerHTML = (cliente.foto
      ? '<img class="foto" src="' + esc(cliente.foto) + '" alt="">'
      : '<span class="foto ini">' + esc(iniciales(nombre)) + "</span>") +
      "<div><h1>" + esc(nombre) + "</h1><p>" + esc(saludo) +
      ". Aquí está tu servicio y tus pagos.</p></div>";

    var html = "";
    var pausado = cliente.estado === "pausado";
    var f = proximaFecha(cliente.diaPago, cliente.periodicidad || "mensual", cliente.inicio);
    var q = cuando(f);
    var pend = pagos.filter(function (p) { return p.estado === "pendiente"; });
    var debe = pend.reduce(function (a, p) { return a + num(p.monto); }, 0);

    /* ── próximo pago ── */
    if (debe > 0) {
      html += '<div class="prox alerta"><div class="lbl">Tienes un pago pendiente</div>' +
        '<div class="monto">' + esc(pesos(debe)) + "</div>" +
        '<div class="fecha">' + (pend.length === 1
          ? "De <b>" + esc(pend[0].concepto || "tu servicio") + "</b>"
          : "De <b>" + pend.length + " pagos</b>") + "</div>" +
        '<div class="nota">Si ya lo pagaste, avísanos aquí abajo y lo marcamos.</div></div>';
    } else if (!pausado && num(cliente.monto) > 0 && f) {
      html += '<div class="prox"><div class="lbl">Tu próximo pago</div>' +
        '<div class="monto">' + esc(pesos(cliente.monto)) + "</div>" +
        '<div class="fecha">El <b>' + esc(diaLargo(f)) + "</b> · " + esc(q.txt) + "</div>" +
        '<div class="nota">' +
        (cliente.periodicidad === "anual" ? "Se cobra una vez al año."
          : cliente.periodicidad === "unico" ? "Es un pago único."
            : "Se cobra cada mes el día " + esc(cliente.diaPago || "—") + ".") +
        " Estás al corriente.</div></div>";
    }

    /* ── servicios ── */
    var srv = servicios(cliente.servicios);
    html += '<div class="blq"><h2>Tus servicios</h2>';
    html += srv.length
      ? '<div class="srv-grid">' + srv.map(function (s) {
        return '<div class="srv"><span class="ico">' + s.ico + "</span><b>" + esc(s.nom) +
          "</b><span>" + esc(s.des) + "</span></div>";
      }).join("") + "</div>"
      : '<p class="vacio">Todavía no tenemos anotados tus servicios. Escríbenos y los ponemos.</p>';
    html += '<div class="estado' + (pausado ? " pausa" : "") + '"><span class="punto"></span>' +
      (pausado ? "Tu servicio está pausado" : "Todo funcionando") +
      (cliente.inicio ? " · con nosotros desde el " + esc(dia(cliente.inicio)) : "") +
      "</div></div>";

    /* ── pagos ── */
    var hechos = pagos.filter(function (p) { return p.estado !== "pendiente"; })
      .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    html += '<div class="blq"><h2>Tus pagos</h2>';
    if (pend.length) {
      html += pend.map(function (p) {
        return '<div class="pago pend"><div><b>' + esc(p.concepto || "Pago pendiente") +
          "</b><small>" + esc(dia(p.fecha)) + " · pendiente</small></div>" +
          '<span class="mon">' + esc(pesos(p.monto)) + "</span></div>";
      }).join("");
    }
    html += hechos.length ? hechos.map(function (p) {
      return '<div class="pago"><div><b>' + esc(p.concepto || "Pago") + "</b><small>" +
        esc(dia(p.fecha)) + (p.metodo ? " · " + esc(p.metodo) : "") + "</small></div>" +
        '<span class="mon">' + esc(pesos(p.monto)) + "</span></div>";
    }).join("") : (pend.length ? "" : '<p class="vacio">Todavía no hay pagos registrados.</p>');
    if (hechos.length) {
      var total = hechos.reduce(function (a, p) { return a + num(p.monto); }, 0);
      html += '<p class="pie-nota">Llevas ' + esc(pesos(total)) + " pagados en " +
        hechos.length + (hechos.length === 1 ? " pago." : " pagos.") + "</p>";
    }
    html += "</div>";

    /* ── pedir ── */
    html += '<div class="blq"><h2>&iquest;Necesitas algo?</h2>' +
      '<div class="pide-grid">' +
      [["Contratar otro servicio", "➕", "Quiero agregar algo a lo que ya tengo"],
       ["Pedir un cambio", "✏️", "Cambiar algo de lo que ya está hecho"],
       ["Reportar un problema", "⚠️", "Algo no está funcionando bien"],
       ["Una sugerencia", "💡", "Se me ocurre algo que estaría bueno"]
      ].map(function (t) {
        return '<button class="pide" data-tipo="' + esc(t[0]) + '"><span class="ico">' + t[1] +
          "</span><b>" + esc(t[0]) + "</b><span>" + esc(t[2]) + "</span></button>";
      }).join("") + "</div>" +
      '<textarea class="in" id="txt" placeholder="Cuéntanos con tus palabras qué necesitas…"></textarea>' +
      '<button class="btn-wa" id="enviar" disabled>Mandar por WhatsApp</button>' +
      '<p class="pie-nota">Se guarda aquí y se abre tu WhatsApp con el mensaje ya escrito.<br>' +
      "Te contestamos lo antes posible.</p></div>";

    $("cuerpo").innerHTML = html;
    enlaza();
  }

  function enlaza() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-tipo]"), function (b) {
      b.onclick = function () {
        Array.prototype.forEach.call(document.querySelectorAll("[data-tipo]"), function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        tipo = b.dataset.tipo;
        revisa();
      };
    });
    $("txt").addEventListener("input", revisa);
    $("enviar").onclick = manda;
  }
  function revisa() {
    $("enviar").disabled = !(tipo && $("txt").value.trim().length > 2);
  }

  function manda() {
    if (enviando) return;
    var texto = $("txt").value.trim();
    if (!tipo || !texto) return;
    enviando = true;
    $("enviar").disabled = true;
    $("enviar").textContent = "Mandando…";

    var negocio = cliente.negocio || cliente.persona || "";
    var quien = cliente.persona ? cliente.persona : "";
    var msg = "Hola, soy " + (quien ? quien + " de " + negocio : negocio) + ".\n\n" +
      tipo + ":\n" + texto;

    var doc = {
      fields: {
        uid: { stringValue: uid },
        clienteId: { stringValue: cliente.id },
        negocio: { stringValue: negocio },
        tipo: { stringValue: tipo },
        texto: { stringValue: texto },
        cuando: { stringValue: new Date().toISOString() },
        atendida: { booleanValue: false }
      }
    };

    fetch(FS + "/sugerencias", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(doc)
    }).then(function (r) {
      if (!r.ok) throw new Error("guardado " + r.status);
    }).catch(function () {
      /* si no se pudo guardar, igual se manda: lo importante es que llegue */
    }).then(function () {
      var destino = WA[cliente.avisaA === "personal" ? "personal" : "negocio"];
      window.open("https://wa.me/" + destino + "?text=" + encodeURIComponent(msg), "_blank");
      $("txt").value = "";
      tipo = "";
      Array.prototype.forEach.call(document.querySelectorAll("[data-tipo]"), function (x) {
        x.classList.remove("on");
      });
      $("enviar").textContent = "Mandar por WhatsApp";
      $("enviar").disabled = true;
      enviando = false;
      toast("Listo, ya lo recibimos", "bien");
    });
  }

  /* ═══ arranque ═══ */
  function cargar() {
    $("login").hidden = true;
    $("app").hidden = false;
    $("cuerpo").innerHTML = '<p class="vacio">Cargando tu cuenta&hellip;</p>';

    consulta("clientes", "uid", uid).then(function (cs) {
      if (!cs.length) {
        $("hola").innerHTML = "<div><h1>Tu cuenta</h1><p>Ya entraste bien.</p></div>";
        $("cuerpo").innerHTML = '<div class="blq"><p class="vacio">' +
          "Tu cuenta todavía no está ligada a tu negocio.<br>" +
          "Escríbenos y lo dejamos listo en un momento.</p></div>";
        return;
      }
      cliente = cs[0];
      return consulta("pagos", "clienteUid", uid).then(function (ps) {
        pagos = ps;
        pinta();
      }).catch(function () {
        pagos = [];
        pinta();
      });
    }).catch(function (e) {
      $("cuerpo").innerHTML = '<div class="blq"><p class="vacio">' +
        "No pudimos leer tu cuenta ahorita. Vuelve a entrar en un momento.<br><small>" +
        esc(e.message) + "</small></p></div>";
    });
  }

  $("entrar").onclick = function () {
    var e = $("loginErr");
    e.hidden = true;
    var m = $("mail").value.trim(), p = $("pass").value;
    if (!m || !p) { e.textContent = "Escribe tu correo y tu contraseña."; e.hidden = false; return; }
    entrar(m, p).then(cargar).catch(function () {
      e.textContent = "Ese correo o esa contraseña no son.";
      e.hidden = false;
    });
  };
  $("pass").addEventListener("keydown", function (ev) { if (ev.key === "Enter") $("entrar").click(); });
  $("salir").onclick = function () {
    lsDel(K_RT); token = null; uid = null; cliente = null; pagos = [];
    $("app").hidden = true;
    $("login").hidden = false;
  };

  refrescar().then(cargar).catch(function () { });
})();
