import * as THREE from 'three';
import { modeloProtagonista, realistaDe } from './jugador.js?v=202611231951';
import { animar, sentar } from './persona.js?v=202611231951';
import { Peaton } from './peatones.js?v=202611231951';

const SENTADOS = [
  [['A', 'A veces se me olvida que esta ciudad también es bonita.'], ['B', 'Cuando no nos andan correteando, sí lo es.']],
  [['A', '¿Te acuerdas cuando soñábamos con salir de aquí?'], ['B', 'Ahora no me imagino en otro lado.']],
  [['A', 'Huele a elote. Ahorita vamos por uno.'], ['B', 'Con todo y chile. Si no, no cuenta.']],
  [['A', 'Don Chuy dice que el tren antes llegaba hasta el lago.'], ['B', 'Don Chuy dice muchas cosas.']],
  [['A', 'Cinco minutos y seguimos. Nomás cinco.'], ['B', 'Eso dijiste hace media hora.']],
  [['A', '¿Viste las jacarandas? Ya están moradas otra vez.'], ['B', 'Es lo único puntual en esta ciudad.']]
];
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

  asientoP(c) {
    if (c.tipo === 'moto') return new THREE.Vector3(c.pos.x - c.fx * 0.55, 0, c.pos.z - c.fz * 0.55);
    const zp = c.puerta ? c.puerta.position.z - 0.55 : 0.2;
    return new THREE.Vector3(c.pos.x - c.fz * c.t.ancho * 0.2 + c.fx * zp, 0, c.pos.z + c.fx * c.t.ancho * 0.2 + c.fz * zp);
  }

  dibujar(dt) {
    const j = this.j, g = this.p.grupo;
    g.visible = true; animar(this.p, dt, this.vel, 'puno', false);
    g.position.set(this.pos.x, this.altura || 0, this.pos.z); g.rotation.y = this.yaw;
    if (!j.sinRealista) realistaDe(this.nombre).actualizarJugador(this.adaptador || (this.adaptador = { juego: j }), dt, this);
  }

  abordar(dt) {
    const A = this.abordo, c = A.c, moto = c.tipo === 'moto';
    A.t += dt;
    if (c.vel > 2.5 || A.t > 4.5 || this.pos.distanceTo(c.pos) > 12 || c.quemado) { this.abordo = null; this.anim = null; return false; }
    const asiento = this.asientoP(c), lx = -c.fz, lz = c.fx, ld = moto ? 0.55 : c.t.ancho / 2 + 0.45;
    if (A.f === 'ir') {
      let tx = asiento.x + lx * (moto ? ld : ld - c.t.ancho * 0.2) + (moto ? 0 : c.fx * 0.2), tz = asiento.z + lz * (moto ? ld : ld - c.t.ancho * 0.2) + (moto ? 0 : c.fz * 0.2);
      if (!A.ruta) {
        A.ruta = [];
        const rx = this.pos.x - c.pos.x, rz = this.pos.z - c.pos.z, lat = rx * lx + rz * lz, lon = rx * c.fx + rz * c.fz, an = c.t.ancho / 2 + 0.6;
        if (!moto && lat < an - 0.2) {
          const ext = (lon >= 0 ? 1 : -1) * (c.t.largo / 2 + 0.7);
          if (Math.abs(lon) < c.t.largo / 2 + 0.3) A.ruta.push([-an, ext]);
          A.ruta.push([an, ext]);
        }
      }
      if (A.ruta.length) {
        const [la, lo] = A.ruta[0]; tx = c.pos.x + lx * la + c.fx * lo; tz = c.pos.z + lz * la + c.fz * lo;
        if (Math.hypot(tx - this.pos.x, tz - this.pos.z) < 0.5) A.ruta.shift();
      }
      const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
      if ((d > 0.22 || A.ruta.length) && A.t < 3.2) { const v = Math.min(d / dt, A.ruta.length || d > 1.2 ? 5.8 : 3.4); this.pos.x += dx / d * v * dt; this.pos.z += dz / d * v * dt; this.yaw = this.girar(this.yaw, Math.atan2(dx, dz), dt * 1.5); this.vel = v; this.anim = null; this.dibujar(dt); return true; }
      A.f = moto ? 'montar' : 'abrir'; A.t = 0; A.desde = this.pos.clone(); this.vel = 0;
      A.yaw0 = moto ? this.yaw : Math.atan2(c.pos.x - this.pos.x, c.pos.z - this.pos.z);
      this.anim = moto ? { clip: 'Jump_Start', escala: 2.6, veces: 1, nuevo: true } : { clip: 'Interact', escala: 2.2, veces: 1, nuevo: true };
      if (!moto && c.puertaP) { c.puertaPObj = 1; c.puertaPCierra = 0; this.j.audio?.puerta?.(); }
    }
    this.vel = 0;
    if (A.f === 'abrir') {
      this.yaw = this.girar(this.yaw, A.yaw0, dt * 1.6);
      if (A.t > 0.38) { A.f = 'sentar'; A.t = 0; A.desde = this.pos.clone(); A.yaw0 = this.yaw; this.anim = { clip: 'Sitting_Enter', escala: 1.75, veces: 1, nuevo: true }; }
      this.dibujar(dt); return true;
    }
    const dur = A.f === 'montar' ? 0.42 : 0.7, k = Math.min(1, A.t / dur), s = k * k * (3 - 2 * k);
    this.pos.lerpVectors(A.desde, asiento, A.f === 'montar' ? s : Math.min(1, s * 1.15));
    let dy = c.yaw - A.yaw0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw = A.yaw0 + dy * Math.min(1, s * (A.f === 'montar' ? 1 : 1.6));
    if (A.f === 'montar') this.altura = 0.5 * s;
    if (k >= 1) { this.abordo = null; this.anim = null; this.altura = 0; if (!moto && c.puertaP) c.puertaPCierra = 0.2; return false; }
    this.dibujar(dt); return true;
  }

  subirMoto(c, dt) {
    const g = this.p.grupo;
    if (this.enMoto !== c) { c.carro.add(g); g.position.set(0, 0, -0.55); g.rotation.set(0, 0, 0); this.enMoto = c; }
    g.visible = true; sentar(this.p); this.anim = null; this.vel = 0;
    if (!this.j.sinRealista) realistaDe(this.nombre).actualizarJugador(this.adaptador || (this.adaptador = { juego: this.j }), dt, this);
  }

  bajar(dt) {
    const B = this.bajando; B.t += dt;
    const k = Math.min(1, B.t / B.dur), s = k * k * (3 - 2 * k);
    this.pos.lerpVectors(B.desde, B.hasta, B.moto ? s : Math.min(1, s * 1.25)); this.yaw = B.yaw; this.vel = 0;
    if (k >= 1 || this.j.jugador.coche) { this.bajando = null; this.anim = null; return false; }
    this.dibujar(dt); return true;
  }

  enAvion(A, dt) {
    const g = this.p.grupo;
    if (this.avion !== A) {
      this.enMoto = null; this.abordo = null; this.enCoche = null; this.bajando = null;
      const S = A.asientoDuo || (A.tipo === 'heli' ? [0.45, -0.98, 0.95] : [0.18, -0.32, -0.05]);
      A.cuerpo.add(g); g.position.set(S[0], S[1], S[2]); g.rotation.set(0, 0, 0); this.avion = A;
      this.sentadoListo = { pie: false };
    }
    g.visible = true; sentar(this.p); this.anim = null; this.vel = 0; this.pos.copy(A.pos); this.yaw = A.yaw;
    if (!this.j.sinRealista) realistaDe(this.nombre).actualizarJugador(this.adaptador || (this.adaptador = { juego: this.j }), dt, this);
  }

  salirAvion() {
    const j = this.j, jug = j.jugador, g = this.p.grupo, A = this.avion;
    j.escena.add(g); this.avion = null; this.sentadoListo = null; g.visible = true;
    const lado = A.tipo === 'heli' ? 2.6 : 2.4, rx = Math.cos(A.yaw), rz = -Math.sin(A.yaw);
    this.pos.set(A.pos.x - rx * lado, 0, A.pos.z - rz * lado); j.mundo.empujar(this.pos, 0.4);
    this.p.cuerpo.rotation.set(0, 0, 0); this.p.pi.rotation.set(0, 0, 0); this.p.pd.rotation.set(0, 0, 0);
  }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, g = this.p.grupo;
    const VA = j.vuelo?.activa;
    if (VA) { this.enAvion(VA, dt); return; }
    if (this.avion) this.salirAvion();
    const c = jug.coche, subeA = c || (j.entrando?.f || j.entrando?.t > 0.15 ? j.entrando.c : null);
    if (subeA && subeA.tipo !== 'lancha' && this.enCoche !== subeA) {
      if (this.enMoto) { j.escena.add(g); this.enMoto = null; }
      this.bajando = null;
      if (!this.abordo || this.abordo.c !== subeA) this.abordo = { c: subeA, f: 'ir', t: 0 };
      if (this.abordar(dt)) return;
      if (!c) { this.enCoche = subeA; this.pos.copy(this.asientoP(subeA)); this.yaw = subeA.yaw; }
    }
    if (!c && this.enCoche && j.entrando?.c === this.enCoche) {
      if (this.enCoche.tipo === 'moto') this.subirMoto(this.enCoche, dt); else g.visible = false;
      return;
    }
    if (c) {
      if (c.tipo === 'moto') this.subirMoto(c, dt);
      else { g.visible = false; if (this.enMoto) { j.escena.add(g); this.enMoto = null; } }
      this.pos.copy(c.pos); this.enCoche = c;
      this.charla -= dt;
      if (this.charla <= 0 && j.policia.estrellas === 0 && !j.misiones.activa && c.vel > 5) {
        this.charla = 80 + Math.random() * 60;
        const ch = CHARLAS[Math.random() * CHARLAS.length | 0];
        j.hud.dialogos(ch);
      }
      return;
    }
    this.abordo = null;
    if (this.enMoto) { j.escena.add(g); this.enMoto = null; }
    if (this.enCoche) {
      const k = this.enCoche, lado = k.t.ancho / 2 + 0.8, moto = k.tipo === 'moto';
      this.pos.set(k.pos.x - k.fz * lado, 0, k.pos.z + k.fx * lado);
      j.mundo.empujar(this.pos, 0.4);
      this.p.cuerpo.rotation.set(0, 0, 0); this.p.pi.rotation.set(0, 0, 0); this.p.pd.rotation.set(0, 0, 0);
      this.enCoche = null;
      if ((k.vel || 0) < 6 && !jug.muerto && k.tipo !== 'lancha' && !jug.interior) {
        const desde = this.asientoP(k), hasta = this.pos.clone();
        this.bajando = { t: 0, dur: moto ? 0.4 : 0.68, moto, desde, hasta, yaw: moto ? k.yaw : Math.atan2(hasta.x - desde.x, hasta.z - desde.z) };
        if (!moto && k.puertaP) { k.puertaPObj = 1; k.puertaPCierra = 0.75; }
        this.pos.copy(desde); this.yaw = this.bajando.yaw;
        this.anim = { clip: moto ? 'Jump_Land' : 'Sitting_Exit', escala: moto ? 2.2 : 1.5, veces: 1, nuevo: true };
      }
    }
    if (this.bajando && this.bajar(dt)) return;
    g.visible = !jug.interior;
    if (jug.sentado && !this.sentado && !jug.interior && !this.buscarEnemigo()) { let b = j.ciudad.bancas?.find(b => !b.ocupante && !b.pie && Math.hypot(b.x - jug.pos.x, b.z - jug.pos.z) < 3.4); if (!b && !jug.sentado.terraza) { const s = jug.sentado; for (const lado of [-1, 1]) { const x = s.x + Math.cos(s.yaw) * 0.68 * lado, z = s.z - Math.sin(s.yaw) * 0.68 * lado; if (!j.mundo.dentro(x, 0.6, z) && !j.ciudad.arboles?.some?.(t => Math.hypot(t.x - x, t.z - z) < 0.7)) { b = { x, z, yaw: s.yaw, pie: false, virtual: true }; break; } } } if (b) { b.ocupante = this; this.sentado = b; } }
    if (this.sentado && (!jug.sentado || jug.interior)) { if (this.sentado.ocupante === this) this.sentado.ocupante = null; this.sentado = null; this.sentadoListo = null; this.tSentado = 0; this.platico = false; }
    if (this.sentado) {
      const b = this.sentado, dx = b.x - this.pos.x, dz = b.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.35) { this.pos.x += dx / d * 1.6 * dt; this.pos.z += dz / d * 1.6 * dt; this.yaw = this.girar(this.yaw, Math.atan2(dx, dz), dt); this.vel += (1.6 - this.vel) * Math.min(1, dt * 8); this.sentadoListo = null; }
      else {
        this.pos.set(b.x, 0, b.z); this.yaw = b.yaw; this.vel = 0; this.sentadoListo = b;
        this.tSentado = (this.tSentado || 0) + dt;
        if (this.tSentado > 4 && !this.platico && !j.misiones.activa && !j.policia.estrellas) { this.platico = true; const ch = SENTADOS[Math.random() * SENTADOS.length | 0], yo = jug.personaje || 'Matías', otro = this.nombre; j.hud.dialogos(ch.map(([q, t]) => [q === 'A' ? otro : yo, t])); }
      }
      animar(this.p, dt, this.vel, 'puno', false);
      g.position.set(this.pos.x, 0, this.pos.z); g.rotation.y = this.yaw;
      if (!j.sinRealista) realistaDe(this.nombre).actualizarJugador(this.adaptador || (this.adaptador = { juego: j }), dt, this);
      return;
    }
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
