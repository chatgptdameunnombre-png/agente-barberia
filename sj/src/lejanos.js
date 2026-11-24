import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function figura() {
  const partes = [];
  const pieza = (geo, parte, tono) => {
    geo = geo.index ? geo.toNonIndexed() : geo; geo.deleteAttribute('uv');
    const n = geo.attributes.position.count;
    geo.setAttribute('parte', new THREE.BufferAttribute(new Float32Array(n).fill(parte), 1));
    geo.setAttribute('tono', new THREE.BufferAttribute(new Float32Array(n).fill(tono), 1));
    partes.push(geo);
  };
  pieza(new THREE.CylinderGeometry(0.2, 0.155, 0.56, 7).scale(1, 1, 0.6).translate(0, 1.2, 0), 0, 0);
  pieza(new THREE.CylinderGeometry(0.16, 0.155, 0.2, 7).scale(1, 1, 0.64).translate(0, 0.86, 0), 0, 1);
  pieza(new THREE.CylinderGeometry(0.05, 0.055, 0.08, 6).translate(0, 1.5, 0), 0, 2);
  pieza(new THREE.SphereGeometry(0.112, 8, 6).scale(0.92, 1.12, 1).translate(0, 1.64, 0.005), 0, 2);
  pieza(new THREE.SphereGeometry(0.12, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.52).scale(0.95, 1.1, 1.04).translate(0, 1.655, -0.012), 0, 3);
  for (const s of [-1, 1]) {
    pieza(new THREE.CylinderGeometry(0.078, 0.056, 0.82, 6).translate(s * 0.088, 0.47, 0), s < 0 ? 1 : 2, 1);
    pieza(new THREE.BoxGeometry(0.09, 0.07, 0.22).translate(s * 0.088, 0.035, 0.04), s < 0 ? 1 : 2, 3);
    pieza(new THREE.CylinderGeometry(0.052, 0.045, 0.32, 5).translate(s * 0.245, 1.3, 0), s < 0 ? 4 : 3, 0);
    pieza(new THREE.CylinderGeometry(0.043, 0.036, 0.3, 5).translate(s * 0.245, 0.99, 0), s < 0 ? 4 : 3, 2);
  }
  return mergeGeometries(partes);
}

