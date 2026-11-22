import * as THREE from 'three';
import { crearHumano } from './humanos.js?v=202611220227';

const SUPERIOR = /^(spine_0[123]|neck_01|head|clavicle_|upperarm_|lowerarm_|hand_|index_|middle_|ring_|pinky_|thumb_)/i;
const UNA_VEZ = new Set(['Roll', 'Death01', 'Punch_Jab', 'Punch_Cross', 'Pistol_Shoot', 'Pistol_Reload', 'Jump_Start', 'Jump_Land', 'Interact', 'Hit_Chest', 'Hit_Head', 'Sword_Attack', 'Sitting_Enter', 'Sitting_Exit', 'PickUp_Table']);
const RITMO = { Walk_Loop: 0.975, Jog_Fwd_Loop: 5.36, Sprint_Loop: 8.25, Crouch_Fwd_Loop: 0.75, Walk_Formal_Loop: 0.975 };
const LOCO = ['Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'];
const _yaw = new THREE.Quaternion(), _eje = new THREE.Vector3();
const FUEGO = ['pistola', 'subfusil', 'rifle', 'escopeta', 'revolver', 'recortada', 'ametralladora', 'francotirador', 'lanzacohetes'];
const PARES = [['cuerpo', 'pelvis'], ['torso', 'spine_01'], ['cabeza', 'head'], ['pi', 'thigh_l'], ['ri', 'calf_l'], ['pd', 'thigh_r'], ['rd', 'calf_r'], ['bi', 'upperarm_l'], ['ci', 'lowerarm_l'], ['bd', 'upperarm_r'], ['cd', 'lowerarm_r']];
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _m = new THREE.Matrix4();

function partir(clip, filtro, sufijo) {
  const pistas = clip.tracks.filter(t => filtro(t.name.split('.')[0]));
  return new THREE.AnimationClip(clip.name + sufijo, clip.duration, pistas);
}

