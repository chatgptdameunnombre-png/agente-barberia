import { puntoCalleAleatorio } from './vehiculos.js?v=202611220119';

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
