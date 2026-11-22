import * as THREE from 'three';
import { Coche, nuevaRutaIA, puntoCalleAleatorio } from './vehiculos.js?v=202611220135';
import { Peaton } from './peatones.js?v=202611220135';
import { linea, indiceLinea, LIMITE } from './ciudad.js?v=202611220135';

const MAX_COCHES = [0, 1, 2, 3, 4, 5];

export class Policia {
  constructor(juego) {
    this.juego = juego;
    this.estrellas = 0;
    this.sinVer = 0;
    this.visto = false;
    this.unidades = [];
    this.agentes = [];
    this.helicoptero = null;
    this.conHeli = false;
    this.reaparicion = 0;
    this.calor = 0;
    this.retenes = []; this.tReten = 20;
  }

  subir(n) {
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
    for (const u of this.unidades) if (!u.quemado && u.pos.distanceTo(jp) < 75) visto = true;
    for (const a of this.agentes) if (!a.muerto && a.pos.distanceTo(jp) < 50) visto = true;
    if (this.helicoptero && !this.helicoptero.retirar && Math.hypot(this.helicoptero.pos.x - jp.x, this.helicoptero.pos.z - jp.z) < 60) visto = true;
    this.visto = visto;
    if (visto) this.sinVer = 0; else this.sinVer += dt;
    const limite = 7 + this.estrellas * 3.5;
    if (this.sinVer > limite) {
      this.limpiar();
      j.hud.aviso('Perdiste a la policía.');
      return;
    }
    this.reaparicion -= dt;
    const vivos = this.unidades.filter(u => !u.quemado).length;
    if (vivos < MAX_COCHES[this.estrellas] && this.reaparicion <= 0) {
      const p = puntoCalleAleatorio(jp, 85, 150);
      if (p) {
        const c = new Coche(j, 'policia', '#f2f4f7', p.x, p.z, p.yaw);
        c.conductor = 'policia';
        c.ia = nuevaRutaIA(p.x, p.z, p.yaw);
        c.persecucion = true;
        c.tripulantes = this.estrellas >= 3 ? 2 : 1;
        j.coches.push(c);
        this.unidades.push(c);
      }
      this.reaparicion = 2.5;
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
      }
      if (d > 260) { u.quitar(); j.coches.splice(j.coches.indexOf(u), 1); }
    }
    for (const a of this.agentes) {
      if (a.muerto) continue;
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

  actualizarHeli(dt, quiere) {
    const j = this.juego;
    const jp = j.jugador.posicion;
    if (quiere && !this.helicoptero && this.conHeli) {
      this.helicoptero = crearHeli(j);
      this.helicoptero.pos.set(jp.x + 180, 45, jp.z + 120);
    }
    const h = this.helicoptero;
    if (!h) return;
    if (!quiere) h.retirar = true;
    h.t += dt;
    let tx, tz, ty;
    if (h.retirar) { tx = h.pos.x + 80; tz = h.pos.z + 80; ty = 70; }
    else { tx = jp.x + Math.cos(h.t * 0.35) * 28; tz = jp.z + Math.sin(h.t * 0.35) * 28; ty = 32; }
    const dx = tx - h.pos.x, dz = tz - h.pos.z, d = Math.hypot(dx, dz);
    const v = Math.min(d, 28) * dt * (h.retirar ? 1.5 : 1);
    if (d > 0.1) { h.pos.x += dx / d * v; h.pos.z += dz / d * v; }
    h.pos.y += (ty - h.pos.y) * dt;
    h.grupo.position.copy(h.pos);
    h.grupo.rotation.y = Math.atan2(jp.x - h.pos.x, jp.z - h.pos.z);
    h.grupo.rotation.x = 0.12;
    h.helice.rotation.y += dt * 40;
    h.cola.rotation.x += dt * 50;
    h.foco.position.set(jp.x, 0.08, jp.z);
    h.foco.visible = !h.retirar && j.ambiente.noche > 0.3;
    if (!h.retirar && this.estrellas >= 5 && !j.jugador.muerto) {
      h.cadencia = (h.cadencia || 2) - dt;
      if (h.cadencia <= 0) { h.cadencia = 0.18; h.rafaga = (h.rafaga || 0) + 1; if (h.rafaga > 6) { h.rafaga = 0; h.cadencia = 2.5; } j.disparoDesde(h.pos, jp, 6, 0.35, 'heli'); }
    }
    if (h.retirar && Math.hypot(h.pos.x - jp.x, h.pos.z - jp.z) > 300) {
      j.escena.remove(h.grupo); j.escena.remove(h.foco);
      this.helicoptero = null;
    }
  }
}

function crearHeli(j) {
  const g = new THREE.Group();
  const m = c => new THREE.MeshLambertMaterial({ color: c });
  const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(1.7, 10, 8), m('#1d2b4a')); cuerpo.scale.set(1, 0.9, 1.6); g.add(cuerpo);
  const vid = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), m('#9cc6e8')); vid.position.set(0, 0.3, 1.4); vid.scale.set(1, 0.8, 0.8); g.add(vid);
  const colaB = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 5), m('#1d2b4a')); colaB.position.set(0, 0.3, -4); g.add(colaB);
  const helice = new THREE.Mesh(new THREE.BoxGeometry(9, 0.08, 0.35), m('#222')); helice.position.y = 1.7;
  const h2 = helice.clone(); h2.rotation.y = Math.PI / 2; helice.add(h2); g.add(helice);
  const cola = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.2), m('#222')); cola.position.set(0.25, 0.5, -6.4); g.add(cola);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.2), m('#333')); p.position.set(s * 1.1, -1.6, 0); g.add(p); }
  const luz = new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshBasicMaterial({ color: '#ff3040' })); luz.position.set(0, -1.2, -1); g.add(luz);
  j.escena.add(g);
  const foco = new THREE.Mesh(new THREE.CircleGeometry(6, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fffbe0', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  j.escena.add(foco);
  return { grupo: g, helice, cola, foco, pos: new THREE.Vector3(), t: 0, retirar: false };
}
