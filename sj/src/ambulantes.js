import * as THREE from 'three';
import { crearPersona, animar, nivelDetalle } from './persona.js?v=202611220146';

const NEGRO = new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.55 });
const PLATA = new THREE.MeshStandardMaterial({ color: '#d8dce2', roughness: 0.25, metalness: 0.9 });
const MADERA = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.6 });
const LATON = new THREE.MeshStandardMaterial({ color: '#d8b050', roughness: 0.3, metalness: 0.85 });
const MELODIA = [[67, 1], [72, 1], [76, 1], [79, 2], [77, 1], [76, 1], [74, 1], [72, 2], [0, 1], [69, 1], [72, 1], [77, 1], [81, 2], [79, 1], [77, 1], [76, 1], [74, 2], [0, 1], [76, 1], [74, 1], [72, 1], [71, 1], [72, 1], [74, 1], [76, 2], [72, 1], [67, 2], [0, 1]];
const BAJO = [48, 55, 52, 55, 53, 57, 53, 55, 50, 55, 53, 55, 48, 55, 52, 48];
const hz = n => 440 * Math.pow(2, (n - 69) / 12);

function instrumento(tipo) {
  const g = new THREE.Group();
  if (tipo === 'guitarra' || tipo === 'guitarron') {
    const e = tipo === 'guitarron' ? 1.5 : 1;
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * e, 0.2 * e, 0.09 * e, 18).rotateX(Math.PI / 2).scale(1, 1.25, 1), MADERA);
    const mastil = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5 * e, 0.025), NEGRO); mastil.position.y = 0.38 * e;
    g.add(cuerpo, mastil);
  } else if (tipo === 'trompeta') {
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8).rotateX(Math.PI / 2), LATON);
    const campana = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.14, 14, 1, true).rotateX(-Math.PI / 2), LATON); campana.position.z = 0.24;
    g.add(tubo, campana);
  } else {
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.05, 14).rotateX(Math.PI / 2).scale(1, 1.6, 1), MADERA);
    const mastil = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.25, 0.02), NEGRO); mastil.position.y = 0.26;
    g.add(cuerpo, mastil);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export class Ambulantes {
  constructor(juego) {
    this.j = juego;
    this.mariachis = [];
    this.puestos = [];
    this.nota = 0; this.proxima = 0;
    const L = juego.ciudad.lugares;
    if (L.plaza) this.crearMariachis(L.plaza.x, L.plaza.z + 11.5);
    const sitios = [L.plaza && [L.plaza.x - 13, L.plaza.z - 9, 'elotes'], L.catedral && [L.catedral.x + 9, L.catedral.z + 3, 'tacos'], L.monumento && [L.monumento.x + 15, L.monumento.z + 4, 'elotes'], L.lago && [L.lago.x - 8, L.lago.z + 2, 'tacos'], L.mercado && [L.mercado.x - 7, L.mercado.z + 3, 'tacos']].filter(Boolean);
    for (const [x, z, tipo] of sitios) this.crearPuesto(x, z, tipo);
  }

  crearMariachis(cx, cz) {
    const j = this.j, tipos = ['guitarron', 'trompeta', 'guitarra', 'violin', 'trompeta'];
    tipos.forEach((tipo, i) => {
      const a = (i - 2) * 0.32, x = cx + Math.sin(a) * 4, z = cz - 4 + Math.cos(a) * 4;
      const p = crearPersona({ camisa: '#141418', pantalon: '#141418', ropa: null, sombrero: true, colorSombrero: i % 2 ? '#141418' : '#e8dcc0', estiloPelo: 'sombrero', falda: false, mujer: false, fijo: true, sinAccesorios: true, mangaCorta: false, zapatos: '#1a1a1a', complexion: i === 0 ? 1.12 : 1, edad: i === 0 ? 'mayor' : 'adulto', lentes: false });
      const mono = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.02, 6, 12), new THREE.MeshStandardMaterial({ color: '#c8202e', roughness: 0.6 })); mono.position.set(0, 0.5, 0.11); p.torso.add(mono);
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), PLATA); b.position.set(0.06, 0.38 - k * 0.08, 0.1); p.torso.add(b); const b2 = b.clone(); b2.position.x = -0.06; p.torso.add(b2); }
      const ins = instrumento(tipo);
      if (tipo === 'trompeta') { ins.position.set(0, 0.105, 0.2); p.cabeza.add(ins); }
      else if (tipo === 'violin') { ins.position.set(0.06, 0.38, 0.1); ins.rotation.set(1.2, 0, 0.9); p.torso.add(ins); }
      else { ins.position.set(0.02, 0.2, 0.17); ins.rotation.set(0.1, 0, tipo === 'guitarron' ? 0.9 : 1.05); p.torso.add(ins); }
      p.grupo.position.set(x, 0, z); p.grupo.rotation.y = Math.atan2(cx - x, (cz + 8) - z) + Math.PI;
      j.escena.add(p.grupo);
      j.mundo.agregar(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 2);
      this.mariachis.push({ p, tipo, x, z, fase: Math.random() * 6 });
    });
  }

  crearPuesto(x, z, tipo) {
    const j = this.j, g = new THREE.Group();
    const color = tipo === 'elotes' ? '#e8c23a' : '#c8402a';
    const caja = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: '#d8d4cc', roughness: 0.5, metalness: 0.3 })); caja.position.y = 0.75;
    const franja = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.18, 0.82), new THREE.MeshStandardMaterial({ color, roughness: 0.6 })); franja.position.y = 0.95;
    const sombrilla = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.45, 12, 1, true), new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide })); sombrilla.position.y = 2.35;
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.1), NEGRO); palo.position.set(0, 1.25, 0);
    const olla = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.28, 14), PLATA); olla.position.set(-0.4, 1.3, 0);
    g.add(caja, franja, sombrilla, palo, olla);
    let trompo = null;
    if (tipo === 'tacos') {
      trompo = new THREE.Group(); trompo.position.set(0.42, 1.15, 0.05);
      const carne = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.5, 12, 4), new THREE.MeshStandardMaterial({ color: '#b5502a', roughness: 0.8, emissive: '#5a1a08', emissiveIntensity: 0.25 }));
      { const p = carne.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + Math.sin(p.getY(i) * 30 + Math.atan2(p.getZ(i), p.getX(i)) * 3) * 0.06; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } carne.geometry.computeVertexNormals(); }
      carne.position.y = 0.3; trompo.add(carne);
      const pina = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: '#e8b83a', roughness: 0.6 })); pina.scale.y = 1.3; pina.position.y = 0.62; trompo.add(pina);
      const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), new THREE.MeshStandardMaterial({ color: '#3a8f3a' })); hoja.position.y = 0.74; trompo.add(hoja);
      const vara = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 6), PLATA); vara.position.y = 0.35; trompo.add(vara);
      const brasa = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.45), new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.55, toneMapped: false })); brasa.position.set(0, 0.3, -0.2); trompo.add(brasa);
      g.add(trompo);
    }
    for (const sx of [-0.55, 0.55]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14).rotateZ(Math.PI / 2), NEGRO); r.position.set(sx, 0.22, 0.42); g.add(r); }
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const cx = c.getContext('2d');
    cx.fillStyle = color; cx.fillRect(0, 0, 256, 64); cx.fillStyle = '#fff'; cx.font = '900 40px Anton, Impact, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(tipo === 'elotes' ? 'ELOTES' : 'TACOS', 128, 34);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const letrero = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: tx })); letrero.position.set(0, 0.6, 0.41); g.add(letrero);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(x, 0, z); j.escena.add(g);
    j.mundo.agregar(x - 0.8, z - 0.45, x + 0.8, z + 0.45, 1.4);
    const v = crearPersona({ camisa: '#f2f2f0', ropa: null, fijo: true, sinAccesorios: true, gorra: tipo === 'tacos' ? '#c8402a' : undefined, falda: false });
    v.grupo.position.set(x, 0, z - 0.85); j.escena.add(v.grupo);
    for (const sx of [-0.7, 0.7]) j.ciudad.bancas?.push({ x: x + sx, z: z + 1.35, yaw: Math.PI, ocupante: null, pie: true, comida: tipo });
    this.puestos.push({ x, z: z + 0.85, tipo, v, trompo, nombre: tipo === 'elotes' ? 'Elotes Doña Mari' : 'Tacos El Güero', fase: Math.random() * 6 });
  }

  cerca() {
    const p = this.j.jugador.pos;
    if (this.j.jugador.coche) return null;
    return this.puestos.find(q => Math.hypot(q.x - p.x, q.z - p.z) < 1.6) || null;
  }

  comprar() {
    const q = this.cerca(), j = this.j, J = j.jugador;
    if (!q) return false;
    const precio = q.tipo === 'elotes' ? 35 : 45, cura = q.tipo === 'elotes' ? 30 : 40;
    if (J.dinero < precio) { j.hud.notificar('alerta', 'No te alcanza', `Cuesta $${precio}`, 2); return true; }
    J.dinero -= precio; J.salud = Math.min(J.saludMax, J.salud + cura);
    j.hud.popDinero(-precio); j.audio.compra?.();
    j.hud.notificar('ok', q.tipo === 'elotes' ? 'Elote preparado' : 'Orden de tacos', `+${cura} de salud`, 2.2);
    j.hud.burbuja?.({ pos: q.v.grupo.position, y: 0 }, q.tipo === 'elotes' ? '¡Con todo, joven?' : '¡Salen dos de pastor!');
    return true;
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion, t = performance.now() / 1000;
    let dMin = 1e9;
    for (const m of this.mariachis) {
      const d = Math.hypot(m.x - jp.x, m.z - jp.z); dMin = Math.min(dMin, d);
      if (d > 90) continue;
      const P = m.p; m.fase += dt;
      animar(P, dt, 0, 'puno', false);
      nivelDetalle(P, d < 45);
      const b = Math.sin(m.fase * 4.2);
      P.cuerpo.rotation.y = Math.sin(m.fase * 1.4) * 0.08; P.cuerpo.position.y = -Math.abs(b) * 0.015;
      if (m.tipo === 'trompeta') { P.bi.rotation.set(-1.5, -0.6, 0); P.bd.rotation.set(-1.5, 0.6, 0); P.ci.rotation.x = P.cd.rotation.x = -1.4; P.cabeza.rotation.x = -0.15 + b * 0.04; }
      else if (m.tipo === 'violin') { P.bi.rotation.set(-1.3, -0.4, 0.2); P.ci.rotation.x = -1.6; P.bd.rotation.set(-1.1 + b * 0.25, 0.4, -0.3); P.cd.rotation.x = -0.9; P.cabeza.rotation.z = 0.25; }
      else { P.bi.rotation.set(-0.9, -0.5, 0.1); P.ci.rotation.x = -1.2; P.bd.rotation.set(-0.55 + b * 0.12, 0.2, -0.15); P.cd.rotation.x = -1.3; }
    }
    for (const q of this.puestos) { const d = Math.hypot(q.x - jp.x, q.z - jp.z); if (d > 70) continue; if (q.trompo) q.trompo.children[0].rotation.y += dt * 1.2; animar(q.v, dt, 0, 'puno', false); nivelDetalle(q.v, d < 45); if (Math.sin(t * 0.7 + q.fase) > 0.6) { q.v.bd.rotation.set(-1.2, 0, -0.2); q.v.cd.rotation.x = -1.2 + Math.sin(t * 8) * 0.3; } }
    this.musica(dMin);
    if (this.cerca()) j.hud.pista('E', (this.cerca().tipo === 'elotes' ? 'Comprar elote · $35' : 'Comprar tacos · $45'));
  }

  musica(d) {
    const A = this.j.audio, c = A.ctx;
    if (!c || d > 45 || this.j.overlay) return;
    const vol = Math.max(0, 1 - d / 45) * 0.12 * (A.volMusica ?? 1);
    if (vol < 0.004) return;
    const ahora = c.currentTime, pulso = 0.23;
    if (this.proxima < ahora - 1) this.proxima = ahora + 0.05;
    while (this.proxima < ahora + 0.3) {
      const [n, dur] = MELODIA[this.nota % MELODIA.length];
      if (n) { A.tono(hz(n), dur * pulso * 0.95, vol, 'sawtooth', undefined, this.proxima); A.tono(hz(n + 4), dur * pulso * 0.9, vol * 0.45, 'triangle', undefined, this.proxima); }
      const tiempo = Math.floor(this.cuenta = (this.cuenta || 0) + dur);
      for (let k = 0; k < dur; k++) {
        const b = BAJO[(tiempo + k) % BAJO.length], cuando = this.proxima + k * pulso;
        if ((tiempo + k) % 3 === 0) A.tono(hz(b - 12), pulso * 0.9, vol * 0.9, 'triangle', undefined, cuando);
        else A.tono(hz(b + 12), pulso * 0.4, vol * 0.3, 'square', undefined, cuando);
      }
      this.proxima += dur * pulso; this.nota++;
    }
  }
}
