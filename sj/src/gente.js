import { Realista } from './realista.js?v=202611212317';

const HOMBRES = ['peaton1', 'peaton3', 'peaton5', 'peaton7', 'peaton9', 'peaton11', 'peaton13', 'peaton15', 'peaton17', 'peaton19'];
const MUJERES = ['peaton2', 'peaton4', 'peaton6', 'peaton8', 'peaton10', 'peaton12', 'peaton14', 'peaton16', 'peaton18', 'peaton20'];
const POLIS_H = ['poli1', 'poli2'], POLIS_M = ['poli3'], MATONES = ['maton1', 'maton2'];

export class Gente {
  constructor(juego, maximo = 14) {
    this.j = juego; this.maximo = maximo; this.libres = { h: [], m: [], ph: [], pm: [], t: [] }; this.usados = new Map(); this.t = 0; this.cuenta = 0;
  }

  clase(q) { return q.tipo === 'poli' ? (q.p.mujer ? 'pm' : 'ph') : q.tipo === 'matón' ? 't' : q.p.mujer ? 'm' : 'h'; }

  pedir(clase) {
    const lista = this.libres[clase];
    if (lista.length) return lista.pop();
    const nombres = { h: HOMBRES, m: MUJERES, ph: POLIS_H, pm: POLIS_M, t: MATONES }[clase];
    this.cuenta++;
    const R = new Realista(nombres[this.cuenta % nombres.length]); R.clase = clase;
    return R;
  }

  devolver(q) {
    const R = this.usados.get(q);
    if (!R) return;
    R.liberar(); this.usados.delete(q);
    this.libres[R.clase].push(R);
  }

  actualizar(dt) {
    const j = this.j;
    if (j.sinRealista) return;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 0.5;
      const P = j.jugador.posicion;
      const cand = j.peatones.filter(q => !q.enInterior && q.p && q.grupo?.parent && !(q.muerto && !this.usados.has(q))).map(q => [q, Math.hypot(q.pos.x - P.x, q.pos.z - P.z)]).filter(([, d]) => d < 42).sort((a, b) => a[1] - b[1]).slice(0, this.maximo).map(([q]) => q);
      const quiero = new Set(cand);
      for (const q of [...this.usados.keys()]) if (!quiero.has(q) || !j.peatones.includes(q)) this.devolver(q);
      for (const q of cand) if (!this.usados.has(q)) this.usados.set(q, this.pedir(this.clase(q)));
    }
    for (const [q, R] of this.usados) R.actualizarPeaton(q, dt);
  }
}
