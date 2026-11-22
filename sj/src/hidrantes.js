import * as THREE from 'three';

function texGota() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(230,242,255,0.7)'); gr.addColorStop(1, 'rgba(220,235,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function texMojado() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(10,14,20,0.7)'); gr.addColorStop(0.7, 'rgba(10,14,20,0.45)'); gr.addColorStop(1, 'rgba(10,14,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const N = 320;

export class Hidrantes {
  constructor(juego) {
    this.j = juego;
    this.lista = (juego.mobiliario?.hidrantesLista || []).map((h, i) => ({ ...h, i, roto: false, chorro: 0, repara: 0 }));
    this.malla = juego.mobiliario?.mallaHidrantes;
    this.celdas = new Map();
    for (const h of this.lista) { const k = Math.floor(h.x / 12) + ',' + Math.floor(h.z / 12); if (!this.celdas.has(k)) this.celdas.set(k, []); this.celdas.get(k).push(h); }
    this.matGota = new THREE.PointsMaterial({ map: texGota(), size: 0.32, transparent: true, depthWrite: false, color: '#dceeff', opacity: 0.85 });
    this.matMojado = new THREE.MeshBasicMaterial({ map: texMojado(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    this.chorros = [];
    for (let k = 0; k < 3; k++) {
      const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, this.matGota); pts.frustumCulled = false; pts.visible = false; juego.escena.add(pts);
      const charco = new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), this.matMojado); charco.visible = false; juego.escena.add(charco);
      this.chorros.push({ pts, charco, vel: new Float32Array(N * 3), vida: new Float32Array(N), h: null, ruido: 0 });
    }
    this._m = new THREE.Matrix4(); this._v = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
  }

  cerca(x, z) {
    const out = [];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const l = this.celdas.get((Math.floor(x / 12) + dx) + ',' + (Math.floor(z / 12) + dz)); if (l) out.push(...l); }
    return out;
  }

  escalar(h, y) {
    if (!this.malla) return;
    this._v.set(h.x, 0, h.z); this._q.identity(); this._s.set(1, y, 1);
    this._m.compose(this._v, this._q, this._s); this.malla.setMatrixAt(h.i, this._m); this.malla.instanceMatrix.needsUpdate = true;
  }

  romper(h, c) {
    if (h.roto) return;
    h.roto = true; h.chorro = 24; h.repara = 0;
    this.escalar(h, 0.22);
    let ch = this.chorros.find(q => !q.h) || this.chorros.reduce((a, b) => (a.h.chorro < b.h.chorro ? a : b));
    if (ch.h) ch.h.chorro = 0;
    ch.h = h; ch.pts.visible = true; ch.charco.visible = true; ch.charco.position.set(h.x, 0.03, h.z); ch.charco.scale.setScalar(0.5);
    ch.vida.fill(0);
    const a = this.j.audio; a?.ruidoCorto(0.5, 900, 0.5 * (a.dist?.(c.pos) ?? 1)); a?.tono(200, 0.15, 0.2 * (a.dist?.(c.pos) ?? 1), 'triangle');
    if (c === this.j.jugador.coche) { this.j.sacudida = Math.max(this.j.sacudida || 0, 0.2); this.j.estadisticas?.sumar?.('hidrantes', 1); }
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    for (const c of j.coches) {
      if (c.quemado || c.tipo === 'lancha' || Math.abs(c.vel || 0) < 4) continue;
      if (Math.abs(c.pos.x - jp.x) > 140 || Math.abs(c.pos.z - jp.z) > 140) continue;
      const fx = c.fx ?? Math.sin(c.yaw), fz = c.fz ?? Math.cos(c.yaw), L = c.t.largo / 2 + 0.38, A = c.t.ancho / 2 + 0.32;
      for (const h of this.cerca(c.pos.x, c.pos.z)) {
        if (h.roto) continue;
        const dx = h.x - c.pos.x, dz = h.z - c.pos.z;
        if (Math.abs(dx * fx + dz * fz) < L && Math.abs(dx * fz - dz * fx) < A) this.romper(h, c);
      }
    }
    for (const ch of this.chorros) {
      const h = ch.h; if (!h) continue;
      h.chorro -= dt;
      const activo = h.chorro > 0, fuerza = Math.min(1, h.chorro / 4);
      const P = ch.pts.geometry.attributes.position, p = P.array, v = ch.vel, vida = ch.vida;
      let vivos = 0;
      for (let i = 0; i < N; i++) {
        if (vida[i] <= 0) {
          if (!activo || Math.random() > 0.35) { p[i * 3 + 1] = -50; continue; }
          const a = Math.random() * 6.283, r = Math.random() * 0.9;
          p[i * 3] = h.x + (Math.random() - 0.5) * 0.12; p[i * 3 + 1] = 0.6; p[i * 3 + 2] = h.z + (Math.random() - 0.5) * 0.12;
          v[i * 3] = Math.cos(a) * r; v[i * 3 + 1] = (8.5 + Math.random() * 3) * (0.55 + fuerza * 0.45); v[i * 3 + 2] = Math.sin(a) * r;
          vida[i] = 1.6 + Math.random() * 0.6;
        }
        vida[i] -= dt; vivos++;
        v[i * 3 + 1] -= 13 * dt;
        p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
        if (p[i * 3 + 1] < 0.05) { if (Math.random() < 0.5) { p[i * 3 + 1] = 0.05; v[i * 3 + 1] = Math.abs(v[i * 3 + 1]) * 0.2; v[i * 3] *= 1.8; v[i * 3 + 2] *= 1.8; } else vida[i] = 0; }
      }
      P.needsUpdate = true;
      ch.charco.scale.setScalar(Math.min(3.6, ch.charco.scale.x + dt * (activo ? 0.35 : -0.05)));
      if (activo) {
        for (const c of j.coches) if (!c.quemado && Math.hypot(c.pos.x - h.x, c.pos.z - h.z) < 1.4) { c.alturaV = (c.alturaV || 0) + 9 * dt * fuerza; c.cabV = (c.cabV || 0) + (Math.random() - 0.5) * 4 * dt; }
        ch.ruido -= dt;
        const d = Math.hypot(jp.x - h.x, jp.z - h.z);
        if (ch.ruido <= 0 && d < 60) { ch.ruido = 0.28; j.audio?.ruidoCorto(0.45, 2600, 0.12 * (1 - d / 60) * fuerza, 'bandpass', 0.6); }
      }
      if (!activo && vivos === 0) { ch.pts.visible = false; ch.h = null; ch.charco.visible = false; }
    }
    for (const h of this.lista) {
      if (!h.roto || h.chorro > 0) continue;
      h.repara += dt;
      if (h.repara > 60 && Math.hypot(jp.x - h.x, jp.z - h.z) > 150) { h.roto = false; this.escalar(h, 1); }
    }
  }
}
