import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hoja } from './texturas.js?v=202611220212';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cap = (r, l, y = 0) => { const g = new THREE.CapsuleGeometry(r, l, 3, 10); g.translate(0, y, 0); return g; };
const G = {
  pelvis: new RoundedBoxGeometry(0.36, 0.2, 0.22, 2, 0.07),
  pecho: new RoundedBoxGeometry(0.4, 0.5, 0.23, 3, 0.09),
  cuello: new THREE.CylinderGeometry(0.055, 0.06, 0.1, 10),
  cabeza: new RoundedBoxGeometry(0.25, 0.29, 0.26, 3, 0.075),
  muslo: cap(0.085, 0.3, -0.21),
  espinilla: cap(0.068, 0.3, -0.2),
  pie: new RoundedBoxGeometry(0.12, 0.08, 0.24, 2, 0.035),
  brazo: cap(0.062, 0.18, -0.13),
  antebrazo: cap(0.054, 0.17, -0.12),
  mano: new THREE.SphereGeometry(0.058, 10, 8),
  peloCorto: new THREE.SphereGeometry(0.148, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
  peloLargo: new RoundedBoxGeometry(0.27, 0.36, 0.09, 2, 0.04),
  chongo: new THREE.SphereGeometry(0.085, 10, 8),
  gorra: new THREE.SphereGeometry(0.152, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
  visera: new RoundedBoxGeometry(0.22, 0.025, 0.14, 1, 0.01),
  ala: new THREE.CylinderGeometry(0.36, 0.38, 0.025, 20),
  copa: new THREE.CylinderGeometry(0.12, 0.15, 0.18, 14),
  falda: new THREE.CylinderGeometry(0.19, 0.31, 0.44, 12, 1, true),
  chamarra: new RoundedBoxGeometry(0.44, 0.52, 0.26, 3, 0.1),
  pistola: new THREE.BoxGeometry(0.055, 0.1, 0.24),
  escopeta: new THREE.BoxGeometry(0.06, 0.1, 0.85),
  culata: new THREE.BoxGeometry(0.07, 0.14, 0.26),
  bate: new THREE.CylinderGeometry(0.05, 0.028, 0.9, 10),
  granada: new THREE.SphereGeometry(0.085, 10, 8),
  subfusil: new THREE.BoxGeometry(0.06, 0.14, 0.46),
  cuchillo: new THREE.BoxGeometry(0.025, 0.05, 0.32),
  rifle: new THREE.BoxGeometry(0.06, 0.12, 0.92),
  cargador: new THREE.BoxGeometry(0.045, 0.18, 0.09)
};
G.pie.translate(0, -0.4, 0.05);
G.pistola.translate(0, -0.03, 0.1);
G.subfusil.translate(0, -0.03, 0.14);
G.escopeta.translate(0, -0.03, 0.26);
G.culata.translate(0, -0.06, -0.14);
G.bate.rotateX(Math.PI / 2); G.bate.translate(0, 0, 0.42);
G.granada.translate(0, -0.04, 0.03);
G.cuchillo.translate(0, -0.02, 0.17);
G.rifle.translate(0, -0.03, 0.28);
G.cargador.translate(0, -0.14, 0.32);
G.peloLargo.translate(0, -0.06, -0.1);

const ni = g => g.index ? g.toNonIndexed() : g;
const unir = (...gs) => mergeGeometries(gs.map(ni));
const mover = (g, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => { if (sx !== 1 || sy !== 1 || sz !== 1) g.scale(sx, sy, sz); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz); g.translate(x, y, z); return g; };
const esf = (r, ws = 14, hs = 10, a = 0, b = Math.PI * 2, c = 0, d = Math.PI) => new THREE.SphereGeometry(r, ws, hs, a, b, c, d);
const cono = (r1, r2, h, y) => mover(new THREE.CylinderGeometry(r1, r2, h, 12, 1), 0, y, 0);
const CR = [0.86, 1, 1], CY = 0.17;
const casco = (r, t0, t1, y = CY, z = -0.004, sx = 0.9) => mover(esf(r, 22, 12, 0, Math.PI * 2, t0, t1), 0, y, z, sx, 1, 1.02);
const nuca = (r, t0, t1) => mover(esf(r, 18, 10, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, t0, t1), 0, CY, -0.003, 0.9, 1, 1.02);
const R = {
  craneo: unir(mover(esf(0.1, 22, 16), 0, CY, 0, ...CR), mover(esf(0.083, 18, 12), 0, 0.108, 0.018, 0.84, 1.08, 0.95), mover(esf(0.03, 10, 8), 0, 0.045, 0.062, 1.15, 0.8, 0.9),
    mover(esf(0.022, 8, 6), 0.084, 0.138, -0.004, 0.42, 1, 0.75), mover(esf(0.022, 8, 6), -0.084, 0.138, -0.004, 0.42, 1, 0.75),
    mover(esf(0.019, 10, 8), 0, 0.124, 0.098, 0.6, 1.25, 0.95), mover(esf(0.012, 8, 6), 0, 0.106, 0.112, 1.2, 0.7, 0.8),
    mover(esf(0.024, 10, 8), 0.037, 0.165, 0.082, 1.2, 0.55, 0.7), mover(esf(0.024, 10, 8), -0.037, 0.165, 0.082, 1.2, 0.55, 0.7),
    mover(esf(0.0128, 10, 6, 0, Math.PI * 2, 0, 1.25), 0.034, 0.1505, 0.0858, 1.18, 0.72, 0.85), mover(esf(0.0128, 10, 6, 0, Math.PI * 2, 0, 1.25), -0.034, 0.1505, 0.0858, 1.18, 0.72, 0.85)),
  ojos: unir(mover(esf(0.0115, 10, 8), 0.034, 0.149, 0.085, 1.15, 0.68, 0.8), mover(esf(0.0115, 10, 8), -0.034, 0.149, 0.085, 1.15, 0.68, 0.8)),
  iris: unir(mover(esf(0.0072, 10, 8), 0.034, 0.148, 0.0925, 1, 1, 0.6), mover(esf(0.0072, 10, 8), -0.034, 0.148, 0.0925, 1, 1, 0.6)),
  cejas: unir(mover(new RoundedBoxGeometry(0.036, 0.008, 0.012, 1, 0.003), 0.035, 0.171, 0.098, 1, 1, 1, 0, 0, -0.12), mover(new RoundedBoxGeometry(0.036, 0.008, 0.012, 1, 0.003), -0.035, 0.171, 0.098, 1, 1, 1, 0, 0, 0.12)),
  labios: unir(mover(new THREE.CapsuleGeometry(0.0042, 0.016, 4, 10), 0.0072, 0.0768, 0.0955, 1, 1, 0.62, 0, 0, Math.PI / 2 - 0.12), mover(new THREE.CapsuleGeometry(0.0042, 0.016, 4, 10), -0.0072, 0.0768, 0.0955, 1, 1, 0.62, 0, 0, Math.PI / 2 + 0.12), mover(new THREE.CapsuleGeometry(0.0058, 0.02, 4, 10), 0, 0.0688, 0.0935, 1, 1, 0.66, 0, 0, Math.PI / 2)),
  barba: unir(mover(esf(0.0865, 18, 10, Math.PI / 2 - 1.45, 2.9, 2.05, 0.75), 0, 0.11, 0.017, 0.86, 1.08, 0.97), mover(esf(0.033, 10, 8), 0, 0.044, 0.064, 1.2, 0.85, 0.95), mover(new THREE.CapsuleGeometry(0.0065, 0.04, 3, 8), 0, 0.088, 0.101, 1, 1, 0.7, 0, 0, Math.PI / 2)),
  bigote: mover(new THREE.CapsuleGeometry(0.008, 0.042, 3, 8), 0, 0.089, 0.103, 1, 1, 0.8, 0, 0, Math.PI / 2),
  peloCorto: unir(casco(0.106, 0, 1.15), nuca(0.104, 0.9, 1.0)),
  peloLargo: unir(casco(0.108, 0, 1.2), nuca(0.106, 0.9, 1.15), mover(new THREE.CylinderGeometry(0.096, 0.12, 0.32, 16, 1, true, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9), 0, 0.03, -0.012, 1, 1, 0.82)),
  chongo: unir(casco(0.105, 0, 1.15), nuca(0.103, 0.9, 1.0), mover(new THREE.SphereGeometry(0.05, 12, 10), 0, 0.2, -0.12, 1, 0.9, 1)),
  gorra: unir(casco(0.109, 0, 1.25), mover(new THREE.CylinderGeometry(0.095, 0.1, 0.01, 18, 1, false, -Math.PI / 2, Math.PI), 0, 0.212, 0.066, 1, 1, 1.3, 0.16)),
  ala: new THREE.CylinderGeometry(0.31, 0.33, 0.02, 28), copa: mover(new THREE.CylinderGeometry(0.1, 0.122, 0.15, 20), 0, 0.33, 0),
  cuello: mover(new THREE.CylinderGeometry(0.046, 0.054, 0.13, 14), 0, 0.555, 0.004)
};
R.ala.translate(0, 0.252, 0);
R.ceja = (() => {
  const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.0175, -0.0028, -0.002), new THREE.Vector3(-0.008, 0.0012, 0.0008), new THREE.Vector3(0.002, 0.0022, 0.001), new THREE.Vector3(0.011, 0.0008, -0.0005), new THREE.Vector3(0.0185, -0.0035, -0.004)]);
  const g = new THREE.TubeGeometry(curva, 16, 0.0026, 5, false), P = g.attributes.position, U = g.attributes.uv;
  for (let i = 0; i < P.count; i++) {
    const u = U.getX(i), p0 = curva.getPoint(u), k = 0.45 + 0.75 * Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.5) * (1 - Math.max(0, u - 0.6) * 1.6);
    P.setXYZ(i, p0.x + (P.getX(i) - p0.x) * k, p0.y + (P.getY(i) - p0.y) * k * 1.2, p0.z + (P.getZ(i) - p0.z) * k * 0.55);
  }
  g.computeVertexNormals();
  return g;
})();
for (const k of ['peloCorto', 'peloLargo', 'chongo']) {
  const g = R[k], P = g.attributes.position, c = new THREE.Vector3(0, 0.17, 0);
  for (let i = 0; i < P.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(P, i), d = v.clone().sub(c);
    const ruido = Math.sin(v.x * 140 + v.z * 60) * Math.cos(v.y * 120 - v.x * 40) * 0.5 + Math.sin(v.z * 210 + v.y * 90) * 0.5;
    const f = 1 + ruido * 0.035 + (d.y > 0.06 ? 0.03 : 0);
    v.copy(c).add(d.multiplyScalar(f)); P.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
}
function cabezaSDF(v) {
  const elip = (x, y, z, cx, cy, cz, rx, ry, rz) => { const a = (x - cx) / rx, b = (y - cy) / ry, c = (z - cz) / rz, k0 = Math.hypot(a, b, c), k1 = Math.hypot(a / rx, b / ry, c / rz); return k1 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz); };
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  return (x, y, z) => {
    const ax = Math.abs(x);
    let d = elip(x, y, z, 0, 0.17, 0, 0.086 * v.ancho, 0.1, 0.1);
    d = smin(d, elip(x, y, z, 0, 0.108, 0.018, 0.0697 * v.mand, 0.0896, 0.0789), 0.03);
    d = smin(d, elip(x, y, z, 0, 0.045 + v.menton * 0.004, 0.062, 0.0345 * v.menton, 0.024, 0.027), 0.022);
    if (v.quijada) d = smin(d, elip(ax, y, z, 0.05 * v.mand, 0.07, 0.008, 0.02, 0.024, 0.032), 0.02);
    d = smin(d, elip(ax, y, z, 0.05, 0.12 + v.pomulo * 0.004, 0.06, 0.022, 0.016, 0.02), 0.016);
    d = smin(d, elip(ax, y, z, 0.037, 0.165, 0.082, 0.0288, 0.0132 * v.ceja, 0.0168 * v.ceja), 0.012);
    d = smin(d, Math.max(elip(ax, y, z, 0.034, 0.1505, 0.0858, 0.0151, 0.0092, 0.0109), 0.1534 - y), 0.004);
    d = smin(d, elip(x, y, z, 0, 0.124, 0.096, 0.0105 * v.nariz, 0.025, 0.017), 0.012);
    d = smin(d, elip(x, y, z, 0, 0.105, 0.109, 0.0135 * v.nariz, 0.0095, 0.0105), 0.008);
    d = smin(d, elip(ax, y, z, 0.0115 * v.nariz, 0.1015, 0.1, 0.0085, 0.0068, 0.0085), 0.006);
    d = smin(d, elip(x, y, z, 0, 0.077, 0.07, 0.029, 0.02, 0.021), 0.014);
    d = -smin(-d, elip(ax, y, z, 0.034, 0.1492, 0.0925, 0.0142, 0.0068, 0.0085), 0.003);
    d = smin(d, elip(ax, y, z, 0.034, 0.1566, 0.0905, 0.0148, 0.0032, 0.0062), 0.003);
    d = smin(d, elip(ax, y, z, 0.034, 0.1425, 0.0895, 0.0135, 0.0022, 0.005), 0.002);
    return d;
  };
}
function cabezaEsculpida(v) {
  const f = cabezaSDF(v), O = new THREE.Vector3(0, 0.13, 0.035);
  const g = new THREE.SphereGeometry(1, 92, 72, -Math.PI / 2), P = g.attributes.position, N = g.attributes.normal, d = new THREE.Vector3(), p = new THREE.Vector3(), e = 0.0004;
  for (let i = 0; i < P.count; i++) {
    d.fromBufferAttribute(P, i).normalize();
    let t = 0.26;
    while (t > 0 && f(O.x + d.x * t, O.y + d.y * t, O.z + d.z * t) > 0) t -= 0.003;
    let a = t, b = t + 0.003;
    for (let k = 0; k < 22; k++) { const m = (a + b) / 2; if (f(O.x + d.x * m, O.y + d.y * m, O.z + d.z * m) > 0) b = m; else a = m; }
    p.copy(d).multiplyScalar((a + b) / 2).add(O);
    P.setXYZ(i, p.x, p.y, p.z);
    const nx = f(p.x + e, p.y, p.z) - f(p.x - e, p.y, p.z), ny = f(p.x, p.y + e, p.z) - f(p.x, p.y - e, p.z), nz = f(p.x, p.y, p.z + e) - f(p.x, p.y, p.z - e), l = Math.hypot(nx, ny, nz) || 1;
    N.setXYZ(i, nx / l, ny / l, nz / l);
  }
  sombrear(g);
  return g;
}
function sombrear(g) {
  const P = g.attributes.position, n = P.count, col = new Float32Array(n * 3);
  const d2 = (x, y, z, a, b, c) => (x - a) ** 2 + (y - b) ** 2 + (z - c) ** 2;
  for (let i = 0; i < n; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    let k = 1, rr = 1, gg = 1;
    for (const sx of [0.034, -0.034]) { const d = d2(x, y, z, sx, 0.149, 0.088); k -= 0.2 * Math.exp(-d / 0.00025); k -= 0.06 * Math.exp(-d2(x, y, z, sx, 0.141, 0.09) / 0.0002); }
    k -= 0.14 * Math.exp(-d2(x, y, z, 0, 0.098, 0.105) / 0.0003);
    k -= 0.12 * Math.exp(-d2(x, y, z, 0, 0.058, 0.095) / 0.0005);
    if (y < 0.06) k -= (0.06 - y) * 3.2 * Math.max(0, z / 0.1);
    for (const sx of [0.055, -0.055]) { const e = Math.exp(-d2(x, y, z, sx, 0.11, 0.07) / 0.0012); rr += 0.025 * e; gg -= 0.015 * e; }
    if (z < -0.02 && y > 0.12) k -= 0.05;
    col[i * 3] = Math.max(0.5, k * rr); col[i * 3 + 1] = Math.max(0.5, k * gg); col[i * 3 + 2] = Math.max(0.5, k * gg);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
}
function capa(g, dentro, grosor) {
  const P = g.attributes.position, N = g.attributes.normal, n = P.count, pos = new Float32Array(n * 3), si = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), w = dentro(x, y, z);
    si[i] = w > 0 ? 1 : 0;
    const t = grosor * Math.min(1, Math.max(0, w));
    pos[i * 3] = x + N.getX(i) * t; pos[i * 3 + 1] = y + N.getY(i) * t; pos[i * 3 + 2] = z + N.getZ(i) * t;
  }
  const I = g.index.array, idx = [];
  for (let k = 0; k < I.length; k += 3) if (si[I[k]] && si[I[k + 1]] && si[I[k + 2]]) idx.push(I[k], I[k + 1], I[k + 2]);
  const c = new THREE.BufferGeometry();
  c.setAttribute('position', new THREE.BufferAttribute(pos, 3)); c.setAttribute('uv', g.attributes.uv); c.setIndex(idx); c.computeVertexNormals();
  return c;
}
const zonaLabios = (x, y, z) => Math.abs(x) < 0.024 - Math.abs(y - 0.072) * 0.4 && y > 0.06 && y < 0.083;
const VELLO = {
  barba: (x, y, z) => (z < -0.035 || y > 0.135 || zonaLabios(x, y, z) || (y > 0.098 && Math.abs(x) < 0.05 && z > 0.05) || (y > 0.1 && z > 0.035 && Math.abs(x) > 0.02 && Math.abs(x) < 0.07 && y > 0.1 + (0.07 - Math.abs(x)) * 0.2)) ? -1 : Math.min(1, (0.135 - y) * 60, (z + 0.035) * 60),
  bigote: (x, y, z) => (z > 0.08 && y > 0.081 && y < 0.099 && Math.abs(x) < 0.03 - (y - 0.081) * 0.4) ? Math.min(1, (0.099 - y) * 250) : (z > 0.075 && Math.abs(x) > 0.017 && Math.abs(x) < 0.031 && y > 0.06 && y <= 0.081) ? 0.7 : -1,
  candado: (x, y, z) => zonaLabios(x, y, z) ? -1 : (z > 0.04 && Math.abs(x) < 0.032 && y < 0.099 && !(y > 0.083 && Math.abs(x) > 0.026)) ? 1 : -1
};
function armarCabeza(v) {
  const g = cabezaEsculpida(v), c = { g };
  for (const k in VELLO) c[k] = capa(g, VELLO[k], k === 'barba' ? 0.0045 : 0.003);
  return c;
}
const CABEZAS = {
  h: [armarCabeza({ ancho: 1, mand: 1.04, menton: 1.08, quijada: true, pomulo: 0, ceja: 1.1, nariz: 1.05 }), armarCabeza({ ancho: 1.02, mand: 1.1, menton: 1.15, quijada: true, pomulo: -1, ceja: 1.2, nariz: 1.15 }), armarCabeza({ ancho: 0.97, mand: 0.98, menton: 0.95, quijada: false, pomulo: 1, ceja: 1, nariz: 0.95 })],
  m: [armarCabeza({ ancho: 0.98, mand: 0.92, menton: 0.85, quijada: false, pomulo: 1.5, ceja: 0.8, nariz: 0.85 }), armarCabeza({ ancho: 0.96, mand: 0.95, menton: 0.9, quijada: false, pomulo: 0.5, ceja: 0.85, nariz: 0.9 })]
};
R.oreja = (() => {
  const lado = sx => {
    const h = new THREE.TorusGeometry(0.0155, 0.0042, 6, 18, Math.PI * 1.72); h.rotateZ(-0.86 * Math.PI); h.scale(1, 1.38, 1); h.rotateY(Math.PI / 2);
    const c = esf(0.0145, 10, 8); c.scale(0.32, 1.3, 0.85);
    const l = esf(0.0075, 8, 6); l.translate(0, -0.021, 0.002);
    const o = unir(h, c, l); o.rotateX(-0.18); o.rotateY(sx * 0.32); o.translate(sx * 0.081, 0.132, -0.008);
    return o;
  };
  return unir(lado(1), lado(-1));
})();
const CARAS_MAT = new Map();
function matCara(base) {
  let m = CARAS_MAT.get(base);
  if (!m) { m = base.clone(); m.vertexColors = true; CARAS_MAT.set(base, m); }
  return m;
}
const LABIOS_M = new Map();
function matLabio(piel, mujer) {
  const k = piel + (mujer ? 'm' : 'h');
  let m = LABIOS_M.get(k);
  if (!m) { const c = new THREE.Color(piel).lerp(new THREE.Color(mujer ? '#8a2f3a' : '#6e3a34'), mujer ? 0.42 : 0.3).multiplyScalar(0.92); m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3 }); LABIOS_M.set(k, m); }
  return m;
}
const PIELES_M = new Map();
function matPiel(color) {
  let m = PIELES_M.get(color);
  if (!m) { m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.56, metalness: 0, sheen: 0.4, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ff7a5c'), map: textura('piel') }); PIELES_M.set(color, m); }
  return m;
}
R.capucha = unir(mover(new THREE.SphereGeometry(0.13, 14, 10, Math.PI * 0.15, Math.PI * 1.7, 0.3, 1.4), 0, 0.5, -0.07, 1, 0.75, 1.05), mover(new THREE.TorusGeometry(0.085, 0.03, 6, 14, Math.PI), 0, 0.535, 0.02, 1, 1, 1, Math.PI / 2 + 0.3));
R.bolsa = mover(new RoundedBoxGeometry(0.2, 0.09, 0.03, 1, 0.01), 0, 0.12, 0.1);
R.paraguas = (() => { const tela = new THREE.SphereGeometry(0.55, 16, 6, 0, Math.PI * 2, 0, 1.05).scale(1, 0.55, 1).translate(0, 0.62, 0); return tela; })();
R.baston = new THREE.CylinderGeometry(0.008, 0.008, 0.72, 6).translate(0, 0.3, 0);
{
  const P = R.iris.attributes.position, col = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), cx = x > 0 ? 0.034 : -0.034, rr = Math.hypot(x - cx, y - 0.148) / 0.0072;
    const k = z < 0.0925 ? 0.5 : rr < 0.42 ? 0.04 : rr < 0.62 ? 1.35 : rr < 0.86 ? 1 : 0.55;
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
  }
  R.iris.setAttribute('color', new THREE.BufferAttribute(col, 3));
}
R.ojos.translate(0, -0.149, -0.086); R.iris.translate(0, -0.148, -0.0925); R.labios.translate(0, -0.0715, -0.097);
R.fleco = mover(esf(0.104, 16, 6, Math.PI / 2 - 0.9, 1.8, 0.85, 0.42), 0, 0.172, 0.006, 0.92, 1, 1.05);
R.rizado = (() => { const g = new THREE.IcosahedronGeometry(0.112, 3); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const k = 1 + Math.sin(v.x * 90) * Math.cos(v.y * 80) * Math.sin(v.z * 70) * 0.07; v.multiplyScalar(k); if (v.y < -0.02 && v.z > 0) v.y = -0.02 + (v.y + 0.02) * 0.2; p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); g.scale(0.95, 1.02, 1.05); g.translate(0, 0.185, -0.012); return g; })();
R.cola = unir(casco(0.106, 0, 1.15), nuca(0.104, 0.9, 1.0), mover(new THREE.CapsuleGeometry(0.03, 0.2, 4, 8), 0, 0.06, -0.16, 1, 1, 1, 0.35), mover(esf(0.035, 8, 6), 0, 0.16, -0.12));
R.lentes = unir(mover(new THREE.BoxGeometry(0.05, 0.026, 0.008), 0.034, 0.152, 0.104), mover(new THREE.BoxGeometry(0.05, 0.026, 0.008), -0.034, 0.152, 0.104), mover(new THREE.BoxGeometry(0.02, 0.006, 0.006), 0, 0.157, 0.106), mover(new THREE.BoxGeometry(0.006, 0.006, 0.1), 0.062, 0.155, 0.055), mover(new THREE.BoxGeometry(0.006, 0.006, 0.1), -0.062, 0.155, 0.055));
R.mochila = unir(mover(new RoundedBoxGeometry(0.28, 0.36, 0.13, 2, 0.04), 0, 0.3, -0.16), mover(new RoundedBoxGeometry(0.2, 0.12, 0.05, 2, 0.02), 0, 0.2, -0.235));
R.cinturon = mover(new THREE.CylinderGeometry(0.157, 0.157, 0.026, 24, 1, true), 0, 0.022, 0, 1, 1, 0.66);
R.deltoide = mover(esf(0.052, 16, 12), 0, 0, 0, 0.95, 1.05, 0.78);
R.hebilla = mover(new RoundedBoxGeometry(0.04, 0.03, 0.008, 1, 0.004), 0, 0.022, 0.104);
R.panza = mover(esf(0.15, 16, 12), 0, 0.15, 0.025, 1.02, 0.85, 0.66);
R.suela = mover(new RoundedBoxGeometry(0.104, 0.028, 0.27, 2, 0.012), 0, -0.432, 0.04);
R.aretes = unir(mover(new THREE.TorusGeometry(0.012, 0.003, 4, 10), 0.087, 0.112, -0.004, 1, 1, 1, 0, Math.PI / 2), mover(new THREE.TorusGeometry(0.012, 0.003, 4, 10), -0.087, 0.112, -0.004, 1, 1, 1, 0, Math.PI / 2));
const PERFIL = [[0.155, 0], [0.16, 0.06], [0.146, 0.16], [0.152, 0.26], [0.176, 0.35], [0.192, 0.42], [0.19, 0.465], [0.165, 0.505], [0.115, 0.535], [0.062, 0.556]];
function torsoLathe(esc = 1, hueco = 0) {
  const pts = PERFIL.map(([r, y]) => new THREE.Vector2(r * esc, y));
  const g = new THREE.LatheGeometry(pts, 24, hueco, Math.PI * 2 - hueco * 2);
  g.scale(1, 1, 0.64);
  return g;
}
R.torso = torsoLathe();
R.chamarra = torsoLathe(1.075, 0.32);
R.pelvis = mover(esf(0.16, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), 0, 0.96, 0, 1.02, 0.55, 0.64);
R.muslo = unir(cono(0.078, 0.06, 0.42, -0.2), mover(esf(0.062, 10, 8), 0, -0.43, 0));
R.espinilla = unir(cono(0.057, 0.043, 0.38, -0.19), mover(esf(0.05, 10, 8), 0, -0.1, -0.012, 1, 1.4, 1));
R.zapato = unir(mover(new RoundedBoxGeometry(0.096, 0.07, 0.19, 3, 0.03), 0, -0.4, 0.015), mover(new THREE.SphereGeometry(0.05, 14, 10), 0, -0.408, 0.1, 0.96, 0.62, 1.15), mover(new THREE.CylinderGeometry(0.046, 0.05, 0.06, 14), 0, -0.36, -0.01));
R.brazo = unir(cono(0.05, 0.042, 0.26, -0.13), mover(esf(0.046, 12, 10), 0.002, -0.02, 0, 1, 1.15, 0.92), mover(esf(0.043, 10, 8), 0, -0.27, 0));
R.antebrazo = cono(0.042, 0.033, 0.24, -0.12);
R.manoVieja = unir(mover(new RoundedBoxGeometry(0.068, 0.085, 0.03, 2, 0.012), 0, -0.05, 0.004), mover(new RoundedBoxGeometry(0.064, 0.055, 0.026, 2, 0.011), 0, -0.11, 0.012, 1, 1, 1, 0.35), mover(new THREE.CapsuleGeometry(0.012, 0.035, 3, 6), 0.035, -0.045, 0.018, 1, 1, 1, 0.5, 0, -0.6));
R.falda = new THREE.CylinderGeometry(0.17, 0.27, 0.42, 16, 1, true);
R.mano = (() => {
  const p = [mover(new RoundedBoxGeometry(0.066, 0.074, 0.03, 2, 0.013), 0, -0.044, 0.004)];
  for (let k = 0; k < 4; k++) {
    const L = [0.042, 0.051, 0.055, 0.05][k], fx = -0.0235 + k * 0.0157, a1 = 0.32 + k * 0.04, a2 = 0.95 + k * 0.08, l1 = L * 0.56, l2 = L * 0.48, rr = k === 0 ? 0.0074 : 0.0083;
    const y1 = -0.08 - Math.cos(a1) * l1 / 2, z1 = 0.008 + Math.sin(a1) * l1 / 2, yj = -0.08 - Math.cos(a1) * l1, zj = 0.008 + Math.sin(a1) * l1;
    p.push(mover(new THREE.CapsuleGeometry(rr, l1, 3, 6), fx, y1, z1, 1, 1, 1, -a1));
    p.push(mover(new THREE.CapsuleGeometry(rr * 0.92, l2, 3, 6), fx, yj - Math.cos(a2) * l2 / 2, zj + Math.sin(a2) * l2 / 2, 1, 1, 1, -a2));
  }
  p.push(mover(new THREE.CapsuleGeometry(0.0105, 0.026, 3, 6), 0.033, -0.04, 0.018, 1, 1, 1, -0.35, 0, -0.55));
  p.push(mover(new THREE.CapsuleGeometry(0.0092, 0.022, 3, 6), 0.041, -0.068, 0.03, 1, 1, 1, -0.7, 0, -0.25));
  return unir(...p);
})();
R.puno = (() => {
  const p = [mover(new RoundedBoxGeometry(0.07, 0.075, 0.034, 2, 0.013), 0, -0.045, 0.004)];
  for (let k = 0; k < 4; k++) p.push(mover(new THREE.CapsuleGeometry(0.0095, 0.04, 3, 6), -0.024 + k * 0.016, -0.088, 0.024, 1, 1, 1, Math.PI / 2 + 0.2));
  p.push(mover(new THREE.CapsuleGeometry(0.01, 0.035, 3, 6), 0.03, -0.075, 0.03, 1, 1, 1, 1.1, 0, -0.6));
  return unir(...p);
})();
R.colaSuelta = mover(new THREE.CapsuleGeometry(0.03, 0.2, 4, 8), 0, -0.1, 0);

