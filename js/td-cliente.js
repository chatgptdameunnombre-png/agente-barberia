(function () {
  var API = "AIzaSyDZZK2IeuHYrvFSn-R-9v6xfY33s1X7vjo";
  var PID = "tuagentedeia-4f2a1";
  var FS = "https://firestore.googleapis.com/v1/projects/" + PID + "/databases/(default)/documents";
  var IDT = "https://identitytoolkit.googleapis.com/v1/accounts";
  var TOK = "https://securetoken.googleapis.com/v1/token?key=" + API;
  var K_RT = "td_cli_rt";
  var TZ = "America/Mexico_City";

  /* A dónde llega lo que pide cada cliente. Se decide por cliente con el campo
     `avisaA` ("personal" o "negocio") desde la ficha del panel. */
  var WA = { personal: "5215563173973", negocio: "5213351261495" };

  /* El mismo catálogo que usa el panel (td-negocio.js). Si se agrega uno aquí,
     agregarlo allá con la misma clave. */
  /* clave, icono, nombre, para qué sirve, cómo se llama su dato */
  var SERVICIOS = [
    ["whatsapp", "💬", "Agente de WhatsApp", "Responde los mensajes al instante, todos los días.", "Tu número"],
    ["voz", "📞", "Agente de llamadas", "Contesta el teléfono por ti, a cualquier hora.", "Tu número"],
    ["web", "🌐", "Página web", "Tu página en internet, siempre disponible.", "Tu página"],
    ["tienda", "🛒", "Tienda en línea", "Tus productos y tus cobros en tu propia tienda.", "Tu tienda"],
    ["automatizacion", "⚙️", "Automatizaciones", "Trabajo repetitivo que ya no haces a mano.", "Lo que se automatizó"],
    ["videos", "🎬", "Videos con IA", "Videos para tus redes, hechos con inteligencia artificial.", "Dónde salen"],
    ["panel", "📊", "Panel de estadísticas", "Ver qué hace la gente en tu página.", "Tu panel"],
    ["agenda", "📅", "Agenda y recordatorios", "Agenda las citas solo y manda recordatorios.", "Tu calendario"]
  ];
  function srv(clave) {
    for (var i = 0; i < SERVICIOS.length; i++) {
      if (SERVICIOS[i][0] === clave) return SERVICIOS[i];
    }
    return [clave, "✨", clave, "Servicio activo en tu cuenta."];
  }
  /* Acepta el formato viejo (texto libre) y el nuevo (lista de claves). */
  function mios() {
    var v = cliente && cliente.servicios;
    if (Array.isArray(v)) return v;
    if (!v) return [];
    return String(v).split(/\s*[+,·|]\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

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
  function cada(sel, f) { Array.prototype.forEach.call(document.querySelectorAll(sel), f); }

  var tToast = null;
  function toast(txt, clase) {
    var t = $("toast");
    t.textContent = txt;
    t.className = "toast on" + (clase ? " " + clase : "");
    clearTimeout(tToast);
    tToast = setTimeout(function () { t.className = "toast"; }, 3200);
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
          where: { fieldFilter: { field: { fieldPath: campo }, op: "EQUAL", value: { stringValue: val } } },
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
    return +p[2] + " de " + MESES_L[+p[1] - 1] + " de " + p[0];
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

  /* ═══ piezas que se reusan ═══ */
  function pendientes() {
    return pagos.filter(function (p) { return p.estado === "pendiente"; });
  }
  function hechos() {
    return pagos.filter(function (p) { return p.estado !== "pendiente"; })
      .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  }
  function debe() {
    return pendientes().reduce(function (a, p) { return a + num(p.monto); }, 0);
  }

  function bloqueProximo() {
    var pausado = cliente.estado === "pausado";
    var d = debe();
    if (d > 0) {
      var ps = pendientes();
      return '<div class="prox alerta"><div class="lbl">Tienes un pago pendiente</div>' +
        '<div class="monto">' + esc(pesos(d)) + "</div>" +
        '<div class="fecha">' + (ps.length === 1
          ? "De <b>" + esc(ps[0].concepto || "tu servicio") + "</b>"
          : "De <b>" + ps.length + " pagos</b>") + "</div>" +
        '<div class="nota">Si ya lo pagaste, avísanos desde <b>Pedir algo</b> y lo marcamos.</div></div>';
    }
    if (pausado) {
      return '<div class="prox"><div class="lbl">Tu servicio</div>' +
        '<div class="monto chico">En pausa</div>' +
        '<div class="nota">No se te está cobrando. Cuando quieras retomarlo, avísanos.</div></div>';
    }
    var f = proximaFecha(cliente.diaPago, cliente.periodicidad || "mensual", cliente.inicio);
    if (!f || (!num(cliente.monto) && !cliente.montoVaria)) return "";
    var q = cuando(f);
    var monto = cliente.montoVaria
      ? '<div class="monto chico">Varía cada vez</div>'
      : '<div class="monto">' + esc(pesos(cliente.monto)) + "</div>";
    var nota = cliente.montoVaria
      ? "Te pasamos el monto exacto ese día."
      : (cliente.periodicidad === "anual" ? "Se cobra una vez al año."
        : cliente.periodicidad === "unico" ? "Es un pago único."
          : "Se cobra cada mes el día " + esc(cliente.diaPago || "—") + ".");
    return '<div class="prox"><div class="lbl">Tu próximo pago</div>' + monto +
      '<div class="fecha">El <b>' + esc(diaLargo(f)) + "</b> · " + esc(q.txt) + "</div>" +
      '<div class="nota">' + nota + " Estás al corriente.</div></div>";
  }

  function tarjetasServicios() {
    var lista = mios();
    if (!lista.length) {
      return '<p class="vacio">Todavía no tenemos anotados tus servicios.<br>' +
        "Escríbenos desde <b>Pedir algo</b> y los ponemos.</p>";
    }
    var det = (cliente.detalles && typeof cliente.detalles === "object") ? cliente.detalles : {};
    return '<div class="srv-grid">' + lista.map(function (k) {
      var s = srv(k), d = det[k], extra = "";
      if (d) {
        if (/^https?:/.test(d)) {
          extra = '<a class="srv-dato" href="' + esc(d) + '" target="_blank" rel="noopener">' +
            esc(String(d).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + " ↗</a>";
        } else {
          extra = '<span class="srv-dato">' + esc(s[4]) + ": <b>" + esc(d) + "</b></span>";
        }
      }
      return '<div class="srv"><span class="ico">' + s[1] + "</span><b>" + esc(s[2]) +
        "</b><span>" + esc(s[3]) + "</span>" + extra + "</div>";
    }).join("") + "</div>";
  }

  function selloEstado() {
    var pausado = cliente.estado === "pausado";
    return '<div class="estado' + (pausado ? " pausa" : "") + '"><span class="punto"></span>' +
      (pausado ? "Tu servicio está pausado" : "Todo funcionando") +
      (cliente.inicio ? " · con nosotros desde el " + esc(diaLargo(cliente.inicio)) : "") +
      "</div>";
  }

  function mesDe(isoF) {
    var q = String(isoF || "").slice(0, 7).split("-");
    if (q.length !== 2) return "";
    return MESES_L[+q[1] - 1] + " de " + q[0];
  }

  function lineaTiempo(lista) {
    if (!lista.length) return '<p class="vacio">Todavía no hay pagos registrados.</p>';
    var orden = lista.slice().sort(function (a, b) {
      return String(b.fecha).localeCompare(String(a.fecha));
    });
    var html = '<div class="tl">', mes = "";
    orden.forEach(function (x) {
      var m = mesDe(x.fecha);
      if (m !== mes) { mes = m; html += '<div class="tl-mes">' + esc(mes) + "</div>"; }
      var pend = x.estado === "pendiente";
      html += '<div class="tl-it' + (pend ? " pend" : "") + (x.tipo === "unico" ? " inicial" : "") + '">' +
        '<div class="tl-cab"><b>' + esc(x.concepto || (pend ? "Pago pendiente" : "Pago")) + "</b>" +
        '<span class="tl-monto">' + esc(pesos(x.monto)) + "</span></div>" +
        '<div class="tl-pie">' + esc(dia(x.fecha)) +
        (x.metodo ? " · " + esc(x.metodo) : "") +
        (pend ? " · <b>pendiente</b>" : " · pagado") + "</div></div>";
    });
    return html + "</div>";
  }

  function filaPago(p) {
    return '<div class="pago' + (p.estado === "pendiente" ? " pend" : "") + '"><div><b>' +
      esc(p.concepto || (p.estado === "pendiente" ? "Pago pendiente" : "Pago")) + "</b><small>" +
      esc(dia(p.fecha)) + (p.metodo ? " · " + esc(p.metodo) : "") +
      (p.estado === "pendiente" ? " · pendiente" : "") + "</small></div>" +
      '<span class="mon">' + esc(pesos(p.monto)) + "</span></div>";
  }

  /* ═══ secciones ═══ */
  function pintaResumen() {
    var ultimos = hechos().slice(0, 4);
    $("hTtl").textContent = "Hola" + (cliente.persona ? ", " + String(cliente.persona).split(" ")[0] : "");
    $("hSub").textContent = "Aquí está todo lo tuyo de un vistazo.";

    $("resumen").innerHTML = bloqueProximo() +
      '<div class="blq"><h2>Tus servicios</h2>' + tarjetasServicios() + selloEstado() + "</div>" +
      '<div class="blq"><div class="blq-top"><h2>Tus últimos pagos</h2>' +
      (hechos().length > 4 ? '<button class="salir" data-ir="pagos">Ver todos</button>' : "") +
      "</div>" +
      lineaTiempo(pendientes().concat(ultimos)) + "</div>";

    cada("[data-ir]", function (b) { b.onclick = function () { abreSec(b.dataset.ir); }; });
  }

  function pintaPagos() {
    var h = hechos(), ps = pendientes();
    var total = h.reduce(function (a, p) { return a + num(p.monto); }, 0);
    $("pagos").innerHTML = '<div class="blq"><h2>Tu línea de pagos</h2>' + lineaTiempo(pagos) +
      (h.length ? '<p class="total">Llevas <b>' + esc(pesos(total)) + "</b> pagados en " + h.length +
        (h.length === 1 ? " pago." : " pagos.") + "</p>" : "") +
      "</div>";

    $("numPend").textContent = ps.length;
    $("numPend").hidden = !ps.length;
    $("numPend").className = "nav-num" + (ps.length ? " alerta" : "");
  }

  function pintaServicios() {
    $("servicios").innerHTML = '<div class="blq">' + tarjetasServicios() + selloEstado() + "</div>";
  }

  function pintaPedir() {
    var tengo = mios();
    var faltan = SERVICIOS.filter(function (s) { return tengo.indexOf(s[0]) === -1; });

    $("pedir").innerHTML =
      '<div class="blq"><h2>Lo que ya tienes</h2>' +
      (tengo.length ? '<div class="tengo">' + tengo.map(function (k) {
        var s = srv(k);
        return '<span class="chip">' + s[1] + " " + esc(s[2]) + "</span>";
      }).join("") + "</div>"
        : '<p class="vacio" style="padding:20px 0">Todavía no tienes servicios anotados.</p>') +
      "</div>" +

      '<div class="blq"><h2>&iquest;Qué te gustaría agregar?</h2>' +
      (faltan.length ? '<div class="chk-grid" id="quiero">' + faltan.map(function (s) {
        return '<label class="chk"><input type="checkbox" value="' + s[0] + '">' +
          '<span class="chk-ico">' + s[1] + "</span>" + esc(s[2]) + "</label>";
      }).join("") + "</div>"
        : '<p class="vacio" style="padding:20px 0">Ya tienes todo lo que ofrecemos.</p>') +

      '<h2 style="margin-top:8px">&iquest;O es otra cosa?</h2>' +
      '<div class="pide-grid">' +
      [["Pedir un cambio", "✏️", "Cambiar algo de lo que ya está hecho"],
       ["Reportar un problema", "⚠️", "Algo no está funcionando bien"],
       ["Avisar que ya pagué", "💵", "Mandar tu comprobante"],
       ["Una sugerencia", "💡", "Se me ocurre algo que estaría bueno"]
      ].map(function (t) {
        return '<button class="pide" data-tipo="' + esc(t[0]) + '"><span class="ico">' + t[1] +
          "</span><b>" + esc(t[0]) + "</b><span>" + esc(t[2]) + "</span></button>";
      }).join("") + "</div>" +

      '<textarea class="in" id="txt" placeholder="Cuéntanos con tus palabras qué necesitas…"></textarea>' +
      '<div class="acc">' +
      '<button class="b-grande b-aqui" id="bAqui" disabled>Mandarlo por aquí</button>' +
      '<button class="b-grande b-wa" id="bWa" disabled>Mandarlo por WhatsApp</button>' +
      "</div>" +
      '<p class="pie-nota">Por aquí nos llega igual y no tienes que salir de tu cuenta.<br>' +
      "Por WhatsApp se abre tu chat con el mensaje ya escrito.</p></div>";

    cada("[data-tipo]", function (b) {
      b.onclick = function () {
        var ya = b.classList.contains("on");
        cada("[data-tipo]", function (x) { x.classList.remove("on"); });
        if (!ya) { b.classList.add("on"); tipo = b.dataset.tipo; }
        else tipo = "";
        revisa();
      };
    });
    if ($("quiero")) {
      cada("#quiero input", function (x) {
        x.onchange = function () {
          x.closest(".chk").classList.toggle("on", x.checked);
          revisa();
        };
      });
    }
    $("txt").addEventListener("input", revisa);
    $("bAqui").onclick = function () { manda(false); };
    $("bWa").onclick = function () { manda(true); };
    revisa();
  }

  function elegidos() {
    if (!$("quiero")) return [];
    return Array.prototype.map.call($("quiero").querySelectorAll("input:checked"),
      function (x) { return srv(x.value)[2]; });
  }
  function revisa() {
    var hay = elegidos().length > 0 || (tipo && $("txt").value.trim().length > 2);
    $("bAqui").disabled = !hay;
    $("bWa").disabled = !hay;
  }

  function manda(porWhats) {
    if (enviando) return;
    var quiere = elegidos();
    var texto = $("txt").value.trim();
    if (!quiere.length && !(tipo && texto)) return;

    enviando = true;
    $("bAqui").disabled = true;
    $("bWa").disabled = true;
    (porWhats ? $("bWa") : $("bAqui")).textContent = "Mandando…";

    var eltipo = quiere.length ? "Contratar otro servicio" : tipo;
    var cuerpo = "";
    if (quiere.length) cuerpo += "Me interesa:\n· " + quiere.join("\n· ");
    if (texto) cuerpo += (cuerpo ? "\n\n" : "") + texto;

    var negocio = cliente.negocio || cliente.persona || "";
    var quien = cliente.persona || "";
    var msg = "Hola, soy " + (quien ? quien + " de " + negocio : negocio) + ".\n\n" +
      eltipo + ":\n" + cuerpo;

    var doc = {
      fields: {
        uid: { stringValue: uid },
        clienteId: { stringValue: cliente.id },
        negocio: { stringValue: negocio },
        tipo: { stringValue: eltipo },
        texto: { stringValue: cuerpo },
        cuando: { stringValue: new Date().toISOString() },
        atendida: { booleanValue: false }
      }
    };

    fetch(FS + "/sugerencias", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(doc)
    }).then(function (r) {
      if (!r.ok) throw new Error("guardado");
      return true;
    }).catch(function () {
      /* si no se pudo guardar y va por WhatsApp, igual se manda */
      return false;
    }).then(function (guardado) {
      if (porWhats) {
        var destino = WA[cliente.avisaA === "personal" ? "personal" : "negocio"];
        window.open("https://wa.me/" + destino + "?text=" + encodeURIComponent(msg), "_blank");
        toast("Listo, ya lo recibimos", "bien");
      } else if (guardado) {
        toast("Listo, ya nos llegó. Te contestamos pronto", "bien");
      } else {
        toast("No se pudo mandar. Inténtalo por WhatsApp", "mal");
      }
      enviando = false;
      $("bAqui").textContent = "Mandarlo por aquí";
      $("bWa").textContent = "Mandarlo por WhatsApp";
      if (guardado || porWhats) pintaPedir();
      else revisa();
    });
  }

  /* ═══ navegación ═══ */
  var SEC = {
    resumen: ["secResumen", "Resumen"],
    pagos: ["secPagos", "Mis pagos"],
    servicios: ["secServicios", "Mis servicios"],
    pedir: ["secPedir", "Pedir algo"]
  };
  function abreSec(k) {
    Object.keys(SEC).forEach(function (x) { $(SEC[x][0]).hidden = (x !== k); });
    cada(".nav-it[data-sec]", function (b) { b.classList.toggle("on", b.dataset.sec === k); });
    $("topTtl").textContent = SEC[k][1];
    cierraNav();
    window.scrollTo(0, 0);
  }
  function abreNav() { $("nav").classList.add("abierto"); $("navFondo").classList.add("on"); }
  function cierraNav() { $("nav").classList.remove("abierto"); $("navFondo").classList.remove("on"); }

  /* ═══ arranque ═══ */
  function pintaTodo() {
    var nombre = cliente.negocio || cliente.persona || "Tu cuenta";
    $("navNeg").textContent = nombre;
    document.title = nombre + " — Tu Agente de IA";
    pintaResumen();
    pintaPagos();
    pintaServicios();
    pintaPedir();
  }

  function cargar() {
    $("login").hidden = true;
    $("app").hidden = false;
    $("resumen").innerHTML = '<p class="vacio">Cargando tu cuenta&hellip;</p>';

    consulta("clientes", "uid", uid).then(function (cs) {
      if (!cs.length) {
        $("hTtl").textContent = "Tu cuenta";
        $("hSub").textContent = "Ya entraste bien.";
        $("resumen").innerHTML = '<div class="blq"><p class="vacio">' +
          "Tu cuenta todavía no está ligada a tu negocio.<br>" +
          "Escríbenos y lo dejamos listo en un momento.</p></div>";
        return;
      }
      cliente = cs[0];
      return consulta("pagos", "clienteUid", uid).then(function (ps) {
        pagos = ps;
        pintaTodo();
      }).catch(function () {
        pagos = [];
        pintaTodo();
      });
    }).catch(function (e) {
      $("resumen").innerHTML = '<div class="blq"><p class="vacio">' +
        "No pudimos leer tu cuenta ahorita. Vuelve a entrar en un momento.<br><small>" +
        esc(e.message) + "</small></p></div>";
    });
  }

  cada(".nav-it[data-sec]", function (b) {
    b.onclick = function () { abreSec(b.dataset.sec); };
  });
  $("ham").onclick = function () {
    $("nav").classList.contains("abierto") ? cierraNav() : abreNav();
  };
  $("navFondo").onclick = cierraNav;

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
