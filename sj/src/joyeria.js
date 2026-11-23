import * as THREE from 'three';
import { letrero } from './ciudad.js?v=202611221927';

export const JOYERIA = { pared: '#d9d2c4', piso: '#1c2440', neon: { lineas: ['JOYERÍA', 'DIAMANTE'], c1: '#7ae0ff', c2: '#ffffff', w: 3.0, h: 1.2 } };

const ORO = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.2, emissive: '#3a2600', emissiveIntensity: 0.4 });
const GEMAS = ['#7ae0ff', '#ff3b6a', '#4fe08a', '#ffffff'].map(c => new THREE.MeshStandardMaterial({ color: c, metalness: 0.2, roughness: 0.05, emissive: c, emissiveIntensity: 0.45 }));
const VIDRIO = new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.18, roughness: 0.03, metalness: 0.2, depthWrite: false });
const VIDRIO_ROTO = new THREE.MeshStandardMaterial({ color: '#b8c8d0', transparent: true, opacity: 0.4, roughness: 0.6, depthWrite: false, wireframe: true });

export function construirJoyeria(t, W, L, H, g, caja, m) {
  const ox = t.interior.ox, oz = t.interior.oz;
  caja(W - 0.6, 0.12, 0.05, m('#7ae0ff', { emissive: '#7ae0ff', emissiveIntensity: 0.8 }), 0, H - 0.5, -L / 2 + 0.3, false);
  const nombre = letrero('JOYERÍA DIAMANTE', '#0a0a14', '#7ae0ff', 6, 0.7); nombre.position.set(0, H - 1.1, -L / 2 + 0.3); g.add(nombre);
  caja(6, 1.05, 0.9, m('#2a1c14'), 0, 0.52, -L / 2 + 2.6);
  caja(6.05, 0.05, 0.95, m('#e8e0d0'), 0, 1.07, -L / 2 + 2.6, false);
  const fuerte = caja(2.2, 2.6, 0.9, new THREE.MeshStandardMaterial({ color: '#7a8088', metalness: 0.8, roughness: 0.35 }), W / 2 - 2, 1.3, -L / 2 + 0.75);
  const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 20), new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.9, roughness: 0.2 })); rueda.rotation.x = Math.PI / 2; rueda.position.set(W / 2 - 2, 1.4, -L / 2 + 1.25); g.add(rueda);
  for (const [x, z] of [[-W / 2 + 0.5, -L / 2 + 0.5], [W / 2 - 0.5, L / 2 - 0.6], [-W / 2 + 0.5, L / 2 - 0.6]]) { caja(0.2, 0.16, 0.32, m('#f2f2f4'), x, H - 0.25, z, false); caja(0.05, 0.05, 0.02, m('#ff2020', { emissive: '#ff2020', emissiveIntensity: 1 }), x, H - 0.25, z + 0.17, false); }
  const candil = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#fff0c8', emissiveIntensity: 1.2, transparent: true, opacity: 0.9 })); candil.position.set(0, H - 0.8, 0.5); g.add(candil);
  t.vitrinas = [];
  const pos = [[-5.5, -1.2], [0, -1.2], [5.5, -1.2], [-5.5, 3.2], [0, 3.2], [5.5, 3.2]];
  pos.forEach(([x, z], k) => {
    caja(1.8, 0.95, 0.9, m('#2a1c14'), x, 0.475, z);
    caja(1.82, 0.04, 0.92, m('#c8a040'), x, 0.97, z, false);
    const v = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.8), VIDRIO); v.position.set(x, 1.24, z); g.add(v);
    const joyas = new THREE.Group(); joyas.position.set(x, 1.02, z); g.add(joyas);
    for (let q = 0; q < 5; q++) {
      const px = -0.6 + q * 0.3;
      if (q % 2) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 18), ORO); a.position.set(px, 0.08, 0); a.rotation.x = Math.PI / 2.4; joyas.add(a); const gm = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), GEMAS[(k + q) % 4]); gm.position.set(px, 0.15, 0.05); joyas.add(gm); }
      else { const col = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 24), ORO); col.position.set(px, 0.03, 0.05); col.rotation.x = -Math.PI / 2; joyas.add(col); const gm = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), GEMAS[(k + q + 1) % 4]); gm.position.set(px, 0.06, 0.15); joyas.add(gm); }
    }
    t.vitrinas.push({ x: ox + x, z: oz + z + 0.85, vidrio: v, joyas, rota: false });
  });
  t.interior.mostrador.set(ox, 0, oz - L / 2 + 3.4);
  t.cajero = this.npc(t, 0, -L / 2 + 1.5, { cara: 2, ropa: null, camisa: '#0a0a14' });
}

export function romperVitrina(j, v) {
  if (!v || v.rota) return;
  v.rota = true; v.vidrio.material = VIDRIO_ROTO; v.joyas.visible = false;
  j.audio?.ruidoCorto?.(0.35, 4200, 0.35, 'highpass'); j.audio?.tono?.(2600, 0.25, 0.06, 'triangle');
  j.chispa?.(new THREE.Vector3(v.x, 1.3, v.z - 0.85), '#d8f0ff');
}

export function reponerVitrinas(t) { for (const v of t.vitrinas || []) { v.rota = false; v.vidrio.material = VIDRIO; v.joyas.visible = true; } }

export const ARTICULOS_JOYERIA = () => [
  { id: 'reloj', nombre: 'Reloj de oro', precio: 6000, verbo: 'Comprar', desc: 'Presume en JacaGram: +80 seguidores.', dar: jj => { const j = jj.juego; if (j?.redes) { j.redes.seguidores += 80; j.redes.publicar?.('foto', '', { forzar: true }); } } },
  { id: 'cadena', nombre: 'Cadena de oro', precio: 3000, verbo: 'Comprar', desc: 'Brilla de noche: +35 seguidores.', dar: jj => { const j = jj.juego; if (j?.redes) j.redes.seguidores += 35; } },
  { id: 'anillo', nombre: 'Anillo de diamante', precio: 4500, verbo: 'Comprar', desc: 'Un regalo para tu compañero: +50 seguidores.', dar: jj => { const j = jj.juego; if (j?.redes) j.redes.seguidores += 50; } }
];
