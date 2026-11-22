import * as THREE from 'three';
import { puntoCalleAleatorio } from './vehiculos.js?v=202611220440';

export class Emergencias {
  constructor(juego) { this.j = juego; this.espera = 90 + Math.random() * 90; this.activa = null; }

  actualizar(dt) {
    const j = this.j;
    if (this.activa) {
      const c = this.activa;
      c.urgencia -= dt;
      if (c.urgencia <= 0 || c.quemado || !j.coches.includes(c) || c.conductor !== 'ia') { c.sirena = false; c.urgencia = 0; this.activa = null; this.espera = 150 + Math.random() * 120; }
      return;
    }
    this.espera -= dt;
    if (this.espera > 0 || j.jugador.interior || j.misiones?.activa) return;
    const p = puntoCalleAleatorio(j.jugador.posicion, 90, 150);
    if (!p) { this.espera = 20; return; }
    const c = j.nuevoTrafico(p, 'ambulancia');
    c.sirena = true; c.urgencia = 45; this.activa = c;
  }
}

export class SonidosCalle {
  constructor(juego) { this.j = juego; this.t = 0; }
  actualizar(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.5;
    const j = this.j, a = j.audio, jp = j.jugador.posicion; if (!a?.ctx) return;
    for (const c of j.coches) {
      if ((c.tipo !== 'pipa' && c.tipo !== 'basura') || c.quemado || !c.conductor) continue;
      const d = c.pos.distanceTo(jp); if (d > 70) continue;
      c.tonada = (c.tonada ?? Math.random() * 4) - 0.5; if (c.tonada > 0) continue;
      const v = 0.12 * (1 - d / 70), t0 = a.ctx.currentTime + 0.05;
      if (c.tipo === 'pipa') { c.tonada = 7; [523, 659, 784, 659, 880, 784].forEach((f, i) => a.tono(f, 0.22, v, 'triangle', null, t0 + i * 0.2)); }
      else { c.tonada = 4.5; for (let k = 0; k < 4; k++) { a.tono(1568, 0.5, v, 'sine', null, t0 + k * 0.32); a.tono(2349, 0.3, v * 0.4, 'sine', null, t0 + k * 0.32); } }
    }
  }
}

export class Persecuciones {
  constructor(juego) { this.j = juego; this.espera = 150 + Math.random() * 120; this.activa = null; }

  actualizar(dt) {
    const j = this.j;
    if (this.activa) {
      const A = this.activa, f = A.fugitivo, c = A.cazador; A.t += dt;
      const lejos = f.pos.distanceTo(j.jugador.posicion) > 320 && c.pos.distanceTo(j.jugador.posicion) > 320;
      if (!A.atrapado && !f.quemado && f.vel < 2 && c.pos.distanceTo(f.pos) < 12 && A.t > 4) { A.atrapado = 6; f.panico = 0; }
      if (A.atrapado) { A.atrapado -= dt; f.vx *= 0.9; f.vz *= 0.9; }
      if (A.t > 75 || lejos || f.quemado || c.quemado || !j.coches.includes(f) || !j.coches.includes(c) || A.atrapado < 0 || j.policia.estrellas > 0) {
        for (const q of [f, c]) if (j.coches.includes(q) && !q.quemado) { q.conductor = 'ia'; q.sirena = false; q.panico = 0; q.presa = null; q.fugitivo = false; }
        this.activa = null; this.espera = 160 + Math.random() * 140;
      }
      return;
    }
    this.espera -= dt;
    if (this.espera > 0 || j.jugador.interior || j.misiones?.activa || j.policia.estrellas > 0) return;
    const p = j.puntoCalle?.(j.jugador.posicion, 70, 130); if (!p) { this.espera = 15; return; }
    const f = j.nuevoTrafico(p, Math.random() < 0.5 ? 'deportivo' : 'sedan'); f.panico = 90; f.fugitivo = true;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    const c = j.nuevoTrafico({ x: p.x - fx * 14, z: p.z - fz * 14, yaw: p.yaw }, 'policia');
    c.conductor = 'cazador'; c.presa = f; c.sirena = true; c.vx = fx * 12; c.vz = fz * 12; f.vx = fx * 16; f.vz = fz * 16;
    this.activa = { fugitivo: f, cazador: c, t: 0, atrapado: 0 };
    this.j.noticias?.avisar('persecucion');
  }
}


