import * as THREE from 'three';

const base = THREE.Object3D.prototype.updateMatrixWorld;

export function dormible(g) {
  if (g.__dorm) return g;
  g.__dorm = true;
  g.updateMatrixWorld = function (f) {
    if (!this.visible) { this.__sucio = true; return; }
    if (this.__sucio) { this.__sucio = false; base.call(this, true); } else base.call(this, f);
  };
  return g;
}

export function dormirQuieto(g, valores, n = 12) {
  const prev = new Float64Array(n).fill(1e9), act = new Float64Array(n);
  let quieto = 0;
  g.__dorm = true;
  g.updateMatrixWorld = function (f) {
    if (!this.visible) { this.__sucio = true; return; }
    valores(act);
    let igual = !this.__sucio && !f;
    if (igual) for (let i = 0; i < n; i++) if (Math.abs(act[i] - prev[i]) > 2e-4) { igual = false; break; }
    if (igual) { if (quieto > 3) return; quieto++; } else { quieto = 0; prev.set(act); }
    const forzar = this.__sucio; this.__sucio = false;
    base.call(this, f || forzar);
  };
  return g;
}

export function despertar(g) { if (g) g.__sucio = true; }

export function acelerarMatrices() {
  const P = THREE.Object3D.prototype;
  if (P.__rapida) return;
  P.__rapida = true;
  P.updateMatrix = function () {
    const p = this.position, q = this.quaternion, s = this.scale;
    let c = this.__m;
    if (c === undefined) c = this.__m = new Float32Array(10).fill(NaN);
    const a = Math.fround(p.x), b = Math.fround(p.y), d = Math.fround(p.z), e = Math.fround(q.x), f = Math.fround(q.y), g = Math.fround(q.z), h = Math.fround(q.w), i = Math.fround(s.x), k = Math.fround(s.y), l = Math.fround(s.z);
    if (c[0] === a && c[1] === b && c[2] === d && c[3] === e && c[4] === f && c[5] === g && c[6] === h && c[7] === i && c[8] === k && c[9] === l) return;
    c[0] = a; c[1] = b; c[2] = d; c[3] = e; c[4] = f; c[5] = g; c[6] = h; c[7] = i; c[8] = k; c[9] = l;
    this.matrix.compose(p, q, s);
    this.matrixWorldNeedsUpdate = true;
  };
}

export const NIVELES = [3, 2, 1, 0, -1];
export const PERFILES = {
  3: { nombre: 'Ultra', sombra: 4096, pr: 1.5, resMin: 0.7, peatones: 1, trafico: 1, lejos: 66, realistas: 18, rangoReal: 52, finos: 60, entorno: true, alcance: 1 },
  2: { nombre: 'Alta', sombra: 4096, pr: 1.5, resMin: 0.66, peatones: 1, trafico: 1, lejos: 60, realistas: 16, rangoReal: 50, finos: 60, entorno: true, alcance: 1 },
  1: { nombre: 'Media', sombra: 2048, pr: 1.25, resMin: 0.62, peatones: 0.9, trafico: 0.9, lejos: 50, realistas: 12, rangoReal: 42, finos: 50, entorno: true, alcance: 0.9 },
  0: { nombre: 'Rápida', sombra: 0, pr: 0.85, resMin: 0.6, peatones: 0.72, trafico: 0.75, lejos: 36, realistas: 7, rangoReal: 30, finos: 38, entorno: true, alcance: 0.75 },
  '-1': { nombre: 'Mínima', sombra: 0, pr: 0.62, resMin: 0.5, peatones: 0.46, trafico: 0.5, lejos: 24, realistas: 4, rangoReal: 20, finos: 26, entorno: false, alcance: 0.55 }
};

export function perfil(n) { return PERFILES[n] || PERFILES[3]; }

export function gpu() {
  try {
    const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return '';
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    const r = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(r || '');
  } catch (e) { return ''; }
}

export function nivelSugerido() {
  const g = gpu(), nucleos = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8;
  let n = 2;
  if (/Apple M\d|RTX|GTX 1[0-9]{3}|GTX 9[5-9]0|Radeon RX|Radeon Pro [5-9]|Arc\b/i.test(g)) n = 3;
  else if (/SwiftShader|llvmpipe|Software|Basic Render/i.test(g)) n = -1;
  else if (/Intel/i.test(g)) n = /Iris (Xe|Plus|Pro)|UHD (Graphics )?(6[2-9]\d|7\d\d)/i.test(g) ? 1 : /HD Graphics [2-5]\d{3}|HD Graphics(?! \d)|GMA|[^U]HD (Graphics )?[2-4]\d{3}/i.test(g) ? -1 : 0;
  else if (/GeForce (GT|[1-9]\d{2}M|MX)|Radeon (HD|R[5-7])|Mali|Adreno|PowerVR/i.test(g)) n = 0;
  if (nucleos <= 2) n = Math.min(n, -1); else if (nucleos <= 4) n = Math.min(n, 1);
  if (mem <= 2) n = Math.min(n, -1); else if (mem <= 4) n = Math.min(n, 0);
  return n;
}

