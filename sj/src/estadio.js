import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function lienzo(w, h, pintar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function pintarFachada(g, w, h) {
  g.fillStyle = '#d6d2c9'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,36,30' : '255,255,255'},${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2); }
  const n = 24, s = w / n;
  for (let k = 0; k < n; k++) {
    const x = k * s;
    for (const [y0, y1] of [[0.29, 0.4], [0.5, 0.6]]) {
      g.fillStyle = '#25272d'; g.fillRect(x + s * 0.24, h * y0, s * 0.66, h * (y1 - y0));
      g.fillStyle = 'rgba(255,255,255,0.16)';
      for (let q = 1; q < 7; q++) g.fillRect(x + s * 0.24 + q * s * 0.66 / 7, h * y0, 3, h * (y1 - y0));
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + s * 0.22, h * y1, s * 0.7, 4);
    }
    if (k % 2 === 0) {
      g.fillStyle = '#1b1d22'; g.beginPath(); g.moveTo(x + s * 0.3, h); g.lineTo(x + s * 0.3, h * 0.8); g.arc(x + s * 0.58, h * 0.8, s * 0.28, Math.PI, 0); g.lineTo(x + s * 0.86, h); g.fill();
      g.strokeStyle = '#7a7d86'; g.lineWidth = 3;
      for (let q = 0; q < 9; q++) { const xx = x + s * 0.32 + q * s * 0.52 / 8; g.beginPath(); g.moveTo(xx, h); g.lineTo(xx, h * 0.76); g.stroke(); }
      g.fillStyle = '#b30f2a'; g.fillRect(x + s * 0.4, h * 0.7, s * 0.36, h * 0.035);
      g.fillStyle = '#ffffff'; g.font = `bold ${Math.round(h * 0.028)}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.fillText('PUERTA ' + (k / 2 + 1), x + s * 0.58, h * 0.728);
    } else {
      g.fillStyle = '#3a3d45'; g.fillRect(x + s * 0.4, h * 0.82, s * 0.36, h * 0.13);
      g.fillStyle = 'rgba(255,255,255,0.12)'; for (let q = 0; q < 5; q++) g.fillRect(x + s * 0.4, h * (0.84 + q * 0.022), s * 0.36, 2);
    }
    const gr = g.createLinearGradient(x - s * 0.08, 0, x + s * 0.1, 0);
    gr.addColorStop(0, '#9d998f'); gr.addColorStop(0.45, '#f1eee7'); gr.addColorStop(1, '#a29e95');
    g.fillStyle = gr; g.fillRect(x - s * 0.08, h * 0.2, s * 0.18, h * 0.8);
  }
  g.fillStyle = '#ebe8e1'; g.fillRect(0, 0, w, h * 0.05);
  g.fillStyle = '#b30f2a'; g.fillRect(0, h * 0.05, w, h * 0.12);
  g.fillStyle = '#5b2a86'; g.fillRect(0, h * 0.17, w, h * 0.03);
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = `900 ${Math.round(h * 0.075)}px Inter, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 0; k < 4; k++) g.fillText('ESTADIO JACARANDA', (k + 0.5) * w / 4, h * 0.112);
  const gb = g.createLinearGradient(0, h * 0.82, 0, h);
  gb.addColorStop(0, 'rgba(70,58,44,0)'); gb.addColorStop(1, 'rgba(70,58,44,0.42)');
  g.fillStyle = gb; g.fillRect(0, h * 0.82, w, h * 0.18);
}

function pintarGradas(tipos) {
  const FILA = 16, H = tipos.length * FILA;
  return lienzo(2048, H, (g, w) => {
    const sectores = 32, sw = w / sectores;
    const colorSector = k => (k % 8 === 3 || k % 8 === 4) ? '#e9e5dc' : (k % 8 === 0 ? '#5b2a86' : '#b5122e');
    const ropa = ['#1d3f8a', '#f2f2f2', '#b5122e', '#2b2b2b', '#e2b64a', '#3f8f5a', '#7a2a8a', '#f07b2a'];
    const piel = ['#c58c62', '#a8714c', '#e0b08a', '#8a5a3c'];
    tipos.forEach((t, j) => {
      const y = H - (j + 1) * FILA;
      if (t === 'muro') { g.fillStyle = '#9c988f'; g.fillRect(0, y, w, FILA); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, y + FILA - 2, w, 2); return; }
      if (t === 'contra') {
        for (let k = 0; k < sectores; k++) {
          const x = k * sw; g.fillStyle = colorSector(k); g.fillRect(x, y, sw, FILA);
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + FILA - 4, sw, 4);
          g.fillStyle = 'rgba(0,0,0,0.25)'; for (let q = 0; q < sw; q += 6) g.fillRect(x + q, y, 1, FILA);
          g.fillStyle = '#8a867e'; g.fillRect(x, y, 8, FILA);
          for (let q = 10; q < sw - 4; q += 6) if (Math.random() < 0.38) {
            g.fillStyle = ropa[(Math.random() * ropa.length) | 0]; g.fillRect(x + q, y + 6, 5, FILA - 6);
            g.fillStyle = piel[(Math.random() * piel.length) | 0]; g.fillRect(x + q + 1, y + 1, 3, 5);
          }
        }
        return;
      }
      if (t === 'pasillo') { g.fillStyle = '#8f8c86'; g.fillRect(0, y, w, FILA); return; }
      for (let k = 0; k < sectores; k++) {
        const x = k * sw;
        g.fillStyle = colorSector(k); g.fillRect(x, y, sw, FILA);
        g.fillStyle = 'rgba(0,0,0,0.22)'; for (let q = 0; q < sw; q += 6) g.fillRect(x + q, y + 3, 1, FILA - 5);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y + 2, sw, 2);
        g.fillStyle = '#9a968e'; g.fillRect(x, y, 8, FILA);
        for (let q = 10; q < sw - 4; q += 6) if (Math.random() < 0.34) {
          g.fillStyle = ropa[(Math.random() * ropa.length) | 0]; g.fillRect(x + q, y + 5, 5, FILA - 7);
          g.fillStyle = piel[(Math.random() * piel.length) | 0]; g.fillRect(x + q + 1, y + 1, 3, 4);
        }
      }
    });
  });
}

