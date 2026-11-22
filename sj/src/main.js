import * as THREE from 'three';
import { Mundo, construirCiudad, LIMITE, esCalle, VIENTO, linea } from './ciudad.js?v=202611220007';
import { Coche, nuevaRutaIA, objetivoIA, dirigir, puntoCalleAleatorio, matFaro, matCalavera, matHalo, matHaz } from './vehiculos.js?v=202611220007';
import { Peaton } from './peatones.js?v=202611220007';
import { Jugador, ARMAS } from './jugador.js?v=202611220007';
import { Policia } from './policia.js?v=202611220007';
import { Ambiente } from './ambiente.js?v=202611220007';
import { Audio } from './audio.js?v=202611220007';
import { Minimapa } from './minimapa.js?v=202611220007';
import { Misiones } from './misiones.js?v=202611220007';
import { Hud } from './hud.js?v=202611220007';
import { GPS, zona, calle } from './gps.js?v=202611220007';
import { Rueda, Granadas } from './armas.js?v=202611220007';
import { Actividades, Estadisticas } from './actividades.js?v=202611220007';
import { decorar } from './decoracion.js?v=202611220007';
import { Post } from './post.js?v=202611220007';
import { ORDEN } from './jugador.js?v=202611220007';
import { pinturas, matsDecal, modelo as modeloCoche, TIPOS } from './vehiculos.js?v=202611220007';
import { Interiores } from './interiores.js?v=202611220007';
import { crearPersona, sentar, montar } from './persona.js?v=202611220007';
import { Animales } from './animales.js?v=202611220007';
import { Duo } from './duo.js?v=202611220007';
import { Telefono } from './telefono.js?v=202611220007';
import { Redes } from './redes.js?v=202611220007';
import { Eventos } from './eventos.js?v=202611220007';
import { Economia } from './economia.js?v=202611220007';
import { Trabajos } from './trabajos.js?v=202611220007';
import { Aleatorios } from './aleatorios.js?v=202611220007';
import { Ambulantes } from './ambulantes.js?v=202611220007';
import { Semaforos } from './semaforos.js?v=202611220007';
import { Autobuses } from './autobuses.js?v=202611220007';
import { Fisica } from './fisica.js?v=202611220007';
import { Gente } from './gente.js?v=202611220007';
import { amueblar } from './mobiliario.js?v=202611220007';
import { construirAzoteas } from './azoteas.js?v=202611220007';
import { decorarTaller } from './taller.js?v=202611220007';
import { TrenLigero } from './tren.js?v=202611220007';
import { Baches } from './baches.js?v=202611220007';
import { Aviones } from './aviones.js?v=202611220007';
import { Gasolinera } from './gasolinera.js?v=202611220007';
import { ventanasLisas } from './ventanas.js?v=202611220007';
import { Hidrantes } from './hidrantes.js?v=202611220007';
import { papelPicado } from './papelpicado.js?v=202611220007';
import { decorarLotes } from './lotes.js?v=202611220007';
import { Limpiavidrios } from './limpiavidrios.js?v=202611220007';
import { DonChuy } from './donchuy.js?v=202611220007';
import { CONTACTOS } from './contactos.js?v=202611220007';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TRAFICO = 26, PEATONES = 34;
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _o = new THREE.Vector3();
const levantarJ = j => { j.p.cuerpo.rotation.set(0, 0, 0); j.p.pi.rotation.set(0, 0, 0); j.p.pd.rotation.set(0, 0, 0); };
const angulo = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

function texturaHumo() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

