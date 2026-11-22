import * as THREE from 'three';
import { linea, indiceLinea, BLOQUES, CARRIL, CALLE, LIMITE } from './ciudad.js?v=202611212226';
import { mat } from './persona.js?v=202611212226';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hoja } from './texturas.js?v=202611212226';
const FRENTES = hoja('assets/frentes.png', 4, 3, { magenta: true, tam: 512, sinUrl: true });
const IDX_FRENTE = { sedan: 0, compacto: 1, camioneta: 2, deportivo: 3, taxi: 4, policia: 5, ambulancia: 6 };
const IDX_ATRAS = { sedan: 8, compacto: 8, camioneta: 10, deportivo: 8, taxi: 9, policia: 11, ambulancia: 10 };
export const matsDecal = FRENTES.map(p => new THREE.MeshLambertMaterial({ map: p.textura, transparent: true, alphaTest: 0.35, emissive: '#ffffff', emissiveMap: p.textura, emissiveIntensity: 0 }));

export const TIPOS = {
  compacto: { largo: 3.7, ancho: 1.7, alto: 0.55, cabina: 0.55, vmax: 33, acel: 9, freno: 18, giro: 2.3, masa: 0.8, salud: 90 },
  sedan: { largo: 4.5, ancho: 1.85, alto: 0.6, cabina: 0.5, vmax: 38, acel: 10, freno: 20, giro: 2.1, masa: 1, salud: 110 },
  taxi: { largo: 4.4, ancho: 1.82, alto: 0.6, cabina: 0.5, vmax: 37, acel: 10, freno: 20, giro: 2.1, masa: 1, salud: 110 },
  camioneta: { largo: 5, ancho: 2, alto: 0.75, cabina: 0.65, vmax: 34, acel: 9, freno: 17, giro: 1.8, masa: 1.4, salud: 150 },
  deportivo: { largo: 4.4, ancho: 1.95, alto: 0.5, cabina: 0.42, vmax: 55, acel: 16, freno: 26, giro: 2.4, masa: 1, salud: 100 },
  policia: { largo: 4.7, ancho: 1.9, alto: 0.62, cabina: 0.5, vmax: 46, acel: 13, freno: 24, giro: 2.2, masa: 1.2, salud: 160 },
  moto: { largo: 2.1, ancho: 0.8, alto: 0.5, cabina: 0, vmax: 50, acel: 17, freno: 26, giro: 3.1, masa: 0.45, salud: 60 },
  ambulancia: { largo: 5.4, ancho: 2.1, alto: 0.8, cabina: 0.62, vmax: 37, acel: 9.5, freno: 18, giro: 1.85, masa: 1.5, salud: 170 },
  autobus: { largo: 10.5, ancho: 2.55, alto: 2.4, cabina: 0, vmax: 20, acel: 4.5, freno: 10, giro: 1.25, masa: 4, salud: 400 },
  lancha: { largo: 5.2, ancho: 2.1, alto: 0.5, cabina: 0, vmax: 30, acel: 8.5, freno: 5, giro: 1.5, masa: 1.1, salud: 140 },
  blindado: { largo: 6, ancho: 2.3, alto: 1.9, cabina: 0.6, vmax: 26, acel: 6, freno: 14, giro: 1.5, masa: 3, salud: 520 }
};

export const COLORES_COCHE = ['#8a2a26', '#2e5a8a', '#d8d4cc', '#2a2c30', '#b8962e', '#3a6a44', '#5a3a6a', '#a8602a', '#6a6e72', '#2a6a64', '#9a4a24', '#34404e', '#7a3048', '#c8c0b0'];

const geoRueda = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12);
geoRueda.rotateZ(Math.PI / 2);
const geoRin = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 8);
geoRin.rotateZ(Math.PI / 2);
const matVidrio = new THREE.MeshLambertMaterial({ color: '#4a6a8a', emissive: '#0d1622' });
const matLlanta = mat('#151515');
const matRin = mat('#b8bcc2');
export const matFaro = new THREE.MeshBasicMaterial({ color: '#fff6d8' });
export const matCalavera = new THREE.MeshBasicMaterial({ color: '#c0182a' });
const matRojo = new THREE.MeshBasicMaterial({ color: '#ff1a3a' });
const matAzul = new THREE.MeshBasicMaterial({ color: '#1a5cff' });
const matApagado = mat('#30323a');
const matQuemado = mat('#1b1b1b');
const _halo = document.createElement('canvas'); _halo.width = _halo.height = 64;
{ const g = _halo.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,200,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
export const matHalo = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(_halo), color: '#fff2cf', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });

const PERFIL = {
  compacto: { capo: 0.7, cabT: -0.4, cabF: 0.22, inclF: 0.5, inclT: 0.22 },
  sedan: { capo: 0.95, cabT: -0.27, cabF: 0.15, inclF: 0.62, inclT: 0.52 },
  taxi: { capo: 0.95, cabT: -0.27, cabF: 0.15, inclF: 0.62, inclT: 0.52 },
  policia: { capo: 0.95, cabT: -0.27, cabF: 0.15, inclF: 0.62, inclT: 0.52 },
  camioneta: { capo: 0.9, cabT: -0.12, cabF: 0.3, inclF: 0.45, inclT: 0.05 },
  ambulancia: { capo: 1.0, cabT: 0.05, cabF: 0.3, inclF: 0.5, inclT: 0.05 },
  deportivo: { capo: 1.4, cabT: -0.3, cabF: 0.02, inclF: 0.85, inclT: 0.78 }
};
const cacheGeo = {};
const ni = g => g.index ? g.toNonIndexed() : g;

function extruir(puntos, ancho, bisel = 0.07) {
  const f = new THREE.Shape();
  puntos.forEach(([x, y], i) => i ? f.lineTo(x, y) : f.moveTo(x, y));
  f.closePath();
  const g = new THREE.ExtrudeGeometry(f, { depth: Math.max(0.05, ancho - bisel * 2), bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel * 0.8, bevelSegments: 4, curveSegments: 6 });
  g.translate(0, 0, -(ancho - bisel * 2) / 2);
  g.rotateY(-Math.PI / 2);
  return g;
}

