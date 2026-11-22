import * as THREE from 'three';

const _v = new THREE.Vector3(), _w = new THREE.Vector3();

function texLibrea() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#1a2846'; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#f2f4f7'; g.fillRect(0, 58, 512, 22);
  g.fillStyle = '#c8202e'; g.fillRect(0, 80, 512, 6);
  g.fillStyle = '#1a2846'; g.font = '900 19px Inter, Arial, sans-serif'; g.textAlign = 'center';
  g.fillText('POLICÍA · SANTA JACARANDA', 128, 76); g.fillText('POLICÍA · SANTA JACARANDA', 384, 76);
  g.fillStyle = '#f2f4f7'; g.font = '800 22px Inter, Arial, sans-serif'; g.fillText('SJ-07', 128, 40); g.fillText('SJ-07', 384, 40);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function modeloHeli() {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  const pinta = new THREE.MeshStandardMaterial({ map: texLibrea(), roughness: 0.38, metalness: 0.35 });
  const azul = new THREE.MeshStandardMaterial({ color: '#1a2846', roughness: 0.4, metalness: 0.35 });
  const gris = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.55, metalness: 0.6 });
  const vidrio = new THREE.MeshStandardMaterial({ color: '#0f1a24', roughness: 0.06, metalness: 0.9, envMapIntensity: 1.4 });
  const perfil = [[0, -2.3], [0.55, -2.25], [0.95, -1.9], [1.2, -1.2], [1.25, -0.2], [1.18, 0.8], [0.95, 1.6], [0.5, 2.15], [0, 2.3]].map(([r, y]) => new THREE.Vector2(r, y));
  const fus = new THREE.Mesh(new THREE.LatheGeometry(perfil, 20).rotateX(Math.PI / 2).scale(1, 0.92, 1), pinta);
  fus.position.y = 0.1; cuerpo.add(fus);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55).rotateX(Math.PI / 2 + 0.35).scale(1.08, 0.95, 1.25), vidrio);
  cab.position.set(0, 0.28, 1.15); cuerpo.add(cab);
  const motor = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.4, 6, 12).rotateX(Math.PI / 2), azul); motor.position.set(0, 1.12, -0.3); cuerpo.add(motor);
  const viga = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.42, 5.2, 12).rotateX(Math.PI / 2), azul); viga.position.set(0, 0.55, -4.4); cuerpo.add(viga);
  const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.9).translate(0, 0.55, 0), azul); aleta.position.set(0, 0.6, -6.85); aleta.rotation.x = -0.35; cuerpo.add(aleta);
  const estab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.5), azul); estab.position.set(0, 0.55, -6.3); cuerpo.add(estab);
  for (const s of [-1, 1]) {
    const patin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 8).rotateX(Math.PI / 2), gris); patin.position.set(s * 1.05, -1.35, 0.1); cuerpo.add(patin);
    const punta = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 10, Math.PI / 2), gris); punta.rotation.y = Math.PI / 2; punta.position.set(s * 1.05, -1.13, 1.8); cuerpo.add(punta);
    for (const z of [-0.8, 0.9]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), gris); p.position.set(s * 0.85, -0.95, z); p.rotation.z = s * 0.45; cuerpo.add(p); }
  }
  const foco = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 10), gris); foco.position.set(0.55, -0.95, 1.4); cuerpo.add(foco);
  const rotor = new THREE.Group(); rotor.position.set(0, 1.78, -0.2); cuerpo.add(rotor);
  rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.32, 10), gris));
  const pala = new THREE.BoxGeometry(0.34, 0.04, 5.6).translate(0, 0.12, 2.9);
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(pala, gris); p.rotation.y = k * Math.PI / 2; rotor.add(p); }
  const disco = new THREE.Mesh(new THREE.CircleGeometry(8.6, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#1e2024', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  disco.position.set(0, 1.92, -0.2); cuerpo.add(disco);
  const colaRotor = new THREE.Group(); colaRotor.position.set(0.18, 1.0, -7.05); cuerpo.add(colaRotor);
  for (let k = 0; k < 2; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 0.16), gris); p.rotation.x = k * Math.PI / 2; colaRotor.add(p); }
  const luz = c => new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
  const roja = luz('#ff2030'); roja.position.set(-1.25, 0.2, 0); const verde = luz('#20ff60'); verde.position.set(1.25, 0.2, 0);
  const estrobo = luz('#ffffff'); estrobo.position.set(0, 1.45, -7.4); const baliza = luz('#ff3040'); baliza.position.set(0, -0.75, -0.6);
  cuerpo.add(roja, verde, estrobo, baliza);
  g.traverse(o => { if (o.isMesh && o !== disco) o.castShadow = true; });
  const cono = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24, 1, true).translate(0, -0.5, 0), new THREE.MeshBasicMaterial({ color: '#fff6d8', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  const mancha = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fffbe0', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  return { grupo: g, cuerpo, rotor, disco, colaRotor, roja, verde, estrobo, baliza, cono, mancha, pinta, azul };
}

export class Helicoptero {
  constructor(juego, x, z) {
    this.j = juego;
    Object.assign(this, modeloHeli());
    juego.escena.add(this.grupo, this.cono, this.mancha);
    this.pos = new THREE.Vector3(x, 62, z);
    this.vel = new THREE.Vector3();
    this.vida = 100; this.t = 0; this.retirar = false; this.estado = 'vuela';
    this.ve = false; this.pista = juego.jugador.posicion.clone(); this.buscando = 0;
    this.luzP = this.pista.clone(); this.cadencia = 2.5; this.rafaga = 0; this.chop = 0; this.humoT = 0; this.giro = 0; this.yaw = 0;
    juego.hud.notificar('alerta', 'Helicóptero', 'Te busca desde el aire. Escóndete bajo techo o déjalo atrás.', 3.5);
  }

  cubierto(p) {
    const j = this.j;
    if (j.jugador.interior) return true;
    const T = j.tren; if (T && Math.abs(p.x - T.X) < 3.6 && p.z > T.Z0 && p.z < T.Z1) return true;
    const G = j.gasolinera?.centro; if (G && Math.abs(p.x - G.x) < 13.6 && Math.abs(p.z - G.z) < 7.1) return true;
    return false;
  }

  veA(p) {
    const dx = p.x - this.pos.x, dz = p.z - this.pos.z;
    if (Math.hypot(dx, dz) > 62 || this.cubierto(p)) return false;
    return this.j.mundo.rayo(this.pos.x, this.pos.y - 1.5, this.pos.z, p.x, 1.4, p.z, 0.3) > 0.97;
  }

  daño(n) {
    if (this.estado !== 'vuela') return;
    this.vida -= n;
    if (this.vida <= 0) this.derribar();
  }

  derribar() {
    if (this.estado !== 'vuela') return;
    this.estado = 'cae'; this.giro = 1.5; this.vel.y = 0;
    const j = this.j;
    j.explosion(this.pos.x, this.pos.y, this.pos.z, 'jugador');
    j.hud.aviso('¡Derribaste el helicóptero!', 3);
    j.estadisticas?.sumar?.('helicopteros', 1);
    j.noticias?.avisar?.('helicoptero');
    j.policia.subir(Math.min(5, j.policia.estrellas + 1));
  }

  quitar() { this.j.escena.remove(this.grupo, this.cono, this.mancha); }

  actualizar(dt, quiere) {
    const j = this.j, jp = j.jugador.posicion, a = j.audio, noche = j.ambiente.noche || 0;
    this.t += dt;
    this.cono.visible = this.mancha.visible = false;
    if (this.estado === 'cae') return this.caer(dt);
    if (this.estado === 'restos') { this.restos -= dt; const y = this.pos.y; if (Math.random() < dt * 6) j.humo?.(this.pos.x, y + 0.5, this.pos.z, 2.2, '#2a2826', 3); if (this.restos > 8 && Math.random() < dt * 14) j.humo?.(this.pos.x + (Math.random() - 0.5) * 3, y - 0.4, this.pos.z + (Math.random() - 0.5) * 3, 1.1, '#ff7a24', 0.5); return this.restos > 0; }
    if (!quiere) this.retirar = true;
    this.ve = !this.retirar && this.veA(jp);
    if (this.ve) { this.pista.copy(jp); this.buscando = 0; } else this.buscando += dt;
    let tx, tz, ty;
    if (this.retirar) { tx = this.pos.x + this.vel.x * 3 + 60; tz = this.pos.z + this.vel.z * 3 + 60; ty = 90; }
    else if (this.ve) { const an = this.t * 0.38; tx = jp.x + Math.cos(an) * 26; tz = jp.z + Math.sin(an) * 26; ty = 34; }
    else { const an = this.t * 0.6, r = 18 + Math.min(30, this.buscando * 1.5); tx = this.pista.x + Math.cos(an) * r; tz = this.pista.z + Math.sin(an) * r; ty = 40; }
    const max = this.retirar ? 30 : j.policia.estrellas >= 5 ? 17 : 14.5;
    _v.set(tx - this.pos.x, 0, tz - this.pos.z); const d = _v.length();
    _v.multiplyScalar(d > 0.01 ? Math.min(max, d * 0.9) / d : 0);
    const ax = (_v.x - this.vel.x), az = (_v.z - this.vel.z), k = Math.min(1, dt * 1.6);
    this.vel.x += ax * k; this.vel.z += az * k;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    this.pos.y += (ty - this.pos.y) * Math.min(1, dt * 0.8);
    const mira = this.ve ? Math.atan2(jp.x - this.pos.x, jp.z - this.pos.z) : Math.atan2(this.vel.x, this.vel.z || 0.0001);
    let dy = mira - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * Math.min(1, dt * 1.4);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const adelante = this.vel.x * fx + this.vel.z * fz, lado = this.vel.x * fz - this.vel.z * fx;
    this.grupo.position.copy(this.pos);
    this.grupo.rotation.set(0, this.yaw, 0);
    this.cuerpo.rotation.x += (Math.min(0.32, adelante * 0.018) - this.cuerpo.rotation.x) * Math.min(1, dt * 2);
    this.cuerpo.rotation.z += (Math.max(-0.3, Math.min(0.3, -lado * 0.02)) - this.cuerpo.rotation.z) * Math.min(1, dt * 2);
    this.rotor.rotation.y += dt * 38; this.colaRotor.rotation.x += dt * 60;
    const parp = (this.t % 1.1) < 0.08;
    this.estrobo.visible = parp; this.baliza.visible = (this.t % 0.7) < 0.35;
    if (noche > 0.25 && !this.retirar) {
      _w.copy(this.ve ? jp : this.luzP);
      if (!this.ve) { const an = this.t * 1.3; _w.set(this.pista.x + Math.cos(an) * 14, 0, this.pista.z + Math.sin(an * 0.8) * 14); }
      this.luzP.lerp(_w, Math.min(1, dt * (this.ve ? 6 : 2)));
      const L = this.luzP, ox = this.pos.x, oy = this.pos.y - 1.2, oz = this.pos.z;
      const lx = L.x - ox, lz = L.z - oz, alto = oy - 0.05, largo = Math.hypot(lx, alto, lz), radio = 4.2 + largo * 0.04;
      this.cono.position.set(ox, oy, oz);
      this.cono.quaternion.setFromUnitVectors(_w.set(0, -1, 0), _v.set(lx, -alto, lz).normalize());
      this.cono.scale.set(radio, largo, radio);
      this.mancha.position.set(L.x, 0.09, L.z); this.mancha.scale.setScalar(radio);
      this.cono.visible = this.mancha.visible = true;
      this.mancha.material.opacity = this.ve ? 0.5 : 0.3;
    }
    if (this.vida < 50 && Math.random() < dt * (this.vida < 25 ? 14 : 6)) j.humo?.(this.pos.x - fx * 1.5, this.pos.y + 1, this.pos.z - fz * 1.5, 1.4, '#3a3634', 2);
    if (!this.retirar && this.ve && j.policia.estrellas >= 5 && !j.jugador.muerto) {
      this.cadencia -= dt;
      if (this.cadencia <= 0) { this.cadencia = 0.16; if (++this.rafaga > 6) { this.rafaga = 0; this.cadencia = 2.8; } j.disparoDesde(this.pos, jp, 6, 0.3, 'heli'); }
    }
    this.chop -= dt;
    if (this.chop <= 0 && a?.ctx) { this.chop = 0.072; const v = a.dist(this.pos) * 0.9; if (v > 0.01) { a.ruidoCorto(0.06, 260, v * 0.5); a.ruidoCorto(0.03, 900, v * 0.12, 'bandpass', 1.2); } }
    return !(this.retirar && Math.hypot(this.pos.x - jp.x, this.pos.z - jp.z) > 320);
  }

  caer(dt) {
    const j = this.j;
    this.giro = Math.min(9, this.giro + dt * 3.5);
    this.yaw += this.giro * dt;
    this.vel.y -= 13 * dt; this.vel.x *= 1 - dt * 0.3; this.vel.z *= 1 - dt * 0.3;
    this.pos.addScaledVector(this.vel, dt);
    this.grupo.position.copy(this.pos); this.grupo.rotation.set(0, this.yaw, 0);
    this.cuerpo.rotation.x += (0.5 - this.cuerpo.rotation.x) * dt; this.cuerpo.rotation.z += dt * 0.6;
    this.rotor.rotation.y += dt * 20;
    if (Math.random() < dt * 30) j.humo?.(this.pos.x, this.pos.y + 0.5, this.pos.z, 1.8, '#242220', 2.6);
    const techo = j.mundo.alturaEn?.(this.pos.x, this.pos.z) || 0;
    if (this.pos.y < techo + 1.2) {
      j.explosion(this.pos.x, Math.max(0.5, techo), this.pos.z, 'jugador');
      j.explosion(this.pos.x + 2, Math.max(0.5, techo), this.pos.z - 1.5, 'jugador');
      this.estado = 'restos'; this.restos = 28;
      this.pos.y = techo + 1.2; this.grupo.position.copy(this.pos);
      this.cuerpo.rotation.set(0.25, 0, 1.25); this.rotor.visible = false; this.disco.visible = false; this.colaRotor.visible = false;
      this.pinta.color.set('#3a3a3a'); this.azul.color.set('#2a2a2a');
      for (const o of [this.roja, this.verde, this.estrobo, this.baliza]) o.visible = false;
    }
    return true;
  }
}
