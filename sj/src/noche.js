import * as THREE from 'three';
import { Peaton } from './peatones.js?v=202611221927';
import { ARMERIAS } from './armerias.js?v=202611221927';
import { JOYERIA } from './joyeria.js?v=202611221927';

const NEON = {
  cantina: { lineas: ['CANTINA', 'LA JACARANDA'], c1: '#ffb347', c2: '#ff5a3a', flecha: true, w: 3.4, h: 1.25 },
  antro: { lineas: ['NEÓN', 'DISCO'], c1: '#ff4fd8', c2: '#3fd2ff', w: 3.0, h: 1.3, ciclo: true },
  arena: { lineas: ['LUCHA', 'LIBRE'], c1: '#ffd23a', c2: '#ff3b3b', w: 3.0, h: 1.3, ciclo: true },
  gimnasio: { lineas: ['GYM', 'ABIERTO'], c1: '#4fe08a', c2: '#ffffff', w: 2.4, h: 1.0 },
  barberia: { lineas: ['BARBERÍA'], c1: '#ff6b6b', c2: '#5ab0ff', w: 2.6, h: 0.8, flecha: true },
  ropa: { lineas: ['BOUTIQUE'], c1: '#e86fa8', c2: '#ffffff', w: 2.6, h: 0.8 },
  cine: { lineas: ['CINE', 'JACARANDA'], c1: '#ffcf5a', c2: '#ff3b5a', w: 3.0, h: 1.3, ciclo: true },
  maquinitas: { lineas: ['MAQUINITAS'], c1: '#3fd2ff', c2: '#ff4fd8', w: 3.0, h: 0.9, ciclo: true },
  ...Object.fromEntries(Object.entries(ARMERIAS).map(([k, v]) => [k, v.neon])),
  joyeria: JOYERIA.neon,
  mercado: null, templo: null, depa: { lineas: ['DEPAS', 'JACARANDA'], c1: '#b46bff', c2: '#ffffff', w: 2.4, h: 1.0 }
};

