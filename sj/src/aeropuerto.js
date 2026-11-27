import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { letrero } from './ciudad.js?v=20261126192148';
import { Peaton } from './peatones.js?v=20261126192148';
import { Coche } from './vehiculos.js?v=20261126192148';
import { realistaDe } from './jugador.js?v=20261126192148';
import { AERO } from './sierradatos.js?v=20261126192148';

const _c = new THREE.Color();
function teñir(g, hex) { _c.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.index ? g.toNonIndexed() : g; }
const caja = (w, h, d, x, y, z, col, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); return teñir(g.translate(x, y, z), col); };
const cil = (r1, r2, h, x, y, z, col, seg = 12) => teñir(new THREE.CylinderGeometry(r1, r2, h, seg).translate(x, y, z), col);
function lienzo(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

export function modeloJet(c1 = '#5a2a8a', c2 = '#f2c431', escala = 1) {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  const tx = lienzo(512, 128, (x, w, h) => { x.fillStyle = '#f4f4f6'; x.fillRect(0, 0, w, h); x.fillStyle = c1; x.fillRect(0, h * 0.62, w, h * 0.12); x.fillStyle = c2; x.fillRect(0, h * 0.74, w, h * 0.04); x.fillStyle = '#1a2230'; for (let k = 0; k < 60; k++) x.fillRect(12 + k * 8.2, h * 0.42, 4, 7); });
  tx.wrapS = THREE.RepeatWrapping;
  const pinta = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.35, metalness: 0.3 });
  const blanco = new THREE.MeshStandardMaterial({ color: '#eef0f2', roughness: 0.4, metalness: 0.3 });
  const color = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.4, metalness: 0.3 });
  const gris = new THREE.MeshStandardMaterial({ color: '#8a9098', roughness: 0.4, metalness: 0.7 });
  const negro = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.6 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 24, 22, 1, true).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), pinta); fus.position.y = 3.2; cuerpo.add(fus);
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 1.8), blanco); nariz.position.set(0, 3.2, 12); cuerpo.add(nariz);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.9), negro); cab.position.set(0, 4.25, 14.6); cab.rotation.x = 0.5; cuerpo.add(cab);
  const cola = new THREE.Mesh(new THREE.ConeGeometry(2, 7, 20, 1, true).rotateX(-Math.PI / 2), blanco); cola.position.set(0, 3.6, -15.5); cola.scale.set(1, 0.8, 1); cuerpo.add(cola);
  const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.5, 4.6), color); aleta.position.set(0, 7.2, -16.5); aleta.rotation.x = -0.45; cuerpo.add(aleta);
  for (const s of [-1, 1]) {
    const ala = new THREE.Mesh(new THREE.BoxGeometry(14, 0.45, 4.4), blanco); ala.position.set(s * 8.4, 2.2, -1); ala.rotation.y = s * 0.42; ala.rotation.z = s * 0.06; cuerpo.add(ala);
    const est = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2.2), blanco); est.position.set(s * 3.6, 4.4, -16.8); est.rotation.y = s * 0.4; cuerpo.add(est);
    const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 4, 16).rotateX(Math.PI / 2), gris); mot.position.set(s * 6, 1.2, 1.2); cuerpo.add(mot);
    const boca = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), negro); boca.position.set(s * 6, 1.2, 3.22); cuerpo.add(boca);
    for (const z of [-1.5]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 12).rotateZ(Math.PI / 2), negro); r.position.set(s * 2.4, 0.55, z); cuerpo.add(r); }
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: s < 0 ? '#ff2030' : '#20ff60', toneMapped: false })); luz.position.set(s * 14.6, 2.3, -4.2); cuerpo.add(luz);
  }
  const rn = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12).rotateZ(Math.PI / 2), negro); rn.position.set(0, 0.45, 10); cuerpo.add(rn);
  const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), gris); pata.position.set(0, 1.2, 10); cuerpo.add(pata);
  const estrobo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })); estrobo.position.set(0, 10.3, -18.5); cuerpo.add(estrobo);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.scale.setScalar(escala);
  return { grupo: g, cuerpo, estrobo };
}

