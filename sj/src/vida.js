import * as THREE from 'three';

function texHumo() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Vapor {
  constructor(juego) {
    this.j = juego;
    this.fuentes = (juego.ambulantes?.puestos || []).map(q => ({ x: q.x, y: 1.25, z: q.z - 0.85 }));
    this.porFuente = 18;
    const n = Math.max(1, this.fuentes.length * this.porFuente);
    this.pos = new Float32Array(n * 3); this.vida = new Float32Array(n); this.tam = new Float32Array(n);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('tam', new THREE.BufferAttribute(this.tam, 1));
    const mat = new THREE.PointsMaterial({ map: texHumo(), size: 1, transparent: true, depthWrite: false, color: '#f4f1ea', opacity: 0.55 });
    mat.onBeforeCompile = sh => { sh.vertexShader = 'attribute float tam;\n' + sh.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * tam;'); };
    this.pts = new THREE.Points(geo, mat); this.pts.frustumCulled = false; juego.escena.add(this.pts);
    for (let i = 0; i < n; i++) this.vida[i] = Math.random() * 2.4;
  }

  actualizar(dt) {
    if (!this.fuentes.length) return;
    const jp = this.j.jugador.posicion, P = this.pts.geometry.attributes;
    for (let f = 0; f < this.fuentes.length; f++) {
      const F = this.fuentes[f], cerca = Math.abs(F.x - jp.x) < 90 && Math.abs(F.z - jp.z) < 90;
      for (let k = 0; k < this.porFuente; k++) {
        const i = f * this.porFuente + k;
        this.vida[i] += dt;
        if (this.vida[i] > 2.4) { this.vida[i] = 0; this.pos[i * 3] = F.x + (Math.random() - 0.5) * 0.25; this.pos[i * 3 + 1] = F.y; this.pos[i * 3 + 2] = F.z + (Math.random() - 0.5) * 0.25; }
        const t = this.vida[i];
        this.pos[i * 3] += (0.18 + Math.sin(t * 3 + i) * 0.12) * dt; this.pos[i * 3 + 1] += (0.75 - t * 0.12) * dt; this.pos[i * 3 + 2] += Math.cos(t * 2.4 + i) * 0.1 * dt;
        this.tam[i] = cerca ? (0.35 + t * 0.6) * Math.min(1, t * 3) * Math.max(0, 1 - t / 2.4) : 0;
      }
    }
    P.position.needsUpdate = true; P.tam.needsUpdate = true;
  }
}

export class Aves {
  constructor(juego) {
    this.j = juego;
    const ala = new THREE.BufferGeometry();
    ala.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.18, -0.55, 0, -0.1, 0, 0, -0.12, 0, 0, 0.18, 0, 0, -0.12, 0.55, 0, -0.1], 3));
    ala.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color: '#2a2622', side: THREE.DoubleSide });
    this.tiempo = { value: 0 };
    mat.onBeforeCompile = sh => {
      sh.uniforms.tiempo = this.tiempo;
      sh.vertexShader = 'uniform float tiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float fa = sin(tiempo * 11.0 + float(gl_InstanceID) * 1.7);\n  transformed.y += abs(position.x) * fa * 0.9;');
    };
    this.bandadas = [];
    const total = 3 * 14;
    this.malla = new THREE.InstancedMesh(ala, mat, total); this.malla.frustumCulled = false; juego.escena.add(this.malla);
    for (let b = 0; b < 3; b++) {
      const aves = [];
      for (let k = 0; k < 14; k++) aves.push({ o: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 14), f: Math.random() * 6 });
      this.bandadas.push({ c: new THREE.Vector3((Math.random() - 0.5) * 500, 55 + b * 12, (Math.random() - 0.5) * 500), a: Math.random() * 6.28, r: 120 + Math.random() * 160, w: (0.04 + Math.random() * 0.04) * (Math.random() < 0.5 ? -1 : 1), aves });
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(2.2, 2.2, 2.2); this._e = new THREE.Euler();
  }

  actualizar(dt, noche) {
    this.tiempo.value += dt;
    this.malla.visible = noche < 0.55;
    if (!this.malla.visible) return;
    let n = 0;
    for (const B of this.bandadas) {
      B.a += B.w * dt;
      const cx = B.c.x + Math.cos(B.a) * B.r, cz = B.c.z + Math.sin(B.a) * B.r, rumbo = B.a + (B.w > 0 ? Math.PI / 2 : -Math.PI / 2);
      for (const A of B.aves) {
        A.f += dt;
        this._v.set(cx + A.o.x + Math.sin(A.f * 0.7) * 2, B.c.y + A.o.y + Math.sin(A.f * 1.3) * 1.2, cz + A.o.z + Math.cos(A.f * 0.6) * 2);
        this._e.set(0, Math.atan2(Math.cos(rumbo), -Math.sin(rumbo)) + Math.PI / 2, Math.sin(A.f) * 0.2);
        this._q.setFromEuler(this._e); this._m.compose(this._v, this._q, this._s); this.malla.setMatrixAt(n++, this._m);
      }
    }
    this.malla.instanceMatrix.needsUpdate = true;
  }
}

