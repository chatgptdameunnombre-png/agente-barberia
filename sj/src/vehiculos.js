import { alturaCerro } from './sierradatos.js?v=202611231951';
import { dormirQuieto } from './ligero.js?v=202611231951';
import * as THREE from 'three';
import { linea, indiceLinea, BLOQUES, CARRIL, CALLE, LIMITE } from './ciudad.js?v=202611231951';
import { mat } from './persona.js?v=202611231951';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { hoja } from './texturas.js?v=202611231951';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const FRENTES = hoja('assets/frentes.png', 4, 3, { magenta: true, tam: 512, sinUrl: true });
const IDX_FRENTE = { sedan: 0, compacto: 1, vocho: 1, vochotaxi: 1, camioneta: 2, deportivo: 3, taxi: 4, policia: 5, ambulancia: 6 };
const IDX_ATRAS = { sedan: 8, compacto: 8, vocho: 8, vochotaxi: 8, camioneta: 10, deportivo: 8, taxi: 9, policia: 11, ambulancia: 10 };
export const matsDecal = FRENTES.map(p => new THREE.MeshLambertMaterial({ map: p.textura, transparent: true, alphaTest: 0.35, emissive: '#ffffff', emissiveMap: p.textura, emissiveIntensity: 0 }));

export const esVocho = t => t === 'vocho' || t === 'vochotaxi';
export const esTaxi = c => c.tipo === 'taxi' || c.tipo === 'vochotaxi';

export const TIPOS = {
  compacto: { largo: 3.7, ancho: 1.7, alto: 0.55, cabina: 0.55, vmax: 33, acel: 9, freno: 18, giro: 2.3, masa: 0.8, salud: 90 },
  vocho: { largo: 4.05, ancho: 1.62, alto: 0.56, cabina: 0.66, vmax: 30, acel: 7.5, freno: 17, giro: 2.35, masa: 0.75, salud: 85 },
  vochotaxi: { largo: 4.05, ancho: 1.62, alto: 0.56, cabina: 0.66, vmax: 30, acel: 7.5, freno: 17, giro: 2.35, masa: 0.75, salud: 85 },
  sedan: { largo: 4.5, ancho: 1.85, alto: 0.6, cabina: 0.5, vmax: 38, acel: 10, freno: 20, giro: 2.1, masa: 1, salud: 110 },
  taxi: { largo: 4.4, ancho: 1.82, alto: 0.6, cabina: 0.5, vmax: 37, acel: 10, freno: 20, giro: 2.1, masa: 1, salud: 110 },
  camioneta: { largo: 5, ancho: 2, alto: 0.75, cabina: 0.65, vmax: 34, acel: 9, freno: 17, giro: 1.8, masa: 1.4, salud: 150 },
  deportivo: { largo: 4.4, ancho: 1.95, alto: 0.5, cabina: 0.42, vmax: 55, acel: 16, freno: 26, giro: 2.4, masa: 1, salud: 100 },
  policia: { largo: 4.7, ancho: 1.9, alto: 0.62, cabina: 0.5, vmax: 46, acel: 13, freno: 24, giro: 2.2, masa: 1.2, salud: 160 },
  moto: { largo: 2.1, ancho: 0.8, alto: 0.5, cabina: 0, vmax: 50, acel: 17, freno: 26, giro: 3.1, masa: 0.45, salud: 60 },
  ambulancia: { largo: 5.4, ancho: 2.1, alto: 0.8, cabina: 0.62, vmax: 37, acel: 9.5, freno: 18, giro: 1.85, masa: 1.5, salud: 170 },
  bici: { largo: 1.75, ancho: 0.6, alto: 0.45, cabina: 0, vmax: 13.5, acel: 4.8, freno: 13, giro: 3.3, masa: 0.22, salud: 60 },
  bomberos: { largo: 7.6, ancho: 2.45, alto: 1.3, cabina: 0, vmax: 30, acel: 7, freno: 15, giro: 1.45, masa: 3.4, salud: 400 },
  pipa: { largo: 6.8, ancho: 2.35, alto: 1.2, cabina: 0, vmax: 24, acel: 5.5, freno: 13, giro: 1.5, masa: 2.8, salud: 240 },
  basura: { largo: 7.4, ancho: 2.45, alto: 1.3, cabina: 0, vmax: 20, acel: 4.5, freno: 12, giro: 1.4, masa: 3.2, salud: 320 },
  redilas: { largo: 5.3, ancho: 2.0, alto: 0.8, cabina: 0, vmax: 30, acel: 7.5, freno: 16, giro: 1.75, masa: 1.7, salud: 180 },
  reparto: { largo: 6.6, ancho: 2.3, alto: 1.2, cabina: 0, vmax: 27, acel: 6.5, freno: 14, giro: 1.55, masa: 2.4, salud: 260 },
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
export const matHaz = new THREE.MeshBasicMaterial({ color: '#fff0cc', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, map: (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); for (let y = 0; y < 128; y++) { const k = y / 128; const a = Math.pow(1 - k, 1.6) * Math.min(1, k * 6); const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; const w = 18 + k * 46; g.fillRect(32 - w / 2, 127 - y, w, 1); } const t = new THREE.CanvasTexture(c); return t; })(), polygonOffset: true, polygonOffsetFactor: -3 });
const geoHaz = new THREE.PlaneGeometry(4.2, 11).rotateX(-Math.PI / 2);
export const matCalavera = new THREE.MeshBasicMaterial({ color: '#c0182a' });
const matRojo = new THREE.MeshBasicMaterial({ color: '#ff1a3a' });
const matAzul = new THREE.MeshBasicMaterial({ color: '#1a5cff' });
const matApagado = mat('#30323a');
let TEX_TAXI = null;
const matQuemado = mat('#1b1b1b');
const _halo = document.createElement('canvas'); _halo.width = _halo.height = 64;
{ const g = _halo.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,200,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
export const matHalo = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(_halo), color: '#fff2cf', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });

