import * as THREE from 'three';

const C = (h) => new THREE.Color(h);
const PALETA = [
  { h: 0, arriba: C('#060a1c'), horizonte: C('#1a1f3d'), sol: C('#7a8ac8'), luz: 0.3, amb: 0.42 },
  { h: 5, arriba: C('#0b1230'), horizonte: C('#3a2f55'), sol: C('#7a7ac0'), luz: 0.3, amb: 0.42 },
  { h: 6.5, arriba: C('#3f5f9a'), horizonte: C('#ff9e6b'), sol: C('#ffb27a'), luz: 0.7, amb: 0.5 },
  { h: 8, arriba: C('#4a78b0'), horizonte: C('#c4cdd2'), sol: C('#fff0d0'), luz: 1.25, amb: 0.62 },
  { h: 13, arriba: C('#3f72b4'), horizonte: C('#b8c8d4'), sol: C('#fffaf0'), luz: 1.45, amb: 0.68 },
  { h: 17, arriba: C('#4f6fa8'), horizonte: C('#e0b88c'), sol: C('#ffd8a0'), luz: 1.25, amb: 0.6 },
  { h: 18.7, arriba: C('#4b4f9a'), horizonte: C('#ff7a4a'), sol: C('#ff9a5a'), luz: 0.85, amb: 0.5 },
  { h: 19.8, arriba: C('#1d2156'), horizonte: C('#a2466a'), sol: C('#b0608a'), luz: 0.35, amb: 0.38 },
  { h: 21, arriba: C('#080c22'), horizonte: C('#221c40'), sol: C('#7a8ac8'), luz: 0.3, amb: 0.42 },
  { h: 24, arriba: C('#060a1c'), horizonte: C('#1a1f3d'), sol: C('#7a8ac8'), luz: 0.3, amb: 0.42 }
];