class Juego {
  constructor() {
    this.ajustes = { volumen: 0.8, musica: 0.7, sensibilidad: 1, calidad: 3, flechas: true, invertir: false, fps: false, v: 5 };
    try { const g = JSON.parse(localStorage.getItem('perla_ajustes') || '{}'); if ((g.v || 0) < 5 && g.calidad == 2) g.calidad = 3; delete g.retro; delete g.v; Object.assign(this.ajustes, g); } catch (e) { }
    this.lienzo = document.getElementById('lienzo');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.lienzo, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.camara = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.15, 1800);
    this.THREE = THREE;
    this.mundo = new Mundo();
    this.ciudad = construirCiudad(this.escena, this.mundo);
    this.fisica = new Fisica(this);
    this.gente = new Gente(this);
    this.audio = new Audio(this);
    this.estadisticas = new Estadisticas();
    this.hud = new Hud(this);
    this.coches = []; this.peatones = []; this.recogibles = []; this.efectos = [];
    this.jugador = new Jugador(this);
    this.policia = new Policia(this);
    this.ambiente = new Ambiente(this, this.escena, this.ciudad);
    this.misiones = new Misiones(this);
    this.actividades = new Actividades(this);
    this.gps = new GPS(this);
    this.rueda = new Rueda(this);
    this.granadas = new Granadas(this);
    this.decoracion = decorar(this);
    this.mobiliario = amueblar(this);
    this.azoteas = construirAzoteas(this);
    this.tallerDeco = decorarTaller(this);
    this.tren = new TrenLigero(this);
    this.baches = new Baches(this);
    this.aviones = new Aviones(this);
    this.gasolinera = new Gasolinera(this);
    this.ventanasLisas = ventanasLisas(this);
    this.hidrantes = new Hidrantes(this);
    this.papelPicado = papelPicado(this);
    this.lotes = decorarLotes(this);
    this.limpia = new Limpiavidrios(this);
    this.donChuy = new DonChuy(this);
    setTimeout(() => this.prepararRetratos(), 4000);
    this.interiores = new Interiores(this);
    this.animales = new Animales(this);
    this.redes = new Redes(this);
    this.eventos = new Eventos(this);
    this.telefono = new Telefono(this);
    this.economia = new Economia(this);
    this.trabajos = new Trabajos(this);
    this.aleatorios = new Aleatorios(this);
    this.ambulantes = new Ambulantes(this);
    this.semaforos = new Semaforos(this);
    this.autobuses = new Autobuses(this);
    this.reloj = 0;
    this.propiedades = {};
    this.banco = 0;
    this.mareo = 0;
    this.minimapa = new Minimapa(this, document.getElementById('mini'), document.getElementById('mapaGrande'));
    this.post = new Post(this.renderer, this.escena, this.camara);
    this.humoTex = texturaHumo();
    this.camYaw = 0; this.camPitch = -0.12; this.tMouse = 9; this.sacudida = 0; this.retroceso = 0;
    this.modoCam = 0; this.hombroIzq = false;
    this.nitro = 1;
    this.escalaTiempo = 1;
    this.teclas = {}; this.boton = [false, false, false];
    this.jugando = false; this.pausado = true;
    this.relojGestor = 0; this.cuadro = 0; this.fpsMedido = 60; this.sinDaño = 0;
    this.faro = new THREE.SpotLight('#fff1d0', 0, 70, 0.6, 0.5, 1);
    this.escena.add(this.faro, this.faro.target);
    this.marcas = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.28, 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#0d0d0f', transparent: true, opacity: 0.55, depthWrite: false }), 400);
    this.marcas.count = 0; this.marcas.frustumCulled = false; this.marcaIdx = 0;
    this.escena.add(this.marcas);
    this.prepararMundo();
    this.cargar();
    this.duo = new Duo(this);
    this.hud.personaje();
    this.entradas();
    this.aplicarAjustes();
    this.ultimo = performance.now();
    addEventListener('resize', () => this.redimensionar());
    this.renderer.setAnimationLoop(() => this.bucle());
    document.getElementById('carga').style.display = 'none';
    document.getElementById('menu').style.display = 'grid';
  }

  crearPiloto() {
    const p = crearPersona({ gorra: '#222', ropa: null });
    montar(p, null, 1);
    const casco = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({ color: ['#c0392b', '#111', '#2e86de', '#f1c40f'][Math.random() * 4 | 0], metalness: 0.3, roughness: 0.3 }));
    casco.position.set(0, 0.2, 0); p.cabeza.add(casco);
    return p;
  }

  caerseDeMoto(m, golpe) {
    const j = this.jugador;
    if (j.coche !== m) return;
    const vx = m.vx, vz = m.vz;
    m.vx *= 0.1; m.vz *= 0.1;
    this.subirBajar();
    j.recibir(Math.min(45, golpe * 1.8));
    j.pos.x += vx * 0.08; j.pos.z += vz * 0.08;
    this.mundo.empujar(j.pos, 0.4);
    this.hud.notificar('alerta', '¡Te caíste de la moto!', '', 2.5);
    this.sacudida = 0.6;
  }

  zonaDe(x, z) { return zona(this.ciudad, x, z); }
  calleDe(x, z) { return calle(x, z) || 'Afueras'; }
  prepararMundo() {
    const L = this.ciudad.lugares;
    this.jugador.pos.set(L.inicio.x, 0, L.inicio.z);
    this.jugador.yaw = Math.PI;
    this.camYaw = Math.PI * 0.75;
    const c = new Coche(this, 'sedan', '#c0392b', L.inicio.x + 7, L.inicio.z + 2, Math.PI);
    c.propio = true; this.coches.push(c);
    const mt = new Coche(this, 'moto', '#ff4f9a', L.inicio.x + 3, L.inicio.z + 6, Math.PI / 2); mt.propio = true; this.coches.push(mt);
    for (const e of this.ciudad.estacionados) { const p = new Coche(this, e.tipo, e.color || '#f2f4f7', e.x, e.z, e.yaw); p.sirena = false; this.coches.push(p); }
    for (let i = 0; i < TRAFICO; i++) {
      const p = puntoCalleAleatorio(this.jugador.pos, 25, 170);
      if (p) this.nuevoTrafico(p);
    }
    for (let i = 0; i < PEATONES; i++) this.nuevoPeaton(this.jugador.pos, 8, 110);
    const B = this.ciudad.bloques;
    for (const b of B) {
      if (b.tipo === 'parque') this.crearRecogible('salud', b.cx + 5, b.cz + 5, true);
      if (b.tipo === 'estadio') this.crearRecogible('chaleco', b.cx, b.z1 - 1.5, true);
      if (b.tipo === 'torres') this.crearRecogible('dinero', b.cx, b.z0 + 1.5, true, 150);
    }
    this.crearRecogible('salud', L.hospital.x - 6, L.hospital.z, true);
    this.crearRecogible('chaleco', L.comisaria.x + 10, L.comisaria.z, true);
    this.crearRecogible('municion', L.tianguis.x - 20, L.tianguis.z - 20, true);
    this.crearRecogible('municion', L.mercado.x + 20, L.mercado.z, true);
    this.crearRecogible('municion', L.taller.x + 10, L.taller.z + 14, true);
    this.crearRecogible('dinero', L.catedral.x, L.catedral.z - 2, true, 100);
  }

  nuevoTrafico(p) {
    const r = Math.random();
    const tipo = r < 0.13 ? 'taxi' : r < 0.29 ? 'compacto' : r < 0.43 ? 'camioneta' : r < 0.48 ? 'deportivo' : r < 0.53 ? 'policia' : r < 0.62 ? 'moto' : r < 0.645 ? 'ambulancia' : r < 0.705 ? 'reparto' : 'sedan';
    const c = new Coche(this, tipo, tipo === 'policia' || tipo === 'ambulancia' ? '#f2f4f7' : tipo === 'taxi' ? '#d63a4a' : tipo === 'reparto' ? ['#f2f2ee', '#c8202e', '#2a5aa0', '#3a3d44'][Math.random() * 4 | 0] : null, p.x, p.z, p.yaw);
    c.conductor = 'ia';
    c.id = (this.contador = (this.contador || 0) + 1);
    c.sirena = false;
    c.ia = nuevaRutaIA(p.x, p.z, p.yaw);
    c.vx = Math.sin(p.yaw) * 8; c.vz = Math.cos(p.yaw) * 8;
    this.coches.push(c);
    return c;
  }

  nuevoPeaton(cerca, rmin, rmax) {
    const lista = this.ciudad.bloques.filter(b => { const d = Math.hypot(b.cx - cerca.x, b.cz - cerca.z); return d > rmin && d < rmax; });
    const b = lista.length ? lista[Math.random() * lista.length | 0] : this.ciudad.bloques[Math.random() * 64 | 0];
    const p = new Peaton(this, {});
    p.asignarBloque(b);
    this.peatones.push(p);
    return p;
  }

  crearRecogible(tipo, x, z, fijo = false, cantidad = 0) {
    const g = new THREE.Group();
    const colores = { salud: '#3bd16f', chaleco: '#3a8dff', municion: '#ffc94a', dinero: '#4fdc7a', sobre: '#ffffff' };
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshLambertMaterial({ color: colores[tipo], emissive: colores[tipo], emissiveIntensity: 0.35 }));
    if (tipo === 'dinero' || tipo === 'sobre') cuerpo.scale.set(1.2, 0.35, 0.7);
    g.add(cuerpo);
    if (tipo === 'salud') { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.18), new THREE.MeshBasicMaterial({ color: '#fff' })); const b2 = b.clone(); b2.rotation.z = Math.PI / 2; g.add(b, b2); b.position.z = b2.position.z = 0.28; }
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: colores[tipo], transparent: true, opacity: 0.6, depthWrite: false }));
    halo.position.y = -0.85;
    g.add(halo);
    g.position.set(x, 1, z);
    this.escena.add(g);
    const r = { tipo, x, z, malla: g, fijo, cantidad, tomado: false, espera: 0 };
    this.recogibles.push(r);
    return r;
  }

  entradas() {
    document.querySelectorAll('#menu [data-acc]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      this.audio.iniciar();
      this.audio.ui(760);
      const acc = b.dataset.acc;
      if (acc === 'jugar') return this.empezar();
      if (acc === 'borrar') {
        if (!confirm('¿Borrar tu avance y empezar la historia de cero?')) return;
        try { localStorage.removeItem('perla_partida'); } catch (e) { }
        location.reload();
        return;
      }
      const panel = { stats: 'pStats', ajustes: 'pAjustes', controles: 'pControles' }[acc];
      const yaAbierto = document.getElementById(panel).classList.contains('on');
      document.querySelectorAll('#pantalla .der').forEach(d => d.classList.toggle('on', d.id === panel && !yaAbierto));
      document.querySelectorAll('#menu .boton').forEach(x => x.classList.toggle('sel', x === b && !yaAbierto));
      if (acc === 'stats') document.getElementById('stats').innerHTML = this.estadisticas.filas().map(([a, v]) => `<div>${a}</div><div>${v}</div>`).join('');
    }));
    document.querySelectorAll('[data-aj]').forEach(el => {
      const k = el.dataset.aj;
      if (el.type === 'checkbox') el.checked = !!this.ajustes[k]; else el.value = this.ajustes[k];
      el.addEventListener('input', () => {
        this.ajustes[k] = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? +el.value : parseFloat(el.value);
        try { localStorage.setItem('perla_ajustes', JSON.stringify(this.ajustes)); } catch (e) { }
        this.aplicarAjustes();
      });
    });
    this.lienzo.addEventListener('click', () => { if (this.jugando && !document.pointerLockElement && !this.overlay) this.bloquear(); });
    addEventListener('keydown', e => {
      if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
      if (this.overlay === 'mapa' && (e.code === 'KeyM' || e.code === 'Escape')) { this.cerrarOverlay('mapa'); return; }
      if (this.overlay === 'tienda' && e.code === 'Escape') { this.actividades.cerrarTienda(); return; }
      if (this.overlay === 'telefono' && (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'ArrowUp')) { this.telefono.cerrar(); return; }
      if (this.foto && (e.code === 'KeyP' || e.code === 'Escape')) { this.modoFoto(false); return; }
      if (this.foto && e.code === 'Space') { this.tomarFoto = true; return; }
      if (this.foto && e.code === 'KeyX' && !this.jugador.coche) { this.selfie = !this.selfie; document.body.classList.toggle('selfie', this.selfie); this.audio.ui(this.selfie ? 1400 : 900); return; }
      if (this.foto && e.code === 'KeyG') { this.jugador.gesticular(); return; }
      if (!this.jugando && e.code === 'Enter' && !this.overlay) { this.audio.iniciar(); this.empezar(); return; }
      if (e.repeat && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) { this.teclas[e.code] = true; return; }
      this.teclas[e.code] = true;
      if (!this.jugando || this.overlay) return;
      if (this.tren?.viaje) return;
      const j = this.jugador;
      if (e.code === 'KeyE' && j.coche && this.limpia?.pagar()) return;
      if (e.code === 'KeyF' && !j.interior && !this.entrando) this.iniciarEntrada();
      if (e.code === 'KeyE' && !j.coche && !this.overlay && this.ambulantes.cerca()) this.ambulantes.comprar();
      else if (e.code === 'KeyE' && !j.coche && !this.overlay && this.interiores.cajeroCerca()) { this.telefono.abrir(); this.telefono.abrirApp('banco'); this.audio.ui?.(880); }
      else if (e.code === 'KeyE' && !j.coche && this.tren?.cerca()) this.tren.viajar();
      else if (e.code === 'KeyE' && !j.coche) this.interiores.interactuar();
      if (e.code === 'KeyR') j.recargar();
      const d = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'].indexOf(e.code);
      if (d >= 0) this.rueda.categoria(d);
      if (e.code === 'Tab') this.rueda.abrir();
      if (e.code === 'KeyH') this.audio.claxon();
      if (e.code === 'KeyM') this.abrirOverlay('mapa');
      if ((e.code === 'KeyP' || (e.code === 'ArrowUp' && !j.coche)) && !this.foto) this.telefono.abrir();
      if (e.code === 'KeyZ' && !this.foto) this.duo.cambiar();
      if (e.code === 'KeyV') { if (j.coche) this.modoCam = (this.modoCam + 1) % 3; else this.hombroIzq = !this.hombroIzq; }
      if (e.code === 'KeyT') { if (!this.trabajos.activo && !this.trabajos.salidaCerca() && j.coche?.tipo === 'taxi' && !this.misiones.activa) this.actividades.iniciarTaxi(); else if (!this.actividades.taxi) this.trabajos.tecla(); }
      if (e.code === 'KeyG' && !j.coche && !this.overlay) j.gesticular();
      if (e.code === 'KeyC' && !j.coche && !this.overlay) { j.agachado = !j.agachado; this.hud.notificar('gps', j.agachado ? 'Agachado' : 'De pie', j.agachado ? 'Te ven menos y te pegan menos.' : '', 1.2); }
      if (e.code === 'KeyQ' && !j.coche && !this.overlay) j.rodar(this.entrada(), this.camYaw);
      if (e.code === 'KeyQ' && j.coche) { this.hud.radio(this.audio.cambiarEstacion(-1), this.audio.estacion); this.audio.radioActiva(true); }
      if (e.code === 'KeyE' && j.coche) { this.hud.radio(this.audio.cambiarEstacion(1), this.audio.estacion); this.audio.radioActiva(true); }
    });
    addEventListener('keyup', e => { this.teclas[e.code] = false; if (e.code === 'Tab') this.rueda.cerrar(); });
    addEventListener('blur', () => { this.teclas = {}; this.boton = [false, false, false]; this.rueda.cerrar(false); });
    this.lienzo.addEventListener('mousedown', e => { if (this.foto) { if (e.button === 0) this.tomarFoto = true; return; } this.boton[e.button] = true; if (this.rueda.abierta && e.button === 0) { this.rueda.cerrar(); this.boton[0] = false; } });
    addEventListener('mouseup', e => { this.boton[e.button] = false; });
    addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('wheel', e => { if (this.foto) { this.fotoDist = Math.max(1.5, Math.min(30, (this.fotoDist || 5) * (e.deltaY > 0 ? 1.12 : 0.89))); return; } if (this.jugando && !this.overlay && !this.jugador.coche) { this.jugador.cambiarArma(e.deltaY > 0 ? 1 : -1); this.hud.cambioArma(); } }, { passive: true });
    addEventListener('mousemove', e => {
      if (!this.jugando || this.pausado || this.overlay) return;
      if (document.pointerLockElement !== this.lienzo) return;
      if (this.rueda.abierta) { this.rueda.mover(e.movementX, e.movementY); return; }
      const s = 0.0024 * this.ajustes.sensibilidad * (this.jugador.apunta ? 0.6 : 1);
      this.camYaw -= e.movementX * s;
      this.camPitch = Math.max(-1.15, Math.min(0.75, this.camPitch - e.movementY * s * (this.ajustes.invertir ? -1 : 1)));
      this.tMouse = 0;
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.lienzo) { this.estabaBloqueado = true; return; }
      if (this.foto) this.modoFoto(false);
      if (this.jugando && this.estabaBloqueado && !this.overlay) this.pausar();
    });
  }

  abrirOverlay(cual) {
    if (this.overlay) return;
    this.overlay = cual;
    this.rueda.cerrar(false);
    this.boton = [false, false, false]; this.teclas = {};
    document.body.classList.add({ mapa: 'enmapa', tienda: 'entienda', telefono: 'entelefono' }[cual]);
    if (cual === 'mapa') this.minimapa.abrir();
    this.audio.ui(cual === 'mapa' ? 520 : 880);
    this.audio.motor(0, false);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  cerrarOverlay(cual) {
    if (this.overlay !== cual) return;
    this.overlay = null;
    document.body.classList.remove('enmapa', 'entienda', 'entelefono');
    if (cual === 'mapa') this.minimapa.cerrar();
    this.audio.ui(440);
    this.ultimo = performance.now();
    this.bloquear();
  }

  bloquear() { try { const r = this.lienzo.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { } }

  empezar() {
    this.audio.iniciar();
    this.jugando = true; this.pausado = false;
    document.body.classList.add('jugando');
    document.querySelectorAll('#pantalla .der').forEach(d => d.classList.remove('on'));
    this.bloquear();
    if (!this.yaInicio) {
      this.yaInicio = true;
      this.hud.grande('SANTA JACARANDA', 'Ciudad abierta', 3.2, 'info');
      if (this.misiones.indice === 0) setTimeout(() => this.hud.notificar('mision', 'Tu primer trabajo', 'Camina al <b>círculo amarillo</b> del Taller de Don Chuy. Con <kbd>F</kbd> te subes a cualquier coche y con <kbd>M</kbd> abres el mapa.', 10), 2600);
      setTimeout(() => this.hud.notificar('info', 'Rueda de armas', 'Mantén <kbd>Tab</kbd> y mueve el mouse para elegir arma.', 7), 9000);
    }
    if (this.jugador.coche) this.audio.radioActiva(true);
    this.ultimo = performance.now();
  }

  pausar() {
    this.pausado = true; this.jugando = false;
    this.estabaBloqueado = false;
    this.rueda.cerrar(false);
    document.body.classList.remove('jugando');
    const p = document.getElementById('pantalla');
    p.classList.add('pausa');
    p.querySelector('h1').textContent = 'PAUSA';
    p.querySelector('[data-acc=jugar]').textContent = 'CONTINUAR';
    this.pintarProgreso();
    this.audio.motor(0, false);
    this.audio.radioActiva(false);
    this.audio.sirena(0);
    this.audio.derrape?.(0);
  }

  aplicarAjustes() {
    const a = this.ajustes;
    const q = a.calidad;
    this.renderer.shadowMap.enabled = q >= 1;
    this.ambiente.sol.castShadow = q >= 1;
    this.post.activo = q >= 2;
    this.post.nivel(q);
    const pr = q >= 1 ? Math.min(devicePixelRatio || 1, 1.5) : 0.8;
    this.renderer.setPixelRatio(pr);
    this.post.composer.setPixelRatio(pr);
    this.renderer.setSize(innerWidth, innerHeight);
    this.post.tamaño(innerWidth, innerHeight);
    this.escena.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
    this.audio.volumen = a.volumen; this.audio.volMusica = a.musica;
    if (this.audio.master) { this.audio.master.gain.value = a.volumen; this.audio.radioActiva(!!this.jugador.coche && this.jugando); }
    document.body.classList.toggle('verfps', !!a.fps);
  }

  redimensionar() {
    this.camara.aspect = innerWidth / innerHeight;
    this.camara.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.post.tamaño(innerWidth, innerHeight);
  }
  iniciarEntrada() {
    const j = this.jugador;
    if (j.coche) { this.subirBajar(); return; }
    let mejor = null, md = 9;
    for (const c of this.coches) {
      if (c.quemado || c.conductor === 'rival') continue;
      const d = c.pos.distanceTo(j.pos) - c.t.largo * 0.35;
      if (d < 3.2 && d < md) { md = d; mejor = c; }
    }
    if (!mejor) return;
    this.entrando = { c: mejor, t: 0 };
  }

  avanzarEntrada(dt) {
    const E = this.entrando, j = this.jugador, c = E.c;
    E.t += dt;
    if (c.quemado) { this.entrando = null; return false; }
    if (!E.f) {
      const lado = c.t.ancho / 2 + 0.45;
      const zp = c.puerta ? c.puerta.position.z - 0.35 : 0.4;
      const tx = c.pos.x + c.fz * lado + c.fx * zp, tz = c.pos.z - c.fx * lado + c.fz * zp;
      const dx = tx - j.pos.x, dz = tz - j.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.25 && E.t < 0.9) {
        const v = Math.min(d / dt, 6.5);
        j.pos.x += dx / d * v * dt; j.pos.z += dz / d * v * dt;
        j.yaw = Math.atan2(dx, dz); j.velocidad = 5;
        return true;
      }
      if (c.pos.distanceTo(j.pos) > 6) { this.entrando = null; return false; }
      if (c.tipo === 'moto' || !c.puerta) { this.entrando = null; this.audio.puerta?.(); this.subirBajar(c); return false; }
      E.f = 'abrir'; E.t = 0; c.puertaObj = 1; this.audio.puerta?.();
      E.desde = j.pos.clone(); E.yaw0 = Math.atan2(c.pos.x - j.pos.x, c.pos.z - j.pos.z);
      return true;
    }
    j.velocidad = 0;
    if (E.f === 'abrir') {
      j.yaw = E.yaw0;
      if (E.t > 0.3) { E.f = 'sentar'; E.t = 0; }
      return true;
    }
    const k = Math.min(1, E.t / 0.4), s = k * k * (3 - 2 * k);
    const asiento = new THREE.Vector3(c.pos.x + c.fz * c.t.ancho * 0.2 + c.fx * (c.puerta.position.z - 0.55), 0, c.pos.z - c.fx * c.t.ancho * 0.2 + c.fz * (c.puerta.position.z - 0.55));
    j.pos.lerpVectors(E.desde, asiento, s);
    let dy = c.yaw - E.yaw0; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    j.yaw = E.yaw0 + dy * s;
    if (k >= 1) { this.entrando = null; this.subirBajar(c); c.puertaObj = 1; c.puertaCierra = 0.18; return false; }
    return true;
  }

  poseEntrada() {
    const E = this.entrando, p = this.jugador.p;
    if (!E || !E.f) return;
    if (E.f === 'abrir') {
      const k = Math.min(1, E.t / 0.2);
      p.bd.rotation.x = -1.2 * k; p.bd.rotation.z = -0.25 * k; p.cd.rotation.x = -0.35 * k;
    } else {
      const k = Math.min(1, E.t / 0.4);
      p.pd.rotation.x = -1.25 * k; p.rd.rotation.x = 1.15 * k; p.pi.rotation.x = -0.6 * k; p.ri.rotation.x = 0.6 * k;
      p.cuerpo.rotation.x = 0.22 * k; p.cuerpo.position.y = -0.32 * k; p.bd.rotation.x = -0.6 * (1 - k);
    }
  }


  subirBajar(forzado) {
    const j = this.jugador;
    if (j.muerto) return;
    if (j.coche) {
      const c = j.coche;
      c.conductor = null;
      j.coche = null;
      if (c.puerta) { c.puertaObj = 1; c.puertaCierra = 0.6; }
      if (c.tipo === 'moto' || c.tipo === 'lancha') { this.escena.add(j.grupo); levantarJ(j); }
      const lado = c.t.ancho / 2 + 0.7;
      j.pos.set(c.pos.x + c.fz * lado, 0, c.pos.z - c.fx * lado);
      this.mundo.empujar(j.pos, 0.4);
      if (this.mundo.dentro(j.pos.x, 1, j.pos.z)) j.pos.set(c.pos.x - c.fz * lado, 0, c.pos.z + c.fx * lado);
      j.yaw = c.yaw;
      if (c.vel > 8) { j.recibir(Math.min(40, c.vel * 1.2)); this.hud.notificar('alerta', '¡Te aventaste del coche!', '', 2.5); }
      if (this.actividades.taxi) this.actividades.terminarTaxi('Te bajaste del taxi.');
      this.audio.motor(0, false);
      this.audio.radioActiva(false);
      return;
    }
    let mejor = forzado || null, md = 9;
    if (!mejor) for (const c of this.coches) {
      if (c.quemado || c.conductor === 'rival') continue;
      const d = c.pos.distanceTo(j.pos) - c.t.largo * 0.35;
      if (d < 2.6 && d < md) { md = d; mejor = c; }
    }
    if (!mejor) return;
    if (mejor.conductor === 'ia' || mejor.conductor === 'policia') {
      const lado = mejor.t.ancho / 2 + 0.8;
      const tipo = mejor.conductor === 'policia' ? 'poli' : 'civil';
      const p = new Peaton(this, { tipo, x: mejor.pos.x + mejor.fz * lado, z: mejor.pos.z - mejor.fx * lado });
      p.yaw = mejor.yaw;
      if (tipo === 'civil') { p.asustar(j.pos.x, j.pos.z, 1.5); p.asignarRutaCercana(); p.estado = 'huir'; }
      else { p.estado = 'perseguir'; this.policia.agentes.push(p); }
      this.peatones.push(p);
      this.policia.crimen(tipo === 'poli' ? 'herirPoli' : 'robo', j.pos);
    } else if (mejor.tipo === 'policia') this.policia.crimen('robo', j.pos);
    else if (!mejor.conductor && !mejor.propio && mejor !== this.ultimoCoche && !this.misiones?.activa && !['moto', 'lancha', 'autobus', 'reparto'].includes(mejor.tipo) && Math.random() < 0.4) { mejor.alarma = 8; this.policia.crimen('robo', j.pos); this.hud.notificar('alerta', '¡Alarma!', 'Este coche tiene alarma. Arráncate rápido.', 3); }
    if (mejor.conductor === 'ia' || mejor.conductor === 'policia' || mejor !== this.ultimoCoche) this.estadisticas.sumar('robados');
    this.ultimoCoche = mejor;
    mejor.conductor = 'jugador';
    mejor.ia = null;
    if (mejor.tipo === 'moto') { mejor.carro.add(j.grupo); j.grupo.position.set(0, 0.42, -0.15); j.grupo.rotation.set(0, 0, 0); }
    if (mejor.tipo === 'lancha') { mejor.carro.add(j.grupo); j.grupo.position.set(0.35, 0.05, -0.75); j.grupo.rotation.set(0, 0, 0); }
    mejor.persecucion = false;
    if (this.policia.unidades.includes(mejor)) this.policia.unidades.splice(this.policia.unidades.indexOf(mejor), 1);
    j.coche = mejor;
    j.apunta = false;
    this.tMouse = 9;
    this.audio.radioActiva(true);
    this.hud.radio(this.audio.nombreEstacion, this.audio.estacion);
  }

  entrada() {
    const k = this.teclas;
    return {
      x: (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0),
      y: (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0),
      correr: !!(k.ShiftLeft || k.ShiftRight),
      saltar: !!k.Space
    };
  }

  distanciaLibre(c, rango, ignorarCoches, ignorarTodo = false) {
    const fx = c.fx, fz = c.fz, rx = -fz, rz = fx;
    let m = rango;
    const ver = (x, z, ancho, rad) => {
      const dx = x - c.pos.x, dz = z - c.pos.z;
      const a = dx * fx + dz * fz;
      if (a <= 0 || a > rango + rad) return;
      const l = Math.abs(dx * rx + dz * rz);
      if (l < ancho) m = Math.min(m, a - rad - c.t.largo / 2);
    };
    if (!ignorarCoches) for (const o of this.coches) if (o !== c) ver(o.pos.x, o.pos.z, 2.3, o.t.largo / 2);
    if (ignorarTodo) return m;
    const jp = this.jugador.posicion;
    if (this.jugador.coche) ver(jp.x, jp.z, 2.3, this.jugador.coche.t.largo / 2);
    else ver(jp.x, jp.z, 1.6, 0.4);
    for (const p of this.peatones) if (!p.muerto && Math.abs(p.pos.x - c.pos.x) < rango + 3 && Math.abs(p.pos.z - c.pos.z) < rango + 3 && esCalle(p.pos.x, p.pos.z)) ver(p.pos.x, p.pos.z, 1.5, 0.4);
    return m;
  }

  conducirHacia(c, dt, tx, tz, vObj) {
    if (c.reversa > 0) {
      c.reversa -= dt;
      c.manejar(dt, -1, c.giroReversa || 0, false);
      return;
    }
    if (this.tren) [tx, tz] = this.tren.desviar(c, tx, tz);
    if (this.baches && !c.sirena && c.conductor !== 'rival') vObj = Math.min(vObj, this.baches.limite(c));
    const { giro, angulo: a } = dirigir(c, tx, tz);
    if (Math.abs(a) > 1.6 && c.vel < 6) { c.manejar(dt, -0.8, -giro, false); return; }
    const acel = Math.max(-1, Math.min(1, (vObj - c.adelante) * 0.35));
    c.manejar(dt, acel, giro, vObj < 1 && c.adelante > 2);
    if (vObj > 3 && Math.abs(c.adelante) < 0.8) {
      c.atorado += dt;
      if (c.atorado > 1.6) { c.atorado = 0; c.reversa = 1.1; c.giroReversa = -giro; }
    } else c.atorado = Math.max(0, c.atorado - dt);
  }

  actualizarIA(c, dt) {
    if (c.quemado) { c.manejar(dt, 0, 0, true); return; }
    const jug = this.jugador;
    if (c.conductor === 'ia') {
      if (!c.ia) c.ia = nuevaRutaIA(c.pos.x, c.pos.z, c.yaw);
      const o = objetivoIA(c);
      const { angulo: a } = dirigir(c, o.x, o.z);
      let v = o.lento ? 6 : 12.5;
      if (Math.abs(a) > 0.7) v = 4.5;
      if (c.ignorar > 0) c.ignorar -= dt;
      if (c.rodeo > 0) c.rodeo -= dt;
      const libre = this.distanciaLibre(c, 18, c.ignorar > 0, c.rodeo > 0);
      if (libre < 16) v = Math.min(v, Math.max(0, (libre - 2.5) * 1.1));
      const RI = c.ia, along = (c.pos.x - linea(RI.ix)) * RI.dx + (c.pos.z - linea(RI.iz)) * RI.dz;
      const luz = this.semaforos.estado(RI.ix, RI.iz, RI.dx !== 0 ? 'x' : 'z');
      c.enRojo = luz !== 'verde' && along > -60 && along < -9.5 && !(luz === 'amarillo' && along > -15) && !(c.panico > 0);
      if (c.enRojo && along > -26) v = Math.min(v, Math.max(0, (-10.5 - along) * 1.3));
      if (v < 1 && libre < 16 && !c.enRojo) c.espera = (c.espera || 0) + dt; else c.espera = 0;
      if (c.espera > 2.5 + (c.id || 0) % 3) { c.espera = 0; c.ignorar = 2.2; }
      if (c.panico > 0) { c.panico -= dt; v *= 1.7; }
      c.trabado = Math.abs(c.adelante || 0) < 1.5 && !c.enRojo ? (c.trabado || 0) + dt : Math.max(0, (c.trabado || 0) - dt * 0.7);
      if (c.trabado > 4 && libre < 8 && !(c.pito > 0)) {
        c.pito = 4; if (c.pos.distanceTo(jug.posicion) < 40) this.audio.claxon();
        for (const q of this.peatones) if (!q.muerto && Math.abs(q.pos.x - c.pos.x) + Math.abs(q.pos.z - c.pos.z) < 12) q.asustar(c.pos.x, c.pos.z, 0.8);
      }
      if (c.pito > 0) c.pito -= dt;
      if (c.trabado > 6 && !(c.rodeo > 0)) { c.rodeo = 3.5; c.ignorar = 3.5; c.trabado = 3; }
      let ox = o.x, oz = o.z;
      if (c.rodeo > 0) { ox -= c.fz * 3.4; oz += c.fx * 3.4; v = Math.max(v, 5); }
      if (v < 1) { c.manejar(dt, c.adelante > 0.3 ? -1 : 0, dirigir(c, ox, oz).giro, false); c.atorado = 0; }
      else this.conducirHacia(c, dt, ox, oz, v);
    } else if (c.conductor === 'policia') {
      const jp = jug.posicion;
      const d = c.pos.distanceTo(jp);
      if (!c.persecucion) { c.conductor = 'ia'; return; }
      const ve = d < 50 && this.mundo.rayo(c.pos.x, 1, c.pos.z, jp.x, 1, jp.z, 2) >= 1;
      if (ve) {
        let tx = jp.x, tz = jp.z;
        if (jug.coche) { tx += jug.coche.vx * 0.5; tz += jug.coche.vz * 0.5; }
        const v = jug.coche ? Math.min(42, 12 + d * 1.2) : (d < 13 ? 0 : Math.min(20, d));
        if (v < 1) c.manejar(dt, c.adelante > 0.5 ? -1 : 0, 0, true);
        else this.conducirHacia(c, dt, tx, tz, v);
      } else {
        if (!c.ia) c.ia = nuevaRutaIA(c.pos.x, c.pos.z, c.yaw);
        const o = objetivoIA(c, (op, R) => {
          let mejor = op[0], md = 1e9;
          for (const q of op) {
            const nx = (R.ix + q[0] - 4) * 80, nz = (R.iz + q[1] - 4) * 80;
            const dd = Math.hypot(nx - jp.x, nz - jp.z) + Math.random() * 30;
            if (dd < md) { md = dd; mejor = q; }
          }
          return mejor;
        });
        const { angulo: a } = dirigir(c, o.x, o.z);
        this.conducirHacia(c, dt, o.x, o.z, o.lento || Math.abs(a) > 0.6 ? 9 : 30);
      }
    } else if (c.conductor === 'bus') {
      this.autobuses.conducir(c, dt);
    } else if (c.conductor === 'rival') {
      const R = c.rival;
      if (R.i >= R.puntos.length) { c.manejar(dt, -1, 0, true); return; }
      const p = R.puntos[R.i];
      const d = Math.hypot(p.x - c.pos.x, p.z - c.pos.z);
      const { angulo: a } = dirigir(c, p.x, p.z);
      let v = 33;
      if (d < 30 && R.i < R.puntos.length - 1) v = 15;
      if (Math.abs(a) > 0.45) v = 10;
      this.conducirHacia(c, dt, p.x, p.z, v);
      if (d < 9) R.i++;
    } else {
      c.manejar(dt, 0, 0, true);
    }
  }

  colisionesCoches(dt) {
    const L = this.coches;
    const jc = this.jugador.coche;
    for (let i = 0; i < L.length; i++) {
      const a = L[i];
      for (let k = i + 1; k < L.length; k++) {
        const b = L[k];
        const dx0 = b.pos.x - a.pos.x, dz0 = b.pos.z - a.pos.z;
        if (dx0 * dx0 + dz0 * dz0 > 49) continue;
        for (const sa of [0.3, -0.3]) for (const sb of [0.3, -0.3]) {
          const ax = a.pos.x + a.fx * a.t.largo * sa, az = a.pos.z + a.fz * a.t.largo * sa;
          const bx = b.pos.x + b.fx * b.t.largo * sb, bz = b.pos.z + b.fz * b.t.largo * sb;
          const ra = a.t.ancho * 0.58, rb = b.t.ancho * 0.58;
          let dx = bx - ax, dz = bz - az;
          const d = Math.hypot(dx, dz);
          if (d >= ra + rb || d < 1e-4) continue;
          dx /= d; dz /= d;
          const pen = ra + rb - d;
          const ma = a.quemado ? 3 : a.t.masa, mb = b.quemado ? 3 : b.t.masa;
          const ta = mb / (ma + mb), tb = ma / (ma + mb);
          a.pos.x -= dx * pen * ta; a.pos.z -= dz * pen * ta;
          b.pos.x += dx * pen * tb; b.pos.z += dz * pen * tb;
          const rv = (b.vx - a.vx) * dx + (b.vz - a.vz) * dz;
          if (rv < 0) {
            const imp = -(1.3) * rv / (1 / ma + 1 / mb);
            a.vx -= imp / ma * dx; a.vz -= imp / ma * dz;
            b.vx += imp / mb * dx; b.vz += imp / mb * dz;
            const f = -rv;
            if (f > 4) {
              a.abollar?.(dx, dz, f * mb / (ma + mb) * 1.4); b.abollar?.(-dx, -dz, f * ma / (ma + mb) * 1.4);
              a.dañar((f - 4) * 1.6 / ma, 'choque', b === jc ? 'jugador' : null);
              b.dañar((f - 4) * 1.6 / mb, 'choque', a === jc ? 'jugador' : null);
              this.audio.choque(f, a.pos);
              if (a === jc || b === jc) {
                const otro = a === jc ? b : a;
                if (otro.conductor === 'ia') { otro.panico = 4; if (Math.random() < 0.5) this.audio.claxon(); }
                if (otro.tipo === 'policia' && otro.conductor && f > 6) this.policia.crimen('chocarPoli', otro.pos);
                this.sacudida = Math.max(this.sacudida, Math.min(0.5, f / 40));
              }
            }
          }
        }
      }
    }
  }

  atropellos() {
    const jug = this.jugador;
    for (const c of this.coches) {
      const v = c.vel;
      if (v < 2.5) continue;
      const hl = c.t.largo / 2 + 0.35, ha = c.t.ancho / 2 + 0.35;
      const prueba = (p, x, z) => {
        const dx = x - c.pos.x, dz = z - c.pos.z;
        if (Math.abs(dx) > 4 || Math.abs(dz) > 4) return false;
        const lx = dx * c.fx + dz * c.fz, lz = dx * -c.fz + dz * c.fx;
        return Math.abs(lx) < hl && Math.abs(lz) < ha;
      };
      if (c === jug.coche && v > 7) for (const p of this.peatones) if (!p.muerto && Math.abs(p.pos.x - c.pos.x) < 9 && Math.abs(p.pos.z - c.pos.z) < 9) p.asustar(c.pos.x, c.pos.z, 0.5);
      for (const p of this.peatones) {
        if (p.muerto && p.vuela) continue;
        if (p.ultimoAtropello && performance.now() - p.ultimoAtropello < 600) continue;
        if (!prueba(p, p.pos.x, p.pos.z)) continue;
        p.ultimoAtropello = performance.now();
        const autor = c === jug.coche ? 'jugador' : null;
        if (p.muerto) { p.vuela = { x: c.vx * 0.5, z: c.vz * 0.5 }; continue; }
        p.recibir(v * 3.2, c.pos, autor, { x: c.vx * 0.85, z: c.vz * 0.85, y: Math.min(9, v * 0.35) });
        if (autor) { this.policia.crimen('atropello', p.pos); this.sacudida = Math.max(this.sacudida, 0.15); }
        this.audio.golpe();
        c.vx *= 0.92; c.vz *= 0.92;
      }
      if (!jug.coche && !jug.muerto && prueba(null, jug.pos.x, jug.pos.z)) {
        if (!this.ultimoGolpeJ || performance.now() - this.ultimoGolpeJ > 700) {
          this.ultimoGolpeJ = performance.now();
          jug.recibir(v * 1.6);
          jug.pos.x += c.vx * 0.12 + (jug.pos.x - c.pos.x) * 0.3; jug.pos.z += c.vz * 0.12 + (jug.pos.z - c.pos.z) * 0.3;
          this.audio.golpe();
        }
      }
    }
  }

  brazoMoto() {
    const j = this.jugador, p = j.p, c = j.coche;
    const rel = angulo(this.camYaw - c.yaw);
    p.bd.rotation.set(-Math.PI / 2 - this.camPitch * 0.8, Math.max(-1.6, Math.min(1.2, rel)), 0); p.cd.rotation.x = 0;
    p.pistola.visible = j.arma === 'pistola'; p.subfusil.visible = j.arma === 'subfusil'; p.rifle.visible = j.arma === 'rifle'; p.escopeta.visible = j.arma === 'escopeta';
    p.cabeza.rotation.y = Math.max(-1.2, Math.min(1.2, rel));
  }

  objetivoSigilo() {
    const j = this.jugador;
    if (!j.agachado || j.coche || !['puno', 'cuchillo', 'machete', 'llave', 'bate'].includes(j.arma)) return null;
    for (const q of this.peatones) {
      if (q.muerto || q.enInterior || q.estado === 'atacar' || q.estado === 'perseguir' || q.estado === 'huir') continue;
      const dx = j.pos.x - q.pos.x, dz = j.pos.z - q.pos.z, d = Math.hypot(dx, dz);
      if (d > 1.7 || d < 0.2) continue;
      const atras = (dx * Math.sin(q.yaw) + dz * Math.cos(q.yaw)) / d;
      if (atras < -0.35) return q;
    }
    return null;
  }

  origenArma() {
    const j = this.jugador;
    if (j.coche) { const c = j.coche, s = c.tipo === 'moto' ? 0.35 : c.t.ancho / 2 + 0.25, f = Math.sin(this.camYaw), g = Math.cos(this.camYaw); const lado = (f * c.fz - g * c.fx) > 0 ? -1 : 1; return _o.set(c.pos.x + c.fz * s * lado + f * 0.5, (c.y || 0) + (c.tipo === 'moto' ? 1.45 : 1.25), c.pos.z - c.fx * s * lado + g * 0.5).clone(); }
    const fx = Math.sin(j.yaw), fz = Math.cos(j.yaw);
    return _o.set(j.pos.x + fx * 0.7 - fz * 0.3, j.pos.y + 1.4, j.pos.z + fz * 0.7 + fx * 0.3).clone();
  }

  rayoImpacto(origen, dir, alcance, ignorar, desde = 0) {
    let mejor = alcance, golpe = null, tipo = null;
    const esfera = (c, r) => {
      const ox = c.x - origen.x, oy = c.y - origen.y, oz = c.z - origen.z;
      const t = ox * dir.x + oy * dir.y + oz * dir.z;
      if (t < desde || t > mejor) return -1;
      const d2 = ox * ox + oy * oy + oz * oz - t * t;
      if (d2 > r * r) return -1;
      return t - Math.sqrt(r * r - d2);
    };
    for (const p of this.peatones) {
      if (p === ignorar) continue;
      if (Math.abs(p.pos.x - origen.x) > alcance || Math.abs(p.pos.z - origen.z) > alcance) continue;
      const alto = p.muerto ? [0.25] : [0.5, 1.05, 1.55];
      for (const h of alto) {
        const t = esfera(_v.set(p.pos.x, p.y + h, p.pos.z), h === 1.55 ? 0.24 : 0.36);
        if (t > 0 && t < mejor) { mejor = t; golpe = p; tipo = h === 1.55 ? 'cabeza' : 'peaton'; }
      }
    }
    for (const c of this.coches) {
      if (c === ignorar) continue;
      if (Math.abs(c.pos.x - origen.x) > alcance || Math.abs(c.pos.z - origen.z) > alcance) continue;
      for (const s of [-0.28, 0, 0.28]) {
        const t = esfera(_v.set(c.pos.x + c.fx * c.t.largo * s, 0.9, c.pos.z + c.fz * c.t.largo * s), c.t.ancho * 0.55);
        if (t > 0 && t < mejor) { mejor = t; golpe = c; tipo = 'coche'; }
      }
    }
    const h = this.policia.helicoptero;
    if (h && h !== ignorar) { const t = esfera(h.pos, 2.6); if (t > 0 && t < mejor) { mejor = t; golpe = h; tipo = 'heli'; } }
    if (ignorar !== this.jugador && !this.jugador.coche) {
      const jp = this.jugador.pos;
      for (const hh of [0.6, 1.2]) { const t = esfera(_v.set(jp.x, this.jugador.y + hh, jp.z), 0.42); if (t > 0 && t < mejor) { mejor = t; golpe = this.jugador; tipo = 'jugador'; } }
    }
    const tm = this.mundo.rayo(origen.x, origen.y, origen.z, origen.x + dir.x * mejor, origen.y + dir.y * mejor, origen.z + dir.z * mejor, 0.2);
    if (tm < 1) { mejor = mejor * tm; golpe = null; tipo = 'pared'; }
    if (dir.y < 0) { const t = -origen.y / dir.y; if (t > 0 && t < mejor) { mejor = t; golpe = null; tipo = 'suelo'; } }
    return { t: mejor, golpe, tipo, punto: origen.clone().addScaledVector(dir, mejor) };
  }

  disparar() {
    const j = this.jugador;
    if (j.cadencia > 0 || j.recargando > 0 || j.muerto || this.rueda.abierta) return;
    const a = ARMAS[j.arma];
    j.disparando = true; j.tDisparo = 0.6;
    if (a.tipo === 'golpe') {
      const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw);
      const victima = this.objetivoSigilo();
      if (victima) {
        j.cadencia = 0.9; j.golpeT = 0.7; j.golpeDur = 0.7; j.sigilo = true; j.combo = 0;
        j.yaw = Math.atan2(victima.pos.x - j.pos.x, victima.pos.z - j.pos.z);
        victima.recibir(999, null, 'sigilo');
        this.estadisticas.sumar('sigilos');
        this.hud.notificar('ok', 'Derribo silencioso', 'Nadie se dio cuenta.', 1.8);
        this.audio.golpe(false);
        return;
      }
      const ahora = performance.now() / 1000;
      j.combo = ahora - (j.ultimoGolpe || 0) < 0.75 ? ((j.combo || 0) + 1) % 3 : 0;
      j.ultimoGolpe = ahora;
      const fin = j.combo === 2;
      j.cadencia = a.cadencia * (fin ? 1.4 : 0.85); j.golpeT = fin ? 0.4 : 0.3; j.golpeDur = j.golpeT;
      j.yaw = this.camYaw;
      let golpes = 0;
      const candidatos = this.peatones.filter(p => !p.muerto).map(p => {
        const dx = p.pos.x - j.pos.x, dz = p.pos.z - j.pos.z, d = Math.hypot(dx, dz);
        return { p, d, frente: (dx * fx + dz * fz) / (d || 1) };
      }).filter(c => c.d < a.alcance && c.frente > 0.35).sort((x, y) => x.d - y.d).slice(0, j.arma === 'bate' ? 3 : 1);
      for (const c of candidatos) {
        const mult = fin ? (j.arma === 'puno' ? 2.2 : 1.5) : 1;
        c.p.recibir(a.daño * (1 + j.bonoGolpe) * mult, j.pos, 'jugador', { x: fx * a.empuje * mult, z: fz * a.empuje * mult, y: j.arma === 'bate' || fin ? 3 : 0 });
        golpes++;
      }
      if (j.arma === 'bate') for (const c of this.coches) {
        const d = c.pos.distanceTo(j.pos);
        if (d < c.t.largo * 0.5 + 1.6 && ((c.pos.x - j.pos.x) * fx + (c.pos.z - j.pos.z) * fz) > 0) { c.dañar(9, 'golpe', 'jugador'); golpes++; this.chispa(new THREE.Vector3(j.pos.x + fx * 1.4, 1, j.pos.z + fz * 1.4), '#ffd27a'); if (c.conductor === 'ia') c.panico = 5; }
      }
      setTimeout(() => this.audio.golpe(golpes > 0), 90);
      if (golpes) { this.hud.golpeMira(); this.sacudida = Math.max(this.sacudida, 0.12); }
      return;
    }
    const s = j.armas[j.arma];
    if (a.tipo === 'lanzar') {
      if (s.reserva <= 0) { this.hud.notificar('alerta', 'Sin granadas', 'Compra más en la Armería.'); return; }
      s.reserva--;
      j.cadencia = a.cadencia; j.golpeT = 0.3; j.yaw = this.camYaw;
      this.granadaPendiente = 0.14; this.granadaTipo = j.arma;
      this.estadisticas.sumar('granadas');
      if (s.reserva <= 0) setTimeout(() => j.cambiarArma(-1), 400);
      return;
    }
    if (s.cargador <= 0) { j.recargar(); return; }
    s.cargador--;
    j.cadencia = a.cadencia;
    if (a.tipo === 'cohete') {
      const cam = this.camara, dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      const r = this.rayoImpacto(cam.position, dir, 200, j.coche || this.jugador, cam.position.distanceTo(j.coche ? j.coche.pos : j.pos) + 1);
      const boca = this.origenArma(), v = r.punto.clone().sub(boca).normalize();
      this.cohete(boca, v);
      this.fogonazo(boca, 2.2); this.audio.disparo('lanzacohetes', j.posicion);
      this.sacudida = Math.max(this.sacudida, 0.25); this.retroceso = (this.retroceso || 0) + 0.06;
      this.policia.crimen('disparo', j.posicion);
      if (s.cargador <= 0) j.recargar();
      return;
    }
    this.estadisticas.sumar('disparos');
    const cam = this.camara;
    const base = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    if (j.coche) {
      let mejor = null, ma = 0.12;
      const o = cam.position;
      for (const q of this.peatones) {
        if (q.muerto || q.enInterior) continue;
        const dx = q.pos.x - o.x, dy = q.y + 1.1 - o.y, dz = q.pos.z - o.z, d = Math.hypot(dx, dy, dz);
        if (d > 55 || d < 2) continue;
        const ang = Math.acos(Math.max(-1, Math.min(1, (dx * base.x + dy * base.y + dz * base.z) / d)));
        if (ang < ma) { ma = ang; mejor = [dx / d, dy / d, dz / d]; }
      }
      if (mejor) base.set(mejor[0], mejor[1], mejor[2]);
    }
    const desde = cam.position.distanceTo(j.coche ? j.coche.pos : j.pos) + (j.coche ? j.coche.t.largo * 0.3 : 0.3);
    const boca = this.origenArma();
    const n = a.perdigones || 1;
    let pego = false;
    for (let k = 0; k < n; k++) {
      const dir = base.clone();
      const disp = a.disp * (j.apunta ? 0.5 : 1.4) * (j.velocidad > 3 ? 1.6 : 1) * (n > 1 ? 0.75 : 1);
      dir.x += (Math.random() - 0.5) * disp; dir.y += (Math.random() - 0.5) * disp; dir.z += (Math.random() - 0.5) * disp;
      dir.normalize();
      const r = this.rayoImpacto(cam.position, dir, a.alcance + desde, j.coche || this.jugador, desde);
      const tb = this.mundo.rayo(boca.x, boca.y, boca.z, r.punto.x, r.punto.y, r.punto.z, 0.2);
      if (tb < 0.97) { r.punto.lerpVectors(boca, r.punto, tb); r.golpe = null; r.tipo = 'pared'; }
      const pf = this.fisica.balazo(boca, r.punto, a.daño); if (pf && !r.golpe) this.chispa(pf, '#e8dcc0');
      if (!r.golpe && this.gasolinera?.impacto(r.punto, a.daño)) { this.chispa(r.punto, '#ffd27a'); pego = true; }
      this.trazo(boca, r.punto, n > 1 ? '#ffcf8a' : '#ffe9a8');
      if (r.golpe instanceof Peaton) { r.golpe.recibir(a.daño * (r.tipo === 'cabeza' ? 2.5 : 1), j.pos, 'jugador', { x: dir.x * (n > 1 ? 4 : 2), z: dir.z * (n > 1 ? 4 : 2), y: n > 1 ? 2 : 0 }); this.sangre(r.punto); pego = true; if (r.tipo === 'cabeza' && r.golpe.muerto) this.hud.golpeMira(true); }
      else if (r.golpe instanceof Coche) { if (r.punto.y > 1.05 && Math.random() < 0.25 && !r.golpe.vidrioRoto && r.golpe.partes[1] && r.golpe.tipo !== 'moto') { r.golpe.vidrioRoto = true; r.golpe.partes[1].material = r.golpe.constructor.vidrioRoto || r.golpe.partes[1].material; } r.golpe.dañar(a.daño * 0.45, 'bala', 'jugador'); this.chispa(r.punto, '#ffd27a'); pego = true; if (r.golpe.conductor === 'ia') r.golpe.panico = 6; if (r.golpe.tipo === 'policia' && r.golpe.conductor) this.policia.crimen('herirPoli', r.golpe.pos); }
      else if (r.tipo === 'heli') { r.golpe.vida = (r.golpe.vida || 100) - a.daño * 0.3; this.chispa(r.punto, '#ffd27a'); pego = true; if (r.golpe.vida <= 0) this.derribarHeli(); }
      else if (k < 3) this.chispa(r.punto, '#d8d0c0');
    }
    if (pego) { this.hud.golpeMira(); this.estadisticas.sumar('aciertos'); }
    this.fogonazo(boca, n > 1 ? 1.6 : 1);
    this.audio.disparo(j.arma, j.pos);
    this.retroceso = (this.retroceso || 0) + (n > 1 ? 0.05 : j.arma === 'subfusil' ? 0.008 : 0.018);
    this.sacudida = Math.max(this.sacudida, n > 1 ? 0.12 : 0.03);
    this.policia.crimen('disparo', j.posicion);
    this.animales.asustar(j.posicion.x, j.posicion.z, 35);
    for (const p of this.peatones) if (p.pos.distanceTo(j.posicion) < 30) p.asustar(j.posicion.x, j.posicion.z, 1);
    for (const c of this.coches) if (c.conductor === 'ia' && c.pos.distanceTo(j.posicion) < 30) c.panico = 5;
    if (s.cargador <= 0) j.recargar();
  }

  sangre(p) { this.chispa(p, '#b0102a'); }

  derribarHeli() {
    const h = this.policia.helicoptero;
    if (!h) return;
    this.explosion(h.pos.x, h.pos.y, h.pos.z, 'jugador');
    this.explosion(h.pos.x, 1, h.pos.z, 'jugador');
    this.escena.remove(h.grupo); this.escena.remove(h.foco);
    this.policia.helicoptero = null;
    this.policia.subir(this.policia.estrellas + 1);
    this.hud.aviso('¡Derribaste el helicóptero!', 3);
  }

  disparoEnemigo(tirador, objetivo) {
    const j = this.jugador;
    const boca = _v.set(tirador.pos.x + Math.sin(tirador.yaw) * 0.6, 1.4, tirador.pos.z + Math.cos(tirador.yaw) * 0.6).clone();
    const d = tirador.pos.distanceTo(objetivo);
    let prob = tirador.arma === 'subfusil' ? 0.28 : tirador.tipo === 'poli' ? 0.3 : 0.36;
    if (d < 8) prob *= 1.4; else if (d > 15) prob *= 0.7;
    if (j.coche && j.coche.vel > 6) prob *= 0.5;
    if (j.agachado) prob *= 0.55;
    if (j.rueda) prob *= 0.15;
    if (j.velocidad > 5) prob *= 0.7;
    const meta = new THREE.Vector3(objetivo.x, 1.1, objetivo.z);
    const dir = meta.clone().sub(boca).normalize();
    const r = this.rayoImpacto(boca, dir, d + 1, tirador, 0.2);
    const pega = Math.random() < prob && (r.golpe === j || r.golpe === j.coche || (j.coche && r.golpe === null && r.tipo !== 'pared'));
    let fin = r.punto;
    if (!pega) { fin = meta.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.3) * 1.5, (Math.random() - 0.5) * 3)); }
    this.trazo(boca, fin, '#ffd0a0');
    this.audio.disparo(tirador.arma, tirador.pos);
    if (pega) {
      const daño = tirador.arma === 'subfusil' ? 5 : 8;
      if (j.coche) { j.coche.dañar(daño * 0.8); j.recibir(daño * 0.25, tirador.pos); }
      else j.recibir(daño, tirador.pos);
    } else if (r.golpe instanceof Peaton && r.golpe !== tirador && r.golpe.tipo === 'civil') r.golpe.recibir(10, tirador.pos, null);
    for (const p of this.peatones) if (p.tipo === 'civil' && p.pos.distanceTo(tirador.pos) < 25) p.asustar(tirador.pos.x, tirador.pos.z, 1);
    return r.golpe === j || (j.coche && r.golpe === j.coche) || r.t >= d - 0.8;
  }

  disparoDesde(pos, objetivo, daño, prob, arma) {
    const j = this.jugador;
    const fin = new THREE.Vector3(objetivo.x + (Math.random() - 0.5) * 4, 0.2, objetivo.z + (Math.random() - 0.5) * 4);
    if (Math.random() < prob) { if (j.coche) { j.coche.dañar(daño); j.recibir(daño * 0.3); } else j.recibir(daño); fin.set(objetivo.x, 1, objetivo.z); }
    this.trazo(pos.clone().add(new THREE.Vector3(0, -1.3, 0)), fin, '#ffe0a0');
    this.chispa(fin, '#d8d0c0');
    this.audio.disparo(arma, pos);
  }

  alMorirPeaton(p, autor) {
    if (!p.objetivoMision && p.dinero && Math.random() < 0.7) this.crearRecogible('dinero', p.pos.x + 0.6, p.pos.z + 0.4, false, p.dinero);
    if (p.tipo === 'poli' && Math.random() < 0.5) this.crearRecogible('municion', p.pos.x - 0.6, p.pos.z, false);
    if (p.tipo === 'matón') this.crearRecogible('municion', p.pos.x - 0.6, p.pos.z, false);
    for (const q of this.peatones) if (q !== p && q.pos.distanceTo(p.pos) < 22) q.asustar(p.pos.x, p.pos.z, 2);
  }

  explosion(x, y, z, autor, origen) {
    this.gasolinera?.onda(x, z);
    const E = this.escena, tex = this.humoTex;
    for (let i = 0; i < 11; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: i < 3 ? '#fff2c0' : i < 7 ? '#ffa23a' : '#ff5a1a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const a = Math.random() * 6.28, r = Math.random() * 1.6, vy = 2 + Math.random() * 4, ret = i * 0.025, tam = 2 + Math.random() * 2.5;
      s.position.set(x + Math.cos(a) * r, y + 0.6 + Math.random(), z + Math.sin(a) * r); s.scale.setScalar(0.1);
      E.add(s);
      const vida = 0.7 + Math.random() * 0.5;
      this.efectos.push({ vida, max: vida, malla: s, act: (e, dt) => { const k = 1 - e.vida / e.max; if (k < ret) return; s.position.y += vy * dt; s.scale.setScalar(tam * (0.4 + Math.min(1, k * 3) * 1.6)); s.material.opacity = Math.min(1, (1 - k) * 1.6); s.material.color.lerp(this._cHumo || (this._cHumo = new THREE.Color('#5a2a10')), dt * 2.2); } });
    }
    const onda = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    onda.position.set(x, 0.12, z); E.add(onda);
    this.efectos.push({ vida: 0.45, max: 0.45, malla: onda, act: (e) => { const k = 1 - e.vida / e.max; onda.scale.setScalar(1 + k * 14); onda.material.opacity = 0.7 * (1 - k); }, fin: () => onda.geometry.dispose() });
    const geoChunk = this._chunk || (this._chunk = new THREE.BoxGeometry(0.22, 0.12, 0.3));
    const matChunk = this._matChunk || (this._matChunk = new THREE.MeshStandardMaterial({ color: '#2a2724', roughness: 0.8, metalness: 0.3 }));
    for (let i = 0; i < 12; i++) {
      const k = new THREE.Mesh(geoChunk, matChunk); k.castShadow = true;
      const a = Math.random() * 6.28, v = 5 + Math.random() * 9;
      const vel = new THREE.Vector3(Math.cos(a) * v, 5 + Math.random() * 9, Math.sin(a) * v), giro = new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12);
      k.position.set(x, y + 1, z); k.scale.setScalar(0.6 + Math.random() * 1.4);
      E.add(k);
      if (this.fisica.escombro(k, vel, giro, 5 + Math.random() * 4)) continue;
      this.efectos.push({ vida: 3 + Math.random(), max: 4, malla: k, act: (e, dt) => { vel.y -= 22 * dt; k.position.addScaledVector(vel, dt); if (k.position.y < 0.06) { k.position.y = 0.06; vel.y *= -0.35; vel.x *= 0.6; vel.z *= 0.6; giro.multiplyScalar(0.6); } k.rotation.x += giro.x * dt; k.rotation.y += giro.y * dt; k.rotation.z += giro.z * dt; if (e.vida < 0.5) k.scale.multiplyScalar(1 - dt * 3); }, sinDispose: true });
    }
    const n = 26, pos = new Float32Array(n * 3), vels = [];
    for (let i = 0; i < n; i++) { pos.set([x, y + 1, z], i * 3); const a = Math.random() * 6.28, v = 8 + Math.random() * 14; vels.push([Math.cos(a) * v, 4 + Math.random() * 12, Math.sin(a) * v]); }
    const gch = new THREE.BufferGeometry(); gch.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const chispas = new THREE.Points(gch, new THREE.PointsMaterial({ color: '#ffcf6a', size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    E.add(chispas);
    this.efectos.push({ vida: 1.1, max: 1.1, malla: chispas, act: (e, dt) => { for (let i = 0; i < n; i++) { vels[i][1] -= 18 * dt; pos[i * 3] += vels[i][0] * dt; pos[i * 3 + 1] = Math.max(0.05, pos[i * 3 + 1] + vels[i][1] * dt); pos[i * 3 + 2] += vels[i][2] * dt; } gch.attributes.position.needsUpdate = true; chispas.material.opacity = e.vida / e.max; }, fin: () => gch.dispose() });
    for (let i = 0; i < 10; i++) this.humo(x + (Math.random() - 0.5) * 3, y + 1.5 + Math.random() * 3, z + (Math.random() - 0.5) * 3, 2.6 + Math.random() * 2, i < 4 ? '#4a4440' : '#2a2826', 3.5 + Math.random() * 2);
    const quem = new THREE.Mesh(new THREE.CircleGeometry(2.6 + Math.random(), 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, color: '#000000', transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    quem.position.set(x, 0.04, z); quem.rotation.y = Math.random() * 6; E.add(quem);
    this.efectos.push({ vida: 25, max: 25, malla: quem, act: (e) => { if (e.vida < 5) quem.material.opacity = 0.75 * e.vida / 5; }, fin: () => quem.geometry.dispose() });
    const flash = new THREE.PointLight('#ff9a40', 120, 55, 1.4);
    flash.position.set(x, y + 2.5, z);
    E.add(flash);
    this.efectos.push({ vida: 0.7, max: 0.7, malla: flash, act: (e) => { flash.intensity = 120 * Math.pow(e.vida / e.max, 1.5) * (0.8 + Math.random() * 0.4); } });
    if (origen && origen.vy !== undefined) { origen.vy = 6 + Math.random() * 3; origen.giroExplosion = (Math.random() - 0.5) * 3; }
    const fl = document.getElementById('flash'); if (fl && Math.hypot(this.jugador.posicion.x - x, this.jugador.posicion.z - z) < 30) { fl.classList.remove('on', 'boom'); void fl.offsetWidth; fl.classList.add('boom'); }
    this.audio.explosion({ x, z });
    const jp = this.jugador.posicion;
    const dj = Math.hypot(jp.x - x, jp.z - z);
    this.sacudida = Math.max(this.sacudida, Math.max(0, 1 - dj / 60) * 0.9);
    if (dj < 8) this.jugador.recibir((1 - dj / 8) * 70);
    for (const p of this.peatones) {
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d < 8) p.recibir((1 - d / 8) * 140, { x, z }, autor, { x: (p.pos.x - x) / (d || 1) * 9, z: (p.pos.z - z) / (d || 1) * 9, y: 7 });
      else if (d < 35) p.asustar(x, z, 2);
    }
    for (const c of this.coches) {
      if (c === origen) continue;
      const d = Math.hypot(c.pos.x - x, c.pos.z - z);
      if (d < 7) { c.dañar((1 - d / 7) * 90, 'explosion', autor); c.vx += (c.pos.x - x) / (d || 1) * 6; c.vz += (c.pos.z - z) / (d || 1) * 6; if (c.vy !== undefined && c.tipo !== 'blindado') c.vy = Math.max(c.vy, (1 - d / 7) * 5); }
    }
    if (autor === 'jugador') { this.policia.crimen('explosion', new THREE.Vector3(x, 0, z)); this.redes?.publicar('explosion'); }
    this.animales?.asustar(x, z, 50);
    this.fisica.onda(x, y, z, 13, 10);
  }

  trazo(a, b, color) {
    const g = new THREE.BufferGeometry().setFromPoints([a, b]);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    this.escena.add(l);
    this.efectos.push({ vida: 0.07, max: 0.07, malla: l, act: (e) => { l.material.opacity = e.vida / e.max; }, fin: () => g.dispose() });
  }

  fogonazo(p, k = 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.humoTex, color: '#ffd27a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(p); s.scale.setScalar(0.9 * k);
    if (!this.luzFogonazo) { this.luzFogonazo = new THREE.PointLight('#ffc070', 0, 9, 2); this.escena.add(this.luzFogonazo); }
    this.luzFogonazo.position.copy(p); this.luzFogonazo.intensity = 14 * k;
    this.escena.add(s);
    this.efectos.push({ vida: 0.05, max: 0.05, malla: s });
  }

  chispa(p, color) {
    const n = 8, pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set([p.x, p.y, p.z], i * 3); vel.push((Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.12, transparent: true }));
    this.escena.add(m);
    this.efectos.push({ vida: 0.35, max: 0.35, malla: m, act: (e, dt) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { vel[i * 3 + 1] -= 18 * dt; a[i * 3] += vel[i * 3] * dt; a[i * 3 + 1] += vel[i * 3 + 1] * dt; a[i * 3 + 2] += vel[i * 3 + 2] * dt; } g.attributes.position.needsUpdate = true; m.material.opacity = e.vida / e.max; }, fin: () => g.dispose() });
  }

  humo(x, y, z, tam, color, vida = 2) {
    if (this.efectos.length > 220) return;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.humoTex, color, transparent: true, opacity: 0.6, depthWrite: false }));
    s.position.set(x, y, z); s.scale.setScalar(tam);
    this.escena.add(s);
    this.efectos.push({ vida, max: vida, malla: s, act: (e, dt) => { s.position.y += dt * 1.6; s.scale.multiplyScalar(1 + dt * 0.6); s.material.opacity = 0.6 * e.vida / e.max; } });
  }

  fuego(x, y, z) {
    if (this.efectos.length > 220) return;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.humoTex, color: Math.random() < 0.5 ? '#ff7a1a' : '#ffc43a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.set(x + (Math.random() - 0.5) * 0.8, y, z + (Math.random() - 0.5) * 0.8); s.scale.setScalar(0.8 + Math.random() * 0.6);
    this.escena.add(s);
    this.efectos.push({ vida: 0.5, max: 0.5, malla: s, act: (e, dt) => { s.position.y += dt * 2.4; s.material.opacity = e.vida / e.max; } });
  }

  morirJugador() {
    const j = this.jugador;
    if (j.muerto) return;
    if (j.coche) { const c = j.coche; c.conductor = null; j.pos.set(c.pos.x + c.fz * 1.8, 0, c.pos.z - c.fx * 1.8); j.coche = null; if (c.tipo === 'moto' || c.tipo === 'lancha') this.escena.add(j.grupo); }
    j.muerto = 0.001;
    if (!j.interior) { j.grupo.position.set(j.pos.x, 0, j.pos.z); j.grupo.visible = true; const a = Math.random() * 6.28; j.muneco = this.fisica.muneco(j.p, { x: Math.cos(a) * 1.2, y: 0.5, z: Math.sin(a) * 1.2 }, 1.2); }
    this.estadisticas.sumar('muertes');
    if (this.actividades.taxi) this.actividades.terminarTaxi('Caíste.');
    this.audio.motor(0, false); this.audio.radioActiva(false);
    const perdida = 100 + Math.floor(j.dinero * 0.15);
    this.hud.grande('¡TE FUISTE!', 'Despiertas en el Hospital Civil · perdiste ' + ('$' + perdida.toLocaleString('es-MX')) + ' en efectivo', 4.5, 'muerte');
    this.escalaTiempoObj = 0.35;
    if (this.misiones.activa) setTimeout(() => this.misiones.fallar('Caíste en plena misión.'), 600);
    setTimeout(() => {
      const h = this.ciudad.lugares.hospital;
      j.revivir(h.x, h.z);
      j.dinero = Math.max(0, j.dinero - perdida);
      this.hud.popDinero(-perdida);
      this.policia.limpiar();
      this.camYaw = Math.PI; this.escalaTiempoObj = 1;
      for (const a of j.armas ? Object.values(j.armas) : []) a.reserva = Math.floor(a.reserva * 0.7);
    }, 4200);
  }

  arrestar() {
    const j = this.jugador;
    if (j.muerto) return;
    j.muerto = 0.001;
    j.arrestado = true; j.agachado = false; j.gesto = null;
    for (const a of this.policia.agentes) if (!a.muerto && a.pos.distanceTo(j.pos) < 12) { a.estado = 'quieto'; a.yaw = Math.atan2(j.pos.x - a.pos.x, j.pos.z - a.pos.z); a.retenido = true; }
    this.hud.burbuja?.(this.policia.agentes.find(a => !a.muerto && a.pos.distanceTo(j.pos) < 12) || j, ['¡Las manos donde las vea!', '¡Al suelo, ya!', '¡Quieto, policía!'][Math.random() * 3 | 0]);
    this.estadisticas.sumar('arrestos');
    this.hud.grande('¡ARRESTADO!', 'Sales de la comisaría · -$250', 4.5, 'arresto');
    if (this.misiones.activa) setTimeout(() => this.misiones.fallar('Te arrestaron.'), 600);
    setTimeout(() => {
      const c = this.ciudad.lugares.comisaria;
      j.revivir(c.x, c.z + 2);
      j.dinero = Math.max(0, j.dinero - 250);
      this.hud.popDinero(-250);
      this.policia.limpiar();
      for (const a of Object.values(j.armas)) a.reserva = Math.floor(a.reserva / 2);
    }, 4200);
  }
  revisarArresto(dt) {
    const j = this.jugador;
    if (j.coche || j.muerto || this.policia.estrellas === 0) { this.tArresto = 0; return; }
    let cerca = false;
    for (const a of this.policia.agentes) if (!a.muerto && a.pos.distanceTo(j.pos) < 1.6) cerca = true;
    if (cerca && j.velocidad < 2.5 && this.policia.estrellas <= 1) this.tArresto = (this.tArresto || 0) + dt;
    else this.tArresto = Math.max(0, (this.tArresto || 0) - dt * 0.5);
    if (this.tArresto > 1.4) { this.tArresto = 0; this.arrestar(); }
  }

  revisarPintura(dt) {
    const j = this.jugador, p = this.ciudad.lugares.pintura;
    const c = j.coche;
    if (!c) { this.enPintura = false; return; }
    const dentro = Math.hypot(c.pos.x - p.x, c.pos.z - p.z) < 5;
    if (dentro && !this.enPintura) {
      this.enPintura = true;
      if (this.policia.estrellas === 0 && c.salud >= c.t.salud) { this.hud.notificar('tienda', 'Pintura Express', 'Tu coche está perfecto, no hace falta.', 3); return; }
      const precio = 250;
      if (j.dinero < precio) { this.hud.notificar('alerta', 'Pintura Express', 'Cuesta $250 y no te alcanza.', 3); return; }
      j.dinero -= precio;
      c.salud = c.t.salud;
      c.pinta.color.set(['#2e86de', '#27ae60', '#8e44ad', '#f1c40f', '#e67e22', '#ecf0f1'][Math.random() * 6 | 0]);
      this.policia.limpiar();
      this.audio.dinero();
      this.hud.grande('COMO NUEVO', 'Pintura y reparación · -$250', 2.5, 'exito');
      this.hud.popDinero(-250);
    } else if (!dentro) this.enPintura = false;
  }

  recogibles_(dt) {
    const j = this.jugador, t = performance.now() / 1000;
    const p = j.coche ? j.coche.pos : j.pos;
    for (let i = this.recogibles.length - 1; i >= 0; i--) {
      const r = this.recogibles[i];
      if (r.tomado) {
        if (!r.fijo) { this.escena.remove(r.malla); this.recogibles.splice(i, 1); continue; }
        r.espera -= dt;
        if (r.espera <= 0) { r.tomado = false; r.malla.visible = true; }
        continue;
      }
      r.malla.rotation.y = t * 2;
      r.malla.position.y = 1 + Math.sin(t * 3 + r.x) * 0.15;
      if (!r.fijo) { r.vida = (r.vida ?? 40) - dt; if (r.vida <= 0 && r.tipo !== 'sobre') { r.tomado = true; continue; } }
      const d = Math.hypot(p.x - r.x, p.z - r.z);
      if (d > (j.coche ? 2.6 : 1.3) || j.muerto) continue;
      if (j.coche && r.tipo !== 'dinero' && r.tipo !== 'sobre') continue;
      let ok = true;
      if (r.tipo === 'salud') { if (j.salud >= j.saludMax) ok = false; else { j.salud = Math.min(j.saludMax, j.salud + 50); this.hud.notificar('ok', 'Salud +50', '', 2); } }
      else if (r.tipo === 'chaleco') { if (j.chaleco >= 100) ok = false; else { j.chaleco = Math.min(100, j.chaleco + 60); this.hud.notificar('coche', 'Chaleco +60', '', 2); } }
      else if (r.tipo === 'municion') { if (j.armas.pistola) j.armas.pistola.reserva += 24; else j.darArma('pistola', 24); if (j.armas.subfusil) j.armas.subfusil.reserva += 45; if (j.armas.escopeta) j.armas.escopeta.reserva += 6; this.hud.notificar('tienda', 'Balas', 'Recogiste munición.', 2); }
      else if (r.tipo === 'dinero') { const n = r.cantidad || 50; j.dinero += n; this.hud.popDinero(n); this.estadisticas.sumar('ganado', n); }
      else if (r.tipo === 'sobre') { this.hud.notificar('mision', 'Tienes el sobre', '', 2.5); }      if (!ok) continue;
      this.audio.dinero();
      r.tomado = true; r.malla.visible = false; r.espera = 60;
    }
  }

  gestor() {
    const j = this.jugador, p = j.posicion;
    const fwdx = Math.sin(this.camYaw), fwdz = Math.cos(this.camYaw);
    let trafico = 0;
    for (let i = this.coches.length - 1; i >= 0; i--) {
      const c = this.coches[i];
      if (c === j.coche || c.marcado || c.conductor === 'rival') continue;
      const d = c.pos.distanceTo(p);
      const visible = ((c.pos.x - p.x) * fwdx + (c.pos.z - p.z) * fwdz) / (d || 1) > 0.2 && d < 140;
      if (c.conductor === 'ia') trafico++;
      if (c.quemado) { c.quemado += 0.5; if ((c.quemado > 45 && !visible) || d > 220) { c.quitar(); this.coches.splice(i, 1); } continue; }
      if (c.conductor === 'ia' && (d > 200 || (c.trabado > 16 && d > 45)) && !visible) {
        c.trabado = 0; c.rodeo = 0;
        const q = puntoCalleAleatorio(p, 95, 170);
        if (q && Math.hypot(q.x - p.x, q.z - p.z) > 0) {
          const vis = ((q.x - p.x) * fwdx + (q.z - p.z) * fwdz) / Math.hypot(q.x - p.x, q.z - p.z) > 0.3;
          if (!vis) { c.pos.set(q.x, 0, q.z); c.yaw = q.yaw; c.vx = Math.sin(q.yaw) * 8; c.vz = Math.cos(q.yaw) * 8; c.ia = nuevaRutaIA(q.x, q.z, q.yaw); c.salud = c.t.salud; }
        }
      }
      if (!c.conductor && d > 260 && !this.ciudad.estacionados.some(e => Math.hypot(e.x - c.pos.x, e.z - c.pos.z) < 3)) { c.quitar(); this.coches.splice(i, 1); }
    }
    if (trafico < TRAFICO) { const q = puntoCalleAleatorio(p, 110, 170); if (q) this.nuevoTrafico(q); }
    let civiles = 0;
    for (let i = this.peatones.length - 1; i >= 0; i--) {
      const q = this.peatones[i];
      const d = q.pos.distanceTo(p);
      if (q.objetivoMision || this.misiones.extra.includes(q)) continue;
      if (q.tipo === 'civil') civiles++;
      if ((q.muerto > 25 || (q.muerto && d > 120)) || (q.tipo !== 'civil' && q.retirar && d > 80) || (q.tipo === 'poli' && d > 200)) { q.quitar(); this.peatones.splice(i, 1); continue; }
      if (q.tipo === 'civil' && !q.muerto && d > 140) {
        const lista = this.ciudad.bloques.filter(b => { const e = Math.hypot(b.cx - p.x, b.cz - p.z); return e > 60 && e < 120; });
        if (lista.length) { q.asignarBloque(lista[Math.random() * lista.length | 0]); q.estado = 'pasear'; q.miedo = 0; }
      }
    }
    for (let k = civiles; k < PEATONES; k++) this.nuevoPeaton(p, 60, 120);
  }

  actualizarCamara(dt) {
    const j = this.jugador, cam = this.camara;
    if (this.tren?.viaje) { this.tren.camara(cam, dt); return; }
    this.tMouse += dt;
    let objetivo, dist, hombro, fov = 64, alto = 0.2;
    this.retroceso = Math.max(0, this.retroceso - dt * 0.25);
    if (this.retroceso > 0) this.camPitch = Math.min(0.75, this.camPitch + this.retroceso * dt * 6);
    if (j.coche) {
      const c = j.coche;
      if (this.tMouse > 1.4) {
        const atras = c.adelante < -3;
        const meta = c.yaw + (atras ? Math.PI : 0);
        this.camYaw += angulo(meta - this.camYaw) * Math.min(1, dt * 3.2);
        this.camPitch += ((c.enAire ? -0.32 : -0.16) - this.camPitch) * Math.min(1, dt * 2.5);
      }
      const k = Math.min(1, c.vel / 40);
      const modo = this.modoCam;
      dist = modo === 0 ? 7.4 + k * 2.6 + (c.tipo === 'camioneta' ? 0.8 : 0) : modo === 1 ? 4.8 + k * 1.2 : 0.01;
      if (j.apunta && modo !== 2) dist = c.tipo === 'moto' ? 3.2 : 4.8;
      if (c.enAire && modo !== 2) dist += 3;
      if (c.tipo === 'moto' && modo !== 2) dist *= 0.72;
      if (c.tipo === 'blindado' && modo !== 2) dist *= 1.35;
      hombro = j.apunta && modo !== 2 ? 0.6 : 0;
      objetivo = modo === 2 ? _w.set(c.pos.x + c.fx * 0.2, c.y + 1.25, c.pos.z + c.fz * 0.2) : _w.set(c.pos.x, c.y + (j.apunta ? 1.35 : 1.7), c.pos.z);
      if (modo === 2) alto = 0;
      fov = 64 + k * 18 + (c.turbo ? 10 : 0);
    } else {
      dist = j.apunta ? 2.2 : 4.2; hombro = (j.apunta ? 0.78 : 0.55) * (this.hombroIzq ? -1 : 1);
      objetivo = _w.set(j.pos.x, j.y + 1.55 - (j.agache || 0) * 0.42, j.pos.z);
      if (j.apunta) fov = 48;
      if (j.apunta && ARMAS[j.arma]?.zoom) { fov = ARMAS[j.arma].zoom; dist = 0.6; hombro = 0.35 * (this.hombroIzq ? -1 : 1); }
      if (j.muerto) { dist = 6.5; hombro = 0; this.camPitch += (-0.55 - this.camPitch) * dt; this.camYaw += dt * 0.3; }
    }
    const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);
    const fx = Math.sin(this.camYaw) * cp, fy = sp, fz = Math.cos(this.camYaw) * cp;
    const rx = -Math.cos(this.camYaw), rz = Math.sin(this.camYaw);
    let px = objetivo.x - fx * dist + rx * hombro, py = objetivo.y - fy * dist + alto, pz = objetivo.z - fz * dist + rz * hombro;
    const t = dist > 0.5 ? this.mundo.rayo(objetivo.x, objetivo.y, objetivo.z, px, py, pz, 0.35) : 1;
    if (t < 1) { const k = Math.max(0.08, t - 0.06); px = objetivo.x + (px - objetivo.x) * k; py = objetivo.y + (py - objetivo.y) * k; pz = objetivo.z + (pz - objetivo.z) * k; }
    py = Math.max(0.35, py);
    if (j.coche && this.modoCam !== 2) {
      const s = 1 - Math.exp(-dt * 14);
      if (!this.camLista) cam.position.set(px, py, pz);
      cam.position.x += (px - cam.position.x) * s; cam.position.y += (py - cam.position.y) * s; cam.position.z += (pz - cam.position.z) * s;
    } else cam.position.set(px, py, pz);
    this.camLista = true;
    if (this.sacudida > 0) {
      this.sacudida = Math.max(0, this.sacudida - dt * 1.5);
      cam.position.x += (Math.random() - 0.5) * this.sacudida; cam.position.y += (Math.random() - 0.5) * this.sacudida;
    }
    cam.lookAt(cam.position.x + fx, cam.position.y + fy, cam.position.z + fz);
    if (j.coche && this.tMouse > 1.4 && this.modoCam !== 2) cam.lookAt(objetivo.x + fx * 4, objetivo.y + 0.6 + fy * 4, objetivo.z + fz * 4);
    if (j.coche && this.modoCam !== 2) { const c = j.coche; cam.rotateZ(c.giroSuave * Math.min(1, c.vel / 30) * 0.03); }
    if (this.mareo > 0) { const k = Math.min(1, this.mareo / 25), t = performance.now() / 1000; cam.rotateZ(Math.sin(t * 0.9) * 0.09 * k); cam.rotateX(Math.sin(t * 0.63) * 0.03 * k); fov += Math.sin(t * 0.7) * 6 * k; }
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 6);
    cam.updateProjectionMatrix();
  }
  paso(dtReal) {
    const j = this.jugador;
    const enSalto = j.coche?.enAire && this.actividades.aire?.t > 0.25 && j.coche.ultimaRampa && !this.actividades.saltosHechos.has(j.coche.ultimaRampa.id);
    const objetivoT = this.rueda.abierta ? 0.15 : (this.escalaTiempoObj ?? 1) * (enSalto ? 0.45 : 1);
    this.escalaTiempo += (objetivoT - this.escalaTiempo) * Math.min(1, dtReal * 8);
    const dt = dtReal * this.escalaTiempo;
    const ent = this.entrada();
    this.cuadro++;
    this.estadisticas.sumar('tiempo', dtReal);
    if (this.tren?.viaje) this.tren.viajeActualizar(dt);
    else if (!j.coche && !j.muerto) {
      j.apunta = this.boton[2] && !['puno', 'bate', 'cuchillo'].includes(j.arma) && !this.rueda.abierta;
      if (j.tDisparo > 0) { j.tDisparo -= dt; if (j.tDisparo <= 0) j.disparando = false; }
      const caminando = this.entrando && this.avanzarEntrada(dt);
      j.actualizar(dt, this.rueda.abierta || caminando ? { x: 0, y: 0, correr: false, saltar: false } : ent, this.camYaw);
      if (this.entrando) this.poseEntrada();
      if (j.apunta && ['pistola', 'escopeta', 'subfusil', 'rifle'].includes(j.arma) && this.cuadro % 4 === 0) {
        const cp = Math.cos(this.camPitch), fx = Math.sin(this.camYaw) * cp, fz = Math.cos(this.camYaw) * cp;
        for (const q of this.peatones) {
          if (q.tipo !== 'civil' || q.muerto || q.enInterior) continue;
          const dx = q.pos.x - j.pos.x, dz = q.pos.z - j.pos.z, d = Math.hypot(dx, dz);
          if (d < 16 && d > 0.5 && (dx * fx + dz * fz) / d > 0.985) q.rendir();
        }
      }
      if (this.boton[0] && !this.rueda.abierta) this.disparar();
      if (!this.boton[0] && this.cuadro % 6 === 0) { const v = this.objetivoSigilo(); this.pistaSigilo = !!v; }
      if (this.pistaSigilo) this.hud.pista('Clic', 'Derribo silencioso');
      this.pistas();
    } else {
      { const lp = this.limpia?.pista(); if (lp) this.hud.pista('E', lp); }
      const fuego = j.coche && !j.muerto && ARMAS[j.arma]?.tipo !== 'golpe' && ARMAS[j.arma]?.tipo !== 'lanzar';
      j.apunta = !!(fuego && this.boton[2] && !this.rueda.abierta);
      if (j.apunta) this.tMouse = 0;
      if (j.coche) {
        j.cadencia -= dt;
        if (j.recargando > 0) { j.recargando -= dt; if (j.recargando <= 0) { const a = ARMAS[j.arma], s = j.armas[j.arma]; if (a.cargador && s) { const n = Math.min(a.cargador - s.cargador, s.reserva); s.cargador += n; s.reserva -= n; } } }
        if (this.boton[0] && !this.rueda.abierta) { if (fuego) this.disparar(); else if (this.cuadro % 90 === 0) this.hud.notificar('alerta', 'Elige un arma de fuego', 'Con Tab abres la rueda. Clic derecho para apuntar desde el vehículo.', 2.5); }
      }
      j.actualizar(dt, ent, this.camYaw);
      if (j.coche?.tipo === 'moto' && (j.apunta || j.tDisparo > 0)) this.brazoMoto();
      if (j.tDisparo > 0) { j.tDisparo -= dt; if (j.tDisparo <= 0) j.disparando = false; }
    }
    this.sinDaño += dt;
    if (!j.muerto && this.sinDaño > 6 && j.salud < j.saludMax / 2) j.salud = Math.min(j.saludMax / 2, j.salud + dt * 2);
    if (this.mareo > 0) this.mareo = Math.max(0, this.mareo - dt);
    if (j.coche) {
      const c = j.coche;
      const usa = ent.correr && this.nitro > 0.02 && ent.y > 0 && !c.enAire;
      if (usa && !this.nitroAntes) this.audio.nitro();
      this.nitroAntes = usa;
      this.nitro = Math.max(0, Math.min(1, this.nitro + (usa ? -dt / (c.mejoras?.nitro ? 6.4 : 3.2) : dt / 14)));
      c.manejar(dt, ent.y, ent.x, ent.saltar, usa);
      this.audio.motor(Math.min(1, Math.abs(c.adelante) / c.t.vmax + (ent.y ? 0.12 : 0)), true);
      this.estadisticas.sumar('km', c.vel * dt / 1000);
      if (usa && Math.random() < dt * 30) for (const s of [-1, 1]) this.fuego(c.pos.x - c.fx * c.t.largo * 0.52 - c.fz * 0.4 * s, c.y + 0.45, c.pos.z - c.fz * c.t.largo * 0.52 + c.fx * 0.4 * s);
      if (c.derrape > 4.5 && !c.enAire) {
        for (const s of [-1, 1]) this.marca(c.pos.x - c.fx * c.t.largo * 0.31 - c.fz * (c.t.ancho / 2 - 0.12) * s, c.pos.z - c.fz * c.t.largo * 0.31 + c.fx * (c.t.ancho / 2 - 0.12) * s, c.yaw);
        if (Math.random() < dt * 20) this.humo(c.pos.x - c.fx * c.t.largo * 0.35, 0.4, c.pos.z - c.fz * c.t.largo * 0.35, 1.1, '#d8d8d8', 1.2);
        this.audio.derrape?.(Math.min(1, c.derrape / 12));
      } else this.audio.derrape?.(0);
      if (c.quemado) { this.subirBajar(); }
    } else this.audio.derrape?.(0);
    this.actualizarFuego(dt);
    {
      const J = this.jugador, jp = J.posicion;
      let cerca = 0; for (const c of this.coches) if (c.conductor && Math.abs(c.pos.x - jp.x) + Math.abs(c.pos.z - jp.z) < 60) cerca++;
      this.audio.ambiente(this.ambiente.noche, Math.min(1, cerca / 8), this.ambiente.lluvia, !!J.interior);
      if (!J.coche && !J.muerto && J.y < 0.05 && J.velocidad > 1.2) {
        this.fasePaso = (this.fasePaso || 0) + dt * J.velocidad * 0.62;
        if (this.fasePaso > 1) { this.fasePaso = 0; const enPasto = !esCalle(J.pos.x, J.pos.z) && this.ciudad.bloques.some(b => (b.tipo === 'parque' || b.tipo === 'lago') && J.pos.x > b.x0 + 3 && J.pos.x < b.x1 - 3 && J.pos.z > b.z0 + 3 && J.pos.z < b.z1 - 3); this.audio.paso(Math.min(1, J.velocidad / 7), enPasto ? 'pasto' : 'piso'); }
      }
      if (this.policia.estrellas > 0) { this.relojRadio = (this.relojRadio || 6) - dt; if (this.relojRadio <= 0) { this.relojRadio = 8 + Math.random() * 10; this.audio.radioPolicia(J.coche ? 0.6 : 1); this.hud.notificar('estrella', 'Radio de la policía', ['Unidades, sospechoso en ' + this.zonaDe(jp.x, jp.z) + '.', 'Se solicita apoyo, el sospechoso va armado.', 'Cierren el paso en ' + this.calleDe(jp.x, jp.z) + '.', 'Lo tenemos a la vista, procedan con precaución.'][Math.random() * 4 | 0], 2.6); } }
    }
    VIENTO.value += dt * (1 + this.ambiente.lluvia * 1.5);
    if (this.ciudad.agua) this.ciudad.agua.material.normalMap.offset.set(VIENTO.value * 0.011, VIENTO.value * 0.007);
    this.azoteas?.actualizar(dt, this.ambiente.noche);
    this.tallerDeco?.actualizar(this.ambiente.noche);
    this.tren?.actualizar(dt, this.ambiente.noche);
    this.aviones?.actualizar(dt, this.ambiente.noche);
    this.gasolinera?.actualizar(dt, this.ambiente.noche);
    this.hidrantes?.actualizar(dt);
    this.papelPicado?.actualizar(this.ambiente.noche);
    this.limpia?.actualizar(dt);
    if (this.granadaPendiente > 0) { this.granadaPendiente -= dt; if (this.granadaPendiente <= 0) this.granadas.lanzar(this.origenArma(), this.granadaTipo); }
    if (this.luzFogonazo) this.luzFogonazo.intensity = Math.max(0, this.luzFogonazo.intensity - dtReal * 300);
    for (const c of this.coches) {
      if (c !== j.coche) this.actualizarIA(c, dt);
      c.fisica(dt);
      if (c.salud < 35 && !c.quemado && Math.random() < dt * (c.salud < 15 ? 12 : 4) && c.pos.distanceTo(j.posicion) < 90) this.humo(c.pos.x + c.fx * c.t.largo * 0.4, c.y + 1.2, c.pos.z + c.fz * c.t.largo * 0.4, 0.9, c.salud < 15 ? '#222' : '#888', 1.5);
      if (c.salud < 12 && !c.quemado) { c.fuego = (c.fuego || 0) + dt; if (Math.random() < dt * 14) this.fuego(c.pos.x + c.fx * c.t.largo * 0.4, c.y + 1.1, c.pos.z + c.fz * c.t.largo * 0.4); if (c.fuego > 5) c.explotar(c.golpeadoPorJugador ? 'jugador' : null); }
      if (c.quemado && c.quemado < 14 && Math.random() < dt * 10 && c.pos.distanceTo(j.posicion) < 100) { this.fuego(c.pos.x, 1.3, c.pos.z); if (Math.random() < 0.4) this.humo(c.pos.x, 2, c.pos.z, 1.6, '#2a2a2a', 2.5); }
      if (c.quemado) c.quemado += dt;
    }
    this.colisionesCoches(dt);
    this.atropellos();
    const jp = j.posicion;
    for (const p of this.peatones) {
      const d = Math.abs(p.pos.x - jp.x) + Math.abs(p.pos.z - jp.z);
      if (p.enInterior) { if (j.interior === p.enInterior) p.actualizar(dt); continue; }
      if (d < 220 || p.tipo !== 'civil') p.actualizar(dt);
      p.grupo.visible = d < 200;
    }
    this.fisica.actualizar(dt);
    this.gente.actualizar(dt);
    this.donChuy.actualizar(dt);
    this.policia.actualizar(dt);
    if (this.policia.estrellas) this.estadisticas.max('maxEstrellas', this.policia.estrellas);
    if (this.estrellasAntes > 0 && this.policia.estrellas === 0 && !j.muerto) this.estadisticas.sumar('despistes');
    this.estrellasAntes = this.policia.estrellas;
    this.misiones.actualizar(dt);
    this.actividades.actualizar(dt);
    this.trabajos.actualizar(dt);
    this.aleatorios.actualizar(dt);
    this.ambulantes.actualizar(dt);
    this.semaforos.actualizar(dt);
    this.autobuses.actualizar(dt);
    this.interiores.actualizar(dt);
    this.animales.actualizar(dt);
    this.duo.actualizar(dt);
    this.redes.actualizar(dt);
    this.eventos.actualizar(dt);
    this.economia.actualizar(dt);
    if (this.policia.estrellas >= 3) this.redes.publicar('persecucion');
    this.reloj += dt;
    this.granadas.actualizar(dt);
    this.gps.actualizar(dt);
    this.recogibles_(dt);
    this.revisarArresto(dt);
    this.revisarPintura(dt);
    for (let i = this.efectos.length - 1; i >= 0; i--) {
      const e = this.efectos[i];
      e.vida -= dt;
      if (e.vida <= 0) { this.escena.remove(e.malla); e.fin?.(); if (e.malla.material && !e.sinDispose) e.malla.material.dispose?.(); this.efectos.splice(i, 1); continue; }
      e.act?.(e, dt);
    }
    this.ambiente.actualizar(dt, this.camara);
    const n = this.ambiente.noche;
    this.decoracion.actualizar(dt, n, this.ambiente.cieloMat.uniforms.horizonte.value, this.ambiente.lluvia);
    const env = (1 - n * 0.8) * (1 - this.ambiente.lluvia * 0.3);
    for (const m of pinturas) m.envMapIntensity = env;
    if (j.coche && n > 0.25) {
      const c = j.coche;
      this.faro.intensity = 1400 * n;
      this.faro.position.set(c.pos.x + c.fx * 2.4, c.y + 0.9, c.pos.z + c.fz * 2.4);
      this.faro.target.position.set(c.pos.x + c.fx * 22, 0, c.pos.z + c.fz * 22);
    } else this.faro.intensity = 0;
    matFaro.color.set(n > 0.3 ? '#fffbe6' : '#dcd8c8');
    matHalo.opacity = n * 0.5;
    matHaz.opacity = Math.max(0, n - 0.25) * 0.55;
    if (this.cuadro % 10 === 0) for (const c of this.coches) { const h = c.modelo?.haz || c.haz; if (h) h.visible = n > 0.25 && !!c.conductor && !c.quemado; }
    for (const m of matsDecal) m.emissiveIntensity = 0.05 + n * 0.35;
    let sirena = 0;
    for (const c of this.coches) if (c.sirena && c.tipo === 'policia' && !c.quemado) sirena = Math.max(sirena, 1 - c.pos.distanceTo(jp) / 140);
    this.audio.sirena(Math.max(0, sirena));
    if (this.ultimaEstrella !== this.policia.estrellas) {
      for (const c of this.policia.unidades) c.sirena = true;
      this.ultimaEstrella = this.policia.estrellas;
    }
    this.relojGestor -= dt;
    if (this.relojGestor <= 0) { this.relojGestor = 0.5; this.gestor(); }
    this.actualizarCamara(dtReal);
    this.hud.actualizar(dtReal);
    if (this.cuadro % 2 === 0) this.minimapa.dibujar(this.camYaw);
  }

  pistas() {
    const j = this.jugador;
    if (this.interiores.cajeroCerca()) { this.hud.pista('E', 'Cajero · depositar o retirar'); return; }
    { const tc = this.tren?.cerca(); if (tc) { this.hud.pista('E', tc.texto); return; } }
    { const lp = this.limpia?.pista(); if (lp) { this.hud.pista('E', lp); return; } }
    for (const c of this.coches) {
      if (c.quemado || c.conductor === 'rival') continue;
      if (Math.abs(c.pos.x - j.pos.x) > 5 || Math.abs(c.pos.z - j.pos.z) > 5) continue;
      if (c.pos.distanceTo(j.pos) - c.t.largo * 0.35 < 2.6) { this.hud.pista('F', c.conductor === 'ia' ? 'Robar el coche' : c.tipo === 'policia' ? 'Robar la patrulla' : 'Subir al coche'); return; }
    }
  }

  marca(x, z, yaw) {
    const o = this._om || (this._om = new THREE.Object3D());
    o.position.set(x, 0.03, z); o.rotation.set(0, yaw, 0); o.updateMatrix();
    this.marcas.setMatrixAt(this.marcaIdx, o.matrix);
    this.marcaIdx = (this.marcaIdx + 1) % 400;
    this.marcas.count = Math.max(this.marcas.count, this.marcaIdx);
    this.marcas.instanceMatrix.needsUpdate = true;
  }

  bucle() {
    const ahora = performance.now();
    const real = (ahora - this.ultimo) / 1000;
    const dt = Math.min(0.05, real);
    this.ultimo = ahora;
    if (real > 0) this.fpsMedido += (1 / real - this.fpsMedido) * 0.05;
    if (this.foto) this.camaraFoto(dt);
    else if (!this.pausado && !this.overlay) this.paso(dt);
    else if (!this.yaInicio) { this.ambiente.actualizar(0, this.camara); this.actualizarCamaraMenu(); }
    if (!this.satHecho && ahora > (this.inicioReloj || (this.inicioReloj = ahora)) + 2500) { this.satHecho = true; try { this.minimapa.satelite(); } catch (e) { console.warn('satelite', e); } }
    if (this.fotosPendientes?.length && this.yaInicio && !this.foto && !this.jugador.interior && (this.marcoFoto = (this.marcoFoto || 0) + 1) % 20 === 0) { const u = this.fotoCiudad(); if (u) this.fotosPendientes.shift()(u); }
    if (this.overlay && !this.pausado && this.yaInicio) { const jp = this.jugador.posicion; let s = 0; for (const c of this.coches) if (c.sirena && c.tipo === 'policia' && !c.quemado) s = Math.max(s, 1 - c.pos.distanceTo(jp) / 140); this.audio.sirena(Math.max(0, s), 0.55); }
    if (this.overlay === 'mapa') { this.marcoMapa = (this.marcoMapa || 0) + 1; if (this.marcoMapa % 2 === 0) this.minimapa.dibujarGrande(); }
    if (this.post.activo && !this.foto && this.post.vigilar(real, +this.ajustes.calidad)) this.hud.notificar('info', 'Calidad ajustada', 'Apagué las sombras de contacto para que el juego vaya fluido.', 4);
    { const A = this.ambiente, cp = this.camara.position; A.cielo?.position.copy(cp); A.estrellas?.position.copy(cp); }
    if (this.post.activo && !this.foto) this.post.render(dt, { salud: this.jugador.salud, muerto: !!this.jugador.muerto, turbo: !!this.jugador.coche?.turbo, rapido: this.jugador.coche ? Math.min(1, Math.max(0, (this.jugador.coche.vel - 25) / 25)) : 0, noche: this.ambiente.noche });
    else if (this.post.activo) this.post.render(0.016, { salud: 100, muerto: false, turbo: false, rapido: 0, noche: this.ambiente.noche });
    else this.renderer.render(this.escena, this.camara);
    if (this.tomarFoto) { this.tomarFoto = false; this.capturar(); }
  }

  modoFoto(on) {
    this.foto = on;
    document.body.classList.toggle('modofoto', on);
    if (on) { this.fotoDist = 5; this.fotoCentro = this.jugador.posicion.clone(); this.audio.ui(1200); this.audio.motor(0, false); }
    else { this.selfie = false; document.body.classList.remove('selfie'); if (this.jugador.p?.telefono) this.jugador.p.telefono.visible = false; }
    this.ultimo = performance.now();
  }

  camaraFoto(dt = 0.016) {
    if (this.selfie && !this.jugador.coche) {
      const J = this.jugador, P = J.p, cam = this.camara;
      const yaw = this.camYaw + Math.PI, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      J.yaw = yaw;
      J.actualizar(dt, { x: 0, y: 0, correr: false, saltar: false }, this.camYaw);
      const alto = 1.62 * J.grupo.scale.y;
      if (!J.gesto) { P.bd.rotation.set(-1.75 - this.camPitch * 0.6, -0.35, -0.25); P.cd.rotation.x = -0.25; P.telefono.visible = true; }
      P.cabeza.rotation.set(-0.08, 0.12, 0.05);
      const d = 0.75 + Math.max(0, this.fotoDist - 5) * 0.08;
      cam.position.set(J.pos.x + fx * d - rx * 0.18, J.y + alto + 0.12 - this.camPitch * 0.5, J.pos.z + fz * d - rz * 0.18);
      cam.lookAt(J.pos.x + rx * 0.08, J.y + alto - 0.02, J.pos.z + rz * 0.08);
      cam.fov = 68; cam.updateProjectionMatrix();
      return;
    }
    if (this.jugador.p?.telefono) this.jugador.p.telefono.visible = false;
    const c = this.fotoCentro, cam = this.camara, d = this.fotoDist;
    const cp = Math.cos(this.camPitch), fx = Math.sin(this.camYaw) * cp, fy = Math.sin(this.camPitch), fz = Math.cos(this.camYaw) * cp;
    cam.position.set(c.x - fx * d, Math.max(0.3, c.y + 1.4 - fy * d), c.z - fz * d);
    cam.lookAt(c.x, c.y + 1.2, c.z);
    cam.fov = 55; cam.updateProjectionMatrix();
  }

  cohete(boca, dir) {
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#4a5a32', roughness: 0.6 }));
    const punta = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8).rotateX(Math.PI / 2).translate(0, 0, 0.36), new THREE.MeshStandardMaterial({ color: '#2a2a2a' }));
    const llama = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.humoTex, color: '#ffb040', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    llama.position.z = -0.4; llama.scale.setScalar(0.6);
    g.add(cuerpo, punta, llama);
    g.position.copy(boca); g.lookAt(boca.clone().add(dir));
    this.escena.add(g);
    const vel = dir.clone().multiplyScalar(62);
    let previo = boca.clone();
    this.efectos.push({ vida: 3.2, max: 3.2, malla: g, act: (e, dt) => {
      if (e.hecho) return;
      previo.copy(g.position); g.position.addScaledVector(vel, dt); vel.y -= 1.2 * dt;
      llama.scale.setScalar(0.5 + Math.random() * 0.3);
      if (Math.random() < 0.9) this.humo(previo.x, previo.y, previo.z, 0.7, '#bdb8b0', 1.4);
      const p = g.position, d = p.distanceTo(previo) || 1;
      let golpe = this.mundo.rayo(previo.x, previo.y, previo.z, p.x, p.y, p.z, 0.4) < 1 || p.y < 0.15;
      if (!golpe) for (const c of this.coches) if (c !== this.jugador.coche && c.pos.distanceTo(p) < c.t.largo * 0.45 + 0.6 && p.y < 2.2) { golpe = true; c.dañar(c.tipo === 'blindado' ? 260 : 999, 'explosion', 'jugador'); break; }
      if (!golpe) for (const q of this.peatones) if (!q.muerto && Math.hypot(q.pos.x - p.x, q.pos.z - p.z) < 0.8 && p.y < 2) { golpe = true; break; }
      if (golpe || e.vida < 0.05) { e.hecho = true; e.vida = 0.01; this.explosion(p.x, Math.max(0, p.y - 0.5), p.z, 'jugador'); }
    }, fin: () => { cuerpo.geometry.dispose(); punta.geometry.dispose(); } });
  }

  fuegoZona(x, y, z) {
    this.audio.explosion?.({ x, z });
    const zona = { x, z, r: 3.2, t: 7 };
    this.zonasFuego = this.zonasFuego || [];
    this.zonasFuego.push(zona);
    const luz = new THREE.PointLight('#ff8a30', 30, 14, 1.6); luz.position.set(x, 1.2, z); this.escena.add(luz);
    this.efectos.push({ vida: 7, max: 7, malla: luz, act: (e) => { luz.intensity = (22 + Math.random() * 14) * Math.min(1, e.vida / 1.5); } });
    const quem = new THREE.Mesh(new THREE.CircleGeometry(3.2, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.humoTex, color: '#000', transparent: true, opacity: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    quem.position.set(x, 0.04, z); this.escena.add(quem);
    this.efectos.push({ vida: 20, max: 20, malla: quem, act: (e) => { if (e.vida < 4) quem.material.opacity = 0.7 * e.vida / 4; }, fin: () => quem.geometry.dispose() });
    this.policia.crimen('explosion', new THREE.Vector3(x, 0, z));
  }

  actualizarFuego(dt) {
    if (!this.zonasFuego?.length) return;
    for (let i = this.zonasFuego.length - 1; i >= 0; i--) {
      const Z = this.zonasFuego[i];
      Z.t -= dt;
      if (Z.t <= 0) { this.zonasFuego.splice(i, 1); continue; }
      if (Math.random() < dt * 26) { const a = Math.random() * 6.28, r = Math.random() * Z.r; this.fuego(Z.x + Math.cos(a) * r, 0.4 + Math.random() * 0.6, Z.z + Math.sin(a) * r); }
      if (Math.random() < dt * 4) this.humo(Z.x, 2, Z.z, 2.2, '#2a2826', 3);
      Z.dano = (Z.dano || 0) - dt;
      if (Z.dano > 0) continue;
      Z.dano = 0.3;
      for (const q of this.peatones) { if (q.muerto) continue; if (Math.hypot(q.pos.x - Z.x, q.pos.z - Z.z) < Z.r) { q.recibir(9, { x: Z.x, z: Z.z }, 'jugador'); q.asustar?.(Z.x, Z.z, 3); } }
      for (const c of this.coches) if (Math.hypot(c.pos.x - Z.x, c.pos.z - Z.z) < Z.r + 1) c.dañar(4, 'fuego', 'jugador');
      const J = this.jugador; if (!J.coche && Math.hypot(J.pos.x - Z.x, J.pos.z - Z.z) < Z.r) J.recibir(6);
    }
  }

  fotoAuto(tipo, color, ancho = 420, alto = 250) {
    const clave = tipo + color + ancho;
    this.fotosAuto = this.fotosAuto || {};
    if (this.fotosAuto[clave]) return this.fotosAuto[clave];
    const R = this.renderer, esc = new THREE.Scene();
    esc.environment = this.escena.environment; esc.background = new THREE.Color('#1b1e27');
    const m = modeloCoche(tipo, color); esc.add(m.grupo);
    pinturas.delete(m.pinta);
    const sol = new THREE.DirectionalLight('#fff4e6', 2.4); sol.position.set(5, 7, 4);
    const borde = new THREE.DirectionalLight('#9fc4ff', 1.4); borde.position.set(-6, 3, -5);
    esc.add(sol, borde, new THREE.HemisphereLight('#dfe8ff', '#2a2622', 0.9));
    const piso = new THREE.Mesh(new THREE.CircleGeometry(6, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a2d36', roughness: 0.35, metalness: 0.4 }));
    esc.add(piso);
    const t = TIPOS[tipo], cam = new THREE.PerspectiveCamera(28, ancho / alto, 0.1, 100), d = t.largo * 1.35 + 3;
    cam.position.set(d * 0.78, (t.alto || 0.6) + 1.7, d * 0.7); cam.lookAt(0, 0.55 + (t.alto || 0.6) * 0.3, 0);
    const antes = R.getSize(new THREE.Vector2()), pr = R.getPixelRatio();
    R.setPixelRatio(1); R.setSize(ancho, alto, false);
    R.render(esc, cam);
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    const g = c.getContext('2d'); g.drawImage(R.domElement, 0, 0, ancho, alto, 0, 0, ancho, alto);
    const v = g.createRadialGradient(ancho / 2, alto / 2, alto * 0.3, ancho / 2, alto / 2, ancho * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = v; g.fillRect(0, 0, ancho, alto);
    R.setPixelRatio(pr); R.setSize(antes.x, antes.y, false);
    piso.geometry.dispose(); piso.material.dispose();
    return (this.fotosAuto[clave] = c.toDataURL('image/jpeg', 0.86));
  }

  async prepararRetratos() {
    const { crearHumano } = await import('./humanos.js?v=202611220007');
    this.retratos = this.retratos || {};
    for (const C of Object.values(CONTACTOS)) {
      if (!C.modelo || C.letra === 'N' || C.letra === 'V' || C.letra === 'G' || C.letra === 'I') continue;
      try {
        const h = await crearHumano(C.modelo); h.tocar('Idle_Loop', 0); h.mixer.update(0.5);
        const R = this.renderer, esc = new THREE.Scene(), ancho = 256, alto = 256;
        esc.environment = this.escena.environment; esc.background = new THREE.Color(C.color).multiplyScalar(0.22);
        esc.add(h.grupo); h.grupo.updateMatrixWorld(true);
        let cab = null; h.raiz.traverse(o => { if (o.isBone && o.name.toLowerCase() === 'head') cab = o; });
        const sol = new THREE.DirectionalLight('#fff1e0', 2.6); sol.position.set(1.2, 2.4, 2.2);
        const borde = new THREE.DirectionalLight(C.color, 2.2); borde.position.set(-2, 2, -1.5);
        esc.add(sol, borde, new THREE.HemisphereLight('#e8eeff', '#3a302a', 0.7));
        const hp = cab ? cab.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.09, 0)) : new THREE.Vector3(0, 1.62, 0);
        const cam = new THREE.PerspectiveCamera(22, 1, 0.05, 20); cam.position.set(hp.x + 0.22, hp.y + 0.02, hp.z + 0.95); cam.lookAt(hp.x, hp.y - 0.04, hp.z);
        const antes = R.getSize(new THREE.Vector2()), pr = R.getPixelRatio();
        R.setPixelRatio(1); R.setSize(ancho, alto, false); R.render(esc, cam);
        const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
        c.getContext('2d').drawImage(R.domElement, 0, 0, ancho, alto, 0, 0, ancho, alto);
        R.setPixelRatio(pr); R.setSize(antes.x, antes.y, false);
        this.retratos[C.nombre] = c.toDataURL('image/jpeg', 0.88);
      } catch (e) { }
    }
  }

  retrato(nombre) {
    this.retratos = this.retratos || {};
    if (nombre in this.retratos) return this.retratos[nombre];
    const C = Object.values(CONTACTOS).find(c => c.nombre === nombre);
    if (!C?.apariencia) return (this.retratos[nombre] = null);
    const R = this.renderer, esc = new THREE.Scene(), ancho = 256, alto = 256;
    esc.environment = this.escena.environment; esc.background = new THREE.Color(C.color).multiplyScalar(0.22);
    const p = crearPersona({ ...C.apariencia, fijo: true }); esc.add(p.grupo); p.grupo.updateMatrixWorld(true);
    const sol = new THREE.DirectionalLight('#fff1e0', 2.6); sol.position.set(1.2, 2.4, 2.2);
    const borde = new THREE.DirectionalLight(C.color, 2.2); borde.position.set(-2, 2, -1.5);
    esc.add(sol, borde, new THREE.HemisphereLight('#e8eeff', '#3a302a', 0.7));
    const h = p.cabeza.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.12, 0));
    const cam = new THREE.PerspectiveCamera(24, 1, 0.05, 20); cam.position.set(h.x + 0.25, h.y + 0.04, h.z + 1.05); cam.lookAt(h.x, h.y - 0.05, h.z);
    const antes = R.getSize(new THREE.Vector2()), pr = R.getPixelRatio();
    R.setPixelRatio(1); R.setSize(ancho, alto, false);
    R.render(esc, cam);
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    const g = c.getContext('2d'); g.drawImage(R.domElement, 0, 0, ancho, alto, 0, 0, ancho, alto);
    const v = g.createRadialGradient(ancho / 2, alto / 2, alto * 0.35, ancho / 2, alto / 2, ancho * 0.72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = v; g.fillRect(0, 0, ancho, alto);
    R.setPixelRatio(pr); R.setSize(antes.x, antes.y, false);
    return (this.retratos[nombre] = c.toDataURL('image/jpeg', 0.88));
  }

  fotoCiudad() {
    const p = puntoCalleAleatorio(this.jugador.posicion, 20, 95);
    if (!p) return null;
    const r = this.renderer, lz = r.domElement, w = lz.width, h = lz.height;
    const cam = this.camFoto || (this.camFoto = new THREE.PerspectiveCamera(55, 1, 0.3, 900));
    cam.aspect = w / h; cam.updateProjectionMatrix();
    const alto = Math.random() < 0.7, y = alto ? 1.55 : 8 + Math.random() * 14, yaw = (p.yaw || 0) + (Math.random() - 0.5) * 1.1;
    cam.position.set(p.x + (Math.random() - 0.5) * 3, y, p.z + (Math.random() - 0.5) * 3);
    cam.lookAt(cam.position.x + Math.sin(yaw) * 30, alto ? 2.6 : 3, cam.position.z + Math.cos(yaw) * 30);
    r.render(this.escena, cam);
    const c = document.createElement('canvas'); c.width = 400; c.height = 300;
    const sw = Math.min(w, h * 4 / 3), x = c.getContext('2d');
    x.filter = ['saturate(1.25) contrast(1.08)', 'sepia(.25) saturate(1.1)', 'contrast(1.12) brightness(1.05)', 'none'][Math.random() * 4 | 0];
    x.drawImage(lz, (w - sw) / 2, 0, sw, h, 0, 0, 400, 300);
    return c.toDataURL('image/jpeg', 0.78);
  }
  capturar() {
    const url = this.lienzo.toDataURL('image/jpeg', 0.9);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 480; c.height = Math.round(480 * img.height / img.width);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const mini = c.toDataURL('image/jpeg', 0.8);
      this.telefono.fotos.unshift(url);
      if (this.telefono.fotos.length > 12) this.telefono.fotos.pop();
      this.redes.publicar('foto', '', { propio: true, foto: mini, forzar: true });
      this.redes.fotoTomada();
      this.hud.notificar('gps', 'Foto publicada en JacaGram', 'Ábrela en tu teléfono con P.', 3);
    };
    img.src = url;
    const f = document.getElementById('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    this.audio.obturador?.();
  }
  actualizarCamaraMenu() {
    const t = performance.now() / 1000;
    const p = this.ciudad.lugares.monumento;
    this.camara.position.set(p.x + Math.sin(t * 0.04) * 120, 60, p.z + Math.cos(t * 0.04) * 120);
    this.camara.lookAt(p.x, 10, p.z);
  }

  pintarProgreso() {
    const n = this.misiones.indice;
    document.getElementById('progreso').textContent = n >= 5 ? 'HISTORIA TERMINADA · LA CIUDAD SIGUE ABIERTA' : (n > 0 ? 'MISIONES CUMPLIDAS: ' + n + ' DE 5' : '');
  }

  guardar() {
    try {
      const j = this.jugador;
      localStorage.setItem('perla_partida', JSON.stringify({ eco: this.economia.guardar(), cuerpo: { saludMax: j.saludMax, bonoVel: j.bonoVel, bonoGolpe: j.bonoGolpe }, propiedades: this.propiedades, banco: this.banco, mision: this.misiones.indice, misiones2: this.misiones.otros, dinero: j.dinero, armas: j.armas, act: this.actividades.guardar(), trab: this.trabajos.guardar(), stats: this.estadisticas.d, estilos: j.estilos, personaje: j.personaje }));
    } catch (e) { }
  }

  cargar() {
    try {
      const d = JSON.parse(localStorage.getItem('perla_partida') || 'null');
      if (!d) return;
      this.misiones.indice = d.mision || 0;
      if (d.misiones2) Object.assign(this.misiones.otros, d.misiones2);
      this.jugador.dinero = d.dinero || 0;
      if (d.armas) { this.jugador.armas = d.armas; if (!this.jugador.armas.puno) this.jugador.armas.puno = { cargador: 0, reserva: 0 }; }
      this.actividades.cargar(d.act);
      this.trabajos.cargar(d.trab);
      if (d.cuerpo) Object.assign(this.jugador, d.cuerpo);
      if (d.propiedades) Object.assign(this.propiedades, d.propiedades);
      if (d.banco) this.banco = d.banco;
      this.economia.cargar(d.eco);
      const nombre = n => ({ 'Toño': 'Matías', 'Mara': 'Lucía' })[n] || n;
      if (d.estilos) for (const k in d.estilos) if (this.jugador.estilos[nombre(k)]) Object.assign(this.jugador.estilos[nombre(k)], d.estilos[k]);
      if (d.personaje && this.jugador.estilos[nombre(d.personaje)]) this.jugador.personaje = nombre(d.personaje);
      this.jugador.vestir({});
      if (d.stats) Object.assign(this.estadisticas.d, d.stats);
      if (this.misiones.indice > 0 || this.jugador.dinero > 0) {
        document.querySelector('[data-acc=jugar]').textContent = 'CONTINUAR';
        this.pintarProgreso();
      }
    } catch (e) { }
  }
}

window.__juego = new Juego();
window.__esCalle = esCalle;