const PERFIL = {
  compacto: { capo: 0.7, cabT: -0.4, cabF: 0.22, inclF: 0.5, inclT: 0.22 },
  vocho: { capo: 0.9, cabT: -0.27, cabF: 0.13, inclF: 0.36, inclT: 0.5 },
  vochotaxi: { capo: 0.9, cabT: -0.27, cabF: 0.13, inclF: 0.36, inclT: 0.5 },
  sedan: { capo: 0.95, cabT: -0.27, cabF: 0.15, inclF: 0.62, inclT: 0.52 },
  taxi: { capo: 0.95, cabT: -0.27, cabF: 0.15, inclF: 0.62, inclT: 0.52 },
  policia: { capo: 0.95, cabT: -0.27, cabF: 0.15, inclF: 0.62, inclT: 0.52 },
  camioneta: { capo: 0.9, cabT: -0.04, cabF: 0.24, inclF: 0.42, inclT: 0.06 },
  ambulancia: { capo: 1.0, cabT: 0.05, cabF: 0.3, inclF: 0.5, inclT: 0.05 },
  deportivo: { capo: 1.4, cabT: -0.3, cabF: 0.02, inclF: 0.85, inclT: 0.78 }
};
const cacheGeo = {};
export const BL = {};
let BLD = {};
const soloPN = g => { const b = new THREE.BufferGeometry(); b.setAttribute('position', g.attributes.position); b.setAttribute('normal', g.attributes.normal); b.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (g.index) b.setIndex(g.index); return b; };
export async function cargarVehiculos() {
  try {
    const [gl, js] = await Promise.all([new GLTFLoader().loadAsync('assets/vehiculos/vehiculos.glb'), fetch('assets/vehiculos/vehiculos.json').then(r => r.json()).catch(() => ({}))]);
    BLD = js || {};
    gl.scene.traverse(o => { if (!o.isMesh || !o.name.includes('__')) return; const [t, p] = o.name.split('__'); o.updateWorldMatrix(true, false); const g = soloPN(o.geometry.clone().applyMatrix4(o.matrixWorld)); (BL[t] = BL[t] || {})[p] = g; });
  } catch (e) { console.warn('vehiculos.glb', e); }
}
function cabinaBL(tipo, carro, pinta, zFrente) {
  const B = BL[tipo]; if (!B?.cabp) return null;
  const add = (geo, mt, sombra = true) => { if (!geo) return null; const k = new THREE.Mesh(geo, mt); k.position.z = zFrente; k.castShadow = sombra; carro.add(k); return k; };
  const cab = add(B.cabp, pinta); add(B.cabv, matVidrio2); add(B.cabt, matTrim); add(B.cabf, matFaro, false);
  return cab;
}
const matMotor = new THREE.MeshStandardMaterial({ color: '#2b2c30', metalness: 0.7, roughness: 0.4 });
export const matLuzTrasera = new THREE.MeshStandardMaterial({ color: '#8a0e18', roughness: 0.25, metalness: 0.1, emissive: '#ff1a2a', emissiveIntensity: 0.12 });
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
  const B = BL[tipo] || (esVocho(tipo) ? BL.vocho : null);
  if (B?.pinta && B.vidrio) {
    const geo = { pinta: B.pinta, vidrio: B.vidrio, trim: B.trim, cromo: B.cromo, faros: B.faros, calaveras: B.calaveras, defF: B.defF, defA: B.defA, blender: true, datos: BLD[tipo] || {} };
    if (tipo === 'ambulancia') { const c = new THREE.BoxGeometry(A * 0.98, 1.25, L * 0.56); c.translate(0, yt + 0.58, -L * 0.2); geo.pinta = mergeGeometries([ni(B.pinta), soloPN(ni(c))]); }
    if (tipo === 'policia') { const b = new THREE.BoxGeometry(A * 1.01, H * 0.5, L * 0.46); b.translate(0, yb + H * 0.45, 0.05); geo.franja = b; }
    if (tipo === 'taxi') { const b = new THREE.BoxGeometry(A * 1.01, 0.14, L * 0.9); b.translate(0, yb + H * 0.5, 0); geo.franja = b; }
    if (tipo === 'ambulancia') { const b = new THREE.BoxGeometry(A * 1.005, 0.16, L * 0.97); b.translate(0, yb + H * 0.55, 0); const b2 = new THREE.BoxGeometry(A * 0.99, 0.14, L * 0.57); b2.translate(0, yt + 0.62, -L * 0.2); const cz = new THREE.BoxGeometry(A * 0.995, 0.5, 0.14); cz.translate(0, yt + 0.62, -L * 0.2); const cz2 = new THREE.BoxGeometry(A * 0.995, 0.14, 0.5); cz2.translate(0, yt + 0.62, -L * 0.2); geo.franja = mergeGeometries([b, b2, cz, cz2].map(ni)); }
    geo.yt = yt; geo.cf = L * P.cabF; geo.cr = L * P.cabT;
    cacheGeo[tipo] = geo;
    return geo;
  }
  const cuerpo = esVocho(tipo) ? [[-L / 2 + 0.16, yb + 0.06], [L / 2 - 0.18, yb + 0.06], [L / 2 - 0.02, yb + 0.18], [L / 2 - 0.06, yb + 0.34], [L / 2 - 0.42, yt - 0.02], [L / 2 - 1.05, yt + 0.06], [-L / 2 + 1.15, yt + 0.1], [-L / 2 + 0.5, yt - 0.02], [-L / 2 + 0.12, yb + 0.3]]
    : tipo === 'camioneta' || tipo === 'ambulancia'
    ? [[-L / 2, yb + 0.05], [L / 2 - 0.05, yb + 0.05], [L / 2, yt - 0.2], [L / 2 - 0.25, yt], [-L / 2 + 0.05, yt], [-L / 2, yt - 0.15]]
    : [[-L / 2 + 0.05, yb + 0.05], [L / 2 - 0.12, yb + 0.05], [L / 2, yb + H * 0.45], [L / 2 - 0.1, yt - 0.12], [L / 2 - P.capo * 0.5, yt], [-L / 2 + 0.55, yt + 0.04], [-L / 2 + 0.05, yt - 0.1], [-L / 2, yb + H * 0.4]];
  const cr = L * P.cabT, cf = L * P.cabF;
  const vidrio = [[cr, yt - 0.02], [cf + P.inclF, yt - 0.02], [cf, yt + C], [cr + P.inclT, yt + C]];
  const techo = [[cr + P.inclT - 0.04, yt + C - 0.05], [cf + 0.04, yt + C - 0.05], [cf - 0.06, yt + C + 0.06], [cr + P.inclT + 0.06, yt + C + 0.06]];
  const caja = tipo === 'camioneta' || tipo === 'ambulancia';
  const geo = {
    cuerpo: cascaron(cuerpo, A, { estrecha: caja ? 0.06 : esVocho(tipo) ? 0.24 : 0.13, tumble: esVocho(tipo) ? 0.12 : 0.05, p: caja ? 5 : esVocho(tipo) ? 2.7 : 3.6 }),
    vidrio: cascaron(vidrio, A * (esVocho(tipo) ? 0.9 : 0.86), { estrecha: esVocho(tipo) ? 0.3 : 0.12, tumble: esVocho(tipo) ? 0.45 : 0.26, p: esVocho(tipo) ? 2.2 : 3.2, n: 30 }),
    techo: cascaron(techo, A * (esVocho(tipo) ? 0.86 : 0.88), { estrecha: esVocho(tipo) ? 0.3 : 0.1, tumble: esVocho(tipo) ? 0.4 : 0.18, p: esVocho(tipo) ? 2.2 : 3, n: 24 })
  };
  let g = mergeGeometries([ni(geo.cuerpo), ni(geo.techo)]);
  if (!esVocho(tipo)) {
    const gh = ni(cascaron(vidrio, A * 0.86, caja ? { estrecha: 0.04, tumble: 0.12, p: 4.6, n: 56, m: 52 } : { estrecha: 0.12, tumble: 0.26, p: 3.2, n: 64, m: 52 }));
    const Pg = gh.attributes.position, Ng = gh.attributes.normal, nv = Pg.count;
    const zFb = cf + P.inclF, zRt = cr + P.inclT, yLo = yt + 0.07, yHi = yt + C - 0.075, dos = tipo === 'deportivo' || tipo === 'compacto';
    const ventana = new Uint8Array(nv);
    for (let i = 0; i < nv; i++) {
      const x = Pg.getX(i), y = Pg.getY(i), z = Pg.getZ(i); if (y < yLo || y > yHi) continue;
      const k = Math.max(0, Math.min(1, (y - yt) / C)), zF = zFb + (cf - zFb) * k, zR = cr + (zRt - cr) * k;
      const nx = Math.abs(Ng.getX(i));
      if (nx > 0.6) { if (z > zR + 0.14 && z < zF - 0.14 && (dos || Math.abs(z - ((zR + zF) / 2 - 0.08)) > 0.07)) ventana[i] = 1; }
      else if (nx < 0.32 && (!caja || z > (zR + zF) / 2 || (Math.abs(x) < A * 0.26 && y > yt + 0.2))) ventana[i] = 1;
    }
    const pin = [], vid = [];
    for (let t = 0; t < nv; t += 3) (ventana[t] && ventana[t + 1] && ventana[t + 2] ? vid : pin).push(t);
    const sub = (lista, esc) => { const pp = new Float32Array(lista.length * 9), nn = new Float32Array(lista.length * 9); lista.forEach((t, q) => { for (let v = 0; v < 3; v++) for (let c = 0; c < 3; c++) { pp[q * 9 + v * 3 + c] = Pg.array[(t + v) * 3 + c] * (c === 1 ? 1 : esc); nn[q * 9 + v * 3 + c] = Ng.array[(t + v) * 3 + c]; } }); const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.BufferAttribute(pp, 3)); b.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); b.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(lista.length * 6), 2)); return b; };
    g = mergeGeometries([ni(geo.cuerpo), sub(pin, 1)]);
    geo.vidrio = sub(vid, 1.004);
  }
  if (esVocho(tipo)) {
    const blanco = gg => { gg = ni(gg); const n = gg.attributes.position.count; gg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3)); return gg; };
    const domo = new THREE.SphereGeometry(1, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), Pd = domo.attributes.position, col = new Float32Array(Pd.count * 3);
    for (let i = 0; i < Pd.count; i++) {
      const x = Pd.getX(i), y = Pd.getY(i), z = Pd.getZ(i), e = Math.asin(Math.min(1, y)), a = Math.abs(Math.atan2(x, z));
      const ven = (a < 0.52 && e > 0.08 && e < 0.86) || (a > 2.72 && e > 0.14 && e < 0.7) || (a > 0.74 && a < 2.5 && e > 0.1 && e < 0.62 && Math.abs(a - 1.62) > 0.07);
      const k = ven ? 0.07 : 1; col.set([k, k, k], i * 3);
    }
    domo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    domo.scale(A * 0.44, C * 1.18, L * 0.31).translate(0, yt - 0.04, -L * 0.07);
    geo.vidrio = domo.clone().scale(0.97, 0.97, 0.97);
    g = mergeGeometries([blanco(geo.cuerpo), ni(domo)]);
    g.userData.vocho = true;
  }
  const extras = [];
  if (tipo === 'camioneta') {
    const caja = new THREE.BoxGeometry(A * 0.84, 0.32, L * 0.42); caja.translate(0, yt + 0.02, -L * 0.24);
    extras.push(caja);
  }
  if (esVocho(tipo)) for (const sx of [1, -1]) for (const sz of [1, -1]) { const f = new THREE.CylinderGeometry(0.47, 0.47, 0.3, 18, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 1.05, 1.15); f.translate(sx * (A / 2 - 0.1), 0.38, sz * L * 0.31); extras.push(f); }
  if (!esVocho(tipo)) for (const sz of [1, -1]) { const def = new THREE.CapsuleGeometry(0.085, A * 0.84, 4, 12).rotateZ(Math.PI / 2).scale(1, 1.15, 0.85); def.translate(0, yb + 0.15, sz * (L / 2 - 0.03)); extras.push(def); }
  if (tipo === 'ambulancia') { const caja = new THREE.BoxGeometry(A * 0.98, 1.25, L * 0.56); caja.translate(0, yt + 0.58, -L * 0.2); extras.push(caja); }
  if (tipo === 'deportivo') { const al = new THREE.BoxGeometry(A * 0.92, 0.06, 0.38); al.translate(0, yt + 0.34, -L / 2 + 0.2); extras.push(al); const p1 = new THREE.BoxGeometry(0.08, 0.3, 0.1); p1.translate(-A * 0.35, yt + 0.17, -L / 2 + 0.25); const p2 = p1.clone(); p2.translate(A * 0.7, 0, 0); extras.push(p1, p2); }
  geo.pinta = extras.length ? mergeGeometries([g, ...extras.map(e => { e = ni(e); if (g.attributes.color && !e.attributes.color) e.setAttribute('color', new THREE.BufferAttribute(new Float32Array(e.attributes.position.count * 3).fill(1), 3)); return e; })]) : g;
  const trim = [];
  for (const sz of [1, -1]) {
    const lab = new THREE.BoxGeometry(A * 0.92, 0.045, 0.13); lab.translate(0, yb + 0.045, sz * (L / 2 - 0.04)); trim.push(lab);
    if (!esVocho(tipo)) { const rej = new THREE.BoxGeometry(sz > 0 ? A * 0.42 : A * 0.3, sz > 0 ? 0.11 : 0.05, 0.03); rej.translate(0, yb + H * (sz > 0 ? 0.5 : 0.36), sz * (L / 2 + 0.005)); trim.push(rej); }
  }
  for (const sx of [1, -1]) { const s1 = new THREE.BoxGeometry(0.06, 0.12, L * 0.62); s1.translate(sx * (A / 2 + 0.01), yb + 0.18, 0); trim.push(s1); const esp = new THREE.BoxGeometry(0.2, 0.1, 0.1); esp.translate(sx * (A / 2 + 0.06), yt + 0.12, cf + 0.25); trim.push(esp); }
  if (tipo === 'camioneta') { const hueco = new THREE.BoxGeometry(A * 0.76, 0.3, L * 0.38); hueco.translate(0, yt + 0.05, -L * 0.24); trim.push(hueco); }
  geo.trim = mergeGeometries(trim.map(ni));
  const faros = [], calav = [];
  for (const sx of [1, -1]) {
    const f = new THREE.CapsuleGeometry(0.07, 0.26, 4, 10).rotateZ(Math.PI / 2).scale(1, 1, 0.45); f.translate(sx * (A / 2 - 0.3), yb + H * 0.6, L / 2 - 0.01); faros.push(f);
    const c = new THREE.CapsuleGeometry(0.065, 0.32, 4, 10).rotateZ(Math.PI / 2).scale(1, 1, 0.45); c.translate(sx * (A / 2 - 0.3), yb + H * 0.7, -L / 2 + 0.01); calav.push(c);
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
const matVidrio2 = new THREE.MeshStandardMaterial({ color: '#16202c', metalness: 0.55, roughness: 0.05, envMapIntensity: 1.6, transparent: true, opacity: 0.84 });
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
const texPlacas = (() => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const L = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  for (let k = 0; k < 8; k++) {
    const x = (k % 4) * 128, y = Math.floor(k / 4) * 128;
    g.fillStyle = '#f2f0e8'; g.fillRect(x + 2, y + 30, 124, 64);
    g.strokeStyle = '#2a2a2e'; g.lineWidth = 3; g.strokeRect(x + 4, y + 32, 120, 60);
    g.fillStyle = '#7a1f2c'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('JALISCO', x + 64, y + 46);
    g.fillStyle = '#1a1a20'; g.font = 'bold 26px Arial Narrow, Arial, sans-serif';
    const t = L[(k * 7) % L.length] + L[(k * 11 + 3) % L.length] + L[(k * 5 + 1) % L.length] + '-' + (100 + k * 113 % 900) + '-' + L[(k * 3) % L.length];
    g.fillText(t, x + 64, y + 78);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
})();
const matsPlaca = Array.from({ length: 8 }, (_, k) => { const t = texPlacas.clone(); t.needsUpdate = true; t.repeat.set(0.25, 0.25); t.offset.set((k % 4) * 0.25, k < 4 ? 0.5 + 0.0625 : 0.0625); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.2 }); });
const geoPlaca = new THREE.PlaneGeometry(0.34, 0.17);
const geoEspejo = (() => { const a = new THREE.BoxGeometry(0.06, 0.04, 0.05).translate(0.03, 0, 0); const b = new THREE.SphereGeometry(0.075, 10, 8).scale(0.6, 0.62, 1.0).translate(0.1, 0.02, 0); return [a, b]; })();
const matEspejo = new THREE.MeshStandardMaterial({ color: '#cfd6de', metalness: 1, roughness: 0.05 });
const geoEscape = new THREE.CylinderGeometry(0.035, 0.04, 0.22, 10).rotateX(Math.PI / 2);