export class Salpicaduras {
  constructor(juego) {
    this.j = juego; this.n = 500;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.strokeStyle = 'rgba(235,242,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(32, 40, 18, 7, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(235,242,255,0.85)'; for (let k = 0; k < 6; k++) { const a = Math.PI + k / 5 * Math.PI; g.beginPath(); g.arc(32 + Math.cos(a) * 14, 34 + Math.sin(a) * 16, 2.4, 0, 7); g.fill(); }
    this.pos = new Float32Array(this.n * 3); this.vida = new Float32Array(this.n); this.tam = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) { this.vida[i] = Math.random() * 0.3; this.pos[i * 3 + 1] = -50; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('tam', new THREE.BufferAttribute(this.tam, 1));
    const mat = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 1, transparent: true, depthWrite: false, opacity: 0.7 });
    mat.onBeforeCompile = sh => { sh.vertexShader = 'attribute float tam;\n' + sh.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * tam;'); };
    this.pts = new THREE.Points(geo, mat); this.pts.frustumCulled = false; juego.escena.add(this.pts);
  }

  actualizar(dt, lluvia, camara) {
    const on = lluvia > 0.12 && !this.j.jugador.interior;
    this.pts.visible = on; if (!on || !camara) return;
    const bl = this.j.ciudad.bloques, cp = camara.position;
    const activos = Math.floor(this.n * Math.min(1, lluvia));
    for (let i = 0; i < this.n; i++) {
      this.vida[i] -= dt;
      if (this.vida[i] <= 0) {
        this.vida[i] = 0.18 + Math.random() * 0.14;
        if (i >= activos) { this.pos[i * 3 + 1] = -50; continue; }
        const a = Math.random() * 6.283, r = 1.5 + Math.sqrt(Math.random()) * 24;
        const x = cp.x + Math.cos(a) * r, z = cp.z + Math.sin(a) * r;
        const y = bl.some(B => x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1) ? 0.17 : 0.03;
        this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      }
      const t = 1 - this.vida[i] / 0.32;
      this.tam[i] = 0.12 + t * 0.28;
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.tam.needsUpdate = true;
  }
}

