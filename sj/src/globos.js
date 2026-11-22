import * as THREE from 'three';
import { Peaton } from './peatones.js?v=202611220552';

const COLORES = ['#ff3d6e', '#ffd23a', '#3fa8ff', '#4fe08a', '#b46bff', '#ff8a2a', '#ffffff', '#ff5ac8'];
const geoGlobo = new THREE.SphereGeometry(0.17, 12, 10).scale(1, 1.22, 1);
const matHilo = new THREE.LineBasicMaterial({ color: '#e8e8e8' });

function globo(color, largo) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geoGlobo, new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15, sheen: 0.3 }));
  m.position.y = largo; m.castShadow = true; g.add(m);
  const nudo = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 6), m.material); nudo.position.y = largo - 0.22; nudo.rotation.x = Math.PI; g.add(nudo);
  const h = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, largo - 0.24, 0)]);
  g.add(new THREE.Line(h, matHilo));
  g.userData.bola = m;
  return g;
}

function racimo() {
  const g = new THREE.Group(); g.userData.siempreVisible = true;
  const base = new THREE.Group(); base.position.set(0.32, 1.05, 0.2); g.add(base);
  const lista = [];
  for (let k = 0; k < 14; k++) {
    const b = globo(COLORES[k % COLORES.length], 1.25 + Math.random() * 0.55);
    b.rotation.set((Math.random() - 0.5) * 0.7, Math.random() * 6, (Math.random() - 0.5) * 0.7);
    base.add(b); lista.push({ b, f: Math.random() * 6, rx: b.rotation.x, rz: b.rotation.z });
  }
  g.userData.lista = lista;
  return g;
}

export class Globos {
  constructor(juego) {
    this.j = juego; this.lista = []; this.mio = null;
    const B = juego.ciudad.bloques.filter(b => ['parque', 'plaza'].includes(b.tipo));
    for (let k = 0; k < Math.min(3, B.length); k++) this.crear(B[k]);
  }

  crear(b) {
    const j = this.j, p = new Peaton(j, { tipo: 'civil', vestido: { camisa: '#e8e2d0', pantalon: '#4a4c54', sombrero: true } });
    p.asignarBloque(b); p.paletero = true; p.proxBanca = p.proxCharla = 1e9; p.limpiador = true;
    const r = racimo(); p.grupo.add(r);
    j.peatones.push(p);
    this.lista.push({ p, r });
  }

  cerca() {
    const J = this.j.jugador; if (J.coche || J.interior || this.mio) return null;
    return this.lista.find(q => !q.p.muerto && Math.hypot(q.p.pos.x - J.pos.x, q.p.pos.z - J.pos.z) < 2.2) || null;
  }

  comprar() {
    const q = this.cerca(), j = this.j, J = j.jugador; if (!q) return false;
    if (J.dinero < 20) { j.hud.notificar('alerta', 'No te alcanza', 'El globo cuesta $20', 2); return true; }
    J.dinero -= 20; j.hud.popDinero?.(-20); j.audio.compra?.();
    const color = COLORES[Math.random() * COLORES.length | 0];
    const g = globo(color, 1.15); j.escena.add(g);
    this.mio = { g, t: 0, pos: new THREE.Vector3(J.pos.x, 1.1, J.pos.z), vel: new THREE.Vector3(), suelto: false };
    j.hud.burbuja?.(q.p, '¡Que lo disfrute!'); j.hud.notificar('ok', 'Globo', 'Te lo llevas un rato. Si corres o te subes a un coche, se te va.', 2.8);
    q.p.estado = 'quieto'; q.p.volverPasear = q.p.t + 3;
    return true;
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador, t = performance.now() / 1000, viento = j.ambiente.lluvia > 0.3 ? 1.6 : 1;
    this.lista = this.lista.filter(q => j.peatones.includes(q.p));
    for (const q of this.lista) {
      if (q.p.muerto) { if (q.r.parent) { q.r.parent.remove(q.r); } continue; }
      const d = Math.hypot(q.p.pos.x - J.posicion.x, q.p.pos.z - J.posicion.z); if (d > 80) continue;
      for (const L of q.r.userData.lista) { L.b.rotation.x = L.rx + Math.sin(t * 1.3 + L.f) * 0.08 * viento; L.b.rotation.z = L.rz + Math.cos(t * 1.1 + L.f) * 0.08 * viento; }
    }
    const M = this.mio; if (!M) return;
    M.t += dt;
    const fx = Math.sin(J.yaw), fz = Math.cos(J.yaw), lx = fz, lz = -fx;
    if (!M.suelto && (J.coche || J.muerto || J.nadando || M.t > 150 || J.velocidad > 6.5)) { M.suelto = true; if (!J.muerto && M.t < 150) j.hud.notificar('alerta', '¡Se te fue el globo!', '', 2); }
    if (!M.suelto) {
      M.pos.set(J.pos.x - lx * 0.32 + fx * 0.1, J.y + 1.0, J.pos.z - lz * 0.32 + fz * 0.1);
      M.g.position.copy(M.pos);
      M.g.rotation.set(Math.sin(t * 1.7) * 0.12 - Math.min(0.5, J.velocidad * 0.06), J.yaw, Math.cos(t * 1.3) * 0.1);
    } else {
      M.vel.y = Math.min(2.2, M.vel.y + dt * 1.4); M.vel.x += Math.sin(t * 0.7) * dt * 0.6; M.vel.z += Math.cos(t * 0.5) * dt * 0.6;
      M.pos.addScaledVector(M.vel, dt); M.g.position.copy(M.pos); M.g.rotation.z = Math.sin(t * 2) * 0.2;
      if (M.pos.y > 90) { j.escena.remove(M.g); this.mio = null; }
    }
  }
}
