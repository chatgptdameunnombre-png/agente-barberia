import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { modelo } from './vehiculos.js?v=202611220156';

const _c = new THREE.Color();
function teñir(geo, hex) {
  _c.set(hex);
  const n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
const caja = (w, h, d, x, y, z, col, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); return teñir(g.translate(x, y, z), col); };
const cil = (r1, r2, h, x, y, z, col, seg = 12) => teñir(new THREE.CylinderGeometry(r1, r2, h, seg).translate(x, y, z), col);

function lienzo(w, h, pintar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function pintarBarda(g, w, h) {
  g.fillStyle = '#e9e1d2'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '90,80,64' : '255,255,255'},${Math.random() * 0.08})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2); }
  g.fillStyle = '#7a2f2a'; g.fillRect(0, h * 0.86, w, h * 0.14);
  const sucio = g.createLinearGradient(0, h * 0.6, 0, h * 0.86); sucio.addColorStop(0, 'rgba(80,64,44,0)'); sucio.addColorStop(1, 'rgba(80,64,44,0.35)'); g.fillStyle = sucio; g.fillRect(0, h * 0.6, w, h * 0.26);
  g.fillStyle = '#cfc6b4'; g.fillRect(0, 0, w, h * 0.06);
  const rotulo = (x, textos) => {
    g.save(); g.translate(x, 0);
    g.fillStyle = '#1c3f8f'; g.fillRect(0, h * 0.12, w * 0.3, h * 0.62);
    g.fillStyle = '#f6c431'; g.fillRect(8, h * 0.12 + 8, w * 0.3 - 16, 6); g.fillRect(8, h * 0.74 - 14, w * 0.3 - 16, 6);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    textos.forEach(([t, tam, col], i) => { g.fillStyle = col; g.font = `900 ${tam}px Impact, 'Arial Black', sans-serif`; g.fillText(t, w * 0.15, h * (0.24 + i * 0.16)); });
    g.restore();
  };
  rotulo(w * 0.02, [['TALLER DON CHUY', 54, '#f6c431'], ['MECÁNICA EN GENERAL', 30, '#ffffff'], ['AFINACIÓN · FRENOS', 30, '#ffffff'], ['SUSPENSIÓN · CLUTCH', 30, '#ffffff']]);
  rotulo(w * 0.36, [['HOJALATERÍA', 54, '#ffffff'], ['Y PINTURA', 44, '#f6c431'], ['TRABAJO GARANTIZADO', 28, '#ffffff'], ['PRESUPUESTO SIN COSTO', 26, '#9fd0ff']]);
  g.save(); g.translate(w * 0.7, 0);
  g.fillStyle = '#c8202e'; g.font = `900 64px Impact, 'Arial Black', sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('SE COMPRAN', 0, h * 0.28); g.fillText('AUTOS', 0, h * 0.52);
  g.fillStyle = '#1c1c1c'; g.font = `700 30px Impact, sans-serif`; g.fillText('CHOCADOS O DESVIELADOS', 0, h * 0.7);
  g.restore();
  const tags = [['#2a2a2a', 'KIRA'], ['#7a3ab0', 'JCA'], ['#1f8a5a', 'SJ 33']];
  tags.forEach(([col, t], i) => { g.save(); g.translate(w * (0.32 + i * 0.22), h * 0.8); g.rotate(-0.12 + i * 0.1); g.strokeStyle = col; g.lineWidth = 5; g.font = `italic 900 ${40 + i * 6}px 'Brush Script MT', cursive`; g.strokeText(t, 0, 0); g.restore(); });
}

function pintarPiso(g, w, h) {
  g.fillStyle = '#9b978f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '70,66,60' : '220,216,206'},${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2); }
  g.strokeStyle = 'rgba(60,56,50,0.28)'; g.lineWidth = 2;
  for (let k = 1; k < 10; k++) { g.beginPath(); g.moveTo(k * w / 10, 0); g.lineTo(k * w / 10, h); g.stroke(); g.beginPath(); g.moveTo(0, k * h / 10); g.lineTo(w, k * h / 10); g.stroke(); }
  g.strokeStyle = 'rgba(50,46,42,0.5)'; g.lineWidth = 1.5;
  for (let k = 0; k < 30; k++) { let px = Math.random() * w, py = Math.random() * h; g.beginPath(); g.moveTo(px, py); for (let q = 0; q < 7; q++) { px += (Math.random() - 0.5) * 50; py += (Math.random() - 0.5) * 50; g.lineTo(px, py); } g.stroke(); }
  for (let k = 0; k < 38; k++) {
    const cx = Math.random() * w, cy = Math.random() * h, r = 14 + Math.random() * 70;
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(20,18,16,${0.35 + Math.random() * 0.35})`); gr.addColorStop(0.6, 'rgba(30,26,22,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.save(); g.translate(cx, cy); g.scale(1, 0.5 + Math.random() * 0.8); g.translate(-cx, -cy); g.fillRect(cx - r, cy - r, r * 2, r * 2); g.restore();
  }
  g.strokeStyle = 'rgba(25,22,20,0.18)'; g.lineWidth = 16;
  for (let k = 0; k < 9; k++) { g.beginPath(); const y0 = Math.random() * h; g.moveTo(0, y0); g.bezierCurveTo(w * 0.3, y0 + (Math.random() - 0.5) * 300, w * 0.6, y0 + (Math.random() - 0.5) * 300, w, y0 + (Math.random() - 0.5) * 200); g.stroke(); }
  g.fillStyle = 'rgba(246,196,49,0.85)';
  for (let k = 0; k < 5; k++) { const x = w * 0.7 + k * w * 0.055; g.fillRect(x, h * 0.42, 6, h * 0.22); }
  g.fillRect(w * 0.7, h * 0.64, w * 0.22 + 6, 6);
}

