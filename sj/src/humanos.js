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
    o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
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

export async function crearHumano(nombre) {
  const M = await cargarModelo(nombre);
  const raiz = clonar(M.escena);
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