function modeloBici(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.35 });
  pinturas.add(pinta);
  const BB = BL.bici;
  if (BB?.pinta) {
    const add = (geo, mt) => { const k = new THREE.Mesh(geo, mt); k.castShadow = true; carro.add(k); return k; };
    const cuadro = add(BB.pinta, pinta); add(BB.cromo, matCromo); add(BB.trim, new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.6 }));
    const cal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: '#a01020' })); cal.position.set(0, 0.9, -0.55); carro.add(cal);
    const ruedas = [], delanteras = [];
    for (const z of [0.58, -0.52]) {
      const piv = new THREE.Group(); piv.position.set(0, 0.36, z);
      const ll = new THREE.Mesh(BB.llanta, matLlanta); ll.castShadow = true; ll.add(new THREE.Mesh(BB.rin, matRin2));
      piv.add(ll); carro.add(piv); ruedas.push(ll); if (z > 0) delanteras.push(piv);
    }
    return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [cuadro], calav: cal.material, calavMalla: cal };
  }
  const negro = new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.6 });
  const tubo = (a, b, r, mt) => { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va); const k = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mt); k.position.copy(va).add(vb).multiplyScalar(0.5); k.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); k.castShadow = true; carro.add(k); return k; };
  const T = [0, 0.36, -0.52], D = [0, 0.36, 0.58], P = [0, 0.33, 0], S = [0, 0.92, -0.18], H = [0, 0.95, 0.42];
  const cuadro = tubo(P, S, 0.025, pinta); tubo(S, H, 0.025, pinta); tubo(P, H, 0.028, pinta);
  for (const sx of [-0.05, 0.05]) { tubo([sx, ...T.slice(1)], [sx, ...P.slice(1)], 0.015, pinta); tubo([sx, ...T.slice(1)], [sx, ...S.slice(1)], 0.015, pinta); tubo([sx, ...D.slice(1)], [sx, ...H.slice(1)], 0.017, pinta); }
  tubo([-0.28, 1.08, 0.4], [0.28, 1.08, 0.4], 0.017, negro); tubo([0, 0.95, 0.42], [0, 1.08, 0.4], 0.018, negro);
  const asiento = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.26), negro); asiento.position.set(0, 0.98, -0.2); carro.add(asiento);
  const biela = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9aa0a8', metalness: 0.8, roughness: 0.3 })); biela.position.set(0.06, 0.33, 0); carro.add(biela);
  const cal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: '#a01020' })); cal.position.set(0, 0.9, -0.55); carro.add(cal);
  const aro = new THREE.TorusGeometry(0.34, 0.025, 6, 28); aro.rotateY(Math.PI / 2);
  const rayos = new THREE.CylinderGeometry(0.006, 0.006, 0.66, 3);
  const ruedas = [], delanteras = [];
  for (const z of [0.58, -0.52]) {
    const piv = new THREE.Group(); piv.position.set(0, 0.36, z);
    const ll = new THREE.Mesh(aro, negro); ll.castShadow = true;
    for (let k = 0; k < 6; k++) { const r = new THREE.Mesh(rayos, matRin2); r.rotation.x = k / 6 * Math.PI; ll.add(r); }
    piv.add(ll); carro.add(piv); ruedas.push(ll); if (z > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [cuadro], calav: cal.material, calavMalla: cal };
}