function pintarCancha(g, w, h) {
  for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? '#3d8a3a' : '#469a42'; g.fillRect(k * w / 14, 0, w / 14 + 1, h); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '20,60,20' : '120,180,90'},${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 5;
  const m = 26, W = w - m * 2, Hh = h - m * 2;
  g.strokeRect(m, m, W, Hh);
  g.beginPath(); g.moveTo(w / 2, m); g.lineTo(w / 2, h - m); g.stroke();
  g.beginPath(); g.arc(w / 2, h / 2, Hh * 0.14, 0, 7); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, 5, 0, 7); g.fill();
  for (const s of [0, 1]) {
    const x0 = s ? w - m : m, d = s ? -1 : 1, aw = W * 0.16, ah = Hh * 0.6, cw = W * 0.055, ch = Hh * 0.28;
    g.strokeRect(s ? x0 - aw : x0, h / 2 - ah / 2, aw, ah);
    g.strokeRect(s ? x0 - cw : x0, h / 2 - ch / 2, cw, ch);
    g.beginPath(); g.arc(x0 + d * W * 0.11, h / 2, 5, 0, 7); g.fill();
    g.beginPath(); g.arc(x0 + d * W * 0.11, h / 2, Hh * 0.14, s ? Math.PI - 0.93 : -0.93, s ? Math.PI + 0.93 : 0.93); g.stroke();
  }
}

