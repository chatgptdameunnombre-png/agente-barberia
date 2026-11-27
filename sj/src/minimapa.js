import * as THREE from 'three';
import { LIMITE, linea, BLOQUES, CALLE } from './ciudad.js?v=20261126192148';
import { CALLES_X, CALLES_Z, zona, calle } from './gps.js?v=20261126192148';
import { dibujarGlifo } from './iconos.js?v=20261126192148';

export const ICONOS = {
  taller: { c: '#ffc94a', t: 'llave', n: 'Taller de Don Chuy' },
  pintura: { c: '#ff4f9a', t: 'chispa', n: 'Pintura Express' },
  armeria: { c: '#e2e6ee', t: 'mira', n: 'Armería del Valle' },
  gasolinera: { c: '#ffb020', t: 'gas', n: 'Gasolinera Jacaranda' },
  hospital: { c: '#ff5a6a', t: 'cruzroja', n: 'Hospital Civil' },
  comisaria: { c: '#4a9bff', t: 'escudo', n: 'Comisaría' },
  banco: { c: '#3bd16f', t: '$', n: 'Banco de Occidente' },
  mercado: { c: '#ff9a4a', t: 'bolsa', n: 'Mercado de San Jacinto' },
  tianguis: { c: '#e86fa8', t: 'carpa', n: 'El Tianguis' },
  estadio: { c: '#ff6b6b', t: 'balon', n: 'Estadio Jacaranda' },
  lago: { c: '#3fa8ff', t: 'ancla', n: 'Lago Azul · lanchas' },
  catedral: { c: '#f2c94c', t: 'cruz', n: 'Catedral' }
};

const COLOR = {
  fuera: '#1a2420', manzana: '#2b3142', edificio: '#3a4258', borde: '#4a5574', calle: '#3b4254', linea: '#7d6a3a',
  parque: '#2f6f4a', plaza: '#6b5f4b', agua: '#2f7fc0', taller: '#5a4a22', estadio: '#3a4a3a'
};
const W = LIMITE + 40;
const SUELO_ZONA = { torres: '#28324a', centro: '#35303f', barrio: '#2b3142', parque: '#2f6f4a', plaza: '#6b5f4b', catedral: '#6b5f4b', monumento: '#6b5f4b' };
const TECHO_ZONA = { torres: [86, 118, 168], centro: [150, 128, 112], barrio: [124, 116, 110] };

