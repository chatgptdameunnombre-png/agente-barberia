import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

const MUNDO = 0x0001, MUNECO = 0x0002, OBJETO = 0x0004, COCHE = 0x0008, ESCOMBRO = 0x0010;
const grupo = (miembro, filtro) => (miembro << 16) | filtro;
const PASO = 1 / 60;
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _p2 = new THREE.Vector3(), _s = new THREE.Vector3(), UNO = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();
const v3 = v => ({ x: v.x, y: v.y, z: v.z });

const SEGMENTOS = [
  ['cuerpo', -1, 'caja', [0, 0.93, 0], [0.15, 0.1, 0.115]],
  ['torso', 0, 'caja', [0, 0.27, 0], [0.17, 0.23, 0.125], 'rotula'],
  ['cabeza', 1, 'bola', [0, 0.14, 0.01], [0.105], 'rotula'],
  ['pi', 0, 'capsula', [0, -0.215, 0], [0.14, 0.08], 'rotula'],
  ['pd', 0, 'capsula', [0, -0.215, 0], [0.14, 0.08], 'rotula'],
  ['ri', 3, 'capsula', [0, -0.2, 0.01], [0.15, 0.064], 'bisagra', [0, 2.4]],
  ['rd', 4, 'capsula', [0, -0.2, 0.01], [0.15, 0.064], 'bisagra', [0, 2.4]],
  ['bi', 1, 'capsula', [0, -0.13, 0], [0.09, 0.052], 'rotula'],
  ['bd', 1, 'capsula', [0, -0.13, 0], [0.09, 0.052], 'rotula'],
  ['ci', 7, 'capsula', [0, -0.15, 0], [0.11, 0.046], 'bisagra', [-2.5, 0]],
  ['cd', 8, 'capsula', [0, -0.15, 0], [0.11, 0.046], 'bisagra', [-2.5, 0]]
];

const OBJETOS = {
  bote: { forma: 'cilindro', medida: [0.42, 0.27], masa: 6, color: '#2f5a3a', geo: () => { const g = new THREE.CylinderGeometry(0.29, 0.25, 0.84, 14); const t = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14); t.translate(0, 0.44, 0); return [g, t]; } },
  caja: { forma: 'caja', medida: [0.3, 0.22, 0.25], masa: 2, color: '#a77b4a', geo: () => [new THREE.BoxGeometry(0.6, 0.44, 0.5)], uv: true },
  cono: { forma: 'cilindro', medida: [0.35, 0.16], masa: 1.5, color: '#ff6a1a', geo: () => { const g = new THREE.ConeGeometry(0.16, 0.66, 14); g.translate(0, 0.02, 0); const b = new THREE.BoxGeometry(0.4, 0.04, 0.4); b.translate(0, -0.33, 0); return [g, b]; } },
  silla: { forma: 'caja', medida: [0.24, 0.42, 0.24], masa: 2.5, color: '#d8d4cc', geo: () => { const s = new THREE.BoxGeometry(0.46, 0.05, 0.44); s.translate(0, 0.02, 0); const r = new THREE.BoxGeometry(0.46, 0.42, 0.05); r.translate(0, 0.24, -0.2); const p = []; for (const [x, z] of [[0.2, 0.19], [-0.2, 0.19], [0.2, -0.19], [-0.2, -0.19]]) { const k = new THREE.BoxGeometry(0.04, 0.42, 0.04); k.translate(x, -0.2, z); p.push(k); } return [s, r, ...p]; } }
};

export class Fisica {
  constructor(juego) {
    this.j = juego; this.listo = false; this.acum = 0;
    this.munecos = []; this.objetos = []; this.escombros = []; this.coches = new Map(); this.gente = new Map();
    RAPIER.init().then(() => this.crear()).catch(e => console.warn('fisica', e));
  }

