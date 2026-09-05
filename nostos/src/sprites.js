import * as THREE from 'three';

const DOS_PI = Math.PI * 2;

export class Billboard {
  constructor(vistas, ancho, alto, opciones = {}) {
    this.vistas = vistas;
    const img = vistas[0] && vistas[0].image;
    if (img && img.width && img.height) ancho = alto * (img.width / img.height);
    this.ancho = ancho;
    this.alto = alto;
    const Material = opciones.basico ? THREE.MeshBasicMaterial : THREE.MeshLambertMaterial;
    this.material = new Material({
      map: vistas[0],
      transparent: true,
      alphaTest: 0.55,
      side: THREE.DoubleSide,
      fog: true
    });
    this.malla = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), this.material);
    this.malla.position.y = alto / 2;
    this.grupo = new THREE.Group();
    this.grupo.add(this.malla);
    this.indice = 0;
    this.espejo = false;
  }

  fijarVistas(vistas) {
    this.vistas = vistas;
    this.indice = -1;
  }

  encarar(camara, rumbo) {
    const dx = camara.position.x - this.grupo.position.x;
    const dz = camara.position.z - this.grupo.position.z;
    this.grupo.rotation.y = Math.atan2(dx, dz);

    if (this.vistas.length <= 1) {
      if (this.material.map !== this.vistas[0]) {
        this.material.map = this.vistas[0];
        this.material.needsUpdate = true;
      }
      return;
    }

    const haciaCamara = Math.atan2(dx, dz);
    let rel = (haciaCamara - rumbo + DOS_PI * 2) % DOS_PI;
    const sector = Math.round(rel / (DOS_PI / 8)) % 8;
    const tabla = [0, 1, 2, 3, 3, 3, 2, 1];
    const espejos = [false, false, false, false, true, true, true, true];
    const idx = Math.min(tabla[sector], this.vistas.length - 1);

    if (idx !== this.indice || espejos[sector] !== this.espejo) {
      this.indice = idx;
      this.espejo = espejos[sector];
      this.material.map = this.vistas[idx];
      this.material.needsUpdate = true;
      this.malla.scale.x = this.espejo ? -1 : 1;
    }
  }
}

export function colorFondo(imagen) {
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(imagen, 0, 0, 8, 8, 0, 0, 8, 8);
  const p = x.getImageData(0, 0, 8, 8).data;
  return [p[0], p[1], p[2], p[3]];
}

function quitarFondo(ctx, w, h, fondo) {
  if (fondo && fondo.length > 3 && fondo[3] < 12) return;
  const d = ctx.getImageData(0, 0, w, h);
  const p = d.data;
  const magenta = !fondo || (fondo[0] > 150 && fondo[2] > 150 && fondo[1] < 110);
  const [fr, fg, fb] = fondo || [255, 0, 255];
  const margen = magenta ? 0 : 40;

  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    if (magenta) {
      if (r > 140 && b > 140 && g < 125 && Math.abs(r - b) < 100) p[i + 3] = 0;
    } else if (Math.abs(r - fr) + Math.abs(g - fg) + Math.abs(b - fb) < margen) {
      p[i + 3] = 0;
    }
  }

  if (magenta) despintarBorde(p, w, h);
  ctx.putImageData(d, 0, 0);
}

function despintarBorde(p, w, h) {
  const capas = [
    { fuerza: 1, umbral: 4 },
    { fuerza: 0.65, umbral: 10 },
    { fuerza: 0.3, umbral: 16 }
  ];
  let frontera = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (p[i + 3] === 0) continue;
      let tocaFondo = false;
      for (let dy = -1; dy <= 1 && !tocaFondo; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) { tocaFondo = true; break; }
          if (p[(ny * w + nx) * 4 + 3] === 0) { tocaFondo = true; break; }
        }
      }
      if (tocaFondo) frontera.add(y * w + x);
    }
  }

  const yaHecho = new Set();
  for (const capa of capas) {
    const siguiente = new Set();
    for (const idx of frontera) {
      if (yaHecho.has(idx)) continue;
      yaHecho.add(idx);
      const i = idx * 4;
      const r = p[i], g = p[i + 1], b = p[i + 2];
      const exceso = Math.min(r, b) - g;
      if (exceso > capa.umbral) {
        const tope = g + capa.umbral;
        p[i] = Math.round(r - (r - Math.min(r, tope)) * capa.fuerza);
        p[i + 2] = Math.round(b - (b - Math.min(b, tope)) * capa.fuerza);
      }
      const x = idx % w, y = (idx - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (p[j * 4 + 3] !== 0 && !yaHecho.has(j)) siguiente.add(j);
        }
      }
    }
    frontera = siguiente;
  }
}

