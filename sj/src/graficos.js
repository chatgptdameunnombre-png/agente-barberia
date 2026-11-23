import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

function brillo(tam, paradas) {
  const c = document.createElement('canvas'); c.width = c.height = tam; const x = c.getContext('2d'), g = x.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
  for (const [p, col] of paradas) g.addColorStop(p, col);
  x.fillStyle = g; x.fillRect(0, 0, tam, tam);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Graficos {
  constructor(juego) {
    this.j = juego; this.coche = null;
    const sol = brillo(256, [[0, 'rgba(255,255,240,1)'], [0.12, 'rgba(255,246,214,0.9)'], [0.35, 'rgba(255,214,150,0.25)'], [1, 'rgba(255,190,120,0)']]);
    const aro = brillo(128, [[0, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,0)'], [0.72, 'rgba(255,220,180,0.35)'], [0.82, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
    const bola = brillo(64, [[0, 'rgba(255,255,255,0.55)'], [0.6, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
    this.flare = new Lensflare();
    this.flare.addElement(new LensflareElement(sol, 420, 0, new THREE.Color(1, 0.96, 0.88)));
    this.flare.addElement(new LensflareElement(bola, 60, 0.45, new THREE.Color(0.7, 0.85, 1)));
    this.flare.addElement(new LensflareElement(aro, 160, 0.62, new THREE.Color(1, 0.85, 0.6)));
    this.flare.addElement(new LensflareElement(bola, 90, 0.8, new THREE.Color(0.8, 1, 0.8)));
    this.flare.addElement(new LensflareElement(bola, 46, 1.0, new THREE.Color(1, 0.7, 0.9)));
    this.solObj = new THREE.Object3D(); this.solObj.add(this.flare); juego.escena.add(this.solObj);
    const c = document.createElement('canvas'); c.width = 8; c.height = 128; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.25, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 8, 128);
    const tx = new THREE.CanvasTexture(c);
    this.matHaz = new THREE.MeshBasicMaterial({ map: tx, color: '#fff3d8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    this.geoHaz = new THREE.CylinderGeometry(0.14, 1.7, 13, 18, 1, true).translate(0, -6.5, 0).rotateX(-Math.PI / 2 + 0.07);
    this.haces = [new THREE.Mesh(this.geoHaz, this.matHaz), new THREE.Mesh(this.geoHaz, this.matHaz)];
    for (const h of this.haces) { h.renderOrder = 3; h.castShadow = false; h.visible = false; }
  }

  ponerHaces(c) {
    for (const h of this.haces) h.parent?.remove(h);
    this.coche = c;
    if (!c || c.tipo === 'lancha') return;
    const moto = c.tipo === 'moto', n = moto ? 1 : 2;
    for (let k = 0; k < 2; k++) {
      const h = this.haces[k]; if (k >= n) continue;
      h.position.set(moto ? 0 : (k ? 1 : -1) * c.t.ancho * 0.34, moto ? 0.95 : 0.62, c.t.largo / 2 + 0.05);
      h.rotation.set(0, 0, 0); (c.carro || c.grupo).add(h);
    }
  }

  actualizar(dt) {
    const j = this.j, A = j.ambiente, cam = j.camara;
    const d = A.cieloMat?.uniforms?.solDir?.value;
    if (d) {
      const visible = d.y > -0.03 && (A.nublado || 0) < 0.7 && (A.lluvia || 0) < 0.3 && !j.jugador.interior && (A.noche ?? 0) < 0.6;
      this.solObj.visible = visible;
      if (visible) this.solObj.position.copy(cam.position).addScaledVector(d, 1500);
    }
    const c = j.jugador.coche;
    if (c !== this.coche) this.ponerHaces(c);
    const n = A.noche ?? 0, humedo = Math.max(A.lluvia || 0, A.neblina || 0);
    const op = c && !c.quemado && n > 0.3 ? (n - 0.3) / 0.7 * (0.04 + humedo * 0.045) : 0;
    this.matHaz.opacity = op;
    for (const h of this.haces) h.visible = op > 0.004 && !!h.parent && j.modoCam !== 2;
  }
}
