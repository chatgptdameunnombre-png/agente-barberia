import * as THREE from 'three';
import { esCalle } from './ciudad.js?v=202611231659';

export class SombrasContacto {
  constructor(juego, max = 260) {
    this.j = juego; this.max = max;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.55, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    this.mat = new THREE.MeshBasicMaterial({ map: tex, color: '#000000', transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, toneMapped: false });
    this.im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this.mat, max);
    this.im.frustumCulled = false; this.im.renderOrder = 1; this.im.castShadow = false; this.im.receiveShadow = false; this.im.count = 0;
    juego.escena.add(this.im);
    this.o = new THREE.Object3D(); this.cerca = 46;
  }

  poner(n, x, y, z, yaw, sx, sz) {
    const o = this.o; o.position.set(x, y, z); o.rotation.set(0, yaw, 0); o.scale.set(sx, 1, sz); o.updateMatrix(); this.im.setMatrixAt(n, o.matrix);
  }

  actualizar() {
    const j = this.j, jp = j.jugador.posicion, max = this.max;
    let n = 0;
    const dentro = !!j.jugador.interior;
    this.im.visible = !dentro;
    if (dentro) return;
    const noche = j.ambiente.noche ?? 0;
    this.mat.opacity = 0.6 - noche * 0.25;
    for (const c of j.coches) {
      if (n >= max) break;
      if (!c.grupo.visible || c.quemado > 20 || c.hundido) continue;
      const d = Math.abs(c.pos.x - jp.x) + Math.abs(c.pos.z - jp.z);
      if (d < this.cerca || d > 230) continue;
      const moto = c.tipo === 'moto';
      this.poner(n++, c.pos.x, 0.03, c.pos.z, c.grupo.rotation.y, c.t.ancho * (moto ? 1.6 : 1.35), c.t.largo * 1.18);
    }
    for (const p of j.peatones) {
      if (n >= max) break;
      if ((!p.grupo.visible && !p.lejano) || p.enInterior || (p.muerto && p.muneco)) continue;
      const d = Math.abs(p.pos.x - jp.x) + Math.abs(p.pos.z - jp.z);
      if (d < this.cerca || d > 130) continue;
      this.poner(n++, p.pos.x, esCalle(p.pos.x, p.pos.z) ? 0.03 : 0.215, p.pos.z, 0, 0.95, 0.95);
    }
    this.im.count = n;
    this.im.instanceMatrix.needsUpdate = true;
  }
}