function modeloMoto(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.3 });
  pinturas.add(pinta);
  const B = BL.moto;
  if (B?.pinta) {
    const add = (geo, mt, sombra = true) => { const k = new THREE.Mesh(geo, mt); k.castShadow = sombra; carro.add(k); return k; };
    const tanque = add(B.pinta, pinta); add(B.trim, matTrim); add(B.cromo, matCromo); add(B.motor, matMotor); add(B.faro, matFaro, false);
    const cal = add(B.calavera, new THREE.MeshBasicMaterial({ color: '#a01020' }), false);
    const h = new THREE.Sprite(matHalo); h.position.set(0, 0.95, 0.9); h.scale.setScalar(1.4); carro.add(h);
    const ruedas = [], delanteras = [];
    for (const z of [0.78, -0.72]) {
      const piv = new THREE.Group(); piv.position.set(0, 0.34, z);
      const ll = new THREE.Mesh(B.llanta, matLlanta); ll.castShadow = true; ll.add(new THREE.Mesh(B.rin, matRin2));
      piv.add(ll); carro.add(piv); ruedas.push(ll); if (z > 0) delanteras.push(piv);
    }
    return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [tanque], calav: cal.material, calavMalla: cal };
  }
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
  const cabB = cabinaBL('blindado', carro, pinta, 2.95);
  const cabina = cabB || m(new THREE.BoxGeometry(2.2, 1.5, 1.8), pinta, 0, 1.25, 2.05);
  if (!cabB) m(new THREE.BoxGeometry(2.0, 0.6, 0.05), matVidrio2, 0, 1.6, 2.96);
  m(new THREE.BoxGeometry(2.32, 0.4, 4.02), mat('#1f6b3a'), 0, 1.3, -0.9);
  m(new THREE.BoxGeometry(2.4, 0.3, cabB ? 5.6 : 6), matTrim, 0, 0.45, cabB ? -0.2 : 0);
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
  const BB = BL.autobus;
  let cuerpo;
  if (BB?.blanco) {
    cuerpo = m(BB.blanco, blanco, 0, 0, 0); if (BB.franja) m(BB.franja, pinta, 0, 0, 0); m(BB.vidrio, matVidrio2, 0, 0, 0); m(BB.trim, matTrim, 0, 0, 0);
    const fa = m(BB.faros, matFaro, 0, 0, 0); fa.castShadow = false; const ce = m(BB.calaveras, matLuzTrasera, 0, 0, 0); ce.castShadow = false;
  } else {
    cuerpo = m(new RoundedBoxGeometry(A, 2.5, L, 3, 0.18), blanco, 0, 1.75, 0);
    m(new THREE.BoxGeometry(A + 0.02, 0.55, L - 0.3), pinta, 0, 0.85, 0);
    m(new THREE.BoxGeometry(A + 0.03, 0.9, L - 1.2), matVidrio2, 0, 2.0, -0.4);
    m(new THREE.BoxGeometry(A - 0.2, 1.1, 0.05), matVidrio2, 0, 2.0, L / 2 + 0.01);
    m(new THREE.BoxGeometry(0.06, 1.9, 1.0), matTrim, A / 2 + 0.02, 1.45, L / 2 - 1.3);
  }
  const c = document.createElement('canvas'); c.width = 256; c.height = 48; const x = c.getContext('2d');
  x.fillStyle = '#111'; x.fillRect(0, 0, 256, 48); x.fillStyle = '#ffb030'; x.font = '900 30px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('7 · CENTRO', 128, 26);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  m(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshBasicMaterial({ map: t }), 0, 2.78, BB?.blanco ? L / 2 - 0.05 : L / 2 + 0.02);
  if (!BB?.blanco) for (const sx of [-1, 1]) { const f = m(new THREE.BoxGeometry(0.3, 0.16, 0.05), matFaro, sx * (A / 2 - 0.35), 0.9, L / 2 + 0.01); f.castShadow = false; }
  const cal = m(new THREE.BoxGeometry(A - 0.4, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: '#a01020' }), 0, 1.0, -L / 2 - 0.01); cal.visible = false;
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 0.34], [1, 0.34], [-1, -0.3], [1, -0.3]]) {
    const piv = new THREE.Group(); piv.position.set(sx * (A / 2 - 0.15), 0.5, sz * L);
    const ll = new THREE.Mesh(geoLlanta, matLlanta); ll.scale.setScalar(1.4); ll.castShadow = true; ll.add(new THREE.Mesh(geoRin2, matRin2));
    piv.add(ll); g.add(piv); ruedas.push(ll); if (sz > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [cuerpo], calav: cal.material, calavMalla: cal };
}

const ROTULOS = [
  ['AGUA CLARA', 'PURIFICADORA · GARRAFÓN $18', '#1e6fd0', '#ffffff'],
  ['MUEBLERÍA JALISCO', 'SALAS · COMEDORES · RECÁMARAS', '#8a2a26', '#ffe9b0'],
  ['MUDANZAS EL RÁPIDO', 'LOCALES Y FORÁNEAS', '#f2c14e', '#1a1a1a'],
  ['BOTANAS DON CHEPE', 'PAPAS · CHICHARRONES · CACAHUATES', '#d8343c', '#ffffff']
];
function modeloReparto(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshPhysicalMaterial({ color, metalness: 0.3, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  pinturas.add(pinta);
  const L = 6.6, A = 2.3, CL = 1.9;
  const m = (geo, mat, x, y, z) => { const k = new THREE.Mesh(geo, mat); k.position.set(x, y, z); k.castShadow = true; carro.add(k); return k; };
  const [titulo, sub, fondo, tinta] = ROTULOS[Math.random() * ROTULOS.length | 0];
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, 512, 256);
  x.fillStyle = fondo; x.fillRect(0, 150, 512, 106); x.fillRect(0, 0, 512, 14);
  x.fillStyle = fondo; x.font = '900 58px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(titulo, 256, 78, 480);
  x.fillStyle = tinta; x.font = '800 26px Inter, Arial, sans-serif'; x.fillText(sub, 256, 200, 480);
  x.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 512; k += 32) x.fillRect(k, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const lado = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), liso = new THREE.MeshStandardMaterial({ color: '#eeece6', roughness: 0.6 });
  const zc = -(L - CL) / 2 + (L / 2 - CL - (L - CL) / 2) * 0;
  const caja = m(new THREE.BoxGeometry(A, 2.5, L - CL - 0.15), [lado, lado, liso, liso, liso, new THREE.MeshStandardMaterial({ color: '#d8d6d0', roughness: 0.6 })], 0, 2.0, -(CL + 0.15) / 2);
  m(new THREE.BoxGeometry(0.05, 2.2, 0.05), matTrim, 0, 1.95, -L / 2 - 0.01);
  const cabB = cabinaBL('reparto', carro, pinta, L / 2);
  const cab = cabB || m(new RoundedBoxGeometry(A - 0.05, 1.75, CL, 3, 0.16), pinta, 0, 1.45, L / 2 - CL / 2);
  if (!cabB) { m(new THREE.BoxGeometry(A - 0.25, 0.7, 0.06), matVidrio2, 0, 1.85, L / 2 + 0.01); for (const s of [-1, 1]) m(new THREE.BoxGeometry(0.04, 0.55, 0.9), matVidrio2, s * (A / 2 - 0.02), 1.85, L / 2 - CL / 2 + 0.1); }
  m(new THREE.BoxGeometry(A, 0.35, L - 0.2), new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.8 }), 0, 0.62, cabB ? -0.15 : 0);
  if (!cabB) {
    m(new THREE.BoxGeometry(A + 0.06, 0.22, 0.2), matTrim, 0, 0.75, L / 2 + 0.05);
    for (const sx of [-1, 1]) { const f = m(new THREE.BoxGeometry(0.32, 0.18, 0.05), matFaro, sx * (A / 2 - 0.3), 1.0, L / 2 + 0.02); f.castShadow = false; }
    for (const sx of [-1, 1]) m(new THREE.BoxGeometry(0.06, 0.32, 0.22), matTrim, sx * (A / 2 + 0.12), 1.95, L / 2 - 0.25);
  }
  const cal = m(new THREE.BoxGeometry(A - 0.4, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: '#a01020' }), 0, 0.9, -L / 2 - 0.02); cal.visible = false;
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 0.32], [1, 0.32], [-1, -0.3], [1, -0.3]]) {
    const piv = new THREE.Group(); piv.position.set(sx * (A / 2 - 0.12), 0.46, sz * L);
    const ll = new THREE.Mesh(geoLlanta, matLlanta); ll.scale.setScalar(1.3); ll.castShadow = true; ll.add(new THREE.Mesh(geoRin2, matRin2));
    piv.add(ll); g.add(piv); ruedas.push(ll); if (sz > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [cab, caja], calav: cal.material, calavMalla: cal };
}

