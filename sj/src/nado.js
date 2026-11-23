import * as THREE from 'three';
import { enLago } from './ciudad.js?v=202611222131';

export class Nado {
  constructor(juego) {
    this.j = juego; this.t = 0; this.antes = false; this.sig = 0;
    const geo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.62, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.88, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    this.anillos = Array.from({ length: 16 }, () => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: '#dff0f6', transparent: true, opacity: 0, depthWrite: false }));
      m.visible = false; m.renderOrder = 3; juego.escena.add(m);
      return { m, vida: 0, max: 1, tam: 1 };
    });
  }

  onda(x, z, tam = 1.6, vida = 1.4, fuerza = 0.5) {
    const a = this.anillos[this.sig = (this.sig + 1) % this.anillos.length];
    a.m.position.set(x, 0.285, z); a.vida = a.max = vida; a.tam = tam; a.fuerza = fuerza; a.m.visible = true;
  }

  chapuzon(x, z, grande) {
    const j = this.j, n = grande ? 6 : 3;
    for (let k = 0; k < n; k++) this.onda(x + (Math.random() - 0.5) * 0.8, z + (Math.random() - 0.5) * 0.8, (grande ? 3.5 : 2) + k * 0.6, 1.6 + k * 0.15, 0.7);
    for (let k = 0; k < (grande ? 14 : 6); k++) j.humo?.(x + (Math.random() - 0.5) * (grande ? 3 : 1), 0.4 + Math.random() * 0.6, z + (Math.random() - 0.5) * (grande ? 3 : 1), grande ? 1.4 : 0.8, '#f2f8fa', 0.7);
    const a = j.audio; if (a?.ctx) { const v = a.dist({ x, z }); a.ruidoCorto(grande ? 0.9 : 0.45, grande ? 500 : 800, (grande ? 0.7 : 0.35) * v); a.ruidoCorto(0.25, 2400, 0.12 * v, 'bandpass', 0.9); }
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador, L = j.ciudad.lago;
    if (!L) return;
    const nada = !!J.nadando && !J.coche && !J.muerto;
    if (nada && !this.antes) this.chapuzon(J.pos.x, J.pos.z, false);
    this.antes = nada;
    if (nada) {
      this.t -= dt;
      if (this.t <= 0) {
        const mueve = J.velocidad > 0.3;
        this.t = mueve ? 0.42 : 1.1;
        this.onda(J.pos.x + Math.sin(J.yaw) * 0.4, J.pos.z + Math.cos(J.yaw) * 0.4, mueve ? 1.5 : 1.1, mueve ? 1.2 : 1.8, mueve ? 0.55 : 0.35);
        const a = j.audio; if (a?.ctx && mueve) a.ruidoCorto(0.16, 420 + Math.random() * 380, 0.1);
      }
    }
    for (const c of j.coches) {
      if (c.tipo === 'lancha' || c.quemado) continue;
      const dentro = enLago(L, c.pos.x, c.pos.z, 0.6);
      if (!dentro) { if (c.hundido && !c.ahogado) c.hundido = 0; continue; }
      if (!c.hundido) { c.hundido = 0.001; this.chapuzon(c.pos.x, c.pos.z, true); }
      c.vx *= 1 - Math.min(1, dt * 2.2); c.vz *= 1 - Math.min(1, dt * 2.2);
      c.hundido = Math.min(c.t.alto + 0.55, c.hundido + dt * 0.42);
      if (Math.random() < dt * 5) this.onda(c.pos.x + (Math.random() - 0.5) * c.t.ancho, c.pos.z + (Math.random() - 0.5) * c.t.largo * 0.6, 1.2, 1.1, 0.4);
      if (c.hundido > 0.55 && !c.ahogado) {
        c.ahogado = true;
        if (J.coche === c) { j.subirBajar(); J.pos.set(c.pos.x + c.fz * (c.t.ancho / 2 + 0.9), 0, c.pos.z - c.fx * (c.t.ancho / 2 + 0.9)); j.hud.notificar('alerta', 'Al agua', 'Tu coche se hundió en el lago. Nada a la orilla.', 3); }
        else if (c.conductor) c.conductor = null;
        c.sirena = false; c.luces = false;
      }
    }
    for (const a of this.anillos) {
      if (a.vida <= 0) continue;
      a.vida -= dt;
      const k = 1 - a.vida / a.max;
      a.m.scale.setScalar(0.25 + k * a.tam);
      a.m.material.opacity = Math.max(0, (1 - k) * (1 - k) * a.fuerza);
      if (a.vida <= 0) a.m.visible = false;
    }
  }
}
