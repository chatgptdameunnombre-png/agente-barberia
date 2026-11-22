import * as THREE from 'three';

function pintarAtlas() {
  const N = 1024, M = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  const celda = (i, fn) => { const x0 = (i % 2) * M, y0 = (i >> 1) * M; g.save(); g.beginPath(); g.rect(x0, y0, M, M); g.clip(); g.translate(x0, y0); fn(); g.restore(); };
  celda(0, () => {
    const gr = g.createLinearGradient(0, 0, 0, M); gr.addColorStop(0, '#2a6ad8'); gr.addColorStop(1, '#8ac8f2'); g.fillStyle = gr; g.fillRect(0, 0, M, M);
    g.fillStyle = '#5a3a22'; g.beginPath(); g.moveTo(240, M); g.lineTo(256, 300); g.lineTo(272, M); g.fill();
    for (const [a, l] of [[-0.9, 120], [-0.4, 150], [0.3, 140], [0.8, 120]]) { g.strokeStyle = '#5a3a22'; g.lineWidth = 14; g.beginPath(); g.moveTo(256, 330); g.lineTo(256 + Math.sin(a) * l, 330 - Math.cos(a) * l); g.stroke(); }
    for (let k = 0; k < 260; k++) { const a = Math.random() * 6.28, r = Math.random() * 170; g.fillStyle = ['#7a3ab0', '#9a5ad0', '#b47ae8', '#6a2a9a'][k % 4]; g.beginPath(); g.arc(256 + Math.cos(a) * r * 1.3, 200 + Math.sin(a) * r * 0.75, 10 + Math.random() * 16, 0, 7); g.fill(); }
    for (let k = 0; k < 60; k++) { g.fillStyle = '#b47ae8'; g.beginPath(); g.ellipse(Math.random() * M, 380 + Math.random() * 130, 6, 3, Math.random() * 3, 0, 7); g.fill(); }
  });
  celda(1, () => {
    g.fillStyle = '#c8202e'; g.fillRect(0, 0, M, M);
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; g.fillStyle = k % 2 ? '#ffb020' : '#ffd23a'; g.beginPath(); g.moveTo(256, 256); g.lineTo(256 + Math.cos(a) * 360, 256 + Math.sin(a) * 360); g.lineTo(256 + Math.cos(a + 0.13) * 360, 256 + Math.sin(a + 0.13) * 360); g.fill(); }
    g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(256, 256, 130, 0, 7); g.fill();
    g.fillStyle = '#c8202e'; for (const x of [210, 302]) { g.beginPath(); g.ellipse(x, 235, 22, 12, 0, 0, 7); g.fill(); }
    g.strokeStyle = '#c8202e'; g.lineWidth = 10; g.beginPath(); g.arc(256, 280, 50, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = '#2a7de0'; for (const x of [196, 316]) { g.beginPath(); g.arc(x, 290, 14, 0, 7); g.fill(); }
  });
  celda(2, () => {
    g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, M, M);
    g.fillStyle = '#e8317a'; g.beginPath(); g.ellipse(256, 270, 150, 190, 0, 0, 7); g.fill();
    g.fillStyle = '#ffd23a'; g.beginPath(); g.moveTo(256, 80); g.lineTo(226, 270); g.lineTo(256, 250); g.lineTo(286, 270); g.fill();
    for (const s of [-1, 1]) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(256 + s * 62, 240, 46, 26, s * 0.3, 0, 7); g.fill(); g.fillStyle = '#2a7de0'; g.beginPath(); g.ellipse(256 + s * 62, 240, 34, 18, s * 0.3, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(256 + s * 58, 240, 14, 10, 0, 0, 7); g.fill(); }
    g.fillStyle = '#ffd23a'; g.beginPath(); g.ellipse(256, 360, 46, 22, 0, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.font = '900 54px Impact, Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText('¡LUCHA!', 256, 490);
  });
  celda(3, () => {
    g.fillStyle = '#f4efe2'; g.fillRect(0, 0, M, M);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const cx = 64 + x * 128, cy = 64 + y * 128;
      g.fillStyle = '#1d4f9c'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, r = k % 2 ? 26 : 54; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.fill();
      g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill();
      g.strokeStyle = '#1d4f9c'; g.lineWidth = 4; g.strokeRect(cx - 64, cy - 64, 128, 128);
      g.fillStyle = '#3a8f5c'; for (const [dx, dy] of [[-64, -64], [64, -64], [-64, 64], [64, 64]]) { g.beginPath(); g.arc(cx + dx, cy + dy, 14, 0, 7); g.fill(); }
    }
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function muralesTren(juego) {
  const T = juego.tren; if (!T) return null;
  const piers = [];
  for (let j = -1; j <= 8; j++) for (const d of [22, 40, 58]) {
    const z = (j - 4) * 80 + d; if (z < T.Z0 + 8 || z > T.Z1 - 8) continue;
    if (Math.abs(z) > 330) continue;
    piers.push(z);
  }
  const geo = new THREE.CylinderGeometry(0.763, 0.862, 4.6, 24, 1, true).translate(0, 2.45, 0);
  const n = piers.length, im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: pintarAtlas(), roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1 }), n);
  const cel = new Float32Array(n);
  const M = new THREE.Matrix4();
  piers.forEach((z, i) => { M.makeRotationY((i * 1.7) % 6.28).setPosition(T.X, 0, z); im.setMatrixAt(i, M); cel[i] = (i * 3 + 1) % 4; });
  im.geometry = geo.clone(); im.geometry.setAttribute('celda', new THREE.InstancedBufferAttribute(cel, 1));
  im.material.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute float celda;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vMapUv = vec2(fract(vMapUv.x * 2.0) * 0.5 + mod(celda, 2.0) * 0.5, vMapUv.y * 0.5 + (1.0 - floor(celda / 2.0)) * 0.5);');
  };
  im.receiveShadow = true; juego.escena.add(im);
  return { murales: n };
}
