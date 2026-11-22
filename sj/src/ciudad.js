import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { construirEstadio } from './estadio.js?v=202611220058';
import { hoja } from './texturas.js?v=202611220058';

const FACH = hoja('assets/fachadas.jpg', 3, 2, { tam: 512, repetir: true, brillo: true, sinUrl: true });
FACH.forEach((p, i) => { if (i === 3) p.vidrio = true; });
const SUELO = hoja('assets/suelos.jpg', 3, 2, { tam: 512, repetir: true, sinUrl: true });
const ESTILO_FACH = { casa: 0, casa2: 1, oficina: 2, torre: 3, local: 4, ladrillo: 5 };
const TILE = { casa: [7.2, 6.4], casa2: [7.2, 6.4], local: [7.2, 9.6], ladrillo: [7.2, 6.4], oficina: [8, 7], torre: [7, 7.6] };
function texSuelo(i, rep) {
  const t = new THREE.CanvasTexture(SUELO[i].canvas);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (rep) t.repeat.set(rep, rep);
  SUELO.listo.then(() => { t.needsUpdate = true; });
  return t;
}

export const BLOQUES = 8, PASO = 80, CALLE = 16, BANQUETA = 3, CARRIL = 4;
export const LIMITE = (BLOQUES / 2) * PASO + CALLE / 2;
export const linea = i => (i - BLOQUES / 2) * PASO;
export const indiceLinea = v => Math.max(0, Math.min(BLOQUES, Math.round(v / PASO + BLOQUES / 2)));

export function rng(semilla) {
  let s = semilla | 0;
  return () => {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const VACIO = [];

export class Mundo {
  constructor() { this.cajas = []; this.hash = new Map(); }
  agregar(minx, minz, maxx, maxz, h = 60) {
    const c = { minx, minz, maxx, maxz, h };
    this.cajas.push(c);
    for (let x = Math.floor(minx / 20); x <= Math.floor(maxx / 20); x++)
      for (let z = Math.floor(minz / 20); z <= Math.floor(maxz / 20); z++) {
        const k = x * 1000 + z;
        let l = this.hash.get(k);
        if (!l) { l = []; this.hash.set(k, l); }
        l.push(c);
      }
    return c;
  }
  celda(x, z) { return this.hash.get(Math.floor(x / 20) * 1000 + Math.floor(z / 20)) || VACIO; }
  empujar(p, r, alto = 0) {
    let choque = null;
    const x0 = Math.floor((p.x - r) / 20), x1 = Math.floor((p.x + r) / 20);
    const z0 = Math.floor((p.z - r) / 20), z1 = Math.floor((p.z + r) / 20);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const l = this.hash.get(cx * 1000 + cz);
      if (!l) continue;
      for (const c of l) {
        if (alto > c.h) continue;
        const px = Math.max(c.minx, Math.min(p.x, c.maxx)), pz = Math.max(c.minz, Math.min(p.z, c.maxz));
        let dx = p.x - px, dz = p.z - pz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 < 1e-8) {
          const a = p.x - c.minx, b = c.maxx - p.x, e = p.z - c.minz, f = c.maxz - p.z, m = Math.min(a, b, e, f);
          if (m === a) { p.x = c.minx - r; choque = { x: -1, z: 0 }; }
          else if (m === b) { p.x = c.maxx + r; choque = { x: 1, z: 0 }; }
          else if (m === e) { p.z = c.minz - r; choque = { x: 0, z: -1 }; }
          else { p.z = c.maxz + r; choque = { x: 0, z: 1 }; }
          continue;
        }
        const d = Math.sqrt(d2);
        dx /= d; dz /= d;
        p.x = px + dx * r; p.z = pz + dz * r;
        choque = { x: dx, z: dz };
      }
    }
    const lim = LIMITE + 2 - r;
    if (Math.abs(p.x) > 1500 || Math.abs(p.z) > 1500) return choque;
    if (p.x > lim) { p.x = lim; choque = { x: -1, z: 0 }; }
    if (p.x < -lim) { p.x = -lim; choque = { x: 1, z: 0 }; }
    if (p.z > lim) { p.z = lim; choque = { x: 0, z: -1 }; }
    if (p.z < -lim) { p.z = -lim; choque = { x: 0, z: 1 }; }
    return choque;
  }
  dentro(x, y, z) {
    for (const c of this.celda(x, z))
      if (x > c.minx && x < c.maxx && z > c.minz && z < c.maxz && y < c.h) return true;
    return false;
  }
  rayo(ax, ay, az, bx, by, bz, paso = 0.8) {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const largo = Math.hypot(dx, dy, dz);
    const n = Math.max(1, Math.ceil(largo / paso));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (this.dentro(ax + dx * t, ay + dy * t, az + dz * t)) return (i - 1) / n;
    }
    return 1;
  }
}

export function esCalle(x, z) {
  if (Math.abs(x) > LIMITE || Math.abs(z) > LIMITE) return false;
  return Math.abs(x - linea(indiceLinea(x))) < CALLE / 2 || Math.abs(z - linea(indiceLinea(z))) < CALLE / 2;
}

const ESPECIALES = {
  '0,0': 'taller', '2,1': 'hospital', '3,3': 'catedral', '4,3': 'plaza', '4,4': 'monumento', '3,4': 'mercado',
  '1,6': 'tianguis', '5,6': 'banco', '6,5': 'comisaria', '5,2': 'lago', '2,5': 'parque', '0,4': 'parque',
  '7,7': 'estadio', '5,4': 'parque', '2,3': 'armeria', '7,5': 'gasolinera'
};

export function tipoBloque(bx, bz) {
  const k = bx + ',' + bz;
  if (ESPECIALES[k]) return ESPECIALES[k];
  if (Math.hypot(bx - 6.5, bz - 1) < 2.1) return 'torres';
  if (Math.hypot(bx - 3.5, bz - 3.5) < 2.3) return 'centro';
  return 'barrio';
}

export const COLORES_CASA = ['#e8a8b0', '#ecd08e', '#9cbcd8', '#d8946e', '#acc8a0', '#bca6d0', '#f2ede4', '#e8b888', '#d88484', '#8cc4be', '#f0ebe2', '#e6dccb'];

