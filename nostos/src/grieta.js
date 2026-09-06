import * as THREE from 'three';

const RADIO = 2.6;
const ALTO = 8;

export class Grieta {
  constructor(escena, pos) {
    this.escena = escena;
    this.pos = pos.clone();
    this.abierta = false;
    this.modo = 'entrar';
    this.armada = false;
    this.reloj = 0;

    this.grupo = new THREE.Group();
    this.grupo.position.copy(this.pos);

    const columna = new THREE.Mesh(
      new THREE.CylinderGeometry(RADIO, RADIO * 0.72, ALTO, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xa86bff, transparent: true, opacity: 0.4,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
      })
    );
    columna.position.y = ALTO / 2;
    this.columna = columna;
    this.grupo.add(columna);

    const nucleo = new THREE.Mesh(
      new THREE.CylinderGeometry(RADIO * 0.5, RADIO * 0.28, ALTO * 0.9, 14, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xf0d0ff, transparent: true, opacity: 0.28,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
      })
    );
    nucleo.position.y = ALTO * 0.45;
    this.nucleo = nucleo;
    this.grupo.add(nucleo);

    const anillo = new THREE.Mesh(
      new THREE.RingGeometry(RADIO * 0.86, RADIO * 1.18, 32),
      new THREE.MeshBasicMaterial({
        color: 0xc98bff, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false
      })
    );
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.y = 0.12;
    this.anillo = anillo;
    this.grupo.add(anillo);

    const n = 90;
    const puntos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = RADIO * (0.25 + Math.random() * 0.85);
      puntos[i * 3] = Math.cos(a) * r;
      puntos[i * 3 + 1] = Math.random() * ALTO;
      puntos[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(puntos, 3));
    this.chispas = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xe6b6ff, size: 0.3, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.grupo.add(this.chispas);

    this.luz = new THREE.PointLight(0xa86bff, 0, 22);
    this.luz.position.y = 2.4;
    this.grupo.add(this.luz);

    this.grupo.visible = false;
    escena.add(this.grupo);
  }

  abrir(modo, jugador) {
    this.abierta = true;
    this.modo = modo;
    this.grupo.visible = true;
    this.reloj = 0;
    const color = modo === 'salir' ? 0x6bd4ff : 0xa86bff;
    const claro = modo === 'salir' ? 0xd6f4ff : 0xf0d0ff;
    this.columna.material.color.setHex(color);
    this.nucleo.material.color.setHex(claro);
    this.anillo.material.color.setHex(color);
    this.chispas.material.color.setHex(claro);
    this.luz.color.setHex(color);
    this.armada = !jugador || this.distancia(jugador) > RADIO * 2;
  }

  cerrar() {
    this.abierta = false;
    this.armada = false;
    this.grupo.visible = false;
    this.luz.intensity = 0;
  }

  distancia(jugador) {
    return Math.hypot(jugador.pos.x - this.pos.x, jugador.pos.z - this.pos.z);
  }

  actualizar(dt, jugador) {
    if (!this.abierta) return false;
    this.reloj += dt;
    const pulso = 0.72 + Math.sin(this.reloj * 2.6) * 0.28;
    this.columna.material.opacity = 0.34 * pulso;
    this.nucleo.material.opacity = 0.3 * pulso;
    this.anillo.material.opacity = 0.7 * pulso;
    this.anillo.scale.setScalar(1 + Math.sin(this.reloj * 2.2) * 0.09);
    this.columna.rotation.y += dt * 0.5;
    this.nucleo.rotation.y -= dt * 1.1;
    this.luz.intensity = 16 * pulso;

    const p = this.chispas.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) + dt * 2.1;
      if (y > ALTO) y = 0;
      p.setY(i, y);
    }
    p.needsUpdate = true;

    if (!jugador || !jugador.activo) return false;
    const d = this.distancia(jugador);
    if (!this.armada) {
      if (d > RADIO * 2) this.armada = true;
      return false;
    }
    return d < RADIO;
  }
}
