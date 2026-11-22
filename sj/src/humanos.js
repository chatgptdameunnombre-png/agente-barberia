import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonar } from 'three/addons/utils/SkeletonUtils.js';

const cargador = new GLTFLoader();
const PELUDO = /eyebrow|eyelash|short0|long0|bob0|ponytail|braid|afro|hair/i;
let animaciones = null;
const modelos = new Map();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();

export function cargarAnimaciones() {
  return animaciones || (animaciones = cargador.loadAsync('assets/humanos/animaciones.glb').then(g => {
    const huesos = {};
    g.scene.traverse(o => { if (o.isBone || o.type === 'Object3D' || o.isObject3D) huesos[o.name.toLowerCase()] = o; });
    g.scene.updateMatrixWorld(true);
    const reposo = {};
    for (const k in huesos) { const o = huesos[k]; reposo[k] = { q: o.getWorldQuaternion(new THREE.Quaternion()), p: o.getWorldPosition(new THREE.Vector3()), lq: o.quaternion.clone(), lp: o.position.clone() }; }
    return { escena: g.scene, clips: g.animations, huesos, reposo };
  }));
}

export let ANISO = 8;
export function configurar(renderer) { ANISO = renderer.capabilities.getMaxAnisotropy?.() || 8; }
function prepararMateriales(raiz) {
  raiz.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = !/eyebrow|eyelash|low-poly|high-poly|teeth|tongue/i.test(o.name); o.receiveShadow = true; o.frustumCulled = false;
    const lista = [].concat(o.material).map(m => {
      for (const k of ['map', 'normalMap', 'roughnessMap', 'aoMap']) if (m[k]) { m[k].anisotropy = ANISO; m[k].needsUpdate = true; }
      if (PELUDO.test(m.name)) { m.transparent = false; m.alphaTest = 0.35; m.alphaToCoverage = true; m.side = THREE.DoubleSide; m.depthWrite = true; m.roughness = 0.6; return m; }
      m.transparent = false; m.alphaTest = 0; m.opacity = 1; m.depthWrite = true;
      if (/ojos|low-poly|high-poly/i.test(m.name)) { m.roughness = 0.12; return m; }
      m.metalness = 0;
      if (/body|skin|^Human$/i.test(m.name) || o.name === 'Human') {
        const p = new THREE.MeshPhysicalMaterial(); THREE.MeshStandardMaterial.prototype.copy.call(p, m); p.defines = { STANDARD: '', PHYSICAL: '' };
        p.roughness = 0.52; p.sheen = 0.35; p.sheenRoughness = 0.55; p.sheenColor = new THREE.Color('#ff8a70'); p.clearcoat = 0.04; p.clearcoatRoughness = 0.6;
        return p;
      }
      m.roughness = Math.max(m.roughness ?? 0.7, 0.6);
      return m;
    });
    o.material = Array.isArray(o.material) ? lista : lista[0];
  });
}

function retargetear(clip, A, destino) {
  const huesosD = {}, ordenD = [];
  destino.traverse(o => { if (o.isBone) { huesosD[o.name.toLowerCase()] = o; ordenD.push(o); } });
  destino.updateMatrixWorld(true);
  const reposoD = {};
  for (const o of ordenD) reposoD[o.name] = { q: o.getWorldQuaternion(new THREE.Quaternion()), lq: o.quaternion.clone(), lp: o.position.clone(), p: o.getWorldPosition(new THREE.Vector3()) };
  const pelvisS = A.reposo.pelvis, pelvisD = reposoD[huesosD.pelvis?.name];
  const k = pelvisS && pelvisD ? pelvisD.p.y / pelvisS.p.y : 1;
  const mixer = new THREE.AnimationMixer(A.escena), accion = mixer.clipAction(clip);
  accion.play();
  const fps = 30, n = Math.max(2, Math.round(clip.duration * fps) + 1), tiempos = new Float32Array(n);
  const valores = {}; for (const o of ordenD) valores[o.name] = new Float32Array(n * 4);
  const pos = new Float32Array(n * 3);
  const mundo = new Map();
  for (let f = 0; f < n; f++) {
    const t = Math.min(clip.duration, f / fps); tiempos[f] = t;
    mixer.setTime(t); A.escena.updateMatrixWorld(true);
    mundo.clear();
    for (const o of ordenD) {
      const nom = o.name.toLowerCase(), S = A.huesos[nom], R = reposoD[o.name];
      const padreQ = o.parent && mundo.has(o.parent) ? mundo.get(o.parent) : (o.parent ? o.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion());
      let qw;
      if (S && A.reposo[nom]) { S.matrixWorld.decompose(_p, _q, _s); qw = _q.clone().multiply(_q2.copy(A.reposo[nom].q).invert()).multiply(R.q); }
      else qw = padreQ.clone().multiply(R.lq);
      mundo.set(o, qw);
      const local = padreQ.clone().invert().multiply(qw);
      valores[o.name].set([local.x, local.y, local.z, local.w], f * 4);
    }
    if (pelvisS && pelvisD) {
      const S = A.huesos.pelvis; _p.setFromMatrixPosition(S.matrixWorld);
      const w = pelvisD.p.clone().add(_p.sub(pelvisS.p).multiplyScalar(k));
      const P = huesosD.pelvis.parent; _m.copy(P.matrixWorld).invert(); w.applyMatrix4(_m);
      pos.set([w.x, w.y, w.z], f * 3);
    }
  }
  mixer.stopAllAction(); mixer.uncacheRoot(A.escena);
  const pistas = ordenD.map(o => new THREE.QuaternionKeyframeTrack(o.name + '.quaternion', tiempos, valores[o.name]));
  if (pelvisD) pistas.push(new THREE.VectorKeyframeTrack(huesosD.pelvis.name + '.position', tiempos, pos));
  return new THREE.AnimationClip(clip.name, clip.duration, pistas);
}

