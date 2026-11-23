import * as THREE from 'three';
import { Coche, nuevaRutaIA, puntoCalleAleatorio } from './vehiculos.js?v=202611221845';
import { Peaton } from './peatones.js?v=202611221845';
import { Helicoptero } from './helicoptero.js?v=202611221845';
import { linea, indiceLinea, LIMITE } from './ciudad.js?v=202611221845';

const MAX_COCHES = [0, 2, 3, 4, 6, 7];

export class Policia {
  constructor(juego) {
    this.juego = juego;
    this.estrellas = 0;
    this.sinVer = 0;
    this.visto = false;
    this.unidades = [];
    this.agentes = [];
    this.helicoptero = null;
    this.conHeli = true;
    this.reaparicion = 0;
    this.calor = 0;
    this.retenes = []; this.tReten = 20;
  }

  subir(n) {
    if (n >= 4 && (this.estrellas || 0) < 4) this.juego.noticias?.avisar('estrellas');
    const antes = this.estrellas;
    this.estrellas = Math.min(5, Math.max(this.estrellas, n));
    if (this.estrellas > antes) { this.sinVer = 0; this.juego.audio?.alerta(); }
  }

  crimen(tipo, donde) {
    const j = this.juego;
    const testigoPoli = this.poliCerca(donde, 45);
    if (tipo === 'disparo') { if (testigoPoli || this.civilesCerca(donde, 22) > 0) this.subir(Math.max(1, this.estrellas)); }
    else if (tipo === 'herir') this.subir(Math.max(1, this.estrellas));
    else if (tipo === 'matar') { this.calor++; this.subir(Math.min(3, Math.max(1, Math.ceil(this.calor / 2), this.estrellas))); }
    else if (tipo === 'herirPoli') this.subir(Math.max(2, this.estrellas));
    else if (tipo === 'matarPoli') { this.subir(this.estrellas + 1); }
    else if (tipo === 'robo') { if (testigoPoli) this.subir(Math.max(1, this.estrellas)); }
    else if (tipo === 'atropello') { if (testigoPoli || this.estrellas > 0) this.subir(Math.max(1, this.estrellas)); }
    else if (tipo === 'chocarPoli') this.subir(Math.max(1, this.estrellas));
    else if (tipo === 'explosion') this.subir(Math.max(2, this.estrellas));
    if (this.estrellas > 0) this.sinVer = 0;
  }

  poliCerca(p, r) {
    for (const u of this.unidades) if (!u.quemado && u.pos.distanceTo(p) < r) return true;
    for (const a of this.agentes) if (!a.muerto && a.pos.distanceTo(p) < r) return true;
    for (const c of this.juego.coches) if (c.tipo === 'policia' && !c.quemado && c.pos.distanceTo(p) < r) return true;
    return false;
  }
  civilesCerca(p, r) {
    let n = 0;
    for (const q of this.juego.peatones) if (!q.muerto && q.tipo === 'civil' && q.pos.distanceTo(p) < r) n++;
    return n;
  }

  limpiar() {
    this.estrellas = 0; this.calor = 0; this.sinVer = 0;
    for (const u of this.unidades.concat(this.retenes)) { u.sirena = false; u.conductor = 'ia'; u.ia = nuevaRutaIA(u.pos.x, u.pos.z, u.yaw); u.persecucion = false; u.reten = false; }
    this.retenes = [];
    this.unidades = [];
    for (const a of this.agentes) { a.estado = 'pasear'; a.retirar = true; a.asignarRutaCercana(); }
    this.agentes = [];
    if (this.helicoptero) { this.helicoptero.retirar = true; }
  }

  actualizar(dt) {
    const j = this.juego;
    const jp = j.jugador.posicion;
    this.unidades = this.unidades.filter(u => j.coches.includes(u));
    this.agentes = this.agentes.filter(a => j.peatones.includes(a));
    if (this.estrellas === 0) { this.actualizarHeli(dt, false); return; }
    let visto = !!j.jugador.interior;
    for (const u of this.unidades) if (!u.quemado && u.pos.distanceTo(jp) < 95) visto = true;
    for (const a of this.agentes) if (!a.muerto && a.pos.distanceTo(jp) < 60) visto = true;
    if (this.helicoptero?.ve) visto = true;
    this.visto = visto;
    if (visto) this.sinVer = 0; else this.sinVer += dt;
    const limite = 10 + this.estrellas * 5;
    if (this.sinVer > limite) {
      this.limpiar();
      j.hud.aviso('Perdiste a la policía.');
      return;
    }
    this.reaparicion -= dt;
    const vivos = this.unidades.filter(u => !u.quemado).length;
    if (vivos < MAX_COCHES[this.estrellas] && this.reaparicion <= 0) {
      const p = puntoCalleAleatorio(jp, 70, 130);
      if (p) {
        const moto = this.estrellas >= 2 && Math.random() < 0.3;
        const c = new Coche(j, moto ? 'moto' : 'policia', '#f2f4f7', p.x, p.z, p.yaw);
        if (moto) this.vestirMoto(c);
        c.conductor = 'policia';
        c.ia = nuevaRutaIA(p.x, p.z, p.yaw);
        c.persecucion = true;
        c.tripulantes = moto ? 1 : this.estrellas >= 3 ? 2 : 1;
        j.coches.push(c);
        this.unidades.push(c);
      }
      this.reaparicion = 1.8;
    }
    for (const c of j.coches) {
      if (c.tipo !== 'policia' || c.conductor !== 'ia' || c.quemado || this.unidades.includes(c)) continue;
      if (c.pos.distanceTo(jp) < 130 && this.unidades.length < MAX_COCHES[this.estrellas] + 1) {
        c.conductor = 'policia'; c.persecucion = true; c.sirena = true; c.tripulantes = 2; c.ia = nuevaRutaIA(c.pos.x, c.pos.z, c.yaw);
        this.unidades.push(c);
      }
    }
    for (const u of this.unidades) {
      if (u.quemado || u.conductor !== 'policia') continue;
      const d = u.pos.distanceTo(jp);
      if (!j.jugador.coche && d < 14 && u.vel < 5 && u.tripulantes > 0 && this.agentes.length < 8) {
        for (let k = 0; k < u.tripulantes; k++) {
          const s = k === 0 ? 1 : -1;
          const a = new Peaton(j, { tipo: 'poli', x: u.pos.x - u.fz * 1.8 * s, z: u.pos.z + u.fx * 1.8 * s, estado: 'perseguir' });
          j.peatones.push(a);
          this.agentes.push(a);
        }
        u.tripulantes = 0;
        u.conductor = null;
        if (u.motoPoli && u.piloto) u.piloto.visible = false;
      }
      if (d > 260) { u.quitar(); j.coches.splice(j.coches.indexOf(u), 1); }
    }
    for (const a of this.agentes) {
      if (a.muerto || a.estado === 'aturdido') continue;
      a.estado = 'perseguir';
      if (this.estrellas >= 2 && a.arma === 'pistola' && Math.random() < 0.001) a.arma = this.estrellas >= 4 ? 'subfusil' : 'pistola';
    }
    this.tReten -= dt;
    const cj = j.jugador.coche;
    if (this.estrellas >= 3 && this.tReten <= 0 && cj && cj.vel > 10 && !j.misiones?.activa?.sinReten) { this.tReten = 38 + Math.random() * 20; this.ponerReten(cj); }
    this.retenes = this.retenes.filter(c => { if (!j.coches.includes(c)) return false; if (c.pos.distanceTo(jp) > 260) { c.quitar(); j.coches.splice(j.coches.indexOf(c), 1); return false; } return true; });
    this.actualizarHeli(dt, this.estrellas >= 4);
  }

