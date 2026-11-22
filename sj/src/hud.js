import { ARMAS } from './jugador.js?v=202611220539';
import { ICONO_ARMA, ICONO, iconoArma, IMG_ARMAS, glifoSVG } from './iconos.js?v=202611220539';

const $ = id => document.getElementById(id);
const RETRATO = { 'Don Chuy': 0, 'El Güero': 1, 'Encargado': 2, 'Matón': 3, 'Matías': 4, 'Lucía': 5, 'Cajero': 6, 'Oficial': 7 };
const RETRATO2 = { 'La Güera Reyes': 0, 'Tío Nacho': 1, 'Comandante Ibarra': 2, 'Valeria Luna': 3 };
const COLOR_NOTIF = { gps: '#b46bff', alerta: '#ff4d63', tienda: '#ffc94a', taxi: '#ffd84a', flor: '#d9a8ff', salto: '#3fd2ff', mision: '#ffc94a', ok: '#4fe08a', dinero: '#7dffa8', info: '#ff4f9a', estrella: '#ffc94a', coche: '#4a9bff' };
const COLOR_BANNER = { mision: '#ffc94a', exito: '#ffc94a', falla: '#ff4d63', muerte: '#ff4d63', arresto: '#4a9bff', salto: '#3fd2ff', info: '#ff4f9a' };

export class Hud {
  constructor(juego) {
    this.j = juego;
    this.e = {
      reloj: $('reloj'), clima: $('clima'), dinero: $('dinero'), popups: $('popups'), estrellas: $('estrellas'),
      card: $('armaCard'), icono: document.querySelector('#armaCard .ic'), arma: document.querySelector('#armaCard .nombre'), balas: document.querySelector('#armaCard .balas'), rec: document.querySelector('#armaCard .barraRec i'),
      salud: document.querySelector('#aros .salud'), chaleco: document.querySelector('#aros .chaleco'), fondo: document.querySelector('#aros .fondo'),
      calle: $('calle'), zona: $('zona'), ubic: $('ubicacion'), notifs: $('notifs'), pista: $('pista'), objetivo: $('objetivo'), dialogo: $('dialogo'),
      radio: $('radio'), velNum: $('velNum'), velArco: $('velArco'), nitro: document.querySelector('#velocimetro .nitro'), saludCoche: document.querySelector('#salud-coche i'),
      banner: $('banner'), dano: $('dano'), mira: $('mira'), hit: $('hit'), ind: $('indicadores'), fps: $('fps')
    };
    IMG_ARMAS.listo.then(() => { this.armaPrevia = null; });
    this.e.estrellas.innerHTML = Array(5).fill('<i>' + ICONO.estrella + '</i>').join('');
    this.dineroMostrado = 0; this.dineroPrevio = null;
    this.cola = []; this.tDialogo = 0; this.tBanner = 0; this.tRadio = 0;
    this.tiempo = null; this.textoObjetivo = ''; this.estrellasPrevias = 0;
    this.pistaFrame = -1; this.armaPrevia = null; this.zonaPrevia = ''; this.climaPrevio = '';
    const R = 112, C = 2 * Math.PI * R;
    this.C = C;
    this.e.fondo.setAttribute('stroke-dasharray', `${C * 0.16} ${C * 0.67} ${C * 0.16} ${C}`);
    this.e.fondo.setAttribute('stroke-dashoffset', `${-C * 0.01}`);
    const ley = [['#ffc94a', 'llave', 'Taller de Don Chuy (misiones)'], ['#ff4f9a', 'chispa', 'Pintura Express'], ['#e2e6ee', 'mira', 'Armería'], ['#ff5a6a', 'cruzroja', 'Hospital'], ['#4a9bff', 'escudo', 'Comisaría'], ['#3bd16f', '$', 'Banco'], ['#ff9a4a', 'bolsa', 'Mercado'], ['#e86fa8', 'T', 'Tianguis'], ['#3fd2ff', 'carrito', 'Tiendas'], ['#4fe08a', 'pesa', 'Gimnasio'], ['#ffb347', 'copa', 'Cantina'], ['#ffc94a', 'rampa', 'Salto único'], ['#3fd2ff', 'bandera', 'Carrera callejera'], ['#3fa8ff', 'ancla', 'Lago y lanchas'], ['#b46bff', 'punto', 'Tu destino'],
      ['sep', 'CONTACTOS'], ['#ffc94a', 'C', 'Don Chuy'], ['#f0a03a', 'N', 'Tío Nacho'], ['#b46bff', 'V', 'Valeria Luna'], ['#e8c25a', 'G', 'La Güera Reyes'], ['#4a9bff', 'I', 'Comandante Ibarra']];
    $('leyenda').innerHTML = ley.map(([c, t, n]) => c === 'sep' ? `<li class="sep">${t}</li>` : `<li data-filtro="${t}"><i style="--c:${c}">${glifoSVG(t)}</i>${n}</li>`).join('');
    $('leyenda').addEventListener('click', e => { const li = e.target.closest('li[data-filtro]'); if (!li) return; const f = li.dataset.filtro, M = this.j.minimapa; M.ocultos = M.ocultos || new Set(); if (M.ocultos.has(f)) M.ocultos.delete(f); else M.ocultos.add(f); li.classList.toggle('off', M.ocultos.has(f)); this.j.audio?.ui?.(700); });
  }

