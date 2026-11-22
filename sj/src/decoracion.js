import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, COLORES_CASA } from './ciudad.js?v=202611220526';

const LETREROS = [[66, 246], [290, 466], [508, 690], [732, 912], [955, 1106], [1148, 1316], [1356, 1520], [1560, 1722]].map(([a, b]) => [6 / 887, 881 / 887, 1 - b / 1774, 1 - a / 1774]);
const ESPECTACULARES = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) ESPECTACULARES.push([(c * 727 + 8) / 1448, (c * 727 + 716) / 1448, 1 - (r * 362 + 354) / 1086, 1 - (r * 362 + 8) / 1086]);

const _c = new THREE.Color();
function color(geo, hex) {
  _c.set(hex);
  const n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
function plano(w, h, rect) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, rect[0] + uv.getX(i) * (rect[1] - rect[0]), rect[2] + uv.getY(i) * (rect[3] - rect[2]));
  return g;
}
function colocar(g, x, y, z, rotY = 0, rotX = 0) { if (rotX) g.rotateX(rotX); if (rotY) g.rotateY(rotY); g.translate(x, y, z); return g; }

function texturaNube() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const x = 40 + r() * 176, y = 50 + r() * 40 - Math.abs(x - 128) * 0.15, rad = 18 + r() * 30;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  }
  return new THREE.CanvasTexture(c);
}