class Locomocion {
  constructor(mixer, clips) { this.mixer = mixer; this.clips = clips; this.acc = {}; this.fase = 0; this.peso = 0; this.meta = 0; }
  accion(nombre) {
    let a = this.acc[nombre];
    if (!a) { a = this.mixer.clipAction(this.clips[nombre]); a.setLoop(THREE.LoopRepeat, Infinity); a.play(); a.setEffectiveTimeScale(0); a.setEffectiveWeight(0); this.acc[nombre] = a; }
    return a;
  }
  pesos(v) {
    const w = [0, 0, 0];
    if (v < 2.1) w[0] = 1;
    else if (v < 3.4) { const t = (v - 2.1) / 1.3; w[0] = 1 - t; w[1] = t; }
    else if (v < 6.4) w[1] = 1;
    else if (v < 7.2) { const t = (v - 6.4) / 0.8; w[1] = 1 - t; w[2] = t; }
    else w[2] = 1;
    return w;
  }
  actualizar(dt, v, inf, activo) {
    this.meta = activo ? 1 : 0;
    this.peso = Math.max(0, Math.min(1, this.peso + (this.meta ? 1 : -1) * dt / 0.2));
    if (this.peso < 0.002 && !activo) { for (const k in this.acc) this.acc[k].setEffectiveWeight(0); return; }
    const w = this.pesos(Math.max(0.3, v));
    let ciclo = 0, wt = 0;
    LOCO.forEach((n, i) => { if (w[i] > 0) { const r = Math.max(0.55, Math.min(1.7, v / RITMO[n])); ciclo += w[i] * this.clips[n].duration / r; wt += w[i]; } });
    ciclo = ciclo / (wt || 1);
    if (v > 0.05) this.fase = (this.fase + dt / Math.max(0.2, ciclo)) % 1;
    LOCO.forEach((n, i) => {
      for (const sfx of ['', '#inf']) {
        const nombre = n + sfx, quiero = (sfx === '#inf') === !!inf;
        if (!this.acc[nombre] && (!quiero || w[i] === 0)) continue;
        const a = this.accion(nombre);
        a.time = this.fase * this.clips[nombre].duration;
        a.setEffectiveWeight(quiero ? w[i] * this.peso : 0);
      }
    });
  }
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
    this.base = new Capa(H.mixer); this.arriba = new Capa(H.mixer); this.loco = new Locomocion(H.mixer, this.clips); this.inclina = 0;
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
    this.armas = [];
    const manos = new Set(p.manos || []);
    for (const k of Object.keys(p)) {
      const o = p[k];
      if (o && o.isObject3D && o.parent === p.md && k !== 'md' && !manos.has(o) && !this.armas.includes(o)) this.armas.push(o);
    }
    this.ocultarPersona(p);
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
    p.grupo.traverse(o => { if (o.isMesh && !this.esMio(o) && !this.esArma(o, p) && !this.esAccesorio(o, p)) { o.visible = false; o.userData.ocultoPorRealista = true; } });
    p.ocultaRealista = true;
  }
  esAccesorio(o, p) { let q = o; while (q && q !== p.grupo) { if (q.userData.siempreVisible) return true; q = q.parent; } return false; }
  esMio(o) { let q = o; while (q) { if (q === this.grupo) return true; q = q.parent; } return false; }
  esArma(o, p) { let q = o; while (q && q !== p.grupo) { if (this.armas?.includes(q) || q.parent === this.empunadura) return true; q = q.parent; } return false; }

  elegirJugador(j, dt) {
    const fuego = FUEGO.includes(j.arma), v = j.velocidad || 0;
    let base = 'Idle_Loop', escala = 1, veces = Infinity, sup = null, supVeces = Infinity, forzarSup = false, forzarBase = false;
    if (j.arrestado) base = 'Crouch_Idle_Loop';
    else if (j.sentado) base = j.sentado.pie ? 'Idle_Loop' : 'Sitting_Idle_Loop';
    else if (j.coche) base = 'Driving_Loop';
    else if (j.rueda) { base = 'Roll'; veces = 1; forzarBase = !this.rodando; this.rodando = true; }
    else if (j.y > 0.08) base = 'Jump_Loop';
    else if (j.agachado) { base = v > 0.3 ? 'Crouch_Fwd_Loop' : 'Crouch_Idle_Loop'; }
    else if (v < 0.25) base = j.gesto?.tipo === 'bailar' ? 'Dance_Loop' : j.gesto ? 'Idle_Talking_Loop' : 'Idle_Loop';
    else if (v < 2.8) base = 'Walk_Loop';
    else if (v < 6.8) base = 'Jog_Fwd_Loop';
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

  aplicar(e, dt = 0, v = 0) {
    const C = this.clips;
    const usarSup = e.sup && C[e.sup];
    const loco = LOCO.includes(e.base);
    this.loco.actualizar(dt, v, usarSup && e.base !== e.sup, loco);
    if (loco) this.base.quitar(0.2);
    else {
      const nb = usarSup && e.base !== e.sup ? e.base + '#inf' : e.base;
      const a = this.base.poner(C[nb] || C[e.base] || C.Idle_Loop, 0.2, e.veces, e.forzarBase);
      if (a && e.veces === Infinity) a.setEffectiveTimeScale(e.escala);
    }
    if (usarSup && e.base !== e.sup) this.arriba.poner(C[e.sup + '#sup'], 0.12, e.supVeces, e.forzarSup);
    else this.arriba.quitar(0.18);
  }

  actualizarJugador(j, dt, duo = null) {
    if (!this.listo) return;
    if (duo) Object.assign(j, { yaw: duo.yaw, sentado: duo.sentadoListo || null, p: duo.p, velocidad: duo.vel, apunta: duo.apunta > 0, disparando: false, arma: duo.apunta > 0 ? 'pistola' : 'puno', coche: duo.enMoto ? { tipo: 'moto' } : null, muerto: 0, y: 0, rueda: null, agachado: false, golpeT: 0, recargando: 0, gesto: null });
    if (j.p !== this.p) this.montar(j);
    if (j.muerto && j.muneco && !j.arrestado) { this.seguirMuneco(j.muneco, j.p); return; }
    this.soltarMuneco();
    this.grupo.position.y = j.coche?.tipo === 'moto' ? 0.34 : j.coche?.tipo === 'lancha' ? 0.18 : 0;
    if (j.muerto && !j.arrestado) this.aplicar({ base: 'Death01', escala: 1, veces: 1 }, dt, 0);
    else this.aplicar(this.elegirJugador(j, dt), dt, j.coche ? 0 : (j.velocidad || 0));
    this.H.mixer.update(dt);
    this.inclinar(j.yaw, dt, j.coche ? 0 : (j.velocidad || 0));
    const J = j.juego;
    if (J && !j.coche && !j.muerto && J.camara) { const cy = J.camYaw ?? 0; this._mira = this._mira || new THREE.Vector3(); const P = this.grupo.getWorldPosition(_v); this._mira.set(P.x + Math.sin(cy) * 10, 1.5 + Math.sin(J.camPitch || 0) * 6, P.z + Math.cos(cy) * 10); this.mirar(this._mira, dt, !(j.apunta || j.disparando) && (j.velocidad || 0) < 4.5); }
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

  mirar(destino, dt, activo) {
    this.pesoMira = (this.pesoMira || 0) + ((activo ? 1 : 0) - (this.pesoMira || 0)) * Math.min(1, dt * 4);
    if (this.pesoMira < 0.01 || !destino) return;
    const cab = this.huesos.head, cue = this.huesos.neck_01; if (!cab) return;
    this.grupo.updateWorldMatrix(true, false);
    const p = cab.getWorldPosition(_v), dx = destino.x - p.x, dz = destino.z - p.z, dy = (destino.y ?? p.y) - p.y;
    const yawC = Math.atan2(this.grupo.matrixWorld.elements[8], this.grupo.matrixWorld.elements[10]);
    let rel = Math.atan2(dx, dz) - yawC; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    if (Math.abs(rel) > 1.9) { this.pesoMira *= 0.9; return; }
    rel = Math.max(-1.05, Math.min(1.05, rel)) * this.pesoMira;
    const pit = Math.max(-0.35, Math.min(0.35, Math.atan2(dy, Math.hypot(dx, dz)))) * this.pesoMira;
    for (const [b, f] of [[cue, 0.4], [cab, 0.6]]) {
      if (!b) continue;
      b.parent.updateWorldMatrix(true, false); b.updateWorldMatrix(false, false);
      b.getWorldQuaternion(_q);
      _yaw.setFromAxisAngle(_eje.set(0, 1, 0), rel * f); _q.premultiply(_yaw);
      _eje.set(Math.cos(yawC + rel), 0, -Math.sin(yawC + rel)); _yaw.setFromAxisAngle(_eje, -pit * f); _q.premultiply(_yaw);
      b.parent.getWorldQuaternion(_q2); b.quaternion.copy(_q2.invert().multiply(_q)); b.updateMatrixWorld(true);
    }
  }

  inclinar(yaw, dt, v) {
    if (!isFinite(this.inclina)) this.inclina = 0;
    if (dt <= 0 || !isFinite(yaw)) return;
    let d = yaw - (this.yawAnt ?? yaw); d = Math.atan2(Math.sin(d), Math.cos(d)); this.yawAnt = yaw;
    const giro = d / dt, meta = Math.max(-0.22, Math.min(0.22, -giro * Math.min(1, v / 5) * 0.09));
    this.inclina += (meta - this.inclina) * Math.min(1, dt * 6);
    if (Math.abs(this.inclina) < 0.002) return;
    const pel = this.huesos.pelvis; if (!pel) return;
    this.grupo.updateWorldMatrix(true, false);
    _eje.set(0, 0, 1).transformDirection(this.grupo.matrixWorld);
    _yaw.setFromAxisAngle(_eje, this.inclina);
    pel.parent.updateWorldMatrix(true, false);
    pel.getWorldQuaternion(_q); _q.premultiply(_yaw);
    pel.parent.getWorldQuaternion(_q2); pel.quaternion.copy(_q2.invert().multiply(_q));
  }

  elegirPeaton(q) {
    const v = q.vel || 0, fuego = FUEGO.includes(q.arma), e = q.estado;
    let base = 'Idle_Loop', escala = 1, sup = null, supVeces = Infinity, forzarSup = false;
    if (e === 'sentado') base = q.banca?.pie ? 'Idle_Loop' : 'Sitting_Idle_Loop';
    else if (e === 'agachado') base = 'Crouch_Idle_Loop';
    else if (e === 'charla' || (q.limpiando && v < 0.2)) base = 'Idle_Talking_Loop';
    else if (v < 0.2) base = q.habito === 'celular' ? 'Idle_Talking_Loop' : 'Idle_Loop';
    else if (v < 2.8) base = 'Walk_Loop';
    else if (v < 6.8) base = 'Jog_Fwd_Loop';
    else base = 'Sprint_Loop';
    if (RITMO[base] && v > 0.2) escala = Math.max(0.6, Math.min(1.7, v / RITMO[base]));
    if ((e === 'atacar' || e === 'perseguir') && fuego && v < 3) { sup = 'Pistol_Aim_Neutral'; if (q.disparoT > (this.prevDisp ?? 0) + 0.01) { sup = 'Pistol_Shoot'; supVeces = 1; forzarSup = true; } this.prevDisp = q.disparoT || 0; }
    else if (e === 'atacar' && q.golpeT > 0) { sup = 'Punch_Cross'; supVeces = 1; forzarSup = q.golpeT > (this.prevGolpe ?? 0) + 0.01; this.prevGolpe = q.golpeT; }
    if (sup && v < 0.2) { base = sup; sup = null; }
    return { base, escala, veces: UNA_VEZ.has(base) ? 1 : Infinity, sup, supVeces, forzarSup, forzarBase: false };
  }

  actualizarPeaton(q, dt) {
    if (!this.listo) return;
    if (q.p !== this.p) this.montar({ p: q.p });
    if (q.muerto) { if (q.muneco && !q.muneco.suelto) this.seguirMuneco(q.muneco, q.p); else if (!q.muneco && !this.trapo) { this.aplicar({ base: 'Death01', escala: 1, veces: 1 }); this.H.mixer.update(dt); } return; }
    this.soltarMuneco();
    this.aplicar(this.elegirPeaton(q), dt, q.vel || 0);
    this.H.mixer.update(dt);
    this.inclinar(q.yaw, dt, q.vel || 0);
    const jp = q.juego?.jugador?.posicion;
    if (jp) { const d = Math.hypot(jp.x - q.pos.x, jp.z - q.pos.z); this._mira = this._mira || new THREE.Vector3(); this._mira.set(jp.x, 1.55, jp.z); this.mirar(this._mira, dt, d < 7 && q.estado !== 'huir' && q.estado !== 'sentado'); }
  }

  liberar() {
    const p = this.p;
    if (!p) return;
    for (const o of this.armas || []) if (o.parent === this.empunadura) { this.empunadura.remove(o); p.md?.add(o); }
    this.armas = [];
    p.grupo.traverse(o => { if (o.userData.ocultoPorRealista) { o.visible = true; delete o.userData.ocultoPorRealista; } });
    p.ocultaRealista = false; p.lod = null;
    this.grupo.parent?.remove(this.grupo);
    this.p = null; this.trapo = null; this.base.quitar(0); this.arriba.quitar(0); this.H.mixer.stopAllAction(); this.base.actual = null; this.arriba.actual = null;
  }

  teñirChamarra(color) {
    if (!this.listo) { this.promesa.then(() => this.teñirChamarra(color)); return; }
    let mat = null; this.raiz.traverse(o => { if (o.isMesh && /casualsuit05/.test([].concat(o.material)[0]?.name || '')) mat = [].concat(o.material)[0]; });
    if (!mat || !mat.map?.image) return;
    if (!this.mapaOriginal) this.mapaOriginal = mat.map;
    if (color === null) { if (mat.map !== this.mapaOriginal) { mat.map = this.mapaOriginal; mat.needsUpdate = true; } return; }
    const img = this.mapaOriginal.image, w = img.width, h = img.height;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, w, h), px = d.data;
    const T = new THREE.Color(color), th = {}; T.getHSL(th);
    const enZona = (x, y, zs) => zs.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
    const CAMISA = [[0.58, 0.03, 0.67, 0.30], [0.83, 0.25, 0.95, 0.55], [0.0, 0.11, 0.20, 0.22], [0.60, 0.55, 0.80, 0.62]], JEANS = [[0.0, 0.55, 0.62, 1.0]];
    const k = new THREE.Color(), hsl = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h, q = (y * w + x) * 4;
      if (enZona(u, v, CAMISA) || enZona(u, v, JEANS)) continue;
      const r = px[q] / 255, gg = px[q + 1] / 255, b = px[q + 2] / 255, l = Math.max(r, gg, b);
      if (l < 0.02) continue;
      k.setRGB(r, gg, b); k.getHSL(hsl);
      k.setHSL(th.h, th.s * 0.85, Math.min(0.92, th.l * (0.55 + hsl.l * 1.6)));
      px[q] = k.r * 255; px[q + 1] = k.g * 255; px[q + 2] = k.b * 255;
    }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = this.mapaOriginal.flipY; t.anisotropy = 8;
    mat.map = t; mat.needsUpdate = true;
  }

  soltarMuneco() { if (this.trapo) { this.trapo = null; this.base.actual = null; this.arriba.actual = null; } }
}