const mats = new Map();
const TEX = {};
function textura(tipo) {
  if (TEX[tipo]) return TEX[tipo];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), R = Math.random;
  if (tipo === 'mezclilla') {
    g.fillStyle = '#e6e8ec'; g.fillRect(0, 0, 128, 128);
    for (let i = -128; i < 256; i += 3) { g.strokeStyle = `rgba(${R() < 0.5 ? '255,255,255' : '60,70,90'},${0.18 + R() * 0.2})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke(); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.18})`; g.fillRect(R() * 128, R() * 128, 1, 2); }
  } else if (tipo === 'algodon') {
    g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 2) { g.fillStyle = `rgba(0,0,0,${0.03 + R() * 0.03})`; g.fillRect(0, y, 128, 1); }
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '0,0,0' : '255,255,255'},${R() * 0.08})`; g.fillRect(R() * 128, R() * 128, 1, 1); }
  } else if (tipo === 'pelo') {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 520; i++) { const x = R() * 128, l = 20 + R() * 60, y = R() * 128; g.strokeStyle = `rgba(${R() < 0.55 ? '0,0,0' : '255,255,255'},${0.12 + R() * 0.25})`; g.lineWidth = 0.6 + R() * 0.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * 6, y + l / 2, x + (R() - 0.5) * 4, y + l); g.stroke(); }
  } else {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 220; i++) { const r = 4 + R() * 14; const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${R() < 0.5 ? '200,120,110' : '255,255,255'},${0.05 + R() * 0.05})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(R() * 128, R() * 128); g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore(); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,50,40,${R() * 0.06})`; g.fillRect(R() * 128, R() * 128, 1, 1); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.repeat.set(...({ mezclilla: [3, 5], algodon: [3, 4], pelo: [3, 2], piel: [2, 2] }[tipo]));
  return (TEX[tipo] = t);
}
function tela(m, tipo) { if (m && !m.map) { m.map = textura(tipo); m.needsUpdate = true; } return m; }
const esMezclilla = c => { const k = new THREE.Color(c); return k.b > k.r + 0.04 && k.b > 0.08; };