function textura(def, fase) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * def.h / def.w); const x = c.getContext('2d'), W = c.width, H = c.height;
  const tubo = (col, ancho, fn) => { x.save(); x.shadowColor = col; x.shadowBlur = 22; x.strokeStyle = col; x.lineWidth = ancho; fn(); x.shadowBlur = 0; x.strokeStyle = '#ffffff'; x.lineWidth = ancho * 0.35; fn(); x.restore(); };
  const borde = () => { x.beginPath(); x.roundRect(14, 14, W - 28, H - 28, 26); x.stroke(); };
  tubo(fase && def.ciclo ? def.c2 : def.c1, 7, borde);
  const n = def.lineas.length;
  def.lineas.forEach((t, i) => {
    const tam = n === 1 ? H * 0.46 : i === 0 ? H * 0.38 : H * 0.24, y = n === 1 ? H / 2 : i === 0 ? H * 0.4 : H * 0.74;
    const col = i === 0 ? (fase && def.ciclo ? def.c1 : def.c2) : def.c1;
    x.font = `900 ${tam | 0}px Inter, Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.save(); x.shadowColor = col; x.shadowBlur = 26; x.fillStyle = col; x.fillText(t, W / 2, y, W - 70); x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillText(t, W / 2, y, W - 70); x.restore();
  });
  if (def.flecha && fase) tubo(def.c2, 6, () => { x.beginPath(); x.moveTo(W - 70, H - 46); x.lineTo(W - 34, H - 30); x.lineTo(W - 70, H - 14); x.stroke(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

let _charco = null;
function charcoTex() {
  if (_charco) return _charco;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_charco = new THREE.CanvasTexture(c));
}

export class Noche {
  constructor(juego) {
    this.j = juego; this.letreros = []; this.grupos = []; this.t = 0; this.tg = 0;
    const tiendas = juego.interiores?.tiendas || [];
    for (const t of tiendas) {
      const def = t.tipo === 'tienda' ? { lineas: ['ABIERTO'], c1: ['#ff3b5a', '#3fd2ff', '#4fe08a'][this.letreros.length % 3], c2: '#ffffff', w: 1.3, h: 0.46, chico: true } : NEON[t.tipo];
      if (!def || !t.puerta || t.interior?.ox === undefined && !t.puerta) continue;
      const tx = [textura(def, 0), textura(def, 1)];
      const mat = new THREE.MeshBasicMaterial({ map: tx[0], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const yaw = Math.atan2(t.fx, t.fz), lx = t.fz, lz = -t.fx;
      let m;
      if (def.chico) {
        m = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.h), mat);
        m.position.set(t.puerta.x + t.fx * 0.16 + lx * 1.35, 2.15, t.puerta.z + t.fz * 0.16 + lz * 1.35); m.rotation.y = yaw;
      } else {
        const sw = def.w * 0.62, sh = def.h * 0.62, sale = sw / 2 + 0.25;
        m = new THREE.Group();
        for (const k of [0, 1]) { const q = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mat); q.rotation.y = k * Math.PI; q.position.x = k ? -0.012 : 0.012; q.renderOrder = 3; m.add(q); }
        const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, sale + 0.1), new THREE.MeshStandardMaterial({ color: '#2a2a2e', metalness: 0.6, roughness: 0.4 })); brazo.position.set(0, sh / 2 + 0.06, -sale / 2 + 0.05); m.add(brazo);
        m.position.set(t.puerta.x + t.fx * sale - lx * 1.75, 3.0 + sh / 2, t.puerta.z + t.fz * sale - lz * 1.75); m.rotation.y = yaw + Math.PI / 2;
        m.material = mat;
      }
      m.renderOrder = 3;
      juego.escena.add(m);
      const ch = new THREE.Mesh(new THREE.PlaneGeometry(def.w * 1.3, 2.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: charcoTex(), color: def.c1, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      const lado = def.chico ? 1.35 : -1.75; ch.position.set(t.puerta.x + t.fx * 1.3 + lx * lado, 0.2, t.puerta.z + t.fz * 1.3 + lz * lado); ch.rotation.y = yaw; ch.renderOrder = 2; ch.visible = false;
      juego.escena.add(ch);
      this.letreros.push({ m, mat, ch, tx, def, t, fase: 0, prox: Math.random() * 2, falla: 0, x: m.position.x, z: m.position.z });
    }
  }

  armarGrupo(t) {
    const j = this.j, lx = t.fz, lz = -t.fx, base = { x: t.puerta.x + t.fx * 1.6, z: t.puerta.z + t.fz * 1.6 }, gente = [];
    const puestos = [[-2.6, 0.2], [-1.8, 0.9], [2.2, 0.3], [2.9, 1.0], [3.6, 0.2]];
    for (const [l, f] of puestos) {
      const p = new Peaton(j, { tipo: 'civil', x: base.x + lx * l + t.fx * f, z: base.z + lz * l + t.fz * f, estado: 'quieto' });
      p.fila = true; p.ruta = null; p.proxBanca = p.proxCharla = 1e9; p.yaw = Math.random() * 6.28;
      j.peatones.push(p); gente.push(p);
    }
    for (let k = 0; k + 1 < gente.length; k += 2) { const a = gente[k], b = gente[k + 1]; a.estado = b.estado = 'charla'; a.con = b; b.con = a; a.charlaT = b.charlaT = 1e9; a.yaw = Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z); b.yaw = a.yaw + Math.PI; }
    gente[gente.length - 1].yaw = Math.atan2(-t.fx, -t.fz) + Math.PI;
    return { t, gente };
  }

  quitarGrupos() { const j = this.j; for (const g of this.grupos) for (const p of g.gente) { const i = j.peatones.indexOf(p); if (i >= 0) { p.quitar(); j.peatones.splice(i, 1); } } this.grupos = []; }

  actualizar(dt) {
    const j = this.j, h = j.ambiente.hora ?? 12, n = j.ambiente.noche ?? (h > 19.5 || h < 6 ? 1 : 0), jp = j.jugador.posicion, ahora = performance.now() / 1000;
    for (const L of this.letreros) {
      const d = Math.abs(L.x - jp.x) + Math.abs(L.z - jp.z);
      L.m.visible = d < 260; L.ch.visible = n > 0.25 && d < 120;
      if (!L.m.visible) continue;
      if (n > 0.25 && ahora > L.prox) {
        L.fase = 1 - L.fase; L.mat.map = L.tx[L.fase]; L.mat.needsUpdate = true;
        L.prox = ahora + (L.def.ciclo ? 0.5 : L.def.flecha ? 0.7 : 1.5 + Math.random() * 3);
        if (Math.random() < 0.12) L.falla = 0.25 + Math.random() * 0.3;
      }
      L.falla = Math.max(0, L.falla - dt);
      const parp = L.falla > 0 && Math.sin(ahora * 60) > 0 ? 0.25 : 1;
      L.mat.opacity = (0.22 + n * 0.78) * parp;
      L.ch.material.opacity = n * 0.35 * parp;
    }
    this.tg -= dt; if (this.tg > 0) return; this.tg = 2;
    const nocheBar = h > 20 || h < 3;
    if (nocheBar && !this.grupos.length) {
      for (const tipo of ['cantina', 'arena']) { const t = j.interiores?.tiendas?.find(q => q.tipo === tipo); if (t && Math.hypot(t.puerta.x - jp.x, t.puerta.z - jp.z) > 25) this.grupos.push(this.armarGrupo(t)); }
    } else if (!nocheBar && this.grupos.length) this.quitarGrupos();
    for (const g of this.grupos) for (const p of g.gente) if (p.estado === 'pasear' && !p.miedo) p.estado = 'quieto';
  }
}
