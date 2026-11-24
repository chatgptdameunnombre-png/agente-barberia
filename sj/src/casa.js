import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Coche } from './vehiculos.js?v=202611231951';
import { aplicarTuneo } from './tuneo.js?v=202611231951';
import { CASA } from './sierradatos.js?v=202611231951';

const _c = new THREE.Color();
function teñir(g, hex) { _c.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.index ? g.toNonIndexed() : g; }
const caja = (w, h, d, x, y, z, col) => teñir(new THREE.BoxGeometry(w, h, d).translate(x, y, z), col);
const cil = (r1, r2, h, x, y, z, col, seg = 10) => teñir(new THREE.CylinderGeometry(r1, r2, h, seg).translate(x, y, z), col);

export const CASA_X = 440, CASA_Z = 247;

export class Casa {
  constructor(juego) {
    this.j = juego; this.coches = []; this.tRev = 0;
    const esc = juego.escena, L = [], V = [], x = CASA_X, z = CASA_Z;
    L.push(caja(28, 0.5, 16, x, 0.25, z, '#d8d2c6'));
    L.push(caja(28, 3.4, 15, x, 2.2, z, '#f2efe8'));
    L.push(caja(20, 3.2, 12, x - 3, 5.5, z + 1, '#e8e2d6'));
    L.push(caja(29, 0.3, 16, x, 3.95, z, '#3a3a3e'), caja(21, 0.3, 13, x - 3, 7.2, z + 1, '#3a3a3e'));
    L.push(caja(7.6, 0.12, 15.2, x + 10.2, 4.15, z, '#c8c2b4'));
    for (let k = 0; k < 9; k++) L.push(cil(0.04, 0.04, 1.0, x + 6.6 + k * 0.9, 4.6, z - 7.4, '#2a2a2e', 6));
    L.push(caja(7.4, 0.06, 0.06, x + 10.2, 5.1, z - 7.45, '#2a2a2e'));
    V.push(caja(20, 2.4, 0.1, x - 3, 2.1, z - 7.55, '#0f1a24'), caja(14, 2.2, 0.1, x - 5, 5.5, z - 5.05, '#0f1a24'), caja(0.1, 2.4, 10, x - 14.05, 2.1, z, '#0f1a24'));
    L.push(caja(2.2, 2.8, 0.2, x + 7.5, 1.9, z - 7.55, '#5a3a22'));
    this.puerta = { x: x + 7.5, z: z - 9 };
    for (let k = 0; k < 5; k++) L.push(caja(1.2, 0.3, 3, x + 7.5, 0.15 - k * 0.0, z - 9.6 - k * 0.0, '#cfc6b4'));
    const ga = { x0: x + 15, x1: x + 43, z0: z - 9, z1: z + 7 }; this.cochera = ga;
    L.push(caja(ga.x1 - ga.x0, 0.12, ga.z1 - ga.z0, (ga.x0 + ga.x1) / 2, 0.06, (ga.z0 + ga.z1) / 2, '#8a8c90'));
    L.push(caja(ga.x1 - ga.x0, 0.25, 0.3, (ga.x0 + ga.x1) / 2, 4.2, ga.z1, '#3a3a3e'), caja(ga.x1 - ga.x0 + 1, 0.3, ga.z1 - ga.z0 + 1, (ga.x0 + ga.x1) / 2, 4.4, (ga.z0 + ga.z1) / 2, '#e8e2d6'));
    for (let k = 0; k <= 4; k++) { const cx = ga.x0 + k * 7; L.push(cil(0.18, 0.18, 4.2, cx, 2.1, ga.z0 + 0.4, '#e8e2d6', 10), cil(0.18, 0.18, 4.2, cx, 2.1, ga.z1 - 0.4, '#e8e2d6', 10)); if (k < 4) L.push(caja(0.15, 0.02, 5.2, cx + 3.5, 0.13, (ga.z0 + ga.z1) / 2 - 2, '#f2f2f4')); }
    this.lugares = [0, 1, 2, 3].map(k => ({ x: ga.x0 + 3.5 + k * 7, z: (ga.z0 + ga.z1) / 2, yaw: Math.PI }));
    const al = { x: x - 4, z: z + 16, w: 16, d: 7 };
    L.push(caja(al.w + 2, 0.3, al.d + 2, al.x, 0.15, al.z, '#e8e2d6'));
    const agua = new THREE.Mesh(new THREE.PlaneGeometry(al.w, al.d).rotateX(-Math.PI / 2).translate(al.x, 0.32, al.z), new THREE.MeshStandardMaterial({ color: '#2fa8d8', roughness: 0.05, metalness: 0.1, emissive: '#0a4a6a', emissiveIntensity: 0.3, transparent: true, opacity: 0.88 }));
    esc.add(agua); this.agua = agua;
    for (const s of [-1, 1]) { L.push(caja(1.9, 0.12, 0.7, al.x + s * 5, 0.42, al.z - al.d / 2 - 1.8, '#f2f2f4'), caja(1.9, 0.12, 0.7, al.x + s * 2.5, 0.42, al.z - al.d / 2 - 1.8, '#f2f2f4')); }
    for (const [px, pz] of [[x - 15, z - 11], [x + 13, z - 12], [x - 15, z + 18], [x + 8, z + 19], [x - 22, z + 2]]) {
      for (let k = 0; k < 7; k++) { const t = k / 7; L.push(cil(0.24 - t * 0.08, 0.26 - t * 0.08, 1.1, px + t * 0.6, 0.55 + k * 1.05, pz, '#8a6a4a', 8)); }
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, h = new THREE.ConeGeometry(0.35, 3.6, 5).rotateZ(Math.PI / 2 + 0.5).rotateY(a).translate(px + 0.6 + Math.cos(a) * 1.5, 7.6, pz - Math.sin(a) * 1.5); L.push(teñir(h, '#3a7a32')); }
    }
    this.choca(x - 14, z - 7.5, x + 14, z + 7.5, 8);
    for (const k of [0, 4]) this.choca(ga.x0 + k * 7 - 0.3, ga.z0, ga.x0 + k * 7 + 0.3, ga.z1, 4);
    this.choca(al.x - al.w / 2 - 1, al.z - al.d / 2 - 1, al.x + al.w / 2 + 1, al.z + al.d / 2 + 1, 0.4);
    const m = new THREE.Mesh(mergeGeometries(L), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 })); m.castShadow = m.receiveShadow = true; esc.add(m);
    this.matVentana = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.7, emissive: '#ffcf8a', emissiveIntensity: 0 });
    esc.add(new THREE.Mesh(mergeGeometries(V), this.matVentana));
    const s = document.createElement('canvas'); s.width = 512; s.height = 128; const g = s.getContext('2d'); g.fillStyle = '#1a1428'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#d9b3ff'; g.font = '900 52px Inter, Arial'; g.textAlign = 'center'; g.fillText('CASA JACARANDA', 256, 84);
    const tx = new THREE.CanvasTexture(s); tx.colorSpace = THREE.SRGBColorSpace;
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: tx })); placa.position.set(CASA.x0 + 37, 1.9, CASA.z0 - 0.2); placa.rotation.y = Math.PI; esc.add(placa);
  }

  choca(x0, z0, x1, z1, h) { this.j.mundo.agregar(x0, z0, x1, z1, h); }

  tiene() { return !!this.j.propiedades?.casa; }

  enCochera(c) { const g = this.cochera; return c.pos.x > g.x0 && c.pos.x < g.x1 && c.pos.z > g.z0 && c.pos.z < g.z1; }

  cercaCochera() { const c = this.j.jugador.coche; return !!(c && this.tiene() && this.enCochera(c) && Math.abs(c.vel || 0) < 2.5 && !c.quemado && !this.j.policia.estrellas); }

  guardar() {
    const j = this.j, c = j.jugador.coche; if (!c) return;
    if (!j.tuneo) return;
    j.tuneo.guardarEnGaraje(c);
    j.hud.notificar('coche', 'Guardado en tu cochera', 'Lo pides desde el teléfono o lo encuentras aquí.', 3); j.audio.compra(); j.guardar();
  }

  sacar() {
    const j = this.j;
    for (const c of this.coches) { const i = j.coches.indexOf(c); if (i >= 0 && j.jugador.coche !== c && !c.conductor) { c.quitar(); j.coches.splice(i, 1); } }
    this.coches = [];
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion, d = Math.hypot(jp.x - CASA_X, jp.z - CASA_Z);
    this.matVentana.emissiveIntensity = (j.ambiente.noche || 0) * (this.tiene() ? 1.1 : 0.15);
    if (this.agua) this.agua.material.emissiveIntensity = 0.25 + (j.ambiente.noche || 0) * 0.9;
    this.tRev -= dt;
    if (this.tRev <= 0) {
      this.tRev = 1.5;
      if (this.tiene() && d < 110 && !this.coches.length) {
        const usados = new Set(j.coches.filter(c => c.propio && j.economia.cocheMio === c).map(c => c.tipo));
        j.economia.garaje.filter(g => !usados.has(g.tipo)).slice(0, 4).forEach((g, k) => {
          const P = this.lugares[k], c = new Coche(j, g.tipo, g.color, P.x, P.z, P.yaw);
          c.marcado = true; c.propio = true; c.conductor = null; c.vx = c.vz = 0; aplicarTuneo(c, g.mejoras || {}); j.coches.push(c); this.coches.push(c);
        });
      } else if (d > 240 && this.coches.length) this.sacar();
    }
    if (this.cercaCochera() && !j.overlay) j.hud.pista('E', 'Guardar este coche en tu cochera');
  }
}