  objetivo(t) { this.textoObjetivo = t; this.pintarObjetivo(); }
  temporizador(s) { this.tiempo = s; this.pintarObjetivo(); }
  pintarObjetivo() {
    let t = this.textoObjetivo;
    if (this.tiempo !== null && this.tiempo !== undefined) {
      const s = Math.max(0, Math.ceil(this.tiempo));
      t = `<span class="reloj ${s <= 10 ? 'urge' : ''}">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span><br>` + t;
    }
    if (t !== this._obj) { this.e.objetivo.innerHTML = t; this._obj = t; }
  }

  dialogos(lineas) { this.cola.push(...lineas); if (this.tDialogo <= 0) this.siguienteDialogo(); }
  siguienteDialogo() {
    const l = this.cola.shift();
    const d = this.e.dialogo;
    if (!l) { d.classList.remove('on'); return; }
    const r = d.querySelector('.retrato');
    const i = RETRATO[l[0]], i2 = RETRATO2[l[0]];
    const i3 = i === undefined && i2 === undefined ? window.__juego?.retrato?.(l[0]) : null;
    r.classList.toggle('nada', i === undefined && i2 === undefined && !i3);
    if (i3) { r.style.backgroundImage = `url(${i3})`; r.style.backgroundSize = 'cover'; r.style.backgroundPosition = 'center'; }
    else if (i2 !== undefined) { r.style.backgroundImage = 'url(assets/contactos.jpg)'; r.style.backgroundSize = '400% 100%'; r.style.backgroundPosition = `${i2 * 33.333}% 0%`; }
    else if (i !== undefined) { r.style.backgroundImage = ''; r.style.backgroundSize = ''; r.style.backgroundPosition = `${(i % 4) * 33.333}% ${Math.floor(i / 4) * 100}%`; }
    d.querySelector('b').textContent = l[0] || 'Aviso';
    d.querySelector('p').innerHTML = l[1];
    d.classList.remove('on'); void d.offsetWidth; d.classList.add('on');
    this.tDialogo = 2.4 + l[1].replace(/<[^>]+>/g, '').length * 0.048;
  }

  grande(titulo, sub = '', dur = 3, tipo = 'info') {
    const b = this.e.banner;
    b.style.setProperty('--c', COLOR_BANNER[tipo] || '#ffc94a');
    b.querySelector('.t').textContent = titulo;
    b.querySelector('.s').innerHTML = sub;
    b.classList.remove('on', 'sale'); void b.offsetWidth; b.classList.add('on');
    this.tBanner = dur;
    if (tipo === 'mision') { document.body.classList.add('cine'); clearTimeout(this._cine); this._cine = setTimeout(() => document.body.classList.remove('cine'), dur * 1000); }
  }

  notificar(tipo, titulo, texto = '', dur = 5) {
    const n = document.createElement('div');
    n.className = 'notif vidrio';
    n.style.setProperty('--c', COLOR_NOTIF[tipo] || '#ff4f9a');
    n.innerHTML = `<i>${ICONO[tipo === 'info' ? 'alerta' : tipo] || ICONO.alerta}</i><div><b>${titulo}</b>${texto ? `<p>${texto}</p>` : ''}</div>`;
    this.e.notifs.prepend(n);
    while (this.e.notifs.children.length > 4) this.e.notifs.lastChild.remove();
    setTimeout(() => { n.classList.add('sale'); setTimeout(() => n.remove(), 450); }, dur * 1000);
  }
  aviso(html, dur = 5) { this.notificar('info', '', html, dur); }

  popDinero(n) {
    const b = document.createElement('b');
    b.textContent = (n >= 0 ? '+$' : '-$') + Math.abs(n).toLocaleString('es-MX');
    if (n < 0) b.className = 'menos';
    this.e.popups.appendChild(b);
    setTimeout(() => b.remove(), 1700);
  }

