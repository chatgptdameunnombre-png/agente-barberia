import * as THREE from 'three';

const LODO = new THREE.Color('#6b5a44'), _c = new THREE.Color();

function texRayas() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  for (let x = 0; x < 64; x += 8) { g.fillStyle = x % 16 ? '#2f6fd6' : '#5a9af0'; g.fillRect(x, 0, 8, 64); }
  g.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 120; k++) g.fillRect(Math.random() * 64, Math.random() * 64, 1, 3);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t;
}

export class Lavado {
  constructor(juego) {
    this.j = juego; this.activo = null;
    const G = juego.gasolinera; if (!G?.cepillos) return;
    const box = new THREE.Box3().setFromObject(G.cepillos), cen = box.getCenter(new THREE.Vector3());
    this.LX = cen.x; this.LZ = cen.z; this.Y = box.min.y - 0.25;
    G.cepillos.visible = false;
    const mat = new THREE.MeshStandardMaterial({ map: texRayas(), roughness: 0.95 });
    this.rodillos = [];
    for (const s of [-1, 1]) for (const z of [-2, 2]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3, 14), mat); m.position.set(this.LX + s * 1.9, this.Y + 1.7, this.LZ + z); juego.escena.add(m); this.rodillos.push({ m, eje: 'y', s }); }
    const arriba = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 4.6, 14).rotateZ(Math.PI / 2), mat); arriba.position.set(this.LX, this.Y + 3.3, this.LZ); juego.escena.add(arriba); this.rodillos.push({ m: arriba, eje: 'x', s: 1 });
  }

  marcasMapa() { return this.LX !== undefined ? [{ x: this.LX, z: this.LZ, tipo: 'icono', ic: { c: '#2a6ec8', t: 'coche' }, nombre: 'Autolavado · $15' }] : []; }

  dentro(c) { return this.LX !== undefined && Math.abs(c.pos.x - this.LX) < 2.3 && Math.abs(c.pos.z - this.LZ) < 4.6; }

  ensuciar(c, dt) {
    const pin = c.pinta; if (!pin || c.tipo === 'moto' || c.tipo === 'lancha') return;
    if (c.colorSucio && !pin.color.equals(c.colorSucio)) { c.colorBase = null; c.suciedad = 0; }
    if (!c.colorBase) { c.colorBase = pin.color.clone(); c.rugBase = pin.roughness; c.capaBase = pin.clearcoat ?? 0; }
    const lluvia = this.j.ambiente.lluvia || 0, v = c.vel || 0;
    if (v > 1) c.suciedad = Math.min(0.85, (c.suciedad || 0) + dt * (0.0012 + v * 0.00006 + lluvia * 0.006));
    const s = c.suciedad || 0;
    _c.copy(c.colorBase).lerp(LODO, s * 0.5); pin.color.copy(_c);
    pin.roughness = Math.min(1, c.rugBase + s * 0.55); if (pin.clearcoat !== undefined) pin.clearcoat = Math.max(0, c.capaBase * (1 - s * 0.9));
    c.colorSucio = pin.color.clone();
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador, c = J.coche;
    if (c) this.ensuciar(c, dt);
    if (this.LX === undefined) return;
    const A = this.activo;
    for (const r of this.rodillos) { const vel = A ? 14 : 0.4; if (r.eje === 'y') r.m.rotation.y += dt * vel * r.s; else r.m.rotation.x += dt * vel; }
    if (!A) {
      if (c && this.dentro(c) && c.vel < 3.5 && !this.salio) {
        if (J.dinero < 15) { if (!this.aviso) { this.aviso = true; j.hud.notificar('alerta', 'Autolavado', 'El lavado cuesta $15.', 2.5); } return; }
        J.dinero -= 15; j.audio?.dinero?.(); j.hud.popDinero?.(-15);
        this.activo = { c, t: 0, s0: c.suciedad || 0 }; this.aviso = false;
        j.hud.notificar('coche', 'Autolavado', 'Espera tantito con el coche adentro…', 2.5);
      }
      if (!c || !this.dentro(c)) this.salio = false;
      return;
    }
    A.t += dt;
    if (J.coche !== A.c || !this.dentro(A.c)) { this.activo = null; this.salio = true; return; }
    A.c.vx *= 1 - Math.min(1, dt * 3); A.c.vz *= 1 - Math.min(1, dt * 3);
    A.c.suciedad = A.s0 * Math.max(0, 1 - A.t / 4);
    if (Math.random() < dt * 25) j.humo?.(A.c.pos.x + (Math.random() - 0.5) * 2.4, 0.6 + Math.random() * 1.4, A.c.pos.z + (Math.random() - 0.5) * 3.6, 0.7, '#f4f8fb', 1.1);
    const a = j.audio; if (a?.ctx && Math.random() < dt * 8) a.ruidoCorto(0.35, 700 + Math.random() * 600, 0.08, 'lowpass', 0.6);
    if (A.t > 4.2) { A.c.suciedad = 0; this.activo = null; this.salio = true; j.hud.notificar('ok', 'Autolavado', '¡Quedó como nuevo!', 2.5); j.estadisticas?.sumar?.('lavados', 1); }
  }
}
