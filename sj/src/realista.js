import * as THREE from 'three';
import { crearHumano } from './humanos.js?v=202611212207';

const SUPERIOR = /^(spine_0[123]|neck_01|head|clavicle_|upperarm_|lowerarm_|hand_|index_|middle_|ring_|pinky_|thumb_)/i;
const UNA_VEZ = new Set(['Roll', 'Death01', 'Punch_Jab', 'Punch_Cross', 'Pistol_Shoot', 'Pistol_Reload', 'Jump_Start', 'Jump_Land', 'Interact', 'Hit_Chest', 'Hit_Head', 'Sword_Attack', 'Sitting_Enter', 'Sitting_Exit', 'PickUp_Table']);
const RITMO = { Walk_Loop: 1.35, Jog_Fwd_Loop: 3.3, Sprint_Loop: 6.2, Crouch_Fwd_Loop: 1.3, Walk_Formal_Loop: 1.3 };
const FUEGO = ['pistola', 'subfusil', 'rifle', 'escopeta', 'revolver', 'recortada', 'ametralladora', 'francotirador', 'lanzacohetes'];
const PARES = [['cuerpo', 'pelvis'], ['torso', 'spine_01'], ['cabeza', 'head'], ['pi', 'thigh_l'], ['ri', 'calf_l'], ['pd', 'thigh_r'], ['rd', 'calf_r'], ['bi', 'upperarm_l'], ['ci', 'lowerarm_l'], ['bd', 'upperarm_r'], ['cd', 'lowerarm_r']];
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _m = new THREE.Matrix4();

function partir(clip, filtro, sufijo) {
  const pistas = clip.tracks.filter(t => filtro(t.name.split('.')[0]));
  return new THREE.AnimationClip(clip.name + sufijo, clip.duration, pistas);
}

class Capa {
  constructor(mixer) { this.mixer = mixer; this.acciones = new Map(); this.actual = null; }
  poner(clip, fundido = 0.22, veces = Infinity, forzar = false) {
    if (!clip) return this.quitar(fundido);
    if (this.actual?.getClip() === clip && !forzar) return this.actual;
    let a = this.acciones.get(clip);
    if (!a) { a = this.mixer.clipAction(clip); this.acciones.set(clip, a); }
    if (this.actual && this.actual !== a) this.actual.fadeOut(fundido);
    a.reset(); a.setLoop(veces === Infinity ? THREE.LoopRepeat : THREE.LoopOnce, veces); a.clampWhenFinished = veces !== Infinity;
    a.setEffectiveTimeScale(1); a.setEffectiveWeight(1); a.fadeIn(fundido).play();
    this.actual = a;
    return a;
  }
  quitar(fundido = 0.22) { if (this.actual) this.actual.fadeOut(fundido); this.actual = null; }
}

export class Realista {
  constructor(nombre) { this.nombre = nombre; this.listo = false; this.promesa = this.cargar(); }

  async cargar() {
    const H = this.H = await crearHumano(this.nombre);
    this.raiz = H.raiz; this.grupo = H.grupo;
    this.huesos = {}; H.raiz.traverse(o => { if (o.isBone) this.huesos[o.name.toLowerCase()] = o; });
    this.clips = {};
    for (const k in H.clips) {
      const c = H.clips[k];
      this.clips[k] = c;
      this.clips[k + '#sup'] = partir(c, n => SUPERIOR.test(n), '#sup');
      this.clips[k + '#inf'] = partir(c, n => !SUPERIOR.test(n), '#inf');
    }
    this.base = new Capa(H.mixer); this.arriba = new Capa(H.mixer);
    this.empunadura = new THREE.Group(); this.huesos.hand_r?.add(this.empunadura);
    this.calibrarMano();
    this.listo = true;
  }

