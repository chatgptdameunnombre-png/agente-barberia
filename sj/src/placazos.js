import * as THREE from 'three';
import { BLOQUES, tipoBloque } from './ciudad.js?v=20261126192148';

const AMARILLO = '#ffd23a';
function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

function texTag(nombre, k) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'), r = rng(77 + k * 13);
  const cols = [['#ff4f9a', '#1a0a2a', '#ffd23a'], ['#3fd2ff', '#0a1a2a', '#ff4f9a'], ['#ffd23a', '#2a1a06', '#3fd2ff'], ['#4fe08a', '#0a2a14', '#ffffff'], ['#b46bff', '#160a2a', '#ffd23a']][k % 5];
  g.translate(256, 140); g.rotate((r() - 0.5) * 0.18);
  for (let s = 0; s < 3; s++) { g.fillStyle = cols[2]; g.globalAlpha = 0.35; g.beginPath(); g.ellipse((r() - 0.5) * 300, (r() - 0.5) * 60, 60 + r() * 80, 26 + r() * 30, r(), 0, 7); g.fill(); }
  g.globalAlpha = 1;
  const texto = nombre.toUpperCase();
  g.font = 'italic 900 ' + Math.max(70, 130 - texto.length * 8) + 'px Impact, Anton, sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.lineWidth = 26; g.strokeStyle = cols[1]; g.strokeText(texto, 0, 0);
  g.lineWidth = 10; g.strokeStyle = '#ffffff'; g.strokeText(texto, 0, 0);
  const gr = g.createLinearGradient(0, -70, 0, 20); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[2]); g.fillStyle = gr; g.fillText(texto, 0, 0);
  g.font = '900 34px Impact, Anton, sans-serif'; g.lineWidth = 8; g.strokeStyle = cols[1]; g.strokeText('SJ · ' + (k + 1), 120, 62); g.fillStyle = '#ffffff'; g.fillText('SJ · ' + (k + 1), 120, 62);
  for (let s = 0; s < 120; s++) { g.fillStyle = cols[r() < 0.5 ? 0 : 2]; g.globalAlpha = 0.6; g.fillRect((r() - 0.5) * 460, (r() - 0.5) * 200, 2 + r() * 3, 2 + r() * 3); }
  g.globalAlpha = 0.9; g.fillStyle = cols[0]; for (let s = 0; s < 6; s++) { const x = (r() - 0.5) * 300; g.fillRect(x, 10 + r() * 20, 3, 30 + r() * 50); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function texContorno() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 5; g.setLineDash([18, 12]); g.strokeRect(10, 10, 236, 108);
  g.setLineDash([]); g.fillStyle = 'rgba(255,210,58,0.9)'; g.font = '900 40px Impact, sans-serif'; g.textAlign = 'center'; g.fillText('?', 128, 82);
  return new THREE.CanvasTexture(c);
}

