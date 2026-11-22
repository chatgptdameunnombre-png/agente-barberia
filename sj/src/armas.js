import * as THREE from 'three';
import { ARMAS, CATEGORIAS, tieneArma } from './jugador.js?v=202611220109';
import { iconoArma, IMG_ARMAS, IMG_ARMAS2 } from './iconos.js?v=202611220109';

export class Rueda {
  constructor(juego) {
    this.j = juego;
    this.abierta = false;
    this.vx = 0; this.vy = 0;
    this.sel = null;
    this.eleccion = {};
    const el = document.getElementById('rueda');
    this.el = el;
    const N = CATEGORIAS.length, R = 220, r = 92;
    let html = `<svg viewBox="-260 -260 520 520" class="aro">`;
    CATEGORIAS.forEach((c, i) => {
      const a0 = (i / N) * Math.PI * 2 - Math.PI / 2 - Math.PI / N + 0.02, a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2 - Math.PI / N - 0.02;
      const p = (rr, a) => `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
      html += `<path data-i="${i}" class="sector" d="M ${p(r, a0)} L ${p(R, a0)} A ${R} ${R} 0 0 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 0 0 ${p(r, a0)} Z"/>`;
    });
    html += `</svg>`;
    CATEGORIAS.forEach((c, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * 158, y = Math.sin(a) * 158;
      html += `<div class="arma-ic" data-i="${i}" style="transform:translate(calc(-50% + ${x}px), calc(-50% + ${y}px))"><div class="img"></div><small></small><div class="puntos"></div></div>`;
    });
    html += `<div class="centro"><em></em><b></b><span></span><i class="giro">Rueda del ratón: cambiar dentro de la categoría</i></div>`;
    el.innerHTML = html;
    this.sectores = [...el.querySelectorAll('.sector')];
    this.iconos = [...el.querySelectorAll('.arma-ic')];
    Promise.all([IMG_ARMAS.listo, IMG_ARMAS2.listo]).then(() => { if (this.abierta) this.pintar(); });
    addEventListener('wheel', e => { if (!this.abierta) return; this.ciclar(e.deltaY > 0 ? 1 : -1); }, { passive: true });
  }

  armaDe(i) {
    const c = CATEGORIAS[i], jug = this.j.jugador;
    const prefer = this.eleccion[c.id];
    if (prefer && tieneArma(jug, prefer)) return prefer;
    if (c.armas.includes(jug.arma)) return jug.arma;
    return c.armas.find(k => tieneArma(jug, k)) || c.armas[0];
  }

  ciclar(paso) {
    const c = CATEGORIAS[this.sel], jug = this.j.jugador;
    const tiene = c.armas.filter(k => tieneArma(jug, k));
    if (tiene.length < 2) return;
    const i = tiene.indexOf(this.armaDe(this.sel));
    this.eleccion[c.id] = tiene[(i + paso + tiene.length) % tiene.length];
    this.pintar(); this.j.audio?.tono?.(880, 0.03, 0.05, 'sine');
  }

  categoria(i) {
    const jug = this.j.jugador, c = CATEGORIAS[i];
    const tiene = c.armas.filter(k => tieneArma(jug, k));
    if (!tiene.length) return;
    let id = this.armaDe(i);
    if (c.armas.includes(jug.arma) && tiene.length > 1) id = tiene[(tiene.indexOf(jug.arma) + 1) % tiene.length];
    this.eleccion[c.id] = id;
    if (id !== jug.arma) { jug.elegirArma(id); this.j.hud.cambioArma(); }
  }

  abrir() {
    if (this.abierta || this.j.jugador.muerto) return;
    this.abierta = true;
    this.vx = 0; this.vy = 0;
    this.sel = Math.max(0, CATEGORIAS.findIndex(c => c.armas.includes(this.j.jugador.arma)));
    document.body.classList.add('enrueda');
    this.pintar();
    this.j.audio?.tono?.(520, 0.06, 0.08, 'sine');
  }

  cerrar(equipar = true) {
    if (!this.abierta) return;
    this.abierta = false;
    document.body.classList.remove('enrueda');
    const id = this.armaDe(this.sel);
    if (equipar && id && tieneArma(this.j.jugador, id) && id !== this.j.jugador.arma) {
      this.eleccion[CATEGORIAS[this.sel].id] = id;
      this.j.jugador.elegirArma(id);
      this.j.hud.cambioArma();
      this.j.audio?.recarga?.();
    }
  }

  disponible(i) { return CATEGORIAS[i].armas.some(k => tieneArma(this.j.jugador, k)); }

  mover(dx, dy) {
    this.vx += dx; this.vy += dy;
    const m = Math.hypot(this.vx, this.vy);
    if (m > 120) { this.vx *= 120 / m; this.vy *= 120 / m; }
    if (m > 25) {
      let a = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      if (a < 0) a += Math.PI * 2;
      const i = Math.round(a / (Math.PI * 2) * CATEGORIAS.length) % CATEGORIAS.length;
      if (i !== this.sel) { this.sel = i; this.pintar(); this.j.audio?.tono?.(700 + i * 40, 0.03, 0.05, 'sine'); }
    }
  }

  pintar() {
    const jug = this.j.jugador;
    CATEGORIAS.forEach((c, i) => {
      const ok = this.disponible(i), id = this.armaDe(i), s = jug.armas[id];
      this.sectores[i].classList.toggle('sel', i === this.sel);
      this.sectores[i].classList.toggle('bloq', !ok);
      this.iconos[i].classList.toggle('sel', i === this.sel);
      this.iconos[i].classList.toggle('bloq', !ok);
      const img = this.iconos[i].querySelector('.img'); if (img.dataset.id !== id) { img.innerHTML = iconoArma(id); img.dataset.id = id; }
      this.iconos[i].querySelector('small').textContent = !ok || !s ? '' : ARMAS[id].tipo === 'lanzar' ? '×' + s.reserva : ARMAS[id].cargador ? (s.cargador + s.reserva) : '';
      const tiene = c.armas.filter(k => tieneArma(jug, k));
      this.iconos[i].querySelector('.puntos').innerHTML = tiene.length > 1 ? tiene.map(k => `<i class="${k === id ? 'on' : ''}"></i>`).join('') : '';
    });
    const c = CATEGORIAS[this.sel], id = this.armaDe(this.sel), s = jug.armas[id];
    this.el.querySelector('.centro em').textContent = c.nombre;
    this.el.querySelector('.centro b').textContent = ARMAS[id].nombre;
    this.el.querySelector('.centro span').textContent = !tieneArma(jug, id) ? 'Se compra en la Armería' : ARMAS[id].tipo === 'lanzar' ? s.reserva + ' en la bolsa' : ARMAS[id].cargador ? `${s.cargador} / ${s.reserva}` : 'Cuerpo a cuerpo';
    this.el.querySelector('.centro .giro').style.opacity = c.armas.filter(k => tieneArma(jug, k)).length > 1 ? 1 : 0;
  }
}

export class Granadas {
  constructor(juego) {
    this.j = juego;
    this.lista = [];
    this.geo = new THREE.SphereGeometry(0.12, 8, 6);
    this.mat = new THREE.MeshLambertMaterial({ color: '#3f5a2a' });
    const pts = new Float32Array(40 * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    this.arco = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffe08a', size: 0.16, transparent: true, opacity: 0.85, depthWrite: false }));
    this.arco.frustumCulled = false;
    this.arco.visible = false;
    juego.escena.add(this.arco);
  }

  velocidadTiro() {
    const cam = this.j.camara;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    return dir.multiplyScalar(17).add(new THREE.Vector3(0, 5.5, 0));
  }

  lanzar(origen, tipo = 'granada') {
    let m;
    if (tipo === 'molotov') {
      m = new THREE.Group();
      const b = new THREE.Mesh(this.geoBot || (this.geoBot = new THREE.CylinderGeometry(0.05, 0.055, 0.22, 10)), this.matBot || (this.matBot = new THREE.MeshStandardMaterial({ color: '#3f6a3a', roughness: 0.1, transparent: true, opacity: 0.8 })));
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.j.humoTex, color: '#ffa040', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      f.position.y = 0.16; f.scale.setScalar(0.35); m.add(b, f); m.llama = f;
    } else m = new THREE.Mesh(this.geo, this.mat);
    m.castShadow = true;
    m.position.copy(origen);
    this.j.escena.add(m);
    this.lista.push({ m, v: this.velocidadTiro(), t: 0, tipo });
  }

  actualizar(dt) {
    const j = this.j, mundo = j.mundo;
    for (let i = this.lista.length - 1; i >= 0; i--) {
      const g = this.lista[i];
      g.t += dt;
      g.v.y -= 20 * dt;
      const p = g.m.position;
      const nx = p.x + g.v.x * dt, ny = p.y + g.v.y * dt, nz = p.z + g.v.z * dt;
      const choca = mundo.dentro(nx, ny, p.z) || mundo.dentro(p.x, ny, nz);
      if (g.tipo === 'molotov') {
        g.m.llama.scale.setScalar(0.3 + Math.random() * 0.12);
        if (choca || ny < 0.12) { j.escena.remove(g.m); this.lista.splice(i, 1); j.fuegoZona(p.x, Math.max(0, p.y - 0.1), p.z); continue; }
      }
      if (mundo.dentro(nx, ny, p.z)) { g.v.x *= -0.45; } else p.x = nx;
      if (mundo.dentro(p.x, ny, nz)) { g.v.z *= -0.45; } else p.z = nz;
      p.y = ny;
      if (p.y < 0.12) { p.y = 0.12; g.v.y *= -0.38; g.v.x *= 0.7; g.v.z *= 0.7; if (Math.abs(g.v.y) > 1.5) j.audio?.tono?.(300, 0.04, 0.06, 'triangle'); }
      g.m.rotation.x += dt * 9; g.m.rotation.z += dt * 6;
      if (g.t > 2.3) {
        j.escena.remove(g.m);
        this.lista.splice(i, 1);
        j.explosion(p.x, p.y, p.z, 'jugador');
      }
    }
    const jug = j.jugador;
    const ver = !jug.coche && !jug.muerto && (jug.arma === 'granada' || jug.arma === 'molotov') && jug.apunta;
    this.arco.visible = ver;
    if (ver) {
      const a = this.arco.geometry.attributes.position.array;
      const o = j.origenArma(), v = this.velocidadTiro();
      let x = o.x, y = o.y, z = o.z, vx = v.x, vy = v.y, vz = v.z;
      for (let k = 0; k < 40; k++) {
        a[k * 3] = x; a[k * 3 + 1] = Math.max(0.1, y); a[k * 3 + 2] = z;
        for (let s = 0; s < 3; s++) { vy -= 20 * 0.02; x += vx * 0.02; y += vy * 0.02; z += vz * 0.02; }
        if (y < 0.1) { vy = Math.abs(vy) * 0.38; vx *= 0.7; vz *= 0.7; }
      }
      this.arco.geometry.attributes.position.needsUpdate = true;
    }
  }
}
