import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const COLS = ['#ff3d8b', '#ffd23a', '#3bd1ff', '#3bff8a', '#ff7a1a', '#b46bff'];

export class Feria {
  constructor(juego) {
    this.j = juego;
    const B = juego.ciudad.bloques.find(b => b.tipo === 'parque' && b.bx === 5 && b.bz === 4) || juego.ciudad.bloques.find(b => b.tipo === 'parque');
    if (!B) return;
    const x = B.cx - 13, z = B.cz + 11, R = 13, H = R + 2.5;
    this.centro = new THREE.Vector3(x, H, z); this.entrada = new THREE.Vector3(x, 0, z + 3.2); this.paseo = null;
    const acero = new THREE.MeshStandardMaterial({ color: '#e8e8ec', roughness: 0.35, metalness: 0.6 });
    const base = [];
    for (const s of [-1, 1]) for (const k of [-1, 1]) {
      const a = new THREE.Vector3(x + k * 5, 0.2, z + s * 1.6), b = new THREE.Vector3(x, H, z + s * 1.3), v = b.clone().sub(a);
      const g = new THREE.CylinderGeometry(0.22, 0.3, v.length(), 10); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize())); base.push(g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2));
    }
    base.push(new THREE.CylinderGeometry(0.35, 0.35, 3.0, 12).rotateX(Math.PI / 2).translate(x, H, z));
    base.push(new THREE.BoxGeometry(12, 0.3, 4.5).translate(x, 0.32, z));
    const mb = new THREE.Mesh(mergeGeometries(base.map(g => g.index ? g.toNonIndexed() : g)), acero); mb.castShadow = true; juego.escena.add(mb);
    for (const k of [-1, 1]) juego.mundo.agregar(x + k * 5 - 0.5, z - 2, x + k * 5 + 0.5, z + 2, 3);
    juego.mundo.agregar(x - 6, z - 2.3, x + 6, z - 1.6, 1);
    this.rueda = new THREE.Group(); this.rueda.position.copy(this.centro); juego.escena.add(this.rueda);
    const radios = [];
    for (const s of [-1.1, 1.1]) {
      radios.push(new THREE.TorusGeometry(R, 0.13, 6, 64).translate(0, 0, s));
      radios.push(new THREE.TorusGeometry(R * 0.55, 0.08, 6, 48).translate(0, 0, s));
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, g = new THREE.CylinderGeometry(0.06, 0.06, R, 5); g.translate(0, R / 2, 0); g.rotateZ(a); radios.push(g.translate(0, 0, s)); }
    }
    const mr = new THREE.Mesh(mergeGeometries(radios.map(g => g.index ? g.toNonIndexed() : g)), acero); mr.castShadow = true; this.rueda.add(mr);
    const focos = [];
    for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; for (const s of [-1.12, 1.12]) focos.push(new THREE.SphereGeometry(0.24, 6, 4).translate(Math.cos(a) * R, Math.sin(a) * R, s)); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (let q = 1; q < 6; q++) focos.push(new THREE.SphereGeometry(0.17, 6, 4).translate(Math.cos(a) * R * q / 6, Math.sin(a) * R * q / 6, 1.12)); }
    const fg = mergeGeometries(focos.map(g => g.toNonIndexed()));
    const n = fg.attributes.position.count, col = new Float32Array(n * 3), fase = new Float32Array(n), c = new THREE.Color();
    for (let i = 0; i < n; i++) { const tri = Math.floor(i / 72); c.set(COLS[tri % COLS.length]); col.set([c.r, c.g, c.b], i * 3); fase[i] = tri % 6; }
    fg.setAttribute('color', new THREE.BufferAttribute(col, 3)); fg.setAttribute('fase', new THREE.BufferAttribute(fase, 1));
    this.tiempo = { value: 0 }; this.brillo = { value: 0 };
    const mf = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    mf.onBeforeCompile = sh => {
      sh.uniforms.tiempo = this.tiempo; sh.uniforms.brillo = this.brillo;
      sh.vertexShader = 'attribute float fase;\nvarying float vFase;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vFase = fase;');
      sh.fragmentShader = 'uniform float tiempo;\nuniform float brillo;\nvarying float vFase;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  float on = step(0.5, fract(tiempo * 0.9 + vFase / 6.0));\n  diffuseColor.rgb *= mix(0.55, 2.2 * (0.45 + 0.55 * on), brillo);');
    };
    this.rueda.add(new THREE.Mesh(fg, mf));
    this.carrusel(B.cx - 13, B.cz - 9);
    this.canastas = [];
    const colores = ['#c8202e', '#2a62b8', '#f2c14e', '#3a8f5c', '#7a3ab0', '#ff7a1a'];
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2, g = new THREE.Group();
      const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.75, 1.1, 10), new THREE.MeshStandardMaterial({ color: colores[k % colores.length], roughness: 0.5, metalness: 0.2 })); cuerpo.position.y = -1.2; g.add(cuerpo);
      const techo = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.5, 10), new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.5 })); techo.position.y = -0.35; g.add(techo);
      const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), acero); palo.position.y = -0.1; g.add(palo);
      g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); this.rueda.add(g); this.canastas.push(g);
    }
  }

  carrusel(x, z) {
    const j = this.j, g = new THREE.Group(); g.position.set(x, 0, z); j.escena.add(g);
    const blanco = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.5 }), oro = new THREE.MeshStandardMaterial({ color: '#d8b04a', metalness: 0.7, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.2, 0.4, 32), new THREE.MeshStandardMaterial({ color: '#c8202e', roughness: 0.6 })); base.position.y = 0.35; base.receiveShadow = true; g.add(base);
    const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 4, 16), oro); eje.position.y = 2.4; g.add(eje);
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x2 = c.getContext('2d');
    for (let k = 0; k < 16; k++) { x2.fillStyle = k % 2 ? '#c8202e' : '#f4f2ec'; x2.fillRect(k * 32, 0, 32, 64); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
    const techo = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.2, 32, 1, true), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.6 })); techo.position.y = 5.3; g.add(techo);
    const faldon = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.6, 32, 1, true), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.6 })); faldon.position.y = 3.95; g.add(faldon);
    const punta = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), oro); punta.position.y = 6.5; g.add(punta);
    this.giraCarr = new THREE.Group(); this.giraCarr.position.y = 0.55; g.add(this.giraCarr);
    this.caballos = [];
    const colores = ['#f4f2ec', '#8a5a3a', '#2a2c30', '#e8c87a'];
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, r = k % 2 ? 3.6 : 2.6, h = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: colores[k % 4], roughness: 0.4 });
      const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 4, 10).rotateZ(Math.PI / 2), mat); h.add(cuerpo);
      const cuello = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.35, 4, 8), mat); cuello.position.set(0.42, 0.25, 0); cuello.rotation.z = -0.6; h.add(cuello);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.16), mat); cab.position.set(0.62, 0.42, 0); cab.rotation.z = -0.3; h.add(cab);
      for (const [px, pz] of [[0.3, 0.1], [0.3, -0.1], [-0.3, 0.1], [-0.3, -0.1]]) { const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), mat); pata.position.set(px, -0.35, pz); pata.rotation.z = px > 0 ? -0.5 : 0.5; h.add(pata); }
      const silla = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.32), new THREE.MeshStandardMaterial({ color: '#c8202e' })); silla.position.set(0, 0.24, 0); h.add(silla);
      const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 6), oro); tubo.position.y = 0.6; h.add(tubo);
      h.position.set(Math.cos(a) * r, 1.0, Math.sin(a) * r); h.rotation.y = -a; this.giraCarr.add(h); this.caballos.push({ h, fase: k * 0.9 });
    }
    j.mundo.agregar(x - 4, z - 4, x + 4, z + 4, 1);
  }

  cerca() { const J = this.j.jugador; if (!this.rueda || this.paseo || J.coche || J.interior) return false; return Math.hypot(J.pos.x - this.entrada.x, J.pos.z - this.entrada.z) < 3; }

  subir() {
    const j = this.j, J = j.jugador; if (!this.cerca()) return false;
    if (J.dinero < 25) { j.hud.notificar('alerta', 'Rueda de la fortuna', 'El boleto cuesta $25.', 2.5); return true; }
    if (j.policia.estrellas) { j.hud.notificar('alerta', 'Rueda de la fortuna', 'Con la policía encima no te suben.', 2.5); return true; }
    J.dinero -= 25; j.audio.compra?.();
    let mejor = this.canastas[0], my = 1e9; const v = new THREE.Vector3(); for (const g of this.canastas) { g.getWorldPosition(v); if (v.y < my) { my = v.y; mejor = g; } }
    this.paseo = { g: mejor, giro: 0, cam: null }; J.grupo.visible = false; mejor.visible = false;
    j.hud.notificar('info', 'Rueda de la fortuna', 'Disfruta la vista. E para bajarte.', 3.5);
    return true;
  }

  bajar() { const j = this.j, J = j.jugador; if (this.paseo) this.paseo.g.visible = true; this.paseo = null; J.pos.copy(this.entrada); J.grupo.visible = true; j.camYaw = 0; }

  camara(cam, dt) {
    const P = this.paseo, v = P.g.getWorldPosition(new THREE.Vector3());
    const ang = Math.sin(P.giro * 0.7) * 1.2 + Math.PI;
    cam.position.set(v.x + Math.sin(ang) * 1.6, v.y - 0.9, v.z + Math.cos(ang) * 1.6);
    cam.lookAt(v.x + Math.sin(ang) * 30, v.y - 6 - Math.max(0, v.y - 12) * 0.25, v.z + Math.cos(ang) * 30);
    if (cam.fov !== 62) { cam.fov = 62; cam.updateProjectionMatrix(); }
  }

  actualizar(dt, noche) {
    if (!this.rueda) return;
    const vel = this.paseo ? 0.24 : 0.07;
    this.rueda.rotation.z += dt * vel;
    if (this.paseo) { this.paseo.giro += dt * vel; if (this.paseo.giro >= Math.PI * 2) this.bajar(); }
    for (const g of this.canastas) g.rotation.z = -this.rueda.rotation.z;
    this.tiempo.value += dt; this.brillo.value = noche;
    if (this.giraCarr) { this.giraCarr.rotation.y += dt * 0.6; for (const c of this.caballos) c.h.position.y = 1.0 + Math.sin(this.tiempo.value * 2.2 + c.fase) * 0.28; }
  }
}