function cascaron(puntos, ancho, o = {}) {
  const estrecha = o.estrecha ?? 0.14, tumble = o.tumble ?? 0.08, pe = o.p ?? 3.4, n = o.n ?? 46, m = o.m ?? 30;
  const xs = puntos.map(q => q[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const bordes = puntos.map((q, i) => [q, puntos[(i + 1) % puntos.length]]);
  const corte = x => {
    let lo = Infinity, hi = -Infinity;
    for (const [a, b] of bordes) {
      if ((x < Math.min(a[0], b[0])) || (x > Math.max(a[0], b[0])) || a[0] === b[0]) continue;
      const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      lo = Math.min(lo, y); hi = Math.max(hi, y);
    }
    return lo === Infinity ? null : [lo, hi];
  };
  const pos = [], idx = [], secciones = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = x0 + (x1 - x0) * (0.5 - Math.cos(u * Math.PI) / 2);
    const xx = Math.min(x1 - 0.004, Math.max(x0 + 0.004, x)), c = corte(xx);
    if (!c) continue;
    const t = Math.abs((xx - (x0 + x1) / 2) / ((x1 - x0) / 2));
    const w = ancho / 2 * (1 - estrecha * Math.pow(t, 4)) * (i === 0 || i === n ? 0.82 : 1);
    secciones.push({ x: xx, lo: c[0], hi: c[1], w });
  }
  secciones.forEach((S, i) => {
    const mid = (S.lo + S.hi) / 2, hh = (S.hi - S.lo) / 2;
    for (let k = 0; k < m; k++) {
      const a = k / m * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const ex = Math.sign(ca) * Math.pow(Math.abs(ca), 2 / pe), ey = Math.sign(sa) * Math.pow(Math.abs(sa), 2 / pe);
      const w = S.w * (1 - tumble * Math.max(0, ey) * Math.max(0, ey));
      pos.push(ex * w, mid + ey * hh, S.x);
    }
  });
  const ns = secciones.length;
  for (let i = 0; i < ns - 1; i++) for (let k = 0; k < m; k++) {
    const a = i * m + k, b = i * m + (k + 1) % m, c = (i + 1) * m + k, d = (i + 1) * m + (k + 1) % m;
    idx.push(a, b, c, b, d, c);
  }
  for (const [i, inv] of [[0, true], [ns - 1, false]]) {
    const S = secciones[i], ci = pos.length / 3; pos.push(0, (S.lo + S.hi) / 2, S.x);
    for (let k = 0; k < m; k++) { const a = i * m + k, b = i * m + (k + 1) % m; if (inv) idx.push(ci, b, a); else idx.push(ci, a, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const uv = new Float32Array(pos.length / 3 * 2); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

function geometrias(tipo) {
  if (cacheGeo[tipo]) return cacheGeo[tipo];
  const t = TIPOS[tipo], P = PERFIL[tipo];
  const L = t.largo, H = t.alto, C = t.cabina, A = t.ancho, piso = 0.3;
  const yb = piso, yt = piso + H;
  const cuerpo = tipo === 'camioneta' || tipo === 'ambulancia'
    ? [[-L / 2, yb + 0.05], [L / 2 - 0.05, yb + 0.05], [L / 2, yt - 0.2], [L / 2 - 0.25, yt], [-L / 2 + 0.05, yt], [-L / 2, yt - 0.15]]
    : [[-L / 2 + 0.05, yb + 0.05], [L / 2 - 0.12, yb + 0.05], [L / 2, yb + H * 0.45], [L / 2 - 0.1, yt - 0.12], [L / 2 - P.capo * 0.5, yt], [-L / 2 + 0.55, yt + 0.04], [-L / 2 + 0.05, yt - 0.1], [-L / 2, yb + H * 0.4]];
  const cr = L * P.cabT, cf = L * P.cabF;
  const vidrio = [[cr, yt - 0.02], [cf + P.inclF, yt - 0.02], [cf, yt + C], [cr + P.inclT, yt + C]];
  const techo = [[cr + P.inclT - 0.04, yt + C - 0.05], [cf + 0.04, yt + C - 0.05], [cf - 0.06, yt + C + 0.06], [cr + P.inclT + 0.06, yt + C + 0.06]];
  const caja = tipo === 'camioneta' || tipo === 'ambulancia';
  const geo = {
    cuerpo: cascaron(cuerpo, A, { estrecha: caja ? 0.06 : 0.13, tumble: 0.05, p: caja ? 5 : 3.6 }),
    vidrio: cascaron(vidrio, A * 0.86, { estrecha: 0.12, tumble: 0.26, p: 3.2, n: 30 }),
    techo: cascaron(techo, A * 0.88, { estrecha: 0.1, tumble: 0.18, p: 3, n: 24 })
  };
  const g = mergeGeometries([ni(geo.cuerpo), ni(geo.techo)]);
  const extras = [];
  if (tipo === 'camioneta') {
    const caja = new THREE.BoxGeometry(A * 0.84, 0.32, L * 0.42); caja.translate(0, yt + 0.02, -L * 0.24);
    extras.push(caja);
  }
  if (tipo === 'ambulancia') { const caja = new THREE.BoxGeometry(A * 0.98, 1.25, L * 0.56); caja.translate(0, yt + 0.58, -L * 0.2); extras.push(caja); }
  if (tipo === 'deportivo') { const al = new THREE.BoxGeometry(A * 0.92, 0.06, 0.38); al.translate(0, yt + 0.34, -L / 2 + 0.2); extras.push(al); const p1 = new THREE.BoxGeometry(0.08, 0.3, 0.1); p1.translate(-A * 0.35, yt + 0.17, -L / 2 + 0.25); const p2 = p1.clone(); p2.translate(A * 0.7, 0, 0); extras.push(p1, p2); }
  geo.pinta = extras.length ? mergeGeometries([g, ...extras.map(ni)]) : g;
  const trim = [];
  for (const sz of [1, -1]) { const d = new THREE.BoxGeometry(A * 1.0, 0.2, 0.16); d.translate(0, yb + 0.16, sz * (L / 2 - 0.02)); trim.push(d); }
  for (const sx of [1, -1]) { const s1 = new THREE.BoxGeometry(0.06, 0.12, L * 0.62); s1.translate(sx * (A / 2 + 0.01), yb + 0.18, 0); trim.push(s1); const esp = new THREE.BoxGeometry(0.2, 0.1, 0.1); esp.translate(sx * (A / 2 + 0.06), yt + 0.12, cf + 0.25); trim.push(esp); }
  if (tipo === 'camioneta') { const hueco = new THREE.BoxGeometry(A * 0.76, 0.3, L * 0.38); hueco.translate(0, yt + 0.05, -L * 0.24); trim.push(hueco); }
  geo.trim = mergeGeometries(trim.map(ni));
  const faros = [], calav = [];
  for (const sx of [1, -1]) {
    const f = new THREE.BoxGeometry(0.42, 0.13, 0.06); f.translate(sx * (A / 2 - 0.32), yb + H * 0.62, L / 2 - 0.03); faros.push(f);
    const c = new THREE.BoxGeometry(0.46, 0.13, 0.06); c.translate(sx * (A / 2 - 0.3), yb + H * 0.72, -L / 2 + 0.02); calav.push(c);
  }
  geo.faros = mergeGeometries(faros.map(ni));
  geo.calaveras = mergeGeometries(calav.map(ni));
  if (tipo === 'policia') { const b = new THREE.BoxGeometry(A * 1.01, H * 0.5, L * 0.46); b.translate(0, yb + H * 0.45, 0.05); geo.franja = b; }
  if (tipo === 'taxi') { const b = new THREE.BoxGeometry(A * 1.01, 0.14, L * 0.9); b.translate(0, yb + H * 0.5, 0); geo.franja = b; }
  if (tipo === 'ambulancia') { const b = new THREE.BoxGeometry(A * 1.005, 0.16, L * 0.97); b.translate(0, yb + H * 0.55, 0); const b2 = new THREE.BoxGeometry(A * 0.99, 0.14, L * 0.57); b2.translate(0, yt + 0.62, -L * 0.2); const cz = new THREE.BoxGeometry(A * 0.995, 0.5, 0.14); cz.translate(0, yt + 0.62, -L * 0.2); const cz2 = new THREE.BoxGeometry(A * 0.995, 0.14, 0.5); cz2.translate(0, yt + 0.62, -L * 0.2); geo.franja = mergeGeometries([b, b2, cz, cz2].map(ni)); }
  geo.yt = yt; geo.cf = cf; geo.cr = cr;
  cacheGeo[tipo] = geo;
  return geo;
}

const geoLlanta = new THREE.LatheGeometry([[0.2, -0.135], [0.31, -0.137], [0.35, -0.115], [0.365, -0.06], [0.367, 0], [0.365, 0.06], [0.35, 0.115], [0.31, 0.137], [0.2, 0.135]].map(([r, y]) => new THREE.Vector2(r, y)), 22); geoLlanta.rotateZ(Math.PI / 2);
const geoRin2 = (() => {
  const p = [new THREE.CylinderGeometry(0.06, 0.07, 0.3, 12).rotateZ(Math.PI / 2), new THREE.TorusGeometry(0.205, 0.022, 6, 22).rotateY(Math.PI / 2).translate(0.13, 0, 0), new THREE.TorusGeometry(0.205, 0.022, 6, 22).rotateY(Math.PI / 2).translate(-0.13, 0, 0)];
  for (let k = 0; k < 5; k++) for (const x of [0.12, -0.12]) { const r = new THREE.BoxGeometry(0.03, 0.16, 0.045); r.translate(0, 0.11, 0); r.rotateX(k * Math.PI * 2 / 5 + (x > 0 ? 0 : 0.3)); r.translate(x, 0, 0); p.push(r); }
  return mergeGeometries(p.map(g => g.index ? g.toNonIndexed() : g));
})();
const matVidrio2 = new THREE.MeshStandardMaterial({ color: '#1c2a3c', metalness: 0.5, roughness: 0.06, envMapIntensity: 1.5, transparent: true, opacity: 0.72 });
const PIELES_C = ['#c08a62', '#9a6a48', '#d8a888', '#7a5238', '#b07650'];
const ROPA_C = ['#2a2c34', '#8a2a26', '#e8e4da', '#2e5a8a', '#3a6a44', '#5a3a6a', '#b8962e'];
const geoTorsoC = new THREE.CapsuleGeometry(0.17, 0.28, 4, 10).scale(1, 1, 0.7);
const geoCabezaC = new THREE.SphereGeometry(0.1, 12, 10).scale(0.9, 1.12, 1);
const geoBrazoC = new THREE.CapsuleGeometry(0.045, 0.34, 3, 6);
const geoVolante = new THREE.TorusGeometry(0.17, 0.02, 6, 18);
const matInterior = new THREE.MeshStandardMaterial({ color: '#202126', roughness: 0.9 });
const matTrim = new THREE.MeshStandardMaterial({ color: '#16171b', roughness: 0.6, metalness: 0.2 });
const matRin2 = new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: 0.92, roughness: 0.22 });
const matCromo = new THREE.MeshStandardMaterial({ color: '#d8dce2', metalness: 1, roughness: 0.15 });
const matVidrioRoto = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = 'rgba(40,55,70,0.55)'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(230,240,245,0.85)'; g.lineWidth = 1.2;
  for (let n = 0; n < 4; n++) { const cx = Math.random() * 256, cy = Math.random() * 256; for (let r = 0; r < 14; r++) { const a = Math.random() * 6.28; let x = cx, y = cy; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 5; s++) { x += Math.cos(a + (Math.random() - 0.5) * 0.6) * 18; y += Math.sin(a + (Math.random() - 0.5) * 0.6) * 18; g.lineTo(x, y); } g.stroke(); } for (let r = 1; r < 4; r++) { g.beginPath(); g.arc(cx, cy, r * 16, 0, 7); g.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, transparent: true, opacity: 0.9, roughness: 0.4, metalness: 0.2 });
})();
const matHueco = new THREE.MeshBasicMaterial({ color: '#07080a' });
const matForro = new THREE.MeshStandardMaterial({ color: '#24252a', roughness: 0.85, side: THREE.DoubleSide });
const geoArco = new THREE.TorusGeometry(0.44, 0.045, 6, 18, Math.PI);
const geoHueco = new THREE.CircleGeometry(0.45, 18, 0, Math.PI);
export const pinturas = new Set();