export function nivelInicial(ajustes) {
  if (ajustes.calidad !== 'auto') return +ajustes.calidad;
  let g = null;
  try { g = JSON.parse(localStorage.getItem('perla_nivel') || 'null'); } catch (e) { }
  if (g && Number.isFinite(g.n)) return Math.max(-1, Math.min(3, g.n));
  return nivelSugerido();
}

export class Gobernador {
  constructor(juego) { this.j = juego; this.cuadros = 0; this.tiempo = 0; this.lentos = 0; this.rapidos = 0; this.gracia = 10; this.tope = 3; this.subidas = 0; }

  guardar() { try { localStorage.setItem('perla_nivel', JSON.stringify({ n: this.j.nivel, t: Date.now() })); } catch (e) { } }

  cambiar(n, motivo) {
    const j = this.j;
    n = Math.max(-1, Math.min(3, n));
    if (n === j.nivel) return;
    const baja = n < j.nivel;
    j.nivel = n; j.aplicarAjustes(); this.guardar(); this.gracia = 6; this.lentos = this.rapidos = 0;
    j.hud?.notificar('info', baja ? 'Calidad ajustada' : 'Calidad mejorada', `${perfil(n).nombre}: ${motivo}`, 4);
  }

  actualizar(real) {
    const j = this.j;
    if (j.ajustes.calidad !== 'auto' || (navigator.webdriver && !this.prueba) || !j.jugando || j.pausado || j.overlay || j.foto || document.hidden) { this.cuadros = this.tiempo = 0; return; }
    if (real > 0.5) { this.cuadros = this.tiempo = 0; this.gracia = Math.max(this.gracia, 3); return; }
    if (this.gracia > 0) { this.gracia -= real; this.cuadros = this.tiempo = 0; return; }
    this.cuadros++; this.tiempo += real;
    if (this.tiempo < 2) return;
    const fps = this.cuadros / this.tiempo; this.cuadros = 0; this.tiempo = 0;
    const alMinimo = !j.resDin || j.resDin.factor <= j.resDin.min + 0.01 || j.nivel < 1;
    if (fps < 38 && alMinimo) { this.lentos++; this.rapidos = 0; } else if (fps < 30) { this.lentos++; this.rapidos = 0; } else if (fps > 57 && (!j.resDin || j.resDin.factor >= 0.99)) { this.rapidos++; this.lentos = 0; } else { this.lentos = Math.max(0, this.lentos - 1); this.rapidos = 0; }
    if (this.lentos >= 3 && j.nivel > -1) { this.tope = j.nivel - 1; this.cambiar(j.nivel - 1, 'bajé detalles para que el juego vaya fluido.'); }
    else if (this.rapidos >= 20 && j.nivel < this.tope && this.subidas < 4) { this.subidas++; this.cambiar(j.nivel + 1, 'tu equipo aguanta más, subí los detalles.'); }
  }
}

const _m = new THREE.Matrix4(), _v = new THREE.Vector3();

export function trocear(im, tam = 170) {
  const celdas = new Map(), n = im.count, padre = im.parent;
  for (let i = 0; i < n; i++) { im.getMatrixAt(i, _m); _v.setFromMatrixPosition(_m); const k = Math.floor(_v.x / tam) + ',' + Math.floor(_v.z / tam); let L = celdas.get(k); if (!L) celdas.set(k, L = []); L.push(i); }
  const inst = Object.entries(im.geometry.attributes).filter(([, a]) => a.isInstancedBufferAttribute);
  const partes = [];
  for (const L of celdas.values()) {
    let geo = im.geometry;
    if (inst.length) {
      geo = new THREE.BufferGeometry(); geo.index = im.geometry.index; geo.groups = im.geometry.groups;
      for (const [k, a] of Object.entries(im.geometry.attributes)) {
        if (!a.isInstancedBufferAttribute) { geo.setAttribute(k, a); continue; }
        const s = a.itemSize, arr = new a.array.constructor(L.length * s);
        for (let q = 0; q < L.length; q++) for (let c = 0; c < s; c++) arr[q * s + c] = a.array[L[q] * s + c];
        geo.setAttribute(k, new THREE.InstancedBufferAttribute(arr, s, a.normalized, a.meshPerAttribute));
      }
    }
    const p = new THREE.InstancedMesh(geo, im.material, L.length);
    for (let q = 0; q < L.length; q++) { im.getMatrixAt(L[q], _m); p.setMatrixAt(q, _m); }
    if (im.instanceColor) { const c = new THREE.Color(); for (let q = 0; q < L.length; q++) { im.getColorAt(L[q], c); p.setColorAt(q, c); } }
    p.castShadow = im.castShadow; p.receiveShadow = im.receiveShadow; p.renderOrder = im.renderOrder; p.visible = im.visible; p.name = im.name; p.userData = im.userData;
    p.customDepthMaterial = im.customDepthMaterial; p.customDistanceMaterial = im.customDistanceMaterial;
    p.matrixAutoUpdate = false; p.position.copy(im.position); p.updateMatrix();
    if (!im.geometry.boundingSphere) im.geometry.computeBoundingSphere();
    if (geo !== im.geometry) { geo.boundingSphere = im.geometry.boundingSphere; geo.boundingBox = im.geometry.boundingBox; }
    p.computeBoundingSphere();
    partes.push(p);
  }
  if (padre) { padre.remove(im); for (const p of partes) padre.add(p); }
  return partes;
}