export function mat(color) {
  let m = mats.get(color);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0 }); mats.set(color, m); }
  return m;
}

const MET = new THREE.MeshStandardMaterial({ color: '#1e2024', metalness: 0.65, roughness: 0.38 });
const MET2 = new THREE.MeshStandardMaterial({ color: '#3a3d44', metalness: 0.7, roughness: 0.3 });
const MADERA = new THREE.MeshStandardMaterial({ color: '#7a4a28', roughness: 0.6 });
const MADERA2 = new THREE.MeshStandardMaterial({ color: '#b8864e', roughness: 0.55 });
const HOJA = new THREE.MeshStandardMaterial({ color: '#d0d6de', metalness: 0.9, roughness: 0.18 });
const VERDE = new THREE.MeshStandardMaterial({ color: '#4a5a32', roughness: 0.7, metalness: 0.2 });
const PANTALLA = new THREE.MeshBasicMaterial({ color: '#5fa8ff' });
const bx = (x, y, z, px, py, pz, rx = 0) => mover(new THREE.BoxGeometry(x, y, z), px, py, pz, 1, 1, 1, rx);
const cil = (r1, r2, l, px, py, pz, seg = 10) => mover(new THREE.CylinderGeometry(r1, r2, l, seg), px, py, pz);
const ARMAS_GEO = {
  pistola: [[unir(bx(0.03, 0.19, 0.04, 0, -0.1, 0.045), bx(0.028, 0.15, 0.026, 0, -0.09, 0.015), bx(0.028, 0.05, 0.1, 0, -0.015, -0.03, -0.28)), MET], [cil(0.008, 0.008, 0.02, 0, -0.2, 0.045), MET2]],
  subfusil: [[unir(bx(0.045, 0.27, 0.07, 0, -0.12, 0.035), bx(0.03, 0.05, 0.16, 0, -0.17, -0.07, 0.12), bx(0.03, 0.05, 0.1, 0, -0.01, -0.03, -0.25), bx(0.025, 0.14, 0.04, 0, 0.09, 0.04)), MET], [cil(0.011, 0.011, 0.12, 0, -0.31, 0.04), MET2]],
  rifle: [[unir(bx(0.045, 0.46, 0.075, 0, -0.2, 0.04), bx(0.032, 0.06, 0.16, 0, -0.22, -0.07, 0.18), bx(0.03, 0.05, 0.1, 0, -0.01, -0.03, -0.25), cil(0.016, 0.016, 0.2, 0, -0.22, 0.105)), MET], [unir(cil(0.011, 0.011, 0.36, 0, -0.6, 0.05), bx(0.03, 0.03, 0.03, 0, -0.42, 0.09)), MET2], [bx(0.04, 0.26, 0.085, 0, 0.15, 0.02), MADERA]],
  escopeta: [[unir(bx(0.042, 0.22, 0.06, 0, -0.06, 0.04), cil(0.014, 0.014, 0.52, 0, -0.42, 0.055), cil(0.012, 0.012, 0.44, 0, -0.38, 0.028)), MET], [unir(bx(0.04, 0.28, 0.08, 0, 0.17, 0.02), bx(0.045, 0.14, 0.05, 0, -0.32, 0.025)), MADERA]],
  bate: [[unir(cil(0.016, 0.024, 0.28, 0, -0.12, 0), cil(0.024, 0.045, 0.6, 0, -0.56, 0), mover(new THREE.SphereGeometry(0.045, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, -0.86, 0, 1, 1, 1, Math.PI)), MADERA2], [cil(0.022, 0.022, 0.02, 0, 0.03, 0), MET]],
  cuchillo: [[bx(0.026, 0.1, 0.03, 0, -0.03, 0.01), MET], [mover(new THREE.BoxGeometry(0.005, 0.17, 0.032), 0, -0.165, 0.016), HOJA]],
  granada: [[mover(new THREE.SphereGeometry(0.045, 12, 10), 0, -0.07, 0.035, 1, 1.25, 1), VERDE], [cil(0.012, 0.012, 0.03, 0, -0.015, 0.035), MET2]],
  telefono: [[bx(0.072, 0.145, 0.012, 0, -0.075, 0.03), MET], [bx(0.064, 0.13, 0.002, 0, -0.075, 0.037), PANTALLA]],
  revolver: [[unir(bx(0.032, 0.06, 0.05, 0, -0.07, 0.035), cil(0.022, 0.022, 0.045, 0, -0.085, 0.045, 10), cil(0.009, 0.009, 0.16, 0, -0.17, 0.056)), MET2], [bx(0.03, 0.075, 0.1, 0, -0.015, -0.025, -0.28), MADERA]],
  machete: [[bx(0.028, 0.12, 0.035, 0, -0.03, 0.01), MET], [mover(new THREE.BoxGeometry(0.006, 0.46, 0.06), 0, -0.32, 0.024), HOJA]],
  llave: [[unir(bx(0.02, 0.34, 0.035, 0, -0.17, 0), bx(0.025, 0.06, 0.09, 0, -0.36, 0.02)), HOJA]],
  recortada: [[unir(bx(0.042, 0.16, 0.06, 0, -0.05, 0.04), cil(0.014, 0.014, 0.3, 0.012, -0.27, 0.05), cil(0.014, 0.014, 0.3, -0.012, -0.27, 0.05)), MET], [bx(0.04, 0.14, 0.07, 0, 0.07, 0.02, 0.2), MADERA]],
  ametralladora: [[unir(bx(0.05, 0.42, 0.08, 0, -0.15, 0.04), bx(0.03, 0.06, 0.12, 0, -0.02, -0.04, -0.25), bx(0.07, 0.09, 0.08, 0.045, -0.12, -0.02), bx(0.034, 0.22, 0.06, 0, 0.16, 0.03)), MET], [unir(cil(0.015, 0.015, 0.42, 0, -0.56, 0.05), bx(0.012, 0.14, 0.012, 0.03, -0.6, -0.02)), MET2]],
  francotirador: [[unir(bx(0.04, 0.5, 0.07, 0, -0.2, 0.04), bx(0.03, 0.05, 0.1, 0, -0.01, -0.03, -0.25)), MET], [unir(cil(0.01, 0.01, 0.6, 0, -0.72, 0.05), cil(0.022, 0.026, 0.26, 0, -0.22, 0.118), cil(0.028, 0.028, 0.04, 0, -0.36, 0.118)), MET2], [bx(0.044, 0.32, 0.09, 0, 0.18, 0.02), VERDE]],
  lanzacohetes: [[cil(0.06, 0.06, 1.05, 0, -0.22, 0.1, 14), VERDE], [unir(bx(0.03, 0.09, 0.1, 0, -0.02, 0.02, -0.2), cil(0.068, 0.068, 0.08, 0, -0.74, 0.1, 14), cil(0.066, 0.066, 0.06, 0, 0.3, 0.1, 14), bx(0.03, 0.1, 0.06, 0, -0.3, 0.17)), MET]],
  molotov: [[unir(mover(new THREE.CylinderGeometry(0.036, 0.04, 0.14, 12), 0, -0.07, 0.035), cil(0.012, 0.016, 0.07, 0, -0.17, 0.035)), new THREE.MeshStandardMaterial({ color: '#3f6a3a', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.75 })], [mover(new THREE.BoxGeometry(0.03, 0.07, 0.02), 0.008, -0.22, 0.035, 1, 1, 1, 0.3), new THREE.MeshStandardMaterial({ color: '#d8742a', roughness: 0.95 })]]
};
const ARMAS_MANO = Object.keys(ARMAS_GEO).filter(k => k !== 'telefono');
const DOS_MANOS = ['subfusil', 'escopeta', 'rifle', 'recortada', 'ametralladora', 'francotirador', 'lanzacohetes'];
const SIN_APUNTAR = ['puno', 'bate', 'granada', 'cuchillo', 'machete', 'llave', 'molotov'];

function crearArmas(mano) {
  const out = {};
  for (const id in ARMAS_GEO) {
    const g = new THREE.Group();
    for (const [geo, m] of ARMAS_GEO[id]) { const k = new THREE.Mesh(geo, m); k.castShadow = true; g.add(k); }
    g.visible = false;
    mano.add(g);
    out[id] = g;
  }
  return out;
}

export const PIELES = ['#8d5a3b', '#a8704a', '#c08a62', '#d6a47c', '#6e4329', '#b98258'];
export const CAMISAS = ['#a83a40', '#3a6a9a', '#c8a04a', '#e8e4da', '#2c2c34', '#4a7a52', '#b86a3c', '#7a5a9a', '#9a4a6a', '#3a8a8a', '#7a5a3c'];
export const PANTALONES = ['#2d3a5a', '#3a3a40', '#5b4a38', '#1f2633', '#4b5b6a', '#6a5e4a'];

export const CARAS = hoja('assets/caras.jpg', 4, 2, { colorDe: 'borde', alListo: (p, i) => { matPielCara[i].color.copy(p.color); matPeloCara[i].color.copy(p.colorArriba); } });
export const ROPA = hoja('assets/ropa.jpg', 4, 2, { alListo: (p, i) => matManga[i].color.copy(p.color) });
const matPielCara = CARAS.map(() => new THREE.MeshStandardMaterial({ color: '#b07650', roughness: 0.75 }));
const matPeloCara = CARAS.map(() => new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.9 }));
const matRopa = ROPA.map(p => new THREE.MeshStandardMaterial({ map: p.textura, roughness: 0.9 }));
const MAT_OJO = new THREE.MeshPhysicalMaterial({ color: '#ece6df', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.04 });
const IRIS_COL = ['#3a2414', '#2a190e', '#4f3218', '#5a4a24', '#3e4a52'];
const MAT_IRIS_L = IRIS_COL.map(c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.03, vertexColors: true }));
const MAT_IRIS = MAT_IRIS_L[0];
const MAT_LABIO = [new THREE.MeshStandardMaterial({ color: '#7a4a42', roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: '#94404a', roughness: 0.45 })];
const MAT_NEGRO = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.3, metalness: 0.4 });
const MAT_ORO = new THREE.MeshStandardMaterial({ color: '#d8b060', roughness: 0.25, metalness: 0.9 });
const MAT_SUELA = new THREE.MeshStandardMaterial({ color: '#e8e6e0', roughness: 0.8 });
const MAT_PLATA_P = new THREE.MeshStandardMaterial({ color: '#c8ccd4', roughness: 0.25, metalness: 0.9 });
const matManga = ROPA.map(() => new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.9 }));
export const ESTILOS_PELO = ['corto', 'largo', 'rapado', 'gorra', 'sombrero', 'chongo'];

