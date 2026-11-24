import * as THREE from 'three';
import { modeloHeli } from './helicoptero.js?v=202611231822';
import { alturaCerro, PISTA } from './sierradatos.js?v=202611231822';
import { modeloJet } from './aeropuerto.js?v=202611231822';

const angulo = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

function texCivil() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#f2f2f4'; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#5a2a8a'; g.fillRect(0, 62, 512, 18); g.fillStyle = '#f2c431'; g.fillRect(0, 80, 512, 5);
  g.fillStyle = '#5a2a8a'; g.font = '900 20px Inter, Arial'; g.textAlign = 'center'; g.save(); g.translate(128, 0); g.scale(-1, 1); g.fillText('AERO JACARANDA', 0, 48); g.restore(); g.fillText('AERO JACARANDA', 384, 48);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function modeloAvion() {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  const blanco = new THREE.MeshStandardMaterial({ color: '#f2f2f4', roughness: 0.35, metalness: 0.2 });
  const rojo = new THREE.MeshStandardMaterial({ color: '#c8202e', roughness: 0.4, metalness: 0.2 });
  const gris = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.5, metalness: 0.6 });
  const vidrio = new THREE.MeshStandardMaterial({ color: '#0f1a24', roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.4, depthWrite: false });
  const perfil = [[0, -3.6], [0.25, -3.5], [0.45, -2.6], [0.62, -1.2], [0.72, 0.2], [0.7, 1.2], [0.55, 1.9], [0.3, 2.25], [0, 2.3]].map(([r, y]) => new THREE.Vector2(r, y));
  const fus = new THREE.Mesh(new THREE.LatheGeometry(perfil, 18).rotateX(Math.PI / 2), blanco); fus.position.y = 0.2; cuerpo.add(fus);
  const franja = new THREE.Mesh(new THREE.CylinderGeometry(0.735, 0.735, 3.2, 18, 1, true).rotateX(Math.PI / 2), rojo); franja.position.set(0, 0.2, -0.2); franja.scale.set(1, 1, 1); cuerpo.add(franja);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(0.9, 0.85, 1.9), vidrio); cab.position.set(0, 0.6, 0.25); cab.renderOrder = 2; cuerpo.add(cab);
  const ala = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.12, 1.5), blanco); ala.position.set(0, 0.95, 0.3); cuerpo.add(ala);
  for (const s of [-1, 1]) { const punta = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.13, 1.52), rojo); punta.position.set(s * 4.85, 0.95, 0.3); cuerpo.add(punta); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), gris); st.position.set(s * 1.6, 0.45, 0.4); st.rotation.z = s * 0.7; cuerpo.add(st); }
  const est = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 0.9), blanco); est.position.set(0, 0.35, -3.3); cuerpo.add(est);
  const timon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 1.0).translate(0, 0.65, 0), rojo); timon.position.set(0, 0.35, -3.35); timon.rotation.x = -0.25; cuerpo.add(timon);
  const helice = new THREE.Group(); helice.position.set(0, 0.2, 2.35); cuerpo.add(helice);
  helice.add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12).rotateX(Math.PI / 2).translate(0, 0, 0.15), rojo));
  for (let k = 0; k < 2; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 0.04), gris); p.rotation.z = k * Math.PI / 2; helice.add(p); }
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24), new THREE.MeshBasicMaterial({ color: '#202226', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); disco.position.set(0, 0.2, 2.42); cuerpo.add(disco);
  for (const [x, z] of [[-1.1, 0.4], [1.1, 0.4], [0, -3.1]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(z < 0 ? 0.14 : 0.24, z < 0 ? 0.14 : 0.24, 0.16, 12).rotateZ(Math.PI / 2), gris); r.position.set(x, z < 0 ? -0.15 : -0.62, z); cuerpo.add(r); if (z > 0) { const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), gris); pata.position.set(x * 0.8, -0.3, z); pata.rotation.z = x > 0 ? 0.35 : -0.35; cuerpo.add(pata); } }
  const luz = c => new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
  const roja = luz('#ff2030'); roja.position.set(-5.3, 0.95, 0.3); const verde = luz('#20ff60'); verde.position.set(5.3, 0.95, 0.3); cuerpo.add(roja, verde);
  g.traverse(o => { if (o.isMesh && o !== disco) o.castShadow = true; });
  return { grupo: g, cuerpo, helice, disco };
}