export const DECOR = [
  { id: 'tele', nombre: 'Pantalla gigante', precio: 5000, desc: 'Ocupa toda la pared de la sala.' },
  { id: 'billar', nombre: 'Mesa de billar', precio: 6000, desc: 'Paño morado y bolas de colores.' },
  { id: 'acuario', nombre: 'Acuario', precio: 4000, desc: 'Peces de colores que nadan de verdad.' },
  { id: 'rocola', nombre: 'Rocola', precio: 3500, desc: 'Luces que cambian de color.' },
  { id: 'candil', nombre: 'Candil de cristal', precio: 3000, desc: 'Brilla sobre el comedor.' },
  { id: 'arte', nombre: 'Cuadros de artistas locales', precio: 2500, desc: 'Tres cuadros para la pared.' },
  { id: 'trofeos', nombre: 'Vitrina de trofeos', precio: 1500, desc: 'Un trofeo por cada logro grande.' },
  { id: 'plantas', nombre: 'Plantas grandes', precio: 800, desc: 'Le dan vida a la casa.' }
];

export function construirCasaInt(t, W, L, H, g, caja, m) {
  const j = this.j, ox = t.interior.ox, oz = t.interior.oz, std = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...e });
  const mueble = (w, h, d, mat, x, y, z, choca = true, grupo = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); grupo.add(b); if (choca) j.mundo.agregar(ox + x - w / 2, oz + z - d / 2, ox + x + w / 2, oz + z + d / 2, y + h / 2); return b; };
  const vista = document.createElement('canvas'); vista.width = 512; vista.height = 192; { const x = vista.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, '#6aa8e8'); gr.addColorStop(1, '#f2d8b0'); x.fillStyle = gr; x.fillRect(0, 0, 512, 192); x.fillStyle = '#6a7a5a'; x.beginPath(); x.moveTo(0, 150); for (let k = 0; k <= 16; k++) x.lineTo(k * 32, 110 + Math.sin(k * 1.7) * 26 + (k % 3) * 8); x.lineTo(512, 192); x.lineTo(0, 192); x.fill(); x.fillStyle = '#4a6a3a'; x.fillRect(0, 165, 512, 27); }
  const tv = new THREE.CanvasTexture(vista); tv.colorSpace = THREE.SRGBColorSpace;
  const ven = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.6), new THREE.MeshBasicMaterial({ map: tv })); ven.position.set(-1, 2.6, -L / 2 + 0.17); g.add(ven);
  for (let k = 0; k <= 4; k++) mueble(0.12, 3.8, 0.12, std('#2a2a2e'), -8 + k * 3.5, 2.6, -L / 2 + 0.2, false);
  const tapete = new THREE.Mesh(new THREE.PlaneGeometry(9, 6).rotateX(-Math.PI / 2), std('#5a3a6a', { roughness: 1 })); tapete.position.set(-3, 0.02, -2); g.add(tapete);
  const piel = std('#d8d0c4', { roughness: 0.9 }), cojin = std('#7a5a8a', { roughness: 1 });
  mueble(6.5, 0.6, 1.4, piel, -3, 0.3, 0.6); mueble(6.5, 0.9, 0.3, piel, -3, 0.75, 1.25, false); mueble(1.4, 0.6, 3.6, piel, -6.9, 0.3, -1.0); mueble(0.3, 0.9, 3.6, piel, -7.45, 0.75, -1.0, false);
  for (let k = 0; k < 4; k++) mueble(0.7, 0.5, 0.25, cojin, -5.2 + k * 1.5, 0.85, 1.05, false);
  mueble(2.6, 0.4, 1.4, std('#3a2a1a'), -3, 0.2, -1.6); 
  mueble(5, 0.1, 0.9, std('#1a1a1e'), -3, 0.5, -L / 2 + 1.0, false);
  mueble(4.8, 1.0, 1.4, std('#f2f2f4', { roughness: 0.25 }), 6, 0.5, -3.5); mueble(5.0, 0.08, 1.6, std('#2a2a2e', { roughness: 0.2, metalness: 0.3 }), 6, 1.04, -3.5, false);
  for (let k = 0; k < 3; k++) { mueble(0.45, 0.06, 0.45, std('#2a2a2e'), 4.6 + k * 1.4, 0.75, -2.3, false); mueble(0.06, 0.75, 0.06, std('#8a8e94', { metalness: 0.8 }), 4.6 + k * 1.4, 0.37, -2.3, false); }
  mueble(9, 2.4, 0.7, std('#e8e4dc'), 6.5, 1.2, -L / 2 + 0.4); mueble(9, 0.06, 0.75, std('#2a2a2e'), 6.5, 0.95, -L / 2 + 0.45, false); mueble(1.0, 2.4, 0.8, std('#c8ccd2', { metalness: 0.7, roughness: 0.25 }), 11.5, 1.2, -L / 2 + 0.5);
  mueble(3.6, 0.08, 1.6, std('#5a3a22'), 6, 0.78, 3.5, true); for (const [dx, dz] of [[-1.2, -1.1], [0, -1.1], [1.2, -1.1], [-1.2, 1.1], [0, 1.1], [1.2, 1.1]]) mueble(0.5, 0.9, 0.5, std('#e8e2d6'), 6 + dx, 0.45, 3.5 + dz, false);
  for (let k = 0; k < 10; k++) mueble(1.6, 0.25, 0.42, std('#d8d2c6'), W / 2 - 1.2, 0.125 + k * 0.3, 6.5 - k * 0.42, k < 3);
  mueble(0.1, 3.2, 4.4, std('#2a2a2e'), W / 2 - 2.05, 1.7, 4.6, false);
  const dec = {}, G = id => { const q = new THREE.Group(); g.add(q); q.visible = false; dec[id] = q; return q; };
  { const q = G('tele'); mueble(7, 3.4, 0.12, std('#0a0a0c'), -3, 2.3, -L / 2 + 0.6, false, q); const sc = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 3.1), new THREE.MeshBasicMaterial({ color: '#3a6aff' })); sc.position.set(-3, 2.3, -L / 2 + 0.67); q.add(sc); dec.pantalla = sc; ven.visible = true; ven.position.x = -1; }
  { const q = G('billar'); mueble(4.2, 0.25, 2.2, std('#3a1a4a', { roughness: 1 }), -3, 0.85, 5.5, false, q); mueble(4.5, 0.2, 2.5, std('#4a2a1a'), -3, 0.75, 5.5, false, q); for (const [dx, dz] of [[-1.9, -0.9], [1.9, -0.9], [-1.9, 0.9], [1.9, 0.9]]) mueble(0.3, 0.7, 0.3, std('#4a2a1a'), -3 + dx, 0.35, 5.5 + dz, false, q); const cols = ['#f2f2f2', '#f2c431', '#2a5ab8', '#c8202e', '#7a2ab8', '#f27a1a', '#2a8a4a', '#1a1a1a']; cols.forEach((c, k) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), std(c, { roughness: 0.2 })); b.position.set(-3.6 + (k % 4) * 0.3, 1.05, 5.3 + Math.floor(k / 4) * 0.3); q.add(b); }); j.mundo.agregar(ox - 5.25, oz + 4.25, ox - 0.75, oz + 6.75, 1); }
  { const q = G('acuario'); mueble(0.9, 1.6, 4, std('#9fd8ff', { transparent: true, opacity: 0.35, roughness: 0.05, emissive: '#1a6aa8', emissiveIntensity: 0.6 }), -W / 2 + 0.7, 1.5, -3, false, q); mueble(1.0, 0.7, 4.1, std('#1a1a1e'), -W / 2 + 0.7, 0.35, -3, false, q); dec.peces = []; for (let k = 0; k < 7; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: ['#ff7a1a', '#f2c431', '#ff3b6a', '#3fd2ff'][k % 4] })); f.position.set(-W / 2 + 0.7, 1.0 + Math.random() * 1.0, -4.5 + Math.random() * 3); q.add(f); dec.peces.push(f); } j.mundo.agregar(ox - W / 2 + 0.2, oz - 5, ox - W / 2 + 1.2, oz - 1, 2); }
  { const q = G('rocola'); const r = mueble(1.1, 1.7, 0.7, std('#5a2a1a', { emissive: '#ff4fd8', emissiveIntensity: 0.4 }), -W / 2 + 1.0, 0.85, 4.5, false, q); dec.rocolaMesh = r; j.mundo.agregar(ox - W / 2 + 0.4, oz + 4.1, ox - W / 2 + 1.6, oz + 4.9, 1.7); }
  { const q = G('candil'); const c = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 10), new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffe0a0', emissiveIntensity: 1.3, transparent: true, opacity: 0.9 })); c.position.set(6, H - 1.5, 3.5); q.add(c); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, gota = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffe8c0', emissiveIntensity: 1 })); gota.position.set(6 + Math.cos(a) * 0.6, H - 1.95, 3.5 + Math.sin(a) * 0.6); q.add(gota); } }
  { const q = G('arte'); [['#c8202e', '#f2c431'], ['#2a5ab8', '#7ae0ff'], ['#5a2a8a', '#ff7a1a']].forEach(([a, b], k) => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 128, 128); x.fillStyle = b; x.beginPath(); x.arc(40 + k * 20, 60, 34, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.fillRect(70 - k * 10, 20, 30, 90); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const c = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tx })); c.position.set(-W / 2 + 0.18, 2.6, -0.5 + k * 2.6); c.rotation.y = Math.PI / 2; q.add(c); }); }
  { const q = G('trofeos'); mueble(3, 2.2, 0.5, std('#2a1a0e'), 2, 1.1, L / 2 - 0.5, false, q); for (let k = 0; k < 6; k++) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.35, 10), std('#e0b040', { metalness: 1, roughness: 0.2 })); tr.position.set(1.0 + (k % 3) * 1.0, 1.2 + Math.floor(k / 3) * 0.7, L / 2 - 0.55); q.add(tr); } }
  { const q = G('plantas'); for (const [x, z] of [[-W / 2 + 1.2, -L / 2 + 1.2], [W / 2 - 3.5, -L / 2 + 1.5], [-8, 3], [2, 1.5]]) { mueble(0.6, 0.7, 0.6, std('#c86a3a'), x, 0.35, z, false, q); for (let k = 0; k < 5; k++) { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), std('#3a7a32', { roughness: 1 })); h.position.set(x + Math.cos(k) * 0.3, 1.1 + k * 0.18, z + Math.sin(k) * 0.3); q.add(h); } } }
  t.decor = dec;
  t.interior.mostrador.set(ox + 6, 0, oz - 2.0);
}

export function animarCasa(T, dt) {
  const d = T.decor; if (!d) return; const t = performance.now() / 1000;
  if (d.pantalla?.parent?.visible) d.pantalla.material.color.setHSL((t * 0.05) % 1, 0.6, 0.45);
  if (d.peces && d.peces[0]?.parent?.visible) d.peces.forEach((f, k) => { f.position.z = -3 + Math.sin(t * (0.4 + k * 0.07) + k) * 1.7; f.rotation.y = Math.cos(t * (0.4 + k * 0.07) + k) > 0 ? 0 : Math.PI; });
  if (d.rocolaMesh?.parent?.visible) d.rocolaMesh.material.emissive.setHSL((t * 0.3) % 1, 0.9, 0.5);
}