  ponerReten(cj) {
    const j = this.juego, fx = Math.sin(cj.yaw), fz = Math.cos(cj.yaw), d = 95 + Math.random() * 25;
    const eje = Math.abs(fx) > Math.abs(fz) ? 'x' : 'z';
    let x = cj.pos.x + fx * d, z = cj.pos.z + fz * d;
    if (eje === 'x') { z = linea(indiceLinea(cj.pos.z)); const cx = linea(indiceLinea(x)); if (Math.abs(x - cx) < 14) x = cx + Math.sign(x - cx || 1) * 16; }
    else { x = linea(indiceLinea(cj.pos.x)); const cz = linea(indiceLinea(z)); if (Math.abs(z - cz) < 14) z = cz + Math.sign(z - cz || 1) * 16; }
    if (Math.abs(x) > LIMITE - 12 || Math.abs(z) > LIMITE - 12) return;
    const yaw = eje === 'x' ? 0.18 : Math.PI / 2 + 0.18;
    for (const lat of [-3.4, 3.4]) {
      const px = eje === 'x' ? x + (lat > 0 ? 0.8 : -0.8) : x + lat, pz = eje === 'x' ? z + lat : z + (lat > 0 ? 0.8 : -0.8);
      const c = new Coche(j, 'policia', '#f2f4f7', px, pz, yaw + (lat > 0 ? Math.PI : 0));
      c.conductor = null; c.sirena = true; c.reten = true; j.coches.push(c); this.retenes.push(c);
    }
    for (let k = 0; k < 3; k++) {
      const ax = eje === 'x' ? x - Math.sign(fx) * 3.5 : x + (k - 1) * 3, az = eje === 'x' ? z + (k - 1) * 3 : z - Math.sign(fz) * 3.5;
      const a = new Peaton(j, { tipo: 'poli', x: ax, z: az, estado: 'perseguir', arma: k === 1 && this.estrellas >= 4 ? 'escopeta' : 'pistola' });
      j.peatones.push(a); this.agentes.push(a);
    }
    j.hud.notificar('alerta', '¡Retén adelante!', 'La policía cerró la calle. Busca otra salida.', 3.5);
  }

  vestirMoto(c) {
    const j = this.juego;
    if (c.piloto) c.carro.remove(c.piloto);
    const pp = j.crearPiloto?.({ poli: true });
    if (pp) { pp.grupo.position.set(0, 0.42, -0.15); c.carro.add(pp.grupo); c.piloto = pp.grupo; c.pilotoP = pp; }
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.1)), b2 = b1.clone(); b1.position.set(-0.13, 1.05, -0.78); b2.position.set(0.13, 1.05, -0.78);
    const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5), new THREE.MeshStandardMaterial({ color: '#222' })); asta.position.set(0, 0.8, -0.78);
    const caja = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.36), new THREE.MeshStandardMaterial({ color: '#f2f4f7', roughness: 0.4 })); caja.position.set(0, 0.72, -0.62);
    const franja = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.06, 0.37), new THREE.MeshStandardMaterial({ color: '#1f4fa8' })); franja.position.set(0, 0.74, -0.62);
    c.carro.add(b1, b2, asta, caja, franja); c.barra = [b1, b2]; c.motoPoli = true; c.sirena = true;
  }

  actualizarHeli(dt, quiere) {
    const j = this.juego;
    if (quiere && !this.helicoptero && this.conHeli && !j.jugador.interior) {
      const jp = j.jugador.posicion, a = Math.random() * Math.PI * 2;
      this.helicoptero = new Helicoptero(j, jp.x + Math.cos(a) * 200, jp.z + Math.sin(a) * 200);
    }
    const h = this.helicoptero;
    if (!h) return;
    if (!h.actualizar(dt, quiere)) { h.quitar(); this.helicoptero = null; }
  }
}
