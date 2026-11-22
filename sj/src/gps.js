import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { linea, indiceLinea, BLOQUES, LIMITE, CALLE } from './ciudad.js?v=202611220003';

export const CALLES_X = ['Periférico Poniente', 'Calle Agave', 'Av. Jacarandas', 'Calle Tapatía', 'Av. Santa Jacaranda', 'Calle Mariachi', 'Av. Las Torres', 'Calle Tequesquite', 'Periférico Oriente'];
export const CALLES_Z = ['Periférico Norte', 'Calle Birria', 'Av. Los Arcos', 'Calle Tejuino', 'Calzada del Valle', 'Calle Nopal', 'Av. Tianguis', 'Calle Cantarito', 'Periférico Sur'];

const ZONA_ESPECIAL = {
  taller: 'Taller de Don Chuy', hospital: 'Hospital Civil', catedral: 'Catedral de Santa Jacaranda', plaza: 'Plaza de Armas', monumento: 'Glorieta del Monumento',
  mercado: 'Mercado de San Jacinto', tianguis: 'El Tianguis', banco: 'Banco de Occidente', comisaria: 'Comisaría', parque: 'Parque', estadio: 'Estadio Jacaranda', armeria: 'Armería del Valle'
};

export function zona(ciudad, x, z) {
  const bx = Math.floor(x / 80 + BLOQUES / 2), bz = Math.floor(z / 80 + BLOQUES / 2);
  const b = ciudad.bloques.find(q => q.bx === bx && q.bz === bz);
  if (b && ZONA_ESPECIAL[b.tipo] && x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return ZONA_ESPECIAL[b.tipo];
  if (Math.hypot(bx - 6.5, bz - 1) < 2.3) return 'Distrito Financiero';
  if (Math.hypot(bx - 3.5, bz - 3.5) < 2.4) return 'Centro Histórico';
  if (bx < 4 && bz < 4) return 'Colonia Agave';
  if (bx >= 4 && bz < 4) return 'Colonia Los Arcos';
  if (bx < 4) return 'Barrio del Tianguis';
  return 'Las Jacarandas';
}

export function calle(x, z) {
  if (Math.abs(x) > LIMITE + 2 || Math.abs(z) > LIMITE + 2) return '';
  const ix = indiceLinea(x), iz = indiceLinea(z);
  const dx = Math.abs(x - linea(ix)), dz = Math.abs(z - linea(iz));
  if (dx < CALLE / 2 + 3 && dz < CALLE / 2 + 3) return CALLES_X[ix] + ' y ' + CALLES_Z[iz];
  if (dx < CALLE / 2 + 3) return CALLES_X[ix];
  if (dz < CALLE / 2 + 3) return CALLES_Z[iz];
  return dx < dz ? CALLES_X[ix] : CALLES_Z[iz];
}

function sobreCalle(x, z) {
  x = Math.max(-LIMITE + 4, Math.min(LIMITE - 4, x));
  z = Math.max(-LIMITE + 4, Math.min(LIMITE - 4, z));
  const ix = indiceLinea(x), iz = indiceLinea(z);
  const dx = Math.abs(x - linea(ix)), dz = Math.abs(z - linea(iz));
  if (dx <= dz) {
    const a = Math.max(0, Math.min(BLOQUES - 1, Math.floor(z / 80 + BLOQUES / 2)));
    return { x: linea(ix), z, nodos: [[ix, a], [ix, a + 1]] };
  }
  const a = Math.max(0, Math.min(BLOQUES - 1, Math.floor(x / 80 + BLOQUES / 2)));
  return { x, z: linea(iz), nodos: [[a, iz], [a + 1, iz]] };
}

export function ruta(ax, az, bx, bz) {
  const A = sobreCalle(ax, az), B = sobreCalle(bx, bz);
  const N = BLOQUES + 1, INF = 1e12;
  const idx = (i, j, d) => (i * N + j) * 5 + d;
  const dist = new Float64Array(N * N * 5).fill(INF), prev = new Int32Array(N * N * 5).fill(-1);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const abiertos = [];
  for (const [i, j] of A.nodos) {
    const c = Math.hypot(linea(i) - A.x, linea(j) - A.z);
    const k = idx(i, j, 4);
    if (c < dist[k]) { dist[k] = c; abiertos.push(k); }
  }
  const metas = new Map(B.nodos.map(([i, j]) => [i * N + j, Math.hypot(linea(i) - B.x, linea(j) - B.z)]));
  let mejor = INF, mejorK = -1;
  while (abiertos.length) {
    let bi = 0;
    for (let q = 1; q < abiertos.length; q++) if (dist[abiertos[q]] < dist[abiertos[bi]]) bi = q;
    const k = abiertos.splice(bi, 1)[0];
    const d0 = dist[k];
    if (d0 >= mejor) break;
    const nodo = Math.floor(k / 5), dir = k % 5, i = Math.floor(nodo / N), j = nodo % N;
    if (metas.has(nodo)) { const t = d0 + metas.get(nodo); if (t < mejor) { mejor = t; mejorK = k; } }
    DIRS.forEach(([di, dj], nd) => {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) return;
      const c = d0 + 80 + (dir !== 4 && dir !== nd ? 25 : 0);
      const kk = idx(ni, nj, nd);
      if (c < dist[kk]) { dist[kk] = c; prev[kk] = k; abiertos.push(kk); }
    });
  }
  const puntos = [[ax, az], [A.x, A.z]];
  const cadena = [];
  for (let k = mejorK; k >= 0; k = prev[k]) { const nodo = Math.floor(k / 5); cadena.push([linea(Math.floor(nodo / N)), linea(nodo % N)]); }
  const mismo = A.nodos.some(a => B.nodos.some(b => a[0] === b[0] && a[1] === b[1])) && B.nodos.every(b => A.nodos.some(a => a[0] === b[0] && a[1] === b[1]));
  if (!mismo) puntos.push(...cadena.reverse());
  puntos.push([B.x, B.z], [bx, bz]);
  const limpio = [];
  for (const p of puntos) { const u = limpio[limpio.length - 1]; if (!u || Math.hypot(u[0] - p[0], u[1] - p[1]) > 0.5) limpio.push(p); }
  let largo = 0;
  for (let q = 1; q < limpio.length; q++) largo += Math.hypot(limpio[q][0] - limpio[q - 1][0], limpio[q][1] - limpio[q - 1][1]);
  return { puntos: limpio, largo };
}

