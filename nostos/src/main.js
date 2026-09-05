import * as THREE from 'three';
import { NIVEL_PRUEBA, construir, CELDA } from './mapa.js?v=20260905174112';
import { Jugador } from './jugador.js?v=20260905174112';
import { Enemigo, TIPOS } from './enemigos.js?v=20260905174112';
import { cortarTira, cortarRejilla, cargarImagen, recorteEntero, recorteSuperior, recorteInferior } from './sprites.js?v=20260905174112';
import { Objeto, CATALOGO } from './objetos.js?v=20260905174112';
import { Rondas } from './rondas.js?v=20260905174112';
import { Tienda, porId, MEJORAS, CONSUMIBLES } from './tienda.js?v=20260905174112';
import { RELIQUIAS, porReliquia } from './reliquias.js?v=20260905174112';
import { TINTES, COLORES, MIRAS, leer, guardar, aplicar } from './apariencia.js?v=20260905174112';
import { MODOS, MEJORAS_MERCADER, OBJETOS as OBJETOS_GLORIA, ESTILOS, LIMITE_OBJETOS, TODO as TODO_GLORIA, estado as estadoGloria, guardar as guardarGloria, activo as modoActivo } from './gloria.js?v=20260905174112';
import { Minimapa, Marcas } from './minimapa.js?v=20260905174112';
import { Flujo } from './flujo.js?v=20260905174112';
import { Portales, trazar } from './portales.js?v=20260905174112';
import { romper } from './mapa.js?v=20260905174112';
import { Audio } from './audio.js?v=20260905174112';
import { OtroLado } from './otrolado.js?v=20260905174112';
import { Director } from './director.js?v=20260905174112';
import { Cerco } from './cerco.js?v=20260905174112';
import { TIPOS as T } from './enemigos.js?v=20260905174112';
import { siluetaCiclope } from './texturas.js?v=20260905174112';

const ESCALA_RETRO = 3.2;
const lienzo = document.getElementById('lienzo');

const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x0a0705);
escena.fog = new THREE.Fog(0x120c08, 18, 95);

const camara = new THREE.PerspectiveCamera(78, 1, 0.1, 400);

const ambiente = new THREE.AmbientLight(0x8a7658, 2.4);
escena.add(ambiente);
const antorcha = new THREE.PointLight(0xffc078, 70, 60, 1.5);
escena.add(antorcha);
const cenit = new THREE.DirectionalLight(0xbfd0e4, 0.75);
cenit.position.set(0.4, 1, 0.25);
escena.add(cenit);

let nivel = null;
let jugador = null;

function estiloValido() {
  const e = leer();
  const g = estadoGloria();
  const limpio = { tinte: 'bronce', color: 'dorado', mira: 'cruz' };
  for (const est of ESTILOS) {
    if (e[est.grupo] === est.valor && g.activos.includes(est.id)) {
      limpio[est.grupo] = est.valor;
    }
  }
  guardar(limpio);
  return limpio;
}

const arma = document.createElement('div');
Object.assign(arma.style, {
  position: 'fixed', left: '50%', bottom: '-30vh', width: '100vw', height: '96vh',
  transform: 'translateX(-50%)', pointerEvents: 'none',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom',
  backgroundSize: 'auto 96vh', imageRendering: 'pixelated', zIndex: '4'
});
document.getElementById('capa').appendChild(arma);
aplicar(estiloValido(), arma);

const recursos = { arco: [], items: [], tienda: [], cuerno: [], guante: [], reliquias: [], hilo: [], jabalina: [], hacha: [], tajo: [], vuelo: [], cuchillo: [], pico: [], mano: [], fuego: [], insignias: [], mercader: null, ciclope: null, pretendiente: null };

function marcadorArco(tension) {
  const c = document.createElement('canvas');
  c.width = 200; c.height = 200;
  const x = c.getContext('2d');
  const tira = 26 - tension * 12;
  x.strokeStyle = '#4a3418'; x.lineWidth = 9; x.lineCap = 'round';
  x.beginPath(); x.arc(100, 150, 74, Math.PI * 1.18, Math.PI * 1.82); x.stroke();
  x.strokeStyle = '#d9cfb4'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(40, 96); x.lineTo(100, 96 + tira); x.lineTo(160, 96); x.stroke();
  x.fillStyle = '#8d7a52';
  x.fillRect(96, 92 + tira, 8, 78);
  x.fillStyle = '#b4a06a';
  x.fillRect(58, 168, 84, 26);
  x.fillRect(30, 178, 140, 22);
  return c.toDataURL();
}

const arcoRespaldo = [marcadorArco(0), marcadorArco(0.5), marcadorArco(1)];
let imagenesCuerno = [];
let imagenesCara = [];
let espadaReloj = 0;
let imagenesGuante = [];
let rayoReloj = 0;
let imagenesHilo = [];
let hiloReloj = 0;
let hiloCuadro = 1;
let imagenesJabalina = [];
let jabalinaReloj = 0;
let jabalinaCuadro = 1;
let imagenesHacha = [];
let imagenManoVacia = null;
let imagenesCuchillo = [];
let imagenesTajo = [];
let imagenesVuelo = [];
let vueloReloj = 0;
let vueloCuadro = 0;
let cuchilloReloj = 0;
let empuje = 0;
let cuchilloCuadro = 0;
let imagenesPico = [];
let imagenesMano = [];
let hachaReloj = 0;
let hachaCuadro = 0;
let cuernoReloj = 0;
let cuernoCuadro = 1;
let guanteReloj = 0;
let destelloGuante = 0;

let texturasNivel = null;

async function cargarArte() {
  const [idle, atk, die, bow, muros, cosas, mercancia, pIdle, pAtk, pDie, horn, viejo, rostros, mano, reliquias, cordel, asta, hachaImg, picoImg, manoImg, fuegoImg, medallas, cuchilloImg, tajoImg, vueloImg] = await Promise.all([
    cargarImagen('./arte/crudo/ciclope.png?v=20260905174112'),
    cargarImagen('./arte/crudo/ciclope-ataca.png?v=20260905174112'),
    cargarImagen('./arte/crudo/ciclope-muere.png?v=20260905174112'),
    cargarImagen('./arte/crudo/arco.png?v=20260905174112'),
    cargarImagen('./arte/crudo/texturas.png?v=20260905174112'),
    cargarImagen('./arte/crudo/items.png?v=20260905174112'),
    cargarImagen('./arte/crudo/tienda.png?v=20260905174112'),
    cargarImagen('./arte/crudo/pretendiente.png?v=20260905174112'),
    cargarImagen('./arte/crudo/pretendiente-ataca.png?v=20260905174112'),
    cargarImagen('./arte/crudo/pretendiente-muere.png?v=20260905174112'),
    cargarImagen('./arte/crudo/cuerno.png?v=20260905174112'),
    cargarImagen('./arte/crudo/mercader.png?v=20260905174112'),
    cargarImagen('./arte/crudo/caras.png?v=20260905174112'),
    cargarImagen('./arte/crudo/guante.png?v=20260905174112'),
    cargarImagen('./arte/crudo/objetos2.png?v=20260905174112'),
    cargarImagen('./arte/crudo/hilo.png?v=20260905174112'),
    cargarImagen('./arte/crudo/jabalina.png?v=20260905174112'),
    cargarImagen('./arte/crudo/hacha.png?v=20260905174112'),
    cargarImagen('./arte/crudo/pico.png?v=20260905174112'),
    cargarImagen('./arte/crudo/mano.png?v=20260905174112'),
    cargarImagen('./arte/crudo/fuego.png?v=20260905174112'),
    cargarImagen('./arte/crudo/insignias.png?v=20260905174112'),
    cargarImagen('./arte/crudo/cuchillo.png?v=20260905174112'),
    cargarImagen('./arte/crudo/hacha-tajo.png?v=20260905174112'),
    cargarImagen('./arte/crudo/hacha-vuelo.png?v=20260905174112')
  ]);

  const quieto = idle ? cortarTira(idle, 4) : [0, 1, 2, 3].map(siluetaCiclope);
  recursos.ciclope = {
    quieto,
    ataca: atk ? cortarTira(atk, 3) : quieto.slice(0, 1),
    muere: die ? cortarTira(die, 4) : quieto.slice(0, 1)
  };
  if (pIdle) {
    const pq = cortarTira(pIdle, 4);
    recursos.pretendiente = {
      quieto: pq,
      ataca: pAtk ? cortarTira(pAtk, 3) : pq.slice(0, 1),
      muere: pDie ? cortarTira(pDie, 4) : pq.slice(0, 1)
    };
  }

  if (bow) {
    const cuadros = cortarTira(bow, 3, { ajustar: true, altoComun: true });
    recursos.arco = cuadros.map(t => t.image.toDataURL());
  } else {
    recursos.arco = arcoRespaldo;
  }

  if (muros) {
    const c = cortarRejilla(muros, 3, 2, { margen: 0.03, salida: 128 });
    texturasNivel = {
      marmol: c[0], columna: c[1], terracota: c[2],
      mosaico: c[3], roca: c[4], piedra: c[5]
    };
  }

  if (cosas) recursos.items = cortarRejilla(cosas, 4, 3, { margen: 0.02, transparente: true });
  if (mercancia) recursos.tienda = cortarRejilla(mercancia, 4, 3, { margen: 0.02, transparente: true });
  if (horn) {
    recursos.cuerno = cortarTira(horn, 3, { ajustar: true, altoComun: true });
    imagenesCuerno = recursos.cuerno.map(t => t.image.toDataURL());
  }
  if (viejo) recursos.mercader = recorteEntero(viejo).toDataURL();
  if (cuchilloImg) {
    recursos.cuchillo = cortarTira(cuchilloImg, 4, { ajustar: true, altoComun: true });
    imagenesCuchillo = recursos.cuchillo.map(t => t.image.toDataURL());
    imagenManoVacia = imagenesCuchillo[3];
  }
  if (vueloImg) {
    recursos.vuelo = cortarTira(vueloImg, 4, { ajustar: true, altoComun: true });
    imagenesVuelo = recursos.vuelo.map(t => t.image.toDataURL());
    imagenManoVacia = imagenesVuelo[1];
    recursos.hachaVuelo = recorteSuperior(recursos.vuelo[2], 0.5);
  }
  if (tajoImg) {
    recursos.tajo = cortarTira(tajoImg, 4, { ajustar: true, altoComun: true });
    imagenesTajo = recursos.tajo.map(t => t.image.toDataURL());
  }
  if (hachaImg) {
    recursos.hacha = cortarTira(hachaImg, 4, { ajustar: true, altoComun: true });
    imagenesHacha = recursos.hacha.map(t => t.image.toDataURL());
    recursos.hachaVuelo = recorteSuperior(recursos.hacha[2], 0.42);

  }
  if (picoImg) {
    recursos.pico = cortarTira(picoImg, 4, { ajustar: true, altoComun: true });
    imagenesPico = recursos.pico.map(t => t.image.toDataURL());
  }
  if (manoImg) {
    recursos.mano = cortarTira(manoImg, 4, { ajustar: true, altoComun: true });
    imagenesMano = recursos.mano.map(t => t.image.toDataURL());
  }
  if (fuegoImg) recursos.fuego = cortarTira(fuegoImg, 6, { ajustar: false });
  if (medallas) recursos.insignias = cortarRejilla(medallas, 4, 3, { margen: 0.02, transparente: true });
  if (asta) {
    recursos.jabalina = cortarTira(asta, 4, { ajustar: true, altoComun: true });
    imagenesJabalina = recursos.jabalina.map(t => t.image.toDataURL());
  }
  if (cordel) {
    recursos.hilo = cortarTira(cordel, 4, { ajustar: true, altoComun: true });
    imagenesHilo = recursos.hilo.map(t => t.image.toDataURL());
  }
  if (reliquias) recursos.reliquias = cortarRejilla(reliquias, 4, 3, { margen: 0.02, transparente: true });
  if (mano) {
    recursos.guante = cortarTira(mano, 4, { ajustar: true, altoComun: true });
    imagenesGuante = recursos.guante.map(t => t.image.toDataURL());
  }
  if (rostros) {
    imagenesCara = cortarTira(rostros, 5, { ajustar: true, altoComun: true })
      .map(t => t.image.toDataURL());
  }

  const partes = [];
  if (!idle) partes.push('ciclope.png');
  if (!atk) partes.push('ciclope-ataca.png');
  if (!die) partes.push('ciclope-muere.png');
  if (!bow) partes.push('arco.png');
  if (!muros) partes.push('texturas.png');
  if (!pIdle) partes.push('pretendiente.png');
  if (!pDie) partes.push('pretendiente-muere.png');
  if (!mano) partes.push('guante.png');
  if (!reliquias) partes.push('objetos2.png');
  if (!cordel) partes.push('hilo.png');
  if (!asta) partes.push('jabalina.png');
  if (!hachaImg) partes.push('hacha.png');
  if (!picoImg) partes.push('pico.png');
  if (!manoImg) partes.push('mano.png');
  if (!fuegoImg) partes.push('fuego.png');
  if (!medallas) partes.push('insignias.png');
  if (!cuchilloImg) partes.push('cuchillo.png');
  if (!tajoImg) partes.push('hacha-tajo.png');
  if (!vueloImg) partes.push('hacha-vuelo.png');
  if (!cosas) partes.push('items.png');
  document.getElementById('diag').textContent =
    partes.length ? 'sin arte: ' + partes.join(' ') : '';
}