export class Granizo {
  constructor(juego) {
    this.j = juego; this.n = 900; this.activo = 0; this.blanco = 0; this.ruido = 0; this.yaDecidido = false;
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(235,242,250,0.9)'); gr.addColorStop(1, 'rgba(235,242,250,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    this.pos = new Float32Array(this.n * 3); this.vel = new Float32Array(this.n * 3);
    for (let i = 0; i < this.n; i++) this.pos[i * 3 + 1] = -50;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.09, transparent: true, depthWrite: false, color: '#f2f6fa' }));
    this.pts.frustumCulled = false; this.pts.visible = false; juego.escena.add(this.pts);
  }

  actualizar(dt, camara) {
    const j = this.j, A = j.ambiente, ms = j.ciudad.matsSuelo;
    if (A.lluvia > 0.55 && !this.yaDecidido) { this.yaDecidido = true; if (Math.random() < 0.35 || this.forzar) { this.activo = 40 + Math.random() * 30; this.forzar = false; j.hud?.notificar?.('info', '¡Granizada!', 'Busca techo, que pega duro.', 3.5); } }
    if (A.lluvia < 0.2) this.yaDecidido = false;
    if (this.activo > 0) this.activo -= dt;
    const on = this.activo > 0 && !j.jugador.interior;
    this.blanco = Math.max(0, Math.min(1, this.blanco + (on ? dt / 25 : -dt / 90)));
    if (ms) {
      const luz = this.blanco * (1 - (A.noche || 0) * 0.7);
      ms[0].color.lerp(new THREE.Color(0.95, 0.96, 0.98), this.blanco * 0.82); ms[0].emissive?.setRGB(0.4, 0.42, 0.45).multiplyScalar(luz); ms[0].roughness = Math.max(ms[0].roughness, 0.3 + this.blanco * 0.6);
      if (ms[1]) { ms[1].color.lerp(new THREE.Color(0.96, 0.97, 0.99), this.blanco * 0.75); ms[1].emissive?.setRGB(0.3, 0.31, 0.33).multiplyScalar(luz); }
    }
    this.pts.visible = on; if (!on || !camara) return;
    const cp = camara.position, p = this.pos, v = this.vel;
    for (let i = 0; i < this.n; i++) {
      if (p[i * 3 + 1] < -1 || Math.abs(p[i * 3] - cp.x) > 26 || Math.abs(p[i * 3 + 2] - cp.z) > 26) {
        p[i * 3] = cp.x + (Math.random() - 0.5) * 50; p[i * 3 + 1] = cp.y + 6 + Math.random() * 14; p[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 50;
        v[i * 3] = (Math.random() - 0.5) * 0.6; v[i * 3 + 1] = -14 - Math.random() * 5; v[i * 3 + 2] = (Math.random() - 0.5) * 0.6; continue;
      }
      v[i * 3 + 1] -= 9.8 * dt;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      if (p[i * 3 + 1] < 0.18 && v[i * 3 + 1] < 0) { if (Math.abs(v[i * 3 + 1]) > 3) { v[i * 3 + 1] = -v[i * 3 + 1] * 0.25; v[i * 3] += (Math.random() - 0.5) * 1.5; v[i * 3 + 2] += (Math.random() - 0.5) * 1.5; p[i * 3 + 1] = 0.18; } else { v[i * 3 + 1] = 0; v[i * 3] *= 0.9; v[i * 3 + 2] *= 0.9; p[i * 3 + 1] = 0.18 - (Math.random() < 0.02 ? 2 : 0); } }
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
    this.ruido -= dt;
    if (this.ruido <= 0) { this.ruido = 0.07; j.audio?.ruidoCorto(0.05, 3500 + Math.random() * 2500, 0.05, 'highpass', 1.2); }
  }
}

export class Arcoiris {
  constructor(juego) {
    this.j = juego; this.t = 0; this.llovio = false;
    const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    [[0, 'rgba(255,40,40,0)'], [0.12, 'rgba(255,40,40,0.8)'], [0.26, 'rgba(255,150,30,0.8)'], [0.4, 'rgba(255,240,60,0.8)'], [0.54, 'rgba(70,220,90,0.8)'], [0.68, 'rgba(60,140,255,0.8)'], [0.82, 'rgba(120,70,220,0.75)'], [1, 'rgba(120,70,220,0)']].forEach(([k, col]) => gr.addColorStop(k, col));
    g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    const tex = new THREE.CanvasTexture(c);
    const geo = new THREE.RingGeometry(520, 590, 96, 1, 0, Math.PI);
    const uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, 0.5, (r - 520) / 70); }
    this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending, toneMapped: false });
    this.malla = new THREE.Mesh(geo, this.mat); this.malla.visible = false; this.malla.renderOrder = -1; juego.escena.add(this.malla);
  }

  actualizar(dt, camara) {
    const A = this.j.ambiente, h = A.hora ?? 12;
    if (A.lluvia > 0.45) this.llovio = true;
    if (this.llovio && A.lluvia < 0.15) { this.llovio = false; if (h > 7.5 && h < 17.5 && !A.noche) this.t = 75; }
    if (this.t > 0) this.t -= dt;
    const k = this.t > 0 ? Math.min(1, this.t / 10, (75 - this.t) / 8) * 0.55 : 0;
    this.mat.opacity = k; this.malla.visible = k > 0.01;
    if (this.malla.visible && camara) {
      const ang = (h - 6.5) / 13 * Math.PI, sx = Math.cos(ang) * 0.8, sz = 0.45;
      const d = new THREE.Vector3(-sx, 0, -sz).normalize();
      this.malla.position.set(camara.position.x + d.x * 700, -60, camara.position.z + d.z * 700);
      this.malla.lookAt(camara.position.x, -60, camara.position.z);
    }
  }
}

