import * as THREE from 'three';
import { crearPersona, animar, tumbar, levantar, nivelDetalle, sentar, volar } from './persona.js?v=202611220819';

const _v = new THREE.Vector3();

export class Peaton {
  constructor(juego, opc = {}) {
    this.juego = juego;
    this.tipo = opc.tipo || 'civil';
    const vestido = this.tipo === 'poli' ? { camisa: '#1f3f7a', pantalon: '#16213a', gorra: '#13254a', chaleco: '#0f1a30', peloLargo: false, falda: false, sombrero: null, ropa: null, policia: true, mangaCorta: Math.random() < 0.4, prenda: null, mochila: false, lentes: false, mujer: false }
      : this.tipo === 'matón' ? { camisa: opc.camisa || ['#2b2b2b', '#f2f2f0', '#1a1a1e', '#3a3e48'][Math.random() * 4 | 0], pantalon: ['#1c1c1c', '#22304d', '#3a3a3a'][Math.random() * 3 | 0], gorra: Math.random() < 0.5 ? '#7a1020' : null, peloLargo: false, falda: false, sombrero: null, ropa: null, maton: true, mangaCorta: true, prenda: null, mochila: false, lentes: false, mujer: false, barba: Math.random() < 0.6 ? 'barba' : 'bigote', complexion: Math.random() < 0.5 ? 1.14 : 1 }
      : (opc.vestido || {});
    this.corredor = this.tipo === 'civil' && !opc.vestido && !opc.estado && Math.random() < 0.1;
    if (this.corredor) Object.assign(vestido, { camisa: ['#ff4f6a', '#3fd2ff', '#ffd84a', '#4fe08a', '#f2f2f0', '#b46bff'][Math.random() * 6 | 0], ropa: null, mangaCorta: true, shorts: true, pantalon: '#1a1a1e', zapatos: '#e8e4da', sombrero: null, falda: false, gorra: Math.random() < 0.4 ? '#f2f2f0' : null, mochila: false, lentes: false });
    this.p = crearPersona(vestido);
    this.grupo = this.p.grupo;
    this.pos = new THREE.Vector3(opc.x || 0, 0, opc.z || 0);
    this.yaw = opc.yaw || 0;
    this.salud = this.tipo === 'poli' ? 70 : this.tipo === 'matón' ? 80 : 40;
    this.estado = opc.estado || 'pasear';
    this.habito = this.tipo === 'civil' && !this.corredor ? (Math.random() < 0.22 ? 'celular' : null) : null;
    if (this.corredor) this.proxCharla = this.proxBanca = 1e9;
    this.proxCharla = 8 + Math.random() * 40;
    this.cubre = Math.random() < 0.45;
    this.arma = this.tipo === 'poli' ? 'pistola' : this.tipo === 'matón' ? (opc.arma || 'pistola') : 'puno';
    this.vel = 0;
    this.t = 0;
    this.miedo = 0;
    this.huyeDe = new THREE.Vector3();
    this.cadencia = 1 + Math.random();
    this.id = Math.random() * 1000 | 0;
    this.ruta = null;
    this.indice = 0;
    this.sentido = Math.random() < 0.5 ? 1 : -1;
    this.muerto = 0;
    this.vy = 0; this.y = 0; this.vuela = null;
    this.hostil = this.tipo !== 'civil';
    this.dinero = this.tipo === 'civil' ? 5 + (Math.random() * 40 | 0) : 20 + (Math.random() * 60 | 0);
    this.grupo.position.copy(this.pos);
    juego.escena.add(this.grupo);
  }
  quitar() { this.soltarBanca?.(); if (this.muneco) { this.juego.fisica?.soltar(this.muneco); this.muneco = null; } this.juego.escena.remove(this.grupo); }