const enemigos = [];
const objetos = [];
let rondas = null;
let tienda = null;
let flujo = null;
let portales = null;
let otroLado = null;
let cerco = null;
let quemando = 0;
const director = new Director();
let grietaLista = false;
let jefeActual = null;
let ganado = false;
const elJefe = document.getElementById('jefe');
const rellenoJefe = elJefe.querySelector('.relleno');

const RECORD = 'nostos.record';

function leerRecord() {
  try { return JSON.parse(localStorage.getItem(RECORD) || '{}'); } catch (e) { return {}; }
}

function guardarRecord(datos) {
  const previo = leerRecord();
  const mejor = {
    ronda: Math.max(previo.ronda || 0, datos.ronda),
    bajas: Math.max(previo.bajas || 0, datos.bajas),
    oro: Math.max(previo.oro || 0, datos.oro),
    gloria: (previo.gloria || 0) + datos.gloria,
    victorias: (previo.victorias || 0) + (datos.gano ? 1 : 0)
  };
  try { localStorage.setItem(RECORD, JSON.stringify(mejor)); } catch (e) {}
  return mejor;
}

function pintarMarca() {
  const r = leerRecord();
  const el = document.getElementById('marca');
  if (!r.ronda) { el.textContent = ''; return; }
  const partes = ['MEJOR RONDA ' + r.ronda, r.bajas + ' BAJAS', (r.gloria || 0) + ' GLORIA'];
  if (r.victorias) partes.push(r.victorias + (r.victorias > 1 ? ' VICTORIAS' : ' VICTORIA'));
  el.textContent = partes.join('  ·  ');
}
const audio = new Audio();
let tensabaAntes = false;
let avisoTenso = false;

function elegirTipo(indice) {
  if (rondas.ultimoPerfil && rondas.ultimoPerfil.jefe && indice === 0) return TIPOS.jefe;
  if (!recursos.pretendiente) return TIPOS.ciclope;
  const n = rondas.numero;
  if (n < 3) return TIPOS.ciclope;
  const cada = n >= 6 ? 2 : 3;
  return indice % cada === 0 ? TIPOS.pretendiente : TIPOS.ciclope;
}

let contadorNacidos = 0;

const RADIO_ENEMIGO = 1.7;

function espacioLibre(x, z) {
  const cx = Math.floor(x / CELDA);
  const cz = Math.floor(z / CELDA);
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const gx = cx + dx, gz = cz + dz;
      const fila = nivel.rejilla[gz];
      if (!fila || '#CTRF'.includes(fila[gx] || '#')) {
        const minX = gx * CELDA, minZ = gz * CELDA;
        const px = Math.max(minX, Math.min(x, minX + CELDA));
        const pz = Math.max(minZ, Math.min(z, minZ + CELDA));
        const ddx = x - px, ddz = z - pz;
        if (ddx * ddx + ddz * ddz < RADIO_ENEMIGO * RADIO_ENEMIGO) return false;
      }
    }
  }
  return true;
}

function acomodar(pos) {
  const cx = Math.floor(pos.x / CELDA);
  const cz = Math.floor(pos.z / CELDA);
  const centro = (c) => c * CELDA + CELDA / 2;

  if (espacioLibre(pos.x, pos.z)) return new THREE.Vector3(pos.x, 0, pos.z);
  if (espacioLibre(centro(cx), centro(cz))) {
    return new THREE.Vector3(centro(cx), 0, centro(cz));
  }
  for (let r = 1; r <= 4; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const gx = cx + dx, gz = cz + dz;
        const fila = nivel.rejilla[gz];
        if (!fila || '#CTRF'.includes(fila[gx] || '#')) continue;
        if (espacioLibre(centro(gx), centro(gz))) {
          return new THREE.Vector3(centro(gx), 0, centro(gz));
        }
      }
    }
  }
  return new THREE.Vector3(centro(cx), 0, centro(cz));
}

function cerrarRonda(n) {
  if (cerco.activo) { cerco.apagar(); avisar('EL FUEGO SE APAGA'); }
  const m = otroLado.multiplicadores;
  soltarObjetos(otroLado.dentro ? n + 3 : n);
  director.terminaRonda(jugador, rondas.ultimoPerfil ? rondas.ultimoPerfil.cuantos : 3);
  if (otroLado.dentro) {
    otroLado.salir();
    avisar('SALISTE DEL OTRO LADO');
  } else if (rondas.numero % 3 === 0) {
    grietaLista = true;
    otroLado.ofrecida = true;
    anunciar('LA GRIETA SE ABRE', 'PULSA V PARA CRUZAR');
  }
}

function nacer(pos, cfg, indice) {
  const tipo = elegirTipo(indice === undefined ? contadorNacidos++ : indice);
  const m = otroLado.multiplicadores;
  const ajustado = {
    ...cfg,
    vida: Math.round(cfg.vida * m.vida),
    dano: Math.round(cfg.dano * m.dano),
    velocidad: cfg.velocidad * m.velocidad
  };
  const e = new Enemigo(acomodar(pos), recursos[tipo.arte] || recursos.ciclope, nivel, { ...ajustado, tipo, flujo, portales });
  if (otroLado.dentro) {
    e.tinteBase = otroLado.tinteEnemigo;
    e.sprite.material.color.setHex(e.tinteBase);
  }
  if (tipo === TIPOS.jefe) {
    e.esJefe = true;
    e.vidaMax = e.vida;
    jefeActual = e;
  }
  e.alGolpear = d => jugador.recibir(d);
  e.alTirar = tirarJabalina;
  e.alRugir = (en, atacando) => audio.sonar(atacando ? (en.tipo.distancia ? 'lanza' : 'garrote') : 'rugido', en.pos);
  e.alMorir = en => {
    audio.sonar('muereEnemigo', en.pos);
    if (en.esJefe) ganar();
  };
  escena.add(e.malla);
  enemigos.push(e);
}

const jabalinas = [];
const geoJabalina = new THREE.CylinderGeometry(0.11, 0.11, 3.2, 5);
geoJabalina.rotateX(Math.PI / 2);
const matJabalina = new THREE.MeshBasicMaterial({ color: 0xb87333 });

function tirarJabalina(enemigo, dano, presa) {
  const origen = enemigo.pos.clone();
  origen.y = 2.6;
  const blanco = presa
    ? { x: presa.pos.x, y: 2.6, z: presa.pos.z }
    : { x: jugador.pos.x, y: 3.0, z: jugador.pos.z };
  const dir = new THREE.Vector3(
    blanco.x - origen.x, blanco.y - origen.y, blanco.z - origen.z
  ).normalize();
  const m = new THREE.Mesh(geoJabalina, matJabalina);
  m.position.copy(origen);
  escena.add(m);
  jabalinas.push({
    malla: m, vel: dir.multiplyScalar(30), dano, edad: 0,
    deEnemigo: !!presa, presa
  });
}

function moverJabalinas(dt) {
  for (let i = jabalinas.length - 1; i >= 0; i--) {
    const j = jabalinas[i];
    j.edad += dt;
    const previa = j.malla.position.clone();
    j.malla.position.addScaledVector(j.vel, dt);
    if (portales) portales.atravesar(previa, j.malla.position, j.vel);
    j.malla.lookAt(j.malla.position.clone().add(j.vel));
    let fuera = j.edad > 3.5 || j.malla.position.y < 0.2;
    if (!fuera) {
      const cx = Math.floor(j.malla.position.x / CELDA);
      const cz = Math.floor(j.malla.position.z / CELDA);
      const fila = nivel.rejilla[cz];
      if (!fila || '#CTRF'.includes(fila[cx] || '#')) fuera = true;
    }
    if (!fuera && j.deEnemigo) {
      for (const e of enemigos) {
        if (!e.vivo) continue;
        if (Math.hypot(e.pos.x - j.malla.position.x, e.pos.z - j.malla.position.z) < 2.6) {
          audio.sonar('carne', e.pos);
          if (e.recibir(j.dano)) marcarBaja();
          fuera = true;
          break;
        }
      }
    }
    if (!fuera && !j.deEnemigo) {
      const dx = j.malla.position.x - jugador.pos.x;
      const dz = j.malla.position.z - jugador.pos.z;
      if (dx * dx + dz * dz < 2.6) {
        if (efectos.espejo > 0 && !j.rebotada) {
          j.rebotada = true;
          j.vel.multiplyScalar(-1.15);
          j.dano *= 2;
          audio.sonar('piedra');
        } else {
          jugador.recibir(j.dano);
          fuera = true;
        }
      }
      if (j.rebotada) {
        for (const e of enemigos) {
          if (!e.vivo) continue;
          if (Math.hypot(e.pos.x - j.malla.position.x, e.pos.z - j.malla.position.z) < 2.6) {
            audio.sonar('carne', e.pos);
            if (e.recibir(j.dano)) marcarBaja();
            fuera = true;
            break;
          }
        }
      }
    }
    if (fuera) { escena.remove(j.malla); jabalinas.splice(i, 1); }
  }
}

