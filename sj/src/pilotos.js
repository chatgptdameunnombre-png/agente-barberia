import { Realista } from './realista.js?v=202611220552';

const CIVILES = ['peaton1', 'peaton3', 'peaton5', 'peaton7'];

export class Pilotos {
  constructor(juego, maximo = 4) { this.j = juego; this.maximo = maximo; this.usados = new Map(); this.libres = { civ: [], poli: [] }; this.t = 0; this.n = 0; }

  pedir(clase) {
    const l = this.libres[clase]; if (l.length) return l.pop();
    const R = new Realista(clase === 'poli' ? 'poli1' : CIVILES[this.n++ % CIVILES.length]); R.clase = clase; return R;
  }

  devolver(c) { const R = this.usados.get(c); if (!R) return; R.liberar(); this.usados.delete(c); this.libres[R.clase].push(R); }

  actualizar(dt) {
    const j = this.j; if (j.sinRealista) return;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 0.6;
      const P = j.jugador.posicion;
      const cand = j.coches.filter(c => c.pilotoP && c.tipo === 'moto' && c !== j.jugador.coche && c.conductor && !c.quemado && c.piloto?.visible !== false && c.piloto?.parent).map(c => [c, c.pos.distanceTo(P)]).filter(([, d]) => d < 45).sort((a, b) => a[1] - b[1]).slice(0, this.maximo).map(([c]) => c);
      const quiero = new Set(cand);
      for (const c of [...this.usados.keys()]) if (!quiero.has(c) || !j.coches.includes(c)) this.devolver(c);
      for (const c of cand) if (!this.usados.has(c)) this.usados.set(c, this.pedir(c.motoPoli ? 'poli' : 'civ'));
    }
    for (const [c, R] of this.usados) {
      const A = R.adaptadorPiloto || (R.adaptadorPiloto = { juego: j });
      R.actualizarJugador(A, dt, { yaw: c.yaw, p: c.pilotoP, vel: 0, apunta: 0, enMoto: true, sentadoListo: null });
    }
  }
}