export class Vuelo {
  constructor(juego) {
    this.j = juego; this.aeronaves = []; this.activa = null; this.tSonido = 0;
    const S = juego.sierra;
    if (!S) return;
    const H = modeloHeli(); H.pinta.map = texCivil(); H.pinta.needsUpdate = true; H.azul.color.set('#5a2a8a');
    H.cono.visible = H.mancha.visible = false; H.baliza.visible = false;
    H.cuerpo.traverse(o => { if (o.isMesh && o.material?.metalness > 0.85 && o.material.color?.getHexString() === '0f1a24') { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.38; o.material.depthWrite = false; o.renderOrder = 2; } });
    this.agregar({ tipo: 'heli', ...H, base: { x: S.heliPad.x, z: S.heliPad.z, yaw: -Math.PI / 2 }, alto: 1.36, nombre: 'el helicóptero' });
    const A = modeloAvion();
    this.agregar({ tipo: 'avion', ...A, base: S.avionBase, alto: 0.78, nombre: 'la avioneta' });
    const JT = modeloJet('#3a1a0e', '#f2c431');
    this.jet = { tipo: 'jet', ...JT, base: { x: 302, z: 489, yaw: -Math.PI / 2 }, alto: 0.05, nombre: 'el avión de carga', params: { vmax: 95, vmin: 42, despegue: 45, giro: 0.42 }, asientoDuo: [1.0, 2.0, 13.2], oculto: true };
    this.agregar(this.jet); this.jet.grupo.visible = false;
  }

  agregar(A) {
    A.pos = new THREE.Vector3(); A.vel = new THREE.Vector3(); A.yaw = 0; A.pitch = 0; A.roll = 0; A.motor = 0; A.v = 0; A.salud = 100; A.quemado = 0;
    this.j.escena.add(A.grupo); this.aeronaves.push(A); this.reponer(A);
  }

  reponer(A) {
    const b = A.base; A.pos.set(b.x, this.suelo(b.x, b.z) + A.alto, b.z); A.vel.set(0, 0, 0); A.yaw = b.yaw; A.pitch = A.roll = A.motor = A.v = 0; A.salud = 100; A.quemado = 0; A.grupo.visible = true; A.cuerpo.rotation.set(0, 0, 0); this.pintar(A, 0);
  }

  suelo(x, z) { return Math.max(alturaCerro(x, z), this.j.mundo.alturaEn(x, z)); }

  sueloVuelo(A, prev) { const roof = this.j.mundo.alturaEn(A.pos.x, A.pos.z), ter = alturaCerro(A.pos.x, A.pos.z); return prev.y - A.alto >= roof - 0.5 ? Math.max(ter, roof) : ter; }

  enTierra(A) { return A.pos.y - this.suelo(A.pos.x, A.pos.z) - A.alto < 0.25; }

  cerca() {
    const j = this.j, J = j.jugador;
    if (this.activa || J.coche || J.interior || J.muerto) return null;
    let mejor = null, md = 6.5;
    for (const A of this.aeronaves) { if (A.quemado || A.oculto) continue; const d = Math.hypot(A.pos.x - J.pos.x, A.pos.z - J.pos.z) - (A.tipo === 'jet' ? 9 : 0); if (d < md && this.enTierra(A)) { md = d; mejor = A; } }
    return mejor;
  }

  subir(A = this.cerca()) {
    const j = this.j, J = j.jugador;
    if (!A) return;
    this.activa = A; J.grupo.visible = false; J.volando = A; A.motor = Math.max(A.motor, 0.05);
    j.camYaw = A.yaw; j.camPitch = -0.15;
    j.hud.notificar('coche', A.tipo === 'heli' ? 'Helicóptero' : 'Avioneta', A.tipo === 'heli' ? 'W/S adelante y atrás · A/D girar · Espacio subir · Shift bajar · F bajarte en tierra' : 'W/S motor · A/D girar · Espacio subir · Shift bajar · F bajarte detenido. Con motor a más de la mitad y Espacio despegas solo.', 7);
    j.estadisticas?.sumar?.('vuelos');
  }