export class Ambiente {
  constructor(juego, escena, ciudad) {
    this.juego = juego;
    this.escena = escena;
    this.ciudad = ciudad;
    this.hora = 17.4;
    this.velocidad = 1 / 40;
    this.lluvia = 0;
    this.quiereLluvia = 0;
    this.climaT = 120;
    this.noche = 0;
    this.relampago = 0;
    this.hemi = new THREE.HemisphereLight('#cfe3ff', '#5a5040', 0.6);
    escena.add(this.hemi);
    this.sol = new THREE.DirectionalLight('#ffffff', 1.2);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(4096, 4096);
    const s = this.sol.shadow.camera;
    s.left = -55; s.right = 55; s.top = 55; s.bottom = -55; s.near = 1; s.far = 420;
    this.sol.shadow.bias = -0.00025;
    this.sol.shadow.normalBias = 0.025;
    this.sol.shadow.radius = 2.5;
    escena.add(this.sol, this.sol.target);
    this.niebla = new THREE.Fog('#cfe3f2', 120, 620);
    escena.fog = this.niebla;
    const cielo = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { arriba: { value: C('#5d9be0') }, horizonte: { value: C('#cfe3f2') }, solDir: { value: new THREE.Vector3(0, 1, 0) }, solColor: { value: C('#fff') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 arriba; uniform vec3 horizonte; uniform vec3 solDir; uniform vec3 solColor; varying vec3 vP;
        void main(){ float h = clamp(vP.y, -0.2, 1.0); vec3 c = mix(horizonte, arriba, pow(max(h,0.0), 0.55));
          float s = max(dot(normalize(vP), normalize(solDir)), 0.0);
          c += solColor * (pow(s, 400.0) * 1.6 + pow(s, 12.0) * 0.25);
          gl_FragColor = vec4(c, 1.0); }`
    });
    this.cieloMat = cielo;
    this.cielo = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), cielo);
    this.cielo.renderOrder = -1;
    escena.add(this.cielo);
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 0.45 + 0.08;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * 850; pos[i * 3 + 1] = Math.sin(e) * 850; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 850;
    }
    const gE = new THREE.BufferGeometry(); gE.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.estrellas = new THREE.Points(gE, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    escena.add(this.estrellas);
    const gotas = 2600, lp = new Float32Array(gotas * 6);
    this.gotasBase = [];
    for (let i = 0; i < gotas; i++) {
      const x = (Math.random() - 0.5) * 70, y = Math.random() * 30, z = (Math.random() - 0.5) * 70;
      this.gotasBase.push(x, y, z);
      lp.set([x, y, z, x + 0.05, y - 0.7, z], i * 6);
    }
    const gL = new THREE.BufferGeometry(); gL.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    this.gotas = new THREE.LineSegments(gL, new THREE.LineBasicMaterial({ color: '#b8c8e0', transparent: true, opacity: 0, depthWrite: false }));
    this.gotas.frustumCulled = false;
    escena.add(this.gotas);
    this._a = new THREE.Color(); this._b = new THREE.Color(); this._c = new THREE.Color();
  }

  muestra(h) {
    let i = 0;
    while (i < PALETA.length - 2 && PALETA[i + 1].h <= h) i++;
    const a = PALETA[i], b = PALETA[i + 1];
    const t = Math.max(0, Math.min(1, (h - a.h) / (b.h - a.h)));
    return { a, b, t };
  }

  reflejos(forzar = false) {
    const r = this.juego.renderer; if (!r) return;
    const h = this.hora ?? 12;
    if (!forzar && this.horaReflejo !== undefined && Math.abs(h - this.horaReflejo) < 0.5 && Math.abs(h - this.horaReflejo) < 23) return;
    this.horaReflejo = h;
    if (!this.escReflejo) {
      this.escReflejo = new THREE.Scene();
      this.escReflejo.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), this.cieloMat));
      this.sueloReflejo = new THREE.Mesh(new THREE.CircleGeometry(30, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#5a554e' }));
      this.sueloReflejo.position.y = -0.6; this.escReflejo.add(this.sueloReflejo);
      this.pmremCielo = new THREE.PMREMGenerator(r);
    }
    this.sueloReflejo.material.color.set('#6a645a').multiplyScalar(Math.max(0.08, Math.min(1, (this.hemi?.intensity || 1) / 1.1)));
    const rt = this.pmremCielo.fromScene(this.escReflejo, 0.02, 0.1, 100);
    this.rtReflejo?.dispose(); this.rtReflejo = rt;
    this.juego.escena.environment = rt.texture;
  }

  actualizar(dt, camara) {
    this.hora = (this.hora + dt * this.velocidad) % 24;
    this.reflejos();
    this.climaT -= dt;
    if (this.climaT <= 0) {
      this.quiereLluvia = Math.random() < 0.3 ? 0.6 + Math.random() * 0.4 : 0;
      this.quiereNublado = this.quiereLluvia ? 0.8 : Math.random() < 0.25 ? 0.4 + Math.random() * 0.4 : 0;
      this.climaT = 140 + Math.random() * 200;
    }
    this.nublado = (this.nublado || 0) + ((this.quiereNublado || 0) - (this.nublado || 0)) * Math.min(1, dt * 0.05);
    const hm = this.hora, manana = hm > 4.8 && hm < 9.5 ? Math.sin((hm - 4.8) / 4.7 * Math.PI) : 0;
    this.neblina = Math.max(manana * (this.diaNeblina ?? (this.diaNeblina = 0.5 + Math.random() * 0.5)), this.lluvia * 0.35);
    if (hm > 12 && hm < 12.1) this.diaNeblina = Math.random() < 0.6 ? 0.4 + Math.random() * 0.6 : 0.1;
    this.lluvia += (this.quiereLluvia - this.lluvia) * Math.min(1, dt * 0.08);
    this.mojado = (this.mojado || 0) + ((this.lluvia > 0.15 ? 1 : 0) - (this.mojado || 0)) * Math.min(1, dt * (this.lluvia > 0.15 ? 0.25 : 0.02));
    const W = this.mojado, ms = this.juego.ciudad?.matsSuelo;
    if (ms) { ms[0].roughness = 0.94 - 0.62 * W; ms[0].color.setScalar(1 - 0.38 * W); ms[0].envMapIntensity = 1 + W * 0.8; if (ms[1]) { ms[1].roughness = 0.95 - 0.5 * W; ms[1].color.setScalar(1 - 0.3 * W); } }
    const ch = this.juego.charcos; if (ch) { ch.mat.opacity = W * 0.92; ch.malla.visible = W > 0.02; }
    const { a, b, t } = this.muestra(this.hora);
    const lerp = (x, y) => x + (y - x) * t;
    const L = this.lluvia;
    const gris = this._c.set('#5a6270');
    const N = Math.max(L, this.nublado || 0);
    const arriba = this._a.copy(a.arriba).lerp(b.arriba, t).lerp(gris, N * 0.55);
    const horiz = this._b.copy(a.horizonte).lerp(b.horizonte, t).lerp(gris.set('#7a8290'), N * 0.6);
    if (this.neblina > 0.01) { horiz.lerp(gris.set('#c9ccd0'), this.neblina * 0.55); arriba.lerp(gris.set('#b8c0c8'), this.neblina * 0.35); }
    if (this.relampago > 0) { this.relampago -= dt; const k = Math.max(0, this.relampago) * 3; arriba.lerp(gris.set('#e8ecff'), Math.min(1, k)); horiz.lerp(gris, Math.min(1, k)); }
    this.cieloMat.uniforms.arriba.value.copy(arriba);
    this.cieloMat.uniforms.horizonte.value.copy(horiz);
    this.niebla.color.copy(horiz);
    this.niebla.near = 150 - L * 110 - (this.neblina || 0) * 125;
    this.niebla.far = 620 - L * 330 - (this.neblina || 0) * 420;
    const ang = (this.hora - 6.5) / 13 * Math.PI;
    const sx = Math.cos(ang), sy = Math.sin(ang);
    const dirSol = new THREE.Vector3(sx * 0.8, Math.max(sy, -0.3), 0.45).normalize();
    this.cieloMat.uniforms.solDir.value.copy(dirSol);
    this.cieloMat.uniforms.solColor.value.copy(a.sol).lerp(b.sol, t).multiplyScalar(sy > -0.05 ? (1 - L * 0.9) : 0);
    const luz = lerp(a.luz, b.luz) * (1 - L * 0.5) * (1 - (this.nublado || 0) * 0.35) * (1 - (this.neblina || 0) * 0.25) + (this.relampago > 0 ? 1.5 : 0);
    const dia = sy > 0.05;
    const objetivo = camara ? this.juego.jugador.posicion : new THREE.Vector3();
    const luna = new THREE.Vector3(-sx * 0.8, Math.max(-sy, 0.2), -0.3).normalize();
    const dirLuz = dia ? dirSol : luna;
    if (!this.luna) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.45, 'rgba(240,236,220,1)'); gr.addColorStop(0.5, 'rgba(220,225,255,0.35)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      for (let k = 0; k < 9; k++) { g.fillStyle = 'rgba(170,165,150,0.35)'; g.beginPath(); g.arc(40 + Math.random() * 48, 40 + Math.random() * 48, 3 + Math.random() * 7, 0, 7); g.fill(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      this.luna = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, opacity: 0 }));
      this.luna.scale.setScalar(70); this.luna.renderOrder = -1; this.juego.escena.add(this.luna);
    }
    if (camara) { this.luna.position.copy(camara.position).addScaledVector(luna, 820); this.luna.material.opacity = Math.max(0, Math.min(1, -sy * 4)) * (1 - L * 0.8); }
    const paso = 110 / 4096 * 2;
    const ox = Math.round(objetivo.x / paso) * paso, oz = Math.round(objetivo.z / paso) * paso;
    this.sol.position.set(ox + dirLuz.x * 200, dirLuz.y * 200, oz + dirLuz.z * 200);
    this.sol.target.position.set(ox, 0, oz);
    const dentro = this.juego.jugador?.interior ? (this.juego.jugador.interior.tipo === 'antro' ? 0.04 : 0.22) : 1;
    this.sol.intensity = luz * (dia ? 1.6 : 0.9) * dentro;
    this.sol.color.copy(a.sol).lerp(b.sol, t);
    this.hemi.intensity = lerp(a.amb, b.amb) * (1 - L * 0.25) * 1.9 * (dentro < 0.1 ? 0.18 : dentro < 1 ? 0.55 : 1);
    this.hemi.color.copy(arriba).lerp(gris.set('#ffffff'), 0.5);
    this.noche = Math.max(0, Math.min(1, (0.12 - sy) / 0.3));
    for (const m of this.ciudad.materialesVentanas) m.emissiveIntensity = this.noche * 0.95 + L * 0.15;
    this.ciudad.charcoLuz.material.opacity = this.noche * 0.55;
    this.ciudad.halos.material.opacity = this.noche * 0.55;
    this.ciudad.focoMat.color.set(this.noche > 0.2 ? '#ffe7a8' : '#d8d8d0');
    this.estrellas.material.opacity = Math.max(0, this.noche - L) * 0.9;
    this.ciudad.estadio?.actualizar(this.noche);
    if (this.ciudad.manchaMat) { this.ciudad.manchaMat.color.setScalar(1 - this.noche * 0.72); this.ciudad.manchaMat.emissiveIntensity = this.noche * 0.7; }
    this.ciudad.cerros.color.set('#8aa07c').lerp(horiz, 0.5).multiplyScalar(0.55 + 0.45 * Math.max(0.15, 1 - this.noche * 0.85));
    if (camara) {
      this.cielo.position.copy(camara.position);
      this.estrellas.position.copy(camara.position);
    }
    this.gotas.material.opacity = L * 0.55;
    this.gotas.visible = L > 0.02;
    if (this.gotas.visible && camara) {
      const p = this.gotas.geometry.attributes.position.array;
      const tt = performance.now() / 1000;
      const cx = camara.position.x, cy = camara.position.y, cz = camara.position.z;
      for (let i = 0, n = this.gotasBase.length / 3; i < n; i++) {
        const bx = this.gotasBase[i * 3], by = this.gotasBase[i * 3 + 1], bz = this.gotasBase[i * 3 + 2];
        const y = ((by - tt * 24) % 30 + 30) % 30 - 12 + cy;
        const x = cx + ((bx - cx) % 70 + 105) % 70 - 35, z = cz + ((bz - cz) % 70 + 105) % 70 - 35;
        p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z;
        p[i * 6 + 3] = x + 0.08; p[i * 6 + 4] = y - 0.8; p[i * 6 + 5] = z;
      }
      this.gotas.geometry.attributes.position.needsUpdate = true;
      if (L > 0.6 && Math.random() < dt * 0.05) { this.relampago = 0.35; setTimeout(() => this.juego.audio?.trueno(), 400 + Math.random() * 1500); }
    }
    this.juego.audio?.lluvia(L);
  }

  get texto() {
    const h = Math.floor(this.hora), m = Math.floor((this.hora - h) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
}
