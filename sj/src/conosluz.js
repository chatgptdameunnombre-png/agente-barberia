import * as THREE from 'three';

export class ConosLuz {
  constructor(juego) {
    this.j = juego;
    const postes = (juego.mobiliario?.postesLista || []).filter(P => P.t !== 40);
    const lum = postes.map((P, k) => { const nx = P.eje === 'x' ? 0 : -P.lado, nz = P.eje === 'x' ? -P.lado : 0; return { x: P.x + nx * 2.3, z: P.z + nz * 2.3, led: (k * 7919) % 10 < 3 }; });
    const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 4, 128);
    const tex = new THREE.CanvasTexture(c);
    const geo = new THREE.CylinderGeometry(0.22, 3.1, 7.1, 18, 1, true).translate(0, 3.62, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false });
    this.im = new THREE.InstancedMesh(geo, this.mat, Math.max(1, lum.length));
    const o = new THREE.Object3D(), col = new THREE.Color();
    lum.forEach((L, i) => { o.position.set(L.x, 0, L.z); o.updateMatrix(); this.im.setMatrixAt(i, o.matrix); this.im.setColorAt(i, col.set(L.led ? '#c8d8ff' : '#ff9a40')); });
    this.im.count = lum.length; this.im.instanceMatrix.needsUpdate = true; if (this.im.instanceColor) this.im.instanceColor.needsUpdate = true;
    this.im.castShadow = this.im.receiveShadow = false; this.im.renderOrder = 3; this.im.visible = false;
    juego.escena.add(this.im);
  }

  actualizar() {
    const A = this.j.ambiente, n = A.noche ?? 0, humedo = Math.max(A.lluvia || 0, A.neblina || 0);
    const op = n > 0.3 ? (n - 0.3) / 0.7 * (0.08 + humedo * 0.12) : 0;
    this.mat.opacity = op;
    this.im.visible = op > 0.005 && !this.j.jugador.interior;
  }
}
