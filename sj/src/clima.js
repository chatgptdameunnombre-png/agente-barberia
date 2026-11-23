import * as THREE from 'three';
import { LIMITE, VIENTO } from './ciudad.js?v=202611221845';

export class Clima {
  constructor(juego) {
    this.j = juego; this.activa = false; this.fuerza = 0; this.nivel = 0; this.dur = 0; this.prox = 420 + Math.random() * 480; this.tRayo = 5; this.tSpray = 0; this.forzar = false;
    const tam = LIMITE * 2 + 40, A = juego.ciudad?.agua?.material;
    const nm = A?.normalMap ? A.normalMap.clone() : null;
    if (nm) { nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(tam / 9, tam / 9); nm.needsUpdate = true; }
    this.mat = new THREE.MeshStandardMaterial({ color: '#33444a', roughness: 0.06, metalness: 0.35, transparent: true, opacity: 0, depthWrite: false, normalMap: nm, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.3 });
    this.agua = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam).rotateX(-Math.PI / 2), this.mat);
    this.agua.position.y = 0.02; this.agua.visible = false; this.agua.renderOrder = 1; this.agua.receiveShadow = false;
    juego.escena.add(this.agua);
    const N = 140, geo = new THREE.PlaneGeometry(0.16, 0.12);
    this.hojas = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide }), N);
    const cols = ['#6a8a3a', '#a87a3a', '#e8e2d2', '#8a6a3a', '#5a7a2a', '#dcd6c4'];
    for (let i = 0; i < N; i++) this.hojas.setColorAt(i, new THREE.Color(cols[i % cols.length]));
    this.hojas.visible = false; this.hojas.frustumCulled = false; this.hojas.castShadow = false;
    this.hojasD = Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * 60, y: Math.random() * 6, z: (Math.random() - 0.5) * 60, r: Math.random() * 6, v: 0.6 + Math.random() * 0.8 }));
    juego.escena.add(this.hojas);
    this._o = new THREE.Object3D();
  }

  empezar() {
    const j = this.j, A = j.ambiente;
    this.activa = true; this.dur = 150 + Math.random() * 110; this.tRayo = 3;
    A.quiereLluvia = 1; A.quiereNublado = 1; A.climaT = this.dur + 20;
    j.hud.notificar('alerta', 'Alerta de tormenta', 'Viento fuerte y calles inundadas: los coches patinan. Maneja con cuidado.', 6);
    j.noticias?.avisar('tormenta');
  }

  terminar() {
    const A = this.j.ambiente;
    this.activa = false; this.prox = 600 + Math.random() * 600;
    A.quiereLluvia = 0.2; A.quiereNublado = 0.5; A.climaT = 90;
  }

  actualizar(dt, camara) {
    const j = this.j, A = j.ambiente;
    if (!this.activa) {
      this.prox -= dt;
      if (this.forzar || (this.prox <= 0 && A.lluvia > 0.5 && !j.jugador.interior)) { this.forzar = false; this.empezar(); }
      else if (this.prox <= 0) this.prox = 60;
    } else { this.dur -= dt; if (this.dur <= 0) this.terminar(); }
    this.fuerza += ((this.activa ? 1 : 0) - this.fuerza) * Math.min(1, dt * 0.15);
    this.nivel = this.activa ? Math.min(1, this.nivel + dt / 75) : Math.max(0, this.nivel - dt / 140);
    const F = this.fuerza, N = this.nivel;
    j.resbalon = N > 0.2 ? 1 - 0.62 * Math.min(1, (N - 0.2) / 0.6) : 1;
    VIENTO.value += dt * 2.6 * F;
    this.agua.visible = N > 0.02;
    if (this.agua.visible) {
      this.agua.position.y = 0.02 + N * 0.1;
      this.mat.opacity = Math.min(0.85, N * 1.1);
      const ap = A.noche ?? 0; this.mat.color.setRGB(0.2 - ap * 0.12, 0.26 - ap * 0.15, 0.29 - ap * 0.16);
      if (this.mat.normalMap) this.mat.normalMap.offset.set(VIENTO.value * 0.02, VIENTO.value * 0.013);
    }
    if (this.activa) {
      this.tRayo -= dt;
      if (this.tRayo <= 0 && A.relampago <= 0) { this.tRayo = 4 + Math.random() * 9; A.relampago = 0.35; setTimeout(() => j.audio?.trueno?.(), 200 + Math.random() * 900); }
    }
    this.hojas.visible = F > 0.15 && !j.jugador.interior;
    if (this.hojas.visible && camara) {
      const cx = camara.position.x, cz = camara.position.z, o = this._o, t = performance.now() / 1000;
      this.hojasD.forEach((h, i) => {
        h.x += dt * (9 + F * 7) * h.v; h.z += dt * 2.2 * Math.sin(t * h.v + i); h.y += dt * (Math.sin(t * 2.1 * h.v + i) * 1.6 - 0.35); h.r += dt * 7 * h.v;
        if (h.y < 0.1) h.y = 3 + Math.random() * 3; if (h.y > 7) h.y = 0.3;
        const x = cx + (((h.x - cx) % 60) + 90) % 60 - 30, z = cz + (((h.z - cz) % 60) + 90) % 60 - 30;
        o.position.set(x, h.y, z); o.rotation.set(h.r, h.r * 0.7, h.r * 0.3); o.scale.setScalar(F); o.updateMatrix(); this.hojas.setMatrixAt(i, o.matrix);
      });
      this.hojas.instanceMatrix.needsUpdate = true;
    }
    const c = j.jugador.coche;
    if (c && N > 0.3 && c.tipo !== 'lancha' && Math.abs(c.vel || 0) > 7) {
      this.tSpray -= dt;
      if (this.tSpray <= 0) { this.tSpray = 0.05; for (const s of [-1, 1]) j.humo?.(c.pos.x - c.fx * c.t.largo * 0.45 + c.fz * s * c.t.ancho * 0.45, 0.25, c.pos.z - c.fz * c.t.largo * 0.45 - c.fx * s * c.t.ancho * 0.45, 0.6 + N * 0.5, '#dfe8ee', 0.5); }
    }
  }
}
