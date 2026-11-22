import * as THREE from 'three';
import { enLago, sobreMuelle } from './ciudad.js?v=202611220550';
import { crearPersona, animar, golpe as animGolpe, tumbar, levantar, sentar, ponerChamarra, montar, ROPA } from './persona.js?v=202611220550';

export const ARMAS = {
  puno: { nombre: 'PUÑOS', tipo: 'golpe', daño: 14, cadencia: 0.42, alcance: 1.7, empuje: 3, cargador: 0 },
  bate: { nombre: 'BATE', tipo: 'golpe', daño: 45, cadencia: 0.62, alcance: 2.5, empuje: 9, cargador: 0 },
  cuchillo: { nombre: 'CUCHILLO', tipo: 'golpe', daño: 40, cadencia: 0.34, alcance: 1.9, empuje: 1.5, cargador: 0 },
  pistola: { nombre: 'PISTOLA', tipo: 'bala', daño: 34, cadencia: 0.28, alcance: 120, disp: 0.012, cargador: 12, recarga: 1.1 },
  escopeta: { nombre: 'ESCOPETA', tipo: 'perdigon', daño: 17, perdigones: 8, cadencia: 0.85, alcance: 40, disp: 0.1, cargador: 6, recarga: 2 },
  subfusil: { nombre: 'SUBFUSIL', tipo: 'bala', daño: 19, cadencia: 0.085, alcance: 100, disp: 0.03, cargador: 30, recarga: 1.6 },
  rifle: { nombre: 'RIFLE', tipo: 'bala', daño: 31, cadencia: 0.11, alcance: 170, disp: 0.013, cargador: 30, recarga: 1.9 },
  granada: { nombre: 'GRANADAS', tipo: 'lanzar', cadencia: 0.9, cargador: 0 },
  machete: { nombre: 'MACHETE', tipo: 'golpe', daño: 62, cadencia: 0.5, alcance: 2.2, empuje: 3, cargador: 0 },
  llave: { nombre: 'LLAVE INGLESA', tipo: 'golpe', daño: 34, cadencia: 0.48, alcance: 2, empuje: 6, cargador: 0 },
  revolver: { nombre: 'REVÓLVER', tipo: 'bala', daño: 62, cadencia: 0.55, alcance: 130, disp: 0.008, cargador: 6, recarga: 1.6 },
  recortada: { nombre: 'RECORTADA', tipo: 'perdigon', daño: 20, perdigones: 10, cadencia: 0.45, alcance: 22, disp: 0.17, cargador: 2, recarga: 1.4 },
  ametralladora: { nombre: 'AMETRALLADORA', tipo: 'bala', daño: 22, cadencia: 0.07, alcance: 130, disp: 0.045, cargador: 100, recarga: 3.2 },
  francotirador: { nombre: 'FRANCOTIRADOR', tipo: 'bala', daño: 160, cadencia: 1.2, alcance: 320, disp: 0.0015, cargador: 5, recarga: 2.4, zoom: 16 },
  lanzacohetes: { nombre: 'LANZACOHETES', tipo: 'cohete', cadencia: 1.4, alcance: 200, cargador: 1, recarga: 2.2 },
  molotov: { nombre: 'MOLOTOV', tipo: 'lanzar', cadencia: 0.9, cargador: 0 }
};
export const ORDEN = ['puno', 'bate', 'cuchillo', 'machete', 'llave', 'pistola', 'revolver', 'escopeta', 'recortada', 'subfusil', 'ametralladora', 'rifle', 'francotirador', 'lanzacohetes', 'granada', 'molotov'];
export const CATEGORIAS = [
  { id: 'mano', nombre: 'CUERPO A CUERPO', armas: ['puno', 'bate', 'cuchillo', 'machete', 'llave'] },
  { id: 'pistolas', nombre: 'PISTOLAS', armas: ['pistola', 'revolver'] },
  { id: 'escopetas', nombre: 'ESCOPETAS', armas: ['escopeta', 'recortada'] },
  { id: 'subfusiles', nombre: 'AUTOMÁTICAS', armas: ['subfusil', 'ametralladora'] },
  { id: 'rifles', nombre: 'RIFLES', armas: ['rifle', 'francotirador'] },
  { id: 'pesadas', nombre: 'PESADAS', armas: ['lanzacohetes'] },
  { id: 'lanzables', nombre: 'LANZABLES', armas: ['granada', 'molotov'] }
];
export const tieneArma = (j, k) => { const s = j.armas[k]; return !!s && (ARMAS[k].tipo !== 'lanzar' || s.reserva > 0); };

