import * as THREE from 'three';
import { Billboard } from './sprites.js?v=20260905154903';
import { CELDA, esSolido } from './mapa.js?v=20260905154903';

const RADIO = 1.6;
const RANGO_VISTA = 70;

export const TIPOS = {
  ciclope: {
    id: 'ciclope', nombre: 'CICLOPE', arte: 'ciclope',
    alto: 5.8, vida: 1, velocidad: 1, dano: 1,
    rango: 4.2, distancia: false, recarga: 0
  },
  pretendiente: {
    id: 'pretendiente', nombre: 'PRETENDIENTE', arte: 'pretendiente',
    alto: 4.3, vida: 0.55, velocidad: 1.45, dano: 0.75,
    rango: 26, distancia: true, recarga: 2.4
  }
};

export class Enemigo {
  constructor(pos, recursos, nivel, ajustes = {}) {
    this.nivel = nivel;
    this.tipo = ajustes.tipo || TIPOS.ciclope;
    this.recursos = recursos;
    this.vida = Math.round((ajustes.vida || 60) * this.tipo.vida);
    this.velocidad = (ajustes.velocidad || 4.2) * this.tipo.velocidad;
    this.dano = Math.round((ajustes.dano || 14) * this.tipo.dano);
    this.rango = this.tipo.rango;
    this.espera = Math.random() * this.tipo.recarga;
    this.alTirar = null;
    this.flujo = ajustes.flujo || null;
    this.portales = ajustes.portales || null;
    this.esperaPortal = 0;
    this.paralizado = 0;
    this.confundido = 0;
    this.tinteBase = 0xffffff;
    this.presa = null;
    this.atasco = 0;
    this.ultimoX = pos.x;
    this.ultimoZ = pos.z;
    this.estado = 'quieto';
    this.reloj = 0;
    this.rumbo = 0;
    this.paso = Math.random() * 10;
    this.cuadro = 0;
    this.alGolpear = null;
    this.alRugir = null;
    this.alMorir = null;
    this.sprite = new Billboard(recursos.quieto, 5.2, this.tipo.alto);
    this.sprite.grupo.position.copy(pos);
    this.malla = this.sprite.grupo;
    this.baseY = this.sprite.malla.position.y;
  }

  get pos() { return this.sprite.grupo.position; }
  get vivo() { return this.estado !== 'muerto' && this.estado !== 'muriendo'; }

  recibir(dano) {
    if (!this.vivo) return false;
    this.vida -= dano;
    if (this.vida <= 0) {
      this.estado = 'muriendo';
      this.reloj = 0;
      this.cuadro = 0;
      this.sprite.fijarVistas([this.recursos.muere[0]]);
      if (this.alMorir) this.alMorir(this);
      return true;
    }
    return false;
  }

