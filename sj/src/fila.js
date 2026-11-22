import { Peaton } from './peatones.js?v=202611220221';

export class FilaAntro {
  constructor(juego) { this.j = juego; this.gente = []; this.t = 0; }

  armar() {
    const j = this.j, t = j.interiores?.tiendas?.find(q => q.tipo === 'antro'); if (!t) return;
    const lx = t.fz, lz = -t.fx, base = { x: t.puerta.x + t.fx * 0.4, z: t.puerta.z + t.fz * 0.4 };
    const cad = new Peaton(j, { tipo: 'civil', x: base.x + lx * 1.2, z: base.z + lz * 1.2, estado: 'quieto', vestido: { camisa: '#111114', pantalon: '#111114' } });
    cad.fila = true; cad.ruta = null; cad.yaw = Math.atan2(t.fx, t.fz); cad.proxBanca = cad.proxCharla = 1e9; j.peatones.push(cad); this.gente.push(cad);
    for (let k = 0; k < 7; k++) {
      const d = 2.4 + k * 0.85, p = new Peaton(j, { tipo: 'civil', x: base.x + lx * d + t.fx * (k % 2 ? 0.25 : 0), z: base.z + lz * d + t.fz * (k % 2 ? 0.25 : 0), estado: 'quieto' });
      p.fila = true; p.ruta = null; p.yaw = Math.atan2(-lx, -lz) + (Math.random() - 0.5) * 0.5; p.proxBanca = p.proxCharla = 1e9;
      j.peatones.push(p); this.gente.push(p);
    }
    for (let k = 1; k + 1 < this.gente.length; k += 2) { const a = this.gente[k], b = this.gente[k + 1]; if (Math.random() < 0.7) { a.estado = b.estado = 'charla'; a.con = b; b.con = a; a.charlaT = b.charlaT = 1e9; } }
  }

  quitar() { const j = this.j; for (const p of this.gente) { const i = j.peatones.indexOf(p); if (i >= 0) { p.quitar(); j.peatones.splice(i, 1); } } this.gente = []; }

  actualizar(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 2;
    const j = this.j, h = j.ambiente.hora ?? 12, noche = h > 21 || h < 3.5;
    if (noche && !this.gente.length) this.armar();
    else if (!noche && this.gente.length) this.quitar();
    for (const p of this.gente) if (p.estado === 'pasear' && !p.miedo) { p.estado = 'quieto'; }
  }
}
