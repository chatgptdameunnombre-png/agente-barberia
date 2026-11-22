import { Peaton } from './peatones.js?v=202611220529';
import { puntoCalleAleatorio, nuevaRutaIA } from './vehiculos.js?v=202611220529';

const A = ['¡Usted se me cerró!', '¡Venía a vuelta de rueda, señor!', '¿Y la direccional qué?', '¡Ahorita le hablo a mi seguro!', '¡Mire nomás cómo me dejó la defensa!'];
const B = ['¡Usted frenó de golpe!', '¡Ni me vio, joven!', '¡A ver, bájele de volumen!', '¡Yo traía el verde!', '¡Que venga el ajustador!'];
const al = l => l[Math.random() * l.length | 0];

export class Percances {
  constructor(juego) { this.j = juego; this.e = null; this.reloj = 70 + Math.random() * 60; }

  armar(forzado) {
    const j = this.j, jp = j.jugador.posicion;
    const p = puntoCalleAleatorio(jp, 70, 140) || (forzado && puntoCalleAleatorio(jp, 40, 220)); if (!p) return false;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    const a = j.nuevoTrafico({ x: p.x, z: p.z, yaw: p.yaw }, Math.random() < 0.5 ? 'sedan' : 'compacto');
    const b = j.nuevoTrafico({ x: p.x - fx * 5.4, z: p.z - fz * 5.4, yaw: p.yaw + (Math.random() < 0.5 ? 0.22 : -0.22) }, Math.random() < 0.5 ? 'camioneta' : 'sedan');
    for (const c of [a, b]) { c.conductor = null; c.vx = c.vz = 0; c.reservado = true; c.puertaObj = 1; if (c.silueta) c.silueta.visible = false; }
    a.abollar?.(-fx, -fz, 9); b.abollar?.(fx, fz, 9);
    const lx = fz, lz = -fx, ladoX = p.x - fx * 2.7 + lx * 3.1, ladoZ = p.z - fz * 2.7 + lz * 3.1;
    const g1 = new Peaton(j, { x: ladoX + fx * 0.6, z: ladoZ + fz * 0.6, estado: 'quieto' }), g2 = new Peaton(j, { x: ladoX - fx * 0.6, z: ladoZ - fz * 0.6, estado: 'quieto' });
    for (const g of [g1, g2]) { g.fila = true; g.anim = 'Idle_Talking_Loop'; j.peatones.push(g); }
    g1.yaw = Math.atan2(g2.pos.x - g1.pos.x, g2.pos.z - g1.pos.z); g2.yaw = g1.yaw + Math.PI;
    this.e = { a, b, g1, g2, t: 0, fase: 'pleito', habla: 1, turno: 0, p, poli: null };
    return true;
  }

  terminar(limpio) {
    const j = this.j, E = this.e; if (!E) return;
    for (const g of [E.g1, E.g2]) {
      if (!g) continue;
      g.fila = false; g.anim = null;
      if (limpio && !g.muerto && j.peatones.includes(g)) { g.quitar(); j.peatones.splice(j.peatones.indexOf(g), 1); }
      else if (!g.muerto && g.estado === 'quieto') { g.asignarRutaCercana?.(); g.estado = g.ruta ? 'pasear' : 'quieto'; }
    }
    for (const c of [E.a, E.b]) { if (!c) continue; c.reservado = false; if (limpio && j.coches.includes(c) && !c.quemado && j.jugador.coche !== c) { c.conductor = 'ia'; c.ia = nuevaRutaIA(c.pos.x, c.pos.z, c.yaw); c.puertaObj = 0; if (c.silueta) c.silueta.visible = true; } }
    if (E.poli && j.coches.includes(E.poli) && E.poli.conductor === 'bombero') { E.poli.conductor = 'ia'; E.poli.destino = null; E.poli.luces = false; E.poli.ia = nuevaRutaIA(E.poli.pos.x, E.poli.pos.z, E.poli.yaw); }
    this.e = null; this.reloj = 150 + Math.random() * 120;
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    if (!this.e) {
      if (j.misiones?.activa || j.policia.estrellas || j.jugador.interior) return;
      this.reloj -= dt;
      if (this.reloj <= 0) { this.reloj = 30; this.armar(); }
      return;
    }
    const E = this.e; E.t += dt;
    const grupo = [E.g1, E.g2];
    if (grupo.some(g => g.muerto || !j.peatones.includes(g) || g.estado === 'huir') || [E.a, E.b].some(c => !j.coches.includes(c) || c.quemado || j.jugador.coche === c) || j.policia.estrellas) { this.terminar(false); return; }
    const d = Math.hypot(E.p.x - jp.x, E.p.z - jp.z);
    if (d > 260) { this.terminar(true); return; }
    for (const c of [E.a, E.b]) if (c.calavMalla) { c.calavMalla.visible = (E.t % 0.8) < 0.4; c.calav.color.set('#ffb030'); }
    E.habla -= dt;
    if (E.habla <= 0 && d < 30) { E.habla = 2.8 + Math.random() * 1.4; const quien = E.turno++ % 2 ? E.g2 : E.g1; j.hud.burbuja?.(quien, al(quien === E.g1 ? A : B)); }
    if (E.fase === 'pleito' && E.t > 22) {
      const q = puntoCalleAleatorio(E.p, 80, 150);
      if (q) { const c = j.nuevoTrafico({ x: q.x, z: q.z, yaw: q.yaw }, 'policia'); c.conductor = 'bombero'; c.destino = { x: E.p.x - Math.sin(E.p.yaw) * 14, z: E.p.z - Math.cos(E.p.yaw) * 14 }; c.luces = true; c.sirena = false; E.poli = c; }
      E.fase = 'patrulla'; E.t = 0;
    } else if (E.fase === 'patrulla') {
      const c = E.poli;
      if (c && Math.hypot(c.pos.x - c.destino.x, c.pos.z - c.destino.z) < 14 && c.vel < 1.5 && !E.saludo) { E.saludo = true; E.t = 0; E.fase = 'reporte'; if (d < 40) j.hud.burbuja?.(E.g1, '¡Ya llegó la patrulla!'); }
      if (E.t > 45) { E.fase = 'reporte'; E.t = 0; }
    } else if (E.fase === 'reporte') {
      if (E.t > 2 && !E.dijo && E.poli && d < 40) { E.dijo = true; j.hud.burbuja?.(E.g2, 'Que el oficial diga quién tuvo la culpa.'); }
      if (E.t > 16) {
        E.fase = 'irse'; E.t = 0;
        for (const [g, c] of [[E.g1, E.a], [E.g2, E.b]]) { const l = c.t.ancho / 2 + 0.6; g.anim = null; g.meta = { x: c.pos.x - Math.cos(c.yaw) * l, z: c.pos.z + Math.sin(c.yaw) * l }; g.metaVel = 1.3; g.estado = 'irPunto'; g.llego = false; }
      }
    } else if (E.fase === 'irse') {
      if ((E.g1.llego && E.g2.llego) || E.t > 9) { j.estadisticas?.sumar?.('percances', 1); this.terminar(true); }
    }
  }
}
