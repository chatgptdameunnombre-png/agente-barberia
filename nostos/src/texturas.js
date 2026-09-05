import * as THREE from 'three';

export const PALETA = {
  marmol:   ['#d9cfb4', '#c4b795', '#a89a78', '#8a7c5e'],
  terracota:['#a3502c', '#8a3f21', '#6d3018', '#4a1f10'],
  roca:     ['#4a4640', '#3a3733', '#2b2926', '#1c1a18'],
  mosaico:  ['#1f4f6b', '#2d7396', '#d9cfb4', '#c9a227'],
  madera:   ['#6b4a22', '#523716', '#3a270f', '#241806'],
  oro:      '#e8c14a',
  sangre:   '#5a1410'
};

let semilla = 1337;
function azar() {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
}

function lienzo(n = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  return [c, c.getContext('2d')];
}

function granular(ctx, n, colores, densidad) {
  for (let i = 0; i < n * n * densidad; i++) {
    ctx.fillStyle = colores[(azar() * colores.length) | 0];
    ctx.fillRect((azar() * n) | 0, (azar() * n) | 0, 1, 1);
  }
}

function acabar(c) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function marmol(n = 64) {
  const [c, ctx] = lienzo(n);
  const p = PALETA.marmol;
  ctx.fillStyle = p[0];
  ctx.fillRect(0, 0, n, n);
  granular(ctx, n, [p[0], p[1]], 0.5);
  const alto = n / 4;
  for (let f = 0; f < 4; f++) {
    const y = f * alto;
    ctx.fillStyle = p[3];
    ctx.fillRect(0, y, n, 1);
    const desfase = f % 2 ? n / 4 : 0;
    for (let x = desfase; x < n + desfase; x += n / 2) {
      ctx.fillRect(x % n, y, 1, alto);
    }
    ctx.fillStyle = p[1];
    ctx.fillRect(0, y + 1, n, 1);
  }
  for (let v = 0; v < 5; v++) {
    let x = azar() * n, y = azar() * n;
    ctx.fillStyle = p[2];
    for (let s = 0; s < 22; s++) {
      ctx.fillRect(x | 0, y | 0, 1, 1);
      x = (x + azar() * 3 - 1 + n) % n;
      y = (y + azar() * 2 - 0.6 + n) % n;
    }
  }
  return acabar(c);
}

export function columna(n = 64) {
  const [c, ctx] = lienzo(n);
  const p = PALETA.marmol;
  ctx.fillStyle = p[1];
  ctx.fillRect(0, 0, n, n);
  const ancho = 8;
  for (let x = 0; x < n; x += ancho) {
    ctx.fillStyle = p[0];
    ctx.fillRect(x + 1, 0, ancho - 3, n);
    ctx.fillStyle = p[3];
    ctx.fillRect(x, 0, 1, n);
    ctx.fillStyle = p[2];
    ctx.fillRect(x + ancho - 2, 0, 1, n);
  }
  granular(ctx, n, [p[2], p[3]], 0.18);
  return acabar(c);
}

export function terracota(n = 64) {
  const [c, ctx] = lienzo(n);
  const p = PALETA.terracota;
  ctx.fillStyle = p[1];
  ctx.fillRect(0, 0, n, n);
  granular(ctx, n, [p[0], p[2]], 0.4);
  ctx.fillStyle = '#1a1008';
  const u = n / 16;
  for (let bx = 0; bx < n; bx += n / 2) {
    ctx.fillRect(bx + u * 2, u * 5, u * 4, u);
    ctx.fillRect(bx + u * 2, u * 5, u, u * 4);
    ctx.fillRect(bx + u * 2, u * 8, u * 6, u);
    ctx.fillRect(bx + u * 7, u * 5, u, u * 4);
    ctx.fillRect(bx + u * 5, u * 6, u * 2, u);
  }
  ctx.fillStyle = p[3];
  ctx.fillRect(0, 0, n, 2);
  ctx.fillRect(0, n - 2, n, 2);
  return acabar(c);
}

export function mosaico(n = 64) {
  const [c, ctx] = lienzo(n);
  const p = PALETA.mosaico;
  const t = 4;
  for (let y = 0; y < n; y += t) {
    for (let x = 0; x < n; x += t) {
      const borde = x < t * 2 || y < t * 2 || x >= n - t * 2 || y >= n - t * 2;
      let col;
      if (borde) col = ((x + y) / t) % 2 ? p[0] : p[3];
      else col = azar() > 0.72 ? p[1] : p[2];
      ctx.fillStyle = col;
      ctx.fillRect(x, y, t - 1, t - 1);
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(x + t - 1, y, 1, t);
      ctx.fillRect(x, y + t - 1, t, 1);
    }
  }
  return acabar(c);
}

export function roca(n = 64) {
  const [c, ctx] = lienzo(n);
  const p = PALETA.roca;
  ctx.fillStyle = p[1];
  ctx.fillRect(0, 0, n, n);
  granular(ctx, n, p, 1.6);
  for (let g = 0; g < 14; g++) {
    const x = (azar() * n) | 0, y = (azar() * n) | 0, r = 2 + azar() * 5;
    ctx.fillStyle = azar() > 0.5 ? p[3] : p[0];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  granular(ctx, n, [p[3]], 0.5);
  return acabar(c);
}

export function piedra(n = 64) {
  const [c, ctx] = lienzo(n);
  const p = PALETA.roca;
  const m = PALETA.marmol;
  ctx.fillStyle = p[0];
  ctx.fillRect(0, 0, n, n);
  granular(ctx, n, [m[3], p[1]], 0.7);
  ctx.fillStyle = p[3];
  for (let i = 0; i <= n; i += n / 4) {
    ctx.fillRect(i % n, 0, 1, n);
    ctx.fillRect(0, i % n, n, 1);
  }
  return acabar(c);
}

export function siluetaCiclope(vista = 0) {
  const w = 96, h = 128;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const piel = ['#8d8c78', '#75745f', '#5c5b49'];
  const cuerpo = piel[vista === 3 ? 1 : 0];
  ctx.fillStyle = cuerpo;
  ctx.fillRect(30, 26, 36, 46);
  ctx.fillRect(22, 30, 8, 40);
  ctx.fillRect(66, 30, 8, 40);
  ctx.fillRect(34, 72, 12, 44);
  ctx.fillRect(50, 72, 12, 44);
  ctx.fillStyle = piel[1];
  ctx.fillRect(30, 116, 16, 8);
  ctx.fillRect(50, 116, 16, 8);
  ctx.fillStyle = '#6b5a34';
  ctx.fillRect(30, 66, 36, 16);
  ctx.fillStyle = cuerpo;
  ctx.fillRect(36, 6, 24, 22);
  ctx.fillStyle = '#1c1a18';
  ctx.fillRect(34, 2, 28, 8);
  if (vista !== 3) {
    ctx.fillRect(36, 20, 24, 10);
    ctx.fillStyle = '#e8c14a';
    ctx.fillRect(44, 12, 8, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(46, 14, 3, 3);
  }
  ctx.fillStyle = '#4a3418';
  ctx.fillRect(16, 62, 8, 34);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function banco() {
  return {
    marmol: marmol(),
    columna: columna(),
    terracota: terracota(),
    mosaico: mosaico(),
    roca: roca(),
    piedra: piedra()
  };
}
