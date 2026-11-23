import { Peaton } from './peatones.js?v=202611222040';
import { nuevaRutaIA } from './vehiculos.js?v=202611222040';

const PELEA = ['¡Fíjate, animal!', '¡Bájate si eres tan valiente!', '¡Ahora sí me la pagas!', '¡Mi coche, desgraciado!'];
const RECLAMO = ['¿Qué te pasa? ¡Me debes la defensa!', '¡Aprende a manejar!', '¡Ya me pegaste, oye!', '¡Ni te paras, eh!'];
const MIEDO = ['¡No me haga nada!', '¡Llévese lo que quiera!'];
const al = l => l[Math.random() * l.length | 0];

export class Enojados {
  constructor(juego) { this.j = juego; this.lista = []; this.espera = 0; }

  choque(c, fuerza) {
    const j = this.j;
    if (this.espera > 0 || this.lista.length >= 2 || fuerza < 4.5 || fuerza > 17) return;
    if (c.conductor !== 'ia' || c.bici || c.tipo === 'moto' || c.tipo === 'autobus' || c.urgencia || c.fugitivo || c.pandilla || c.quemado) return;
    if (j.misiones?.activa || j.policia.estrellas >= 3 || this.lista.some(e => e.c === c)) return;
    if (Math.random() > 0.45) return;
    this.espera = 12;
    c.conductor = 'enojado';
    this.lista.push({ c, fase: 'frenar', t: 0, p: null, humor: Math.random() < 0.55 ? 'pelea' : Math.random() < 0.7 ? 'reclamo' : 'miedo' });
  }

  bajar(e) {
    const j = this.j, c = e.c, lado = c.t.ancho / 2 + 0.7;
    const x = c.pos.x + c.fz * lado, z = c.pos.z - c.fx * lado;
    c.conductor = null; c.vx *= 0.2; c.vz *= 0.2; c.puertaObj = 1; if (c.silueta) c.silueta.visible = false;
    const p = new Peaton(j, { x, z, estado: 'quieto', yaw: c.yaw + Math.PI / 2 });
    p.enojado = true; p.fila = true; j.peatones.push(p); e.p = p;
    const jp = j.jugador.posicion;
    if (e.humor === 'pelea') { p.estado = 'atacar'; p.hostil = true; j.hud.burbuja?.(p, al(PELEA)); }
    else if (e.humor === 'miedo') { p.asustar?.(jp.x, jp.z, 3); j.hud.burbuja?.(p, al(MIEDO)); }
    else { p.meta = { x: jp.x, z: jp.z }; p.metaVel = 1.6; p.estado = 'irPunto'; p.llego = false; j.hud.burbuja?.(p, al(RECLAMO)); }
    e.fase = 'abajo'; e.t = 0;
  }

  regresar(e) {
    const p = e.p, c = e.c, lado = c.t.ancho / 2 + 0.7;
    p.estado = 'irPunto'; p.hostil = false; p.meta = { x: c.pos.x + c.fz * lado, z: c.pos.z - c.fx * lado }; p.metaVel = 1.5; p.llego = false;
    e.fase = 'regresa'; e.t = 0;
  }

  terminar(e, manejar) {
    const j = this.j, p = e.p, c = e.c;
    if (manejar && p && !p.muerto && j.coches.includes(c) && !c.quemado && j.jugador.coche !== c) {
      const i = j.peatones.indexOf(p); if (i >= 0) { p.quitar(); j.peatones.splice(i, 1); }
      c.conductor = 'ia'; c.ia = nuevaRutaIA(c.pos.x, c.pos.z, c.yaw); c.puertaObj = 0; if (c.silueta) c.silueta.visible = true;
    } else if (p) { p.fila = false; p.enojado = false; if (!p.muerto && p.estado !== 'atacar') { p.asignarRutaCercana?.(); p.estado = p.ruta ? 'pasear' : 'quieto'; } }
    this.lista.splice(this.lista.indexOf(e), 1);
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    this.espera -= dt;
    for (const e of [...this.lista]) {
      e.t += dt;
      const c = e.c, p = e.p;
      if (!j.coches.includes(c) || c.quemado) { this.terminar(e, false); continue; }
      if (e.fase === 'frenar') {
        if (c.conductor !== 'enojado') { this.lista.splice(this.lista.indexOf(e), 1); continue; }
        if (e.t > 1.1 && c.vel < 1.5) this.bajar(e);
        else if (e.t > 4) { c.conductor = 'ia'; this.lista.splice(this.lista.indexOf(e), 1); }
        continue;
      }
      if (!p || p.muerto || !j.peatones.includes(p)) { this.terminar(e, false); continue; }
      const d = Math.hypot(p.pos.x - jp.x, p.pos.z - jp.z);
      if (e.fase === 'abajo') {
        if (e.humor === 'reclamo') {
          if (p.llego || d < 2.2) { p.estado = 'quieto'; p.yaw = Math.atan2(jp.x - p.pos.x, jp.z - p.pos.z); if (!e.dijo) { e.dijo = true; j.hud.burbuja?.(p, al(RECLAMO)); } }
          else p.meta = { x: jp.x, z: jp.z };
          if (p.golpe > 0 || p.salud < 40) { e.humor = 'pelea'; p.estado = 'atacar'; p.hostil = true; j.hud.burbuja?.(p, al(PELEA)); }
        }
        if (e.t > (e.humor === 'pelea' ? 22 : 9) || d > 45) this.regresar(e);
      } else if (e.fase === 'regresa') {
        if (p.estado === 'atacar') { e.fase = 'abajo'; e.t = 0; continue; }
        if (p.llego || e.t > 14) this.terminar(e, true);
      }
    }
  }
}
