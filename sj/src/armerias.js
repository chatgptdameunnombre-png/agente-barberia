import * as THREE from 'three';
import { ARTICULOS } from './actividades.js?v=202611221845';
import { modeloArma } from './persona.js?v=202611221845';
import { letrero } from './ciudad.js?v=202611221845';

const A = id => ARTICULOS.find(a => a.id === id);

export const ARMERIAS = {
  charro: {
    nombre: 'ARMERÍA EL CHARRO', bonito: 'Armería El Charro', fondo: '#2a160a', tinta: '#e6b54a', color: '#e6b54a',
    sub: 'TRADICIÓN Y PUNTERÍA DESDE 1952', pared: '#6e4326', piso: '#3e2616', panel: '#4a2c18', barra: '#5a3520', luz: '#ffcf8a',
    especial: 'pistolaOro', rack: ['revolver', 'escopeta', 'pistola', 'recortada'],
    cajero: { cara: 4, ropa: null, camisa: '#efe6d2', estiloPelo: 'sombrero' },
    neon: { lineas: ['EL CHARRO', 'ARMERÍA'], c1: '#ffcf5a', c2: '#ff6a3a', w: 3.0, h: 1.3, flecha: true },
    articulos: () => [
      { id: 'pistolaOro', nombre: 'La Charra · pistola de oro', precio: 3500, desc: 'Bañada en oro con cachas de nácar. Dispara rápido y casi no falla. Solo se vende aquí. Incluye 45 balas.', dar: j => j.darArma('pistolaOro', 45), tiene: j => !!j.armas.pistolaOro },
      { id: 'balaO', icono: 'pistolaOro', nombre: 'Balas de La Charra ×45', precio: 140, desc: 'Para La Charra.', dar: j => j.darArma('pistolaOro', 45), requiere: 'pistolaOro' },
      { id: 'sil_pistolaOro', icono: 'pistolaOro', accesorio: true, etiqueta: 'SILENCIADOR', nombre: 'Silenciador para La Charra', precio: 800, desc: 'Grabado a mano. La policía no oye tus disparos.', dar: j => { j.armas.pistolaOro.silen = true; }, tiene: j => !!j.armas.pistolaOro?.silen, requiere: 'pistolaOro' },
      A('revolver'), A('balaV'), A('escopeta'), A('balaE'), A('recortada'), A('balaC')
    ]
  },
  trinchera: {
    nombre: 'EXCEDENTES LA TRINCHERA', bonito: 'Excedentes La Trinchera', fondo: '#1a2010', tinta: '#c8d890', color: '#9ab85a',
    sub: 'EQUIPO MILITAR DE SEGUNDA MANO', pared: '#4a5236', piso: '#2e3224', panel: '#3a4028', barra: '#2a2e20', luz: '#e8f0c0',
    especial: 'escopetaAuto', rack: ['subfusil', 'rifle', 'ametralladora', 'escopeta'],
    cajero: { cara: 2, ropa: null, camisa: '#4a5a32', gorra: '#3a4a2a', estiloPelo: 'rapado' },
    neon: { lineas: ['LA TRINCHERA'], c1: '#a8e05a', c2: '#ffffff', w: 3.2, h: 0.9 },
    articulos: () => [
      { id: 'escopetaAuto', nombre: 'Escopeta de tambor', precio: 4200, desc: 'Escopeta automática con cargador de tambor de 12 tiros. Barre pasillos enteros. Solo se vende aquí. Incluye 36 cartuchos.', dar: j => j.darArma('escopetaAuto', 36), tiene: j => !!j.armas.escopetaAuto },
      { id: 'balaT', icono: 'escopetaAuto', nombre: 'Tambor de cartuchos ×36', precio: 220, desc: 'Para la escopeta de tambor.', dar: j => j.darArma('escopetaAuto', 36), requiere: 'escopetaAuto' },
      A('subfusil'), A('balaS'), A('sil_subfusil'), A('granada'), A('chaleco')
    ]
  },
  sierra: {
    nombre: 'CAZA Y PESCA LA SIERRA', bonito: 'Caza y Pesca La Sierra', fondo: '#1e140a', tinta: '#f0c890', color: '#d88a4a',
    sub: 'PARA LOS QUE SABEN ESPERAR', pared: '#8a5a32', piso: '#4a3a28', panel: '#6a4424', barra: '#4a2e18', luz: '#ffd8a0',
    especial: 'ballesta', rack: ['francotirador', 'rifle', 'escopeta', 'cuchillo'],
    cajero: { cara: 5, ropa: null, camisa: '#8a3a2a', gorra: '#d86a1a', barba: 'barba' },
    neon: { lineas: ['CAZA Y PESCA', 'LA SIERRA'], c1: '#ffb060', c2: '#ffffff', w: 3.0, h: 1.2 },
    articulos: () => [
      { id: 'ballesta', nombre: 'Ballesta de caza', precio: 2800, desc: 'Silenciosa: la policía no oye el tiro y la gente no se asusta. Un virote tumba a cualquiera. Mira con clic derecho. Solo se vende aquí. Incluye 12 virotes.', dar: j => j.darArma('ballesta', 12), tiene: j => !!j.armas.ballesta },
      { id: 'virotes', icono: 'ballesta', nombre: 'Virotes ×12', precio: 120, desc: 'Para la ballesta.', dar: j => j.darArma('ballesta', 12), requiere: 'ballesta' },
      A('francotirador'), A('balaF'), A('sil_francotirador'), A('rifle'), A('balaR'), A('sil_rifle'), A('cuchillo')
    ]
  },
  filo: {
    nombre: 'CUCHILLERÍA EL FILO', bonito: 'Cuchillería El Filo', fondo: '#140808', tinta: '#ff5a4a', color: '#ff5a4a',
    sub: 'AFILAMOS TODO, PREGUNTAMOS NADA', pared: '#5a3030', piso: '#3a2a26', panel: '#1a1010', barra: '#3a2020', luz: '#ff9a80',
    especial: 'katana', rack: ['machete', 'cuchillo', 'bate', 'llave'],
    cajero: { cara: 7, ropa: null, camisa: '#1a1a1a', estiloPelo: 'chongo' },
    neon: { lineas: ['EL FILO'], c1: '#ff3b3b', c2: '#ffffff', w: 2.6, h: 0.9, flecha: true },
    articulos: () => [
      { id: 'katana', nombre: 'Katana', precio: 1800, desc: 'Hoja larga y curva: corta a dos de un solo tajo y llega más lejos que el machete. Solo se vende aquí.', dar: j => j.darArma('katana'), tiene: j => !!j.armas.katana },
      A('machete'), A('cuchillo'), A('bate'), A('llave')
    ]
  },
  seguridad: {
    nombre: 'SEGURIDAD ESCUDO', bonito: 'Seguridad Escudo', fondo: '#0a1428', tinta: '#7ab8ff', color: '#4a8aff',
    sub: 'PROTECCIÓN PERSONAL CERTIFICADA', pared: '#d8dee8', piso: '#8a94a4', panel: '#1a2a4a', barra: '#2a3a5a', luz: '#e8f2ff',
    especial: 'taser', rack: ['pistola', 'subfusil', 'escopeta'],
    cajero: { cara: 3, ropa: null, camisa: '#1a2a4a', gorra: '#1a2a4a' },
    neon: { lineas: ['ESCUDO', 'SEGURIDAD'], c1: '#5ab0ff', c2: '#ffffff', w: 2.8, h: 1.2 },
    articulos: () => [
      { id: 'taser', nombre: 'Táser', precio: 1200, desc: 'Deja tirado a cualquiera 6 segundos sin matarlo. Sirve contra policías y maleantes. Solo se vende aquí. Incluye 9 cartuchos.', dar: j => j.darArma('taser', 9), tiene: j => !!j.armas.taser },
      { id: 'cartTaser', icono: 'taser', nombre: 'Cartuchos de táser ×9', precio: 90, desc: 'Para el táser.', dar: j => j.darArma('taser', 9), requiere: 'taser' },
      A('chaleco'), A('pistola'), A('balaP'), A('sil_pistola')
    ]
  }
};