const PERFIL_PIERNA = [[0.055, 0.002], [0.06, 0.034], [0.09, 0.04], [0.14, 0.043], [0.22, 0.05], [0.3, 0.058], [0.37, 0.06], [0.43, 0.054], [0.48, 0.05], [0.53, 0.055], [0.62, 0.066], [0.72, 0.075], [0.82, 0.083], [0.9, 0.086], [0.96, 0.08], [1.0, 0.04], [1.02, 0.002]];
const PERFIL_BRAZO = [[0.848, 0.002], [0.852, 0.022], [0.87, 0.028], [0.92, 0.032], [0.98, 0.036], [1.04, 0.04], [1.08, 0.038], [1.105, 0.036], [1.13, 0.038], [1.18, 0.042], [1.25, 0.045], [1.31, 0.047], [1.345, 0.049], [1.37, 0.044], [1.388, 0.03], [1.398, 0.002]];
const _cacheExt = {};
function geoExtremidad(perfil, escala, corte, junta, ancho, x) {
  const clave = [perfil.length, escala.toFixed(3), corte, junta, x].join('|');
  if (_cacheExt[clave]) return _cacheExt[clave];
  const arriba = [], abajo = [];
  for (const [y, rr] of perfil) {
    const r = rr * escala;
    if (y >= corte) arriba.push(new THREE.Vector2(r * 1.05, y));
    if (y <= corte) abajo.push(new THREE.Vector2(r, y));
  }
  const rc = (() => { for (let i = 1; i < perfil.length; i++) if (perfil[i][0] >= corte) { const [y0, r0] = perfil[i - 1], [y1, r1] = perfil[i]; return (r0 + (r1 - r0) * (corte - y0) / (y1 - y0)) * escala; } return 0.03; })();
  arriba.unshift(new THREE.Vector2(rc * 1.05, corte)); arriba.unshift(new THREE.Vector2(rc * 0.9, corte - 0.004));
  abajo.push(new THREE.Vector2(rc, corte + 0.002));
  const piezas = [arriba, abajo].filter(p => p.length > 1).map(p => new THREE.LatheGeometry(p, 14).translate(x, 0, 0));
  const g = piezas.length > 1 ? mergeGeometries(piezas, true) : (() => { piezas[0].addGroup(0, piezas[0].index ? piezas[0].index.count : piezas[0].attributes.position.count, 0); return piezas[0]; })();
  const P = g.attributes.position, n = P.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const y = P.getY(i), t = Math.max(0, Math.min(1, (junta + ancho - y) / (2 * ancho))), k = t * t * (3 - 2 * t);
    si[i * 4] = 0; si[i * 4 + 1] = 1; sw[i * 4] = 1 - k; sw[i * 4 + 1] = k;
  }
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return (_cacheExt[clave] = g);
}

