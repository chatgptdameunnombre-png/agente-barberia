import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _c = new THREE.Color();
function teñir(g, hex) { _c.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }

function ala(largo, cuerda, grosor, flecha) {
  const g = new THREE.BoxGeometry(largo, grosor, cuerda, 6, 1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), f = Math.abs(x) / (largo / 2); p.setZ(i, p.getZ(i) * (1 - f * 0.62) - f * flecha); }
  g.computeVertexNormals(); return g;
}

function modeloAvion() {
  const partes = [];
  const fus = new THREE.CapsuleGeometry(1.95, 30, 6, 16).rotateX(Math.PI / 2);
  { const p = fus.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); if (z < -12) { const k = (-12 - z) / 5; p.setY(i, p.getY(i) * (1 - k * 0.35) + k * 0.9); } } fus.computeVertexNormals(); }
  partes.push(teñir(fus, '#f2f3f5'));
  partes.push(teñir(new THREE.BoxGeometry(0.06, 0.5, 26).translate(1.94, 0.6, 1), '#2b2f3a'), teñir(new THREE.BoxGeometry(0.06, 0.5, 26).translate(-1.94, 0.6, 1), '#2b2f3a'));
  partes.push(teñir(new THREE.BoxGeometry(3.6, 0.6, 30).translate(0, -1.45, 0), '#c8ccd2'));
  partes.push(teñir(ala(36, 6.5, 0.45, 5.5).translate(0, -0.8, 1.2), '#e4e6ea'));
  partes.push(teñir(ala(12.5, 3.2, 0.3, 2.4).translate(0, 1.1, -15.2), '#e4e6ea'));
  const cola = new THREE.BoxGeometry(0.4, 7, 4.6, 1, 4, 1); { const p = cola.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 3.5, f = y / 7; p.setZ(i, p.getZ(i) * (1 - f * 0.45) - f * 3.6); } cola.computeVertexNormals(); }
  partes.push(teñir(cola.translate(0, 4.6, -14), '#5b2a86'));
  for (const s of [-1, 1]) {
    partes.push(teñir(new THREE.CylinderGeometry(1.15, 1.0, 4.6, 14).rotateX(Math.PI / 2).translate(s * 6.2, -2.2, 3.8), '#d9dce0'));
    partes.push(teñir(new THREE.CylinderGeometry(0.92, 0.92, 0.2, 14).rotateX(Math.PI / 2).translate(s * 6.2, -2.2, 6.15), '#2a2c30'));
  }
  partes.push(teñir(new THREE.BoxGeometry(4.2, 0.08, 2.2).translate(0, 0.9, 16.2), '#1a1d24'));
  return mergeGeometries(partes.map(g => g.index ? g.toNonIndexed() : g));
}

export class Aviones {
  constructor(juego) {
    this.j = juego;
    this.grupo = new THREE.Group();
    this.avion = new THREE.Mesh(modeloAvion(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.3 }));
    this.grupo.add(this.avion);
    this.luces = [];
    for (const [x, y, z, col] of [[-18, -0.8, -4.3, '#ff3020'], [18, -0.8, -4.3, '#30ff60'], [0, 8.2, -17.6, '#ffffff'], [0, -2, 0, '#ff3020']]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, toneMapped: false, fog: false }));
      l.position.set(x, y, z); this.grupo.add(l); this.luces.push(l);
    }
    this.grupo.visible = false;
    juego.escena.add(this.grupo);
    this.espera = 12; this.t = 0; this.ruido = 0;
  }

  nuevo() {
    const a = Math.random() * Math.PI * 2, R = 1700, lat = (Math.random() - 0.5) * 900;
    const dx = Math.cos(a), dz = Math.sin(a);
    this.desde = new THREE.Vector3(-dx * R - dz * lat, 300 + Math.random() * 160, -dz * R + dx * lat);
    this.dir = new THREE.Vector3(dx, (Math.random() - 0.4) * 0.03, dz).normalize();
    this.vel = 95 + Math.random() * 30;
    this.recorrido = 0; this.largo = R * 2;
    this.grupo.position.copy(this.desde);
    this.grupo.lookAt(this.desde.clone().add(this.dir));
    this.grupo.rotateZ((Math.random() - 0.5) * 0.08);
    this.grupo.visible = true;
  }

  actualizar(dt, noche) {
    if (!this.grupo.visible) { this.espera -= dt; if (this.espera <= 0) this.nuevo(); return; }
    this.t += dt;
    this.recorrido += this.vel * dt;
    this.grupo.position.copy(this.desde).addScaledVector(this.dir, this.recorrido);
    const parp = (this.t % 1.2) < 0.08 ? 1 : 0;
    const k = Math.max(0.25, noche);
    this.luces[0].material.opacity = this.luces[1].material.opacity = k;
    this.luces[2].material.opacity = parp * k * 1.2;
    this.luces[3].material.opacity = ((this.t + 0.6) % 1.5) < 0.1 ? k : 0;
    const s = 1 + noche * 5; for (const l of this.luces) l.scale.setScalar(s);
    const jp = this.j.jugador.posicion, d = this.grupo.position.distanceTo(jp);
    this.ruido -= dt;
    if (this.ruido <= 0 && d < 1100) { this.ruido = 0.4; this.j.audio?.ruidoCorto(0.9, 140, 0.05 * (1 - d / 1100) ** 2, 'lowpass'); }
    if (this.recorrido > this.largo) { this.grupo.visible = false; this.espera = 35 + Math.random() * 70; }
  }
}