function modeloMoto(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.3 });
  pinturas.add(pinta);
  const m = (geo, mt, x, y, z, rx = 0) => { const k = new THREE.Mesh(geo, mt); k.position.set(x, y, z); k.rotation.x = rx; k.castShadow = true; carro.add(k); return k; };
  const tanque = m(new THREE.BoxGeometry(0.34, 0.26, 0.6), pinta, 0, 0.82, 0.25);
  m(new THREE.BoxGeometry(0.3, 0.12, 0.62), matTrim, 0, 0.86, -0.3);
  m(new THREE.BoxGeometry(0.26, 0.34, 0.9), matTrim, 0, 0.55, 0);
  m(new THREE.BoxGeometry(0.36, 0.3, 0.42), pinta, 0, 0.74, -0.7, 0.3);
  m(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6), matRin2, 0, 0.62, 0.78, -0.35);
  m(new THREE.BoxGeometry(0.7, 0.04, 0.04), matTrim, 0, 1.08, 0.62);
  m(new THREE.BoxGeometry(0.2, 0.16, 0.12), matFaro, 0, 0.92, 0.82);
  const cal = m(new THREE.BoxGeometry(0.16, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: '#a01020' }), 0, 0.8, -0.93);
  m(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 8), matRin2, 0.18, 0.4, -0.45, Math.PI / 2 - 0.15);
  const h = new THREE.Sprite(matHalo); h.position.set(0, 0.92, 0.95); h.scale.setScalar(1.4); carro.add(h);
  const rueda = new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16); rueda.rotateZ(Math.PI / 2);
  const ruedas = [], delanteras = [];
  for (const z of [0.78, -0.72]) {
    const piv = new THREE.Group(); piv.position.set(0, 0.34, z);
    const ll = new THREE.Mesh(rueda, matLlanta); ll.castShadow = true; ll.add(new THREE.Mesh(geoRin2.clone().scale(0.6, 1.2, 1.2), matRin2));
    piv.add(ll); carro.add(piv); ruedas.push(ll); if (z > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [tanque], calav: cal.material, calavMalla: cal };
}

