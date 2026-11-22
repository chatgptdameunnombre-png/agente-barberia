import { hoja } from './texturas.js?v=202611220058';
const svg = (c, vb = '0 0 64 64') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="currentColor">${c}</svg>`;

export const ICONO_ARMA = {
  puno: svg('<path d="M18 28c0-4 3-7 7-7h2v-3c0-3 2-5 5-5s5 2 5 5v1c1-1 2-1 3-1 3 0 5 2 5 5v1c1-.5 2-.8 3-.8 3 0 5 2.4 5 5.3V40c0 9-7 15-16 15h-4c-9 0-15-6-15-14z"/><path d="M27 21v10M35 19v12M42 22v9" stroke="#0b0d14" stroke-width="2.4" fill="none" stroke-linecap="round"/>'),
  bate: svg('<path d="M51 7c3 3 3 7 0 10L25 43l-4-4L47 13c-1-3 1-6 4-6z"/><path d="M23 41l-12 12c-1.5 1.5-4 1.5-5.5 0s-1.5-4 0-5.5L17.5 35.5z"/><circle cx="8" cy="56" r="4"/>'),
  pistola: svg('<path d="M8 20h44c2 0 4 2 4 4v6c0 1-1 2-2 2H34l-3 3h-6l-3 20c0 1-1 2-2 2h-8c-1.2 0-2-1-1.8-2.2L14 33H10c-1 0-2-1-2-2z"/><rect x="45" y="15" width="5" height="5" rx="1"/>'),
  escopeta: svg('<path d="M2 26h44l3-3h12c1 0 2 1 2 2v6c0 1-1 2-2 2H34l-12 7c-2 1-4 3-5 5l-5 9c-.5 1-1.5 1.5-2.5 1.2L4 53c-1-.4-1.6-1.6-1.1-2.6L10 36H4c-1 0-2-1-2-2z"/><rect x="30" y="33" width="9" height="5" rx="1.5"/>'),
  subfusil: svg('<path d="M6 22h46l2-3h6c1 0 2 1 2 2v7c0 1-1 2-2 2H48l-4 5H32l-2 3v20c0 1-1 2-2 2h-6c-1 0-2-1-2-2l1-17-7 4c-1 .6-2.6.2-3.2-.9L8 40c-.6-1-.2-2.4.8-3L14 34H6c-1 0-2-1-2-2v-8c0-1 1-2 2-2z"/><rect x="33" y="35" width="7" height="18" rx="1.5"/>'),
  cuchillo: svg('<path d="M6 40L44 14c4-3 10-3 13 0L18 46z"/><path d="M16 44l-6 6c-1.5 1.5-1.5 4 0 5.5s4 1.5 5.5 0l6-6z"/>'),
  rifle: svg('<path d="M2 28h40l2-4h16v6H48l-2 3H30l-3 4v14c0 1-1 2-2 2h-5c-1 0-2-1-2-2l1-12-10 4c-1 .5-2.4 0-2.8-1L4 36c-.4-1 0-2.2 1-2.6L10 32H2z"/><rect x="31" y="34" width="6" height="16" rx="1.5"/><rect x="24" y="22" width="12" height="4" rx="1"/>'),
  granada: svg('<ellipse cx="30" cy="40" rx="15" ry="17"/><rect x="24" y="15" width="13" height="9" rx="2"/><path d="M37 18c6-4 12-3 15 2" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="52" cy="22" r="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M16 36h28M15 44h30M30 24v33" stroke="#0b0d14" stroke-width="2" opacity=".45"/>')
};

export const ICONO = {
  dinero: svg('<rect x="4" y="16" width="56" height="32" rx="5"/><circle cx="32" cy="32" r="9" fill="#0b0d14"/><text x="32" y="38" font-size="15" font-weight="900" text-anchor="middle" fill="currentColor" font-family="Inter">$</text>'),
  gps: svg('<path d="M32 4c-11 0-20 9-20 20 0 15 20 36 20 36s20-21 20-36C52 13 43 4 32 4zm0 28a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>'),
  estrella: svg('<path d="M32 4l8.5 18 19.5 2.5-14.5 13.5 3.8 19.5L32 47.8 14.7 57.5l3.8-19.5L4 24.5 23.5 22z"/>'),
  sol: svg('<circle cx="32" cy="32" r="12"/><g stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6"/></g>'),
  luna: svg('<path d="M40 6a26 26 0 1 0 18 40A22 22 0 0 1 40 6z"/>'),
  lluvia: svg('<path d="M48 36H18a12 12 0 1 1 3-23.6A16 16 0 0 1 51 18a9 9 0 0 1-3 18z"/><g stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="M20 44l-4 10M32 44l-4 10M44 44l-4 10"/></g>'),
  mision: svg('<path d="M14 6h4v52h-4z"/><path d="M18 8h34l-8 11 8 11H18z"/>'),
  flor: svg('<g><circle cx="32" cy="18" r="11"/><circle cx="46" cy="30" r="11"/><circle cx="40" cy="46" r="11"/><circle cx="24" cy="46" r="11"/><circle cx="18" cy="30" r="11"/></g><circle cx="32" cy="33" r="7" fill="#ffd34a"/>'),
  coche: svg('<path d="M10 34l5-13c1-3 4-5 7-5h20c3 0 6 2 7 5l5 13c3 1 5 3 5 6v8c0 1-1 2-2 2h-4a6 6 0 0 1-12 0H23a6 6 0 0 1-12 0H7c-1 0-2-1-2-2v-8c0-3 2-5 5-6zm8-1h28l-4-10H22z"/>'),
  taxi: svg('<rect x="24" y="6" width="16" height="8" rx="2"/><path d="M10 36l5-13c1-3 4-5 7-5h20c3 0 6 2 7 5l5 13c3 1 5 3 5 6v8c0 1-1 2-2 2h-4a6 6 0 0 1-12 0H23a6 6 0 0 1-12 0H7c-1 0-2-1-2-2v-8c0-3 2-5 5-6zm8-1h28l-4-10H22z"/>'),
  salto: svg('<path d="M4 54h30L58 30v6L36 58H4z"/><path d="M40 8l4 10 10 2-8 6 2 10-8-6-8 6 2-10-8-6 10-2z"/>'),
  alerta: svg('<path d="M32 4L2 58h60zM29 24h6v18h-6zm0 22h6v6h-6z"/>'),
  ok: svg('<circle cx="32" cy="32" r="28"/><path d="M18 33l9 9 19-20" stroke="#0b0d14" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
  tienda: svg('<path d="M8 22l6-14h36l6 14c0 5-4 8-8 8s-8-3-8-8c0 5-4 8-8 8s-8-3-8-8c0 5-4 8-8 8s-8-3-8-8z"/><path d="M12 32v24h40V32" stroke="currentColor" stroke-width="4" fill="none"/><rect x="26" y="40" width="12" height="16"/>')
};

const ORD = ['puno', 'bate', 'cuchillo', 'pistola', 'escopeta', 'subfusil', 'rifle', 'granada'];
export const IMG_ARMAS = hoja('assets/armas.png', 4, 2, { magenta: true, tam: 320 });
export const IMG_ARMAS2 = hoja('assets/armas2.png', 4, 2, { magenta: true, tam: 320 });
const ORD2 = ['revolver', 'machete', 'francotirador', 'lanzacohetes', 'molotov', 'recortada', 'ametralladora', 'llave'];
const FALLA = { revolver: 'pistola', machete: 'cuchillo', francotirador: 'rifle', lanzacohetes: 'rifle', molotov: 'granada', recortada: 'escopeta', ametralladora: 'subfusil', llave: 'bate' };
export function iconoArma(id) {
  if (ORD2.includes(id)) { const q = IMG_ARMAS2[ORD2.indexOf(id)]; return q && q.listo ? `<img src="${q.url}" alt="">` : (ICONO_ARMA[FALLA[id]] || ''); }
  const p = IMG_ARMAS[ORD.indexOf(id)];
  return p && p.listo ? `<img src="${p.url}" alt="">` : (ICONO_ARMA[id] || '');
}

export const GLIFO = {
  coche: 'M5 11l1.5-4.5C7 5 8 4.5 9 4.5h6c1 0 2 .5 2.5 2L19 11c1.2.3 2 1.2 2 2.5V17c0 .6-.4 1-1 1h-1.2a2.3 2.3 0 0 1-4.6 0H9.8a2.3 2.3 0 0 1-4.6 0H4c-.6 0-1-.4-1-1v-3.5C3 12.2 3.8 11.3 5 11zm2.2-.5h9.6l-1.1-3.4c-.1-.4-.5-.6-.9-.6H9.2c-.4 0-.8.2-.9.6z',
  persona: 'M12 3a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM5 21c0-4.4 3-7.5 7-7.5s7 3.1 7 7.5z',
  bandera: 'M5 3h2v18H5zM8 4h11l-3 4 3 4H8z',
  rampa: 'M3 19h10l8-8v3l-7 7H3zM15 3l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z',
  carrito: 'M2 3h3.2l.6 3H21l-2.4 8.5H7.6L5.3 5H2zM9 17.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zm8 0a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z',
  camisa: 'M8 3l4 2 4-2 5 3.5-2.5 4L16 9v12H8V9l-2.5 1.5-2.5-4z',
  tijeras: 'M6 3.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 1.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm0 9.4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 1.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM8.6 9.3L21 5.6v1.6l-11 5zm0 5.4l2.6-1.3L21 17.2v1.6z',
  mira: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2.2a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6zM11 .5h2V4h-2zm0 19.5h2v3.5h-2zM.5 11H4v2H.5zM20 11h3.5v2H20zM12 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  copa: 'M5 4h11v16c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1zM16 8h2.5C19.9 8 21 9.1 21 10.5v4c0 1.4-1.1 2.5-2.5 2.5H16v-2h2.5c.3 0 .5-.2.5-.5v-4c0-.3-.2-.5-.5-.5H16z',
  nota: 'M9 18a3 3 0 1 1-2-2.83V5.2l12-2.2v12a3 3 0 1 1-2-2.83V7.4l-8 1.5z',
  pesa: 'M2 10h2V7h4v10H4v-3H2zm20 0h-2V7h-4v10h4v-3h2zM8 11h8v2H8z',
  casa: 'M12 3l9 8h-2.5v9.5h-5v-6h-3v6h-5V11H3z',
  chispa: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z',
  escudo: 'M12 2l8 3v6c0 5.2-3.4 9.4-8 11-4.6-1.6-8-5.8-8-11V5z',
  balon: 'M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19zm0 1.8a7.7 7.7 0 1 0 0 15.4 7.7 7.7 0 0 0 0-15.4zM12 8l3.3 2.4-1.3 3.9h-4l-1.3-3.9z',
  cruz: 'M10.5 2h3v6h5.5v3h-5.5v11h-3V11H5V8h5.5z',
  llave: 'M20.5 6.5a5 5 0 0 1-6.6 6.2L7 19.6a2 2 0 0 1-2.8-2.8l6.9-6.9A5 5 0 0 1 17.3 3.5L14.5 6.3l.7 2.5 2.5.7z',
  candado: 'M7 10V7.5a5 5 0 0 1 10 0V10h1.5c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-13C4.7 22 4 21.3 4 20.5v-9c0-.8.7-1.5 1.5-1.5zm2.5 0h5V7.5a2.5 2.5 0 0 0-5 0z',
  punto: 'M12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12z',
  ancla: 'M11 2h2v2.2a2.5 2.5 0 1 1-2 0V2zm1 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM11 8.5h2V19c2.8-.4 5-2.4 5.8-5H16l3-4 3 4h-1.6c-1 4.3-4.9 7.5-9.4 7.5S3.6 18.3 2.6 14H1l3-4 3 4H5.2c.8 2.6 3 4.6 5.8 5z',
  caja: 'M3 7l9-4 9 4v10l-9 4-9-4zm9 2.2L5.5 6.6 12 4l6.5 2.6z',
  cruzroja: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  patrulla: 'M9 2h6v3H9zM5 13l1.5-4.5C7 7 8 6.5 9 6.5h6c1 0 2 .5 2.5 2L19 13c1.2.3 2 1.2 2 2.5V19c0 .6-.4 1-1 1h-1.2a2.3 2.3 0 0 1-4.6 0H9.8a2.3 2.3 0 0 1-4.6 0H4c-.6 0-1-.4-1-1v-3.5C3 14.2 3.8 13.3 5 13zm2.2-.5h9.6l-1.1-3.4c-.1-.4-.5-.6-.9-.6H9.2c-.4 0-.8.2-.9.6z',
  bolsa: 'M6 8h12l1 13H5zm3 0V6.5a3 3 0 0 1 6 0V8h-1.6V6.5a1.4 1.4 0 0 0-2.8 0V8z'
};
const P2D = {};
export function dibujarGlifo(g, t, x, y, tam, color) {
  g.fillStyle = color;
  const d = GLIFO[t];
  if (!d) { g.font = `800 ${Math.round(tam * 0.92)}px Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y + 1); return; }
  const p = P2D[t] || (P2D[t] = new Path2D(d));
  g.save(); g.translate(x - tam / 2, y - tam / 2); g.scale(tam / 24, tam / 24); g.fill(p, 'evenodd'); g.restore();
}
export const glifoSVG = t => GLIFO[t] ? `<svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" fill-rule="evenodd" d="${GLIFO[t]}"/></svg>` : t;
