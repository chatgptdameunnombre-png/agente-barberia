import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function adornarKiosco(juego) {
  const L = juego.ciudad.lugares.plaza; if (!L) return null;
  const cx = L.x, cz = L.z, Y = 1.35, escena = juego.escena;
  const hierro = new THREE.MeshStandardMaterial({ color: '#1d3a2c', roughness: 0.45, metalness: 0.55 });
  const cantera = new THREE.MeshStandardMaterial({ color: '#d9c9a8', roughness: 0.85 });
  const oro = new THREE.MeshStandardMaterial({ color: '#e2b64a', roughness: 0.3, metalness: 0.8 });
  const fierros = [], piedras = [], dorados = [];
  const abierto = a => { const d = Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))), e = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))); return d < 0.17 || e < 0.17; };
  const R = 6.85, n = 96;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2; if (abierto(a)) continue;
    const x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
    fierros.push(new THREE.CylinderGeometry(0.022, 0.022, 0.85, 5).translate(x, Y + 0.43, z));
    if (i % 2 === 0) fierros.push(new THREE.TorusGeometry(0.09, 0.012, 4, 10).rotateY(-a + Math.PI / 2).translate(x, Y + 0.55, z));
  }
  for (const [y, r] of [[Y + 0.88, 0.045], [Y + 0.12, 0.03]]) {
    for (const [a0, a1] of [[Math.PI / 2 + 0.17, Math.PI * 1.5 - 0.17], [-Math.PI / 2 + 0.17, Math.PI / 2 - 0.17]]) {
      const t = new THREE.TorusGeometry(R, r, 5, 64, a1 - a0).rotateX(Math.PI / 2).rotateY(-a0); t.translate(cx, y, cz); fierros.push(t);
    }
  }
  for (const s of [1, -1]) {
    for (let k = 0; k < 4; k++) piedras.push(new THREE.BoxGeometry(2.6, 0.3, 0.42).translate(cx, 0.15 + k * 0.3, cz + s * (7.75 + (3 - k) * 0.4)));
    for (const sx of [-1.4, 1.4]) { piedras.push(new THREE.BoxGeometry(0.34, 1.2, 0.34).translate(cx + sx, Y + 0.3, cz + s * 6.95)); dorados.push(new THREE.SphereGeometry(0.16, 10, 8).translate(cx + sx, Y + 1.05, cz + s * 6.95)); }
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8, x = cx + Math.cos(a) * 6, z = cz + Math.sin(a) * 6;
    piedras.push(new THREE.CylinderGeometry(0.36, 0.42, 0.35, 8).translate(x, Y + 0.17, z));
    fierros.push(new THREE.CylinderGeometry(0.42, 0.24, 0.3, 8).translate(x, 5.35, z));
    const b = (i + 1) / 8 * Math.PI * 2 + Math.PI / 8, rc = 6 * Math.cos(Math.PI / 8), mx = cx + Math.cos((a + b) / 2) * rc, mz = cz + Math.sin((a + b) / 2) * rc;
    const lado = 2 * 6 * Math.sin(Math.PI / 8);
    const ra = lado / 2 - 0.15, arco = new THREE.TorusGeometry(ra, 0.04, 5, 20, Math.PI).scale(1, 0.45, 1).rotateY(-(a + b) / 2 + Math.PI / 2); arco.translate(mx, 4.45, mz); fierros.push(arco);
    for (let k = 1; k < 6; k++) { const u = k / 6, px = x + (cx + Math.cos(b) * 6 - x) * u, pz = z + (cz + Math.sin(b) * 6 - z) * u, w = (u - 0.5) * 2 * (lado / 2), h = Math.sqrt(Math.max(0, ra * ra - w * w)) * 0.45, largo = Math.max(0.05, 1.0 - h); fierros.push(new THREE.CylinderGeometry(0.015, 0.015, largo, 4).translate(px, 5.45 - largo / 2, pz)); }
  }
  fierros.push(new THREE.TorusGeometry(8.35, 0.12, 6, 48).rotateX(Math.PI / 2).translate(cx, 5.55, cz));
  piedras.push(new THREE.CylinderGeometry(7.55, 7.6, 0.18, 32).translate(cx, Y - 0.02, cz));
  fierros.push(new THREE.CylinderGeometry(0.9, 1.1, 0.9, 8, 1, true).translate(cx, 8.2, cz));
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; fierros.push(new THREE.BoxGeometry(0.06, 0.9, 0.06).translate(cx + Math.cos(a) * 0.95, 8.2, cz + Math.sin(a) * 0.95)); }
  fierros.push(new THREE.ConeGeometry(1.25, 0.9, 8).translate(cx, 9.1, cz));
  dorados.push(new THREE.SphereGeometry(0.32, 12, 10).translate(cx, 9.8, cz));
  fierros.push(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 4).translate(cx, 4.9, cz));
  const candil = new THREE.Group(); candil.position.set(cx, 4.1, cz);
  const vela = new THREE.MeshBasicMaterial({ color: '#ffe8b0', toneMapped: false });
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 5, 24).rotateX(Math.PI / 2), hierro); candil.add(aro);
  const focos = [];
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), vela); f.position.set(Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55); candil.add(f); focos.push(f); }
  escena.add(candil);
  const mallas = [[fierros, hierro], [piedras, cantera], [dorados, oro]].map(([l, m]) => { const g = mergeGeometries(l.map(x => x.index ? x.toNonIndexed() : x).map(x => { for (const k of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k)) x.deleteAttribute(k); return x; })); const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; escena.add(me); return me; });
  return {
    mallas,
    actualizar(noche) { vela.color.setScalar(noche > 0.2 ? 1.6 : 0.6); }
  };
}
