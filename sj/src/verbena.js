import * as THREE from 'three';
import { Peaton } from './peatones.js?v=202611220526';

const N = { do: 261.63, re: 293.66, mi: 329.63, fa: 349.23, sol: 392, la: 440, si: 493.88, do2: 523.25, re2: 587.33, mi2: 659.25 };
const MELODIA = [['mi', 1], ['sol', 1], ['do2', 2], ['si', 1], ['la', 1], ['sol', 2], ['fa', 1], ['la', 1], ['re2', 2], ['do2', 1], ['si', 1], ['la', 2], ['sol', 1], ['mi', 1], ['sol', 1], ['la', 1], ['si', 1], ['re2', 1], ['do2', 2], ['sol', 1], ['mi', 1], ['re', 1], ['fa', 1], ['mi', 2], ['re', 2], ['do', 4]];
const BAJO = [130.81, 98, 130.81, 98, 87.31, 130.81, 87.31, 130.81, 98, 146.83, 98, 123.47, 130.81, 98, 130.81, 98];

export class Verbena {
  constructor(juego) {
    this.j = juego; this.activa = false; this.gente = []; this.t = 0; this.prox = 0; this.nota = 0; this.compas = 0;
    const L = juego.ciudad.lugares.plaza; this.L = L;
    if (!L) return;
    const focos = [], cuerdas = [], r0 = 5.6, r1 = 11, alto0 = 5.2, alto1 = 3.9;
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + k / 8 * Math.PI * 2;
      const A = new THREE.Vector3(L.x + Math.cos(a) * r0, alto0, L.z + Math.sin(a) * r0), B = new THREE.Vector3(L.x + Math.cos(a) * r1, alto1, L.z + Math.sin(a) * r1);
      const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * 0.7; pts.push(p); if (i > 0 && i < 12) focos.push(p.clone().add(new THREE.Vector3(0, -0.12, 0))); }
      cuerdas.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4));
    }
    const mCuerda = new THREE.MeshBasicMaterial({ color: '#1a1a1c' });
    for (const g of cuerdas) juego.escena.add(new THREE.Mesh(g, mCuerda));
    this.matFoco = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
    this.focos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), this.matFoco, focos.length);
    const o = new THREE.Object3D(), c = new THREE.Color(), cols = ['#ffd86a', '#ff6a8a', '#6ad8ff', '#8aff7a', '#ffb04a'];
    focos.forEach((p, i) => { o.position.copy(p); o.updateMatrix(); this.focos.setMatrixAt(i, o.matrix); this.focos.setColorAt(i, c.set(cols[i % cols.length])); });
    this.focos.instanceColor.needsUpdate = true;
    juego.escena.add(this.focos);
  }

  armar() {
    const j = this.j, L = this.L;
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2 + 0.2, r = 8.4 + (k % 3) * 1.3;
      const q = new Peaton(j, { x: L.x + Math.cos(a) * r, z: L.z + Math.sin(a) * r, estado: 'quieto' });
      q.fila = true; q.anim = k % 4 === 3 ? 'Idle_Talking_Loop' : 'Dance_Loop'; q.yaw = a + Math.PI + (Math.random() - 0.5);
      j.peatones.push(q); this.gente.push(q);
    }
    this.activa = true;
  }

  quitar() {
    const j = this.j;
    for (const q of this.gente) { q.fila = false; q.anim = null; if (!q.muerto && j.peatones.includes(q) && q.estado === 'quieto') { q.asignarRutaCercana?.(); q.estado = q.ruta ? 'pasear' : 'quieto'; } }
    this.gente = []; this.activa = false;
  }

  musica(d) {
    const a = this.j.audio, c = a?.ctx; if (!c) return;
    const v = 0.11 * Math.max(0, 1 - d / 90) * (this.j.jugador.interior ? 0 : 1); if (v < 0.004) { this.prox = 0; return; }
    const negra = 0.25, ahora = c.currentTime;
    if (this.prox < ahora) { this.prox = this.proxM = ahora + 0.05; }
    while (this.prox < ahora + 0.4) {
      const t = this.prox, b = BAJO[this.compas++ % BAJO.length];
      a.tono(b / 2, negra * 0.9, v * 1.1, 'triangle', null, t); a.tono(b, negra * 0.5, v * 0.35, 'sawtooth', null, t);
      a.tono(b * 1.5, negra * 0.3, v * 0.4, 'square', null, t + negra); a.tono(b * 2, negra * 0.3, v * 0.3, 'square', null, t + negra);
      this.prox += negra * 2;
    }
    while (this.proxM < ahora + 0.4) {
      const [n, dur] = MELODIA[this.nota++ % MELODIA.length], t = this.proxM;
      a.tono(N[n] * 2, negra * dur * 0.88, v * 0.42, 'square', null, t); a.tono(N[n] * 2.5, negra * dur * 0.8, v * 0.16, 'triangle', null, t);
      this.proxM += negra * dur;
    }
  }

  actualizar(dt) {
    if (!this.L) return;
    const j = this.j, h = j.ambiente.hora ?? 12, jp = j.jugador.posicion, d = Math.hypot(jp.x - this.L.x, jp.z - this.L.z);
    const noche = j.ambiente.noche || 0, t = performance.now() / 1000;
    this.matFoco.color.setScalar(noche > 0.2 ? 1.5 + Math.sin(t * 3) * 0.2 : 0.55);
    const hora = h >= 20 || h < 0.5;
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 2;
      if (hora && !this.activa && d < 140 && d > 25 && !j.misiones?.activa && !j.policia.estrellas) this.armar();
      else if (this.activa && (!hora || d > 220)) this.quitar();
    }
    if (!this.activa) return;
    this.gente = this.gente.filter(q => j.peatones.includes(q));
    if (this.gente.some(q => q.estado === 'huir' || q.muerto)) { this.quitar(); return; }
    this.musica(d);
  }
}
