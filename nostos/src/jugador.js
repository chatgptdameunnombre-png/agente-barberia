import * as THREE from 'three';
import { CELDA, esSolido } from './mapa.js?v=20260906093925';

const VELOCIDAD = 15;
const VELOCIDAD_LATERAL = 12;
const ACELERACION = 12;
const RADIO = 1.3;
const ALTURA_OJO = 3.1;
const SENSIBILIDAD = 0.0022;
const LIMITE_PITCH = Math.PI / 3;

export class Jugador {
  constructor(camara, nivel, lienzo) {
    this.camara = camara;
    this.nivel = nivel;
    this.lienzo = lienzo;
    this.pos = (nivel.spawns.jugador || new THREE.Vector3(CELDA, 0, CELDA)).clone();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.vida = 100;
    this.vidaMax = 100;
    this.armadura = 0;
    this.armaduraMax = 100;
    this.oro = 0;
    this.flechas = 40;
    this.flechasMax = 60;
    this.bajas = 0;
    this.mult = { tension: 1, dano: 1, velocidad: 1, velFlecha: 1 };
    this.doble = false;
    this.inventario = [];
    this.ranuras = 4;
    this.alUsar = null;
    this.alSoltar = null;
    this.pistola = false;
    this.alPortal = null;
    this.alComerciar = null;
    this.alTajo = null;
    this.enfriamientoTajo = 0;
    this.guante = false;
    this.gancho = false;
    this.hachaFuera = false;
    this.alLanzarHacha = null;
    this.hacha = false;
    this.mano = 'cuchillo';
    this.cuchillos = 8;
    this.cuchillosMax = 20;
    this.alCambiar = null;
    this.pico = false;
    this.picos = 6;
    this.manoP = false;
    this.enfriamientoPico = 0;
    this.alPicar = null;
    this.alAgarrar = null;
    this.cazador = false;
    this.marcando = false;
    this.alMarcar = null;
    this.alSoltarMarcas = null;
    this.enfriamientoGancho = 0;
    this.alGancho = null;
    this.rayo = 100;
    this.rayoMax = 100;
    this.cargandoRayo = false;
    this.cargaRayo = 0;
    this.alRayo = null;
    this.empezado = false;
    this.balanceo = 0;
    this.tension = 0;
    this.tensando = false;
    this.enfriamiento = 0;
    this.teclas = {};
    this.activo = false;
    this.libre = false;
    this.raton = { x: 0, y: 0 };
    this.alDisparar = null;
    this.alVacio = null;
    this.alRecibir = null;
    this._enlazar();
  }