export class Bomberos {
  constructor(juego) {
    this.j = juego; this.activo = null; this.espera = 0;
    const N = this.N = 420; this.pos = new Float32Array(N * 3); this.vel = new Float32Array(N * 3); this.vida = new Float32Array(N);
    for (let i = 0; i < N; i++) this.pos[i * 3 + 1] = -50;
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.6, transparent: true, depthWrite: false, color: '#e6f2ff', opacity: 0.85 }));
    this.pts.frustumCulled = false; this.pts.visible = false; juego.escena.add(this.pts);
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    this.espera -= dt;
    if (!this.activo && this.espera <= 0) {
      const c = j.coches.find(q => q.quemado > 0 && q.quemado < 10 && !q.atendido && q.pos.distanceTo(jp) < 170 && q.tipo !== 'lancha');
      if (c) {
        const p = j.puntoCalle?.(c.pos, 90, 150);
        if (p) {
          const b = j.nuevoTrafico(p, 'bomberos'); b.conductor = 'bombero'; b.sirena = true; b.urgencia = 60; b.destino = c.pos.clone();
          c.atendido = true; c.esperaBomberos = true;
          this.activo = { b, c, t: 0, fase: 'ir', rocio: 0 };
        } else this.espera = 3;
      }
    }
    const A = this.activo; if (!A) { this.pts.visible = false; return; }
    A.t += dt;
    const b = A.b, c = A.c;
    if (!j.coches.includes(b) || b.quemado || A.t > 70) { c.esperaBomberos = false; this.terminar(); return; }
    if (A.fase === 'ir' && b.pos.distanceTo(c.pos) < 13 && b.vel < 2.5) { A.fase = 'rociar'; A.rocio = 9; }
    if (A.fase === 'rociar') {
      A.rocio -= dt; this.rociar(dt, b, c);
      if (A.rocio <= 0) { c.esperaBomberos = false; c.quemado = 14; for (let k = 0; k < 6; k++) j.humo?.(c.pos.x + (Math.random() - 0.5) * 2, 1.5, c.pos.z + (Math.random() - 0.5) * 2, 2, '#bfbfbf', 3); j.hud?.notificar?.('info', 'Bomberos', 'Incendio controlado.', 2.5); this.terminar(); }
    }
  }

  rociar(dt, b, c) {
    this.pts.visible = true;
    const o = new THREE.Vector3(b.pos.x, 3.0, b.pos.z), meta = new THREE.Vector3(c.pos.x, 1.2, c.pos.z), dir = meta.clone().sub(o), dist = dir.length(); dir.normalize();
    const vel = Math.sqrt(9.8 * dist / 0.9) * 0.75, p = this.pos, v = this.vel, vi = this.vida;
    for (let i = 0; i < this.N; i++) {
      vi[i] -= dt;
      if (vi[i] <= 0 || p[i * 3 + 1] < 0.2) { vi[i] = 1.5; p[i * 3] = o.x; p[i * 3 + 1] = o.y; p[i * 3 + 2] = o.z; v[i * 3] = dir.x * vel + (Math.random() - 0.5) * 1.2; v[i * 3 + 1] = dir.y * vel + vel * 0.45 + (Math.random() - 0.5); v[i * 3 + 2] = dir.z * vel + (Math.random() - 0.5) * 1.2; vi[i] = 0.4 + Math.random() * 1.4; }
      v[i * 3 + 1] -= 9.8 * dt; p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
    this.ruido = (this.ruido || 0) - dt; if (this.ruido <= 0) { this.ruido = 0.25; const d = b.pos.distanceTo(this.j.jugador.posicion); if (d < 70) this.j.audio?.ruidoCorto(0.4, 2200, 0.12 * (1 - d / 70), 'bandpass', 0.5); }
  }

  terminar() {
    const A = this.activo; if (!A) return;
    const b = A.b; if (this.j.coches.includes(b)) { b.conductor = 'ia'; b.sirena = false; b.urgencia = 0; }
    this.activo = null; this.espera = 20; this.pts.visible = false;
  }
}