  _libre(nx, nz) {
    const rej = this.nivel.rejilla;
    const cx = Math.floor(nx / CELDA), cz = Math.floor(nz / CELDA);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const gx = cx + dx, gz = cz + dz;
        if (!esSolido(rej, gx, gz)) continue;
        const px = Math.max(gx * CELDA, Math.min(nx, gx * CELDA + CELDA));
        const pz = Math.max(gz * CELDA, Math.min(nz, gz * CELDA + CELDA));
        const ddx = nx - px, ddz = nz - pz;
        if (ddx * ddx + ddz * ddz < RADIO * RADIO) return false;
      }
    }
    return true;
  }

  actualizar(dt, jugador, camara) {
    this.reloj += dt;
    if (this.paralizado > 0) {
      this.paralizado -= dt;
      this.sprite.material.color.setHex(0x7f8f9f);
      this.sprite.encarar(camara, this.rumbo);
      return;
    }
    if (this.confundido > 0) {
      this.confundido -= dt;
      this.sprite.material.color.setHex(0xff9a6a);
      if (this.confundido <= 0) this.sprite.material.color.setHex(0xffffff);
    } else if (this.sprite.material.color.getHex() !== this.tinteBase) {
      this.sprite.material.color.setHex(this.tinteBase);
    }
    const enfurecido = this.confundido > 0 && this.presa && this.presa.vivo;
    const objetivo = enfurecido ? this.presa : jugador;
    const dx = objetivo.pos.x - this.pos.x;
    const dz = objetivo.pos.z - this.pos.z;
    const dist = Math.hypot(dx, dz);

    if (this.estado === 'muriendo') {
      const cuadros = this.recursos.muere;
      const paso = Math.min(cuadros.length - 1, Math.floor(this.reloj / 0.16));
      if (paso !== this.cuadro) {
        this.cuadro = paso;
        this.sprite.fijarVistas([cuadros[paso]]);
      }
      if (this.reloj > 0.16 * cuadros.length) this.estado = 'muerto';
      this.sprite.malla.position.y = this.baseY;
      this.sprite.encarar(camara, this.rumbo);
      return;
    }
    if (this.estado === 'muerto') {
      this.sprite.encarar(camara, this.rumbo);
      return;
    }

    if (this.estado === 'quieto' && dist < RANGO_VISTA) {
      this.estado = 'persigue';
      this.sprite.fijarVistas(this.recursos.quieto);
      if (this.alRugir) this.alRugir(this);
    }

    if (this.estado === 'golpea') {
      const cuadros = this.recursos.ataca;
      const paso = Math.min(cuadros.length - 1, Math.floor(this.reloj / 0.18));
      if (paso !== this.cuadro) {
        this.cuadro = paso;
        this.sprite.fijarVistas([cuadros[paso]]);
        if (paso === 0 && this.alRugir) this.alRugir(this, true);
        if (paso === 1) {
          if (enfurecido) {
            if (dist < this.rango + 2) this.presa.recibir(this.dano * 2.2);
          } else if (this.tipo.distancia) {
            if (this.alTirar) this.alTirar(this, this.dano);
          } else if (dist < this.rango + 1 && this.alGolpear) {
            this.alGolpear(this.dano);
          }
        }
      }
      if (this.reloj > 0.18 * cuadros.length + (this.tipo.distancia ? this.tipo.recarga : 0.35)) {
        this.estado = 'persigue';
        this.sprite.fijarVistas(this.recursos.quieto);
        this.cuadro = 0;
      }
      this.sprite.encarar(camara, this.rumbo);
      return;
    }

    if (this.estado === 'persigue') {
      this.rumbo = Math.atan2(dx, dz);
      if (dist < this.rango) {
        this.estado = 'golpea';
        this.reloj = 0;
        this.cuadro = -1;
      } else {
        let ux = dx / dist, uz = dz / dist;
        if (dist > 7 && this.flujo && !enfurecido) {
          const guia = this.flujo.rumbo(this.pos.x, this.pos.z);
          if (guia) { ux = guia.x; uz = guia.z; }
          if (this.portales) {
            const puerta = this.portales.guiaHacia(this.pos, this.flujo);
            if (puerta) { ux = puerta.x; uz = puerta.z; }
          }
        }
        const nx = this.pos.x + ux * this.velocidad * dt;
        const nz = this.pos.z + uz * this.velocidad * dt;
        if (this._libre(nx, this.pos.z)) this.pos.x = nx;
        if (this._libre(this.pos.x, nz)) this.pos.z = nz;
        if (this.esperaPortal > 0) this.esperaPortal -= dt;
        else if (this.portales && this.portales.cruzarSuelo(this.pos)) {
          this.esperaPortal = 1.2;
          this.ultimoX = this.pos.x;
          this.ultimoZ = this.pos.z;
          this.atasco = 0;
          this.sprite.encarar(camara, this.rumbo);
          return;
        }

        const avance = Math.hypot(this.pos.x - this.ultimoX, this.pos.z - this.ultimoZ);
        this.ultimoX = this.pos.x;
        this.ultimoZ = this.pos.z;
        this.atasco = avance < this.velocidad * dt * 0.25 ? this.atasco + dt : 0;
        if (this.atasco > 0.8) {
          const cx = Math.floor(this.pos.x / CELDA);
          const cz = Math.floor(this.pos.z / CELDA);
          const centroX = cx * CELDA + CELDA / 2;
          const centroZ = cz * CELDA + CELDA / 2;
          this.pos.x += (centroX - this.pos.x) * Math.min(1, dt * 5);
          this.pos.z += (centroZ - this.pos.z) * Math.min(1, dt * 5);
          if (this.atasco > 2.4) {
            this.pos.x = centroX;
            this.pos.z = centroZ;
            this.atasco = 0;
          }
        }
        this.paso += dt * 6.5;
        this.sprite.malla.position.y = this.baseY + Math.abs(Math.sin(this.paso)) * 0.22;
        this.sprite.malla.rotation.z = Math.sin(this.paso * 0.5) * 0.035;
      }
    }

    this.sprite.encarar(camara, this.rumbo);
  }
}