  _enlazar() {
    addEventListener('keydown', e => {
      this.teclas[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    addEventListener('keyup', e => {
      this.teclas[e.code] = false;
      if (e.code === 'KeyR' && this.cargandoRayo) {
        this.cargandoRayo = false;
        this._soltarRayo();
      }
      if (e.code === 'KeyX' && this.marcando) {
        this.marcando = false;
        if (this.alSoltarMarcas) this.alSoltarMarcas();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      const preso = document.pointerLockElement === this.lienzo;
      if (preso) { clearTimeout(this._espera); this.libre = false; this._activar(true); }
      else if (!this.libre) this._activar(false);
    });

    addEventListener('mousemove', e => {
      if (!this.activo) return;
      if (this.libre) {
        this.raton.x = (e.clientX / innerWidth) * 2 - 1;
        this.raton.y = (e.clientY / innerHeight) * 2 - 1;
        return;
      }
      this.yaw -= e.movementX * SENSIBILIDAD;
      this.pitch -= e.movementY * SENSIBILIDAD;
      this.pitch = Math.max(-LIMITE_PITCH, Math.min(LIMITE_PITCH, this.pitch));
    });

    addEventListener('contextmenu', e => { if (this.activo) e.preventDefault(); });

    addEventListener('mousedown', e => {
      if (e.target && e.target.closest && e.target.closest('#botonera, #panel, #tienda')) return;
      if (!this.activo) { this._entrar(); return; }
      if (e.button === 0) this.tensando = true;
      if (e.button === 2 && this.pistola && this.alPortal) {
        e.preventDefault();
        this.alPortal('azul');
      }
    });

    addEventListener('keydown', e => {
      if (e.code === 'Escape' && this.libre) this._activar(false);
      if (!this.activo) return;
      const ranura = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code);
      if (ranura >= 0) {
        if (e.shiftKey) this.soltar(ranura);
        else this.usar(ranura);
      }
      if (e.code === 'KeyQ' && this.pistola && this.alPortal) this.alPortal('naranja');
      if (e.code === 'KeyE' && this.alComerciar) this.alComerciar();
      if (e.code === 'KeyF') this.tajo();
      if ((e.code === 'KeyZ' || e.code === 'Tab') && this.hacha) {
        e.preventDefault();
        this.mano = this.mano === 'hacha' ? 'cuchillo' : 'hacha';
        if (this.alCambiar) this.alCambiar(this.mano);
      }
      if (e.code === 'KeyT' && this.alLanzarHacha) this.alLanzarHacha();
      if (e.code === 'KeyB' && this.pico && this.enfriamientoPico <= 0 && this.alPicar) {
        this.enfriamientoPico = 0.75;
        this.alPicar();
      }
      if (e.code === 'KeyC' && this.manoP && this.alAgarrar) this.alAgarrar();
      if (e.code === 'KeyX' && this.cazador && !this.marcando) {
        this.marcando = true;
        if (this.alMarcar) this.alMarcar(true);
      }
      if (e.code === 'KeyG' && this.gancho && this.enfriamientoGancho <= 0 && this.alGancho) {
        this.enfriamientoGancho = 1.3;
        this.alGancho();
      }
      if (e.code === 'KeyR' && this.guante && !this.cargandoRayo) {
        this.cargandoRayo = true;
        this.cargaRayo = 0;
      }
    });

    addEventListener('mouseup', e => {
      if (e.button === 0 && this.tensando) {
        this.tensando = false;
        this._soltar();
      }
    });

    this.lienzo.addEventListener('click', e => {
      if (e.target && e.target.closest && e.target.closest('#botonera, #panel, #tienda')) return;
      if (!this.activo) this._entrar();
    });
  }

  _entrar() {
    if (this.activo) return;
    if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) {
      this.libre = true;
      this._activar(true);
      return;
    }
    try {
      const intento = this.lienzo.requestPointerLock();
      if (intento && intento.catch) intento.catch(() => {});
    } catch (e) {}
    clearTimeout(this._espera);
    this._espera = setTimeout(() => {
      if (document.pointerLockElement === this.lienzo || this.activo) return;
      this.libre = true;
      this._activar(true);
    }, 900);
  }

  _activar(v) {
    this.activo = v;
    if (v) this.empezado = true;
    document.body.classList.toggle('jugando', v);
    document.getElementById('menu').classList.toggle('oculto', v);
    if (!v && this.alPausar) this.alPausar();
  }

  _soltarRayo() {
    const carga = Math.min(1, this.cargaRayo);
    this.cargaRayo = 0;
    const coste = 26 + carga * 34;
    if (this.rayo < coste) { if (this.alVacio) this.alVacio(); return; }
    this.rayo -= coste;
    if (this.alRayo) this.alRayo(carga);
  }

  tajo() {
    if (!this.activo || this.enfriamientoTajo > 0 || !this.alTajo || this.hachaFuera) return;
    if (this.mano === 'cuchillo' && this.cuchillos <= 0) {
      if (this.alVacio) this.alVacio();
      return;
    }
    this.enfriamientoTajo = 0.55;
    this.tensando = false;
    this.tension = 0;
    this.alTajo();
  }

  _soltar() {
    if (this.hachaFuera) {
      this.tension = 0;
      if (this.alVacio) this.alVacio();
      return;
    }
    if (this.flechas <= 0 && this.alVacio) this.alVacio();
    if (this.enfriamiento > 0 || this.flechas <= 0) { this.tension = 0; return; }
    const fuerza = Math.min(1, this.tension);
    this.flechas--;
    this.enfriamiento = 0.35;
    if (this.alDisparar) this.alDisparar(fuerza, this.direccion());
    this.tension = 0;
  }

  hayHueco(id) {
    const hay = this.inventario.find(o => o.id === id);
    if (hay) return hay.cantidad < 9;
    return this.inventario.length < this.ranuras;
  }

  guardar(id, cuantos = 1, infinito = false) {
    const hay = this.inventario.find(o => o.id === id);
    if (hay) {
      if (hay.infinito) return true;
      if (hay.cantidad >= 9) return false;
      hay.cantidad += cuantos;
    } else if (this.inventario.length < this.ranuras) {
      this.inventario.push({ id, cantidad: cuantos, infinito });
    } else return false;
    return true;
  }

  soltar(ranura) {
    const casilla = this.inventario[ranura];
    if (!casilla) return;
    this.inventario.splice(ranura, 1);
    if (this.alSoltar) this.alSoltar(casilla.id);
  }

  usar(ranura) {
    const casilla = this.inventario[ranura];
    if (!casilla || !this.alUsar) return;
    if (this.alUsar(casilla.id) === false) return;
    if (casilla.infinito) return;
    casilla.cantidad--;
    if (casilla.cantidad <= 0) this.inventario.splice(ranura, 1);
  }

  direccion() {
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
  }

  recibir(dano) {
    if (this.vida <= 0) return;
    if (this.armadura > 0) {
      const absorbe = Math.min(this.armadura, dano * 0.5);
      this.armadura -= absorbe;
      dano -= absorbe;
    }
    this.vida = Math.max(0, Math.round(this.vida - dano));
    if (this.alRecibir) this.alRecibir(dano);
  }

  _colisionar(nx, nz) {
    const rej = this.nivel.rejilla;
    const cx = Math.floor(nx / CELDA);
    const cz = Math.floor(nz / CELDA);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const gx = cx + dx, gz = cz + dz;
        if (!esSolido(rej, gx, gz)) continue;
        const minX = gx * CELDA, maxX = minX + CELDA;
        const minZ = gz * CELDA, maxZ = minZ + CELDA;
        const px = Math.max(minX, Math.min(nx, maxX));
        const pz = Math.max(minZ, Math.min(nz, maxZ));
        const ddx = nx - px, ddz = nz - pz;
        if (ddx * ddx + ddz * ddz < RADIO * RADIO) return true;
      }
    }
    return false;
  }

