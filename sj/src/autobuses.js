import * as THREE from 'three';
import { linea, CALLE } from './ciudad.js?v=202611231822';
import { Coche, nuevaRutaIA, objetivoIA, dirigir } from './vehiculos.js?v=202611231822';
import { Peaton } from './peatones.js?v=202611231822';

const RUTA = [[1, 1], [7, 1], [7, 7], [1, 7]];

export class Autobuses {
  constructor(juego) {
    this.j = juego;
    this.buses = [];
    this.paradas = [];
    this.reloj = 0;
    const lado = CALLE / 2 + 1.6;
    for (let k = 0; k < RUTA.length; k++) {
      const [a, b] = RUTA[k], [c, d] = RUTA[(k + 1) % RUTA.length];
      const dx = Math.sign(c - a), dz = Math.sign(d - b);
      const mi = (a + c) / 2, mk = (b + d) / 2;
      const x = dx ? linea(Math.floor(mi)) + 40 : linea(a), z = dz ? linea(Math.floor(mk)) + 40 : linea(b);
      const rx = -dz, rz = dx;
      this.paradas.push({ x: x + rx * lado, z: z + rz * lado, carril: { x: x + rx * 4, z: z + rz * 4 }, dx, dz, gente: [] });
    }
    const metal = new THREE.MeshStandardMaterial({ color: '#3a3e46', roughness: 0.4, metalness: 0.6 });
    const vidrio = new THREE.MeshStandardMaterial({ color: '#9ab8c8', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.35 });
    const techo = new THREE.MeshStandardMaterial({ color: '#2e8a5a', roughness: 0.5 });
    for (const P of this.paradas) {
      const g = new THREE.Group(), yaw = Math.atan2(-P.dx, -P.dz) + Math.PI / 2;
      const m = (geo, mat, x, y, z) => { const k = new THREE.Mesh(geo, mat); k.position.set(x, y, z); k.castShadow = true; g.add(k); return k; };
      for (const sx of [-1.4, 1.4]) m(new THREE.BoxGeometry(0.08, 2.4, 0.08), metal, sx, 1.2, -0.6);
      m(new THREE.BoxGeometry(3.2, 0.1, 1.6), techo, 0, 2.45, -0.2);
      m(new THREE.BoxGeometry(3, 1.8, 0.04), vidrio, 0, 1.3, -0.62);
      m(new THREE.BoxGeometry(2.4, 0.08, 0.45), metal, 0, 0.48, -0.35);
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
      x.fillStyle = '#2e8a5a'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#fff'; x.font = '900 34px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PARADA · RUTA 7', 128, 34);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const s = m(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: t }), 0, 2.2, 0.62); s.castShadow = false;
      g.position.set(P.x, 0, P.z); g.rotation.y = yaw;
      juego.escena.add(g);
      juego.mundo.agregar(P.x - 0.2, P.z - 0.2, P.x + 0.2, P.z + 0.2, 2.5);
    }
    for (let k = 0; k < 2; k++) this.crearBus(k * 2);
  }

  crearBus(tramo) {
    const j = this.j, [a, b] = RUTA[tramo], [c, d] = RUTA[(tramo + 1) % RUTA.length];
    const dx = Math.sign(c - a), dz = Math.sign(d - b), x = linea(a) - dz * 4 + dx * 20, z = linea(b) + dx * 4 + dz * 20;
    const bus = new Coche(j, 'autobus', '#2e8a5a', x, z, Math.atan2(dx, dz));
    bus.conductor = 'bus'; bus.ia = nuevaRutaIA(x, z, bus.yaw); bus.meta = (tramo + 1) % RUTA.length; bus.parada = -1; bus.espera = 0;
    j.coches.push(bus); this.buses.push(bus);
  }

