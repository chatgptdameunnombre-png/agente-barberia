import * as THREE from 'three';
import { Peaton } from './peatones.js?v=202611221927';
import { Coche, nuevaRutaIA } from './vehiculos.js?v=202611221927';

const VIVAS = ['¡Vivan los novios!', '¡Que se besen!', '¡Felicidades!', '¡Beso, beso, beso!'];
const al = l => l[Math.random() * l.length | 0];

function letrero() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 64);
  g.strokeStyle = '#d8b04a'; g.lineWidth = 4; g.strokeRect(4, 4, 248, 56);
  g.fillStyle = '#b8304a'; g.font = 'italic 700 30px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Recién casados', 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function adornarCoche(c) {
  const blanco = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }), g = new THREE.Group();
  const L = c.t.largo, A = c.t.ancho, y = 0.3 + c.t.alto + 0.04;
  for (const s of [-1, 1]) { const lazo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 16), blanco); lazo.scale.set(1, 0.55, 1); lazo.rotation.x = -Math.PI / 2 + 0.3; lazo.position.set(s * 0.15, y, L * 0.36); g.add(lazo); }
  const nudo = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), blanco); nudo.position.set(0, y, L * 0.36); g.add(nudo);
  for (const s of [-1, 1]) { const cinta = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, L * 0.3), blanco); cinta.position.set(s * A * 0.28, y - 0.02, L * 0.24); cinta.rotation.y = -s * 0.25; g.add(cinta); }
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshBasicMaterial({ map: letrero() })); placa.position.set(0, 0.3 + c.t.alto * 0.62, -L / 2 - 0.16); placa.rotation.y = Math.PI; g.add(placa);
  const latas = new THREE.MeshStandardMaterial({ color: '#c8ccd2', roughness: 0.3, metalness: 0.8 });
  for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8).rotateZ(Math.PI / 2), latas); l.position.set(-0.4 + k * 0.27, 0.06, -L / 2 - 0.7 - (k % 2) * 0.25); g.add(l); }
  c.carro.add(g); c.adornoBoda = g;
}