  bajar(forzado) {
    const j = this.j, J = j.jugador, A = this.activa;
    if (!A) return;
    if (!forzado && (!this.enTierra(A) || A.vel.length() > 2.5)) { j.hud.notificar('alerta', 'Todavía no', A.tipo === 'heli' ? 'Aterriza primero (Shift para bajar).' : 'Detén la avioneta en tierra.', 2); return; }
    const lado = A.tipo === 'heli' ? 2.6 : 2.4, rx = Math.cos(A.yaw), rz = -Math.sin(A.yaw);
    J.pos.set(A.pos.x + rx * lado, 0, A.pos.z + rz * lado); J.y = this.suelo(J.pos.x, J.pos.z); J.grupo.visible = true; J.volando = null;
    this.activa = null; A.motor = 0;
    j.audio.motor?.(0, false);
  }

  estrellar(A) {
    const j = this.j;
    A.quemado = 0.001; A.salud = 0;
    j.explosion?.(A.pos.x, A.pos.y, A.pos.z, 'jugador');
    if (this.activa === A) { this.bajar(true); j.jugador.salud = 0; j.morirJugador?.(); }
    A.grupo.visible = false;
  }

  pintar(A, dt) {
    A.grupo.position.copy(A.pos);
    A.grupo.rotation.set(0, A.yaw, 0);
    A.cuerpo.rotation.set(A.pitch, 0, A.roll, 'YXZ');
    if (A.tipo === 'heli') { A.rotor.rotation.y += dt * (6 + A.motor * 34); A.colaRotor.rotation.x += dt * (10 + A.motor * 50); A.disco.material.opacity = 0.06 + A.motor * 0.14; }
    else if (A.tipo === 'avion') { A.helice.rotation.z += dt * (A.motor > 0.02 ? 20 + A.motor * 60 : 0); A.disco.visible = A.motor > 0.05; }
    else if (A.estrobo) A.estrobo.visible = Math.sin(performance.now() / 160) > 0.5;
  }

  colision(A, prev) {
    const h = this.j.mundo.alturaEn(A.pos.x, A.pos.z);
    if (h > A.pos.y - A.alto * 0.6 && prev.y - A.alto < h - 0.5) {
      const v = A.vel.length();
      if (v > 13) { this.estrellar(A); return true; }
      A.pos.x = prev.x; A.pos.z = prev.z; A.vel.x *= -0.3; A.vel.z *= -0.3; A.v *= 0.3; A.salud -= v * 2;
      this.j.audio?.choque?.(v * 2, A.pos); this.j.sacudida = Math.max(this.j.sacudida || 0, 0.3);
    }
    const d = Math.hypot(A.pos.x, A.pos.z);
    if (d > 1250) { A.pos.x *= 1250 / d; A.pos.z *= 1250 / d; A.vel.x *= 0.5; A.vel.z *= 0.5; A.yaw += angulo(Math.atan2(-A.pos.x, -A.pos.z) - A.yaw) * 0.08; if ((this.tLimite = (this.tLimite || 0) - 1) < 0) { this.tLimite = 120; this.j.hud.notificar('alerta', 'Zona de vuelo', 'Hasta aquí llega el permiso: regresa a la ciudad.', 2.5); } }
    return false;
  }

