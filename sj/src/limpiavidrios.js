import { linea, indiceLinea, LIMITE } from './ciudad.js?v=202611220053';
import { Peaton } from './peatones.js?v=202611220053';

const PIDE = ['¿Le limpio el vidrio, jefe?', '¡Se lo dejo como espejo!', 'Nomás una ayudita, patrón.'];
const GRACIAS = ['¡Gracias, jefe! Que le vaya bonito.', '¡Dios se lo pague!', '¡Ese es mi patrón!'];
const ENOJO = ['¡Ándale pues, codo!', '¡Ni las gracias!', '¡Ahí para la otra, jefe!'];
const al = l => l[Math.random() * l.length | 0];

export class Limpiavidrios {
  constructor(juego) { this.j = juego; this.quieto = 0; this.espera = 20; this.a = null; }

  cruceCerca(p) {
    const cx = linea(indiceLinea(p.x)), cz = linea(indiceLinea(p.z));
    return Math.hypot(p.x - cx, p.z - cz) < 19 && Math.abs(p.x) < LIMITE && Math.abs(p.z) < LIMITE;
  }

  pista() { return this.a?.fase === 'cobrar' ? 'Darle $10 al limpiaparabrisas' : null; }

  pagar() {
    const a = this.a, j = this.j;
    if (!a || a.fase !== 'cobrar') return false;
    if (j.jugador.dinero < 10) { j.hud.burbuja?.(a.p, 'Ni modo, jefe.'); this.irse(); return true; }
    j.jugador.dinero -= 10; j.audio?.dinero?.(); j.hud.popDinero?.(-10);
    j.hud.burbuja?.(a.p, al(GRACIAS)); j.estadisticas?.sumar?.('propinas', 1);
    this.irse(); return true;
  }

  irse() { const a = this.a; if (!a) return; a.fase = 'irse'; a.p.limpiando = false; a.p.meta = a.origen; a.p.metaVel = 1.4; a.p.estado = 'irPunto'; a.p.llego = false; a.t = 0; }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, c = jug.coche;
    this.espera -= dt;
    if (!this.a) {
      const h = j.ambiente.hora ?? 12;
      if (c && c.tipo !== 'moto' && c.tipo !== 'lancha' && c.vel < 0.4 && !j.policia.estrellas && !j.misiones?.activa && h > 7 && h < 20.5) this.quieto += dt; else this.quieto = 0;
      if (this.quieto > 2.2 && this.espera <= 0 && this.cruceCerca(c.pos)) {
        this.espera = 50 + Math.random() * 40; this.quieto = 0;
        if (Math.random() < 0.55) this.llegar(c);
      }
      return;
    }
    const a = this.a, p = a.p;
    a.t += dt;
    if (p.muerto || !j.peatones.includes(p)) { this.a = null; return; }
    if (a.fase === 'ir') {
      const fx = Math.sin(a.c.yaw), fz = Math.cos(a.c.yaw);
      p.meta = { x: a.c.pos.x + fx * (a.c.t.largo / 2 + 0.75), z: a.c.pos.z + fz * (a.c.t.largo / 2 + 0.75) };
      if (p.llego) { a.fase = 'limpiar'; a.t = 0; p.limpiando = true; j.hud.burbuja?.(p, al(PIDE)); }
      if (a.t > 12 || jug.coche !== a.c || a.c.vel > 2) { this.irse(); }
    } else if (a.fase === 'limpiar') {
      p.yaw = Math.atan2(a.c.pos.x - p.pos.x, a.c.pos.z - p.pos.z); p.velocidad = 0;
      if (a.t > 4.2) { a.fase = 'cobrar'; a.t = 0; }
      if (jug.coche !== a.c || a.c.vel > 2.5) { j.hud.burbuja?.(p, al(ENOJO)); this.irse(); }
    } else if (a.fase === 'cobrar') {
      p.yaw = Math.atan2(a.c.pos.x - p.pos.x, a.c.pos.z - p.pos.z);
      if (jug.coche !== a.c || a.c.vel > 2.5 || a.t > 9) { j.hud.burbuja?.(p, al(ENOJO)); this.irse(); }
    } else if (a.fase === 'irse') {
      if (p.llego || a.t > 10) { p.limpiando = false; p.asignarRutaCercana?.(); p.estado = p.ruta ? 'pasear' : 'quieto'; this.a = null; }
    }
  }

  llegar(c) {
    const j = this.j, rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw);
    let o = null;
    for (const s of [1, -1]) { const x = c.pos.x + rx * s * 7, z = c.pos.z + rz * s * 7; if (!j.mundo.dentro(x, 1, z)) { o = { x, z }; break; } }
    if (!o) return;
    const p = new Peaton(j, { tipo: 'civil', x: o.x, z: o.z, estado: 'irPunto', vestido: { camisa: '#d8b24a', pantalon: '#3a3a40' } });
    p.meta = { x: c.pos.x, z: c.pos.z }; p.metaVel = 1.5; p.limpiador = true;
    j.peatones.push(p);
    this.a = { p, c, fase: 'ir', t: 0, origen: o };
  }
}