export class Aeropuerto {
  constructor(juego) {
    this.j = juego; this.L = []; this.V = []; this.guardias = []; this.alerta = 0; this.tAviso = 0; this.sospecha = 0; this.tGuardias = 0;
    const esc = juego.escena, L = this.L, A = AERO;
    const pisoT = lienzo(256, 256, (x, w, h) => { x.fillStyle = '#a8a6a0'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '70,70,70' : '210,210,205'},${Math.random() * 0.2})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = 'rgba(60,60,60,0.35)'; for (let k = 0; k <= 4; k++) { x.fillRect(k * 64, 0, 1.5, h); x.fillRect(0, k * 64, w, 1.5); } });
    pisoT.wrapS = pisoT.wrapT = THREE.RepeatWrapping; pisoT.repeat.set((A.ax1 - A.ax0) / 16, (A.pista.z0 - A.az0) / 16);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(A.ax1 - A.ax0, A.pista.z0 - A.az0).rotateX(-Math.PI / 2).translate(0, 0.07, (A.az0 + A.pista.z0) / 2), new THREE.MeshStandardMaterial({ map: pisoT, roughness: 0.9 })); apron.receiveShadow = true; esc.add(apron);
    const pt = lienzo(128, 512, (x, w, h) => { x.fillStyle = '#2c2d31'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '15,15,18' : '110,110,112'},${Math.random() * 0.25})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = '#eceae2'; for (let y = 0; y < h; y += 64) x.fillRect(w / 2 - 3, y + 8, 6, 34); x.fillRect(3, 0, 4, h); x.fillRect(w - 7, 0, 4, h); });
    pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(1, (A.pista.x1 - A.pista.x0) / 60);
    const pz = (A.pista.z0 + A.pista.z1) / 2;
    const pista = new THREE.Mesh(new THREE.PlaneGeometry(A.pista.z1 - A.pista.z0, A.pista.x1 - A.pista.x0).rotateX(-Math.PI / 2).rotateY(Math.PI / 2).translate(0, 0.085, pz), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1 })); esc.add(pista);
    const verde = new THREE.Mesh(new THREE.PlaneGeometry(A.ax1 - A.ax0, A.az1 - A.pista.z0).rotateX(-Math.PI / 2).translate(0, 0.06, (A.pista.z0 + A.az1) / 2), new THREE.MeshStandardMaterial({ color: '#6a8a46', roughness: 1 })); esc.add(verde);
    for (const [x, s] of [[A.pista.x0 + 10, 1], [A.pista.x1 - 10, -1]]) {
      for (let k = -3; k <= 3; k++) L.push(caja(14, 0.02, 1.3, x + s * 7, 0.1, pz + k * 4.6, '#eceae2'));
      const n = letrero(s > 0 ? '09' : '27', '#2c2d31', '#eceae2', 7, 3.4); n.rotation.x = -Math.PI / 2; n.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; n.position.set(x + s * 26, 0.11, pz); esc.add(n);
    }
    L.push(caja(A.ax1 - A.ax0 - 40, 0.02, 0.4, 0, 0.09, 484, '#f2c431'));
    for (const x of [-140, 140, 300]) L.push(caja(0.4, 0.02, 18, x, 0.09, 493, '#f2c431'));
    const lp = [];
    for (let x = A.pista.x0; x <= A.pista.x1; x += 25) for (const z of [A.pista.z0 - 0.6, A.pista.z1 + 0.6]) lp.push([x, z, '#fff4d8']);
    for (let z = A.pista.z0; z <= A.pista.z1; z += 3.5) { lp.push([A.pista.x0 - 0.6, z, '#3fff6a']); lp.push([A.pista.x1 + 0.6, z, '#ff3030']); }
    this.luces = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), lp.length);
    const o = new THREE.Object3D(); lp.forEach(([x, z, c], i) => { o.position.set(x, 0.25, z); o.updateMatrix(); this.luces.setMatrixAt(i, o.matrix); this.luces.setColorAt(i, _c.set(c)); }); esc.add(this.luces);
    this.vestidor = { x: -150, z: 404 };
    this.terminal(esc); this.malla(esc); this.zonaAerea(esc);
    const m = new THREE.Mesh(mergeGeometries(L), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15 })); m.castShadow = m.receiveShadow = true; esc.add(m);
    this.matVidrio = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.7, emissive: '#ffd9a0', emissiveIntensity: 0, envMapIntensity: 1.9 }); this.matVidrio.color.setScalar(2.6);
    esc.add(new THREE.Mesh(mergeGeometries(this.V), this.matVidrio));
    this.jets = [[-70, '#5a2a8a', '#f2c431'], [0, '#c8202e', '#ffffff'], [70, '#1a5ab8', '#7ae0ff']].map(([x, c1, c2]) => { const J = modeloJet(c1, c2); J.grupo.position.set(x, 0, 448); J.grupo.rotation.y = Math.PI; esc.add(J.grupo); this.choca(x - 2, 430, x + 2, 466, 6); return J; });
    this.trafico = { ...modeloJet('#2a8a4a', '#f2f2f2'), fase: 'espera', t: 15, v: 0, pos: new THREE.Vector3() }; this.trafico.grupo.visible = false; esc.add(this.trafico.grupo);
    this.carros();
  }

  choca(x0, z0, x1, z1, h) { this.j.mundo.agregar(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), h); }

  terminal(esc) {
    const L = this.L, V = this.V, A = AERO;
    L.push(caja(220, 0.4, 26, 0, 0.2, 404, '#d8d4cc'));
    L.push(caja(220, 12, 22, 0, 6, 405, '#e8e8ec'));
    V.push(caja(212, 9, 0.2, 0, 5.2, 393.9, '#1a2a3e'));
    for (let k = 0; k <= 21; k++) L.push(caja(0.4, 10, 0.5, -106 + k * 10.1, 5.4, 393.8, '#c8ccd2'));
    L.push(caja(228, 0.8, 12, 0, 12.4, 400, '#f2f2f4'), caja(228, 0.6, 0.6, 0, 11.9, 394.2, '#5a2a8a'));
    for (let k = 0; k < 8; k++) L.push(cil(0.35, 0.35, 11.6, -98 + k * 28, 5.8, 389.2, '#c8ccd2', 10));
    L.push(caja(240, 0.5, 14, 0, 0.25, 389, '#cfc8bc'));
    this.choca(-110, 394, 110, 416, 12);
    const s = letrero('AEROPUERTO INTERNACIONAL SANTA JACARANDA', '#5a2a8a', '#ffffff', 60, 3.2); s.position.set(0, 14.6, 394); s.rotation.y = Math.PI; esc.add(s);
    for (const [x, t] of [[-55, 'SALIDAS'], [55, 'LLEGADAS']]) { const l = letrero(t, '#1a1a2a', '#f2c431', 10, 1.4); l.position.set(x, 10.2, 393.6); l.rotation.y = Math.PI; esc.add(l); }
    for (const x of [-70, 0, 70]) { L.push(caja(3.2, 3.4, 18, x, 5.6, 425, '#d8dce2'), cil(0.5, 0.5, 4.2, x, 2.1, 432, '#8a9098', 8)); this.choca(x - 1.6, 416, x + 1.6, 434, 4); }
    L.push(cil(2.8, 3.2, 36, 190, 18, 438, '#e8e8ec', 16), cil(5.5, 4.5, 2, 190, 37, 438, '#e8e8ec', 8), cil(5.6, 5.6, 0.5, 190, 41.2, 438, '#3a3a3e', 8), cil(0.15, 0.15, 6, 190, 44.5, 438, '#c8ccd2', 6));
    V.push(cil(5.2, 5.2, 3.6, 190, 39.6, 438, '#1a2a3e', 8));
    this.choca(187, 435, 193, 441, 40);
    const ct = letrero('TORRE SJ', '#1a1a2a', '#7ae0ff', 6, 1); ct.position.set(190, 35.4, 432.4); ct.rotation.y = Math.PI; esc.add(ct);
  }

  malla(esc) {
    const A = AERO, tx = lienzo(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(200,205,210,0.9)'; x.lineWidth = 2; for (let k = -64; k < 128; k += 12) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 64, 64); x.stroke(); x.beginPath(); x.moveTo(k + 64, 0); x.lineTo(k, 64); x.stroke(); } });
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4 });
    const seg = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0); if (L < 0.5) return;
      const t = tx.clone(); t.needsUpdate = true; t.repeat.set(L / 3, 1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 3), mat.clone()); m.material.map = t; m.position.set((x0 + x1) / 2, 1.5, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); esc.add(m);
      for (let k = 0; k <= Math.ceil(L / 4); k++) { const f = Math.min(1, k * 4 / L); this.L.push(cil(0.05, 0.05, 3.3, x0 + (x1 - x0) * f, 1.65, z0 + (z1 - z0) * f, '#8a9098', 6)); }
      this.choca(Math.min(x0, x1) - 0.15, Math.min(z0, z1) - 0.15, Math.max(x0, x1) + 0.15, Math.max(z0, z1) + 0.15, 3.2);
    };
    const z = A.az0;
    seg(A.ax0, z, -158, z); seg(-140, z, -110, z); seg(110, z, 140, z); seg(158, z, A.ax1, z);
    seg(A.ax0, z, A.ax0, A.az1); seg(A.ax1, z, A.ax1, A.az1); seg(A.ax0, A.az1, A.ax1, A.az1);
    this.retenes = [];
    for (const [x, t] of [[149, 'CONTROL DE SEGURIDAD'], [-149, 'SOLO PERSONAL AUTORIZADO']]) {
      this.L.push(caja(2.6, 2.8, 2.6, x + (x > 0 ? 7 : -7), 1.4, z - 2.5, '#e8e8ec'), caja(2.8, 0.2, 2.8, x + (x > 0 ? 7 : -7), 2.9, z - 2.5, '#5a2a8a'));
      this.V.push(caja(2.62, 1.2, 2.62, x + (x > 0 ? 7 : -7), 1.9, z - 2.5, '#1a2a3e'));
      this.choca(x + (x > 0 ? 5.7 : -8.3), z - 3.8, x + (x > 0 ? 8.3 : -5.7), z - 1.2, 3);
      const piv = new THREE.Group(); piv.position.set(x - 9, 1.0, z); esc.add(piv);
      const brazo = new THREE.Mesh(new THREE.BoxGeometry(18, 0.18, 0.18).translate(9, 0, 0), new THREE.MeshStandardMaterial({ color: '#e8202e', roughness: 0.5 })); piv.add(brazo);
      this.retenes.push({ piv, x, abierto: 0 });
      const l = letrero(t, '#c8202e', '#ffffff', 9, 1); l.position.set(x, 3.4, z - 0.2); l.rotation.y = Math.PI; esc.add(l);
    }
    this.L.push(caja(2.4, 2.2, 0.8, this.vestidor.x, 1.1, this.vestidor.z, '#5a6a7a'));
    const lv = letrero('VESTIDORES DEL PERSONAL', '#1a2846', '#ffffff', 4, 0.6); lv.position.set(this.vestidor.x, 2.7, this.vestidor.z - 0.42); lv.rotation.y = Math.PI; esc.add(lv);
  }

  zonaAerea(esc) {
    const L = this.L, V = this.V;
    const techos = [];
    for (const [x0, n] of [[212, '6'], [276, '7']]) {
      const w = 52, cx = x0 + w / 2, cz = 444, col = n === '7' ? '#d8d0c0' : '#b8bec6';
      L.push(caja(w, 9, 0.5, cx, 4.5, cz - 19, col), caja(0.5, 9, 38, x0, 4.5, cz, col), caja(0.5, 9, 38, x0 + w, 4.5, cz, col), caja(w + 0.6, 1.4, 0.8, cx, 8.6, cz + 19, '#5a6068'));
      const piso = new THREE.PlaneGeometry(w, 38).rotateX(-Math.PI / 2).translate(cx, 0.09, cz); L.push(teñir(piso, '#8a8c90'));
      techos.push(new THREE.CylinderGeometry(w / 2, w / 2, 38.6, 24, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).scale(1, 0.36, 1).translate(cx, 9, cz));
      this.choca(x0, cz - 19.5, x0 + w, cz - 18.5, 9); this.choca(x0 - 0.4, cz - 19, x0 + 0.4, cz + 19, 9); this.choca(x0 + w - 0.4, cz - 19, x0 + w + 0.4, cz + 19, 9);
      const l = letrero(n === '7' ? 'HANGAR 7 · JACARANDA CARGO' : 'HANGAR 6', n === '7' ? '#3a1a0e' : '#10203a', n === '7' ? '#f2c431' : '#f2f4f8', 26, 2.4); l.position.set(cx, 10.6, cz + 19.5); esc.add(l);
      const cols = ['#c8202e', '#1a5ab8', '#2a8a4a', '#f27a1a', '#5a2a8a', '#8a8e94'];
      for (let k = 0; k < 6; k++) { const x = x0 + 6 + (k % 3) * 8, z = cz - 12 + Math.floor(k / 3) * 7; L.push(caja(6, 2.6, 2.5, x, 1.3, z, cols[(k + (n === '7' ? 2 : 0)) % 6])); if (k % 2 === 0) L.push(caja(6, 2.6, 2.5, x, 3.9, z, cols[(k + 3) % 6])); this.choca(x - 3, z - 1.25, x + 3, z + 1.25, 5); }
      for (let k = 0; k < 4; k++) { const x = x0 + w - 8, z = cz - 12 + k * 5; L.push(caja(2.2, 1.2, 2.2, x, 0.6, z, '#a8844a'), caja(2.2, 1.2, 2.2, x, 1.8, z, '#b8945a')); this.choca(x - 1.1, z - 1.1, x + 1.1, z + 1.1, 2.4); }
    }
    const tm = new THREE.Mesh(mergeGeometries(techos), new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.55, roughness: 0.4, side: THREE.DoubleSide })); tm.castShadow = tm.receiveShadow = true; esc.add(tm);
    this.fotosHangar = [[302 - 14, 444 - 10], [302 + 12, 444 - 14], [302, 444 + 8]];
    const cc = ['#c8202e', '#1a5ab8', '#2a8a4a', '#f27a1a', '#5a2a8a', '#e8e8ec', '#f2c431'];
    for (let k = 0; k < 16; k++) { const x = 290 + (k % 4) * 6.5, z = 496 - 0 + 0 * k, y = 1.3 + Math.floor(k / 8) * 2.6; if (k >= 8 && k % 2) continue; L.push(caja(6, 2.6, 2.5, x - 32, y, 475 + Math.floor((k % 8) / 4) * 3, cc[k % cc.length])); }
    this.choca(255, 473.5, 281, 479.5, 5);
    const veh = (x, z, ry, tipo) => {
      const R = (dx, dz) => [x + Math.cos(ry) * dx + Math.sin(ry) * dz, z - Math.sin(ry) * dx + Math.cos(ry) * dz];
      if (tipo === 'pipa') { L.push(caja(2.4, 2.2, 7, x, 1.5, z, '#e8e8ec', ry)); const [a, b] = R(0, -1); L.push(teñir(new THREE.CylinderGeometry(1.1, 1.1, 4.8, 14).rotateX(Math.PI / 2).rotateY(ry).translate(a, 2.6, b), '#f2c431')); }
      else if (tipo === 'escalera') { L.push(caja(2, 1.2, 4, x, 0.9, z, '#e8e8ec', ry)); for (let k = 0; k < 6; k++) { const [a, b] = R(0, 1 + k * 0.5); L.push(caja(1.4, 0.15, 0.5, a, 1.5 + k * 0.45, b, '#c8ccd2', ry)); } }
      else if (tipo === 'carritos') { for (let k = 0; k < 4; k++) { const [a, b] = R(0, k * 2.6); L.push(caja(1.6, 0.9, 2.2, a, 0.75, b, ['#5a6a7a', '#7a8a9a'][k % 2], ry)); } const [a, b] = R(0, -2.4); L.push(caja(1.6, 1.3, 2, a, 0.8, b, '#f2c431', ry)); }
      else { L.push(caja(2.2, 1.4, 3.4, x, 0.9, z, '#f2c431', ry), caja(1.8, 0.9, 1.4, x, 2.0, z, '#1a2230', ry)); }
      this.choca(x - 2.5, z - 2.5, x + 2.5, z + 2.5, 2);
    };
    for (const x of [-70, 0, 70]) { veh(x + 9, 440, Math.PI / 2, 'escalera'); veh(x - 11, 455, 0, 'carritos'); }
    veh(-130, 452, 0.3, 'pipa'); veh(130, 448, -0.4, 'pipa'); veh(-40, 470, Math.PI / 2, 'tractor'); veh(160, 462, 0, 'tractor'); veh(-250, 488, 1.2, 'pipa');
    for (let k = 0; k < 24; k++) { const x = -105 + k * 9, z = 434; if (Math.abs(((x + 300) % 70) - 30) < 6) continue; L.push(cil(0.05, 0.22, 0.55, x, 0.37, z, '#ff6a1a', 8)); }
    for (const x of [-70, 0, 70]) { L.push(caja(0.35, 0.02, 30, x, 0.1, 452, '#f2c431')); const st = letrero(String(x / 70 + 2 | 0 ? 'A' + (x / 70 + 2) : 'A2'), '#f2c431', '#111111', 3, 1.4); st.rotation.x = -Math.PI / 2; st.position.set(x + 3, 0.11, 467); esc.add(st); }
    for (const [x, t] of [[-150, 'A1 · A2 · A3 ←'], [150, '→ HANGARES · CARGA'], [-290, 'PISTA 09'], [300, 'PISTA 27']]) { const l = letrero(t, '#111111', '#f2c431', 5, 0.9); l.position.set(x, 1.3, 498); esc.add(l); L.push(caja(5.2, 0.15, 0.3, x, 0.7, 498.1, '#2a2a2e')); }
    this.hangar7 = { x: 302, z: 444 };
    for (let k = 0; k < 3; k++) { const x = -315 + k * 24; L.push(cil(9, 9, 11, x, 5.5, 450, '#e8e8ec', 24), cil(9.3, 9.3, 0.6, x, 11.2, 450, '#c8ccd2', 24), cil(9.05, 9.05, 0.8, x, 7, 450, '#c8202e', 24)); this.choca(x - 8.5, 441.5, x + 8.5, 458.5, 11); }
    L.push(caja(60, 0.6, 0.6, -291, 1.2, 436, '#8a9098'));
    const radarBase = cil(1, 1.4, 12, -220, 6, 474, '#e8e8ec', 10); L.push(radarBase); this.choca(-221.5, 472.5, -218.5, 475.5, 12);
    this.radar = new THREE.Group(); this.radar.position.set(-220, 12.6, 474);
    const plato = new THREE.Mesh(new THREE.BoxGeometry(8, 2.4, 0.4), new THREE.MeshStandardMaterial({ color: '#f2f2f4', metalness: 0.4, roughness: 0.4 })); plato.position.y = 1.2; plato.rotation.x = -0.25; this.radar.add(plato); esc.add(this.radar);
    this.focos = [];
    for (let k = 0; k < 9; k++) { const x = -200 + k * 50, z = 426; L.push(cil(0.18, 0.25, 16, x, 8, z, '#8a9098', 8), caja(2.2, 0.5, 1.2, x, 16, z + 0.4, '#3a3a3e')); V.push(caja(2, 0.12, 1.0, x, 15.75, z + 0.4, '#fff8e0')); this.choca(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 16); }
    const mat = new THREE.MeshBasicMaterial({ color: '#fff6dc', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    this.matReflector = mat;
    for (const [x, z] of [[-280, 470], [250, 470]]) {
      L.push(cil(0.4, 0.6, 14, x, 7, z, '#3a3a3e', 8)); this.choca(x - 0.7, z - 0.7, x + 0.7, z + 0.7, 14);
      const piv = new THREE.Group(); piv.position.set(x, 14.2, z); esc.add(piv);
      const cono = new THREE.Mesh(new THREE.ConeGeometry(7, 40, 20, 1, true).translate(0, -20, 0).rotateX(0.95), mat); piv.add(cono);
      this.focos.push(piv);
    }
    const manga = new THREE.Group(); manga.position.set(-330, 0, 498);
    manga.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6, 6).translate(0, 3, 0), new THREE.MeshStandardMaterial({ color: '#c8ccd2' })));
    const tela = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.2, 2.4, 10, 1, true).rotateZ(Math.PI / 2).translate(1.2, 5.8, 0), new THREE.MeshStandardMaterial({ color: '#ff6a1a', side: THREE.DoubleSide })); manga.add(tela); esc.add(manga); this.manga = manga;
  }

  carros() {
    const j = this.j, cols = ['#e8e8ec', '#1a1a1e', '#8a2a26', '#2e5a8a', '#c8c2b4', '#3a6a44'], tipos = ['sedan', 'compacto', 'camioneta', 'taxi'];
    for (let k = 0; k < 7; k++) { const x = -84 + k * 26 + (k % 2) * 3, z = 370 + (k % 3) * 1.2; j.ciudad.estacionados?.push({ x, z, yaw: k % 2 ? 0 : Math.PI, tipo: tipos[k % tipos.length], color: cols[k % cols.length] }); }
    for (let k = 0; k < 18; k++) this.L.push(caja(0.15, 0.02, 5.2, -96 + k * 12, 0.09, 371, '#f2f2f4'));
    this.L.push(caja(200, 0.02, 0.2, 0, 0.09, 376.5, '#f2c431'));
  }

  enZonaAerea(x, z) { const A = AERO; return x > A.ax0 && x < A.ax1 && z > A.az0 + 0.5 && z < A.az1; }
  enAeropuerto(x, z) { const A = AERO; return x > A.ax0 - 30 && x < A.ax1 + 30 && z > A.tz0 - 20 && z < A.az1 + 20; }

  tieneUniforme() { return !!this.j.propiedades?.uniforme; }

  cercaVestidor() { const p = this.j.jugador.pos; return !this.j.jugador.coche && this.tieneUniforme() && Math.hypot(p.x - this.vestidor.x, p.z - this.vestidor.z) < 2.6; }

  ponerDisfraz(si) {
    const j = this.j, J = j.jugador, R = j.sinRealista ? null : realistaDe(J.personaje);
    J.disfraz = !!si;
    if (R) { R.teñirChamarra(si ? '#1a2846' : null); R.peinado(si ? 'gorra' : J.estilo?.estiloPelo || 'corto'); }
    j.hud.notificar('ok', si ? 'Uniforme de seguridad puesto' : 'Te quitaste el uniforme', si ? 'Los guardias no te molestan si no corres cerca de ellos ni disparas.' : '', 3.5);
  }

  vestidorE() { if (this.cercaVestidor()) this.ponerDisfraz(!this.j.jugador.disfraz); }

  guardiasArmar() {
    const j = this.j, puestos = [[149 + 7, AERO.az0 + 3.5, null], [-149 - 7, AERO.az0 + 3.5, null], [this.hangar7.x - 10, 466, null], [-120, 470, [[-120, 470], [120, 470]]], [60, 476, [[60, 476], [-160, 476]]], [255, 480, [[255, 480], [320, 480]]]];
    this.guardias = puestos.map(([x, z, ruta]) => { const g = new Peaton(j, { tipo: 'poli', x, z, estado: 'quieto', arma: 'pistola' }); g.guardia = true; g.fila = true; g.ruta = null; g.patrulla = ruta; g.iPat = 0; g.yaw = Math.PI; j.peatones.push(g); return g; });
  }

  guardiasQuitar() { const j = this.j; for (const g of this.guardias) { const i = j.peatones.indexOf(g); if (i >= 0) { g.quitar(); j.peatones.splice(i, 1); } } this.guardias = []; }

  alarma(motivo) {
    const j = this.j;
    if (this.alerta > 0) return;
    this.alerta = 120;
    if ((j.policia.estrellas || 0) < 3) j.policia.subir(3);
    for (const g of this.guardias) if (!g.muerto) g.estado = 'perseguir';
    j.hud.grande('¡ALERTA EN EL AEROPUERTO!', motivo || 'Te descubrieron', 2.4);
    j.audio.alerta?.();
    j.misiones?.activa?.alarmaAeropuerto?.(j.misiones);
  }

  actualizarTrafico(dt) {
    const T = this.trafico, A = AERO, pz = (A.pista.z0 + A.pista.z1) / 2;
    T.t -= dt;
    if (T.fase === 'espera') { T.grupo.visible = false; if (T.t <= 0) { T.fase = Math.random() < 0.5 ? 'despegue' : 'aterrizaje'; if (T.fase === 'despegue') { T.pos.set(A.pista.x0 + 15, 0, pz - 6); T.v = 0; } else { T.pos.set(-1300, 130, pz + 6); T.v = 75; } } return; }
    T.grupo.visible = true;
    if (T.fase === 'despegue') {
      T.v = Math.min(85, T.v + dt * 7.5); T.pos.x += T.v * dt;
      if (T.v > 62) T.pos.y += dt * 11;
      T.cuerpo.rotation.x = T.v > 62 ? -0.16 : 0;
      if (T.pos.x > 1400) { T.fase = 'espera'; T.t = 40 + Math.random() * 40; }
    } else {
      const toque = A.pista.x0 + 50;
      if (T.pos.x < toque) { T.pos.x += T.v * dt; T.pos.y = Math.max(0, 130 * (toque - T.pos.x) / (toque + 1300)); T.cuerpo.rotation.x = -0.05; }
      else { T.v = Math.max(0, T.v - dt * 9); T.pos.x += T.v * dt; T.pos.y = 0; T.cuerpo.rotation.x = 0; if (T.v <= 0.1) { T.fase = 'espera'; T.t = 35 + Math.random() * 40; } }
    }
    T.grupo.position.copy(T.pos); T.grupo.rotation.y = Math.PI / 2;
    const jp = this.j.jugador.posicion, d = Math.hypot(T.pos.x - jp.x, T.pos.z - jp.z, T.pos.y);
    this.tRuido = (this.tRuido || 0) - dt;
    if (d < 400 && this.tRuido <= 0) { this.tRuido = 0.18; this.j.audio?.ruidoCorto?.(0.2, 380, Math.min(0.35, 30 / Math.max(30, d)) * (0.4 + T.v / 140), 'lowpass'); }
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador, jp = J.posicion, t = performance.now() / 1000, n = j.ambiente.noche ?? 0;
    this.matVidrio.emissiveIntensity = n * 0.9;
    this.luces.visible = true; this.luces.material.color.setScalar(0.35 + n * 0.65);
    this.radar.rotation.y += dt * 1.1;
    this.manga.rotation.y = Math.sin(t * 0.13) * 0.6 - 0.4;
    this.matReflector.opacity = n > 0.35 ? (n - 0.35) * 0.14 : 0;
    this.focos.forEach((f, k) => { f.rotation.y = Math.sin(t * 0.3 + k * 2) * 1.2 + (k ? Math.PI : 0); f.visible = n > 0.35; });
    for (const J2 of this.jets) J2.estrobo.visible = Math.sin(t * 6) > 0.6;
    this.actualizarTrafico(dt);
    const cerca = Math.hypot(jp.x - 0, jp.z - 460) < 420;
    if (cerca && !this.guardias.length) this.guardiasArmar();
    else if (!cerca && this.guardias.length && Math.hypot(jp.x, jp.z - 460) > 520) this.guardiasQuitar();
    for (const R of this.retenes) { const d = Math.hypot(jp.x - R.x, jp.z - AERO.az0); const abre = d < 14 && (J.disfraz || j.misiones?.activa?.pasaReten); R.abierto += ((abre ? 1 : 0) - R.abierto) * Math.min(1, dt * 3); R.piv.rotation.z = R.abierto * 1.35; }
    for (const g of this.guardias) {
      if (g.muerto || this.alerta > 0) continue;
      if (g.patrulla && (g.estado === 'quieto' || g.llego)) { g.llego = false; g.iPat = (g.iPat + 1) % g.patrulla.length; const [x, z] = g.patrulla[g.iPat]; g.meta = { x, z }; g.metaVel = 1.2; g.estado = 'irPunto'; }
    }
    if (this.alerta > 0) { this.alerta -= dt; if (this.alerta <= 0 || (!j.policia.estrellas && this.alerta < 100)) this.alerta = 0; }
    if (this.cercaVestidor() && !j.overlay) j.hud.pista('E', J.disfraz ? 'Quitarte el uniforme' : 'Ponerte el uniforme de seguridad');
    if (J.disfraz && !this.enAeropuerto(jp.x, jp.z) && Math.hypot(jp.x, jp.z - 460) > 650) this.ponerDisfraz(false);
    const dentro = !J.interior && this.enZonaAerea(jp.x, jp.z) && !(j.vuelo?.activa && j.vuelo.activa.pos.y > 30);
    if (!dentro || this.alerta > 0) { this.tAviso = 0; this.sospecha = 0; return; }
    if (j.misiones?.activa?.permisoAeropuerto) return;
    if (!J.disfraz) {
      this.tAviso += dt;
      if (this.tAviso < 0.1) j.hud.grande('ZONA RESTRINGIDA', 'Sal ya o llamamos a la policía', 2, 'falla');
      j.hud.pista('·', `Zona restringida · alarma en ${Math.max(0, Math.ceil(5 - this.tAviso))} s`);
      if (this.tAviso > 5) this.alarma('Entraste sin permiso');
      return;
    }
    let sos = false;
    for (const g of this.guardias) if (!g.muerto && g.pos.distanceTo(J.pos) < (J.velocidad > 4 ? 7 : 3.2)) sos = true;
    if (j.policia.estrellas > 0) this.alarma('Hubo disparos en la pista');
    this.sospecha = sos ? this.sospecha + dt : Math.max(0, this.sospecha - dt * 0.5);
    if (this.sospecha > 0.05 && sos) j.hud.pista('·', 'Un guardia te está viendo… aléjate despacio');
    if (this.sospecha > 2.6) this.alarma('"¿Y tú de qué turno eres?"');
  }

  marcasMapa() { return [{ x: 0, z: 404, tipo: 'icono', ic: { c: '#7ae0ff', t: 'avion', n: 'Aeropuerto Internacional' } }]; }
}