function celdasLibres() {
  const libres = [];
  for (let z = 1; z < nivel.alto - 1; z++) {
    for (let x = 1; x < nivel.ancho - 1; x++) {
      if ('.@E+'.includes(nivel.rejilla[z][x])) {
        libres.push(new THREE.Vector3(x * CELDA + CELDA / 2, 0, z * CELDA + CELDA / 2));
      }
    }
  }
  return libres;
}

function soltarObjetos(ronda) {
  if (!recursos.items.length) return;
  const libres = celdasLibres();
  const menu = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const cuantos = Math.min(6, 3 + Math.floor(ronda / 2));
  for (let i = 0; i < cuantos; i++) {
    const tipo = CATALOGO[menu[Math.floor(Math.random() * menu.length)]];
    const pos = libres[Math.floor(Math.random() * libres.length)];
    if (!pos) continue;
    const o = new Objeto(tipo, recursos.items[tipo.celda], pos);
    escena.add(o.malla);
    objetos.push(o);
  }
}

function marcarBaja() {
  jugador.bajas++;
  jugador.oro += Math.round((13 + rondas.numero * 2) * otroLado.multiplicadores.oro);
}

const elBanner = document.getElementById('banner');
const elAviso = document.getElementById('aviso');
let tempBanner = 0, temporAviso = 0;

function anunciar(titulo, pie) {
  audio.sonar('ronda');
  elBanner.querySelector('b').textContent = titulo;
  elBanner.querySelector('span').textContent = pie || '';
  elBanner.classList.add('ver');
  clearTimeout(tempBanner);
  tempBanner = setTimeout(() => elBanner.classList.remove('ver'), 2600);
}

function avisar(texto) {
  elAviso.textContent = texto;
  elAviso.classList.add('ver');
  clearTimeout(temporAviso);
  temporAviso = setTimeout(() => elAviso.classList.remove('ver'), 1300);
}

function limpiarMundo() {
  for (const e of enemigos) escena.remove(e.malla);
  enemigos.length = 0;
  for (const o of objetos) escena.remove(o.malla);
  objetos.length = 0;
  for (const f of flechas) escena.remove(f.malla);
  flechas.length = 0;
  for (const j of jabalinas) escena.remove(j.malla);
  jabalinas.length = 0;
  if (hachaVuelo) { hachaVuelo.malla.visible = false; hachaVuelo = null; }
  jugador.hachaFuera = false;
  contadorNacidos = 0;
}

const flechas = [];
const geoFlecha = new THREE.CylinderGeometry(0.07, 0.07, 2.2, 5);
geoFlecha.rotateX(Math.PI / 2);
const matFlecha = new THREE.MeshBasicMaterial({ color: 0xe8c14a });

function lanzarFlecha(fuerza, dir, extra = 0, potencia = 1) {
  const m = new THREE.Mesh(geoFlecha, matFlecha);
  m.position.copy(camara.position);
  escena.add(m);
  const desvio = dir.clone();
  if (extra) { desvio.x += extra; desvio.normalize(); }
  flechas.push({
    malla: m,
    vel: desvio.multiplyScalar((46 + fuerza * 62) * jugador.mult.velFlecha),
    dano: (18 + fuerza * 52) * jugador.mult.dano * potencia * furia(),
    edad: 0
  });
}

function disparar(fuerza, dir) {
  if (jugador.doble) {
    lanzarFlecha(fuerza, dir, -0.075);
    lanzarFlecha(fuerza, dir, 0.075);
  } else {
    lanzarFlecha(fuerza, dir);
  }
  audio.sonar('flecha', null, fuerza);
}

const geoRayo = new THREE.CylinderGeometry(0.34, 0.34, 1, 7);
geoRayo.rotateX(Math.PI / 2);
geoRayo.translate(0, 0, 0.5);
const matRayo = new THREE.MeshBasicMaterial({
  color: 0xbfe4ff, transparent: true, opacity: 0.9, depthWrite: false
});
let mallaRayo = null;

function lanzarRayo(carga) {
  const origen = camara.position.clone();
  const dir = jugador.direccion();
  const golpe = trazar(nivel, origen, dir, 120);
  const largo = golpe ? golpe.dist : 120;

  if (!mallaRayo) {
    mallaRayo = new THREE.Mesh(geoRayo, matRayo);
    escena.add(mallaRayo);
  }
  mallaRayo.position.copy(origen);
  mallaRayo.lookAt(origen.clone().add(dir));
  mallaRayo.scale.set(0.7 + carga * 1.5, 0.7 + carga * 1.5, largo);
  mallaRayo.visible = true;
  rayoReloj = 0.12;
  destelloGuante = 2;
  guanteReloj = 0.34;
  audio.sonar('rayo', null, carga);

  const dano = (55 + carga * 130) * jugador.mult.dano * furia();
  const radio = 2.4 + carga * 1.4;
  for (const e of enemigos) {
    if (!e.vivo) continue;
    const dx = e.pos.x - origen.x;
    const dz = e.pos.z - origen.z;
    const proy = dx * dir.x + dz * dir.z;
    if (proy < 0 || proy > largo) continue;
    const perpX = dx - dir.x * proy;
    const perpZ = dz - dir.z * proy;
    if (Math.hypot(perpX, perpZ) > radio) continue;
    audio.sonar('carne', e.pos);
    if (e.recibir(dano)) marcarBaja();
  }
}

const geoCuerda = new THREE.CylinderGeometry(0.06, 0.06, 1, 5);
geoCuerda.rotateX(Math.PI / 2);
geoCuerda.translate(0, 0, 0.5);
const matCuerda = new THREE.MeshBasicMaterial({ color: 0xe8c14a });
let mallaCuerda = null;
let cuerdaReloj = 0;

function pintarCuerda(desde, hasta) {
  if (!mallaCuerda) {
    mallaCuerda = new THREE.Mesh(geoCuerda, matCuerda);
    escena.add(mallaCuerda);
  }
  const largo = desde.distanceTo(hasta);
  mallaCuerda.position.copy(desde);
  mallaCuerda.lookAt(hasta);
  mallaCuerda.scale.set(1, 1, largo);
  mallaCuerda.visible = true;
  cuerdaReloj = 0.22;
}

function engancharse() {
  const origen = camara.position.clone();
  const dir = jugador.direccion();
  const golpe = trazar(nivel, origen, dir, 70);
  const alcance = golpe ? golpe.dist : 70;

  let presa = null;
  let mejor = alcance;
  for (const e of enemigos) {
    if (!e.vivo) continue;
    const dx = e.pos.x - jugador.pos.x;
    const dz = e.pos.z - jugador.pos.z;
    const proy = dx * dir.x + dz * dir.z;
    if (proy < 2 || proy > mejor) continue;
    const perpX = dx - dir.x * proy;
    const perpZ = dz - dir.z * proy;
    if (Math.hypot(perpX, perpZ) > 3.2) continue;
    presa = e;
    mejor = proy;
  }

  hiloReloj = 0.5;
  hiloCuadro = 2;
  audio.sonar('lanza');

  if (presa) {
    pintarCuerda(origen, presa.pos.clone().setY(2.5));
    const dx = jugador.pos.x - presa.pos.x;
    const dz = jugador.pos.z - presa.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    for (let i = 0; i < 24; i++) {
      if (Math.hypot(jugador.pos.x - presa.pos.x, jugador.pos.z - presa.pos.z) < 6) break;
      const nx = presa.pos.x + (dx / d) * 1.4;
      const nz = presa.pos.z + (dz / d) * 1.4;
      let movio = false;
      if (presa._libre(nx, presa.pos.z)) { presa.pos.x = nx; movio = true; }
      if (presa._libre(presa.pos.x, nz)) { presa.pos.z = nz; movio = true; }
      if (!movio) break;
    }
    presa.paralizado = 1.8;
    avisar('LO JALASTE');
    return;
  }

  if (!golpe) { avisar('NADA A LA VISTA'); return; }
  pintarCuerda(origen, golpe.punto);

  let recorrido = 0;
  let px = jugador.pos.x, pz = jugador.pos.z;
  for (let i = 0; i < 40; i++) {
    const nx = px + dir.x * 1.3;
    const nz = pz + dir.z * 1.3;
    if (jugador._colisionar(nx, pz) || jugador._colisionar(px, nz)) break;
    px = nx; pz = nz;
    recorrido += 1.3;
  }
  if (recorrido < 2) { avisar('DEMASIADO CERCA'); return; }

  tiron = { x: dir.x, z: dir.z, resta: recorrido };
  audio.sonar('cruzar');
}

let tiron = null;

function moverTiron(dt) {
  if (!tiron) return;
  const paso = Math.min(tiron.resta, 62 * dt);
  const nx = jugador.pos.x + tiron.x * paso;
  const nz = jugador.pos.z + tiron.z * paso;
  let avanzo = false;
  if (!jugador._colisionar(nx, jugador.pos.z)) { jugador.pos.x = nx; avanzo = true; }
  if (!jugador._colisionar(jugador.pos.x, nz)) { jugador.pos.z = nz; avanzo = true; }
  tiron.resta -= paso;
  if (!avanzo || tiron.resta <= 0.1) tiron = null;
}

let armaEnMano = 'arco';
const marcados = [];
const anillos = [];
const geoAnillo = new THREE.RingGeometry(1.5, 1.9, 16);
const matAnillo = new THREE.MeshBasicMaterial({
  color: 0xe2482d, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthTest: false
});

function marcar(encendido) {
  if (!encendido) return;
  limpiarMarcas();
  avisar('APUNTA Y SUELTA X');
}

function limpiarMarcas() {
  for (const a of anillos) escena.remove(a);
  anillos.length = 0;
  marcados.length = 0;
}

function actualizarMarcas() {
  if (!jugador.marcando) return;
  if (marcados.length >= 5) return;
  const dir = jugador.direccion();
  let elegido = null;
  let mejor = 0.965;
  for (const e of enemigos) {
    if (!e.vivo || marcados.includes(e)) continue;
    const dx = e.pos.x - jugador.pos.x;
    const dz = e.pos.z - jugador.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 70) continue;
    const punteria = (dx * dir.x + dz * dir.z) / (d || 1);
    if (punteria > mejor) { mejor = punteria; elegido = e; }
  }
  if (!elegido) return;
  marcados.push(elegido);
  const a = new THREE.Mesh(geoAnillo, matAnillo);
  a.renderOrder = 999;
  escena.add(a);
  anillos.push(a);
  audio.sonar('tenso');
}

function moverAnillos() {
  for (let i = 0; i < anillos.length; i++) {
    const e = marcados[i];
    if (!e) continue;
    anillos[i].position.set(e.pos.x, e.tipo.alto * 0.55, e.pos.z);
    anillos[i].lookAt(camara.position);
  }
}