export const TIPOS_ARMERIA = Object.keys(ARMERIAS);

const _m = new THREE.Matrix4();
function enPared(g, id, x, y, z, s = 1.7, giro = 0) {
  const w = modeloArma(id);
  _m.makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
  w.quaternion.setFromRotationMatrix(_m);
  if (giro) w.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), giro));
  w.scale.setScalar(s); w.position.set(x, y, z);
  w.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  w.updateMatrixWorld(true);
  const c = new THREE.Box3().setFromObject(w).getCenter(new THREE.Vector3());
  w.position.x += x - c.x; w.position.y += y - c.y;
  g.add(w);
  return w;
}

export function construirArmeria(t, W, L, H, g, caja, m) {
  const T = ARMERIAS[t.tipo], ox = t.interior.ox, oz = t.interior.oz;
  caja(W - 4, 1.05, 1, m(T.barra), 0, 0.52, -L / 2 + 2.6);
  caja(W - 3.9, 0.06, 1.1, m('#e8eef4', { transparent: true, opacity: 0.35 }), 0, 1.08, -L / 2 + 2.6, false);
  caja(W - 1, 2.8, 0.1, m(T.panel), 0, 1.95, -L / 2 + 0.22, false);
  const lista = [T.especial, ...T.rack];
  lista.forEach((id, k) => {
    const fila = k % 2, col = Math.floor(k / 2), x = -W / 2 + 2.3 + col * 3.3 + fila * 0.9, y = 2.8 - fila * 1.0;
    const largo = ['subfusil', 'rifle', 'ametralladora', 'francotirador', 'escopeta', 'recortada', 'escopetaAuto', 'ballesta', 'lanzacohetes'].includes(id);
    caja(2.4, 0.05, 0.08, m('#2a2a2e'), x, y - 0.3, -L / 2 + 0.32, false);
    enPared(g, id, x, y, -L / 2 + 0.38, id === 'katana' ? 2.0 : largo ? 1.9 : 3.0);
    if (id === T.especial) { const et = letrero('ESPECIAL', T.fondo, T.tinta, 1.1, 0.22); et.position.set(x, y - 0.46, -L / 2 + 0.34); g.add(et); }
  });
  const nombre = letrero(T.nombre, T.fondo, T.tinta, 6.5, 0.7); nombre.position.set(0, H - 0.55, -L / 2 + 0.3); g.add(nombre);
  const vx = -W / 2 + 2.2, vz = 1.2;
  caja(1.1, 1.0, 1.1, m('#16161a'), vx, 0.5, vz);
  caja(1.12, 0.05, 1.12, m(T.color, { emissive: T.color, emissiveIntensity: 0.9 }), vx, 1.02, vz, false);
  const vidrio = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.9, 1.05), new THREE.MeshStandardMaterial({ color: '#cfe6f0', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false }));
  vidrio.position.set(vx, 1.5, vz); g.add(vidrio);
  const giro = new THREE.Group(); giro.position.set(vx, 1.45, vz); g.add(giro);
  enPared(giro, T.especial, 0, 0, 0, T.especial === 'katana' ? 0.95 : T.especial === 'escopetaAuto' || T.especial === 'ballesta' ? 1.3 : 2.2);
  const pie = letrero('SOLO AQUÍ', '#0a0a0a', T.tinta, 1, 0.24); pie.position.set(vx, 0.62, vz + 0.56); g.add(pie);
  t.vitrina = giro;
  t.interior.mostrador.set(ox, 0, oz - L / 2 + 3.4);
  t.cajero = this.npc(t, 0, -L / 2 + 1.5, T.cajero);
  const deco = DECORAR[t.tipo]; if (deco) deco(g, caja, m, W, L, H, T, (x, z) => this.j.mundo.agregar(ox + x - 0.3, oz + z - 0.3, ox + x + 0.3, oz + z + 0.3, 1.9));
}

