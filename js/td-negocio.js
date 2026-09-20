(function () {
  var P = null, listo = false;
  var clientes = [], pagos = [], gastos = [];
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
    return "$" + n.toLocaleString("es-MX");
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }

  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

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
      if (c.periodicidad === "mensual") return a + num(c.monto);
      if (c.periodicidad === "anual") return a + num(c.monto) / 12;
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
    return gastos.reduce(function (a, g) { return a + gastoMensual(g); }, 0);
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

  /* ═══════════ avisos ═══════════ */
  function avisoReglas(donde) {
    $(donde).innerHTML = '<div class="aviso"><i>⚠️</i><div>' +
      "<b>Falta publicar las reglas de Firestore.</b><br>" +
      "Las colecciones <code>clientes</code>, <code>pagos</code> y <code>gastos</code> " +
      "todavía no están permitidas. Abre la consola de Firebase, pega las reglas de " +
      "<code>firebase/firestore-rules.txt</code> y dale Publicar. Mientras tanto esta sección " +
      "se queda vacía.<br><br>" +
      '<button class="lnk" data-reintenta="1">Ya las publiqu\u00e9, reintentar</button></div></div>';
  }
  function limpiaAviso(donde) { if ($(donde)) $(donde).innerHTML = ""; }

  /* ═══════════ carga ═══════════ */
  function cargaTodo() {
    return Promise.all([listar("clientes"), listar("pagos"), listar("gastos")])
      .then(function (r) {
        clientes = r[0].sort(function (a, b) {
          return String(a.negocio || "").localeCompare(String(b.negocio || ""));
        });
        pagos = r[1];
        gastos = r[2];
        cargado.clientes = true;
        cargado.finanzas = true;
        limpiaAviso("cliAviso"); limpiaAviso("finAviso");
        $("numCli").textContent = clientes.length;
      });
  }

  var sinReglas = false;

  function asegura(cb) {
    if (cargado.clientes) return cb();
    if (sinReglas) return;
    cargaTodo().then(cb).catch(function (e) {
      if (String(e.message) === "reglas") {
        sinReglas = true;
        avisoReglas("cliAviso"); avisoReglas("finAviso");
        $("clientes").innerHTML = "";
        $("finCards").innerHTML = "";
        cada("[data-reintenta]", function (b) {
          b.onclick = function () { sinReglas = false; asegura(function () { pintaClientes(); pintaFinanzas(); }); };
        });
      } else {
        P.toast("No se pudo leer: " + e.message, "mal");
      }
    });
  }

  /* ═══════════ FINANZAS ═══════════ */
  function pintaFinanzas() {
    var entra = entraAlMes(), cobrado = cobradoEsteMes(), deben = teDeben(), gm = gastosAlMes();
    var limpio = entra - gm;
    var h = hoyMX();

    $("finMes").textContent = MESES[h.m - 1].toUpperCase() + " " + h.a;
    $("finSub").textContent = clientes.length
      ? plural(activos().length, "cliente activo", "clientes activos") + " de " + clientes.length +
        " · tipo de cambio $" + USD + " por dólar"
      : "Todavía no has dado de alta ningún cliente.";

    $("finCards").innerHTML = [
      ["", pesos(entra), "Entra al mes", plural(activos().length, "cliente activo", "clientes activos")],
      ["verde", pesos(cobrado), "Cobrado este mes", "lo que ya te pagaron"],
      ["roja", pesos(deben), "Te deben", plural(pagos.filter(function (p) { return p.estado === "pendiente"; }).length, "pago pendiente", "pagos pendientes")],
      ["azul", pesos(gm), "Tus gastos al mes", plural(gastos.filter(function (g) { return g.activo; }).length, "gasto activo", "gastos activos")],
      [limpio >= 0 ? "verde" : "roja", pesos(limpio), "Te queda limpio", "entra menos gastos"]
    ].map(function (c) {
      return '<div class="card ' + c[0] + '"><div class="n">' + esc(c[1]) + '</div><div class="t">' +
        esc(c[2]) + '</div><div class="p">' + esc(c[3]) + "</div></div>";
    }).join("");

    /* próximos cobros */
    var prox = activos().filter(function (c) { return num(c.monto) > 0; }).map(function (c) {
      var f = proximaFecha(c.diaPago, c.periodicidad || "mensual", c.inicio);
      return { c: c, f: f, q: cuando(f) };
    }).sort(function (a, b) { return a.q.d - b.q.d; });

    $("finProx").innerHTML = prox.length ? prox.map(function (x) {
      var cl = x.q.d < 0 ? "mal" : (x.q.d <= 3 ? "oro" : "");
      return '<div class="fila"><b>' + esc(x.c.negocio || x.c.persona || "Sin nombre") +
        ' <span class="tag ' + cl + '" style="margin-left:8px">' + esc(x.q.txt) + "</span></b>" +
        "<span>" + esc(pesos(x.c.monto)) + " · " + esc(dia(x.f)) + "</span></div>";
    }).join("") : '<p class="vacio">Da de alta un cliente con su monto y su día de pago y aquí sale cuándo toca cobrarle.</p>';

    /* te deben */
    var pend = pagos.filter(function (p) { return p.estado === "pendiente"; })
      .sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
    $("finDeben").innerHTML = pend.length ? pend.map(function (p) {
      return '<div class="hist pend"><div><b>' + esc(p.clienteNombre || "—") + "</b>" +
        "<small>" + esc(p.concepto || "Sin concepto") + " · " + esc(dia(p.fecha)) + "</small></div>" +
        '<div class="hist-acc"><span>' + esc(pesos(p.monto)) + "</span>" +
        '<button class="lnk" data-cobrado="' + esc(p.id) + '">Ya me pagó</button>' +
        '<button class="lnk mal" data-borrapago="' + esc(p.id) + '">Borrar</button></div></div>';
    }).join("") : '<p class="vacio">Nadie te debe nada. Todo al corriente.</p>';

    /* gastos propios */
    var gs = gastos.slice().map(function (g) {
      var pf = proximaFecha(g.dia, g.periodicidad || "mensual", g.fecha);
      return { g: g, d: g.activo ? cuando(pf).d : 99999 };
    }).sort(function (a, b) { return a.d - b.d; }).map(function (x) { return x.g; });
    $("finGastos").innerHTML = gs.length ? gs.map(function (g) {
      var f = proximaFecha(g.dia, g.periodicidad || "mensual", g.fecha);
      var q = cuando(f);
      var mxn = num(g.monto) * (g.moneda === "USD" ? USD : 1);
      var et = g.moneda === "USD" ? " USD · " + pesos(mxn) : "";
      return '<div class="hist' + (g.activo ? "" : " pend") + '"><div><b>' + esc(g.nombre || "—") +
        (g.activo ? "" : ' <span class="tag">pausado</span>') + "</b>" +
        "<small>" + esc(g.periodicidad || "mensual") + " · día " + esc(g.dia || "—") +
        (g.activo ? " · " + esc(q.txt) : "") + (g.notas ? " · " + esc(g.notas) : "") + "</small></div>" +
        '<div class="hist-acc"><span style="color:var(--blue)">' +
        esc(g.moneda === "USD" ? "$" + num(g.monto) : pesos(g.monto)) + esc(et) + "</span>" +
        '<button class="lnk" data-editagasto="' + esc(g.id) + '">Editar</button>' +
        '<button class="lnk mal" data-borragasto="' + esc(g.id) + '">Borrar</button></div></div>';
    }).join("") : '<p class="vacio">Agrega lo que pagas tú cada mes (Twilio, Claude, dominios, VAPI…) y aquí ves cuándo toca y cuánto se te va.</p>';

    /* historial */
    var hist = pagos.filter(function (p) { return p.estado !== "pendiente"; })
      .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 15);
    $("finHist").innerHTML = hist.length ? hist.map(function (p) {
      return '<div class="hist"><div><b>' + esc(p.clienteNombre || "—") + "</b>" +
        "<small>" + esc(p.concepto || "Sin concepto") + " · " + esc(dia(p.fecha)) +
        (p.metodo ? " · " + esc(p.metodo) : "") + "</small></div>" +
        '<div class="hist-acc"><span>' + esc(pesos(p.monto)) + "</span>" +
        '<button class="lnk mal" data-borrapago="' + esc(p.id) + '">Borrar</button></div></div>';
    }).join("") : '<p class="vacio">Cuando registres un pago aparece aquí.</p>';

    var pendN = pend.length;
    $("numFin").textContent = pendN;
    $("numFin").hidden = !pendN;
    $("numFin").className = "nav-num" + (pendN ? " alerta" : "");

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

    P.modal('<h3>Registrar un pago</h3><p class="sub">Quién te pagó, cuánto y por qué.</p>' +
      '<div class="form-grid">' +
      '<div class="f ancho"><label>Cliente</label><select id="pgCli">' + ops + "</select></div>" +
      '<div class="f"><label>Monto (MXN)</label><input id="pgMonto" type="number" min="0" step="1" placeholder="1500"></div>' +
      '<div class="f"><label>Fecha</label><input id="pgFecha" type="date" value="' + h.iso + '"></div>' +
      '<div class="f"><label>Concepto</label><input id="pgConcepto" type="text" placeholder="Mensualidad de septiembre"></div>' +
      '<div class="f"><label>Cómo te pagó</label><select id="pgMetodo">' +
      '<option>Transferencia</option><option>Efectivo</option><option>Depósito</option><option>Mercado Pago</option><option>Otro</option></select></div>' +
      '<div class="f ancho"><label>Estado</label><select id="pgEstado">' +
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
        clienteNombre: (c && (c.negocio || c.persona)) || "",
        monto: Math.round(monto),
        fecha: $("pgFecha").value || h.iso,
        concepto: $("pgConcepto").value.trim(),
        metodo: $("pgMetodo").value,
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
      '<p class="sub">Lo que pagas tú: Twilio, Claude, dominios, VAPI, servidores…</p>' +
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
        (c.ubicacion ? "<div><i>📍</i>" + esc(c.ubicacion) + "</div>" : "") +
        (c.servicios ? "<div><i>⚙️</i>" + esc(c.servicios) + "</div>" : "") +
        "</div>" +
        '<div class="cli-pie"><div class="cli-monto">' + esc(pesos(c.monto)) +
        "<small>" + esc(c.periodicidad === "unico" ? "pago único" : (c.periodicidad || "mensual")) + "</small></div>" +
        '<div class="v-tags">' +
        (pausado ? '<span class="tag">pausado</span>'
          : '<span class="tag' + (q.d < 0 ? " mal" : (q.d <= 3 ? " oro" : "")) + '">cobra ' + esc(q.txt) + "</span>") +
        (debe ? '<span class="tag mal">debe ' + esc(pesos(debe)) + "</span>" : "") +
        "</div></div></article>";
    }).join("") : '<p class="vacio">Todavía no tienes clientes dados de alta.<br>Dale a <b>+ Nuevo cliente</b> y pon su negocio, su teléfono, qué le diste y cuánto te paga.</p>';

    cada("[data-cli]", function (el) {
      el.onclick = function () { abreFicha(el.dataset.cli); };
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

    var datos = [
      ["Contacto", c.persona],
      ["Teléfono", c.telefono ? '<a href="https://wa.me/' + esc(String(c.telefono).replace(/\D/g, "")) + '" target="_blank" rel="noopener">' + esc(c.telefono) + " ↗</a>" : "", 1],
      ["Correo", c.correo],
      ["Dónde está", c.ubicacion],
      ["Instagram", c.instagram],
      ["Qué le diste", c.servicios],
      ["Cliente desde", c.inicio ? dia(c.inicio) : ""],
      ["Notas", c.notas]
    ].filter(function (d) { return d[1]; }).map(function (d) {
      return '<div class="dato"><b>' + d[0] + "</b><span>" + (d[2] ? d[1] : esc(d[1])) + "</span></div>";
    }).join("");

    var cobro = c.estado === "pausado"
      ? '<div class="dato"><b>Estado</b><span>Pausado</span></div>'
      : '<div class="dato"><b>Próximo cobro</b><span>' + esc(dia(f)) + " · " + esc(q.txt) + "</span></div>";

    $("fichaIn").innerHTML =
      '<button class="ficha-x" id="fichaX">✕</button>' +
      '<div class="ficha-cab">' + fotoHTML(c) + "<div>" +
      "<h3>" + esc(c.negocio || c.persona || "Sin nombre") + "</h3>" +
      "<p>" + esc(c.servicios || "Sin servicios anotados") + "</p></div></div>" +

      '<div class="cards" style="margin-bottom:26px">' +
      '<div class="card"><div class="n">' + esc(pesos(c.monto)) + '</div><div class="t">' +
      esc(c.periodicidad === "unico" ? "pago único" : "al " + (c.periodicidad === "anual" ? "año" : "mes")) + "</div></div>" +
      '<div class="card verde"><div class="n">' + esc(pesos(totalPagado(id))) + '</div><div class="t">te ha pagado</div></div>' +
      (debe ? '<div class="card roja"><div class="n">' + esc(pesos(debe)) + '</div><div class="t">te debe</div></div>' : "") +
      "</div>" +

      '<div class="ficha-sec"><h4>Sus datos</h4>' + cobro + datos + "</div>" +

      '<div class="ficha-sec"><h4>Historial de pagos</h4>' +
      (mios.length ? mios.map(function (p) {
        return '<div class="hist' + (p.estado === "pendiente" ? " pend" : "") + '"><div><b>' +
          esc(p.concepto || "Pago") + "</b><small>" + esc(dia(p.fecha)) +
          (p.metodo ? " · " + esc(p.metodo) : "") +
          (p.estado === "pendiente" ? " · pendiente" : "") + "</small></div>" +
          "<span>" + esc(pesos(p.monto)) + "</span></div>";
      }).join("") : '<p class="vacio" style="padding:24px 0">Todavía no le registras ningún pago.</p>') +
      "</div>" +

      '<div class="ficha-acc">' +
      '<button class="lnk oro" id="fPago">+ Registrar pago</button>' +
      '<button class="lnk" id="fEdit">Editar ficha</button>' +
      '<button class="lnk mal" id="fBorra">Borrar cliente</button>' +
      "</div>";

    $("ficha").classList.add("on");
    $("fichaFondo").classList.add("on");
    $("fichaX").onclick = cierraFicha;
    $("fPago").onclick = function () { formPago(id); };
    $("fEdit").onclick = function () { formCliente(c); };
    $("fBorra").onclick = function () {
      P.confirmar("Borrar a " + (c.negocio || "este cliente"),
        "Se borra su ficha. Sus pagos registrados <b>no</b> se borran, quedan en el historial.",
        "Sí, borrar").then(function (ok) {
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
      '<p class="sub">Todo lo que necesitas de un vistazo cuando te escriba.</p>' +
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
      '<div class="f ancho"><label>Dónde está</label><input id="cfUbi" type="text" placeholder="Plaza Xóchitl, Zapopan" value="' + esc(c.ubicacion || "") + '"></div>' +
      '<div class="f"><label>Instagram</label><input id="cfIg" type="text" placeholder="@is.barberisimo" value="' + esc(c.instagram || "") + '"></div>' +
      '<div class="f"><label>Cliente desde</label><input id="cfIni" type="date" value="' + esc(c.inicio || h.iso) + '"></div>' +
      '<div class="f ancho"><label>Qué le diste</label><input id="cfSrv" type="text" placeholder="Agente de voz + WhatsApp + página" value="' + esc(c.servicios || "") + '"></div>' +
      '<div class="f"><label>Cuánto te paga</label><input id="cfMonto" type="number" min="0" step="1" value="' + esc(c.monto || "") + '"></div>' +
      '<div class="f"><label>Cada cuándo</label><select id="cfPer2">' +
      ["mensual", "anual", "unico"].map(function (x) {
        return '<option value="' + x + '"' + ((c.periodicidad || "mensual") === x ? " selected" : "") + ">" +
          (x === "unico" ? "Una sola vez" : x.charAt(0).toUpperCase() + x.slice(1)) + "</option>";
      }).join("") + "</select></div>" +
      '<div class="f"><label>Día de pago</label><input id="cfDia" type="number" min="1" max="31" placeholder="12" value="' + esc(c.diaPago || "") + '"></div>' +
      '<div class="f"><label>Estado</label><select id="cfEst">' +
      '<option value="activo"' + (c.estado !== "pausado" ? " selected" : "") + ">Activo</option>" +
      '<option value="pausado"' + (c.estado === "pausado" ? " selected" : "") + ">Pausado</option></select></div>" +
      '<div class="f ancho"><label>Notas</label><textarea id="cfNotas" placeholder="Lo que sea importante recordar de este cliente…">' + esc(c.notas || "") + "</textarea></div>" +
      "</div>" +
      '<div class="modal-acc"><button class="lnk" id="cfNo">Cancelar</button>' +
      '<button class="lnk oro" id="cfSi">' + (ed ? "Guardar cambios" : "Dar de alta") + "</button></div>");

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
        servicios: $("cfSrv").value.trim(),
        notas: $("cfNotas").value.trim(),
        monto: num($("cfMonto").value),
        periodicidad: $("cfPer2").value,
        diaPago: num($("cfDia").value),
        inicio: $("cfIni").value,
        estado: $("cfEst").value,
        foto: foto
      };
      var op = ed ? actualizar("clientes", c.id, obj) : crear("clientes", obj);
      op.then(function (d) {
        if (ed) {
          for (var k in obj) c[k] = obj[k];
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

  /* ═══════════ arranque ═══════════ */
  window.TDN = {
    abre: function (k) {
      if (!listo) return;
      asegura(function () {
        if (k === "clientes") pintaClientes();
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
    asegura(function () { pintaClientes(); pintaFinanzas(); });
  }

  if (window.TDP) window.TDP.listo(init);
  else document.addEventListener("DOMContentLoaded", function () {
    if (window.TDP) window.TDP.listo(init);
  });
})();