function base(juego, tam) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const g = c.getContext('2d');
  const k = tam / (W * 2), P = v => (v + W) * k;
  const C = juego.ciudad, L = C.lugares;
  if (!g.roundRect) g.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  g.fillStyle = COLOR.fuera; g.fillRect(0, 0, tam, tam);
  let sm = 99;
  const az = () => { sm = (sm * 16807) % 2147483647; return (sm - 1) / 2147483646; };
  for (let i = 0; i < 700; i++) { g.fillStyle = az() < 0.5 ? 'rgba(90,150,95,.07)' : 'rgba(0,0,0,.09)'; g.beginPath(); g.ellipse(az() * tam, az() * tam, 6 + az() * 26, 4 + az() * 14, az() * 3, 0, 7); g.fill(); }
  g.fillStyle = '#10141c'; g.fillRect(P(-LIMITE) - 3, P(-LIMITE) - 3, LIMITE * 2 * k + 6, LIMITE * 2 * k + 6);
  g.fillStyle = COLOR.calle; g.fillRect(P(-LIMITE), P(-LIMITE), LIMITE * 2 * k, LIMITE * 2 * k);
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = Math.max(1, k * 0.35); g.setLineDash([5 * k, 5 * k]);
  for (let i = 0; i <= BLOQUES; i++) {
    g.beginPath(); g.moveTo(P(linea(i)), P(-LIMITE)); g.lineTo(P(linea(i)), P(LIMITE)); g.stroke();
    g.beginPath(); g.moveTo(P(-LIMITE), P(linea(i))); g.lineTo(P(LIMITE), P(linea(i))); g.stroke();
  }
  g.setLineDash([]);
  const tipoEn = (x, z) => { for (const b of C.bloques) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) return b.tipo; return null; };
  for (const b of C.bloques) {
    const x = P(b.x0), y = P(b.z0), w = (b.x1 - b.x0) * k, h = (b.z1 - b.z0) * k, r = 2.2 * k;
    g.fillStyle = '#5d667c'; g.beginPath(); g.roundRect(x - 1.1 * k, y - 1.1 * k, w + 2.2 * k, h + 2.2 * k, r + k); g.fill();
    g.fillStyle = SUELO_ZONA[b.tipo] || COLOR.manzana; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    if (b.tipo === 'parque') { g.strokeStyle = 'rgba(232,224,200,.5)'; g.lineWidth = 1.6 * k; g.beginPath(); g.moveTo(x + 4 * k, y + 4 * k); g.lineTo(x + w - 4 * k, y + h - 4 * k); g.moveTo(x + w - 4 * k, y + 4 * k); g.lineTo(x + 4 * k, y + h - 4 * k); g.stroke(); }
  }
  if (C.lago) { const A = C.lago, x = P(A.x0), y = P(A.z0), w = (A.x1 - A.x0) * k, h = (A.z1 - A.z0) * k; g.fillStyle = '#8fc6ee'; g.beginPath(); g.roundRect(x - k, y - k, w + 2 * k, h + 2 * k, 5 * k); g.fill(); const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#3a94d8'); gr.addColorStop(1, '#2468ac'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 4 * k); g.fill(); if (A.muelle) { g.fillStyle = '#a8814e'; g.fillRect(P(A.muelle.x) - 1.5 * k, P(A.muelle.z0), 3 * k, (A.muelle.z1 - A.muelle.z0) * k); } }
  const marca = {};
  for (const n in ICONOS) if (L[n]) marca[n] = L[n];
  const acento = (cx, cz) => { let m = null, md = 34; for (const n in marca) { const d = Math.hypot(marca[n].x - cx, marca[n].z - cz); if (d < md) { md = d; m = n; } } return m; };
  const cajas = juego.mundo.cajas.filter(cj => { const w = cj.maxx - cj.minx, d = cj.maxz - cj.minz; return !cj.agua && w * d >= 8 && cj.h >= 2 && w <= 200 && d <= 200 && Math.abs((cj.minx + cj.maxx) / 2) < LIMITE && Math.abs((cj.minz + cj.maxz) / 2) < LIMITE; }).sort((a, b) => a.h - b.h);
  for (const cj of cajas) {
    const w = cj.maxx - cj.minx, d = cj.maxz - cj.minz, cx = (cj.minx + cj.maxx) / 2, cz = (cj.minz + cj.maxz) / 2;
    const zona = tipoEn(cx, cz) || 'barrio', alto = Math.min(1, cj.h / 80), x = P(cj.minx), y = P(cj.minz), ww = w * k, hh = d * k, so = Math.min(5, 0.8 + cj.h * 0.06) * k;
    let col = TECHO_ZONA[zona] || TECHO_ZONA.barrio;
    const n = w * d > 60 && cj.h > 5 ? acento(cx, cz) : null;
    if (n) { const t = new THREE.Color(ICONOS[n].c); col = [t.r * 255 * 0.62 + 50, t.g * 255 * 0.62 + 50, t.b * 255 * 0.62 + 50]; }
    const lum = 0.86 + alto * 0.5 + (az() - 0.5) * 0.12;
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x + so, y + so, ww, hh);
    g.fillStyle = `rgb(${Math.min(255, col[0] * lum) | 0},${Math.min(255, col[1] * lum) | 0},${Math.min(255, col[2] * lum) | 0})`; g.fillRect(x, y, ww, hh);
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x, y, ww, Math.max(1, 0.5 * k)); g.fillRect(x, y, Math.max(1, 0.5 * k), hh);
  }
  for (const a of C.arboles) {
    g.fillStyle = a.morado ? 'rgba(176,128,236,.8)' : 'rgba(86,170,104,.78)';
    g.beginPath(); g.arc(P(a.x), P(a.z), Math.max(1.2, 1.7 * a.escala * k), 0, 7); g.fill();
  }
  if (L.monumento) { g.fillStyle = '#8fc6ee'; g.beginPath(); g.arc(P(L.monumento.x), P(L.monumento.z), 11.5 * k, 0, 7); g.fill(); g.fillStyle = COLOR.agua; g.beginPath(); g.arc(P(L.monumento.x), P(L.monumento.z), 10.3 * k, 0, 7); g.fill(); g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(P(L.monumento.x), P(L.monumento.z), 2.2 * k, 0, 7); g.fill(); }
  const T = juego.tren;
  if (T && T.X !== undefined) {
    g.strokeStyle = 'rgba(20,14,34,.7)'; g.lineWidth = 4.4 * k; g.beginPath(); g.moveTo(P(T.X), P(-LIMITE)); g.lineTo(P(T.X), P(LIMITE)); g.stroke();
    g.strokeStyle = '#b07ae8'; g.lineWidth = 2.2 * k; g.setLineDash([6 * k, 3 * k]); g.beginPath(); g.moveTo(P(T.X), P(-LIMITE)); g.lineTo(P(T.X), P(LIMITE)); g.stroke(); g.setLineDash([]);
    for (const e of T.estaciones || []) { g.fillStyle = '#fff'; g.beginPath(); g.arc(P(T.X), P(e.z), 3.4 * k, 0, 7); g.fill(); g.fillStyle = '#9a5ad8'; g.beginPath(); g.arc(P(T.X), P(e.z), 2.2 * k, 0, 7); g.fill(); }
  }
  return { c, k, P };
}

const _col = new THREE.Color();
function tonos(hex) {
  _col.set(hex); const r = _col.r, gg = _col.g, b = _col.b, lum = 0.3 * r + 0.59 * gg + 0.11 * b;
  const f = (v, t) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v + (t > 0 ? (1 - v) * t : v * t))), 1 / 2.2));
  return { claro: `rgb(${f(r, 0.3)},${f(gg, 0.3)},${f(b, 0.3)})`, oscuro: `rgb(${f(r, -0.28)},${f(gg, -0.28)},${f(b, -0.28)})`, tinta: lum > 0.36 ? '#14121d' : '#ffffff' };
}
const TONOS = {};

