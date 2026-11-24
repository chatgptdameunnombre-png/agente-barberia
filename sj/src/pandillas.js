import { Peaton } from './peatones.js?v=202611231901';
import { linea, CALLE, BLOQUES, tipoBloque } from './ciudad.js?v=202611231901';

export class Pandillas {
  constructor(juego) {
    this.j = juego; this.grupos = []; this.t = 0; this.ruido = 0;
    const esquinas = [];
    for (let i = 1; i < BLOQUES; i++) for (let k = 1; k < BLOQUES; k++) {
      const bx = i - 1, bz = k - 1;
      if (tipoBloque(bx, bz) === 'barrio' && tipoBloque(i, k) === 'barrio') esquinas.push({ x: linea(i) - CALLE / 2 - 1.6, z: linea(k) - CALLE / 2 - 1.6, cx: linea(i) - CALLE / 2 + 2.5, cz: linea(k) - CALLE / 2 - 6 });
    }
    this.sitios = esquinas.filter((_, n) => n % 3 === 1).slice(0, 5);
  }

  armar() {
    const j = this.j;
    for (const S of this.sitios) {
      const g = { S, gente: [], coche: null };
      const c = j.nuevoTrafico({ x: S.cx, z: S.cz, yaw: 0 }, Math.random() < 0.5 ? 'deportivo' : 'camioneta');
      c.conductor = null; c.vx = c.vz = 0; c.pandilla = true; c.puertaObj = 1; g.coche = c;
      const armas = ['pistola', 'bate', 'puno', 'cuchillo'];
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI * 2, p = new Peaton(j, { tipo: 'matón', x: S.x + Math.cos(a) * 1.2, z: S.z + Math.sin(a) * 1.2, estado: 'quieto', arma: armas[(k + this.grupos.length) % armas.length] });
        p.yaw = a + Math.PI; p.pandilla = true; j.peatones.push(p); g.gente.push(p);
      }
      this.grupos.push(g);
    }
  }

  quitar() {
    const j = this.j;
    for (const g of this.grupos) {
      for (const p of g.gente) { const i = j.peatones.indexOf(p); if (i >= 0 && !p.muerto && p.estado === 'quieto') { p.quitar(); j.peatones.splice(i, 1); } }
      const c = g.coche; if (c && !c.conductor && !c.quemado) { const i = j.coches.indexOf(c); if (i >= 0) { c.quitar(); j.coches.splice(i, 1); } }
    }
    this.grupos = [];
  }

  actualizar(dt) {
    const j = this.j;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 3;
      const h = j.ambiente.hora ?? 12, noche = h > 21 || h < 4.5;
      if (noche && !this.grupos.length && !j.misiones?.activa) this.armar();
      else if (!noche && this.grupos.length) this.quitar();
    }
    const jp = j.jugador.posicion;
    this.ruido -= dt;
    for (const g of this.grupos) {
      const d = Math.hypot(g.S.x - jp.x, g.S.z - jp.z);
      const provocado = g.gente.some(p => p.estado === 'atacar' || p.muerto);
      if (provocado) for (const p of g.gente) if (!p.muerto && p.estado !== 'atacar') p.estado = 'atacar';
      if (!provocado && d < 9 && j.jugador.apunta && !j.jugador.coche) for (const p of g.gente) if (!p.muerto) { p.estado = 'atacar'; j.hud.burbuja?.(p, '¿Qué traes, carnal?'); break; }
      if (!provocado && d < 5 && !g.saludo) { g.saludo = true; const p = g.gente.find(q => !q.muerto); if (p) j.hud.burbuja?.(p, ['¿Qué onda?', 'Aquí nomás, tranquilos.', '¿Se te perdió algo?'][Math.random() * 3 | 0]); }
      if (d > 12) g.saludo = false;
      if (!provocado && d < 40 && this.ruido <= 0) { const v = 0.05 * (1 - d / 40), a = j.audio, t = a?.ctx?.currentTime || 0; for (let k = 0; k < 4; k++) a?.tono([110, 110, 147, 98][k], 0.18, v, 'square', null, t + k * 0.3); }
    }
    if (this.ruido <= 0) this.ruido = 1.2;
  }
}