function modeloBlindado(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: 0.5, roughness: 0.4 }); pinturas.add(pinta);
  const m = (geo, mt, x, y, z) => { const k = new THREE.Mesh(geo, mt); k.position.set(x, y, z); k.castShadow = true; carro.add(k); return k; };
  const caja = m(new THREE.BoxGeometry(2.3, 2.1, 4), pinta, 0, 1.55, -0.9);
  const cabina = m(new THREE.BoxGeometry(2.2, 1.5, 1.8), pinta, 0, 1.25, 2.05);
  m(new THREE.BoxGeometry(2.0, 0.6, 0.05), matVidrio2, 0, 1.6, 2.96);
  m(new THREE.BoxGeometry(2.32, 0.4, 4.02), mat('#1f6b3a'), 0, 1.3, -0.9);
  m(new THREE.BoxGeometry(2.4, 0.3, 6), matTrim, 0, 0.45, 0);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.5), new THREE.MeshBasicMaterial({ map: letreroTex('VALORES OCCIDENTE', '#1f6b3a', '#ffd77a') }));
  for (const s of [-1, 1]) { const x = l.clone(); x.position.set(s * 1.165, 2.1, -0.9); x.rotation.y = s * Math.PI / 2; carro.add(x); }
  const cal = m(new THREE.BoxGeometry(2, 0.15, 0.05), new THREE.MeshBasicMaterial({ color: '#a01020' }), 0, 0.9, -2.93);
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 2], [1, 2], [-1, -1.9], [1, -1.9]]) {
    const piv = new THREE.Group(); piv.position.set(sx * 1.05, 0.45, sz);
    const ll = new THREE.Mesh(geoLlanta, matLlanta); ll.scale.setScalar(1.25); ll.castShadow = true; ll.add(new THREE.Mesh(geoRin2, matRin2));
    piv.add(ll); g.add(piv); ruedas.push(ll); if (sz > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [caja, cabina], calav: cal.material, calavMalla: cal };
}

function letreroTex(texto, fondo, tinta) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 76;
  const g = c.getContext('2d'); g.fillStyle = fondo; g.fillRect(0, 0, 512, 76);
  g.fillStyle = tinta; g.font = '900 52px Anton, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, 256, 40);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function modeloAutobus(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshPhysicalMaterial({ color, metalness: 0.3, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  pinturas.add(pinta);
  const blanco = new THREE.MeshStandardMaterial({ color: '#eeeeea', roughness: 0.45 });
  const L = 10.5, A = 2.55;
  const m = (geo, mat, x, y, z) => { const k = new THREE.Mesh(geo, mat); k.position.set(x, y, z); k.castShadow = true; carro.add(k); return k; };
  const cuerpo = m(new RoundedBoxGeometry(A, 2.5, L, 3, 0.18), blanco, 0, 1.75, 0);
  m(new THREE.BoxGeometry(A + 0.02, 0.55, L - 0.3), pinta, 0, 0.85, 0);
  m(new THREE.BoxGeometry(A + 0.03, 0.9, L - 1.2), matVidrio2, 0, 2.0, -0.4);
  m(new THREE.BoxGeometry(A - 0.2, 1.1, 0.05), matVidrio2, 0, 2.0, L / 2 + 0.01);
  m(new THREE.BoxGeometry(0.06, 1.9, 1.0), matTrim, A / 2 + 0.02, 1.45, L / 2 - 1.3);
  const c = document.createElement('canvas'); c.width = 256; c.height = 48; const x = c.getContext('2d');
  x.fillStyle = '#111'; x.fillRect(0, 0, 256, 48); x.fillStyle = '#ffb030'; x.font = '900 30px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('7 · CENTRO', 128, 26);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  m(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshBasicMaterial({ map: t }), 0, 2.78, L / 2 + 0.02);
  for (const sx of [-1, 1]) { const f = m(new THREE.BoxGeometry(0.3, 0.16, 0.05), matFaro, sx * (A / 2 - 0.35), 0.9, L / 2 + 0.01); f.castShadow = false; }
  const cal = m(new THREE.BoxGeometry(A - 0.4, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: '#a01020' }), 0, 1.0, -L / 2 - 0.01); cal.visible = false;
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 0.34], [1, 0.34], [-1, -0.3], [1, -0.3]]) {
    const piv = new THREE.Group(); piv.position.set(sx * (A / 2 - 0.15), 0.5, sz * L);
    const ll = new THREE.Mesh(geoLlanta, matLlanta); ll.scale.setScalar(1.4); ll.castShadow = true; ll.add(new THREE.Mesh(geoRin2, matRin2));
    piv.add(ll); g.add(piv); ruedas.push(ll); if (sz > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [cuerpo], calav: cal.material, calavMalla: cal };
}

function modeloLancha(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshPhysicalMaterial({ color, metalness: 0.2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  pinturas.add(pinta);
  const blanco = new THREE.MeshPhysicalMaterial({ color: '#f2f2ee', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
  const f = new THREE.Shape();
  f.moveTo(-1, -2.4); f.lineTo(1, -2.4); f.lineTo(1.05, 0.6); f.quadraticCurveTo(0.9, 2.1, 0, 2.7); f.quadraticCurveTo(-0.9, 2.1, -1.05, 0.6); f.closePath();
  const casco = new THREE.ExtrudeGeometry(f, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3 });
  casco.rotateX(Math.PI / 2); casco.translate(0, 0.62, 0);
  const m = (geo, mat, x = 0, y = 0, z = 0) => { const k = new THREE.Mesh(geo, mat); k.position.set(x, y, z); k.castShadow = true; carro.add(k); return k; };
  const cuerpo = m(casco, blanco);
  m(new THREE.BoxGeometry(2.18, 0.14, 4.6), pinta, 0, 0.32, -0.05);
  m(new THREE.BoxGeometry(1.8, 0.06, 3.6), new THREE.MeshStandardMaterial({ color: '#c8b48a', roughness: 0.8 }), 0, 0.66, -0.3);
  const vid = m(new THREE.BoxGeometry(1.6, 0.42, 0.06), new THREE.MeshStandardMaterial({ color: '#2a3a4a', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.7 }), 0, 0.95, 0.7); vid.rotation.x = -0.5;
  m(new THREE.BoxGeometry(0.7, 0.45, 0.6), new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.7 }), 0.35, 0.9, 0.1);
  m(new THREE.BoxGeometry(1.6, 0.35, 0.55), new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.7 }), 0, 0.85, -1.6);
  const motor = m(new THREE.BoxGeometry(0.45, 0.8, 0.5), new THREE.MeshStandardMaterial({ color: '#1c1c20', roughness: 0.4, metalness: 0.4 }), 0, 0.75, -2.55);
  const cal = m(new THREE.BoxGeometry(0.3, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: '#c0182a' }), 0, 1.1, -2.8); cal.visible = false;
  return { grupo: g, carro, pinta, ruedas: [], delanteras: [], barra: null, partes: [cuerpo, motor], calav: cal.material, calavMalla: cal };
}

