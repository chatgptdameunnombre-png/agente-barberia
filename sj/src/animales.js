import * as THREE from 'three';
import { mat } from './persona.js?v=202611220554';

const COLORES_PERRO = ['#c89a5a', '#3a2a1e', '#f0e6d6', '#8a6a4a', '#1c1c1c', '#d8b070'];

function modeloPerro(color) {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 }), oscuro = mat('#1a1410'), claro = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#f0e6d6'), 0.5), roughness: 0.85 });
  const add = (geo, mt, x, y, z, padre = cuerpo) => { const k = new THREE.Mesh(geo, mt); k.position.set(x, y, z); k.castShadow = true; padre.add(k); return k; };
  add(new THREE.CapsuleGeometry(0.15, 0.42, 6, 12).rotateX(Math.PI / 2), m, 0, 0.5, 0).scale.set(1, 1.05, 1);
  add(new THREE.SphereGeometry(0.14, 12, 10), claro, 0, 0.47, 0.2).scale.set(0.95, 0.9, 0.8);
  add(new THREE.CylinderGeometry(0.08, 0.11, 0.22, 10).rotateX(-0.9), m, 0, 0.62, 0.32);
  const cab = new THREE.Group(); cab.position.set(0, 0.74, 0.43); cuerpo.add(cab);
  add(new THREE.SphereGeometry(0.12, 14, 12), m, 0, 0, 0, cab).scale.set(0.95, 0.92, 1);
  add(new THREE.CylinderGeometry(0.05, 0.075, 0.16, 10).rotateX(Math.PI / 2), claro, 0, -0.04, 0.13, cab);
  add(new THREE.SphereGeometry(0.028, 8, 6), oscuro, 0, -0.02, 0.215, cab);
  for (const s of [-1, 1]) {
    const o = add(new THREE.SphereGeometry(0.05, 8, 6), m, s * 0.09, 0.06, -0.02, cab); o.scale.set(0.5, 1.4, 0.9); o.rotation.z = s * 0.5;
    add(new THREE.SphereGeometry(0.018, 8, 6), mat('#0c0c0c'), s * 0.055, 0.03, 0.095, cab);
  }
  const collar = add(new THREE.TorusGeometry(0.085, 0.015, 6, 14), mat(['#c8202e', '#2e5a8a', '#3a9a5a'][Math.random() * 3 | 0]), 0, 0.66, 0.36); collar.rotation.x = Math.PI / 2 - 0.9;
  const cola = new THREE.Group(); cola.position.set(0, 0.58, -0.34); cuerpo.add(cola);
  add(new THREE.CapsuleGeometry(0.025, 0.24, 4, 6), m, 0, 0.1, -0.08, cola).rotation.x = -0.7;
  const patas = [];
  for (const [x, z] of [[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.24], [0.09, -0.24]]) {
    const p = new THREE.Group(); p.position.set(x, 0.42, z); cuerpo.add(p);
    add(new THREE.CapsuleGeometry(0.04, 0.3, 4, 8), m, 0, -0.2, 0, p);
    add(new THREE.SphereGeometry(0.045, 8, 6), claro, 0, -0.39, 0.02, p).scale.set(1, 0.6, 1.3);
    patas.push(p);
  }
  return { g, cuerpo, cab, cola, patas, collar };
}

function modeloPaloma() {
  const g = new THREE.Group();
  const m = mat(Math.random() < 0.7 ? '#8a8f9a' : '#5a5e68'), cuello = mat('#5f7a78');
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.26), m); cuerpo.position.y = 0.12; g.add(cuerpo);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), cuello); cab.position.set(0, 0.22, 0.12); g.add(cab);
  const pico = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), mat('#d8a040')); pico.position.set(0, 0.21, 0.18); g.add(pico);
  const alas = [];
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.16), m); a.position.set(s * 0.1, 0.15, -0.01); a.geometry.translate(s * 0.08, 0, 0); g.add(a); alas.push(a); }
  return { g, cab, alas };
}

