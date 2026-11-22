import * as THREE from 'three';
import { linea, BLOQUES, CALLE, tipoBloque } from './ciudad.js?v=202611220349';

function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

function texTope() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, 512, 64);
  for (let x = -64; x < 512; x += 64) { g.fillStyle = '#e8b520'; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 32, 64); g.lineTo(x + 64, 0); g.lineTo(x + 32, 0); g.fill(); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.6 ? '40,38,36' : '200,195,180'},${Math.random() * 0.35})`; g.fillRect(Math.random() * 512, Math.random() * 64, 1 + Math.random() * 4, 1 + Math.random() * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

function texBache() {
  const N = 512, M = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  for (let k = 0; k < 4; k++) {
    const x0 = (k % 2) * M, y0 = (k >> 1) * M, cx = x0 + M / 2, cy = y0 + M / 2;
    const pts = [], n = 18 + (k * 3);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = M * (0.26 + Math.random() * 0.14) * (k === 3 ? (i % 2 ? 1 : 0.7) : 1); pts.push([cx + Math.cos(a) * r * (k === 1 ? 1.35 : 1), cy + Math.sin(a) * r]); }
    g.save(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    g.fillStyle = 'rgba(30,28,26,0.55)'; g.lineWidth = 16; g.strokeStyle = 'rgba(60,56,52,0.6)'; g.stroke();
    g.clip();
    const gr = g.createRadialGradient(cx, cy, 4, cx, cy, M * 0.42); gr.addColorStop(0, '#1d1b19'); gr.addColorStop(0.7, '#2e2b28'); gr.addColorStop(1, '#4a4642');
    g.fillStyle = gr; g.fillRect(x0, y0, M, M);
    for (let i = 0; i < 260; i++) { g.fillStyle = ['#6b665f', '#57534d', '#8a847b', '#3c3934'][i % 4]; const s = 2 + Math.random() * 6; g.fillRect(cx + (Math.random() - 0.5) * M * 0.8, cy + (Math.random() - 0.5) * M * 0.8, s, s * 0.8); }
    g.restore();
    g.strokeStyle = 'rgba(30,28,26,0.7)'; g.lineWidth = 2;
    for (let q = 0; q < 7; q++) { const [px0, py0] = pts[(Math.random() * pts.length) | 0]; let px = px0, py = py0; g.beginPath(); g.moveTo(px, py); for (let s = 0; s < 4; s++) { px += (px - cx) * 0.12 + (Math.random() - 0.5) * 16; py += (py - cy) * 0.12 + (Math.random() - 0.5) * 16; g.lineTo(px, py); } g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export class Baches {
  constructor(juego) {
    this.j = juego;
    const r = rng(777), escena = juego.escena;
    this.topes = []; this.baches = []; this.celdas = new Map();
    const media = CALLE / 2 - 0.3;
    for (let i = 0; i <= BLOQUES; i++) for (let k = 0; k < BLOQUES; k++) for (const eje of ['x', 'z']) {
      if (eje === 'z' && i === 3) continue;
      const fijo = linea(i), a = linea(k) + CALLE / 2, b = linea(k + 1) - CALLE / 2;
      const bloques = eje === 'x' ? [[k, i - 1], [k, i]] : [[i - 1, k], [i, k]];
      const barrio = bloques.some(([bx, bz]) => bx >= 0 && bz >= 0 && bx < BLOQUES && bz < BLOQUES && ['barrio', 'centro'].includes(tipoBloque(bx, bz)));
      if (barrio && r() < 0.42) for (const u of r() < 0.5 ? [a + 11] : [a + 11, b - 11]) this.topes.push({ eje, u, fijo, media });
      const nb = (r() * 3.2) | 0;
      for (let q = 0; q < nb; q++) {
        const u = a + 8 + r() * (b - a - 16), lat = (r() < 0.5 ? -1 : 1) * (1.5 + r() * 4.5), rad = 0.6 + r() * 0.65;
        this.baches.push({ x: eje === 'x' ? u : fijo + lat, z: eje === 'x' ? fijo + lat : u, r: rad, rot: r() * 6.28, v: (r() * 4) | 0 });
      }
    }
    const geoT = new THREE.CylinderGeometry(0.5, 0.5, 1, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2);
    geoT.scale(1, 0.26, 1);
    { const uv = geoT.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * 12, uv.getX(i)); }
    const imT = new THREE.InstancedMesh(geoT, new THREE.MeshStandardMaterial({ map: texTope(), roughness: 0.85 }), this.topes.length);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), E = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    this.topes.forEach((t, i) => {
      V.set(t.eje === 'x' ? t.u : t.fijo, 0, t.eje === 'x' ? t.fijo : t.u);
      E.set(CALLE - 0.6, 1, 1.0); Q.setFromAxisAngle(Y, t.eje === 'x' ? Math.PI / 2 : 0);
      M.compose(V, Q, E); imT.setMatrixAt(i, M);
      this.agregarCelda(V.x, V.z, { t });
    });
    imT.receiveShadow = true; imT.castShadow = false; escena.add(imT);
    const geoB = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    const matB = new THREE.MeshStandardMaterial({ map: texBache(), transparent: true, alphaTest: 0.05, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -3, depthWrite: false });
    matB.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv = vMapUv * 0.5 + vec2(mod(float(gl_InstanceID), 2.0), floor(mod(float(gl_InstanceID), 4.0) / 2.0)) * 0.5;');
    };
    const imB = new THREE.InstancedMesh(geoB, matB, this.baches.length);
    this.baches.forEach((b, i) => {
      V.set(b.x, 0.014, b.z); Q.setFromAxisAngle(Y, b.rot); E.set(b.r * 1.25, 1, b.r * 1.25);
      M.compose(V, Q, E); imB.setMatrixAt(i, M);
      this.agregarCelda(b.x, b.z, { b });
    });
    imB.receiveShadow = true; escena.add(imB);
    this.agua = imB;
    this.malla = imT;
  }

  agregarCelda(x, z, o) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const k = (Math.floor(x / 12) + dx) + ',' + (Math.floor(z / 12) + dz);
      if (!this.celdas.has(k)) this.celdas.set(k, []);
      const l = this.celdas.get(k); if (!l.includes(o)) l.push(o);
    }
  }

  cerca(x, z) { return this.celdas.get(Math.floor(x / 12) + ',' + Math.floor(z / 12)) || []; }

  limite(c) {
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
    for (const o of this.cerca(c.pos.x + fx * 8, c.pos.z + fz * 8)) {
      const t = o.t; if (!t) continue;
      const tx = t.eje === 'x' ? t.u : t.fijo, tz = t.eje === 'x' ? t.fijo : t.u;
      const d = (tx - c.pos.x) * fx + (tz - c.pos.z) * fz;
      const lat = t.eje === 'x' ? Math.abs(c.pos.z - t.fijo) : Math.abs(c.pos.x - t.fijo);
      if (d > -1 && d < 16 && lat < t.media + 1) return 3.5 + Math.max(0, d - 3) * 0.6;
    }
    return Infinity;
  }

  revisar(c, dt) {
    if (c.tipo === 'lancha' || c.enAire || c.pos.y > 0.5) { c.antX = c.pos.x; c.antZ = c.pos.z; return; }
    c.enfriaBache = Math.max(0, (c.enfriaBache || 0) - dt);
    const ax = c.antX ?? c.pos.x, az = c.antZ ?? c.pos.z;
    c.antX = c.pos.x; c.antZ = c.pos.z;
    const v = Math.abs(c.vel || 0);
    if (v < 1.2) return;
    for (const o of this.cerca(c.pos.x, c.pos.z)) {
      if (o.t) {
        const t = o.t;
        const cruza = t.eje === 'x' ? (ax - t.u) * (c.pos.x - t.u) <= 0 && Math.abs(c.pos.z - t.fijo) < t.media : (az - t.u) * (c.pos.z - t.u) <= 0 && Math.abs(c.pos.x - t.fijo) < t.media;
        if (cruza) this.golpe(c, Math.min(2.6, 0.35 + v * 0.085), true);
      } else if (c.enfriaBache <= 0) {
        const b = o.b;
        if (Math.hypot(c.pos.x - b.x, c.pos.z - b.z) < b.r + 0.55) { c.enfriaBache = 0.5; this.golpe(c, Math.min(1.8, 0.2 + v * 0.05), false); }
      }
    }
  }

  golpe(c, f, tope) {
    if (c.tipo === 'moto') { c.alturaV = (c.alturaV || 0) + f * 0.9; }
    else {
      c.alturaV = (c.alturaV || 0) + f * 1.4;
      c.cabV = (c.cabV || 0) + (tope ? -f * 0.9 : f * 0.4);
      c.rolV = (c.rolV || 0) + (Math.random() - 0.5) * f * (tope ? 0.4 : 1.4);
    }
    const j = this.j;
    if (c === j.jugador.coche) {
      j.sacudida = Math.max(j.sacudida || 0, Math.min(0.35, f * 0.12));
      j.audio?.ruidoCorto(0.18, tope ? 220 : 320, Math.min(0.5, 0.12 + f * 0.15));
      j.audio?.tono(tope ? 70 : 95, 0.12, Math.min(0.3, f * 0.1), 'sine');
      if (tope && f > 2.2) { c.salud = Math.max(1, (c.salud || 100) - 2); }
      if (tope) j.estadisticas?.sumar?.('topes', 1);
    } else if (f > 1) j.audio?.ruidoCorto(0.12, 260, 0.12 * j.audio.dist(c.pos));
  }
}