  elegir(bus) {
    return (op, R) => {
      const [tx, tz] = RUTA[bus.meta];
      if (R.ix === tx && R.iz === tz) bus.meta = (bus.meta + 1) % RUTA.length;
      const [mx, mz] = RUTA[bus.meta];
      const quiere = [Math.sign(mx - R.ix), Math.sign(mz - R.iz)];
      return op.find(([ax, az]) => (ax && ax === quiere[0]) || (az && az === quiere[1])) || op.find(([ax, az]) => ax === R.dx && az === R.dz) || op[0];
    };
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    this.reloj -= dt;
    if (this.reloj <= 0) {
      this.reloj = 3;
      for (const P of this.paradas) {
        P.gente = P.gente.filter(q => j.peatones.includes(q) && !q.muerto && q.estado === 'quieto');
        const d = Math.hypot(P.x - jp.x, P.z - jp.z);
        if (d < 120 && d > 30 && P.gente.length < 3 && Math.random() < 0.5) {
          const q = new Peaton(j, { x: P.x + (Math.random() - 0.5) * 2.4, z: P.z + (Math.random() - 0.5) * 0.6, estado: 'quieto' });
          q.yaw = Math.atan2(P.dx === 0 ? -Math.sign(P.carril.x - P.x) * -1 : 0, P.dz === 0 ? Math.sign(P.carril.z - P.z) : 0);
          q.yaw = Math.atan2(P.carril.x - P.x, P.carril.z - P.z);
          j.peatones.push(q); P.gente.push(q);
        }
      }
      for (let i = this.buses.length - 1; i >= 0; i--) if (this.buses[i].quemado > 20 || !j.coches.includes(this.buses[i])) this.buses.splice(i, 1);
      if (this.buses.length < 2) this.crearBus(Math.random() * 4 | 0);
    }
  }

  cercaParada() {
    const j = this.j, J = j.jugador; if (this.viaje || J.coche || J.muerto || J.interior) return null;
    for (const bus of this.buses) {
      if (bus.quemado || !(bus.espera > 0.6) || bus.parada < 0) continue;
      const P = this.paradas[bus.parada];
      if (Math.hypot(J.pos.x - P.x, J.pos.z - P.z) < 4.5 || bus.pos.distanceTo(J.pos) < 6) return { bus, P };
    }
    return null;
  }

  pista() {
    if (this.viaje) { const b = this.viaje.bus; return b.espera > 0.6 && b.parada !== this.viaje.desde ? 'Bajarte en esta parada' : 'Viajando en el camión · E para bajarte en la siguiente parada'; }
    return this.cercaParada() ? 'Subir al camión Ruta 7 · $9' : null;
  }

  subir() {
    const j = this.j, J = j.jugador, c = this.cercaParada(); if (!c) return false;
    if (j.policia.estrellas) { j.hud.notificar('alerta', 'Ruta 7', 'El chofer no te sube con la policía encima.', 3); return true; }
    if (J.dinero < 9) { j.hud.notificar('alerta', 'Ruta 7', 'El pasaje cuesta $9.', 3); return true; }
    J.dinero -= 9; j.audio?.dinero?.(); c.bus.espera = Math.max(c.bus.espera, 2.5);
    this.viaje = { bus: c.bus, desde: c.bus.parada, t: 0, cam: null, bajar: false };
    J.grupo.visible = false;
    j.hud.notificar('taxi', 'Ruta 7', 'Pasaje pagado. Te bajas en la siguiente parada (o presiona E en una parada).', 3.5);
    return true;
  }

  bajar() {
    const j = this.j, J = j.jugador, V = this.viaje; if (!V) return;
    const b = V.bus;
    if (!(b.espera > 0.3) || b.parada < 0) { V.bajar = true; j.hud.notificar('taxi', 'Ruta 7', '¡Bajan! Te bajas en la siguiente parada.', 2.5); return; }
    const P = this.paradas[b.parada];
    J.pos.set(P.x + (Math.random() - 0.5) * 1.5, 0, P.z); j.mundo.empujar(J.pos, 0.4);
    J.grupo.visible = true; J.yaw = Math.atan2(P.carril.x - P.x, P.carril.z - P.z) + Math.PI;
    this.viaje = null; j.estadisticas?.sumar?.('viajesCamion', 1);
  }

