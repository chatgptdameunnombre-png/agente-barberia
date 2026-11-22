import * as THREE from 'three';
import { pegarAHueso } from './humanos.js?v=202611220545';
import { realistaDe } from './jugador.js?v=202611220545';

const PECES = [['una mojarra', 25, '#c8ccd4', 0.22], ['una carpa', 35, '#d8a040', 0.32], ['un bagre', 45, '#6a6a5a', 0.38], ['un charal', 10, '#e8eef2', 0.12], ['una tilapia', 30, '#9aa8b0', 0.26], ['una bota vieja', 0, '#3a2a1c', 0.25]];

function pez(color, largo) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 });
  const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8).scale(largo, largo * 0.42, largo * 0.18), m); g.add(cuerpo);
  const cola = new THREE.Mesh(new THREE.ConeGeometry(largo * 0.22, largo * 0.32, 4).rotateZ(Math.PI / 2).scale(1, 1, 0.3), m); cola.position.x = -largo * 0.6; g.add(cola);
  return g;
}

export class Pesca {
  constructor(juego) {
    this.j = juego; this.e = null;
    const L = juego.ciudad.lago; if (!L) return;
    this.punto = new THREE.Vector3(L.muelle.x, 0, L.muelle.z0 + 1.1);
    this.corcho = new THREE.Group();
    const rojo = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: '#e02a2a', roughness: 0.4 }));
    const blanco = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.4 }));
    this.corcho.add(rojo, blanco); this.corcho.visible = false; juego.escena.add(this.corcho);
    this.hilo = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#dcdcdc', transparent: true, opacity: 0.7 }));
    this.hilo.frustumCulled = false; this.hilo.visible = false; juego.escena.add(this.hilo);
    this.cana = new THREE.Group();
    const mc = new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.5, metalness: 0.3 });
    const vara = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.018, 2.2, 6).translate(0, 1.1, 0), mc); this.cana.add(vara);
    const carrete = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#8a8e96', metalness: 0.7, roughness: 0.3 })); carrete.position.set(0.04, 0.25, 0); this.cana.add(carrete);
    this.punta = new THREE.Object3D(); this.punta.position.set(0, 2.2, 0); this.cana.add(this.punta);
    this.mostrado = null;
  }

  marcasMapa() { return this.punto ? [{ x: this.punto.x, z: this.punto.z, tipo: 'icono', ic: { c: '#3fb8d8', t: 'ancla' }, nombre: 'Pesca en el muelle' }] : []; }

  cerca() {
    const J = this.j.jugador; if (!this.punto || this.e || J.coche || J.interior || J.nadando || J.muerto) return false;
    return Math.hypot(J.pos.x - this.punto.x, J.pos.z - this.punto.z) < 2.2;
  }

  pista() {
    if (this.e) return this.e.fase === 'pica' ? '¡Picó! Presiona E' : 'Pescando · E para jalar · muévete para dejar de pescar';
    return this.cerca() ? 'Pescar' : null;
  }

  ponerCana() {
    const j = this.j, J = j.jugador; if (j.sinRealista) return;
    const R = realistaDe(J.personaje); if (!R.listo) return;
    if (!this.mano || this.manoDe !== R) { this.mano = pegarAHueso(R.H, 'hand_r'); this.manoDe = R; }
    if (this.mano) { this.cana.rotation.set(1.05, 0, 0); this.mano.add(this.cana); }
  }

  quitarCana() { this.cana.parent?.remove(this.cana); this.corcho.visible = false; this.hilo.visible = false; }

  empezar() {
    if (!this.cerca()) return false;
    const j = this.j, J = j.jugador;
    J.pos.copy(this.punto); J.yaw = Math.PI; J.velocidad = 0;
    this.e = { fase: 'esperar', t: 0, espera: 4 + Math.random() * 8, pos: J.pos.clone() };
    this.corcho.position.set(this.punto.x + (Math.random() - 0.5) * 2, 0.29, this.punto.z - 6.5);
    this.corcho.visible = true; this.hilo.visible = true; this.ponerCana();
    j.nado?.onda(this.corcho.position.x, this.corcho.position.z, 1.2, 1.2, 0.5);
    j.audio?.ruidoCorto?.(0.2, 1200, 0.08, 'bandpass', 1);
    return true;
  }

  jalar() {
    const E = this.e, j = this.j, J = j.jugador; if (!E) return false;
    if (E.fase === 'pica') {
      const [nombre, precio, color, largo] = PECES[Math.random() < 0.08 ? 5 : Math.random() * 5 | 0];
      if (this.mostrado) j.escena.remove(this.mostrado.g);
      const g = pez(color, largo * 2.2); g.position.copy(this.corcho.position); j.escena.add(g);
      this.mostrado = { g, t: 0, desde: this.corcho.position.clone() };
      if (precio) { J.dinero += precio; j.hud.popDinero?.(precio); j.audio?.dinero?.(); j.hud.notificar('dinero', `Sacaste ${nombre}`, `La vendes en $${precio}`, 2.6); }
      else j.hud.notificar('alerta', `Sacaste ${nombre}`, 'Ni modo, a la próxima.', 2.6);
      j.estadisticas?.sumar?.('peces', 1);
      j.nado?.onda(this.corcho.position.x, this.corcho.position.z, 2, 1.4, 0.7);
      E.fase = 'esperar'; E.t = 0; E.espera = 5 + Math.random() * 9;
    } else { E.fase = 'esperar'; E.t = 0; E.espera = 3 + Math.random() * 6; j.hud.notificar('alerta', 'Muy pronto', 'Espera a que se hunda el corcho.', 1.8); }
    return true;
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador, E = this.e, t = performance.now() / 1000;
    if (this.mostrado) {
      const M = this.mostrado; M.t += dt; const k = Math.min(1, M.t / 0.8);
      M.g.position.set(M.desde.x + (this.punto.x - M.desde.x) * k, 0.3 + Math.sin(k * Math.PI) * 2.5 + k * 1.2, M.desde.z + (this.punto.z - M.desde.z) * k);
      M.g.rotation.z = Math.sin(t * 18) * 0.5; M.g.rotation.y = t * 2;
      if (M.t > 1.6) { j.escena.remove(M.g); this.mostrado = null; }
    }
    if (!E) return;
    if (J.coche || J.muerto || J.nadando || J.pos.distanceTo(E.pos) > 0.6 || j.policia.estrellas) { this.e = null; this.quitarCana(); return; }
    E.t += dt;
    J.velocidad = 0; J.yaw = Math.PI;
    const C = this.corcho.position;
    if (E.fase === 'esperar') {
      C.y = 0.29 + Math.sin(t * 2.2) * 0.012;
      if (E.t > E.espera) { E.fase = 'pica'; E.t = 0; j.audio?.ruidoCorto?.(0.12, 900, 0.1, 'bandpass', 1.2); j.nado?.onda(C.x, C.z, 0.9, 0.8, 0.6); }
    } else if (E.fase === 'pica') {
      C.y = 0.2 + Math.sin(t * 22) * 0.06;
      if (Math.random() < dt * 6) j.nado?.onda(C.x, C.z, 0.7, 0.6, 0.5);
      if (E.t > 1.2) { E.fase = 'esperar'; E.t = 0; E.espera = 4 + Math.random() * 7; j.hud.notificar('alerta', 'Se escapó', 'Hay que jalar en cuanto se hunda el corcho.', 2); }
    }
    const P = this.hilo.geometry.attributes.position, tip = new THREE.Vector3();
    if (this.cana.parent) this.punta.getWorldPosition(tip); else tip.set(J.pos.x, 2.6, J.pos.z - 1.2);
    P.setXYZ(0, tip.x, tip.y, tip.z); P.setXYZ(1, C.x, C.y + 0.05, C.z); P.needsUpdate = true;
  }
}
