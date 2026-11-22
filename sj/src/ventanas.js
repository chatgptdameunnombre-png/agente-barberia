import * as THREE from 'three';

function texVentana() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  const arco = (m) => { g.beginPath(); g.moveTo(m, 256 - m); g.lineTo(m, 64); g.arc(64, 64, 64 - m, Math.PI, 0); g.lineTo(128 - m, 256 - m); g.closePath(); };
  g.clearRect(0, 0, 128, 256);
  g.fillStyle = '#f3eee4'; arco(0); g.fill();
  const gr = g.createLinearGradient(0, 0, 128, 256); gr.addColorStop(0, '#5f7f9c'); gr.addColorStop(0.45, '#263544'); gr.addColorStop(1, '#3c4f60');
  g.fillStyle = gr; arco(12); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(24, 230); g.lineTo(24, 90); g.lineTo(54, 60); g.lineTo(54, 230); g.fill();
  g.fillStyle = 'rgba(240,230,210,0.5)'; g.fillRect(14, 120, 100, 110);
  g.fillStyle = '#e9e3d6'; g.fillRect(61, 20, 6, 226); g.fillRect(12, 118, 104, 6); g.fillRect(12, 176, 104, 5);
  g.fillStyle = '#d9d2c2'; g.fillRect(0, 238, 128, 18);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 252, 128, 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function ventanasLisas(juego) {
  const lista = juego.ciudad.lisosGrandes || [];
  const pos = [];
  for (const b of lista) {
    const bajo = b.h < 10;
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const largo = nx ? b.d : b.w, cols = Math.max(1, Math.floor((largo - 2.2) / 3.4));
      const fx = b.x + nx * (b.w / 2 + 0.03), fz = b.z + nz * (b.d / 2 + 0.03);
      for (let y = b.y0 + 2.1 + (bajo ? 3.6 : 0); y + 1.25 < b.y0 + b.h - 0.6; y += 3.6) {
        for (let k = 0; k < cols; k++) {
          const u = (k - (cols - 1) / 2) * (largo - 2.2) / cols;
          pos.push([fx + (nz ? u : 0), y, fz + (nx ? u : 0), Math.atan2(nx, nz)]);
        }
      }
    }
  }
  if (!pos.length) return null;
  const mat = new THREE.MeshStandardMaterial({ map: texVentana(), transparent: false, alphaTest: 0.5, roughness: 0.35, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -2 });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.35, 2.5), mat, pos.length);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0);
  pos.forEach(([x, y, z, r], i) => { V.set(x, y, z); Q.setFromAxisAngle(Y, r); M.compose(V, Q, S); im.setMatrixAt(i, M); });
  im.receiveShadow = true;
  juego.escena.add(im);
  return im;
}
