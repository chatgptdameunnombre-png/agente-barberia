import { RELIQUIAS } from './reliquias.js?v=20260905183329';

export const MEJORAS = [
  { id: 'cuerda', nombre: 'CUERDA DE TENDON', precio: 90, celda: 0, respaldo: 1,
    desc: 'Tensas el arco mucho mas rapido',
    aplicar: j => { j.mult.tension *= 1.35; } },
  { id: 'puntas', nombre: 'PUNTAS DE HIERRO', precio: 120, celda: 1, respaldo: 0,
    desc: '+35% de dano con cada flecha',
    aplicar: j => { j.mult.dano *= 1.35; } },
  { id: 'aljaba', nombre: 'ALJABA HONDA', precio: 70, celda: 2, respaldo: 1,
    desc: 'Cargas 30 flechas mas',
    aplicar: j => { j.flechasMax += 30; j.flechas += 20; } },
  { id: 'sandalias', nombre: 'SANDALIAS DE HERMES', precio: 110, celda: 3, respaldo: 3,
    desc: 'Corres 20% mas rapido',
    aplicar: j => { j.mult.velocidad *= 1.2; } },
  { id: 'coraza', nombre: 'CORAZA DE BRONCE', precio: 100, celda: 4, respaldo: 5,
    desc: 'Aguantas 50 de escudo mas',
    aplicar: j => { j.armaduraMax += 50; j.armadura += 50; } },
  { id: 'atenea', nombre: 'FAVOR DE ATENEA', precio: 190, celda: 5, respaldo: 7,
    desc: '+30 de vida maxima, y te cura',
    aplicar: j => { j.vidaMax += 30; j.vida = j.vidaMax; } },
  { id: 'doble', nombre: 'TIRO DOBLE', precio: 300, celda: 6, respaldo: 2,
    desc: 'Cada disparo suelta dos flechas',
    aplicar: j => { j.doble = true; } },
  { id: 'vista', nombre: 'OJO DE AGUILA', precio: 130, celda: 7, respaldo: 10,
    desc: 'Las flechas vuelan mas rapido y lejos',
    aplicar: j => { j.mult.velFlecha *= 1.4; } },
  { id: 'portales', nombre: 'CUERNO DE HERMES', precio: 200, celda: 12, respaldo: 10,
    desc: 'Abre puertas en la piedra. Clic derecho azul, Q naranja',
    aplicar: j => { j.pistola = true; j.guardar('portales', 1, true); } },
  { id: 'guante', nombre: 'GUANTE DE ZEUS', precio: 300, celda: 13, respaldo: 4,
    desc: 'Manten R para cargar el rayo y suelta. Atraviesa a todos en linea',
    aplicar: j => { j.guante = true; j.guardar('guante', 1, true); } },
  { id: 'gancho', nombre: 'HILO DE ARIADNA', precio: 210, celda: 14, respaldo: 3,
    desc: 'Con G te jalas a un muro, o jalas al enemigo hacia ti aturdido',
    aplicar: j => { j.gancho = true; j.guardar('gancho', 1, true); } },
  { id: 'pico', nombre: 'PICO DE HEFESTO', precio: 250, celda: 15, respaldo: 11,
    desc: 'Con B rompes los muros del palacio y sueltas escombros',
    aplicar: j => { j.pico = true; j.guardar('pico', 1, true); } },
  { id: 'manoP', nombre: 'MANO DE POSEIDON', precio: 280, celda: 16, respaldo: 5,
    desc: 'Con C agarras un escombro y con C otra vez se lo lanzas encima',
    aplicar: j => { j.manoP = true; j.guardar('manoP', 1, true); } },
  { id: 'hachaArma', nombre: 'HACHA DE LEVIATAN', precio: 170, celda: 18, respaldo: 2,
    desc: 'Tajo a todos los de enfrente y con T la lanzas: atraviesa y vuelve sola. Nunca se acaba',
    aplicar: j => { j.hacha = true; j.mano = 'hacha'; } },
  { id: 'cazador', nombre: 'OJO DEL CAZADOR', precio: 320, celda: 17, respaldo: 10,
    desc: 'Manten X para marcar hasta 5 enemigos y sueltalo para dispararles a todos',
    aplicar: j => { j.cazador = true; } }
];