export class Fuentes {
  constructor(juego) {
    this.j = juego;
    this.lista = juego.ciudad.bloques.filter(b => b.tipo === 'parque').map(b => ({ x: b.cx, z: b.cz }));
    this.porFuente = 260; const n = this.lista.length * this.porFuente;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.vida = new Float32Array(n);
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.22, transparent: true, depthWrite: false, color: '#e6f2ff', opacity: 0.85 }));
    this.pts.frustumCulled = false; juego.escena.add(this.pts);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.6, 12), new THREE.MeshStandardMaterial({ color: '#d8cfbc', roughness: 0.7 }));
    const plato = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.5, 0.3, 16), new THREE.MeshStandardMaterial({ color: '#d8cfbc', roughness: 0.7 }));
    for (const f of this.lista) { const a = col.clone(); a.position.set(f.x, 1.6, f.z); juego.escena.add(a); const p = plato.clone(); p.position.set(f.x, 2.45, f.z); juego.escena.add(p); }
    for (let i = 0; i < n; i++) { this.vida[i] = Math.random() * 1.6; this.pos[i * 3 + 1] = -50; }
  }

  actualizar(dt) {
    const jp = this.j.jugador.posicion, p = this.pos, v = this.vel, vi = this.vida;
    let alguna = false;
    this.lista.forEach((F, f) => {
      const cerca = Math.abs(F.x - jp.x) < 110 && Math.abs(F.z - jp.z) < 110;
      if (!cerca && F.apagada) return;
      F.apagada = !cerca; alguna = true;
      for (let k = 0; k < this.porFuente; k++) {
        const i = f * this.porFuente + k;
        if (!cerca) { p[i * 3 + 1] = -50; continue; }
        vi[i] -= dt;
        if (vi[i] <= 0 || p[i * 3 + 1] < 0.85) {
          vi[i] = 1.2 + Math.random() * 0.4;
          const alto = k % 3 === 0;
          if (alto) { p[i * 3] = F.x + (Math.random() - 0.5) * 0.1; p[i * 3 + 1] = 2.7; p[i * 3 + 2] = F.z + (Math.random() - 0.5) * 0.1; v[i * 3] = (Math.random() - 0.5) * 0.5; v[i * 3 + 1] = 5.5 + Math.random(); v[i * 3 + 2] = (Math.random() - 0.5) * 0.5; }
          else { const a = Math.random() * 6.283; p[i * 3] = F.x + Math.cos(a) * 1.05; p[i * 3 + 1] = 2.5; p[i * 3 + 2] = F.z + Math.sin(a) * 1.05; v[i * 3] = Math.cos(a) * 0.9; v[i * 3 + 1] = 0.6; v[i * 3 + 2] = Math.sin(a) * 0.9; }
          const t0 = Math.random() * (alto ? 0.9 : 0.4);
          p[i * 3] += v[i * 3] * t0; p[i * 3 + 1] += v[i * 3 + 1] * t0 - 4.9 * t0 * t0; p[i * 3 + 2] += v[i * 3 + 2] * t0; v[i * 3 + 1] -= 9.8 * t0; vi[i] -= t0;
          continue;
        }
        v[i * 3 + 1] -= 9.8 * dt;
        p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      }
    });
    if (alguna) this.pts.geometry.attributes.position.needsUpdate = true;
    this.pts.visible = this.lista.some(F => !F.apagada);
  }
}

export class Malecon {
  constructor(juego) {
    this.j = juego; const L = juego.ciudad.lago; if (!L) return;
    const pts = [], m = 2.2;
    const lados = [[L.x0 - m, L.z0 - m, L.x1 + m, L.z0 - m], [L.x1 + m, L.z0 - m, L.x1 + m, L.z1 + m], [L.x1 + m, L.z1 + m, L.x0 - m, L.z1 + m], [L.x0 - m, L.z1 + m, L.x0 - m, L.z0 - m]];
    for (const [a, b, c, d] of lados) { const n = Math.round(Math.hypot(c - a, d - b) / 7); for (let k = 0; k < n; k++) pts.push([a + (c - a) * k / n, b + (d - b) * k / n]); }
    const M = new THREE.Matrix4(), postes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8).translate(0, 1.3, 0), new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.5, metalness: 0.6 }), pts.length);
    this.focos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: '#8a8578', toneMapped: false }), pts.length);
    pts.forEach(([x, z], i) => { M.makeTranslation(x, 0.2, z); postes.setMatrixAt(i, M); M.makeTranslation(x, 2.95, z); this.focos.setMatrixAt(i, M); });
    postes.castShadow = true; juego.escena.add(postes, this.focos);
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.35, 'rgba(255,220,160,0.4)'); gr.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    this.halos = pts.map(([x, z]) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#ffd9a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(x, 3.15, z); s.scale.setScalar(3); juego.escena.add(s); return s; });
  }

  actualizar(noche) {
    if (!this.focos) return;
    this.focos.material.color.set(noche > 0.25 ? '#ffe9b8' : '#8a8578');
    for (const h of this.halos) { h.material.opacity = noche * 0.7; h.visible = noche > 0.01; }
  }
}