function soltarMarcas() {
  const objetivos = marcados.filter(e => e.vivo);
  if (!objetivos.length) { limpiarMarcas(); avisar('NADIE MARCADO'); return; }
  if (jugador.flechas < objetivos.length) {
    limpiarMarcas();
    avisar('TE FALTAN FLECHAS');
    audio.sonar('vacio');
    return;
  }
  jugador.flechas -= objetivos.length;
  objetivos.forEach((e, i) => {
    setTimeout(() => {
      if (!e.vivo) return;
      const desde = camara.position.clone();
      const hacia = new THREE.Vector3(e.pos.x, 2.6, e.pos.z);
      const dir = hacia.sub(desde).normalize();
      const m = new THREE.Mesh(geoFlecha, matFlecha);
      m.position.copy(desde);
      escena.add(m);
      flechas.push({
        malla: m,
        vel: dir.multiplyScalar(120),
        dano: 62 * jugador.mult.dano * furia(),
        edad: 0
      });
      audio.sonar('flecha', null, 1);
    }, i * 90);
  });
  avisar('OJO DEL CAZADOR: ' + objetivos.length);
  limpiarMarcas();
}
let picoReloj = 0;
let picoCuadro = 0;
let manoReloj = 0;
let manoCuadro = 0;
const escombros = [];
const geoEscombro = new THREE.DodecahedronGeometry(0.9, 0);
const matEscombro = new THREE.MeshLambertMaterial({ color: 0xb8b3a4 });
let cargado = null;

function picar() {
  if (jugador.picos <= 0) {
    audio.sonar('vacio');
    avisar('EL PICO SE ENFRIA HASTA LA PROXIMA RONDA');
    return;
  }
  const origen = camara.position.clone();
  const dir = jugador.direccion();
  const golpe = trazar(nivel, origen, dir, 11);
  picoReloj = 0.5;
  picoCuadro = 1;
  if (!golpe) { avisar('MUY LEJOS DEL MURO'); return; }
  if (!romper(nivel, golpe.celda.x, golpe.celda.z)) { avisar('AHI NO SE PUEDE'); return; }

  jugador.picos--;
  audio.sonar('piedra', golpe.punto);
  sacudida = Math.max(sacudida, 0.5);
  minimapa.refrescar();
  flujo.reloj = 0;

  const centro = new THREE.Vector3(
    golpe.celda.x * CELDA + CELDA / 2, 1, golpe.celda.z * CELDA + CELDA / 2
  );
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(geoEscombro, matEscombro);
    m.position.set(
      centro.x + (Math.random() - 0.5) * 2.6,
      0.9,
      centro.z + (Math.random() - 0.5) * 2.6
    );
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    escena.add(m);
    escombros.push({ malla: m });
  }
  avisar('MURO ROTO · TE QUEDAN ' + jugador.picos);
}

function agarrar() {
  manoReloj = 0.5;
  if (cargado) {
    const dir = jugador.direccion();
    cargado.vuela = { x: dir.x, z: dir.z, y: dir.y };
    cargado.edad = 0;
    cargado.tocados = new Set();
    cargado = null;
    manoCuadro = 3;
    audio.sonar('tajo');
    return;
  }
  let mejor = null;
  let dmin = 16;
  for (const e of escombros) {
    if (e.vuela) continue;
    const d = Math.hypot(e.malla.position.x - jugador.pos.x, e.malla.position.z - jugador.pos.z);
    if (d < dmin) { dmin = d; mejor = e; }
  }
  if (!mejor) { avisar('NO HAY ESCOMBROS CERCA'); manoCuadro = 1; return; }
  cargado = mejor;
  manoCuadro = 1;
  audio.sonar('recoger');
}

function moverEscombros(dt) {
  if (cargado) {
    const dir = jugador.direccion();
    cargado.malla.position.set(
      camara.position.x + dir.x * 3.2,
      camara.position.y + dir.y * 3.2,
      camara.position.z + dir.z * 3.2
    );
    cargado.malla.rotation.y += dt * 2;
  }
  for (let i = escombros.length - 1; i >= 0; i--) {
    const e = escombros[i];
    if (!e.vuela) continue;
    e.edad += dt;
    e.malla.position.x += e.vuela.x * 54 * dt;
    e.malla.position.y += e.vuela.y * 54 * dt;
    e.malla.position.z += e.vuela.z * 54 * dt;
    e.malla.rotation.x += dt * 12;
    const cx = Math.floor(e.malla.position.x / CELDA);
    const cz = Math.floor(e.malla.position.z / CELDA);
    const fila = nivel.rejilla[cz];
    let fuera = e.edad > 2.5 || !fila || '#CTRF'.includes(fila[cx] || '#');
    if (!fuera) {
      for (const en of enemigos) {
        if (!en.vivo || e.tocados.has(en)) continue;
        if (Math.hypot(en.pos.x - e.malla.position.x, en.pos.z - e.malla.position.z) < 3.2) {
          e.tocados.add(en);
          audio.sonar('carne', en.pos);
          if (en.recibir(120 * jugador.mult.dano * furia())) marcarBaja();
          fuera = true;
          break;
        }
      }
    }
    if (fuera) { escena.remove(e.malla); escombros.splice(i, 1); }
  }
}
let mallaHachaVuelo = null;
let hachaVuelo = null;

function crearHachaVuelo() {
  if (mallaHachaVuelo) return mallaHachaVuelo;
  const tex = recursos.hachaVuelo;
  const geo = new THREE.PlaneGeometry(3.4, 3.4);
  const mat = tex
    ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })
    : new THREE.MeshBasicMaterial({ color: 0xd9cfb4 });
  mallaHachaVuelo = new THREE.Mesh(geo, mat);
  escena.add(mallaHachaVuelo);
  return mallaHachaVuelo;
}

function lanzarCuchillo() {
  if (jugador.cuchillos <= 0) { audio.sonar('vacio'); avisar('SIN CUCHILLOS'); return; }
  jugador.cuchillos--;
  jugador.enfriamientoTajo = 0.32;
  cuchilloReloj = 0.4;
  cuchilloCuadro = 2;
  audio.sonar('tajo');
  const dir = jugador.direccion();
  const m = new THREE.Mesh(geoFlecha, matFlecha);
  m.position.copy(camara.position);
  escena.add(m);
  flechas.push({
    malla: m,
    vel: dir.clone().multiplyScalar(78),
    dano: 150 * jugador.mult.dano * furia(),
    edad: 0
  });
}

function lanzarHacha() {
  if (jugador.mano === 'cuchillo') return lanzarCuchillo();
  if (jugador.hachaFuera || jugador.enfriamientoTajo > 0) return;
  jugador.hachaFuera = true;
  jugador.enfriamientoTajo = 0.4;
  vueloReloj = 0.2;
  vueloCuadro = 0;
  audio.sonar('tajo');
  const m = crearHachaVuelo();
  m.visible = true;
  m.position.copy(camara.position);
  hachaVuelo = {
    malla: m,
    dir: jugador.direccion(),
    vuelta: false,
    edad: 0,
    tocados: new Set()
  };
}

function moverHacha(dt) {
  if (!hachaVuelo) return;
  const h = hachaVuelo;
  h.edad += dt;
  h.malla.lookAt(camara.position);
  h.giro = (h.giro || 0) + dt * 16;
  h.malla.rotation.z = h.giro;

  if (!h.vuelta) {
    const paso = 42 * dt;
    const nx = h.malla.position.x + h.dir.x * paso;
    const nz = h.malla.position.z + h.dir.z * paso;
    const cx = Math.floor(nx / CELDA);
    const cz = Math.floor(nz / CELDA);
    const fila = nivel.rejilla[cz];
    const choca = !fila || '#CTRF'.includes(fila[cx] || '#');
    if (choca || h.edad > 0.75) {
      h.vuelta = true;
      audio.sonar('piedra', h.malla.position);
    } else {
      h.malla.position.set(nx, camara.position.y, nz);
    }
  } else {
    const hacia = new THREE.Vector3(
      camara.position.x - h.malla.position.x,
      camara.position.y - h.malla.position.y,
      camara.position.z - h.malla.position.z
    );
    const d = hacia.length();
    if (d < 2.2) {
      h.malla.visible = false;
      hachaVuelo = null;
      jugador.hachaFuera = false;
      vueloReloj = 0.24;
      vueloCuadro = 3;
      audio.sonar('recoger');
      return;
    }
    h.malla.position.addScaledVector(hacia.normalize(), 46 * dt);
  }

  for (const e of enemigos) {
    if (!e.vivo || h.tocados.has(e)) continue;
    if (Math.hypot(e.pos.x - h.malla.position.x, e.pos.z - h.malla.position.z) < 3) {
      h.tocados.add(e);
      audio.sonar('carne', e.pos);
      if (e.recibir(95 * jugador.mult.dano * furia())) marcarBaja();
    }
  }
}

const ALCANCE_TAJO = 7.5;
const DANO_TAJO = 85;

function tajo() {
  if (jugador.mano === 'cuchillo') {
    cuchilloReloj = 0.3;
    cuchilloCuadro = 1;
    empuje = 1;
  } else {
    espadaReloj = 0.42;
  }
  audio.sonar('tajo');
  const dir = jugador.direccion();
  let tocados = 0;
  for (const e of enemigos) {
    if (!e.vivo) continue;
    const dx = e.pos.x - jugador.pos.x;
    const dz = e.pos.z - jugador.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > ALCANCE_TAJO) continue;
    const frente = (dx * dir.x + dz * dir.z) / (dist || 1);
    if (frente < 0.35) continue;
    audio.sonar('carne', e.pos);
    const golpe = jugador.mano === 'cuchillo' ? 140 : DANO_TAJO;
    if (e.recibir(golpe * jugador.mult.dano * furia())) marcarBaja();
    tocados++;
  }
  if (!tocados) audio.sonar('fallo');
}

let relojFuria = 0;
function furia() { return relojFuria > 0 ? 2 : 1; }

const efectos = { espejo: 0, vellocino: 0, ojo: 0 };
let dracma = false;

function usarReliquia(id) {
  if (id === 'manzana') {
    const vivos = enemigos.filter(e => e.vivo);
    if (vivos.length < 2) return false;
    for (const e of vivos) {
      e.confundido = 12;
      const otros = vivos.filter(o => o !== e);
      e.presa = otros[Math.floor(Math.random() * otros.length)];
      e.estado = 'persigue';
    }
    avisar('SE PELEAN ENTRE ELLOS');
  } else if (id === 'espejo') {
    efectos.espejo = 12;
    avisar('ESPEJO DE PERSEO');
  } else if (id === 'vellocino') {
    if (jugador.vida >= jugador.vidaMax) return false;
    efectos.vellocino = 15;
    avisar('VELLOCINO DE ORO');
  } else if (id === 'sandalias') {
    const dir = jugador.direccion();
    let paso = 0;
    for (let i = 0; i < 14; i++) {
      const nx = jugador.pos.x + dir.x * 1.2;
      const nz = jugador.pos.z + dir.z * 1.2;
      if (jugador._colisionar(nx, jugador.pos.z) || jugador._colisionar(jugador.pos.x, nz)) break;
      jugador.pos.x = nx;
      jugador.pos.z = nz;
      paso++;
    }
    if (!paso) return false;
    audio.sonar('cruzar');
    avisar('SANDALIAS ALADAS');
  } else if (id === 'ojo') {
    efectos.ojo = 20;
    avisar('VES A TRAVES DE LOS MUROS');
  } else if (id === 'dracma') {
    if (dracma) return false;
    dracma = true;
    avisar('CARONTE TE ESPERA');
  } else return null;
  audio.sonar('recoger');
  return true;
}

