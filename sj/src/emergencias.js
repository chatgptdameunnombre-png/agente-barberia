import { puntoCalleAleatorio } from './vehiculos.js?v=202611220221';

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
  }
}
