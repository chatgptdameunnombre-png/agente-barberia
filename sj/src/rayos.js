import * as THREE from 'three';

function trazo(a, b, desv, nivel, ancho, out) {
  if (nivel === 0) { out.push([a.clone(), b.clone(), ancho]); return; }
  const m = a.clone().lerp(b, 0.45 + Math.random() * 0.1);
  m.x += (Math.random() - 0.5) * desv; m.z += (Math.random() - 0.5) * desv;
  trazo(a, m, desv / 2, nivel - 1, ancho, out); trazo(m, b, desv / 2, nivel - 1, ancho, out);
  if (nivel > 2 && Math.random() < 0.3) { const r = m.clone().add(new THREE.Vector3((Math.random() - 0.5) * desv * 1.8, -30 - Math.random() * 60, (Math.random() - 0.5) * desv * 1.8)); trazo(m, r, desv / 2.5, nivel - 2, ancho * 0.5, out); }
}

export class Rayos {
  constructor(juego) {
    this.j = juego; this.ultimo = 0; this.max = 400;
    this.mat = new THREE.MeshBasicMaterial({ color: '#f2f5ff', transparent: true, opacity: 0, fog: false, toneMapped: false, depthWrite: false });
    this.malla = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), this.mat, this.max);
    this.malla.frustumCulled = false; this.malla.visible = false; this.malla.count = 0; juego.escena.add(this.malla);
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(220,228,255,0.9)'); gr.addColorStop(0.4, 'rgba(200,210,255,0.35)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, fog: false, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.halo.visible = false; juego.escena.add(this.halo);
    this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._m = new THREE.Matrix4(); this._y = new THREE.Vector3(0, 1, 0);
  }

  disparar() {
    const j = this.j, cp = j.camara.position, a = Math.random() * Math.PI * 2, d = 380 + Math.random() * 380;
    const x = cp.x + Math.cos(a) * d, z = cp.z + Math.sin(a) * d;
    const segs = []; trazo(new THREE.Vector3(x, 330, z), new THREE.Vector3(x + (Math.random() - 0.5) * 60, 0, z + (Math.random() - 0.5) * 60), 90, 6, 2.6, segs);
    let n = 0;
    for (const [p, q, w] of segs) {
      if (n >= this.max) break;
      const dir = q.clone().sub(p), L = dir.length(); if (L < 0.01) continue;
      this._q.setFromUnitVectors(this._y, dir.normalize()); this._s.set(w, L, w);
      this._m.compose(p, this._q, this._s); this.malla.setMatrixAt(n++, this._m);
    }
    this.malla.count = n; this.malla.instanceMatrix.needsUpdate = true;
    this.t = 0; this.malla.visible = true;
    this.halo.position.set(x, 200, z); this.halo.scale.set(420, 420, 1); this.halo.visible = true;
  }

  actualizar(dt) {
    const A = this.j.ambiente;
    if (A.relampago > 0.3 && this.ultimo <= 0.3) this.disparar();
    this.ultimo = A.relampago;
    if (!this.malla.visible) return;
    this.t += dt;
    const k = this.t < 0.08 ? 1 : this.t < 0.14 ? 0.15 : this.t < 0.22 ? 0.9 : Math.max(0, 1 - (this.t - 0.22) / 0.25);
    this.mat.opacity = k; this.halo.material.opacity = k * 0.5;
    if (this.t > 0.5) { this.malla.visible = false; this.halo.visible = false; }
  }
}
