import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { linea, LIMITE } from './ciudad.js?v=202611212313';

function lienzo(w, h, pintar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function pintarCostado(g, w, h, ventanas) {
  g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a3d44'; g.fillRect(0, h * 0.86, w, h * 0.14);
  g.fillStyle = '#5b2a86'; g.fillRect(0, h * 0.7, w, h * 0.07);
  g.fillStyle = '#b5122e'; g.fillRect(0, h * 0.77, w, h * 0.035);
  g.fillStyle = ventanas ? '#1a2430' : '#26303c'; g.fillRect(0, h * 0.24, w, h * 0.36);
  if (ventanas) {
    g.fillStyle = '#fff1cf';
    for (let k = 0; k < 9; k++) { const x = 12 + k * w / 9; g.fillRect(x, h * 0.26, w / 9 - 24, h * 0.32); }
    return;
  }
  g.fillStyle = 'rgba(150,180,210,0.35)';
  for (let k = 0; k < 9; k++) { const x = 12 + k * w / 9; g.beginPath(); g.moveTo(x, h * 0.26); g.lineTo(x + 40, h * 0.26); g.lineTo(x + 10, h * 0.58); g.lineTo(x, h * 0.58); g.fill(); }
  g.fillStyle = '#d7dade'; for (let k = 0; k <= 9; k++) g.fillRect(k * w / 9 - 6, h * 0.24, 12, h * 0.36);
  for (const dx of [0.27, 0.73]) {
    const x = w * dx - 46;
    g.fillStyle = '#c9cdd2'; g.fillRect(x, h * 0.18, 92, h * 0.68);
    g.fillStyle = '#1a2430'; g.fillRect(x + 8, h * 0.24, 34, h * 0.36); g.fillRect(x + 50, h * 0.24, 34, h * 0.36);
    g.fillStyle = '#f6c431'; g.fillRect(x - 4, h * 0.18, 4, h * 0.68); g.fillRect(x + 92, h * 0.18, 4, h * 0.68);
    g.fillStyle = '#2a2c30'; g.fillRect(x + 45, h * 0.18, 2, h * 0.68);
  }
  g.fillStyle = '#5b2a86'; g.font = '900 30px Inter, Arial, sans-serif'; g.textBaseline = 'middle';
  g.fillText('LÍNEA 1', w * 0.42, h * 0.11);
  g.fillStyle = '#3a3d44'; g.font = '700 20px Inter, Arial, sans-serif'; g.fillText('TREN LIGERO · SANTA JACARANDA', w * 0.05, h * 0.11);
}

function pintarFrente(g, w, h) {
  g.fillStyle = '#eef0f2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1a2430'; g.beginPath(); g.moveTo(w * 0.08, h * 0.2); g.lineTo(w * 0.92, h * 0.2); g.lineTo(w * 0.88, h * 0.55); g.lineTo(w * 0.12, h * 0.55); g.fill();
  g.fillStyle = 'rgba(160,190,220,0.3)'; g.beginPath(); g.moveTo(w * 0.15, h * 0.22); g.lineTo(w * 0.35, h * 0.22); g.lineTo(w * 0.22, h * 0.53); g.lineTo(w * 0.14, h * 0.53); g.fill();
  g.fillStyle = '#5b2a86'; g.fillRect(0, h * 0.62, w, h * 0.08);
  g.fillStyle = '#b5122e'; g.fillRect(0, h * 0.7, w, h * 0.04);
  g.fillStyle = '#3a3d44'; g.fillRect(0, h * 0.86, w, h * 0.14);
  g.fillStyle = '#111'; g.fillRect(w * 0.3, h * 0.06, w * 0.4, h * 0.1);
  g.fillStyle = '#ffb347'; g.font = '700 26px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1  CENTRO', w / 2, h * 0.11);
  g.fillStyle = '#fffbe8'; for (const x of [0.16, 0.84]) { g.beginPath(); g.arc(w * x, h * 0.78, 14, 0, 7); g.fill(); }
}