  calibrarMano() {
    const H = this.H, a = H.mixer.clipAction(H.clips.Pistol_Aim_Neutral || H.clips.Idle_Loop);
    a.play(); H.mixer.update(0); this.raiz.updateMatrixWorld(true);
    const mano = this.huesos.hand_r, medio = this.huesos.middle_01_r;
    this.manoAim = mano.getWorldQuaternion(new THREE.Quaternion());
    const palma = medio ? medio.getWorldPosition(new THREE.Vector3()).lerp(mano.getWorldPosition(new THREE.Vector3()), 0.45) : mano.getWorldPosition(new THREE.Vector3());
    this.empunadura.position.copy(mano.worldToLocal(palma.clone()));
    a.stop(); H.mixer.uncacheAction(a.getClip());
  }

  montar(j) {
    this.j = j; const p = j.p;
    for (const o of this.armas || []) if (o.parent === this.empunadura) { this.empunadura.remove(o); if (this.p && this.p.md) this.p.md.add(o); }
    this.p = p;
    if (this.grupo.parent !== p.grupo) p.grupo.add(this.grupo);
    this.ocultarPersona(p);
    this.armas = [];
    for (const k of Object.keys(p)) {
      const o = p[k];
      if (o && o.isObject3D && o.parent === p.md && k !== 'md') this.armas.push(o);
    }
    if (this.armas.length) {
      const g = p.grupo; g.updateMatrixWorld(true);
      const prevA = p.bd.rotation.clone(), prevC = p.cd.rotation.x;
      p.bd.rotation.set(-Math.PI / 2, 0, 0); p.cd.rotation.x = 0; g.updateMatrixWorld(true);
      const qMano = p.md.getWorldQuaternion(new THREE.Quaternion()), qG = g.getWorldQuaternion(new THREE.Quaternion());
      const relPersona = qG.clone().invert().multiply(qMano);
      this.empunadura.quaternion.copy(this.manoAim.clone().invert().multiply(relPersona));
      p.bd.rotation.copy(prevA); p.cd.rotation.x = prevC;
      for (const o of this.armas) this.empunadura.add(o);
    }
  }

  ocultarPersona(p) {
    p.grupo.traverse(o => { if (o.isMesh && !this.esMio(o) && !this.esArma(o, p)) { o.visible = false; o.userData.ocultoPorRealista = true; } });
    p.ocultaRealista = true;
  }
  esMio(o) { let q = o; while (q) { if (q === this.grupo) return true; q = q.parent; } return false; }
  esArma(o, p) { let q = o; while (q && q !== p.grupo) { if (q.parent === p.md || q.parent === this.empunadura) return true; q = q.parent; } return false; }

  elegirJugador(j, dt) {
    const fuego = FUEGO.includes(j.arma), v = j.velocidad || 0;
    let base = 'Idle_Loop', escala = 1, veces = Infinity, sup = null, supVeces = Infinity, forzarSup = false, forzarBase = false;
    if (j.arrestado) base = 'Crouch_Idle_Loop';
    else if (j.coche) base = 'Driving_Loop';
    else if (j.rueda) { base = 'Roll'; veces = 1; forzarBase = !this.rodando; this.rodando = true; }
    else if (j.y > 0.08) base = 'Jump_Loop';
    else if (j.agachado) { base = v > 0.3 ? 'Crouch_Fwd_Loop' : 'Crouch_Idle_Loop'; }
    else if (v < 0.25) base = j.gesto?.tipo === 'bailar' ? 'Dance_Loop' : j.gesto ? 'Idle_Talking_Loop' : 'Idle_Loop';
    else if (v < 3) base = 'Walk_Loop';
    else if (v < 5.4) base = 'Jog_Fwd_Loop';
    else base = 'Sprint_Loop';
    if (!j.rueda) this.rodando = false;
    if (RITMO[base] && v > 0.25) escala = Math.max(0.6, Math.min(1.6, v / RITMO[base]));
    if (!j.coche && !j.rueda && !j.arrestado) {
      if (j.golpeT > 0 && !fuego) {
        if (j.golpeT > (this.prevGolpe ?? 0) + 0.01) forzarSup = true;
        sup = (j.combo || 0) % 2 ? 'Punch_Cross' : 'Punch_Jab'; supVeces = 1;
        if (v < 0.25) { base = sup; veces = 1; forzarBase = forzarSup; sup = null; }
      } else if (fuego && (j.apunta || j.disparando)) {
        const pitch = this.j?.juego?.camPitch || 0;
        sup = j.recargando > 0 ? 'Pistol_Reload' : pitch > 0.35 ? 'Pistol_Aim_Up' : pitch < -0.35 ? 'Pistol_Aim_Down' : 'Pistol_Aim_Neutral';
        if (j.recargando > 0) supVeces = 1;
      } else if (fuego && j.recargando > 0) { sup = 'Pistol_Reload'; supVeces = 1; }
      else if (fuego && v < 0.25 && !j.gesto) base = 'Pistol_Idle_Loop';
    }
    this.prevGolpe = j.golpeT || 0;
    return { base, escala, veces, sup, supVeces, forzarSup, forzarBase };
  }

