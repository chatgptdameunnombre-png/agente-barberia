import * as THREE from 'three';
import { modeloProtagonista, realistaDe } from './jugador.js?v=202611212330';
import { animar, sentar } from './persona.js?v=202611212330';
import { Peaton } from './peatones.js?v=202611212330';

const CHARLAS = [
  [['Lucía', '¿Ya viste ese cielo? Esta ciudad de noche no tiene igual.'], ['Matías', 'Por eso no me voy de aquí.']],
  [['Matías', 'Don Chuy dice que manejo como abuelita.'], ['Lucía', 'Don Chuy es muy amable contigo.']],
  [['Lucía', 'Si nos para la policía, tú hablas.'], ['Matías', 'Siempre hablo yo.']],
  [['Matías', '¿Unos tacos después de esto?'], ['Lucía', 'Birria. Y tú invitas.']],
  [['Lucía', 'Un día nos vamos a ir a la playa. Tú y yo.'], ['Matías', 'Primero que Don Chuy nos pague.']],
  [['Matías', 'Oye, ¿y si mejor abrimos un puesto de tortas ahogadas?'], ['Lucía', 'Ni sabes hacer la salsa.']],
  [['Lucía', 'Ese coche de allá está precioso.'], ['Matías', 'No. No vamos a robarlo… todavía.']]
];

export class Duo {
  constructor(juego) {
    this.j = juego;
    this.pos = new THREE.Vector3();
    this.yaw = 0; this.vel = 0;
    this.cadencia = 1; this.charla = 70 + Math.random() * 40;
    this.apunta = 0;
    this.crear();
    const jp = juego.jugador.pos;
    this.pos.set(jp.x + 1.5, 0, jp.z + 1.2);
  }

  get nombre() { return this.j.jugador.personaje === 'Matías' ? 'Lucía' : 'Matías'; }

  crear() {
    if (this.p) this.p.grupo.parent?.remove(this.p.grupo);
    this.p = modeloProtagonista(this.nombre, this.j.jugador.estilos[this.nombre]);
    this.j.escena.add(this.p.grupo);
    this.enMoto = null;
  }

