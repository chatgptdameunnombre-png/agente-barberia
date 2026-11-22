import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const COLS = ['#ff3d8b', '#ffd23a', '#3bd1ff', '#3bff8a', '#ff7a1a', '#b46bff'];

export class Feria {
  constructor(juego) {
    this.j = juego;
    const B = juego.ciudad.bloques.find(b => b.tipo === 'parque' && b.bx === 5 && b.bz === 4) || juego.ciudad.bloques.find(b => b.tipo === 'parque');
    if (!B) return;
    const x = B.cx - 13, z = B.cz + 11, R = 13, H = R + 2.5;
    this.centro = new THREE.Vector3(x, H, z);
    const acero = new THREE.MeshStandardMaterial({ color: '#e8e8ec', roughness: 0.35, metalness: 0.6 });
    const base = [];
    for (const s of [-1, 1]) for (const k of [-1, 1]) {
      const a = new THREE.Vector3(x + k * 5, 0.2, z + s * 1.6), b = new THREE.Vector3(x, H, z + s * 1.3), v = b.clone().sub(a);
      const g = new THREE.CylinderGeometry(0.22, 0.3, v.length(), 10); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize())); base.push(g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2));
    }
    base.push(new THREE.CylinderGeometry(0.35, 0.35, 3.0, 12).rotateX(Math.PI / 2).translate(x, H, z));
    base.push(new THREE.BoxGeometry(12, 0.3, 4.5).translate(x, 0.32, z));
    const mb = new THREE.Mesh(mergeGeometries(base.map(g => g.index ? g.toNonIndexed() : g)), acero); mb.castShadow = true; juego.escena.add(mb);
    for (const k of [-1, 1]) juego.mundo.agregar(x + k * 5 - 0.5, z - 2, x + k * 5 + 0.5, z + 2, 3);
    juego.mundo.agregar(x - 6, z - 2.3, x + 6, z - 1.6, 1);
    this.rueda = new THREE.Group(); this.rueda.position.copy(this.centro); juego.escena.add(this.rueda);
    const radios = [];
    for (const s of [-1.1, 1.1]) {
      radios.push(new THREE.TorusGeometry(R, 0.13, 6, 64).translate(0, 0, s));
      radios.push(new THREE.TorusGeometry(R * 0.55, 0.08, 6, 48).translate(0, 0, s));
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, g = new THREE.CylinderGeometry(0.06, 0.06, R, 5); g.translate(0, R / 2, 0); g.rotateZ(a); radios.push(g.translate(0, 0, s)); }
    }
    const mr = new THREE.Mesh(mergeGeometries(radios.map(g => g.index ? g.toNonIndexed() : g)), acero); mr.castShadow = true; this.rueda.add(mr);
    const focos = [];
    for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; for (const s of [-1.12, 1.12]) focos.push(new THREE.SphereGeometry(0.24, 6, 4).translate(Math.cos(a) * R, Math.sin(a) * R, s)); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let q = 1; q < 6; q++) focos.push(new THREE.SphereGeometry(0.17, 6, 4).translate(Math.cos(a) * R * q / 6, Math.sin(a) * R * q / 6, 1.12)); }
    const fg = mergeGeometries(focos.map(g => g.toNonIndexed()));
    const n = fg.attributes.position.count, col = new Float32Array(n * 3), fase = new Float32Array(n), c = new THREE.Color();
    for (let i = 0; i < n; i++) { const tri = Math.floor(i / 72); c.set(COLS[tri % COLS.length]); col.set([c.r, c.g, c.b], i * 3); fase[i] = tri % 6; }
    fg.setAttribute('color', new THREE.BufferAttribute(col, 3)); fg.setAttribute('fase', new THREE.BufferAttribute(fase, 1));
    this.tiempo = { value: 0 }; this.brillo = { value: 0 };
    const mf = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    mf.onBeforeCompile = sh => {
      sh.uniforms.tiempo = this.tiempo; sh.uniforms.brillo = this.brillo;
      sh.vertexShader = 'attribute float fase;\nvarying float vFase;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vFase = fase;');
      sh.fragmentShader = 'uniform float tiempo;\nuniform float brillo;\nvarying float vFase;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  float on = step(0.5, fract(tiempo * 0.9 + vFase / 6.0));\n  diffuseColor.rgb *= mix(0.55, 2.2 * (0.45 + 0.55 * on), brillo);');
    };
    this.rueda.add(new THREE.Mesh(fg, mf));
    this.canastas = [];
    const colores = ['#c8202e', '#2a62b8', '#f2c14e', '#3a8f5c', '#7a3ab0', '#ff7a1a'];
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2, g = new THREE.Group();
      const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.75, 1.1, 10), new THREE.MeshStandardMaterial({ color: colores[k % colores.length], roughness: 0.5, metalness: 0.2 })); cuerpo.position.y = -1.2; g.add(cuerpo);
      const techo = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.5, 10), new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.5 })); techo.position.y = -0.35; g.add(techo);
      const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), acero); palo.position.y = -0.1; g.add(palo);
      g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); this.rueda.add(g); this.canastas.push(g);
    }
  }

  actualizar(dt, noche) {
    if (!this.rueda) return;
    this.rueda.rotation.z += dt * 0.07;
    for (const g of this.canastas) g.rotation.z = -this.rueda.rotation.z;
    this.tiempo.value += dt; this.brillo.value = noche;
  }
}
