import * as THREE from 'three';
import { LIMITE } from './ciudad.js?v=202611220440';

function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

export function afueras(juego) {
  const r = rng(9090), escena = juego.escena;
  const arboles = [], bodegas = [], postes = [];
  const fuera = (x, z, m) => Math.abs(x) > LIMITE + m || Math.abs(z) > LIMITE + m;
  for (let k = 0; k < 900; k++) {
    const a = r() * Math.PI * 2, d = LIMITE + 25 + Math.pow(r(), 0.7) * 380, x = Math.cos(a) * d * 1.05, z = Math.sin(a) * d * 1.05;
    if (!fuera(x, z, 18)) continue;
    arboles.push([x, z, 0.8 + r() * 1.1, r() < 0.3]);
  }
  for (let k = 0; k < 110; k++) {
    const lado = k % 4, t = (r() - 0.5) * 2 * (LIMITE + 60), o = LIMITE + 40 + r() * 140;
    const x = lado === 0 ? t : lado === 1 ? o : lado === 2 ? t : -o, z = lado === 0 ? o : lado === 1 ? t : lado === 2 ? -o : t;
    bodegas.push([x, z, 14 + r() * 26, 10 + r() * 18, 5 + r() * 6, lado % 2 ? Math.PI / 2 : 0]);
  }
  for (let k = -12; k <= 12; k++) for (const s of [-1, 1]) { postes.push([k * 30, s * (LIMITE + 14)]); postes.push([s * (LIMITE + 14), k * 30]); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
  const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 3, 6).translate(0, 1.5, 0), new THREE.MeshLambertMaterial({ color: '#5a3e28' }), arboles.length);
  const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2, 1), new THREE.MeshLambertMaterial({ color: '#ffffff' }), arboles.length);
  arboles.forEach(([x, z, s, jac], i) => {
    V.set(x, 0, z); Q.setFromAxisAngle(Y, r() * 6); S.setScalar(s); M.compose(V, Q, S); tronco.setMatrixAt(i, M);
    V.set(x, 3.2 * s + 1.4, z); S.set(s * (0.9 + r() * 0.3), s * (0.75 + r() * 0.3), s * (0.9 + r() * 0.3)); M.compose(V, Q, S); copa.setMatrixAt(i, M);
    copa.setColorAt(i, c.set(jac ? ['#8a5ac8', '#7a4ab8'][i % 2] : ['#4f7a3a', '#5a8a42', '#3f6a32', '#6a8a3a'][i % 4]).multiplyScalar(0.85 + r() * 0.2));
  });
  copa.instanceColor.needsUpdate = true; tronco.castShadow = copa.castShadow = false;
  escena.add(tronco, copa);
  const texB = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#c9c3b8'; g.fillRect(0, 0, 256, 128); for (let x = 0; x < 256; x += 10) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, 0, 3, 128); } g.fillStyle = '#5a5e66'; g.fillRect(40, 60, 70, 68); g.fillRect(150, 60, 70, 68); g.fillStyle = 'rgba(60,50,40,0.3)'; g.fillRect(0, 108, 256, 20); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const bod = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ map: texB }), bodegas.length);
  const techo = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#8a9098' }), bodegas.length);
  bodegas.forEach(([x, z, w, d, h, ry], i) => {
    Q.setFromAxisAngle(Y, ry); V.set(x, 0, z); S.set(w, h, d); M.compose(V, Q, S); bod.setMatrixAt(i, M);
    V.set(x, h, z); S.set(w, 2.6, d); M.compose(V, Q, S); techo.setMatrixAt(i, M);
    bod.setColorAt(i, c.set(['#e8e2d8', '#d8cfc0', '#c9d0d8', '#e0d0c0'][i % 4]));
  });
  bod.instanceColor.needsUpdate = true; escena.add(bod, techo);
  const poste = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 9, 6).translate(0, 4.5, 0), new THREE.MeshLambertMaterial({ color: '#7a6a58' }), postes.length);
  postes.forEach(([x, z], i) => { M.makeTranslation(x, 0, z); poste.setMatrixAt(i, M); });
  escena.add(poste);
  return { arboles: arboles.length, bodegas: bodegas.length };
}