export class Boda {
  constructor(juego) {
    this.j = juego; this.b = null; this.ultimaHora = null; this.forzar = false;
    const N = 360, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); this.geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.arroz = new THREE.Points(this.geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, depthWrite: false }));
    this.arroz.frustumCulled = false; this.arroz.visible = false; juego.escena.add(this.arroz);
    this.part = Array.from({ length: N }, () => ({ vida: 0, x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0 }));
    this.sig = 0;
  }

  lanzar(x, y, z, hacia, n = 40) {
    const C = this.geo.attributes.color, col = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const i = this.sig = (this.sig + 1) % this.part.length, p = this.part[i];
      p.vida = 1.6 + Math.random() * 0.8; p.x = x; p.y = y; p.z = z;
      const dx = hacia.x - x, dz = hacia.z - z, d = Math.hypot(dx, dz) || 1;
      p.vx = dx / d * (1.8 + Math.random() * 1.5) + (Math.random() - 0.5) * 1.4; p.vz = dz / d * (1.8 + Math.random() * 1.5) + (Math.random() - 0.5) * 1.4; p.vy = 2.8 + Math.random() * 1.8;
      col.set(Math.random() < 0.6 ? '#fbf8f0' : Math.random() < 0.5 ? '#f4b8c8' : '#e85a7a'); C.setXYZ(i, col.r, col.g, col.b);
    }
    C.needsUpdate = true; this.arroz.visible = true;
  }

  aplauso(v) { this.aplT = 2.8; this.aplV = v; }

  persona(x, z, yaw, o = {}) {
    const j = this.j, p = new Peaton(j, { x, z, yaw, estado: 'quieto', vestido: o.vestido });
    if (o.modelo) p.modelo = o.modelo;
    p.fila = true; p.boda = true; p.yaw = yaw; p.anim = o.anim || null;
    j.peatones.push(p); return p;
  }

  armar() {
    const j = this.j, P = j.catedral?.puerta; if (!P) return;
    const b = { t: 0, fase: 'espera', invitados: [], P };
    b.novia = this.persona(P.x + 0.4, P.z + 0.6, 0, { modelo: 'novia', vestido: { mujer: true, estiloPelo: 'largo', prenda: 'vestido', camisa: '#f6f2ea', pantalon: '#f6f2ea', zapatos: '#f2ece0' } });
    b.novio = this.persona(P.x - 0.4, P.z + 0.6, 0, { modelo: 'novio', vestido: { mujer: false, estiloPelo: 'corto', camisa: '#141418', pantalon: '#141418', zapatos: '#101010', ropa: null } });
    b.novia.formal = b.novio.formal = true;
    for (let k = 0; k < 10; k++) {
      const lado = k % 2 ? 1 : -1, fila = k >> 1, z = P.z + 2.4 + fila * 1.6 + (Math.random() - 0.5) * 0.3;
      const q = this.persona(P.x + lado * (1.7 + Math.random() * 0.4), z, lado > 0 ? -Math.PI / 2 : Math.PI / 2, { anim: Math.random() < 0.5 ? 'Idle_Talking_Loop' : null });
      b.invitados.push(q);
    }
    const c = new Coche(j, 'sedan', '#f7f7f4', P.x - 4, P.z + 14.1, -Math.PI / 2);
    c.reservado = true; c.boda = true; c.puertaObj = 0; adornarCoche(c); j.coches.push(c); b.coche = c;
    this.b = b;
  }

  quitar(b, limpio) {
    const j = this.j;
    for (const p of [b.novia, b.novio, ...b.invitados]) {
      if (!p) continue;
      p.fila = false; p.boda = false; p.anim = null; p.formal = false;
      if (limpio && !p.muerto && (p === b.novia || p === b.novio)) { const i = j.peatones.indexOf(p); if (i >= 0) { p.quitar(); j.peatones.splice(i, 1); } }
      else if (!p.muerto && p.estado === 'quieto') { p.asignarRutaCercana?.(); p.estado = p.ruta ? 'pasear' : 'quieto'; }
    }
    if (b.coche) b.coche.reservado = false;
    this.b = null;
  }

  ir(p, x, z, v = 1.0) { p.meta = { x, z }; p.metaVel = v; p.estado = 'irPunto'; p.llego = false; }

  actualizar(dt) {
    const j = this.j, h = j.ambiente.hora ?? 12;
    if (this.arroz.visible) {
      const Pp = this.geo.attributes.position; let vivos = 0;
      for (let i = 0; i < this.part.length; i++) { const p = this.part[i]; if (p.vida > 0) { p.vida -= dt; p.vy -= 6 * dt; p.x += p.vx * dt; p.y = Math.max(0.03, p.y + p.vy * dt); p.z += p.vz * dt; if (p.y <= 0.03) { p.vx *= 0.5; p.vz *= 0.5; } vivos++; } else p.y = -10; Pp.setXYZ(i, p.x, p.y, p.z); }
      Pp.needsUpdate = true; if (!vivos) this.arroz.visible = false;
    }
    if (this.aplT > 0) { this.aplT -= dt; const a = j.audio; if (a?.ctx) for (let k = 0; k < 3; k++) if (Math.random() < dt * 12) a.ruidoCorto(0.025, 1800 + Math.random() * 2400, this.aplV * (0.5 + Math.random() * 0.5), 'bandpass', 1.4); }
    const hora = Math.floor(h);
    if (!this.b && ((this.ultimaHora !== null && hora !== this.ultimaHora && (hora === 11 || hora === 14) && Math.random() < 0.7) || this.forzar)) {
      const jp = j.jugador.posicion, P = j.catedral?.puerta;
      if (P && !j.misiones?.activa && Math.hypot(jp.x - P.x, jp.z - P.z) > 30) { this.forzar = false; this.armar(); }
    }
    this.ultimaHora = hora;
    const b = this.b; if (!b) return;
    b.t += dt;
    const todos = b.fase === 'adios' ? b.invitados : [b.novia, b.novio, ...b.invitados];
    if (todos.some(p => p.muerto || p.estado === 'huir' || !j.peatones.includes(p)) || (b.coche && (b.coche.quemado || j.jugador.coche === b.coche))) { this.quitar(b, false); return; }
    const P = b.P, jp = j.jugador.posicion, d = Math.hypot(jp.x - P.x, jp.z - P.z);
    if (b.fase === 'espera') {
      if (b.t > 4 && d < 70) { b.fase = 'salida'; b.t = 0; j.catedral?.campanadas?.(5); this.aplauso(0.12 * Math.max(0.15, 1 - d / 70)); this.ir(b.novia, P.x + 0.35, P.z + 10.2, 0.95); this.ir(b.novio, P.x - 0.35, P.z + 10.2, 0.95); }
      if (b.t > 240) this.quitar(b, true);
    } else if (b.fase === 'salida') {
      for (const q of b.invitados) {
        const dz = Math.abs(q.pos.z - b.novia.pos.z);
        if (dz < 1.4 && !q.tiro) { q.tiro = true; q.anim = 'Spell_Simple_Shoot'; this.lanzar(q.pos.x, 1.6, q.pos.z, b.novia.pos); if (Math.random() < 0.35) j.hud.burbuja?.(q, al(VIVAS)); }
        if (q.tiro && dz > 2.6 && q.anim === 'Spell_Simple_Shoot') q.anim = null;
        q.yaw = Math.atan2(b.novia.pos.x - q.pos.x, b.novia.pos.z - q.pos.z);
      }
      if (b.novia.llego && b.novio.llego) { b.fase = 'beso'; b.t = 0; b.novia.yaw = -Math.PI / 2; b.novio.yaw = Math.PI / 2; b.novia.pos.x = P.x + 0.3; b.novio.pos.x = P.x - 0.3; j.hud.burbuja?.(b.invitados[0], '¡Beso, beso, beso!'); this.aplauso(0.14 * Math.max(0.15, 1 - d / 70)); for (const q of b.invitados) { q.anim = Math.random() < 0.5 ? 'Dance_Loop' : null; } }
    } else if (b.fase === 'beso') {
      b.novia.yaw = -Math.PI / 2; b.novio.yaw = Math.PI / 2;
      if (b.t > 3.5) { b.fase = 'auto'; b.t = 0; const c = b.coche; this.ir(b.novia, c.pos.x + 0.4, P.z + 12.3, 1.0); this.ir(b.novio, c.pos.x - 0.9, P.z + 12.3, 1.0); }
    } else if (b.fase === 'auto') {
      if ((b.novia.llego && b.novio.llego) || b.t > 15) {
        const c = b.coche;
        for (const p of [b.novia, b.novio]) { const i = j.peatones.indexOf(p); if (i >= 0) { p.quitar(); j.peatones.splice(i, 1); } }
        c.conductor = 'ia'; c.ia = nuevaRutaIA(c.pos.x, c.pos.z, c.yaw); if (c.silueta) c.silueta.visible = true;
        b.fase = 'adios'; b.t = 0; b.pito = 0; j.audio?.claxon?.();
      }
    } else if (b.fase === 'adios') {
      b.pito -= dt; if (b.pito <= 0 && b.t < 5) { b.pito = 0.7; if (Math.hypot(jp.x - b.coche.pos.x, jp.z - b.coche.pos.z) < 80) j.audio?.claxon?.(); }
      if (b.t > 7) { j.estadisticas?.sumar?.('bodas', 1); b.novia = b.novio = null; this.quitar(b, true); }
    }
  }
}
