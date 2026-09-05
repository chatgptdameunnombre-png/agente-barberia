import * as THREE from 'three';
import { NIVEL_PRUEBA, construir, CELDA } from './mapa.js?v=20260905152721';
import { Jugador } from './jugador.js?v=20260905152721';
import { Enemigo, TIPOS } from './enemigos.js?v=20260905152721';
import { cortarTira, cortarRejilla, cargarImagen, recorteEntero } from './sprites.js?v=20260905152721';
import { Objeto, CATALOGO } from './objetos.js?v=20260905152721';
import { Rondas } from './rondas.js?v=20260905152721';
import { Tienda, porId, MEJORAS, CONSUMIBLES } from './tienda.js?v=20260905152721';
import { RELIQUIAS, porReliquia } from './reliquias.js?v=20260905152721';
import { Minimapa, Marcas } from './minimapa.js?v=20260905152721';
import { Flujo } from './flujo.js?v=20260905152721';
import { Portales, trazar } from './portales.js?v=20260905152721';
import { Audio } from './audio.js?v=20260905152721';
import { siluetaCiclope } from './texturas.js?v=20260905152721';

const ESCALA_RETRO = 3.2;
const lienzo = document.getElementById('lienzo');

const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x0a0705);
escena.fog = new THREE.Fog(0x120c08, 18, 95);

const camara = new THREE.PerspectiveCamera(78, 1, 0.1, 400);

escena.add(new THREE.AmbientLight(0x8a7658, 2.4));
const antorcha = new THREE.PointLight(0xffc078, 70, 60, 1.5);
escena.add(antorcha);
const cenit = new THREE.DirectionalLight(0xbfd0e4, 0.75);
cenit.position.set(0.4, 1, 0.25);
escena.add(cenit);

let nivel = null;
let jugador = null;

const arma = document.createElement('div');
Object.assign(arma.style, {
  position: 'fixed', left: '50%', bottom: '-30vh', width: '100vw', height: '96vh',
  transform: 'translateX(-50%)', pointerEvents: 'none',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom',
  backgroundSize: 'auto 96vh', imageRendering: 'pixelated', zIndex: '4'
});
document.getElementById('capa').appendChild(arma);

const recursos = { arco: [], items: [], tienda: [], cuerno: [], espada: [], guante: [], reliquias: [], mercader: null, ciclope: null, pretendiente: null };

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
let imagenesEspada = [];
let espadaReloj = 0;
let imagenesGuante = [];
let rayoReloj = 0;
let cuernoReloj = 0;
let cuernoCuadro = 1;
let guanteReloj = 0;
let destelloGuante = 0;

let texturasNivel = null;

