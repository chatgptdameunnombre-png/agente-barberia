import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tipoBloque, BLOQUES } from './ciudad.js?v=202611220022';

function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const _c = new THREE.Color();
function teñir(geo, hex) { _c.set(hex); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
function lienzo(w, h, pintar) { const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export function basuraYCasetas(juego) {
  const C = juego.ciudad, r = rng(5150), mundo = juego.mundo, escena = juego.escena;
  const extra = C.objetosExtra || (C.objetosExtra = []);
  const BOLSAS = ['#1a1a1c', '#1a1a1c', '#1a1a1c', '#e8e8e4', '#2f5a3a', '#8a8f96'];
  const casetas = [], kioscos = [];
  let nb = 0;
  for (const e of C.edificios || []) {
    const [fx, fz] = e.frente;
    const ancho = fx === 0 ? e.w : e.fondo, cx = e.x + fx * e.fondo / 2, cz = e.z + fz * e.fondo / 2, rot = Math.atan2(fx, fz);
    const tipo = tipoBloque(Math.floor(e.x / 80 + BLOQUES / 2), Math.floor(e.z / 80 + BLOQUES / 2));
    const lat = (o) => [cx + (fz !== 0 ? o : 0), cz + (fx !== 0 ? o : 0)];
    if (e.estilo === 'casa' && r() < 0.2 && nb < 140) {
      const [bx, bz] = lat((r() - 0.5) * (ancho - 2));
      const n = 2 + (r() * 4 | 0);
      for (let k = 0; k < n; k++) { extra.push(['bolsa', bx + fx * (0.45 + r() * 0.5) + (fz !== 0 ? (r() - 0.5) * 1.4 : 0), bz + fz * (0.45 + r() * 0.5) + (fx !== 0 ? (r() - 0.5) * 1.4 : 0), r() * 6, k > 2 ? 0.45 : 0, BOLSAS[r() * BOLSAS.length | 0]]); nb++; }
    }
    if (e.estilo === 'casa' && ancho > 6 && r() < (tipo === 'centro' ? 0.1 : 0.05) && casetas.length < 26) {
      const [x, z] = lat((r() < 0.5 ? -1 : 1) * (ancho / 2 - 0.8));
      casetas.push({ x: x + fx * 0.32, z: z + fz * 0.32, rot });
    }
    if (tipo === 'centro' && ancho > 7 && r() < 0.08 && kioscos.length < 7) {
      const [x, z] = lat((r() - 0.5) * (ancho - 4));
      kioscos.push({ x: x + fx * 1.6, z: z + fz * 1.6, rot });
    }
  }

  const piezas = [];
  const colocar = (g, x, z, rot) => g.rotateY(rot).translate(x, 0, z);
  for (const c of casetas) {
    const g = [];
    g.push(teñir(new THREE.BoxGeometry(0.85, 0.95, 0.45).translate(0, 1.55, 0.22), '#2a62b8'));
    g.push(teñir(new THREE.BoxGeometry(0.95, 0.08, 0.55).translate(0, 2.05, 0.25), '#f2f2ee'));
    g.push(teñir(new THREE.BoxGeometry(0.34, 0.5, 0.12).translate(0, 1.5, 0.48), '#c9ced4'));
    g.push(teñir(new THREE.BoxGeometry(0.08, 0.25, 0.08).translate(0.12, 1.55, 0.56), '#1a1a1c'));
    g.push(teñir(new THREE.BoxGeometry(0.1, 1.1, 0.1).translate(0, 0.55, 0.22), '#6a6f77'));
    for (const q of g) piezas.push(colocar(q, c.x, c.z, c.rot));
    mundo.agregar(c.x - 0.3, c.z - 0.3, c.x + 0.3, c.z + 0.3, 2);
  }
  for (const k of kioscos) {
    const g = [];
    g.push(teñir(new THREE.BoxGeometry(1.7, 1.9, 1.1).translate(0, 0.95, 0), '#2f6b4f'));
    g.push(teñir(new THREE.BoxGeometry(2.1, 0.1, 1.6).translate(0, 2.05, 0.15), '#2f6b4f'));
    g.push(teñir(new THREE.BoxGeometry(1.5, 0.8, 0.06).translate(0, 1.2, 0.58), '#f2efe4'));
    for (const q of g) piezas.push(colocar(q, k.x, k.z, k.rot));
    mundo.agregar(k.x - 1, k.z - 1, k.x + 1, k.z + 1, 2.1);
  }
  if (piezas.length) { const m = new THREE.Mesh(mergeGeometries(piezas.map(g => g.toNonIndexed())), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.2 })); m.castShadow = m.receiveShadow = true; escena.add(m); }
  if (kioscos.length) {
    const tex = lienzo(512, 256, (g, w, h) => {
      g.fillStyle = '#f2efe4'; g.fillRect(0, 0, w, h);
      const cols = ['#c8202e', '#2a62b8', '#f2c14e', '#3a8f5c', '#7a3ab0', '#ff7a1a', '#1a1a1c'];
      for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) {
        const x = 8 + k * 72, y = 8 + row * 82;
        g.fillStyle = cols[(k + row * 3) % cols.length]; g.fillRect(x, y, 64, 74);
        g.fillStyle = '#ffffff'; g.fillRect(x + 6, y + 6, 52, 12); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 8, y + 26, 30, 36);
        g.fillStyle = '#111'; g.font = '700 9px Arial'; g.fillText(['EL TAPATÍO', 'DEPORTES', 'CHISME', 'LA JACA', 'NOTAS', 'GOL', 'HOY'][(k + row) % 7], x + 9, y + 15);
      }
    });
    const geo = new THREE.PlaneGeometry(1.46, 0.76);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }), kioscos.length);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
    kioscos.forEach((k, i) => { Q.setFromAxisAngle(Y, k.rot); V.set(0, 1.2, 0.615).applyQuaternion(Q).add(new THREE.Vector3(k.x, 0, k.z)); M.compose(V, Q, S); im.setMatrixAt(i, M); });
    escena.add(im);
  }
  return { bolsas: nb, casetas: casetas.length, kioscos: kioscos.length };
}
