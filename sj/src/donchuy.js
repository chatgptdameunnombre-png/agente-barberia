import * as THREE from 'three';
import { crearHumano } from './humanos.js?v=202611220225';

export class DonChuy {
  constructor(juego) {
    this.j = juego; this.t = 0; this.modo = 'Idle_Talking_Loop';
    crearHumano('chuy').then(h => {
      this.h = h; const L = juego.ciudad.lugares.taller;
      h.grupo.position.set(L.x + 2.4, 0, L.z - 2.2); h.grupo.rotation.y = 0; this.yawBase = 0;
      juego.escena.add(h.grupo); h.tocar('Idle_Talking_Loop', 0);
      juego.mundo.agregar(L.x + 2.1, L.z - 2.5, L.x + 2.7, L.z - 1.9, 1.8);
    }).catch(() => {});
  }

  actualizar(dt) {
    const h = this.h; if (!h || this.j.sinRealista) return;
    const J = this.j.jugador.posicion, g = h.grupo, dx = J.x - g.position.x, dz = J.z - g.position.z, d = Math.hypot(dx, dz);
    g.visible = d < 140 && !this.j.jugador.interior;
    if (!g.visible) return;
    this.t -= dt;
    if (d < 7) { if (this.modo !== 'Idle_Talking_Loop') { this.modo = 'Idle_Talking_Loop'; h.tocar(this.modo, 0.4); } }
    else if (this.t <= 0) { this.t = 8 + Math.random() * 10; this.modo = this.modo === 'Fixing_Kneeling' ? 'Idle_Loop' : Math.random() < 0.5 ? 'Fixing_Kneeling' : 'Idle_Talking_Loop'; h.tocar(this.modo, 0.6); }
    const meta = d < 9 ? Math.atan2(dx, dz) : this.yawBase;
    let dif = meta - g.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    g.rotation.y += dif * Math.min(1, dt * 2.5);
    if (d < 60) h.actualizar(dt);
  }
}