export function crearPersona(o = {}) {
  const r = Math.random;
  const conCara = o.cara !== undefined ? o.cara : (r() < 0.92 ? r() * 8 | 0 : null);
  const conRopa = o.ropa !== undefined ? o.ropa : (r() < 0.55 ? r() * 8 | 0 : null);
  const piel = o.piel || PIELES[r() * PIELES.length | 0];
  const camisa = o.camisa || CAMISAS[r() * CAMISAS.length | 0];
  const pantalon = o.pantalon || PANTALONES[r() * PANTALONES.length | 0];
  const pelo = o.pelo || ['#1d1410', '#2b1d14', '#4a3020', '#121212', '#6b4a2a'][r() * 5 | 0];
  const mPiel = matPiel(piel);
  const PELOS = ['#16100c', '#100c0a', '#22170f', '#2e1f14', '#3a2618', '#0c0c0e', '#4a3020', '#5a3c22', '#7a5a34'];
  let mPelo = tela(mat(o.pelo || PELOS[Math.floor(Math.pow(r(), 1.6) * PELOS.length)]), 'pelo');
  mPelo.roughness = 0.72;
  const mTorso = conRopa !== null ? matRopa[conRopa] : tela(mat(camisa), 'algodon');
  const mManga = conRopa !== null ? tela(matManga[conRopa], 'algodon') : tela(mat(camisa), 'algodon');
  const mPant = tela(mat(pantalon), esMezclilla(pantalon) ? 'mezclilla' : 'algodon'), mZapato = mat(o.zapatos || ['#1a1a1a', '#3a2a1e', '#e8e4da', '#5a3a24', '#2a3a5a', '#8a2a26'][r() * 6 | 0]);
  const complexion = o.complexion ?? (r() < 0.2 ? 1.14 : r() < 0.25 ? 0.9 : 1);
  const edad = o.edad ?? (r() < 0.15 ? 'mayor' : 'adulto');
  if (edad === 'mayor' && !o.pelo) { mPelo = mPelo.clone(); mPelo.color.lerp(new THREE.Color('#c4c0b8'), 0.75); }
  const g = new THREE.Group();
  const cuerpo = new THREE.Group(); g.add(cuerpo);
  const malla = (geo, m, x, y, z, padre) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = true; k.receiveShadow = true; padre.add(k); return k; };
  const grupo = (x, y, z, padre) => { const k = new THREE.Group(); k.position.set(x, y, z); padre.add(k); return k; };
  malla(R.pelvis, mPant, 0, 0, 0, cuerpo);
  const torso = grupo(0, 0.92, 0, cuerpo);
  const pecho = malla(R.torso, mTorso, 0, 0, 0, torso);
  const cuello = malla(R.cuello, mPiel, 0, 0, 0, torso);
  const cab = grupo(0, 0.58, 0.005, torso);
  const mCara = matCara(mPiel);
  let estilo = o.estiloPelo || (o.gorra ? 'gorra' : null);
  if (!estilo) { const x = r(); estilo = o.sombrero === null ? (x < 0.3 ? 'largo' : x < 0.4 ? 'rapado' : 'corto') : (x < 0.28 ? 'largo' : x < 0.36 ? 'rapado' : x < 0.46 ? 'sombrero' : x < 0.52 ? 'chongo' : 'corto'); }
  if (o.peloLargo === false && estilo === 'largo') estilo = 'corto';
  if (o.peloLargo === true) estilo = 'largo';
  if (o.sombrero && estilo !== 'gorra') estilo = 'sombrero';
  const detalles = [];
  const mujer = o.mujer ?? (estilo === 'largo' || estilo === 'chongo');
  const listaCab = mujer ? CABEZAS.m : CABEZAS.h, cabeza0 = listaCab[o.fijo ? 0 : (r() * listaCab.length) | 0];
  malla(cabeza0.g, mCara, 0, 0, 0, cab);
  malla(R.oreja, mPiel, 0, 0, 0, cab);
  const cejaI = malla(R.ceja, mPelo, 0.035, 0.171, 0.098, cab), cejaD = malla(R.ceja, mPelo, -0.035, 0.171, 0.098, cab);
  cejaI.rotation.z = -0.12; cejaD.rotation.z = 0.12;
  detalles.push(malla(R.ojos, MAT_OJO, 0, 0.149, 0.086, cab), malla(R.iris, o.fijo ? MAT_IRIS : MAT_IRIS_L[Math.pow(r(), 1.8) * MAT_IRIS_L.length | 0], 0, 0.148, 0.0925, cab), cejaI, malla(R.labios, matLabio(piel, mujer), 0, 0.0715, 0.097, cab), cejaD);
  const vello = o.barba !== undefined ? o.barba : mujer ? null : r() < 0.35 ? 'barba' : r() < 0.3 ? 'bigote' : null;
  if (vello) detalles.push(malla(cabeza0[vello] || cabeza0.barba, mPelo, 0, 0, 0, cab));
  if (mujer) cab.scale.set(0.95, 0.97, 0.96);
  if (!o.estiloPelo && estilo === 'corto' && r() < 0.3) estilo = r() < 0.5 ? 'rizado' : 'cola';
  if (estilo === 'corto') { detalles.push(malla(R.peloCorto, mPelo, 0, 0, 0, cab)); if (r() < 0.5 || o.fleco) detalles.push(malla(R.fleco, mPelo, 0, 0, 0, cab)); }
  if (estilo === 'rizado') detalles.push(malla(R.rizado, mPelo, 0, 0, 0, cab));
  let colaPelo = null;
  if (estilo === 'cola') { detalles.push(malla(R.peloCorto, mPelo, 0, 0, 0, cab)); const pc = new THREE.Group(); pc.position.set(0, 0.16, -0.12); cab.add(pc); const cm = new THREE.Mesh(R.colaSuelta, mPelo); cm.castShadow = true; pc.add(cm); pc.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mPelo)); colaPelo = pc; detalles.push(cm); }
  if (!o.sinAccesorios && (o.lentes ?? r() < 0.14)) detalles.push(malla(R.lentes, MAT_NEGRO, 0, 0, 0, cab));
  if (mujer && (o.aretes || (!o.sinAccesorios && r() < 0.55))) detalles.push(malla(R.aretes, MAT_ORO, 0, 0, 0, cab));
  if (estilo === 'largo') detalles.push(malla(R.peloLargo, mPelo, 0, 0, 0, cab));
  if (estilo === 'chongo') detalles.push(malla(R.chongo, mPelo, 0, 0, 0, cab));
  if (estilo === 'gorra') malla(R.gorra, mat(o.gorra || ['#a83a40', '#1f3f7a', '#222', '#c8a04a'][r() * 4 | 0]), 0, 0, 0, cab);
  if (estilo === 'sombrero') { const sc = mat(o.colorSombrero || ['#c9b07a', '#3a2a1a', '#e8dcc0'][r() * 3 | 0]); malla(R.ala, sc, 0, 0, 0, cab); malla(R.copa, sc, 0, 0, 0, cab); detalles.push(malla(R.peloCorto, mPelo, 0, -0.01, 0, cab)); }
  const hueso = (x, y, z, padre) => { const b = new THREE.Bone(); b.position.set(x, y, z); padre.add(b); return b; };
  const conPiel = (geo, mats, b1, b2) => {
    const m = new THREE.SkinnedMesh(geo, mats);
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    cuerpo.add(m); g.updateMatrixWorld(true);
    m.bind(new THREE.Skeleton([b1, b2]), m.matrixWorld);
    return m;
  };
  const pierna = (x) => {
    const cadera = hueso(x, 0.9, 0, cuerpo);
    const rod = hueso(0, -0.43, 0, cadera);
    conPiel(geoExtremidad(PERFIL_PIERNA, complexion * (mujer ? 1.04 : 1), o.shorts ? 0.5 : 0.115, 0.47, 0.05, x), [mPant, o.shorts ? mPiel : mPant], cadera, rod);
    detalles.push(malla(R.zapato, mZapato, 0, 0, 0, rod));
    if (mZapato.color.getHex() !== 0xe8e4da) detalles.push(malla(R.suela, MAT_SUELA, 0, 0, 0, rod));
    return [cadera, rod];
  };
  const brazo = (x) => {
    const hombro = hueso(x, 0.455, 0, torso);
    const codo = hueso(0, -0.27, 0, hombro);
    const b = conPiel(geoExtremidad(PERFIL_BRAZO, (mujer ? 0.9 : 1) * (complexion > 1 ? 1.1 : complexion < 1 ? 0.92 : 1), corta ? 1.17 : 0.885, 1.105, 0.035, x), [mManga, mPiel], hombro, codo);
    const ab = b;
    const mano = hueso(0, -0.24, 0, codo);
    const mn = malla(R.mano, mPiel, 0, 0, 0, mano);
    if (x < 0) mn.scale.x = -1;
    mn.rotation.y = x > 0 ? -1.25 : 1.25;
    manos.push(mn);
    detalles.push(mn);
    return [hombro, codo, mano, b, ab];
  };
  const corta = o.mangaCorta ?? (o.ropa === undefined && r() < 0.45);
  const manos = [];
  const [pi, ri] = pierna(0.1), [pd, rd] = pierna(-0.1);
  const [bi, ci, mi, bri, abi] = brazo(mujer ? 0.2 : 0.218), [bd, cd, md, brd, abd] = brazo(mujer ? -0.2 : -0.218);
  if (mujer) pecho.scale.set(0.93, 1, 0.98);
  for (const sx of [1, -1]) { const dl = new THREE.Mesh(R.deltoide, mManga); dl.position.set(sx * 0.182, 0.437, 0); dl.rotation.z = sx * -0.5; dl.castShadow = true; pecho.add(dl); }
  if (complexion !== 1) { pecho.scale.x *= complexion; pecho.scale.z *= complexion * 1.02; }
  if (complexion > 1.05 && !mujer) malla(R.panza, mTorso, 0, 0, 0, torso);
  if (!mujer && !o.sinAccesorios && r() < 0.6) { malla(R.cinturon, mat(['#151515', '#3a2414', '#5a3a20'][r() * 3 | 0]), 0, 0, 0, torso); malla(R.hebilla, MAT_PLATA_P, 0, 0, 0, torso); }
  if (!o.sinAccesorios && (o.mochila ?? r() < 0.12)) malla(R.mochila, mat(['#2a3a5a', '#3a3a40', '#8a3030', '#3a5a3a'][r() * 4 | 0]), 0, 0, 0, torso);
  if (edad === 'mayor') { torso.rotation.x = 0.12; cab.rotation.x = -0.08; }
  const armas = crearArmas(md);
  const paraguas = new THREE.Group();
  { const tela = new THREE.Mesh(R.paraguas, new THREE.MeshStandardMaterial({ color: ['#1a1a1e', '#8a2a26', '#2e5a8a', '#3a6a44', '#5a3a6a', '#d8b040'][r() * 6 | 0], roughness: 0.6, side: THREE.DoubleSide })); tela.castShadow = true; paraguas.add(tela, new THREE.Mesh(R.baston, MAT_NEGRO)); }
  paraguas.position.set(0.2, 0.62, 0.2); paraguas.rotation.set(0.12, 0, -0.12); paraguas.visible = false; torso.add(paraguas);
  let faldaMalla = null;
  const prenda = o.prenda !== undefined ? o.prenda : o.fijo || o.ropa === null ? null : r() < 0.14 ? 'sudadera' : mujer && r() < 0.3 ? 'vestido' : null;
  if (prenda === 'sudadera') {
    const ms = tela(mat(['#3a3e48', '#7a2f3a', '#2e5a8a', '#1a1a1e', '#5a6a3a', '#a8a8a8', '#c8602a'][r() * 7 | 0]), 'algodon'); ms.roughness = 0.95;
    pecho.material = ms; bri.material = brd.material = ms; abi.material = abd.material = ms;
    malla(R.capucha, ms, 0, 0, 0, torso); malla(R.bolsa, ms, 0, 0, 0, torso);
  }
  if (prenda === 'vestido') {
    const mv = mat(['#8a3048', '#2d3a5a', '#3a6a5a', '#d8b0a0', '#1a1a1e', '#c8802a', '#5a3a7a'][r() * 7 | 0]); mv.side = THREE.DoubleSide;
    pecho.material = mv; bri.material = brd.material = mv;
    const f = malla(R.falda, mv, 0, 0.66, 0, cuerpo); f.scale.set(1.05, 1.45, 0.78); faldaMalla = f;
  }
  if (mujer && !o.fijo) { const bg = mover(esf(0.052, 12, 10), 0, 0, 0, 1, 0.85, 0.72); for (const sx of [0.058, -0.058]) { const b = new THREE.Mesh(bg, pecho.material); b.position.set(sx, 0.35, 0.082); b.castShadow = true; torso.add(b); } }
  if (prenda !== 'vestido' && (o.falda ?? (estilo === 'largo' && r() < 0.6))) { const f = malla(R.falda, mat(o.colorFalda || ['#8a3030', '#2d3a5a', '#5a3a7a', '#2a6a5a', '#8a4a6a', '#3a3a40'][r() * 6 | 0]), 0, 0.77, 0, cuerpo); faldaMalla = f; f.scale.z = 0.75; f.material.side = THREE.DoubleSide; }
  if (o.chaleco) { const ch = malla(new THREE.LatheGeometry([[0.16, 0.1], [0.172, 0.12], [0.174, 0.2], [0.182, 0.3], [0.198, 0.4], [0.2, 0.45], [0.188, 0.47], [0.15, 0.475]].map(([a, b]) => new THREE.Vector2(a * 1.08, b)), 24).scale(1, 1, 0.7), mat(o.chaleco), 0, 0, 0, torso); ch.material.side = THREE.DoubleSide; }
  if (o.escala) g.scale.setScalar(o.escala);
  else if (!o.fijo) g.scale.setScalar((mujer ? 0.95 : 1) * (0.94 + r() * 0.12) * (edad === 'mayor' ? 0.97 : 1));
  if (o.policia) {
    const placa = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 6).rotateX(Math.PI / 2), MAT_ORO); placa.position.set(0.07, 0.36, 0.148); torso.add(placa);
    const nombre = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.004), MAT_PLATA_P); nombre.position.set(-0.07, 0.36, 0.148); torso.add(nombre);
    for (const sx of [0.19, -0.19]) { const parche = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.04), new THREE.MeshStandardMaterial({ color: '#c8a040', roughness: 0.6 })); parche.position.set(sx * 1.08, 0.4, 0); torso.add(parche); }
    const radio = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.07, 0.025, 1, 0.008), MAT_NEGRO); radio.position.set(-0.11, 0.46, 0.08); radio.rotation.z = 0.3; torso.add(radio);
    const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.05, 20, 1, true).scale(1, 1, 0.66), MAT_NEGRO); cinto.position.y = 0.02; torso.add(cinto);
    for (const [sx, w] of [[0.15, 0.05], [-0.15, 0.04], [0.0, 0.05]]) { const b = new THREE.Mesh(new RoundedBoxGeometry(w, 0.07, 0.04, 1, 0.01), MAT_NEGRO); b.position.set(sx, -0.01, sx === 0 ? -0.11 : 0.02); torso.add(b); }
  }
  if (o.maton) {
    const cad = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.009, 6, 20), MAT_ORO); cad.position.set(0, 0.48, 0.05); cad.rotation.x = Math.PI / 2 + 0.45; torso.add(cad);
    detalles.push(malla(R.lentes, MAT_NEGRO, 0, 0, 0, cab));
  }
  if (o.reloj) { const rel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 12, 1, true), MAT_PLATA_P); rel.position.set(0, -0.215, 0); manos[0]?.parent?.parent?.add(rel); }
  if (o.collar) { const c2 = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.004, 4, 20), MAT_ORO); c2.position.set(0, 0.52, 0.03); c2.rotation.x = Math.PI / 2 + 0.5; torso.add(c2); }
  if (o.aretes && !mujer) detalles.push(malla(R.aretes, MAT_ORO, 0, 0, 0, cab));
  const ojos = detalles[0], labios = detalles[3], cejas = [cejaI, cejaD];
  const andar = { amp: (edad === 'mayor' ? 0.75 : 0.92 + r() * 0.16) * (mujer ? 0.94 : 1), brazos: 0.8 + r() * 0.4, cadera: mujer ? 0.09 : 0.03, postura: edad === 'mayor' ? 0.12 : (r() - 0.5) * 0.08, ritmo: edad === 'mayor' ? 0.85 : 0.95 + r() * 0.1 };
  return { grupo: g, cuerpo, torso, pecho, cuello, cabeza: cab, pi, pd, ri, rd, bi, bd, ci, cd, mi, md, mangas: [bri, brd], ...armas, detalles, ojos, labios, cejas, andar, paraguas, manos, colaPelo, falda: faldaMalla, mujer, edad, fase: Math.random() * 6, inclina: 0, aterriza: 0, estilo, lod: true, parpadeo: 2 + Math.random() * 4 };
}