function usarConsumible(id) {
  const rel = usarReliquia(id);
  if (rel !== null) return rel;
  if (id === 'portales') {
    if (!jugador.pistola) return false;
    jugador.alPortal('azul');
    return true;
  }
  if (id === 'frasco') {
    if (jugador.vida >= jugador.vidaMax) return false;
    jugador.vida = Math.min(jugador.vidaMax, jugador.vida + 60);
    audio.sonar('curar');
    avisar('AMBROSIA');
  } else if (id === 'fuego') {
    let tocados = 0;
    for (const e of enemigos) {
      if (!e.vivo) continue;
      const d = Math.hypot(e.pos.x - jugador.pos.x, e.pos.z - jugador.pos.z);
      if (d < 16) {
        if (e.recibir(110)) marcarBaja();
        tocados++;
      }
    }
    audio.sonar('fuego');
    destello('#c25a10', 0.5, 180);
    sacudida = Math.max(sacudida, 0.7);
    avisar('FUEGO GRIEGO: ' + tocados);
  } else if (id === 'jabalina') {
    jabalinaReloj = 0.6;
    jabalinaCuadro = 1;
    const rumbo = jugador.direccion();
    setTimeout(() => {
      if (!muerto) lanzarFlecha(1, rumbo, 0, 4);
    }, 230);
    avisar('JABALINA');
  } else if (id === 'vino') {
    relojFuria = 10;
    avisar('FURIA DE DIONISO');
  } else return false;
  return true;
}

const panelDano = document.getElementById('dano');
let sacudida = 0;
let tempDestello = 0;

function destello(color, fuerza, ms) {
  clearTimeout(tempDestello);
  panelDano.style.background = color;
  panelDano.style.opacity = String(fuerza);
  tempDestello = setTimeout(() => {
    panelDano.style.opacity = '0';
    panelDano.style.background = '#8b0000';
  }, ms);
}
function golpeRecibido() {
  audio.sonar('dano');
  destello('#8b0000', 0.45, 110);
  sacudida = Math.max(sacudida, 0.5);
  if (jugador.vida <= 0) morir();
}

let muerto = false;

const menu = document.getElementById('menu');
const panel = document.getElementById('panel');
const hoja = panel.querySelector('.hoja');
const btnMenu = document.getElementById('alMenu');

const CONTROLES = [
  ['W A S D', 'Moverte por el palacio'],
  ['RATON', 'Mirar alrededor'],
  ['CLIC IZQUIERDO', 'Manten para tensar el arco, suelta para disparar. Mas tension, mas dano y alcance'],
  ['F', 'Golpe cuerpo a cuerpo. El cuchillo apuñala fuerte y no gasta; el hacha le pega a todos los de enfrente'],
  ['T', 'Lanzar. El cuchillo se pierde y gasta uno; el hacha atraviesa a todos y vuelve sola'],
  ['Z', 'Cambiar entre cuchillo y hacha (cuando tengas el hacha)'],
  ['R', 'Guante de Zeus: manten para cargar el rayo y suelta'],
  ['G', 'Hilo de Ariadna: te jalas a un muro, o jalas al enemigo hacia ti'],
  ['CLIC DERECHO', 'Portal azul (necesitas el Cuerno de Hermes)'],
  ['Q', 'Portal naranja'],
  ['1 2 3 4', 'Usar lo que llevas en el inventario'],
  ['SHIFT + 1 2 3 4', 'Soltar esa ranura para hacer sitio (tambien sirve para quitarte un arma)'],
  ['E', 'Abrir la tienda, solo entre rondas'],
  ['X', 'Ojo del cazador: manten X y apunta a hasta 5 enemigos, suelta y les disparas a todos'],
  ['B', 'Pico de Hefesto: rompes el muro al que apuntes y deja escombros'],
  ['C', 'Mano de Poseidon: agarra un escombro, y con C otra vez lo lanzas'],
  ['V', 'Cruzar al Otro Lado cuando la grieta se abre, entre rondas'],
  ['M', 'Silenciar y devolver el sonido'],
  ['ESC', 'Pausa']
];

function iconoDe(art, tipo) {
  let t = null;
  if (art.id === 'portales') t = recursos.cuerno && recursos.cuerno[1];
  else if (art.id === 'guante') t = recursos.guante && recursos.guante[2];
  else if (art.id === 'gancho') t = recursos.hilo && recursos.hilo[1];
  else if (art.id === 'pico') t = recursos.pico && recursos.pico[0];
  else if (art.id === 'manoP') t = recursos.mano && recursos.mano[2];
  else if (art.id === 'cazador') t = recursos.insignias && recursos.insignias[7];
  else if (art.hoja) t = recursos[art.hoja] && recursos[art.hoja][art.celda];
  else if (tipo === 'suelo') t = recursos.items && recursos.items[art.celda];
  else t = (recursos.tienda && recursos.tienda[art.celda]) ||
           (recursos.items && recursos.items[art.respaldo]);
  return t && t.image ? `background-image:url(${t.image.toDataURL()})` : '';
}

function abrirPanel(html) {
  hoja.innerHTML = html + '<button class="boton cerrar">CERRAR</button>';
  hoja.querySelector('.cerrar').addEventListener('click', () => panel.classList.remove('ver'));
  panel.classList.add('ver');
}

function panelControles() {
  const filas = CONTROLES
    .map(([k, d]) => `<tr><td class="tecla">${k}</td><td>${d}</td></tr>`)
    .join('');
  abrirPanel(`<h3>BOTONES</h3><table>${filas}</table>`);
}

function panelObjetos() {
  const fila = (art, tipo, extra) => `<tr>
      <td class="ico"><div style="${iconoDe(art, tipo)}"></div></td>
      <td class="nom">${art.nombre || art.aviso || art.id}</td>
      <td>${art.desc || descripcionSuelo(art)}</td>
      <td class="precio">${extra}</td></tr>`;

  const mejoras = MEJORAS.map(m => fila(m, 'tienda', m.precio + ' ORO')).join('');
  const consumibles = CONSUMIBLES.map(c => fila(c, 'tienda', c.precio + ' ORO')).join('');
  const suelo = CATALOGO.map(o => fila(o, 'suelo', 'DEL SUELO')).join('');

  abrirPanel(`<h3>OBJETOS</h3>
    <h4>MEJORAS — se compran una vez y son para siempre</h4><table>${mejoras}</table>
    <h4>CONSUMIBLES — se guardan en el inventario y se gastan</h4><table>${consumibles}</table>
    <h4>LO QUE CAE AL PISO — al limpiar cada ronda</h4><table>${suelo}</table>`);
}

function descripcionSuelo(o) {
  const t = o.efecto;
  if (t === 'cuchillos') return 'Suma ' + o.valor + ' cuchillos';
  if (t === 'vida') return 'Te cura ' + o.valor;
  if (t === 'armadura') return 'Suma ' + o.valor + ' de escudo';
  if (t === 'flechas') return 'Suma ' + o.valor + ' flechas';
  if (t === 'guarda') return 'Se guarda en el inventario';
  return 'Suma ' + o.valor + ' de oro';
}

let estilo = leer();

function panelEstilo() {
  const grupo = (titulo, lista, clave, extra) => `<h4>${titulo}</h4><div class="opciones" data-clave="${clave}">` +
    lista.map(o => `<div class="opcion${estilo[clave] === o.id ? ' puesta' : ''}" data-id="${o.id}">` +
      (extra ? `<span class="muestra" style="background:${extra(o)}"></span>` : '') +
      `${o.nombre}</div>`).join('') + '</div>';

  abrirPanel(`<h3>APARIENCIA</h3>
    ${grupo('COLOR DEL ARMA', TINTES, 'tinte', o => o.muestra)}
    ${grupo('COLOR DEL TABLERO', COLORES, 'color', o => o.valor)}
    ${grupo('MIRA', MIRAS, 'mira', null)}`);

  hoja.querySelectorAll('.opciones').forEach(caja => {
    caja.addEventListener('click', ev => {
      const op = ev.target.closest('.opcion');
      if (!op) return;
      estilo[caja.dataset.clave] = op.dataset.id;
      guardar(estilo);
      aplicar(estilo, arma);
      caja.querySelectorAll('.opcion').forEach(o => o.classList.toggle('puesta', o === op));
      audio.sonar('recoger');
    });
  });
}

function panelGloria() {
  const g = estadoGloria();
  const r = leerRecord();
  const gastado = g.comprados.reduce((a, id) => {
    const art = TODO_GLORIA.find(x => x.id === id);
    return a + (art ? art.precio : 0);
  }, 0);
  const disponible = (r.gloria || 0) - gastado;
  const objetosPuestos = g.activos.filter(id => OBJETOS_GLORIA.some(o => o.id === id)).length;

  const iconoGloria = art => {
    if (art.muestra) return `background:${art.muestra}`;
    if (art.icono) {
      const t = recursos[art.icono[0]] && recursos[art.icono[0]][art.icono[1]];
      if (t && t.image) return `background-image:url(${t.image.toDataURL()})`;
      return '';
    }
    const t = recursos.insignias && recursos.insignias[art.insignia];
    return t && t.image ? `background-image:url(${t.image.toDataURL()})` : '';
  };

  const fila = art => {
    const comprado = g.comprados.includes(art.id);
    const puesto = g.activos.includes(art.id);
    const esObjeto = OBJETOS_GLORIA.some(o => o.id === art.id);
    const tope = esObjeto && !puesto && objetosPuestos >= LIMITE_OBJETOS;
    let boton;
    if (!comprado) {
      boton = `<button class="accion" data-comprar="${art.id}" ${disponible < art.precio ? 'disabled' : ''}>${art.precio} GLORIA</button>`;
    } else {
      boton = `<button class="accion" data-poner="${art.id}" ${tope ? 'disabled' : ''}>${puesto ? 'QUITAR' : tope ? 'LLENO' : 'PONER'}</button>`;
    }
    return `<tr class="${comprado ? (puesto ? 'puesto' : '') : 'bloqueado'}">
      <td class="ico"><div style="${iconoGloria(art)}"></div></td>
      <td class="nom">${art.nombre}</td>
      <td>${art.desc || ''}</td>
      <td class="precio">${boton}</td></tr>`;
  };

  abrirPanel(`<h3>GLORIA</h3>
    <span class="bolsa">TE QUEDAN ${Math.max(0, disponible)} DE GLORIA</span>
    <h4>MODOS — cambian toda la partida</h4><table>${MODOS.map(fila).join('')}</table>
    <h4>ARMAS DESDE EL INICIO — puedes llevar ${LIMITE_OBJETOS} a la vez (${objetosPuestos}/${LIMITE_OBJETOS})</h4><table>${OBJETOS_GLORIA.map(fila).join('')}</table>
    <h4>EL MERCADER — para siempre</h4><table>${MEJORAS_MERCADER.map(fila).join('')}</table>
    <h4>APARIENCIA — se pone desde aqui</h4><table>${ESTILOS.map(fila).join('')}</table>`);

  hoja.querySelectorAll('[data-comprar]').forEach(b => {
    b.addEventListener('click', () => {
      const art = TODO_GLORIA.find(x => x.id === b.dataset.comprar);
      const d = estadoGloria();
      if (d.comprados.includes(art.id)) return;
      d.comprados.push(art.id);
      guardarGloria(d);
      audio.sonar('comprar');
      panelGloria();
    });
  });
  hoja.querySelectorAll('[data-poner]').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.poner;
      const art = TODO_GLORIA.find(x => x.id === id);
      const d = estadoGloria();
      const i = d.activos.indexOf(id);
      if (i >= 0) d.activos.splice(i, 1);
      else {
        if (art.grupo) {
          for (const otro of ESTILOS) {
            if (otro.grupo !== art.grupo) continue;
            const k = d.activos.indexOf(otro.id);
            if (k >= 0) d.activos.splice(k, 1);
          }
        }
        d.activos.push(id);
      }
      guardarGloria(d);
      if (art.grupo) {
        const e = leer();
        e[art.grupo] = d.activos.includes(id) ? art.valor
          : (art.grupo === 'tinte' ? 'bronce' : art.grupo === 'color' ? 'dorado' : 'cruz');
        guardar(e);
        aplicar(e, arma);
      }
      audio.sonar('recoger');
      panelGloria();
    });
  });
}

