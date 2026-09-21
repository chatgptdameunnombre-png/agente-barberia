(function () {
  var P = null, listo = false;
  var clientes = [], pagos = [], gastos = [], egresos = [], peticiones = [], prospectos = [], resenas = [], verAtendidas = false;
  var cargado = { clientes: false, finanzas: false };
  var USD = 17.5;

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return P.esc(s); }

  /* ═══════════ Firestore por REST ═══════════ */
  function aFS(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") {
      return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    }
    if (Array.isArray(v)) return { arrayValue: { values: v.map(aFS) } };
    if (typeof v === "object") {
      var f = {};
      for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) f[k] = aFS(v[k]);
      return { mapValue: { fields: f } };
    }
    return { stringValue: String(v) };
  }
  function campos(o) {
    var f = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) f[k] = aFS(o[k]);
    return f;
  }
  function cab() {
    return { "Content-Type": "application/json", Authorization: "Bearer " + P.tok() };
  }

  function listar(col) {
    return fetch(P.FS + "/" + col + "?pageSize=300", { headers: cab() })
      .then(function (r) {
        if (r.status === 403) throw new Error("reglas");
        if (!r.ok) throw new Error("lectura " + r.status);
        return r.json();
      })
      .then(function (j) {
        return ((j && j.documents) || []).map(function (d) {
          var o = P.plano(d.fields || {});
          o.id = d.name.split("/").pop();
          return o;
        });
      });
  }
  function crear(col, obj) {
    return fetch(P.FS + "/" + col, {
      method: "POST", headers: cab(), body: JSON.stringify({ fields: campos(obj) })
    }).then(function (r) { if (!r.ok) throw new Error("alta " + r.status); return r.json(); });
  }
  function actualizar(col, id, obj) {
    var m = Object.keys(obj).map(function (k) { return "updateMask.fieldPaths=" + k; }).join("&");
    return fetch(P.FS + "/" + col + "/" + id + "?" + m, {
      method: "PATCH", headers: cab(), body: JSON.stringify({ fields: campos(obj) })
    }).then(function (r) { if (!r.ok) throw new Error("guardado " + r.status); return r.json(); });
  }
  function borrar(col, id) {
    return fetch(P.FS + "/" + col + "/" + id, { method: "DELETE", headers: cab() })
      .then(function (r) { if (!r.ok) throw new Error("borrado " + r.status); });
  }

  /* ═══════════ formato ═══════════ */
  function pesos(n) {
    n = Math.round(Number(n) || 0);
    return (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("es-MX");
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }

  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  /* El mismo cat\u00e1logo que usa el portal del cliente (td-cliente.js).
     Si se agrega uno aqu\u00ed, agregarlo all\u00e1 con la misma clave. */
  /* clave, icono, nombre, que dato pide, tipo de campo, ejemplo */
  var SERVICIOS = [
    ["whatsapp", "\ud83d\udcac", "Agente de WhatsApp", "N\u00famero del agente", "tel", "33 3598 0142"],
    ["voz", "\ud83d\udcde", "Agente de llamadas", "N\u00famero al que le llaman", "tel", "675 119 0063"],
    ["web", "\ud83c\udf10", "P\u00e1gina web", "Link de su p\u00e1gina", "url", "https://sunegocio.com.mx"],
    ["tienda", "\ud83d\uded2", "Tienda en l\u00ednea", "Link de la tienda", "url", "https://sutienda.com.mx"],
    ["automatizacion", "\u2699\ufe0f", "Automatizaciones", "Qu\u00e9 le automatizaste", "text", "Recordatorios de cita"],
    ["videos", "\ud83c\udfac", "Videos con IA", "D\u00f3nde se publican", "text", "Instagram y TikTok"]
  ];
  function servicio(clave) {
    for (var i = 0; i < SERVICIOS.length; i++) if (SERVICIOS[i][0] === clave) return SERVICIOS[i];
    return null;
  }
  function nombreServicio(clave) {
    for (var i = 0; i < SERVICIOS.length; i++) {
      if (SERVICIOS[i][0] === clave) return SERVICIOS[i][2];
    }
    return clave;
  }
  /* Acepta el formato viejo (texto libre) y el nuevo (lista de claves). */
  function listaServicios(v) {
    if (Array.isArray(v)) return v;
    if (!v) return [];
    return String(v).split(/\s*[+,\u00b7|]\s*/).filter(Boolean);
  }
  function serviciosTexto(v) {
    return listaServicios(v).map(nombreServicio).join(" \u00b7 ");
  }
  function diaLargo(isoF) {
    if (!isoF) return "\u2014";
    var p = String(isoF).slice(0, 10).split("-");
    if (p.length !== 3) return String(isoF);
    return +p[2] + " de " + MESES_LARGO[+p[1] - 1] + " de " + p[0];
  }

  function hoyMX() {
    var f = new Date().toLocaleDateString("en-CA", { timeZone: P.TZ });
    var p = f.split("-");
    return { a: +p[0], m: +p[1], d: +p[2], iso: f };
  }
  function dia(iso) {
    if (!iso) return "—";
    var p = String(iso).slice(0, 10).split("-");
    if (p.length !== 3) return String(iso);
    return +p[2] + " " + MESES[+p[1] - 1] + " " + p[0];
  }
  function ultimoDia(a, m) { return new Date(a, m, 0).getDate(); }
  function iso(a, m, d) {
    return a + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  function diasEntre(isoA, isoB) {
    var a = new Date(isoA + "T12:00:00"), b = new Date(isoB + "T12:00:00");
    return Math.round((b - a) / 86400000);
  }

  /* Próxima fecha de cobro a partir de hoy (incluye hoy). */
  function proximaFecha(diaPago, periodicidad, inicio) {
    var h = hoyMX();
    if (periodicidad === "unico") return inicio || null;
    if (periodicidad === "anual") {
      var mesA = inicio ? +String(inicio).slice(5, 7) : h.m;
      var dA = Math.min(num(diaPago) || +String(inicio || "").slice(8, 10) || 1, ultimoDia(h.a, mesA));
      var esteAnio = iso(h.a, mesA, dA);
      return diasEntre(h.iso, esteAnio) >= 0 ? esteAnio : iso(h.a + 1, mesA, Math.min(num(diaPago) || dA, ultimoDia(h.a + 1, mesA)));
    }
    var d = num(diaPago) || 1;
    var esteMes = iso(h.a, h.m, Math.min(d, ultimoDia(h.a, h.m)));
    if (diasEntre(h.iso, esteMes) >= 0) return esteMes;
    var m = h.m + 1, a = h.a;
    if (m > 12) { m = 1; a++; }
    return iso(a, m, Math.min(d, ultimoDia(a, m)));
  }

  function cuando(isoFecha) {
    if (!isoFecha) return { txt: "—", d: 9999 };
    var d = diasEntre(hoyMX().iso, isoFecha);
    if (d === 0) return { txt: "hoy", d: d };
    if (d === 1) return { txt: "mañana", d: d };
    if (d < 0) return { txt: "hace " + Math.abs(d) + " días", d: d };
    return { txt: "en " + d + " días", d: d };
  }

  function iniciales(n) {
    var ps = String(n || "").trim().split(/\s+/)
      .map(function (x) { return x.replace(/[^A-Za-z\u00c0-\u017f]/g, ""); })
      .filter(Boolean);
    if (!ps.length) return "?";
    if (ps.length > 1) return (ps[0][0] + ps[1][0]).toUpperCase();
    return ps[0].slice(0, 2).toUpperCase();
  }
  function fotoHTML(c, clase) {
    var cl = "foto" + (clase ? " " + clase : "");
    return c.foto
      ? '<img class="' + cl + '" src="' + esc(c.foto) + '" alt="">'
      : '<span class="' + cl + ' ini">' + esc(iniciales(c.negocio || c.persona)) + "</span>";
  }

  /* ═══════════ cuentas ═══════════ */
  function activos() {
    return clientes.filter(function (c) { return c.estado !== "pausado"; });
  }
  function entraAlMes() {
    return activos().reduce(function (a, c) {
      var m = montoEstimado(c);
      if (c.periodicidad === "mensual") return a + m;
      if (c.periodicidad === "anual") return a + m / 12;
      return a;
    }, 0);
  }
  function mesActual() { var h = hoyMX(); return h.a + "-" + String(h.m).padStart(2, "0"); }
  function cobradoEsteMes() {
    var m = mesActual();
    return pagos.reduce(function (a, p) {
      return (p.estado !== "pendiente" && String(p.fecha || "").slice(0, 7) === m) ? a + num(p.monto) : a;
    }, 0);
  }
  function deudaDe(id) {
    return pagos.reduce(function (a, p) {
      return (p.clienteId === id && p.estado === "pendiente") ? a + num(p.monto) : a;
    }, 0);
  }
  function teDeben() {
    return pagos.reduce(function (a, p) {
      return p.estado === "pendiente" ? a + num(p.monto) : a;
    }, 0);
  }
  function gastoMensual(g) {
    if (!g.activo) return 0;
    var m = num(g.monto) * (g.moneda === "USD" ? USD : 1);
    if (g.periodicidad === "mensual") return m;
    if (g.periodicidad === "anual") return m / 12;
    return 0;
  }
  function gastosAlMes() {
    var puestos = gastos.reduce(function (a, g) { return a + gastoMensual(g); }, 0);
    if (puestos) return puestos;
    return promedioEgresos();
  }
  /* Promedio de los ultimos 3 meses con movimiento, para cuando todavia no
     se han dado de alta los gastos recurrentes a mano. */
  function promedioEgresos() {
    var porMes = {};
    egresos.forEach(function (e) {
      var m = String(e.fecha || "").slice(0, 7);
      if (m) porMes[m] = (porMes[m] || 0) + num(e.monto);
    });
    var meses = Object.keys(porMes).sort().slice(-3);
    if (!meses.length) return 0;
    return meses.reduce(function (a, m) { return a + porMes[m]; }, 0) / meses.length;
  }
  function gastoEsCalculado() {
    return !gastos.reduce(function (a, g) { return a + gastoMensual(g); }, 0) && egresos.length > 0;
  }
  /* Cuando a un cliente le cobras distinto cada mes, el estimado sale del
     promedio de sus \u00faltimos 3 pagos. Si no tiene, cae en el monto de su ficha. */
  function montoEstimado(c) {
    if (!c.montoVaria) return num(c.monto);
    var suyos = pagos.filter(function (p) {
      // Solo las mensualidades: el cobro de entrada y los pagos sueltos
      // inflarian el promedio.
      return p.clienteId === c.id && p.estado !== "pendiente" && p.tipo !== "unico";
    }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 3);
    if (!suyos.length) return num(c.monto);
    return suyos.reduce(function (a, p) { return a + num(p.monto); }, 0) / suyos.length;
  }
  function montoTxt(c) {
    var m = montoEstimado(c);
    return c.montoVaria ? "~" + pesos(m) : pesos(m);
  }

  /* Lo que te ha costado un cliente: sus egresos propios.
     Las herramientas de todos (Claude, n8n) NO se le cargan a nadie. */
  function gastadoEn(id) {
    return egresos.reduce(function (a, e) {
      return e.clienteId === id ? a + num(e.monto) : a;
    }, 0);
  }
  function gastoHerramientas() {
    return egresos.reduce(function (a, e) {
      return e.clienteId ? a : a + num(e.monto);
    }, 0);
  }

  function pagosDe(id) {
    return pagos.filter(function (p) { return p.clienteId === id; })
      .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  }
  function totalPagado(id) {
    return pagos.reduce(function (a, p) {
      return (p.clienteId === id && p.estado !== "pendiente") ? a + num(p.monto) : a;
    }, 0);
  }

  /* ═══════════ línea del tiempo de pagos ═══════════ */
  function mesDe(isoF) {
    var p = String(isoF || "").slice(0, 7).split("-");
    if (p.length !== 2) return "";
    return MESES_LARGO[+p[1] - 1] + " de " + p[0];
  }

  function lineaTiempo(lista) {
    if (!lista.length) return '<p class="vacio">Todav\u00eda no hay pagos.</p>';
    var orden = lista.slice().sort(function (a, b) {
      return String(b.fecha).localeCompare(String(a.fecha));
    });
    var html = '<div class="tl">', mes = "";
    orden.forEach(function (x) {
      var m = mesDe(x.fecha);
      if (m !== mes) {
        mes = m;
        html += '<div class="tl-mes">' + esc(mes) + "</div>";
      }
      var pend = x.estado === "pendiente";
      html += '<div class="tl-it' + (pend ? " pend" : "") + (x.tipo === "unico" ? " inicial" : "") + '">' +
        '<div class="tl-cab"><b>' + esc(x.concepto || (pend ? "Pago pendiente" : "Pago")) + "</b>" +
        '<span class="tl-monto">' + esc(pesos(x.monto)) + "</span></div>" +
        '<div class="tl-pie">' + esc(dia(x.fecha)) +
        (x.metodo ? " \u00b7 " + esc(x.metodo) : "") +
        (x.tipo === "unico" ? " \u00b7 cobro de entrada" : "") +
        (pend ? " \u00b7 <b>te lo debe</b>" : "") + "</div></div>";
    });
    return html + "</div>";
  }

  /* ═══════════ avisos ═══════════ */
  function avisoReglas(donde) {
    $(donde).innerHTML = '<div class="aviso"><i>⚠️</i><div>' +
      "<b>Faltan las reglas de Firebase.</b><br>" +
      "Pega las de <code>firebase/firestore-rules.txt</code> en la consola y dale Publicar.<br><br>" +
      '<button class="lnk" data-reintenta="1">Ya las publiqu\u00e9, reintentar</button></div></div>';
  }
  function limpiaAviso(donde) { if ($(donde)) $(donde).innerHTML = ""; }

  /* ═══════════ carga ═══════════ */
  function cargaTodo() {
    return Promise.all([listar("clientes"), listar("pagos"), listar("gastos"),
      listar("sugerencias").catch(function () { return []; }),
      listar("prospectos").catch(function () { return []; }),
      listar("egresos").catch(function () { return []; }),
      listar("resenas").catch(function () { return null; })])
      .then(function (r) {
        clientes = r[0].sort(function (a, b) {
          return String(a.negocio || "").localeCompare(String(b.negocio || ""));
        });
        pagos = r[1];
        gastos = r[2];
        peticiones = (r[3] || []).sort(function (a, b) {
          return String(b.cuando || "").localeCompare(String(a.cuando || ""));
        });
        prospectos = (r[4] || []).sort(function (a, b) {
          return String(a.nombre || "").localeCompare(String(b.nombre || ""));
        });
        $("numPros").textContent = prospectos.length;
        egresos = r[5] || [];
        resenasSinReglas = r[6] === null;
        resenas = (r[6] || []).sort(function (a, b) {
          return String(b.fecha || "").localeCompare(String(a.fecha || ""));
        });
        $("numRes").textContent = resenas.length;
        cargado.clientes = true;
        cargado.finanzas = true;
        limpiaAviso("cliAviso"); limpiaAviso("finAviso"); limpiaAviso("pideAviso");
        $("numCli").textContent = clientes.length;
        contadorPeticiones();
      });
  }

  var sinReglas = false;

  function asegura(cb) {
    if (cargado.clientes) return cb();
    if (sinReglas) return;
    cargaTodo().then(cb).catch(function (e) {
      if (String(e.message) === "reglas") {
        sinReglas = true;
        avisoReglas("cliAviso"); avisoReglas("finAviso"); avisoReglas("pideAviso");
        $("clientes").innerHTML = "";
        $("finCards").innerHTML = "";
        $("piden").innerHTML = "";
        cada("[data-reintenta]", function (b) {
          b.onclick = function () {
            sinReglas = false;
            asegura(function () {
              pintaClientes(); pintaFinanzas(); pintaPeticiones(); pintaProspectos();
            });
          };
        });
      } else {
        P.toast("No se pudo leer: " + e.message, "mal");
      }
    });
  }

  /* ═══════════ FINANZAS ═══════════ */
  function fotoMini(c) {
    return c.foto ? '<img src="' + esc(c.foto) + '" alt="">'
      : '<span class="foto ini">' + esc(iniciales(c.negocio || c.persona)) + "</span>";
  }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function mesCorto(m) {
    var q = String(m).split("-");
    return MESES_LARGO[+q[1] - 1].charAt(0).toUpperCase() + MESES_LARGO[+q[1] - 1].slice(1) + " " + q[0];
  }
  function opcionesClientes(sel, conTodos) {
    var actual = $(sel).value;
    $(sel).innerHTML = (conTodos ? '<option value="">Todos los clientes</option>' : "") +
      clientes.map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(c.negocio || c.persona) + "</option>";
      }).join("");
    if (actual) $(sel).value = actual;
  }

  function pintaFinanzas() {
    var h = hoyMX();
    var hechos = pagos.filter(function (p) { return p.estado !== "pendiente"; });
    var pend = pagos.filter(function (p) { return p.estado === "pendiente"; });
    var cobradoTotal = hechos.reduce(function (a, p) { return a + num(p.monto); }, 0);
    var costoTotal = egresos.reduce(function (a, e) { return e.clienteId ? a + num(e.monto) : a; }, 0);
    var ganancia = cobradoTotal - costoTotal;
    var deben = teDeben();

    $("finSub").textContent = plural(activos().length, "cliente activo", "clientes activos") +
      " · dólar a $" + USD;

    /* ── te deben, en grande ── */
    $("finDeben").innerHTML = pend.length
      ? '<div class="deben"><div class="deben-top"><div><div class="deben-lbl">Te deben</div>' +
        '<div class="deben-n">' + esc(pesos(deben)) + "</div></div></div>" +
        pend.sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).map(function (p) {
          var dias = diasEntre(String(p.fecha).slice(0, 10), h.iso);
          var meses = Math.floor(dias / 30);
          var hace = meses >= 1 ? meses + (meses === 1 ? " mes" : " meses") : dias + " días";
          return '<div class="deben-it"><div><b>' + esc(p.clienteNombre || "—") + "</b>" +
            "<small>" + esc(p.concepto || "Pago") + " · atrasado " + esc(hace) + "</small></div>" +
            '<div class="hist-acc"><span class="m">' + esc(pesos(p.monto)) + "</span>" +
            '<button class="lnk" data-cobrado="' + esc(p.id) + '">Ya me pagó</button>' +
            '<button class="lnk mal" data-borrapago="' + esc(p.id) + '">Borrar</button></div></div>';
        }).join("") + "</div>"
      : '<div class="deben cero"><div class="deben-lbl">Te deben</div><div class="deben-n">$0</div>' +
        '<p style="color:var(--dim);margin-top:10px">Nadie te debe nada.</p></div>';

    /* ── estadísticas ── */
    $("finCards").innerHTML = [
      ["", pesos(entraAlMes()), "Entra al mes", "lo que te pagan cada mes"],
      ["verde", pesos(cobradoEsteMes()), "Cobrado este mes", MESES_LARGO[h.m - 1]],
      ["verde", pesos(cobradoTotal), "Cobrado en total", plural(hechos.length, "pago", "pagos")],
      ["azul", pesos(costoTotal), "Te costaron", "lo que gastas en tus clientes"],
      [ganancia >= 0 ? "verde" : "roja", pesos(ganancia), "Ganancia", pct(ganancia, cobradoTotal) + "% de lo cobrado"]
    ].map(function (c) {
      return '<div class="card ' + c[0] + '"><div class="n">' + esc(c[1]) + '</div><div class="t">' +
        esc(c[2]) + '</div><div class="p">' + esc(c[3]) + "</div></div>";
    }).join("");

    /* ── ganancia por cliente ── */
    var gan = clientes.map(function (c) {
      var cob = totalPagado(c.id), gas = gastadoEn(c.id);
      return { c: c, cob: cob, gas: gas, g: cob - gas, p: pct(cob - gas, cob) };
    }).sort(function (a, b) { return b.g - a.g; });
    $("finMargenTot").textContent = pesos(ganancia) + " entre todos";
    $("finMargen").innerHTML = gan.length ? '<div class="gan-grid">' + gan.map(function (x) {
      return '<div class="gan"><div class="gan-nom">' + fotoMini(x.c) + esc(x.c.negocio || x.c.persona) + "</div>" +
        '<div class="gan-f">Le cobraste<span>' + esc(pesos(x.cob)) + "</span></div>" +
        '<div class="gan-f">Te costó<span>' + esc(pesos(x.gas)) + "</span></div>" +
        '<div class="gan-g"><b>Ganancia</b><span' + (x.g < 0 ? ' class="r"' : "") + ">" + esc(pesos(x.g)) + "</span></div>" +
        '<div class="gan-bar"><i style="width:' + Math.max(0, Math.min(100, x.p)) + '%"></i></div>' +
        '<div class="gan-pct">Te quedas con el ' + x.p + "% de lo que te paga</div></div>";
    }).join("") + "</div>" : '<p class="vacio">Da de alta un cliente para ver su ganancia.</p>';

    /* ── por mes ── */
    opcionesClientes("finMesSel", true);
    pintaPorMes();

    /* ── próximos cobros ── */
    var prox = activos().filter(function (c) { return montoEstimado(c) > 0 || c.montoVaria; }).map(function (c) {
      var f = proximaFecha(c.diaPago, c.periodicidad || "mensual", c.inicio);
      return { c: c, f: f, q: cuando(f) };
    }).sort(function (a, b) { return a.q.d - b.q.d; });
    $("finProx").innerHTML = prox.length ? prox.map(function (x) {
      var cl = x.q.d < 0 ? "mal" : (x.q.d <= 3 ? "oro" : "");
      return '<div class="fila"><b>' + esc(x.c.negocio || x.c.persona || "Sin nombre") +
        ' <span class="tag ' + cl + '" style="margin-left:8px">' + esc(x.q.txt) + "</span></b>" +
        "<span>" + esc(x.c.montoVaria ? "por definir" : montoTxt(x.c)) + " · " + esc(dia(x.f)) + "</span></div>";
    }).join("") : '<p class="vacio">Da de alta un cliente y aquí sale cuándo cobrarle.</p>';

    /* ── pagos hechos ── */
    opcionesClientes("finTablaSel", true);
    pintaTablaPagos();

    /* ── lo que pagas tú ── */
    var gs = gastos.slice().map(function (g) {
      var pf = proximaFecha(g.dia, g.periodicidad || "mensual", g.fecha);
      return { g: g, d: g.activo ? cuando(pf).d : 99999 };
    }).sort(function (a, b) { return a.d - b.d; }).map(function (x) { return x.g; });
    $("finGastos").innerHTML = gs.length ? gs.map(function (g) {
      var f = proximaFecha(g.dia, g.periodicidad || "mensual", g.fecha);
      var q = cuando(f);
      var mxn = num(g.monto) * (g.moneda === "USD" ? USD : 1);
      return '<div class="hist' + (g.activo ? "" : " pend") + '"><div><b>' + esc(g.nombre || "—") + "</b>" +
        "<small>" + esc(g.periodicidad || "mensual") + " · día " + esc(g.dia || "—") +
        (g.activo ? " · " + esc(q.txt) : " · pausado") + "</small></div>" +
        '<div class="hist-acc"><span style="color:var(--blue)">' + esc(pesos(mxn)) + "</span>" +
        '<button class="lnk" data-editagasto="' + esc(g.id) + '">Editar</button>' +
        '<button class="lnk mal" data-borragasto="' + esc(g.id) + '">Borrar</button></div></div>';
    }).join("") : '<p class="vacio">Agrega lo que pagas cada mes y aquí ves cuándo toca.</p>';

    $("numFin").textContent = pend.length;
    $("numFin").hidden = !pend.length;
    $("numFin").className = "nav-num" + (pend.length ? " alerta" : "");

    enlaza();
  }

  /* Tabla por mes: cuánto le cobraste, cuánto te costó, ganancia y %.
     Las tablas que Kiki pase de cada mes se cargan como egresos del cliente
     y caen aquí solas. */
  function pintaPorMes() {
    var cid = $("finMesSel").value;
    var meses = {};
    pagos.forEach(function (p) {
      if (p.estado === "pendiente" || (cid && p.clienteId !== cid)) return;
      var m = String(p.fecha || "").slice(0, 7);
      if (!m) return;
      meses[m] = meses[m] || { c: 0, g: 0 };
      meses[m].c += num(p.monto);
    });
    egresos.forEach(function (e) {
      if (!e.clienteId || (cid && e.clienteId !== cid)) return;
      var m = String(e.fecha || "").slice(0, 7);
      if (!m) return;
      meses[m] = meses[m] || { c: 0, g: 0 };
      meses[m].g += num(e.monto);
    });
    var lista = Object.keys(meses).sort().reverse();
    if (!lista.length) {
      $("finMesTabla").innerHTML = '<tbody><tr><td class="vacio">Sin movimientos.</td></tr></tbody>';
      return;
    }
    var tc = 0, tg = 0;
    var filas = lista.map(function (m) {
      var x = meses[m], gan = x.c - x.g;
      tc += x.c; tg += x.g;
      return "<tr><td>" + esc(mesCorto(m)) + '</td><td class="n v">' + esc(pesos(x.c)) +
        '</td><td class="n a">' + esc(pesos(x.g)) + '</td><td class="n ' + (gan >= 0 ? "v" : "r") + '">' +
        esc(pesos(gan)) + '</td><td class="n o">' + (x.c ? pct(gan, x.c) + "%" : "—") + "</td></tr>";
    }).join("");
    var tgan = tc - tg;
    $("finMesTabla").innerHTML =
      '<thead><tr><th>Mes</th><th class="n">Le cobraste</th><th class="n">Te costó</th>' +
      '<th class="n">Ganancia</th><th class="n">% ganancia</th></tr></thead><tbody>' + filas + "</tbody>" +
      '<tfoot><tr><td>Total</td><td class="n v">' + esc(pesos(tc)) + '</td><td class="n a">' + esc(pesos(tg)) +
      '</td><td class="n ' + (tgan >= 0 ? "v" : "r") + '">' + esc(pesos(tgan)) + '</td><td class="n o">' +
      (tc ? pct(tgan, tc) + "%" : "—") + "</td></tr></tfoot>";
  }

  /* Pagos hechos como hoja de Excel. */
  function pintaTablaPagos() {
    var cid = $("finTablaSel").value;
    var lista = pagos.filter(function (p) {
      return p.estado !== "pendiente" && (!cid || p.clienteId === cid);
    }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    if (!lista.length) {
      $("finTabla").innerHTML = '<tbody><tr><td class="vacio">Todavía no hay pagos.</td></tr></tbody>';
      return;
    }
    var total = lista.reduce(function (a, p) { return a + num(p.monto); }, 0);
    $("finTabla").innerHTML =
      '<thead><tr><th>Fecha</th><th>Cliente</th><th>Concepto</th><th>Tipo</th><th class="n">Monto</th><th class="x"></th></tr></thead><tbody>' +
      lista.map(function (p) {
        return "<tr><td>" + esc(dia(p.fecha)) + "</td><td>" + esc(p.clienteNombre || "—") + "</td><td>" +
          esc(p.concepto || "") + '</td><td><span class="chip-t' + (p.tipo === "unico" ? " e" : "") + '">' +
          (p.tipo === "unico" ? "Entrada" : "Mensualidad") + '</span></td><td class="n v">' + esc(pesos(p.monto)) +
          '</td><td class="x"><button class="borra" title="Borrar" data-borrapago="' + esc(p.id) + '">✕</button></td></tr>';
      }).join("") + "</tbody>" +
      '<tfoot><tr><td colspan="4">' + plural(lista.length, "pago", "pagos") + '</td><td class="n v">' +
      esc(pesos(total)) + "</td><td></td></tr></tfoot>";
    enlaza();
  }

  function enlaza() {
    cada("[data-cobrado]", function (b) {
      b.onclick = function () {
        actualizar("pagos", b.dataset.cobrado, { estado: "pagado" }).then(function () {
          var p = pagos.filter(function (x) { return x.id === b.dataset.cobrado; })[0];
          if (p) p.estado = "pagado";
          P.toast("Marcado como pagado", "bien");
          pintaFinanzas();
        }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
      };
    });
    cada("[data-borrapago]", function (b) {
      b.onclick = function () {
        P.confirmar("Borrar este pago", "Se quita del historial y de las cuentas.", "Sí, borrar")
          .then(function (ok) {
            if (!ok) return;
            borrar("pagos", b.dataset.borrapago).then(function () {
              pagos = pagos.filter(function (x) { return x.id !== b.dataset.borrapago; });
              P.toast("Pago borrado", "bien");
              pintaFinanzas();
            }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
          });
      };
    });
    cada("[data-editagasto]", function (b) {
      b.onclick = function () {
        var g = gastos.filter(function (x) { return x.id === b.dataset.editagasto; })[0];
        if (g) formGasto(g);
      };
    });
    cada("[data-borragasto]", function (b) {
      b.onclick = function () {
        P.confirmar("Borrar este gasto", "Deja de contar en tus gastos del mes.", "Sí, borrar")
          .then(function (ok) {
            if (!ok) return;
            borrar("gastos", b.dataset.borragasto).then(function () {
              gastos = gastos.filter(function (x) { return x.id !== b.dataset.borragasto; });
              P.toast("Gasto borrado", "bien");
              pintaFinanzas();
            }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
          });
      };
    });
  }
  function cada(sel, f) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), f);
  }

  /* ═══════════ formulario de pago ═══════════ */
  function formPago(clienteId) {
    if (!clientes.length) return P.toast("Primero da de alta un cliente", "mal");
    var h = hoyMX();
    var ops = clientes.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === clienteId ? " selected" : "") + ">" +
        esc(c.negocio || c.persona || "Sin nombre") + "</option>";
    }).join("");

    P.modal('<h3>Registrar un pago</h3><p class="sub">Quién te pagó y cuánto.</p>' +
      '<div class="form-grid">' +
      '<div class="f ancho"><label>Cliente</label><select id="pgCli">' + ops + "</select></div>" +
      '<div class="f"><label>Monto (MXN)</label><input id="pgMonto" type="number" min="0" step="1" placeholder="1500"></div>' +
      '<div class="f"><label>Fecha</label><input id="pgFecha" type="date" value="' + h.iso + '"></div>' +
      '<div class="f"><label>Concepto</label><input id="pgConcepto" type="text" placeholder="Mensualidad de septiembre"></div>' +
      '<div class="f"><label>Cómo te pagó</label><select id="pgMetodo">' +
      '<option>Transferencia</option><option>Efectivo</option><option>Depósito</option><option>Mercado Pago</option><option>Otro</option></select></div>' +
      '<div class="f"><label>Qu\u00e9 pago es</label><select id="pgTipo">' +
      '<option value="mensualidad">Su mensualidad</option>' +
      '<option value="unico">Cobro de entrada o algo aparte</option></select></div>' +
      '<div class="f"><label>Estado</label><select id="pgEstado">' +
      '<option value="pagado">Ya me pagó</option><option value="pendiente">Me lo debe</option></select></div>' +
      "</div>" +
      '<div class="modal-acc"><button class="lnk" id="pgNo">Cancelar</button>' +
      '<button class="lnk oro" id="pgSi">Guardar pago</button></div>');

    $("pgNo").onclick = P.cierraModal;
    $("pgSi").onclick = function () {
      var cid = $("pgCli").value;
      var c = clientes.filter(function (x) { return x.id === cid; })[0];
      var monto = num($("pgMonto").value);
      if (!monto) return P.toast("Falta el monto", "mal");
      var obj = {
        clienteId: cid,
        clienteUid: (c && c.uid) || "",
        clienteNombre: (c && (c.negocio || c.persona)) || "",
        monto: Math.round(monto),
        fecha: $("pgFecha").value || h.iso,
        concepto: $("pgConcepto").value.trim(),
        metodo: $("pgMetodo").value,
        tipo: $("pgTipo").value,
        estado: $("pgEstado").value,
        creado: new Date().toISOString()
      };
      crear("pagos", obj).then(function (d) {
        obj.id = d.name.split("/").pop();
        pagos.push(obj);
        P.cierraModal();
        P.toast("Pago guardado", "bien");
        pintaFinanzas();
        if ($("ficha").classList.contains("on") && abierta === cid) abreFicha(cid);
      }).catch(function (e) { P.toast("No se pudo guardar: " + e.message, "mal"); });
    };
  }

  /* ═══════════ formulario de gasto ═══════════ */
  function formGasto(g) {
    g = g || {};
    var ed = !!g.id;
    P.modal("<h3>" + (ed ? "Editar gasto" : "Agregar un gasto") + '</h3>' +
      '<p class="sub">Lo que pagas tú cada mes.</p>' +
      '<div class="form-grid">' +
      '<div class="f ancho"><label>Qué es</label><input id="gsNom" type="text" placeholder="Twilio" value="' + esc(g.nombre || "") + '"></div>' +
      '<div class="f"><label>Monto</label><input id="gsMonto" type="number" min="0" step="0.01" value="' + esc(g.monto || "") + '"></div>' +
      '<div class="f"><label>Moneda</label><select id="gsMoneda">' +
      '<option value="MXN"' + (g.moneda !== "USD" ? " selected" : "") + ">Pesos (MXN)</option>" +
      '<option value="USD"' + (g.moneda === "USD" ? " selected" : "") + ">Dólares (USD)</option></select></div>" +
      '<div class="f"><label>Cada cuándo</label><select id="gsPer">' +
      ["mensual", "anual", "unico"].map(function (x) {
        return '<option value="' + x + '"' + ((g.periodicidad || "mensual") === x ? " selected" : "") + ">" +
          (x === "unico" ? "Una sola vez" : x.charAt(0).toUpperCase() + x.slice(1)) + "</option>";
      }).join("") + "</select></div>" +
      '<div class="f"><label>Día del mes</label><input id="gsDia" type="number" min="1" max="31" value="' + esc(g.dia || "") + '"></div>' +
      '<div class="f ancho"><label>Nota (opcional)</label><input id="gsNota" type="text" value="' + esc(g.notas || "") + '"></div>' +
      '<div class="f ancho"><label>Estado</label><select id="gsAct">' +
      '<option value="1"' + (g.activo !== false ? " selected" : "") + ">Activo</option>" +
      '<option value="0"' + (g.activo === false ? " selected" : "") + ">Pausado</option></select></div>" +
      "</div>" +
      '<div class="modal-acc"><button class="lnk" id="gsNo">Cancelar</button>' +
      '<button class="lnk oro" id="gsSi">Guardar</button></div>');

    $("gsNo").onclick = P.cierraModal;
    $("gsSi").onclick = function () {
      var nom = $("gsNom").value.trim();
      if (!nom) return P.toast("Ponle nombre al gasto", "mal");
      var obj = {
        nombre: nom,
        monto: num($("gsMonto").value),
        moneda: $("gsMoneda").value,
        periodicidad: $("gsPer").value,
        dia: num($("gsDia").value),
        notas: $("gsNota").value.trim(),
        activo: $("gsAct").value === "1"
      };
      var op = ed ? actualizar("gastos", g.id, obj) : crear("gastos", obj);
      op.then(function (d) {
        if (ed) {
          for (var k in obj) g[k] = obj[k];
        } else {
          obj.id = d.name.split("/").pop();
          gastos.push(obj);
        }
        P.cierraModal();
        P.toast("Gasto guardado", "bien");
        pintaFinanzas();
      }).catch(function (e) { P.toast("No se pudo guardar: " + e.message, "mal"); });
    };
  }

  /* ═══════════ CLIENTES ═══════════ */
  function ordenados() {
    return clientes.slice().map(function (c) {
      var f = proximaFecha(c.diaPago, c.periodicidad || "mensual", c.inicio);
      return { c: c, orden: c.estado === "pausado" ? 99999 : cuando(f).d };
    }).sort(function (a, b) {
      if (a.orden !== b.orden) return a.orden - b.orden;
      return String(a.c.negocio || "").localeCompare(String(b.c.negocio || ""));
    }).map(function (x) { return x.c; });
  }

  function pintaClientes() {
    $("numCli").textContent = clientes.length;
    $("clientes").innerHTML = clientes.length ? ordenados().map(function (c) {
      var f = proximaFecha(c.diaPago, c.periodicidad || "mensual", c.inicio);
      var q = cuando(f);
      var debe = deudaDe(c.id);
      var pausado = c.estado === "pausado";
      return '<article class="cli" data-cli="' + esc(c.id) + '">' +
        '<div class="cli-top">' + fotoHTML(c) + "<div>" +
        '<div class="cli-nom">' + esc(c.negocio || c.persona || "Sin nombre") + "</div>" +
        '<div class="cli-per">' + esc(c.persona || "") + "</div></div></div>" +
        '<div class="cli-datos">' +
        (c.telefono ? "<div><i>📱</i>" + esc(c.telefono) + "</div>" : "") +
        (c.ubicacion ? '<div><i>📍</i><a href="' + esc(c.ubicacion) +
          '" target="_blank" rel="noopener" data-noficha="1">Ver en Google Maps</a></div>' : "") +
        (listaServicios(c.servicios).length
          ? "<div><i>⚙️</i>" + esc(serviciosTexto(c.servicios)) + "</div>" : "") +
        "</div>" +
        '<div class="cli-pie"><div class="cli-monto">' + esc(montoTxt(c)) +
        "<small>" + esc(c.periodicidad === "unico" ? "pago único" : (c.periodicidad || "mensual")) + "</small></div>" +
        '<div class="v-tags">' +
        (pausado ? '<span class="tag">pausado</span>'
          : '<span class="tag' + (q.d < 0 ? " mal" : (q.d <= 3 ? " oro" : "")) + '">cobra ' + esc(q.txt) + "</span>") +
        (debe ? '<span class="tag mal">debe ' + esc(pesos(debe)) + "</span>" : "") +
        "</div></div>" +
        '<div class="cli-ops">' +
        '<button class="lnk oro" data-acc="ver">Ver todo</button>' +
        '<button class="lnk" data-acc="pago">+ Pago</button>' +
        (c.telefono ? '<button class="lnk" data-acc="wa">WhatsApp</button>' : "") +
        '<button class="lnk" data-acc="editar">Editar</button></div></article>';
    }).join("") : '<p class="vacio">Todavía no tienes clientes.<br>Dale a <b>+ Nuevo cliente</b>.</p>';

    cada("[data-cli]", function (el) {
      el.onclick = function (ev) {
        if (ev.target.closest("[data-noficha]")) return;
        var accion = ev.target.closest("[data-acc]");
        var id = el.dataset.cli;
        var c = clientes.filter(function (x) { return x.id === id; })[0];
        if (accion) {
          var a = accion.dataset.acc;
          if (a === "ver") abreFicha(id);
          else if (a === "pago") formPago(id);
          else if (a === "editar" && c) formCliente(c);
          else if (a === "wa" && c && c.telefono) {
            window.open("https://wa.me/52" + String(c.telefono).replace(/\D/g, "").slice(-10), "_blank");
          }
          return;
        }
        var ya = el.classList.contains("abierta");
        cada(".cli.abierta", function (x) { x.classList.remove("abierta"); });
        if (!ya) el.classList.add("abierta");
      };
    });
  }

  var abierta = null;

  function abreFicha(id) {
    var c = clientes.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    abierta = id;
    var f = proximaFecha(c.diaPago, c.periodicidad || "mensual", c.inicio);
    var q = cuando(f);
    var mios = pagosDe(id);
    var debe = deudaDe(id);
    var cob = totalPagado(id), gan = cob - gastadoEn(id);
    var det = c.detalles || {};

    var srvs = listaServicios(c.servicios).map(function (k) {
      var sv = servicio(k), dd = det[k];
      if (!sv) return "";
      var dato = "";
      if (dd && /^https?:/.test(dd)) {
        dato = '<a href="' + esc(dd) + '" target="_blank" rel="noopener">' +
          esc(String(dd).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + " ↗</a>";
      } else if (dd && sv[4] === "tel") {
        dato = '<a href="https://wa.me/52' + esc(String(dd).replace(/\D/g, "").slice(-10)) +
          '" target="_blank" rel="noopener">' + esc(dd) + "</a>";
      } else if (dd) dato = esc(dd);
      return '<div class="fs"><span>' + sv[1] + "</span><div><b>" + esc(sv[2]) + "</b>" +
        (dato ? "<small>" + dato + "</small>" : "") + "</div></div>";
    }).join("");

    var datos = [
      ["📱", c.telefono ? '<a href="https://wa.me/52' + esc(String(c.telefono).replace(/\D/g, "").slice(-10)) +
        '" target="_blank" rel="noopener">' + esc(c.telefono) + "</a>" : ""],
      ["📍", c.ubicacion ? '<a href="' + esc(c.ubicacion) + '" target="_blank" rel="noopener">Google Maps</a>' : ""],
      ["📸", c.instagram ? '<a href="' + esc(c.instagram) + '" target="_blank" rel="noopener">' +
        esc(String(c.instagram).replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "")) + "</a>" : ""],
      ["✉️", c.correo ? esc(c.correo) : ""]
    ].filter(function (d) { return d[1]; }).map(function (d) {
      return '<span class="fd">' + d[0] + " " + d[1] + "</span>";
    }).join("");

    $("fichaIn").innerHTML =
      '<button class="ficha-x" id="fichaX">✕</button>' +
      '<div class="ficha-cab">' + fotoHTML(c) + "<div>" +
      "<h3>" + esc(c.negocio || c.persona || "Sin nombre") + "</h3>" +
      "<p>" + esc(c.persona || "") + (c.inicio ? " · desde " + esc(diaLargo(c.inicio)) : "") + "</p></div></div>" +
      (datos ? '<div class="fds">' + datos + "</div>" : "") +

      (debe ? '<div class="deben" style="padding:18px 20px;margin-bottom:18px"><div class="deben-lbl">Te debe</div>' +
        '<div class="deben-n" style="font-size:2.1rem">' + esc(pesos(debe)) + "</div></div>" : "") +

      '<div class="fcards">' +
      '<div class="card"><div class="n">' + esc(c.montoVaria ? "Por definir" : pesos(c.monto)) + '</div><div class="t">al mes' +
      (c.estado === "pausado" ? " · en pausa" : " · cobra " + esc(q.txt)) + "</div></div>" +
      '<div class="card verde"><div class="n">' + esc(pesos(cob)) + '</div><div class="t">te ha pagado</div></div>' +
      '<div class="card ' + (gan >= 0 ? "verde" : "roja") + '"><div class="n">' + esc(pesos(gan)) +
      '</div><div class="t">ganancia</div></div></div>' +

      (srvs ? '<div class="ficha-sec"><h4>Sus servicios</h4>' + srvs + "</div>" : "") +

      '<div class="ficha-sec"><h4>Sus pagos</h4>' +
      (mios.filter(function (p) { return p.estado !== "pendiente"; }).length
        ? lineaTiempo(mios.filter(function (p) { return p.estado !== "pendiente"; }))
        : '<p class="vacio" style="padding:20px 0">Todavía no le registras pagos.</p>') + "</div>" +

      (c.notas ? '<div class="ficha-sec"><h4>Notas</h4><p style="color:var(--dim);line-height:1.6">' +
        esc(c.notas) + "</p></div>" : "") +

      '<p class="fpie">' + (!c.uid ? "⚪ Todavía sin cuenta"
        : c.claveCambiada ? "✅ Ya entró y tiene su propia contraseña"
          : "🟡 Tiene cuenta, pero sigue con la contraseña temporal") +
      " · sus mensajes te llegan " + (c.avisaA === "personal" ? "a tu WhatsApp personal" : "al del negocio") + "</p>" +

      '<div class="ficha-acc">' +
      '<button class="lnk oro" id="fPago">+ Registrar pago</button>' +
      '<button class="lnk" id="fEdit">Editar</button>' +
      '<button class="lnk mal" id="fBorra">Borrar cliente</button>' +
      "</div>";

    $("ficha").classList.add("on");
    $("fichaFondo").classList.add("on");
    $("fichaX").onclick = cierraFicha;
    $("fPago").onclick = function () { formPago(id); };
    $("fEdit").onclick = function () { formCliente(c); };
    $("fBorra").onclick = function () {
      P.confirmar("Borrar a " + (c.negocio || "este cliente"),
        "Se borra su ficha. Sus pagos se quedan.", "Sí, borrar").then(function (ok) {
          if (!ok) return;
          borrar("clientes", id).then(function () {
            clientes = clientes.filter(function (x) { return x.id !== id; });
            cierraFicha();
            P.toast("Cliente borrado", "bien");
            pintaClientes(); pintaFinanzas();
          }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
        });
    };
  }
  function cierraFicha() {
    abierta = null;
    $("ficha").classList.remove("on");
    $("fichaFondo").classList.remove("on");
  }

  /* ═══════════ alta / edición de cliente ═══════════ */
  function formCliente(c) {
    c = c || {};
    var ed = !!c.id;
    var h = hoyMX();
    P.modal("<h3>" + (ed ? "Editar ficha" : "Nuevo cliente") + '</h3>' +
      '<p class="sub">Sus datos.</p>' +
      '<div class="f-foto" style="margin-bottom:20px">' +
      '<span id="cfFotoPrev">' + fotoHTML(c) + "</span>" +
      '<div><label class="lnk" for="cfFoto">Subir foto</label>' +
      '<input id="cfFoto" type="file" accept="image/*" hidden>' +
      '<p style="font-size:.82rem;color:var(--muted);margin-top:8px">Logo del negocio o foto de la persona.</p></div></div>' +
      '<div class="form-grid">' +
      '<div class="f"><label>Negocio</label><input id="cfNeg" type="text" placeholder="Barberísimo" value="' + esc(c.negocio || "") + '"></div>' +
      '<div class="f"><label>Con quién tratas</label><input id="cfPer" type="text" placeholder="Gabriel" value="' + esc(c.persona || "") + '"></div>' +
      '<div class="f"><label>WhatsApp / teléfono</label><input id="cfTel" type="text" placeholder="33 2767 4349" value="' + esc(c.telefono || "") + '"></div>' +
      '<div class="f"><label>Correo</label><input id="cfMail" type="email" value="' + esc(c.correo || "") + '"></div>' +
      '<div class="f ancho"><label>Link de su Google Maps</label><input id="cfUbi" type="url" inputmode="url" placeholder="https://maps.app.goo.gl/…" value="' + esc(c.ubicacion || "") + '"></div>' +
      '<div class="f ancho"><label>Link de su Instagram</label><input id="cfIg" type="url" inputmode="url" placeholder="https://instagram.com/is.barberisimo" value="' + esc(c.instagram || "") + '"></div>' +
      '<div class="f"><label>Cliente desde</label><input id="cfIni" type="date" value="' + esc(c.inicio || h.iso) + '"></div>' +
      '<div class="f"><label>Cómo le cobras</label><select id="cfVaria">' +
      '<option value="0"' + (!c.montoVaria ? " selected" : "") + ">Siempre lo mismo</option>" +
      '<option value="1"' + (c.montoVaria ? " selected" : "") + ">Varía cada vez</option></select></div>" +
      '<div class="f ancho"><span class="f-tit">Qué le diste</span><div class="chk-grid" id="cfSrv">' +
      SERVICIOS.map(function (sv) {
        var puesto = listaServicios(c.servicios).indexOf(sv[0]) !== -1;
        return '<label class="chk' + (puesto ? " on" : "") + '"><input type="checkbox" value="' +
          sv[0] + '"' + (puesto ? " checked" : "") + '><span class="chk-ico">' + sv[1] +
          "</span>" + sv[2] + "</label>";
      }).join("") + "</div>" +
      '<div id="cfDet" class="det-grid"></div></div>' +
      '<div class="f"><label>Cobro de entrada</label><input id="cfInicial" type="number" min="0" step="1" placeholder="2000" value="' + esc(c.montoInicial || "") + '"></div>' +
      '<div class="f"><label id="cfMontoLbl">Cuánto te paga al mes</label><input id="cfMonto" type="number" min="0" step="1" value="' + esc(c.monto || "") + '"></div>' +
      '<div class="f"><label>Cada cuándo</label><select id="cfPer2">' +
      ["mensual", "anual", "unico"].map(function (x) {
        return '<option value="' + x + '"' + ((c.periodicidad || "mensual") === x ? " selected" : "") + ">" +
          (x === "unico" ? "Una sola vez" : x.charAt(0).toUpperCase() + x.slice(1)) + "</option>";
      }).join("") + "</select></div>" +
      '<div class="f"><label>Día de pago</label><input id="cfDia" type="number" min="1" max="31" placeholder="12" value="' + esc(c.diaPago || "") + '"></div>' +
      '<div class="f"><label>Estado</label><select id="cfEst">' +
      '<option value="activo"' + (c.estado !== "pausado" ? " selected" : "") + ">Activo</option>" +
      '<option value="pausado"' + (c.estado === "pausado" ? " selected" : "") + ">Pausado</option></select></div>" +
      '<div class="f"><label>Sus mensajes me llegan a</label><select id="cfAvisa">' +
      '<option value="personal"' + (c.avisaA === "personal" ? " selected" : "") + ">Mi WhatsApp personal</option>" +
      '<option value="negocio"' + (c.avisaA !== "personal" ? " selected" : "") + ">El del negocio</option></select></div>" +
      '<div class="f"><label>ID de acceso a su cuenta</label><input id="cfUid" type="text" placeholder="lo copias de Firebase" value="' + esc(c.uid || "") + '"></div>' +
      '<div class="f ancho"><label>Notas</label><textarea id="cfNotas" placeholder="Lo que quieras recordar de él…">' + esc(c.notas || "") + "</textarea></div>" +
      "</div>" +
      '<div class="modal-acc"><button class="lnk" id="cfNo">Cancelar</button>' +
      '<button class="lnk oro" id="cfSi">' + (ed ? "Guardar cambios" : "Dar de alta") + "</button></div>");

    var det = (c.detalles && typeof c.detalles === "object") ? c.detalles : {};
    function pintaDetalles() {
      Array.prototype.forEach.call($("cfDet").querySelectorAll("input"), function (i) {
        det[i.dataset.srv] = i.value;
      });
      var puestos = Array.prototype.map.call(
        $("cfSrv").querySelectorAll("input:checked"), function (x) { return x.value; });
      $("cfDet").innerHTML = puestos.map(function (k) {
        var sv = servicio(k);
        if (!sv) return "";
        return '<div class="f" style="margin-bottom:0"><label>' + esc(sv[3]) +
          ' <span style="color:var(--muted)">\u00b7 ' + esc(sv[2]) + '</span></label>' +
          '<input type="' + sv[4] + '" data-srv="' + k + '" placeholder="' + esc(sv[5]) +
          '" value="' + esc(det[k] || "") + '"></div>';
      }).join("");
    }
    Array.prototype.forEach.call($("cfSrv").querySelectorAll("input"), function (x) {
      x.onchange = function () {
        x.closest(".chk").classList.toggle("on", x.checked);
        pintaDetalles();
      };
    });
    pintaDetalles();
    function etiquetaMonto() {
      $("cfMontoLbl").textContent = $("cfVaria").value === "1"
        ? "Lo que le cobras normalmente" : "Cu\u00e1nto te paga al mes";
    }
    $("cfVaria").onchange = etiquetaMonto;
    etiquetaMonto();

    var foto = c.foto || "";
    $("cfFoto").onchange = function () {
      var file = this.files && this.files[0];
      if (!file) return;
      achica(file, function (d) {
        foto = d;
        $("cfFotoPrev").innerHTML = '<img class="foto" src="' + d + '" alt="">';
      });
    };

    $("cfNo").onclick = P.cierraModal;
    $("cfSi").onclick = function () {
      var neg = $("cfNeg").value.trim(), per = $("cfPer").value.trim();
      if (!neg && !per) return P.toast("Ponle al menos el negocio o el nombre", "mal");
      var obj = {
        negocio: neg,
        persona: per,
        telefono: $("cfTel").value.trim(),
        correo: $("cfMail").value.trim(),
        ubicacion: $("cfUbi").value.trim(),
        instagram: $("cfIg").value.trim(),
        servicios: Array.prototype.map.call(
          $("cfSrv").querySelectorAll("input:checked"), function (x) { return x.value; }),
        detalles: (function () {
          var d = {};
          Array.prototype.forEach.call($("cfDet").querySelectorAll("input"), function (i) {
            var v = i.value.trim();
            if (v) d[i.dataset.srv] = v;
          });
          return d;
        })(),
        notas: $("cfNotas").value.trim(),
        avisaA: $("cfAvisa").value,
        uid: $("cfUid").value.trim(),
        monto: num($("cfMonto").value),
        montoInicial: num($("cfInicial").value),
        montoVaria: $("cfVaria").value === "1",
        periodicidad: $("cfPer2").value,
        diaPago: num($("cfDia").value),
        inicio: $("cfIni").value,
        estado: $("cfEst").value,
        foto: foto
      };
      var op = ed ? actualizar("clientes", c.id, obj) : crear("clientes", obj);
      op.then(function (d) {
        if (ed) {
          var cambioUid = obj.uid && obj.uid !== c.uid;
          for (var k in obj) c[k] = obj[k];
          if (cambioUid) ligaPagos(c.id, obj.uid);
        } else {
          obj.id = d.name.split("/").pop();
          obj.creado = new Date().toISOString();
          clientes.push(obj);
          clientes.sort(function (a, b) {
            return String(a.negocio || "").localeCompare(String(b.negocio || ""));
          });
        }
        P.cierraModal();
        P.toast(ed ? "Ficha guardada" : "Cliente dado de alta", "bien");
        pintaClientes(); pintaFinanzas();
        if (ed && abierta === c.id) abreFicha(c.id);
      }).catch(function (e) { P.toast("No se pudo guardar: " + e.message, "mal"); });
    };
  }

  /* Cuando un cliente estrena acceso, sus pagos viejos necesitan su uid
     o no los ve en su portal (así filtran las reglas de Firestore). */
  function ligaPagos(clienteId, nuevoUid) {
    var mios = pagos.filter(function (p) {
      return p.clienteId === clienteId && p.clienteUid !== nuevoUid;
    });
    if (!mios.length) return;
    Promise.all(mios.map(function (p) {
      return actualizar("pagos", p.id, { clienteUid: nuevoUid }).then(function () {
        p.clienteUid = nuevoUid;
      });
    })).then(function () {
      P.toast("Sus " + mios.length + " pagos ya se le ven en su cuenta", "bien");
    }).catch(function () {
      P.toast("No se pudieron ligar todos sus pagos", "mal");
    });
  }

  /* foto → cuadrada de 256px, JPEG, para que quepa en el documento */
  function achica(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var L = 256, cv = document.createElement("canvas");
        cv.width = L; cv.height = L;
        var g = cv.getContext("2d");
        g.fillStyle = "#141414";
        g.fillRect(0, 0, L, L);
        var lado = Math.min(img.width, img.height);
        g.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, L, L);
        cb(cv.toDataURL("image/jpeg", 0.82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  /* ═══════════ PROSPECTOS ═══════════ */
  var ESTADOS = [
    ["nuevo", "Sin contactar"],
    ["contactado", "Ya le escrib\u00ed"],
    ["cotizado", "Le pas\u00e9 precio"],
    ["cerrado", "Cerrado"],
    ["descartado", "No se dio"]
  ];
  function nombreEstado(e) {
    for (var i = 0; i < ESTADOS.length; i++) if (ESTADOS[i][0] === e) return ESTADOS[i][1];
    return "Sin contactar";
  }

  function pintaProspectos() {
    $("numPros").textContent = prospectos.length;
    $("prospectos").innerHTML = prospectos.length ? prospectos.map(function (x) {
      var est = x.estado || "nuevo";
      var links = "";
      if (x.maps) links += '<div><i>\ud83d\udccd</i><a href="' + esc(x.maps) +
        '" target="_blank" rel="noopener" data-noficha="1">Google Maps</a></div>';
      if (x.instagram) links += '<div><i>\ud83d\udcf8</i><a href="' + esc(x.instagram) +
        '" target="_blank" rel="noopener" data-noficha="1">Instagram</a></div>';
      if (x.web) links += '<div><i>\ud83c\udf10</i><a href="' + esc(x.web) +
        '" target="_blank" rel="noopener" data-noficha="1">Su p\u00e1gina</a></div>';
      if (x.telefono) links += "<div><i>\ud83d\udcf1</i>" + esc(x.telefono) + "</div>";

      return '<article class="cli"><div class="cli-top">' +
        '<span class="foto ini">' + esc(iniciales(x.nombre)) + "</span><div>" +
        '<div class="cli-nom">' + esc(x.nombre || "Sin nombre") + "</div>" +
        '<div class="cli-per">' + esc(x.giro || "") + "</div></div></div>" +
        (x.interes ? '<div class="cli-datos"><div><i>\u2699\ufe0f</i>' +
          esc(serviciosTexto(x.interes)) + "</div>" + links + "</div>"
          : (links ? '<div class="cli-datos">' + links + "</div>" : "")) +
        (x.notas ? '<div class="pros-notas">' + esc(x.notas) + "</div>" : "") +
        '<div class="pros-acc"><span class="pros-estado ' + esc(est) + '">' +
        esc(nombreEstado(est)) + "</span>" +
        '<button class="lnk" data-editapros="' + esc(x.id) + '">Editar</button>' +
        '<button class="lnk oro" data-acliente="' + esc(x.id) + '">Pasarlo a cliente</button>' +
        '<button class="lnk mal" data-borrapros="' + esc(x.id) + '">Borrar</button></div></article>';
    }).join("") : '<p class="vacio">Todav\u00eda no tienes prospectos.<br>' +
      "Dale a <b>+ Nuevo prospecto</b>.</p>";

    cada("[data-editapros]", function (b) {
      b.onclick = function () {
        var x = prospectos.filter(function (y) { return y.id === b.dataset.editapros; })[0];
        if (x) formProspecto(x);
      };
    });
    cada("[data-borrapros]", function (b) {
      b.onclick = function () {
        P.confirmar("Borrar este prospecto", "Se borra de tu lista.", "S\u00ed, borrar")
          .then(function (ok) {
            if (!ok) return;
            borrar("prospectos", b.dataset.borrapros).then(function () {
              prospectos = prospectos.filter(function (y) { return y.id !== b.dataset.borrapros; });
              P.toast("Borrado", "bien");
              pintaProspectos();
            }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
          });
      };
    });
    cada("[data-acliente]", function (b) {
      b.onclick = function () {
        var x = prospectos.filter(function (y) { return y.id === b.dataset.acliente; })[0];
        if (!x) return;
        P.confirmar("Pasar a " + (x.nombre || "este prospecto") + " a clientes",
          "Se crea su ficha con lo que ya anotaste y sale de prospectos.",
          "S\u00ed, ya es cliente").then(function (ok) {
            if (!ok) return;
            var nuevo = {
              negocio: x.nombre || "", persona: x.persona || "", telefono: x.telefono || "",
              correo: "", ubicacion: x.maps || "", instagram: x.instagram || "",
              servicios: Array.isArray(x.interes) ? x.interes : [],
              notas: x.notas || "", monto: 0, montoInicial: 0, montoVaria: false,
              periodicidad: "mensual", diaPago: 0, inicio: hoyMX().iso,
              estado: "activo", foto: "", avisaA: "negocio", uid: ""
            };
            crear("clientes", nuevo).then(function (d) {
              nuevo.id = d.name.split("/").pop();
              clientes.push(nuevo);
              return borrar("prospectos", x.id);
            }).then(function () {
              prospectos = prospectos.filter(function (y) { return y.id !== x.id; });
              P.toast("Ya es cliente", "bien");
              pintaProspectos(); pintaClientes(); pintaFinanzas();
            }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
          });
      };
    });
  }

  function formProspecto(x) {
    x = x || {};
    var ed = !!x.id;
    var suyos = Array.isArray(x.interes) ? x.interes : [];
    P.modal("<h3>" + (ed ? "Editar prospecto" : "Nuevo prospecto") + "</h3>" +
      '<p class="sub">Un negocio que quieres tocar.</p>' +
      '<div class="form-grid">' +
      '<div class="f"><label>Negocio</label><input id="prNom" type="text" placeholder="Honey Scoop" value="' + esc(x.nombre || "") + '"></div>' +
      '<div class="f"><label>De qu\u00e9 es</label><input id="prGiro" type="text" placeholder="Helader\u00eda" value="' + esc(x.giro || "") + '"></div>' +
      '<div class="f"><label>Con qui\u00e9n hablas</label><input id="prPer" type="text" value="' + esc(x.persona || "") + '"></div>' +
      '<div class="f"><label>Tel\u00e9fono</label><input id="prTel" type="text" value="' + esc(x.telefono || "") + '"></div>' +
      '<div class="f ancho"><label>Link de su Google Maps</label><input id="prMaps" type="url" placeholder="https://maps.app.goo.gl/\u2026" value="' + esc(x.maps || "") + '"></div>' +
      '<div class="f ancho"><label>Link de su Instagram</label><input id="prIg" type="url" value="' + esc(x.instagram || "") + '"></div>' +
      '<div class="f ancho"><label>Su p\u00e1gina o la preview que le hiciste</label><input id="prWeb" type="url" value="' + esc(x.web || "") + '"></div>' +
      '<div class="f ancho"><span class="f-tit">Qu\u00e9 le vender\u00edas</span><div class="chk-grid" id="prSrv">' +
      SERVICIOS.map(function (sv) {
        var puesto = suyos.indexOf(sv[0]) !== -1;
        return '<label class="chk' + (puesto ? " on" : "") + '"><input type="checkbox" value="' +
          sv[0] + '"' + (puesto ? " checked" : "") + '><span class="chk-ico">' + sv[1] + "</span>" + sv[2] + "</label>";
      }).join("") + "</div></div>" +
      '<div class="f ancho"><label>C\u00f3mo va</label><select id="prEst">' +
      ESTADOS.map(function (e) {
        return '<option value="' + e[0] + '"' + ((x.estado || "nuevo") === e[0] ? " selected" : "") + ">" + e[1] + "</option>";
      }).join("") + "</select></div>" +
      '<div class="f ancho"><label>Notas</label><textarea id="prNotas" placeholder="Lo que sepas del negocio\u2026">' + esc(x.notas || "") + "</textarea></div>" +
      "</div>" +
      '<div class="modal-acc"><button class="lnk" id="prNo">Cancelar</button>' +
      '<button class="lnk oro" id="prSi">' + (ed ? "Guardar" : "Agregar") + "</button></div>");

    Array.prototype.forEach.call($("prSrv").querySelectorAll("input"), function (i) {
      i.onchange = function () { i.closest(".chk").classList.toggle("on", i.checked); };
    });
    $("prNo").onclick = P.cierraModal;
    $("prSi").onclick = function () {
      var nom = $("prNom").value.trim();
      if (!nom) return P.toast("Ponle el nombre del negocio", "mal");
      var obj = {
        nombre: nom, giro: $("prGiro").value.trim(), persona: $("prPer").value.trim(),
        telefono: $("prTel").value.trim(), maps: $("prMaps").value.trim(),
        instagram: $("prIg").value.trim(), web: $("prWeb").value.trim(),
        interes: Array.prototype.map.call($("prSrv").querySelectorAll("input:checked"),
          function (i) { return i.value; }),
        estado: $("prEst").value, notas: $("prNotas").value.trim()
      };
      var op = ed ? actualizar("prospectos", x.id, obj) : crear("prospectos", obj);
      op.then(function (d) {
        if (ed) { for (var k in obj) x[k] = obj[k]; }
        else {
          obj.id = d.name.split("/").pop();
          obj.creado = new Date().toISOString();
          prospectos.push(obj);
          prospectos.sort(function (a, b) {
            return String(a.nombre || "").localeCompare(String(b.nombre || ""));
          });
        }
        P.cierraModal();
        P.toast(ed ? "Guardado" : "Prospecto agregado", "bien");
        pintaProspectos();
      }).catch(function (e) { P.toast("No se pudo guardar: " + e.message, "mal"); });
    };
  }

  /* ═══════════ RESEÑAS ═══════════ */
  var resenasSinReglas = false;
  function estrellasTxt(n) {
    n = Math.max(0, Math.min(5, num(n)));
    return new Array(n + 1).join("★") + "<i>" + new Array(6 - n).join("★") + "</i>";
  }
  function pintaResenas() {
    $("numRes").textContent = resenas.length;
    if (resenasSinReglas) {
      $("resAviso").innerHTML = '<div class="aviso"><i>⚠️</i><div><b>Faltan las reglas de reseñas.</b><br>' +
        "Pega otra vez <code>firebase/firestore-rules.txt</code> en la consola y dale Publicar.</div></div>";
    } else $("resAviso").innerHTML = "";
    $("resenas").innerHTML = resenas.length ? resenas.map(function (x) {
      var c = clientes.filter(function (y) { return y.id === x.clienteId; })[0];
      var cara = c && c.foto ? '<img src="' + esc(c.foto) + '" alt="">'
        : '<span class="foto ini">' + esc(iniciales(x.nombre || x.negocio)) + "</span>";
      return '<article class="res"><div class="res-est">' + estrellasTxt(x.estrellas || 5) + "</div>" +
        '<p class="res-txt">“' + esc(x.texto || "") + "”</p>" +
        '<div class="res-quien">' + cara + "<div><b>" + esc(x.nombre || "") + "</b>" +
        "<small>" + esc(x.negocio || "") + (x.fecha ? " · " + esc(dia(x.fecha)) : "") + "</small></div></div>" +
        '<div class="res-acc"><span class="tag ' + (x.publicar ? "ok" : "") + '">' +
        (x.publicar ? "Lista para la página" : "Solo en el panel") + "</span>" +
        '<button class="lnk" data-editres="' + esc(x.id) + '">Editar</button>' +
        '<button class="lnk mal" data-borrares="' + esc(x.id) + '">Borrar</button></div></article>';
    }).join("") : '<p class="vacio">Todavía no tienes reseñas.<br>Dale a <b>+ Nueva reseña</b> cuando te den una.</p>';

    cada("[data-editres]", function (b) {
      b.onclick = function () {
        var x = resenas.filter(function (y) { return y.id === b.dataset.editres; })[0];
        if (x) formResena(x);
      };
    });
    cada("[data-borrares]", function (b) {
      b.onclick = function () {
        P.confirmar("Borrar esta reseña", "No se puede deshacer.", "Sí, borrar").then(function (ok) {
          if (!ok) return;
          borrar("resenas", b.dataset.borrares).then(function () {
            resenas = resenas.filter(function (y) { return y.id !== b.dataset.borrares; });
            P.toast("Borrada", "bien");
            pintaResenas();
          }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
        });
      };
    });
  }

  function formResena(x) {
    x = x || {};
    var ed = !!x.id, est = num(x.estrellas) || 5;
    P.modal("<h3>" + (ed ? "Editar reseña" : "Nueva reseña") + "</h3>" +
      '<p class="sub">Lo que te dijo tal cual.</p>' +
      '<div class="form-grid">' +
      '<div class="f"><label>De qué cliente</label><select id="rsCli"><option value="">Otro</option>' +
      clientes.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (x.clienteId === c.id ? " selected" : "") + ">" +
          esc(c.negocio || c.persona) + "</option>";
      }).join("") + "</select></div>" +
      '<div class="f"><label>Fecha</label><input id="rsFecha" type="date" value="' + esc(x.fecha || hoyMX().iso) + '"></div>' +
      '<div class="f"><label>Quién la dio</label><input id="rsNom" type="text" placeholder="Gabriel" value="' + esc(x.nombre || "") + '"></div>' +
      '<div class="f"><label>Su negocio</label><input id="rsNeg" type="text" placeholder="Barberísimo" value="' + esc(x.negocio || "") + '"></div>' +
      '<div class="f ancho"><label>Estrellas</label><div class="estrellas" id="rsEst">' +
      [1, 2, 3, 4, 5].map(function (i) {
        return '<button type="button" data-e="' + i + '"' + (i <= est ? ' class="on"' : "") + ">★</button>";
      }).join("") + "</div></div>" +
      '<div class="f ancho"><label>Lo que dijo</label><textarea id="rsTxt">' + esc(x.texto || "") + "</textarea></div>" +
      '<div class="f ancho"><label>¿La ponemos en la página cuando esté la sección?</label><select id="rsPub">' +
      '<option value="0"' + (!x.publicar ? " selected" : "") + ">Todavía no</option>" +
      '<option value="1"' + (x.publicar ? " selected" : "") + ">Sí</option></select></div>" +
      "</div>" +
      '<div class="modal-acc"><button class="lnk" id="rsNo">Cancelar</button>' +
      '<button class="lnk oro" id="rsSi">Guardar</button></div>');

    Array.prototype.forEach.call($("rsEst").querySelectorAll("button"), function (b) {
      b.onclick = function () {
        est = +b.dataset.e;
        Array.prototype.forEach.call($("rsEst").querySelectorAll("button"), function (y) {
          y.classList.toggle("on", +y.dataset.e <= est);
        });
      };
    });
    $("rsCli").onchange = function () {
      var c = clientes.filter(function (y) { return y.id === $("rsCli").value; })[0];
      if (c) {
        if (!$("rsNom").value) $("rsNom").value = c.persona || "";
        if (!$("rsNeg").value) $("rsNeg").value = c.negocio || "";
      }
    };
    $("rsNo").onclick = P.cierraModal;
    $("rsSi").onclick = function () {
      var txt = $("rsTxt").value.trim();
      if (!txt) return P.toast("Falta lo que dijo", "mal");
      var obj = {
        clienteId: $("rsCli").value, nombre: $("rsNom").value.trim(), negocio: $("rsNeg").value.trim(),
        estrellas: est, texto: txt, fecha: $("rsFecha").value, publicar: $("rsPub").value === "1"
      };
      var op = ed ? actualizar("resenas", x.id, obj) : crear("resenas", obj);
      op.then(function (d) {
        if (ed) { for (var k in obj) x[k] = obj[k]; }
        else { obj.id = d.name.split("/").pop(); resenas.unshift(obj); }
        P.cierraModal();
        P.toast("Reseña guardada", "bien");
        pintaResenas();
      }).catch(function (e) { P.toast("No se pudo guardar: " + e.message, "mal"); });
    };
  }

  /* ═══════════ LO QUE TE PIDEN ═══════════ */
  function sinAtender() {
    return peticiones.filter(function (x) { return !x.atendida; });
  }
  function contadorPeticiones() {
    var n = sinAtender().length;
    $("numPide").textContent = n;
    $("numPide").hidden = !n;
    $("numPide").className = "nav-num" + (n ? " alerta" : "");
  }
  function claseTipo(t) {
    if (/problema/i.test(t)) return "prob";
    if (/contratar/i.test(t)) return "nuevo";
    return "";
  }
  function cuandoTxt(iso) {
    if (!iso) return "\u2014";
    var min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "ahorita";
    if (min < 60) return "hace " + min + " min";
    var h = Math.round(min / 60);
    if (h < 24) return "hace " + h + " h";
    var d = Math.round(h / 24);
    return d === 1 ? "ayer" : "hace " + d + " d\u00edas";
  }

  function pintaPeticiones() {
    var lista = verAtendidas ? peticiones : sinAtender();
    $("btnPideTodas").textContent = verAtendidas
      ? "Ver solo las pendientes"
      : "Ver tambi\u00e9n las atendidas";
    contadorPeticiones();

    $("piden").innerHTML = lista.length ? lista.map(function (x) {
      var c = clientes.filter(function (y) { return y.id === x.clienteId; })[0];
      var tel = (c && c.telefono) ? String(c.telefono).replace(/\D/g, "") : "";
      var pie = "";
      if (tel) {
        pie += '<a class="lnk" href="https://wa.me/52' + esc(tel.slice(-10)) +
          '" target="_blank" rel="noopener">Contestarle por WhatsApp \u2197</a>';
      }
      if (c) pie += '<button class="lnk" data-verficha="' + esc(c.id) + '">Ver su ficha</button>';
      pie += '<button class="lnk ' + (x.atendida ? "" : "oro") + ' sep" data-atender="' + esc(x.id) +
        '">' + (x.atendida ? "Marcar sin atender" : "Ya lo atend\u00ed") + "</button>";
      pie += '<button class="lnk mal" data-borrapet="' + esc(x.id) + '">Borrar</button>';

      return '<article class="pet' + (x.atendida ? " ok" : "") + '"><div class="pet-top"><div>' +
        '<div class="pet-neg">' + esc(x.negocio || "Sin nombre") + "</div>" +
        '<span class="pet-tipo ' + claseTipo(x.tipo) + '">' + esc(x.tipo || "Petici\u00f3n") + "</span>" +
        (x.atendida ? ' <span class="tag ok">atendida</span>' : "") +
        '</div><span class="pet-cuando">' + esc(cuandoTxt(x.cuando)) + "</span></div>" +
        '<div class="pet-txt">' + esc(x.texto || "") + "</div>" +
        '<div class="pet-pie">' + pie + "</div></article>";
    }).join("") : '<p class="vacio">' + (verAtendidas
      ? "Nadie te ha pedido nada."
      : "Nada pendiente.") + "</p>";

    cada("[data-atender]", function (b) {
      b.onclick = function () {
        var x = peticiones.filter(function (y) { return y.id === b.dataset.atender; })[0];
        if (!x) return;
        var nuevo = !x.atendida;
        actualizar("sugerencias", x.id, { atendida: nuevo }).then(function () {
          x.atendida = nuevo;
          P.toast(nuevo ? "Marcada como atendida" : "De vuelta a pendientes", "bien");
          pintaPeticiones();
        }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
      };
    });
    cada("[data-borrapet]", function (b) {
      b.onclick = function () {
        P.confirmar("Borrar esta petici\u00f3n",
          "El cliente no se entera.", "S\u00ed, borrar").then(function (ok) {
            if (!ok) return;
            borrar("sugerencias", b.dataset.borrapet).then(function () {
              peticiones = peticiones.filter(function (y) { return y.id !== b.dataset.borrapet; });
              P.toast("Borrada", "bien");
              pintaPeticiones();
            }).catch(function (e) { P.toast("No se pudo: " + e.message, "mal"); });
          });
      };
    });
    cada("[data-verficha]", function (b) {
      b.onclick = function () { abreFicha(b.dataset.verficha); };
    });
  }

  /* ═══════════ arranque ═══════════ */
  window.TDN = {
    abre: function (k) {
      if (!listo) return;
      asegura(function () {
        if (k === "clientes") pintaClientes();
        else if (k === "piden") pintaPeticiones();
        else if (k === "prospectos") pintaProspectos();
        else if (k === "resenas") pintaResenas();
        else pintaFinanzas();
      });
    }
  };

  function init() {
    P = window.TDP;
    listo = true;
    $("btnCliNuevo").onclick = function () { formCliente(null); };
    $("btnPagoNuevo").onclick = function () { formPago(null); };
    $("btnGastoNuevo").onclick = function () { formGasto(null); };
    $("finMesSel").onchange = pintaPorMes;
    $("finTablaSel").onchange = pintaTablaPagos;
    $("btnPideTodas").onclick = function () { verAtendidas = !verAtendidas; pintaPeticiones(); };
    $("btnProsNuevo").onclick = function () { formProspecto(null); };
    $("btnResNueva").onclick = function () { formResena(null); };
    asegura(function () { pintaClientes(); pintaFinanzas(); pintaPeticiones(); pintaProspectos(); });
  }

  if (window.TDP) window.TDP.listo(init);
  else document.addEventListener("DOMContentLoaded", function () {
    if (window.TDP) window.TDP.listo(init);
  });
})();
