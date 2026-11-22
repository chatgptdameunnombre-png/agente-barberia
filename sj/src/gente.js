import { Realista } from './realista.js?v=202611212210';

const HOMBRES = ['peaton1', 'peaton3', 'peaton5', 'peaton7', 'peaton9'];
const MUJERES = ['peaton2', 'peaton4', 'peaton6', 'peaton8', 'peaton10'];

export class Gente {
  constructor(juego, maximo = 14) {
    this.j = juego; this.maximo = maximo; this.libres = { h: [], m: [] }; this.usados = new Map(); this.t = 0; this.cuenta = 0;
  }

  pedir(mujer) {
    const lista = this.libres[mujer ? 'm' : 'h'];
    if (lista.length) return lista.pop();
    const nombres = mujer ? MUJERES : HOMBRES;
    this.cuenta++;
    return new Realista(nombres[this.cuenta % nombres.length]);
  }

  devolver(q) {
    const R = this.usados.get(q);
    if (!R) return;
    R.liberar(); this.usados.delete(q);
    this.libres[R.mujer ? 'm' : 'h'].push(R);
  }

  actualizar(dt) {
    const j = this.j;
    if (j.sinRealista) return;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 0.5;
      const P = j.jugador.posicion;
      const cand = j.peatones.filter(q => q.tipo !== 'poli' && !q.enInterior && q.p && q.grupo?.parent && !(q.muerto && !this.usados.has(q))).map(q => [q, Math.hypot(q.pos.x - P.x, q.pos.z - P.z)]).filter(([, d]) => d < 42).sort((a, b) => a[1] - b[1]).slice(0, this.maximo).map(([q]) => q);
      const quiero = new Set(cand);
      for (const q of [...this.usados.keys()]) if (!quiero.has(q) || !j.peatones.includes(q)) this.devolver(q);
      for (const q of cand) if (!this.usados.has(q)) { const R = this.pedir(!!q.p.mujer); R.mujer = !!q.p.mujer; this.usados.set(q, R); }
    }
    for (const [q, R] of this.usados) R.actualizarPeaton(q, dt);
  }
}
