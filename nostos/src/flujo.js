import { CELDA, esSolido } from './mapa.js?v=20260905181627';

export class Flujo {
  constructor(nivel) {
    this.nivel = nivel;
    this.ancho = nivel.ancho;
    this.alto = nivel.alto;
    this.dist = new Int32Array(this.ancho * this.alto);
    this.cola = new Int32Array(this.ancho * this.alto);
    this.metaX = -1;
    this.metaZ = -1;
    this.reloj = 0;
  }

  actualizar(dt, objetivo, enlaces) {
    this.reloj -= dt;
    const cx = Math.floor(objetivo.x / CELDA);
    const cz = Math.floor(objetivo.z / CELDA);
    const firma = enlaces ? enlaces.map(e => e.join(',')).join('|') : '';
    if (this.reloj > 0 && cx === this.metaX && cz === this.metaZ && firma === this.firma) return;
    this.reloj = 0.35;
    this.firma = firma;
    this.enlaces = enlaces || null;
    this.calcular(cx, cz);
  }

  calcular(cx, cz) {
    if (esSolido(this.nivel.rejilla, cx, cz)) return;
    this.metaX = cx;
    this.metaZ = cz;
    this.dist.fill(-1);
    const cola = this.cola;
    let cabeza = 0, cola_ = 0;
    const inicio = cz * this.ancho + cx;
    this.dist[inicio] = 0;
    cola[cola_++] = inicio;
    while (cabeza < cola_) {
      const actual = cola[cabeza++];
      const actualX = actual % this.ancho;
      const actualZ = (actual - actualX) / this.ancho;
      const ax = actualX, az = actualZ;
      const d = this.dist[actual] + 1;
      for (let i = 0; i < 4; i++) {
        const nx = ax + (i === 0 ? 1 : i === 1 ? -1 : 0);
        const nz = az + (i === 2 ? 1 : i === 3 ? -1 : 0);
        if (nx < 0 || nz < 0 || nx >= this.ancho || nz >= this.alto) continue;
        const idx = nz * this.ancho + nx;
        if (this.dist[idx] !== -1) continue;
        if (esSolido(this.nivel.rejilla, nx, nz)) continue;
        this.dist[idx] = d;
        cola[cola_++] = idx;
      }
      if (this.enlaces) {
        for (const [ax, az, bx, bz] of this.enlaces) {
          let saltoX = -1, saltoZ = -1;
          if (ax === actualX && az === actualZ) { saltoX = bx; saltoZ = bz; }
          else if (bx === actualX && bz === actualZ) { saltoX = ax; saltoZ = az; }
          if (saltoX < 0) continue;
          if (saltoX < 0 || saltoZ < 0 || saltoX >= this.ancho || saltoZ >= this.alto) continue;
          const idx = saltoZ * this.ancho + saltoX;
          if (this.dist[idx] !== -1) continue;
          if (esSolido(this.nivel.rejilla, saltoX, saltoZ)) continue;
          this.dist[idx] = d;
          cola[cola_++] = idx;
        }
      }
    }
  }

  distEn(cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.ancho || cz >= this.alto) return -1;
    return this.dist[cz * this.ancho + cx];
  }

  rumbo(x, z) {
    const cx = Math.floor(x / CELDA);
    const cz = Math.floor(z / CELDA);
    if (cx < 0 || cz < 0 || cx >= this.ancho || cz >= this.alto) return null;
    const aqui = this.dist[cz * this.ancho + cx];
    if (aqui <= 0) return null;
    let mejor = aqui, mx = 0, mz = 0;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= this.ancho || nz >= this.alto) continue;
        if (dx && dz) {
          if (esSolido(this.nivel.rejilla, cx + dx, cz)) continue;
          if (esSolido(this.nivel.rejilla, cx, cz + dz)) continue;
        }
        const d = this.dist[nz * this.ancho + nx];
        if (d === -1) continue;
        if (d < mejor) { mejor = d; mx = dx; mz = dz; }
      }
    }
    if (!mx && !mz) return null;
    const destinoX = (cx + mx) * CELDA + CELDA / 2;
    const destinoZ = (cz + mz) * CELDA + CELDA / 2;
    const vx = destinoX - x, vz = destinoZ - z;
    const largo = Math.hypot(vx, vz) || 1;
    return { x: vx / largo, z: vz / largo };
  }
}