function pintarMarcador(g, w, h) {
  g.fillStyle = '#07090d'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#121620'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#b5122e'; g.fillRect(16, 16, w * 0.38, 60); g.fillStyle = '#3a3f4c'; g.fillRect(w - 16 - w * 0.38, 16, w * 0.38, 60);
  g.fillStyle = '#fff'; g.font = '900 40px Inter, Arial, sans-serif';
  g.fillText('JACARANDA', 16 + w * 0.19, 48); g.fillText('VISITA', w - 16 - w * 0.19, 48);
  g.fillStyle = '#ffd34a'; g.font = '900 130px Inter, Arial, sans-serif';
  g.fillText('2', w * 0.3, h * 0.62); g.fillText('1', w * 0.7, h * 0.62);
  g.fillStyle = '#e8e8e8'; g.font = '700 56px Inter, Arial, sans-serif'; g.fillText("78'", w / 2, h * 0.62);
  g.fillStyle = '#8fd3ff'; g.font = '600 26px Inter, Arial, sans-serif'; g.fillText('LIGA DE SANTA JACARANDA · JORNADA 14', w / 2, h - 26);
}

function pintarLamparas(g, w, h) {
  g.fillStyle = '#1a1c20'; g.fillRect(0, 0, w, h);
  const cols = 8, filas = 4, cw = w / cols, ch = h / filas;
  for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) {
    const x = i * cw + cw / 2, y = j * ch + ch / 2, r = Math.min(cw, ch) * 0.38;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#fff4d6'); gr.addColorStop(1, '#4a4a4a');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
}

