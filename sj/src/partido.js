import * as THREE from 'three';
import { crearPersona, animar } from './persona.js?v=202611220251';

function texBalon() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#1a1a1c';
  for (let k = 0; k < 8; k++) { const x = (k % 4) * 32 + (k > 3 ? 16 : 0) + 8, y = k > 3 ? 44 : 16; g.beginPath(); for (let a = 0; a < 5; a++) { const t = a / 5 * Math.PI * 2; g.lineTo(x + Math.cos(t) * 7, y + Math.sin(t) * 7); } g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const LOCAL = { camisa: '#b5122e', pantalon: '#f4f4f2' }, VISITA = { camisa: '#f2c14e', pantalon: '#1d3f8a' };

export class Partido {
  constructor(juego) {
    this.j = juego; const E = juego.ciudad.estadio; if (!E) return;
    this.E = E; this.c = E.grupo.position.clone(); this.y = 0.42;
    this.viendo = false; this.marc = [0, 0]; this.min = 0; this.listo = false; this.festejo = 0;
    this.taquillas = [-9, 9].map(sx => ({ x: this.c.x + sx, z: this.c.z + E.RE + 5.2 }));
  }

  armar() {
    const j = this.j, g = this.grupo = new THREE.Group(); g.position.copy(this.c); g.visible = false; j.escena.add(g);
    this.jugadores = [];
    for (const [eq, ropa, lado] of [[0, LOCAL, -1], [1, VISITA, 1]]) {
      const puestos = [[14.2, 0], [10, -5], [10, 5], [5, -6.5], [5, 0], [5, 6.5], [1.5, 0]];
      puestos.forEach(([x, z], k) => {
        const p = crearPersona({ ...ropa, ropa: null, fijo: true, sinAccesorios: true, mangaCorta: true, shorts: true, camisa: k === 0 ? (eq ? '#2a2c34' : '#3a8f5c') : ropa.camisa });
        p.grupo.scale.setScalar(0.92); g.add(p.grupo);
        this.jugadores.push({ p, eq, lado, casa: new THREE.Vector2(x * lado, z), pos: new THREE.Vector2(x * lado, z), vel: 0, portero: k === 0 });
      });
    }
    this.balon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshStandardMaterial({ map: texBalon(), roughness: 0.5 }));
    g.add(this.balon); this.b = new THREE.Vector2(0, 0); this.bv = new THREE.Vector2(0, 0); this.bh = 0; this.bvh = 0;
    this.listo = true;
  }

  enHora() { const h = this.j.ambiente.hora ?? 12; return h > 19.5 && h < 23.5; }

  cerca() {
    if (!this.E || this.viendo) return null;
    const J = this.j.jugador; if (J.coche || J.interior || !this.enHora()) return null;
    return this.taquillas.find(t => Math.hypot(t.x - J.pos.x, t.z - J.pos.z) < 3) || null;
  }

  pista() { if (this.viendo) return `Partido · JACARANDA ${this.marc[0]} - ${this.marc[1]} VISITA · E para salir`; return this.cerca() ? 'Ver el partido · boleto $50' : null; }

  entrar() {
    const j = this.j, J = j.jugador;
    if (!this.cerca()) return false;
    if (J.dinero < 50) { j.hud.notificar('alerta', 'Taquilla', 'El boleto cuesta $50.', 3); return true; }
    if (j.policia.estrellas) { j.hud.notificar('alerta', 'Taquilla', 'Con la policía encima no te dejan pasar.', 3); return true; }
    J.dinero -= 50; j.audio.dinero?.();
    if (!this.listo) this.armar();
    this.viendo = true; this.salida = J.pos.clone(); J.grupo.visible = false; this.grupo.visible = true;
    this.cam = null; this.camT = 0;
    j.hud.notificar('info', 'Estadio Jacaranda', 'Disfruta el partido. E para salir.', 4);
    return true;
  }

  salir() {
    const j = this.j, J = j.jugador; this.viendo = false; this.grupo.visible = false;
    J.pos.copy(this.salida); J.grupo.visible = true; j.camYaw = Math.PI;
  }

  camara(cam, dt) {
    this.camT += dt;
    const fx = this.b.x * 0.55, a = Math.sin(this.camT * 0.05) * 0.25;
    const obj = new THREE.Vector3(this.c.x + fx * 0.4 + Math.sin(a) * 6, 10.5, this.c.z + 19.5);
    if (!this.cam) this.cam = obj.clone(); this.cam.lerp(obj, Math.min(1, dt * 1.5));
    cam.position.copy(this.cam); cam.lookAt(this.c.x + fx, 0.8, this.c.z - 1);
    if (cam.fov !== 55) { cam.fov = 55; cam.updateProjectionMatrix(); }
  }

  gol(eq) {
    const j = this.j; this.marc[eq]++; this.festejo = 3.5; this.ultimoGol = eq;
    this.E.marcador?.(this.marc[0], this.marc[1], Math.min(90, Math.floor(this.min)) + "'");
    if (this.viendo || Math.hypot(j.jugador.posicion.x - this.c.x, j.jugador.posicion.z - this.c.z) < 300) {
      j.audio?.ruidoCorto(3.4, 900, eq === 0 ? 0.45 : 0.18, 'bandpass', 0.5); j.audio?.ruidoCorto(2.6, 1600, eq === 0 ? 0.25 : 0.1, 'bandpass', 0.6);
      if (eq === 0) for (let k = 0; k < 5; k++) j.fuegos?.lanzar(this.c.x + (Math.random() - 0.5) * 50, this.c.z + (Math.random() - 0.5) * 50, 0.5 + k * 0.4);
      if (this.viendo) j.hud.grande(eq === 0 ? '¡GOOOL DE JACARANDA!' : 'Gol de la visita', `${this.marc[0]} - ${this.marc[1]}`, 2.5);
    }
    this.b.set(0, 0); this.bv.set(0, 0); this.bh = 0;
  }

  actualizar(dt) {
    if (!this.E) return;
    const j = this.j, enHora = this.enHora();
    if (!enHora) { if (this.viendo) this.salir(); if (this.marc[0] || this.marc[1] || this.min) { this.marc = [0, 0]; this.min = 0; this.E.marcador?.(0, 0, "0'"); } return; }
    if (j.fuegos) j.fuegos.gol = this.viendo ? 999 : Math.min(j.fuegos.gol, 120);
    if (!this.viendo || !this.listo) { this.min += dt * 0.6; return; }
    this.min += dt * 0.6;
    if (this.festejo > 0) this.festejo -= dt;
    const b = this.b, bv = this.bv;
    b.addScaledVector(bv, dt); bv.multiplyScalar(Math.exp(-0.9 * dt));
    this.bvh -= 9.8 * dt; this.bh = Math.max(0, this.bh + this.bvh * dt); if (this.bh === 0) this.bvh = Math.abs(this.bvh) > 2 ? -this.bvh * 0.4 : 0;
    if (Math.abs(b.y) > 9.8) { b.y = Math.sign(b.y) * 9.8; bv.y *= -0.5; }
    if (Math.abs(b.x) > 15.2) { if (Math.abs(b.y) < 1.8 && this.bh < 1.2) { this.gol(b.x > 0 ? 0 : 1); } else { b.x = Math.sign(b.x) * 14; bv.set(-Math.sign(b.x) * 6, (Math.random() - 0.5) * 4); } }
    const porEq = [null, null];
    for (const eq of [0, 1]) { let mejor = null, md = 1e9; for (const q of this.jugadores) if (q.eq === eq && !q.portero) { const d = q.pos.distanceTo(b); if (d < md) { md = d; mejor = q; } } porEq[eq] = mejor; }
    for (const q of this.jugadores) {
      let meta;
      if (q.portero) meta = new THREE.Vector2(q.casa.x, Math.max(-2.2, Math.min(2.2, b.y * 0.4)));
      else if (q === porEq[q.eq] && this.festejo <= 0) meta = b.clone();
      else meta = new THREE.Vector2(q.casa.x * 0.75 + b.x * 0.45, q.casa.y * 0.9 + b.y * 0.25);
      const d = meta.clone().sub(q.pos), dist = d.length(), vObj = dist > 0.3 ? Math.min(q === porEq[q.eq] ? 6.2 : 4.5, dist * 2) : 0;
      q.vel += (vObj - q.vel) * Math.min(1, dt * 4);
      if (dist > 0.01) { q.pos.addScaledVector(d.normalize(), q.vel * dt); q.yaw = Math.atan2(d.x, d.y); }
      if (!q.portero && q.pos.distanceTo(b) < 0.55 && this.festejo <= 0 && Math.random() < dt * 8) {
        const meta2 = new THREE.Vector2(q.eq === 0 ? 15.3 : -15.3, (Math.random() - 0.5) * 4);
        const dir = meta2.sub(b).normalize(), fuerza = 9 + Math.random() * 8;
        bv.set(dir.x * fuerza + (Math.random() - 0.5) * 3, dir.y * fuerza + (Math.random() - 0.5) * 3); this.bvh = Math.random() < 0.3 ? 4 + Math.random() * 3 : 0;
        j.audio?.ruidoCorto(0.06, 400, 0.08, 'lowpass');
      }
      if (q.portero && q.pos.distanceTo(b) < 0.8 && Math.abs(b.x) > 12) { bv.set(-Math.sign(b.x) * 14, (Math.random() - 0.5) * 6); this.bvh = 5; }
      const p = q.p; p.grupo.position.set(q.pos.x, this.y, q.pos.y); p.grupo.rotation.y = q.yaw || 0;
      animar(p, dt, this.festejo > 0 ? 0 : q.vel, 'puno', false);
      if (this.festejo > 0 && q.eq === this.ultimoGol) { p.bd.rotation.set(-2.8, 0, -0.3); p.bi.rotation.set(-2.8, 0, 0.3); }
    }
    this.balon.position.set(b.x, this.y + 0.2 + this.bh, b.y);
    this.balon.rotation.x += bv.y * dt * 4; this.balon.rotation.z -= bv.x * dt * 4;
  }
}