function panelComo() {
  const dib = (hoja, i) => {
    const t = recursos[hoja] && recursos[hoja][i];
    if (!t) return '';
    if (typeof t === 'string') return `background-image:url(${t})`;
    return t.image ? `background-image:url(${t.image.toDataURL()})` : '';
  };
  const carta = (estilo, nombre, texto, tecla, precio) => `
    <div class="tarjeta">
      <div class="dibujo" style="${estilo}"></div>
      <div class="texto"><b>${nombre}</b><span>${texto}</span>
        ${tecla ? `<em>${tecla}</em>` : ''}</div>
      ${precio ? `<div class="precio2">${precio}</div>` : ''}
    </div>`;
  const seccion = t => `<div class="seccion"><span>${t}</span><i></i></div>`;

  abrirPanel(`<h3>COMO JUGAR</h3><div class="guia">
    <p class="intro">Eres Odiseo y volviste a tu palacio.<br>
    Aguantas rondas de enemigos que no paran de venir.<br>
    En la <b>ronda 15</b> aparece Polifemo: si lo matas, ganaste.</p>

    ${seccion('CON LO QUE EMPIEZAS')}
    <div class="tarjetas">
      ${carta(dib('arco', 2), 'ARCO', 'Tu arma principal. Manten el clic para tensarlo: mientras mas cargues, mas dano y mas lejos llega.', 'CLIC IZQUIERDO')}
      ${carta(dib('cuchillo', 0), 'CUCHILLO', 'Apunala por 140 sin gastar nada. Lanzado hace 150, pero ese cuchillo se pierde. Empiezas con 8 y caen algunos en el piso.', 'F apunalar · T lanzar')}
    </div>

    ${seccion('ARMAS DEL MERCADER')}
    <div class="tarjetas">
      ${carta(dib('tajo', 0), 'HACHA DE LEVIATAN', 'Le pega a todos los que tengas enfrente. Lanzada, atraviesa a todos y vuelve sola a tu mano. Nunca se acaba.', 'F · T · Z para cambiar', '170')}
      ${carta(dib('cuerno', 1), 'CUERNO DE HERMES', 'Abre dos portales en los muros y se ve a traves de ellos. Los cruzan tus flechas, las lanzas enemigas y los propios enemigos.', 'CLIC DERECHO · Q', '200')}
      ${carta(dib('hilo', 1), 'HILO DE ARIADNA', 'Te jala hacia el muro al que apuntes, o jala al enemigo hacia ti y lo deja aturdido.', 'G', '210')}
      ${carta(dib('pico', 0), 'PICO DE HEFESTO', 'Rompe los muros del palacio y deja escombros. Seis picotazos por ronda.', 'B', '250')}
      ${carta(dib('mano', 1), 'MANO DE POSEIDON', 'Agarra un escombro y lo lanza por 120. Necesitas el Pico para que haya escombros.', 'C', '280')}
      ${carta(dib('guante', 2), 'GUANTE DE ZEUS', 'Manten R para cargar el rayo y sueltalo. Atraviesa a todos los que esten en linea.', 'R', '300')}
      ${carta(dib('insignias', 7), 'OJO DEL CAZADOR', 'Manten X y apunta a hasta 5 enemigos; al soltar les disparas a todos de golpe.', 'X', '320')}
    </div>

    ${seccion('RELIQUIAS DEL INVENTARIO')}
    <div class="tarjetas">
      ${carta(dib('reliquias', 0), 'MANZANA DE LA DISCORDIA', 'Los enemigos se atacan entre ellos 12 segundos y se pegan el doble.', '1 2 3 4')}
      ${carta(dib('reliquias', 6), 'ESPEJO DE PERSEO', 'Las lanzas rebotan y matan al que las tiro.', '1 2 3 4')}
      ${carta(dib('reliquias', 7), 'VELLOCINO DE ORO', 'Recuperas vida durante 15 segundos.', '1 2 3 4')}
      ${carta(dib('reliquias', 8), 'SANDALIAS ALADAS', 'Un impulso para salir de un cerco.', '1 2 3 4')}
      ${carta(dib('reliquias', 9), 'OJO DE LAS GREAS', 'Ves a todos a traves de los muros 20 segundos.', '1 2 3 4')}
      ${carta(dib('reliquias', 11), 'DRACMA DE CARONTE', 'Si mueres, revives una vez con media vida.', '1 2 3 4')}
    </div>

    ${seccion('LO QUE HAY QUE SABER')}
    <div class="nota"><b>ENTRE RONDAS</b>
    Al limpiar una ronda caen objetos y empieza la tregua. Pulsa <b>E</b> y sale
    el mercader: solo compras <b>una cosa por ronda</b>. Las armas son para
    siempre; las reliquias van al inventario. Si lo tienes lleno,
    <b>SHIFT + numero</b> suelta esa ranura.</div>

    <div class="nota"><b>ORO Y GLORIA</b>
    El oro se gana matando y se pierde al morir. La <b>gloria</b> nunca se pierde:
    se acumula partida tras partida, aunque pierdas, y se gasta en el menu
    principal en modos, armas de inicio y apariencia.</div>

    <div class="nota"><b>LA GRIETA</b>
    Cada 3 rondas se abre. Con <b>V</b> cruzas al Otro Lado: el mismo palacio en
    rojo, enemigos con casi el doble de vida pero <b>triple oro</b>. Dura una ronda.</div>

    <div class="nota"><b>CONSEJOS</b>
    No te quedes quieto: los pretendientes tiran lanzas desde lejos. Cubrete tras
    las columnas. Guarda un frasco para la ronda 10. Y si compras el Pico, rompe
    muros para hacerte atajos donde pelear con ventaja.</div>
  </div>`);
}

document.getElementById('verComo').addEventListener('click', panelComo);
document.getElementById('verGloria').addEventListener('click', panelGloria);
document.getElementById('verControles').addEventListener('click', panelControles);
document.getElementById('verObjetos').addEventListener('click', panelObjetos);
btnMenu.addEventListener('click', () => location.reload());
addEventListener('keydown', e => {
  if (e.code === 'Escape' && panel.classList.contains('ver')) panel.classList.remove('ver');
});

function pausar() {
  if (muerto) return;
  document.body.classList.add('enJuego');
  menu.querySelector('h1').textContent = 'PAUSA';
  menu.querySelector('h2').textContent = 'ITACA ESPERA';
  menu.querySelector('p').textContent = 'CLIC PARA CONTINUAR';
  btnMenu.hidden = false;
  if (audio.ctx) audio.callarMusica();
}

function gloriaDe(datos) {
  const base = datos.ronda * 12 + datos.bajas * 2 + (datos.gano ? 300 : 0);
  return modoActivo('pesadilla') ? base * 3 : base;
}

function ganar() {
  if (ganado) return;
  document.body.classList.add('enJuego');
  ganado = true;
  jefeActual = null;
  elJefe.classList.remove('ver');
  const datos = { ronda: rondas.numero, bajas: jugador.bajas, oro: jugador.oro, gano: true };
  datos.gloria = gloriaDe(datos);
  guardarRecord(datos);
  pintarMarca();
  destello('#e8c14a', 0.6, 900);
  sacudida = 1.4;
  audio.sonar('comprar');
  audio.callarMusica();
  jugador.activo = false;
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.classList.remove('jugando');
  menu.classList.remove('oculto');
  menu.querySelector('h1').textContent = 'VOLVISTE A ITACA';
  menu.querySelector('h2').textContent = 'POLIFEMO HA CAIDO';
  menu.querySelector('p').textContent =
    `RONDA ${datos.ronda} · ${datos.bajas} BAJAS · +${datos.gloria} GLORIA · CLIC PARA SEGUIR`;
  btnMenu.hidden = false;
}

function morir() {
  muerto = true;
  document.body.classList.add('enJuego');
  btnMenu.hidden = false;
  const datos = { ronda: rondas.numero, bajas: jugador.bajas, oro: jugador.oro, gano: false };
  datos.gloria = gloriaDe(datos);
  guardarRecord(datos);
  pintarMarca();
  audio.sonar('muerte');
  audio.callarMusica();
  if (tienda.abierta) tienda.cerrar();
  jugador.activo = false;
  jugador.libre = false;
  if (document.pointerLockElement) document.exitPointerLock();
  menu.classList.remove('oculto');
  menu.querySelector('h1').textContent = 'HAS MUERTO';
  menu.querySelector('h2').textContent = 'ITACA SIGUE ESPERANDO';
  const r = leerRecord();
  menu.querySelector('p').textContent =
    `RONDA ${rondas.numero} · ${jugador.bajas} BAJAS · MEJOR: RONDA ${r.ronda || 0}`;
}

function reiniciar() {
  muerto = false;
  jugador.vida = 100;
  jugador.flechas = 40;
  jugador.bajas = 0;
  jugador.tension = 0;
  jugador.tensando = false;
  jugador.pos.copy(nivel.spawns.jugador);
  jugador.vel.set(0, 0, 0);
  jugador.vidaMax = 100;
  jugador.armadura = 0;
  jugador.armaduraMax = 100;
  jugador.flechasMax = 60;
  jugador.oro = 0;
  jugador.doble = false;
  jugador.pistola = false;
  jugador.guante = false;
  jugador.gancho = false;
  jugador.hacha = false;
  jugador.mano = 'cuchillo';
  jugador.cuchillos = 8;
  jugador.pico = false;
  jugador.manoP = false;
  jugador.rayo = jugador.rayoMax;
  sacudida = 0;
  cargado = null;
  jugador.cazador = false;
  limpiarMarcas();
  for (const e of escombros) escena.remove(e.malla);
  escombros.length = 0;
  jugador.mult = { tension: 1, dano: 1, velocidad: 1, velFlecha: 1 };
  jugador.inventario.length = 0;
  relojFuria = 0;
  dracma = false;
  for (const k in efectos) efectos[k] = 0;
  limpiarMundo();
  portales.limpiar();
  rondas.reiniciar();
  tienda.reiniciar();
  director.reiniciar();
  grietaLista = false;
  quemando = 0;
  if (cerco) cerco.apagar();
  ganado = false;
  jefeActual = null;
  elJefe.classList.remove('ver');
  if (otroLado.dentro) otroLado.salir();
  menu.querySelector('h1').textContent = 'NOSTOS';
  menu.querySelector('h2').textContent = 'EL REGRESO';
  menu.querySelector('p').textContent = 'CLIC PARA EMPEZAR';
  document.body.classList.remove('enJuego');
}