function modeloRedilas(color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshPhysicalMaterial({ color, metalness: 0.3, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  pinturas.add(pinta);
  const L = 5.3, A = 2.0, CL = 1.9;
  const madera = new THREE.MeshStandardMaterial({ color: '#8a6038', roughness: 0.85 }), oscuro = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.8 });
  const m = (geo, mt, x, y, z) => { const k = new THREE.Mesh(geo, mt); k.position.set(x, y, z); k.castShadow = true; carro.add(k); return k; };
  const cabB = cabinaBL('redilas', carro, pinta, L / 2);
  const cab = cabB || m(new RoundedBoxGeometry(A - 0.05, 1.45, CL, 3, 0.15), pinta, 0, 1.25, L / 2 - CL / 2);
  if (!cabB) { m(new THREE.BoxGeometry(A - 0.25, 0.55, 0.06), matVidrio2, 0, 1.62, L / 2 + 0.01); for (const s of [-1, 1]) m(new THREE.BoxGeometry(0.04, 0.45, 0.8), matVidrio2, s * (A / 2 - 0.02), 1.62, L / 2 - CL / 2 + 0.15); }
  m(new THREE.BoxGeometry(A, 0.3, L - 0.2), oscuro, 0, 0.58, 0);
  const caja = L - CL - 0.1, zc = -(L / 2) + caja / 2;
  m(new THREE.BoxGeometry(A, 0.1, caja), madera, 0, 0.8, zc);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) m(new THREE.BoxGeometry(0.06, 0.12, caja), madera, s * (A / 2 - 0.03), 1.0 + k * 0.3, zc);
    for (let k = 0; k <= 3; k++) m(new THREE.BoxGeometry(0.08, 0.95, 0.08), madera, s * (A / 2 - 0.03), 1.3, zc - caja / 2 + k * caja / 3);
  }
  for (let k = 0; k < 3; k++) m(new THREE.BoxGeometry(A, 0.12, 0.06), madera, 0, 1.0 + k * 0.3, -L / 2 + 0.05);
  const carga = Math.random();
  if (carga < 0.4) { const sandia = new THREE.MeshStandardMaterial({ color: '#2f7a3a', roughness: 0.6 }); for (let i = 0; i < 14; i++) { const s = m(new THREE.SphereGeometry(0.2, 10, 8), sandia, (Math.random() - 0.5) * (A - 0.5), 1.0 + (i % 3) * 0.12, zc + (Math.random() - 0.5) * (caja - 0.5)); s.scale.set(1, 0.85, 1.3); } }
  else if (carga < 0.75) { const costal = new THREE.MeshStandardMaterial({ color: '#cbb58a', roughness: 0.95 }); for (let i = 0; i < 8; i++) { const s = m(new THREE.BoxGeometry(0.5, 0.28, 0.8), costal, (i % 2 - 0.5) * 0.65, 1.0 + Math.floor(i / 4) * 0.28, zc + ((i >> 1) % 2 - 0.5) * 0.9); s.rotation.y = (Math.random() - 0.5) * 0.3; } }
  if (!cabB) { for (const sx of [-1, 1]) { const f = m(new THREE.BoxGeometry(0.28, 0.15, 0.05), matFaro, sx * (A / 2 - 0.3), 0.95, L / 2 + 0.02); f.castShadow = false; } m(new THREE.BoxGeometry(A + 0.05, 0.18, 0.18), matTrim, 0, 0.72, L / 2 + 0.05); }
  const cal = m(new THREE.BoxGeometry(A - 0.5, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: '#a01020' }), 0, 0.85, -L / 2 - 0.02); cal.visible = false;
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 0.33], [1, 0.33], [-1, -0.3], [1, -0.3]]) {
    const piv = new THREE.Group(); piv.position.set(sx * (A / 2 - 0.12), 0.42, sz * L);
    const ll = new THREE.Mesh(geoLlanta, matLlanta); ll.scale.setScalar(1.2); ll.castShadow = true; ll.add(new THREE.Mesh(geoRin2, matRin2));
    piv.add(ll); g.add(piv); ruedas.push(ll); if (sz > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra: null, partes: [cab], calav: cal.material, calavMalla: cal };
}

