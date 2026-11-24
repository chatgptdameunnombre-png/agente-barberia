import * as THREE from 'three';
import { aplicarMejoras, AUTOS } from './economia.js?v=202611231957';
import { TIPOS } from './vehiculos.js?v=202611231957';
import { esCalle } from './ciudad.js?v=202611231957';

export const NEONES = { morado: '#b46bff', azul: '#3fa8ff', verde: '#3fff8a', rosa: '#ff4fd8', rojo: '#ff3b3b' };
const NOMBRE_NEON = { morado: 'morado', azul: 'azul', verde: 'verde', rosa: 'rosa', rojo: 'rojo' };

const MAT_POLARIZADO = new THREE.MeshStandardMaterial({ color: '#06080b', metalness: 0.6, roughness: 0.08, transparent: true, opacity: 0.94 });
let _tex = null;
function texNeon() {
  if (_tex) return _tex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 64, 4, 32, 64, 62); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 128);
  return (_tex = new THREE.CanvasTexture(c));
}

export function ponerNeon(c, color) {
  if (c.neon) { c.grupo.remove(c.neon); c.neon.material.dispose(); c.neon = null; }
  if (!color || c.tipo === 'moto') return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(c.t.ancho * 2.1, c.t.largo * 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texNeon(), color: NEONES[color] || color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.position.y = 0.13; m.renderOrder = 2; c.grupo.add(m); c.neon = m;
}

export function aplicarTuneo(c, m) {
  aplicarMejoras(c, m);
  if (m.turbo) { c.t.acel *= 1.3; c.t.vmax *= 1.06; }
  if (m.blindaje) c.blindado = true;
  ponerNeon(c, m.neon || null);
  if (m.polarizado && c.partes?.[1] && !c.vidrioRoto) c.partes[1].material = MAT_POLARIZADO;
}

export const nombreTipo = t => AUTOS.find(a => a.id === t)?.nombre || ({ sedan: 'Sedán', taxi: 'Taxi', policia: 'Patrulla', compacto: 'Compacto', deportivo: 'Deportivo', camioneta: 'Camioneta', ambulancia: 'Ambulancia', vocho: 'Vocho', vochotaxi: 'Vocho taxi', moto: 'Moto', reparto: 'Camión de reparto', redilas: 'Camioneta de redilas', autobus: 'Autobús', valores: 'Camión de valores' })[t] || t;

export class Tuneo {
  constructor(juego) {
    this.j = juego;
    const T = juego.ciudad.lugares.taller;
    this.punto = { x: T.x, z: T.z + 1.5 };
    const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d');
    x.strokeStyle = '#f6c431'; x.lineWidth = 10; x.setLineDash([26, 16]); x.strokeRect(10, 10, 236, 364); x.setLineDash([]);
    x.fillStyle = 'rgba(246,196,49,0.9)'; x.font = '900 44px Impact, Arial Black, sans-serif'; x.textAlign = 'center'; x.save(); x.translate(128, 192); x.rotate(-Math.PI / 2); x.fillText('MEJORAS', 0, 16); x.restore();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tx, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(this.punto.x, esCalle(this.punto.x, this.punto.z) ? 0.05 : 0.2, this.punto.z); m.receiveShadow = true; juego.escena.add(m);
  }

  cerca() {
    const j = this.j, c = j.jugador.coche;
    if (!c || c.quemado || c.ahogado || j.misiones?.activa?.sinTaller) return false;
    return Math.hypot(c.pos.x - this.punto.x, c.pos.z - this.punto.z) < 5 && Math.abs(c.vel || 0) < 3;
  }

  guardarEnGaraje(c) {
    const E = this.j.economia, m = c.mejoras || {};
    const col = typeof c.color === 'string' ? c.color : '#' + c.color.getHexString();
    let g = E.garaje.find(q => q.tipo === c.tipo);
    if (!g) { g = { tipo: c.tipo, color: col, mejoras: {} }; E.garaje.push(g); }
    g.color = col;
    g.mejoras = { ...m };
    c.propio = true; c.marcado = true; E.cocheMio = c;
  }

  articulos() {
    const j = this.j, c = j.jugador.coche, M = () => (c.mejoras = c.mejoras || {});
    const poner = (id, v = true) => { M()[id] = v; aplicarTuneo(c, c.mejoras); const g = j.economia.garaje.find(q => q.tipo === c.tipo); if (g && c.propio) g.mejoras = { ...c.mejoras }; j.guardar(); };
    const tiene = id => () => !!c.mejoras?.[id];
    const lista = [
      { id: 'reparar', nombre: 'Reparar todo', precio: 150, verbo: 'Reparar', desc: 'Carrocería, llantas, defensas y puertas como nuevas.', dar: () => { c.salud = c.t.salud; c.reparar?.(); }, icono: null },
      { id: 'motor', nombre: 'Motor afinado', precio: 2500, verbo: 'Instalar', desc: '+18% de velocidad y aceleración.', dar: () => poner('motor'), tiene: tiene('motor') },
      { id: 'turbo', nombre: 'Turbo', precio: 4000, verbo: 'Instalar', desc: 'Arrancones brutales: +30% de aceleración.', dar: () => poner('turbo'), tiene: tiene('turbo') },
      { id: 'frenos', nombre: 'Frenos de carreras', precio: 1200, verbo: 'Instalar', desc: 'Frena mucho más rápido.', dar: () => poner('frenos'), tiene: tiene('frenos') },
      { id: 'blindaje', nombre: 'Blindaje', precio: 3500, verbo: 'Instalar', desc: 'Aguanta casi el doble de golpes y balas.', dar: () => poner('blindaje'), tiene: tiene('blindaje') },
      { id: 'llantas', nombre: 'Llantas antiponchaduras', precio: 1500, verbo: 'Instalar', desc: 'Ya no te las pueden ponchar a balazos.', dar: () => poner('llantas'), tiene: tiene('llantas') },
      { id: 'polarizado', nombre: 'Vidrios polarizados', precio: 500, verbo: 'Instalar', desc: 'Vidrios oscuros: pura presencia.', dar: () => poner('polarizado'), tiene: tiene('polarizado') },
      ...Object.keys(NEONES).map(k => ({ id: 'neon_' + k, nombre: 'Luz neón ' + NOMBRE_NEON[k], precio: 800, verbo: 'Instalar', desc: 'Brilla debajo del coche, sobre todo de noche.', dar: () => poner('neon', k), tiene: () => c.mejoras?.neon === k })),
      { id: 'quitarNeon', nombre: 'Quitar el neón', precio: 0, verbo: 'Quitar', desc: 'Regresa al look de fábrica.', dar: () => poner('neon', null), tiene: () => !c.mejoras?.neon },
      { id: 'garaje', nombre: 'Guardar en tu garaje', precio: 1000, verbo: 'Guardar', desc: 'Papeles en regla: lo pides desde el teléfono cuando quieras, con todo lo que le pusiste.', dar: () => { this.guardarEnGaraje(c); j.hud.notificar('coche', 'Guardado en tu garaje', nombreTipo(c.tipo) + ' · pídelo en el teléfono → Autos', 3.5); j.guardar(); }, tiene: () => !!c.propio && j.economia.garaje.some(q => q.tipo === c.tipo) }
    ];
    return lista.filter(a => !(c.tipo === 'moto' && (a.id.startsWith('neon') || a.id === 'polarizado' || a.id === 'quitarNeon')));
  }

  abrir() {
    const j = this.j, c = j.jugador.coche;
    if (!c) return;
    if (j.policia.estrellas) { j.hud.notificar('alerta', 'Don Chuy no te abre', 'Primero pierde a la policía.', 3); return; }
    c.vx = c.vz = 0;
    j.actividades.abrirTienda({ titulo: 'TALLER DON CHUY · MEJORAS', sub: nombreTipo(c.tipo).toUpperCase() + ' · ' + Math.round(100 * c.salud / c.t.salud) + '% DE SALUD', articulos: this.articulos() });
  }

  actualizar() {
    const j = this.j;
    if (this.cerca() && !j.overlay) j.hud.pista('E', 'Mejorar el coche · Taller Don Chuy');
    for (const c of j.coches) if (c.neon) { c.neon.material.opacity = 0.45 + (j.ambiente.noche ?? 0) * 0.55; c.neon.position.y = (esCalle(c.pos.x, c.pos.z) ? 0.05 : 0.2) - c.grupo.position.y; }
  }
}