lienzo.addEventListener('click', e => {
  if (e.target && e.target.closest && e.target.closest('#botonera, #panel, #tienda')) return;
  if (!muerto && jugador && jugador.empezado && !jugador.activo) {
    menu.querySelector('h1').textContent = 'NOSTOS';
    menu.querySelector('h2').textContent = 'EL REGRESO';
    menu.querySelector('p').textContent = 'CLIC PARA EMPEZAR';
  }
}, true);

lienzo.addEventListener('click', () => {
  audio.arrancar();
  if (muerto) reiniciar();
}, true);

addEventListener('keydown', e => {
  if (e.code === 'KeyM') avisar(audio.mudo() ? 'SILENCIO' : 'SONIDO');
  if (e.code === 'KeyV' && grietaLista && jugador && jugador.activo &&
      rondas && rondas.estado === 'descanso') {
    grietaLista = false;
    otroLado.entrar();
    audio.sonar('cruzar');
    destello('#c0304a', 0.7, 500);
    sacudida = 1.2;
    anunciar('EL OTRO LADO', 'MAS DUROS, TRIPLE ORO');
  }
});

function moverFlechas(dt) {
  for (let i = flechas.length - 1; i >= 0; i--) {
    const f = flechas[i];
    f.edad += dt;
    f.vel.y -= 11 * dt;
    const previa = f.malla.position.clone();
    f.malla.position.addScaledVector(f.vel, dt);
    if (portales && portales.atravesar(previa, f.malla.position, f.vel)) {
      f.saltos = (f.saltos || 0) + 1;
      if (f.saltos > 6) { escena.remove(f.malla); flechas.splice(i, 1); continue; }
    }
    f.malla.lookAt(f.malla.position.clone().add(f.vel));

    let fuera = f.edad > 4 || f.malla.position.y < 0.1 || f.malla.position.y > 12;
    if (!fuera) {
      const cx = Math.floor(f.malla.position.x / CELDA);
      const cz = Math.floor(f.malla.position.z / CELDA);
      const fila = nivel.rejilla[cz];
      if (!fila || '#CTR'.includes(fila[cx] || '#')) fuera = true;
    }
    if (!fuera) {
      for (const e of enemigos) {
        if (!e.vivo) continue;
        const dx = e.pos.x - f.malla.position.x;
        const dz = e.pos.z - f.malla.position.z;
        const dy = f.malla.position.y - 1;
        if (dx * dx + dz * dz < 3.2 && dy > 0 && dy < 7) {
          audio.sonar('carne', e.pos);
          if (e.recibir(f.dano)) marcarBaja();
          jugador.flechas = Math.min(jugador.flechasMax, jugador.flechas + 2);
          fuera = true;
          break;
        }
      }
    }
    if (fuera) {
      if (!f.chocada && f.edad < 3.9) audio.sonar('piedra', f.malla.position);
      escena.remove(f.malla);
      flechas.splice(i, 1);
    }
  }
}

const elVida = document.getElementById('vida');
const elFlechas = document.getElementById('flechas');
const elBajas = document.getElementById('bajas');
const elCara = document.getElementById('cara');
const elOro = document.getElementById('oro');
const elArmadura = document.getElementById('armadura');
const elRayo = document.getElementById('rayo');
const elCuchillos = document.getElementById('cuchillos');
const cajaRayo = document.getElementById('cRayo');
const elRonda = document.getElementById('ronda');
const elVivos = document.getElementById('vivos');
let minimapa = null;
const marcas = new Marcas(document.getElementById('marcas'));

function pintarHud() {
  elVida.textContent = jugador.vida;
  elFlechas.textContent = jugador.flechas;
  elBajas.textContent = jugador.bajas;
  elOro.textContent = jugador.oro;
  elArmadura.textContent = Math.round(jugador.armadura);
  pintarEfectos();
  cajaRayo.classList.toggle('ver', jugador.guante);
  if (jugador.guante) elRayo.textContent = Math.round(jugador.rayo);
  elCuchillos.textContent = jugador.cuchillos;
  elRonda.textContent = rondas ? rondas.numero : 0;
  if (jefeActual && jefeActual.vivo) {
    elJefe.classList.add('ver');
    rellenoJefe.style.width = Math.max(0, (jefeActual.vida / jefeActual.vidaMax) * 100) + '%';
  } else if (elJefe.classList.contains('ver')) {
    elJefe.classList.remove('ver');
  }
  elVivos.textContent = enemigos.filter(e => e.vivo).length;
  pintarRanuras();
  const salud = jugador.vida / jugador.vidaMax;
  if (imagenesCara.length === 5) {
    const cara = salud > 0.8 ? 0 : salud > 0.6 ? 1 : salud > 0.4 ? 2 : salud > 0.2 ? 3 : 4;
    if (elCara.dataset.cara !== String(cara)) {
      elCara.dataset.cara = String(cara);
      elCara.style.backgroundImage = `url(${imagenesCara[cara]})`;
    }
  } else {
    elCara.style.background = salud > 0.66 ? '#3a2a18' : salud > 0.33 ? '#4a2410' : '#5a1410';
  }
  let clave, url;
  if (picoReloj > 0 && imagenesPico.length) {
    clave = 'p' + picoCuadro;
    url = imagenesPico[picoCuadro];
  } else if ((manoReloj > 0 || cargado) && imagenesMano.length) {
    const c = cargado ? 1 : manoCuadro;
    clave = 'm' + c;
    url = imagenesMano[c];
  } else if (jabalinaReloj > 0 && imagenesJabalina.length) {
    clave = 'j' + jabalinaCuadro;
    url = imagenesJabalina[jabalinaCuadro];
  } else if (hiloReloj > 0 && imagenesHilo.length) {
    clave = 'h' + hiloCuadro;
    url = imagenesHilo[hiloCuadro];
  } else if (jugador.cargandoRayo && imagenesGuante.length) {
    clave = 'g1';
    url = imagenesGuante[1];
  } else if (guanteReloj > 0 && imagenesGuante.length) {
    clave = 'g' + destelloGuante;
    url = imagenesGuante[destelloGuante];
  } else if (vueloReloj > 0 && imagenesVuelo.length) {
    clave = 'v' + vueloCuadro;
    url = imagenesVuelo[vueloCuadro];
  } else if (jugador.hachaFuera && imagenManoVacia) {
    clave = 'vacia';
    url = imagenManoVacia;
  } else if (cuchilloReloj > 0 && imagenesCuchillo.length) {
    clave = 'k' + cuchilloCuadro;
    url = imagenesCuchillo[cuchilloCuadro];
  } else if (espadaReloj > 0 && imagenesTajo.length) {
    const paso = Math.min(0.999, (0.42 - espadaReloj) / 0.42);
    const c = Math.floor(paso * 4);
    clave = 'w' + c;
    url = imagenesTajo[c];
  } else if (cuernoReloj > 0 && imagenesCuerno.length) {
    clave = 'c' + cuernoCuadro;
    url = imagenesCuerno[cuernoCuadro];
  } else {
    const cuadro = jugador.tension > 0.66 ? 2 : jugador.tension > 0.05 ? 1 : 0;
    clave = 'a' + cuadro;
    url = recursos.arco[cuadro] || arcoRespaldo[cuadro];
  }
  if (arma.dataset.cuadro !== clave) {
    arma.dataset.cuadro = clave;
    arma.style.backgroundImage = `url(${url})`;
  }
}

const elEfectos = document.getElementById('efectos');
const NOMBRE_EFECTO = {
  espejo: 'ESPEJO', vellocino: 'VELLOCINO', ojo: 'OJO',
  furia: 'FURIA', invisible: 'INVISIBLE'
};

function pintarEfectos() {
  const vivos = [];
  for (const k in efectos) {
    if (efectos[k] > 0) vivos.push([NOMBRE_EFECTO[k] || k.toUpperCase(), efectos[k]]);
  }
  if (relojFuria > 0) vivos.push(['FURIA', relojFuria]);
  if (!vivos.length) {
    if (elEfectos.childElementCount) elEfectos.innerHTML = '';
    return;
  }
  elEfectos.innerHTML = vivos
    .map(([n, t]) => `<div class="efecto"><b>${n}</b><u>${Math.ceil(t)}</u></div>`)
    .join('');
}

const elRanuras = document.getElementById('ranuras');
let firmaInv = '';

function pintarRanuras() {
  const firma = jugador.inventario.map(o => o.id + (o.infinito ? 'inf' : o.cantidad)).join('|');
  if (firma === firmaInv) return;
  firmaInv = firma;
  elRanuras.innerHTML = '';
  jugador.inventario.forEach((casilla, i) => {
    const art = porId(casilla.id);
    let t;
    if (casilla.id === 'portales') t = recursos.cuerno && recursos.cuerno[1];
    else if (casilla.id === 'guante') t = recursos.guante && recursos.guante[2];
    else if (casilla.id === 'gancho') t = recursos.hilo && recursos.hilo[1];
    else if (casilla.id === 'pico') t = recursos.pico && recursos.pico[0];
    else if (casilla.id === 'manoP') t = recursos.mano && recursos.mano[2];
    else if (casilla.id === 'jabalina') t = recursos.jabalina && recursos.jabalina[1];
    else if (art.hoja) t = recursos[art.hoja] && recursos[art.hoja][art.celda];
    else t = (recursos.tienda && recursos.tienda[art.celda]) ||
             (recursos.items && recursos.items[art.respaldo]);
    const d = document.createElement('div');
    d.className = 'ranura' + (casilla.infinito ? ' eterna' : '');
    if (t && t.image) d.style.backgroundImage = `url(${t.image.toDataURL()})`;
    d.innerHTML = `<i>${i + 1}</i><u>${casilla.infinito ? '&#8734;' : casilla.cantidad}</u>`;
    elRanuras.appendChild(d);
  });
}

function medir() {
  const w = Math.max(320, Math.floor(innerWidth / ESCALA_RETRO));
  const h = Math.max(200, Math.floor(innerHeight / ESCALA_RETRO));
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
  marcas.medir();
}
addEventListener('resize', medir);
medir();

let centro = new THREE.Vector3();
let anguloMenu = 0;

function orbitar(dt) {
  anguloMenu += dt * 0.09;
  const radio = 22;
  camara.position.set(
    centro.x + Math.cos(anguloMenu) * radio,
    3.6 + Math.sin(anguloMenu * 1.7) * 0.5,
    centro.z + Math.sin(anguloMenu) * radio
  );
  camara.lookAt(centro.x, 3.2, centro.z);
}

const reloj = new THREE.Clock();