export function modelo(tipo, color) {
  if (tipo === 'moto') return modeloMoto(color);
  if (tipo === 'lancha') return modeloLancha(color);
  if (tipo === 'autobus') return modeloAutobus(color);
  if (tipo === 'blindado') return modeloBlindado(color);
  const t = TIPOS[tipo];
  const G = geometrias(tipo);
  const g = new THREE.Group();
  const carro = new THREE.Group();
  g.add(carro);
  const pinta = new THREE.MeshPhysicalMaterial({ color, metalness: 0.4, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 0.9 });
  pinturas.add(pinta);
  const malla = (geo, m) => { const x = new THREE.Mesh(geo, m); x.castShadow = true; carro.add(x); return x; };
  const cuerpo = malla(G.pinta, pinta);
  const cab = malla(G.vidrio, matVidrio2);
  malla(G.trim, matTrim);
  const calav = new THREE.MeshBasicMaterial({ color: '#a01020' });
  const H = t.alto, piso = 0.3;
  const df = new THREE.Mesh(new THREE.PlaneGeometry(t.ancho * 0.98, H * 0.72), matsDecal[IDX_FRENTE[tipo]]);
  df.position.set(0, piso + H * 0.42, t.largo / 2 + 0.125); carro.add(df);
  const da = new THREE.Mesh(new THREE.PlaneGeometry(t.ancho * 0.96, H * 0.62), matsDecal[IDX_ATRAS[tipo]]);
  da.position.set(0, piso + H * 0.55, -t.largo / 2 - 0.125); da.rotation.y = Math.PI; carro.add(da);
  const cal = malla(G.calaveras, calav); cal.castShadow = false; cal.position.z = -0.04; cal.visible = false;
  if (G.franja) malla(G.franja, tipo === 'policia' ? mat('#1f4fa8') : tipo === 'ambulancia' ? mat('#c8202e') : mat('#ffffff'));
  let barra = null;
  if (tipo === 'ambulancia') {
    const y = G.yt + 1.26, z = -t.largo * 0.2 + t.largo * 0.26;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.22), matRojo); b1.position.set(-0.45, y, z);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.22), matRojo); b2.position.set(0.45, y, z);
    carro.add(b1, b2); barra = [b1, b2];
  }
  if (tipo === 'policia') {
    const y = G.yt + t.cabina + 0.14, z = (G.cf + G.cr + 0.4) / 2;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.26), matRojo); b1.position.set(-0.3, y, z);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.26), matAzul); b2.position.set(0.3, y, z);
    carro.add(b1, b2); barra = [b1, b2];
  }
  if (tipo === 'taxi') { const s = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.28), new THREE.MeshBasicMaterial({ color: '#ffe066' })); s.position.set(0, G.yt + t.cabina + 0.16, (G.cf + G.cr + 0.4) / 2); carro.add(s); }
  for (const s of [-1, 1]) {
    const h = new THREE.Sprite(matHalo);
    h.position.set(s * (t.ancho / 2 - 0.32), 0.3 + t.alto * 0.62, t.largo / 2 + 0.25);
    h.scale.setScalar(1.6);
    carro.add(h);
  }
  const P = PERFIL[tipo], yb = piso, yt = piso + H;
  for (const sx of [-1, 1]) for (const sz of [1, -1]) {
    const z = sz * t.largo * 0.31;
    const arco = new THREE.Mesh(geoArco, matTrim); arco.position.set(sx * (t.ancho / 2 + 0.012), 0.36, z); arco.rotation.y = Math.PI / 2; carro.add(arco);
    const hueco = new THREE.Mesh(geoHueco, matHueco); hueco.position.set(sx * (t.ancho / 2 + 0.006), 0.36, z); hueco.rotation.y = sx * Math.PI / 2; carro.add(hueco);
  }
  const zf = G.cf + P.inclF * 0.62, largoP = Math.min(1.25, (zf - G.cr) * (tipo === 'deportivo' || tipo === 'compacto' ? 0.72 : 0.5));
  const puerta = new THREE.Group(); puerta.position.set(t.ancho / 2 + 0.004, 0, zf); carro.add(puerta);
  const altoP = yt - yb - 0.16;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.035, altoP, largoP).translate(0.0175, yb + 0.1 + altoP / 2, -largoP / 2), pinta); panel.castShadow = true; puerta.add(panel);
  const forro = new THREE.Mesh(new THREE.PlaneGeometry(largoP * 0.96, altoP * 0.9).rotateY(-Math.PI / 2).translate(-0.002, yb + 0.1 + altoP / 2, -largoP / 2), matForro); puerta.add(forro);
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.02, t.cabina * 0.78, largoP * 0.86).translate(-0.03, yt + t.cabina * 0.4, -largoP * 0.5), matVidrio2); puerta.add(vent); vent.visible = false;
  const manija = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.16).translate(0.04, yt - 0.1, -largoP + 0.2), matRin2); puerta.add(manija);
  const linea = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.022, Math.max(0.5, zf + 0.3 - G.cr)).translate(0, yt + 0.012, (zf - 0.1 + G.cr) / 2), matCromo);
  for (const sx of [-1, 1]) { const l = linea.clone(); l.position.x = sx * (t.ancho * 0.43); carro.add(l); }
  if (tipo !== 'deportivo' && tipo !== 'compacto') { const pil = new THREE.Mesh(new THREE.BoxGeometry(t.ancho * 0.85, t.cabina * 0.92, 0.09), matTrim); pil.position.set(0, yt + t.cabina * 0.48, zf - largoP - 0.02); carro.add(pil); }
  const silueta = new THREE.Group();
  if (tipo !== 'camioneta' || true) {
    const ropa = new THREE.MeshStandardMaterial({ color: tipo === 'policia' ? '#1f3f7a' : tipo === 'ambulancia' ? '#e8e8e4' : ROPA_C[Math.random() * ROPA_C.length | 0], roughness: 0.85 });
    const piel = new THREE.MeshStandardMaterial({ color: PIELES_C[Math.random() * PIELES_C.length | 0], roughness: 0.7 });
    const sx = t.ancho * 0.2, sz = zf - largoP * 0.55, sy = yt - 0.34;
    const torso = new THREE.Mesh(geoTorsoC, ropa); torso.position.set(sx, sy + 0.2, sz - 0.08); torso.rotation.x = -0.18;
    const cabeza = new THREE.Mesh(geoCabezaC, piel); cabeza.position.set(sx, sy + 0.58, sz - 0.12);
    const pelo = new THREE.Mesh(new THREE.SphereGeometry(0.104, 12, 8, 0, Math.PI * 2, 0, 1.4).scale(0.92, 1.1, 1.02), new THREE.MeshStandardMaterial({ color: ['#15100c', '#2b1d14', '#4a3020', '#121212'][Math.random() * 4 | 0], roughness: 0.9 })); pelo.position.copy(cabeza.position).y += 0.01;
    const vol = new THREE.Mesh(geoVolante, matInterior); vol.position.set(sx, sy + 0.32, sz + 0.42); vol.rotation.x = -0.9;
    const b1 = new THREE.Mesh(geoBrazoC, ropa); b1.position.set(sx + 0.13, sy + 0.32, sz + 0.18); b1.rotation.x = -1.15;
    const b2 = b1.clone(); b2.position.x = sx - 0.13;
    const asiento = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.12), matInterior); asiento.position.set(sx, sy + 0.25, sz - 0.3); asiento.rotation.x = -0.12;
    const asiento2 = asiento.clone(); asiento2.position.x = -sx;
    silueta.add(torso, cabeza, pelo, b1, b2);
    carro.add(silueta, vol, asiento, asiento2);
    silueta.visible = false;
  }
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const piv = new THREE.Group();
    piv.position.set(sx * (t.ancho / 2 - 0.1), 0.36, sz * t.largo * 0.31);
    const ll = new THREE.Mesh(geoLlanta, matLlanta); ll.castShadow = true;
    ll.add(new THREE.Mesh(geoRin2, matRin2));
    piv.add(ll);
    g.add(piv);
    ruedas.push(ll);
    if (sz > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra, partes: [cuerpo, cab, panel], calav, calavMalla: cal, puerta, ventPuerta: vent, silueta };
}

