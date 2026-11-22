import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _o = new THREE.Object3D();

export class Pajaros {
  constructor(juego) {
    this.j = juego;
    const P = juego.mobiliario?.postesLista || [];
    const lugares = [];
    const clave = q => `${q.eje}|${q.i}`;
    const grupos = new Map();
    for (const q of P) { const k = clave(q); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(q); }
    let s = 777; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (const lista of grupos.values()) {
      lista.sort((a, b) => (a.eje === 'x' ? a.x - b.x : a.z - b.z));
      for (let k = 0; k < lista.length - 1; k++) {
        const A = lista[k], B = lista[k + 1], d = Math.hypot(B.x - A.x, B.z - A.z);
        if (d > 30 || r() > 0.45) continue;
        const sag = d * 0.02 + 0.15, n = 2 + (r() * 5 | 0), off = [-0.72, 0, 0.72][r() * 3 | 0];
        const ox = A.eje === 'x' ? 0 : off, oz = A.eje === 'x' ? off : 0;
        for (let m = 0; m < n; m++) {
          const u = 0.15 + r() * 0.7;
          lugares.push({ x: A.x + (B.x - A.x) * u + ox, y: 7.86 - sag * 4 * u * (1 - u) + 0.05, z: A.z + (B.z - A.z) * u + oz, yaw: Math.atan2(B.x - A.x, B.z - A.z) + Math.PI / 2 + (r() < 0.5 ? Math.PI : 0) });
        }
      }
    }
    this.lista = lugares.slice(0, 260).map(L => ({ ...L, fase: Math.random() * 6, vuela: 0, vx: 0, vy: 0, vz: 0, px: L.x, py: L.y, pz: L.z, fuera: 0 }));
    const cuerpo = new THREE.SphereGeometry(0.07, 7, 5).scale(0.8, 0.85, 1.35);
    const cabeza = new THREE.SphereGeometry(0.045, 6, 5).translate(0, 0.05, 0.08);
    const cola = new THREE.BoxGeometry(0.05, 0.012, 0.1).translate(0, -0.01, -0.12);
    const geo = mergeGeometries([cuerpo, cabeza, cola].map(g => g.index ? g.toNonIndexed() : g));
    this.malla = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#2a2622' }), this.lista.length);
    this.malla.frustumCulled = false;
    juego.escena.add(this.malla);
    this.susto = null; this.t = 0;
    this.lista.forEach((b, i) => this.poner(b, i));
    this.malla.instanceMatrix.needsUpdate = true;
  }

  poner(b, i) {
    _o.position.set(b.px, b.py, b.pz); _o.rotation.set(0, b.yaw, 0); _o.scale.setScalar(b.fuera > 0 ? 0.0001 : 1); _o.updateMatrix(); this.malla.setMatrixAt(i, _o.matrix);
  }

  asustar(x, z, r = 25) { this.susto = { x, z, r }; }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion, t = performance.now() / 1000;
    let cambio = false;
    const coche = j.jugador.coche, rapido = coche && coche.vel > 12;
    this.lista.forEach((b, i) => {
      const dx = b.x - jp.x, dz = b.z - jp.z, d = Math.hypot(dx, dz);
      if (d > 90 && !b.vuela && !b.fuera) return;
      if (!b.vuela && !b.fuera) {
        const s = this.susto, asust = (s && Math.hypot(b.x - s.x, b.z - s.z) < s.r) || d < (rapido ? 12 : 5.5);
        if (asust) { b.vuela = 3.2; const a = Math.atan2(dx, dz) + (Math.random() - 0.5) * 1.6; b.vx = Math.sin(a) * (4 + Math.random() * 3); b.vz = Math.cos(a) * (4 + Math.random() * 3); b.vy = 3 + Math.random() * 2; b.yaw = Math.atan2(b.vx, b.vz); }
        else if (d < 60) { const bob = Math.sin(t * 3 + b.fase) > 0.96 ? 0.02 : 0; if (bob) { _o.position.set(b.px, b.py + bob, b.pz); _o.rotation.set(0.25, b.yaw + Math.sin(t + b.fase) * 0.3, 0); _o.scale.setScalar(1); _o.updateMatrix(); this.malla.setMatrixAt(i, _o.matrix); cambio = true; } }
        return;
      }
      if (b.vuela > 0) {
        b.vuela -= dt; b.vy += dt * 1.5; b.px += b.vx * dt; b.py += b.vy * dt; b.pz += b.vz * dt;
        _o.position.set(b.px, b.py, b.pz); _o.rotation.set(-0.3, b.yaw, Math.sin(t * 30 + b.fase) * 0.6); _o.scale.setScalar(1); _o.updateMatrix(); this.malla.setMatrixAt(i, _o.matrix); cambio = true;
        if (b.vuela <= 0) { b.fuera = 25 + Math.random() * 30; this.poner(b, i); }
        return;
      }
      if (b.fuera > 0) { b.fuera -= dt; if (b.fuera <= 0 && d > 30) { b.px = b.x; b.py = b.y; b.pz = b.z; b.fuera = 0; this.poner(b, i); cambio = true; } else if (b.fuera <= 0) b.fuera = 5; }
    });
    this.susto = null;
    if (cambio) this.malla.instanceMatrix.needsUpdate = true;
  }
}