function paso(dt) {
  if (jugador.activo) {
    jugador.actualizar(dt);
    flujo.actualizar(dt, jugador.pos, portales.enlaces);
    portales.actualizar(dt, camara);
    if (portales.cruzar(jugador)) {
      audio.sonar('cruzar');
      jugador.actualizar(0);
      const c = portales.ultimoColor || new THREE.Color(0x3fa9ff);
      destello(`rgb(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0})`, 0.55, 260);
      sacudida = 0.9;
    }
    moverFlechas(dt);
    moverJabalinas(dt);
    moverHacha(dt);
    moverEscombros(dt);
    moverTiron(dt);
    actualizarMarcas();
    moverAnillos();
    if (hachaReloj > 0) hachaReloj -= dt;
    if (vueloReloj > 0) vueloReloj -= dt;
    if (cuchilloReloj > 0) {
      cuchilloReloj -= dt;
      if (cuchilloCuadro === 1 && cuchilloReloj < 0.13) cuchilloCuadro = 0;
      if (cuchilloCuadro === 2 && cuchilloReloj < 0.2) cuchilloCuadro = 3;
    }
    if (empuje > 0) empuje = Math.max(0, empuje - dt * 5.5);
    if (picoReloj > 0) { picoReloj -= dt; if (picoReloj < 0.25) picoCuadro = 3; }
    if (manoReloj > 0) manoReloj -= dt;
    for (const e of enemigos) {
      e.actualizar(dt, jugador, camara);
      const verTodo = efectos.ojo > 0;
      if (e.sprite.material.depthTest === verTodo) {
        e.sprite.material.depthTest = !verTodo;
        e.sprite.material.needsUpdate = true;
      }
    }
    for (let i = objetos.length - 1; i >= 0; i--) {
      if (objetos[i].actualizar(dt, jugador, camara)) {
        audio.sonar('recoger');
        avisar(objetos[i].tipo.aviso);
        escena.remove(objetos[i].malla);
        objetos.splice(i, 1);
      }
    }
    if (relojFuria > 0) relojFuria -= dt;
    otroLado.actualizar(dt);
    cerco.actualizar(dt, camara);
    if (cerco.fuera(jugador.pos)) {
      quemando += dt;
      if (quemando > 0.5) {
        quemando = 0;
        jugador.recibir(9);
        destello('#c25a10', 0.35, 120);
      }
    }
    director.actualizar(dt, jugador);
    if (director.pideSocorro(jugador)) {
      const libres = celdasLibres();
      const cerca = libres
        .map(p => ({ p, d: Math.hypot(p.x - jugador.pos.x, p.z - jugador.pos.z) }))
        .filter(o => o.d > 8 && o.d < 34)
        .sort((a, b) => a.d - b.d)[0];
      if (cerca && recursos.items.length) {
        const tipo = CATALOGO[7];
        const o = new Objeto(tipo, recursos.items[tipo.celda], cerca.p);
        escena.add(o.malla);
        objetos.push(o);
        avisar('ALGUIEN DEJO AMBROSIA CERCA');
      }
    }
    for (const k in efectos) if (efectos[k] > 0) efectos[k] -= dt;
    if (efectos.vellocino > 0) {
      jugador.vida = Math.min(jugador.vidaMax, jugador.vida + dt * 7);
    }
    audio.oir(jugador.pos, jugador.yaw);
    if (jugador.tensando && !tensabaAntes) { audio.sonar('tensar'); avisoTenso = false; }
    if (jugador.tension >= 1 && !avisoTenso) { audio.sonar('tenso'); avisoTenso = true; }
    if (!jugador.tensando) avisoTenso = false;
    tensabaAntes = jugador.tensando;
    audio.musica(rondas.numero);
    if (cuernoReloj > 0) cuernoReloj -= dt;
    if (espadaReloj > 0) espadaReloj -= dt;
    if (guanteReloj > 0) {
      guanteReloj -= dt;
      if (guanteReloj < 0.2) destelloGuante = 3;
    }
    if (jabalinaReloj > 0) {
      jabalinaReloj -= dt;
      jabalinaCuadro = jabalinaReloj > 0.44 ? 1 : jabalinaReloj > 0.30 ? 2 : 3;
    }
    if (hiloReloj > 0) {
      hiloReloj -= dt;
      hiloCuadro = hiloReloj < 0.28 ? 3 : 2;
    }
    if (cuerdaReloj > 0) {
      cuerdaReloj -= dt;
      if (cuerdaReloj <= 0 && mallaCuerda) mallaCuerda.visible = false;
    }
    if (rayoReloj > 0) {
      rayoReloj -= dt;
      if (rayoReloj <= 0 && mallaRayo) mallaRayo.visible = false;
      else if (mallaRayo) mallaRayo.material.opacity = 0.35 + Math.random() * 0.6;
    }
    rondas.actualizar(dt, enemigos, jugador);
  } else {
    orbitar(dt);
    for (const e of enemigos) e.sprite.encarar(camara, e.rumbo);
  }

  if (sacudida > 0) {
    sacudida = Math.max(0, sacudida - dt * 3.2);
    const f = sacudida * sacudida;
    camara.position.x += (Math.random() - 0.5) * f * 1.4;
    camara.position.y += (Math.random() - 0.5) * f * 1.1;
    camara.position.z += (Math.random() - 0.5) * f * 1.4;
  }
  antorcha.position.copy(camara.position);
  antorcha.intensity = 62 + Math.sin(performance.now() * 0.011) * 7;
  const balanceo = Math.sin(jugador.balanceo * 0.5) * 8;
  const golpe = Math.sin(empuje * Math.PI) ;
  arma.style.transform =
    `translateX(calc(-50% + ${balanceo * 1.5}px)) ` +
    `translateY(calc(${Math.abs(balanceo) * 1.1}px - ${jugador.tension * 8}vh - ${golpe * 9}vh)) ` +
    `scale(${1 + golpe * 0.22})`;

  if (portales) portales.pintarVistas(camara);
  pintarHud();
  if (minimapa) {
    minimapa.dibujar(dt, jugador, enemigos, objetos);
    if (jugador.activo) marcas.dibujar(jugador, enemigos);
    else marcas.ctx.clearRect(0, 0, marcas.lienzo.width, marcas.lienzo.height);
  }
  renderer.render(escena, camara);
}

function bucle() {
  requestAnimationFrame(bucle);
  paso(Math.min(0.05, reloj.getDelta()));
}

cargarArte().then(() => {
  nivel = construir(NIVEL_PRUEBA, texturasNivel);
  escena.add(nivel.grupo);
  jugador = new Jugador(camara, nivel, lienzo);
  jugador.alDisparar = modoActivo('sinArco') ? () => {} : disparar;
  jugador.alVacio = () => audio.sonar('vacio');
  jugador.alTajo = tajo;
  jugador.alCambiar = m => { cuchilloReloj = 0; espadaReloj = 0; vueloReloj = 0; audio.sonar('recoger'); avisar(m === 'hacha' ? 'HACHA' : 'CUCHILLO'); };
  jugador.alRayo = lanzarRayo;
  jugador.alGancho = engancharse;
  jugador.alLanzarHacha = lanzarHacha;
  jugador.alPicar = picar;
  jugador.alAgarrar = agarrar;
  jugador.alMarcar = marcar;
  jugador.alSoltarMarcas = soltarMarcas;
  jugador.alPausar = () => { if (jugador.empezado && !muerto) pausar(); };
  jugador.alRecibir = golpeRecibido;
  jugador.alUsar = usarConsumible;
  jugador.alSoltar = id => {
    const armas = { portales: 'pistola', guante: 'guante', gancho: 'gancho', pico: 'pico', manoP: 'manoP' };
    if (armas[id]) jugador[armas[id]] = false;
    audio.sonar('vacio');
    avisar('SOLTASTE ' + (porId(id) ? porId(id).nombre : id.toUpperCase()));
  };
  jugador.alPortal = color => {
    const origen = camara.position.clone();
    const salida = portales.disparar(color, origen, jugador.direccion());
    if (salida === 'ok') {
      audio.sonar(color === 'azul' ? 'portalAzul' : 'portalNaranja');
      cuernoCuadro = color === 'azul' ? 1 : 2;
      cuernoReloj = 0.55;
    } else if (salida === 'encimado') {
      avisar('APUNTA A OTRO MURO, SE ENCIMAN');
    } else {
      avisar('SIN MURO A LA VISTA');
    }
  };
  jugador.alComerciar = () => {
    if (muerto || tienda.abierta) return;
    if (rondas.estado !== 'descanso') { avisar('NO HAY TREGUA AHORA'); return; }
    tienda.abrir();
  };
  centro.set(nivel.ancho * CELDA / 2, 0, nivel.alto * CELDA / 2);
  pintarMarca();
  tienda = new Tienda({
    jugador,
    iconos: recursos,
    mercader: recursos.mercader,
    cuantos: modoActivo('oferta5') ? 5 : 4,
    descuento: modoActivo('descuento') ? 0.85 : 1,
    alCerrar: () => { if (!muerto) jugador._entrar(); },
    alComprar: art => { audio.sonar('comprar'); avisar(art.nombre); },
    alFallar: texto => { audio.sonar('vacio'); avisar(texto); }
  });
  for (const o of OBJETOS_GLORIA) {
    if (modoActivo(o.id)) {
      jugador[o.arma] = true;
      if (o.arma !== 'cazador') jugador.guardar(o.arma === 'manoP' ? 'manoP' : o.arma, 1, true);
    }
  }
  if (modoActivo('otroladoFijo')) otroLado.entrar();
  if (modoActivo('salto')) jugador.oro = 300;
  if (modoActivo('sinArco')) jugador.flechas = 0;
  if (modoActivo('ranura')) jugador.ranuras = 5;

  rondas = new Rondas({
    puntos: nivel.spawns.enemigos,
    crear: nacer,
    soltar: cerrarRonda,
    anunciar,
    bloqueado: () => tienda.abierta,
    ajustar: p => director.ajustar(p),
    alEmpezar: n => {
      director.empiezaRonda();
      jugador.picos = 6;
      if (modoActivo('cerco') && n % 5 === 0 && !rondas.ultimoPerfil.jefe && cerco.encender()) {
        anunciar('EL CERCO DE TROYA', 'EL FUEGO TE EMPUJA AL CENTRO');
      }
    }
  });
  flujo = new Flujo(nivel);
  otroLado = new OtroLado({ escena, nivel, antorcha, ambiente, cenit });
  cerco = new Cerco(escena, nivel, recursos.fuego);
  portales = new Portales(escena, nivel, renderer);
  portales.antorcha = antorcha;
  minimapa = new Minimapa(document.getElementById('mapa'), nivel);
  const marcaFlechas = recursos.items && recursos.items[0];
  if (marcaFlechas && marcaFlechas.image) {
    document.getElementById('dibFlechas').style.backgroundImage =
      `url(${marcaFlechas.image.toDataURL()})`;
  }
  if (recursos.cuchillo && recursos.cuchillo[0] && recursos.cuchillo[0].image) {
    document.getElementById('dibCuchillos').style.backgroundImage =
      `url(${recursos.cuchillo[0].image.toDataURL()})`;
  }
  orbitar(0);
  if (modoActivo('salto')) rondas.numero = 4;
  if (modoActivo('pesadilla')) director.presion = 1.45;

  window.__juego = { jugador, enemigos, objetos, escena, camara, nivel, flechas, rondas, tienda, portales, audio, otroLado, director, cerco, paso, abrirGrieta: () => { grietaLista = true; } };
  bucle();
});
