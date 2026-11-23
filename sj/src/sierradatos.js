export const CERRO = { x: 470, z: -240, r: 112, h: 30 };
export const PISTA = { x0: 540, x1: 582, z0: -165, z1: 165 };
export const HANGAR = { x0: 582, x1: 640, z0: -45, z1: 45 };
export const PUEBLO = { x0: 375, x1: 505, z0: 62, z1: 175 };
export const CASA = { x0: 395, x1: 485, z0: 196, z1: 276 };
export const RANCHO = { x0: -480, x1: -392, z0: -50, z1: 70 };
export const PARADOR = { x0: 378, x1: 418, z0: 8, z1: 40 };
export const ANCHO = 8.5;
export const PERI = 352;
export const AERO = { tx0: -165, tx1: 165, tz0: 356, tz1: 418, ax0: -345, ax1: 345, az0: 418, az1: 560, pista: { x0: -335, x1: 335, z0: 502, z1: 542 } };

function anillo() {
  const p = [], R = PERI, r = 34;
  for (const [cx, cz, a0] of [[R - r, R - r, 0], [-(R - r), R - r, Math.PI / 2], [-(R - r), -(R - r), Math.PI], [R - r, -(R - r), Math.PI * 1.5]]) for (let k = 0; k <= 6; k++) { const a = a0 + k / 6 * Math.PI / 2; p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
  p.push(p[0]);
  return p;
}

const sstep = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

export function alturaCerro(x, z) {
  const d = Math.hypot(x - CERRO.x, z - CERRO.z);
  if (d >= CERRO.r) return 0;
  return CERRO.h * sstep(Math.min(1, (1 - d / CERRO.r) * 1.22));
}

function espiral() {
  const p = [], a0 = Math.atan2(-150 - CERRO.z, 410 - CERRO.x), vueltas = 1.15, n = 70;
  for (let i = 0; i <= n; i++) {
    const t = i / n, r = 106 - 88 * t, a = a0 - t * Math.PI * 2 * vueltas;
    p.push([CERRO.x + Math.cos(a) * r, CERRO.z + Math.sin(a) * r]);
  }
  return p;
}

export const CAMINOS = [
  { nombre: 'Periférico Jacaranda', pts: anillo(), anillo: true },
  { nombre: 'Salida Norte', pts: [[0, -318], [0, -PERI]] },
  { nombre: 'Salida Sur', pts: [[0, 318], [0, PERI], [0, 382]] },
  { nombre: 'Salida Poniente', pts: [[-318, 0], [-PERI, 0]] },
  { nombre: 'Camino al Rancho El Mezquite', pts: [[-PERI, 20], [-372, 20], [-393, 20]] },
  { nombre: 'Carretera a la Sierra', pts: [[318, 0], [380, 0], [440, 0]] },
  { nombre: 'Camino al Aeródromo', pts: [[440, 0], [500, 0], [541, 0]] },
  { nombre: 'Calle Real de San Isidro', pts: [[440, 0], [440, 40], [440, 64]] },
  { nombre: 'Camino a la Casa', pts: [[440, 173], [440, 186], [440, 198]] },
  { nombre: 'Subida al Mirador', pts: [[440, 0], [436, -50], [424, -100], [410, -150], ...espiral().slice(1)] }
];

export const MIRADOR = (() => { const e = espiral(), f = e[e.length - 1]; return { x: f[0], z: f[1] }; })();
export const SUBIDA = CAMINOS.find(c => c.nombre === 'Subida al Mirador');

export const REGIONES = [
  ...CAMINOS.map(c => ({ tipo: 'camino', pts: c.pts, w: ANCHO / 2 + 2 })),
  { tipo: 'rect', ...PISTA }, { tipo: 'rect', ...HANGAR }, { tipo: 'rect', ...PUEBLO }, { tipo: 'rect', ...CASA },
  { tipo: 'rect', ...RANCHO }, { tipo: 'rect', ...PARADOR },
  { tipo: 'rect', x0: AERO.tx0, x1: AERO.tx1, z0: AERO.tz0, z1: AERO.tz1 + 0.5 }, { tipo: 'rect', x0: AERO.ax0, x1: AERO.ax1, z0: AERO.az0, z1: AERO.az1 },
  { tipo: 'disco', x: CERRO.x, z: CERRO.z, r: CERRO.r - 4 },
  { tipo: 'disco', x: 440, z: 0, r: 14 }
];

function cercaSeg(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
  return [ax + dx * t, az + dz * t];
}

export function dentroRegion(x, z, m = 0) {
  for (const R of REGIONES) {
    if (R.tipo === 'rect') { if (x > R.x0 - m && x < R.x1 + m && z > R.z0 - m && z < R.z1 + m) return true; }
    else if (R.tipo === 'disco') { if (Math.hypot(x - R.x, z - R.z) < R.r + m) return true; }
    else for (let i = 0; i + 1 < R.pts.length; i++) { const [a, b] = [R.pts[i], R.pts[i + 1]], q = cercaSeg(x, z, a[0], a[1], b[0], b[1]); if (Math.hypot(x - q[0], z - q[1]) < R.w + m) return true; }
  }
  return false;
}

export function regresar(x, z, r) {
  let mejor = null, md = Infinity;
  const prueba = (px, pz) => { const d = Math.hypot(px - x, pz - z); if (d < md) { md = d; mejor = { x: px, z: pz }; } };
  for (const R of REGIONES) {
    if (R.tipo === 'rect') prueba(Math.max(R.x0 + r, Math.min(R.x1 - r, x)), Math.max(R.z0 + r, Math.min(R.z1 - r, z)));
    else if (R.tipo === 'disco') { const d = Math.hypot(x - R.x, z - R.z) || 1, k = Math.min(d, R.r - r) / d; prueba(R.x + (x - R.x) * k, R.z + (z - R.z) * k); }
    else for (let i = 0; i + 1 < R.pts.length; i++) {
      const [a, b] = [R.pts[i], R.pts[i + 1]], q = cercaSeg(x, z, a[0], a[1], b[0], b[1]), d = Math.hypot(x - q[0], z - q[1]) || 1, k = Math.min(d, R.w - r) / d;
      prueba(q[0] + (x - q[0]) * k, q[1] + (z - q[1]) * k);
    }
  }
  return mejor;
}

function ruido(x, z) { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); }
function suave(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = ruido(ix, iz), b = ruido(ix + 1, iz), c = ruido(ix, iz + 1), d = ruido(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function lomas(x, z) { return suave(x / 140, z / 140) * 0.6 + suave(x / 60 + 7, z / 60 + 3) * 0.3 + suave(x / 25, z / 25) * 0.1; }
export function alturaCampo(x, z) {
  const m = Math.max(Math.abs(x), Math.abs(z));
  if (m < 362) return 0;
  const borde = sstep((m - 362) / 70);
  let lejos = 1;
  if (dentroRegion(x, z, 10)) lejos = 0; else if (dentroRegion(x, z, 26)) lejos = 0.35; else if (dentroRegion(x, z, 44)) lejos = 0.75;
  return Math.max(0, lomas(x, z) - 0.28) * 34 * borde * lejos;
}
