import { esTaxi } from './vehiculos.js?v=202611231659';
import * as THREE from 'three';
import { linea, indiceLinea } from './ciudad.js?v=202611231659';

function aCalle(D) { const lx = linea(indiceLinea(D.x)), lz = linea(indiceLinea(D.z)); return Math.abs(D.x - lx) < Math.abs(D.z - lz) ? new THREE.Vector3(lx + 4, 0, D.z) : new THREE.Vector3(D.x, 0, lz + 4); }

export class TaxiPasajero {
  constructor(juego) { this.j = juego; this.viaje = null; }

  cerca() {
    const j = this.j, J = j.jugador; if (this.viaje || J.coche || J.interior || J.muerto) return null;
    return j.coches.find(c => esTaxi(c) && c.conductor === 'ia' && !c.quemado && c.pos.distanceTo(J.pos) < 4) || null;
  }

  pista() {
    if (this.viaje) return 'Viajando en taxi · E para bajarte';
    const c = this.cerca(); if (!c) return null;
    const D = this.j.gps?.destino; if (!D) return 'Marca un destino en el mapa (M) para tomar el taxi';
    return `Tomar taxi a tu destino · $${this.tarifa(c.pos, D)}`;
  }

  tarifa(a, D) { return Math.round(25 + Math.hypot(D.x - a.x, D.z - a.z) * 0.12); }

  subir() {
    const j = this.j, J = j.jugador, c = this.cerca(), D = j.gps?.destino; if (!c || !D) return false;
    if (j.policia.estrellas) { j.hud.notificar('alerta', 'Taxi', 'Ningún taxista te lleva con la policía encima.', 3); return true; }
    const t = this.tarifa(c.pos, D); if (J.dinero < t) { j.hud.notificar('alerta', 'Taxi', `El viaje cuesta $${t}.`, 3); return true; }
    J.dinero -= t; j.audio.dinero?.();
    c.conductor = 'taxista'; c.destino = aCalle(D); c.vx *= 0.3; c.vz *= 0.3;
    this.viaje = { c, t: 0, cam: null }; J.grupo.visible = false;
    j.hud.notificar('taxi', 'Taxi', 'Siéntese cómodo, joven. E para bajarse cuando quiera.', 3.5);
    return true;
  }

  bajar(llego) {
    const j = this.j, J = j.jugador, V = this.viaje; if (!V) return;
    const c = V.c, lado = c.t.ancho / 2 + 0.9;
    J.pos.set(c.pos.x + c.fz * lado, 0, c.pos.z - c.fx * lado); j.mundo.empujar(J.pos, 0.4);
    J.grupo.visible = true; J.yaw = c.yaw;
    c.conductor = 'ia'; c.destino = null; this.viaje = null;
    if (llego) { j.hud.notificar('taxi', 'Llegamos', 'Que le vaya bien.', 2.5); j.estadisticas?.sumar?.('viajesTaxiPasajero', 1); }
  }

  actualizar(dt) {
    const V = this.viaje; if (!V) return;
    const j = this.j, c = V.c; V.t += dt;
    if (c.quemado || !j.coches.includes(c)) { this.bajar(false); return; }
    j.jugador.pos.copy(c.pos);
    if (Math.hypot(c.destino.x - c.pos.x, c.destino.z - c.pos.z) < 14 && c.vel < 1.5) this.bajar(true);
    else if (V.t > 150) this.bajar(false);
  }

  camara(cam, dt) {
    const c = this.viaje.c, obj = new THREE.Vector3(c.pos.x - c.fx * 8.5, 3.6, c.pos.z - c.fz * 8.5);
    if (!this.viaje.cam) this.viaje.cam = cam.position.clone();
    this.viaje.cam.lerp(obj, Math.min(1, dt * 3));
    cam.position.copy(this.viaje.cam); cam.lookAt(c.pos.x + c.fx * 4, 1.2, c.pos.z + c.fz * 4);
    if (cam.fov !== 62) { cam.fov = 62; cam.updateProjectionMatrix(); }
  }
}