export class Animales {
  constructor(juego) {
    this.j = juego;
    this.perros = [];
    this.palomas = [];
    const B = juego.ciudad.bloques;
    for (let i = 0; i < 9; i++) {
      const b = B[(i * 7 + 3) % B.length];
      const mdl = modeloPerro(COLORES_PERRO[i % COLORES_PERRO.length]);
      const p = { ...mdl, pos: new THREE.Vector3(b.x0 + 1.5, 0, b.cz), yaw: 0, estado: 'pasear', meta: null, t: Math.random() * 5, fase: 0, miedo: 0, muerto: 0, ladrido: 0, bloque: b, sigue: false };
      p.g.scale.setScalar(0.85 + Math.random() * 0.4);
      juego.escena.add(p.g);
      this.perros.push(p);
    }
    const L = juego.ciudad.lugares;
    const parques = juego.ciudad.bloques.filter(b => b.tipo === 'parque').map(b => ({ x: b.cx + 6, z: b.cz - 7 }));
    for (const lugar of [L.plaza, L.catedral, L.monumento, L.mercado, L.tianguis, ...parques]) {
      if (!lugar) continue;
      for (let k = 0; k < 7; k++) {
        const mdl = modeloPaloma();
        const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * 7;
        const p = { ...mdl, casa: new THREE.Vector3(lugar.x + Math.cos(a) * d, 0.17, lugar.z + Math.sin(a) * d), pos: new THREE.Vector3(), vel: new THREE.Vector3(), vuela: 0, t: Math.random() * 10 };
        p.pos.copy(p.casa); this.j.mundo.empujar(p.pos, 0.3); p.casa.copy(p.pos);
        p.g.position.copy(p.pos); p.g.rotation.y = Math.random() * 6;
        juego.escena.add(p.g);
        this.palomas.push(p);
      }
    }
  }

  asustar(x, z, r = 30) {
    for (const p of this.perros) if (!p.muerto && Math.hypot(p.pos.x - x, p.pos.z - z) < r) { p.miedo = 6; p.huye = { x, z }; p.sigue = false; }
    for (const p of this.palomas) if (!p.vuela && Math.hypot(p.pos.x - x, p.pos.z - z) < r) this.volar(p, x, z);
  }

  volar(p, x, z) {
    p.vuela = 6;
    const dx = p.pos.x - x, dz = p.pos.z - z, d = Math.hypot(dx, dz) || 1;
    p.vel.set(dx / d * 5 + (Math.random() - 0.5) * 3, 5 + Math.random() * 3, dz / d * 5 + (Math.random() - 0.5) * 3);
    if (Math.random() < 0.3) this.j.audio.aleteo?.();
  }