const _p = new THREE.Vector3();

export class Coche {
  static vidrioRoto = matVidrioRoto;
  constructor(juego, tipo, color, x, z, yaw) {
    this.juego = juego;
    this.tipo = tipo;
    this.t = TIPOS[tipo];
    this.color = color || COLORES_COCHE[Math.random() * COLORES_COCHE.length | 0];
    const m = modelo(tipo, this.color);
    Object.assign(this, m);
    if (tipo === 'moto') {
      const pp = juego.crearPiloto?.();
      if (pp) { pp.grupo.position.set(0, 0.42, -0.15); this.carro.add(pp.grupo); this.piloto = pp.grupo; this.pilotoP = pp; }
    }
    this.pos = new THREE.Vector3(x, 0, z);
    this.yaw = yaw;
    this.vx = 0; this.vz = 0;
    this.adelante = 0;
    this.giroSuave = 0;
    this.salud = this.t.salud;
    this.conductor = null;
    this.quemado = 0;
    this.fuego = 0;
    this.radio = Math.max(this.t.ancho, this.t.largo * 0.5) * 0.62;
    this.ia = null;
    this.atorado = 0;
    this.reversa = 0;
    this.sirena = tipo === 'policia';
    this.luces = false;
    this.marcado = false;
    this.grupo.position.copy(this.pos);
    this.grupo.rotation.y = yaw;
    juego.escena.add(this.grupo);
  }
  get fx() { return Math.sin(this.yaw); }
  get fz() { return Math.cos(this.yaw); }
  get vel() { return Math.hypot(this.vx, this.vz); }
  quitar() { this.juego.escena.remove(this.grupo); pinturas.delete(this.pinta); }

  fisicaLancha(dt) {
    const L = this.juego.ciudad.lago, t = performance.now() / 1000;
    if (this.tipo === 'lancha' && this.conductor !== 'jugador') { this.vx *= 1 - dt * 0.8; this.vz *= 1 - dt * 0.8; }
    this.pos.x += this.vx * dt; this.pos.z += this.vz * dt;
    if (L) {
      const r = 1.6, M = L.muelle;
      if (this.pos.x < L.x0 + r) { this.pos.x = L.x0 + r; this.vx = Math.abs(this.vx) * 0.3; this.ultimoChoque = 4; }
      if (this.pos.x > L.x1 - r) { this.pos.x = L.x1 - r; this.vx = -Math.abs(this.vx) * 0.3; this.ultimoChoque = 4; }
      if (this.pos.z < L.z0 + r) { this.pos.z = L.z0 + r; this.vz = Math.abs(this.vz) * 0.3; this.ultimoChoque = 4; }
      if (this.pos.z > L.z1 - r) { this.pos.z = L.z1 - r; this.vz = -Math.abs(this.vz) * 0.3; this.ultimoChoque = 4; }
      if (this.pos.z > M.z0 - r && Math.abs(this.pos.x - M.x) < 1.5 + r) { const s = Math.sign(this.pos.x - M.x) || 1; this.pos.x = M.x + s * (1.5 + r); this.vx = s * Math.abs(this.vx) * 0.3; }
    }
    const vel = Math.hypot(this.vx, this.vz);
    this.y = 0; this.enAire = false;
    this.carro.position.y = Math.sin(t * 1.7 + this.pos.x * 0.3) * 0.05 + Math.min(0.18, vel * 0.008) - 0.25;
    this.carro.rotation.x = -Math.min(0.14, vel * 0.006) + Math.sin(t * 1.3 + this.pos.z * 0.2) * 0.02;
    this.carro.rotation.z = -this.giroSuave * Math.min(1, vel / 15) * 0.18 + Math.cos(t * 1.1) * 0.02;
    if (vel > 4 && Math.random() < dt * 30 && this.juego.humo) this.juego.humo(this.pos.x - this.fx * 2.6 + (Math.random() - 0.5), 0.35, this.pos.z - this.fz * 2.6 + (Math.random() - 0.5), 0.7 + vel * 0.03, '#f4f8fa', 0.9);
    this.grupo.position.set(this.pos.x, 0, this.pos.z);
    this.grupo.rotation.y = this.yaw;
  }

  manejar(dt, acel, giro, freno, nitro = false) {
    const t = this.t;
    if (this.quemado) { acel = 0; giro = 0; freno = true; }
    this.frenando = (acel < 0 && this.adelante > 0.5) || freno;
    if (this.enAire) { this.giroSuave += (giro - this.giroSuave) * Math.min(1, dt * 3); this.yaw -= this.giroSuave * 0.6 * dt; this.adelante = this.vx * this.fx + this.vz * this.fz; return; }
    const turbo = nitro && acel > 0 ? 1 : 0;
    this.turbo = turbo;
    const fx = this.fx, fz = this.fz, rx = -fz, rz = fx;
    let fw = this.vx * fx + this.vz * fz;
    let lat = this.vx * rx + this.vz * rz;
    const fuerzaMotor = this.salud < 25 ? 0.6 : 1;
    if (acel > 0) {
      if (fw < -0.5) fw += t.freno * acel * dt;
      else fw += t.acel * acel * fuerzaMotor * (1 + turbo * 1.4) * (1 - Math.max(0, fw) / (t.vmax * (1 + turbo * 0.35))) * dt * 1.25;
    } else if (acel < 0) {
      if (fw > 0.5) fw += t.freno * acel * dt;
      else fw += t.acel * 0.55 * acel * dt;
    } else {
      fw -= Math.sign(fw) * Math.min(Math.abs(fw), 2.2 * dt);
    }
    fw = Math.max(-t.vmax * 0.3, Math.min(t.vmax * (1 + turbo * 0.35), fw));
    fw *= 1 - 0.04 * dt;
    this.giroSuave += (giro - this.giroSuave) * Math.min(1, dt * 7);
    const factorV = Math.max(-1, Math.min(1, fw / 5));
    const rapido = Math.min(1, Math.abs(fw) / t.vmax);
    const tasa = this.giroSuave * t.giro * factorV * (1 - rapido * 0.5) * (freno ? 1.35 : 1);
    this.yaw -= tasa * dt;
    const agarre = this.tipo === 'lancha' ? 1.6 : freno ? 1.3 : 7.5;
    lat *= Math.exp(-agarre * dt);
    if (freno) fw -= Math.sign(fw) * Math.min(Math.abs(fw), 9 * dt);
    this.derrape = Math.abs(lat);
    const nfx = Math.sin(this.yaw), nfz = Math.cos(this.yaw), nrx = -nfz, nrz = nfx;
    this.vx = nfx * fw + nrx * lat;
    this.vz = nfz * fw + nrz * lat;
    this.adelante = fw;
  }