import { Realista } from './realista.js?v=202611220550';
export const REALISTAS = {};
export function realistaDe(nombre) { const k = nombre === 'Lucía' ? 'lucia' : nombre === 'Matías' ? 'matias' : nombre; return REALISTAS[k] || (REALISTAS[k] = new Realista(k)); }

export const PROTAS = {
  'Matías': { base: { piel: '#b07650', camisa: '#f4f1ea', pantalon: '#22304d', pelo: '#15100c', gorra: '#7a2f3a', colorSombrero: '#3a2a1a' }, chamarra: '#7a2f3a', estilo: { cara: 0, ropa: null, estiloPelo: 'corto', barba: 'barba' } },
  'Lucía': { base: { piel: '#c08a60', camisa: '#1c1c22', pantalon: '#6a7048', pelo: '#120d0a', zapatos: '#5a3a24', gorra: '#111', colorSombrero: '#1a1a1a' }, chamarra: '#18181d', estilo: { cara: 5, ropa: null, estiloPelo: 'chongo' } }
};

export function modeloProtagonista(nombre, estilo) {
  const P = PROTAS[nombre];
  const p = crearPersona({ sombrero: null, peloLargo: false, falda: false, fijo: true, complexion: 1, edad: 'adulto', sinAccesorios: true, mangaCorta: false, lentes: false, reloj: true, collar: nombre === 'Lucía', aretes: nombre === 'Lucía', mujer: nombre === 'Lucía', barba: nombre === 'Matías' ? 'barba' : null, ...P.base, ...estilo });
  if (estilo.ropa === null) ponerChamarra(p, P.chamarra);
  return p;
}

const angulo = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

export class Jugador {
  constructor(juego) {
    this.juego = juego;
    this.personaje = 'Matías';
    this.estilos = { 'Matías': { ...PROTAS['Matías'].estilo }, 'Lucía': { ...PROTAS['Lucía'].estilo } };
    this.construirModelo();
    this.pos = new THREE.Vector3();
    this.y = 0; this.vy = 0;
    this.yaw = 0;
    this.salud = 100; this.chaleco = 0; this.saludMax = 100; this.bonoVel = 0; this.bonoGolpe = 0;
    this.dinero = 0;
    this.armas = { puno: { cargador: 0, reserva: 0 } };
    this.arma = 'puno';
    this.coche = null;
    this.cadencia = 0;
    this.recargando = 0;
    this.velocidad = 0;
    this.apunta = false;
    this.disparando = false;
    this.golpeT = 0;
    this.muerto = 0;
    juego.escena.add(this.grupo);
  }

  construirModelo() {
    this.p = modeloProtagonista(this.personaje, this.estilo);
    this.grupo = this.p.grupo;
  }

  get estilo() { return this.estilos[this.personaje]; }

  vestir(cambios) {
    Object.assign(this.estilo, cambios);
    if ('ropa' in cambios) { const R = realistaDe(this.personaje); const p = cambios.ropa === null ? null : ROPA[cambios.ropa]; R.teñirChamarra(p ? '#' + p.color.getHexString() : null); }
    if ('estiloPelo' in cambios) realistaDe(this.personaje).peinado(cambios.estiloPelo);
    const viejo = this.grupo, visible = viejo.visible;
    const padre = viejo.parent;
    padre?.remove(viejo);
    this.construirModelo();
    this.grupo.visible = visible;
    this.grupo.position.copy(viejo.position); this.grupo.rotation.copy(viejo.rotation);
    (padre || this.juego.escena).add(this.grupo);
  }
  get posicion() { return this.coche ? this.coche.pos : this.interior ? this.interior.puerta : this.pos; }

