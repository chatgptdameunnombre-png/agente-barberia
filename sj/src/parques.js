import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BANQUETA, VIENTO } from './ciudad.js?v=202611220053';

const _c = new THREE.Color();
function teñir(geo, hex) { _c.set(hex); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
const caja = (w, h, d, x, y, z, col) => teñir(new THREE.BoxGeometry(w, h, d).translate(x, y, z), col);
const tubo = (a, b, r, col) => { const v = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r, r, v.length(), 8); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize())); return teñir(g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), col); };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function texAndador() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#c9c2b4'; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '90,84,74' : '240,236,226'},${Math.random() * 0.12})`; g.fillRect(Math.random() * 128, Math.random() * 512, 2, 2); }
  g.fillStyle = 'rgba(80,74,64,0.35)'; for (let y = 0; y < 512; y += 64) g.fillRect(0, y, 128, 3);
  g.fillStyle = '#9a9488'; g.fillRect(0, 0, 8, 512); g.fillRect(120, 0, 8, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

export function decorarParques(juego) {
  const bloques = juego.ciudad.bloques.filter(b => b.tipo === 'parque'), escena = juego.escena, mundo = juego.mundo;
  if (!bloques.length) return null;
  const matA = new THREE.MeshStandardMaterial({ map: texAndador(), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 });
  const andadores = [], piezas = [], arena = [], columpios = [];
  for (const b of bloques) {
    const ix0 = b.x0 + BANQUETA, ix1 = b.x1 - BANQUETA, iz0 = b.z0 + BANQUETA, iz1 = b.z1 - BANQUETA, cx = b.cx, cz = b.cz;
    for (const [ax, az, bx2, bz2] of [[ix0, iz0, ix1, iz1], [ix1, iz0, ix0, iz1], [cx, iz0, cx, iz1]]) {
      const L = Math.hypot(bx2 - ax, bz2 - az), g = new THREE.PlaneGeometry(2.4, L).rotateX(-Math.PI / 2);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * L / 9);
      g.rotateY(Math.atan2(bx2 - ax, bz2 - az)).translate((ax + bx2) / 2, 0.185, (az + bz2) / 2);
      andadores.push(g);
    }
    const px = cx + 13, pz = cz - 13;
    arena.push(new THREE.CircleGeometry(7.5, 32).rotateX(-Math.PI / 2).translate(px, 0.19, pz));
    piezas.push(teñir(new THREE.TorusGeometry(7.5, 0.18, 6, 40).rotateX(Math.PI / 2).translate(px, 0.22, pz), '#c8202e'));
    const sx = px - 2.5, sz = pz + 2;
    for (const dz of [-1.6, 1.6]) {
      piezas.push(tubo(V3(sx - 1.1, 0.18, sz + dz), V3(sx, 2.6, sz + dz), 0.06, '#2a62b8'), tubo(V3(sx + 1.1, 0.18, sz + dz), V3(sx, 2.6, sz + dz), 0.06, '#2a62b8'));
      mundo.agregar(sx - 1.2, sz + dz - 0.1, sx - 0.9, sz + dz + 0.1, 2.4); mundo.agregar(sx + 0.9, sz + dz - 0.1, sx + 1.2, sz + dz + 0.1, 2.4);
    }
    piezas.push(tubo(V3(sx, 2.6, sz - 1.7), V3(sx, 2.6, sz + 1.7), 0.07, '#2a62b8'));
    for (const dz of [-0.75, 0.75]) columpios.push({ x: sx, z: sz + dz, f: Math.random() * 6 });
    const rx = px + 3, rz = pz - 1.5;
    piezas.push(caja(1.4, 0.12, 1.2, rx, 2.0, rz, '#f2c14e'));
    for (const [ox, oz] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) piezas.push(tubo(V3(rx + ox, 0.18, rz + oz), V3(rx + ox, 2.6, rz + oz), 0.05, '#3a8f5c'));
    for (let k = 0; k < 6; k++) piezas.push(tubo(V3(rx - 0.55, 0.3 + k * 0.32, rz - 1.0 - k * 0.02), V3(rx + 0.55, 0.3 + k * 0.32, rz - 1.0 - k * 0.02), 0.03, '#d8d8d8'));
    for (const ox of [-0.55, 0.55]) piezas.push(tubo(V3(rx + ox, 0.18, rz - 1.1), V3(rx + ox, 2.1, rz - 0.6), 0.04, '#d8d8d8'));
    const tob = new THREE.BoxGeometry(1.0, 0.08, 4.2); tob.rotateX(-0.46); piezas.push(teñir(tob.translate(rx, 1.05, rz + 2.5), '#c8202e'));
    for (const ox of [-0.52, 0.52]) { const ld = new THREE.BoxGeometry(0.06, 0.3, 4.2); ld.rotateX(-0.46); piezas.push(teñir(ld.translate(rx + ox, 1.2, rz + 2.5), '#c8202e')); }
    mundo.agregar(rx - 0.7, rz - 1.2, rx + 0.7, rz + 0.7, 2.2);
    const bx = px - 1, bz = pz - 4.5;
    piezas.push(caja(0.3, 0.5, 0.3, bx, 0.43, bz, '#7a3ab0'));
    const tabla = new THREE.BoxGeometry(3.4, 0.08, 0.3); tabla.rotateZ(0.18); piezas.push(teñir(tabla.translate(bx, 0.72, bz), '#f2c14e'));
    for (const s of [-1, 1]) piezas.push(tubo(V3(bx + s * 1.45, 0.98 - s * 0.26, bz - 0.2), V3(bx + s * 1.45, 0.98 - s * 0.26, bz + 0.2), 0.03, '#2a2c30'));
    mundo.agregar(bx - 0.2, bz - 0.2, bx + 0.2, bz + 0.2, 0.7);
  }
  const mA = new THREE.Mesh(mergeGeometries(andadores), matA); mA.receiveShadow = true; escena.add(mA);
  const mAr = new THREE.Mesh(mergeGeometries(arena), new THREE.MeshStandardMaterial({ color: '#d9c49a', roughness: 1, polygonOffset: true, polygonOffsetFactor: -3 })); mAr.receiveShadow = true; escena.add(mAr);
  const mP = new THREE.Mesh(mergeGeometries(piezas.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.35 })); mP.castShadow = mP.receiveShadow = true; escena.add(mP);
  const geoC = mergeGeometries([new THREE.BoxGeometry(0.55, 0.05, 0.22).translate(0, -2.0, 0), new THREE.CylinderGeometry(0.012, 0.012, 2.0, 4).translate(-0.24, -1.0, 0), new THREE.CylinderGeometry(0.012, 0.012, 2.0, 4).translate(0.24, -1.0, 0)].map(g => g.toNonIndexed()));
  const matC = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.6, metalness: 0.5 });
  matC.onBeforeCompile = sh => { sh.uniforms.tiempo = VIENTO; sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float an = sin(tiempo * 1.7 + float(gl_InstanceID) * 2.1) * 0.12;\n  transformed = vec3(transformed.x, transformed.y * cos(an) - transformed.z * sin(an), transformed.y * sin(an) + transformed.z * cos(an));'); };
  const imC = new THREE.InstancedMesh(geoC, matC, columpios.length);
  const M = new THREE.Matrix4();
  columpios.forEach((c, i) => { M.makeRotationY(Math.PI / 2).setPosition(c.x, 2.6, c.z); imC.setMatrixAt(i, M); });
  imC.castShadow = true; escena.add(imC);
  return { parques: bloques.length };
}
