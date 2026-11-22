import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VIENTO } from './ciudad.js?v=202611220015';

function lienzo(w, h, pintar) { const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

function cajones(lista, x0, z, n, ancho, fondo, dir) {
  for (let k = 0; k <= n; k++) lista.push(new THREE.PlaneGeometry(0.12, fondo).rotateX(-Math.PI / 2).translate(x0 + k * ancho, 0.17, z));
  lista.push(new THREE.PlaneGeometry(n * ancho, 0.12).rotateX(-Math.PI / 2).translate(x0 + n * ancho / 2, 0.17, z + dir * fondo / 2));
}

export function decorarLotes(juego) {
  const C = juego.ciudad, escena = juego.escena, mundo = juego.mundo, Y = 0.15;
  const lineas = [], acero = [];
  const matLinea = new THREE.MeshBasicMaterial({ color: '#e8e6e0', polygonOffset: true, polygonOffsetFactor: -2 });
  const matAcero = new THREE.MeshStandardMaterial({ color: '#c9ced4', roughness: 0.35, metalness: 0.7 });
  let bandera = null;
  if (C.comisariaLote) {
    const { cx, iz0 } = C.comisariaLote;
    cajones(lineas, cx + 2.4, iz0 + 41, 7, 3.2, 5.4, -1);
    const fx = cx + 22, fz = iz0 + 25;
    acero.push(new THREE.CylinderGeometry(0.07, 0.1, 11, 10).translate(fx, Y + 5.5, fz), new THREE.SphereGeometry(0.14, 10, 8).translate(fx, Y + 11.05, fz), new THREE.CylinderGeometry(0.6, 0.7, 0.4, 16).translate(fx, Y + 0.2, fz));
    mundo.agregar(fx - 0.3, fz - 0.3, fx + 0.3, fz + 0.3, 3);
    const tex = lienzo(256, 160, (g, w, h) => {
      g.fillStyle = '#5b2a86'; g.fillRect(0, 0, w / 3, h); g.fillStyle = '#f4f2ec'; g.fillRect(w / 3, 0, w / 3, h); g.fillStyle = '#5b2a86'; g.fillRect(w * 2 / 3, 0, w / 3, h);
      g.fillStyle = '#7a3ab0'; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 14, h / 2 + Math.sin(a) * 14, 12, 7, a, 0, 7); g.fill(); }
      g.fillStyle = '#e2b64a'; g.beginPath(); g.arc(w / 2, h / 2, 8, 0, 7); g.fill();
    });
    const geo = new THREE.PlaneGeometry(2.6, 1.6, 10, 1).translate(1.3, 0, 0);
    const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 });
    mat.onBeforeCompile = sh => { sh.uniforms.tiempo = VIENTO; sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float k = position.x / 2.6;\n  transformed.z += sin(position.x * 2.4 - tiempo * 7.0) * 0.22 * k;\n  transformed.y -= k * k * 0.15;'); };
    bandera = new THREE.Mesh(geo, mat); bandera.position.set(fx + 0.08, Y + 10.1, fz); bandera.castShadow = true; escena.add(bandera);
    const letr = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.7), new THREE.MeshBasicMaterial({ map: lienzo(512, 80, (g, w, h) => { g.fillStyle = '#2556a8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '800 34px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOLO PATRULLAS', w / 2, h / 2 + 2); }) }));
    letr.position.set(cx + 13.6, Y + 2.2, iz0 + 44.4); letr.rotation.y = Math.PI; escena.add(letr);
    acero.push(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6).translate(cx + 11.6, Y + 1.0, iz0 + 44.45), new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6).translate(cx + 15.6, Y + 1.0, iz0 + 44.45));
  }
  let pista = null;
  if (C.hospitalLote) {
    const { cx, iz0 } = C.hospitalLote;
    cajones(lineas, cx - 22.6, iz0 + 44, 7, 3.2, 5.4, 1);
    const ux = cx - 14.8, uz = iz0 + 30;
    for (const [sx, sz] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) { acero.push(new THREE.CylinderGeometry(0.1, 0.1, 3.8, 8).translate(ux + sx, Y + 1.9, uz + sz)); mundo.agregar(ux + sx - 0.15, uz + sz - 0.15, ux + sx + 0.15, uz + sz + 0.15, 3.8); }
    const techo = new THREE.Mesh(new THREE.BoxGeometry(9, 0.35, 7), new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.6 })); techo.position.set(ux, Y + 3.95, uz); techo.castShadow = techo.receiveShadow = true; escena.add(techo);
    const urg = lienzo(512, 64, (g, w, h) => { g.fillStyle = '#e0323a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '900 44px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('URGENCIAS', w / 2, h / 2 + 2); });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.6), new THREE.MeshBasicMaterial({ map: urg, toneMapped: false })); p.position.set(ux, Y + 3.95, uz + s * 3.52); p.rotation.y = s > 0 ? 0 : Math.PI; escena.add(p); }
    const H = lienzo(512, 512, (g, w, h) => {
      g.fillStyle = '#3a3d44'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
      g.strokeStyle = '#f4f2ec'; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 220, 0, 7); g.stroke();
      g.fillStyle = '#ffd23a'; g.fillRect(170, 140, 50, 232); g.fillRect(292, 140, 50, 232); g.fillRect(170, 232, 172, 48);
      for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    pista = new THREE.Mesh(new THREE.CircleGeometry(8.5, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: H, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
    pista.position.set(cx + 10, Y + 22.03, iz0 + 14); pista.receiveShadow = true; escena.add(pista);
    const luces = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; luces.push(new THREE.SphereGeometry(0.12, 8, 6).translate(cx + 10 + Math.cos(a) * 8.8, Y + 22.1, iz0 + 14 + Math.sin(a) * 8.8)); }
    juego.lucesPista = new THREE.Mesh(mergeGeometries(luces), new THREE.MeshBasicMaterial({ color: '#3bd16f', toneMapped: false }));
    escena.add(juego.lucesPista);
    for (const dx of [-3, 3]) acero.push(new THREE.BoxGeometry(1.8, 0.06, 0.5).translate(ux + dx + 9, Y + 0.45, uz + 2), new THREE.BoxGeometry(1.8, 0.5, 0.06).translate(ux + dx + 9, Y + 0.7, uz + 2.22));
  }
  if (lineas.length) escena.add(new THREE.Mesh(mergeGeometries(lineas), matLinea));
  if (acero.length) { const m = new THREE.Mesh(mergeGeometries(acero.map(g => g.index ? g.toNonIndexed() : g)), matAcero); m.castShadow = true; escena.add(m); }
  return { bandera, pista };
}
