import * as THREE from 'three';

function texHumo() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Vapor {
  constructor(juego) {
    this.j = juego;
    this.fuentes = (juego.ambulantes?.puestos || []).map(q => ({ x: q.x, y: 1.25, z: q.z - 0.85 }));
    this.porFuente = 18;
    const n = Math.max(1, this.fuentes.length * this.porFuente);
    this.pos = new Float32Array(n * 3); this.vida = new Float32Array(n); this.tam = new Float32Array(n);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('tam', new THREE.BufferAttribute(this.tam, 1));
    const mat = new THREE.PointsMaterial({ map: texHumo(), size: 1, transparent: true, depthWrite: false, color: '#f4f1ea', opacity: 0.55 });
    mat.onBeforeCompile = sh => { sh.vertexShader = 'attribute float tam;\n' + sh.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * tam;'); };
    this.pts = new THREE.Points(geo, mat); this.pts.frustumCulled = false; juego.escena.add(this.pts);
    for (let i = 0; i < n; i++) this.vida[i] = Math.random() * 2.4;
  }

  actualizar(dt) {
    if (!this.fuentes.length) return;
    const jp = this.j.jugador.posicion, P = this.pts.geometry.attributes;
    for (let f = 0; f < this.fuentes.length; f++) {
      const F = this.fuentes[f], cerca = Math.abs(F.x - jp.x) < 90 && Math.abs(F.z - jp.z) < 90;
      for (let k = 0; k < this.porFuente; k++) {
        const i = f * this.porFuente + k;
        this.vida[i] += dt;
        if (this.vida[i] > 2.4) { this.vida[i] = 0; this.pos[i * 3] = F.x + (Math.random() - 0.5) * 0.25; this.pos[i * 3 + 1] = F.y; this.pos[i * 3 + 2] = F.z + (Math.random() - 0.5) * 0.25; }
        const t = this.vida[i];
        this.pos[i * 3] += (0.18 + Math.sin(t * 3 + i) * 0.12) * dt; this.pos[i * 3 + 1] += (0.75 - t * 0.12) * dt; this.pos[i * 3 + 2] += Math.cos(t * 2.4 + i) * 0.1 * dt;
        this.tam[i] = cerca ? (0.35 + t * 0.6) * Math.min(1, t * 3) * Math.max(0, 1 - t / 2.4) : 0;
      }
    }
    P.position.needsUpdate = true; P.tam.needsUpdate = true;
  }
}

export class Aves {
  constructor(juego) {
    this.j = juego;
    const ala = new THREE.BufferGeometry();
    ala.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.18, -0.55, 0, -0.1, 0, 0, -0.12, 0, 0, 0.18, 0, 0, -0.12, 0.55, 0, -0.1], 3));
    ala.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color: '#2a2622', side: THREE.DoubleSide });
    this.tiempo = { value: 0 };
    mat.onBeforeCompile = sh => {
      sh.uniforms.tiempo = this.tiempo;
      sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float fa = sin(tiempo * 11.0 + float(gl_InstanceID) * 1.7);\n  transformed.y += abs(position.x) * fa * 0.9;');
    };
    this.bandadas = [];
    const total = 3 * 14;
    this.malla = new THREE.InstancedMesh(ala, mat, total); this.malla.frustumCulled = false; juego.escena.add(this.malla);
    for (let b = 0; b < 3; b++) {
      const aves = [];
      for (let k = 0; k < 14; k++) aves.push({ o: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 14), f: Math.random() * 6 });
      this.bandadas.push({ c: new THREE.Vector3((Math.random() - 0.5) * 500, 55 + b * 12, (Math.random() - 0.5) * 500), a: Math.random() * 6.28, r: 120 + Math.random() * 160, w: (0.04 + Math.random() * 0.04) * (Math.random() < 0.5 ? -1 : 1), aves });
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(2.2, 2.2, 2.2); this._e = new THREE.Euler();
  }

  actualizar(dt, noche) {
    this.tiempo.value += dt;
    this.malla.visible = noche < 0.55;
    if (!this.malla.visible) return;
    let n = 0;
    for (const B of this.bandadas) {
      B.a += B.w * dt;
      const cx = B.c.x + Math.cos(B.a) * B.r, cz = B.c.z + Math.sin(B.a) * B.r, rumbo = B.a + (B.w > 0 ? Math.PI / 2 : -Math.PI / 2);
      for (const A of B.aves) {
        A.f += dt;
        this._v.set(cx + A.o.x + Math.sin(A.f * 0.7) * 2, B.c.y + A.o.y + Math.sin(A.f * 1.3) * 1.2, cz + A.o.z + Math.cos(A.f * 0.6) * 2);
        this._e.set(0, Math.atan2(Math.cos(rumbo), -Math.sin(rumbo)) + Math.PI / 2, Math.sin(A.f) * 0.2);
        this._q.setFromEuler(this._e); this._m.compose(this._v, this._q, this._s); this.malla.setMatrixAt(n++, this._m);
      }
    }
    this.malla.instanceMatrix.needsUpdate = true;
  }
}