  fisica(dt) {
    if (this.tipo === 'lancha') return this.fisicaLancha(dt);
    this.pos.x += this.vx * dt;
    this.pos.z += this.vz * dt;
    const mundo = this.juego.mundo;
    this.y = this.y || 0; this.vy = this.vy || 0;
    const R = this.juego.actividades?.altura(this.pos.x, this.pos.z);
    const suelo = R ? R.h : 0;
    if (R) this.ultimaRampa = R.rampa;
    if ((R && this.y <= suelo + 0.5 && this.vy < 6) || (!R && this.y <= suelo + 0.03 && this.vy <= 0)) {
      this.vyRampa = dt > 0 ? (suelo - (this.sueloPrev ?? suelo)) / dt : 0;
      this.y = suelo; this.vy = Math.max(0, this.vyRampa);
      this.enAire = false;
    } else {
      this.vy -= 22 * dt;
      this.y += this.vy * dt;
      this.enAire = this.y > suelo + 0.05;
      if (this.y <= suelo) {
        if (this.vy < -7) { this.dañar((-this.vy - 7) * 3, 'caida'); this.juego.audio?.choque(-this.vy * 1.5, this.pos); this.rebote = Math.min(0.25, -this.vy * 0.02); if (this === this.juego.jugador.coche) this.juego.sacudida = Math.max(this.juego.sacudida, 0.3); }
        this.y = suelo; this.vy = 0; this.enAire = false;
      }
    }
    this.sueloPrev = suelo;
    const L = this.t.largo * 0.3, rad = this.t.ancho * 0.56;
    let golpe = 0;
    for (const s of [1, -1, 0]) {
      _p.set(this.pos.x + this.fx * L * s, 0, this.pos.z + this.fz * L * s);
      const ox = _p.x, oz = _p.z;
      const n = mundo.empujar(_p, s === 0 ? rad * 1.05 : rad, 0.4 + this.y);
      if (n) {
        this.pos.x += _p.x - ox; this.pos.z += _p.z - oz;
        const vn = this.vx * n.x + this.vz * n.z;
        if (vn < -4) this.abollar(-n.x, -n.z, -vn);
        if (vn < 0) {
          this.vx -= 1.35 * vn * n.x; this.vz -= 1.35 * vn * n.z;
          golpe = Math.max(golpe, -vn);
        }
      }
    }
    if (golpe > 0) {
      if (this.tipo === 'moto' && golpe > 11 && this.conductor === 'jugador') this.juego.caerseDeMoto?.(this, golpe);
      const f = this.vx * this.fx + this.vz * this.fz;
      this.vx *= 0.8; this.vz *= 0.8;
      if (golpe > 5) this.dañar((golpe - 5) * 2.2 / this.t.masa, 'choque');
      if (golpe > 3) { this.juego.audio?.choque(golpe, this.pos); this.cabV = (this.cabV || 0) + Math.min(2.2, golpe * 0.09); this.rolV = (this.rolV || 0) + (Math.random() - 0.5) * Math.min(2.5, golpe * 0.12); this.alturaV = (this.alturaV || 0) + Math.min(1.5, golpe * 0.05); }
      this.ultimoChoque = golpe;
    }
    const vel = this.vel;
    for (const r of this.ruedas) r.rotation.x += this.adelante * dt / 0.36;
    if (this.puerta) { const o = this.puertaObj || 0; this.puertaA = (this.puertaA || 0) + (o - (this.puertaA || 0)) * Math.min(1, dt * 10); this.puerta.rotation.y = -this.puertaA * 1.1; this.ventPuerta.visible = this.puertaA > 0.03; if (this.puertaCierra && (this.puertaCierra -= dt) <= 0) { this.puertaCierra = 0; this.puertaObj = 0; } }
    for (const d of this.delanteras) d.rotation.y = -this.giroSuave * 0.5;
    const inclinar = this.tipo === 'moto' ? 0.55 : 0.075 + (this.t.masa || 1) * 0.015;
    const metaRol = (-this.giroSuave * Math.min(1, vel / 20)) * inclinar;
    if (this.tipo === 'moto') this.carro.rotation.z += (metaRol - this.carro.rotation.z) * Math.min(1, dt * 5);
    else { const h = Math.min(dt, 1 / 30); this.rolV = (this.rolV || 0) + ((metaRol - this.carro.rotation.z) * 70 - this.rolV * 7.5) * h; this.carro.rotation.z += this.rolV * h; }
    if (this.piloto) this.piloto.visible = this.conductor === 'ia' || this.conductor === 'rival' || this.conductor === 'policia';
    if (this.silueta) this.silueta.visible = !!this.conductor && !this.quemado && !(this.juego.entrando?.c === this);
    const fwd = this.adelante;
    const aceleracion = dt > 0 ? (fwd - (this.fwdPrev ?? fwd)) / dt : 0;
    this.fwdPrev = fwd;
    this.acel = aceleracion;
    const caballito = this.tipo === 'moto' && this.conductor === 'jugador' && !this.enAire && aceleracion > 7 && fwd > 2 && fwd < 24 ? -Math.min(0.3, (aceleracion - 7) * 0.035) : 0;
    const cabeceo = this.enAire ? -Math.atan2(this.vy, Math.max(4, Math.abs(fwd))) * 0.7 : caballito || Math.max(-0.065, Math.min(0.065, -aceleracion * 0.005));
    if (this.tipo === 'moto' || this.enAire) { this.carro.rotation.x += (cabeceo - this.carro.rotation.x) * Math.min(1, dt * (this.enAire ? 3 : 6)); this.cabV = 0; }
    else { const h = Math.min(dt, 1 / 30); this.cabV = (this.cabV || 0) + ((cabeceo - this.carro.rotation.x) * 85 - this.cabV * 8) * h; this.carro.rotation.x += this.cabV * h; }
    if (this.estabaAire && !this.enAire && this.tipo !== 'moto') { this.cabV = (this.cabV || 0) + 0.9; this.alturaV = -1.6; }
    this.estabaAire = this.enAire;
    { const h = Math.min(dt, 1 / 30); this.alturaV = (this.alturaV || 0) + (-(this.altura || 0) * 120 - (this.alturaV || 0) * 9) * h; this.altura = (this.altura || 0) + this.alturaV * h; }
    if (this.rebote > 0) this.rebote = Math.max(0, this.rebote - dt * 0.8);
    this.carro.position.y = -(this.rebote || 0) * Math.sin(performance.now() / 40) * 0.5 + (this.tipo === 'moto' ? Math.max(0, -this.carro.rotation.x) * 0.95 : (this.altura || 0) * 0.06);
    if (this.calavMalla) { this.calavMalla.visible = !!this.frenando && !this.quemado; this.calav.color.set('#ff2436'); }
    this.grupo.position.copy(this.pos);
    this.grupo.position.y = this.y;
    this.grupo.rotation.y = this.yaw;
    if (this.barra) {
      const on = this.sirena && (performance.now() / 160 | 0) % 2;
      this.barra[0].material = (this.sirena && on) ? matRojo : matApagado;
      this.barra[1].material = (this.sirena && !on) ? (this.tipo === 'ambulancia' ? matRojo : matAzul) : matApagado;
    }
  }

