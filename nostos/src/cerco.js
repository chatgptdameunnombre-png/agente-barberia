import * as THREE from 'three';
import { CELDA } from './mapa.js?v=20260906112958';

const LLAMAS = 46;

export class Cerco {
  constructor(escena, nivel, cuadros) {
    this.escena = escena;
    this.nivel = nivel;
    this.cuadros = cuadros;
    this.activo = false;
    this.radio = 0;
    this.destino = 0;
    this.tiempo = 0;
    this.centro = new THREE.Vector3(
      nivel.ancho * CELDA / 2, 0, nivel.alto * CELDA / 2
    );
    this.maximo = Math.min(nivel.ancho, nivel.alto) * CELDA * 0.52;
    this.grupo = new THREE.Group();
    this.grupo.visible = false;
    escena.add(this.grupo);

    const geo = new THREE.PlaneGeometry(5.5, 8);
    geo.translate(0, 4, 0);
    this.mat = new THREE.MeshBasicMaterial({
      map: cuadros && cuadros.length ? cuadros[0] : null,
      transparent: true,
      alphaTest: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: true
    });
    for (let i = 0; i < LLAMAS; i++) {
      this.grupo.add(new THREE.Mesh(geo, this.mat));
    }
    this.luz = new THREE.PointLight(0xff7a2a, 0, 60, 1.6);
    escena.add(this.luz);
  }

  encender() {
    if (!this.cuadros || !this.cuadros.length) return false;
    this.activo = true;
    this.radio = this.maximo;
    this.destino = this.maximo * 0.34;
    this.grupo.visible = true;
    this.luz.intensity = 26;
    return true;
  }

  apagar() {
    this.activo = false;
    this.grupo.visible = false;
    this.luz.intensity = 0;
  }

  fuera(pos) {
    if (!this.activo) return false;
    const d = Math.hypot(pos.x - this.centro.x, pos.z - this.centro.z);
    return d > this.radio;
  }

  actualizar(dt, camara) {
    if (!this.activo) return;
    this.tiempo += dt;
    if (this.radio > this.destino) {
      this.radio = Math.max(this.destino, this.radio - dt * 1.15);
    }
    if (this.cuadros.length) {
      const c = Math.floor(this.tiempo * 12) % this.cuadros.length;
      if (this.mat.map !== this.cuadros[c]) {
        this.mat.map = this.cuadros[c];
        this.mat.needsUpdate = true;
      }
    }
    const hijos = this.grupo.children;
    for (let i = 0; i < hijos.length; i++) {
      const a = (i / hijos.length) * Math.PI * 2;
      hijos[i].position.set(
        this.centro.x + Math.cos(a) * this.radio,
        0,
        this.centro.z + Math.sin(a) * this.radio
      );
      hijos[i].rotation.y = Math.atan2(
        camara.position.x - hijos[i].position.x,
        camara.position.z - hijos[i].position.z
      );
    }
    this.luz.position.set(this.centro.x, 4, this.centro.z);
  }
}