export function ponerChamarra(p, color) {
  const m = mat(color); m.side = THREE.DoubleSide;
  const ch = new THREE.Mesh(R.chamarra, m); ch.castShadow = true; ch.scale.copy(p.pecho.scale); p.torso.add(ch);
  for (const k of p.mangas) k.material = m;
  const cuello = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.026, 8, 18, Math.PI * 1.4), m); cuello.position.set(0, 0.53, -0.012); cuello.rotation.set(Math.PI / 2 + 0.25, 0, Math.PI * 0.8); p.torso.add(cuello);
}

export function nivelDetalle(p, cerca) {
  if (p.ocultaRealista || p.lod === cerca) return;
  p.lod = cerca;
  for (const d of p.detalles) d.visible = cerca;
  p.cuello.visible = cerca;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function animar(p, dt, vel, arma, apunta, giro = 0, aire = null) {
  const A = p.andar || { amp: 1, brazos: 1, cadera: 0.04, postura: 0, ritmo: 1 };
  p.fase += dt * (vel < 0.15 ? 0 : (3.4 + vel * 1.1) * A.ritmo);
  const s = Math.sin(p.fase), c = Math.cos(p.fase);
  const camina = Math.min(1, vel / 3.2), corre = clamp((vel - 4.2) / 2.8, 0, 1);
  const amp = camina * (0.48 + corre * 0.24) * A.amp;
  const t = performance.now() / 1000;
  p.pi.rotation.set(s * amp, 0, 0.02); p.pd.rotation.set(-s * amp, 0, -0.02);
  p.ri.rotation.x = Math.max(0, -c) * amp * (1.2 + corre * 0.9) + camina * 0.08;
  p.rd.rotation.x = Math.max(0, c) * amp * (1.2 + corre * 0.9) + camina * 0.08;
  p.cuerpo.position.y = Math.abs(c) * amp * (0.05 + corre * 0.04) - corre * 0.03;
  p.inclina += ((corre * 0.2 + camina * 0.04 + A.postura) - p.inclina) * Math.min(1, dt * 6);
  p.cuerpo.rotation.x = p.inclina;
  p.cuerpo.rotation.y = s * camina * A.cadera * (1 - corre);
  p.cuerpo.rotation.z += (-giro * 0.1 * camina - p.cuerpo.rotation.z) * Math.min(1, dt * 6);
  p.torso.rotation.y = s * amp * 0.22;
  p.torso.position.y = 0.92 + (vel < 0.15 ? Math.sin(t * 1.6 + p.fase) * 0.006 : 0);
  p.cabeza.rotation.y = -p.torso.rotation.y * 0.8 + (vel < 0.15 ? Math.sin(t * 0.45 + p.fase) * 0.25 : 0);
  p.cabeza.rotation.x = -corre * 0.12;
  const sacando = p.sacar > 0 ? (p.sacar = Math.max(0, p.sacar - dt)) / 0.38 : 0;
  const ver = sacando < 0.55;
  for (const k of ARMAS_MANO) if (p[k]) p[k].visible = ver && arma === k;
  if (p.manos) {
    const sostiene = ver && arma !== 'puno', puno = corre > 0.35 || apunta;
    const gI = puno ? R.puno : R.mano, gD = (puno || sostiene || p.telefono?.visible) ? R.puno : R.mano;
    if (p.manos[0].geometry !== gI) p.manos[0].geometry = gI;
    if (p.manos[1].geometry !== gD) p.manos[1].geometry = gD;
  }
  if (p.colaPelo) { p.colaPelo.rotation.x = 0.35 + Math.abs(s) * camina * 0.35 + corre * 0.3; p.colaPelo.rotation.z = Math.sin(p.fase) * 0.2 * camina; }
  if (p.falda) { p.falda.rotation.x = s * 0.06 * camina; p.falda.rotation.z = Math.sin(p.fase * 2) * 0.03 * camina; }
  if (vel < 0.15 && p.pecho) { const res = Math.sin(t * 1.7 + p.fase) * 0.012; p.pecho.scale.z = (p.pechoZ ?? (p.pechoZ = p.pecho.scale.z)) * (1 + res); p.pecho.scale.x = (p.pechoX ?? (p.pechoX = p.pecho.scale.x)) * (1 + res * 0.4); p.cuerpo.rotation.z = Math.sin(t * 0.37 + p.fase) * 0.025; }
  if (p.ojos) {
    p.parpadeo -= dt;
    const cierra = p.parpadeo < 0.12 && p.parpadeo > 0;
    const e = cierra ? 0.12 : 1;
    p.ojos.scale.y = e; if (p.detalles[1]) p.detalles[1].scale.y = e;
    if (p.parpadeo <= 0) p.parpadeo = 2 + Math.random() * 4.5;
  }
  if (p.cejas) {
    const ex = p.expresion, k = Math.min(1, dt * 10);
    const ry = ex === 'miedo' ? 0.182 : ex === 'enojo' ? 0.165 : 0.171, rz = ex === 'enojo' ? 0.38 : ex === 'miedo' ? -0.3 : 0.12;
    p.cejas[0].position.y += (ry - p.cejas[0].position.y) * k; p.cejas[1].position.y = p.cejas[0].position.y;
    p.cejas[0].rotation.z += (rz - p.cejas[0].rotation.z) * k; p.cejas[1].rotation.z = -p.cejas[0].rotation.z;
    if (ex === 'miedo' && p.ojos.scale.y > 0.5) { p.ojos.scale.y = 1.3; p.detalles[1].scale.y = 1.2; }
  }
  if (p.labios) {
    const ex = p.expresion;
    p.labios.scale.set(ex === 'miedo' ? 0.85 : ex === 'enojo' ? 1.1 : 1, p.habla ? 1 + Math.abs(Math.sin(t * 13 + p.fase)) * 1.4 : ex === 'miedo' ? 2.6 : ex === 'enojo' ? 0.6 : 1, 1);
  }
  if (p.aterriza > 0) {
    p.aterriza = Math.max(0, p.aterriza - dt);
    const k = p.aterriza / 0.28;
    p.cuerpo.position.y -= k * 0.16;
    p.ri.rotation.x += k * 0.9; p.rd.rotation.x += k * 0.9;
    p.pi.rotation.x -= k * 0.45; p.pd.rotation.x -= k * 0.45;
  }
  if (p.manosArriba) {
    p.bi.rotation.set(-Math.PI + 0.35, 0, 0.35); p.bd.rotation.set(-Math.PI + 0.35, 0, -0.35);
    p.ci.rotation.x = -0.9; p.cd.rotation.x = -0.9;
    return;
  }
  const dos = DOS_MANOS.includes(arma);
  if (apunta && !SIN_APUNTAR.includes(arma)) {
    p.bd.rotation.set(-Math.PI / 2 + 0.06, dos ? 0.12 : 0, 0); p.cd.rotation.x = dos ? -0.15 : 0;
    if (dos) { p.bi.rotation.set(-Math.PI / 2 + 0.25, -0.55, 0); p.ci.rotation.x = -0.7; }
    else { p.bi.rotation.set(-1.3, -0.45, 0); p.ci.rotation.x = -0.4; }
    p.torso.rotation.y = 0.12;
  } else {
    const brazos = (0.75 + corre * 0.55) * camina * A.brazos;
    p.bi.rotation.set(-s * brazos, 0, 0.08 + corre * 0.06);
    p.bd.rotation.set(s * brazos, 0, -0.08 - corre * 0.06);
    const codo = -(0.2 + camina * 0.25 + corre * 1.15);
    p.ci.rotation.x = codo + Math.max(0, s) * 0.2 * camina; p.cd.rotation.x = codo + Math.max(0, -s) * 0.2 * camina;
    if (arma === 'bate' || arma === 'llave') { p.bd.rotation.set(-0.45 + s * brazos * 0.15, 0, 0.18); p.cd.rotation.x = -2.25; }
    else if (arma === 'lanzacohetes') { p.bd.rotation.set(-0.35, 0.2, 0.25); p.cd.rotation.x = -1.6; p.bi.rotation.set(-0.7, -0.4, -0.1); p.ci.rotation.x = -1.1; }
    else if (DOS_MANOS.includes(arma)) { p.bd.rotation.set(-0.55, 0.3, 0.1); p.cd.rotation.x = -0.9; p.bi.rotation.set(-0.85, -0.5, -0.1); p.ci.rotation.x = -1.2; }
    if (vel < 0.15) { const r = Math.sin(t * 1.6 + p.fase) * 0.03; p.bi.rotation.x = r; p.bd.rotation.x = -r; p.bi.rotation.z = 0.1; p.bd.rotation.z = -0.1; }
  }
  if (sacando > 0) {
    const k = Math.sin(sacando * Math.PI);
    p.bd.rotation.set(p.bd.rotation.x * (1 - k) + 0.5 * k, 0, -0.35 * k);
    p.cd.rotation.x = p.cd.rotation.x * (1 - k) - 1.4 * k;
  }
  if (aire) {
    const sube = clamp(aire.vy / 6, -1, 1);
    p.pi.rotation.x = -0.9 + sube * 0.2; p.ri.rotation.x = 1.5 - Math.max(0, -sube) * 0.9;
    p.pd.rotation.x = -0.25; p.rd.rotation.x = 0.7 - Math.max(0, -sube) * 0.4;
    if (!apunta) { p.bi.rotation.set(-1.2 - sube * 0.6, 0, 0.5); p.bd.rotation.set(-1.0 - sube * 0.6, 0, -0.5); p.ci.rotation.x = -0.6; p.cd.rotation.x = -0.6; }
    p.cuerpo.position.y = 0;
  }
}

export function montar(p, c, dt) {
  const v = c ? Math.abs(c.adelante || 0) : 0, giro = c ? c.giroSuave || 0 : 0, acel = c ? c.acel || 0 : 0;
  const k = Math.min(1, dt * 8), L = (o, prop, val) => { o.rotation[prop] += (val - o.rotation[prop]) * k; };
  const tuck = Math.min(1, Math.max(0, (v - 12) / 25)), parado = v < 0.8 && !(c && c.enAire);
  L(p.cuerpo, 'x', parado ? 0.12 : 0.38 + tuck * 0.3 - Math.max(-0.15, Math.min(0.2, acel * 0.012)));
  L(p.cuerpo, 'z', -giro * 0.22 * Math.min(1, v / 12));
  p.cuerpo.position.set(0, 0, 0);
  L(p.pd, 'x', -1.15); L(p.pd, 'z', -0.12); L(p.rd, 'x', 1.75);
  if (parado) { L(p.pi, 'x', -0.35); L(p.pi, 'z', 0.42); L(p.ri, 'x', 0.25); }
  else { L(p.pi, 'x', -1.15); L(p.pi, 'z', 0.12); L(p.ri, 'x', 1.75); }
  const brazo = -1.05 - tuck * 0.25 - (parado ? 0 : 0.12);
  L(p.bi, 'x', brazo); L(p.bd, 'x', brazo); L(p.bi, 'z', 0.18); L(p.bd, 'z', -0.18);
  L(p.ci, 'x', -0.55 + tuck * 0.2); L(p.cd, 'x', -0.55 + tuck * 0.2);
  L(p.cabeza, 'x', -(0.32 + tuck * 0.28)); L(p.cabeza, 'y', giro * 0.35);
  p.torso.rotation.set(0, 0, 0);
}

export function sentar(p) {
  p.pi.rotation.set(-1.45, 0, 0.2); p.pd.rotation.set(-1.45, 0, -0.2);
  p.ri.rotation.x = 1.35; p.rd.rotation.x = 1.35;
  p.bi.rotation.set(-1.1, 0, -0.15); p.bd.rotation.set(-1.1, 0, 0.15);
  p.ci.rotation.x = -0.5; p.cd.rotation.x = -0.5;
  p.cuerpo.rotation.set(0.25, 0, 0); p.cuerpo.position.set(0, 0, 0);
  p.torso.rotation.set(0, 0, 0);
}

export function golpe(p, t, arma, combo = 0) {
  const k = Math.sin(Math.min(1, t) * Math.PI);
  if (arma === 'sigilo') {
    p.bi.rotation.set(-1.6 * Math.min(1, t * 2), 0.6, 0.3); p.ci.rotation.x = -1.2;
    p.bd.rotation.set(-1.2 - 0.6 * k, -0.3, -0.2); p.cd.rotation.x = -1.4 + k;
    p.cuerpo.position.y -= 0.1 * k; p.torso.rotation.x = 0.25 * k;
    return;
  }
  if (arma === 'puno' && combo === 2) {
    p.pd.rotation.set(-1.7 * k, 0, 0); p.rd.rotation.x = 0.9 * (1 - k); p.pi.rotation.x = 0.25 * k;
    p.cuerpo.rotation.x = -0.25 * k; p.bi.rotation.set(-0.6, 0, 0.6 * k); p.bd.rotation.set(-0.6, 0, -0.6 * k);
    p.torso.rotation.y = -0.3 * k;
    return;
  }
  if (arma === 'puno' && combo === 1) {
    p.bi.rotation.set(-Math.PI / 2 * k, 0, -0.8 * k); p.ci.rotation.x = -1.2 * (1 - k * 0.5); p.bd.rotation.set(-0.9, 0, 0); p.cd.rotation.x = -2;
    p.torso.rotation.y = -0.55 * k; p.cabeza.rotation.y = 0.3 * k;
    return;
  }
  if ((arma === 'bate' || arma === 'machete' || arma === 'llave') && combo === 1) { p.bd.rotation.set(-1.2 - t * 0.4, 0, -0.7 + t * 1.8); p.cd.rotation.x = -0.4; p.torso.rotation.y = -0.6 * k; return; }
  if (arma === 'bate' || arma === 'machete' || arma === 'llave') { p.bd.rotation.set(-1.9 + t * 2.2, 0, 0.9 - t * 1.6); p.cd.rotation.x = -0.3; }
  else if (arma === 'granada' || arma === 'molotov') { p.bd.rotation.set(-2.9 * k, 0, 0); p.cd.rotation.x = -0.4 * (1 - k); }
  else if (arma === 'cuchillo') { p.bd.rotation.set(-Math.PI / 2 * k - 0.3, 0.4 * k, 0); p.cd.rotation.x = -0.6 * (1 - k); }
  else { p.bd.rotation.set(-Math.PI / 2 * k, 0, 0); p.cd.rotation.x = -1.6 * (1 - k); p.bi.rotation.set(-0.9, 0, 0); p.ci.rotation.x = -2; }
  p.torso.rotation.y = (arma === 'bate' || arma === 'machete' || arma === 'llave' ? 0.7 : 0.35) * k;
}

export function tumbar(p, t, lado = 1) {
  const v = p.semilla ?? (p.semilla = Math.random());
  const rodillas = Math.min(1, t * 5), k0 = Math.min(1, Math.max(0, (t - 0.12) * 2.6)), k = k0 * k0 * (3 - 2 * k0);
  const rebote = t > 0.5 && t < 0.75 ? Math.sin((t - 0.5) / 0.25 * Math.PI) * 0.06 : 0;
  p.cuerpo.rotation.x = -Math.PI / 2 * k * lado;
  p.cuerpo.rotation.z = (v - 0.5) * 0.5 * k;
  p.cuerpo.position.y = 0.14 * k + rebote - 0.25 * rodillas * (1 - k);
  p.cuerpo.position.z = 0;
  const a = v * 6.28;
  p.bi.rotation.set(-2.5 * k + Math.sin(a) * 0.5 * k, 0, (0.5 + Math.cos(a) * 0.6) * k); p.bd.rotation.set(-2.2 * k + Math.cos(a * 1.3) * 0.6 * k, 0, (-0.6 - Math.sin(a) * 0.5) * k);
  p.ci.rotation.x = (-0.4 - v * 0.6) * k; p.cd.rotation.x = (-0.9 + v * 0.4) * k;
  p.pi.rotation.x = 0.15 * k - 0.5 * rodillas * (1 - k) + (v > 0.5 ? -0.6 : 0) * k; p.pd.rotation.x = -0.25 * k - 0.5 * rodillas * (1 - k);
  p.ri.rotation.x = 0.3 * k + 0.9 * rodillas * (1 - k) + (v > 0.5 ? 1.1 : 0) * k; p.rd.rotation.x = 0.7 * k + 0.9 * rodillas * (1 - k);
  p.pi.rotation.z = (v - 0.5) * 0.4 * k; p.pd.rotation.z = -(v - 0.3) * 0.3 * k;
  p.cabeza.rotation.y = (v - 0.5) * 1.4 * k; p.cabeza.rotation.x = (v - 0.5) * 0.4 * k;
}

export function volar(p, giro) {
  p.cuerpo.rotation.x = giro; p.cuerpo.position.set(0, 0.9 - 0.9 * Math.cos(giro), -0.9 * Math.sin(giro));
  p.bi.rotation.set(-2.6, 0, 0.9); p.bd.rotation.set(-2.4, 0, -1); p.ci.rotation.x = -0.6; p.cd.rotation.x = -0.4;
  p.pi.rotation.set(-0.7, 0, 0.3); p.pd.rotation.set(0.3, 0, -0.25); p.ri.rotation.x = 1.2; p.rd.rotation.x = 0.4;
}

export function levantar(p) {
  p.cuerpo.rotation.set(0, 0, 0);
  p.cuerpo.position.set(0, 0, 0);
  p.ri.rotation.x = 0; p.rd.rotation.x = 0;
}