async function cargarArte() {
  const [idle, atk, die, bow, muros, cosas, mercancia, pIdle, pAtk, pDie, horn, viejo, rostros, hoja, mano, reliquias] = await Promise.all([
    cargarImagen('./arte/crudo/ciclope.png?v=20260905152721'),
    cargarImagen('./arte/crudo/ciclope-ataca.png?v=20260905152721'),
    cargarImagen('./arte/crudo/ciclope-muere.png?v=20260905152721'),
    cargarImagen('./arte/crudo/arco.png?v=20260905152721'),
    cargarImagen('./arte/crudo/texturas.png?v=20260905152721'),
    cargarImagen('./arte/crudo/items.png?v=20260905152721'),
    cargarImagen('./arte/crudo/tienda.png?v=20260905152721'),
    cargarImagen('./arte/crudo/pretendiente.png?v=20260905152721'),
    cargarImagen('./arte/crudo/pretendiente-ataca.png?v=20260905152721'),
    cargarImagen('./arte/crudo/pretendiente-muere.png?v=20260905152721'),
    cargarImagen('./arte/crudo/cuerno.png?v=20260905152721'),
    cargarImagen('./arte/crudo/mercader.png?v=20260905152721'),
    cargarImagen('./arte/crudo/caras.png?v=20260905152721'),
    cargarImagen('./arte/crudo/espada.png?v=20260905152721'),
    cargarImagen('./arte/crudo/guante.png?v=20260905152721'),
    cargarImagen('./arte/crudo/objetos2.png?v=20260905152721')
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
  if (reliquias) recursos.reliquias = cortarRejilla(reliquias, 4, 3, { margen: 0.02, transparente: true });
  if (mano) {
    recursos.guante = cortarTira(mano, 4, { ajustar: true, altoComun: true });
    imagenesGuante = recursos.guante.map(t => t.image.toDataURL());
  }
  if (hoja) {
    recursos.espada = cortarTira(hoja, 4, { ajustar: true, altoComun: true });
    imagenesEspada = recursos.espada.map(t => t.image.toDataURL());
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
  if (!hoja) partes.push('espada.png');
  if (!mano) partes.push('guante.png');
  if (!reliquias) partes.push('objetos2.png');
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
const audio = new Audio();
let tensabaAntes = false;
let avisoTenso = false;

function elegirTipo(indice) {
  if (!recursos.pretendiente) return TIPOS.ciclope;
  const n = rondas.numero;
  if (n < 3) return TIPOS.ciclope;
  const cada = n >= 6 ? 2 : 3;
  return indice % cada === 0 ? TIPOS.pretendiente : TIPOS.ciclope;
}

let contadorNacidos = 0;

function acomodar(pos) {
  const cx = Math.floor(pos.x / CELDA);
  const cz = Math.floor(pos.z / CELDA);
  const fila = nivel.rejilla[cz];
  if (!fila || '#CTRF'.includes(fila[cx] || '#')) {
    return new THREE.Vector3(pos.x, 0, pos.z);
  }
  const centroX = cx * CELDA + CELDA / 2;
  const centroZ = cz * CELDA + CELDA / 2;
  const mezcla = 0.55;
  return new THREE.Vector3(
    pos.x + (centroX - pos.x) * mezcla, 0,
    pos.z + (centroZ - pos.z) * mezcla
  );
}

function nacer(pos, cfg) {
  const tipo = elegirTipo(contadorNacidos++);
  const e = new Enemigo(acomodar(pos), recursos[tipo.arte] || recursos.ciclope, nivel, { ...cfg, tipo, flujo, portales });
  e.alGolpear = d => jugador.recibir(d);
  e.alTirar = tirarJabalina;
  e.alRugir = (en, atacando) => audio.sonar(atacando ? (en.tipo.distancia ? 'lanza' : 'garrote') : 'rugido', en.pos);
  e.alMorir = en => audio.sonar('muereEnemigo', en.pos);
  escena.add(e.malla);
  enemigos.push(e);
}

const jabalinas = [];
const geoJabalina = new THREE.CylinderGeometry(0.11, 0.11, 3.2, 5);
geoJabalina.rotateX(Math.PI / 2);
const matJabalina = new THREE.MeshBasicMaterial({ color: 0xb87333 });

function tirarJabalina(enemigo, dano) {
  const origen = enemigo.pos.clone();
  origen.y = 2.6;
  const dir = new THREE.Vector3(
    jugador.pos.x - origen.x, 3.0 - origen.y, jugador.pos.z - origen.z
  ).normalize();
  const m = new THREE.Mesh(geoJabalina, matJabalina);
  m.position.copy(origen);
  escena.add(m);
  jabalinas.push({ malla: m, vel: dir.multiplyScalar(30), dano, edad: 0 });
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
    if (!fuera) {
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
  const menu = [0, 1, 3, 4, 5, 6, 7, 8, 9];
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
  jugador.oro += 20 + rondas.numero * 3;
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
  lanzarFlecha(fuerza, dir);
  if (jugador.doble) lanzarFlecha(fuerza, dir, 0.045);
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

const ALCANCE_TAJO = 7.5;
const DANO_TAJO = 85;

function tajo() {
  espadaReloj = 0.42;
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
    if (e.recibir(DANO_TAJO * jugador.mult.dano * furia())) marcarBaja();
    tocados++;
  }
  if (!tocados) audio.sonar('fallo');
}

let relojFuria = 0;
function furia() { return relojFuria > 0 ? 2 : 1; }

const efectos = { espejo: 0, vellocino: 0, ojo: 0, invisible: 0 };
let dracma = false;
const piedras = [];
const geoPiedra = new THREE.SphereGeometry(1.7, 10, 8);
const matPiedra = new THREE.MeshLambertMaterial({ color: 0x8a8578 });

function cercanos(radio) {
  return enemigos.filter(e => e.vivo &&
    Math.hypot(e.pos.x - jugador.pos.x, e.pos.z - jugador.pos.z) < radio);
}

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
  } else if (id === 'casco') {
    efectos.invisible = 8;
    jugador.invisible = true;
    avisar('INVISIBLE');
  } else if (id === 'medusa') {
    const dir = jugador.direccion();
    let n = 0;
    for (const e of cercanos(40)) {
      const dx = jugador.pos.x - e.pos.x;
      const dz = jugador.pos.z - e.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      const mirando = (dx / d) * Math.sin(e.rumbo) + (dz / d) * Math.cos(e.rumbo);
      if (mirando > -0.2) { e.paralizado = 7; n++; }
    }
    if (!n) return false;
    avisar('PETRIFICADOS: ' + n);
  } else if (id === 'cadenas') {
    const cerca = cercanos(22);
    if (!cerca.length) return false;
    for (const e of cerca) e.paralizado = 9;
    avisar('CLAVADOS: ' + cerca.length);
  } else if (id === 'anfora') {
    const cerca = cercanos(26);
    if (!cerca.length) return false;
    for (const e of cerca) {
      const dx = e.pos.x - jugador.pos.x;
      const dz = e.pos.z - jugador.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      const ux = dx / d, uz = dz / d;
      for (let i = 0; i < 18; i++) {
        const nx = e.pos.x + ux * 1.3;
        const nz = e.pos.z + uz * 1.3;
        let movio = false;
        if (e._libre(nx, e.pos.z)) { e.pos.x = nx; movio = true; }
        if (e._libre(e.pos.x, nz)) { e.pos.z = nz; movio = true; }
        if (!movio) break;
      }
      e.paralizado = 1.6;
    }
    avisar('VIENTO DE EOLO');
  } else if (id === 'lira') {
    const cerca = cercanos(30);
    if (!cerca.length) return false;
    for (const e of cerca) e.paralizado = 8;
    avisar('DORMIDOS: ' + cerca.length);
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
  } else if (id === 'piedra') {
    const dir = jugador.direccion();
    const m = new THREE.Mesh(geoPiedra, matPiedra);
    m.position.set(jugador.pos.x + dir.x * 3, 1.7, jugador.pos.z + dir.z * 3);
    escena.add(m);
    piedras.push({ malla: m, dir: { x: dir.x, z: dir.z }, edad: 0, tocados: new Set() });
    avisar('PIEDRA DE SISIFO');
  } else if (id === 'dracma') {
    if (dracma) return false;
    dracma = true;
    avisar('CARONTE TE ESPERA');
  } else return null;
  audio.sonar('recoger');
  return true;
}

function moverPiedras(dt) {
  for (let i = piedras.length - 1; i >= 0; i--) {
    const p = piedras[i];
    p.edad += dt;
    const nx = p.malla.position.x + p.dir.x * 26 * dt;
    const nz = p.malla.position.z + p.dir.z * 26 * dt;
    const cx = Math.floor(nx / CELDA);
    const cz = Math.floor(nz / CELDA);
    const fila = nivel.rejilla[cz];
    const choca = !fila || '#CTRF'.includes(fila[cx] || '#');
    if (choca || p.edad > 4) {
      escena.remove(p.malla);
      piedras.splice(i, 1);
      continue;
    }
    p.malla.position.set(nx, 1.7, nz);
    p.malla.rotation.x -= dt * 9;
    for (const e of enemigos) {
      if (!e.vivo || p.tocados.has(e)) continue;
      if (Math.hypot(e.pos.x - nx, e.pos.z - nz) < 3.4) {
        p.tocados.add(e);
        audio.sonar('carne', e.pos);
        if (e.recibir(150)) marcarBaja();
      }
    }
  }
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
    panelDano.style.background = '#c25a10';
    panelDano.style.opacity = '0.5';
    setTimeout(() => { panelDano.style.opacity = '0'; panelDano.style.background = '#8b0000'; }, 160);
    avisar('FUEGO GRIEGO: ' + tocados);
  } else if (id === 'jabalina') {
    lanzarFlecha(1, jugador.direccion(), 0, 4);
    avisar('JABALINA');
  } else if (id === 'vino') {
    relojFuria = 10;
    avisar('FURIA DE DIONISO');
  } else return false;
  return true;
}

const panelDano = document.getElementById('dano');
function golpeRecibido() {
  audio.sonar('dano');
  panelDano.style.opacity = '0.45';
  setTimeout(() => { panelDano.style.opacity = '0'; }, 90);
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
  ['F', 'Espada: tajo cuerpo a cuerpo, sin munición. Le pega a todos los que tengas enfrente'],
  ['CLIC DERECHO', 'Portal azul (necesitas el Cuerno de Hermes)'],
  ['Q', 'Portal naranja'],
  ['1 2 3 4', 'Usar lo que llevas en el inventario'],
  ['E', 'Abrir la tienda, solo entre rondas'],
  ['M', 'Silenciar y devolver el sonido'],
  ['ESC', 'Pausa']
];

function iconoDe(art, tipo) {
  let t = null;
  if (art.id === 'portales') t = recursos.cuerno && recursos.cuerno[1];
  else if (art.id === 'guante') t = recursos.guante && recursos.guante[2];
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
  if (t === 'vida') return 'Te cura ' + o.valor;
  if (t === 'armadura') return 'Suma ' + o.valor + ' de escudo';
  if (t === 'flechas') return 'Suma ' + o.valor + ' flechas';
  if (t === 'guarda') return 'Se guarda en el inventario';
  return 'Suma ' + o.valor + ' de oro';
}

document.getElementById('verControles').addEventListener('click', panelControles);
document.getElementById('verObjetos').addEventListener('click', panelObjetos);
btnMenu.addEventListener('click', () => location.reload());
addEventListener('keydown', e => {
  if (e.code === 'Escape' && panel.classList.contains('ver')) panel.classList.remove('ver');
});

function pausar() {
  if (muerto) return;
  menu.querySelector('h1').textContent = 'PAUSA';
  menu.querySelector('h2').textContent = 'ITACA ESPERA';
  menu.querySelector('p').textContent = 'CLIC PARA CONTINUAR';
  btnMenu.hidden = false;
  if (audio.ctx) audio.callarMusica();
}

function morir() {
  muerto = true;
  btnMenu.hidden = false;
  audio.sonar('muerte');
  audio.callarMusica();
  if (tienda.abierta) tienda.cerrar();
  jugador.activo = false;
  jugador.libre = false;
  if (document.pointerLockElement) document.exitPointerLock();
  menu.classList.remove('oculto');
  menu.querySelector('h1').textContent = 'HAS MUERTO';
  menu.querySelector('h2').textContent = 'ITACA SIGUE ESPERANDO';
  menu.querySelector('p').textContent = 'CLIC PARA VOLVER A INTENTAR';
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
  jugador.rayo = jugador.rayoMax;
  jugador.mult = { tension: 1, dano: 1, velocidad: 1, velFlecha: 1 };
  jugador.inventario.length = 0;
  relojFuria = 0;
  dracma = false;
  for (const k in efectos) efectos[k] = 0;
  jugador.invisible = false;
  for (const p of piedras) escena.remove(p.malla);
  piedras.length = 0;
  limpiarMundo();
  portales.limpiar();
  rondas.reiniciar();
  tienda.reiniciar();
  menu.querySelector('h1').textContent = 'NOSTOS';
  menu.querySelector('h2').textContent = 'EL REGRESO';
  menu.querySelector('p').textContent = 'CLIC PARA EMPEZAR';
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
  cajaRayo.classList.toggle('ver', jugador.guante);
  if (jugador.guante) elRayo.textContent = Math.round(jugador.rayo);
  elRonda.textContent = rondas ? rondas.numero : 0;
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
  if (jugador.cargandoRayo && imagenesGuante.length) {
    clave = 'g1';
    url = imagenesGuante[1];
  } else if (guanteReloj > 0 && imagenesGuante.length) {
    clave = 'g' + destelloGuante;
    url = imagenesGuante[destelloGuante];
  } else if (jugador.guante && imagenesGuante.length && jugador.rayo < jugador.rayoMax * 0.55) {
    clave = 'g3';
    url = imagenesGuante[3];
  } else if (espadaReloj > 0 && imagenesEspada.length) {
    const cuadro = Math.min(3, Math.floor((0.42 - espadaReloj) / 0.105));
    clave = 'e' + cuadro;
    url = imagenesEspada[cuadro];
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
    if (portales.cruzar(jugador)) { audio.sonar('cruzar'); jugador.actualizar(0); }
    moverFlechas(dt);
    moverJabalinas(dt);
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
    moverPiedras(dt);
    for (const k in efectos) if (efectos[k] > 0) efectos[k] -= dt;
    jugador.invisible = efectos.invisible > 0;
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

  antorcha.position.copy(camara.position);
  antorcha.intensity = 62 + Math.sin(performance.now() * 0.011) * 7;
  const balanceo = Math.sin(jugador.balanceo * 0.5) * 8;
  arma.style.transform = `translateX(calc(-50% + ${balanceo * 1.5}px)) translateY(calc(${Math.abs(balanceo) * 1.1}px - ${jugador.tension * 8}vh))`;

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
  jugador.alDisparar = disparar;
  jugador.alVacio = () => audio.sonar('vacio');
  jugador.alTajo = tajo;
  jugador.alRayo = lanzarRayo;
  jugador.alPausar = () => { if (jugador.empezado && !muerto) pausar(); };
  jugador.alRecibir = golpeRecibido;
  jugador.alUsar = usarConsumible;
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
  tienda = new Tienda({
    jugador,
    iconos: recursos,
    mercader: recursos.mercader,
    alCerrar: () => { if (!muerto) jugador._entrar(); },
    alComprar: art => { audio.sonar('comprar'); avisar(art.nombre); }
  });
  rondas = new Rondas({
    puntos: nivel.spawns.enemigos,
    crear: nacer,
    soltar: n => { soltarObjetos(n); },
    anunciar,
    bloqueado: () => tienda.abierta
  });
  flujo = new Flujo(nivel);
  portales = new Portales(escena, nivel, renderer);
  portales.antorcha = antorcha;
  minimapa = new Minimapa(document.getElementById('mapa'), nivel);
  orbitar(0);
  window.__juego = { jugador, enemigos, objetos, escena, camara, nivel, flechas, rondas, tienda, portales, audio, paso };
  bucle();
});
