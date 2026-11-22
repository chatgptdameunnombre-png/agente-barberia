import * as THREE from 'three';
import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=202611220310';
import { NEGOCIOS, AUTOS, MEJORAS, COMIDA } from './economia.js?v=202611220310';
import { TIPOS } from './vehiculos.js?v=202611220310';
import { glifoSVG } from './iconos.js?v=202611220310';
import { TITULOS } from './misiones.js?v=202611220310';
import { CONTACTOS } from './contactos.js?v=202611220310';
import { SALIDAS } from './trabajos.js?v=202611220310';
import { linea } from './ciudad.js?v=202611220310';
const tarjeta = o => `<div class="tarjeta ${o.mia ? 'mia' : ''}">${o.src ? `<img src="${o.src}" alt="">` : `<i class="foto" style="${o.img}"></i>`}<div class="cuerpo"><b>${o.titulo}</b><small>${o.desc}</small>${o.barras ? `<div class="barras">${o.barras.map(([n, v]) => `<span><em>${n}</em><i style="--v:${Math.min(1, v) * 100}%"></i></span>`).join('')}</div>` : ''}<div class="pie">${o.mia ? `<em class="sello">${o.sello || 'TUYO'}</em>` : `<button data-accion="${o.accion}" type="button">${o.precio}</button>`}</div></div></div>`;