export function trocearMalla(malla, tam = 220) {
  let g = malla.geometry; if (g.index) g = g.toNonIndexed();
  const pos = g.attributes.position, nt = pos.count / 3, celdas = new Map();
  for (let t = 0; t < nt; t++) { const x = (pos.getX(t * 3) + pos.getX(t * 3 + 1) + pos.getX(t * 3 + 2)) / 3, z = (pos.getZ(t * 3) + pos.getZ(t * 3 + 1) + pos.getZ(t * 3 + 2)) / 3, k = Math.floor(x / tam) + ',' + Math.floor(z / tam); let L = celdas.get(k); if (!L) celdas.set(k, L = []); L.push(t); }
  const partes = [], padre = malla.parent;
  for (const L of celdas.values()) {
    const ng = new THREE.BufferGeometry();
    for (const [k, a] of Object.entries(g.attributes)) { const s = a.itemSize, arr = new a.array.constructor(L.length * 3 * s); for (let q = 0; q < L.length; q++) arr.set(a.array.subarray(L[q] * 3 * s, (L[q] + 1) * 3 * s), q * 3 * s); ng.setAttribute(k, new THREE.BufferAttribute(arr, s, a.normalized)); }
    ng.computeBoundingSphere();
    const p = new THREE.Mesh(ng, malla.material);
    p.castShadow = malla.castShadow; p.receiveShadow = malla.receiveShadow; p.renderOrder = malla.renderOrder; p.name = malla.name; p.matrixAutoUpdate = false; p.position.copy(malla.position); p.rotation.copy(malla.rotation); p.scale.copy(malla.scale); p.updateMatrix();
    partes.push(p);
  }
  if (padre) { padre.remove(malla); for (const p of partes) padre.add(p); }
  malla.geometry.dispose();
  return partes;
}

const PEND = [];
export function lejos(objs, dist, opc) { PEND.push([objs, dist, opc]); return objs; }

export class Alcance {
  constructor(juego) { this.j = juego; this.lista = []; this.t = 0; this.i = 0; this.s = new THREE.Sphere(); }

  registrar(objs, dist, opc = {}) {
    for (const o of [].concat(objs)) {
      if (!o) continue;
      let c, r;
      if (opc.centro) { c = new THREE.Vector3(opc.centro.x, opc.centro.y || 0, opc.centro.z); r = opc.radio || 0; }
      else {
        o.updateMatrixWorld(true);
        if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); this.s.copy(o.boundingSphere).applyMatrix4(o.matrixWorld); }
        else if (o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); this.s.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); }
        else { const b = new THREE.Box3().setFromObject(o); b.getBoundingSphere(this.s); }
        c = this.s.center.clone(); r = this.s.radius;
      }
      this.lista.push({ o, c, r, dist, fijo: !!opc.fijo, si: opc.si || null, quiso: true });
    }
  }

  actualizar(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.3;
    while (PEND.length) this.registrar(...PEND.shift());
    const j = this.j, cam = j.camara.position, k = j.perfil?.alcance ?? 1, alto = Math.max(0, cam.y - 30) * 1.6;
    for (const e of this.lista) {
      const d = Math.hypot(e.c.x - cam.x, e.c.z - cam.z) - e.r;
      const v = d < (e.fijo ? e.dist : e.dist * k) + alto && (!e.si || e.si());
      if (e.o.visible !== v) e.o.visible = v;
    }
  }
}

export function liberar(g) {
  g.traverse(o => {
    if (!o.isMesh && !o.isLine && !o.isPoints && !o.isSprite) return;
    o.geometry?.dispose?.();
    for (const m of [].concat(o.material || [])) m.dispose?.();
  });
}