  actualizar(dt) {
    if (this.enfriamiento > 0) this.enfriamiento -= dt;
    if (this.enfriamientoTajo > 0) this.enfriamientoTajo -= dt;
    if (this.enfriamientoGancho > 0) this.enfriamientoGancho -= dt;
    if (this.enfriamientoPico > 0) this.enfriamientoPico -= dt;
    if (this.cargandoRayo) this.cargaRayo = Math.min(1, this.cargaRayo + dt * 1.25);
    else if (this.rayo < this.rayoMax) this.rayo = Math.min(this.rayoMax, this.rayo + dt * 13);
    if (this.tensando && this.tension < 1) this.tension = Math.min(1, this.tension + dt * 1.6 * this.mult.tension);

    if (this.libre) {
      const zx = Math.abs(this.raton.x) < 0.12 ? 0 : this.raton.x;
      const zy = Math.abs(this.raton.y) < 0.12 ? 0 : this.raton.y;
      this.yaw -= zx * 2.6 * dt;
      this.pitch -= zy * 1.6 * dt;
      this.pitch = Math.max(-LIMITE_PITCH, Math.min(LIMITE_PITCH, this.pitch));
    }

    let adelante = 0, lado = 0;
    if (this.teclas.KeyW || this.teclas.ArrowUp) adelante += 1;
    if (this.teclas.KeyS || this.teclas.ArrowDown) adelante -= 1;
    if (this.teclas.KeyD || this.teclas.ArrowRight) lado += 1;
    if (this.teclas.KeyA || this.teclas.ArrowLeft) lado -= 1;

    const sn = Math.sin(this.yaw), cs = Math.cos(this.yaw);
    let dx = (-sn * adelante + cs * lado);
    let dz = (-cs * adelante - sn * lado);
    const largo = Math.hypot(dx, dz);
    if (largo > 0) { dx /= largo; dz /= largo; }

    const lento = this.tensando ? 0.45 : 1;
    const objX = dx * (adelante ? VELOCIDAD : VELOCIDAD_LATERAL) * lento * this.mult.velocidad;
    const objZ = dz * (adelante ? VELOCIDAD : VELOCIDAD_LATERAL) * lento * this.mult.velocidad;
    this.vel.x += (objX - this.vel.x) * Math.min(1, ACELERACION * dt);
    this.vel.z += (objZ - this.vel.z) * Math.min(1, ACELERACION * dt);

    const nx = this.pos.x + this.vel.x * dt;
    if (!this._colisionar(nx, this.pos.z)) this.pos.x = nx; else this.vel.x = 0;
    const nz = this.pos.z + this.vel.z * dt;
    if (!this._colisionar(this.pos.x, nz)) this.pos.z = nz; else this.vel.z = 0;

    const rapidez = Math.hypot(this.vel.x, this.vel.z);
    this.balanceo += dt * rapidez * 0.9;
    const bob = Math.sin(this.balanceo) * Math.min(0.16, rapidez * 0.013);

    this.camara.position.set(this.pos.x, ALTURA_OJO + bob, this.pos.z);
    this.camara.rotation.order = 'YXZ';
    this.camara.rotation.set(
      this.pitch,
      this.yaw,
      Math.cos(this.balanceo) * Math.min(0.012, rapidez * 0.0012)
    );
  }
}
