import { Coche, nuevaRutaIA, puntoCalleAleatorio } from './vehiculos.js?v=202611231951';

export class Eventos {
  constructor(juego) {
    this.j = juego;
    this.reloj = 90 + Math.random() * 60;
    this.camion = null;
  }

  marcasMapa() {
    const c = this.camion;
    return c && !c.quemado ? [{ x: c.pos.x, z: c.pos.z, tipo: 'objetivo', color: '#4fe08a', texto: '$' }] : [];
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    if (this.camion) {
      const c = this.camion;
      this.t += dt;
      if (c.quemado && !this.botin) {
        this.botin = true;
        for (let k = 0; k < 3; k++) { const r = j.crearRecogible('dinero', c.pos.x + (Math.random() - 0.5) * 6, c.pos.z + (Math.random() - 0.5) * 6, false, 600 + Math.floor(Math.random() * 5) * 100); r.vida = 90; }
        j.policia.subir(3);
        j.hud.grande('¡CAMIÓN DE VALORES!', 'Recoge las bolsas de dinero antes de que lleguen', 3, 'exito');
        j.redes.publicar('camion', '', { forzar: true });
        j.estadisticas.sumar('camiones');
      }
      const d = c.pos.distanceTo(jp);
      if ((this.botin && this.t > 40) || (!c.quemado && (d > 420 || this.t > 160))) {
        if (!c.quemado && j.coches.includes(c) && c !== j.jugador.coche) { c.quitar(); j.coches.splice(j.coches.indexOf(c), 1); }
        c.marcado = false;
        this.camion = null;
        this.reloj = 200 + Math.random() * 140;
      }
      return;
    }
    if (j.misiones.activa || j.policia.estrellas > 0 || j.jugador.interior) return;
    this.reloj -= dt;
    if (this.reloj > 0) return;
    const p = puntoCalleAleatorio(jp, 130, 200);
    if (!p) { this.reloj = 10; return; }
    const c = new Coche(j, 'blindado', '#c9ced6', p.x, p.z, p.yaw);
    c.conductor = 'ia'; c.ia = nuevaRutaIA(p.x, p.z, p.yaw); c.marcado = true; c.id = 999;
    j.coches.push(c);
    this.camion = c; this.t = 0; this.botin = false;
    j.hud.notificar('dinero', 'Camión de valores', 'Va pasando por ' + j.calleDe(p.x, p.z) + '. Si lo detienes, el botín es tuyo.', 7);
    j.audio.notif?.();
  }
}