const SELLOS = new Map();
function trazarIcono(g, x, y, ic, r = 13) {
  const clave = ic.c + '|' + ic.t + '|' + r;
  let s = SELLOS.get(clave);
  if (!s) {
    const lado = Math.ceil((r + 9) * 2), esc = 2;
    s = document.createElement('canvas'); s.width = s.height = lado * esc; s.lado = lado;
    const h = s.getContext('2d'); h.scale(esc, esc); pintarIcono(h, lado / 2, lado / 2 - 1, ic, r);
    SELLOS.set(clave, s);
  }
  g.drawImage(s, x - s.lado / 2, y - s.lado / 2 + 1, s.lado, s.lado);
}

function pintarIcono(g, x, y, ic, r = 13) {
  const T = TONOS[ic.c] || (TONOS[ic.c] = tonos(ic.c || '#ffffff'));
  g.save();
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 7; g.shadowOffsetY = 2;
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(x, y, r + 2, 0, 7); g.fill();
  g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  const gr = g.createLinearGradient(x, y - r, x, y + r); gr.addColorStop(0, T.claro); gr.addColorStop(1, T.oscuro);
  g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  dibujarGlifo(g, ic.t, x, y, r * 1.18, T.tinta);
  g.restore();
}

function pin(g, x, y, color, t) {
  g.save();
  g.translate(x, y);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8;
  g.fillStyle = color;
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-12, -14, -11, -30, 0, -30); g.bezierCurveTo(11, -30, 12, -14, 0, 0); g.fill();
  g.shadowBlur = 0;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -19, 5, 0, 7); g.fill();
  g.restore();
}

export class Minimapa {
  constructor(juego, lienzo, grande) {
    this.j = juego;
    this.lienzo = lienzo; this.g = lienzo.getContext('2d');
    this.grande = grande; this.gg = grande.getContext('2d');
    const b = base(juego, 2048);
    this.baseVec = b.c; this.base = b.c; this.k = b.k; this.P = b.P; this.modoSat = false;
    this.centro = { x: 0, z: 0 }; this.zoom = 1;
    this.arrastre = null;
    this.raton = null;
    this.eventos();
  }

