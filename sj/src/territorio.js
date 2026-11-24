import { Peaton } from './peatones.js?v=202611231951';
import { linea, CALLE, PASO, BLOQUES, tipoBloque } from './ciudad.js?v=202611231951';

export const BANDAS = {
  nopal: { nombre: 'Los Nopaleros', color: '#3fbf5a', armas: ['pistola', 'bate', 'cuchillo', 'pistola'] },
  halcon: { nombre: 'Los Halcones', color: '#e8403a', armas: ['pistola', 'subfusil', 'bate', 'pistola'] },
  canal: { nombre: 'Los del Canal', color: '#3a8aff', armas: ['pistola', 'escopeta', 'cuchillo', 'subfusil'] },
  tuya: { nombre: 'Tu banda', color: '#b46bff' }
};
const COLONIAS = ['Colonia Agave', 'Las Palmas', 'El Nopal', 'San Juan', 'La Huerta', 'Santa Fe', 'El Mirador', 'Los Pinos', 'La Loma', 'El Rosario', 'La Presa', 'Las Flores', 'San Andrés', 'El Fresno', 'Los Olivos', 'La Ladrillera', 'El Zapote', 'Las Huertas', 'Mezquitán', 'El Retiro', 'Oblatos', 'La Aurora', 'El Batán', 'Santa Rita'];
const RENTA = 45;

export class Territorio {
  constructor(juego) {
    this.j = juego; this.grupo = null; this.guerra = null; this.ataque = null; this.tAtaque = 360 + Math.random() * 240; this.t = 0; this.aviso = null; this.muertosBanda = 0;
    const bl = [];
    for (let bx = 0; bx < BLOQUES; bx++) for (let bz = 0; bz < BLOQUES; bz++) if (tipoBloque(bx, bz) === 'barrio') bl.push({ bx, bz, x: linea(bx) + PASO / 2, z: linea(bz) + PASO / 2 });
    const ang = b => Math.atan2(b.z, b.x);
    bl.sort((a, b) => ang(a) - ang(b));
    const n = bl.length, ids = ['nopal', 'halcon', 'canal'];
    this.colonias = bl.map((b, i) => ({ ...b, k: b.bx + ',' + b.bz, nombre: COLONIAS[i % COLONIAS.length], banda: i % 4 === 3 ? null : ids[Math.floor(i / n * 3)] }));
    this.porK = Object.fromEntries(this.colonias.map(c => [c.k, c]));
  }

  coloniaEn(x, z) {
    const bx = Math.floor(x / PASO + BLOQUES / 2), bz = Math.floor(z / PASO + BLOQUES / 2), c = this.porK[bx + ',' + bz];
    if (!c) return null;
    const lx = x - linea(bx), lz = z - linea(bz);
    return lx > CALLE / 2 - 2 && lx < PASO - CALLE / 2 + 2 && lz > CALLE / 2 - 2 && lz < PASO - CALLE / 2 + 2 ? c : null;
  }

  banqueta(c, cerca, rmin = 0, rmax = 999) {
    const j = this.j, x0 = linea(c.bx) + CALLE / 2 + 1.5, x1 = linea(c.bx + 1) - CALLE / 2 - 1.5, z0 = linea(c.bz) + CALLE / 2 + 1.5, z1 = linea(c.bz + 1) - CALLE / 2 - 1.5;
    for (let k = 0; k < 40; k++) {
      const lado = Math.random() * 4 | 0, t = Math.random();
      const x = lado === 0 ? x0 : lado === 1 ? x1 : x0 + (x1 - x0) * t, z = lado === 2 ? z0 : lado === 3 ? z1 : z0 + (z1 - z0) * t;
      if (j.mundo.dentro(x, 1, z)) continue;
      if (cerca) { const d = Math.hypot(x - cerca.x, z - cerca.z); if (d < rmin || d > rmax) continue; }
      return { x, z };
    }
    return { x: x0, z: z0 };
  }