function modeloServicio(tipo, color) {
  const g = new THREE.Group(), carro = new THREE.Group(); g.add(carro);
  const pinta = new THREE.MeshPhysicalMaterial({ color, metalness: 0.3, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.15 });
  pinturas.add(pinta);
  const L = TIPOS[tipo].largo, A = TIPOS[tipo].ancho, CL = 1.95;
  const m = (geo, mt, x, y, z) => { const k = new THREE.Mesh(geo, mt); k.position.set(x, y, z); k.castShadow = true; carro.add(k); return k; };
  const oscuro = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.8 });
  const cabB = cabinaBL(tipo, carro, pinta, L / 2);
  const cab = cabB || m(new RoundedBoxGeometry(A - 0.05, 1.75, CL, 3, 0.16), pinta, 0, 1.45, L / 2 - CL / 2);
  if (!cabB) { m(new THREE.BoxGeometry(A - 0.25, 0.7, 0.06), matVidrio2, 0, 1.85, L / 2 + 0.01); for (const s of [-1, 1]) m(new THREE.BoxGeometry(0.04, 0.55, 0.9), matVidrio2, s * (A / 2 - 0.02), 1.85, L / 2 - CL / 2 + 0.1); }
  m(new THREE.BoxGeometry(A, 0.35, L - 0.2), oscuro, 0, 0.62, 0);
  const atras = L - CL - 0.15, zc = -(CL + 0.15) / 2;
  let barra = null;
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  if (tipo === 'pipa') {
    x.fillStyle = '#f2f2ee'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#e2392a'; x.fillRect(0, 84, 512, 22);
    x.fillStyle = '#1d4f9c'; x.font = '900 52px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GAS JALISCO', 256, 46); x.fillStyle = '#ffffff'; x.font = '800 16px Inter, Arial, sans-serif'; x.fillText('GAS L.P. · SERVICIO A DOMICILIO', 256, 96);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const tanque = m(new THREE.CapsuleGeometry(0.95, atras - 1.9, 6, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.4 }), 0, 1.85, zc);
    { const uv = tanque.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); }
    m(new THREE.BoxGeometry(0.5, 0.4, 0.5), oscuro, 0, 2.95, zc + 0.8);
    m(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#c9a040', metalness: 0.8, roughness: 0.3 }), A / 2 - 0.1, 1.1, zc - 1);
  } else if (tipo === 'bomberos') {
    x.fillStyle = '#c8202e'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#f4f2ec'; x.fillRect(0, 90, 512, 10); x.fillStyle = '#f2c14e'; x.fillRect(0, 104, 512, 8);
    x.fillStyle = '#ffffff'; x.font = '900 46px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BOMBEROS', 256, 40); x.font = '800 18px Inter, Arial, sans-serif'; x.fillText('SANTA JACARANDA', 256, 74);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const lado = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }), rojo = new THREE.MeshStandardMaterial({ color: '#c8202e', roughness: 0.5 });
    m(new THREE.BoxGeometry(A, 1.7, atras - 0.2), [lado, lado, rojo, rojo, rojo, rojo], 0, 1.6, zc + 0.1);
    const acero = new THREE.MeshStandardMaterial({ color: '#c9ced4', metalness: 0.7, roughness: 0.3 });
    for (const s of [-0.45, 0.45]) m(new THREE.BoxGeometry(0.08, 0.08, atras + 0.6), acero, s, 2.62, zc + 0.3);
    for (let k = 0; k < 9; k++) m(new THREE.BoxGeometry(0.9, 0.05, 0.05), acero, 0, 2.62, zc - atras / 2 + 0.2 + k * (atras + 0.2) / 9);
    m(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 10), acero, 0, 2.75, zc + atras / 2 - 0.4);
    barra = []; for (const s of [-1, 1]) barra.push(m(new THREE.BoxGeometry(0.7, 0.16, 0.3), matApagado, s * 0.45, 2.42, L / 2 - CL / 2));
  } else {
    x.fillStyle = '#2f7a3a'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#ffffff'; x.font = '900 38px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SANTA JACARANDA LIMPIA', 256, 50); x.font = '700 20px Inter, Arial, sans-serif'; x.fillText('RECOLECCIÓN DE BASURA', 256, 96);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const lado = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), verde = new THREE.MeshStandardMaterial({ color: '#2f7a3a', roughness: 0.6 });
    m(new THREE.BoxGeometry(A, 2.4, atras - 0.4), [lado, lado, verde, verde, verde, verde], 0, 2.0, zc + 0.2);
    const tolva = m(new THREE.BoxGeometry(A - 0.1, 1.8, 1.1), new THREE.MeshStandardMaterial({ color: '#d8d8d0', roughness: 0.6 }), 0, 1.9, -L / 2 + 0.55); tolva.rotation.x = 0.25;
    m(new THREE.CylinderGeometry(0.12, 0.16, 0.25, 10), new THREE.MeshStandardMaterial({ color: '#c9a040', metalness: 0.8, roughness: 0.3 }), A / 2 + 0.12, 2.6, L / 2 - CL - 0.2);
  }
  if (!cabB) { for (const sx of [-1, 1]) { const f = m(new THREE.BoxGeometry(0.32, 0.18, 0.05), matFaro, sx * (A / 2 - 0.3), 1.0, L / 2 + 0.02); f.castShadow = false; } m(new THREE.BoxGeometry(A + 0.06, 0.22, 0.2), matTrim, 0, 0.75, L / 2 + 0.05); }
  const cal = m(new THREE.BoxGeometry(A - 0.4, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: '#a01020' }), 0, 0.9, -L / 2 - 0.02); cal.visible = false;
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 0.33], [1, 0.33], [-1, -0.28], [1, -0.28]]) {
    const piv = new THREE.Group(); piv.position.set(sx * (A / 2 - 0.12), 0.5, sz * L);
    const ll = new THREE.Mesh(geoLlanta, matLlanta); ll.scale.setScalar(1.4); ll.castShadow = true; ll.add(new THREE.Mesh(geoRin2, matRin2));
    piv.add(ll); g.add(piv); ruedas.push(ll); if (sz > 0) delanteras.push(piv);
  }
  return { grupo: g, carro, pinta, ruedas, delanteras, barra, partes: [cab], calav: cal.material, calavMalla: cal };
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
  if (tipo === 'bici') return modeloBici(color);
  if (tipo === 'moto') return modeloMoto(color);
  if (tipo === 'lancha') return modeloLancha(color);
  if (tipo === 'autobus') return modeloAutobus(color);
  if (tipo === 'reparto') return modeloReparto(color);
  if (tipo === 'redilas') return modeloRedilas(color);
  if (tipo === 'pipa' || tipo === 'basura' || tipo === 'bomberos') return modeloServicio(tipo, color);
  if (tipo === 'blindado') return modeloBlindado(color);
  const t = TIPOS[tipo];
  const G = geometrias(tipo);
  const g = new THREE.Group();
  const carro = new THREE.Group();
  g.add(carro);
  const pinta = new THREE.MeshPhysicalMaterial({ color, metalness: 0.4, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 0.9 });
  pinturas.add(pinta);
  const malla = (geo, m) => { const x = new THREE.Mesh(geo, m); x.castShadow = true; carro.add(x); return x; };
  let pintaCuerpo = pinta;
  if (G.pinta.attributes.color) { pintaCuerpo = pinta.clone(); pintaCuerpo.vertexColors = true; pintaCuerpo.color = pinta.color; pinturas.add(pintaCuerpo); }
  const cuerpo = malla(G.pinta, pintaCuerpo);
  const cab = malla(G.vidrio, matVidrio2);
  malla(G.trim, matTrim);
  if (G.cromo) malla(G.cromo, matCromo);
  const defensas = [G.defF ? malla(G.defF, pinta) : null, G.defA ? malla(G.defA, pinta) : null];
  const calav = new THREE.MeshBasicMaterial({ color: '#a01020' });
  const H = t.alto, piso = 0.3;
  let cal;
  if (G.blender) {
    const fa = malla(G.faros, matFaro); fa.castShadow = false;
    const ce = malla(G.calaveras, matLuzTrasera); ce.castShadow = false;
    cal = malla(G.calaveras, calav); cal.castShadow = false; cal.scale.setScalar(1.004); cal.visible = false;
  } else {
    const df = new THREE.Mesh(new THREE.PlaneGeometry(t.ancho * 0.98, H * 0.72), matsDecal[IDX_FRENTE[tipo]]);
    df.position.set(0, piso + H * 0.42, t.largo / 2 + 0.125); carro.add(df);
    const da = new THREE.Mesh(new THREE.PlaneGeometry(t.ancho * 0.96, H * 0.62), matsDecal[IDX_ATRAS[tipo]]);
    da.position.set(0, piso + H * 0.55, -t.largo / 2 - 0.125); da.rotation.y = Math.PI; carro.add(da);
    cal = malla(G.calaveras, calav); cal.castShadow = false; cal.position.z = -0.04; cal.visible = false;
  }
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
  if (tipo === 'taxi' || tipo === 'vochotaxi') {
    if (!TEX_TAXI) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#ffe066'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#c8202e'; x.fillRect(0, 0, 256, 8); x.fillRect(0, 56, 256, 8); x.fillStyle = '#1a1a1c'; x.font = '900 34px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TAXI · LIBRE', 128, 34); TEX_TAXI = new THREE.CanvasTexture(c); TEX_TAXI.colorSpace = THREE.SRGBColorSpace; }
    const lado = new THREE.MeshBasicMaterial({ map: TEX_TAXI, toneMapped: false }), liso = new THREE.MeshBasicMaterial({ color: '#ffe066' });
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.3), [liso, liso, liso, liso, lado, lado]); s.rotation.y = Math.PI / 2; s.position.set(0, G.yt + t.cabina + 0.17 + (tipo === 'vochotaxi' ? 0.08 : 0), (G.cf + G.cr + 0.4) / 2); carro.add(s);
  }
  for (const s of [-1, 1]) {
    const h = new THREE.Sprite(matHalo);
    h.position.set(s * (t.ancho / 2 - (G.blender && !esVocho(tipo) ? 0.43 : 0.32)), 0.3 + t.alto * (G.blender && tipo === 'deportivo' ? 0.5 : 0.6), t.largo / 2 + 0.22);
    h.scale.setScalar(1.1);
    carro.add(h);
  }
  const P = PERFIL[tipo], yb = piso, yt = piso + H, finos = [];
  if (!G.blender) for (const sx of [-1, 1]) for (const sz of [1, -1]) {
    const z = sz * t.largo * 0.31;
    const arco = new THREE.Mesh(geoArco, matTrim); arco.position.set(sx * (t.ancho / 2 + 0.012), 0.36, z); arco.rotation.y = Math.PI / 2; carro.add(arco); finos.push(arco);
    const hueco = new THREE.Mesh(geoHueco, matHueco); hueco.position.set(sx * (t.ancho / 2 + 0.006), 0.36, z); hueco.rotation.y = sx * Math.PI / 2; carro.add(hueco);
  }
  const zf = G.cf + P.inclF * 0.62, largoP = Math.min(1.25, (zf - G.cr) * (tipo === 'deportivo' || tipo === 'compacto' ? 0.72 : 0.5));
  const puerta = new THREE.Group(); puerta.position.set(t.ancho / 2 + 0.004, 0, zf); carro.add(puerta);
  const altoP = yt - yb - 0.16;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.035, altoP, largoP).translate(0.0175, yb + 0.1 + altoP / 2, -largoP / 2), pinta); panel.castShadow = true; puerta.add(panel);
  const forro = new THREE.Mesh(new THREE.PlaneGeometry(largoP * 0.96, altoP * 0.9).rotateY(-Math.PI / 2).translate(-0.002, yb + 0.1 + altoP / 2, -largoP / 2), matForro); puerta.add(forro);
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.02, t.cabina * 0.78, largoP * 0.86).translate(-0.03, yt + t.cabina * 0.4, -largoP * 0.5), matVidrio2); puerta.add(vent); vent.visible = false;
  const manija = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.16).translate(0.04, yt - 0.1, -largoP + 0.2), matRin2); puerta.add(manija); finos.push(forro, manija);
  const puertaP = puerta.clone(); puertaP.position.x = -(t.ancho / 2 + 0.004); puertaP.scale.x = -1; carro.add(puertaP); const ventP = puertaP.children[2]; ventP.visible = false;
  const linea = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.022, Math.max(0.5, zf + 0.3 - G.cr)).translate(0, yt + 0.012, (zf - 0.1 + G.cr) / 2), matCromo);
  for (const sx of [-1, 1]) { const l = linea.clone(); l.position.x = sx * (t.ancho * 0.43); carro.add(l); finos.push(l); }
  if (false) { const pil = new THREE.Mesh(new THREE.BoxGeometry(t.ancho * 0.85, t.cabina * 0.92, 0.09), matTrim); pil.position.set(0, yt + t.cabina * 0.48, zf - largoP - 0.02); carro.add(pil); finos.push(pil); }
  const np = (Math.random() * 8) | 0;
  const pf = new THREE.Mesh(geoPlaca, matsPlaca[np]); pf.position.set(0, piso + 0.12, G.blender && G.datos.placaF ? G.datos.placaF + 0.045 : t.largo / 2 + 0.14); carro.add(pf);
  const pt = new THREE.Mesh(geoPlaca, matsPlaca[(np + 3) % 8]); pt.position.set(0, piso + H * 0.32, G.blender && G.datos.placaA ? G.datos.placaA - 0.01 : -t.largo / 2 - 0.14); pt.rotation.y = Math.PI; carro.add(pt); finos.push(pf, pt);
  for (const sx of [-1, 1]) {
    const ze = G.cf + P.inclF * 0.72, ye = yt + 0.1;
    const brazo = new THREE.Mesh(geoEspejo[0], pinta); brazo.position.set(sx * (t.ancho * 0.43), ye, ze); brazo.scale.x = sx; carro.add(brazo);
    const caja = new THREE.Mesh(geoEspejo[1], pinta); caja.position.set(sx * (t.ancho * 0.43), ye, ze); caja.scale.x = sx; caja.castShadow = true; carro.add(caja);
    const vid = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), matEspejo); vid.position.set(sx * (t.ancho * 0.43 + 0.1), ye + 0.02, ze - 0.077); vid.rotation.y = Math.PI; carro.add(vid);
    finos.push(brazo, caja, vid);
  }
  const esc = new THREE.Mesh(geoEscape, matCromo); esc.position.set(t.ancho * 0.3, piso + 0.04, -t.largo / 2 - 0.05); carro.add(esc); finos.push(esc);
  const haz = new THREE.Mesh(geoHaz, matHaz); haz.position.set(0, 0.035, t.largo / 2 + 5.4); haz.renderOrder = 2; g.add(haz);
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
    silueta.visible = false; finos.push(vol, asiento, asiento2, ...silueta.children);
  }
  const ruedas = [], delanteras = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const piv = new THREE.Group();
    piv.position.set(sx * (t.ancho / 2 - (G.blender && !esVocho(tipo) ? 0.17 : 0.1)), 0.36, sz * t.largo * 0.31);
    const R = BL.coche;
    const ll = new THREE.Mesh(R?.llanta || geoLlanta, matLlanta); ll.castShadow = true;
    const rin = new THREE.Mesh(R?.rin || geoRin2, matRin2); ll.add(rin); finos.push(rin);
    if (R?.rin && sx < 0) ll.scale.x = -1;
    piv.add(ll);
    g.add(piv);
    ruedas.push(ll);
    if (sz > 0) delanteras.push(piv);
  }
  return { haz, grupo: g, carro, pinta, pintaCuerpo, ruedas, delanteras, barra, partes: [cuerpo, cab, panel], calav, calavMalla: cal, puerta, ventPuerta: vent, puertaP, ventPuertaP: ventP, silueta, finos, defensas };
}