  heli(A, dt, ent, k) {
    const sube = (k.Space ? 1 : 0) - (k.ShiftLeft || k.ShiftRight || k.KeyC ? 1 : 0);
    A.motor = Math.min(1, A.motor + dt * 0.45);
    const listo = A.motor > 0.8, f = [Math.sin(A.yaw), Math.cos(A.yaw)], prev = A.pos.clone();
    A.yaw -= ent.x * 1.5 * dt;
    if (listo && !this.enTierra(A) || sube > 0 && listo) { A.vel.x += f[0] * ent.y * 15 * dt; A.vel.z += f[1] * ent.y * 15 * dt; }
    const dr = Math.exp(-0.75 * dt); A.vel.x *= dr; A.vel.z *= dr;
    const hv = Math.hypot(A.vel.x, A.vel.z); if (hv > 38) { A.vel.x *= 38 / hv; A.vel.z *= 38 / hv; }
    const alt = A.pos.y - this.suelo(A.pos.x, A.pos.z) - A.alto;
    const meta = listo ? (sube > 0 ? 9 : sube < 0 ? (alt < 7 ? -2.2 : -6.5) : 0) : -4;
    A.vel.y += (meta - A.vel.y) * Math.min(1, dt * 2.2);
    A.pos.addScaledVector(A.vel, dt);
    if (A.pos.y > 280) { A.pos.y = 280; A.vel.y = Math.min(0, A.vel.y); }
    if (this.colision(A, prev)) return;
    const s = this.sueloVuelo(A, prev) + A.alto;
    if (A.pos.y < s) {
      if (A.vel.y < -10 || hv > 17) { this.estrellar(A); return; }
      A.pos.y = s; A.vel.y = Math.max(0, A.vel.y); A.vel.x *= 0.85; A.vel.z *= 0.85;
    }
    const fwd = A.vel.x * f[0] + A.vel.z * f[1], lat = A.vel.x * Math.cos(A.yaw) - A.vel.z * Math.sin(A.yaw);
    A.pitch += (fwd / 38 * 0.32 + ent.y * 0.06 - A.pitch) * Math.min(1, dt * 3);
    A.roll += (-ent.x * 0.18 - lat / 38 * 0.2 - A.roll) * Math.min(1, dt * 3);
  }

  avion(A, dt, ent, k) {
    const arriba = (k.Space ? 1 : 0) - (k.ShiftLeft || k.ShiftRight || k.KeyC ? 1 : 0), prev = A.pos.clone(), P = A.params || { vmax: 62, vmin: 22, despegue: 24, giro: 0.75 };
    A.motor = Math.max(0, Math.min(1, A.motor + ent.y * 0.6 * dt));
    const tierra = this.enTierra(A), alt = A.pos.y - this.suelo(A.pos.x, A.pos.z) - A.alto;
    const meta = tierra ? (ent.y < 0 && A.motor < 0.05 ? 0 : A.motor * P.vmax) : P.vmin + A.motor * (P.vmax - P.vmin);
    A.v += (meta - A.v) * dt * (tierra && meta < A.v ? 0.9 : 0.45);
    A.v = Math.max(0, A.v);
    A.yaw -= ent.x * (tierra ? 0.6 * Math.min(1, A.v / 8) : P.giro) * dt;
    A.roll += ((tierra ? 0 : ent.x * 0.55) - A.roll) * Math.min(1, dt * 3);
    let vy = A.vel.y;
    if (tierra) vy = arriba > 0 && A.v > P.despegue ? 5 : 0;
    else {
      vy += (arriba * 9 - vy) * Math.min(1, dt * 2);
      if (alt < 5 && vy < -4) vy = -4;
    }
    A.vel.set(Math.sin(A.yaw) * A.v, vy, Math.cos(A.yaw) * A.v);
    A.pos.addScaledVector(A.vel, dt);
    if (A.pos.y > 320) { A.pos.y = 320; A.vel.y = Math.min(0, A.vel.y); }
    A.pitch += (-Math.atan2(A.vel.y, Math.max(8, A.v)) * 0.8 - A.pitch) * Math.min(1, dt * 4);
    if (this.colision(A, prev)) return;
    const s = this.sueloVuelo(A, prev) + A.alto;
    if (A.pos.y < s) {
      if (!tierra && A.vel.y < -14) { this.estrellar(A); return; }
      A.pos.y = s; A.vel.y = 0; A.pitch = 0;
    }
  }