export class Placazos {
  constructor(juego) {
    this.j = juego; this.hechos = new Set(); this.pintando = null;
    const r = rng(4242), C = juego.ciudad, cand = [];
    for (const e of C.edificios || []) {
      if (e.estilo !== 'casa') continue;
      if (tipoBloque(Math.floor(e.x / 80 + BLOQUES / 2), Math.floor(e.z / 80 + BLOQUES / 2)) !== 'barrio') continue;
      const [fx, fz] = e.frente, ancho = fx === 0 ? e.w : e.fondo;
      if (ancho < 7) continue;
      cand.push({ e, fx, fz, rot: Math.atan2(fx, fz), cx: e.x + fx * e.fondo / 2, cz: e.z + fz * e.fondo / 2, ancho });
    }
    const lista = [];
    while (cand.length && lista.length < 15) {
      const k = r() * cand.length | 0, s = cand.splice(k, 1)[0];
      if (lista.some(q => Math.hypot(q.x - s.cx, q.z - s.cz) < 55)) continue;
      const off = (r() - 0.5) * (s.ancho - 4.5);
      const x = s.cx + s.fx * 0.05 + (s.fz !== 0 ? off : 0), z = s.cz + s.fz * 0.05 + (s.fx !== 0 ? off : 0);
      lista.push({ id: lista.length, x, z, rot: s.rot, fx: s.fx, fz: s.fz });
    }
    this.lugares = lista;
    const contorno = new THREE.MeshBasicMaterial({ map: texContorno(), transparent: true, depthWrite: false });
    const lata = new THREE.MeshStandardMaterial({ color: AMARILLO, roughness: 0.3, metalness: 0.6, emissive: AMARILLO, emissiveIntensity: 0.4 });
    const latas = new THREE.Group();
    for (const L of lista) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), contorno); m.position.set(L.x + L.fx * 0.1, 0.68, L.z + L.fz * 0.1); m.rotation.y = L.rot; juego.escena.add(m); L.contorno = m;
      const icono = new THREE.Group();
      icono.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 12), lata));
      const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 10), new THREE.MeshStandardMaterial({ color: '#ff4f9a' })); tapa.position.y = 0.27; icono.add(tapa);
      icono.position.set(L.x + L.fx * 1.4, 1.5, L.z + L.fz * 1.4); latas.add(icono); L.icono = icono;
    }
    juego.escena.add(latas);
  }

  pintar(L, instantaneo) {
    const j = this.j;
    this.hechos.add(L.id);
    L.contorno.visible = false; L.icono.visible = false;
    const nombre = j.jugador.personaje || 'Matías';
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.15), new THREE.MeshStandardMaterial({ map: texTag(nombre, L.id), transparent: true, roughness: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(L.x + L.fx * 0.1, 0.68, L.z + L.fz * 0.1); m.rotation.y = L.rot; j.escena.add(m); L.tag = m;
    if (instantaneo) return;
    const n = this.hechos.size;
    j.jugador.dinero += 300; j.hud.popDinero?.(300); j.audio?.dinero?.(); j.estadisticas?.sumar?.('grafitis', 1);
    if (j.redes) j.redes.seguidores = (j.redes.seguidores || 0) + 12;
    if (n >= this.lugares.length) { j.jugador.dinero += 10000; j.hud.grande('REY DEL BARRIO', `Pintaste los ${this.lugares.length} muros`, 4); }
    else j.hud.notificar('dinero', `Grafiti ${n} de ${this.lugares.length}`, '+$300 · tu firma ya está en el barrio', 3);
  }

  cerca() {
    const J = this.j.jugador; if (J.coche || J.muerto || this.pintando || J.nadando) return null;
    return this.lugares.find(L => !this.hechos.has(L.id) && Math.hypot(J.pos.x - (L.x + L.fx * 1.3), J.pos.z - (L.z + L.fz * 1.3)) < 2.2) || null;
  }

  empezar() {
    const L = this.cerca(); if (!L) return false;
    const j = this.j, J = j.jugador;
    this.pintando = { L, t: 0, siseo: 0 };
    J.reparando = 0; J.pintando = 3.6; J.yaw = Math.atan2(-L.fx, -L.fz);
    J.pos.set(L.x + L.fx * 1.15, 0, L.z + L.fz * 1.15);
    for (const a of j.policia.agentes || []) if (!a.muerto && a.pos.distanceTo(J.pos) < 28) { j.policia.subir(Math.max(1, j.policia.estrellas)); j.hud.notificar('alerta', '¡Vandalismo!', 'Un policía te vio pintando.', 3); break; }
    return true;
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador, P = this.pintando, t = performance.now() / 1000;
    const jp = J.posicion;
    for (const L of this.lugares) if (!this.hechos.has(L.id)) { const cerca = Math.abs(L.x - jp.x) < 70 && Math.abs(L.z - jp.z) < 70; L.icono.visible = cerca; if (cerca) { L.icono.rotation.y = t * 1.6; L.icono.position.y = 1.5 + Math.sin(t * 2.4 + L.id) * 0.12; } }
    if (!P) return;
    P.t += dt; P.siseo -= dt;
    const L = P.L;
    if (J.muerto || J.coche) { this.pintando = null; J.pintando = 0; return; }
    if (P.siseo <= 0) { P.siseo = 0.12; j.audio?.ruidoCorto?.(0.16, 3200 + Math.random() * 1500, 0.07, 'bandpass', 1.6); }
    if (Math.random() < dt * 22) { const col = ['#ff4f9a', '#3fd2ff', '#ffd23a', '#4fe08a', '#b46bff'][L.id % 5]; j.humo?.(L.x + L.fx * 0.25 + (L.fz !== 0 ? (Math.random() - 0.5) * 2 : 0), 0.4 + Math.random() * 0.7, L.z + L.fz * 0.3 + (L.fx !== 0 ? (Math.random() - 0.5) * 2 : 0), 0.35, col, 0.6); }
    if (P.t >= 3.6) { this.pintando = null; J.pintando = 0; this.pintar(L); }
  }

  marcasMapa() { return this.lugares.filter(L => !this.hechos.has(L.id)).map(L => ({ x: L.x, z: L.z, tipo: 'icono', ic: { c: AMARILLO, t: 'chispa' }, nombre: 'Muro para grafiti' })); }
  guardar() { return [...this.hechos]; }
  cargar(d) { if (!Array.isArray(d)) return; for (const id of d) { const L = this.lugares[id]; if (L && !this.hechos.has(id)) this.pintar(L, true); } }
}