export function decorar(juego) {
  const { escena, ciudad, mundo } = juego;
  const r = rng(99);
  const carga = new THREE.TextureLoader();
  const tLet = carga.load('assets/letreros.jpg'); tLet.colorSpace = THREE.SRGBColorSpace; tLet.anisotropy = 8;
  const tEsp = carga.load('assets/espectaculares.jpg'); tEsp.colorSpace = THREE.SRGBColorSpace; tEsp.anisotropy = 8;
  const signos = [], anuncios = [], liso = [];
  for (const e of ciudad.edificios) {
    const [fx, fz] = e.frente;
    const ancho = fx === 0 ? e.w : e.fondo, fondo = fx === 0 ? e.fondo : e.w;
    const rot = Math.atan2(fx, fz);
    const cx = e.x + fx * e.fondo / 2, cz = e.z + fz * e.fondo / 2;
    if (e.estilo === 'casa' && e.w > 6 && r() < 0.5) {
      const w = Math.min(e.w - 1.4, 6.5), h = w / 5.1;
      const li = r() * 8 | 0;
      ciudad.tiendas.push({ x: cx, z: cz, fx, fz, rot, letrero: li, w: e.w, tipo: e.tipo });
      signos.push(colocar(plano(w, h, LETREROS[li]), cx + fx * 0.07, 3.3 + h / 2, cz + fz * 0.07, rot));
      const toldo = new THREE.BoxGeometry(Math.min(e.w - 1, 7), 0.08, 1.5);
      toldo.rotateX(0.32);
      const col = ['#e8505b', '#2a9d8f', '#f4a261', '#ffffff', '#8e5bd6', '#3a86ff'][r() * 6 | 0];
      liso.push(color(colocar(toldo, cx + fx * 0.75, 2.85, cz + fz * 0.75, rot), col));
      for (let k = 0; k < 6; k++) {
        const raya = new THREE.BoxGeometry(Math.min(e.w - 1, 7) / 12, 0.085, 1.5);
        raya.rotateX(0.32);
        const off = (k - 2.5) * Math.min(e.w - 1, 7) / 6;
        liso.push(color(colocar(raya, cx + fx * 0.75 + (fz !== 0 ? off : 0) * 1, 2.855, cz + fz * 0.75 + (fx !== 0 ? off : 0), rot), '#ffffff'));
      }
    }
    else if (e.estilo === 'casa' && e.w > 7 && e.h < 10) ciudad.libres.push({ x: cx, z: cz, fx, fz, rot, w: e.w, tipo: e.tipo });
    if (e.estilo === 'casa' && r() < 0.6) {
      const ox = (r() - 0.5) * Math.max(0, ancho - 2.5), oz = (r() - 0.5) * Math.max(0, fondo - 2.5);
      const y0 = e.h + 0.15;
      liso.push(color(colocar(new THREE.CylinderGeometry(0.55, 0.55, 1.15, 12), e.x + ox, y0 + 0.75, e.z + oz), '#151515'));
      liso.push(color(colocar(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 10), e.x + ox, y0 + 1.38, e.z + oz), '#222'));
      liso.push(color(colocar(new THREE.BoxGeometry(1.3, 0.2, 1.3), e.x + ox, y0 + 0.1, e.z + oz), '#9a958c'));
      if (r() < 0.35) liso.push(color(colocar(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 4), e.x - ox * 0.5, y0 + 1.1, e.z - oz * 0.5), '#444'));
      if (r() < 0.25) liso.push(color(colocar(new THREE.BoxGeometry(ancho * 0.9, 0.9, 0.12), e.x, y0 + 0.45, e.z - fz * fondo * 0.45 - 0, rot), '#c9c2b4'));
    }
    if (e.estilo === 'oficina' && r() < 0.7) {
      for (let k = 0; k < 2; k++) liso.push(color(colocar(new THREE.BoxGeometry(1.3, 0.8, 1), e.x + (r() - 0.5) * (ancho - 3), e.h + 0.55, e.z + (r() - 0.5) * (fondo - 3)), '#a8adb5'));
    }
    if (e.estilo === 'casa' && e.h < 8.5 && e.w > 9 && r() < 0.14 && anuncios.length < 22) {
      const w = 8, h = 4, y = e.h + 0.15 + 2.4 + h / 2;
      const ax = e.x + fx * (fondo / 2 - 1), az = e.z + fz * (fondo / 2 - 1);
      anuncios.push(colocar(plano(w, h, ESPECTACULARES[r() * 6 | 0]), ax + fx * 0.08, y, az + fz * 0.08, rot));
      liso.push(color(colocar(new THREE.BoxGeometry(w + 0.4, h + 0.4, 0.15), ax, y, az, rot), '#2c2f36'));
      for (const s of [-1, 1]) {
        const px = ax + (fz !== 0 ? s * w * 0.35 : 0), pz = az + (fx !== 0 ? s * w * 0.35 : 0);
        liso.push(color(colocar(new THREE.BoxGeometry(0.2, 2.6, 0.2), px - fx * 0.3, e.h + 1.45, pz - fz * 0.3), '#3a3d44'));
      }
      liso.push(color(colocar(new THREE.BoxGeometry(w, 0.1, 0.8), ax + fx * 0.5, y - h / 2 - 0.25, az + fz * 0.5, rot), '#3a3d44'));
    }
  }
  for (const e of ciudad.edificios) {
    const [fx] = e.frente;
    const ancho = fx === 0 ? e.w : e.fondo, fondo = fx === 0 ? e.fondo : e.w;
    _c.set(e.estilo === 'casa' ? '#efe6d6' : '#c9c4ba');
    liso.push(color(colocar(new THREE.BoxGeometry(ancho + 0.3, 0.35, fondo + 0.3), e.x, e.h + 0.15 - 0.05, e.z), e.estilo === 'casa' ? '#efe6d6' : '#bdb8ae'));
    if (e.estilo === 'casa') liso.push(color(colocar(new THREE.BoxGeometry(ancho + 0.12, 0.9, fondo + 0.12), e.x, 0.6, e.z), '#6e5a4a'));
    if (e.estilo === 'casa' && e.h > 6 && r() < 0.5) {
      const [fx2, fz2] = e.frente;
      for (let piso = 1; piso * 3.2 + 1 < e.h; piso++) {
        const rot = Math.atan2(fx2, fz2);
        liso.push(color(colocar(new THREE.BoxGeometry(Math.min(2.6, e.w * 0.4), 0.12, 0.7), e.x + fx2 * (e.fondo / 2 + 0.35), piso * 3.2 + 0.2, e.z + fz2 * (e.fondo / 2 + 0.35), rot), '#d8d0c0'));
        liso.push(color(colocar(new THREE.BoxGeometry(Math.min(2.6, e.w * 0.4), 0.7, 0.05), e.x + fx2 * (e.fondo / 2 + 0.68), piso * 3.2 + 0.6, e.z + fz2 * (e.fondo / 2 + 0.68), rot), '#2a2a2e'));
      }
    }
  }
  for (const t of ciudad.torres) {
    if (t.estilo !== 'torre' || r() < 0.4) continue;
    liso.push(color(colocar(new THREE.CylinderGeometry(Math.min(t.w, t.d) * 0.3, Math.min(t.w, t.d) * 0.3, 0.2, 20), t.x, t.h + 0.25, t.z), '#3c4250'));
    liso.push(color(colocar(new THREE.CylinderGeometry(0.06, 0.06, 7, 5), t.x + t.w * 0.35, t.h + 3.6, t.z + t.d * 0.35), '#ddd'));
  }
  for (const b of ciudad.bloques) {
    const h = 0.26, w = 0.4;
    for (const [x, z, sx, sz] of [[(b.x0 + b.x1) / 2, b.z0 + w / 2, b.x1 - b.x0, w], [(b.x0 + b.x1) / 2, b.z1 - w / 2, b.x1 - b.x0, w], [b.x0 + w / 2, (b.z0 + b.z1) / 2, w, b.z1 - b.z0], [b.x1 - w / 2, (b.z0 + b.z1) / 2, w, b.z1 - b.z0]])
      liso.push(color(colocar(new THREE.BoxGeometry(sx, h, sz), x, h / 2, z), '#a59f93'));
  }
  const unir = l => mergeGeometries(l.map(g => g.index ? g.toNonIndexed() : g), false);
  const salida = {};
  if (liso.length) {
    const m = new THREE.Mesh(unir(liso), new THREE.MeshLambertMaterial({ vertexColors: true }));
    m.castShadow = true; m.receiveShadow = true; escena.add(m);
  }
  if (signos.length) {
    salida.matLetreros = new THREE.MeshLambertMaterial({ map: tLet, emissive: '#ffffff', emissiveMap: tLet, emissiveIntensity: 0 });
    escena.add(new THREE.Mesh(unir(signos), salida.matLetreros));
  }
  if (anuncios.length) {
    salida.matAnuncios = new THREE.MeshLambertMaterial({ map: tEsp, emissive: '#ffffff', emissiveMap: tEsp, emissiveIntensity: 0 });
    escena.add(new THREE.Mesh(unir(anuncios), salida.matAnuncios));
  }
  const tn = texturaNube();
  salida.nubes = [];
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tn, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    const a = r() * Math.PI * 2, d = 420 + r() * 300;
    s.position.set(Math.cos(a) * d, 120 + r() * 140, Math.sin(a) * d);
    s.scale.set(220 + r() * 200, 80 + r() * 60, 1);
    s.userData = { a, d, v: 0.004 + r() * 0.006 };
    s.renderOrder = -0.5;
    escena.add(s);
    salida.nubes.push(s);
  }
  salida.actualizar = (dt, noche, cielo, lluvia) => {
    if (salida.matLetreros) salida.matLetreros.emissiveIntensity = noche * 0.55;
    if (salida.matAnuncios) salida.matAnuncios.emissiveIntensity = 0.12 + noche * 0.7;
    for (const n of salida.nubes) {
      n.userData.a += n.userData.v * dt;
      n.position.x = Math.cos(n.userData.a) * n.userData.d; n.position.z = Math.sin(n.userData.a) * n.userData.d;
      n.material.color.copy(cielo).lerp(_c.set('#ffffff'), Math.max(0, Math.min(1, 0.7 - noche * 0.5 - lluvia * 0.4))).lerp(_c.set('#3a3f4a'), lluvia * 0.5 * (1 - noche * 0.6));
      n.material.opacity = Math.max(0.15, Math.min(1, 0.55 + lluvia * 0.4 - noche * 0.3));
    }
  };
  return salida;
}