const dinero = n => '$' + Math.floor(n).toLocaleString('es-MX');
const SVG = (c) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${c}</svg>`;
const IC = {
  gusta: SVG('<path d="M12 21s-7-4.4-9.3-9C1 8.5 3.2 5 6.6 5c2 0 3.3 1.1 4.1 2.3h2.6C14.1 6.1 15.4 5 17.4 5 20.8 5 23 8.5 21.3 12 19 16.6 12 21 12 21z"/>'),
  comentar: SVG('<path d="M21 12a8 8 0 0 1-11.7 7.1L4 20l1-4.5A8 8 0 1 1 21 12z"/>'),
  reenviar: SVG('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'),
  llamar: SVG('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/>')
};
const APPS = [['misiones', 'Misiones', -1, '#d8a020'], ['jacagram', 'JacaGram', 0, '#c2408a'], ['chisme', 'Chisme', 1, '#e8742a'], ['banco', 'Banco', 2, '#2e8a5a'], ['negocios', 'Negocios', 3, '#b8962e'], ['autos', 'Autos', 4, '#2e5a8a'], ['taller', 'Taller', 5, '#8a2a26'],
  ['comida', 'Comida', 6, '#d8746e'], ['contactos', 'Contactos', 7, '#3a9a5a'], ['camara', 'Cámara', 8, '#3a8ab8'], ['mapa', 'Mapa', 9, '#c8a02a'], ['stats', 'Mi vida', 10, '#7a4aa8'], ['galeria', 'Fotos', 11, '#d86a5a']];
const RESPUESTAS = ['Jajaja así mero', 'Cuídense mucho', 'Yo estuve ahí', 'Qué buena foto', 'No era yo, eh', 'Puro Santa Jacaranda'];
const avatar = (j, autor) => {
  if (autor === 'yo') return `<i class="av retrato" style="background-position:${j.jugador.personaje === 'Lucía' ? 33.333 : 0}% 100%"></i>`;
  const u = j.redes.usuario(autor);
  if (u && u.logo) return `<i class="av marca-av" style="--c:${u.logo[1]}">${u.logo[0]}</i>`;
  const k = u ? u.avatar : 0;
  return `<i class="av" style="background-position:${(k % 4) * 33.333}% ${Math.floor(k / 4) * 33.333}%"></i>`;
};
const LADO = 58, ESC = 1.17;
const posLogo = k => { const c = LADO * ESC; return `${(LADO / 2 - ((k % 4) + 0.5) * c).toFixed(1)}px ${(LADO / 2 - (Math.floor(k / 4) + 0.5) * c).toFixed(1)}px`; };

export class Telefono {
  constructor(juego) {
    this.j = juego;
    this.el = document.getElementById('telefono');
    this.pantalla = this.el.querySelector('.pantalla');
    this.vista = 'inicio';
    this.fotos = [];
    this.el.addEventListener('click', e => {
      const b = e.target.closest('[data-app]');
      if (b) { this.abrirApp(b.dataset.app); return; }
      const ac = e.target.closest('[data-accion]');
      if (ac) { this.accion(ac.dataset.accion); return; }
      const c = e.target.closest('[data-contacto]');
      if (c) { this.llamar(c.dataset.contacto); return; }
      if (e.target.closest('.atras')) { this.vista = 'inicio'; this.pintar(); }
    });
  }

  abrir() { this.vista = 'inicio'; this.j.abrirOverlay('telefono'); this.pintar(); this.j.audio.ui(990); const p = this.j.jugador.p; if (!this.j.jugador.coche) { p.telefono.visible = true; p.bd.rotation.set(-0.95, 0.35, 0.15); p.cd.rotation.x = -1.55; p.cabeza.rotation.x = 0.35; } }
  cerrar() { this.j.cerrarOverlay('telefono'); const p = this.j.jugador.p; p.telefono.visible = false; p.cabeza.rotation.x = 0; }
  repintarSiAbierto() { if (this.j.overlay === 'telefono' && ['jacagram', 'chisme', 'perfil', 'mensajes'].includes(this.vista) && !this.escribiendo) this.pintar(); }

  abrirApp(app) {
    this.j.audio.ui(760);
    if (app === 'mapa') { this.cerrar(); setTimeout(() => this.j.abrirOverlay('mapa'), 50); return; }
    if (app === 'camara') { this.cerrar(); this.j.modoFoto(true); return; }
    this.vista = app;
    if (app === 'jacagram' || app === 'chisme') this.j.redes.sinLeer = 0;
    this.pintar();
  }

  pintar() {
    const j = this.j, P = this.pantalla;
    P.dataset.vista = this.vista;
    const barra = `<div class="barra"><span>${j.ambiente.texto}</span><span>JacaMóvil</span></div>`;
    const R = j.redes;
    const feed = red => R.posts.filter(p => p.red === red).map(p => {
      const u = R.autorDe(p);
      return `<article class="${p.propio ? 'propio' : ''} ${red}"><div class="autor">${avatar(j, p.autor)}<span><b>${u.nombre}${u.oficial ? ' <em class="ok">oficial</em>' : ''}</b><small>${u.usuario} · ${p.hora}</small></span>${p.autor !== 'yo' ? `<button class="seguir ${R.sigo.has(p.autor) ? 'si' : ''}" data-accion="seguir:${p.autor}" type="button">${R.sigo.has(p.autor) ? 'Siguiendo' : 'Seguir'}</button>` : ''}</div>
        ${p.foto ? `<img src="${p.foto}" alt="">` : ''}<p>${p.texto}</p>
        <div class="acciones"><button class="${p.gusta ? 'activo' : ''}" data-accion="gusta:${p.id}" type="button">${IC.gusta}<span>${p.likes.toLocaleString('es-MX')}</span></button><button data-accion="abrir:${p.id}" type="button">${IC.comentar}<span>${p.comentarios.length}</span></button><button class="${p.reenviado ? 'activo' : ''}" data-accion="reenviar:${p.id}" type="button">${IC.reenviar}<span>${p.reenvios}</span></button></div>
        ${this.abierto === p.id ? `<div class="hilo">${p.comentarios.map(c => `<div class="com">${avatar(j, c.autor)}<span><b>${R.autorDe({ autor: c.autor }).usuario}</b> ${c.texto}</span></div>`).join('')}<div class="responder">${RESPUESTAS.map((t, i) => `<button data-accion="responder:${p.id}:${i}" type="button">${t}</button>`).join('')}</div></div>` : (p.comentarios.length ? `<div class="com mini">${avatar(j, p.comentarios[p.comentarios.length - 1].autor)}<span>${p.comentarios[p.comentarios.length - 1].texto}</span></div>` : '')}
      </article>`;
    }).join('');
    const pestañas = actual => `<nav class="tabs"><button class="${actual === 'jacagram' ? 'on' : ''}" data-app="jacagram" type="button">Inicio</button><button class="${actual === 'perfil' ? 'on' : ''}" data-app="perfil" type="button">Mi perfil</button><button class="${actual === 'mensajes' ? 'on' : ''}" data-app="mensajes" type="button">Mensajes${R.mensajes.some(m => !m.leido) ? ' ·' : ''}</button></nav>`;
    if (this.vista === 'inicio') {
      const caja = Object.values(j.economia.cajas).reduce((a, b) => a + b, 0) | 0;
      const badge = { jacagram: R.sinLeer, negocios: caja > 0 ? '$' : 0 };
      P.innerHTML = barra + `<div class="reloj-tel">${j.ambiente.texto}</div><div class="fecha-tel">${j.jugador.personaje} · ${j.zonaDe(j.jugador.posicion.x, j.jugador.posicion.z)}</div>
        <div class="apps">${APPS.map(([id, n, k, c]) => `<button data-app="${id}" type="button"><i class="logo ${k < 0 ? 'glifo' : ''}" style="--c:${c};${k < 0 ? '' : 'background-position:' + posLogo(k)}">${k < 0 ? glifoSVG('bandera') : ''}${badge[id] ? `<em>${badge[id]}</em>` : ''}</i><span>${n}</span></button>`).join('')}</div>`;
    } else if (this.vista === 'jacagram') {
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b class="marca">JacaGram</b></header>${pestañas('jacagram')}<div class="feed">${feed('jacagram') || '<p class="vacio">Aún no hay publicaciones.</p>'}</div>`;
    } else if (this.vista === 'chisme') {
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b class="marca chisme">Chisme</b></header><div class="temas">${R.temas.map(t => `<span>${t}</span>`).join('')}</div><div class="feed compacto">${feed('chisme') || '<p class="vacio">Silencio total en Santa Jacaranda.</p>'}</div>`;
    } else if (this.vista === 'perfil') {
      const yo = R.yo(), mias = R.posts.filter(p => p.propio);
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b class="marca">JacaGram</b></header>${pestañas('perfil')}
        <div class="perfil">${avatar(j, 'yo')}<b>${yo.nombre}</b><small>${yo.usuario}</small>
        <div class="cifras"><div><b>${mias.length}</b><small>publicaciones</small></div><div><b>${R.seguidores.toLocaleString('es-MX')}</b><small>seguidores</small></div><div><b>${R.sigo.size}</b><small>siguiendo</small></div></div>
        <p class="nota">Sube fotos con la Cámara. Las fotos en plena acción (persecuciones, saltos) se hacen virales y las marcas te buscan.${R.patrocinios.length ? ' Patrocinios: ' + R.patrocinios.map(x => x.marca).join(', ') + ' · $' + R.pagoDiario().toLocaleString('es-MX') + ' al día.' : ''}</p>
        <div class="rejilla">${mias.map(p => p.foto ? `<img src="${p.foto}" alt="">` : '').join('') || '<p class="vacio">Todavía no publicas nada.</p>'}</div></div>`;
    } else if (this.vista === 'mensajes') {
      R.mensajes.forEach(m => m.leido = true);
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b class="marca">Mensajes</b></header>${pestañas('mensajes')}<div class="lista">${R.mensajes.length ? R.mensajes.map((m, i) => `<div class="fila"><span><b>${m.de}</b><small>${m.texto}</small></span>${m.accion ? (m.aceptado ? '<em>ACEPTADO</em>' : `<button data-accion="aceptar:${i}" type="button">Aceptar</button>`) : ''}</div>`).join('') : '<p class="vacio">No tienes mensajes. Cuando tengas más seguidores te van a escribir marcas y otros usuarios.</p>'}</div>`;
    } else if (this.vista === 'contactos') {
      const otro = j.duo.nombre;
      const cs = [['chuy', 'Don Chuy', 'Pedir trabajo'], ['beto', 'Beto el mecánico', 'Que te traiga un coche · $200'], ['otro', otro, 'Platicar'], ['abogado', 'Lic. Ramírez', 'Quitar estrellas · $' + (j.policia.estrellas * 400 || 0)]];
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Contactos</b></header><div class="contactos">${cs.map(([id, n, d]) => `<button data-contacto="${id}" type="button"><i>${n[0]}</i><span><b>${n}</b><small>${d}</small></span><em class="tel">${IC.llamar}</em></button>`).join('')}</div>`;
    } else if (this.vista === 'banco') {
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Banco de Occidente</b></header><div class="banco">
        <div class="saldos"><div><small>EN EL BANCO</small><b>${dinero(j.banco)}</b></div><div><small>EN LA BOLSA</small><b>${dinero(j.jugador.dinero)}</b></div></div>
        <p class="nota">Si te tumban o te arrestan pierdes parte del efectivo. Lo del banco está a salvo.</p>
        <div class="botones"><button data-accion="depositar:1" type="button">Depositar todo</button><button data-accion="depositar:0" type="button">Depositar 500</button><button data-accion="retirar:0" type="button">Retirar 500</button><button data-accion="retirar:1" type="button">Retirar todo</button></div></div>`;
    } else if (this.vista === 'negocios') {
      const caja = Object.values(j.economia.cajas).reduce((a, b) => a + b, 0) | 0;
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Negocios</b></header><div class="lista">
        <button class="grande" data-accion="cobrar" type="button">Cobrar todo · ${dinero(caja)}</button>
        ${NEGOCIOS.map((n, i) => { const t = j.economia.tiene(n.id); return tarjeta({ img: `background-image:url(assets/negocios.jpg);background-size:300% 200%;background-position:${(i % 3) * 50}% ${Math.floor(i / 3) * 100}%`, titulo: n.nombre, desc: n.desc + (n.renta ? ' · ' + dinero(n.renta) + ' por hora' : ''), mia: t, sello: 'TUYO', accion: `negocio:${n.id}`, precio: dinero(n.precio) }); }).join('')}</div>`;
    } else if (this.vista === 'autos') {
      const E = j.economia;
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Autos</b></header><div class="lista">
        ${E.garaje.length ? '<h4>TU GARAJE</h4>' + E.garaje.map((g, i) => { const A = AUTOS.find(a => a.id === g.tipo); return tarjeta({ src: j.fotoAuto(g.tipo, g.color), titulo: A.nombre, desc: Object.keys(g.mejoras).length + ' mejoras · te lo llevan donde estés', mia: false, accion: `pedir:${i}`, precio: 'Traérmelo', extra: 'garaje' }); }).join('') : ''}
        <h4>A LA VENTA</h4>${AUTOS.filter(a => !E.garaje.some(g => g.tipo === a.id)).map(a => tarjeta({ src: j.fotoAuto(a.id, a.color), titulo: a.nombre, desc: `Máx. ${Math.round(TIPOS[a.id].vmax * 3.6)} km/h · ${a.id === 'moto' ? 'ágil y rápida' : a.id === 'camioneta' ? 'resistente' : a.id === 'deportivo' ? 'el más rápido' : 'económico'}`, accion: `auto:${a.id}`, precio: dinero(a.precio), barras: [['Velocidad', TIPOS[a.id].vmax / 55], ['Aceleración', TIPOS[a.id].acel / 17], ['Resistencia', TIPOS[a.id].salud / 160]] })).join('')}</div>`;
    } else if (this.vista === 'taller') {
      const E = j.economia, ICM = { motor: 'llave', frenos: 'punto', blindaje: 'escudo', nitro: 'chispa' };
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Taller Don Chuy</b></header><div class="lista">
        ${E.garaje.length ? E.garaje.map((g, i) => `<div class="portada-auto" style="background-image:url(${j.fotoAuto(g.tipo, g.color)})"><b>${AUTOS.find(a => a.id === g.tipo).nombre}</b></div>` + MEJORAS.map(m => `<div class="fila mejora ${g.mejoras[m.id] ? 'mia' : ''}"><i class="ico">${glifoSVG(ICM[m.id])}</i><span><b>${m.nombre}</b><small>${m.desc}</small></span>${g.mejoras[m.id] ? '<em>LISTO</em>' : `<button data-accion="mejora:${i}:${m.id}" type="button">${dinero(m.precio)}</button>`}</div>`).join('')).join('') : '<p class="vacio">Compra un auto en la app Autos para poder mejorarlo aquí.</p>'}</div>`;
    } else if (this.vista === 'comida') {
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Comida a domicilio</b></header><div class="lista rejilla2">
        ${COMIDA.map((c, i) => `<div class="plato"><i style="background-position:${(i % 3) * 50}% ${Math.floor(i / 3) * 100}%"></i><b>${c.nombre}</b><small>+${c.cura} de salud</small><button data-accion="comida:${c.id}" type="button">${dinero(c.precio)}</button></div>`).join('')}</div>`;
    } else if (this.vista === 'misiones') {
      const M = j.misiones, A = j.actividades, T = j.trabajos, L = j.ciudad.lugares;
      const fila = (titulo, sub, x, z, color, hecho) => `<div class="fila mision ${hecho ? 'mia' : ''}"><i class="punto" style="--c:${color}"></i><span><b>${titulo}</b><small>${sub}</small></span>${hecho ? '<em>LISTO</em>' : x !== undefined ? `<button data-accion="gps:${x.toFixed(1)}:${z.toFixed(1)}" type="button">GPS</button>` : ''}</div>`;
      const chuy = M.indice < TITULOS.length ? fila('Don Chuy · ' + TITULOS[M.indice], `Misión ${M.indice + 1} de ${TITULOS.length} · Taller`, L.taller.x, L.taller.z, '#ffc94a') : fila('Don Chuy', 'Historia terminada', undefined, undefined, '#ffc94a', true);
      const contactos = Object.entries(CONTACTOS).map(([id, C]) => {
        const n = M.otros[id], p = M.lugarC(id);
        if (n >= C.lista.length) return fila(C.nombre, 'Todas sus misiones completadas', undefined, undefined, C.color, true);
        if (M.indice < C.requisito) return fila(C.nombre, `Se desbloquea al terminar la misión ${C.requisito} de Don Chuy`, undefined, undefined, '#666');
        return fila(`${C.nombre} · ${C.lista[n].titulo}`, `${C.zona} · misión ${n + 1} de ${C.lista.length} · $${C.lista[n].premio.toLocaleString('es-MX')}`, p.x, p.z, C.color);
      }).join('');
      const carreras = SALIDAS.map(s => fila('Carrera · ' + s.nombre, T.mejores[s.id] ? 'Tu récord: ' + T.mejores[s.id].toFixed(1) + ' s' : 'Llega en coche a la bandera y presiona T', linea(s.i), linea(s.k), '#3fd2ff')).join('');
      const trabajos = [['Taxista', 'Súbete a un taxi y presiona T'], ['Repartidor', 'Súbete a una moto y presiona T'], ['Vigilante', 'Súbete a una patrulla y presiona T'], ['Paramédico', 'Toma la ambulancia del hospital y presiona T']].map(([a, b], i) => fila(a, b, i === 3 ? L.hospital.x : undefined, i === 3 ? L.hospital.z : undefined, '#4fe08a')).join('');
      const extra = fila('Jacarandas doradas', `${A.tomadas.size} de 12 encontradas · $250 cada una`, undefined, undefined, '#ffc94a', A.tomadas.size >= 12) + fila('Saltos únicos', `${A.saltosHechos.size} de ${A.rampas.length} · $500 cada uno`, undefined, undefined, '#ffc94a', A.saltosHechos.size >= A.rampas.length) + (L.lago ? fila('Lago Azul', 'Lanchas en el muelle', L.lago.x, L.lago.z, '#3fa8ff') : '');
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Misiones</b></header><div class="lista"><h4>HISTORIA</h4>${chuy}<h4>CONTACTOS</h4>${contactos}<h4>CARRERAS</h4>${carreras}<h4>TRABAJOS</h4>${trabajos}<h4>COLECCIONABLES Y LUGARES</h4>${extra}</div>`;
    } else if (this.vista === 'stats') {
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Mi vida</b></header><div class="stats">${j.estadisticas.filas().map(([a, v]) => `<div>${a}</div><div>${v}</div>`).join('')}</div>`;
    } else if (this.vista === 'galeria') {
      P.innerHTML = barra + `<header><button class="atras" type="button">‹</button><b>Fotos</b></header><div class="galeria">${this.fotos.length ? this.fotos.map((f, i) => `<a href="${f}" download="santa-jacaranda-foto-${i + 1}.jpg"><img src="${f}" alt=""></a>`).join('') : '<p class="vacio">Usa la Cámara para tomar fotos. Toca una para guardarla.</p>'}</div>`;
    }
  }

  accion(a) {
    const [k, x, y] = a.split(':'), E = this.j.economia, R = this.j.redes;
    if (k === 'gps') { this.j.gps.marcar(+x, +y); this.j.hud.notificar('gps', 'Destino marcado', 'Sigue la ruta morada.', 2.5); this.cerrar(); return; }
    if (k === 'gusta') { R.meGusta(x); this.pintar(); return; }
    if (k === 'abrir') { this.abierto = this.abierto === x ? null : x; this.pintar(); return; }
    if (k === 'responder') { R.comentar(x, RESPUESTAS[+y]); this.pintar(); return; }
    if (k === 'reenviar') { R.reenviar(x); this.pintar(); return; }
    if (k === 'seguir') { R.seguir(x); this.pintar(); return; }
    if (k === 'aceptar') { R.aceptar(+x); this.pintar(); return; }
    if (k === 'depositar') E.depositar(x === '1');
    else if (k === 'retirar') E.retirar(x === '1');
    else if (k === 'cobrar') E.cobrar();
    else if (k === 'negocio') E.comprarNegocio(x);
    else if (k === 'auto') E.comprarAuto(x);
    else if (k === 'pedir') { E.pedirAuto(+x); this.cerrar(); return; }
    else if (k === 'mejora') E.mejorar(+x, y);
    else if (k === 'comida') E.pedirComida(x);
    this.j.audio.ui(820);
    this.pintar();
  }

  llamar(id) {
    const j = this.j, jug = j.jugador;
    this.cerrar();
    j.audio.notif?.();
    if (id === 'chuy') {
      const m = j.misiones;
      j.hud.dialogos([['Don Chuy', m.activa ? 'Concéntrate en lo que te pedí, mijo.' : m.indice < 5 ? 'Pásate al taller, tengo un trabajo para ti. Te lo marco en el GPS.' : 'Ya hiciste suficiente por mí. Disfruta la ciudad.']]);
      if (!m.activa && m.indice < 5) { const t = j.ciudad.lugares.taller; j.gps.marcar(t.x, t.z); }
    } else if (id === 'beto') {
      if (jug.dinero < 200) { j.hud.dialogos([['Beto', 'Sin dinero no hay coche, compadre.']]); return; }
      const p = puntoCalleAleatorio(jug.posicion, 10, 60, 400);
      if (!p) { j.hud.dialogos([['Beto', 'No encuentro dónde dejártelo. Muévete a una calle.']]); return; }
      jug.dinero -= 200; j.hud.popDinero(-200);
      const tipo = ['deportivo', 'moto', 'deportivo', 'camioneta'][Math.random() * 4 | 0];
      const c = new Coche(j, tipo, ['#ff4f9a', '#3fd2ff', '#ffc94a', '#b46bff'][Math.random() * 4 | 0], p.x, p.z, p.yaw);
      j.coches.push(c);
      j.hud.dialogos([['Beto', 'Te lo dejé aquí cerquita. Cuídamelo, ¿eh?']]);
      j.gps.marcar(p.x, p.z);
    } else if (id === 'otro') {
      const C = [[['Lucía', '¿Qué pasó? ¿Ya me extrañas?'], ['Matías', 'Nomás quería oír tu voz.']], [['Matías', '¿Dónde andas? Te veo en el taller.'], ['Lucía', 'Voy para allá.']]];
      j.hud.dialogos(C[Math.random() * C.length | 0]);
    } else if (id === 'abogado') {
      const precio = j.policia.estrellas * 400;
      if (!precio) { j.hud.dialogos([['Lic. Ramírez', 'No tiene ningún problema con la ley. Por ahora.']]); return; }
      if (jug.dinero < precio) { j.hud.dialogos([['Lic. Ramírez', 'Mis honorarios son de $' + precio + '. Consiga el dinero.']]); return; }
      jug.dinero -= precio; j.hud.popDinero(-precio); j.policia.limpiar();
      j.hud.dialogos([['Lic. Ramírez', 'Listo. Ya hablé con quien tenía que hablar.']]);
    }
  }
}