function pintarConcreto(g, w, h) {
  g.fillStyle = '#a49f96'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 7000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '80,76,70' : '235,232,226'},${Math.random() * 0.1})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2); }
  g.fillStyle = 'rgba(70,64,56,0.25)'; for (let x = 0; x < w; x += w / 4) g.fillRect(x, 0, 3, h);
  const gr = g.createLinearGradient(0, h * 0.6, 0, h); gr.addColorStop(0, 'rgba(60,52,44,0)'); gr.addColorStop(1, 'rgba(60,52,44,0.3)'); g.fillStyle = gr; g.fillRect(0, h * 0.6, w, h * 0.4);
}

export class TrenLigero {
  constructor(juego) {
    this.j = juego;
    const escena = juego.escena, mundo = juego.mundo;
    const X = this.X = linea(3), Z0 = this.Z0 = -LIMITE - 95, Z1 = this.Z1 = LIMITE + 95, ARRIBA = this.ARRIBA = 7.2;
    this.estaciones = [{ z: -200, nombre: 'ESTACIÓN HOSPITAL' }, { z: -40, nombre: 'ESTACIÓN CATEDRAL' }, { z: 120, nombre: 'ESTACIÓN PARQUE' }];
    const texConc = lienzo(512, 128, pintarConcreto); texConc.wrapS = THREE.RepeatWrapping;
    const matConc = new THREE.MeshStandardMaterial({ map: texConc, roughness: 0.9 });
    const largo = Z1 - Z0, zc = (Z0 + Z1) / 2;
    const tablero = new THREE.BoxGeometry(7, 1.2, largo);
    { const uv = tablero.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * largo / 24); }
    const conc = [tablero.translate(X, ARRIBA - 0.6, zc)];
    { const cortes = [Z0, ...this.estaciones.flatMap(e => [e.z - 20, e.z + 20]), Z1];
      for (let k = 0; k < cortes.length; k += 2) { const a = cortes[k], b = cortes[k + 1]; for (const s of [-1, 1]) conc.push(new THREE.BoxGeometry(0.25, 1.05, b - a).translate(X + s * 3.38, ARRIBA + 0.52, (a + b) / 2)); } }
    for (const s of [-1, 1]) conc.push(new THREE.BoxGeometry(2.7, 0.14, largo).translate(X + s * 1.65, ARRIBA + 0.07, zc));
    const piers = [];
    const enEstacion = z => this.estaciones.some(e => Math.abs(z - e.z) < 22);
    for (let j = -1; j <= 8; j++) for (const d of [22, 40, 58]) {
      const z = linea(j) + d; if (z < Z0 + 8 || z > Z1 - 8) continue;
      const ancho = enEstacion(z) ? 13.4 : 6;
      piers.push(new THREE.CylinderGeometry(0.72, 0.85, ARRIBA - 1.2, 14).translate(X, (ARRIBA - 1.2) / 2, z));
      piers.push(new THREE.BoxGeometry(ancho, 0.9, 1.7).translate(X, ARRIBA - 1.65, z));
      mundo.agregar(X - 0.85, z - 0.85, X + 0.85, z + 0.85, ARRIBA - 1.2);
    }
    for (const zf of [Z0, Z1]) { conc.push(new THREE.BoxGeometry(7.4, ARRIBA + 1.4, 3).translate(X, (ARRIBA + 1.4) / 2, zf)); mundo.agregar(X - 3.7, zf - 1.5, X + 3.7, zf + 1.5, ARRIBA + 1.4); }
    const mConc = new THREE.Mesh(mergeGeometries(conc.concat(piers.map(g => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.5); return g; }))), matConc);
    mConc.castShadow = mConc.receiveShadow = true; escena.add(mConc);

    const acero = [];
    for (const s of [-1, 1]) for (const r of [-0.72, 0.72]) acero.push(new THREE.BoxGeometry(0.08, 0.16, largo).translate(X + s * 1.65 + r, ARRIBA + 0.22, zc));
    for (let z = Z0 + 12; z < Z1 - 6; z += 26) {
      acero.push(new THREE.CylinderGeometry(0.11, 0.13, 4.7, 8).translate(X, ARRIBA + 2.35, z));
      acero.push(new THREE.BoxGeometry(4.4, 0.12, 0.12).translate(X, ARRIBA + 4.45, z));
    }
    for (const s of [-1, 1]) acero.push(new THREE.BoxGeometry(0.035, 0.035, largo).translate(X + s * 1.65, ARRIBA + 4.3, zc));
    const matAcero = new THREE.MeshStandardMaterial({ color: '#8f959c', roughness: 0.4, metalness: 0.75 });
    const mAcero = new THREE.Mesh(mergeGeometries(acero), matAcero); mAcero.castShadow = true; escena.add(mAcero);

    const est = [], techos = [];
    for (const e of this.estaciones) {
      for (const s of [-1, 1]) {
        est.push(new THREE.BoxGeometry(3.2, 0.35, 40).translate(X + s * 5.1, ARRIBA + 0.17, e.z));
        est.push(new THREE.BoxGeometry(0.12, 1.1, 40).translate(X + s * 6.65, ARRIBA + 0.9, e.z));
        for (const dz of [-16, -8, 0, 8, 16]) est.push(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 8).translate(X + s * 6.2, ARRIBA + 2.1, e.z + dz));
        techos.push(new THREE.BoxGeometry(3.6, 0.14, 38).rotateZ(s * 0.08).translate(X + s * 5.2, ARRIBA + 3.95, e.z));
        for (const dz of [-12, 4]) est.push(new THREE.BoxGeometry(1.6, 0.08, 0.45).translate(X + s * 6, ARRIBA + 0.82, e.z + dz), new THREE.BoxGeometry(0.08, 0.45, 1.6).translate(X + s * 6.1, ARRIBA + 0.58, e.z + dz));
        const cart = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), new THREE.MeshBasicMaterial({ map: lienzo(512, 80, (g, w, h) => { g.fillStyle = '#5b2a86'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = '900 44px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e.nombre, w / 2, h / 2 + 2); g.fillStyle = '#b5122e'; g.fillRect(0, h - 6, w, 6); }) }));
        cart.position.set(X + s * 6.72, ARRIBA + 3.3, e.z); cart.rotation.y = s * Math.PI / 2; escena.add(cart);
      }
    }
    const mEst = new THREE.Mesh(mergeGeometries(est), matAcero); mEst.castShadow = mEst.receiveShadow = true; escena.add(mEst);
    const mTecho = new THREE.Mesh(mergeGeometries(techos), new THREE.MeshStandardMaterial({ color: '#b5122e', roughness: 0.55, metalness: 0.2 })); mTecho.castShadow = true; escena.add(mTecho);

    const lado = lienzo(1024, 256, (g, w, h) => pintarCostado(g, w, h, false));
    this.ventanas = lienzo(1024, 256, (g, w, h) => pintarCostado(g, w, h, true));
    const frente = lienzo(256, 256, pintarFrente);
    this.matLado = new THREE.MeshStandardMaterial({ map: lado, roughness: 0.35, metalness: 0.35, emissive: '#ffffff', emissiveMap: this.ventanas, emissiveIntensity: 0 });
    const matFrente = new THREE.MeshStandardMaterial({ map: frente, roughness: 0.3, metalness: 0.3, emissive: '#ffffff', emissiveMap: frente, emissiveIntensity: 0.05 });
    this.matFrente = matFrente;
    const matTecho = new THREE.MeshStandardMaterial({ color: '#d9dcdf', roughness: 0.6, metalness: 0.4 });
    const matBajo = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.8 });
    const vagon = (cabeza) => {
      const g = new THREE.Group();
      const geo = new THREE.BoxGeometry(2.65, 3.1, 14.6, 1, 1, 1);
      if (cabeza) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0 && p.getY(i) > 0) p.setZ(i, p.getZ(i) - 0.55); geo.computeVertexNormals(); }
      const cuerpo = new THREE.Mesh(geo, [this.matLado, this.matLado, matTecho, matBajo, matFrente, matFrente]);
      cuerpo.position.y = 2.15; cuerpo.castShadow = true; g.add(cuerpo);
      for (const z of [-4.8, 4.8]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 2.6), matBajo); b.position.set(0, 0.42, z); g.add(b); }
      const ac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 3.2), matTecho); ac.position.set(0, 3.85, -2); g.add(ac);
      if (cabeza) {
        const pan = new THREE.Group(); pan.position.set(0, 3.7, 2.5);
        for (const s of [-1, 1]) { const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.3), matAcero); brazo.position.set(0, 0.32, s * 0.25); brazo.rotation.x = s * 0.9; pan.add(brazo); }
        const zap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.08), matAcero); zap.position.y = 0.6; pan.add(zap);
        g.add(pan);
      }
      return g;
    };
    this.trenes = [];
    for (let k = 0; k < 2; k++) {
      const g = new THREE.Group();
      const a = vagon(true), b = vagon(true);
      a.position.z = 7.55; b.position.z = -7.55; b.rotation.y = Math.PI;
      g.add(a, b);
      escena.add(g);
      const t = { g, via: k ? -1 : 1, dir: k ? -1 : 1, s: k ? 140 : -260, v: 12, espera: 0, ultima: null, rugido: 0 };
      this.trenes.push(t);
    }
  }

  actualizar(dt, noche) {
    this.matLado.emissiveIntensity = noche * 0.85;
    this.matFrente.emissiveIntensity = 0.05 + noche * 0.5;
    const jp = this.j.jugador.posicion, VMAX = 15;
    for (const t of this.trenes) {
      if (t.espera > 0) {
        t.espera -= dt;
        if (t.espera <= 0 && Math.abs(jp.x - this.X) < 60 && Math.abs(jp.z - t.s) < 80) { this.j.audio?.tono(660, 0.25, 0.08, 'sine'); this.j.audio?.tono(880, 0.35, 0.06, 'sine', null, (this.j.audio?.ctx?.currentTime || 0) + 0.28); }
      } else {
        let freno = Infinity;
        for (const e of this.estaciones) { const d = (e.z - t.s) * t.dir; if (d > 0.3 && e !== t.ultima) freno = Math.min(freno, d); }
        const vObj = freno < Infinity ? Math.min(VMAX, Math.sqrt(2 * 1.1 * freno) + 0.3) : VMAX;
        t.v += Math.max(-2.2 * dt, Math.min(1.2 * dt, vObj - t.v));
        t.s += t.v * t.dir * dt;
        const llega = this.estaciones.find(e => e !== t.ultima && Math.abs(e.z - t.s) < 0.6);
        if (llega) { t.s = llega.z; t.v = 0; t.espera = 9; t.ultima = llega; }
        if (t.dir > 0 ? t.s > this.Z1 - 20 : t.s < this.Z0 + 20) { t.dir *= -1; t.via *= -1; t.ultima = null; t.v = 4; }
      }
      t.g.position.set(this.X + t.via * 1.65, this.ARRIBA + 0.3, t.s);
      t.g.rotation.y = t.dir > 0 ? 0 : Math.PI;
      t.rugido -= dt;
      if (t.v > 2 && t.rugido <= 0) {
        t.rugido = 0.22;
        const d = Math.hypot(jp.x - this.X, jp.z - t.s);
        if (d < 120) this.j.audio?.ruidoCorto(0.35, 160 + t.v * 12, 0.22 * (1 - d / 120) ** 1.5 * Math.min(1, t.v / VMAX), 'lowpass');
      }
    }
  }
}