  controlar(dt, ent) {
    const A = this.activa; if (!A) return;
    const j = this.j, J = j.jugador;
    if (A.tipo === 'heli') this.heli(A, dt, ent, j.teclas); else this.avion(A, dt, ent, j.teclas);
    if (!this.activa) return;
    J.pos.set(A.pos.x, 0, A.pos.z); J.y = 0; J.yaw = A.yaw;
    const alt = Math.max(0, A.pos.y - this.suelo(A.pos.x, A.pos.z) - A.alto), vel = A.vel.length() * 3.6;
    j.hud.pista(this.enTierra(A) && A.vel.length() < 2.5 ? 'F' : '·', `${A.tipo === 'heli' ? 'Helicóptero' : A.tipo === 'jet' ? 'Avión de carga' : 'Avioneta'} · altura ${Math.round(alt)} m · ${Math.round(vel)} km/h · motor ${Math.round(A.motor * 100)}%${this.enTierra(A) && A.vel.length() < 2.5 ? ' · F para bajarte' : ''}`);
    this.tSonido -= dt;
    if (A.tipo === 'heli') { if (this.tSonido <= 0) { this.tSonido = 0.11; j.audio?.ruidoCorto?.(0.09, 260, 0.1 * A.motor, 'lowpass'); } }
    else if (A.tipo === 'jet') { if (this.tSonido <= 0) { this.tSonido = 0.12; j.audio?.ruidoCorto?.(0.16, 520, 0.08 + A.motor * 0.18, 'lowpass'); } }
    else j.audio?.motor?.(0.25 + A.motor * 0.75, true);
  }

  camara(cam, dt) {
    const j = this.j, A = this.activa;
    j.tMouse += dt;
    if (j.tMouse > 1.4) { j.camYaw += angulo(A.yaw - j.camYaw) * Math.min(1, dt * 2.4); j.camPitch += (-0.2 - j.camPitch) * Math.min(1, dt * 2); }
    const dist = A.tipo === 'heli' ? 13 : A.tipo === 'jet' ? 34 : 15, cp = Math.cos(j.camPitch);
    const objetivo = new THREE.Vector3(A.pos.x, A.pos.y + (A.tipo === 'jet' ? 5 : 1.2), A.pos.z);
    const p = objetivo.clone().add(new THREE.Vector3(-Math.sin(j.camYaw) * cp * dist, -Math.sin(j.camPitch) * dist + 2.2, -Math.cos(j.camYaw) * cp * dist));
    const s = this.suelo(p.x, p.z) + 1; if (p.y < s) p.y = s;
    cam.position.lerp(p, Math.min(1, dt * 6)); cam.lookAt(objetivo);
    const fov = 66 + Math.min(14, A.vel.length() * 0.25); if (Math.abs(cam.fov - fov) > 0.3) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); }
  }

  actualizar(dt) {
    const JT = this.jet, j = this.j;
    if (JT && JT !== this.activa) {
      const tiene = !!j.propiedades?.jet;
      if (tiene && !JT.enAerodromo && !JT.quemado) { JT.enAerodromo = true; JT.base = { x: (PISTA.x0 + PISTA.x1) / 2, z: 60, yaw: Math.PI }; this.reponer(JT); }
      JT.oculto = !(tiene || this.jetMision); JT.grupo.visible = !JT.oculto && !JT.quemado;
    }
    for (const A of this.aeronaves) {
      if (A.oculto) continue;
      if (A.quemado) { A.quemado += dt; if (A.quemado > 45 && Math.hypot(A.pos.x - this.j.jugador.posicion.x, A.pos.z - this.j.jugador.posicion.z) > 120) this.reponer(A); continue; }
      if (A !== this.activa) {
        A.motor = Math.max(0, A.motor - dt * 0.3);
        if (!this.enTierra(A)) { A.vel.y -= 9 * dt; A.pos.addScaledVector(A.vel, dt); const s = this.suelo(A.pos.x, A.pos.z) + A.alto; if (A.pos.y < s) { if (A.vel.y < -8) { this.estrellar(A); continue; } A.pos.y = s; A.vel.set(0, 0, 0); } }
      }
      this.pintar(A, dt);
    }
    const A = this.cerca();
    if (A && !this.j.overlay) this.j.hud.pista('F', 'Pilotear ' + A.nombre);
  }

  marcasMapa() { return this.aeronaves.filter(A => !A.quemado && !A.oculto && A !== this.activa).map(A => ({ x: A.pos.x, z: A.pos.z, tipo: 'icono', ic: { c: '#7ae0ff', t: A.tipo === 'heli' ? 'H' : A.tipo === 'jet' ? 'J' : 'A', n: A.tipo === 'heli' ? 'Helicóptero' : A.tipo === 'jet' ? 'Avión de carga' : 'Avioneta' } })); }
}