export const CUCHILLOS = {
  id: 'cuchillos', nombre: 'HAZ DE CUCHILLOS', precio: 55, celda: 19, respaldo: 0,
  instantaneo: true, desc: 'Ocho cuchillos mas para lanzar',
  aplicar: j => { j.cuchillos = Math.min(j.cuchillosMax, j.cuchillos + 8); }
};

const BASICOS = [
  { id: 'frasco', nombre: 'FRASCO DE AMBROSIA', precio: 60, celda: 8, respaldo: 7,
    desc: 'Te cura 60 cuando lo uses' },
  { id: 'fuego', nombre: 'FUEGO GRIEGO', precio: 85, celda: 9, respaldo: 4,
    desc: 'Quema a todo el que tengas cerca' },
  { id: 'jabalina', nombre: 'JABALINA', precio: 75, celda: 10, respaldo: 3,
    desc: 'Un tiro que atraviesa y mata casi todo' },
  { id: 'vino', nombre: 'VINO DE DIONISO', precio: 95, celda: 11, respaldo: 6,
    desc: 'Diez segundos de furia: doble dano' }
];

export const CONSUMIBLES = [...BASICOS, ...RELIQUIAS];

const TODOS = [...MEJORAS, ...CONSUMIBLES];
export const porId = id => TODOS.find(o => o.id === id);

export class Tienda {
  constructor(cfg) {
    this.jugador = cfg.jugador;
    this.iconos = cfg.iconos;
    this.mercader = cfg.mercader || null;
    this.cuantos = cfg.cuantos || 4;
    this.descuento = cfg.descuento || 1;
    this.alCerrar = cfg.alCerrar;
    this.alComprar = cfg.alComprar;
    this.alFallar = cfg.alFallar;
    this.yaCompro = false;
    this.compradas = new Set();
    this.abierta = false;
    this.oferta = [];
    this._dom();
  }