  pista(tecla, texto) {
    this.pistaFrame = this.j.cuadro;
    const p = this.e.pista;
    const k = tecla + '|' + texto;
    if (this._pista !== k) { p.querySelector('kbd').textContent = tecla; p.querySelector('span').textContent = texto; this._pista = k; }
    p.classList.add('on');
  }

  radio(nombre, estacion) {
    const r = this.e.radio;
    r.querySelector('b').textContent = nombre;
    r.querySelector('.logo').className = 'logo e' + estacion;
    r.classList.add('on');
    this.tRadio = 3;
  }

  dano(k, desde) {
    const d = this.e.dano;
    d.style.transition = 'none'; d.style.opacity = Math.min(1, 0.3 + k);
    requestAnimationFrame(() => { d.style.transition = 'opacity .6s'; d.style.opacity = 0; });
    this.j.post && (this.j.post.dolor = Math.min(1, this.j.post.dolor + k * 1.5));
    if (desde) {
      const p = this.j.jugador.posicion;
      const a = Math.atan2(desde.x - p.x, desde.z - p.z);
      const rel = -(a - this.j.camYaw) * 180 / Math.PI;
      const i = document.createElement('i');
      i.style.transform = `rotate(${rel}deg)`;
      this.e.ind.appendChild(i);
      setTimeout(() => i.remove(), 1200);
    }
  }

  golpeMira(mata = false) {
    const h = this.e.hit;
    h.classList.remove('on', 'mata'); void h.offsetWidth;
    h.classList.add('on'); if (mata) h.classList.add('mata');
  }

  personaje() {
    const j = this.j, el = document.getElementById('personaje');
    if (!el) return;
    const n = j.jugador.personaje;
    el.querySelector('.cara').style.backgroundPosition = (n === 'Lucía' ? 33.333 : 0) + '% 100%';
    el.querySelector('b').textContent = n.toUpperCase();
    el.querySelector('small').textContent = 'Z · cambiar a ' + (n === 'Lucía' ? 'Matías' : 'Lucía');
    el.classList.remove('cambia'); void el.offsetWidth; el.classList.add('cambia');
  }

  burbuja(ent, texto) {
    if (this.burbujas?.length > 3) return;
    const d = document.createElement('div');
    d.className = 'burbuja'; d.textContent = texto;
    document.getElementById('hud').appendChild(d);
    (this.burbujas || (this.burbujas = [])).push({ d, ent, t: 2.2 });
  }

  moverBurbujas(dt) {
    if (!this.burbujas?.length) return;
    const cam = this.j.camara, v = this._v || (this._v = this.j.camara.position.clone());
    for (let i = this.burbujas.length - 1; i >= 0; i--) {
      const b = this.burbujas[i];
      b.t -= dt;
      if (b.t <= 0 || b.ent.muerto) { b.d.remove(); this.burbujas.splice(i, 1); continue; }
      v.set(b.ent.pos.x, 2.35, b.ent.pos.z).project(cam);
      b.d.style.opacity = v.z < 1 ? Math.min(1, b.t * 3) : 0;
      b.d.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
    }
  }

  cambioArma() { const c = this.e.card; c.classList.remove('cambia'); void c.offsetWidth; c.classList.add('cambia'); }

