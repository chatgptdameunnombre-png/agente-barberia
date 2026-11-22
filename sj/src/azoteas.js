import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VIENTO } from './ciudad.js?v=202611220529';

function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const _c = new THREE.Color();
function teñir(geo, hex, ola = 0) {
  _c.set(hex);
  const n = geo.attributes.position.count, a = new Float32Array(n * 3), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; o[i] = ola ? 1 - geo.attributes.uv.getY(i) : 0; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (ola) geo.setAttribute('ola', new THREE.BufferAttribute(o, 1));
  return geo;
}
const poner = (g, x, y, z, ry = 0, rx = 0, rz = 0) => { if (rz) g.rotateZ(rz); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); return g.translate(x, y, z); };

function atlas() {
  const N = 1024, M = N / 2, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  const tipos = [['#b0452e', '#c95c3b', '#86321f'], ['#e7e1d5', '#f5f1ea', '#b8b0a2'], ['#8c8983', '#a19e97', '#6a6761'], ['#45423f', '#5a5652', '#2b2927']];
  tipos.forEach(([base, claro, oscuro], i) => {
    const x0 = (i % 2) * M, y0 = (i >> 1) * M;
    g.save(); g.beginPath(); g.rect(x0, y0, M, M); g.clip();
    g.globalAlpha = 1; g.fillStyle = base; g.fillRect(x0, y0, M, M);
    for (let k = 0; k < 3000; k++) { g.fillStyle = Math.random() < 0.5 ? claro : oscuro; g.globalAlpha = Math.random() * 0.13; const s = 2 + Math.random() * 9; g.fillRect(x0 + Math.random() * M, y0 + Math.random() * M, s, s * (0.3 + Math.random())); }
    if (i < 2) {
      g.globalAlpha = 0.09; g.strokeStyle = oscuro; g.lineWidth = 16;
      for (let k = 0; k < 46; k++) { const yy = y0 + Math.random() * M; g.beginPath(); g.moveTo(x0 - 10, yy); g.bezierCurveTo(x0 + M * 0.3, yy + 18, x0 + M * 0.6, yy - 18, x0 + M + 10, yy + 8); g.stroke(); }
      g.globalAlpha = 0.12; g.fillStyle = claro;
      for (let k = 0; k < 5; k++) g.fillRect(x0 + Math.random() * M, y0 + Math.random() * M, 40 + Math.random() * 90, 30 + Math.random() * 70);
    }
    if (i === 3) { g.globalAlpha = 0.5; for (let k = 0; k < 6000; k++) { g.fillStyle = Math.random() < 0.5 ? '#77736c' : '#1e1c1a'; g.fillRect(x0 + Math.random() * M, y0 + Math.random() * M, 2, 2); } }
    if (i === 2) {
      g.globalAlpha = 0.4; g.strokeStyle = '#4a4844'; g.lineWidth = 1.5;
      for (let k = 0; k < 16; k++) { let px = x0 + Math.random() * M, py = y0 + Math.random() * M; g.beginPath(); g.moveTo(px, py); for (let q = 0; q < 9; q++) { px += (Math.random() - 0.5) * 44; py += (Math.random() - 0.5) * 44; g.lineTo(px, py); } g.stroke(); }
      g.globalAlpha = 0.25; g.strokeStyle = '#6a6761'; g.lineWidth = 3;
      for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x0 + k * M / 4, y0); g.lineTo(x0 + k * M / 4, y0 + M); g.stroke(); g.beginPath(); g.moveTo(x0, y0 + k * M / 4); g.lineTo(x0 + M, y0 + k * M / 4); g.stroke(); }
    }
    for (let k = 0; k < 8; k++) {
      const cx = x0 + Math.random() * M, cy = y0 + Math.random() * M, r = 22 + Math.random() * 80;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, oscuro); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.22; g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;
    for (const [ancho, alfa] of [[46, 0.1], [26, 0.14], [10, 0.2]]) { g.strokeStyle = `rgba(20,16,12,${alfa})`; g.lineWidth = ancho; g.strokeRect(x0, y0, M, M); }
    g.restore();
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function techo(x, y, z, w, d, cual) {
  const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(x, y, z);
  const uv = g.attributes.uv, u0 = (cual % 2) * 0.5 + 0.01;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * 0.48, (cual >> 1 ? 0.01 : 0.51) + uv.getY(i) * 0.48);
  return g;
}

