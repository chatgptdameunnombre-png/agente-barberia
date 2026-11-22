import * as THREE from 'three';
import { linea, CALLE, BANQUETA, VIENTO } from './ciudad.js?v=202611220307';

function texPapel() {
  const W = 128, H = 160, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H - 18);
  for (let x = 0; x < W; x += 16) { g.beginPath(); g.moveTo(x, H - 18); g.lineTo(x + 8, H - 2); g.lineTo(x + 16, H - 18); g.fill(); }
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.arc(W / 2, 62, 20, 0, 7); g.fill();
  g.fillStyle = '#000';
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.ellipse(W / 2 + Math.cos(a) * 36, 62 + Math.sin(a) * 36, 9, 4, a, 0, 7); g.fill(); }
  for (const [x, y] of [[18, 20], [W - 18, 20], [18, 108], [W - 18, 108]]) { g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 7, y); g.lineTo(x, y + 9); g.lineTo(x - 7, y); g.fill(); }
  for (let x = 10; x < W; x += 14) g.fillRect(x, 132, 7, 5);
  g.fillRect(W / 2 - 3, 4, 6, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

const COLORES = ['#ff3d8b', '#7a3ab0', '#ffd23a', '#2fbf71', '#ff7a1a', '#2a9df4', '#e8202e', '#ffffff'];

export function papelPicado(juego) {
  const filas = [];
  const media = CALLE / 2 + BANQUETA - 0.3;
  const calles = [];
  for (const i of [3, 4, 5]) for (const k of [3, 4]) {
    calles.push({ eje: 'x', fijo: linea(i), a: linea(k) + CALLE / 2 + 4, b: linea(k + 1) - CALLE / 2 - 4 });
    if (i !== 3) calles.push({ eje: 'z', fijo: linea(i), a: linea(k) + CALLE / 2 + 4, b: linea(k + 1) - CALLE / 2 - 4 });
  }
  for (const c of calles) for (let u = c.a; u <= c.b; u += 6.5) filas.push({ ...c, u, alto: 6.6 + Math.random() * 0.8 });
  const N = 15, total = filas.length * N;
  const geo = new THREE.PlaneGeometry(0.42, 0.52, 1, 3).translate(0, -0.26, 0);
  const mat = new THREE.MeshLambertMaterial({ map: texPapel(), alphaTest: 0.5, side: THREE.DoubleSide, transparent: false });
  mat.onBeforeCompile = sh => {
    sh.uniforms.tiempo = VIENTO;
    sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vec3 base = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float k = clamp(-position.y / 0.52, 0.0, 1.0);
  float fase = base.x * 0.7 + base.z * 0.9;
  transformed.z += sin(tiempo * 4.2 + fase) * 0.16 * k + sin(tiempo * 9.0 + fase * 2.3) * 0.03 * k;
  transformed.y += cos(tiempo * 4.2 + fase) * 0.02 * k;`);
  };
  const im = new THREE.InstancedMesh(geo, mat, total);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  const hilos = [], focos = [];
  let n = 0;
  for (const f of filas) {
    const rot = f.eje === 'x' ? Math.PI / 2 : 0;
    const p0 = f.eje === 'x' ? [f.u, f.fijo - media] : [f.fijo - media, f.u], p1 = f.eje === 'x' ? [f.u, f.fijo + media] : [f.fijo + media, f.u];
    const caida = 0.9;
    const punto = t => [p0[0] + (p1[0] - p0[0]) * t, f.alto - 4 * caida * t * (1 - t), p0[1] + (p1[1] - p0[1]) * t];
    for (let s = 0; s < 12; s++) { const a = punto(s / 12), b = punto((s + 1) / 12); hilos.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
    for (let q = 1; q < 9; q++) { const [x, y, z] = punto(q / 9); focos.push(x, y - 0.06, z); }
    const desfase = (Math.random() * COLORES.length) | 0;
    for (let q = 0; q < N; q++) {
      const t = (q + 0.5) / N, [x, y, z] = punto(t);
      V.set(x, y, z); Q.setFromAxisAngle(Y, rot); M.compose(V, Q, S); im.setMatrixAt(n, M);
      im.setColorAt(n, col.set(COLORES[(q + desfase) % COLORES.length])); n++;
    }
  }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  juego.escena.add(im);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(hilos, 3));
  const lineas = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#e8e2d6' }));
  juego.escena.add(lineas);
  const imF = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd38a', toneMapped: false }), focos.length / 3);
  for (let i = 0; i < focos.length / 3; i++) { V.set(focos[i * 3], focos[i * 3 + 1], focos[i * 3 + 2]); Q.identity(); M.compose(V, Q, S); imF.setMatrixAt(i, M); }
  imF.instanceMatrix.needsUpdate = true; juego.escena.add(imF);
  return {
    malla: im, filas: filas.length, banderitas: total, focos: focos.length / 3,
    actualizar(noche) {
      imF.material.color.set(noche > 0.2 ? '#ffd38a' : '#8a8578');
      lineas.material.color.setScalar(0.92 - noche * 0.7);
    }
  };
}