  darArma(id, balas = 0) {
    const a = ARMAS[id];
    if (!a.cargador) {
      if (!this.armas[id]) this.armas[id] = { cargador: 0, reserva: 0 };
      if (ARMAS[id].tipo === 'lanzar') this.armas[id].reserva += balas;
      return;
    }
    if (!this.armas[id]) this.armas[id] = { cargador: Math.min(a.cargador, balas), reserva: Math.max(0, balas - a.cargador) };
    else this.armas[id].reserva += balas;
    if (this.arma === 'puno') this.arma = id;
  }

  sacar() { this.p.sacar = 0.38; this.juego.audio?.desenfundar?.(this.arma); }

  cambiarArma(paso) {
    const lista = ORDEN.filter(k => tieneArma(this, k));
    let i = lista.indexOf(this.arma);
    i = (i + paso + lista.length) % lista.length;
    this.arma = lista[i];
    this.recargando = 0;
    this.sacar();
  }

  elegirArma(id) { if (this.armas[id]) { this.arma = id; this.recargando = 0; this.sacar(); } }

  recargar() {
    const a = ARMAS[this.arma], s = this.armas[this.arma];
    if (!a.cargador || s.cargador >= a.cargador || s.reserva <= 0 || this.recargando > 0) return;
    this.recargando = a.recarga;
    this.juego.audio?.recarga();
  }

  recibir(daño, desde) {
    if (this.muerto) return;
    if (this.juego.dios) return;
    if (this.chaleco > 0) {
      const a = Math.min(this.chaleco, daño * 0.75);
      this.chaleco -= a; daño -= a;
    }
    this.salud -= daño;
    this.juego.sinDaño = 0;
    this.juego.hud.dano(Math.min(1, daño / 30), desde);
    if (this.salud <= 0) { this.salud = 0; this.juego.morirJugador(); }
  }

  bancaCerca() {
    if (this.coche || this.muerto || this.interior || this.sentado) return null;
    return this.juego.ciudad.bancas?.find(b => !b.ocupante && !b.pie && Math.hypot(b.x - this.pos.x, b.z - this.pos.z) < 1.4) || null;
  }

  sentarse(b) { this.sentado = b; b.ocupante = this; this.pos.set(b.x, 0, b.z); this.yaw = b.yaw; this.velocidad = 0; }

  levantarse() { const b = this.sentado; if (!b) return; if (b.ocupante === this) b.ocupante = null; this.sentado = null; this.pos.x += Math.sin(b.yaw) * 0.6; this.pos.z += Math.cos(b.yaw) * 0.6; }

  actualizar(dt, ent, camYaw) {
    if (this.sentado && (ent?.x || ent?.y || this.muerto || this.coche || this.interior)) this.levantarse();
    if (this.sentado) {
      const b = this.sentado; this.pos.set(b.x, 0, b.z); this.yaw = b.yaw; this.velocidad = 0;
      this.salud = Math.min(this.saludMax || 100, this.salud + dt * 1.5);
      this.grupo.position.copy(this.pos); this.grupo.rotation.y = this.yaw;
      if (!this.juego.sinRealista) realistaDe(this.personaje).actualizarJugador(this, dt);
      return;
    }
    this.actualizarBase(dt, ent, camYaw);
    if (!this.juego.sinRealista) realistaDe(this.personaje).actualizarJugador(this, dt);
  }