export class Lejanos {
  constructor(juego, max = 96) {
    this.j = juego; this.max = max; this.umbral = 60; this.revisa = 0;
    const geo = figura();
    this.aCam = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.aPan = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.aPiel = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.aPelo = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.aPaso = new THREE.InstancedBufferAttribute(new Float32Array(max * 2), 2);
    for (const a of [this.aCam, this.aPan, this.aPiel, this.aPelo, this.aPaso]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('cCam', this.aCam); geo.setAttribute('cPan', this.aPan); geo.setAttribute('cPiel', this.aPiel); geo.setAttribute('cPelo', this.aPelo); geo.setAttribute('paso', this.aPaso);
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    mat.onBeforeCompile = s => {
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float parte; attribute float tono; attribute vec3 cCam; attribute vec3 cPan; attribute vec3 cPiel; attribute vec3 cPelo; attribute vec2 paso; varying vec3 vTono;')
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
        vTono = tono < 0.5 ? cCam : tono < 1.5 ? cPan : tono < 2.5 ? cPiel : cPelo;
        if (parte > 0.5) {
          float lado = (parte < 1.5 || (parte > 2.5 && parte < 3.5)) ? 1.0 : -1.0;
          float py = parte < 2.5 ? 0.88 : 1.44;
          float a = sin(paso.x) * paso.y * lado * (parte < 2.5 ? 1.0 : 0.75);
          float c = cos(a), sn = sin(a); vec3 q = transformed - vec3(0.0, py, 0.0);
          transformed = vec3(q.x, q.y * c - q.z * sn, q.y * sn + q.z * c) + vec3(0.0, py, 0.0);
        }`);
      s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTono;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vTono;');
    };
    this.im = new THREE.InstancedMesh(geo, mat, max);
    this.im.frustumCulled = false; this.im.castShadow = false; this.im.receiveShadow = false; this.im.count = 0; this.im.matrixAutoUpdate = false;
    juego.escena.add(this.im);
    this.o = new THREE.Object3D(); this.c = new THREE.Color();
  }

  tonos(p) {
    if (p.__tonos) return p.__tonos;
    const P = p.p, t = P.tonos || {}, col = (v, d) => { const c = new THREE.Color(v || d); return [c.r, c.g, c.b]; };
    return (p.__tonos = { cam: col(t.camisa, '#8a8a90'), pan: col(t.pantalon, '#2a3040'), piel: col(t.piel, '#b98258'), pelo: col(t.pelo, '#1d1410') });
  }

  apto(p) {
    if (p.__aptoT > this.reloj) return p.__apto;
    p.__aptoT = this.reloj + 4;
    let ok = !p.paletero && !p.modelo && !p.globero;
    if (ok) p.p.grupo.traverse(o => { if (o.userData?.siempreVisible) ok = false; });
    return (p.__apto = ok);
  }

  actualizar(dt) {
    const j = this.j, cam = j.camara.position, U = this.umbral, im = this.im;
    this.reloj = (this.reloj || 0) + dt;
    if (j.jugador.interior) { im.visible = false; for (const p of j.peatones) p.lejano = false; for (const l of [j.ambulantes?.mariachis, j.ambulantes?.puestos]) for (const m of l || []) m.lejano = false; return; }
    im.visible = true;
    let n = 0;
    const o = this.o, M = im.instanceMatrix.array;
    for (const p of j.peatones) {
      p.lejano = false;
      if (p.enInterior || !p.grupo.parent) continue;
      const dx = p.pos.x - cam.x, dz = p.pos.z - cam.z, d = Math.hypot(dx, dz);
      const hist = p.__lej ? -4 : 0;
      if (d < U + hist || d > 210 || n >= this.max) { p.__lej = false; continue; }
      if (p.muerto || p.muneco || p.estado === 'sentado' || p.tumbado || !this.apto(p)) { p.__lej = false; continue; }
      p.__lej = true; p.lejano = true; p.grupo.visible = false;
      p.__fase = (p.__fase || 0) + dt * Math.min(9, 2.2 + (p.vel || 0) * 2.6);
      const T = this.tonos(p), e = p.grupo.scale.y || 1;
      o.position.set(p.pos.x, p.y || 0, p.pos.z); o.rotation.set(0, p.yaw || p.grupo.rotation.y || 0, 0); o.scale.set(e, e, e); o.updateMatrix(); o.matrix.toArray(M, n * 16);
      this.aCam.array.set(T.cam, n * 3); this.aPan.array.set(T.pan, n * 3); this.aPiel.array.set(T.piel, n * 3); this.aPelo.array.set(T.pelo, n * 3);
      this.aPaso.array[n * 2] = p.__fase; this.aPaso.array[n * 2 + 1] = (p.vel || 0) > 0.25 ? Math.min(0.75, 0.3 + (p.vel || 0) * 0.12) : 0;
      n++;
    }
    const amb = j.ambulantes, UF = Math.max(U, 42);
    if (amb) for (const lista of [amb.mariachis, amb.puestos]) for (const m of lista || []) {
      const P = m.p || m.v; if (!P) continue;
      const g = P.grupo, d = Math.hypot(g.position.x - cam.x, g.position.z - cam.z), hist = m.lejano ? -4 : 0;
      if (d < UF + hist || d > 210 || n >= this.max) { m.lejano = false; continue; }
      m.lejano = true; g.visible = false;
      const T = P.__tonosL || (P.__tonosL = this.tonos({ p: P })), e = g.scale.y || 1;
      o.position.copy(g.position); o.rotation.set(0, g.rotation.y, 0); o.scale.set(e, e, e); o.updateMatrix(); o.matrix.toArray(M, n * 16);
      this.aCam.array.set(T.cam, n * 3); this.aPan.array.set(T.pan, n * 3); this.aPiel.array.set(T.piel, n * 3); this.aPelo.array.set(T.pelo, n * 3);
      this.aPaso.array[n * 2] = 0; this.aPaso.array[n * 2 + 1] = 0;
      n++;
    }
    im.count = n;
    if (n) { im.instanceMatrix.needsUpdate = true; this.aCam.needsUpdate = this.aPan.needsUpdate = this.aPiel.needsUpdate = this.aPelo.needsUpdate = this.aPaso.needsUpdate = true; }
  }
}