  crear() {
    const W = this.mundo = new RAPIER.World({ x: 0, y: -14, z: 0 });
    W.timestep = PASO;
    const suelo = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
    W.createCollider(RAPIER.ColliderDesc.cuboid(4000, 0.5, 4000).setFriction(0.85).setCollisionGroups(grupo(MUNDO, 0xffff)), suelo);
    for (const c of this.j.mundo.cajas) {
      const hy = Math.min(c.h, 40) / 2, b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation((c.minx + c.maxx) / 2, hy, (c.minz + c.maxz) / 2));
      W.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(0.05, (c.maxx - c.minx) / 2), hy, Math.max(0.05, (c.maxz - c.minz) / 2)).setFriction(0.7).setCollisionGroups(grupo(MUNDO, 0xffff)), b);
    }
    this.colocarObjetos();
    this.listo = true;
  }

  colocarObjetos() {
    const f = this.j.ciudad?.farolas || [], R = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const lista = [];
    for (const k of f) {
      const sx = Math.sign(k.x - k.hx) || 1, sz = Math.sign(k.z - k.hz) || 1, a = R();
      if (a < 0.55) lista.push(['bote', k.x, k.z + sz * 2.6, R() * 6]);
      else if (a < 0.7) { const bx = k.x - sx * 0.1, bz = k.z + sz * 4.2; lista.push(['caja', bx, bz, R()], ['caja', bx + 0.1, bz + sz * 0.55, R()], ['caja', bx, bz + sz * 0.25, R(), 0.45]); }
      else if (a < 0.78) { lista.push(['silla', k.x + sx * 0.7, k.z + sz * 1.3, R() * 6], ['silla', k.x + sx * 0.5, k.z + sz * 2.1, R() * 6]); }
      if (R() < 0.12) lista.push(['cono', k.x - sx * 2.2, k.z + sz * 5, 0], ['cono', k.x - sx * 2.2, k.z + sz * 6.5, 0], ['cono', k.x - sx * 2.2, k.z + sz * 8, 0]);
    }
    const porTipo = {};
    for (const o of lista) (porTipo[o[0]] ||= []).push(o);
    this.mallas = {};
    for (const tipo in porTipo) {
      const T = OBJETOS[tipo], partes = T.geo(), mat = new THREE.MeshStandardMaterial({ color: tipo === 'caja' ? '#ffffff' : T.color, roughness: tipo === 'caja' ? 0.9 : 0.55, map: tipo === 'caja' ? texCarton() : null });
      const geo = partes.length > 1 ? unir(partes) : partes[0];
      const im = new THREE.InstancedMesh(geo, mat, porTipo[tipo].length);
      im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
      this.j.escena.add(im); this.mallas[tipo] = im;
      porTipo[tipo].forEach((o, i) => {
        const [, x, z, giro, alto = 0] = o, hy = T.forma === 'caja' ? T.medida[1] : T.medida[0];
        const b = this.mundo.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, hy + alto + 0.002, z).setRotation(_q.setFromAxisAngle(_p.set(0, 1, 0), giro)).setLinearDamping(0.25).setAngularDamping(0.6).setCanSleep(true));
        const cd = T.forma === 'caja' ? RAPIER.ColliderDesc.cuboid(...T.medida) : RAPIER.ColliderDesc.cylinder(T.medida[0], T.medida[1]);
        this.mundo.createCollider(cd.setMass(T.masa).setFriction(0.7).setRestitution(0.2).setCollisionGroups(grupo(OBJETO, MUNDO | OBJETO | COCHE | MUNECO | ESCOMBRO)), b);
        b.sleep();
        const obj = { tipo, b, im, i, quieto: false, despierto: false };
        this.objetos.push(obj); this.pintarObjeto(obj);
      });
      im.instanceMatrix.needsUpdate = true;
    }
  }

  pintarObjeto(o) {
    const t = o.b.translation(), r = o.b.rotation();
    _m.compose(_p.set(t.x, t.y, t.z), _q.set(r.x, r.y, r.z, r.w), UNO);
    o.im.setMatrixAt(o.i, _m);
  }

  muneco(p, vel = null, giro = 0) {
    if (!this.listo || !p?.cuerpo) return null;
    if (this.munecos.length >= 8) this.soltar(this.munecos[0]);
    const g = p.grupo; g.updateMatrixWorld(true);
    const esc = g.scale.x, W = this.mundo, segs = [];
    for (const [nombre, padre, forma, centro, medida, junta, lim] of SEGMENTOS) {
      const obj = p[nombre];
      if (!obj) return null;
      const orig = { p: obj.position.clone(), q: obj.quaternion.clone(), s: obj.scale.clone() };
      obj.matrixWorld.decompose(_p, _q, _s);
      const c = new THREE.Vector3(...centro).applyMatrix4(obj.matrixWorld);
      const b = W.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(c.x, Math.max(c.y, 0.06), c.z).setRotation(v4(_q)).setLinearDamping(0.15).setAngularDamping(nombre === 'cabeza' ? 3 : 1.4).setCcdEnabled(nombre === 'cuerpo' || nombre === 'torso'));
      const m = medida.map(v => v * esc);
      const cd = forma === 'caja' ? RAPIER.ColliderDesc.cuboid(m[0], m[1], m[2]) : forma === 'bola' ? RAPIER.ColliderDesc.ball(m[0]) : RAPIER.ColliderDesc.capsule(m[0], m[1]);
      W.createCollider(cd.setDensity(nombre === 'torso' || nombre === 'cuerpo' ? 1050 : 1100).setFriction(0.9).setRestitution(0.05).setCollisionGroups(grupo(MUNECO, MUNDO | OBJETO | COCHE | ESCOMBRO)), b);
      const cuerpoM = new THREE.Matrix4().compose(new THREE.Vector3(c.x, Math.max(c.y, 0.06), c.z), _q.clone(), UNO);
      const local = cuerpoM.clone().invert().multiply(obj.matrixWorld);
      const seg = { nombre, obj, b, local, orig, padre };
      if (padre >= 0) {
        const P = segs[padre], pivote = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld);
        const a1 = pivote.clone().sub(vec(P.b.translation())).applyQuaternion(quat(P.b.rotation()).invert());
        const a2 = pivote.clone().sub(vec(b.translation())).applyQuaternion(quat(b.rotation()).invert());
        const datos = junta === 'bisagra' ? RAPIER.JointData.revolute(v3(a1), v3(a2), { x: 1, y: 0, z: 0 }) : RAPIER.JointData.spherical(v3(a1), v3(a2));
        const jt = W.createImpulseJoint(datos, P.b, b, true);
        if (junta === 'bisagra' && lim && jt.setLimits) jt.setLimits(lim[0], lim[1]);
      }
      segs.push(seg);
    }
    if (vel) for (const s of segs) s.b.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true);
    if (giro) { const eje = vel ? _p2.set(vel.z, 0, -vel.x).normalize().multiplyScalar(giro) : _p2.set(giro, 0, 0); segs[0].b.setAngvel(v3(eje), true); segs[1].b.setAngvel(v3(eje), true); }
    const M = { p, segs, t: 0, quieto: 0, cadera: new THREE.Vector3() };
    this.munecos.push(M);
    this.sincronizar(M);
    return M;
  }

  empujarMuneco(M, imp, punto) {
    if (!M || !M.segs) return;
    let mejor = M.segs[1], md = 1e9;
    if (punto) for (const s of M.segs) { const t = s.b.translation(), d = (t.x - punto.x) ** 2 + (t.y - punto.y) ** 2 + (t.z - punto.z) ** 2; if (d < md) { md = d; mejor = s; } }
    mejor.b.applyImpulse(v3(imp), true);
    M.quieto = 0; M.t = Math.min(M.t, 4);
  }

  sincronizar(M) {
    M.p.grupo.updateWorldMatrix(true, false);
    for (const s of M.segs) {
      const t = s.b.translation(), r = s.b.rotation();
      _m.compose(_p.set(t.x, t.y, t.z), _q.set(r.x, r.y, r.z, r.w), UNO).multiply(s.local);
      _m2.copy(s.obj.parent.matrixWorld).invert().multiply(_m);
      _m2.decompose(s.obj.position, s.obj.quaternion, s.obj.scale);
      s.obj.updateMatrix(); s.obj.matrixWorld.multiplyMatrices(s.obj.parent.matrixWorld, s.obj.matrix);
    }
    const c = M.segs[0].b.translation(); M.cadera.set(c.x, c.y, c.z);
  }

  soltar(M, restaurar = false) {
    if (!M) return;
    const i = this.munecos.indexOf(M);
    if (i >= 0) this.munecos.splice(i, 1);
    if (M.segs && this.mundo) for (const s of M.segs) if (s.b) { this.mundo.removeRigidBody(s.b); s.b = null; }
    if (restaurar && M.segs) for (const s of M.segs) { s.obj.position.copy(s.orig.p); s.obj.quaternion.copy(s.orig.q); s.obj.scale.copy(s.orig.s); }
    M.segs = restaurar ? null : M.segs;
    M.suelto = true;
  }

  onda(x, y, z, radio, fuerza) {
    if (!this.listo) return;
    const aplicar = (b, masa = 1) => { const t = b.translation(), dx = t.x - x, dy = t.y - y + 0.6, dz = t.z - z, d = Math.hypot(dx, dy, dz); if (d > radio || d < 0.01) return false; const k = fuerza * (1 - d / radio) * masa / d; b.applyImpulse({ x: dx * k, y: Math.abs(dy) * k + fuerza * 0.35 * masa * (1 - d / radio), z: dz * k }, true); b.applyTorqueImpulse({ x: (Math.random() - 0.5) * masa, y: (Math.random() - 0.5) * masa, z: (Math.random() - 0.5) * masa }, true); return true; };
    for (const o of this.objetos) aplicar(o.b, o.b.mass() * 0.9);
    for (const M of this.munecos) if (M.segs) for (const s of M.segs) if (s.b && aplicar(s.b, s.b.mass() * 0.5)) { M.quieto = 0; M.t = Math.min(M.t, 3); }
  }

  balazo(desde, hasta, daño = 20) {
    if (!this.listo) return null;
    const d = _p.copy(hasta).sub(desde), L = d.length();
    if (L < 0.01) return null;
    d.divideScalar(L);
    const hit = this.mundo.castRay(new RAPIER.Ray(v3(desde), v3(d)), L + 0.3, true, undefined, grupo(0xffff, OBJETO | MUNECO));
    if (!hit) return null;
    const b = hit.collider.parent(), pt = { x: desde.x + d.x * hit.timeOfImpact, y: desde.y + d.y * hit.timeOfImpact, z: desde.z + d.z * hit.timeOfImpact };
    const k = Math.min(60, 4 + daño * 0.5) * (b.mass() < 10 ? 0.35 : 1);
    b.applyImpulseAtPoint({ x: d.x * k, y: d.y * k + k * 0.15, z: d.z * k }, pt, true);
    for (const M of this.munecos) if (M.segs?.some(s => s.b === b)) { M.quieto = 0; M.t = Math.min(M.t, 4); }
    return new THREE.Vector3(pt.x, pt.y, pt.z);
  }

  escombro(malla, vel, giro, vida) {
    if (!this.listo) return false;
    const s = malla.scale.x, b = this.mundo.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(malla.position.x, malla.position.y, malla.position.z).setLinvel(vel.x, vel.y, vel.z).setAngvel(v3(giro)).setAngularDamping(0.4).setCcdEnabled(true));
    this.mundo.createCollider(RAPIER.ColliderDesc.cuboid(0.11 * s, 0.06 * s, 0.15 * s).setDensity(600).setFriction(0.8).setRestitution(0.3).setCollisionGroups(grupo(ESCOMBRO, MUNDO | OBJETO | COCHE | MUNECO)), b);
    this.escombros.push({ malla, b, vida });
    return true;
  }

  sincronizarCoches() {
    const vivos = new Set();
    for (const c of this.j.coches) {
      if (!c.t || c.tipo === 'lancha') continue;
      vivos.add(c);
      let b = this.coches.get(c);
      const alto = (c.t.alto || 0.6) + (c.t.cabina || 0.4) + 0.35;
      if (!b) {
        b = this.mundo.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(c.pos.x, (c.y || 0) + alto / 2 + 0.1, c.pos.z));
        this.mundo.createCollider(RAPIER.ColliderDesc.cuboid(c.t.ancho / 2, alto / 2, c.t.largo / 2).setCollisionGroups(grupo(COCHE, OBJETO | MUNECO | ESCOMBRO)), b);
        this.coches.set(c, b);
      }
      b.setNextKinematicTranslation({ x: c.pos.x, y: (c.y || 0) + alto / 2 + 0.1, z: c.pos.z });
      b.setNextKinematicRotation(v4(_q.setFromAxisAngle(_p.set(0, 1, 0), c.yaw)));
    }
    for (const [c, b] of this.coches) if (!vivos.has(c)) { this.mundo.removeRigidBody(b); this.coches.delete(c); }
    const vistos = new Set();
    if (jp0(this.j)) for (const q of this.j.peatones) {
      if (q.muerto || q.enInterior || q.vuela) continue;
      const P = this.j.jugador.posicion, d = Math.abs(q.pos.x - P.x) + Math.abs(q.pos.z - P.z);
      if (d > 70) continue;
      vistos.add(q);
      let b = this.gente.get(q);
      if (!b) { b = this.mundo.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(q.pos.x, 0.85, q.pos.z)); this.mundo.createCollider(RAPIER.ColliderDesc.capsule(0.5, 0.25).setCollisionGroups(grupo(COCHE, OBJETO | ESCOMBRO)), b); this.gente.set(q, b); }
      b.setNextKinematicTranslation({ x: q.pos.x, y: 0.85 + (q.y || 0), z: q.pos.z });
    }
    for (const [q, b] of this.gente) if (!vistos.has(q)) { this.mundo.removeRigidBody(b); this.gente.delete(q); }
    const J = this.j.jugador, jp = J?.pos;
    if (jp) {
      if (!this.pie) { this.pie = this.mundo.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(jp.x, 0.9, jp.z)); this.mundo.createCollider(RAPIER.ColliderDesc.capsule(0.55, 0.28).setCollisionGroups(grupo(COCHE, OBJETO | ESCOMBRO)), this.pie); }
      const fuera = J.coche || J.muerto || Math.abs(jp.x) > 1500;
      this.pie.setNextKinematicTranslation({ x: fuera ? 0 : jp.x, y: fuera ? -50 : 0.9 + (J.y || 0), z: fuera ? 0 : jp.z });
    }
  }

  actualizar(dt) {
    if (!this.listo) return;
    this.acum = Math.min(this.acum + dt, PASO * 4);
    if (this.acum < PASO) return;
    this.sincronizarCoches();
    let n = 0;
    while (this.acum >= PASO && n < 4) { this.mundo.step(); this.acum -= PASO; n++; }
    const t = dt;
    for (const M of [...this.munecos]) {
      M.t += t;
      this.sincronizar(M);
      const v = M.segs[1].b.linvel(), rapido = Math.hypot(v.x, v.y, v.z) > 0.15;
      M.quieto = rapido ? 0 : M.quieto + t;
      if (M.t > 12 || M.quieto > 1.5) this.soltar(M);
    }
    const tocados = new Set();
    for (const o of this.objetos) {
      if (o.b.isSleeping()) { if (o.despierto) { o.despierto = false; this.pintarObjeto(o); tocados.add(o.im); } continue; }
      if (!o.despierto) { o.despierto = true; const v = o.b.linvel(); if (Math.hypot(v.x, v.z) > 2.5) this.j.audio?.golpe?.(false); }
      this.pintarObjeto(o); tocados.add(o.im);
    }
    for (const im of tocados) im.instanceMatrix.needsUpdate = true;
    for (let i = this.escombros.length - 1; i >= 0; i--) {
      const e = this.escombros[i];
      e.vida -= dt;
      const tr = e.b.translation(), r = e.b.rotation();
      e.malla.position.set(tr.x, tr.y, tr.z); e.malla.quaternion.set(r.x, r.y, r.z, r.w);
      if (e.vida <= 0) { this.mundo.removeRigidBody(e.b); this.j.escena.remove(e.malla); this.escombros.splice(i, 1); }
    }
  }
}