  gente(c, n, banda, estado, cerca, rmin, rmax) {
    const j = this.j, B = BANDAS[banda], l = [];
    const base = this.banqueta(c, cerca, rmin, rmax);
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, p = new Peaton(j, { tipo: 'matón', x: base.x + Math.cos(a) * 1.4, z: base.z + Math.sin(a) * 1.4, estado, arma: B.armas[k % B.armas.length] });
      j.mundo.empujar(p.pos, 0.35);
      p.yaw = a + Math.PI; p.banda = banda; p.colonia = c.k; p.fila = true; j.peatones.push(p); l.push(p);
    }
    return l;
  }

  quitarGente(l, todos) {
    const j = this.j;
    for (const p of l || []) { const i = j.peatones.indexOf(p); if (i >= 0 && (todos || (!p.muerto && p.estado === 'quieto'))) { p.quitar(); j.peatones.splice(i, 1); } }
  }

  libre() { const j = this.j; return !j.misiones?.activa && !j.jugador.interior && !j.jugador.muerto && (j.policia.estrellas || 0) < 3; }

  empezarGuerra(c) {
    const j = this.j;
    this.guerra = { c, banda: c.banda, oleada: 0, espera: 2.5, malos: [], t: 0 };
    j.hud.grande('GUERRA POR ' + c.nombre.toUpperCase(), BANDAS[c.banda].nombre + ' vienen por ti: aguanta 3 oleadas', 3);
    j.audio.alerta?.();
  }

  ganarColonia(c, extra) {
    const j = this.j;
    c.banda = 'tuya';
    j.hud.grande('¡' + c.nombre.toUpperCase() + ' ES TUYA!', `Te deja $${RENTA} cada hora del juego. Cóbralo en el teléfono → Negocios.`, 3.5, 'exito');
    j.jugador.dinero += extra || 1000; j.estadisticas?.sumar?.('colonias'); j.audio.compra(); j.guardar();
  }

  actualizarGuerra(dt) {
    const j = this.j, G = this.guerra, jp = j.jugador.posicion;
    G.t += dt;
    const d = Math.hypot(jp.x - G.c.x, jp.z - G.c.z);
    if (j.jugador.muerto || d > 95 || j.jugador.interior) { j.hud.notificar('alerta', 'Perdiste la guerra', G.c.nombre + ' sigue siendo de ' + BANDAS[G.banda].nombre + '.', 4); this.quitarGente(G.malos, false); this.guerra = null; return; }
    const vivos = G.malos.filter(p => !p.muerto);
    if (vivos.length) { j.hud.pista('·', `Guerra en ${G.c.nombre} · oleada ${G.oleada} de 3 · quedan ${vivos.length}`); return; }
    if (G.oleada >= 3) { this.guerra = null; this.ganarColonia(G.c, 1500); return; }
    G.espera -= dt;
    j.hud.pista('·', `Guerra en ${G.c.nombre} · oleada ${G.oleada + 1} de 3 en camino`);
    if (G.espera <= 0) {
      G.oleada++; G.espera = 4;
      G.malos = this.gente(G.c, 3 + G.oleada, G.banda, 'atacar', jp, 22, 45);
      for (const p of G.malos) p.salud = 70 + G.oleada * 15;
      j.jugador.salud = Math.min(j.jugador.saludMax, j.jugador.salud + 25);
      j.hud.grande('OLEADA ' + G.oleada, G.malos.length + ' de ' + BANDAS[G.banda].nombre, 1.6);
    }
  }

  actualizarAtaque(dt) {
    const j = this.j, A = this.ataque, jp = j.jugador.posicion;
    A.t -= dt;
    const d = Math.hypot(jp.x - A.c.x, jp.z - A.c.z);
    if (!A.malos && d < 70) { A.malos = this.gente(A.c, 5, A.banda, 'atacar', jp, 18, 40); j.hud.grande('¡DEFIENDE ' + A.c.nombre.toUpperCase() + '!', BANDAS[A.banda].nombre + ' quieren su colonia', 2.2); }
    if (A.malos && A.malos.every(p => p.muerto)) { this.ataque = null; j.jugador.dinero += 800; j.hud.grande('¡COLONIA DEFENDIDA!', A.c.nombre + ' sigue siendo tuya · +$800', 3, 'exito'); j.audio.compra(); return; }
    if (A.t <= 0) { this.quitarGente(A.malos, false); A.c.banda = A.banda; this.ataque = null; j.hud.notificar('alerta', 'Perdiste ' + A.c.nombre, BANDAS[A.banda].nombre + ' la recuperaron.', 4); j.guardar(); return; }
    if (d > 70) j.hud.pista('·', `${BANDAS[A.banda].nombre} atacan ${A.c.nombre} · ${Math.ceil(A.t)} s`);
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    const mias = this.colonias.filter(c => c.banda === 'tuya');
    if (mias.length) { const E = j.economia; E.cajas.territorio = Math.min(RENTA * mias.length * 48, (E.cajas.territorio || 0) + RENTA * mias.length * dt * j.ambiente.velocidad); }
    if (this.guerra) { this.actualizarGuerra(dt); return; }
    if (this.ataque) { this.actualizarAtaque(dt); return; }
    const c = j.jugador.interior ? null : this.coloniaEn(jp.x, jp.z);
    if (c !== this.aviso) {
      this.aviso = c;
      if (c && c.banda && this.libre()) j.hud.notificar('alerta', c.nombre, c.banda === 'tuya' ? 'Tu colonia.' : 'Territorio de ' + BANDAS[c.banda].nombre + '. Tumba a 3 de ellos para empezar la guerra.', 3);
    }
    if (this.grupo) {
      const G = this.grupo, dg = Math.hypot(jp.x - G.c.x, jp.z - G.c.z);
      const provocado = G.gente.some(p => p.estado === 'atacar' || p.muerto);
      if (provocado) for (const p of G.gente) if (!p.muerto && p.estado !== 'atacar') p.estado = 'atacar';
      if (!provocado && j.jugador.apunta && !j.jugador.coche) for (const p of G.gente) if (!p.muerto && p.pos.distanceTo(jp) < 9) { p.estado = 'atacar'; j.hud.burbuja?.(p, '¿Qué traes en nuestra colonia?'); break; }
      const muertos = G.gente.filter(p => p.muerto).length;
      if (muertos >= 3 && G.c.banda && G.c.banda !== 'tuya' && this.libre()) { this.empezarGuerra(G.c); this.grupo = null; return; }
      if (dg > 150 || !this.libre() && !provocado) { this.quitarGente(G.gente, false); this.grupo = null; }
      return;
    }
    this.t -= dt;
    if (this.t > 0) return; this.t = 2;
    if (c && c.banda && c.banda !== 'tuya' && this.libre()) this.grupo = { c, gente: this.gente(c, 4, c.banda, 'quieto', jp, 25, 60) };
    this.tAtaque -= 2;
    if (this.tAtaque <= 0 && mias.length && this.libre()) {
      this.tAtaque = 420 + Math.random() * 300;
      const C = mias[Math.random() * mias.length | 0], vecina = this.colonias.find(q => q.banda && q.banda !== 'tuya' && Math.abs(q.bx - C.bx) + Math.abs(q.bz - C.bz) <= 2);
      const banda = vecina?.banda || ['nopal', 'halcon', 'canal'][Math.random() * 3 | 0];
      this.ataque = { c: C, banda, t: 180, malos: null };
      j.hud.notificar('alerta', '¡Atacan tu colonia!', `${BANDAS[banda].nombre} quieren ${C.nombre}. Tienes 3 minutos para llegar.`, 6);
      j.audio.alerta?.();
    }
  }

  zonasMapa() { return this.colonias.filter(c => c.banda).map(c => ({ x0: linea(c.bx) + CALLE / 2, z0: linea(c.bz) + CALLE / 2, x1: linea(c.bx + 1) - CALLE / 2, z1: linea(c.bz + 1) - CALLE / 2, color: BANDAS[c.banda].color, nombre: c.nombre, banda: BANDAS[c.banda].nombre, ataque: this.ataque?.c === c || this.guerra?.c === c })); }

  marcasMapa() { const A = this.ataque || this.guerra; return A ? [{ x: A.c.x, z: A.c.z, tipo: 'objetivo', color: '#ff4f9a' }] : []; }

  guardar() { return Object.fromEntries(this.colonias.map(c => [c.k, c.banda])); }
  cargar(d) { if (!d) return; for (const c of this.colonias) if (c.k in d) c.banda = d[c.k]; }
}
