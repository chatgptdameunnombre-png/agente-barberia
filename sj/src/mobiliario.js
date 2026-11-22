import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BLOQUES, CALLE, linea, rng, LIMITE, tipoBloque } from './ciudad.js?v=202611220109';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();

function instancias(geo, mat, lista, sombra = true) {
  const im = new THREE.InstancedMesh(geo, mat, lista.length);
  lista.forEach((t, i) => { _e.set(t.rx || 0, t.ry || 0, t.rz || 0); _q.setFromEuler(_e); _p.set(t.x, t.y || 0, t.z); _s.set(t.sx || 1, t.sy || 1, t.sz || 1); _m.compose(_p, _q, _s); im.setMatrixAt(i, _m); });
  im.castShadow = sombra; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true;
  return im;
}

function lienzo(w, h, dibujar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function catenaria(a, b, caida, n = 10) {
  const pts = [];
  for (let k = 0; k <= n; k++) { const t = k / n; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * caida, a.z + (b.z - a.z) * t)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, 0.013, 3, false);
}

export function amueblar(juego) {
  const { escena, ciudad, mundo } = juego, r = rng(4242), g = new THREE.Group();
  const postes = [], hidrantes = [], registros = [], altos = [], jardineras = [], arbustos = [], manchas = [], aires = [], cables = [], transformadores = [];
  const libre = (x, z) => !ciudad.farolas.some(f => Math.abs(f.x - x) + Math.abs(f.z - z) < 3.5);
  const borde = CALLE / 2 + 0.45;
  for (let i = 0; i <= BLOQUES; i++) for (const eje of ['x', 'z']) {
    const lado = (i % 2) ? 1 : -1, cadena = [];
    for (let b = 0; b < BLOQUES; b++) for (const t of [16, 40, 64]) {
      const u = linea(b) + t, v = linea(i) + lado * borde;
      const x = eje === 'x' ? u : v, z = eje === 'x' ? v : u;
      if (Math.abs(x) > LIMITE - 2 || Math.abs(z) > LIMITE - 2 || !libre(x, z)) { cadena.push(null); continue; }
      const ry = eje === 'x' ? 0 : Math.PI / 2;
      const P = { x, z, ry, eje, lado }; postes.push(P); cadena.push(P);
      mundo.agregar(x - 0.16, z - 0.16, x + 0.16, z + 0.16, 8.6);
      if (r() < 0.22) transformadores.push({ x: x - (eje === 'z' ? lado * 0.32 : 0), y: 6.3, z: z - (eje === 'x' ? lado * 0.32 : 0) });
      const hx = eje === 'x' ? u + 12 : linea(i) - lado * borde, hz = eje === 'x' ? linea(i) - lado * borde : u + 12;
      if (t === 40 && r() < 0.55 && libre(hx, hz) && Math.abs(hx) < LIMITE - 2 && Math.abs(hz) < LIMITE - 2) { hidrantes.push({ x: hx, z: hz }); mundo.agregar(hx - 0.18, hz - 0.18, hx + 0.18, hz + 0.18, 0.8); }
      if (t === 40) for (const carril of [-1, 1]) if (r() < 0.6) { const rx = eje === 'x' ? u + (r() - 0.5) * 20 : linea(i) + carril * 4, rz = eje === 'x' ? linea(i) + carril * 4 : u + (r() - 0.5) * 20; registros.push({ x: rx, y: 0.015, z: rz, rx: -Math.PI / 2, rz: r() * 6 }); }
      for (let k = 0; k < 2; k++) if (r() < 0.55) { const mx = eje === 'x' ? u + (r() - 0.5) * 30 : linea(i) + (r() - 0.5) * 10, mz = eje === 'x' ? linea(i) + (r() - 0.5) * 10 : u + (r() - 0.5) * 30; const s = 0.8 + r() * 2.4; manchas.push({ x: mx, y: 0.012 + k * 0.001, z: mz, rx: -Math.PI / 2, rz: r() * 6, sx: s, sy: s * (0.5 + r() * 0.6) }); }
    }
    for (let k = 0; k < cadena.length - 1; k++) {
      const A = cadena[k], B = cadena[k + 1];
      if (!A || !B) continue;
      for (const off of [-0.72, 0, 0.72]) {
        const ox = A.eje === 'x' ? 0 : off, oz = A.eje === 'x' ? off : 0;
        const d = Math.hypot(B.x - A.x, B.z - A.z);
        cables.push(catenaria(new THREE.Vector3(A.x + ox, 7.86, A.z + oz), new THREE.Vector3(B.x + ox, 7.86, B.z + oz), d * 0.02 + 0.15, 10));
      }
    }
  }
  for (const P of postes) {
    if (r() > 0.5) continue;
    const nx = P.eje === 'x' ? 0 : P.lado, nz = P.eje === 'x' ? P.lado : 0;
    const a = new THREE.Vector3(P.x, 7.1, P.z), b = new THREE.Vector3(P.x + nx * 4.2, 4.6 + r() * 1.5, P.z + nz * 4.2);
    if (mundo.celda(b.x, b.z).some(c => b.x > c.minx - 0.4 && b.x < c.maxx + 0.4 && b.z > c.minz - 0.4 && b.z < c.maxz + 0.4)) cables.push(catenaria(a, b, 0.35, 6));
  }
  for (let i = 0; i <= BLOQUES; i++) for (let j = 0; j <= BLOQUES; j++) {
    const X = linea(i), Z = linea(j), d = CALLE / 2 + 0.7;
    for (const [sx, sz] of [[1, -1], [-1, 1]]) {
      if (r() > 0.45) continue;
      const x = X + sx * d, z = Z + sz * d;
      if (Math.abs(x) > LIMITE - 1 || Math.abs(z) > LIMITE - 1) continue;
      altos.push({ x, z, ry: Math.atan2(-sx, -sz) + (r() < 0.5 ? Math.PI / 2 : 0) });
      mundo.agregar(x - 0.06, z - 0.06, x + 0.06, z + 0.06, 2.6);
    }
  }
  for (let bx = 0; bx < BLOQUES; bx++) for (let bz = 0; bz < BLOQUES; bz++) {
    const tipo = tipoBloque(bx, bz);
    if (tipo !== 'centro' && tipo !== 'torres') continue;
    const x0 = linea(bx), z0 = linea(bz);
    for (const [eje, v] of [['x', z0 + CALLE / 2 + 2.3], ['x', z0 + 80 - CALLE / 2 - 2.3], ['z', x0 + CALLE / 2 + 2.3], ['z', x0 + 80 - CALLE / 2 - 2.3]]) {
      for (const t of [28, 52]) {
        const x = eje === 'x' ? x0 + t : v, z = eje === 'x' ? v : z0 + t;
        if (!libre(x, z) || mundo.celda(x, z).some(c => x > c.minx - 0.8 && x < c.maxx + 0.8 && z > c.minz - 0.8 && z < c.maxz + 0.8)) continue;
        const ry = eje === 'x' ? 0 : Math.PI / 2;
        jardineras.push({ x, y: 0.25, z, ry });
        for (let k = 0; k < 3; k++) arbustos.push({ x: x + (eje === 'x' ? (k - 1) * 0.5 : 0), y: 0.72 + r() * 0.08, z: z + (eje === 'z' ? (k - 1) * 0.5 : 0), sx: 0.85 + r() * 0.3, sy: 0.8 + r() * 0.35, sz: 0.85 + r() * 0.3, ry: r() * 6 });
        mundo.agregar(x - (eje === 'x' ? 0.85 : 0.35), z - (eje === 'x' ? 0.35 : 0.85), x + (eje === 'x' ? 0.85 : 0.35), z + (eje === 'x' ? 0.35 : 0.85), 0.6);
      }
    }
  }
  const grafitis = [];
  for (const e of ciudad.edificios || []) {
    const [fx, fz] = e.frente;
    const ancho = fx === 0 ? e.w : e.fondo, rot = Math.atan2(fx, fz), cx = e.x + fx * e.fondo / 2, cz = e.z + fz * e.fondo / 2;
    if (e.estilo === 'casa' && e.h > 5.5 && r() < 0.45) {
      const n = 1 + (r() * 2 | 0);
      for (let k = 0; k < n; k++) { const off = (r() - 0.5) * (ancho - 2.4); aires.push({ x: cx + fx * 0.32 + (fz !== 0 ? off : 0), y: 4.4 + (r() < 0.5 ? 0 : 3), z: cz + fz * 0.32 + (fx !== 0 ? off : 0), ry: rot }); }
    }
    if (e.estilo === 'casa' && tipoBloque(Math.floor(e.x / 80 + BLOQUES / 2), Math.floor(e.z / 80 + BLOQUES / 2)) === 'barrio' && r() < 0.16 && grafitis.length < 40) {
      const off = (r() - 0.5) * (ancho - 4);
      grafitis.push({ x: cx + fx * 0.035 + (fz !== 0 ? off : 0), y: 1.25 + r() * 0.3, z: cz + fz * 0.035 + (fx !== 0 ? off : 0), ry: rot, k: r() * 8 | 0, s: 2.2 + r() * 1.4 });
    }
  }

  const concreto = new THREE.MeshStandardMaterial({ color: '#9a9890', roughness: 0.9 });
  const posteGeo = mergeGeometries([new THREE.CylinderGeometry(0.1, 0.15, 8.6, 8).translate(0, 4.3, 0)]);
  g.add(instancias(posteGeo, concreto, postes));
  const cruceta = mergeGeometries([new THREE.BoxGeometry(0.1, 0.1, 1.7).translate(0, 7.75, 0), ...[-0.72, 0, 0.72].map(o => new THREE.CylinderGeometry(0.035, 0.045, 0.14, 6).translate(0, 7.86, o))]);
  g.add(instancias(cruceta, new THREE.MeshStandardMaterial({ color: '#5a5650', roughness: 0.7 }), postes));
  if (transformadores.length) g.add(instancias(mergeGeometries([new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12), new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12).translate(0, 0.42, 0)]), new THREE.MeshStandardMaterial({ color: '#7d8388', roughness: 0.5, metalness: 0.4 }), transformadores));
  if (cables.length) { const cg = mergeGeometries(cables); const cm = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: '#17171a' })); cm.frustumCulled = false; g.add(cm); }
  const rojo = new THREE.MeshStandardMaterial({ color: '#c0262a', roughness: 0.45, metalness: 0.2 });
  const imHidrantes = instancias(mergeGeometries([new THREE.CylinderGeometry(0.13, 0.15, 0.62, 12).translate(0, 0.31, 0), new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.62, 0), new THREE.CylinderGeometry(0.05, 0.05, 0.38, 8).rotateZ(Math.PI / 2).translate(0, 0.44, 0), new THREE.CylinderGeometry(0.065, 0.065, 0.1, 8).rotateX(Math.PI / 2).translate(0, 0.44, 0.13), new THREE.CylinderGeometry(0.17, 0.17, 0.05, 12).translate(0, 0.03, 0)]), rojo, hidrantes);
  g.add(imHidrantes);
  const tReg = lienzo(128, 128, (c, w) => { c.fillStyle = '#2a2826'; c.beginPath(); c.arc(64, 64, 63, 0, 7); c.fill(); c.strokeStyle = '#4a4744'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#3c3a37'; c.lineWidth = 3; for (let k = 16; k < 112; k += 12) { c.beginPath(); c.moveTo(k, 20); c.lineTo(k, 108); c.stroke(); } c.fillStyle = '#55524e'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('SIAPA', 64, 70); });
  g.add(instancias(new THREE.CircleGeometry(0.42, 20), new THREE.MeshStandardMaterial({ map: tReg, roughness: 0.6, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }), registros, false));
  const tMancha = lienzo(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(10,10,12,0.55)'); gr.addColorStop(0.6, 'rgba(12,12,14,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
  g.add(instancias(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tMancha, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }), manchas, false));
  const tAlto = lienzo(128, 128, (c) => { c.translate(64, 64); c.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; c.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); } c.closePath(); c.fillStyle = '#ffffff'; c.fill(); c.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; c.lineTo(Math.cos(a) * 56, Math.sin(a) * 56); } c.closePath(); c.fillStyle = '#c4161c'; c.fill(); c.fillStyle = '#fff'; c.font = 'bold 40px Anton, Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ALTO', 0, 3); });
  g.add(instancias(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 6).translate(0, 1.25, 0), new THREE.MeshStandardMaterial({ color: '#8a8d92', metalness: 0.6, roughness: 0.4 }), altos));
  const placa = new THREE.CircleGeometry(0.36, 8).rotateZ(Math.PI / 8).translate(0, 2.35, 0.04);
  g.add(instancias(placa, new THREE.MeshStandardMaterial({ map: tAlto, roughness: 0.5, side: THREE.DoubleSide }), altos));
  if (jardineras.length) {
    g.add(instancias(new THREE.BoxGeometry(1.7, 0.5, 0.7), new THREE.MeshStandardMaterial({ color: '#b8b2a6', roughness: 0.95 }), jardineras));
    const hoja = new THREE.MeshStandardMaterial({ color: '#3f6b33', roughness: 0.9 });
    const geoA = new THREE.IcosahedronGeometry(0.34, 1); const pa = geoA.attributes.position; for (let k = 0; k < pa.count; k++) { const f = 0.85 + Math.sin(pa.getX(k) * 23 + pa.getY(k) * 17) * 0.12; pa.setXYZ(k, pa.getX(k) * f, pa.getY(k) * f * 0.8, pa.getZ(k) * f); } geoA.computeVertexNormals();
    g.add(instancias(geoA, hoja, arbustos));
  }
  if (aires.length) {
    const ac = mergeGeometries([new THREE.BoxGeometry(0.85, 0.55, 0.45).translate(0, 0, 0.22), new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16).rotateX(Math.PI / 2).translate(-0.15, 0, 0.455), new THREE.BoxGeometry(0.9, 0.04, 0.5).translate(0, -0.3, 0.22)]);
    g.add(instancias(ac, new THREE.MeshStandardMaterial({ color: '#d8d6d0', roughness: 0.6, metalness: 0.2 }), aires));
  }
  if (grafitis.length) {
    const PAL = ['JACA', 'SJ 33', 'LOS DEL 7', 'TUIA', 'MERO', 'NOPAL', 'KIKE', 'PERLA'];
    const tG = lienzo(1024, 512, (c) => {
      for (let k = 0; k < 8; k++) {
        const x = (k % 4) * 256, y = Math.floor(k / 4) * 256;
        c.save(); c.translate(x + 128, y + 140); c.rotate((Math.random() - 0.5) * 0.25);
        const cols = [['#ff4f9a', '#2a1440'], ['#3fd2ff', '#0c2a3a'], ['#ffd84a', '#3a2a0a'], ['#4fe08a', '#0a2a14'], ['#ff7a2a', '#2a1006'], ['#b46bff', '#1a0a2a']][k % 6];
        c.font = 'italic 900 ' + (64 - PAL[k].length * 3) + 'px Impact, Anton, sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round';
        c.lineWidth = 16; c.strokeStyle = cols[1]; c.strokeText(PAL[k], 0, 0);
        c.lineWidth = 6; c.strokeStyle = '#ffffff'; c.strokeText(PAL[k], 0, 0);
        c.fillStyle = cols[0]; c.fillText(PAL[k], 0, 0);
        for (let s = 0; s < 40; s++) { c.fillStyle = cols[0]; c.globalAlpha = 0.5; c.fillRect((Math.random() - 0.5) * 220, (Math.random() - 0.5) * 90, 2, 2); }
        c.globalAlpha = 1; c.restore();
      }
    });
    tG.wrapS = tG.wrapT = THREE.ClampToEdgeWrapping;
    const mats = [];
    for (let k = 0; k < 8; k++) { const t = tG.clone(); t.needsUpdate = true; t.repeat.set(0.25, 0.5); t.offset.set((k % 4) * 0.25, k < 4 ? 0.5 : 0); mats.push(new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 })); }
    for (const G of grafitis) { const m = new THREE.Mesh(new THREE.PlaneGeometry(G.s, G.s * 0.5), mats[G.k]); m.position.set(G.x, G.y, G.z); m.rotation.y = G.ry; g.add(m); }
  }
  const charcos = [];
  for (let k = 0; k < 260; k++) {
    const i = r() * (BLOQUES + 1) | 0, b = r() * BLOQUES | 0, u = linea(b) + 10 + r() * 60, eje = r() < 0.5;
    const off = (r() - 0.5) * (CALLE - 2);
    const x = eje ? u : linea(i) + off, z = eje ? linea(i) + off : u, s = 1.2 + r() * 3.2;
    if (Math.abs(x) > LIMITE - 2 || Math.abs(z) > LIMITE - 2) continue;
    charcos.push({ x, y: 0.02, z, rx: -Math.PI / 2, rz: r() * 6, sx: s, sy: s * (0.45 + r() * 0.5) });
  }
  const tCharco = lienzo(256, 256, (c) => { const img = c.createImageData(256, 256); for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const dx = (x - 128) / 128, dy = (y - 128) / 128, d = Math.hypot(dx, dy) + Math.sin(x * 0.08) * 0.08 + Math.cos(y * 0.11 + x * 0.03) * 0.08; const a = Math.max(0, Math.min(1, (0.85 - d) * 5)); const q = (y * 256 + x) * 4; img.data[q] = img.data[q + 1] = img.data[q + 2] = a * 255; img.data[q + 3] = 255; } c.putImageData(img, 0, 0); });
  tCharco.colorSpace = THREE.NoColorSpace;
  const matCharco = new THREE.MeshStandardMaterial({ color: '#3a3c40', roughness: 0.04, metalness: 0.0, alphaMap: tCharco, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, envMapIntensity: 1.6 });
  const imCharcos = instancias(new THREE.PlaneGeometry(1, 1), matCharco, charcos, false); imCharcos.visible = false; g.add(imCharcos);
  juego.charcos = { mat: matCharco, malla: imCharcos };
  escena.add(g);
  return { grupo: g, hidrantesLista: hidrantes, mallaHidrantes: imHidrantes, postes: postes.length, cables: cables.length, hidrantes: hidrantes.length, registros: registros.length, altos: altos.length, jardineras: jardineras.length, aires: aires.length, grafitis: grafitis.length, manchas: manchas.length };
}
