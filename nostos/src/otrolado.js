import * as THREE from 'three';

const NORMAL = {
  fondo: 0x0a0705,
  niebla: { color: 0x120c08, cerca: 18, lejos: 95 },
  ambiente: { color: 0x8a7658, fuerza: 2.4 },
  antorcha: { color: 0xffc078, fuerza: 62 },
  cenit: { color: 0xbfd0e4, fuerza: 0.75 },
  tinteNivel: 0xffffff,
  tinteEnemigo: 0xffffff
};

const CRUZADO = {
  fondo: 0x0d0206,
  niebla: { color: 0x2a0812, cerca: 6, lejos: 52 },
  ambiente: { color: 0x5a2030, fuerza: 1.5 },
  antorcha: { color: 0xff4a5a, fuerza: 44 },
  cenit: { color: 0x6a2a4a, fuerza: 0.35 },
  tinteNivel: 0x8f5f6f,
  tinteEnemigo: 0x9a5a6a
};

export class OtroLado {
  constructor(cfg) {
    this.escena = cfg.escena;
    this.nivel = cfg.nivel;
    this.antorcha = cfg.antorcha;
    this.ambiente = cfg.ambiente;
    this.cenit = cfg.cenit;
    this.dentro = false;
    this.ofrecida = false;
    this.ceniza = null;
  }

  get multiplicadores() {
    return this.dentro
      ? { vida: 1.9, dano: 1.25, oro: 3, velocidad: 1.1 }
      : { vida: 1, dano: 1, oro: 1, velocidad: 1 };
  }

  _pintar(p) {
    this.escena.background = new THREE.Color(p.fondo);
    this.escena.fog.color.setHex(p.niebla.color);
    this.escena.fog.near = p.niebla.cerca;
    this.escena.fog.far = p.niebla.lejos;
    this.ambiente.color.setHex(p.ambiente.color);
    this.ambiente.intensity = p.ambiente.fuerza;
    this.antorcha.color.setHex(p.antorcha.color);
    this.baseAntorcha = p.antorcha.fuerza;
    this.cenit.color.setHex(p.cenit.color);
    this.cenit.intensity = p.cenit.fuerza;
    this.nivel.grupo.traverse(o => {
      if (o.material && o.material.color) o.material.color.setHex(p.tinteNivel);
    });
    this.tinteEnemigo = p.tinteEnemigo;
  }

  _ceniza(encender) {
    if (encender && !this.ceniza) {
      const n = 420;
      const pos = new Float32Array(n * 3);
      const anchoMundo = this.nivel.ancho * 4;
      const altoMundo = this.nivel.alto * 4;
      for (let i = 0; i < n; i++) {
        pos[i * 3] = Math.random() * anchoMundo;
        pos[i * 3 + 1] = Math.random() * 7;
        pos[i * 3 + 2] = Math.random() * altoMundo;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.ceniza = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xd46a7a, size: 0.22, transparent: true, opacity: 0.75, fog: true
      }));
      this.escena.add(this.ceniza);
    }
    if (this.ceniza) this.ceniza.visible = encender;
  }

  entrar() {
    this.dentro = true;
    this.ofrecida = false;
    this._pintar(CRUZADO);
    this._ceniza(true);
  }

  salir() {
    this.dentro = false;
    this._pintar(NORMAL);
    this._ceniza(false);
  }

  actualizar(dt) {
    if (!this.ceniza || !this.dentro) return;
    const p = this.ceniza.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 0.55;
      if (y < 0) y = 7;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    this.ceniza.rotation.y += dt * 0.02;
  }
}