function lienzo(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function texturaFachada(tipo, r) {
  const c = lienzo(256), g = c.getContext('2d');
  const e = lienzo(256), ge = e.getContext('2d');
  ge.fillStyle = '#000'; ge.fillRect(0, 0, 256, 256);
  if (tipo === 'torre') {
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#9fc4e8'); grad.addColorStop(1, '#5d86b5');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) {
      g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.18})`;
      g.fillRect(x * 32 + 2, y * 64 + 4, 28, 52);
      if (r() < 0.5) { ge.fillStyle = r() < 0.7 ? '#ffe9b0' : '#cfe6ff'; ge.fillRect(x * 32 + 2, y * 64 + 4, 28, 52); }
    }
    g.fillStyle = '#2d3e55';
    for (let y = 0; y < 4; y++) g.fillRect(0, y * 64 + 56, 256, 8);
    for (let x = 0; x < 8; x++) g.fillRect(x * 32, 0, 2, 256);
    g.fillRect(0, 0, 256, 4);
  } else {
    const pared = tipo === 'casa' ? '#ffffff' : '#d4d0c8';
    g.fillStyle = pared; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
    const mx = tipo === 'casa' ? 18 : 10, arriba = tipo === 'casa' ? 14 : 10, abajo = tipo === 'casa' ? 16 : 12;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const px = x * 64 + mx, py = y * 64 + arriba, w = 64 - mx * 2, h = 64 - arriba - abajo;
      g.fillStyle = tipo === 'casa' ? 'rgba(0,0,0,.18)' : '#9a958c';
      g.fillRect(px - 3, py - 3, w + 6, h + 6);
      g.fillStyle = tipo === 'casa' ? '#2b3442' : '#3a4a5e';
      g.fillRect(px, py, w, h);
      g.fillStyle = 'rgba(255,255,255,.12)';
      g.fillRect(px + 2, py + 2, w * 0.4, h - 4);
      if (tipo === 'casa') { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px - 5, py + h + 3, w + 10, 4); }
      if (r() < 0.42) { ge.fillStyle = r() < 0.75 ? '#ffd58a' : '#ffeccc'; ge.fillRect(px, py, w, h); }
    }
  }
  const t = new THREE.CanvasTexture(c), te = new THREE.CanvasTexture(e);
  for (const x of [t, te]) { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 4; }
  return { mapa: t, brillo: te };
}

function texturaAsfalto(r) {
  const c = lienzo(256), g = c.getContext('2d');
  g.fillStyle = '#3b3d42'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) { const v = 40 + r() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.5)`; g.fillRect(r() * 256, r() * 256, 1.5, 1.5); }
  for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.arc(r() * 256, r() * 256, 10 + r() * 30, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function texturaBanqueta(r) {
  const c = lienzo(128), g = c.getContext('2d');
  g.fillStyle = '#c4beb2'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(r() * 128, r() * 128, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaPasto(r) {
  const c = lienzo(128), g = c.getContext('2d');
  g.fillStyle = '#5e9a48'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,70,20,.25)' : 'rgba(160,210,110,.18)'; g.fillRect(r() * 128, r() * 128, 1.5, 3); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function letrero(texto, fondo, tinta, ancho, alto, fuente = 'Anton') {
  const c = lienzo(512, Math.round(512 * alto / ancho)), g = c.getContext('2d');
  g.fillStyle = fondo; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = tinta;
  let tam = c.height * 0.62;
  g.font = `${tam}px ${fuente}, Impact, sans-serif`;
  while (g.measureText(texto).width > c.width * 0.9 && tam > 10) { tam -= 2; g.font = `${tam}px ${fuente}, Impact, sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(texto, c.width / 2, c.height / 2 + tam * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t, fog: true }));
  return m;
}

const _col = new THREE.Color();
function teñir(geo, color) {
  _col.set(color);
  const n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = _col.r; a[i * 3 + 1] = _col.g; a[i * 3 + 2] = _col.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}

class Obra {
  constructor(mundo) { this.mundo = mundo; this.pilas = {}; this.grandes = []; }
  pila(n) { return this.pilas[n] || (this.pilas[n] = []); }
  caja(estilo, x, z, w, d, h, color, y0 = 0.15, choca = true, rotY = 0) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.attributes.uv;
    const [tw, th] = TILE[estilo] || [7, 6.4];
    const caras = [d, d, 0, 0, w, w];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (caras[f] === 0 || estilo === 'liso') uv.setXY(i, 0.02, 0.98);
      else uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(caras[f] / tw * 2) / 2), uv.getY(i) * h / th);
    }
    if (estilo === 'ladrillo' || estilo === 'oficina' || estilo === 'torre') color = estilo === 'torre' ? color : '#efeae4';
    teñir(geo, color);
    if (rotY) geo.rotateY(rotY);
    geo.translate(x, y0 + h / 2, z);
    this.pila(estilo).push(geo);
    if (choca) this.mundo.agregar(x - w / 2, z - d / 2, x + w / 2, z + d / 2, y0 + h);
    if (estilo === 'liso' && choca && !rotY && h >= 7.5 && w >= 8 && d >= 8) this.grandes.push({ x, z, w, d, h, y0 });
    return geo;
  }
  forma(estilo, geo, color, x, y, z) {
    if (geo.index === null) geo = geo;
    teñir(geo, color);
    geo.translate(x, y, z);
    this.pila(estilo).push(geo);
  }
}

export const VIENTO = { value: 0 };

export function construirCiudad(escena, mundo) {
  const r = rng(20261121);
  const obra = new Obra(mundo);
  const salida = { farolas: [], arboles: [], bloques: [], lugares: {}, letreros: [], neones: [], estacionados: [], suelo: null, edificios: [], torres: [], tiendas: [], libres: [], bancas: [] };
  const banca = (x, z, yaw) => salida.bancas.push({ x, z, yaw, ocupante: null });

  const asfalto = texSuelo(0, 170);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ map: asfalto, color: '#ffffff', roughness: 0.94, metalness: 0 }));
  salida.matsSuelo = [piso.material];
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  escena.add(piso);
  salida.suelo = piso;

  const pastoT = texSuelo(3);
  const pastoAfuera = texSuelo(3, 160);
  const borde = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshLambertMaterial({ map: pastoAfuera, color: '#c8d0b8' }));
  borde.rotation.x = -Math.PI / 2; borde.position.y = 0.04;
  const marcoAfuera = new THREE.Group();
  for (const [x, z, w, d] of [[0, LIMITE + 360, 1400, 700], [0, -LIMITE - 360, 1400, 700], [LIMITE + 360, 0, 700, 1400], [-LIMITE - 360, 0, 700, 1400]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), borde.material);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.04, z);
    marcoAfuera.add(m);
  }
  escena.add(marcoAfuera);

  const banquetaT = texSuelo(1);
  const matBanqueta = new THREE.MeshStandardMaterial({ map: banquetaT, roughness: 0.95, metalness: 0 });
  salida.matsSuelo.push(matBanqueta);
  const matPasto = new THREE.MeshLambertMaterial({ map: pastoT });
  const matPiedra = new THREE.MeshLambertMaterial({ color: '#e8e2da', map: texSuelo(2) });
  const geosBanqueta = [], geosPasto = [], geosPiedra = [];
  const losa = (lista, x0, z0, x1, z1, y, rep = 4) => {
    const g = new THREE.BoxGeometry(x1 - x0, y, z1 - z0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / rep, uv.getY(i) * (z1 - z0) / rep);
    g.translate((x0 + x1) / 2, y / 2, (z0 + z1) / 2);
    lista.push(g);
  };

  for (let i = 0; i < 4; i++) {
    const L = LIMITE + 1.2;
    const [x0, z0, x1, z1] = [[-L - 1, -L - 1, L + 1, -L], [-L - 1, L, L + 1, L + 1], [-L - 1, -L, -L, L], [L, -L, L + 1, L]][i];
    obra.caja('liso', (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 1.1, '#c9c2b4', 0, true);
  }

  const arbol = (x, z, morado = r() < 0.55, escala = 0.8 + r() * 0.5) => {
    salida.arboles.push({ x, z, morado, escala });
    mundo.agregar(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 6);
  };

  for (let bx = 0; bx < BLOQUES; bx++) for (let bz = 0; bz < BLOQUES; bz++) {
    const x0 = linea(bx) + CALLE / 2, x1 = linea(bx + 1) - CALLE / 2;
    const z0 = linea(bz) + CALLE / 2, z1 = linea(bz + 1) - CALLE / 2;
    const tipo = tipoBloque(bx, bz);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    salida.bloques.push({ bx, bz, x0, z0, x1, z1, tipo, cx, cz });
    const verde = tipo === 'parque' || tipo === 'lago';
    const empedrado = tipo === 'plaza' || tipo === 'catedral' || tipo === 'monumento';
    losa(geosBanqueta, x0, z0, x1, z1, 0.15);
    if (verde) losa(geosPasto, x0 + BANQUETA, z0 + BANQUETA, x1 - BANQUETA, z1 - BANQUETA, 0.17, 6);
    if (empedrado) losa(geosPiedra, x0 + BANQUETA, z0 + BANQUETA, x1 - BANQUETA, z1 - BANQUETA, 0.17, 3);
    for (const t of [0.12, 0.38, 0.62, 0.88]) {
      if (tipo === 'torres' || tipo === 'estadio' || tipo === 'gasolinera') continue;
      if (r() < 0.6) arbol(x0 + (x1 - x0) * t, z0 + 0.7);
      if (r() < 0.6) arbol(x0 + (x1 - x0) * t, z1 - 0.7);
      if (r() < 0.6) arbol(x0 + 0.7, z0 + (z1 - z0) * t);
      if (r() < 0.6) arbol(x1 - 0.7, z0 + (z1 - z0) * t);
    }
    const ix0 = x0 + BANQUETA, ix1 = x1 - BANQUETA, iz0 = z0 + BANQUETA, iz1 = z1 - BANQUETA;
    const fila = (estilo, alturaMin, alturaMax, fondo, colores, anchoMin = 8, anchoMax = 13) => {
      const lados = [
        { a: ix0, b: ix1, fijo: iz0, eje: 'x', s: 1 },
        { a: ix0, b: ix1, fijo: iz1, eje: 'x', s: -1 },
        { a: iz0 + fondo, b: iz1 - fondo, fijo: ix0, eje: 'z', s: 1 },
        { a: iz0 + fondo, b: iz1 - fondo, fijo: ix1, eje: 'z', s: -1 }
      ];
      for (const L of lados) {
        let p = L.a;
        while (p < L.b - 4) {
          let w = anchoMin + r() * (anchoMax - anchoMin);
          if (L.b - (p + w) < anchoMin) w = L.b - p;
          const h = alturaMin + r() * (alturaMax - alturaMin);
          const col = colores[r() * colores.length | 0];
          const est = typeof estilo === 'function' ? estilo() : estilo;
          if (L.eje === 'x') obra.caja(est, p + w / 2, L.fijo + L.s * fondo / 2, w - 0.2, fondo, h, col);
          else obra.caja(est, L.fijo + L.s * fondo / 2, p + w / 2, fondo, w - 0.2, h, col);
          const fr = L.eje === 'x' ? [0, -L.s] : [-L.s, 0];
          const ex = L.eje === 'x' ? p + w / 2 : L.fijo + L.s * fondo / 2, ez = L.eje === 'x' ? L.fijo + L.s * fondo / 2 : p + w / 2;
          salida.edificios.push({ x: ex, z: ez, w: w - 0.2, fondo, h, frente: fr, estilo: ['casa', 'casa2', 'ladrillo', 'local'].includes(est) ? 'casa' : est, tipo });
          p += w;
        }
      }
    };
    if (tipo === 'barrio') {
      fila(() => { const x = r(); return x < 0.45 ? 'casa' : x < 0.8 ? 'casa2' : 'ladrillo'; }, 4, 9.5, 14, COLORES_CASA);
      if (r() < 0.6) arbol(cx + (r() - 0.5) * 10, cz + (r() - 0.5) * 10, true, 1.4);
    } else if (tipo === 'centro') {
      fila(() => { const x = r(); return x < 0.4 ? 'casa' : x < 0.65 ? 'casa2' : x < 0.8 ? 'ladrillo' : 'oficina'; }, 7, 17, 17, COLORES_CASA, 10, 16);
    } else if (tipo === 'torres') {
      const n = r() < 0.5 ? 2 : 3;
      const tam = (ix1 - ix0) / n;
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
        const alto = r() < 0.7 ? 35 + r() * 75 : 18 + r() * 14;
        const est = alto > 34 ? 'torre' : 'oficina';
        const w = tam - 4 - r() * 4, d = tam - 4 - r() * 4;
        const col = est === 'torre' ? ['#ffffff', '#dff0ff', '#cfe0f5', '#e8f7f0'][r() * 4 | 0] : '#e8e4dc';
        const x = ix0 + tam * (a + 0.5), z = iz0 + tam * (b + 0.5);
        obra.caja(est, x, z, w, d, alto, col);
        salida.torres.push({ x, z, w, d, h: alto, estilo: est });
        if (est === 'torre' && r() < 0.6) obra.caja('liso', x, z, w * 0.5, d * 0.5, 4, '#9aa6b5', alto + 0.15, false);
        if (alto > 70) salida.neones.push({ x, y: alto + 0.4, z, w, d });
      }
    } else if (tipo === 'lago') {
      const m = 6, wx0 = ix0 + m, wx1 = ix1 - m, wz0 = iz0 + m, wz1 = iz1 - m;
      losa(geosPiedra, wx0 - 1.6, wz0 - 1.6, wx1 + 1.6, wz1 + 1.6, 0.2, 3);
      const agua = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0, 48, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#12404f', roughness: 0.1, metalness: 0.12, transparent: true, opacity: 0.93, envMapIntensity: 1.15 }));
      agua.material.onBeforeCompile = sh => {
        sh.uniforms.tiempo = VIENTO;
        sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed.y += sin(position.x * 0.45 + tiempo * 1.6) * 0.018 + cos(position.z * 0.38 + tiempo * 1.2) * 0.018;').replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  objectNormal = normalize(vec3(-cos(position.x * 0.45 + tiempo * 1.6) * 0.022, 1.0, sin(position.z * 0.38 + tiempo * 1.2) * 0.019));');
      };
      {
        const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'), im = g.createImageData(N, N), alt = new Float32Array(N * N);
        const ondas = Array.from({ length: 14 }, () => ({ kx: Math.round((Math.random() - 0.5) * 16), kz: Math.round((Math.random() - 0.5) * 16), f: Math.random() * 6.3 }));
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let h = 0; for (const o of ondas) h += Math.sin((o.kx * x + o.kz * y) / N * 6.2832 + o.f) / (1 + Math.hypot(o.kx, o.kz) * 0.25); alt[y * N + x] = h; }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = alt[y * N + (x + 1) % N] - alt[y * N + (x + N - 1) % N], dy = alt[((y + 1) % N) * N + x] - alt[((y + N - 1) % N) * N + x], i = (y * N + x) * 4; im.data[i] = 128 - dx * 90; im.data[i + 1] = 128 - dy * 90; im.data[i + 2] = 255; im.data[i + 3] = 255; }
        g.putImageData(im, 0, 0);
        const nt = new THREE.CanvasTexture(cv); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set((wx1 - wx0) / 9, (wz1 - wz0) / 9);
        agua.material.normalMap = nt; agua.material.normalScale.set(0.22, 0.22);
      }
      agua.position.set(cx, 0.26, cz); agua.receiveShadow = true; escena.add(agua); salida.agua = agua;
      const fondo = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wz1 - wz0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#0d2a33' }));
      fondo.position.set(cx, 0.205, cz); escena.add(fondo);
      const muelleZ0 = wz1 - 12;
      obra.caja('liso', cx, (muelleZ0 + wz1 + 1.6) / 2, 3, wz1 + 1.6 - muelleZ0, 0.18, '#8a6a46', 0.3, false);
      for (let k = 0; k < 4; k++) for (const sx of [-1.4, 1.4]) obra.forma('liso', new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), '#5a4430', cx + sx, 0.3, muelleZ0 + 0.3 + k * 3.6);
      mundo.agregar(wx0, wz0, cx - 1.5, wz1, 0.9);
      mundo.agregar(cx + 1.5, wz0, wx1, wz1, 0.9);
      mundo.agregar(cx - 1.5, wz0, cx + 1.5, muelleZ0, 0.9);
      salida.lago = { x0: wx0, x1: wx1, z0: wz0, z1: wz1, muelle: { x: cx, z0: muelleZ0, z1: wz1 } };
      for (const d of [-14, -6, 8, 16]) { banca(wx0 - 2.6, cz + d, -Math.PI / 2); banca(wx1 + 2.6, cz + d, Math.PI / 2); }
      salida.lugares.lago = { x: cx, z: wz1 + 3 };
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const rx = (wx1 - wx0) / 2 + 3.5, rz = (wz1 - wz0) / 2 + 3.5; if (Math.abs(Math.cos(a)) < 0.2 && Math.sin(a) > 0) continue; arbol(cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, i % 3 !== 0, 1 + r() * 0.5); }
    } else if (tipo === 'parque') {
      for (const d of [8, 16, 24]) { banca(cx + 2.6, cz + d, -Math.PI / 2); banca(cx - 2.6, cz - d, Math.PI / 2); banca(cx + d, cz - 2.6, 0); banca(cx - d, cz + 2.6, Math.PI); }
      losa(geosPiedra, cx - 1.5, iz0, cx + 1.5, iz1, 0.19, 3);
      losa(geosPiedra, ix0, cz - 1.5, ix1, cz + 1.5, 0.19, 3);
      for (let i = 0; i < 26; i++) {
        const x = ix0 + 3 + r() * (ix1 - ix0 - 6), z = iz0 + 3 + r() * (iz1 - iz0 - 6);
        if (Math.abs(x - cx) < 3 || Math.abs(z - cz) < 3) continue;
        arbol(x, z, r() < 0.6, 1 + r() * 0.7);
      }
      obra.forma('liso', new THREE.CylinderGeometry(3, 3.4, 0.7, 20), '#bfb6a2', cx, 0.5, cz);
      obra.forma('liso', new THREE.CylinderGeometry(2.4, 2.4, 0.2, 20), '#5aa0d8', cx, 0.86, cz);
      mundo.agregar(cx - 3, cz - 3, cx + 3, cz + 3, 1);
    } else if (tipo === 'plaza') {
      obra.forma('liso', new THREE.CylinderGeometry(7, 7.5, 1.2, 8), '#d9c9a8', cx, 0.75, cz);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 + Math.PI / 8;
        obra.forma('liso', new THREE.CylinderGeometry(0.22, 0.22, 4.2, 6), '#2f6b4f', cx + Math.cos(a) * 6, 3.4, cz + Math.sin(a) * 6);
      }
      obra.forma('liso', new THREE.ConeGeometry(8.4, 2.6, 8), '#2f6b4f', cx, 6.8, cz);
      obra.forma('liso', new THREE.SphereGeometry(0.6, 8, 6), '#e2b64a', cx, 8.3, cz);
      mundo.agregar(cx - 7, cz - 7, cx + 7, cz + 7, 1.4);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2;
        arbol(cx + Math.cos(a) * 20, cz + Math.sin(a) * 20, true, 1.3);
      }
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        obra.caja('liso', cx + Math.cos(a) * 13, cz + Math.sin(a) * 13, 2.2, 0.6, 0.5, '#6b4a2f', 0.17, false);
      }
      salida.lugares.plaza = { x: cx, z: cz };
    } else if (tipo === 'catedral') {
      const fz = iz1 - 12;
      obra.caja('liso', cx, fz - 18, 22, 36, 16, '#e9dcc0');
      obra.caja('liso', cx, fz - 18, 8, 30, 20, '#e2d2b2', 0.15, false);
      obra.forma('liso', new THREE.CylinderGeometry(5, 5, 6, 12), '#e2d2b2', cx, 21, fz - 26);
      obra.forma('liso', new THREE.SphereGeometry(5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#f2c94c', cx, 24, fz - 26);
      obra.caja('liso', cx, fz + 0.6, 10, 2, 18, '#f1e6cc');
      obra.forma('liso', new THREE.ConeGeometry(5.5, 4, 4, 1).rotateY(Math.PI / 4), '#f1e6cc', cx, 20.1, fz + 0.6);
      obra.forma('liso', new THREE.CylinderGeometry(1.8, 1.8, 0.3, 20).rotateX(Math.PI / 2), '#3d6fb8', cx, 12.5, fz + 1.65);
      obra.forma('liso', new THREE.CylinderGeometry(1.2, 1.2, 0.32, 20).rotateX(Math.PI / 2), '#f2c94c', cx, 12.5, fz + 1.7);
      for (const s of [-1, 1]) {
        const tx = cx + s * 8.5;
        obra.caja('liso', tx, fz - 2, 7, 7, 26, '#efe3c8');
        obra.caja('liso', tx, fz - 2, 5.4, 5.4, 6, '#e6d6b6', 26.15, false);
        obra.forma('liso', new THREE.ConeGeometry(3.6, 13, 8), '#f2c94c', tx, 38.6, fz - 2);
        obra.forma('liso', new THREE.ConeGeometry(3.7, 3, 8), '#3d7fd1', tx, 33.6, fz - 2);
        obra.forma('liso', new THREE.BoxGeometry(0.4, 2.4, 0.4), '#3a3a3a', tx, 46.2, fz - 2);
        obra.forma('liso', new THREE.BoxGeometry(1.4, 0.4, 0.4), '#3a3a3a', tx, 46.6, fz - 2);
        for (const y of [8, 15, 21, 28.5]) obra.caja('liso', tx, fz + 1.55, 1.4, 0.12, 2.6, '#4a3626', y, false);
        for (const k of [-1, 1]) obra.caja('liso', tx + k * 2.7, fz + 1.6, 0.5, 0.2, 26, '#e0d0ae', 0.15, false);
      }
      obra.caja('liso', cx, fz + 1.7, 4, 0.2, 6.5, '#5a3a24', 0.15, false);
      obra.caja('liso', cx, fz + 1.75, 5, 0.2, 0.5, '#d8c49c', 6.65, false);
      for (let i = 0; i < 10; i++) arbol(ix0 + 3 + i * 5.6, iz0 + 4, true, 1.2);
      salida.lugares.catedral = { x: cx, z: iz1 - 3 };
    } else if (tipo === 'monumento') {
      obra.forma('liso', new THREE.CylinderGeometry(12, 12.5, 0.8, 32), '#cdbd9b', cx, 0.55, cz);
      obra.forma('liso', new THREE.CylinderGeometry(10.5, 10.5, 0.3, 32), '#4f9bd6', cx, 0.98, cz);
      obra.forma('liso', new THREE.CylinderGeometry(1.8, 2.4, 4, 12), '#d8ccb0', cx, 2.5, cz);
      obra.forma('liso', new THREE.CylinderGeometry(0.9, 1.1, 16, 12), '#e8dcc0', cx, 12.5, cz);
      obra.forma('liso', new THREE.BoxGeometry(1.6, 1.4, 1.6), '#c9a04a', cx, 21.2, cz);
      obra.forma('liso', new THREE.CylinderGeometry(0.35, 0.5, 2.6, 8), '#b88c3a', cx, 23.2, cz);
      obra.forma('liso', new THREE.SphereGeometry(0.45, 8, 6), '#b88c3a', cx, 24.8, cz);
      obra.forma('liso', new THREE.BoxGeometry(2.8, 0.3, 0.3), '#b88c3a', cx, 24, cz);
      mundo.agregar(cx - 12, cz - 12, cx + 12, cz + 12, 1.2);
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        arbol(cx + Math.cos(a) * 21, cz + Math.sin(a) * 21, i % 2 === 0, 1.2);
      }
      salida.lugares.monumento = { x: cx, z: cz };
    } else if (tipo === 'mercado') {
      obra.caja('liso', cx, cz, 46, 46, 9, '#c96f45');
      for (let i = 0; i < 4; i++) {
        const g = new THREE.CylinderGeometry(5.6, 5.6, 46, 14, 1, false, 0, Math.PI);
        g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2);
        obra.forma('liso', g, '#7a9db8', cx - 17.25 + i * 11.5, 9.15, cz);
      }
      for (let i = 0; i < 6; i++) obra.caja('liso', cx - 17 + i * 6.8, cz + 23.2, 3, 0.4, 4.5, '#3c2a20', 0.15, false);
      salida.lugares.mercado = { x: cx, z: iz1 + 1.2 };
    } else if (tipo === 'tianguis') {
      salida.lugares.tianguis = { x: cx, z: cz + 2 };
    } else if (tipo === 'taller') {
      obra.caja('oficina', ix0 + 18, iz0 + 8, 30, 14, 7, '#a9b6c2');
      obra.caja('liso', ix0 + 18, iz0 + 15.1, 12, 0.3, 4.6, '#2b2f33', 0.15, false);
      obra.caja('liso', ix1 - 9, iz0 + 7, 14, 12, 6, '#ff4f9a');
      obra.caja('liso', ix1 - 9, iz0 + 13.1, 9, 0.3, 4, '#1f1f24', 0.15, false);
      const l1 = letrero('TALLER DON CHUY', '#1c2230', '#ffc94a', 16, 2.4);
      l1.position.set(ix0 + 18, 8.4, iz0 + 15.2);
      escena.add(l1); salida.letreros.push(l1);
      const l2 = letrero('PINTURA EXPRESS', '#ffffff', '#ff2f7d', 10, 1.8);
      l2.position.set(ix1 - 9, 7, iz0 + 13.3);
      escena.add(l2); salida.letreros.push(l2);
      {
        const llanta = new THREE.TorusGeometry(0.34, 0.13, 10, 20).rotateX(Math.PI / 2), rin = new THREE.CylinderGeometry(0.22, 0.22, 0.2, 14), pila = [], rines = [];
        for (let i = 0; i < 6; i++) {
          const n = 3 + (i % 2) * 3, x = ix0 + 30 + i * 1.2, z = iz1 - 3;
          for (let k = 0; k < n; k++) { pila.push(llanta.clone().rotateY(k * 0.7).translate(x + (Math.random() - 0.5) * 0.06, 0.13 + k * 0.255, z + (Math.random() - 0.5) * 0.06)); rines.push(rin.clone().translate(x, 0.13 + k * 0.255, z)); }
          mundo.agregar(x - 0.48, z - 0.48, x + 0.48, z + 0.48, n * 0.255);
        }
        const g1 = new THREE.Mesh(mergeGeometries(pila), new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.92 })); g1.castShadow = g1.receiveShadow = true; escena.add(g1);
        const g2 = new THREE.Mesh(mergeGeometries(rines), new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.95 })); escena.add(g2);
      }
      {
        const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
        const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#c9ced4'); gr.addColorStop(1, '#9aa1a8'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 10) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y, 256, 2); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, y + 7, 256, 3); }
        for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${Math.random() < 0.6 ? '60,50,40' : '255,255,255'},${Math.random() * 0.1})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1); }
        const sucio = g.createLinearGradient(0, 180, 0, 256); sucio.addColorStop(0, 'rgba(70,55,40,0)'); sucio.addColorStop(1, 'rgba(70,55,40,0.45)'); g.fillStyle = sucio; g.fillRect(0, 180, 256, 76);
        g.fillStyle = 'rgba(30,30,32,0.8)'; g.fillRect(110, 236, 36, 6);
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 4;
        for (const [x, z, w, h, col] of [[ix0 + 18, iz0 + 15.27, 11.6, 4.5, '#aeb4ba'], [ix1 - 9, iz0 + 13.27, 8.6, 3.9, '#c9bfc4']]) {
          const t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.round(w / 4), 1);
          const cortina = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: col, map: t, metalness: 0.55, roughness: 0.42 }));
          cortina.position.set(x, h / 2 + 0.02, z); cortina.receiveShadow = true; escena.add(cortina);
          const caja = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.45, 0.5), new THREE.MeshStandardMaterial({ color: '#5c636b', metalness: 0.6, roughness: 0.4 }));
          caja.position.set(x, h + 0.2, z - 0.05); caja.castShadow = true; escena.add(caja);
          for (const sx of [-1, 1]) { const riel = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.18), caja.material); riel.position.set(x + sx * (w / 2 + 0.06), h / 2, z - 0.02); escena.add(riel); }
        }
      }
      salida.lugares.taller = { x: ix0 + 18, z: iz0 + 21 };
      salida.lugares.pintura = { x: ix1 - 9, z: iz0 + 19 };
      salida.lugares.inicio = { x: ix0 + 26, z: iz0 + 30 };
      salida.estacionados.push({ x: ix0 + 41, z: iz0 + 22, yaw: Math.PI / 2, tipo: 'camioneta', color: '#d8d4cc' }, { x: ix0 + 45.5, z: iz0 + 46, yaw: 0.15, tipo: 'compacto', color: '#3a6a44' });
    } else if (tipo === 'hospital') {
      obra.caja('oficina', cx, iz0 + 14, 44, 22, 22, '#ffffff');
      obra.caja('oficina', cx + 14, iz1 - 10, 14, 14, 12, '#eef3f6');
      obra.caja('liso', cx, iz0 + 27.5, 12, 4, 0.3, '#d23b3b', 3.6, false);
      const cruz = letrero('+', '#ffffff', '#e0323a', 6, 6, 'Inter');
      cruz.position.set(cx, 17, iz0 + 25.3);
      escena.add(cruz);
      const l = letrero('HOSPITAL CIVIL', '#e0323a', '#ffffff', 14, 2.2);
      l.position.set(cx, 22.6, iz0 + 25.3);
      escena.add(l); salida.letreros.push(l);
      salida.lugares.hospital = { x: cx, z: iz0 + 30 };
      salida.hospitalLote = { cx, iz0, ix0, ix1, iz1 };
      salida.estacionados.push({ x: cx - 17, z: iz0 + 33, yaw: 0, tipo: 'ambulancia' }, { x: cx - 12.5, z: iz0 + 33, yaw: 0, tipo: 'ambulancia' });
      for (const k of [0, 2, 3, 5]) salida.estacionados.push({ x: cx - 21 + k * 3.2, z: iz0 + 44, yaw: Math.PI, tipo: ['sedan', 'compacto', 'camioneta', 'sedan'][k % 4], color: ['#2e5a8a', '#d8d4cc', '#8a2a26', '#3a6a44', '#6a6e72', '#2a2c30'][k] });
    } else if (tipo === 'comisaria') {
      obra.caja('oficina', cx, iz0 + 12, 40, 18, 12, '#dfe7f2');
      obra.caja('liso', cx, iz0 + 21.2, 40, 0.4, 2, '#2556a8', 9.5, false);
      const l = letrero('POLICÍA DE SANTA JACARANDA', '#2556a8', '#ffffff', 16, 2.2);
      l.position.set(cx, 10.6, iz0 + 21.5);
      escena.add(l); salida.letreros.push(l);
      obra.caja('liso', cx - 14, iz1 - 10, 12, 16, 8, '#b9c6d6');
      salida.lugares.comisaria = { x: cx, z: iz0 + 26 };
      salida.comisariaLote = { cx, iz0, ix0, ix1, iz1 };
      for (const k of [0, 1, 3]) salida.estacionados.push({ x: cx + 4 + k * 3.2, z: iz0 + 41, yaw: 0, tipo: 'policia' });
      salida.estacionados.push({ x: cx + 4 + 5 * 3.2, z: iz0 + 41, yaw: 0, tipo: 'camioneta', color: '#2a2c30' });
      salida.estacionados.push({ x: cx - 6, z: iz0 + 30, yaw: Math.PI / 2, tipo: 'policia' }, { x: cx + 6, z: iz0 + 30, yaw: Math.PI / 2, tipo: 'policia' });
    } else if (tipo === 'banco') {
      const fz = iz1 - 20;
      obra.caja('liso', cx, fz, 34, 22, 15, '#efe6d2');
      obra.caja('liso', cx, iz1 - 7, 34, 4, 1.2, '#e2d6bc', 15.15, false);
      for (let i = 0; i < 8; i++) obra.forma('liso', new THREE.CylinderGeometry(0.7, 0.8, 13, 12), '#f7f0de', cx - 15 + i * 4.3, 6.8, iz1 - 6.6);
      for (let i = 0; i < 8; i++) mundo.agregar(cx - 15 + i * 4.3 - 0.75, iz1 - 7.35, cx - 15 + i * 4.3 + 0.75, iz1 - 5.85, 13);
      obra.forma('liso', new THREE.BoxGeometry(36, 1.4, 6), '#e9dfc8', cx, 14.1, iz1 - 7);
      const l = letrero('BANCO DE OCCIDENTE', '#1f3a2c', '#ffd77a', 18, 2);
      l.position.set(cx, 12.6, iz1 - 3.9);
      escena.add(l); salida.letreros.push(l);
      obra.caja('oficina', cx - 15, iz0 + 9, 26, 16, 24, '#e8e4dc');
      obra.caja('oficina', cx + 16, iz0 + 9, 24, 16, 18, '#d8d2c6');
      salida.lugares.banco = { x: cx, z: iz1 + 1.5 };
    } else if (tipo === 'gasolinera') {
      salida.gasolinera = { ix0, iz0, ix1, iz1, cx, cz };
      salida.lugares.gasolinera = { x: cx, z: iz1 - 20 };
      salida.estacionados.push({ x: cx - 8 + 1.9, z: iz1 - 20, yaw: 0, tipo: 'sedan', color: '#c8c0b0' }, { x: cx + 8 - 1.9, z: iz1 - 20.5, yaw: Math.PI, tipo: 'camioneta', color: '#2a2c30' });
    } else if (tipo === 'armeria') {
      fila('casa', 5, 9, 14, COLORES_CASA);
      const l = letrero('ARMERÍA DEL VALLE', '#1a1d26', '#e2e6ee', 9, 1.6);
      l.position.set(cx, 5.2, iz1 + 0.12);
      escena.add(l); salida.letreros.push(l);
      salida.lugares.armeria = { x: cx, z: iz1 + 1.6 };
    } else if (tipo === 'estadio') {
      salida.estadio = construirEstadio(escena, mundo, cx, cz, VIENTO);
      salida.lugares.estadio = { x: cx, z: cz + 31 };
    }
  }

  const mats = {};
  for (const est in ESTILO_FACH) {
    const p = FACH[ESTILO_FACH[est]];
    mats[est] = new THREE.MeshStandardMaterial({ map: p.textura, vertexColors: true, emissive: '#ffffff', emissiveMap: p.brillo, emissiveIntensity: 0, roughnessMap: p.vidrioMapa, metalnessMap: p.vidrioMapa, roughness: 1, metalness: 1, envMapIntensity: 1.1 });
  }
  mats.liso = new THREE.MeshLambertMaterial({ vertexColors: true });
  {
    const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
    g.fillStyle = '#808080'; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * N, y = Math.random() * N, r = 2 + Math.random() * 14, v = Math.random() < 0.5 ? 0 : 255;
      for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); gr.addColorStop(0, `rgba(${v},${v},${v},${0.05 + Math.random() * 0.06})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2); }
    }
    for (let i = 0; i < 9000; i++) { const v = Math.random() < 0.5 ? 40 : 220; g.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.18})`; g.fillRect(Math.random() * N, Math.random() * N, 1, 1); }
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    mats.liso.onBeforeCompile = sh => {
      sh.uniforms.tAplanado = { value: tex };
      sh.vertexShader = 'varying vec3 vMundoL;\nvarying vec3 vNormalL;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vMundoL = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vNormalL = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = 'uniform sampler2D tAplanado;\nvarying vec3 vMundoL;\nvarying vec3 vNormalL;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  vec3 nA = abs(normalize(vNormalL));
  vec2 uvA = nA.y > 0.6 ? vMundoL.xz : (nA.x > nA.z ? vMundoL.zy : vMundoL.xy);
  float tA = texture2D(tAplanado, uvA * 0.31).r * 0.65 + texture2D(tAplanado, uvA * 0.071).r * 0.35;
  tA = clamp((tA - 0.5) * 3.2 + 0.5, 0.0, 1.0);
  diffuseColor.rgb *= mix(0.84, 1.1, tA);
  diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(0.1, 1.7, vMundoL.y)) * (nA.y > 0.6 ? 1.0 : mix(0.93, 1.0, smoothstep(0.0, 0.25, fract(vMundoL.y / 3.4))));`);
    };
  }
  salida.materialesVentanas = Object.keys(ESTILO_FACH).map(k => mats[k]);
  salida.lisosGrandes = obra.grandes;
  salida.mallas = [];
  for (const est in obra.pilas) {
    const lista = obra.pilas[est].map(g => g.index ? g.toNonIndexed() : g);
    const malla = new THREE.Mesh(mergeGeometries(lista, false), mats[est]);
    malla.castShadow = true; malla.receiveShadow = true;
    escena.add(malla);
    salida.mallas.push(malla);
  }
  const fusion = (lista, mat) => {
    const m = new THREE.Mesh(mergeGeometries(lista.map(g => g.index ? g.toNonIndexed() : g), false), mat);
    m.receiveShadow = true; escena.add(m); return m;
  };
  fusion(geosBanqueta, matBanqueta);
  if (geosPasto.length) fusion(geosPasto, matPasto);
  if (geosPiedra.length) fusion(geosPiedra, matPiedra);

  const marcas = [], amarillas = [], cebras = [];
  for (let i = 0; i <= BLOQUES; i++) for (let j = 0; j < BLOQUES; j++) {
    const a = linea(j) + CALLE / 2 + 3, b = linea(j + 1) - CALLE / 2 - 3;
    for (let p = a; p < b; p += 6) {
      amarillas.push([linea(i) - 0.18, p + 1.5, 0.15, 3]); amarillas.push([linea(i) + 0.18, p + 1.5, 0.15, 3]);
      amarillas.push([p + 1.5, linea(i) - 0.18, 3, 0.15]); amarillas.push([p + 1.5, linea(i) + 0.18, 3, 0.15]);
    }
    for (const s of [-1, 1]) {
      marcas.push([linea(i) + s * (CALLE / 2 - 0.4), (a + b) / 2, 0.15, b - a]);
      marcas.push([(a + b) / 2, linea(i) + s * (CALLE / 2 - 0.4), b - a, 0.15]);
    }
  }
  for (let i = 0; i <= BLOQUES; i++) for (let j = 0; j <= BLOQUES; j++) {
    const X = linea(i), Z = linea(j);
    for (let k = -3; k <= 3; k++) {
      const o = k * 1.9;
      if (j > 0) cebras.push([X + o, Z - CALLE / 2 - 1.6, 1, 2.6]);
      if (j < BLOQUES) cebras.push([X + o, Z + CALLE / 2 + 1.6, 1, 2.6]);
      if (i > 0) cebras.push([X - CALLE / 2 - 1.6, Z + o, 2.6, 1]);
      if (i < BLOQUES) cebras.push([X + CALLE / 2 + 1.6, Z + o, 2.6, 1]);
    }
  }
  const planos = (lista, color, y) => {
    const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
    const m = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color }), lista.length);
    const o = new THREE.Object3D();
    lista.forEach((q, i) => { o.position.set(q[0], y, q[1]); o.scale.set(q[2], 1, q[3]); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.receiveShadow = true;
    escena.add(m); return m;
  };
  planos(amarillas, '#e8c13a', 0.02);
  planos(marcas, '#e9e9e9', 0.021);
  planos(cebras, '#e9e9e9', 0.022);

  const o = new THREE.Object3D();
  const hojas = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    for (let i = 0; i < 260; i++) {
      const a = Math.random() * 6.28, d = Math.pow(Math.random(), 0.6) * 110, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
      const l = 55 + Math.random() * 45; g.fillStyle = `hsl(0,0%,${l}%)`;
      g.save(); g.translate(x, y); g.rotate(Math.random() * 6.28); g.beginPath(); g.ellipse(0, 0, 5 + Math.random() * 7, 2.5 + Math.random() * 3, 0, 0, 7); g.fill(); g.restore();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  })();
  const corteza = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = '#5a4030'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 90; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(30,20,14,.5)' : 'rgba(140,110,85,.35)'; g.fillRect(Math.random() * 64, Math.random() * 256, 1 + Math.random() * 3, 20 + Math.random() * 60); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const ramaGeo = (() => {
    const partes = [new THREE.CylinderGeometry(0.13, 0.24, 3.2, 8).translate(0, 1.6, 0)];
    for (let k = 0; k < 4; k++) {
      const b = new THREE.CylinderGeometry(0.05, 0.1, 1.7, 6).translate(0, 0.85, 0);
      b.rotateZ(0.7 + Math.random() * 0.25); b.rotateY(k * 1.57 + Math.random() * 0.5); b.translate(0, 2.2 + k * 0.25, 0);
      partes.push(b);
    }
    return mergeGeometries(partes.map(g => g.toNonIndexed()));
  })();
  const copaGeo = (() => {
    const pos = [], nor = [], uv = [], q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), cen = new THREE.Vector3(0, 0, 0);
    for (let k = 0; k < 34; k++) {
      const u = Math.random() * 6.28, w = Math.acos(2 * Math.random() - 1), rr = Math.pow(Math.random(), 0.45);
      const px = Math.sin(w) * Math.cos(u) * 1.75 * rr, py = Math.cos(w) * 1.15 * rr, pz = Math.sin(w) * Math.sin(u) * 1.75 * rr;
      e.set(Math.random() * 3.14, Math.random() * 3.14, Math.random() * 3.14); q.setFromEuler(e);
      const t = 0.75 + Math.random() * 0.55;
      const esq = [[-t, -t, 0, 0], [t, -t, 1, 0], [t, t, 1, 1], [-t, -t, 0, 0], [t, t, 1, 1], [-t, t, 0, 1]];
      for (const [x, y, a, b] of esq) {
        v.set(x, y, 0).applyQuaternion(q).add(new THREE.Vector3(px, py, pz));
        pos.push(v.x, v.y, v.z); uv.push(a, b);
        const n = v.clone().sub(cen).normalize(); n.y += 0.35; n.normalize(); nor.push(n.x, n.y, n.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  })();
  const matCopa = new THREE.MeshStandardMaterial({ map: hojas, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
  matCopa.onBeforeCompile = sh => {
    sh.uniforms.tiempo = VIENTO;
    sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n  float fase = ip.x * 0.11 + ip.z * 0.07;\n  transformed.x += sin(tiempo * 1.3 + fase + position.y) * 0.06 * (position.y + 1.2);\n  transformed.z += cos(tiempo * 1.1 + fase) * 0.05 * (position.y + 1.2);');
  };
  const tronco = new THREE.InstancedMesh(ramaGeo, new THREE.MeshStandardMaterial({ map: corteza, roughness: 0.95 }), salida.arboles.length);
  const copa = new THREE.InstancedMesh(copaGeo, matCopa, salida.arboles.length);
  const copa2 = new THREE.InstancedMesh(copaGeo, matCopa, salida.arboles.length);
  copa.customDepthMaterial = copa2.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: hojas, alphaTest: 0.45 });
  const cMor = new THREE.Color('#8a62c4'), cVer = new THREE.Color('#5a8a44'), tmp = new THREE.Color();
  const morados = salida.arboles.filter(a => a.morado);
  const petalo = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: hojas, color: '#9a6ad0', transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), morados.length);
  let ip = 0;
  salida.arboles.forEach((a, i) => {
    const e = a.escala;
    o.position.set(a.x, 0, a.z); o.scale.set(e, e * (0.95 + r() * 0.2), e); o.rotation.set(0, r() * 6, 0); o.updateMatrix();
    tronco.setMatrixAt(i, o.matrix);
    o.position.set(a.x, 3.9 * e, a.z); o.scale.set(e * 1.2, e * 1.05, e * 1.2); o.rotation.set(0, r() * 6, 0); o.updateMatrix();
    copa.setMatrixAt(i, o.matrix);
    tmp.copy(a.morado ? cMor : cVer).offsetHSL((r() - 0.5) * 0.04, (r() - 0.5) * 0.1, (r() - 0.5) * 0.1);
    copa.setColorAt(i, tmp);
    const ang = r() * 6.28;
    o.position.set(a.x + Math.cos(ang) * 0.9 * e, 4.6 * e, a.z + Math.sin(ang) * 0.9 * e); o.scale.setScalar(e * 0.8); o.rotation.set(0, ang, 0); o.updateMatrix();
    copa2.setMatrixAt(i, o.matrix);
    tmp.offsetHSL(0.005, 0.04, 0.07); copa2.setColorAt(i, tmp);
    if (a.morado) { o.position.set(a.x + (r() - 0.5), 0.035, a.z + (r() - 0.5)); o.scale.setScalar(e * (2 + r())); o.rotation.set(0, r() * 6, 0); o.updateMatrix(); petalo.setMatrixAt(ip++, o.matrix); }
  });
  {
    const madera = new THREE.MeshStandardMaterial({ color: '#7a5434', roughness: 0.75 }), metal = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.5, metalness: 0.6 });
    const asiento = [], patas = [];
    for (const b of salida.bancas) {
      const m = new THREE.Matrix4().makeRotationY(b.yaw).setPosition(b.x, 0, b.z);
      for (const [w, h, d, y, z] of [[1.7, 0.05, 0.14, 0.46, 0.12], [1.7, 0.05, 0.14, 0.46, -0.05], [1.7, 0.05, 0.14, 0.46, -0.22], [1.7, 0.12, 0.04, 0.72, -0.31], [1.7, 0.12, 0.04, 0.88, -0.33]]) asiento.push(new THREE.BoxGeometry(w, h, d).translate(0, y, z).applyMatrix4(m));
      for (const sx of [-0.75, 0.75]) patas.push(new THREE.BoxGeometry(0.06, 0.46, 0.46).translate(sx, 0.23, -0.05).applyMatrix4(m), new THREE.BoxGeometry(0.05, 0.5, 0.05).translate(sx, 0.7, -0.32).applyMatrix4(m));
    }
    if (asiento.length) {
      const a = new THREE.Mesh(mergeGeometries(asiento), madera), p = new THREE.Mesh(mergeGeometries(patas), metal);
      a.castShadow = p.castShadow = true; a.receiveShadow = true; escena.add(a, p);
    }
  }
  tronco.castShadow = copa.castShadow = copa2.castShadow = true;
  copa.receiveShadow = copa2.receiveShadow = true;
  escena.add(tronco, copa, copa2, petalo);

  for (let i = 0; i <= BLOQUES; i++) for (let j = 0; j <= BLOQUES; j++) {
    const X = linea(i), Z = linea(j), d = CALLE / 2 + 0.6;
    for (const [sx, sz] of [[1, 1], [-1, -1]]) {
      const x = X + sx * d, z = Z + sz * d;
      if (Math.abs(x) > LIMITE || Math.abs(z) > LIMITE) continue;
      salida.farolas.push({ x, z, hx: X + sx * (d - 2.2), hz: Z + sz * (d - 2.2) });
      mundo.agregar(x - 0.15, z - 0.15, x + 0.15, z + 0.15, 7);
    }
  }
  const poste = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 7, 0.22), new THREE.MeshLambertMaterial({ color: '#30343a' }), salida.farolas.length);
  const brazo = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 2.6), new THREE.MeshLambertMaterial({ color: '#30343a' }), salida.farolas.length);
  const foco = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.18, 0.4), new THREE.MeshBasicMaterial({ color: '#fff3c4' }), salida.farolas.length);
  const suave = lienzo(128), gs = suave.getContext('2d');
  const gr = gs.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  gs.fillStyle = gr; gs.fillRect(0, 0, 128, 128);
  const texSuave = new THREE.CanvasTexture(suave);
  salida.texSuave = texSuave;
  const charco = new THREE.InstancedMesh(new THREE.PlaneGeometry(13, 13).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#ffc874', map: texSuave, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), salida.farolas.length);
  salida.farolas.forEach((f, i) => {
    o.rotation.set(0, 0, 0); o.scale.setScalar(1);
    o.position.set(f.x, 3.5, f.z); o.updateMatrix(); poste.setMatrixAt(i, o.matrix);
    const ang = Math.atan2(f.hx - f.x, f.hz - f.z);
    o.position.set((f.x + f.hx) / 2, 6.95, (f.z + f.hz) / 2); o.rotation.y = ang; o.updateMatrix(); brazo.setMatrixAt(i, o.matrix);
    o.position.set(f.hx, 6.85, f.hz); o.updateMatrix(); foco.setMatrixAt(i, o.matrix);
    o.rotation.set(0, 0, 0); o.position.set(f.hx, 0.06, f.hz); o.updateMatrix(); charco.setMatrixAt(i, o.matrix);
  });
  escena.add(poste, brazo, foco, charco);
  const brillos = new Float32Array(salida.farolas.length * 3);
  salida.farolas.forEach((f, i) => brillos.set([f.hx, 6.6, f.hz], i * 3));
  const gB = new THREE.BufferGeometry(); gB.setAttribute('position', new THREE.BufferAttribute(brillos, 3));
  salida.halos = new THREE.Points(gB, new THREE.PointsMaterial({ map: texSuave, color: '#ffc870', size: 3.2, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  escena.add(salida.halos);
  salida.charcoLuz = charco;
  salida.focoMat = foco.material;

  const cerros = new THREE.Group();
  const mc = new THREE.MeshLambertMaterial({ color: '#6f8a6a', fog: false, vertexColors: true });
  {
    const hsh = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
    const ruido = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hsh(xi, yi), b = hsh(xi + 1, yi), c = hsh(xi, yi + 1), d = hsh(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
    const fbm = (x, y) => { let t = 0, amp = 1, f = 1, n = 0; for (let k = 0; k < 6; k++) { const r2 = 1 - Math.abs(ruido(x * f, y * f) * 2 - 1); t += r2 * r2 * amp; n += amp; amp *= 0.5; f *= 2.1; } return t / n; };
    const g = new THREE.RingGeometry(660, 1300, 288, 40);
    g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, col = new Float32Array(P.count * 3), cc = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), rr = Math.hypot(x, z), t = (rr - 660) / 640;
      const env = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * (0.55 + 0.45 * ruido(Math.atan2(z, x) * 3.1 + 7, 2.3));
      const h = Math.pow(fbm(x / 260, z / 260), 1.6) * 260 * env + (t < 0.08 ? -6 : 0);
      P.setY(i, h - 4);
      const k = Math.min(1, h / 170);
      cc.set('#5f7a4a').lerp(new THREE.Color('#8a7a5a'), Math.min(1, k * 1.3)).lerp(new THREE.Color('#a89c86'), Math.max(0, k - 0.6) * 1.5);
      col.set([cc.r, cc.g, cc.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mc); m.frustumCulled = false; cerros.add(m);
  }
  {
    const n = 2400, geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 1.4); }
    const tx = FACH[ESTILO_FACH.casa].textura.clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    const br = FACH[ESTILO_FACH.casa].brillo?.clone(); if (br) { br.needsUpdate = true; br.wrapS = br.wrapT = THREE.RepeatWrapping; }
    const mat = new THREE.MeshLambertMaterial({ fog: true, map: tx, emissive: br ? '#ffd9a0' : '#000000', emissiveMap: br || null, emissiveIntensity: 0 });
    salida.manchaMat = mat;
    const im = new THREE.InstancedMesh(geo, mat, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), E = new THREE.Vector3(), cc = new THREE.Color();
    const tonos = ['#d8c8b0', '#c8b49a', '#e0d4c0', '#b89c84', '#d0a888', '#bcbcb4', '#e8dcc8', '#a8a49c', '#c89a7a', '#d8d0c0'];
    let k = 0;
    while (k < n) {
      const a = r() * Math.PI * 2, d = 440 + Math.pow(r(), 0.8) * 170, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.abs(x) < LIMITE + 30 && Math.abs(z) < LIMITE + 30) continue;
      const alto = r() < 0.03 ? 14 + r() * 26 : 3.5 + r() * 6.5, ancho = 7 + r() * 12;
      V.set(x, -0.5, z); E.set(ancho, alto, ancho * (0.6 + r() * 0.8)); Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.round(a * 4 / Math.PI) * Math.PI / 4 + (r() - 0.5) * 0.2);
      M.compose(V, Q, E); im.setMatrixAt(k, M); im.setColorAt(k, cc.set(tonos[r() * tonos.length | 0]).multiplyScalar(0.85 + r() * 0.2)); k++;
    }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false;
    cerros.add(im);
  }
  escena.add(cerros);
  salida.cerros = mc;
  return salida;
}
