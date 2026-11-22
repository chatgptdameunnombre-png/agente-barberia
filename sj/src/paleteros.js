import * as THREE from 'three';
import { Peaton } from './peatones.js?v=202611220135';

function carrito() {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
  x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#e8317a'; x.fillRect(0, 0, 256, 14); x.fillRect(0, 82, 256, 14);
  x.fillStyle = '#2a7de0'; x.font = '900 40px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PALETAS', 128, 40);
  x.fillStyle = '#e8317a'; x.font = '800 16px Inter, Arial, sans-serif'; x.fillText('DE AGUA Y DE LECHE', 128, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const lado = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }), blanco = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.5 });
  const caja = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.95), [blanco, blanco, blanco, blanco, lado, lado]);
  caja.rotation.y = Math.PI / 2; caja.position.set(0, 0.72, 0); caja.castShadow = true; g.add(caja);
  const tapa = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.66), new THREE.MeshStandardMaterial({ color: '#c9ced4', metalness: 0.6, roughness: 0.3 })); tapa.position.set(0, 1.05, 0); g.add(tapa);
  const negro = new THREE.MeshStandardMaterial({ color: '#1a1a1c', roughness: 0.7 });
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 14).rotateZ(Math.PI / 2), negro); r.position.set(s * 0.36, 0.18, 0.1); g.add(r); }
  const asa = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6).rotateZ(Math.PI / 2), negro); asa.position.set(0, 1.0, -0.58); g.add(asa);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 6), negro); b.position.set(s * 0.33, 0.95, -0.45); b.rotation.x = 0.7; g.add(b); }
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 6), negro); palo.position.set(0.3, 1.6, 0.2); g.add(palo);
  const somb = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.3, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#2a7de0', side: THREE.DoubleSide, roughness: 0.6 })); somb.position.set(0.3, 2.2, 0.2); g.add(somb);
  const camp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 8, 1, true), new THREE.MeshStandardMaterial({ color: '#c9a040', metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide })); camp.position.set(-0.3, 1.12, -0.5); g.add(camp);
  return g;
}

export class Paleteros {
  constructor(juego) {
    this.j = juego; this.lista = []; this.t = 0;
    const bloques = juego.ciudad.bloques.filter(b => ['parque', 'plaza', 'centro', 'catedral', 'mercado'].includes(b.tipo));
    for (let k = 0; k < 4; k++) this.crear(bloques[(k * 3 + 1) % bloques.length]);
  }

  crear(b) {
    const j = this.j, p = new Peaton(j, { tipo: 'civil', vestido: { camisa: '#f4f2ec', pantalon: '#3a3d44' } });
    p.asignarBloque(b); p.paletero = true; p.proxBanca = p.proxCharla = 1e9; p.limpiador = true;
    const c = carrito(); c.position.set(0, 0, 0.85); c.userData.siempreVisible = true; p.grupo.add(c);
    j.peatones.push(p);
    this.lista.push({ p, campana: Math.random() * 6 });
  }

  cerca() {
    const J = this.j.jugador; if (J.coche || J.interior) return null;
    return this.lista.find(q => !q.p.muerto && Math.hypot(q.p.pos.x - J.pos.x, q.p.pos.z - J.pos.z) < 2.2) || null;
  }

  comprar() {
    const q = this.cerca(), j = this.j, J = j.jugador; if (!q) return false;
    if (J.dinero < 15) { j.hud.notificar('alerta', 'No te alcanza', 'La paleta cuesta $15', 2); return true; }
    J.dinero -= 15; J.salud = Math.min(J.saludMax, J.salud + 12); j.hud.popDinero?.(-15); j.audio.compra?.();
    const sabor = ['de limón', 'de mango con chile', 'de fresa', 'de nuez', 'de tamarindo', 'de coco'][Math.random() * 6 | 0];
    j.hud.notificar('ok', 'Paleta ' + sabor, '+12 de salud', 2.2);
    j.hud.burbuja?.(q.p, '¡Bien fría, joven!');
    q.p.estado = 'quieto'; q.p.volverPasear = q.p.t + 3;
    return true;
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    this.lista = this.lista.filter(q => j.peatones.includes(q.p));
    for (const q of this.lista) {
      if (q.p.muerto) continue;
      q.campana -= dt;
      const d = Math.hypot(q.p.pos.x - jp.x, q.p.pos.z - jp.z);
      if (q.campana <= 0) { q.campana = 5 + Math.random() * 5; if (d < 45) { const v = 0.09 * (1 - d / 45), a = j.audio, t = (a?.ctx?.currentTime || 0); for (let k = 0; k < 3; k++) { a?.tono(2093, 0.25, v, 'sine', null, t + k * 0.13); a?.tono(3136, 0.18, v * 0.4, 'sine', null, t + k * 0.13); } } }
    }
  }
}