export function construirAzoteas(juego) {
  const ciudad = juego.ciudad, escena = juego.escena, r = rng(4242);
  const trozos = new Map();
  const trozo = (x, z) => { const k = Math.floor(x / 220) + ',' + Math.floor(z / 220); if (!trozos.has(k)) trozos.set(k, { techos: [], cosas: [], ropa: [] }); return trozos.get(k); };
  const ROPA = ['#d8434b', '#f2f2f2', '#2c5aa0', '#f2c14e', '#3a8f5c', '#e07ab0', '#6c4fb3', '#1f1f22', '#7fb8e6', '#f08a3c'];
  const luces = [];

  const calentador = (T, x, y, z, ry) => {
    const s = [];
    s.push(teñir(new THREE.BoxGeometry(1.9, 0.04, 1.3), '#b9bec4'));
    for (let k = 0; k < 10; k++) s.push(teñir(new THREE.CylinderGeometry(0.045, 0.045, 1.28, 6).rotateX(Math.PI / 2).translate(-0.84 + k * 0.187, 0.05, 0), '#1c2633'));
    for (const g of s) { g.rotateX(-0.62); g.translate(0, 0.62, 0); }
    s.push(teñir(new THREE.CylinderGeometry(0.24, 0.24, 1.95, 12).rotateZ(Math.PI / 2).translate(0, 1.18, -0.5), '#dfe3e7'));
    for (const sx of [-0.85, 0.85]) { s.push(teñir(new THREE.BoxGeometry(0.05, 1.05, 0.05).translate(sx, 0.52, -0.5), '#8d9298')); s.push(teñir(new THREE.BoxGeometry(0.05, 0.05, 1.05).translate(sx, 0.05, 0), '#8d9298')); }
    for (const g of s) T.cosas.push(poner(g, x, y, z, ry));
  };
  const tendedero = (T, x, y, z, ry, largo) => {
    const s = [];
    for (const sx of [-largo / 2, largo / 2]) s.push(teñir(new THREE.BoxGeometry(0.06, 1.75, 0.06).translate(sx, 0.875, 0), '#7c7f84'));
    for (const lz of [-0.35, 0, 0.35]) {
      s.push(teñir(new THREE.BoxGeometry(largo, 0.015, 0.015).translate(0, 1.7, lz), '#d5d5d5'));
      let px = -largo / 2 + 0.2;
      while (px < largo / 2 - 0.5) {
        const w = 0.35 + r() * 0.45, h = 0.4 + r() * 0.55;
        if (r() < 0.75) {
          const p = new THREE.PlaneGeometry(w, h, 1, 2).translate(px + w / 2, 1.7 - h / 2, lz);
          teñir(p, ROPA[r() * ROPA.length | 0], 1); poner(p, x, y, z, ry); T.ropa.push(p);
        }
        px += w + 0.08 + r() * 0.3;
      }
    }
    for (const g of s) T.cosas.push(poner(g, x, y, z, ry));
  };
  const varillas = (T, x, y, z) => {
    for (let k = 0; k < 3; k++) T.cosas.push(teñir(new THREE.BoxGeometry(0.03, 0.8 + r() * 0.6, 0.03).translate(x + (k - 1) * 0.12, y + 0.5, z + (k % 2) * 0.1), '#7a3d22'));
    T.cosas.push(teñir(new THREE.BoxGeometry(0.35, 0.3, 0.35).translate(x, y + 0.15, z), '#9c958a'));
  };
  const antena = (T, x, y, z) => {
    T.cosas.push(teñir(new THREE.CylinderGeometry(0.025, 0.03, 2.6, 5).translate(x, y + 1.3, z), '#8a8d92'));
    for (let k = 0; k < 4; k++) T.cosas.push(teñir(new THREE.BoxGeometry(1.1 - k * 0.2, 0.02, 0.02).rotateY(0.3).translate(x, y + 1.9 + k * 0.18, z), '#a2a5aa'));
  };
  const plato = (T, x, y, z, ry) => {
    T.cosas.push(poner(teñir(new THREE.SphereGeometry(0.38, 10, 6, 0, Math.PI * 2, 0, 0.9).rotateX(-1.1), '#e8e8e6'), x, y + 0.75, z, ry));
    T.cosas.push(teñir(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5).translate(x, y + 0.35, z), '#7d8085'));
  };
  const gas = (T, x, y, z, ry) => {
    T.cosas.push(poner(teñir(new THREE.CapsuleGeometry(0.42, 1.2, 4, 12).rotateZ(Math.PI / 2).translate(0, 0.62, 0), '#f0efea'), x, y, z, ry));
    for (const sx of [-0.45, 0.45]) T.cosas.push(poner(teñir(new THREE.BoxGeometry(0.12, 0.25, 0.7).translate(sx, 0.12, 0), '#8a857c'), x, y, z, ry));
  };
  const cuarto = (T, x, y, z, ry, col) => {
    T.cosas.push(poner(teñir(new THREE.BoxGeometry(2.6, 2.3, 2.4).translate(0, 1.15, 0), col), x, y, z, ry));
    T.cosas.push(poner(teñir(new THREE.BoxGeometry(2.9, 0.12, 2.7).translate(0, 2.36, 0), '#cfc6b6'), x, y, z, ry));
    T.cosas.push(poner(teñir(new THREE.BoxGeometry(0.9, 1.9, 0.04).translate(0.5, 0.95, 1.21), '#5a3f2c'), x, y, z, ry));
  };
  const macetas = (T, x, y, z) => {
    for (let k = 0; k < 3; k++) {
      const px = x + k * 0.55, h = 0.35 + r() * 0.2;
      T.cosas.push(teñir(new THREE.CylinderGeometry(0.2, 0.15, h, 8).translate(px, y + h / 2, z), '#a8552f'));
      T.cosas.push(teñir(new THREE.SphereGeometry(0.26 + r() * 0.12, 7, 5).translate(px, y + h + 0.18, z), r() < 0.5 ? '#3f7a3a' : '#5a8f3f'));
    }
  };

  for (const e of ciudad.edificios) {
    const [fx, fz] = e.frente;
    const ancho = fx === 0 ? e.w : e.fondo, fondo = fx === 0 ? e.fondo : e.w;
    const T = trozo(e.x, e.z), y = e.h + 0.3;
    const casa = e.estilo === 'casa';
    const x = r();
    const cual = casa ? (x < 0.42 ? 0 : x < 0.8 ? 1 : 2) : (x < 0.6 ? 2 : 3);
    T.techos.push(techo(e.x, y, e.z, ancho + 0.2, fondo + 0.2, cual));
    const colPar = casa ? '#e9dfcd' : '#c9c3b8';
    const hp = casa ? 0.5 : 0.8;
    for (const [px, pz, w, d] of [[0, -(fondo + 0.3) / 2, ancho + 0.3, 0.16], [0, (fondo + 0.3) / 2, ancho + 0.3, 0.16], [-(ancho + 0.3) / 2, 0, 0.16, fondo + 0.3], [(ancho + 0.3) / 2, 0, 0.16, fondo + 0.3]])
      T.cosas.push(teñir(new THREE.BoxGeometry(w, hp, d).translate(e.x + px, y + hp / 2 - 0.01, e.z + pz), colPar));
    const ux = Math.max(0, ancho / 2 - 1.6), uz = Math.max(0, fondo / 2 - 1.6);
    const lugar = () => [e.x + (r() * 2 - 1) * ux, e.z + (r() * 2 - 1) * uz];
    const ry = Math.atan2(fx, fz);
    if (casa) {
      const barrio = e.tipo === 'barrio';
      if (r() < (barrio ? 0.45 : 0.28) && ancho > 4 && fondo > 4) { const [px, pz] = lugar(); calentador(T, px, y, pz, (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.3); }
      if (r() < (barrio ? 0.4 : 0.2) && Math.max(ancho, fondo) > 6) { const [px, pz] = lugar(); tendedero(T, px, y, pz, ancho > fondo ? 0 : Math.PI / 2, Math.min(4.2, Math.max(ancho, fondo) - 2.4)); }
      if (r() < (barrio ? 0.38 : 0.18)) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (r() < 0.75) varillas(T, e.x + sx * (ancho / 2 - 0.25), y, e.z + sz * (fondo / 2 - 0.25));
      if (r() < 0.22) { const [px, pz] = lugar(); antena(T, px, y, pz); }
      else if (r() < 0.2) { const [px, pz] = lugar(); plato(T, px, y, pz, r() * 6.28); }
      if (r() < 0.1 && ancho > 5) { const [px, pz] = lugar(); gas(T, px, y, pz, r() * 3.14); }
      if (r() < 0.13 && ancho > 6 && fondo > 6 && e.h < 10) { const [px, pz] = lugar(); cuarto(T, px, y, pz, ry, ['#d9cdb8', '#c9b79c', '#e2d6c2', '#b8a68c'][r() * 4 | 0]); }
      if (r() < 0.18) { const [px, pz] = lugar(); macetas(T, px, y, pz); }
    } else {
      for (let k = 0; k < 2; k++) if (r() < 0.6) { const [px, pz] = lugar(); T.cosas.push(teñir(new THREE.BoxGeometry(1.6, 1.1, 1.2).translate(px, y + 0.55, pz), '#a9aeb6')); T.cosas.push(teñir(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 12).translate(px, y + 1.15, pz), '#5d636c')); }
      if (r() < 0.4) { const [px, pz] = lugar(); antena(T, px, y, pz); }
    }
  }

  for (const t of ciudad.torres) {
    const T = trozo(t.x, t.z), y = t.h + 0.19;
    T.techos.push(techo(t.x, y, t.z, t.w - 0.5, t.d - 0.5, 3));
    const hp = 1.1, col = t.estilo === 'torre' ? '#c3ccd6' : '#c9c3b8';
    for (const [px, pz, w, d] of [[0, -t.d / 2 + 0.12, t.w, 0.25], [0, t.d / 2 - 0.12, t.w, 0.25], [-t.w / 2 + 0.12, 0, 0.25, t.d], [t.w / 2 - 0.12, 0, 0.25, t.d]])
      T.cosas.push(teñir(new THREE.BoxGeometry(w, hp, d).translate(t.x + px, y + hp / 2, t.z + pz), col));
    for (let k = 0; k < 3; k++) {
      const px = t.x + (r() - 0.5) * (t.w - 6), pz = t.z + (r() - 0.5) * (t.d - 6);
      T.cosas.push(teñir(new THREE.BoxGeometry(2.4, 1.6, 1.8).translate(px, y + 0.8, pz), '#9aa0a8'));
      for (const sx of [-0.6, 0.6]) T.cosas.push(teñir(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 14).translate(px + sx, y + 1.65, pz), '#4f555e'));
    }
    if (t.h > 50) {
      const ax = t.x + t.w * 0.3, az = t.z - t.d * 0.3, alto = 6 + r() * 6;
      T.cosas.push(teñir(new THREE.CylinderGeometry(0.08, 0.16, alto, 6).translate(ax, y + alto / 2, az), '#b8bcc2'));
      luces.push(new THREE.SphereGeometry(0.28, 8, 6).translate(ax, y + alto + 0.2, az));
      for (const [sx, sz] of [[-1, -1], [1, 1]]) luces.push(new THREE.SphereGeometry(0.22, 8, 6).translate(t.x + sx * (t.w / 2 - 0.3), y + hp + 0.15, t.z + sz * (t.d / 2 - 0.3)));
    }
  }

  const matTecho = new THREE.MeshLambertMaterial({ map: atlas() });
  const matCosas = new THREE.MeshLambertMaterial({ vertexColors: true });
  const matRopa = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  matRopa.onBeforeCompile = sh => {
    sh.uniforms.tiempo = VIENTO;
    sh.vertexShader = 'uniform float tiempo;\nattribute float ola;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normal * sin(tiempo * 3.1 + position.x * 0.9 + position.z * 0.7) * 0.09 * ola;');
  };
  const mallas = [];
  const agregar = (lista, mat, sombra) => {
    if (!lista.length) return;
    const m = new THREE.Mesh(mergeGeometries(lista), mat);
    m.receiveShadow = true; m.castShadow = sombra; escena.add(m); mallas.push(m);
  };
  for (const T of trozos.values()) { agregar(T.techos, matTecho, false); agregar(T.cosas, matCosas, false); agregar(T.ropa, matRopa, false); }
  const matLuz = new THREE.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: 0.4, toneMapped: false });
  if (luces.length) { const m = new THREE.Mesh(mergeGeometries(luces), matLuz); escena.add(m); mallas.push(m); }
  let t = 0;
  return {
    mallas,
    actualizar(dt, noche) {
      t += dt;
      const parpadeo = (t % 1.6) < 0.5 ? 1 : 0.15;
      matLuz.opacity = noche > 0.15 ? 0.25 + 0.75 * parpadeo : 0.35;
    }
  };
}
