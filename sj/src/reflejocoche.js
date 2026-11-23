import * as THREE from 'three';

export class ReflejoCoche {
  constructor(juego, tam = 128) {
    this.j = juego; this.cara = 0; this.coche = null; this.mats = []; this.listo = false; this.cuadro = 0;
    this.rt = new THREE.WebGLCubeRenderTarget(tam, { type: THREE.HalfFloatType, generateMipmaps: false });
    this.cam = new THREE.CubeCamera(0.7, 1100, this.rt);
  }

  poner(c) {
    if (c === this.coche) return;
    this.quitar();
    if (!c || c.tipo === 'lancha') return;
    this.coche = c; this.cara = 0; this.vueltas = 0;
    this.mats = [c.pinta, c.pintaCuerpo].filter(m => m && m.isMeshStandardMaterial);
  }

  quitar() {
    for (const m of this.mats) { if (m.envMap === this.rt.texture) { m.envMap = null; m.envMapIntensity = m.userData.envAntes ?? 1; m.needsUpdate = true; } }
    this.mats = []; this.coche = null;
  }

  actualizar() {
    const j = this.j, J = j.jugador, c = J.coche && !J.interior && j.nivel >= 3 && j.jugando && !j.pausado && !j.foto ? J.coche : null;
    if (c !== this.coche) this.poner(c);
    if (!this.coche || this.coche.quemado) { if (this.coche) this.quitar(); return; }
    if ((this.cuadro++ & 1) && this.vueltas > 0) return;
    const r = j.renderer, esc = j.escena, C = this.coche;
    this.cam.position.set(C.pos.x, (C.y || 0) + 1.25, C.pos.z);
    if (!this.listo) { this.listo = true; this.cam.update(r, esc); }
    this.cam.updateMatrixWorld(true);
    const rtAntes = r.getRenderTarget(), auto = r.shadowMap.autoUpdate, mw = esc.matrixWorldAutoUpdate, visC = C.grupo.visible, visJ = J.grupo.visible, duo = j.duo?.grupo, visD = duo?.visible;
    r.shadowMap.autoUpdate = false; esc.matrixWorldAutoUpdate = false; C.grupo.visible = false; J.grupo.visible = false; if (duo) duo.visible = false;
    const una = () => { r.setRenderTarget(this.rt, this.cara); r.render(esc, this.cam.children[this.cara]); this.cara = (this.cara + 1) % 6; if (this.cara === 0) { this.vueltas++; this.rt.texture.needsPMREMUpdate = true; } };
    if (this.vueltas === 0) { for (let k = 0; k < 6; k++) una(); } else una();
    r.setRenderTarget(rtAntes); r.shadowMap.autoUpdate = auto; esc.matrixWorldAutoUpdate = mw; C.grupo.visible = visC; J.grupo.visible = visJ; if (duo) duo.visible = visD;
    if (this.vueltas === 1 && this.cara === 0) for (const m of this.mats) { if (m.envMap !== this.rt.texture) { m.userData.envAntes = m.envMapIntensity; m.envMap = this.rt.texture; m.envMapIntensity = 1.15; m.needsUpdate = true; } }
  }
}