  actualizarViaje(dt) {
    const V = this.viaje; if (!V) return;
    const j = this.j, b = V.bus; V.t += dt;
    if (b.quemado || !j.coches.includes(b)) { this.viaje = null; j.jugador.grupo.visible = true; return; }
    j.jugador.pos.copy(b.pos);
    if (b.parada >= 0 && b.parada !== V.desde && b.espera > 0.3 && b.espera < 1.6) this.bajar();
  }

  camara(cam, dt) {
    const b = this.viaje.bus, obj = new THREE.Vector3(b.pos.x - b.fx * 13 + b.fz * 2, 6.2, b.pos.z - b.fz * 13 - b.fx * 2);
    if (!this.viaje.cam) this.viaje.cam = cam.position.clone();
    this.viaje.cam.lerp(obj, Math.min(1, dt * 2.5));
    cam.position.copy(this.viaje.cam); cam.lookAt(b.pos.x + b.fx * 6, 1.8, b.pos.z + b.fz * 6);
    if (cam.fov !== 62) { cam.fov = 62; cam.updateProjectionMatrix(); }
  }

  conducir(bus, dt) {
    const j = this.j;
    if (bus.quemado) { bus.manejar(dt, 0, 0, true); return; }
    if (bus.espera > 0) {
      bus.espera -= dt; bus.manejar(dt, bus.adelante > 0.3 ? -1 : 0, 0, true);
      if (bus.espera < 3 && !bus.bajaron) {
        bus.bajaron = true;
        const P = this.paradas[bus.parada];
        for (const q of P.gente) if (j.peatones.includes(q)) { q.quitar(); j.peatones.splice(j.peatones.indexOf(q), 1); }
        P.gente = [];
        const n = 1 + (Math.random() * 2 | 0);
        for (let k = 0; k < n; k++) { const q = new Peaton(j, { x: P.x + (k - 0.5) * 1.2, z: P.z, estado: 'pasear' }); q.asignarRutaCercana?.(); j.peatones.push(q); }
      }
      return;
    }
    const o = objetivoIA(bus, this.elegir(bus));
    const { angulo: a } = dirigir(bus, o.x, o.z);
    let v = o.lento ? 5 : 11;
    if (Math.abs(a) > 0.6) v = 4;
    const libre = j.distanciaLibre(bus, 22, false);
    if (libre < 20) v = Math.min(v, Math.max(0, (libre - 4) * 0.9));
    const RI = bus.ia, along = (bus.pos.x - linea(RI.ix)) * RI.dx + (bus.pos.z - linea(RI.iz)) * RI.dz;
    const luz = j.semaforos?.estado(RI.ix, RI.iz, RI.dx !== 0 ? 'x' : 'z');
    if (luz && luz !== 'verde' && along > -30 && along < -11) v = Math.min(v, Math.max(0, (-12.5 - along) * 1.1));
    this.paradas.forEach((P, k) => {
      const d = Math.hypot(P.carril.x - bus.pos.x, P.carril.z - bus.pos.z);
      if (k !== bus.parada && d < 14) v = Math.min(v, Math.max(1.5, d * 0.7));
      if (k !== bus.parada && d < 2.5) { bus.parada = k; bus.espera = 6; bus.bajaron = false; j.audio?.tono?.(320, 0.25, 0.05 * Math.max(0, 1 - bus.pos.distanceTo(j.jugador.posicion) / 40), 'sine'); }
    });
    if (v < 1) bus.manejar(dt, bus.adelante > 0.3 ? -1 : 0, dirigir(bus, o.x, o.z).giro, false);
    else j.conducirHacia(bus, dt, o.x, o.z, v);
  }
}