export async function cargarModelo(nombre) {
  if (modelos.has(nombre)) return modelos.get(nombre);
  const promesa = Promise.all([cargador.loadAsync(`assets/humanos/${nombre}.glb`), cargarAnimaciones()]).then(([g, A]) => {
    prepararMateriales(g.scene);
    const clips = {};
    for (const c of A.clips) clips[c.name] = retargetear(c, A, g.scene);
    return { escena: g.scene, clips };
  });
  modelos.set(nombre, promesa);
  return promesa;
}

function acotar(raiz) {
  let base = null, r0 = 0;
  raiz.traverse(o => { if (o.isSkinnedMesh) { const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (g.boundingSphere.radius > r0) { r0 = g.boundingSphere.radius; base = o; } } });
  if (!base) return;
  raiz.traverse(o => { if (o.isSkinnedMesh && o.parent === base.parent) { o.boundingSphere = base.geometry.boundingSphere.clone(); o.boundingSphere.radius *= 2.2; o.frustumCulled = true; o.userData.acotado = true; } });
}

export function recorte(H, si) { H.raiz.traverse(o => { if (o.userData.acotado) o.frustumCulled = si; }); }

export async function crearHumano(nombre) {
  const M = await cargarModelo(nombre);
  const raiz = clonar(M.escena);
  acotar(raiz);
  const mixer = new THREE.AnimationMixer(raiz);
  const acciones = {};
  const H = { grupo: new THREE.Group(), raiz, mixer, clips: M.clips, actual: null };
  H.grupo.add(raiz);
  H.tocar = (clip, fundido = 0.25, veces = Infinity, forzar = false) => {
    if (H.actual === clip && !forzar) return;
    const c = M.clips[clip]; if (!c) return;
    const a = acciones[clip] || (acciones[clip] = mixer.clipAction(c));
    for (const k in acciones) { const o = acciones[k]; if (k !== clip && o.enabled && o.getEffectiveWeight() > 0.001) o.fadeOut(fundido); }
    a.reset(); a.setLoop(veces === Infinity ? THREE.LoopRepeat : THREE.LoopOnce, veces); a.clampWhenFinished = veces !== Infinity;
    a.setEffectiveWeight(1); a.fadeIn(fundido).play();
    H.actual = clip;
  };
  H.actualizar = dt => mixer.update(dt);
  return H;
}