  aplicar(e) {
    const C = this.clips;
    const usarSup = e.sup && C[e.sup];
    const nb = usarSup && e.base !== e.sup ? e.base + '#inf' : e.base;
    const a = this.base.poner(C[nb] || C[e.base] || C.Idle_Loop, 0.2, e.veces, e.forzarBase);
    if (a && e.veces === Infinity) a.setEffectiveTimeScale(e.escala);
    if (usarSup && e.base !== e.sup) this.arriba.poner(C[e.sup + '#sup'], 0.12, e.supVeces, e.forzarSup);
    else this.arriba.quitar(0.18);
  }

  actualizarJugador(j, dt, duo = null) {
    if (!this.listo) return;
    if (duo) Object.assign(j, { p: duo.p, velocidad: duo.vel, apunta: duo.apunta > 0, disparando: false, arma: duo.apunta > 0 ? 'pistola' : 'puno', coche: duo.enMoto ? { tipo: 'moto' } : null, muerto: 0, y: 0, rueda: null, agachado: false, golpeT: 0, recargando: 0, gesto: null });
    if (j.p !== this.p) this.montar(j);
    if (j.muerto && j.muneco && !j.arrestado) { this.seguirMuneco(j.muneco, j.p); return; }
    this.soltarMuneco();
    this.grupo.position.y = j.coche?.tipo === 'moto' ? 0.34 : j.coche?.tipo === 'lancha' ? 0.18 : 0;
    if (j.muerto && !j.arrestado) this.aplicar({ base: 'Death01', escala: 1, veces: 1 });
    else this.aplicar(this.elegirJugador(j, dt));
    this.H.mixer.update(dt);
  }

  seguirMuneco(M, p) {
    if (!this.trapo) {
      this.raiz.updateMatrixWorld(true); p.grupo.updateMatrixWorld(true);
      const pares = [];
      for (const [a, b] of PARES) { const o = p[a], h = this.huesos[b]; if (o && h) pares.push({ o, h, qo: o.getWorldQuaternion(new THREE.Quaternion()), qh: h.getWorldQuaternion(new THREE.Quaternion()) }); }
      const pel = this.huesos.pelvis;
      this.trapo = { pares, m0: p.cuerpo.matrixWorld.clone(), pel0: pel.getWorldPosition(new THREE.Vector3()) };
      this.base.quitar(0); this.arriba.quitar(0); this.H.mixer.stopAllAction();
    }
    const T = this.trapo;
    p.grupo.updateMatrixWorld(true);
    for (const par of T.pares) {
      par.o.getWorldQuaternion(_q);
      const qw = _q.multiply(_q2.copy(par.qo).invert()).multiply(par.qh);
      const padre = par.h.parent; padre.updateWorldMatrix(true, false); padre.getWorldQuaternion(_q2);
      par.h.quaternion.copy(_q2.invert().multiply(qw));
      par.h.updateMatrixWorld(true);
    }
    _m.copy(p.cuerpo.matrixWorld).multiply(_m.clone().copy(T.m0).invert());
    _v.copy(T.pel0).applyMatrix4(_m);
    const pel = this.huesos.pelvis; pel.parent.updateWorldMatrix(true, false);
    pel.position.copy(pel.parent.worldToLocal(_v.clone()));
  }

  soltarMuneco() { if (this.trapo) { this.trapo = null; this.base.actual = null; this.arriba.actual = null; } }
}
