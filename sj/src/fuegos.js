import * as THREE from 'three';

function texChispa() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const COLORES = ['#ff3d8b', '#ffd23a', '#3bd1ff', '#7a3ab0', '#3bff8a', '#ff7a1a', '#ffffff', '#ff2a2a'];
const N = 140;

export class Fuegos {
  constructor(juego) {
    this.j = juego;
    this.tex = texChispa();
    this.cohetes = [];
    for (let k = 0; k < 6; k++) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const mat = new THREE.PointsMaterial({ map: this.tex, size: 1.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffffff', toneMapped: false, fog: false });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; juego.escena.add(pts);
      this.cohetes.push({ pts, mat, vel: new Float32Array(N * 3), fase: 'libre', t: 0, x: 0, y: 0, z: 0, h: 0 });
    }
    this.gol = 30 + Math.random() * 30; this.ruido = 0; this.pendientes = [];
  }

  lanzar(x, z, retraso = 0) { this.pendientes.push({ x, z, t: retraso }); }

  disparar(x, z) {
    const c = this.cohetes.find(q => q.fase === 'libre'); if (!c) return;
    c.fase = 'sube'; c.t = 0; c.x = x; c.z = z; c.y = 8; c.h = 55 + Math.random() * 35;
    c.mat.color.set(COLORES[Math.random() * COLORES.length | 0]); c.mat.opacity = 1; c.mat.size = 1.1;
    const p = c.pts.geometry.attributes.position.array;
    for (let i = 0; i < N; i++) { p[i * 3] = x; p[i * 3 + 1] = -100; p[i * 3 + 2] = z; }
    c.pts.visible = true;
    const a = this.j.audio, v = a?.dist ? a.dist({ x, z }) : 0;
    a?.tono(500, 1.0, 0.06 * v + 0.01, 'sine', null, null, 1400);
  }

  actualizar(dt, noche) {
    const j = this.j, E = j.ciudad.estadio?.grupo?.position, h = j.ambiente.hora ?? 12;
    const partido = E && noche > 0.5 && h > 19.5 && h < 23.5;
    const jp = j.jugador.posicion;
    if (partido) {
      const d = Math.hypot(jp.x - E.x, jp.z - E.z);
      this.ruido -= dt;
      if (d < 220 && this.ruido <= 0) { this.ruido = 0.35; const v = Math.max(0, 1 - d / 220) ** 1.4; j.audio?.ruidoCorto(0.8, 700 + Math.random() * 500, 0.07 * v, 'bandpass', 0.7); }
      this.gol -= dt;
      if (this.gol <= 0) {
        this.gol = 45 + Math.random() * 60;
        if (d < 320) { const v = Math.max(0, 1 - d / 320); j.audio?.ruidoCorto(3.2, 900, 0.35 * v, 'bandpass', 0.5); j.audio?.ruidoCorto(2.4, 1600, 0.2 * v, 'bandpass', 0.6); }
        for (let k = 0; k < 5; k++) this.lanzar(E.x + (Math.random() - 0.5) * 50, E.z + (Math.random() - 0.5) * 50, 0.6 + k * 0.45 + Math.random() * 0.3);
      }
    }
    for (let i = this.pendientes.length - 1; i >= 0; i--) { const q = this.pendientes[i]; q.t -= dt; if (q.t <= 0) { this.disparar(q.x, q.z); this.pendientes.splice(i, 1); } }
    for (const c of this.cohetes) {
      if (c.fase === 'libre') continue;
      c.t += dt;
      const P = c.pts.geometry.attributes.position, p = P.array, v = c.vel;
      if (c.fase === 'sube') {
        c.y += 48 * dt;
        for (let i = 0; i < 12; i++) { p[i * 3] = c.x + (Math.random() - 0.5) * 0.3; p[i * 3 + 1] = c.y - i * 0.9; p[i * 3 + 2] = c.z + (Math.random() - 0.5) * 0.3; }
        if (c.y >= c.h) {
          c.fase = 'estalla'; c.t = 0; c.mat.size = 2.6;
          for (let i = 0; i < N; i++) {
            const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u), r = 21 + Math.random() * 6;
            v[i * 3] = s * Math.cos(a) * r; v[i * 3 + 1] = u * r; v[i * 3 + 2] = s * Math.sin(a) * r;
            p[i * 3] = c.x; p[i * 3 + 1] = c.y; p[i * 3 + 2] = c.z;
          }
          const au = j.audio, d = Math.hypot(jp.x - c.x, jp.z - c.z), vol = Math.max(0, 1 - d / 500);
          au?.ruidoCorto(0.6, 260, 0.5 * vol * vol + 0.02); au?.ruidoCorto(0.9, 3000, 0.08 * vol, 'highpass');
        }
      } else {
        const arr = Math.exp(-1.6 * dt);
        for (let i = 0; i < N; i++) {
          v[i * 3] *= arr; v[i * 3 + 1] = v[i * 3 + 1] * arr - 6 * dt; v[i * 3 + 2] *= arr;
          p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
        }
        c.mat.opacity = Math.max(0, 1 - c.t / 2.6) * (0.75 + Math.random() * 0.25);
        if (c.t > 2.6) { c.fase = 'libre'; c.pts.visible = false; }
      }
      P.needsUpdate = true;
    }
  }
}
