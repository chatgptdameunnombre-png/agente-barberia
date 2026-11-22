import { puntoCalleAleatorio } from './vehiculos.js?v=202611220210';

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