  satelite() {
    const j = this.j, R = j.renderer, A = j.ambiente, E = j.escena;
    const tam = 2048, n = 4, sub = tam / n, lado = W * 2 / n;
    const c = document.createElement('canvas'); c.width = c.height = tam;
    const g = c.getContext('2d');
    const antes = R.getSize(new THREE.Vector2()), pr = R.getPixelRatio();
    const ocultar = [A.cielo, A.estrellas, A.gotas, j.gps.flechas, j.gps.haz, j.gps.trazoG, j.jugador.grupo, ...(j.decoracion?.nubes || []), ...j.coches.map(k => k.grupo), ...j.peatones.map(k => k.grupo), ...j.misiones.marcadores.map(k => k.g)].filter(Boolean);
    const vis = ocultar.map(o => o.visible);
    const niebla = [A.niebla.near, A.niebla.far], hora = A.hora, lluvia = A.lluvia, expo = R.toneMappingExposure;
    const sc = A.sol.shadow.camera, caja = [sc.left, sc.right, sc.top, sc.bottom, sc.far];
    try {
      ocultar.forEach(o => o.visible = false);
      A.hora = 9.6; A.lluvia = 0; A.actualizar(0, null);
      R.toneMappingExposure = expo * 0.8;
      A.niebla.near = 1e5; A.niebla.far = 2e5;
      sc.left = -lado * 0.62; sc.right = lado * 0.62; sc.top = lado * 0.62; sc.bottom = -lado * 0.62; sc.far = 900; sc.updateProjectionMatrix();
      const dir = A.sol.position.clone().sub(A.sol.target.position).normalize();
      const cam = new THREE.OrthographicCamera(-lado / 2, lado / 2, lado / 2, -lado / 2, 1, 1400);
      cam.up.set(0, 0, -1);
      R.setPixelRatio(1); R.setSize(sub, sub, false);
      for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) {
        const cx = -W + (tx + 0.5) * lado, cz = -W + (ty + 0.5) * lado;
        A.sol.target.position.set(cx, 0, cz); A.sol.position.set(cx + dir.x * 400, dir.y * 400, cz + dir.z * 400);
        A.sol.target.updateMatrixWorld(); A.sol.updateMatrixWorld();
        cam.position.set(cx, 700, cz); cam.lookAt(cx, 0, cz); cam.updateMatrixWorld();
        R.render(E, cam);
        g.drawImage(R.domElement, 0, 0, sub, sub, tx * sub, ty * sub, sub, sub);
      }
    } finally {
      R.setPixelRatio(pr); R.setSize(antes.x, antes.y, false); R.toneMappingExposure = expo;
      sc.left = caja[0]; sc.right = caja[1]; sc.top = caja[2]; sc.bottom = caja[3]; sc.far = caja[4]; sc.updateProjectionMatrix();
      A.hora = hora; A.lluvia = lluvia; A.niebla.near = niebla[0]; A.niebla.far = niebla[1];
      ocultar.forEach((o, k) => o.visible = vis[k]);
      A.actualizar(0, j.camara);
    }
    const f = document.createElement('canvas'); f.width = f.height = tam;
    const h = f.getContext('2d');
    h.filter = 'saturate(1.18) contrast(1.1) brightness(0.95)';
    h.drawImage(c, 0, 0);
    h.filter = 'none';
    const k = tam / (W * 2), P = v => (v + W) * k;
    h.save();
    h.beginPath(); h.rect(0, 0, tam, tam); h.rect(P(-LIMITE - 4), P(-LIMITE - 4), (LIMITE * 2 + 8) * k, (LIMITE * 2 + 8) * k); h.clip('evenodd');
    h.fillStyle = 'rgba(14,22,16,.35)'; h.fillRect(0, 0, tam, tam);
    for (let i = 0; i < 1400; i++) { h.fillStyle = Math.random() < 0.5 ? 'rgba(120,150,80,.10)' : 'rgba(30,40,20,.14)'; h.beginPath(); h.ellipse(Math.random() * tam, Math.random() * tam, 4 + Math.random() * 26, 3 + Math.random() * 14, Math.random() * 3, 0, 7); h.fill(); }
    h.restore();
    h.strokeStyle = 'rgba(0,0,0,.35)'; h.lineWidth = 6; h.strokeRect(P(-LIMITE - 4), P(-LIMITE - 4), (LIMITE * 2 + 8) * k, (LIMITE * 2 + 8) * k);
    this.baseSat = f; this.sateliteListo = true; if (this.modoSat) this.base = f;
    return f;
  }

  vista(sat) {
    this.modoSat = !!sat;
    if (this.modoSat && !this.baseSat) { try { this.satelite(); } catch (e) { console.warn('satelite', e); this.modoSat = false; } }
    this.base = this.modoSat && this.baseSat ? this.baseSat : this.baseVec;
  }

  rehacer() { const b = base(this.j, 2048); this.baseVec = b.c; if (!this.modoSat) this.base = b.c; }

  blips() {
    const j = this.j, l = [];
    for (const k in ICONOS) { const p = j.ciudad.lugares[k]; if (p) l.push({ x: p.x, z: p.z, tipo: 'icono', ic: ICONOS[k] }); }
    for (const c of j.policia.unidades) if (!c.quemado) l.push({ x: c.pos.x, z: c.pos.z, tipo: 'poli' });
    for (const a of j.policia.agentes) if (!a.muerto) l.push({ x: a.pos.x, z: a.pos.z, tipo: 'poliPie' });
    for (const p of j.peatones) if ((p.tipo === 'matón' || p.objetivoMision) && !p.muerto) l.push({ x: p.pos.x, z: p.pos.z, tipo: 'enemigo' });
    for (const m of j.misiones.marcasMapa()) l.push(m);
    for (const m of j.actividades?.marcasMapa() || []) l.push(m);
    for (const m of j.interiores?.marcasMapa() || []) l.push(m);
    for (const m of j.eventos?.marcasMapa() || []) l.push(m);
    for (const m of j.economia?.marcasMapa() || []) l.push(m);
    for (const m of j.trabajos?.marcasMapa() || []) l.push(m);
    for (const m of j.aleatorios?.marcasMapa() || []) l.push(m);
    for (const m of j.tren?.marcasMapa() || []) l.push(m);
    for (const m of j.placazos?.marcasMapa() || []) l.push(m);
    for (const m of j.pesca?.marcasMapa() || []) l.push(m);
    for (const m of j.lavado?.marcasMapa() || []) l.push(m);
    for (const m of j.encargos?.marcasMapa() || []) l.push(m);
    for (const m of j.vuelo?.marcasMapa() || []) l.push(m);
    for (const m of j.aeropuerto?.marcasMapa() || []) l.push(m);
    for (const m of j.territorio?.marcasMapa() || []) l.push(m);
    for (const m of j.negociosVivos?.marcasMapa() || []) l.push(m);
    if (j.duo && !j.jugador.coche) l.push({ x: j.duo.pos.x, z: j.duo.pos.z, tipo: 'aliado' });
    const d = j.gps.destino;
    if (d) l.push({ x: d.x, z: d.z, tipo: 'pin', color: '#b46bff' });
    return l;
  }

  dibujar(camYaw) {
    const g = this.g, Wc = this.lienzo.width, j = this.j;
    const p = j.jugador.posicion;
    const vel = j.jugador.coche ? Math.min(1, j.jugador.coche.vel / 35) : 0;
    const metros = 95 + vel * 70;
    const s = (Wc / 2) / metros;
    g.save();
    g.clearRect(0, 0, Wc, Wc);
    g.beginPath(); g.arc(Wc / 2, Wc / 2, Wc / 2, 0, 7); g.clip();
    g.fillStyle = COLOR.fuera; g.fillRect(0, 0, Wc, Wc);
    g.translate(Wc / 2, Wc / 2 + Wc * 0.12);
    g.rotate(camYaw + Math.PI);
    g.scale(s / this.k, s / this.k);
    g.translate(-this.P(p.x), -this.P(p.z));
    g.drawImage(this.base, 0, 0);
    j.sierra?.dibujarMapa(g, (x, z) => [this.P(x), this.P(z)], 5 * this.k);
    for (const z of j.territorio?.zonasMapa() || []) { g.fillStyle = z.color + '33'; g.fillRect(this.P(z.x0), this.P(z.z0), this.P(z.x1) - this.P(z.x0), this.P(z.z1) - this.P(z.z0)); }
    const r = j.gps.ruta;
    if (r) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 9 * this.k / s * 1.0;
      this.linea(g, r.puntos); g.stroke();
      g.strokeStyle = j.gps.color; g.lineWidth = 6 * this.k / s;
      this.linea(g, r.puntos); g.stroke();
    }
    g.restore();
    const a = camYaw + Math.PI, ca = Math.cos(a), sa = Math.sin(a);
    const R = Wc / 2 - 18;
    const pol = j.policia;
    if (pol.estrellas > 0) {
      if (pol.visto || !this.buscado) this.buscado = { x: p.x, z: p.z };
      const t = performance.now() / 1000;
      const radio = (40 + pol.estrellas * 18) * s * (pol.visto ? 0.6 : 1);
      const bx = (this.buscado.x - p.x) * s, bz = (this.buscado.z - p.z) * s;
      const x = Wc / 2 + bx * ca - bz * sa, y = Wc / 2 + bx * sa + bz * ca + Wc * 0.12;
      g.save(); g.beginPath(); g.arc(Wc / 2, Wc / 2, Wc / 2, 0, 7); g.clip();
      g.fillStyle = (t * 2.5 | 0) % 2 ? 'rgba(255,40,70,.22)' : 'rgba(40,110,255,.22)';
      g.strokeStyle = (t * 2.5 | 0) % 2 ? 'rgba(255,60,90,.8)' : 'rgba(60,130,255,.8)'; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, radio, 0, 7); g.fill(); g.stroke();
      g.restore();
    } else this.buscado = null;
    const oy = Wc * 0.12;
    for (const m of this.blips()) {
      const dx = (m.x - p.x) * s, dz = (m.z - p.z) * s;
      let x = dx * ca - dz * sa, y = dx * sa + dz * ca + oy;
      const d = Math.hypot(x, y);
      const fuera = d > R;
      if (fuera) { if (!['objetivo', 'icono', 'pin'].includes(m.tipo)) continue; if (m.tipo === 'icono' && d > R * 1.6) continue; x *= R / d; y *= R / d; }
      this.blip(g, Wc / 2 + x, Wc / 2 + y, m, fuera);
    }
    g.save();
    g.translate(Wc / 2, Wc / 2 + oy);
    const yawJ = j.jugador.coche ? j.jugador.coche.yaw : j.jugador.yaw;
    g.rotate(-(yawJ - camYaw));
    g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 6;
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, -17); g.lineTo(12, 13); g.lineTo(0, 6); g.lineTo(-12, 13); g.closePath(); g.fill();
    g.restore();
    g.save();
    g.translate(Wc / 2, Wc / 2);
    const npx = 0 * ca - (-(Wc / 2 - 16)) * sa, npy = 0 * sa + (-(Wc / 2 - 16)) * ca;
    g.fillStyle = '#12151f'; g.beginPath(); g.arc(npx, npy, 15, 0, 7); g.fill();
    g.fillStyle = '#ff4f9a'; g.font = '800 18px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('N', npx, npy + 1);
    g.restore();
  }

  linea(g, pts) {
    g.beginPath();
    pts.forEach((q, i) => { const x = this.P(q[0]), y = this.P(q[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
  }

  blip(g, x, y, m, fuera) {
    const t = performance.now() / 1000;
    if (m.tipo === 'poli' || m.tipo === 'poliPie') {
      g.fillStyle = (t * 4 | 0) % 2 ? '#ff2a4a' : '#2a6cff';
      g.beginPath(); g.arc(x, y, m.tipo === 'poli' ? 9 : 6, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    } else if (m.tipo === 'enemigo') {
      g.fillStyle = '#ff3b3b'; g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.stroke();
    } else if (m.tipo === 'objetivo') {
      const r = 11 + Math.sin(t * 6) * 2;
      g.save(); g.shadowColor = m.color || '#ffc94a'; g.shadowBlur = 12;
      g.fillStyle = m.color || '#ffc94a'; g.strokeStyle = '#12151f'; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); g.restore();
      if (m.texto) dibujarGlifo(g, m.texto, x, y, 15, '#12151f');
    } else if (m.tipo === 'icono') {
      g.globalAlpha = fuera ? 0.75 : 1;
      trazarIcono(g, x, y, m.ic, fuera ? 11 : 13);
      g.globalAlpha = 1;
    } else if (m.tipo === 'pin') {
      pin(g, x, y + (fuera ? 12 : 0), m.color);
    } else if (m.tipo === 'aliado') {
      g.fillStyle = '#4fe08a'; g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.stroke();
    } else if (m.tipo === 'flor') {
      g.fillStyle = '#d9a8ff'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
    } else if (m.tipo === 'actividad') {
      trazarIcono(g, x, y, { c: m.color, t: m.texto }, 11);
    }
  }

  eventos() {
    const c = this.grande;
    c.addEventListener('mousedown', e => { if (e.button === 0) this.arrastre = { x: e.clientX, y: e.clientY, cx: this.centro.x, cz: this.centro.z, movio: false }; });
    addEventListener('mousemove', e => {
      this.raton = { x: e.clientX, y: e.clientY };
      if (!this.arrastre || !this.abierto) return;
      const dx = e.clientX - this.arrastre.x, dy = e.clientY - this.arrastre.y;
      if (Math.hypot(dx, dy) > 4) this.arrastre.movio = true;
      this.centro.x = this.arrastre.cx - dx / this.zoom; this.centro.z = this.arrastre.cz - dy / this.zoom;
      this.limitar();
    });
    addEventListener('mouseup', e => {
      if (!this.abierto || e.button !== 0 || !this.arrastre) return;
      const a = this.arrastre; this.arrastre = null;
      if (a.movio) return;
      const w = this.aMundo(e.clientX, e.clientY);
      const d = this.j.gps.destino;
      if (d && Math.hypot(d.x - w.x, d.z - w.z) * this.zoom < 22) { this.j.gps.quitar(); this.j.audio?.tono?.(440, 0.08, 0.1, 'sine'); }
      else this.j.gps.marcar(w.x, w.z);
    });
    c.addEventListener('contextmenu', e => { e.preventDefault(); if (this.abierto) this.j.gps.quitar(); });
    c.addEventListener('wheel', e => {
      if (!this.abierto) return;
      e.preventDefault();
      this.zoomMeta = Math.max(this.zoomMin, Math.min(9, (this.zoomMeta || this.zoom) * Math.pow(0.9985, e.deltaY)));
      this.ancla = { x: e.clientX, y: e.clientY };
    }, { passive: false });
    c.addEventListener('dblclick', e => { if (!this.abierto) return; this.zoomMeta = Math.min(9, (this.zoomMeta || this.zoom) * 1.8); this.ancla = { x: e.clientX, y: e.clientY }; });
    addEventListener('keydown', e => { if (this.abierto && e.code === 'KeyC') { const p = this.j.jugador.posicion; this.volar = { x: p.x, z: p.z }; } });
    document.querySelector('#mapa .zoom')?.addEventListener('click', e => {
      const b = e.target.closest('[data-z]'); if (!b || !this.abierto) return;
      if (b.dataset.z === 'centro') { const p = this.j.jugador.posicion; this.volar = { x: p.x, z: p.z }; }
      else if (b.dataset.z === 'capa') { this.vista(!this.modoSat); b.classList.toggle('on', this.modoSat); }
      else { this.zoomMeta = Math.max(this.zoomMin, Math.min(9, (this.zoomMeta || this.zoom) * (b.dataset.z === 'mas' ? 1.6 : 1 / 1.6))); this.ancla = { x: innerWidth / 2, y: innerHeight / 2 }; }
      this.j.audio?.ui?.(760);
    });
  }

  limitar() {
    this.centro.x = Math.max(-W, Math.min(W, this.centro.x));
    this.centro.z = Math.max(-W, Math.min(W, this.centro.z));
  }

  aMundo(sx, sy) {
    const r = this.grande.getBoundingClientRect();
    return { x: this.centro.x + (sx - r.left - r.width / 2) / this.zoom, z: this.centro.z + (sy - r.top - r.height / 2) / this.zoom };
  }

  abrir() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.grande.width = innerWidth * dpr; this.grande.height = innerHeight * dpr;
    this.dpr = dpr;
    const p = this.j.jugador.posicion;
    this.centro = { x: p.x, z: p.z };
    this.zoomMin = Math.min(innerWidth, innerHeight) / (W * 2.1);
    this.zoom = Math.max(this.zoomMin, Math.min(innerWidth, innerHeight) / 420);
    this.zoomMeta = this.zoom; this.volar = null;
    this.abierto = true;
  }
  cerrar() { this.abierto = false; this.arrastre = null; }

  suavizar() {
    if (this.zoomMeta && Math.abs(this.zoomMeta - this.zoom) > 0.0005) {
      const a = this.ancla || { x: innerWidth / 2, y: innerHeight / 2 };
      const antes = this.aMundo(a.x, a.y);
      this.zoom += (this.zoomMeta - this.zoom) * 0.22;
      const despues = this.aMundo(a.x, a.y);
      this.centro.x += antes.x - despues.x; this.centro.z += antes.z - despues.z;
      this.limitar();
    }
    if (this.volar) {
      this.centro.x += (this.volar.x - this.centro.x) * 0.16; this.centro.z += (this.volar.z - this.centro.z) * 0.16;
      if (Math.hypot(this.volar.x - this.centro.x, this.volar.z - this.centro.z) < 0.5) this.volar = null;
    }
  }

  dibujarGrande() {
    const g = this.gg, j = this.j, dpr = this.dpr || 1;
    this.suavizar();
    const Wd = this.grande.width / dpr, Hd = this.grande.height / dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = COLOR.fuera; g.fillRect(0, 0, Wd, Hd);
    const S = (x, z) => [Wd / 2 + (x - this.centro.x) * this.zoom, Hd / 2 + (z - this.centro.z) * this.zoom];
    const [ox, oy] = S(-W, -W);
    g.imageSmoothingEnabled = true;
    g.drawImage(this.base, ox, oy, W * 2 * this.zoom, W * 2 * this.zoom);
    if (this.modoSat) { g.fillStyle = 'rgba(10,12,22,.26)'; g.fillRect(ox, oy, W * 2 * this.zoom, W * 2 * this.zoom); }
    j.sierra?.dibujarMapa(g, S, Math.max(3, 7 * this.zoom));
    for (const z of j.territorio?.zonasMapa() || []) { const [x0, y0] = S(z.x0, z.z0), [x1, y1] = S(z.x1, z.z1); g.fillStyle = z.color + (z.ataque ? '66' : '30'); g.fillRect(x0, y0, x1 - x0, y1 - y0); g.strokeStyle = z.color + 'aa'; g.lineWidth = z.ataque ? 3 : 1.5; g.strokeRect(x0, y0, x1 - x0, y1 - y0); if (this.zoom > 1.6) { g.font = '800 11px Inter'; g.textAlign = 'center'; g.fillStyle = '#ffffffcc'; g.fillText(z.nombre, (x0 + x1) / 2, (y0 + y1) / 2 - 7); g.fillStyle = z.color; g.fillText(z.banda, (x0 + x1) / 2, (y0 + y1) / 2 + 8); } }
    const r = j.gps.ruta;
    if (r) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); r.puntos.forEach((q, i) => { const [x, y] = S(q[0], q[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 10; g.stroke();
      g.save(); g.shadowColor = j.gps.color; g.shadowBlur = 14; g.strokeStyle = j.gps.color; g.lineWidth = 5.5; g.stroke(); g.restore();
      g.setLineDash([2, 14]); g.lineDashOffset = -performance.now() / 40; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.5; g.stroke(); g.setLineDash([]);
      for (const q of j.gps.trazoPts || []) { const [x, y] = S(q.x, q.z); g.fillStyle = '#0a0e18'; g.strokeStyle = j.gps.color; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = '900 11px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(q.n, x, y + 1); }
    }
    if (this.zoom > 1.45) {
      g.font = `700 ${Math.round(Math.min(12, 8.5 + this.zoom * 0.8))}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = 'rgba(10,12,20,.8)'; g.fillStyle = 'rgba(236,240,248,.88)';
      if ('letterSpacing' in g) g.letterSpacing = '1.2px';
      const paso = this.zoom > 2.6 ? 1 : this.zoom > 1.9 ? 2 : 4;
      for (let i = 0; i <= BLOQUES; i++) for (let jj = 0; jj < BLOQUES; jj += paso) {
        const [x, y] = S(linea(i), linea(jj) + 40);
        g.save(); g.translate(x, y); g.rotate(Math.PI / 2); g.strokeText(CALLES_X[i].toUpperCase(), 0, 0); g.fillText(CALLES_X[i].toUpperCase(), 0, 0); g.restore();
        const [x2, y2] = S(linea(jj) + 40, linea(i));
        g.strokeText(CALLES_Z[i].toUpperCase(), x2, y2); g.fillText(CALLES_Z[i].toUpperCase(), x2, y2);
      }
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    }
    const zonas = [['CENTRO HISTÓRICO', 0, 0], ['DISTRITO FINANCIERO', 205, -230], ['COLONIA AGAVE', -200, -150], ['COLONIA LOS ARCOS', 120, -60], ['BARRIO DEL TIANGUIS', -200, 200], ['LAS JACARANDAS', 200, 180]];
    const tz = Math.round(Math.max(11, Math.min(17, 8 + this.zoom * 3.4)));
    g.font = `800 ${tz}px Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = Math.round(tz * 0.42) + 'px';
    g.globalAlpha = this.zoom > 3 ? 0.28 : this.zoom > 2 ? 0.55 : 0.86;
    for (const [n, x, z] of zonas) {
      const [sx, sy] = S(x, z);
      g.save(); g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 8; g.lineWidth = 3.5; g.strokeStyle = 'rgba(8,10,16,.75)'; g.strokeText(n, sx, sy); g.restore();
      g.fillStyle = '#ffffff'; g.fillText(n, sx, sy);
    }
    g.globalAlpha = 1;
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    let cerca = null, dc = 18;
    for (const m of this.blips()) {
      if (this.ocultos?.size && (this.ocultos.has(m.ic?.t) || this.ocultos.has(m.texto))) continue;
      const [x, y] = S(m.x, m.z); this.blip(g, x, y, m, false);
      if (this.raton && !this.arrastre) { const d = Math.hypot(this.raton.x - x, this.raton.y - y); const nombre = m.ic?.n || m.nombre; if (d < dc && nombre) { dc = d; cerca = { x, y, n: nombre, c: m.ic?.c || m.color || '#fff' }; } }
    }
    this.tooltip = cerca;
    const p = j.jugador.posicion;
    const [px, py] = S(p.x, p.z);
    const yaw = j.jugador.coche ? j.jugador.coche.yaw : j.jugador.yaw;
    const t = performance.now() / 1000;
    g.save(); g.translate(px, py);
    const pul = (t * 0.7) % 1;
    g.strokeStyle = `rgba(122,224,255,${(1 - pul) * 0.7})`; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 12 + pul * 26, 0, 7); g.stroke();
    g.fillStyle = 'rgba(122,224,255,.2)'; g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill();
    g.rotate(-yaw + Math.PI);
    g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = 8;
    g.beginPath(); g.moveTo(0, -17); g.lineTo(12, 13); g.lineTo(0, 6.5); g.lineTo(-12, 13); g.closePath();
    g.fillStyle = '#ffffff'; g.fill(); g.shadowBlur = 0; g.lineJoin = 'round'; g.strokeStyle = '#10131c'; g.lineWidth = 2; g.stroke();
    g.restore();
    if (this.raton && !this.arrastre) {
      const w = this.aMundo(this.raton.x, this.raton.y);
      const [cx, cy] = S(w.x, w.z);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(cx, cy, 10, 0, 7); g.moveTo(cx - 16, cy); g.lineTo(cx - 6, cy); g.moveTo(cx + 6, cy); g.lineTo(cx + 16, cy); g.moveTo(cx, cy - 16); g.lineTo(cx, cy - 6); g.moveTo(cx, cy + 6); g.lineTo(cx, cy + 16); g.stroke();
      const info = document.getElementById('mapaInfo');
      const texto = (calle(w.x, w.z) || 'Afuera de la ciudad') + ' · ' + zona(j.ciudad, w.x, w.z);
      if (info.textContent !== texto) info.textContent = texto;
    }
    if (this.tooltip) {
      const T = this.tooltip; g.font = '800 13px Inter'; const w = g.measureText(T.n).width + 22;
      const tx = Math.min(Wd - w - 8, T.x + 16), ty = T.y - 34;
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 12; g.fillStyle = 'rgba(14,16,24,.92)';
      g.beginPath(); g.roundRect ? g.roundRect(tx, ty, w, 26, 8) : g.rect(tx, ty, w, 26); g.fill(); g.restore();
      g.fillStyle = T.c; g.fillRect(tx, ty + 6, 3, 14);
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(T.n, tx + 12, ty + 13.5);
    }
    {
      const metros = [25, 50, 100, 200, 500].find(m => m * this.zoom > 70) || 500, px = metros * this.zoom;
      const bx = Wd - px - 34, by = Hd - 40;
      g.save(); g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 6;
      g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx, by - 6); g.lineTo(bx, by); g.lineTo(bx + px, by); g.lineTo(bx + px, by - 6); g.stroke();
      g.fillStyle = '#fff'; g.font = '800 12px Inter'; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(metros + ' m', bx + px / 2, by - 6);
      const nx = Wd - 52, ny = 56;
      g.fillStyle = 'rgba(14,16,24,.85)'; g.beginPath(); g.arc(nx, ny, 22, 0, 7); g.fill(); g.restore();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(nx, ny, 22, 0, 7); g.stroke();
      g.fillStyle = '#ff4f6a'; g.beginPath(); g.moveTo(nx, ny - 16); g.lineTo(nx + 6, ny); g.lineTo(nx - 6, ny); g.fill();
      g.fillStyle = '#e8ecf4'; g.beginPath(); g.moveTo(nx, ny + 16); g.lineTo(nx + 6, ny); g.lineTo(nx - 6, ny); g.fill();
      g.fillStyle = '#fff'; g.font = '900 10px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', nx, ny - 30);
    }
    if (j.gps.destino) {
      const [dx, dy] = S(j.gps.destino.x, j.gps.destino.z), f = (t * 0.8) % 1;
      g.strokeStyle = `rgba(200,150,255,${1 - f})`; g.lineWidth = 2.5; g.beginPath(); g.arc(dx, dy, 8 + f * 30, 0, 7); g.stroke();
    }
    const reloj = document.getElementById('mapaReloj'), rt = `${j.ambiente.texto} · ${j.ambiente.lluvia > 0.3 ? 'Lluvia' : j.ambiente.noche > 0.5 ? 'Noche despejada' : 'Soleado'} · ${j.policia.estrellas ? j.policia.estrellas + ' estrellas' : 'Sin buscar'}`;
    if (reloj && reloj.textContent !== rt) reloj.textContent = rt;
    const dest = j.gps.destino, ruta = j.gps.ruta;
    const d = document.getElementById('mapaDestino');
    const txt = dest && ruta ? `Destino a ${ruta.largo > 1000 ? (ruta.largo / 1000).toFixed(1) + ' km' : Math.round(ruta.largo / 10) * 10 + ' m'} · clic derecho para quitarlo` : 'Haz clic en el mapa para marcar un destino';
    if (d.textContent !== txt) d.textContent = txt;
  }
}

export { trazarIcono };