export class GPS {
  constructor(juego) {
    this.j = juego;
    this.destino = null;
    this.ruta = null;
    this.reloj = 0;
    const tri = new THREE.Shape();
    tri.moveTo(0, 0.9); tri.lineTo(0.85, -0.3); tri.lineTo(0.42, -0.3); tri.lineTo(0, 0.25); tri.lineTo(-0.42, -0.3); tri.lineTo(-0.85, -0.3); tri.closePath();
    const g = new THREE.ShapeGeometry(tri); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI);
    this.matFlecha = new THREE.MeshBasicMaterial({ color: '#b46bff', transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
    this.flechas = new THREE.InstancedMesh(g, this.matFlecha, 26);
    this.flechas.frustumCulled = false;
    this.flechas.count = 0;
    juego.escena.add(this.flechas);
    const haz = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 140, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#b46bff', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    haz.position.y = 70; haz.visible = false;
    juego.escena.add(haz);
    this.haz = haz;
    this._o = new THREE.Object3D();
  }

  trazar(puntos, primero = 1, color = '#3fd2ff') {
    const j = this.j;
    if (this.trazoG) { j.escena.remove(this.trazoG); this.trazoG.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose?.(); }); this.trazoG = null; }
    this.trazoPts = puntos && puntos.length ? puntos.map((p, i) => ({ x: p.x, z: p.z, n: primero + i })) : null;
    if (!this.trazoPts) return;
    const G = new THREE.Group(), geos = [], flechas = [];
    for (let i = 1; i < puntos.length; i++) {
      const a = puntos[i - 1], b = puntos[i], L = Math.hypot(b.x - a.x, b.z - a.z);
      if (L < 1) continue;
      const k = new THREE.PlaneGeometry(1.1, L).rotateX(-Math.PI / 2).rotateY(Math.atan2(b.x - a.x, b.z - a.z));
      k.translate((a.x + b.x) / 2, 0.07, (a.z + b.z) / 2);
      geos.push(k);
      for (let d = 10; d < L - 8; d += 14) {
        const f = new THREE.ShapeGeometry(this.formaGiro || (this.formaGiro = (() => { const s = new THREE.Shape(); s.moveTo(0, 1.6); s.lineTo(1.5, 0); s.lineTo(0.75, 0); s.lineTo(0.75, -1.4); s.lineTo(-0.75, -1.4); s.lineTo(-0.75, 0); s.lineTo(-1.5, 0); s.closePath(); return s; })()));
        f.rotateX(-Math.PI / 2).rotateY(Math.PI).rotateY(Math.atan2(b.x - a.x, b.z - a.z));
        f.translate(a.x + (b.x - a.x) * d / L, 0.08, a.z + (b.z - a.z) * d / L);
        flechas.push(f);
      }
    }
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    if (geos.length) G.add(new THREE.Mesh(mergeGeometries(geos), mat));
    if (flechas.length) G.add(new THREE.Mesh(mergeGeometries(flechas), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })));
    const haz = new THREE.CylinderGeometry(0.7, 0.7, 60, 10, 1, true);
    for (let i = 0; i < puntos.length; i++) {
      const p = puntos[i];
      const h = new THREE.Mesh(haz, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: Math.max(0.06, 0.32 - i * 0.03), depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      h.position.set(p.x, 30, p.z);
      G.add(h);
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = 'rgba(10,14,24,.85)'; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill();
      x.lineWidth = 8; x.strokeStyle = color; x.stroke();
      x.fillStyle = '#fff'; x.font = '900 64px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(i === puntos.length - 1 && primero + i > 1 ? 'M' : String(primero + i), 64, 68);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true, opacity: i === 0 ? 1 : 0.8 }));
      s.position.set(p.x, i === 0 ? 11 : 9, p.z); s.scale.setScalar(i === 0 ? 5 : 3.6);
      G.add(s);
    }
    this.trazoG = G;
    j.escena.add(G);
  }

  marcar(x, z) {
    this.destino = { x, z, tipo: 'propio' };
    this.reloj = 0;
    const p = this.j.jugador.posicion;
    this.ruta = ruta(p.x, p.z, x, z); this.ruta.ox = x; this.ruta.oz = z;
    this.color = '#b46bff';
    this.j.audio?.tono?.(880, 0.08, 0.12, 'sine');
    this.j.hud?.notificar('gps', 'Destino marcado', this.j.zonaDe(x, z));
  }
  quitar() { this.destino = null; this.ruta = null; }

  objetivoActivo() {
    if (this.destino) return this.destino;
    return this.j.misiones.destinoGPS() || this.j.actividades?.destinoGPS?.() || this.j.trabajos?.destinoGPS?.() || this.j.aleatorios?.destinoGPS?.() || null;
  }

  actualizar(dt) {
    const j = this.j, p = j.jugador.posicion;
    const fija = !this.destino && (j.misiones.rutaGPS?.() || j.trabajos?.rutaGPS?.());
    if (fija && fija.length) {
      this.color = '#3fd2ff';
      this.reloj -= dt;
      if (this.reloj <= 0 || !this.ruta || this.ruta.fija !== fija.length) {
        this.reloj = 0.5;
        const r = ruta(p.x, p.z, fija[0].x, fija[0].z);
        this.ruta = { puntos: r.puntos.concat(fija.slice(1).map(q => [q.x, q.z])), largo: r.largo, fija: fija.length };
      }
      this.matFlecha.color.set(this.color);
      this.pintarFlechas(p);
      return;
    }
    const obj = this.objetivoActivo();
    if (this.destino && Math.hypot(p.x - this.destino.x, p.z - this.destino.z) < 14) {
      this.quitar();
      j.hud?.notificar('gps', 'Llegaste', 'Quitamos el destino del mapa.');
      j.audio?.dinero?.();
    }
    this.haz.visible = !!this.destino;
    if (this.destino) { this.haz.position.x = this.destino.x; this.haz.position.z = this.destino.z; }
    if (!obj) { this.ruta = null; this.flechas.count = 0; return; }
    this.color = obj.tipo === 'propio' ? '#b46bff' : '#ffc94a';
    this.reloj -= dt;
    if (this.reloj <= 0 || !this.ruta || Math.hypot(this.ruta.ox - obj.x, this.ruta.oz - obj.z) > 4) {
      this.reloj = 0.6;
      this.ruta = ruta(p.x, p.z, obj.x, obj.z);
      this.ruta.ox = obj.x; this.ruta.oz = obj.z;
    }
    this.matFlecha.color.set(this.color);
    this.pintarFlechas(p);
  }

  pintarFlechas(p) {
    const j = this.j;
    this.flechas.count = 0;
    if (!j.jugador.coche || !j.ajustes.flechas) return;
    const pts = this.ruta.puntos;
    const desfase = (performance.now() / 1000 * 8) % 6;
    let resto = 8 + desfase, n = 0;
    for (let q = 1; q < pts.length && n < 26; q++) {
      const ax = pts[q - 1][0], az = pts[q - 1][1], bx = pts[q][0], bz = pts[q][1];
      const L = Math.hypot(bx - ax, bz - az);
      if (L < 0.01) continue;
      const ux = (bx - ax) / L, uz = (bz - az) / L;
      while (resto < L && n < 26) {
        const x = ax + ux * resto, z = az + uz * resto;
        const d = Math.hypot(x - p.x, z - p.z);
        if (d > 6) {
          this._o.position.set(x, 0.07, z);
          this._o.rotation.set(0, Math.atan2(ux, uz), 0);
          const k = Math.min(1, (90 - d) / 30);
          this._o.scale.setScalar(Math.max(0.01, 1.3 * Math.min(1, k)));
          this._o.updateMatrix();
          this.flechas.setMatrixAt(n++, this._o.matrix);
        }
        resto += 6;
      }
      resto -= L;
    }
    this.flechas.count = n;
    this.flechas.instanceMatrix.needsUpdate = true;
  }
}