const _p = new THREE.Vector3();

export class Coche {
  static vidrioRoto = matVidrioRoto;
  detalle(cerca, sombra = true) {
    if (this.sombraLod !== sombra) { this.sombraLod = sombra; this.grupo.traverse(o => { if (!o.isMesh) return; if (!sombra) { if (o.userData.sOrig === undefined) o.userData.sOrig = o.castShadow; o.castShadow = false; } else if (o.userData.sOrig !== undefined) o.castShadow = o.userData.sOrig; }); }
    if (!this.finos || this.cerca === cerca) return; this.cerca = cerca; for (const o of this.finos) o.visible = cerca;
  }
  constructor(juego, tipo, color, x, z, yaw) {
    this.juego = juego;
    this.bici = tipo === 'bici';
    this.tipo = this.bici ? 'moto' : tipo;
    this.t = TIPOS[tipo];
    this.color = color || COLORES_COCHE[Math.random() * COLORES_COCHE.length | 0];
    const m = modelo(tipo, this.color);
    Object.assign(this, m);
    if (this.tipo === 'moto') {
      const pp = juego.crearPiloto?.();
      if (pp) { pp.grupo.position.set(0, this.bici ? 0.5 : 0.42, this.bici ? -0.1 : -0.15); this.carro.add(pp.grupo); this.piloto = pp.grupo; this.pilotoP = pp; }
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
    if (this.tipo !== 'moto' && this.tipo !== 'lancha' && this.carro) {
      const g = this.grupo, ca = this.carro, c = this, agregar = THREE.Object3D.prototype.add;
      dormirQuieto(g, a => { a[0] = g.position.x; a[1] = g.position.y; a[2] = g.position.z; a[3] = g.rotation.y; a[4] = ca.position.y; a[5] = ca.rotation.x; a[6] = ca.rotation.z; a[7] = c.ruedas?.[0]?.rotation.x || 0; a[8] = c.delanteras?.[0]?.rotation.y || 0; a[9] = c.puerta?.rotation.y || 0; a[10] = c.puertaP?.rotation.y || 0; a[11] = c.salud + (c.quemado ? 1000 : 0) + (c.ponchadas?.size || 0) * 7; });
      g.add = function (...a) { g.__sucio = true; return agregar.apply(this, a); };
      ca.add = function (...a) { g.__sucio = true; return agregar.apply(this, a); };
    }
  }
  get fx() { return Math.sin(this.yaw); }
  get fz() { return Math.cos(this.yaw); }
  get vel() { return Math.hypot(this.vx, this.vz); }
  quitar() {
    this.juego.escena.remove(this.grupo); pinturas.delete(this.pinta); if (this.pintaCuerpo) pinturas.delete(this.pintaCuerpo);
    this.pinta?.dispose?.(); this.pintaCuerpo?.dispose?.();
    if (this.geoPropia) { this.partes?.[0]?.geometry?.dispose?.(); this.geoPropia = false; }
  }

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
    if (this.quemado || this.ahogado) { acel = 0; giro = 0; freno = true; }
    if (this.ponchadas?.size) { acel *= 0.72; let s = 0; for (const i of this.ponchadas) s += (this.ruedas[i]?.parent?.position.x > 0 ? 1 : -1) * (this.ruedas[i]?.parent?.position.z > 0 ? 1.5 : 1); giro = Math.max(-1, Math.min(1, giro + s * 0.1 * Math.min(1, Math.abs(this.adelante || 0) / 8))); }
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
    const agarre = (this.tipo === 'lancha' ? 1.6 : freno ? 1.3 : 7.5) * (this.tipo === 'lancha' ? 1 : this.juego.resbalon || 1);
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
    if (R?.cerro) { const d = 1.7, hF = alturaCerro(this.pos.x + this.fx * d, this.pos.z + this.fz * d), hB = alturaCerro(this.pos.x - this.fx * d, this.pos.z - this.fz * d); this.pendiente = -Math.atan((hF - hB) / (2 * d)); } else this.pendiente = (this.pendiente || 0) * 0.8;
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
      const n = mundo.empujar(_p, s === 0 ? rad * 1.05 : rad, 0.4 + this.y, this.conductor === 'jugador');
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
    const J = this.juego, cam = J.camara?.position;
    if (!this.quemado && this.salud < this.t.salud * 0.45 && J.humo && cam && Math.abs(cam.x - this.pos.x) + Math.abs(cam.z - this.pos.z) < 90) {
      const k = 1 - this.salud / (this.t.salud * 0.45), fz = this.tipo === 'moto' ? 0.2 : this.t.largo / 2 - 0.7;
      if (Math.random() < dt * (4 + k * 14)) J.humo(this.pos.x + this.fx * fz + (Math.random() - 0.5) * 0.4, (this.t.alto || 0.6) + 0.45, this.pos.z + this.fz * fz + (Math.random() - 0.5) * 0.4, 0.6 + k * 0.9, k > 0.6 ? '#2a2a2c' : '#8a8a8e', 1.4 + k);
    }
    if (this.ponchadas && vel > 6 && Math.random() < dt * 6 && J.chispa) { const i = [...this.ponchadas][0], w = this.ruedas[i]?.getWorldPosition(new THREE.Vector3()); if (w) { w.y = 0.05; J.chispa(w, '#ffd27a'); } }
    if (this.puertaP) { const o = this.puertaPObj || 0; this.puertaPA = (this.puertaPA || 0) + (o - (this.puertaPA || 0)) * Math.min(1, dt * 10); this.puertaP.rotation.y = this.puertaPA * 1.1; this.ventPuertaP.visible = this.puertaPA > 0.03; if (this.puertaPCierra && (this.puertaPCierra -= dt) <= 0) { this.puertaPCierra = 0; this.puertaPObj = 0; } }
    if (this.puerta) { const o = this.puertaObj || 0; this.puertaA = (this.puertaA || 0) + (o - (this.puertaA || 0)) * Math.min(1, dt * 10); this.puerta.rotation.y = -this.puertaA * 1.1; this.ventPuerta.visible = this.puertaA > 0.03; if (this.puertaCierra && (this.puertaCierra -= dt) <= 0) { this.puertaCierra = 0; this.puertaObj = 0; } }
    for (const d of this.delanteras) d.rotation.y = -this.giroSuave * 0.5;
    const inclinar = this.tipo === 'moto' ? 0.55 : 0.075 + (this.t.masa || 1) * 0.015;
    const metaRol = (-this.giroSuave * Math.min(1, vel / 20)) * inclinar;
    if (this.tipo === 'moto') this.carro.rotation.z += (metaRol - this.carro.rotation.z) * Math.min(1, dt * 5);
    else { const h = Math.min(dt, 1 / 30); if (!isFinite(this.rolV)) this.rolV = 0; if (!isFinite(this.carro.rotation.z)) this.carro.rotation.z = 0; this.rolV += ((metaRol - this.carro.rotation.z) * 70 - this.rolV * 7.5) * h; this.carro.rotation.z += this.rolV * h; }
    if (this.piloto) this.piloto.visible = this.conductor === 'ia' || this.conductor === 'rival' || this.conductor === 'policia';
    if (this.silueta) this.silueta.visible = !!this.conductor && !this.quemado && !(this.juego.entrando?.c === this);
    const fwd = this.adelante;
    const aceleracion = dt > 0 ? (fwd - (this.fwdPrev ?? fwd)) / dt : 0;
    this.fwdPrev = fwd;
    this.acel = aceleracion;
    const caballito = this.tipo === 'moto' && this.conductor === 'jugador' && !this.enAire && aceleracion > 7 && fwd > 2 && fwd < 24 ? -Math.min(0.3, (aceleracion - 7) * 0.035) : 0;
    const cabeceo = this.enAire ? -Math.atan2(this.vy, Math.max(4, Math.abs(fwd))) * 0.7 : (caballito || Math.max(-0.065, Math.min(0.065, -aceleracion * 0.005))) + (this.pendiente || 0);
    this.juego.baches?.revisar(this, dt);
    if (this.tipo === 'moto' || this.enAire) { this.carro.rotation.x += (cabeceo - this.carro.rotation.x) * Math.min(1, dt * (this.enAire ? 3 : 6)); this.cabV = 0; }
    else { const h = Math.min(dt, 1 / 30); if (!isFinite(this.cabV)) this.cabV = 0; if (!isFinite(this.carro.rotation.x)) this.carro.rotation.x = 0; this.cabV += ((cabeceo - this.carro.rotation.x) * 85 - this.cabV * 8) * h; this.carro.rotation.x += this.cabV * h; }
    if (this.estabaAire && !this.enAire && this.tipo !== 'moto') { this.cabV = (this.cabV || 0) + 0.9; this.alturaV = -1.6; }
    this.estabaAire = this.enAire;
    { const h = Math.min(dt, 1 / 30); if (!isFinite(this.alturaV)) this.alturaV = 0; if (!isFinite(this.altura)) this.altura = 0; this.alturaV += (-this.altura * 120 - this.alturaV * 9) * h; this.altura += this.alturaV * h; }
    if (this.rebote > 0) this.rebote = Math.max(0, this.rebote - dt * 0.8);
    this.carro.position.y = -(this.rebote || 0) * Math.sin(performance.now() / 40) * 0.5 + (this.tipo === 'moto' ? Math.max(0, -this.carro.rotation.x) * 0.95 : (this.altura || 0) * 0.06);
    if (this.calavMalla) { this.calavMalla.visible = !!this.frenando && !this.quemado; this.calav.color.set('#ff2436'); }
    if (this.alarma > 0) {
      this.alarma -= dt;
      const on = (this.alarma % 0.6) < 0.3 && !this.quemado;
      if (this.calavMalla) { this.calavMalla.visible = on; this.calav.color.set('#ffb030'); }
      if (on !== this.alarmaOn) { this.alarmaOn = on; if (on) { this.alarmaTono = this.alarmaTono === 920 ? 700 : 920; this.juego.audio?.tono(this.alarmaTono, 0.26, 0.16 * (this.juego.audio.dist?.(this.pos) ?? 1), 'square'); } }
    }
    this.grupo.position.copy(this.pos);
    this.grupo.position.y = this.y - (this.hundido || 0);
    this.grupo.rotation.y = this.yaw;
    if (this.barra) {
      const on = this.sirena && (performance.now() / 160 | 0) % 2;
      this.barra[0].material = (this.sirena && on) ? matRojo : matApagado;
      this.barra[1].material = (this.sirena && !on) ? (this.tipo === 'ambulancia' || this.tipo === 'bomberos' ? matRojo : matAzul) : matApagado;
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
    const J = this.juego;
    if (J.soltarPieza && (fuerza > 8 || this.abollado > 30)) {
      if (Math.abs(lz) > 0.65 && this.defensas) { const d = this.defensas[lz > 0 ? 0 : 1]; if (d && d.parent === this.carro && (fuerza > 11 || Math.random() < 0.45)) J.soltarPieza(d, this, -lx, -lz); }
      if (lx > 0.65 && this.puerta && this.puerta.parent === this.carro && (fuerza > 12 || (this.abollado > 45 && Math.random() < 0.5))) { this.puertaSuelta = this.puerta; this.puertaOrig = { p: this.puerta.position.clone(), r: this.puerta.rotation.clone() }; J.soltarPieza(this.puerta, this, 1, 0); this.puerta = null; this.ventPuerta && (this.ventPuerta.visible = false); }
    }
    if ((fuerza > 10 || this.abollado > 40) && !this.vidrioRoto && this.partes[1]) { this.vidrioRoto = true; this.partes[1].material = matVidrioRoto; this.juego.audio?.ruidoCorto?.(0.3, 3500, 0.15, 'highpass'); for (let n = 0; n < 6; n++) this.juego.chispa?.(new THREE.Vector3(this.pos.x + (Math.random() - 0.5) * 1.5, 1.3, this.pos.z + (Math.random() - 0.5) * 1.5), '#cfe0ea'); }
  }

  ponchar(i) {
    const r = this.ruedas[i]; if (!r || this.bici || this.quemado || this.mejoras?.llantas) return false;
    this.ponchadas = this.ponchadas || new Set(); if (this.ponchadas.has(i)) return false;
    this.ponchadas.add(i); r.scale.y = r.scale.z = (r.scale.y || 1) * 0.74; r.parent.position.y -= 0.09; this.carro.rotation.z += (r.parent.position.x > 0 ? -1 : 1) * 0.03;
    this.juego.audio?.ruidoCorto?.(0.5, 900, 0.2, 'lowpass', 0.9);
    return true;
  }

  reparar() {
    const J = this.juego;
    for (const d of this.defensas || []) if (d && d.parent !== this.carro) { J.recogerPieza?.(d); d.position.set(0, 0, 0); d.quaternion.identity(); d.scale.set(1, 1, 1); this.carro.add(d); }
    if (this.puertaSuelta) { const d = this.puertaSuelta; J.recogerPieza?.(d); d.position.copy(this.puertaOrig.p); d.rotation.copy(this.puertaOrig.r); d.scale.set(1, 1, 1); this.carro.add(d); this.puerta = d; this.puertaSuelta = null; }
    if (this.ponchadas) { for (const i of this.ponchadas) { const r = this.ruedas[i]; r.scale.y = r.scale.z = r.scale.x < 0 ? 1 : r.scale.x; r.parent.position.y += 0.09; } this.ponchadas = null; }
  }

  dañar(n, causa, autor) {
    if (this.quemado) return;
    if (this.tipo === 'blindado' && causa !== 'explosion') n *= causa === 'bala' ? 0.3 : 0.5;
    if (this.bici && causa !== 'explosion') { this.salud = Math.max(1, this.salud - n * 0.3); return; }
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