function texCarton() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#b08458'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,40,20' : '230,200,160'},${Math.random() * 0.12})`; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 1); }
  g.fillStyle = 'rgba(200,170,110,0.85)'; g.fillRect(54, 0, 20, 128);
  g.strokeStyle = 'rgba(60,35,15,0.5)'; g.lineWidth = 2; g.strokeRect(1, 1, 126, 126);
  g.fillStyle = 'rgba(40,25,15,0.55)'; g.font = 'bold 14px sans-serif'; g.fillText('FRÁGIL', 10, 108);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function jp0(j) { return !!j.jugador?.posicion; }
function vec(v) { return new THREE.Vector3(v.x, v.y, v.z); }
function quat(r) { return new THREE.Quaternion(r.x, r.y, r.z, r.w); }
function v4(q) { return { x: q.x, y: q.y, z: q.z, w: q.w }; }
function unir(partes) {
  const pos = [], nor = [], idx = [], uvs = [];
  let base = 0;
  for (const g0 of partes) {
    const g = g0.index ? g0 : g0;
    const P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv?.array, I = g.index ? g.index.array : [...Array(P.length / 3).keys()];
    pos.push(...P); nor.push(...N); if (U) uvs.push(...U); else for (let k = 0; k < P.length / 3; k++) uvs.push(0, 0); for (const k of I) idx.push(k + base);
    base += P.length / 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
  return g;
}
