import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _c = new THREE.Color();
function teñir(geo, hex) { _c.set(hex); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([_c.r, _c.g, _c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
const caja = (w, h, d, x, y, z, col) => teñir(new THREE.BoxGeometry(w, h, d).translate(x, y, z), col);
const cil = (r, h, x, y, z, col, seg = 12) => teñir(new THREE.CylinderGeometry(r, r, h, seg).translate(x, y, z), col);
function lienzo(w, h, pintar) { const c = document.createElement('canvas'); c.width = w; c.height = h; pintar(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

const ROJO = '#c8202e', MORADO = '#5b2a86', AMARILLO = '#ffb020';

function pintarFranja(g, w, h) {
  g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, w, h);
  g.fillStyle = ROJO; g.fillRect(0, h * 0.62, w, h * 0.38);
  g.fillStyle = MORADO; g.fillRect(0, h * 0.56, w, h * 0.06);
  g.fillStyle = MORADO; g.font = `900 ${Math.round(h * 0.42)}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('GASOLINERA JACARANDA', w / 2, h * 0.3);
  g.fillStyle = '#ffffff'; g.font = `800 ${Math.round(h * 0.24)}px Inter, Arial, sans-serif`; g.fillText('SERVICIO 24 HORAS', w / 2, h * 0.81);
}

function pintarTotem(g, w, h) {
  g.fillStyle = '#16181d'; g.fillRect(0, 0, w, h);
  g.fillStyle = ROJO; g.fillRect(0, 0, w, h * 0.28);
  g.fillStyle = '#ffffff'; g.font = `900 ${Math.round(w * 0.2)}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('JACARANDA', w / 2, h * 0.11); g.font = `700 ${Math.round(w * 0.1)}px Inter, Arial, sans-serif`; g.fillText('COMBUSTIBLES', w / 2, h * 0.21);
  [['REGULAR', '23.89', '#3bd16f'], ['PREMIUM', '25.79', '#ff4a5a'], ['DIÉSEL', '25.39', '#e8e8e8']].forEach(([n, p, col], i) => {
    const y = h * (0.37 + i * 0.21);
    g.fillStyle = col; g.fillRect(w * 0.06, y - h * 0.07, w * 0.05, h * 0.14);
    g.fillStyle = '#ffffff'; g.font = `800 ${Math.round(w * 0.085)}px Inter, Arial, sans-serif`; g.textAlign = 'left'; g.fillText(n, w * 0.15, y);
    g.fillStyle = '#ffcf3a'; g.font = `700 ${Math.round(w * 0.16)}px 'Courier New', monospace`; g.textAlign = 'right'; g.fillText(p, w * 0.95, y + 2);
  });
}

function pintarTienda(g, w, h) {
  g.fillStyle = '#20262e'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(1, '#e8dcc0'); g.fillStyle = gr; g.fillRect(0, h * 0.08, w, h * 0.84);
  const colores = ['#c8202e', '#2a6ec8', '#f2c14e', '#3a8f5c', '#e07ab0', '#f08a3c', '#7a3ab0', '#ffffff'];
  for (let k = 0; k < 4; k++) {
    const x0 = 20 + k * (w - 40) / 4;
    for (let r = 0; r < 4; r++) {
      const y = h * (0.28 + r * 0.16);
      g.fillStyle = '#9aa0a8'; g.fillRect(x0, y + 22, (w - 40) / 4 - 30, 4);
      for (let q = 0; q < 12; q++) { g.fillStyle = colores[(q * 3 + r + k) % colores.length]; g.fillRect(x0 + q * 14, y + 22 - 14 - (q % 3) * 3, 11, 14 + (q % 3) * 3); }
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 6; k++) g.fillRect(k * w / 6 - 2, 0, 5, h);
  g.fillStyle = '#20262e'; g.fillRect(w * 0.42, h * 0.08, w * 0.16, h * 0.92);
  g.fillStyle = 'rgba(200,230,255,0.25)'; g.fillRect(w * 0.43, h * 0.1, w * 0.14, h * 0.88);
  g.fillStyle = ROJO; g.font = '800 30px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('ABIERTO', w * 0.5, h * 0.2);
}

function pintarLetrero(texto, fondo, color) {
  return lienzo(512, 96, (g, w, h) => { g.fillStyle = fondo; g.fillRect(0, 0, w, h); g.fillStyle = color; g.font = `900 ${Math.round(h * 0.6)}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, w / 2, h * 0.54); });
}

function pintarBomba(g, w, h) {
  g.fillStyle = '#f2f2f0'; g.fillRect(0, 0, w, h);
  g.fillStyle = ROJO; g.fillRect(0, 0, w, h * 0.16); g.fillRect(0, h * 0.86, w, h * 0.14);
  g.fillStyle = '#0d1118'; g.fillRect(w * 0.15, h * 0.24, w * 0.7, h * 0.2);
  g.fillStyle = '#7fe08a'; g.font = `700 ${Math.round(h * 0.07)}px 'Courier New', monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('$ 0000.00', w / 2, h * 0.3); g.fillText('L 000.000', w / 2, h * 0.39);
  [['#3bd16f', 0.25], ['#ff4a5a', 0.5], ['#d0d0d0', 0.75]].forEach(([c, x]) => { g.fillStyle = c; g.fillRect(w * x - 14, h * 0.55, 28, h * 0.1); });
  g.fillStyle = '#ffffff'; g.font = `900 ${Math.round(h * 0.07)}px Inter, Arial, sans-serif`; g.fillText('JACARANDA', w / 2, h * 0.08);
}

export class Gasolinera {
  constructor(juego) {
    this.j = juego;
    const G = juego.ciudad.gasolinera; if (!G) { this.bombas = []; return; }
    const { ix0, iz0, ix1, iz1, cx } = G, Y = 0.15, escena = juego.escena, mundo = juego.mundo;
    const geos = [];
    const pz = iz1 - 20;
    this.centro = new THREE.Vector3(cx, 0, pz);

    const piso = new THREE.Mesh(new THREE.PlaneGeometry(ix1 - ix0 - 0.4, iz1 - iz0 - 0.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({
      map: lienzo(1024, 1024, (g, w, h) => {
        g.fillStyle = '#b2aea6'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 24000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '80,76,70' : '230,226,218'},${Math.random() * 0.1})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2); }
        g.strokeStyle = 'rgba(70,66,60,0.3)'; g.lineWidth = 2; for (let k = 1; k < 12; k++) { g.beginPath(); g.moveTo(k * w / 12, 0); g.lineTo(k * w / 12, h); g.stroke(); g.beginPath(); g.moveTo(0, k * h / 12); g.lineTo(w, k * h / 12); g.stroke(); }
        for (let k = 0; k < 26; k++) { const x = w * (0.2 + Math.random() * 0.6), y = h * (0.5 + Math.random() * 0.3), r = 10 + Math.random() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(30,26,22,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
        g.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 6; k++) g.fillRect(w * (0.62 + k * 0.05), h * 0.08, 5, h * 0.14);
        g.fillStyle = 'rgba(255,200,40,0.85)'; g.fillRect(w * 0.05, h * 0.94, w * 0.9, 6);
      }), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2
    }));
    piso.position.set((ix0 + ix1) / 2, Y + 0.012, (iz0 + iz1) / 2); piso.receiveShadow = true; escena.add(piso);

    const TW = 27, TD = 14, TH = 5.8;
    const techo = new THREE.Mesh(new THREE.BoxGeometry(TW, 0.9, TD), [
      new THREE.MeshStandardMaterial({ map: lienzo(512, 64, pintarFranja), roughness: 0.5 }), new THREE.MeshStandardMaterial({ map: lienzo(512, 64, pintarFranja), roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: '#d8dadd', roughness: 0.7 }), new THREE.MeshStandardMaterial({ color: '#eef0f2', roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ map: lienzo(1024, 64, pintarFranja), roughness: 0.5 }), new THREE.MeshStandardMaterial({ map: lienzo(1024, 64, pintarFranja), roughness: 0.5 })
    ]);
    techo.position.set(cx, Y + TH, pz); techo.castShadow = true; techo.receiveShadow = true; escena.add(techo);
    const focos = [];
    for (let x = -1.5; x <= 1.5; x++) for (const z of [-4, 0, 4]) focos.push(new THREE.PlaneGeometry(2.2, 0.8).rotateX(Math.PI / 2).translate(cx + x * 7.5, Y + TH - 0.46, pz + z));
    this.matFocos = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
    escena.add(new THREE.Mesh(mergeGeometries(focos), this.matFocos));
    for (const x of [-9, 0, 9]) for (const z of [-4.5, 4.5]) { geos.push(caja(0.45, TH - 0.45, 0.45, cx + x, Y + (TH - 0.45) / 2, pz + z, '#e6e8ea')); mundo.agregar(cx + x - 0.3, pz + z - 0.3, cx + x + 0.3, pz + z + 0.3, TH); }

    const texB = lienzo(128, 256, pintarBomba);
    const matB = new THREE.MeshStandardMaterial({ map: texB, roughness: 0.45, metalness: 0.15 });
    this.bombas = [];
    for (const x of [-8, 0, 8]) {
      geos.push(caja(1.5, 0.28, 6, cx + x, Y + 0.14, pz, '#d9d4c8'), caja(1.6, 0.06, 6.1, cx + x, Y + 0.3, pz, '#ffd23a'));
      for (const s of [-1, 1]) for (const b of [-0.62, 0.62]) geos.push(cil(0.08, 0.9, cx + x + b, Y + 0.75, pz + s * 2.85, '#ffd23a', 8));
      mundo.agregar(cx + x - 0.75, pz - 3, cx + x + 0.75, pz + 3, 2.45);
      for (const z of [-1.3, 1.3]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.62), matB.clone());
        m.position.set(cx + x, Y + 0.28 + 1.05, pz + z); m.castShadow = true; escena.add(m);
        const mangueras = new THREE.Mesh(mergeGeometries([cil(0.03, 1.2, -0.52, -0.2, 0, '#1a1a1a', 5), cil(0.03, 1.2, 0.52, -0.2, 0, '#1a1a1a', 5), caja(0.12, 0.3, 0.1, -0.55, 0.45, 0, '#2a2c30'), caja(0.12, 0.3, 0.1, 0.55, 0.45, 0, '#2a2c30')]), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }));
        m.add(mangueras); m.userData.mapa = m.material.map;
        this.bombas.push({ m, x: cx + x, z: pz + z, vida: 45, muerta: false, mecha: 0, repara: 0 });
      }
    }
    for (const x of [-8, 0, 8]) for (const s of [-1, 1]) geos.push(cil(0.25, 0.75, cx + x + 0.5, Y + 0.65, pz + s * 2.2, '#2f6b4f', 10));

    const SX = cx + 7, SZ = iz0 + 6.5, SW = 20, SD = 10, SH = 4.6;
    const matFach = new THREE.MeshStandardMaterial({ color: '#efe9de', roughness: 0.85 });
    this.texTienda = lienzo(1024, 256, pintarTienda);
    this.matVitrina = new THREE.MeshStandardMaterial({ map: this.texTienda, roughness: 0.15, metalness: 0.2, emissive: '#ffffff', emissiveMap: this.texTienda, emissiveIntensity: 0.25 });
    const tienda = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, SD), [matFach, matFach, new THREE.MeshStandardMaterial({ color: '#8c8983', roughness: 0.9 }), matFach, this.matVitrina, matFach]);
    tienda.position.set(SX, Y + SH / 2, SZ); tienda.castShadow = tienda.receiveShadow = true; escena.add(tienda);
    mundo.agregar(SX - SW / 2, SZ - SD / 2, SX + SW / 2, SZ + SD / 2, SH);
    geos.push(caja(SW + 0.6, 1.1, 0.5, SX, Y + SH + 0.2, SZ + SD / 2 + 0.05, ROJO), caja(SW + 0.8, 0.12, 2.2, SX, Y + 3.3, SZ + SD / 2 + 1.1, '#3a3d44'));
    const letT = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.0), new THREE.MeshBasicMaterial({ map: pintarLetrero('SÚPER 24', ROJO, '#ffffff'), toneMapped: false }));
    letT.position.set(SX, Y + SH + 0.2, SZ + SD / 2 + 0.31); escena.add(letT);
    geos.push(caja(1.6, 1.1, 0.8, SX - 8, Y + 0.55, SZ + SD / 2 + 0.6, '#e8f2ff'), caja(1.64, 0.25, 0.84, SX - 8, Y + 1.2, SZ + SD / 2 + 0.6, '#2a6ec8'));
    const hielo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.3), new THREE.MeshBasicMaterial({ map: pintarLetrero('HIELO', '#2a6ec8', '#ffffff') }));
    hielo.position.set(SX - 8, Y + 1.2, SZ + SD / 2 + 1.03); escena.add(hielo);
    for (const dx of [-3, 3]) geos.push(cil(0.28, 0.9, SX + dx, Y + 0.45, SZ + SD / 2 + 0.6, '#3a8f5c', 10));

    const LX = ix0 + 6.5, LZ = iz0 + 15;
    for (const s of [-1, 1]) { geos.push(caja(0.3, 4.2, 11, LX + s * 2.8, Y + 2.1, LZ, '#e6e8ea')); mundo.agregar(LX + s * 2.8 - 0.2, LZ - 5.5, LX + s * 2.8 + 0.2, LZ + 5.5, 4.2); }
    geos.push(caja(6, 0.4, 11.4, LX, Y + 4.4, LZ, '#2a6ec8'));
    const cepillos = [];
    for (const s of [-1, 1]) for (const z of [-2, 2]) cepillos.push(new THREE.CylinderGeometry(0.55, 0.55, 3, 10).translate(LX + s * 1.9, Y + 1.7, LZ + z));
    cepillos.push(new THREE.CylinderGeometry(0.45, 0.45, 4.6, 10).rotateZ(Math.PI / 2).translate(LX, Y + 3.3, LZ));
    this.cepillos = new THREE.Mesh(mergeGeometries(cepillos), new THREE.MeshStandardMaterial({ color: '#3b7be0', roughness: 0.95 }));
    escena.add(this.cepillos);
    const letL = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 0.9), new THREE.MeshBasicMaterial({ map: pintarLetrero('AUTOLAVADO', '#2a6ec8', '#ffffff') }));
    letL.position.set(LX, Y + 3.7, LZ + 5.72); escena.add(letL);

    const TX = ix1 - 3, TZ = iz1 - 3;
    geos.push(caja(0.5, 8, 0.5, TX, Y + 4, TZ, '#3a3d44'));
    mundo.agregar(TX - 0.4, TZ - 0.4, TX + 0.4, TZ + 0.4, 8);
    this.texTotem = lienzo(256, 384, pintarTotem);
    const tot = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.2, 0.4), [new THREE.MeshStandardMaterial({ color: '#16181d' }), new THREE.MeshStandardMaterial({ color: '#16181d' }), new THREE.MeshStandardMaterial({ color: '#16181d' }), new THREE.MeshStandardMaterial({ color: '#16181d' }), new THREE.MeshBasicMaterial({ map: this.texTotem, toneMapped: false }), new THREE.MeshBasicMaterial({ map: this.texTotem, toneMapped: false })]);
    tot.position.set(TX, Y + 8.6, TZ); tot.rotation.y = -Math.PI / 4; tot.castShadow = true; escena.add(tot);

    geos.push(caja(0.5, 1.3, 0.4, cx - 14, Y + 0.65, pz + 4, '#2a6ec8'), caja(0.4, 0.3, 0.42, cx - 14, Y + 1.15, pz + 4, '#ffffff'));
    for (const [x, z] of [[cx - 12, iz1 - 4], [cx + 12, iz1 - 4], [cx - 14, iz0 + 3]]) geos.push(caja(0.4, 0.8, 0.4, x, Y + 0.4, z, '#c8202e'));

    const m = new THREE.Mesh(mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.1 }));
    m.castShadow = m.receiveShadow = true; escena.add(m);
    this.t = 0;
  }

  impacto(p, daño) {
    for (const b of this.bombas) {
      if (b.muerta) continue;
      if (Math.abs(p.x - b.x) < 1.0 && Math.abs(p.z - b.z) < 0.75 && p.y < 2.8) { b.vida -= daño; b.golpeada = 0.15; if (b.vida <= 0) b.mecha = 0.05; return true; }
    }
    return false;
  }

  onda(x, z, radio = 7) {
    for (const b of this.bombas) if (!b.muerta && !b.mecha && Math.hypot(b.x - x, b.z - z) < radio) b.mecha = 0.25 + Math.random() * 0.5;
  }

  actualizar(dt, noche) {
    if (!this.bombas.length) return;
    this.t += dt;
    this.matFocos.color.setScalar(noche > 0.2 ? 1 : 0.72);
    this.matVitrina.emissiveIntensity = 0.25 + noche * 0.8;
    const jp = this.j.jugador.posicion;
    for (const b of this.bombas) {
      if (b.golpeada > 0) { b.golpeada -= dt; b.m.material.emissive?.set(b.golpeada > 0 ? '#ff6020' : '#000000'); b.m.material.emissiveIntensity = b.golpeada > 0 ? 0.6 : 0; }
      if (b.mecha > 0) {
        b.mecha -= dt;
        if (b.mecha <= 0 && !b.muerta) {
          b.muerta = true; b.mecha = 0; b.repara = 150;
          this.j.explosion(b.x, 1.2, b.z, 'jugador');
          b.m.material.color.set('#2a2622'); b.m.material.map = null; b.m.material.needsUpdate = true; b.m.scale.set(1, 0.55, 1); b.m.position.y = 0.15 + 0.6;
          this.onda(b.x, b.z, 9);
          this.j.policia?.subir?.(Math.max(2, this.j.policia.estrellas || 0));
        }
      }
      if (b.muerta) {
        b.repara -= dt;
        if (b.repara <= 0 && Math.hypot(jp.x - b.x, jp.z - b.z) > 90) {
          b.muerta = false; b.vida = 45; b.m.material.color.set('#ffffff'); b.m.material.map = b.m.userData.mapa || null; b.m.material.needsUpdate = true; b.m.scale.set(1, 1, 1); b.m.position.y = 0.15 + 0.28 + 1.05;
        }
      }
    }
  }
}