  planearCruce() {
    const j = this.juego, B = this.bloque, c = this.indice, bx = B.bx, bz = B.bz;
    const OPC = { 0: [[-1, 0, 1, 'z', 0, 0], [0, -1, 3, 'x', 0, 0]], 1: [[1, 0, 0, 'z', 1, 0], [0, -1, 2, 'x', 1, 0]], 2: [[1, 0, 3, 'z', 1, 1], [0, 1, 1, 'x', 1, 1]], 3: [[-1, 0, 2, 'z', 0, 1], [0, 1, 0, 'x', 0, 1]] }[c];
    if (!OPC) return false;
    const [dx, dz, llega, eje, oi, ok] = OPC[Math.random() * 2 | 0];
    const nb = j.ciudad.bloques.find(q => q.bx === bx + dx && q.bz === bz + dz);
    if (!nb) return false;
    const m = 1.5, esq = [[nb.x0 + m, nb.z0 + m], [nb.x1 - m, nb.z0 + m], [nb.x1 - m, nb.z1 - m], [nb.x0 + m, nb.z1 - m]][llega];
    this.cruce = { bloque: nb, llega, meta: esq, i: bx + oi, k: bz + ok, eje };
    this.estado = 'esperarCruce'; this.cruceT = 0;
    return true;
  }

  asignarBloque(b) {
    const m = 1.5;
    this.ruta = [[b.x0 + m, b.z0 + m], [b.x1 - m, b.z0 + m], [b.x1 - m, b.z1 - m], [b.x0 + m, b.z1 - m]];
    const lado = Math.random() * 4 | 0, t = Math.random();
    const a = this.ruta[lado], c = this.ruta[(lado + 1) % 4];
    this.pos.set(a[0] + (c[0] - a[0]) * t, 0, a[1] + (c[1] - a[1]) * t);
    this.indice = this.sentido > 0 ? (lado + 1) % 4 : lado;
    this.bloque = b;
  }

  soltarBanca() { if (this.banca) this.banca.ocupante = null; this.banca = null; if (this.estado === 'sentado' || this.estado === 'irBanca') this.estado = this.ruta ? 'pasear' : 'quieto'; }

  asustar(x, z, fuerza = 1) {
    if (this.muerto || this.hostil || this.enInterior) return;
    this.soltarBanca();
    this.miedo = Math.max(this.miedo, 6 + 4 * fuerza);
    this.huyeDe.set(x, 0, z);
    if (this.estado !== 'huir' && this.estado !== 'agachado' && fuerza >= 1 && Math.random() < 0.3) { this.estado = 'agachado'; this.tAgachado = 1.5 + Math.random() * 2; this.vozMiedo(); return; }
    if (this.estado !== 'agachado') { if (this.estado !== 'huir') this.vozMiedo(); this.estado = 'huir'; }
    this.p.manosArriba = false;
  }

  rendir() {
    if (this.muerto || this.hostil || this.enInterior) return;
    if (this.estado !== 'rendido') { this.vozMiedo(); this.juego.hud?.burbuja?.(this, ['¡No dispare!', '¡Tranquilo!', '¡Tengo familia!', '¡No me haga nada!'][Math.random() * 4 | 0]); }
    this.estado = 'rendido'; this.tRendido = 1.4; this.p.manosArriba = true;
  }

  vozMiedo() { if (Math.random() < 0.4) this.juego.audio?.grito?.(this.pos); }

  recibir(daño, desde, autor, empuje) {
    if (this.muerto) return;
    this.salud -= daño;
    this.golpe = 0.25;
    if (autor === 'sigilo') { this.salud = 0; this.morir(desde || this.pos, 'jugador'); return; }
    if (autor === 'jugador') {
      if (this.tipo === 'civil') this.juego.policia.crimen(this.salud <= 0 ? 'matar' : 'herir', this.pos);
      if (this.tipo === 'poli') this.juego.policia.crimen(this.salud <= 0 ? 'matarPoli' : 'herirPoli', this.pos);
      if (this.tipo === 'matón' && this.estado !== 'atacar') this.estado = 'atacar';
    }
    if (empuje) { this.vuela = { x: empuje.x, z: empuje.z }; this.vy = empuje.y || 0; }
    if (this.salud <= 0) this.morir(desde, autor);
    else if (this.tipo === 'civil' && desde) this.asustar(desde.x, desde.z, 1.5);
  }

