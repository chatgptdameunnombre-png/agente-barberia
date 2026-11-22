import * as THREE from 'three';
import { Peaton } from './peatones.js?v=202611220519';

const PIDE = ['¡Una cooperación para el artista!', '¡Lo que guste, jefe!', '¡Apoye el arte callejero!'];
const GRACIAS = ['¡Gracias, patrón! ¡Buen viaje!', '¡Ese es mi público!', '¡Que Dios lo bendiga!'];
const al = l => l[Math.random() * l.length | 0];

export class Malabarista {
  constructor(juego) {
    this.j = juego; this.a = null; this.quieto = 0; this.espera = 35;
    this.bolas = new THREE.Group(); this.bolas.visible = false; juego.escena.add(this.bolas);
    this.matB = [new THREE.MeshStandardMaterial({ color: '#ff4f9a', roughness: 0.4 }), new THREE.MeshStandardMaterial({ color: '#3fd2ff', roughness: 0.4 }), new THREE.MeshStandardMaterial({ color: '#ffd23a', roughness: 0.4 })];
    this.matF = new THREE.MeshBasicMaterial({ color: '#ffb040', toneMapped: false });
    const bg = new THREE.SphereGeometry(0.075, 10, 8);
    this.piezas = [0, 1, 2].map(k => { const m = new THREE.Mesh(bg, this.matB[k]); this.bolas.add(m); return m; });
    const hg = new THREE.SpriteMaterial({ map: juego.ciudad.texSuave, color: '#ff9a30', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.llamas = this.piezas.map(m => { const s = new THREE.Sprite(hg); s.scale.setScalar(0.6); s.visible = false; m.add(s); return s; });
  }

  pista() { return this.a?.fase === 'cobrar' ? 'Darle $10 al malabarista' : null; }

  pagar() {
    const a = this.a, j = this.j; if (!a || a.fase !== 'cobrar') return false;
    if (j.jugador.dinero < 10) { j.hud.burbuja?.(a.p, 'Ni modo, para la otra.'); this.irse(); return true; }
    j.jugador.dinero -= 10; j.audio?.dinero?.(); j.hud.popDinero?.(-10); j.hud.burbuja?.(a.p, al(GRACIAS)); j.estadisticas?.sumar?.('propinas', 1);
    this.irse(); return true;
  }

  irse() { const a = this.a; if (!a) return; a.fase = 'irse'; a.p.anim = null; a.p.meta = a.origen; a.p.metaVel = 1.4; a.p.estado = 'irPunto'; a.p.llego = false; a.t = 0; this.bolas.visible = false; }

  llegar(c) {
    const j = this.j, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), lx = fz, lz = -fx;
    const o = { x: c.pos.x + fx * 6 + lx * 5.2, z: c.pos.z + fz * 6 + lz * 5.2 };
    const p = new Peaton(j, { x: o.x, z: o.z, estado: 'irPunto', vestido: { camisa: ['#e84a3a', '#3a8ad8', '#f0c020'][Math.random() * 3 | 0], pantalon: '#2a2a30', sombrero: null } });
    p.fila = true; p.meta = { x: c.pos.x + fx * (c.t.largo / 2 + 4.2) + lx * 1.3, z: c.pos.z + fz * (c.t.largo / 2 + 4.2) + lz * 1.3 }; p.metaVel = 1.7; p.llego = false;
    j.peatones.push(p);
    this.a = { p, c, fase: 'ir', t: 0, origen: o };
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador, c = J.coche, t = performance.now() / 1000;
    this.espera -= dt;
    if (!this.a) {
      if (c && c.tipo !== 'moto' && c.tipo !== 'lancha' && c.vel < 0.4 && !j.policia.estrellas && !j.misiones?.activa && !j.limpia?.a && j.limpia?.cruceCerca(c.pos)) this.quieto += dt; else this.quieto = 0;
      if (this.quieto > 1.6 && this.espera <= 0) { this.espera = 70 + Math.random() * 50; this.quieto = 0; if (Math.random() < 0.6) this.llegar(c); }
      return;
    }
    const a = this.a, p = a.p; a.t += dt;
    if (p.muerto || !j.peatones.includes(p) || p.estado === 'huir') { this.bolas.visible = false; if (p) p.fila = false; this.a = null; return; }
    const fuego = (j.ambiente.noche || 0) > 0.35;
    if (a.fase === 'ir') {
      if (p.llego) { a.fase = 'show'; a.t = 0; p.anim = 'Spell_Simple_Idle_Loop'; p.yaw = Math.atan2(a.c.pos.x - p.pos.x, a.c.pos.z - p.pos.z); }
      if (a.t > 12 || J.coche !== a.c) this.irse();
    } else if (a.fase === 'show') {
      p.yaw = Math.atan2(a.c.pos.x - p.pos.x, a.c.pos.z - p.pos.z); p.vel = 0;
      this.bolas.visible = true;
      const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), lx = fz, lz = -fx;
      this.piezas.forEach((m, k) => {
        const f = t * 5.2 + k * 2.094, lado = Math.cos(f), alto = Math.abs(Math.sin(f));
        m.position.set(p.pos.x + fx * 0.42 + lx * lado * 0.32, 1.5 + alto * 0.85, p.pos.z + fz * 0.42 + lz * lado * 0.32);
        m.material = fuego ? this.matF : this.matB[k]; this.llamas[k].visible = fuego;
      });
      if (fuego && Math.random() < dt * 6) { const m = this.piezas[Math.random() * 3 | 0]; j.humo?.(m.position.x, m.position.y + 0.1, m.position.z, 0.25, '#ff8a30', 0.4); }
      if (a.t > 7) { a.fase = 'cobrar'; a.t = 0; this.bolas.visible = false; p.anim = 'Idle_Talking_Loop'; j.hud.burbuja?.(p, al(PIDE)); for (const q of j.peatones) if (q !== p && !q.muerto && q.pos.distanceTo(p.pos) < 14 && Math.random() < 0.5) j.hud.burbuja?.(q, '¡Bravo!'); }
      if (J.coche !== a.c || a.c.vel > 2.5) { j.hud.burbuja?.(p, '¡Ándele pues!'); this.irse(); }
    } else if (a.fase === 'cobrar') {
      p.yaw = Math.atan2(a.c.pos.x - p.pos.x, a.c.pos.z - p.pos.z);
      if (J.coche !== a.c || a.c.vel > 2.5 || a.t > 9) { j.hud.burbuja?.(p, '¡Gracias de todos modos!'); this.irse(); }
    } else if (a.fase === 'irse') {
      if (p.llego || a.t > 10) { p.fila = false; p.anim = null; p.asignarRutaCercana?.(); p.estado = p.ruta ? 'pasear' : 'quieto'; this.a = null; }
    }
  }
}