  actualizarBase(dt, ent, camYaw) {
    const j = this.juego;
    if (this.muerto && this.arrestado) {
      this.muerto += dt;
      const P = this.p, k = Math.min(1, this.muerto * 2.2);
      P.cuerpo.rotation.set(0.05 * k, 0, 0); P.cuerpo.position.set(0, -0.46 * k, 0);
      P.pi.rotation.set(-0.15 * k, 0, 0.08); P.pd.rotation.set(-0.15 * k, 0, -0.08); P.ri.rotation.x = 1.65 * k; P.rd.rotation.x = 1.65 * k;
      P.bi.rotation.set(-2.5 * k, 0, 0.95 * k); P.bd.rotation.set(-2.5 * k, 0, -0.95 * k); P.ci.rotation.x = -2.3 * k; P.cd.rotation.x = -2.3 * k;
      P.cabeza.rotation.set(0.35 * k, 0, 0); P.torso.rotation.set(0, 0, 0);
      for (const a of ['pistola', 'subfusil', 'rifle', 'escopeta', 'bate', 'cuchillo', 'machete', 'llave', 'revolver', 'recortada', 'ametralladora', 'francotirador', 'lanzacohetes', 'granada', 'molotov']) if (P[a]) P[a].visible = false;
      this.grupo.position.set(this.pos.x, 0, this.pos.z);
      return;
    }
    if (this.muerto) {
      this.muerto += dt;
      if (this.muneco) return;
      tumbar(this.p, this.muerto);
      this.grupo.position.set(this.pos.x, 0, this.pos.z);
      return;
    }
    if (this.coche) { this.grupo.visible = this.coche.tipo === 'moto' || this.coche.tipo === 'lancha'; if (this.coche.tipo === 'moto') montar(this.p, this.coche, dt); else if (this.coche.tipo === 'lancha') { sentar(this.p); this.p.bd.rotation.set(-1.2, 0, 0.1); this.p.bi.rotation.set(-1.1, 0, -0.1); this.p.cabeza.rotation.y = -this.coche.giroSuave * 0.3; } return; }
    this.grupo.visible = true;
    if (this.reparando > 0 || this.pintando > 0) { if (this.reparando > 0) this.reparando -= dt; if (this.pintando > 0) this.pintando -= dt; ent = { x: 0, y: 0, correr: false, saltar: false }; }
    const correr = ent.correr ? 1 : 0;
    let mx = 0, mz = 0;
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw), rx = -fz, rz = fx;
    mx += fx * ent.y + rx * ent.x;
    mz += fz * ent.y + rz * ent.x;
    const m = Math.hypot(mx, mz);
    if (this.agachado && correr) this.agachado = false;
    this.nadando = enLago(j.ciudad.lago, this.pos.x, this.pos.z, 0.15);
    if (this.nadando) { this.agachado = false; this.rueda = null; this.gesto = null; }
    const vmax = this.nadando ? (correr ? 2.9 : 1.9) : (this.rueda ? 7.5 : this.agachado ? 1.9 : this.apunta ? 2.6 : (correr ? 7.2 : 4.2)) * (1 + this.bonoVel) * (this.juego.mareo > 20 ? 0.85 : 1);
    let objetivo = 0;
    if (this.rueda) { this.rueda.t -= dt; mx = this.rueda.x; mz = this.rueda.z; objetivo = vmax * Math.max(0.3, this.rueda.t / 0.55); if (this.rueda.t <= 0) this.rueda = null; }
    else if (m > 0.01) { mx /= m; mz /= m; objetivo = vmax; }
    this.velocidad += (objetivo - this.velocidad) * Math.min(1, dt * 10);
    if (m > 0.01 || this.rueda) {
      this.pos.x += mx * this.velocidad * dt;
      this.pos.z += mz * this.velocidad * dt;
      if (!this.apunta && !this.disparando) {
        const ya = Math.atan2(mx, mz);
        let d = ya - this.yaw;
        while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
        this.yaw += d * Math.min(1, dt * 12);
      }
    }
    if (this.apunta || this.disparando) {
      let d = camYaw - this.yaw;
      while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
      this.yaw += d * Math.min(1, dt * 20);
    }
    if (this.nadando) { this.vy = 0; this.y += ((this.velocidad > 0.3 ? 0.235 : 0.08) - this.y) * Math.min(1, dt * 5); }
    else {
      const suelo = this.suelo = sobreMuelle(j.ciudad.lago, this.pos.x, this.pos.z) ? 0.48 : 0;
      if (ent.saltar && this.y <= suelo + 0.001) { this.vy = 6.4; j.audio?.salto?.(); }
      this.vy -= 20 * dt;
      this.y = Math.max(suelo, this.y + this.vy * dt);
      if (this.y === suelo) this.vy = 0;
    }
    if (this.nadando) this.suelo = 0;
    j.mundo.empujar(this.pos, 0.34, this.nadando ? 0 : this.y, true);
    for (const c of j.coches) {
      if (c === this.coche || c === j.entrando?.c) continue;
      const dx = this.pos.x - c.pos.x, dz = this.pos.z - c.pos.z;
      const lx = dx * c.fx + dz * c.fz, lz = dx * -c.fz + dz * c.fx;
      const hl = c.t.largo / 2 + 0.3, ha = c.t.ancho / 2 + 0.3;
      if (Math.abs(lx) < hl && Math.abs(lz) < ha && this.y < 1.2) {
        const px = hl - Math.abs(lx), pz = ha - Math.abs(lz);
        if (px < pz) { const s = Math.sign(lx) * px; this.pos.x += c.fx * s; this.pos.z += c.fz * s; }
        else { const s = Math.sign(lz) * pz; this.pos.x += -c.fz * s; this.pos.z += c.fx * s; }
      }
    }
    if (this.recargando > 0) {
      this.recargando -= dt;
      if (this.recargando <= 0) {
        const a = ARMAS[this.arma], s = this.armas[this.arma];
        const n = Math.min(a.cargador - s.cargador, s.reserva);
        s.cargador += n; s.reserva -= n;
      }
    }
    this.cadencia -= dt;
    if (this.golpeT > 0) this.golpeT -= dt;
    const giro = angulo(this.yaw - (this.yawPrevio ?? this.yaw)) / Math.max(dt, 0.001);
    this.yawPrevio = this.yaw;
    const enAire = !this.nadando && this.y > (this.suelo || 0) + 0.05;
    if (this.enAireAntes && !enAire && this.caida < -4) this.p.aterriza = 0.28;
    this.enAireAntes = enAire; this.caida = this.vy;
    animar(this.p, dt, m > 0.01 ? this.velocidad : 0, this.arma, this.apunta || this.disparando, Math.max(-3, Math.min(3, giro)), enAire ? { vy: this.vy } : null);
    if (this.golpeT > 0) animGolpe(this.p, 1 - this.golpeT / (this.golpeDur || 0.3), this.sigilo ? 'sigilo' : this.arma, this.combo || 0); else this.sigilo = false;
    const P = this.p;
    this.agache = (this.agache || 0) + ((this.agachado ? 1 : 0) - (this.agache || 0)) * Math.min(1, dt * 10);
    if (this.agache > 0.01) {
      const k = this.agache;
      P.cuerpo.position.y -= 0.36 * k; P.cuerpo.rotation.x += 0.28 * k;
      P.pi.rotation.x -= 0.75 * k; P.pd.rotation.x -= 0.75 * k; P.ri.rotation.x += 1.25 * k; P.rd.rotation.x += 1.25 * k;
      P.cabeza.rotation.x -= 0.2 * k;
    }
    if (this.gesto) {
      this.gesto.t -= dt;
      if (this.gesto.t <= 0 || this.velocidad > 1 || this.apunta) this.gesto = null;
      else {
        const t = performance.now() / 1000, G = this.gesto.tipo;
        if (G === 'saludar') { P.bd.rotation.set(-2.75, 0, -0.35 + Math.sin(t * 10) * 0.35); P.cd.rotation.x = -0.45; P.cabeza.rotation.x = -0.05; }
        else if (G === 'festejar') { const b = Math.abs(Math.sin(t * 8)); P.bi.rotation.set(-2.9 + b * 0.25, 0, 0.35); P.bd.rotation.set(-2.9 + b * 0.25, 0, -0.35); P.ci.rotation.x = P.cd.rotation.x = -0.3; P.cuerpo.position.y += b * 0.09; P.cabeza.rotation.x = -0.25; }
        else if (G === 'bailar') { const w = Math.sin(t * 6.5), b = Math.abs(Math.sin(t * 6.5)); P.cuerpo.rotation.y = w * 0.35; P.torso.rotation.z = w * 0.12; P.bi.rotation.set(-1.3 + w * 0.8, 0, 0.4); P.bd.rotation.set(-1.3 - w * 0.8, 0, -0.4); P.ci.rotation.x = P.cd.rotation.x = -1.1; P.cuerpo.position.y -= b * 0.08; P.ri.rotation.x = P.rd.rotation.x = 0.3 + b * 0.35; P.pi.rotation.x = P.pd.rotation.x = -0.15 - b * 0.2; P.cabeza.rotation.z = w * 0.15; }
        else { P.bd.rotation.set(-1.55, 0.25, 0); P.cd.rotation.x = -0.05; P.cabeza.rotation.y = -0.2; }
      }
    }
    if (this.rueda) {
      const k = 1 - Math.max(0, this.rueda.t) / 0.55;
      const th = k * Math.PI * 2, sq = 1 - 0.55 * Math.sin(k * Math.PI), h = 0.9 * sq; P.cuerpo.rotation.x = th; P.cuerpo.scale.set(1, sq, 1); P.cuerpo.position.set(0, h - h * Math.cos(th), -h * Math.sin(th));
      P.pi.rotation.x = -1.6 * Math.sin(k * Math.PI); P.pd.rotation.x = -1.6 * Math.sin(k * Math.PI); P.ri.rotation.x = P.rd.rotation.x = 2 * Math.sin(k * Math.PI);
      P.bi.rotation.set(-1.4, 0, 0.3); P.bd.rotation.set(-1.4, 0, -0.3); P.ci.rotation.x = P.cd.rotation.x = -1.5;
    } else if (this.ruedaFin) { this.ruedaFin = false; P.cuerpo.rotation.x = 0; P.cuerpo.position.set(0, 0, 0); P.cuerpo.scale.set(1, 1, 1); }
    if (this.recargando > 0) { const k = Math.sin((1 - this.recargando / (ARMAS[this.arma].recarga || 1)) * Math.PI); this.p.bd.rotation.set(-0.8 - k * 0.2, 0.3, 0.2); this.p.cd.rotation.x = -0.9; this.p.bi.rotation.set(-0.7 - k * 0.5, -0.6, -0.2); this.p.ci.rotation.x = -1.2 - k * 0.4; }
    this.grupo.position.set(this.pos.x, this.y, this.pos.z);
    this.grupo.rotation.y = this.yaw;
  }

  gesticular() {
    if (this.coche || this.muerto) return;
    const L = ['saludar', 'festejar', 'bailar', 'señalar'];
    const i = this.gesto ? (L.indexOf(this.gesto.tipo) + 1) % L.length : (this.ultimoGesto ?? -1) + 1;
    this.ultimoGesto = i % L.length;
    this.gesto = { tipo: L[i % L.length], t: L[i % L.length] === 'bailar' ? 6 : 2.6 };
    this.juego.hud.notificar('ok', { saludar: 'Saludas', festejar: 'Festejas', bailar: 'Bailas', 'señalar': 'Señalas' }[this.gesto.tipo], 'G otra vez para cambiar de gesto.', 1.4);
    if (this.gesto.tipo === 'bailar' && Math.random() < 0.5) this.juego.redes?.publicar('foto', '', { forzar: false });
  }

  rodar(ent, camYaw) {
    if (this.rueda || this.coche || this.muerto || this.y > 0.05) return;
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    let mx = fx * (ent.y || 0) - fz * (ent.x || 0), mz = fz * (ent.y || 0) + fx * (ent.x || 0);
    const m = Math.hypot(mx, mz);
    if (m < 0.1) { mx = Math.sin(this.yaw); mz = Math.cos(this.yaw); } else { mx /= m; mz /= m; }
    this.rueda = { x: mx, z: mz, t: 0.55 }; this.ruedaFin = true; this.agachado = false;
    this.yaw = Math.atan2(mx, mz);
    this.juego.audio?.golpe?.(false);
  }

  revivir(x, z) {
    this.muerto = 0;
    this.arrestado = false;
    if (this.muneco) { this.juego.fisica?.soltar(this.muneco, true); this.muneco = null; }
    levantar(this.p);
    this.pos.set(x, 0, z);
    this.salud = this.saludMax;
    this.coche = null;
    this.grupo.visible = true;
  }
}