  crearCorrea() {
    const g = new THREE.Group(), mat = this._matCorrea || (this._matCorrea = new THREE.MeshStandardMaterial({ color: '#c8202e', roughness: 0.6 }));
    const geo = this._geoCorrea || (this._geoCorrea = new THREE.CylinderGeometry(0.008, 0.008, 1, 6).translate(0, 0.5, 0));
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; g.add(m); }
    g.frustumCulled = false;
    return g;
  }

  tenderCorrea(g, a, b) {
    const L = a.distanceTo(b), floja = Math.max(0.02, 1.25 - L) * 0.35, n = g.children.length, p0 = this._p0 || (this._p0 = new THREE.Vector3()), p1 = this._p1 || (this._p1 = new THREE.Vector3()), d = this._d || (this._d = new THREE.Vector3()), Y = this._Y || (this._Y = new THREE.Vector3(0, 1, 0));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      p0.lerpVectors(a, b, t0); p0.y -= Math.sin(t0 * Math.PI) * floja;
      p1.lerpVectors(a, b, t1); p1.y -= Math.sin(t1 * Math.PI) * floja;
      const m = g.children[i]; d.subVectors(p1, p0);
      m.position.copy(p0); m.scale.set(1, Math.max(0.001, d.length()), 1); m.quaternion.setFromUnitVectors(Y, d.normalize());
    }
  }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, jp = jug.posicion;
    for (const p of this.perros) {
      const d = Math.hypot(p.pos.x - jp.x, p.pos.z - jp.z);
      if (d > 230 && !p.perdido) { const b = j.ciudad.bloques.filter(b => { const e = Math.hypot(b.cx - jp.x, b.cz - jp.z); return e > 60 && e < 140; }); if (b.length) { p.bloque = b[Math.random() * b.length | 0]; p.pos.set(p.bloque.x0 + 1.4, 0, p.bloque.cz); p.muerto = 0; p.cuerpo.rotation.z = 0; p.estado = 'pasear'; } continue; }
      p.g.visible = d < 160;
      if (p.muerto) { p.muerto += dt; p.cuerpo.rotation.z = Math.min(Math.PI / 2, p.muerto * 6); p.g.position.copy(p.pos); continue; }
      p.t -= dt; p.ladrido -= dt;
      let vx = 0, vz = 0, v = 0;
      if (p.miedo > 0) {
        p.miedo -= dt; v = 6;
        vx = p.pos.x - p.huye.x; vz = p.pos.z - p.huye.z;
        if (p.ladrido <= 0 && Math.random() < 0.02) { j.audio.ladrido?.(p.pos); p.ladrido = 1; }
      } else if (p.dueno) {
        const o = p.dueno;
        if (!j.peatones.includes(o) || o.muerto || o.estado === 'huir') { p.dueno = null; if (p.correa) { j.escena.remove(p.correa); p.correa = null; } }
        else { const dx = o.pos.x - Math.sin(o.yaw) * 1.4 - p.pos.x, dz = o.pos.z - Math.cos(o.yaw) * 1.4 - p.pos.z, e = Math.hypot(dx, dz); if (e > 0.5) { vx = dx; vz = dz; v = Math.min(4, e * 2); } }
      } else if (p.sigue && !jug.coche && !jug.interior && d < 40) {
        if (d > 2.5) { vx = jp.x - p.pos.x; vz = jp.z - p.pos.z; v = d > 8 ? 6 : 3.2; }
      } else {
        const b = p.bloque, m = 1.4;
        if (!p.meta || p.t <= 0 || Math.hypot(p.meta.x - p.pos.x, p.meta.z - p.pos.z) < 0.6) {
          const lado = Math.random() * 4 | 0, u = Math.random();
          p.meta = [{ x: b.x0 + m + (b.x1 - b.x0 - 2 * m) * u, z: b.z0 + m }, { x: b.x0 + m + (b.x1 - b.x0 - 2 * m) * u, z: b.z1 - m }, { x: b.x0 + m, z: b.z0 + m + (b.z1 - b.z0 - 2 * m) * u }, { x: b.x1 - m, z: b.z0 + m + (b.z1 - b.z0 - 2 * m) * u }][lado];
          p.t = 3 + Math.random() * 8;
          p.quieto = Math.random() < 0.35 ? 2 + Math.random() * 3 : 0;
        }
        if (p.quieto > 0) p.quieto -= dt;
        else { vx = p.meta.x - p.pos.x; vz = p.meta.z - p.pos.z; v = 1.6; }
        if (!jug.coche && d < 5 && jug.velocidad < 1 && Math.random() < dt * 0.15 && !jug.interior) { p.sigue = true; j.hud.notificar('flor', 'Un perrito te sigue', 'Si lo llevas cerca te acompaña por la ciudad.', 3); }
        if (!jug.coche && d < 7 && jug.arma !== 'puno' && p.ladrido <= 0) { j.audio.ladrido?.(p.pos); p.ladrido = 2 + Math.random() * 2; }
      }
      const m = Math.hypot(vx, vz);
      if (m > 0.01 && v > 0) {
        p.pos.x += vx / m * v * dt; p.pos.z += vz / m * v * dt;
        const ya = Math.atan2(vx, vz); let dd = ya - p.yaw; while (dd > Math.PI) dd -= 6.283; while (dd < -Math.PI) dd += 6.283; p.yaw += dd * Math.min(1, dt * 8);
      }
      j.mundo.empujar(p.pos, 0.3);
      p.fase += dt * (4 + v * 3);
      const k = Math.min(1, v / 3) * 0.7;
      p.patas.forEach((q, i) => q.rotation.x = Math.sin(p.fase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * k);
      p.cola.rotation.y = Math.sin(performance.now() / 90) * (p.sigue ? 0.7 : 0.25);
      p.cab.rotation.x = v < 0.1 ? Math.sin(performance.now() / 600) * 0.15 : 0;
      p.g.position.copy(p.pos); p.g.rotation.y = p.yaw;
      if (!p.dueno && !p.sigue && d < 90 && d > 35 && Math.random() < dt * 0.05) {
        const o = j.peatones.find(q => q.tipo === 'civil' && q.estado === 'pasear' && !q.corredor && !q.objetivoMision && !this.perros.some(x => x.dueno === q) && Math.abs(q.pos.x - p.pos.x) + Math.abs(q.pos.z - p.pos.z) < 40);
        if (o) { p.dueno = o; p.pos.set(o.pos.x - 1, 0, o.pos.z); p.correa = this.crearCorrea(); j.escena.add(p.correa); }
      }
      if (p.correa && p.dueno) {
        const mano = this._v || (this._v = new THREE.Vector3()), collar = this._v2 || (this._v2 = new THREE.Vector3());
        p.dueno.p.mi.getWorldPosition(mano); mano.y -= 0.06; p.collar.getWorldPosition(collar);
        this.tenderCorrea(p.correa, mano, collar);
        p.dueno.p.bi.rotation.set(-0.45, 0, 0.25); p.dueno.p.ci.rotation.x = -0.6;
      }
      for (const c of j.coches) {
        if (c.vel < 4 || Math.abs(c.pos.x - p.pos.x) > 3 || Math.abs(c.pos.z - p.pos.z) > 3) continue;
        if (c.pos.distanceTo(p.pos) < c.t.ancho * 0.7 + 0.3) { p.muerto = 0.01; j.audio.ladrido?.(p.pos, true); break; }
      }
    }
    for (const p of this.palomas) {
      const d = Math.hypot(p.pos.x - jp.x, p.pos.z - jp.z);
      p.g.visible = d < 140;
      if (!p.g.visible) continue;
      if (p.vuela > 0) {
        p.vuela -= dt;
        p.vel.y -= 2 * dt;
        p.pos.addScaledVector(p.vel, dt);
        const s = Math.sin(performance.now() / 45 + p.t) * 0.9;
        p.alas[0].rotation.z = s; p.alas[1].rotation.z = -s;
        p.g.rotation.y = Math.atan2(p.vel.x, p.vel.z);
        if (p.vuela <= 0) { p.pos.copy(p.casa); p.alas[0].rotation.z = p.alas[1].rotation.z = 0; }
      } else {
        p.t += dt;
        p.cab.position.y = 0.22 - Math.max(0, Math.sin(p.t * 3)) * 0.06;
        if (Math.random() < dt * 0.3) p.g.rotation.y += (Math.random() - 0.5) * 2;
        const cerca = (!jug.coche && d < 3.5 && jug.velocidad > 2) || (jug.coche && d < 9);
        if (cerca) for (const q of this.palomas) if (!q.vuela && q.pos.distanceTo(p.pos) < 8) this.volar(q, jp.x, jp.z);
      }
      p.g.position.copy(p.pos);
    }
  }
}
