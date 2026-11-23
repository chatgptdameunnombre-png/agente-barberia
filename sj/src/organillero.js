import * as THREE from 'three';
import { Peaton } from './peatones.js?v=202611221845';

const NOTAS = [392, 440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99];
const TONADA = [[4, 1], [5, 1], [4, 1], [3, 1], [2, 2], [0, 2], [1, 1], [2, 1], [3, 1], [1, 1], [0, 4], [4, 1], [5, 1], [6, 1], [7, 1], [6, 2], [4, 2], [5, 1], [4, 1], [3, 1], [1, 1], [2, 4]];

function organillo() {
  const g = new THREE.Group(); g.userData.siempreVisible = true;
  const madera = new THREE.MeshStandardMaterial({ color: '#7a4a24', roughness: 0.55 }), oro = new THREE.MeshStandardMaterial({ color: '#d8b04a', roughness: 0.3, metalness: 0.7 });
  const c = document.createElement('canvas'); c.width = 128; c.height = 96; const x = c.getContext('2d');
  x.fillStyle = '#7a4a24'; x.fillRect(0, 0, 128, 96); x.strokeStyle = '#d8b04a'; x.lineWidth = 4; x.strokeRect(6, 6, 116, 84);
  for (let k = 0; k < 9; k++) { x.fillStyle = k % 2 ? '#e8d8a8' : '#d8b04a'; x.fillRect(16 + k * 11, 22, 7, 52 - Math.abs(k - 4) * 6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const frente = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 });
  const caja = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.42), [madera, madera, madera, madera, frente, madera]); caja.position.set(0, 1.05, 0.55); caja.castShadow = true; g.add(caja);
  const tapa = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.46), oro); tapa.position.set(0, 1.33, 0.55); g.add(tapa);
  const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 6), madera); pata.position.set(0, 0.4, 0.55); g.add(pata);
  const manija = new THREE.Group(); manija.position.set(0.33, 1.05, 0.55); g.add(manija);
  const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.03), oro); brazo.position.y = 0.09; manija.add(brazo);
  const pomo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6).rotateZ(Math.PI / 2), madera); pomo.position.set(0.05, 0.18, 0); manija.add(pomo);
  const gorra = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), new THREE.MeshStandardMaterial({ color: '#6a4a2a' })); gorra.position.set(-0.45, 0.04, 0.6); g.add(gorra);
  g.userData.manija = manija;
  return g;
}

export class Organillero {
  constructor(juego) {
    this.j = juego; this.p = null; this.prox = 0; this.nota = 0; this.dado = 0;
    const P = juego.catedral?.puerta; if (!P) return;
    const x = P.x - 8.5, z = P.z + 9.3;
    const p = new Peaton(juego, { x, z, estado: 'quieto', vestido: { camisa: '#8a6a44', pantalon: '#6a5034', gorra: '#6a4a2a', ropa: null } });
    p.fila = true; p.yaw = 0; p.anim = 'Idle_Loop'; p.organillero = true;
    const o = organillo(); p.grupo.add(o); this.caja = o;
    juego.peatones.push(p); this.p = p; this.pos = new THREE.Vector3(x, 0, z);
  }

  cerca() { const J = this.j.jugador; return !!this.p && !this.p.muerto && !J.coche && Math.hypot(J.pos.x - this.p.pos.x, J.pos.z - this.p.pos.z) < 2.6; }

  dar() {
    if (!this.cerca()) return false;
    const j = this.j, J = j.jugador;
    if (J.dinero < 10) { j.hud.burbuja?.(this.p, 'Gracias de todos modos, joven.'); return true; }
    J.dinero -= 10; j.hud.popDinero?.(-10); j.audio?.dinero?.(); this.dado = 4;
    j.hud.burbuja?.(this.p, ['¡Gracias, joven! Que tenga buen día.', '¡Dios se lo pague!', '¡Una para usted!'][Math.random() * 3 | 0]);
    j.estadisticas?.sumar?.('propinas', 1);
    return true;
  }

  actualizar(dt) {
    const j = this.j, p = this.p; if (!p) return;
    if (p.muerto || !j.peatones.includes(p)) { this.p = null; return; }
    p.yaw = 0; if (p.estado === 'quieto') p.pos.copy(this.pos);
    const jp = j.jugador.posicion, d = Math.hypot(jp.x - p.pos.x, jp.z - p.pos.z), h = j.ambiente.hora ?? 12;
    const toca = h > 8 && h < 20 && p.estado === 'quieto';
    this.caja.userData.manija.rotation.x += toca ? dt * 6 : 0;
    this.dado -= dt;
    const a = j.audio, c = a?.ctx; if (!c || !toca || d > 70) { this.prox = 0; return; }
    const v = 0.07 * (1 - d / 70) * (j.jugador.interior ? 0 : 1) * (this.dado > 0 ? 1.4 : 1), negra = 0.3, ahora = c.currentTime;
    if (this.prox < ahora) this.prox = ahora + 0.05;
    while (this.prox < ahora + 0.4) {
      const [n, dur] = TONADA[this.nota++ % TONADA.length], f = NOTAS[n], t = this.prox, L = negra * dur;
      a.tono(f, L * 0.92, v * 0.6, 'square', null, t, f * 1.006); a.tono(f * 2, L * 0.8, v * 0.25, 'triangle', null, t); a.tono(f / 2, L * 0.9, v * 0.25, 'sine', null, t);
      this.prox += L;
    }
  }
}
