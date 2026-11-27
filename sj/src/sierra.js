import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { letrero } from './ciudad.js?v=20261126192148';
import { Peaton } from './peatones.js?v=20261126192148';
import { CERRO, PISTA, HANGAR, PUEBLO, CASA, ANCHO, CAMINOS, MIRADOR, AERO, PERI, alturaCerro, dentroRegion, regresar } from './sierradatos.js?v=20261126192148';

function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function lienzo(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const _c = new THREE.Color();
function teñir(g, hex) { _c.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
const caja = (w, h, d, x, y, z, col, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); return teñir(g.translate(x, y, z), col); };
const cil = (r1, r2, h, x, y, z, col, seg = 10) => teñir(new THREE.CylinderGeometry(r1, r2, h, seg).translate(x, y, z), col);

export class Sierra {
  constructor(juego) {
    this.j = juego; this.r = rng(4242);
    const esc = juego.escena;
    this.texAsfalto = lienzo(128, 256, (g, w, h) => {
      g.fillStyle = '#3a3b3e'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '20,20,22' : '120,120,118'},${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      g.fillStyle = '#e8e6df'; g.fillRect(6, 0, 4, h); g.fillRect(w - 10, 0, 4, h);
      g.fillStyle = '#e8c23a'; g.fillRect(w / 2 - 5, 0, 3, h * 0.55); g.fillRect(w / 2 + 2, 0, 3, h * 0.55);
    });
    this.texAsfalto.wrapS = this.texAsfalto.wrapT = THREE.RepeatWrapping;
    this.matCamino = new THREE.MeshStandardMaterial({ map: this.texAsfalto, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    juego.ciudad?.matsSuelo?.push(this.matCamino);
    this.matVc = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    this.lisos = [];
    this.terreno(esc);
    this.caminos(esc);
    this.mirador();
    this.pueblo();
    this.aerodromo();
    this.casaLote();
    this.letreros(esc);
    const m = new THREE.Mesh(mergeGeometries(this.lisos.map(g => g.index ? g.toNonIndexed() : g)), this.matVc); m.castShadow = true; m.receiveShadow = true; esc.add(m); this.malla = m;
    const cabe = (x, z, r) => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; if (!dentroRegion(x + Math.cos(a) * r, z + Math.sin(a) * r, 0)) return false; } return true; };
    juego.mundo.fuera = (x, z, r) => dentroRegion(x, z, -r) || cabe(x, z, r) ? true : regresar(x, z, r);
    this.gente = [];
  }

  choca(x0, z0, x1, z1, h) { this.j.mundo.agregar(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), h); }

  terreno(esc) {
    const R = CERRO.r + 12, n = 120, g = new THREE.PlaneGeometry(R * 2, R * 2, n, n).rotateX(-Math.PI / 2);
    const P = g.attributes.position, col = new Float32Array(P.count * 3), r = this.r;
    const pasto = new THREE.Color('#6f8a46'), seco = new THREE.Color('#a39864'), roca = new THREE.Color('#8a8072'), t = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i) + CERRO.x, z = P.getZ(i) + CERRO.z, h = alturaCerro(x, z);
      P.setY(i, h + 0.05);
      const k = h / CERRO.h, ruido = r() * 0.12;
      t.copy(pasto).lerp(seco, Math.min(1, k * 1.1 + ruido)).lerp(roca, Math.max(0, (k - 0.75) * 2.2) * (0.6 + ruido * 3));
      col.set([t.r, t.g, t.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); g.translate(CERRO.x, 0, CERRO.z);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.receiveShadow = true; esc.add(m);
    const arb = [], rr = this.r;
    for (let k = 0; k < 160; k++) {
      const a = rr() * Math.PI * 2, d = 20 + rr() * (CERRO.r - 24), x = CERRO.x + Math.cos(a) * d, z = CERRO.z + Math.sin(a) * d;
      if (this.cercaCamino(x, z, 7)) continue;
      arb.push([x, alturaCerro(x, z), z, 0.7 + rr() * 0.8]);
    }
    const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 2.6, 6).translate(0, 1.3, 0), new THREE.MeshLambertMaterial({ color: '#5a3e28' }), arb.length);
    const co = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.9, 1), new THREE.MeshLambertMaterial({ color: '#ffffff' }), arb.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
    arb.forEach(([x, y, z, s], i) => { V.set(x, y, z); S.setScalar(s); M.compose(V, Q, S); tr.setMatrixAt(i, M); V.set(x, y + 2.7 * s + 1.1, z); S.set(s, s * 0.85, s); M.compose(V, Q, S); co.setMatrixAt(i, M); co.setColorAt(i, _c.set(['#5a7a32', '#6a7a3a', '#4a6a2a', '#7a7a42'][i % 4])); });
    co.instanceColor.needsUpdate = true; esc.add(tr, co);
  }

  cercaCamino(x, z, m) {
    for (const C of CAMINOS) for (let i = 0; i + 1 < C.pts.length; i++) {
      const [a, b] = [C.pts[i], C.pts[i + 1]], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      if (Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) < ANCHO / 2 + m) return true;
    }
    return false;
  }

  remuestrear(pts, paso = 3) {
    const out = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / paso));
      for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  caminos(esc) {
    const geos = [], postes = [];
    for (const C of CAMINOS) {
      const p = this.remuestrear(C.pts), pos = [], uv = [], idx = [];
      let v = 0;
      p.forEach((q, i) => {
        const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
        if (i) v += Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) / 12;
        for (const s of [-1, 1]) { const x = q[0] + nx * s * ANCHO / 2, z = q[1] + nz * s * ANCHO / 2; pos.push(x, alturaCerro(x, z) + 0.09, z); uv.push(s < 0 ? 0 : 1, v); }
        if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
        if (C.nombre === 'Subida al Mirador' && i % 3 === 0 && alturaCerro(q[0], q[1]) > 1.5 && Math.hypot(q[0] - MIRADOR.x, q[1] - MIRADOR.z) > 16) {
          const ox = q[0] - CERRO.x, oz = q[1] - CERRO.z, d = Math.hypot(ox, oz) || 1, s = Math.sign(nx * ox + nz * oz) || 1;
          const x = q[0] + nx * s * (ANCHO / 2 + 0.5), z = q[1] + nz * s * (ANCHO / 2 + 0.5);
          postes.push([x, alturaCerro(x, z), z, Math.atan2(dx, dz)]);
        }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      geos.push(g);
    }
    const disco = new THREE.CircleGeometry(ANCHO * 0.95, 24).rotateX(-Math.PI / 2).translate(440, 0.085, 0); const uvD = disco.attributes.uv; for (let i = 0; i < uvD.count; i++) uvD.setXY(i, 0.3, 0.8);
    geos.push(disco);
    const m = new THREE.Mesh(mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)), this.matCamino); m.receiveShadow = true; esc.add(m);
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.8, 0.12).translate(0, 0.4, 0), new THREE.MeshStandardMaterial({ color: '#8a8e94', metalness: 0.6, roughness: 0.4 }), postes.length);
    const riel = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.3, 9.3).translate(0, 0.62, 0), new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.8, roughness: 0.3 }), postes.length);
    const o = new THREE.Object3D();
    postes.forEach(([x, y, z, a], i) => { o.position.set(x, y, z); o.rotation.set(0, a, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); riel.setMatrixAt(i, o.matrix); });
    esc.add(im, riel);
  }

  mirador() {
    const { x, z } = MIRADOR, y = alturaCerro(x, z), L = this.lisos;
    L.push(cil(13, 13.5, 0.5, x, y + 0.05, z, '#b8ad98', 32));
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; if (Math.abs(Math.sin(a - Math.atan2(-z, -x))) < 0.25 && Math.cos(a - Math.atan2(-z, -x)) < 0) continue; L.push(cil(0.07, 0.07, 1.0, x + Math.cos(a) * 12.8, y + 0.8, z + Math.sin(a) * 12.8, '#3a3a3e', 6)); }
    const tubo = new THREE.TorusGeometry(12.8, 0.05, 6, 64).rotateX(Math.PI / 2).translate(x, y + 1.3, z); L.push(teñir(tubo, '#3a3a3e'));
    const ac = Math.atan2(-z, -x);
    for (const da of [-0.35, 0, 0.35]) {
      const bx = x + Math.cos(ac + da) * 9.5, bz = z + Math.sin(ac + da) * 9.5, ry = -(ac + da) + Math.PI / 2;
      L.push(caja(2.2, 0.08, 0.6, bx, y + 0.75, bz, '#7a5a3a', ry), caja(0.1, 0.45, 0.5, bx + Math.cos(ry) * 0.9, y + 0.5, bz - Math.sin(ry) * 0.9, '#2a2a2e', ry), caja(0.1, 0.45, 0.5, bx - Math.cos(ry) * 0.9, y + 0.5, bz + Math.sin(ry) * 0.9, '#2a2a2e', ry));
    }
    for (const da of [-0.7, 0.7]) { const bx = x + Math.cos(ac + da) * 11.5, bz = z + Math.sin(ac + da) * 11.5; L.push(cil(0.08, 0.12, 1.1, bx, y + 0.8, bz, '#2a3a5a', 8), caja(0.5, 0.22, 0.28, bx, y + 1.45, bz, '#2a3a5a', -(ac + da))); }
    const l = letrero('MIRADOR DE LA SIERRA', '#2a1a0e', '#f2d27a', 5, 0.9); l.position.set(x - Math.cos(ac) * 11, y + 3, z - Math.sin(ac) * 11); l.rotation.y = Math.atan2(Math.cos(ac), Math.sin(ac)); this.j.escena.add(l);
    L.push(cil(0.12, 0.14, 2.4, x - Math.cos(ac) * 11 - 2, y + 1.3, z - Math.sin(ac) * 11, '#3a2a1a', 8), cil(0.12, 0.14, 2.4, x - Math.cos(ac) * 11 + 2, y + 1.3, z - Math.sin(ac) * 11, '#3a2a1a', 8));
    this.miradorY = y;
  }

  casa(x, z, w, d, h, col, ry = 0, puerta = '#5a3a22') {
    const L = this.lisos;
    L.push(caja(w, h, d, x, h / 2, z, col, ry));
    const techo = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1).rotateY(Math.PI / 4).scale(w * 0.78, h * 0.32, d * 0.78); techo.translate(x, h + h * 0.16, z); if (ry) { techo.translate(-x, 0, -z); techo.rotateY(ry); techo.translate(x, 0, z); }
    L.push(teñir(techo, '#a8482e'));
    const fx = Math.sin(ry), fz = Math.cos(ry);
    L.push(caja(1.2, 2.2, 0.08, x + fx * (d / 2 + 0.03), 1.1, z + fz * (d / 2 + 0.03), puerta, ry));
    for (const s of [-1, 1]) L.push(caja(1.0, 1.0, 0.06, x + fx * (d / 2 + 0.03) + Math.cos(ry) * s * w * 0.3, 1.8, z + fz * (d / 2 + 0.03) - Math.sin(ry) * s * w * 0.3, '#2a3442', ry));
    const hw = (Math.abs(Math.cos(ry)) * w + Math.abs(Math.sin(ry)) * d) / 2, hd = (Math.abs(Math.sin(ry)) * w + Math.abs(Math.cos(ry)) * d) / 2;
    this.choca(x - hw, z - hd, x + hw, z + hd, h + 1);
  }

  pueblo() {
    const L = this.lisos, P = PUEBLO, cx = 440, r = this.r, esc = this.j.escena, pz = 119, pr = 15;
    for (const [z0, z1] of [[P.z0, pz - pr], [pz + pr, P.z1]]) {
      const calle = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, z1 - z0).rotateX(-Math.PI / 2).translate(cx, 0.08, (z0 + z1) / 2), this.matCamino); esc.add(calle);
      for (const sx of [-1, 1]) L.push(caja(2.2, 0.16, z1 - z0, cx + sx * (ANCHO / 2 + 1.1), 0.08, (z0 + z1) / 2, '#cfc6b4'));
    }
    const piedra = lienzo(256, 256, (g, w, h) => { g.fillStyle = '#a89c88'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) { g.fillStyle = `hsl(32, 14%, ${46 + r() * 16}%)`; g.beginPath(); g.ellipse(x + 8, y + 8, 7, 6.5, 0, 0, 7); g.fill(); } });
    piedra.wrapS = piedra.wrapT = THREE.RepeatWrapping; piedra.repeat.set(6, 6);
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(pr * 2, pr * 2).rotateX(-Math.PI / 2).translate(cx, 0.1, pz), new THREE.MeshStandardMaterial({ map: piedra, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -3 }));
    plaza.receiveShadow = true; esc.add(plaza);
    L.push(cil(2.4, 2.6, 0.7, cx, 0.45, pz, '#b0a690', 20), cil(2.1, 2.1, 0.08, cx, 0.82, pz, '#4a7a9a', 20), cil(0.25, 0.3, 1.6, cx, 1.4, pz, '#b0a690', 10), cil(0.8, 0.6, 0.18, cx, 2.15, pz, '#b0a690', 16));
    this.choca(cx - 2.5, pz - 2.5, cx + 2.5, pz + 2.5, 1.2);
    for (const [x, z] of [[cx - 11, pz - 11], [cx + 11, pz + 11], [cx - 11, pz + 11], [cx + 11, pz - 11]]) { L.push(cil(0.2, 0.3, 2.6, x, 1.3, z, '#5a3e28', 6)); L.push(teñir(new THREE.IcosahedronGeometry(2.3, 1).translate(x, 3.7, z), '#5a8a3a')); this.choca(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 3); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.39, bx = cx + Math.cos(a) * 7.5, bz = pz + Math.sin(a) * 7.5, ry = -a + Math.PI / 2; L.push(caja(1.8, 0.08, 0.5, bx, 0.48, bz, '#6a4a2a', ry), caja(1.6, 0.42, 0.1, bx, 0.25, bz, '#3a2a1a', ry)); }
    const cols = ['#e8b888', '#d88484', '#9cbcd8', '#ecd08e', '#acc8a0', '#e8a8b0', '#bca6d0', '#f2ede4', '#e0a070', '#8cc4be'];
    const nombres = [['TIENDA DOÑA CUCA', '#1c3f8f', '#ffffff'], ['CANTINA LA ÚLTIMA PARADA', '#3a1a0e', '#ffb347'], ['TALLER EL GÜERO', '#2a2a2e', '#f6c431'], ['TORTILLERÍA SAN ISIDRO', '#7a2a1a', '#ffe8c8'], ['FARMACIA DEL PUEBLO', '#0a5a3a', '#ffffff'], ['PANADERÍA LA ESPIGA', '#6a3a1a', '#ffe0a0']];
    let n = 0;
    for (const sx of [-1, 1]) {
      const d = 9, x = cx + sx * (ANCHO / 2 + 2.2 + d / 2), ry = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      for (let z = P.z0 + 7; z < P.z1 - 5; z += 11) {
        if (Math.abs(z - pz) < pr + 4 && Math.abs(x - cx) < pr + d) continue;
        const h = 3.8 + r() * 2.4;
        this.casa(x, z, 10.6, d, h, cols[n % cols.length], ry);
        if (n % 2 === 0 && n / 2 < nombres.length) { const [t, f, c] = nombres[n / 2]; const l = letrero(t, f, c, 8.5, 0.85); l.position.set(x - sx * (d / 2 + 0.08), h - 0.55, z); l.rotation.y = ry; esc.add(l); }
        n++;
      }
    }
    for (const [x, z, sx] of [[cx - pr - 5.5, pz, -1], [cx + pr + 5.5, pz, 1]]) {
      const ry = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      this.casa(x, z - 5.5, 10.6, 9, 5.5, '#f2ede4', ry); this.casa(x, z + 5.5, 10.6, 9, 4.6, '#e8b888', ry);
      for (let k = -2; k <= 2; k++) L.push(cil(0.18, 0.18, 3, x - sx * 5.6, 1.5, z + k * 4, '#f2ede4', 8));
      L.push(caja(1.6, 0.2, 21, x - sx * 5.6, 3.1, z, '#a8482e'));
    }
    const l = letrero('BIENVENIDOS A SAN ISIDRO', '#1a3a1a', '#f2f2e8', 6, 0.9); l.position.set(cx + 7.5, 3.2, P.z0 + 1); l.rotation.y = Math.PI; esc.add(l);
    L.push(cil(0.12, 0.14, 3, cx + 4.6, 1.5, P.z0 + 1, '#3a2a1a', 8), cil(0.12, 0.14, 3, cx + 10.4, 1.5, P.z0 + 1, '#3a2a1a', 8));
    this.plazaPueblo = { x: cx, z: pz };
  }

  aerodromo() {
    const P = PISTA, L = this.lisos, esc = this.j.escena, cx = (P.x0 + P.x1) / 2;
    const tex = lienzo(128, 512, (g, w, h) => {
      g.fillStyle = '#2e2f33'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '15,15,18' : '110,110,112'},${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = '#eceae2'; for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 3, y + 8, 6, 34);
      g.fillRect(4, 0, 4, h); g.fillRect(w - 8, 0, 4, h);
    });
    tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, (P.z1 - P.z0) / 60);
    const pista = new THREE.Mesh(new THREE.PlaneGeometry(P.x1 - P.x0 - 4, P.z1 - P.z0).rotateX(-Math.PI / 2).translate(cx, 0.08, (P.z0 + P.z1) / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1 }));
    pista.receiveShadow = true; esc.add(pista);
    for (const [z, s] of [[P.z0 + 8, 1], [P.z1 - 8, -1]]) {
      for (let k = -3; k <= 3; k++) L.push(caja(1.2, 0.02, 14, cx + k * 4.2, 0.1, z + s * 6, '#eceae2'));
      const num = letrero(s > 0 ? '36' : '18', '#2e2f33', '#eceae2', 6, 3); num.rotation.x = -Math.PI / 2; num.rotation.z = s > 0 ? Math.PI : 0; num.position.set(cx, 0.11, z + s * 22); esc.add(num);
    }
    const H = HANGAR, hx = 618, hz = -22;
    const arco = new THREE.CylinderGeometry(18, 18, 34, 20, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).scale(1, 0.52, 1).translate(hx, 0, hz);
    L.push(teñir(arco, '#b8bec6'));
    L.push(caja(36, 9.3, 0.3, hx, 4.65, hz - 17, '#9aa0a8'));
    L.push(caja(0.3, 9.3, 34, hx + 17.9, 4.65, hz, '#9aa0a8'));
    this.choca(hx - 18, hz - 17.5, hx + 18, hz - 16.5, 9); this.choca(hx + 17.5, hz - 17, hx + 18.5, hz + 17, 9);
    const l = letrero('AERÓDROMO JACARANDA', '#10203a', '#f2f4f8', 12, 1.4); l.position.set(hx - 18.1, 7.6, hz); l.rotation.y = -Math.PI / 2; esc.add(l);
    L.push(cil(0.2, 0.25, 14, 600, 7, 36, '#e8e8ec', 8), caja(3.2, 2.6, 3.2, 600, 14.6, 36, '#e8e8ec'), caja(3.4, 1.2, 3.4, 600, 13.6, 36, '#1a2a3a'), caja(0.4, 3, 0.4, 600, 1.5, 36, '#e8e8ec'));
    this.choca(598.5, 34.5, 601.5, 37.5, 16);
    const hp = new THREE.CircleGeometry(8, 32).rotateX(-Math.PI / 2).translate(612, 0.09, 20); L.push(teñir(hp, '#3a3c40'));
    L.push(teñir(new THREE.RingGeometry(7, 7.5, 32).rotateX(-Math.PI / 2).translate(612, 0.1, 20), '#f2d23a'));
    L.push(caja(0.8, 0.02, 5, 610.2, 0.11, 20, '#f2f4f8'), caja(0.8, 0.02, 5, 613.8, 0.11, 20, '#f2f4f8'), caja(2.8, 0.02, 0.8, 612, 0.11, 20, '#f2f4f8'));
    this.heliPad = { x: 612, z: 20 };
    const manga = new THREE.Group(); manga.position.set(590, 0, 62);
    const mp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6, 6).translate(0, 3, 0), new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.6 })); manga.add(mp);
    const tela = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.2, 2.4, 10, 1, true).rotateZ(Math.PI / 2).translate(1.2, 0, 0), new THREE.MeshStandardMaterial({ color: '#ff6a1a', side: THREE.DoubleSide, roughness: 0.8 }));
    tela.position.y = 5.8; manga.add(tela); esc.add(manga); this.manga = tela;
    this.avionBase = { x: cx, z: P.z1 - 22, yaw: Math.PI };
  }

  casaLote() {
    const C = CASA, L = this.lisos, esc = this.j.escena;
    const pasto = new THREE.Mesh(new THREE.PlaneGeometry(C.x1 - C.x0, C.z1 - C.z0).rotateX(-Math.PI / 2).translate((C.x0 + C.x1) / 2, 0.07, (C.z0 + C.z1) / 2), new THREE.MeshStandardMaterial({ color: '#5f8a3e', roughness: 1 }));
    pasto.receiveShadow = true; esc.add(pasto);
    L.push(caja(ANCHO, 0.04, 30, 440, 0.09, C.z0 + 15, '#5a5c60'));
    for (const [x0, x1] of [[C.x0, 434], [446, C.x1]]) { L.push(caja(x1 - x0, 1.6, 0.35, (x0 + x1) / 2, 0.8, C.z0, '#e8dcc8')); this.choca(x0, C.z0 - 0.2, x1, C.z0 + 0.2, 1.6); }
    L.push(caja(0.35, 1.6, C.z1 - C.z0, C.x0, 0.8, (C.z0 + C.z1) / 2, '#e8dcc8'), caja(0.35, 1.6, C.z1 - C.z0, C.x1, 0.8, (C.z0 + C.z1) / 2, '#e8dcc8'), caja(C.x1 - C.x0, 1.6, 0.35, (C.x0 + C.x1) / 2, 0.8, C.z1, '#e8dcc8'));
    this.choca(C.x0 - 0.2, C.z0, C.x0 + 0.2, C.z1, 1.6); this.choca(C.x1 - 0.2, C.z0, C.x1 + 0.2, C.z1, 1.6); this.choca(C.x0, C.z1 - 0.2, C.x1, C.z1 + 0.2, 1.6);
    this.casaLugar = { x: 440, z: 248, puerta: { x: 440, z: 236.5 } };
  }

  letreros(esc) {
    for (const [x, z, ry, t] of [[-6, -PERI + 12, 0, 'PERIFÉRICO · SIERRA · AEROPUERTO'], [6, PERI - 12, Math.PI, 'AEROPUERTO INTERNACIONAL'], [-PERI + 12, 6, Math.PI / 2, 'PERIFÉRICO · AEROPUERTO · SIERRA']]) { const l = letrero(t, '#0f5a2a', '#ffffff', 7, 1.2); l.position.set(x, 5.2, z); l.rotation.y = ry; esc.add(l); }
    const s = letrero('SAN ISIDRO · AERÓDROMO · MIRADOR', '#0f5a2a', '#ffffff', 7, 1.2); s.position.set(350, 5.2, 0); s.rotation.y = -Math.PI / 2; esc.add(s);
    this.lisos.push(cil(0.14, 0.16, 5.6, 350, 2.8, -3.8, '#8a8e94', 8), cil(0.14, 0.16, 5.6, 350, 2.8, 3.8, '#8a8e94', 8), caja(0.12, 0.2, 7.8, 350, 4.5, 0, '#8a8e94'));
  }

  altura(x, z) { return alturaCerro(x, z); }

  dibujarMapa(g, S, grueso = 6) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const rect = (R, c) => { const [a, b] = S(R.x0, R.z0), [e, f] = S(R.x1, R.z1); g.fillStyle = c; g.fillRect(a, b, e - a, f - b); };
    const [cx, cz] = S(CERRO.x, CERRO.z), [ex] = S(CERRO.x + CERRO.r, CERRO.z); const rad = Math.abs(ex - cx);
    const gr = g.createRadialGradient(cx, cz, 0, cx, cz, rad); gr.addColorStop(0, '#9a8c6a'); gr.addColorStop(1, 'rgba(90,120,60,0.35)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cz, rad, 0, 7); g.fill();
    rect(PUEBLO, '#c8b088'); rect(CASA, '#6a9a4a'); rect(PISTA, '#3a3c40'); rect(HANGAR, '#8a9098');
    rect({ x0: AERO.ax0, x1: AERO.ax1, z0: AERO.az0, z1: AERO.az1 }, 'rgba(150,150,145,0.9)'); rect({ x0: AERO.tx0, x1: AERO.tx1, z0: AERO.tz0, z1: AERO.tz1 }, 'rgba(190,186,178,0.9)'); rect(AERO.pista, '#2c2d31'); rect({ x0: -110, x1: 110, z0: 394, z1: 416 }, '#e8e8ec');
    for (const C of CAMINOS) { g.beginPath(); C.pts.forEach((p, i) => { const [x, y] = S(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = grueso + 3; g.stroke(); g.strokeStyle = '#d8d4cc'; g.lineWidth = grueso; g.stroke(); }
    g.restore();
  }

  poblar() {
    if (this.gente.length) return;
    const j = this.j, P = this.plazaPueblo;
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2, p = new Peaton(j, { tipo: 'civil', x: P.x + Math.cos(a) * 10.5, z: P.z + Math.sin(a) * 10.5, estado: 'quieto' });
      p.fila = true; p.ruta = null; p.proxBanca = p.proxCharla = 1e9; p.yaw = a + Math.PI; j.peatones.push(p); this.gente.push(p);
    }
    for (let k = 0; k + 1 < this.gente.length; k += 2) { const a = this.gente[k], b = this.gente[k + 1]; a.estado = b.estado = 'charla'; a.con = b; b.con = a; a.charlaT = b.charlaT = 1e9; }
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    if (this.manga) { const t = performance.now() / 1000; this.manga.parent.rotation.y = Math.sin(t * 0.13) * 0.6 - 0.4; this.manga.rotation.z = Math.sin(t * 2.3) * 0.08 - (j.clima?.fuerza || 0) * 0.1; }
    const d = Math.hypot(jp.x - this.plazaPueblo.x, jp.z - this.plazaPueblo.z);
    if (d < 150 && !this.gente.length) this.poblar();
    else if (d > 230 && this.gente.length) { for (const p of this.gente) { const i = j.peatones.indexOf(p); if (i >= 0) { p.quitar(); j.peatones.splice(i, 1); } } this.gente = []; }
  }
}
