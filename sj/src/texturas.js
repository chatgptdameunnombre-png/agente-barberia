import * as THREE from 'three';

const cache = {};

function cargar(url) {
  if (cache[url]) return cache[url];
  const img = new Image();
  const p = new Promise(res => { img.onload = () => res(img); img.onerror = () => res(null); });
  img.src = url;
  cache[url] = p;
  return p;
}

function sinMagenta(g, w, h) {
  const d = g.getImageData(0, 0, w, h), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const r = a[i], gg = a[i + 1], b = a[i + 2];
    const m = Math.min(r, b) - gg;
    if (r > 150 && b > 150 && gg < 110 && m > 80) a[i + 3] = 0;
    else if (m > 40 && r > 120 && b > 120) { a[i + 3] = Math.max(0, 255 - (m - 40) * 4); a[i] = Math.min(r, gg + 60); a[i + 2] = Math.min(b, gg + 60); }
  }
  g.putImageData(d, 0, 0);
}

function recortarVacio(c) {
  const g = c.getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 30) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) return c;
  const m = 4, n = document.createElement('canvas');
  n.width = x1 - x0 + m * 2; n.height = y1 - y0 + m * 2;
  n.getContext('2d', { willReadFrequently: true }).drawImage(c, x0 - m, y0 - m, n.width, n.height, 0, 0, n.width, n.height);
  return n;
}

export function hoja(url, cols, rows, opc = {}) {
  const n = cols * rows, tam = opc.tam || 256;
  const piezas = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('canvas'); c.width = tam; c.height = Math.round(tam * (opc.aspecto || 1));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    if (opc.pixel) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; }
    if (opc.repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
    const pieza = { canvas: c, textura: t, color: new THREE.Color('#888'), colorArriba: new THREE.Color('#222'), url: null, listo: false };
    if (opc.brillo) {
      const cb = document.createElement('canvas'); cb.width = c.width; cb.height = c.height;
      cb.getContext('2d', { willReadFrequently: true }).fillRect(0, 0, cb.width, cb.height);
      pieza.lienzoBrillo = cb;
      const cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height; pieza.lienzoVidrio = cv;
      pieza.vidrioMapa = new THREE.CanvasTexture(cv); pieza.vidrioMapa.colorSpace = THREE.NoColorSpace;
      if (opc.repetir) pieza.vidrioMapa.wrapS = pieza.vidrioMapa.wrapT = THREE.RepeatWrapping;
      pieza.brillo = new THREE.CanvasTexture(cb); pieza.brillo.colorSpace = THREE.SRGBColorSpace;
      if (opc.repetir) pieza.brillo.wrapS = pieza.brillo.wrapT = THREE.RepeatWrapping;
      if (opc.pixel) pieza.brillo.magFilter = THREE.NearestFilter;
    }
    piezas.push(pieza);
  }
  const listo = cargar(url).then(img => {
    if (!img) return piezas;
    const cw = img.width / cols, ch = img.height / rows, ins = opc.margen || 0;
    piezas.forEach((p, i) => {
      const cx = (i % cols) * cw, cy = Math.floor(i / cols) * ch;
      const sx = cx + cw * ins, sy = cy + ch * ins, sw = cw * (1 - ins * 2), sh = ch * (1 - ins * 2);
      let c = p.canvas;
      if (opc.magenta) {
        const t = document.createElement('canvas'); t.width = Math.round(sw); t.height = Math.round(sh);
        const g = t.getContext('2d', { willReadFrequently: true }); g.drawImage(img, sx, sy, sw, sh, 0, 0, t.width, t.height);
        sinMagenta(g, t.width, t.height);
        c = recortarVacio(t);
        p.canvas.width = c.width; p.canvas.height = c.height;
        p.canvas.getContext('2d', { willReadFrequently: true }).drawImage(c, 0, 0);
      } else {
        c.getContext('2d', { willReadFrequently: true }).drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      }
      const g = p.canvas.getContext('2d', { willReadFrequently: true }), w = p.canvas.width, h = p.canvas.height;
      const muestra = opc.colorDe === 'borde' ? [[0.2, 0.55], [0.8, 0.55], [0.12, 0.42], [0.88, 0.42], [0.5, 0.62]] : [[0.5, 0.5], [0.3, 0.6], [0.7, 0.6], [0.5, 0.3], [0.5, 0.8]];
      let r = 0, gg = 0, b = 0;
      for (const [u, v] of muestra) { const px = g.getImageData(Math.floor(u * (w - 1)), Math.floor(v * (h - 1)), 1, 1).data; r += px[0]; gg += px[1]; b += px[2]; }
      p.color.setRGB(r / muestra.length / 255, gg / muestra.length / 255, b / muestra.length / 255, THREE.SRGBColorSpace);
      let ra = 0, ga = 0, ba = 0;
      for (const u of [0.3, 0.5, 0.7]) { const px = g.getImageData(Math.floor(u * (w - 1)), Math.floor(0.04 * (h - 1)), 1, 1).data; ra += px[0]; ga += px[1]; ba += px[2]; }
      p.colorArriba.setRGB(ra / 3 / 255, ga / 3 / 255, ba / 3 / 255, THREE.SRGBColorSpace);
      p.textura.needsUpdate = true;
      if (p.lienzoBrillo) {
        const d = g.getImageData(0, 0, w, h).data, gb = p.lienzoBrillo.getContext('2d', { willReadFrequently: true }), o = gb.createImageData(w, h);
        const gv = p.lienzoVidrio.getContext('2d'), ov = gv.createImageData(w, h);
        const vidrio = opc.brillo === 'azul' || p.vidrio;
        const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7 + i * 74.7) * 43758.5453; return v - Math.floor(v); };
        const tonos = [[255, 214, 150], [255, 236, 200], [205, 225, 255], [240, 240, 228]];
        const CX = vidrio ? 10 : 6, CY = vidrio ? 12 : 6;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const q = (y * w + x) * 4, rr = d[q], gg2 = d[q + 1], bb = d[q + 2];
          const lum = (rr * 0.3 + gg2 * 0.59 + bb * 0.11) / 255;
          const cx = Math.floor(x / w * CX), cy = Math.floor(y / h * CY);
          const fx = (x / w * CX) % 1, fy = (y / h * CY) % 1;
          const prendida = hash(cx, cy) < (vidrio ? 0.34 : 0.45);
          const ventana = vidrio ? (fx > 0.12 && fx < 0.88 && fy > 0.14 && fy < 0.86) : lum < 0.24;
          ov.data[q] = 255; ov.data[q + 1] = ventana ? 26 : 235; ov.data[q + 2] = ventana ? 150 : 0; ov.data[q + 3] = 255;
          if (ventana && prendida) {
            const t = tonos[Math.floor(hash(cx + 9, cy + 3) * tonos.length)], k = 0.55 + hash(cx + 4, cy + 7) * 0.45;
            o.data[q] = t[0] * k; o.data[q + 1] = t[1] * k; o.data[q + 2] = t[2] * k;
          }
          o.data[q + 3] = 255;
        }
        gb.putImageData(o, 0, 0);
        p.brillo.needsUpdate = true;
        gv.putImageData(ov, 0, 0); p.vidrioMapa.needsUpdate = true;
      }
      p.url = opc.sinUrl ? null : p.canvas.toDataURL();
      p.listo = true;
      opc.alListo?.(p, i);
    });
    return piezas;
  });
  piezas.listo = listo;
  return piezas;
}