export function ponerMascara(h, color = '#c9ced6', borde = '#2a5ab8') {
  let cab = null; h.raiz.traverse(o => { if (o.isBone && o.name.toLowerCase() === 'head') cab = o; });
  if (!cab) return null;
  h.grupo.updateMatrixWorld(true);
  const qb = cab.getWorldQuaternion(new THREE.Quaternion()), qr = h.grupo.getWorldQuaternion(new THREE.Quaternion()), inv = qb.clone().invert();
  const f = new THREE.Vector3(0, 0, 1).applyQuaternion(qr).applyQuaternion(inv).normalize();
  const u0 = new THREE.Vector3(0, 1, 0).applyQuaternion(qr).applyQuaternion(inv);
  const s = new THREE.Vector3().crossVectors(u0, f).normalize(), u = new THREE.Vector3().crossVectors(f, s).normalize();
  const ws = cab.getWorldScale(new THREE.Vector3()).x || 1, k = 1 / ws;
  const g = new THREE.Group(); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(s, u, f)); g.scale.setScalar(k); cab.add(g);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 }), matB = new THREE.MeshStandardMaterial({ color: borde, roughness: 0.4 }), blanco = new THREE.MeshBasicMaterial({ color: '#f4f2ec' }), negro = new THREE.MeshBasicMaterial({ color: '#141418' });
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.118, 20, 16), mat); cabeza.scale.set(1.0, 1.42, 1.12); cabeza.position.set(0, 0.04, 0.012); g.add(cabeza);
  const cresta = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.012, 6, 24, Math.PI), matB); cresta.rotation.set(0, Math.PI / 2, 0); cresta.scale.set(1.12, 1.42, 1); cresta.position.set(0, 0.04, 0.012); g.add(cresta);
  for (const sx of [-1, 1]) {
    const aro = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), matB); aro.scale.set(1.25, 0.8, 1); aro.position.set(sx * 0.04, 0.082, 0.1365); aro.rotation.y = sx * 0.28; g.add(aro);
    const ojo = new THREE.Mesh(new THREE.CircleGeometry(0.02, 14), blanco); ojo.scale.set(1.3, 0.75, 1); ojo.position.set(sx * 0.04, 0.082, 0.1385); ojo.rotation.y = sx * 0.28; g.add(ojo);
    const pupila = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), negro); pupila.position.set(sx * 0.039, 0.081, 0.14); pupila.rotation.y = sx * 0.28; g.add(pupila);
  }
  const boca = new THREE.Mesh(new THREE.CircleGeometry(0.022, 14), matB); boca.scale.set(1.4, 0.6, 1); boca.position.set(0, -0.005, 0.1425); g.add(boca);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function pegarAHueso(h, nombre) {
  let b = null; h.raiz.traverse(o => { if (o.isBone && o.name.toLowerCase() === nombre) b = o; });
  if (!b) return null;
  h.grupo.updateMatrixWorld(true);
  const qb = b.getWorldQuaternion(new THREE.Quaternion()), qr = h.grupo.getWorldQuaternion(new THREE.Quaternion()), inv = qb.clone().invert();
  const f = new THREE.Vector3(0, 0, 1).applyQuaternion(qr).applyQuaternion(inv).normalize();
  const u0 = new THREE.Vector3(0, 1, 0).applyQuaternion(qr).applyQuaternion(inv);
  const s = new THREE.Vector3().crossVectors(u0, f).normalize(), u = new THREE.Vector3().crossVectors(f, s).normalize();
  const ws = b.getWorldScale(new THREE.Vector3()).x || 1;
  const g = new THREE.Group(); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(s, u, f)); g.scale.setScalar(1 / ws); b.add(g);
  const pb = b.getWorldPosition(new THREE.Vector3()), pr = h.grupo.getWorldPosition(new THREE.Vector3());
  g.userData.alto = (pb.y - pr.y) / (h.grupo.getWorldScale(new THREE.Vector3()).y || 1);
  return g;
}

export function ponerNovia(h) {
  const blanco = new THREE.MeshStandardMaterial({ color: '#f7f3ea', roughness: 0.62, side: THREE.DoubleSide });
  const cad = pegarAHueso(h, 'pelvis');
  if (cad) {
    const piso = -(cad.userData.alto || 0.95);
    const pts = [[0.165, 0.1], [0.2, 0.0], [0.25, -0.18], [0.33, -0.42], [0.43, -0.68], [0.52, piso + 0.12], [0.56, piso + 0.02]].map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(pts, 40);
    const P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(x, z), k = Math.max(0, -y) / Math.max(0.5, -piso);
      const pl = 1 + Math.sin(a * 14) * 0.035 * k;
      P.setXYZ(i, x * pl, y, z * pl * (z < 0 ? 1 + k * k * 0.55 : 1));
    }
    geo.computeVertexNormals();
    const falda = new THREE.Mesh(geo, blanco); cad.add(falda);
    const cinta = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 6, 28).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e8d6a8', roughness: 0.4, metalness: 0.3 })); cinta.position.y = 0.09; cad.add(cinta);
    falda.castShadow = true;
  }
  const cab = pegarAHueso(h, 'head');
  if (cab) {
    const pts = [[0.1, 0.2], [0.14, 0.12], [0.18, -0.05], [0.24, -0.3], [0.3, -0.62]].map(([r, y]) => new THREE.Vector2(r, y));
    const velo = new THREE.Mesh(new THREE.LatheGeometry(pts, 24, Math.PI * 0.55, Math.PI * 0.9), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    velo.position.set(0, -0.04, -0.035); cab.add(velo);
    const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#f0e0b0', roughness: 0.25, metalness: 0.8 }));
    tiara.rotation.set(-0.5, 0, 0); tiara.position.set(0, 0.105, 0.015); cab.add(tiara);
  }
  const mano = pegarAHueso(h, 'hand_r');
  if (mano) {
    const r = new THREE.Group(); r.position.set(0, -0.06, 0.07); mano.add(r);
    r.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.16, 6).translate(0, -0.06, 0), new THREE.MeshStandardMaterial({ color: '#4a7a3a', roughness: 0.8 })));
    const cols = ['#ffffff', '#f6d8e0', '#e86a8a', '#ffffff', '#f2e8c8'];
    for (let k = 0; k < 14; k++) { const a = k * 2.4, rr = k < 1 ? 0 : 0.035 + (k % 3) * 0.018; const f = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), new THREE.MeshStandardMaterial({ color: cols[k % cols.length], roughness: 0.7 })); f.position.set(Math.cos(a) * rr, 0.04 - rr * 0.4, Math.sin(a) * rr); r.add(f); }
  }
}