  cambiar() {
    const j = this.j, jug = j.jugador;
    if (jug.muerto || jug.interior || j.misiones.activa?.sinCambio) return;
    const f = document.getElementById('fundido'); f.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
    const antes = jug.personaje;
    jug.personaje = this.nombre;
    if (!jug.coche) {
      const t = jug.pos.clone(), ty = jug.yaw;
      jug.pos.copy(this.pos); jug.yaw = this.yaw; j.camYaw = this.yaw;
      this.pos.copy(t); this.yaw = ty;
    }
    jug.vestir({});
    this.crear();
    j.audio.ui(880);
    j.hud.personaje();
    j.hud.dialogos([[jug.personaje, jug.personaje === 'Lucía' ? ['Mi turno.', 'Déjame a mí, Matías.', 'Ahora sí, a mi manera.'][Math.random() * 3 | 0] : ['Va, yo me encargo.', 'Te cubro, Lucía.', 'Me toca.'][Math.random() * 3 | 0]]]);
    j.estadisticas.sumar('cambios');
    return antes;
  }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, g = this.p.grupo;
    const c = jug.coche;
    if (c) {
      if (c.tipo === 'moto') {
        if (this.enMoto !== c) { c.carro.add(g); g.position.set(0, 0.5, -0.62); g.rotation.set(0, 0, 0); this.enMoto = c; }
        g.visible = true; sentar(this.p);
      } else { g.visible = false; if (this.enMoto) { j.escena.add(g); this.enMoto = null; } }
      this.pos.copy(c.pos); this.enCoche = c;
      this.charla -= dt;
      if (this.charla <= 0 && j.policia.estrellas === 0 && !j.misiones.activa && c.vel > 5) {
        this.charla = 80 + Math.random() * 60;
        const ch = CHARLAS[Math.random() * CHARLAS.length | 0];
        j.hud.dialogos(ch);
      }
      return;
    }
    if (this.enMoto) { j.escena.add(g); this.enMoto = null; }
    if (this.enCoche) {
      const k = this.enCoche, lado = k.t.ancho / 2 + 0.8;
      this.pos.set(k.pos.x - k.fz * lado, 0, k.pos.z + k.fx * lado);
      j.mundo.empujar(this.pos, 0.4);
      this.p.cuerpo.rotation.set(0, 0, 0); this.p.pi.rotation.set(0, 0, 0); this.p.pd.rotation.set(0, 0, 0);
      this.enCoche = null;
    }
    g.visible = !jug.interior;
    const meta = jug.interior ? jug.interior.puerta : jug.pos;
    const fx = Math.sin(jug.yaw), fz = Math.cos(jug.yaw);
    const tx = jug.interior ? meta.x + jug.interior.fz * 1.2 : meta.x - fx * 1.8 - fz * 1.3, tz = jug.interior ? meta.z - jug.interior.fx * 1.2 : meta.z - fz * 1.8 + fx * 1.3;
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    if (d > 45) { this.pos.set(tx, 0, tz); j.mundo.empujar(this.pos, 0.4); }
    let v = d > 6 ? 7 : d > 1.2 ? 3.8 : 0;
    const enemigo = this.buscarEnemigo();
    if (enemigo && d < 10) v = 0;
    if (v) { this.pos.x += dx / d * v * dt; this.pos.z += dz / d * v * dt; this.yaw = this.girar(this.yaw, Math.atan2(dx, dz), dt); }
    j.mundo.empujar(this.pos, 0.34);
    this.vel += (v - this.vel) * Math.min(1, dt * 8);
    if (enemigo) {
      this.yaw = this.girar(this.yaw, Math.atan2(enemigo.pos.x - this.pos.x, enemigo.pos.z - this.pos.z), dt * 2);
      this.cadencia -= dt;
      this.apunta = 0.8;
      const libre = j.mundo.rayo(this.pos.x, 1.4, this.pos.z, enemigo.pos.x, 1.2, enemigo.pos.z, 0.2) >= 0.97;
      if (this.cadencia <= 0 && libre) {
        this.cadencia = 0.75 + Math.random() * 0.5;
        const boca = new THREE.Vector3(this.pos.x + Math.sin(this.yaw) * 0.6, 1.4, this.pos.z + Math.cos(this.yaw) * 0.6);
        const pega = Math.random() < 0.55;
        const fin = new THREE.Vector3(enemigo.pos.x + (pega ? 0 : (Math.random() - 0.5) * 2), 1.1, enemigo.pos.z + (pega ? 0 : (Math.random() - 0.5) * 2));
        j.trazo(boca, fin, '#ffe9a8'); j.fogonazo(boca, 0.8);
        j.audio.disparo('pistola', this.pos);
        if (pega) enemigo.recibir(30, this.pos, 'jugador', { x: (fin.x - boca.x) * 0.2, z: (fin.z - boca.z) * 0.2 });
      }
    } else this.apunta = Math.max(0, this.apunta - dt);
    animar(this.p, dt, this.vel, this.apunta > 0 ? 'pistola' : 'puno', this.apunta > 0);
    g.position.set(this.pos.x, 0, this.pos.z);
    g.rotation.y = this.yaw;
    if (!j.sinRealista) realistaDe(this.nombre).actualizarJugador(this.adaptador || (this.adaptador = { juego: j }), dt, this);
  }

  girar(a, b, k) { let d = b - a; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return a + d * Math.min(1, k * 8); }

  buscarEnemigo() {
    let mejor = null, md = 26;
    for (const q of this.j.peatones) {
      if (q.muerto || !(q.tipo === 'poli' || q.tipo === 'matón') || !(q.estado === 'perseguir' || q.estado === 'atacar')) continue;
      const d = q.pos.distanceTo(this.pos);
      if (d < md) { md = d; mejor = q; }
    }
    return mejor;
  }
}
