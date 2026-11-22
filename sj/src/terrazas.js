import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tipoBloque, BLOQUES } from './ciudad.js?v=202611220159';

function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const _c = new THREE.Color();
function teñir(geo, hex) { _c.set(hex); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
const SOMBRILLAS = ['#c8202e', '#f2f0ea', '#2a5aa0', '#3a8f5c', '#e2b64a', '#7a3ab0'];

export function terrazas(juego) {
  const C = juego.ciudad, r = rng(888), piezas = [], mundo = juego.mundo;
  let mesas = 0;
  for (const e of C.edificios || []) {
    if (e.estilo !== 'casa') continue;
    const tipo = tipoBloque(Math.floor(e.x / 80 + BLOQUES / 2), Math.floor(e.z / 80 + BLOQUES / 2));
    if (!['centro', 'plaza', 'catedral', 'mercado'].includes(tipo) && !(tipo === 'barrio' && r() < 0.25)) continue;
    const [fx, fz] = e.frente, ancho = fx === 0 ? e.w : e.fondo;
    if (ancho < 8 || r() > 0.3 || mesas > 70) continue;
    const cx = e.x + fx * e.fondo / 2, cz = e.z + fz * e.fondo / 2, n = ancho > 12 ? 3 : 2, col = SOMBRILLAS[r() * SOMBRILLAS.length | 0];
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * 3.1, x = cx + fx * 0.82 + (fz !== 0 ? off : 0), z = cz + fz * 0.82 + (fx !== 0 ? off : 0);
      piezas.push(teñir(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16).translate(x, 0.9, z), '#f2efe6'), teñir(new THREE.CylinderGeometry(0.04, 0.05, 0.75, 6).translate(x, 0.52, z), '#3a3d44'), teñir(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 10).translate(x, 0.16, z), '#3a3d44'));
      piezas.push(teñir(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 6).translate(x, 1.3, z), '#d8d8d8'), teñir(new THREE.ConeGeometry(1.3, 0.45, 8, 1, true).translate(x, 2.42, z), col));
      mundo.agregar(x - 0.22, z - 0.22, x + 0.22, z + 0.22, 0.95);
      for (const s of [-1, 1]) {
        const sx = x + (fz !== 0 ? s * 0.72 : 0), sz = z + (fx !== 0 ? s * 0.72 : 0), yaw = Math.atan2(x - sx, z - sz);
        const silla = [new THREE.BoxGeometry(0.42, 0.05, 0.42).translate(0, 0.47, 0), new THREE.BoxGeometry(0.42, 0.45, 0.05).translate(0, 0.72, -0.2)];
        for (const [px, pz] of [[0.18, 0.18], [-0.18, 0.18], [0.18, -0.18], [-0.18, -0.18]]) silla.push(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 5).translate(px, 0.23, pz));
        for (const g of silla) piezas.push(teñir(g.rotateY(yaw + Math.PI).translate(sx, 0.15, sz), '#5a3a22'));
        C.bancas?.push({ x: sx, z: sz, yaw, ocupante: null, pie: false, terraza: true });
      }
      mesas++;
    }
  }
  if (piezas.length) { const m = new THREE.Mesh(mergeGeometries(piezas.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide })); m.castShadow = m.receiveShadow = true; juego.escena.add(m); }
  return { mesas };
}