const cil = (g, r1, r2, h, mat, x, y, z, seg = 14, rx = 0, rz = 0) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); k.position.set(x, y, z); k.rotation.x = rx; k.rotation.z = rz; g.add(k); return k; };

const DECORAR = {
  charro(g, caja, m, W, L, H) {
    const paja = m('#d8b46a'), cuero = m('#5a2e14'), oro = m('#d9a93e', { emissive: '#3a2a00', emissiveIntensity: 0.4 });
    for (let k = 0; k < 3; k++) { const z = -1.6 + k * 1.6; cil(g, 0.42, 0.42, 0.03, paja, W / 2 - 0.2, 2.4, z, 18, 0, Math.PI / 2); cil(g, 0.16, 0.2, 0.2, paja, W / 2 - 0.32, 2.4, z, 14, 0, Math.PI / 2); }
    caja(0.5, 0.9, 1.4, m('#3a2210'), W / 2 - 1.4, 0.45, 2.6);
    caja(0.7, 0.3, 1.0, cuero, W / 2 - 1.4, 1.05, 2.6, false);
    caja(0.72, 0.08, 0.5, oro, W / 2 - 1.4, 1.22, 2.6, false);
    const lazo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 28), m('#c8a060')); lazo.position.set(-W / 2 + 0.2, 2.2, -1.8); lazo.rotation.y = Math.PI / 2; g.add(lazo);
    for (const z of [3.6, -3.6 + 1]) { cil(g, 0.32, 0.32, 0.9, m('#6a3a1a'), -W / 2 + 0.6, 0.45, z, 14); cil(g, 0.335, 0.335, 0.06, m('#2a2a2a'), -W / 2 + 0.6, 0.2, z, 14); cil(g, 0.335, 0.335, 0.06, m('#2a2a2a'), -W / 2 + 0.6, 0.7, z, 14); }
    const cartel = letrero('LIENZO CHARRO · DOMINGO 5 PM', '#7a1414', '#f2d27a', 2.6, 0.7); cartel.position.set(-W / 2 + 0.17, 2.3, 1.5); cartel.rotation.y = Math.PI / 2; g.add(cartel);
  },
  trinchera(g, caja, m, W, L, H) {
    const costal = m('#a89870'), verde = m('#3e4a2a'), letra = m('#e8e0b0');
    for (const [x, z] of [[W / 2 - 1.2, 2.6], [W / 2 - 1.2, 0.8], [-W / 2 + 1.3, 3.4]]) for (let f = 0; f < 3; f++) for (let k = 0; k < 3 - f; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 6), costal); s.scale.set(1.25, 0.45, 0.8); s.position.set(x, 0.15 + f * 0.27, z - 0.6 + k * 0.62 + f * 0.31); g.add(s); }
    for (let k = 0; k < 4; k++) { const z = -2.4 + k * 1.1; caja(1.0, 0.6, 0.9, verde, W / 2 - 0.7, 0.3 + (k % 2) * 0.62, z, k % 2 === 0); caja(0.02, 0.18, 0.5, letra, W / 2 - 1.21, 0.32 + (k % 2) * 0.62, z, false); }
    const red = new THREE.Mesh(new THREE.PlaneGeometry(W - 2, 1.4), m('#4a5a2a', { transparent: true, opacity: 0.55, side: THREE.DoubleSide })); red.position.set(0, H - 0.4, 0); red.rotation.x = Math.PI / 2 + 0.12; g.add(red);
    const cartel = letrero('SE COMPRA EQUIPO USADO', '#2a2e1a', '#c8d890', 2.6, 0.7); cartel.position.set(-W / 2 + 0.17, 2.3, -1); cartel.rotation.y = Math.PI / 2; g.add(cartel);
  },
  sierra(g, caja, m, W, L, H) {
    const tronco = m('#7a4e2a'), cafe = m('#6a4a2a'), hueso = m('#e8dcc0');
    for (let k = 0; k < 6; k++) { cil(g, 0.16, 0.16, L - 0.6, tronco, -W / 2 + 0.3, 0.3 + k * 0.42, 0, 10, Math.PI / 2); cil(g, 0.16, 0.16, L - 0.6, tronco, W / 2 - 0.3, 0.3 + k * 0.42, 0, 10, Math.PI / 2); }
    const cabeza = new THREE.Group(); cabeza.position.set(W / 2 - 1.5, 2.3, -L / 2 + 0.45); g.add(cabeza);
    const esc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 6), m('#4a2e16')); esc.rotation.x = Math.PI / 2; cabeza.add(esc);
    const cara = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.5), cafe); cara.position.set(0, -0.05, 0.28); cara.rotation.x = 0.5; cabeza.add(cara);
    for (const s of [-1, 1]) { const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.55, 6), hueso); c1.position.set(s * 0.2, 0.38, 0.25); c1.rotation.z = -s * 0.5; cabeza.add(c1); const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.3, 6), hueso); c2.position.set(s * 0.38, 0.55, 0.25); c2.rotation.z = -s * 1.1; cabeza.add(c2); }
    const canoa = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8), m('#2a6a5a')); canoa.scale.set(0.7, 0.35, 4.2); canoa.position.set(W / 2 - 1.1, 2.9, 0.5); g.add(canoa);
    caja(1.6, 0.8, 0.8, m('#3a5a3a'), W / 2 - 1.4, 0.4, 3.2);
    const cartel = letrero('TEMPORADA DE VENADO', '#1e140a', '#f0c890', 2.4, 0.6); cartel.position.set(-W / 2 + 0.5, 2.9, 1.5); cartel.rotation.y = Math.PI / 2; g.add(cartel);
  },
  filo(g, caja, m, W, L, H) {
    const hoja = new THREE.MeshStandardMaterial({ color: '#d0d6de', metalness: 0.9, roughness: 0.18 }), mango = m('#2a1010'), rojo = m('#ff2a2a', { emissive: '#ff2a2a', emissiveIntensity: 1 });
    for (let k = 0; k < 9; k++) { const z = -3.6 + k * 0.85, larga = 0.6 + (k % 3) * 0.35; caja(0.02, 0.06, larga, hoja, W / 2 - 0.18, 1.6 + (k % 2) * 0.7, z, false); caja(0.04, 0.08, 0.22, mango, W / 2 - 0.18, 1.6 + (k % 2) * 0.7, z + larga / 2 + 0.11, false); }
    for (let k = 0; k < 6; k++) { const z = -3.2 + k * 1.3; caja(0.02, 0.85, 0.05, hoja, -W / 2 + 0.2, 1.9, z, false); caja(0.12, 0.03, 0.12, m('#d9a93e'), -W / 2 + 0.2, 1.45, z, false); caja(0.04, 0.32, 0.04, mango, -W / 2 + 0.2, 1.27, z, false); }
    for (const x of [-W / 2 + 1.2, 0, W / 2 - 1.2]) caja(0.4, 0.05, 2.2, rojo, x, H - 0.06, 0.2, false);
    cil(g, 0.35, 0.35, 0.12, m('#8a8a90'), W / 2 - 0.9, 1.15, 2.9, 20, 0, Math.PI / 2);
    caja(0.7, 1.1, 0.5, m('#2a2a2e'), W / 2 - 0.9, 0.55, 2.9);
    const cartel = letrero('AFILADO EN 5 MINUTOS', '#140808', '#ff5a4a', 2.2, 0.6); cartel.position.set(W / 2 - 0.17, 2.45, 2.9); cartel.rotation.y = -Math.PI / 2; g.add(cartel);
  },
  seguridad(g, caja, m, W, L, H, T, mundo) {
    const azul = m('#1a2a4a'), luz = m('#7ab8ff', { emissive: '#7ab8ff', emissiveIntensity: 1 });
    caja(W - 0.6, 0.12, 0.05, luz, 0, H - 0.6, -L / 2 + 0.3, false);
    const gris = m('#c8ccd4'), placa = m('#d9a93e', { emissive: '#3a2a00', emissiveIntensity: 0.5 });
    for (let k = 0; k < 3; k++) {
      const z = -2 + k * 1.7, x = W / 2 - 0.9, mq = new THREE.Group(); mq.position.set(x, 0, z); mq.rotation.y = -Math.PI / 2; g.add(mq);
      cil(mq, 0.22, 0.26, 0.06, m('#2a2a30'), 0, 0.03, 0); cil(mq, 0.025, 0.025, 0.9, m('#2a2a30'), 0, 0.5, 0, 8);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 10), gris); torso.scale.set(1.15, 1, 0.7); torso.position.y = 1.25; mq.add(torso);
      const ch = new THREE.Mesh(new THREE.CapsuleGeometry(0.215, 0.3, 4, 10), azul); ch.scale.set(1.2, 1, 0.82); ch.position.y = 1.2; mq.add(ch);
      const pl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), placa); pl.position.set(0.1, 1.38, 0.19); mq.add(pl);
      const cab = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), gris); cab.position.y = 1.78; mq.add(cab);
      mundo(x, z);
    }
    for (const [x, z] of [[-W / 2 + 0.6, -L / 2 + 0.6], [W / 2 - 0.6, L / 2 - 0.8]]) { caja(0.18, 0.14, 0.3, m('#e8e8ec'), x, H - 0.25, z, false); caja(0.04, 0.04, 0.02, m('#ff2020', { emissive: '#ff2020', emissiveIntensity: 1 }), x, H - 0.25, z + 0.16, false); }
    for (let k = 0; k < 3; k++) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 6), azul); e.rotation.z = Math.PI / 2; e.position.set(-W / 2 + 0.2, 2.2, -2 + k * 1.5); g.add(e); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 6), m('#e8f2ff')); b.rotation.z = Math.PI / 2; b.position.set(-W / 2 + 0.24, 2.2, -2 + k * 1.5); g.add(b); }
    const cartel = letrero('CURSOS DE DEFENSA PERSONAL', '#0a1428', '#7ab8ff', 2.6, 0.6); cartel.position.set(-W / 2 + 0.17, 2.95, 1.6); cartel.rotation.y = Math.PI / 2; g.add(cartel);
  }
};
