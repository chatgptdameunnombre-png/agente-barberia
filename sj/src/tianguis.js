import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BANQUETA, VIENTO } from './ciudad.js?v=202611220236';

const _c = new THREE.Color();
function teñir(geo, hex) { _c.set(hex); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
const caja = (w, h, d, x, y, z, col) => teñir(new THREE.BoxGeometry(w, h, d).translate(x, y, z), col);
function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

const LONAS = ['#e8317a', '#2a7de0', '#ff7a1a', '#f2c14e', '#2fbf71', '#e8317a', '#7a3ab0', '#2a7de0'];
const FRUTA = ['#ff8a1a', '#d8202e', '#f2d23a', '#6ab83a', '#ff5a3a', '#7a2a6a'];
const ROPA = ['#d8434b', '#f2f2f2', '#2c5aa0', '#f2c14e', '#3a8f5c', '#e07ab0', '#1f1f22', '#7fb8e6'];

export function armarTianguis(juego) {
  const B = juego.ciudad.bloques.find(b => b.tipo === 'tianguis'); if (!B) return null;
  const r = rng(321), escena = juego.escena, mundo = juego.mundo, Y = 0.17;
  const ix0 = B.x0 + BANQUETA, ix1 = B.x1 - BANQUETA, iz0 = B.z0 + BANQUETA;
  const fijo = [], merca = [], lonas = [], ropa = [];
  let puestos = 0;
  for (const zp of [iz0 + 9, iz0 + 23, iz0 + 37, iz0 + 51]) {
    for (const lado of [-1, 1]) {
      const zt = zp + lado * 1.15;
      for (let x = ix0 + 5; x < ix1 - 5; x += 3.6) {
        puestos++;
        fijo.push(caja(3.1, 0.06, 1.3, x, Y + 0.85, zt, '#8a6a4a'), caja(3.0, 0.82, 0.05, x, Y + 0.42, zt + lado * 0.62, '#6a5038'));
        for (const dx of [-1.5, 1.5]) fijo.push(caja(0.06, 2.4, 0.06, x + dx, Y + 1.2, zt - lado * 0.6, '#7a7f86'), caja(0.06, 2.1, 0.06, x + dx, Y + 1.05, zt + lado * 1.6, '#7a7f86'));
        mundo.agregar(x - 1.55, zt - 0.66, x + 1.55, zt + 0.66, 0.9);
        const lona = new THREE.PlaneGeometry(3.6, 2.4, 4, 2).rotateX(-Math.PI / 2 + lado * 0.2);
        lonas.push(teñir(lona.translate(x, Y + 2.3, zt + lado * 0.5), LONAS[(puestos + (lado > 0 ? 3 : 0)) % LONAS.length]));
        const tipo = r();
        if (tipo < 0.3) {
          for (let k = 0; k < 4; k++) {
            const col = FRUTA[r() * FRUTA.length | 0], px = x - 1.1 + k * 0.72;
            for (const [ox, oy, oz] of [[-0.12, 0, -0.12], [0.12, 0, -0.12], [-0.12, 0, 0.12], [0.12, 0, 0.12], [0, 0.17, 0]]) merca.push(teñir(new THREE.IcosahedronGeometry(0.11, 0).translate(px + ox, Y + 0.98 + oy, zt + oz), col));
          }
        } else if (tipo < 0.55) {
          fijo.push(caja(3.2, 0.04, 0.04, x, Y + 2.05, zt + lado * 0.75, '#c9ced4'));
          for (let k = 0; k < 6; k++) ropa.push(teñir(new THREE.PlaneGeometry(0.42, 0.62, 1, 2).translate(x - 1.25 + k * 0.5, Y + 1.72, zt + lado * 0.76), ROPA[r() * ROPA.length | 0]));
          for (let k = 0; k < 5; k++) merca.push(caja(0.42, 0.08, 0.32, x - 1.1 + k * 0.55, Y + 0.92, zt, ROPA[r() * ROPA.length | 0]));
        } else if (tipo < 0.75) {
          for (let k = 0; k < 7; k++) { const h = 0.15 + r() * 0.3; merca.push(caja(0.3, h, 0.26, x - 1.2 + k * 0.4, Y + 0.88 + h / 2, zt + (r() - 0.5) * 0.4, ['#ff3d8b', '#3bd1ff', '#ffd23a', '#2fbf71', '#ff7a1a'][k % 5])); }
        } else if (tipo < 0.9) {
          for (let k = 0; k < 5; k++) { const col = ['#c8202e', '#e8a33a', '#7a4a2a', '#3a8f3a', '#f2d23a'][k]; merca.push(teñir(new THREE.CylinderGeometry(0.18, 0.13, 0.12, 10).translate(x - 1.1 + k * 0.55, Y + 0.94, zt), '#d9c49a'), teñir(new THREE.ConeGeometry(0.16, 0.14, 10).translate(x - 1.1 + k * 0.55, Y + 1.06, zt), col)); }
        } else {
          for (let k = 0; k < 8; k++) merca.push(caja(0.26, 0.12, 0.32, x - 1.25 + k * 0.36, Y + 0.94, zt + (k % 2) * 0.2 - 0.1, ['#1a1a1c', '#f2f2f2', '#8a5a3a', '#c8202e'][k % 4]));
        }
        if (r() < 0.6) for (let k = 0; k < 1 + (r() * 3 | 0); k++) fijo.push(caja(0.5, 0.32, 0.36, x - 1 + k * 0.6, Y + 0.16, zt - lado * 0.95, '#b08a5a'));
      }
    }
  }
  const mF = new THREE.Mesh(mergeGeometries(fijo.map(g => g.toNonIndexed())), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.15 })); mF.castShadow = mF.receiveShadow = true; escena.add(mF);
  const mM = new THREE.Mesh(mergeGeometries(merca.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })); mM.castShadow = true; escena.add(mM);
  const matL = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
  matL.onBeforeCompile = sh => { sh.uniforms.tiempo = VIENTO; sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed.y += sin(tiempo * 2.3 + position.x * 0.9 + position.z * 0.7) * 0.035;'); };
  const mL = new THREE.Mesh(mergeGeometries(lonas.map(g => g.toNonIndexed())), matL); mL.castShadow = true; escena.add(mL);
  const matR = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
  matR.onBeforeCompile = sh => { sh.uniforms.tiempo = VIENTO; sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float kk = clamp((1.72 - position.y + 0.31) / 0.62, 0.0, 1.0);\n  transformed.z += sin(tiempo * 3.0 + position.x * 2.0) * 0.06 * kk;'); };
  if (ropa.length) { const mR = new THREE.Mesh(mergeGeometries(ropa.map(g => g.toNonIndexed())), matR); mR.castShadow = true; escena.add(mR); }
  return { puestos };
}