export function construirEstadio(escena, mundo, cx, cz, viento) {
  const grupo = new THREE.Group(); grupo.position.set(cx, 0, cz); escena.add(grupo);
  const RI = 27.2, RE = 29, H = 18, R0 = 18.6;
  const sombra = m => { m.castShadow = true; m.receiveShadow = true; grupo.add(m); return m; };

  const texF = lienzo(2048, 512, pintarFachada); texF.wrapS = THREE.RepeatWrapping; texF.repeat.x = 2;
  sombra(new THREE.Mesh(new THREE.CylinderGeometry(RE - 0.5, RE, H, 120, 1, true), new THREE.MeshStandardMaterial({ map: texF, roughness: 0.86, metalness: 0.02 }))).position.y = H / 2 + 0.1;

  const pts = [], tipos = [];
  const sub = (r, y, t) => { pts.push(new THREE.Vector2(r, y)); if (t) tipos.push(t); };
  let r = R0, y = 0.35; sub(r, y); y = 1.5; sub(r, y, 'muro');
  for (let k = 0; k < 11; k++) { r += 0.4; sub(r, y, 'grada'); y += 0.6; sub(r, y, 'contra'); }
  r += 1.3; sub(r, y, 'pasillo'); y += 1.3; sub(r, y, 'muro');
  for (let k = 0; k < 9; k++) { r += 0.36; sub(r, y, 'grada'); y += 0.78; sub(r, y, 'contra'); }
  sub(RI, y, 'pasillo'); sub(RI, H + 0.1, 'muro'); sub(RE - 0.5, H + 0.1, 'muro');
  const lathe = new THREE.LatheGeometry(pts, 120);
  const matGradas = new THREE.MeshStandardMaterial({ map: pintarGradas(tipos), roughness: 0.9, flatShading: true, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0 });
  matGradas.emissiveMap = matGradas.map;
  sombra(new THREE.Mesh(lathe, matGradas));

  const texC = lienzo(1024, 660, pintarCancha);
  const matCancha = new THREE.MeshStandardMaterial({ map: texC, roughness: 0.95, emissive: '#ffffff', emissiveMap: texC, emissiveIntensity: 0 });
  const cancha = new THREE.Mesh(new THREE.PlaneGeometry(31, 20).rotateX(-Math.PI / 2), matCancha);
  cancha.position.y = 0.42; cancha.receiveShadow = true; grupo.add(cancha);
  const pista = new THREE.Mesh(new THREE.CircleGeometry(R0 + 0.05, 96).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2f6e32', roughness: 1 }));
  pista.position.y = 0.38; pista.receiveShadow = true; grupo.add(pista);

  const blanco = [];
  for (const s of [-1, 1]) {
    const x = s * 15.2;
    for (const z of [-1.85, 1.85]) blanco.push(new THREE.CylinderGeometry(0.06, 0.06, 1.25, 6).translate(x, 1.05, z));
    blanco.push(new THREE.CylinderGeometry(0.06, 0.06, 3.7, 6).rotateX(Math.PI / 2).translate(x, 1.66, 0));
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.25, 3.7), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }));
    red.position.set(x + s * 0.45, 1.05, 0); grupo.add(red);
  }
  for (const [x, z] of [[-15.5, -10], [15.5, -10], [-15.5, 10], [15.5, 10]]) blanco.push(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 5).translate(x, 1, z));
  grupo.add(new THREE.Mesh(mergeGeometries(blanco), new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.4 })));

  const acero = [], cables = [];
  const matTecho = new THREE.MeshStandardMaterial({ color: '#e4e7ec', roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide });
  for (const centro of [0, Math.PI]) {
    const t0 = centro - 1.05, tl = 2.1;
    const techo = new THREE.Mesh(new THREE.RingGeometry(21.2, RE + 0.6, 64, 1, t0, tl).rotateX(-Math.PI / 2), matTecho);
    techo.position.y = H + 1.4; sombra(techo);
    for (let k = 0; k <= 8; k++) {
      const a = t0 + tl * k / 8, ca = Math.cos(a), sa = -Math.sin(a);
      acero.push(new THREE.BoxGeometry(RE + 0.6 - 21.2, 0.35, 0.25).rotateY(-Math.atan2(sa, ca)).translate(ca * (RE + 21.8) / 2, H + 1.62, sa * (RE + 21.8) / 2));
      acero.push(new THREE.CylinderGeometry(0.22, 0.32, 8, 8).translate(ca * (RE + 0.3), H + 4, sa * (RE + 0.3)));
      const p0 = new THREE.Vector3(ca * (RE + 0.3), H + 7.8, sa * (RE + 0.3)), p1 = new THREE.Vector3(ca * 21.6, H + 1.6, sa * 21.6);
      const largo = p0.distanceTo(p1), cab = new THREE.CylinderGeometry(0.04, 0.04, largo, 4);
      cab.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()));
      cables.push(cab.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2));
    }
  }
  const matAcero = new THREE.MeshStandardMaterial({ color: '#cfd4da', roughness: 0.35, metalness: 0.7 });
  sombra(new THREE.Mesh(mergeGeometries(acero), matAcero));
  grupo.add(new THREE.Mesh(mergeGeometries(cables), new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: 0.5, metalness: 0.6 })));

  const texL = lienzo(256, 128, pintarLamparas);
  const matLamp = new THREE.MeshStandardMaterial({ color: '#2a2c30', emissive: '#fff6dc', emissiveMap: texL, emissiveIntensity: 0.15, roughness: 0.5 });
  const torres = [];
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), R = RE + 1.8;
    torres.push(new THREE.CylinderGeometry(0.28, 0.55, 33, 8).translate(ca * R, 16.5, sa * R));
    torres.push(new THREE.BoxGeometry(0.3, 0.3, 4.6).rotateY(-a).translate(ca * R, 31.2, sa * R));
    const cabeza = new THREE.Mesh(new THREE.BoxGeometry(5, 2.8, 0.45), [matAcero, matAcero, matAcero, matAcero, matLamp, matAcero]);
    cabeza.position.set(ca * (R - 0.4), 33.2, sa * (R - 0.4));
    cabeza.rotation.set(0, Math.atan2(-ca, -sa), 0); cabeza.rotateX(0.5);
    grupo.add(cabeza);
    mundo.agregar(cx + ca * R - 0.6, cz + sa * R - 0.6, cx + ca * R + 0.6, cz + sa * R + 0.6, 33);
  }
  sombra(new THREE.Mesh(mergeGeometries(torres), matAcero));

  const texM = lienzo(1024, 400, pintarMarcador);
  const marcador = new THREE.Group();
  marcador.add(new THREE.Mesh(new THREE.BoxGeometry(13, 5.2, 0.8), new THREE.MeshStandardMaterial({ color: '#1c1e24', roughness: 0.6, metalness: 0.3 })));
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 4.6), new THREE.MeshBasicMaterial({ map: texM, toneMapped: false }));
  pantalla.position.z = 0.41; marcador.add(pantalla);
  for (const x of [-4.5, 4.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 0.5), matAcero); p.position.set(x, -4.6, -0.2); marcador.add(p); }
  marcador.position.set(0, H + 4.4, -(RI - 1.2)); grupo.add(marcador);

  const banderas = [], olas = [];
  const COLS = ['#b5122e', '#f2f0ea', '#5b2a86'];
  for (let k = 0; k < 20; k++) {
    const a = k / 20 * Math.PI * 2 + 0.08, ca = Math.cos(a), sa = Math.sin(a), R = RE - 0.2;
    if (Math.abs(Math.cos(a)) > 0.5) continue;
    const asta = new THREE.CylinderGeometry(0.05, 0.06, 4.2, 5).translate(ca * R, H + 2.2, sa * R);
    const tela = new THREE.PlaneGeometry(1.8, 1.1, 8, 1).translate(0.9, 0, 0).rotateY(-a + Math.PI / 2).translate(ca * R, H + 3.6, sa * R);
    const c = new THREE.Color(COLS[k % 3]);
    for (const geo of [asta, tela]) {
      const n = geo.attributes.position.count, col = new Float32Array(n * 3), ola = new Float32Array(n);
      for (let i = 0; i < n; i++) { const cc = geo === asta ? new THREE.Color('#c9ced4') : c; col.set([cc.r, cc.g, cc.b], i * 3); ola[i] = geo === asta ? 0 : geo.attributes.uv.getX(i); }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('ola', new THREE.BufferAttribute(ola, 1));
      banderas.push(geo);
    }
  }
  const matBand = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  matBand.onBeforeCompile = sh => {
    sh.uniforms.tiempo = viento;
    sh.vertexShader = 'uniform float tiempo;\nattribute float ola;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normal * sin(ola * 7.0 - tiempo * 8.0 + position.x * 0.3 + position.z * 0.2) * 0.22 * ola;');
  };
  grupo.add(new THREE.Mesh(mergeGeometries(banderas), matBand));

  const taq = [];
  const matTaq = new THREE.MeshStandardMaterial({ color: '#e9e5dc', roughness: 0.8 });
  const matTecho2 = new THREE.MeshStandardMaterial({ color: '#b30f2a', roughness: 0.6 });
  for (const sx of [-9, 9]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 2.2), matTaq); b.position.set(sx, 1.45, RE + 3.6); sombra(b);
    const t = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 2.8), matTecho2); t.position.set(sx, 2.9, RE + 3.6); sombra(t);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1), new THREE.MeshStandardMaterial({ color: '#2a3440', roughness: 0.15, metalness: 0.6 })); v.position.set(sx, 1.8, RE + 4.71); grupo.add(v);
    mundo.agregar(cx + sx - 1.6, cz + RE + 2.5, cx + sx + 1.6, cz + RE + 4.7, 3);
  }
  for (let k = -5; k <= 5; k++) taq.push(new THREE.CylinderGeometry(0.09, 0.09, 1, 6).translate(k * 1.2, 0.65, RE + 1.6));
  taq.push(new THREE.BoxGeometry(13.2, 0.06, 0.06).translate(0, 1.12, RE + 1.6));
  grupo.add(new THREE.Mesh(mergeGeometries(taq), matAcero));

  const R = RE + 0.1;
  for (let z = -R; z < R; z += 4) {
    const zm = z <= 0 && z + 4 >= 0 ? 0 : Math.min(Math.abs(z), Math.abs(z + 4));
    const hw = Math.sqrt(Math.max(0, R * R - zm * zm));
    mundo.agregar(cx - hw, cz + z, cx + hw, cz + z + 4, H);
  }

  return {
    grupo,
    actualizar(noche) {
      matLamp.emissiveIntensity = 0.15 + noche * 3.2;
      matCancha.emissiveIntensity = noche * 0.42;
      matGradas.emissiveIntensity = noche * 0.14;
    }
  };
}
