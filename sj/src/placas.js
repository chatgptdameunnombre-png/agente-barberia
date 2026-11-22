import * as THREE from 'three';
import { linea, BLOQUES, CALLE, LIMITE } from './ciudad.js?v=202611220542';
import { CALLES_X, CALLES_Z } from './gps.js?v=202611220542';

export function placasCalles(juego) {
  const nombres = [...CALLES_X, ...CALLES_Z], F = nombres.length, AL = 72;
  const c = document.createElement('canvas'); c.width = 512; c.height = F * AL; const g = c.getContext('2d');
  nombres.forEach((n, r) => {
    const y = r * AL;
    g.fillStyle = '#1d4f9c'; g.fillRect(0, y, 512, AL);
    g.strokeStyle = '#f4f2ec'; g.lineWidth = 5; g.strokeRect(6, y + 6, 500, AL - 12);
    g.fillStyle = '#ffffff'; g.font = `800 ${n.length > 18 ? 34 : 40}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(n.toUpperCase(), 256, y + AL / 2 + 2, 480);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(1.9, 0.27);
  const filas = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
  const placas = [], postes = [];
  const d = CALLE / 2 + 0.9;
  for (let i = 0; i <= BLOQUES; i++) for (let k = 0; k <= BLOQUES; k++) {
    const x = linea(i) + d, z = linea(k) + d;
    if (Math.abs(x) > LIMITE - 1 || Math.abs(z) > LIMITE - 1) continue;
    postes.push([x, z]);
    juego.mundo.agregar(x - 0.07, z - 0.07, x + 0.07, z + 0.07, 3.3);
    for (const lado of [0, Math.PI]) {
      placas.push({ x: x + 0.95 * 0, y: 3.32, z: z, ry: lado, fila: F - 1 - (CALLES_X.length + k), dx: 0.95 });
      placas.push({ x, y: 3.04, z, ry: Math.PI / 2 + lado, fila: F - 1 - i, dz: 0.95 });
    }
  }
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.2 }), placas.length);
  const fila = new Float32Array(placas.length);
  placas.forEach((p, n) => {
    const desp = p.dx ? new THREE.Vector3(p.dx, 0, 0) : new THREE.Vector3(0, 0, p.dz);
    V.set(p.x + desp.x, p.y, p.z + desp.z);
    Q.setFromAxisAngle(Y, p.ry);
    const off = new THREE.Vector3(0, 0, 0.012).applyQuaternion(Q); V.add(off);
    M.compose(V, Q, S); im.setMatrixAt(n, M); fila[n] = p.fila;
  });
  im.geometry = geo.clone(); im.geometry.setAttribute('fila', new THREE.InstancedBufferAttribute(fila, 1));
  im.material.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute float fila;\n' + sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>\n  vMapUv = vec2(vMapUv.x, (fila + vMapUv.y) / ${F.toFixed(1)});`);
  };
  im.castShadow = false; im.receiveShadow = true;
  juego.escena.add(im);
  const imP = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.06, 3.5, 8).translate(0, 1.75, 0), new THREE.MeshStandardMaterial({ color: '#4a4f57', roughness: 0.5, metalness: 0.6 }), postes.length);
  postes.forEach(([x, z], n) => { V.set(x, 0, z); Q.identity(); M.compose(V, Q, S); imP.setMatrixAt(n, M); });
  imP.castShadow = true; juego.escena.add(imP);
  const brazos = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.05, 0.05), imP.material, postes.length * 2);
  let b = 0;
  postes.forEach(([x, z]) => {
    V.set(x + 0.95, 3.48, z); Q.identity(); M.compose(V, Q, S); brazos.setMatrixAt(b++, M);
    V.set(x, 3.2, z + 0.95); Q.setFromAxisAngle(Y, Math.PI / 2); M.compose(V, Q, S); brazos.setMatrixAt(b++, M);
  });
  juego.escena.add(brazos);
  return { placas: placas.length, postes: postes.length };
}