  morir(desde, autor) {
    this.soltarBanca();
    this.muerto = 0.001;
    this.salud = 0;
    this.p.manosArriba = false;
    this.lado = 1;
    if (desde) { const dx = this.pos.x - desde.x, dz = this.pos.z - desde.z; if (dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw) > 0) this.lado = -1; }
    const F = this.juego.fisica;
    if (F?.listo && !this.p.sentado) {
      let vel, giro = 1.5;
      if (this.vuela) { vel = { x: this.vuela.x, y: Math.max(this.vy || 0, 1.5), z: this.vuela.z }; giro = Math.min(9, Math.hypot(vel.x, vel.z) * 0.7 + 2); }
      else if (desde) { const dx = this.pos.x - desde.x, dz = this.pos.z - desde.z, d = Math.hypot(dx, dz) || 1; vel = { x: dx / d * 1.3, y: 0.3, z: dz / d * 1.3 }; }
      this.muneco = F.muneco(this.p, vel, giro);
      if (this.muneco) { this.vuela = null; this.giroAire = 0; this.y = 0; }
    }
    this.juego.alMorirPeaton?.(this, autor);
  }

  actualizar(dt) {
    const j = this.juego;
    if (this.vuela) {
      this.pos.x += this.vuela.x * dt; this.pos.z += this.vuela.z * dt;
      this.vy -= 22 * dt; this.y += this.vy * dt;
      this.vuela.x *= 1 - 2 * dt; this.vuela.z *= 1 - 2 * dt;
      if (this.y > 0.05) this.giroAire = (this.giroAire || 0) + dt * Math.min(14, Math.hypot(this.vuela.x, this.vuela.z) * 0.9 + 3);
      if (this.y <= 0) { this.y = 0; if (this.vy < -4 && !this.reboto) { this.vy = -this.vy * 0.28; this.reboto = true; j.audio?.golpe?.(true); } else this.vy = 0; if (Math.hypot(this.vuela.x, this.vuela.z) < 1) this.vuela = null; }
      j.mundo.empujar(this.pos, 0.3);
    }
    if (this.muerto && this.muneco) {
      this.muerto += dt;
      if (!this.muneco.suelto) { this.pos.x = this.muneco.cadera.x; this.pos.z = this.muneco.cadera.z; }
      return;
    }
    if (this.muerto) {
      if (this.y > 0.3 && this.giroAire) { volar(this.p, -this.giroAire); this.grupo.position.set(this.pos.x, this.y, this.pos.z); this.grupo.rotation.y = this.yaw; return; }
      if (this.giroAire && !this.aterrizo) { this.aterrizo = true; this.muerto = 0.001; this.p.cuerpo.position.z = 0; }
      this.muerto += dt;
      tumbar(this.p, this.muerto, this.lado);
      this.grupo.position.set(this.pos.x, this.y, this.pos.z);
      this.grupo.rotation.y = this.yaw;
      return;
    }
    this.t += dt;
    if (this.golpe > 0) this.golpe -= dt;
    let mover = 0, dirx = 0, dirz = 0, apunta = false;
    const jug = j.jugador;
    const jp = jug.posicion;
    if (this.estado === 'pasear' && this.ruta) {
      const obj = this.ruta[this.indice];
      dirx = obj[0] - this.pos.x; dirz = obj[1] - this.pos.z;
      const d = Math.hypot(dirx, dirz);
      if (d < 0.6) { if (this.tipo === 'civil' && !this.objetivoMision && !this.corredor && !this.limpiador && this.bloque && Math.random() < 0.3 && this.planearCruce()) { dirx = dirz = 0; } else this.indice = (this.indice + this.sentido + 4) % 4; }
      mover = this.estado === 'pasear' ? (this.corredor ? 3.4 : this.paletero ? 0.85 : 1.25) : 0;
    } else if (this.estado === 'rendido') {
      this.tRendido -= dt;
      dirx = jp.x - this.pos.x; dirz = jp.z - this.pos.z;
      if (this.tRendido <= 0) { this.p.manosArriba = false; this.asustar(jp.x, jp.z, 1.2); this.estado = 'huir'; }
    } else if (this.estado === 'agachado') {
      this.tAgachado -= dt;
      if (this.tAgachado <= 0) { this.estado = 'huir'; this.p.cuerpo.position.y = 0; }
    } else if (this.estado === 'huir') {
      this.miedo -= dt;
      dirx = this.pos.x - this.huyeDe.x; dirz = this.pos.z - this.huyeDe.z;
      mover = 4.6;
      if (this.atasco > 0.6) { const a = Math.random() * 6.28; this.desvio = [Math.cos(a), Math.sin(a)]; this.atasco = 0; }
      if (this.desvio) { dirx += this.desvio[0] * 6; dirz += this.desvio[1] * 6; }
      if (this.miedo <= 0) { this.estado = this.ruta ? 'pasear' : 'quieto'; this.desvio = null; if (this.bloque) this.asignarRutaCercana(); }
    } else if (this.estado === 'atacar' || this.estado === 'perseguir') {
      const objetivo = jug.coche ? jug.coche.pos : jp;
      dirx = objetivo.x - this.pos.x; dirz = objetivo.z - this.pos.z;
      const d = Math.hypot(dirx, dirz);
      const arrestar = this.tipo === 'poli' && j.policia.estrellas <= 1 && !jug.coche;
      const alcance = this.arma === 'puno' || arrestar ? 1.2 : (this.tipo === 'poli' ? 16 : 20);
      if (j.jugador.muerto) { mover = 0; }
      else if (j.jugador.interior && !this.enInterior) { mover = d > 5 ? 4 : 0; }
      else if (d > alcance * 0.85 || (this.bloqueado > 0 && d > 3)) {
        mover = d > 30 ? 5.2 : 4.2;
        if (this.bloqueado > 0) { this.bloqueado -= dt; const s = this.id % 2 ? 1 : -1; dirx += -dirz / d * 6 * s; dirz += dirx / d * 6 * s; }
      }
      else {
        apunta = true;
        this.cadencia -= dt;
        if (!arrestar && this.cadencia <= 0 && d < alcance * 1.3) {
          this.cadencia = this.arma === 'subfusil' ? 0.25 : (this.tipo === 'poli' ? 1.1 : 0.9) + Math.random() * 0.7;
          if (!j.disparoEnemigo(this, objetivo)) this.bloqueado = 1.2;
        }
      }
      if (this.tipo === 'poli' && j.policia.estrellas === 0) { this.estado = 'pasear'; this.retirar = true; }
    } else if (this.estado === 'quieto') {
      mover = 0;
      if (this.volverPasear && this.t > this.volverPasear) { this.volverPasear = 0; if (this.ruta) this.estado = 'pasear'; }
    } else if (this.estado === 'esperarCruce') {
      const C = this.cruce; mover = 0; dirx = C.meta[0] - this.pos.x; dirz = C.meta[1] - this.pos.z; this.cruceT = (this.cruceT || 0) + dt;
      if ((j.semaforos?.rojoRestante(C.i, C.k, C.eje) || 0) > 10.2) { this.estado = 'cruzar'; this.cruceT = 0; }
      else if (this.cruceT > 40) { this.estado = 'pasear'; this.cruce = null; this.cruceT = 0; this.indice = (this.indice + this.sentido + 4) % 4; }
    } else if (this.estado === 'cruzar') {
      const C = this.cruce; dirx = C.meta[0] - this.pos.x; dirz = C.meta[1] - this.pos.z; mover = 1.9;
      if (Math.hypot(dirx, dirz) < 0.5) {
        const b = C.bloque, m = 1.5;
        this.bloque = b; this.ruta = [[b.x0 + m, b.z0 + m], [b.x1 - m, b.z0 + m], [b.x1 - m, b.z1 - m], [b.x0 + m, b.z1 - m]];
        this.indice = (C.llega + this.sentido + 4) % 4; this.estado = 'pasear'; this.cruce = null; this.cruceT = 0;
      }
    } else if (this.estado === 'irPunto') {
      dirx = this.meta.x - this.pos.x; dirz = this.meta.z - this.pos.z; mover = this.metaVel || 1.3;
      if (Math.hypot(dirx, dirz) < 0.35) { this.estado = 'quieto'; this.llego = true; dirx = dirz = 0; mover = 0; }
    } else if (this.estado === 'irBanca') {
      const b = this.banca; dirx = b.x - this.pos.x; dirz = b.z - this.pos.z; mover = 1.3;
      if (Math.hypot(dirx, dirz) < 0.45) { this.estado = 'sentado'; this.sentadoT = 18 + Math.random() * 35; this.pos.set(b.x, 0, b.z); this.yaw = b.yaw; dirx = dirz = 0; mover = 0; }
      if (this.t > (this.limiteBanca || 1e9)) this.soltarBanca();
    } else if (this.estado === 'sentado') {
      mover = 0; this.sentadoT -= dt; this.yaw = this.banca.yaw;
      if (this.sentadoT <= 0) this.soltarBanca();
        } else if (this.estado === 'charla') {
      this.charlaT -= dt;
      const o = this.con;
      if (!o || o.muerto || o.estado !== 'charla' || this.charlaT <= 0) { this.estado = this.ruta ? 'pasear' : 'quieto'; this.proxCharla = this.t + 30 + Math.random() * 50; }
      else { dirx = o.pos.x - this.pos.x; dirz = o.pos.z - this.pos.z; mover = 0; }
    }
    if (this.estado === 'pasear' && this.tipo === 'civil' && !this.objetivoMision && this.t > (this.proxBanca || (this.proxBanca = 5 + Math.random() * 30))) {
      this.proxBanca = this.t + 3;
      const b = j.ciudad.bancas?.find(q => !q.ocupante && Math.abs(q.x - this.pos.x) + Math.abs(q.z - this.pos.z) < 48);
      if (b && Math.random() < 0.6) { b.ocupante = this; this.banca = b; this.estado = 'irBanca'; this.limiteBanca = this.t + 50; this.proxBanca = this.t + 60 + Math.random() * 60; }
    }
    if (this.estado === 'pasear' && this.tipo === 'civil' && !this.habito && this.t > this.proxCharla && !this.objetivoMision) {
      this.proxCharla = this.t + 1.5;
      const o = j.peatones.find(q => q !== this && q.tipo === 'civil' && q.estado === 'pasear' && !q.habito && !q.objetivoMision && Math.abs(q.pos.x - this.pos.x) + Math.abs(q.pos.z - this.pos.z) < 5);
      if (o) { this.proxCharla = this.t + 40 + Math.random() * 40; const T = 6 + Math.random() * 8; this.estado = o.estado = 'charla'; this.con = o; o.con = this; this.charlaT = o.charlaT = T; }
    }
    if (this.habito === 'celular' && this.estado === 'pasear') mover *= 0.8;
    const graniza = this.tipo === 'civil' && this.estado === 'pasear' && j.granizo?.activo > 0 && !j.jugador.interior && !this.enInterior;
    if (graniza) mover *= 2.6;
    const d = Math.hypot(dirx, dirz);
    if (d > 0.01) {
      const ya = Math.atan2(dirx, dirz);
      let dd = ya - this.yaw;
      while (dd > Math.PI) dd -= 6.283; while (dd < -Math.PI) dd += 6.283;
      this.yaw += dd * Math.min(1, dt * 8);
      if (mover) {
        this.pos.x += (dirx / d) * mover * dt; this.pos.z += (dirz / d) * mover * dt;
      }
    }
    const antes = this.pos.x + this.pos.z;
    const c = j.mundo.empujar(this.pos, 0.3);
    this.atasco = c ? (this.atasco || 0) + dt : 0;
    if (c && this.estado === 'pasear' && this.atasco > 1.5) { this.sentido *= -1; this.indice = (this.indice + this.sentido + 4) % 4; this.atasco = 0; }
    this.vel = mover;
    const dj = Math.abs(this.pos.x - jp.x) + Math.abs(this.pos.z - jp.z);
    nivelDetalle(this.p, dj < 45);
    animar(this.p, dt, mover, this.arma, apunta);
    if (this.estado === 'agachado') { const P = this.p; P.cuerpo.position.y = -0.4; P.pi.rotation.x = -1.5; P.pd.rotation.x = -1.3; P.ri.rotation.x = 2.3; P.rd.rotation.x = 2.1; P.cuerpo.rotation.x = 0.35; P.bi.rotation.set(-2.8, 0, 0.5); P.bd.rotation.set(-2.8, 0, -0.5); P.ci.rotation.x = -1.9; P.cd.rotation.x = -1.9; }
    else if (this.p.cuerpo.position.y < -0.1) this.p.cuerpo.position.y = 0;
    const P = this.p, tt = this.t;
    if (this.estado === 'sentado' && this.banca?.pie) {
      if (!P.bocado) { P.bocado = new THREE.Mesh(this.banca.comida === 'elotes' ? new THREE.CylinderGeometry(0.025, 0.022, 0.16, 8) : new THREE.BoxGeometry(0.09, 0.025, 0.06), new THREE.MeshStandardMaterial({ color: this.banca.comida === 'elotes' ? '#f0d060' : '#d8a050', roughness: 0.7 })); P.bocado.position.set(0, -0.11, 0.03); P.md.add(P.bocado); }
      P.bocado.visible = true;
      const k = Math.max(0, Math.sin(tt * 1.3 + this.pos.x));
      P.bd.rotation.set(-0.9 - k * 1.3, 0.25, -0.2); P.cd.rotation.x = -1.2 - k * 0.6; P.cabeza.rotation.x = 0.15 - k * 0.1;
      P.bi.rotation.set(0.05, 0, 0.1); P.ci.rotation.x = -0.2;
    } else if (P.bocado) P.bocado.visible = false;
    if (this.estado === 'sentado' && !this.banca?.pie) {
      sentar(P); P.cuerpo.position.set(0, -0.44, 0.02); P.cuerpo.rotation.x = 0.05;
      if (this.habito === 'celular') { P.telefono.visible = true; P.bd.rotation.set(-1.2, 0.3, 0.15); P.cd.rotation.x = -1.4; P.cabeza.rotation.x = 0.45; }
      else { P.bi.rotation.set(-0.5, 0, 0.1); P.bd.rotation.set(-0.5, 0, -0.1); P.ci.rotation.x = P.cd.rotation.x = -0.7; P.cabeza.rotation.y = Math.sin(tt * 0.3 + this.yaw) * 0.5; }
    }
    if (this.estado !== 'charla') P.habla = false;
    const lluvia = j.ambiente.lluvia > 0.3 && this.tipo === 'civil' && this.estado !== 'sentado' && (this.conParaguas ?? (this.conParaguas = Math.random() < 0.65));
    if (P.paraguas) { P.paraguas.visible = !!lluvia && this.estado !== 'huir'; if (P.paraguas.visible) { P.bi.rotation.set(-1.05, -0.35, 0.1); P.ci.rotation.x = -1.55; } }
    if (!jug.coche && !jug.muerto && this.tipo === 'civil' && (this.estado === 'pasear' || this.estado === 'quieto' || this.estado === 'sentado')) {
      const dx = jp.x - this.pos.x, dz = jp.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d < 5 && d > 0.2) {
        let rel = Math.atan2(dx, dz) - this.yaw; while (rel > Math.PI) rel -= 6.283; while (rel < -Math.PI) rel += 6.283;
        if (Math.abs(rel) < 1.9) { this.mira = (this.mira || 0) + (Math.max(-1.1, Math.min(1.1, rel)) - (this.mira || 0)) * Math.min(1, dt * 5); P.cabeza.rotation.y = this.mira; }
        const G = jug.gesto?.tipo;
        if (G && d < 9 && this.estado !== 'sentado') {
          if (this.estado === 'pasear') { this.estado = 'quieto'; this.volverPasear = this.t + 3 + Math.random() * 2; }
          const tt2 = this.t * 9 + this.pos.x;
          if (G === 'saludar') { P.bd.rotation.set(-2.6, 0, -0.3 + Math.sin(tt2) * 0.3); P.cd.rotation.x = -0.4; }
          else if (G === 'bailar' || G === 'festejar') { const k = Math.sin(tt2 * 1.4); P.bi.rotation.set(-1.3, -0.5 + k * 0.25, 0); P.bd.rotation.set(-1.3, 0.5 - k * 0.25, 0); P.ci.rotation.x = P.cd.rotation.x = -0.6; }
        }
        if (d < 0.75 && jug.velocidad > 3.2 && this.t - (this.ultimoEmpujon || -9) > 2.5) {
          this.ultimoEmpujon = this.t; this.golpe = 0.22;
          this.pos.x -= dx / d * 0.35; this.pos.z -= dz / d * 0.35;
          j.hud.burbuja?.(this, ['¡Fíjate!', '¡Oye, con cuidado!', '¡Ay, perdón!', '¿Qué te pasa?', '¡Ve por dónde caminas!'][Math.random() * 5 | 0]);
          j.audio?.golpe?.(false);
        }
      } else if (this.mira) this.mira *= 1 - Math.min(1, dt * 3);
    }
    P.expresion = this.estado === 'huir' || this.estado === 'agachado' || this.estado === 'rendido' || this.golpe > 0 ? 'miedo' : this.estado === 'atacar' || this.estado === 'perseguir' || (this.tipo === 'matón' && this.estado !== 'pasear') ? 'enojo' : null;
    if (this.estado === 'pasear' && this.habito === 'celular') {
      P.telefono.visible = true; P.bd.rotation.set(-1.15, 0.3, 0.15); P.cd.rotation.x = -1.35; P.cabeza.rotation.x = 0.38;
    } else if (P.telefono.visible && this.arma === 'puno') P.telefono.visible = false;
    if (this.estado === 'charla') {
      const habla = Math.sin(tt * 0.9 + this.yaw) > 0; P.habla = habla;
      if (habla) { P.bd.rotation.set(-0.7 + Math.sin(tt * 3.1) * 0.25, 0.2, -0.2 + Math.sin(tt * 2.3) * 0.15); P.cd.rotation.x = -1.1 + Math.sin(tt * 4) * 0.3; P.bi.rotation.set(-0.3 + Math.sin(tt * 2.6 + 1) * 0.2, 0, 0.2); P.ci.rotation.x = -0.6; }
      else { P.bi.rotation.set(0.05, 0, 0.12); P.bd.rotation.set(0.05, 0, -0.12); P.ci.rotation.x = -0.15; P.cd.rotation.x = -0.15; }
      P.cabeza.rotation.x = (habla ? Math.sin(tt * 2.2) * 0.08 : Math.max(0, Math.sin(tt * 1.7)) * 0.12);
      P.cabeza.rotation.y = Math.sin(tt * 0.5) * 0.2;
    }
    if (((this.estado === 'huir' && this.cubre) || (this.estado === 'pasear' && j.granizo?.activo > 0 && !this.enInterior)) && this.tipo === 'civil') { P.bi.rotation.set(-2.6, 0, 0.5); P.bd.rotation.set(-2.6, 0, -0.5); P.ci.rotation.x = -1.9; P.cd.rotation.x = -1.9; P.cabeza.rotation.x = 0.3; }
    if (this.golpe > 0) { const k = this.golpe / 0.25; P.cuerpo.rotation.x = -0.3 * k; P.torso.rotation.z = (this.yaw % 1 > 0.5 ? 0.3 : -0.3) * k; P.cabeza.rotation.x = -0.45 * k; P.bi.rotation.z += 0.7 * k; P.bd.rotation.z -= 0.7 * k; }
    this.grupo.position.set(this.pos.x, this.y, this.pos.z);
    this.grupo.rotation.y = this.yaw;
  }

  asignarRutaCercana() {
    const bloques = this.juego.ciudad.bloques;
    let mejor = null, md = 1e9;
    for (const b of bloques) {
      const dx = Math.max(b.x0 - this.pos.x, 0, this.pos.x - b.x1), dz = Math.max(b.z0 - this.pos.z, 0, this.pos.z - b.z1);
      const d = dx + dz;
      if (d < md) { md = d; mejor = b; }
    }
    if (!mejor) return;
    const m = 1.5;
    this.ruta = [[mejor.x0 + m, mejor.z0 + m], [mejor.x1 - m, mejor.z0 + m], [mejor.x1 - m, mejor.z1 - m], [mejor.x0 + m, mejor.z1 - m]];
    let mi = 0, mm = 1e9;
    this.ruta.forEach((q, i) => { const dd = Math.hypot(q[0] - this.pos.x, q[1] - this.pos.z); if (dd < mm) { mm = dd; mi = i; } });
    this.indice = mi;
    this.bloque = mejor;
  }
}