  _dom() {
    this.caja = document.createElement('div');
    this.caja.id = 'tienda';
    this.caja.innerHTML = `
      <div class="marco">
        <div class="cabeza">
          <div class="retrato"></div>
          <div class="titulo">
            <h3>EL MERCADER</h3>
            <p class="lema">Todo tiene precio, hasta volver a casa</p>
          </div>
        </div>
        <div class="rejilla"></div>
        <div class="pie"><span class="bolsa"></span><button class="seguir">SEGUIR (ESPACIO)</button></div>
      </div>`;
    document.body.appendChild(this.caja);
    this.rejilla = this.caja.querySelector('.rejilla');
    if (this.mercader) {
      this.caja.querySelector('.retrato').style.backgroundImage = `url(${this.mercader})`;
    }
    this.bolsa = this.caja.querySelector('.bolsa');
    this.caja.querySelector('.seguir').addEventListener('click', () => this.cerrar());
    addEventListener('keydown', e => {
      if (!this.abierta) return;
      if (e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); this.cerrar(); }
    });
  }

  _icono(art) {
    if (art.hoja && this.iconos[art.hoja] && this.iconos[art.hoja][art.celda]) {
      return `url(${this.iconos[art.hoja][art.celda].image.toDataURL()})`;
    }
    if (art.id === 'portales' && this.iconos.cuerno && this.iconos.cuerno[1]) {
      return `url(${this.iconos.cuerno[1].image.toDataURL()})`;
    }
    if (art.id === 'guante' && this.iconos.guante && this.iconos.guante[2]) {
      return `url(${this.iconos.guante[2].image.toDataURL()})`;
    }
    if (art.id === 'gancho' && this.iconos.hilo && this.iconos.hilo[1]) {
      return `url(${this.iconos.hilo[1].image.toDataURL()})`;
    }
    if (art.id === 'pico' && this.iconos.pico && this.iconos.pico[0]) {
      return `url(${this.iconos.pico[0].image.toDataURL()})`;
    }
    if (art.id === 'manoP' && this.iconos.mano && this.iconos.mano[2]) {
      return `url(${this.iconos.mano[2].image.toDataURL()})`;
    }
    if (art.id === 'cuchillos' && this.iconos.cuchillo && this.iconos.cuchillo[0]) {
      return `url(${this.iconos.cuchillo[0].image.toDataURL()})`;
    }
    if (art.id === 'hachaArma' && this.iconos.hacha && this.iconos.hacha[0]) {
      return `url(${this.iconos.hacha[0].image.toDataURL()})`;
    }
    if (art.id === 'cazador' && this.iconos.insignias && this.iconos.insignias[7]) {
      return `url(${this.iconos.insignias[7].image.toDataURL()})`;
    }
    const t = (this.iconos.tienda && this.iconos.tienda[art.celda]) ||
              (this.iconos.items && this.iconos.items[art.respaldo]);
    if (!t || !t.image) return '';
    return `url(${t.image.toDataURL()})`;
  }

  _armarOferta() {
    const libres = MEJORAS.filter(m => !this.compradas.has(m.id));
    const revuelve = a => a.slice().sort(() => Math.random() - 0.5);
    const CLAVES = ['portales', 'guante', 'gancho', 'pico', 'manoP'];
    const fijas = libres.filter(m => CLAVES.includes(m.id));
    const resto = libres.filter(m => !CLAVES.includes(m.id));
    const mejoras = revuelve(resto).slice(0, Math.max(1, 3 - fijas.length));
    mejoras.unshift(...fijas.slice(0, 2));
    const consumibles = revuelve(CONSUMIBLES).slice(0, Math.max(1, this.cuantos - mejoras.length));
    this.oferta = [...mejoras, ...consumibles];
    if (this.jugador.cuchillos < this.jugador.cuchillosMax) {
      this.oferta[this.oferta.length - 1] = CUCHILLOS;
    }
  }

  abrir() {
    this.yaCompro = false;
    this._armarOferta();
    this.pintar();
    this.abierta = true;
    this.caja.classList.add('ver');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  cerrar() {
    if (!this.abierta) return;
    this.abierta = false;
    this.caja.classList.remove('ver');
    if (this.alCerrar) this.alCerrar();
  }

  pintar() {
    this.bolsa.textContent = 'LLEVAS ' + this.jugador.oro + ' DE ORO' +
      (this.yaCompro ? '  ·  SOLO UNA COMPRA POR RONDA' : '');
    this.rejilla.innerHTML = '';
    this.oferta.forEach(art => {
      const precio = Math.round(art.precio * this.descuento);
      const ranura = this.ocupaRanura(art);
      const sinHueco = ranura ? !this.jugador.hayHueco(ranura) : false;
      const puede = this.jugador.oro >= precio && !sinHueco && !this.yaCompro;
      const t = document.createElement('div');
      t.className = 'carta' + (puede ? '' : ' pobre');
      t.innerHTML = `
        <div class="ico" style="background-image:${this._icono(art)}"></div>
        <b>${art.nombre}</b>
        <span>${art.desc}</span>
        <em>${sinHueco ? 'SIN ESPACIO' : this.yaCompro ? 'YA COMPRASTE' : puede ? precio + ' ORO' : 'TE FALTAN ' + (precio - this.jugador.oro)}</em>`;
      t.addEventListener('click', () => this.comprar(art));
      this.rejilla.appendChild(t);
    });
  }

  ocupaRanura(art) {
    if (art.instantaneo) return null;
    if (!art.aplicar) return art.id;
    if (art.id === 'portales') return 'portales';
    if (art.id === 'guante') return 'guante';
    if (art.id === 'gancho') return 'gancho';
    if (art.id === 'pico') return 'pico';
    if (art.id === 'manoP') return 'manoP';
    return null;
  }

  comprar(art) {
    if (this.yaCompro) return;
    const precio = Math.round(art.precio * this.descuento);
    if (this.jugador.oro < precio) return;

    const ranura = this.ocupaRanura(art);
    if (ranura && !this.jugador.hayHueco(ranura)) {
      if (this.alFallar) this.alFallar('INVENTARIO LLENO');
      return;
    }

    this.jugador.oro -= precio;
    if (art.instantaneo) {
      art.aplicar(this.jugador);
    } else if (art.aplicar) {
      art.aplicar(this.jugador);
      this.compradas.add(art.id);
      this.oferta = this.oferta.filter(o => o.id !== art.id);
    } else if (!this.jugador.guardar(art.id)) {
      this.jugador.oro += precio;
      if (this.alFallar) this.alFallar('INVENTARIO LLENO');
      return;
    }
    this.yaCompro = true;
    if (this.alComprar) this.alComprar(art);
    this.pintar();
    setTimeout(() => this.cerrar(), 620);
  }

  reiniciar() {
    this.compradas.clear();
  }
}