function recuadro(ctx, w, h) {
  const p = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (p[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export function cortarTira(imagen, cuantos, opciones = {}) {
  const { ajustar = true, altoComun = true } = opciones;
  const fondo = colorFondo(imagen);
  const anchoCuadro = Math.floor(imagen.width / cuantos);
  const crudos = [];
  for (let i = 0; i < cuantos; i++) {
    const c = document.createElement('canvas');
    c.width = anchoCuadro;
    c.height = imagen.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imagen, i * anchoCuadro, 0, anchoCuadro, imagen.height, 0, 0, anchoCuadro, imagen.height);
    quitarFondo(ctx, c.width, c.height, fondo);
    crudos.push({ c, ctx, caja: ajustar ? recuadro(ctx, c.width, c.height) : null });
  }

  let base = null;
  if (ajustar && altoComun) {
    let arriba = imagen.height, abajo = 0, ancho = 0;
    for (const r of crudos) {
      if (!r.caja) continue;
      arriba = Math.min(arriba, r.caja.y);
      abajo = Math.max(abajo, r.caja.y + r.caja.h);
      ancho = Math.max(ancho, r.caja.w);
    }
    base = { arriba, abajo, ancho };
  }

  const salida = [];
  for (const r of crudos) {
    let out = r.c;
    if (r.caja) {
      const dst = document.createElement('canvas');
      const cy = base ? base.arriba : r.caja.y;
      const ch = base ? base.abajo - base.arriba : r.caja.h;
      const cw = base ? base.ancho : r.caja.w;
      dst.width = cw;
      dst.height = ch;
      const dctx = dst.getContext('2d');
      dctx.imageSmoothingEnabled = false;
      const cx = r.caja.x + r.caja.w / 2 - cw / 2;
      dctx.drawImage(r.c, cx, cy, cw, ch, 0, 0, cw, ch);
      out = dst;
    }
    const t = new THREE.CanvasTexture(out);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    salida.push(t);
  }
  return salida;
}

export function cargarImagen(ruta) {
  return new Promise(resolver => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => resolver(null);
    img.src = ruta;
  });
}

export function cortarRejilla(imagen, cols, filas, opciones = {}) {
  const { margen = 0.025, salida = 128, transparente = false } = opciones;
  if (transparente) return cortarRejillaSprites(imagen, cols, filas, margen);
  const cw = imagen.width / cols;
  const ch = imagen.height / filas;
  const mx = cw * margen;
  const my = ch * margen;
  const lista = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = salida;
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        imagen,
        c * cw + mx, f * ch + my, cw - mx * 2, ch - my * 2,
        0, 0, salida, salida
      );
      const t = new THREE.CanvasTexture(cv);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      lista.push(t);
    }
  }
  return lista;
}

function cortarRejillaSprites(imagen, cols, filas, margen) {
  const fondo = colorFondo(imagen);
  const cw = imagen.width / cols;
  const ch = imagen.height / filas;
  const mx = cw * margen;
  const my = ch * margen;
  const lista = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas');
      cv.width = Math.round(cw - mx * 2);
      cv.height = Math.round(ch - my * 2);
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(imagen, c * cw + mx, f * ch + my, cv.width, cv.height, 0, 0, cv.width, cv.height);
      quitarFondo(ctx, cv.width, cv.height, fondo);
      const caja = recuadro(ctx, cv.width, cv.height);
      let salida = cv;
      if (caja) {
        const dst = document.createElement('canvas');
        dst.width = caja.w;
        dst.height = caja.h;
        const dctx = dst.getContext('2d');
        dctx.imageSmoothingEnabled = false;
        dctx.drawImage(cv, caja.x, caja.y, caja.w, caja.h, 0, 0, caja.w, caja.h);
        salida = dst;
      }
      const t = new THREE.CanvasTexture(salida);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.colorSpace = THREE.SRGBColorSpace;
      lista.push(t);
    }
  }
  return lista;
}

export function recorteEntero(imagen) {
  const c = document.createElement('canvas');
  c.width = imagen.width;
  c.height = imagen.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(imagen, 0, 0);
  quitarFondo(ctx, c.width, c.height, colorFondo(imagen));
  const caja = recuadro(ctx, c.width, c.height);
  if (!caja) return c;
  const dst = document.createElement('canvas');
  dst.width = caja.w;
  dst.height = caja.h;
  const d = dst.getContext('2d');
  d.imageSmoothingEnabled = false;
  d.drawImage(c, caja.x, caja.y, caja.w, caja.h, 0, 0, caja.w, caja.h);
  return dst;
}

export function recorteSuperior(textura, fraccion = 0.45) {
  const im = textura.image;
  const alto = Math.round(im.height * fraccion);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = alto;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingEnabled = false;
  x.drawImage(im, 0, 0, im.width, alto, 0, 0, im.width, alto);
  const caja = recuadro(x, c.width, c.height);
  let salida = c;
  if (caja) {
    const dst = document.createElement('canvas');
    dst.width = caja.w;
    dst.height = caja.h;
    const d = dst.getContext('2d');
    d.imageSmoothingEnabled = false;
    d.drawImage(c, caja.x, caja.y, caja.w, caja.h, 0, 0, caja.w, caja.h);
    salida = dst;
  }
  const t = new THREE.CanvasTexture(salida);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
