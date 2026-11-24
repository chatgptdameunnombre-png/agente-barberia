import * as THREE from 'three';
import { trocear, lejos } from './ligero.js?v=202611231951';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { letrero } from './ciudad.js?v=202611231951';
import { alturaCampo, lomas, dentroRegion, RANCHO, PARADOR, PERI, CAMINOS, ANCHO } from './sierradatos.js?v=202611231951';
import { VIENTO } from './ciudad.js?v=202611231951';

function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const _c = new THREE.Color();
function teñir(g, hex) { _c.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.index ? g.toNonIndexed() : g; }
const caja = (w, h, d, x, y, z, col, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); return teñir(g.translate(x, y, z), col); };
const cil = (r1, r2, h, x, y, z, col, seg = 10) => teñir(new THREE.CylinderGeometry(r1, r2, h, seg).translate(x, y, z), col);
function lienzo(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const libreCampo = (x, z, m = 6) => Math.max(Math.abs(x), Math.abs(z)) > PERI + 12 && !dentroRegion(x, z, m);

export class Campo {
  constructor(juego) {
    this.j = juego; this.r = rng(77123); this.L = []; this.vacas = []; this.molinos = [];
    const esc = juego.escena;
    this.terreno(esc);
    this.agaves(esc);
    this.milpas(esc);
    this.rancho(esc);
    this.parador(esc);
    this.torres(esc);
    this.espectaculares(esc);
    this.rocas(esc);
    this.orilla(esc);
    const m = new THREE.Mesh(mergeGeometries(this.L), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })); m.castShadow = m.receiveShadow = true; esc.add(m);
  }

  terreno(esc) {
    const T = 1500, n = 150, g = new THREE.PlaneGeometry(T, T, n, n).rotateX(-Math.PI / 2), P = g.attributes.position, col = new Float32Array(P.count * 3), r = this.r;
    const p1 = new THREE.Color('#5d8240'), p2 = new THREE.Color('#84964a'), seco = new THREE.Color('#b29c5e'), tierra = new THREE.Color('#8c6c4a'), oscuro = new THREE.Color('#46683a'), t = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), m = Math.max(Math.abs(x), Math.abs(z));
      const h = m < 334 ? -0.6 : alturaCampo(x, z);
      P.setY(i, h + 0.035);
      const l = lomas(x * 1.7 + 50, z * 1.7);
      const l2 = lomas(x * 4.3 - 90, z * 4.3 + 40), l3 = lomas(x * 0.6 + 300, z * 0.6 - 120);
      t.copy(p1).lerp(p2, l).lerp(oscuro, Math.max(0, l3 - 0.42) * 1.6).lerp(seco, Math.min(0.85, Math.max(0, h / 30 - 0.1) + (l > 0.62 ? 0.3 : 0) + Math.max(0, l2 - 0.55) * 0.9)).lerp(tierra, r() < 0.05 ? 0.55 : 0).multiplyScalar(0.9 + r() * 0.16);
      col.set([t.r, t.g, t.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const tx = lienzo(256, 256, (x, w, h) => { x.fillStyle = '#b4b4b4'; x.fillRect(0, 0, w, h); for (let k = 0; k < 60; k++) { const v = 130 + Math.random() * 90 | 0; x.fillStyle = `rgba(${v},${v},${v},0.35)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 26, 0, 7); x.fill(); } for (let k = 0; k < 14000; k++) { const v = 95 + Math.random() * 160 | 0; x.fillStyle = `rgba(${v},${v + 6},${v - 8},0.6)`; x.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 5); } });
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(T / 7, T / 7); tx.colorSpace = THREE.NoColorSpace;
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: tx, roughness: 1 })); m.receiveShadow = true; esc.add(m); this.suelo = m;
  }

  orilla(esc) {
    const r = this.r, pasto = [], mata = [], flor = [];
    const poner = (x, z) => {
      if (Math.max(Math.abs(x), Math.abs(z)) < 337 || dentroRegion(x, z, 0.6)) return;
      const k = r(); (k < 0.1 ? mata : k < 0.24 ? flor : pasto).push([x, z]);
    };
    for (const C of CAMINOS) for (let i = 0; i + 1 < C.pts.length; i++) {
      const [ax, az] = C.pts[i], [bx, bz] = C.pts[i + 1], L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L, nz = (bx - ax) / L;
      for (let d = 0; d < L; d += 1.2) for (const s of [-1, 1]) for (let q = 0; q < 2; q++) { const o = ANCHO / 2 + 2.6 + Math.pow(r(), 1.7) * 34, u = d + r() * 1.5; poner(ax + (bx - ax) * u / L + nx * o * s, az + (bz - az) * u / L + nz * o * s); }
    }
    const tp = lienzo(128, 64, (x, w, h) => { x.clearRect(0, 0, w, h); for (let k = 0; k < 70; k++) { const bx = 6 + Math.random() * (w - 12), alto = 18 + Math.random() * 44, inc = (Math.random() - 0.5) * 22, v = Math.random(); x.strokeStyle = `rgb(${104 + v * 70 | 0},${150 + v * 62 | 0},${62 + v * 40 | 0})`; x.lineWidth = 1.5 + Math.random() * 2; x.beginPath(); x.moveTo(bx, h); x.quadraticCurveTo(bx + inc * 0.3, h - alto * 0.6, bx + inc, h - alto); x.stroke(); } });
    const tf = lienzo(128, 64, (x, w, h) => { x.clearRect(0, 0, w, h); for (let k = 0; k < 34; k++) { const bx = 8 + Math.random() * (w - 16), alto = 20 + Math.random() * 36; x.strokeStyle = '#5f8a3e'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(bx, h); x.lineTo(bx + (Math.random() - 0.5) * 8, h - alto); x.stroke(); x.fillStyle = ['#f2c431', '#f2c431', '#ffffff', '#c890ff', '#ff9a3a'][Math.random() * 5 | 0]; x.beginPath(); x.arc(bx, h - alto, 2.6 + Math.random() * 2.2, 0, 7); x.fill(); } });
    const cruz = () => mergeGeometries([0, 1, 2].map(k => new THREE.PlaneGeometry(1.5, 0.75).translate(0, 0.375, 0).rotateY(k * Math.PI / 3)));
    const viento = m => { m.onBeforeCompile = sh => { sh.uniforms.tiempo = VIENTO; sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vec4 ipv = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n  transformed.x += sin(tiempo * 1.7 + ipv.x * 0.35 + ipv.z * 0.21) * 0.11 * position.y;\n  transformed.z += cos(tiempo * 1.3 + ipv.x * 0.18) * 0.07 * position.y;'); }; return m; };
    const o = new THREE.Object3D();
    const sembrar = (lista, geo, mat, esc0, alto, colores) => {
      if (!lista.length) return;
      const im = new THREE.InstancedMesh(geo, mat, lista.length);
      lista.forEach(([x, z], i) => { const e = esc0 * (0.7 + r() * 0.75); o.position.set(x, alturaCampo(x, z) + alto, z); o.rotation.set(0, r() * 6.28, 0); o.scale.set(e, e * (0.8 + r() * 0.5), e); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, _c.set(colores[r() * colores.length | 0]).multiplyScalar(0.85 + r() * 0.3)); });
      im.instanceColor.needsUpdate = true; im.castShadow = false; im.receiveShadow = true; esc.add(im);
      lejos(trocear(im, 80), 135);
    };
    sembrar(pasto, cruz(), viento(new THREE.MeshLambertMaterial({ map: tp, alphaTest: 0.42, side: THREE.DoubleSide })), 1, -0.03, ['#ffffff', '#e8f0c8', '#f2e2a8', '#d8e8b8']);
    sembrar(flor, cruz(), viento(new THREE.MeshLambertMaterial({ map: tf, alphaTest: 0.42, side: THREE.DoubleSide })), 0.9, -0.03, ['#ffffff']);
    sembrar(mata, mergeGeometries([new THREE.SphereGeometry(0.62, 9, 7).scale(1, 0.74, 1).translate(0, 0.38, 0), new THREE.SphereGeometry(0.45, 8, 6).scale(1, 0.8, 1).translate(0.48, 0.3, 0.2), new THREE.SphereGeometry(0.4, 8, 6).scale(1, 0.8, 1).translate(-0.4, 0.27, -0.3)]), new THREE.MeshLambertMaterial({ color: '#ffffff' }), 1.1, 0, ['#5f8a44', '#6a944a', '#7a9a44', '#4f7a3a', '#8a9a50']);
    this.nOrilla = pasto.length + flor.length + mata.length;
  }

  campoFilas(x0, z0, x1, z1, paso, f) { for (let x = x0; x <= x1; x += paso) for (let z = z0; z <= z1; z += paso * 1.6) { const px = x + (this.r() - 0.5) * 0.6, pz = z + (this.r() - 0.5) * 0.6; if (libreCampo(px, pz)) f(px, pz); } }

  agaves(esc) {
    const hojas = [], N = 7;
    for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2, h = new THREE.ConeGeometry(0.14, 1.5, 3, 1, true).translate(0, 0.75, 0).rotateZ(0.95).rotateY(a); hojas.push(h); }
    hojas.push(new THREE.ConeGeometry(0.12, 1.4, 3, 1, true).translate(0, 0.7, 0));
    const geo = mergeGeometries(hojas.map(g => g.toNonIndexed()));
    const pos = [];
    for (const [x0, z0, x1, z1] of [[-640, -200, -400, -80], [-640, 100, -400, 260], [-260, -640, -40, -420], [60, -640, 300, -430], [-640, -420, -420, -300]]) this.campoFilas(x0, z0, x1, z1, 4.6, (x, z) => pos.push([x, z]));
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.82, side: THREE.DoubleSide }), pos.length), o = new THREE.Object3D();
    pos.forEach(([x, z], i) => { o.position.set(x, alturaCampo(x, z), z); o.rotation.set(0, this.r() * 6, 0); o.scale.setScalar(0.85 + this.r() * 0.4); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, _c.set('#5f8f88').offsetHSL((this.r() - 0.5) * 0.03, (this.r() - 0.5) * 0.08, (this.r() - 0.5) * 0.1)); });
    im.castShadow = false; im.instanceColor.needsUpdate = true; esc.add(im); this.nAgaves = pos.length; lejos(trocear(im, 110), 300);
  }

  milpas(esc) {
    const tx = lienzo(64, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#4f7a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(32, 128); x.lineTo(32, 10); x.stroke(); x.fillStyle = '#6a9a3a'; for (let k = 0; k < 7; k++) { const y = 110 - k * 14; x.beginPath(); x.ellipse(32 + (k % 2 ? 14 : -14), y, 16, 4, (k % 2 ? -0.5 : 0.5), 0, 7); x.fill(); } x.fillStyle = '#e8c86a'; x.fillRect(28, 0, 8, 14); });
    const g = mergeGeometries([new THREE.PlaneGeometry(1, 2.2).translate(0, 1.1, 0), new THREE.PlaneGeometry(1, 2.2).translate(0, 1.1, 0).rotateY(Math.PI / 2)]);
    const pos = [];
    for (const [x0, z0, x1, z1] of [[-620, 300, -470, 450], [160, -600, 280, -460], [-600, -600, -470, -470]]) this.campoFilas(x0, z0, x1, z1, 2.3, (x, z) => pos.push([x, z]));
    const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 }), pos.length), o = new THREE.Object3D();
    pos.forEach(([x, z], i) => { o.position.set(x, alturaCampo(x, z), z); o.rotation.set(0, this.r() * 6, 0); o.scale.setScalar(0.8 + this.r() * 0.4); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    esc.add(im); lejos(trocear(im, 110), 260);
  }

  rancho(esc) {
    const R = RANCHO, L = this.L, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2, j = this.j;
    const tierra = new THREE.MeshStandardMaterial({ color: '#a08a60', roughness: 1 });
    for (const [x0, z0, x1, z1] of [[-470, -40, -400, -14], [-456, 6, -420, 34], [-430, -48, -410, -30], [-480, 40, -440, 62]]) { const pp = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, 0.06, (z0 + z1) / 2), tierra); pp.receiveShadow = true; esc.add(pp); }
    const choca = (x0, z0, x1, z1, h) => j.mundo.agregar(x0, z0, x1, z1, h);
    L.push(caja(14, 4.2, 9, -455, 2.1, -25, '#e8d8b8'), teñir(new THREE.CylinderGeometry(0.01, 1, 1, 4).rotateY(Math.PI / 4).scale(11, 2.2, 7.4).translate(-455, 5.3, -25), '#a8482e'));
    L.push(caja(14.4, 0.3, 2.6, -455, 2.9, -19.2, '#7a5a3a')); for (let k = 0; k < 5; k++) L.push(cil(0.14, 0.16, 2.9, -461.5 + k * 3.2, 1.45, -18.2, '#6a4a2a', 8));
    L.push(caja(1.2, 2.2, 0.1, -455, 1.1, -20.45, '#5a3a22'));
    choca(-462, -29.5, -448, -20.5, 4.2);
    const l = letrero('RANCHO EL MEZQUITE', '#3a2a1a', '#f2d27a', 7, 1.1); l.position.set(-393.5, 4.4, 20); l.rotation.y = -Math.PI / 2; esc.add(l);
    L.push(cil(0.2, 0.22, 4.6, -393.5, 2.3, 15.5, '#5a3e28'), cil(0.2, 0.22, 4.6, -393.5, 2.3, 24.5, '#5a3e28'));
    const corral = [-440, 20, 26, 22];
    for (let k = 0; k <= 13; k++) { const t = k / 13; for (const [x, z] of [[corral[0] - corral[2] / 2 + corral[2] * t, corral[1] - corral[3] / 2], [corral[0] - corral[2] / 2 + corral[2] * t, corral[1] + corral[3] / 2]]) L.push(cil(0.09, 0.1, 1.5, x, 0.75, z, '#6a4a2a', 6)); }
    for (let k = 0; k <= 11; k++) { const t = k / 11; for (const x of [corral[0] - corral[2] / 2, corral[0] + corral[2] / 2]) L.push(cil(0.09, 0.1, 1.5, x, 0.75, corral[1] - corral[3] / 2 + corral[3] * t, '#6a4a2a', 6)); }
    for (const y of [0.6, 1.2]) { L.push(caja(corral[2], 0.08, 0.08, corral[0], y, corral[1] - corral[3] / 2, '#8a6a42'), caja(corral[2], 0.08, 0.08, corral[0], y, corral[1] + corral[3] / 2, '#8a6a42'), caja(0.08, 0.08, corral[3], corral[0] - corral[2] / 2, y, corral[1], '#8a6a42'), caja(0.08, 0.08, corral[3] - 6, corral[0] + corral[2] / 2, y, corral[1] + 3, '#8a6a42')); }
    choca(corral[0] - 13.2, 8.9, corral[0] + 13.2, 9.1, 1.5); choca(corral[0] - 13.2, 30.9, corral[0] + 13.2, 31.1, 1.5); choca(corral[0] - 13.1, 9, corral[0] - 12.9, 31, 1.5);
    L.push(cil(0.12, 0.12, 10, -470, 5, 50, '#8a8e94', 6), caja(0.5, 0.5, 2, -470, 10.2, 50, '#8a8e94')); for (const [a, b] of [[-471.5, 48.5], [-468.5, 48.5], [-471.5, 51.5], [-468.5, 51.5]]) L.push(cil(0.08, 0.1, 9, a, 4.5, b, '#8a8e94', 6));
    const mol = new THREE.Group(); mol.position.set(-470, 10.2, 51.1); for (let k = 0; k < 12; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.04).translate(0, 1.05, 0), new THREE.MeshStandardMaterial({ color: '#d8dce2', metalness: 0.6 })); p.rotation.z = k / 12 * Math.PI * 2; mol.add(p); } esc.add(mol); this.molinos.push(mol);
    L.push(cil(2.2, 2.2, 3, -450, 6.5, 52, '#c8ccd2', 16), cil(2.3, 2.3, 0.2, -450, 8.1, 52, '#8a8e94', 16)); for (const [a, b] of [[-451.5, 50.5], [-448.5, 50.5], [-451.5, 53.5], [-448.5, 53.5]]) L.push(cil(0.1, 0.1, 5, a, 2.5, b, '#6a4a2a', 6));
    L.push(caja(16, 7, 11, -420, 3.5, -38, '#d8c8a8'), caja(16.4, 0.5, 11.4, -420, 7.2, -38, '#5a3a22'), cil(0.6, 0.6, 9, -414, 8, -42, '#a8482e', 10));
    choca(-428, -43.5, -412, -32.5, 7);
    const t2 = letrero('TEQUILERA LA JACARANDA', '#2a4a6a', '#f2f2e8', 10, 1.2); t2.position.set(-420, 5.4, -32.3); esc.add(t2);
    for (let k = 0; k < 6; k++) L.push(cil(0.9, 0.9, 1.4, -432 + (k % 3) * 2, 0.7, -28 + Math.floor(k / 3) * 2.2, '#8a5a2a', 12));
    L.push(caja(2.4, 1.6, 4, -405, 1.2, 40, '#c8202e'), cil(0.9, 0.9, 0.6, -405.5, 0.9, 42, '#1a1a1e', 14), cil(0.9, 0.9, 0.6, -404.5, 0.9, 42, '#1a1a1e', 14), cil(0.55, 0.55, 0.4, -405, 0.55, 38.4, '#1a1a1e', 12), caja(1.2, 1.1, 1.2, -405, 2.4, 41, '#2a2a2e'));
    choca(-406.4, 37.8, -403.6, 42.4, 2);
    const cuerpo = new THREE.BoxGeometry(0.9, 0.9, 2).translate(0, 1.15, 0), cabeza = new THREE.BoxGeometry(0.5, 0.5, 0.6).translate(0, 1.4, 1.2), patas = [[-0.3, -0.7], [0.3, -0.7], [-0.3, 0.7], [0.3, 0.7]].map(([x, z]) => new THREE.BoxGeometry(0.18, 0.75, 0.18).translate(x, 0.37, z));
    const gv = mergeGeometries([cuerpo, cabeza, ...patas].map(g => g.toNonIndexed()));
    const N = 14; this.imVacas = new THREE.InstancedMesh(gv, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), N);
    for (let k = 0; k < N; k++) { const dentro = k < 8, x = dentro ? corral[0] - 10 + this.r() * 20 : -470 + this.r() * 60, z = dentro ? corral[1] - 8 + this.r() * 16 : -5 + this.r() * 8 + (k % 2 ? 60 : 0); this.vacas.push({ x, z, yaw: this.r() * 6, t: this.r() * 10, cx: x, cz: z }); this.imVacas.setColorAt(k, _c.set(['#2a2a2a', '#f2f2ee', '#8a5a3a', '#c8a888'][k % 4])); }
    esc.add(this.imVacas);
  }

  parador(esc) {
    const P = PARADOR, L = this.L, cx = (P.x0 + P.x1) / 2, cz = (P.z0 + P.z1) / 2, j = this.j;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(P.x1 - P.x0, P.z1 - P.z0).rotateX(-Math.PI / 2).translate(cx, 0.075, cz), new THREE.MeshStandardMaterial({ color: '#6a6a6e', roughness: 0.95 })); piso.receiveShadow = true; esc.add(piso);
    L.push(caja(P.x1 - P.x0, 0.04, 5, cx, 0.06, 6, '#6a6a6e'));
    L.push(caja(12, 3.6, 7, 410, 1.8, 33, '#f2ede4'), caja(13, 0.35, 8, 410, 3.75, 33, '#c8202e'));
    j.mundo.agregar(404, 29.5, 416, 36.5, 3.6);
    const l = letrero('FONDA LA CURVA · BIRRIA', '#c8202e', '#ffffff', 10, 1.1); l.position.set(410, 3.0, 29.4); l.rotation.y = Math.PI; esc.add(l);
    for (let k = 0; k < 4; k++) { const x = 386 + (k % 2) * 6, z = 26 + Math.floor(k / 2) * 5; L.push(cil(0.6, 0.6, 0.06, x, 0.78, z, '#e8e2d6', 14), cil(0.06, 0.06, 0.78, x, 0.39, z, '#3a3a3e', 6), cil(0.04, 0.04, 2.2, x, 1.2, z, '#c8ccd2', 6), teñir(new THREE.ConeGeometry(1.4, 0.6, 10).translate(x, 2.4, z), k % 2 ? '#c8202e' : '#f2c431')); }
    L.push(caja(8, 0.3, 3, 395, 4.2, 14, '#e8e8ec'), cil(0.15, 0.15, 4, 391.5, 2, 14, '#c8ccd2', 8), cil(0.15, 0.15, 4, 398.5, 2, 14, '#c8ccd2', 8), caja(1, 1.6, 0.6, 393, 0.8, 14, '#2a8a4a'), caja(1, 1.6, 0.6, 397, 0.8, 14, '#2a8a4a'));
    j.ciudad?.estacionados?.push({ x: 384, z: 36, yaw: Math.PI / 2, tipo: 'redilas', color: '#3a6a44' }, { x: 410, z: 22, yaw: 0, tipo: 'camioneta', color: '#c8c2b4' });
  }

  torres(esc) {
    const L = this.L, pts = [];
    for (let k = 0; k < 11; k++) { const x = -660 + k * 72, z = -520 + Math.sin(k * 0.7) * 30; if (!libreCampo(x, z, 8)) continue; pts.push([x, alturaCampo(x, z), z]); }
    for (const [x, y, z] of pts) {
      for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { const g = new THREE.CylinderGeometry(0.08, 0.12, 24, 4).rotateZ(-dx * 0.045).rotateX(dz * 0.045).translate(x + dx * 0.55, y + 12, z + dz * 0.55); L.push(teñir(g, '#8a8e94')); }
      for (let k = 0; k < 6; k++) L.push(caja(3.4 - k * 0.4, 0.12, 0.12, x, y + 3 + k * 3.6, z, '#8a8e94'));
      L.push(caja(10, 0.25, 0.3, x, y + 22, z, '#8a8e94'), caja(7, 0.25, 0.3, x, y + 18.5, z, '#8a8e94'));
    }
    const cab = [];
    for (let i = 0; i + 1 < pts.length; i++) for (const [dx, dy] of [[-4.8, 21.8], [4.8, 21.8], [-3.3, 18.3], [3.3, 18.3]]) {
      const a = pts[i], b = pts[i + 1], seg = 12, v = [];
      for (let k = 0; k <= seg; k++) { const t = k / seg; v.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t + 0 * dx, a[1] + dy + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 4, a[2] + (b[2] - a[2]) * t + dx)); }
      cab.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v), 12, 0.04, 3));
    }
    if (cab.length) { const m = new THREE.Mesh(mergeGeometries(cab), new THREE.MeshBasicMaterial({ color: '#2a2c30' })); esc.add(m); }
  }

  espectaculares(esc) {
    const ads = [['TEQUILA JACARANDA', 'El sabor de la sierra', '#1a3a5a', '#f2c431'], ['BIRRIA EL COMPA', 'Abierto 24 horas', '#c8202e', '#ffffff'], ['JACAGRAM', 'Comparte tu ciudad', '#5a2a8a', '#ffffff'], ['AEROPUERTO SJ', 'Vuela a donde quieras', '#10203a', '#7ae0ff'], ['TALLER DON CHUY', 'Si tiene motor, lo arreglamos', '#1c3f8f', '#f6c431'], ['CINE JACARANDA', 'Hoy: El último taco', '#1a0a14', '#ffcf5a'], ['ARENA JACARANDA', 'Lucha libre todos los viernes', '#7a1020', '#ffd23a'], ['CASA JACARANDA', 'Vive en San Isidro', '#1a1428', '#d9b3ff']];
    const L = this.L, s = PERI + 13, sitios = [[s, -160, -Math.PI / 2], [-s, 150, Math.PI / 2], [160, s, Math.PI], [-200, -s, 0], [-s, -200, Math.PI / 2], [200, -s, 0], [s, 230, -Math.PI / 2], [-160, s, Math.PI]];
    sitios.forEach(([x, z, ry], k) => {
      const [t1, t2, f, c] = ads[k % ads.length];
      const tx = lienzo(512, 192, (g, w, h) => { g.fillStyle = f; g.fillRect(0, 0, w, h); g.fillStyle = c; g.font = '900 64px Inter, Arial'; g.textAlign = 'center'; g.fillText(t1, w / 2, 92); g.font = '700 30px Inter, Arial'; g.fillStyle = '#ffffff'; g.fillText(t2, w / 2, 148); });
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.2), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: 0.05 }));
      panel.position.set(x, 9, z); panel.rotation.y = ry; esc.add(panel); (this.paneles = this.paneles || []).push(panel);
      L.push(caja(14.4, 5.6, 0.3, x - Math.sin(ry) * 0.2, 9, z - Math.cos(ry) * 0.2, '#3a3a3e', ry), cil(0.35, 0.45, 9, x - Math.sin(ry) * 0.6, 4.5, z - Math.cos(ry) * 0.6, '#5a5c60', 10));
    });
  }

  rocas(esc) {
    const pos = [];
    for (let k = 0; k < 340; k++) { const a = this.r() * Math.PI * 2, d = 380 + this.r() * 330, x = Math.cos(a) * d, z = Math.sin(a) * d; if (libreCampo(x, z, 8)) pos.push([x, z]); }
    const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#9a9284', roughness: 1, flatShading: true }), pos.length), o = new THREE.Object3D();
    pos.forEach(([x, z], i) => { const s = 0.4 + this.r() * 1.6; o.position.set(x, alturaCampo(x, z) + s * 0.25, z); o.rotation.set(this.r() * 3, this.r() * 3, this.r() * 3); o.scale.set(s * (0.8 + this.r() * 0.6), s * 0.6, s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.castShadow = false; esc.add(im); lejos(trocear(im, 220), 420);
  }

  actualizar(dt) {
    const t = performance.now() / 1000, n = this.j.ambiente.noche ?? 0;
    for (const m of this.molinos) m.rotation.z += dt * (1.2 + (this.j.clima?.fuerza || 0) * 4);
    for (const p of this.paneles || []) p.material.emissiveIntensity = 0.05 + n * 0.55;
    const jp = this.j.jugador.posicion;
    if (Math.hypot(jp.x + 440, jp.z - 20) > 300) return;
    const o = this._o || (this._o = new THREE.Object3D());
    this.vacas.forEach((v, i) => { v.t += dt; if (v.t > 6) { v.t = 0; v.meta = v.yaw + (Math.random() - 0.5) * 1.6; } if (v.meta !== undefined) v.yaw += (v.meta - v.yaw) * Math.min(1, dt); const pasea = (v.t > 3 && v.t < 5) ? 0.4 : 0; v.x += Math.sin(v.yaw) * pasea * dt; v.z += Math.cos(v.yaw) * pasea * dt; if (Math.hypot(v.x - v.cx, v.z - v.cz) > 6) v.yaw += Math.PI * dt; o.position.set(v.x, 0.05, v.z); o.rotation.set(0, v.yaw, 0); o.updateMatrix(); this.imVacas.setMatrixAt(i, o.matrix); });
    this.imVacas.instanceMatrix.needsUpdate = true;
  }
}
