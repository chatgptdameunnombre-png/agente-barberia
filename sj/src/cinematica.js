import * as THREE from 'three';

export class Cinematica {
  constructor(juego) { this.j = juego; this.activa = null; }

  mostrar(x, y, z, dur = 5, radio = 10, alto = 3.5) {
    if (navigator.webdriver && !window.__cineEnPruebas) return;
    this.activa = { c: new THREE.Vector3(x, y, z), dur, t: 0, radio, alto, a0: this.j.camYaw + Math.PI * 0.75 };
    document.body.classList.add('cine');
  }

  terminar() { this.activa = null; document.body.classList.remove('cine'); }

  camara(cam, dt) {
    const A = this.activa; A.t += dt;
    const k = A.t / A.dur, a = A.a0 + k * 0.9, r = A.radio * (1.1 - k * 0.2);
    cam.position.set(A.c.x + Math.sin(a) * r, A.c.y + A.alto * (1 - k * 0.3), A.c.z + Math.cos(a) * r);
    cam.lookAt(A.c);
    if (cam.fov !== 50) { cam.fov = 50; cam.updateProjectionMatrix(); }
    if (A.t >= A.dur) this.terminar();
  }
}