export class FuenteMonumento {
  constructor(juego) {
    this.j = juego; const L = juego.ciudad.lugares.monumento; if (!L) return;
    this.c = L; this.chorros = 16; this.porChorro = 55; const n = this.chorros * this.porChorro;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.vida = new Float32Array(n); this.col = new Float32Array(n * 3).fill(1);
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.34, transparent: true, depthWrite: false, vertexColors: true, opacity: 0.85 });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; juego.escena.add(this.pts);
    for (let i = 0; i < n; i++) { this.vida[i] = Math.random() * 1.2; this.pos[i * 3 + 1] = -50; }
    const boq = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8), new THREE.MeshStandardMaterial({ color: '#8a8e96', metalness: 0.7, roughness: 0.3 }), this.chorros);
    const o = new THREE.Object3D(); for (let k = 0; k < this.chorros; k++) { const a = k / this.chorros * Math.PI * 2; o.position.set(L.x + Math.cos(a) * 7, 1.15, L.z + Math.sin(a) * 7); o.updateMatrix(); boq.setMatrixAt(k, o.matrix); }
    juego.escena.add(boq);
    this.tono = new THREE.Color(1, 1, 1); this.t = 0;
  }

  actualizar(dt) {
    if (!this.c) return;
    const j = this.j, jp = j.jugador.posicion, L = this.c, p = this.pos, v = this.vel, vi = this.vida, cerca = Math.abs(L.x - jp.x) < 120 && Math.abs(L.z - jp.z) < 120;
    if (!cerca) { if (this.pts.visible) { this.pts.visible = false; } return; }
    this.pts.visible = true; this.t += dt;
    const noche = (j.ambiente.noche || 0) > 0.3;
    const paleta = [[1, 0.35, 0.75], [0.3, 0.85, 1], [1, 0.82, 0.3], [0.45, 1, 0.55]];
    const destino = noche ? paleta[Math.floor(this.t / 4) % paleta.length] : [0.92, 0.96, 1];
    this.tono.r += (destino[0] - this.tono.r) * Math.min(1, dt * 2); this.tono.g += (destino[1] - this.tono.g) * Math.min(1, dt * 2); this.tono.b += (destino[2] - this.tono.b) * Math.min(1, dt * 2);
    this.mat.opacity = noche ? 1 : 0.85; this.mat.blending = noche ? THREE.AdditiveBlending : THREE.NormalBlending;
    const altura = 6.4 + Math.sin(this.t * 0.8) * 1.4;
    for (let k = 0; k < this.chorros; k++) {
      const a = k / this.chorros * Math.PI * 2, bx = L.x + Math.cos(a) * 7, bz = L.z + Math.sin(a) * 7;
      for (let m = 0; m < this.porChorro; m++) {
        const i = k * this.porChorro + m;
        vi[i] -= dt;
        if (vi[i] <= 0 || p[i * 3 + 1] < 1.1) {
          const t0 = Math.random() * 1.2, vx = -Math.cos(a) * (2.6 + Math.random() * 0.3), vz = -Math.sin(a) * (2.6 + Math.random() * 0.3), vy = altura + Math.random() * 0.4;
          vi[i] = 1.6 - t0;
          p[i * 3] = bx + vx * t0; p[i * 3 + 1] = 1.25 + vy * t0 - 4.9 * t0 * t0; p[i * 3 + 2] = bz + vz * t0;
          v[i * 3] = vx; v[i * 3 + 1] = vy - 9.8 * t0; v[i * 3 + 2] = vz;
          if (p[i * 3 + 1] < 1.15) { p[i * 3 + 1] = -50; vi[i] = Math.random() * 0.3; }
          continue;
        }
        v[i * 3 + 1] -= 9.8 * dt;
        p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
        this.col[i * 3] = this.tono.r; this.col[i * 3 + 1] = this.tono.g; this.col[i * 3 + 2] = this.tono.b;
      }
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
  }
}