  abollar(wx, wz, fuerza) {
    if (this.quemado || this.tipo === 'moto' || this.tipo === 'lancha' || fuerza < 4) return;
    const cuerpo = this.partes[0];
    if (!cuerpo?.geometry?.attributes?.position) return;
    if (!this.geoPropia) { cuerpo.geometry = cuerpo.geometry.clone(); this.geoPropia = true; }
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    let lx = wx * cy - wz * sy, lz = wx * sy + wz * cy;
    const m = Math.hypot(lx, lz) || 1; lx /= m; lz /= m;
    const A = this.t.ancho / 2, L = this.t.largo / 2;
    const k = Math.min(A / Math.abs(lx || 1e-6), L / Math.abs(lz || 1e-6));
    const px = lx * k, pz = lz * k, R = 0.65 + Math.min(0.6, fuerza * 0.03), prof = Math.min(0.22, fuerza * 0.012);
    const P = cuerpo.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const d = Math.hypot(x - px, z - pz, (y - 0.65) * 0.7);
      if (d > R) continue;
      const w = Math.pow(1 - d / R, 2) * prof * (0.7 + Math.random() * 0.6);
      P.setXYZ(i, x - lx * w, y - w * 0.25, z - lz * w);
    }
    P.needsUpdate = true; cuerpo.geometry.computeVertexNormals();
    this.abollado = (this.abollado || 0) + fuerza;
    if ((fuerza > 10 || this.abollado > 40) && !this.vidrioRoto && this.partes[1]) { this.vidrioRoto = true; this.partes[1].material = matVidrioRoto; this.juego.audio?.ruidoCorto?.(0.3, 3500, 0.15, 'highpass'); for (let n = 0; n < 6; n++) this.juego.chispa?.(new THREE.Vector3(this.pos.x + (Math.random() - 0.5) * 1.5, 1.3, this.pos.z + (Math.random() - 0.5) * 1.5), '#cfe0ea'); }
  }

  dañar(n, causa, autor) {
    if (this.quemado) return;
    if (this.tipo === 'blindado' && causa !== 'explosion') n *= causa === 'bala' ? 0.3 : 0.5;
    this.salud -= n;
    if (autor === 'jugador') this.golpeadoPorJugador = true;
    if (this.salud <= 0) this.explotar(autor || (this.golpeadoPorJugador ? 'jugador' : null));
  }

  explotar(autor) {
    if (this.quemado) return;
    this.quemado = 1;
    this.salud = 0;
    this.pinta.color.set('#1e1e1e');
    for (const p of this.partes) if (p.material !== matVidrio) p.material = matQuemado;
    this.vx *= 0.3; this.vz *= 0.3;
    this.juego.explosion(this.pos.x, 1, this.pos.z, autor, this);
  }
}

export function direccionesPosibles(ix, iz, dx, dz) {
  const op = [];
  for (const [ax, az] of [[dx, dz], [dz, -dx], [-dz, dx]]) {
    const nx = ix + ax, nz = iz + az;
    if (nx < 0 || nx > BLOQUES || nz < 0 || nz > BLOQUES) continue;
    op.push([ax, az]);
  }
  if (!op.length) op.push([-dx, -dz]);
  return op;
}

export function nuevaRutaIA(x, z, yaw) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  let dx, dz;
  if (Math.abs(fx) > Math.abs(fz)) { dx = Math.sign(fx); dz = 0; } else { dx = 0; dz = Math.sign(fz); }
  let ix = indiceLinea(x), iz = indiceLinea(z);
  if (dx !== 0) { ix = Math.floor(x / 80 + BLOQUES / 2) + (dx > 0 ? 1 : 0); }
  else { iz = Math.floor(z / 80 + BLOQUES / 2) + (dz > 0 ? 1 : 0); }
  ix = Math.max(0, Math.min(BLOQUES, ix)); iz = Math.max(0, Math.min(BLOQUES, iz));
  return { dx, dz, ix, iz, decision: null };
}

export function objetivoIA(c, elegir) {
  const R = c.ia;
  const cx = linea(R.ix), cz = linea(R.iz);
  const rx = -R.dz, rz = R.dx;
  const along = (c.pos.x - cx) * R.dx + (c.pos.z - cz) * R.dz;
  if (!R.decision && along > -16) {
    const op = direccionesPosibles(R.ix, R.iz, R.dx, R.dz);
    R.decision = elegir ? elegir(op, R) : op[Math.random() * op.length | 0];
  }
  if (R.decision) {
    const [ax, az] = R.decision;
    const arx = -az, arz = ax;
    const giro = ax !== R.dx || az !== R.dz;
    const sale = giro ? 6 : 10;
    const wx = cx + arx * CARRIL + ax * sale, wz = cz + arz * CARRIL + az * sale;
    if (giro && along < -CARRIL - 1) {
      return { x: cx + rx * CARRIL - R.dx * (CARRIL + 0.5), z: cz + rz * CARRIL - R.dz * (CARRIL + 0.5), lento: true };
    }
    if ((c.pos.x - wx) * ax + (c.pos.z - wz) * az > -1.5) {
      R.dx = ax; R.dz = az; R.ix += ax; R.iz += az; R.decision = null;
      return objetivoIA(c, elegir);
    }
    return { x: wx + ax * 4, z: wz + az * 4, lento: giro };
  }
  const lx = cx + rx * CARRIL, lz = cz + rz * CARRIL;
  const proy = Math.min(-2, along + 14);
  return { x: lx + R.dx * proy, z: lz + R.dz * proy, lento: false, along };
}

export function dirigir(c, tx, tz) {
  const deseado = Math.atan2(tx - c.pos.x, tz - c.pos.z);
  let d = deseado - c.yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return { giro: Math.max(-1, Math.min(1, -d * 2.2)), angulo: d };
}

export function puntoCalleAleatorio(cerca, rmin, rmax, intentos = 30) {
  for (let k = 0; k < intentos; k++) {
    const eje = Math.random() < 0.5 ? 'x' : 'z';
    const i = Math.random() * (BLOQUES + 1) | 0;
    const j = Math.random() * BLOQUES | 0;
    const t = linea(j) + CALLE / 2 + 6 + Math.random() * (80 - CALLE - 12);
    const dir = Math.random() < 0.5 ? 1 : -1;
    let x, z, yaw;
    if (eje === 'x') { x = t; z = linea(i) + dir * CARRIL; yaw = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    else { z = t; x = linea(i) - dir * CARRIL; yaw = dir > 0 ? 0 : Math.PI; }
    if (Math.abs(x) > LIMITE - 4 || Math.abs(z) > LIMITE - 4) continue;
    if (cerca) {
      const d = Math.hypot(x - cerca.x, z - cerca.z);
      if (d < rmin || d > rmax) continue;
    }
    return { x, z, yaw };
  }
  return null;
}
