import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BANQUETA } from './ciudad.js?v=202611220506';

const _c = new THREE.Color();
function teñir(geo, hex) { _c.set(hex); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
const caja = (w, h, d, x, y, z, col) => teñir(new THREE.BoxGeometry(w, h, d).translate(x, y, z), col);
const col = (r, h, x, y, z, c) => teñir(new THREE.CylinderGeometry(r, r * 1.08, h, 14).translate(x, y, z), c);

function texReloj() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#f4efe2'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.strokeStyle = '#2a2420'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 116, 0, 7); g.stroke();
  g.fillStyle = '#2a2420'; g.font = '700 26px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.fillText(n, 128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function adornarCatedral(juego) {
  const B = juego.ciudad.bloques.find(b => b.tipo === 'catedral'); if (!B) return null;
  const cx = B.cx, iz1 = B.z1 - BANQUETA, fz = iz1 - 12, F = fz + 1.6, escena = juego.escena;
  const CANT = '#e4d4b0', OSC = '#c9b48a', piezas = [];
  for (const s of [-1, 1]) {
    for (const dx of [2.7, 3.7]) { piezas.push(col(0.32, 7.2, cx + s * dx, 0.15 + 3.6, F + 0.45, CANT)); piezas.push(caja(0.85, 0.4, 0.85, cx + s * dx, 0.35, F + 0.45, OSC), caja(0.8, 0.35, 0.8, cx + s * dx, 7.45, F + 0.45, OSC)); }
    for (const dx of [2.9, 3.6]) { piezas.push(col(0.22, 5.2, cx + s * dx, 8.6 + 2.6, F + 0.35, CANT)); piezas.push(caja(0.6, 0.3, 0.6, cx + s * dx, 13.9, F + 0.35, OSC)); }
  }
  piezas.push(caja(10.6, 0.7, 1.3, cx, 8.2, F + 0.45, OSC), caja(11, 0.35, 1.5, cx, 8.7, F + 0.5, CANT));
  piezas.push(caja(9.6, 0.5, 0.9, cx, 14.3, F + 0.35, OSC), caja(10, 0.3, 1.1, cx, 14.7, F + 0.4, CANT));
  const arco = new THREE.TorusGeometry(2.25, 0.32, 8, 20, Math.PI); piezas.push(teñir(arco.translate(cx, 6.65, F + 0.12), OSC));
  for (const s of [-1, 1]) piezas.push(caja(0.55, 6.5, 0.4, cx + s * 2.3, 0.15 + 3.25, F + 0.12, OSC));
  piezas.push(caja(1.6, 2.4, 0.5, cx, 11, F + 0.25, OSC), teñir(new THREE.CylinderGeometry(0.45, 0.55, 1.7, 10).translate(cx, 11.1, F + 0.55), '#f4efe2'), teñir(new THREE.SphereGeometry(0.3, 10, 8).translate(cx, 12.15, F + 0.55), '#f4efe2'));
  for (const s of [-1, 1]) {
    const tx = cx + s * 8.5, tf = fz - 2 + 3.5;
    for (const y of [12.3, 19.3, 27.75]) piezas.push(caja(7.6, 0.45, 7.6, tx, y, fz - 2, CANT));
    for (const k of [-1, 1]) for (const [y0, y1] of [[21, 23.6], [28.5, 31.1]]) piezas.push(col(0.16, y1 - y0, tx + k * 1.1, (y0 + y1) / 2, tf + 0.1, CANT));
    for (const y of [22.6, 30.1]) {
      piezas.push(teñir(new THREE.CylinderGeometry(0.28, 0.55, 0.9, 12, 1, true).translate(tx, y, tf - 0.4), '#a8782a'), teñir(new THREE.SphereGeometry(0.12, 8, 6).translate(tx, y - 0.4, tf - 0.4), '#6a4a1a'));
      piezas.push(caja(1.8, 0.12, 0.12, tx, y + 0.6, tf - 0.4, '#3a2a1a'));
    }
    piezas.push(caja(5.8, 0.6, 5.8, tx, 32.0, fz - 2, OSC));
  }
  const m = new THREE.Mesh(mergeGeometries(piezas.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }));
  m.castShadow = m.receiveShadow = true; escena.add(m);
  const texR = texReloj(), matR = new THREE.MeshStandardMaterial({ map: texR, roughness: 0.6, emissive: '#fff4d0', emissiveMap: texR, emissiveIntensity: 0 });
  const relojes = [];
  for (const s of [-1, 1]) {
    const tx = cx + s * 8.5, tf = fz - 2 + 3.5 + 0.06;
    const cara = new THREE.Mesh(new THREE.CircleGeometry(1.25, 32), matR); cara.position.set(tx, 26, tf); escena.add(cara);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.1, 6, 32), new THREE.MeshStandardMaterial({ color: '#a8782a', metalness: 0.7, roughness: 0.35 })); aro.position.set(tx, 26, tf); escena.add(aro);
    const manH = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.04).translate(0, 0.3, 0), new THREE.MeshBasicMaterial({ color: '#1a1410' })); manH.position.set(tx, 26, tf + 0.04); escena.add(manH);
    const manM = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.04).translate(0, 0.45, 0), manH.material); manM.position.set(tx, 26, tf + 0.06); escena.add(manM);
    relojes.push({ manH, manM });
  }
  let ultimaHora = null;
  const centro = new THREE.Vector3(cx, 0, fz);
  const campanadas = (n) => {
    const a = juego.audio; if (!a?.ctx) return;
    const d = juego.jugador.posicion.distanceTo(centro); if (d > 380) return;
    const v = 0.16 * Math.max(0.08, 1 - d / 380), t0 = a.ctx.currentTime + 0.1;
    for (let k = 0; k < n; k++) { const t = t0 + k * 1.6; a.tono(392, 3.2, v, 'sine', null, t); a.tono(784 * 1.19, 2.0, v * 0.45, 'sine', null, t); a.tono(196, 3.6, v * 0.5, 'triangle', null, t); }
  };
  return {
    campanadas, puerta: new THREE.Vector3(cx, 0, iz1 - 12 + 3.3),
    actualizar(hora, noche) {
      const h = Math.floor(hora);
      if (ultimaHora !== null && h !== ultimaHora && h >= 7 && h <= 22) campanadas(h % 12 || 12);
      ultimaHora = h;
      matR.emissiveIntensity = noche * 0.6;
      for (const r of relojes) { r.manH.rotation.z = -((hora % 12) / 12) * Math.PI * 2; r.manM.rotation.z = -((hora % 1)) * Math.PI * 2; }
    }
  };
}