export class Salpicaduras {
  constructor(juego) {
    this.j = juego; this.n = 500;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.strokeStyle = 'rgba(235,242,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(32, 40, 18, 7, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(235,242,255,0.85)'; for (let k = 0; k < 6; k++) { const a = Math.PI + k / 5 * Math.PI; g.beginPath(); g.arc(32 + Math.cos(a) * 14, 34 + Math.sin(a) * 16, 2.4, 0, 7); g.fill(); }
    this.pos = new Float32Array(this.n * 3); this.vida = new Float32Array(this.n); this.tam = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) { this.vida[i] = Math.random() * 0.3; this.pos[i * 3 + 1] = -50; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('tam', new THREE.BufferAttribute(this.tam, 1));
    const mat = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 1, transparent: true, depthWrite: false, opacity: 0.7 });
    mat.onBeforeCompile = sh => { sh.vertexShader = 'attribute float tam;\n' + sh.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * tam;'); };
    this.pts = new THREE.Points(geo, mat); this.pts.frustumCulled = false; juego.escena.add(this.pts);
  }

  actualizar(dt, lluvia, camara) {
    const on = lluvia > 0.12 && !this.j.jugador.interior;
    this.pts.visible = on; if (!on || !camara) return;
    const bl = this.j.ciudad.bloques, cp = camara.position;
    const activos = Math.floor(this.n * Math.min(1, lluvia));
    for (let i = 0; i < this.n; i++) {
      this.vida[i] -= dt;
      if (this.vida[i] <= 0) {
        this.vida[i] = 0.18 + Math.random() * 0.14;
        if (i >= activos) { this.pos[i * 3 + 1] = -50; continue; }
        const a = Math.random() * 6.283, r = 1.5 + Math.sqrt(Math.random()) * 24;
        const x = cp.x + Math.cos(a) * r, z = cp.z + Math.sin(a) * r;
        const y = bl.some(B => x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1) ? 0.17 : 0.03;
        this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      }
      const t = 1 - this.vida[i] / 0.32;
      this.tam[i] = 0.12 + t * 0.28;
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.tam.needsUpdate = true;
  }
}

export class Granizo {
  constructor(juego) {
    this.j = juego; this.n = 900; this.activo = 0; this.blanco = 0; this.ruido = 0; this.yaDecidido = false;
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(235,242,250,0.9)'); gr.addColorStop(1, 'rgba(235,242,250,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    this.pos = new Float32Array(this.n * 3); this.vel = new Float32Array(this.n * 3);
    for (let i = 0; i < this.n; i++) this.pos[i * 3 + 1] = -50;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.09, transparent: true, depthWrite: false, color: '#f2f6fa' }));
    this.pts.frustumCulled = false; this.pts.visible = false; juego.escena.add(this.pts);
  }

  actualizar(dt, camara) {
    const j = this.j, A = j.ambiente, ms = j.ciudad.matsSuelo;
    if (A.lluvia > 0.55 && !this.yaDecidido) { this.yaDecidido = true; if (Math.random() < 0.35 || this.forzar) { this.activo = 40 + Math.random() * 30; this.forzar = false; j.hud?.notificar?.('info', '¡Granizada!', 'Busca techo, que pega duro.', 3.5); } }
    if (A.lluvia < 0.2) this.yaDecidido = false;
    if (this.activo > 0) this.activo -= dt;
    const on = this.activo > 0 && !j.jugador.interior;
    this.blanco = Math.max(0, Math.min(1, this.blanco + (on ? dt / 25 : -dt / 90)));
    if (ms) {
      const luz = this.blanco * (1 - (A.noche || 0) * 0.7);
      ms[0].color.lerp(new THREE.Color(0.95, 0.96, 0.98), this.blanco * 0.82); ms[0].emissive?.setRGB(0.4, 0.42, 0.45).multiplyScalar(luz); ms[0].roughness = Math.max(ms[0].roughness, 0.3 + this.blanco * 0.6);
      if (ms[1]) { ms[1].color.lerp(new THREE.Color(0.96, 0.97, 0.99), this.blanco * 0.75); ms[1].emissive?.setRGB(0.3, 0.31, 0.33).multiplyScalar(luz); }
    }
    this.pts.visible = on; if (!on || !camara) return;
    const cp = camara.position, p = this.pos, v = this.vel;
    for (let i = 0; i < this.n; i++) {
      if (p[i * 3 + 1] < -1 || Math.abs(p[i * 3] - cp.x) > 26 || Math.abs(p[i * 3 + 2] - cp.z) > 26) {
        p[i * 3] = cp.x + (Math.random() - 0.5) * 50; p[i * 3 + 1] = cp.y + 6 + Math.random() * 14; p[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 50;
        v[i * 3] = (Math.random() - 0.5) * 0.6; v[i * 3 + 1] = -14 - Math.random() * 5; v[i * 3 + 2] = (Math.random() - 0.5) * 0.6; continue;
      }
      v[i * 3 + 1] -= 9.8 * dt;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      if (p[i * 3 + 1] < 0.18 && v[i * 3 + 1] < 0) { if (Math.abs(v[i * 3 + 1]) > 3) { v[i * 3 + 1] = -v[i * 3 + 1] * 0.25; v[i * 3] += (Math.random() - 0.5) * 1.5; v[i * 3 + 2] += (Math.random() - 0.5) * 1.5; p[i * 3 + 1] = 0.18; } else { v[i * 3 + 1] = 0; v[i * 3] *= 0.9; v[i * 3 + 2] *= 0.9; p[i * 3 + 1] = 0.18 - (Math.random() < 0.02 ? 2 : 0); } }
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
    this.ruido -= dt;
    if (this.ruido <= 0) { this.ruido = 0.07; j.audio?.ruidoCorto(0.05, 3500 + Math.random() * 2500, 0.05, 'highpass', 1.2); }
  }
}