function pintarTablero(g, w, h) {
  g.fillStyle = '#c9a877'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(90,60,30,0.6)'; for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
  g.fillStyle = '#2a2c30'; g.strokeStyle = '#2a2c30'; g.lineWidth = 7; g.lineCap = 'round';
  for (let k = 0; k < 7; k++) { const x = 30 + k * 34, l = 50 + (k % 3) * 22; g.beginPath(); g.moveTo(x, 30); g.lineTo(x, 30 + l); g.stroke(); g.beginPath(); g.arc(x, 30, 9, 0, 7); g.stroke(); }
  g.fillStyle = '#b8202e'; g.fillRect(280, 30, 90, 26); g.fillRect(320, 56, 12, 60);
  g.fillStyle = '#e2b64a'; g.fillRect(400, 26, 70, 40); g.fillStyle = '#2a2c30'; g.fillRect(410, 66, 10, 50); g.fillRect(450, 66, 10, 50);
  g.fillStyle = '#3a6ea8'; for (let k = 0; k < 6; k++) g.fillRect(40 + k * 70, 150, 50, 70);
}

export function decorarTaller(juego) {
  const T = juego.ciudad.lugares.taller, escena = juego.escena, mundo = juego.mundo;
  const ix0 = T.x - 18, iz0 = T.z - 21, ix1 = ix0 + 58, iz1 = iz0 + 58, Y = 0.15;
  const geos = [];
  const extra = juego.ciudad.objetosExtra || (juego.ciudad.objetosExtra = []);

  const piso = new THREE.Mesh(new THREE.PlaneGeometry(ix1 - ix0 - 0.4, iz1 - iz0 - 16).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: lienzo(1024, 768, pintarPiso), roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2 }));
  piso.position.set((ix0 + ix1) / 2, Y + 0.012, (iz0 + 15.5 + iz1) / 2); piso.receiveShadow = true; escena.add(piso);

  const texB = lienzo(2048, 256, pintarBarda); texB.wrapS = THREE.RepeatWrapping;
  const matB = new THREE.MeshStandardMaterial({ map: texB, roughness: 0.9 });
  const muros = [];
  const muro = (x0, z0, x1, z1) => {
    const largo = Math.hypot(x1 - x0, z1 - z0), alto = 2.4, gr = 0.28;
    const g = new THREE.BoxGeometry(largo, alto, gr), uv = g.attributes.uv, off = Math.random();
    for (let i = 0; i < uv.count; i++) uv.setX(i, off + uv.getX(i) * largo / 34);
    g.rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate((x0 + x1) / 2, Y + alto / 2, (z0 + z1) / 2);
    muros.push(g);
    geos.push(caja(largo + 0.1, 0.12, gr + 0.12, 0, 0, 0, '#cfc6b4', -Math.atan2(z1 - z0, x1 - x0)).translate((x0 + x1) / 2, Y + alto + 0.06, (z0 + z1) / 2));
    mundo.agregar(Math.min(x0, x1) - gr / 2, Math.min(z0, z1) - gr / 2, Math.max(x0, x1) + gr / 2, Math.max(z0, z1) + gr / 2, alto);
  };
  const b = 0.2;
  muro(ix0 + b, iz1 - b, ix0 + 14, iz1 - b); muro(ix0 + 28, iz1 - b, ix1 - b, iz1 - b);
  muro(ix1 - b, iz0 + 13.6, ix1 - b, iz0 + 24); muro(ix1 - b, iz0 + 38, ix1 - b, iz1 - b);
  muro(ix0 + b, iz0 + 15.2, ix0 + b, iz0 + 28.8); muro(ix0 + b, iz0 + 49.2, ix0 + b, iz1 - b);
  for (const [x, z] of [[ix0 + 14, iz1 - b], [ix0 + 28, iz1 - b], [ix1 - b, iz0 + 24], [ix1 - b, iz0 + 38]]) geos.push(caja(0.5, 2.9, 0.5, x, Y + 1.45, z, '#7a2f2a'), caja(0.62, 0.14, 0.62, x, Y + 2.95, z, '#cfc6b4'));
  const mallaMuros = new THREE.Mesh(mergeGeometries(muros), matB); mallaMuros.castShadow = mallaMuros.receiveShadow = true; escena.add(mallaMuros);

  {
    const texC = lienzo(512, 128, (g, w, h) => {
      g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 8) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 4, 0, 2, h); }
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(110,60,30,${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 3); }
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = 'bold 22px Arial, sans-serif'; g.fillText('SJXU 204417 3', 30, 34);
    });
    texC.wrapS = THREE.RepeatWrapping; texC.repeat.x = 3;
    for (const [z0, col] of [[iz0 + 29.3, '#9a3a26'], [iz0 + 39.2, '#2a5a8a']]) {
      const ct = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.6, 9.5), new THREE.MeshStandardMaterial({ color: col, map: texC, roughness: 0.7, metalness: 0.35 }));
      ct.position.set(ix0 + 1.75, Y + 1.3, z0 + 4.75); ct.castShadow = ct.receiveShadow = true; escena.add(ct);
      for (const sx of [-0.6, 0.6]) geos.push(caja(0.05, 2.4, 0.05, ix0 + 1.75 + sx, Y + 1.3, z0 + 9.53, '#4a4e55'));
    }
    mundo.agregar(ix0 + 0.5, iz0 + 29.3, ix0 + 3, iz0 + 48.7, 2.75);
  }
  const lx = ix0 + 7.5, lz = iz0 + 20;
  for (const sx of [-1.55, 1.55]) {
    geos.push(caja(0.32, 3.4, 0.32, lx + sx, Y + 1.7, lz, '#2f5fa8'), caja(0.7, 0.08, 0.7, lx + sx, Y + 0.04, lz, '#3a3d44'));
    for (const sz of [-1, 1]) geos.push(caja(0.12, 0.1, 1.2, lx + sx * 0.75, Y + 1.5, lz + sz * 0.6, '#3a3d44', sz * sx * 0.35));
    mundo.agregar(lx + sx - 0.2, lz - 0.2, lx + sx + 0.2, lz + 0.2, 3.4);
  }
  geos.push(caja(3.42, 0.25, 0.32, lx, Y + 3.5, lz, '#2f5fa8'));
  {
    const m = modelo('sedan', '#2e5a8a');
    m.grupo.position.set(lx, Y + 1.55, lz); m.grupo.rotation.y = Math.PI / 2;
    if (m.haz) m.haz.visible = false; if (m.silueta) m.silueta.visible = false;
    escena.add(m.grupo);
  }

  const restos = (x, z, ry, tipo, color) => {
    const m = modelo(tipo, color);
    m.pinta.roughness = 0.88; m.pinta.clearcoat = 0; m.pinta.metalness = 0.15;
    for (const r of m.ruedas) r.visible = false;
    if (m.haz) m.haz.visible = false; if (m.silueta) m.silueta.visible = false;
    m.grupo.position.set(x, Y - 0.12, z); m.grupo.rotation.set(0.03, ry, -0.04); escena.add(m.grupo);
    const c = Math.cos(ry), s = Math.sin(ry);
    for (const [a, l] of [[-0.7, -1.3], [0.7, -1.3], [-0.7, 1.3], [0.7, 1.3]]) geos.push(caja(0.4, 0.2, 0.2, x + a * c + l * s, Y + 0.1, z - a * s + l * c, '#8f8a82', ry));
    mundo.agregar(x - 2.4, z - 2.4, x + 2.4, z + 2.4, 1.4);
  };
  restos(ix0 + 44, iz1 - 6.5, Math.PI / 2 + 0.15, 'compacto', '#8a6a3a');
  restos(ix0 + 51.5, iz0 + 44, 0.25, 'sedan', '#6a7076');

  geos.push(caja(3.4, 0.9, 0.9, ix0 + 29.5, Y + 0.45, iz0 + 15.6, '#5a4a3a'), caja(3.6, 0.08, 1.05, ix0 + 29.5, Y + 0.94, iz0 + 15.65, '#4a4e55'));
  geos.push(caja(0.3, 0.22, 0.3, ix0 + 28.2, Y + 1.09, iz0 + 15.5, '#2f5fa8'), caja(0.5, 0.12, 0.35, ix0 + 30.6, Y + 1.04, iz0 + 15.6, '#b8202e'));
  mundo.agregar(ix0 + 27.7, iz0 + 15.1, ix0 + 31.3, iz0 + 16.1, 1);
  const tablero = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), new THREE.MeshStandardMaterial({ map: lienzo(512, 256, pintarTablero), roughness: 0.85 }));
  tablero.position.set(ix0 + 29.5, Y + 2.1, iz0 + 15.05); escena.add(tablero);

  const cx = ix0 + 25.6, cz = iz0 + 16;
  geos.push(teñir(new THREE.CapsuleGeometry(0.3, 0.9, 4, 12).rotateZ(Math.PI / 2).translate(cx, Y + 0.42, cz), '#c0262e'), caja(0.5, 0.35, 0.4, cx, Y + 0.88, cz, '#2a2c30'), cil(0.16, 0.16, 0.1, cx + 0.5, Y + 0.12, cz + 0.25, '#1a1a1a'), cil(0.16, 0.16, 0.1, cx + 0.5, Y + 0.12, cz - 0.25, '#1a1a1a'));
  mundo.agregar(cx - 0.8, cz - 0.45, cx + 0.8, cz + 0.45, 1.1);

  const mx = ix0 + 12, mz = iz0 + 22.5;
  geos.push(caja(0.08, 0.8, 0.08, mx, Y + 0.4, mz, '#c0262e'), caja(1, 0.06, 0.08, mx, Y + 0.05, mz, '#c0262e'), caja(0.08, 0.06, 1, mx, Y + 0.05, mz, '#c0262e'));
  geos.push(caja(0.75, 0.55, 0.55, mx, Y + 1.05, mz, '#3e4248'), caja(0.65, 0.22, 0.5, mx, Y + 1.43, mz, '#7a7f86'), cil(0.14, 0.14, 0.12, mx + 0.42, Y + 1.0, mz, '#2a2c30'));
  mundo.agregar(mx - 0.5, mz - 0.5, mx + 0.5, mz + 0.5, 1.6);

  const tx = ix0 + 9.5, tz = iz0 + 37;
  for (const [sx, sz] of [[-2.1, -2.1], [2.1, -2.1], [-2.1, 2.1], [2.1, 2.1]]) geos.push(cil(0.05, 0.05, 2.6, tx + sx, Y + 1.3, tz + sz, '#8a8d92', 6));
  const lona = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6, 6, 6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2f6fc0', roughness: 0.8, side: THREE.DoubleSide }));
  { const p = lona.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, -0.18 * Math.cos(x / 2.3 * 1.57) * Math.cos(z / 2.3 * 1.57) + z * 0.06); } lona.geometry.computeVertexNormals(); }
  lona.position.set(tx, Y + 2.62, tz); lona.castShadow = true; escena.add(lona);
  geos.push(cil(0.45, 0.45, 0.04, tx, Y + 0.72, tz, '#c0262e', 16), cil(0.05, 0.05, 0.7, tx, Y + 0.36, tz, '#c0262e', 6));
  geos.push(caja(0.6, 0.42, 0.4, tx + 1.4, Y + 0.21, tz - 1.2, '#d8343c'), caja(0.62, 0.06, 0.42, tx + 1.4, Y + 0.45, tz - 1.2, '#f2f2f2'));
  extra.push(['silla', tx - 0.9, tz + 0.2, 1.3], ['silla', tx + 0.8, tz + 0.6, -1.9], ['silla', tx + 0.1, tz - 0.95, 0.2]);
  mundo.agregar(tx - 0.45, tz - 0.45, tx + 0.45, tz + 0.45, 0.75);

  const tambos = [[ix0 + 33.2, iz0 + 16.4, '#1f4f8f'], [ix0 + 33.9, iz0 + 17.1, '#b03a2e'], [ix0 + 32.6, iz0 + 17.3, '#1f4f8f'], [ix0 + 34.1, iz0 + 16.1, '#3a6a44'], [ix1 - 18.5, iz0 + 14.4, '#b03a2e'], [ix1 - 19.3, iz0 + 15, '#1f4f8f'], [ix0 + 2.4, iz1 - 2.6, '#6a5a44'], [ix0 + 3.1, iz1 - 3.4, '#1f4f8f']];
  for (const [x, z, col] of tambos) extra.push(['tambo', x, z, Math.random() * 6, 0, col]);

  const chatarra = [];
  const sx0 = ix1 - 4, sz0 = iz1 - 4;
  const cols = ['#6a7076', '#8a6a3a', '#5a3a2a', '#3a3d44', '#7a2f2a', '#9a9a92'];
  for (let k = 0; k < 14; k++) {
    const w = 0.6 + Math.random() * 1.6, h = 0.08 + Math.random() * 0.5, d = 0.4 + Math.random() * 1.2;
    const g = new THREE.BoxGeometry(w, h, d); g.rotateX((Math.random() - 0.5) * 0.9); g.rotateZ((Math.random() - 0.5) * 0.9); g.rotateY(Math.random() * 3);
    chatarra.push(teñir(g.translate(sx0 + (Math.random() - 0.5) * 3, Y + 0.2 + Math.random() * 0.7, sz0 + (Math.random() - 0.5) * 3), cols[k % cols.length]));
  }
  for (let k = 0; k < 3; k++) chatarra.push(teñir(new THREE.TorusGeometry(0.34, 0.12, 8, 16).rotateX(Math.PI / 2 + (Math.random() - 0.5)).translate(sx0 + (Math.random() - 0.5) * 3, Y + 0.25 + k * 0.1, sz0 + (Math.random() - 0.5) * 3), '#1c1c1e'));
  geos.push(...chatarra);
  mundo.agregar(sx0 - 1.8, sz0 - 1.8, sx0 + 1.8, sz0 + 1.8, 1.2);

  const lamparas = [];
  for (const [x, z] of [[ix0 + 9, iz0 + 15.1], [ix0 + 27, iz0 + 15.1], [ix1 - 14, iz0 + 13.1]]) {
    geos.push(caja(0.08, 0.08, 0.7, x, Y + 4.9, z + 0.35, '#3a3d44'), caja(0.5, 0.18, 0.3, x, Y + 4.85, z + 0.72, '#2a2c30'));
    lamparas.push(new THREE.PlaneGeometry(0.44, 0.24).rotateX(Math.PI / 2).translate(x, Y + 4.755, z + 0.72));
  }
  const matLamp = new THREE.MeshBasicMaterial({ color: '#fff1c8', toneMapped: false });
  escena.add(new THREE.Mesh(mergeGeometries(lamparas), matLamp));

  const fusion = new THREE.Mesh(mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.1 }));
  fusion.castShadow = fusion.receiveShadow = true; escena.add(fusion);

  return {
    actualizar(noche) { matLamp.color.set(noche > 0.25 ? '#fff1c8' : '#9a958a'); }
  };
}