  actualizar(dt) {
    const j = this.j, jug = j.jugador;
    if (this.tDialogo > 0) { this.tDialogo -= dt; if (this.tDialogo <= 0) this.siguienteDialogo(); }
    if (this.tBanner > 0) { this.tBanner -= dt; if (this.tBanner <= 0) { this.e.banner.classList.add('sale'); clearTimeout(this._bq); this._bq = setTimeout(() => { if (this.tBanner <= 0) this.e.banner.classList.remove('on', 'sale'); }, 600); } }
    if (this.tRadio > 0) { this.tRadio -= dt; if (this.tRadio <= 0) this.e.radio.classList.remove('on'); }
    if (this.pistaFrame < j.cuadro - 1) this.e.pista.classList.remove('on');
    this.moverBurbujas(dt);
    this.e.reloj.textContent = j.ambiente.texto;
    const clima = j.ambiente.lluvia > 0.3 ? 'lluvia' : j.ambiente.noche > 0.5 ? 'luna' : 'sol';
    if (clima !== this.climaPrevio) { this.e.clima.innerHTML = ICONO[clima]; this.climaPrevio = clima; }
    if (this.dineroPrevio !== null && jug.dinero !== this.dineroPrevio) {
      const dif = jug.dinero - this.dineroPrevio;
      if (Math.abs(dif) >= 1 && !this._popInterno) { this.e.dinero.classList.add('sube'); setTimeout(() => this.e.dinero.classList.remove('sube'), 220); }
      if (dif > 0) j.estadisticas?.sumar('ganado', 0);
    }
    this.dineroPrevio = jug.dinero;
    this.dineroMostrado += (jug.dinero - this.dineroMostrado) * Math.min(1, dt * 7);
    if (Math.abs(jug.dinero - this.dineroMostrado) < 1) this.dineroMostrado = jug.dinero;
    this.e.dinero.textContent = '$' + Math.round(this.dineroMostrado).toLocaleString('es-MX');
    const n = j.policia.estrellas;
    if (n !== this.estrellasPrevias) {
      [...this.e.estrellas.children].forEach((s, i) => { const on = i < n; if (on && i >= this.estrellasPrevias) { s.classList.remove('on'); void s.offsetWidth; } s.classList.toggle('on', on); });
      this.estrellasPrevias = n;
    }
    this.e.estrellas.classList.toggle('parpadea', n > 0 && !j.policia.visto);
    this.e.estrellas.classList.toggle('oculto', n === 0);
    if (jug.arma !== this.armaPrevia) { this.e.icono.innerHTML = iconoArma(jug.arma); this.e.arma.textContent = ARMAS[jug.arma].nombre; this.armaPrevia = jug.arma; }
    const s = jug.armas[jug.arma], A = ARMAS[jug.arma];
    document.body.classList.toggle('mirilla', !!(jug.apunta && ARMAS[jug.arma]?.zoom && !jug.coche));
    const txt = ARMAS[jug.arma]?.tipo === 'lanzar' ? `× ${s?.reserva || 0}` : A.cargador ? (jug.recargando > 0 ? 'RECARGANDO' : `${s.cargador} / ${s.reserva}`) : '';
    if (this.e.balas.textContent !== txt) this.e.balas.textContent = txt;
    this.e.card.classList.toggle('recarga', jug.recargando > 0);
    if (jug.recargando > 0) this.e.rec.style.width = (1 - jug.recargando / A.recarga) * 100 + '%';
    const C = this.C;
    const fs = Math.max(0, jug.salud) / jug.saludMax, fc = Math.max(0, jug.chaleco) / 100;
    this.e.salud.setAttribute('stroke-dasharray', `${C * 0.16 * fs} ${C}`);
    this.e.salud.setAttribute('stroke-dashoffset', `${-C * 0.01}`);
    this.e.chaleco.setAttribute('stroke-dasharray', `${C * 0.16 * fc} ${C}`);
    this.e.chaleco.setAttribute('stroke-dashoffset', `${-(C * 0.84 + C * 0.16 * (1 - fc))}`);
    this.e.salud.classList.toggle('baja', jug.salud < 30);
    if (j.cuadro % 15 === 0) {
      const p = jug.posicion;
      const z = j.zonaDe(p.x, p.z), c = j.calleDe(p.x, p.z);
      if (z !== this.zonaPrevia) { this.e.ubic.classList.remove('nueva'); void this.e.ubic.offsetWidth; this.e.ubic.classList.add('nueva'); this.zonaPrevia = z; }
      if (this.e.zona.textContent !== z) this.e.zona.textContent = z;
      if (this.e.calle.textContent !== c) this.e.calle.textContent = c;
    }
    if (jug.coche) {
      const c = jug.coche, kmh = Math.round(Math.abs(c.adelante) * 3.6);
      this.e.velNum.textContent = kmh;
      this.e.velArco.setAttribute('stroke-dasharray', `${Math.min(100, kmh / 2.4)} 100`);
      this.e.nitro.querySelector('i').style.width = (j.nitro * 100) + '%';
      this.e.nitro.classList.toggle('usando', !!c.turbo);
      const sc = Math.max(0, c.salud / c.t.salud);
      this.e.saludCoche.style.width = sc * 100 + '%';
      this.e.saludCoche.style.backgroundPosition = (100 - sc * 100) + '% 0';
    }
    document.body.classList.toggle('manejando', !!jug.coche);
    const apunta = (!jug.coche && !jug.muerto && jug.arma !== 'puno') || (jug.coche && jug.apunta);
    document.body.classList.toggle('apuntando', apunta);
    if (apunta) {
      const a = ARMAS[jug.arma];
      const abre = (a.disp || 0.02) * (jug.apunta ? 0.5 : 1.4) * (jug.velocidad > 3 ? 1.6 : 1) * 260 + 6 + (j.retroceso || 0) * 120;
      this.e.mira.style.setProperty('--a', abre.toFixed(1) + 'px');
    }
    if (j.ajustes.fps && j.cuadro % 20 === 0) this.e.fps.textContent = Math.round(j.fpsMedido || 0) + ' FPS';
  }
}
