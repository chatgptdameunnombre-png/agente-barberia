import * as THREE from 'three';

export class Direccionales {
  constructor(juego) {
    this.j = juego; this.max = 4 * 70; this.t = 0;
    this.malla = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: '#ffae1a', toneMapped: false }), this.max);
    this.malla.frustumCulled = false; this.malla.count = 0; juego.escena.add(this.malla);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1); this._y = new THREE.Vector3(0, 1, 0);
  }

  actualizar(dt) {
    this.t += dt;
    const prendido = (this.t % 0.72) < 0.36;
    let n = 0;
    if (prendido) {
      const jp = this.j.jugador.posicion;
      for (const c of this.j.coches) {
        if (n > this.max - 4) break;
        const ia = c.ia; if (!ia || !ia.decision || c.conductor !== 'ia' || c.quemado || c.tipo === 'moto') continue;
        if (Math.abs(c.pos.x - jp.x) > 110 || Math.abs(c.pos.z - jp.z) > 110) continue;
        const [dx, dz] = ia.decision; if (dx === ia.dx && dz === ia.dz) continue;
        const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), cruz = fx * dz - fz * dx;
        if (Math.abs(cruz) < 0.5) continue;
        const L = c.t.largo / 2 - 0.12, A = c.t.ancho / 2 - 0.03, lx = dx * A, lz = dz * A, y = (c.y || 0) + 0.72;
        this._q.setFromAxisAngle(this._y, c.yaw);
        for (const s of [1, -1]) {
          this._v.set(c.pos.x + fx * L * s + lx, y + (s < 0 ? 0.08 : 0), c.pos.z + fz * L * s + lz);
          this._m.compose(this._v, this._q, this._s); this.malla.setMatrixAt(n++, this._m);
        }
      }
    }
    this.malla.count = n;
    if (n) this.malla.instanceMatrix.needsUpdate = true;
  }
}
