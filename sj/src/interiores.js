import * as THREE from 'three';
import { animar } from './persona.js?v=202611220444';
import { hoja } from './texturas.js?v=202611220444';
import { Peaton } from './peatones.js?v=202611220444';
import { letrero } from './ciudad.js?v=202611220444';
import { crearPersona, ROPA, ESTILOS_PELO, ponerChamarra, sentar } from './persona.js?v=202611220444';
import { IMG_ARMAS, ICONO } from './iconos.js?v=202611220444';
import { ARTICULOS } from './actividades.js?v=202611220444';

const NOMBRE_LETRERO = ['Abarrotes Doña Lupe', 'Tortillería La Perla', 'Farmacia La Esperanza', 'Birria El Compa', 'Ferretería El Tornillo', 'Panadería La Concha', 'Mariscos El Pacífico', 'Lavandería Burbujas'];
const ROBABLES = [0, 2, 5, 1, 3, 4, 6];
const INT = hoja('assets/interior.jpg', 3, 2, { tam: 512, sinUrl: true });
const COLOR_ICONO = { tienda: '#3fd2ff', ropa: '#e86fa8', barberia: '#ff6b6b', armeria: '#e2e6ee', cantina: '#ffb347', gimnasio: '#4fe08a', depa: '#b46bff', antro: '#ff4fd8', arena: '#ffd23a', mercado: '#ff8a3a', templo: '#f2e6c8' };
const LETRA = { tienda: 'carrito', ropa: 'camisa', barberia: 'tijeras', armeria: 'mira', cantina: 'copa', gimnasio: 'pesa', depa: 'casa', antro: 'nota', arena: 'L', mercado: 'M', templo: '+' };
const LUGARES_LIBRES = [
  ['ropa', 'BOUTIQUE LA JACARANDA', 'Boutique La Jacaranda', '#2a1440', '#e9c8ff'],
  ['barberia', 'BARBERÍA EL BIGOTE', 'Barbería El Bigote', '#1a1a1a', '#ff6b6b'],
  ['cantina', 'CANTINA LA JACARANDA', 'Cantina La Jacaranda', '#2a1a0e', '#ffb347'],
  ['gimnasio', 'GIMNASIO EL TORO', 'Gimnasio El Toro', '#101a14', '#4fe08a'],
  ['depa', 'DEPARTAMENTOS JACARANDA', 'Tu departamento', '#1a1428', '#d9b3ff'],
  ['antro', 'ANTRO NEÓN', 'Antro Neón', '#100818', '#ff4fd8'],
  ['arena', 'ARENA JACARANDA · LUCHA LIBRE', 'Arena Jacaranda', '#1a0a0a', '#ffd23a']
];

const ROPA_NOMBRES = ['Camisa de cuadros', 'Jersey Perla FC', 'Guayabera blanca', 'Sudadera gris', 'Blusa bordada', 'Chamarra de mezclilla', 'Playera jacaranda', 'Camisa hawaiana'];
const cabeza = extra => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="18" width="32" height="34" rx="6" fill="#c98f68"/><rect x="22" y="31" width="5" height="5" rx="1" fill="#1a120c"/><rect x="37" y="31" width="5" height="5" rx="1" fill="#1a120c"/><rect x="27" y="43" width="10" height="2.5" rx="1" fill="#7a2a24"/>${extra}</svg>`;
const ICONO_PELO = {
  corto: cabeza('<rect x="15" y="12" width="34" height="10" rx="3" fill="#1d1410"/>'),
  largo: cabeza('<rect x="13" y="12" width="38" height="10" rx="3" fill="#2b1d14"/><rect x="11" y="18" width="7" height="34" rx="3" fill="#2b1d14"/><rect x="46" y="18" width="7" height="34" rx="3" fill="#2b1d14"/>'),
  rapado: cabeza('<rect x="16" y="16" width="32" height="5" rx="2" fill="#6a5040" opacity=".6"/>'),
  gorra: cabeza('<rect x="14" y="10" width="36" height="11" rx="4" fill="#c0392b"/><rect x="30" y="18" width="24" height="4" rx="2" fill="#a02a20"/>'),
  sombrero: cabeza('<rect x="4" y="17" width="56" height="4" rx="2" fill="#3a2a1a"/><rect x="20" y="5" width="24" height="13" rx="4" fill="#3a2a1a"/>'),
  chongo: cabeza('<rect x="15" y="12" width="34" height="9" rx="3" fill="#120d0a"/><circle cx="32" cy="9" r="6" fill="#120d0a"/>')
};
const PELO_NOMBRES = { corto: 'Corte clásico', largo: 'Melena larga', rapado: 'Rapado', gorra: 'Gorra de béisbol', sombrero: 'Sombrero vaquero', chongo: 'Chongo' };

function repetir(t, x, y) { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.needsUpdate = true; INT.listo.then(() => { c.needsUpdate = true; }); return c; }

export class Interiores {
  constructor(juego) {
    this.j = juego;
    this.tiendas = [];
    this.dentro = null;
    this.robo = null;
    this.luz1 = new THREE.PointLight('#ffe2b0', 0, 18, 1.4);
    this.luz2 = new THREE.PointLight('#fff0d8', 0, 18, 1.4);
    juego.escena.add(this.luz1, this.luz2);
    this.elegir();
    this.tiendas.forEach((t, i) => { t.zonas = []; this.construir(t, i); this.puertaFuera(t); });
    this.crearCajeros();
  }

  animarCantina(T, dt) {
    const C = T.cantina, A = this.j.audio, c = A.ctx; C.t += dt;
    for (const q of T.parroquianos) { const P = q.p, s = Math.sin(C.t * 1.3 + q.fase); P.bd.rotation.set(-0.9 + Math.max(0, s) * 0.8, 0, -0.2); P.cd.rotation.x = -1.4; P.cabeza.rotation.x = s * 0.08; }
    for (const q of T.norteño) { const P = q.p, b = Math.sin(C.t * 6.2 + q.k); animar(P, dt, 0, 'puno', false); P.cuerpo.rotation.y = Math.sin(C.t * 1.5 + q.k) * 0.1; if (q.k === 0) { P.bi.rotation.set(-1.4, -0.5, 0); P.bd.rotation.set(-1.2 + b * 0.2, 0.5, 0); P.ci.rotation.x = P.cd.rotation.x = -1.5; } else { P.bi.rotation.set(-0.9, -0.5, 0.1); P.ci.rotation.x = -1.2; P.bd.rotation.set(-0.55 + b * 0.15, 0.2, -0.15); P.cd.rotation.x = -1.3; } }
    if (!c) return;
    const NOTAS = [64, 67, 69, 71, 69, 67, 64, 62, 64, 67, 71, 74, 72, 71, 69, 67], BAJO = [40, 47, 45, 47];
    const pulso = 0.24, ahora = c.currentTime, vol = 0.07 * (A.volMusica ?? 1);
    if (C.prox < ahora - 1) C.prox = ahora + 0.05;
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    while (C.prox < ahora + 0.3) {
      const n = NOTAS[C.nota % NOTAS.length];
      A.tono(hz(n), pulso * 0.9, vol, 'square', undefined, C.prox); A.tono(hz(n + 12), pulso * 0.5, vol * 0.4, 'triangle', undefined, C.prox);
      if (C.nota % 2 === 0) A.tono(hz(BAJO[(C.nota >> 2) % BAJO.length]), pulso * 0.9, vol * 1.1, 'triangle', undefined, C.prox); else A.tono(hz(BAJO[(C.nota >> 2) % BAJO.length] + 19), pulso * 0.3, vol * 0.5, 'square', undefined, C.prox);
      C.prox += pulso; C.nota++;
    }
  }

  animarArena(T, dt) {
    const A = T.arena, j = this.j, t = (A.t += dt), rz = A.rz;
    const intenso = A.combate > 0 ? 1 : 0.35;
    const ang = t * (0.6 + intenso * 0.5);
    const [r1, r2] = [A.rudo, A.tecnico];
    if (!A.caida) {
      r1.grupo.position.set(Math.cos(ang) * 1.3, 1.0, rz + Math.sin(ang) * 1.3); r2.grupo.position.set(-Math.cos(ang) * 1.3, 1.0, rz - Math.sin(ang) * 1.3);
      r1.grupo.rotation.y = Math.atan2(r2.grupo.position.x - r1.grupo.position.x, r2.grupo.position.z - r1.grupo.position.z); r2.grupo.rotation.y = r1.grupo.rotation.y + Math.PI;
      for (const [p, k] of [[r1, 0], [r2, 1]]) {
        animar(p, dt, 1.2, 'puno', false);
        const golpe = Math.max(0, Math.sin(t * 3.2 + k * Math.PI));
        p.bd.rotation.set(-1.2 - golpe * 0.6 * intenso, 0, -0.2); p.bi.rotation.set(-1.1, 0, 0.3); p.cd.rotation.x = -1.4 + golpe; p.ci.rotation.x = -1.6;
        const salto = intenso > 0.5 && Math.sin(t * 0.9 + k * 2) > 0.92 ? Math.sin((t * 0.9 + k * 2) * 6) * 0.25 + 0.6 : 0;
        p.grupo.position.y = 1.0 + Math.max(0, salto);
      }
    }
    if (A.combate > 0) {
      A.combate -= dt;
      if (A.combate <= 0 && A.apuesta) {
        const gana = Math.random() < 0.47 ? 'rudo' : 'tecnico', perdedor = gana === 'rudo' ? r2 : r1;
        A.caida = { p: perdedor, t: 0 };
        j.audio.tono(880, 0.4, 0.2, 'triangle'); j.audio.tono(880, 0.4, 0.2, 'triangle', null, (j.audio.ctx?.currentTime || 0) + 0.5); j.audio.tono(880, 0.6, 0.2, 'triangle', null, (j.audio.ctx?.currentTime || 0) + 1);
        if (gana === A.apuesta.lado) { j.noticias?.avisar('arena'); j.jugador.dinero += A.apuesta.monto * 2; j.audio.dinero(); j.hud.grande('¡GANÓ EL ' + (gana === 'rudo' ? 'RUDO' : 'TÉCNICO') + '!', 'Cobras $' + A.apuesta.monto * 2, 3); }
        else j.hud.grande('¡GANÓ EL ' + (gana === 'rudo' ? 'RUDO' : 'TÉCNICO') + '!', 'Perdiste tu apuesta', 3);
        A.apuesta = null;
      }
    }
    if (A.caida) {
      A.caida.t += dt; const p = A.caida.p;
      p.grupo.rotation.x = -Math.min(Math.PI / 2, A.caida.t * 4); p.grupo.position.y = 1.0 + 0.2;
      if (A.caida.t > 6) { p.grupo.rotation.x = 0; A.caida = null; }
    }
    for (const q of A.publico) {
      const p = q.p, s = Math.sin(t * (2 + intenso * 3) + q.fase);
      animar(p, dt, 0, 'puno', false);
      const arriba = intenso > 0.5 && s > 0.2;
      p.bd.rotation.set(arriba ? -2.8 : -0.3, 0, -0.2); p.bi.rotation.set(arriba ? -2.7 : -0.3, 0, 0.2);
      p.cuerpo.position.y = arriba ? 0.06 : 0;
    }
    A.ruido -= dt;
    if (A.ruido <= 0) { A.ruido = 0.3; j.audio.ruidoCorto(0.6, 700 + Math.random() * 600, 0.04 + intenso * 0.08, 'bandpass', 0.7); }
  }

  animarAntro(T, dt) {
    const A = T.antro, t = (A.t += dt), beat = t * 124 / 60, golpe = Math.pow(1 - (beat % 1), 3);
    const cols = ['#ff4fd8', '#3fd2ff', '#ffd84a', '#4fe08a', '#b46bff'];
    A.baldosas.forEach((b, i) => b.material.color.set(cols[(Math.floor(beat / 2) + i * 7 + (i % 3)) % cols.length]).multiplyScalar(0.25 + 0.75 * (((i + Math.floor(beat)) % 3 === 0) ? golpe : 0.15)));
    A.focos.forEach((f, i) => { f.rotation.z = Math.sin(t * 0.9 + i) * 0.6; f.rotation.x = Math.cos(t * 0.7 + i * 2) * 0.4; f.material.color.set(cols[(Math.floor(beat / 4) + i) % cols.length]); f.material.opacity = 0.08 + golpe * 0.1; });
    const P = A.dj; animar(P, dt, 0, 'puno', false); P.bd.rotation.set(-1.1 + golpe * 0.3, 0.3, -0.2); P.cd.rotation.x = -1.2; P.bi.rotation.set(-2.6 + Math.sin(t * 2) * 0.3, 0, 0.5); P.cabeza.rotation.x = 0.25 * golpe; P.cuerpo.position.y = -golpe * 0.04;
    for (const B of A.bailarines) {
      const p = B.p, w = Math.sin(beat * Math.PI + B.fase), b = Math.abs(Math.sin(beat * Math.PI + B.fase));
      animar(p, dt, 0, 'puno', false);
      p.cuerpo.rotation.y = w * 0.35; p.cuerpo.position.y = -b * 0.07;
      if (B.estilo === 0) { p.bi.rotation.set(-1.3 + w * 0.8, 0, 0.4); p.bd.rotation.set(-1.3 - w * 0.8, 0, -0.4); p.ci.rotation.x = p.cd.rotation.x = -1.1; }
      else if (B.estilo === 1) { p.bi.rotation.set(-2.8 + b * 0.3, 0, 0.3); p.bd.rotation.set(-2.8 + b * 0.3, 0, -0.3); p.ci.rotation.x = p.cd.rotation.x = -0.3; }
      else { p.bi.rotation.set(-0.6, 0, 0.5 + b * 0.3); p.bd.rotation.set(-0.6, 0, -0.5 - b * 0.3); p.ci.rotation.x = p.cd.rotation.x = -1.6; }
      p.ri.rotation.x = p.rd.rotation.x = 0.2 + b * 0.3; p.pi.rotation.x = p.pd.rotation.x = -0.1 - b * 0.15; p.cabeza.rotation.x = b * 0.15;
    }
    this.luz1.color.set(cols[Math.floor(beat / 4) % cols.length]); this.luz2.color.set(cols[(Math.floor(beat / 4) + 2) % cols.length]); this.luz1.intensity = 1.5 + golpe * 2.5; this.luz2.intensity = 1.5 + golpe * 2;
    this.j.audio.antro?.(1);
  }

  crearCajeros() {
    const j = this.j, E = j.escena;
    this.cajeros = [];
    const lugares = this.tiendas.filter(t => t.tipo === 'tienda').slice(0, 6).map(t => ({ x: t.puerta.x + t.fz * 2.2 + t.fx * 0.4, z: t.puerta.z - t.fx * 2.2 + t.fz * 0.4, yaw: Math.atan2(t.fx, t.fz) }));
    const Bc = j.ciudad.lugares.banco; if (Bc) lugares.push({ x: Bc.x + 4, z: Bc.z, yaw: Math.PI });
    const cuerpo = new THREE.MeshStandardMaterial({ color: '#3a3e48', roughness: 0.4, metalness: 0.6 });
    const frente = new THREE.MeshStandardMaterial({ color: '#c8ccd4', roughness: 0.3, metalness: 0.7 });
    const pantalla = new THREE.MeshBasicMaterial({ color: '#3fa8ff' });
    const verde = new THREE.MeshBasicMaterial({ color: '#4fe08a' });
    for (const L of lugares) {
      const g = new THREE.Group();
      const m = (geo, mat, x, y, z) => { const k = new THREE.Mesh(geo, mat); k.position.set(x, y, z); k.castShadow = true; g.add(k); return k; };
      m(new THREE.BoxGeometry(0.75, 1.75, 0.6), cuerpo, 0, 0.875, 0);
      m(new THREE.BoxGeometry(0.66, 0.9, 0.04), frente, 0, 1.05, 0.31);
      m(new THREE.PlaneGeometry(0.42, 0.3), pantalla, 0, 1.3, 0.335);
      m(new THREE.BoxGeometry(0.34, 0.04, 0.16), cuerpo, 0, 1.02, 0.4);
      m(new THREE.BoxGeometry(0.3, 0.18, 0.05), verde, 0, 1.82, 0.27);
      g.position.set(L.x, 0, L.z); g.rotation.y = L.yaw;
      E.add(g);
      j.mundo.agregar(L.x - 0.4, L.z - 0.4, L.x + 0.4, L.z + 0.4, 1.8);
      this.cajeros.push({ x: L.x + Math.sin(L.yaw) * 0.9, z: L.z + Math.cos(L.yaw) * 0.9 });
    }
  }

  cajeroCerca() {
    const p = this.j.jugador.pos;
    if (this.dentro || this.j.jugador.coche) return null;
    return this.cajeros?.find(c => Math.hypot(c.x - p.x, c.z - p.z) < 1.4) || null;
  }

  elegir() {
    const c = this.j.ciudad, lista = [];
    const lejos = (x, z, d) => lista.every(t => Math.hypot(t.puerta.x - x, t.puerta.z - z) > d);
    const crear = (f, tipo, nombre, letreroIdx) => ({ tipo, nombre, letrero: letreroIdx, rot: f.rot, fx: f.fx, fz: f.fz, fachada: { x: f.x, z: f.z }, puerta: new THREE.Vector3(f.x + f.fx * 1.3, 0, f.z + f.fz * 1.3), robadaHasta: 0 });
    for (const li of ROBABLES) for (const f of c.tiendas) {
      if (f.letrero !== li || lista.length >= 8) continue;
      if (!lejos(f.x, f.z, 110)) continue;
      lista.push(crear(f, 'tienda', NOMBRE_LETRERO[li], li));
      break;
    }
    for (const f of c.tiendas) { if (lista.length >= 9) break; if (ROBABLES.includes(f.letrero) && lejos(f.x, f.z, 140)) lista.push(crear(f, 'tienda', NOMBRE_LETRERO[f.letrero], f.letrero)); }
    const libres = [...c.libres].sort((a, b) => Math.hypot(a.x + 60, a.z + 60) - Math.hypot(b.x + 60, b.z + 60));
    for (const [tipo, nombre, bonito, fondo, tinta] of LUGARES_LIBRES) {
      const f = libres.find(f => lejos(f.x, f.z, 95));
      if (!f) continue;
      const t = crear(f, tipo, bonito, null);
      const l = letrero(nombre, fondo, tinta, Math.min(f.w - 1.4, 6.5), 1.2);
      l.position.set(f.x + f.fx * 0.08, 3.9, f.z + f.fz * 0.08); l.rotation.y = f.rot;
      this.j.escena.add(l);
      if (tipo === 'barberia') {
        const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 12), new THREE.MeshBasicMaterial({ map: this.texturaPoste() }));
        poste.position.set(f.x + f.fx * 0.25 + f.fz * 1.6, 2.6, f.z + f.fz * 0.25 - f.fx * 1.6);
        this.j.escena.add(poste); this.poste = poste;
      }
      lista.push(t);
    }
    { const Bc = c.bloques.find(b => b.tipo === 'catedral'); if (Bc) { const fz = Bc.z1 - 3 - 12; lista.push({ tipo: 'templo', nombre: 'Catedral de Santa Jacaranda', rot: 0, fx: 0, fz: 1, fachada: { x: Bc.cx, z: fz + 1.9 }, puerta: new THREE.Vector3(Bc.cx, 0, fz + 3.3), robadaHasta: 0 }); } }
    { const Bm = c.bloques.find(b => b.tipo === 'mercado'); if (Bm) lista.push({ tipo: 'mercado', nombre: 'Mercado de San Jacinto', rot: 0, fx: 0, fz: 1, fachada: { x: Bm.cx - 3.4, z: Bm.cz + 23.2 }, puerta: new THREE.Vector3(Bm.cx - 3.4, 0, Bm.cz + 24.6), robadaHasta: 0 }); }
    if (c.gasolinera) { const G = c.gasolinera, px = G.cx + 7, pz = G.iz0 + 11.5; lista.push({ tipo: 'tienda', nombre: 'Súper 24', letrero: 0, rot: 0, fx: 0, fz: 1, fachada: { x: px, z: pz }, puerta: new THREE.Vector3(px, 0, pz + 1.3), robadaHasta: 0 }); }
    const a = c.lugares.armeria;
    lista.push({ tipo: 'armeria', nombre: 'Armería del Valle', rot: 0, fx: 0, fz: 1, fachada: { x: a.x, z: a.z - 1.6 }, puerta: new THREE.Vector3(a.x, 0, a.z), robadaHasta: 0 });
    this.tiendas = lista;
  }

  puertaFuera(t) {
    const g = new THREE.Group();
    const marco = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.75, 0.12), new THREE.MeshLambertMaterial({ color: '#3a2a1e' }));
    marco.position.y = 1.37;
    this.matPuerta = this.matPuerta || new THREE.MeshLambertMaterial({ color: '#2a3442', emissive: '#ffcf8a', emissiveIntensity: 0.15 });
    const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.45), this.matPuerta); vidrio.position.set(0, 1.3, 0.065);
    const tapete = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: COLOR_ICONO[t.tipo] }));
    tapete.position.set(0, 0.17, 0.75);
    g.add(marco, vidrio, tapete);
    g.position.set(t.fachada.x + t.fx * 0.02, 0, t.fachada.z + t.fz * 0.02); g.rotation.y = t.rot;
    this.j.escena.add(g);
  }

  etiqueta(texto, sub) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 170;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(10,10,18,.84)'; g.beginPath(); g.roundRect(8, 8, 496, 154, 26); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.stroke();
    g.textAlign = 'center';
    let tam = 46; g.font = `800 ${tam}px Inter, sans-serif`;
    while (g.measureText(texto).width > 460 && tam > 22) { tam -= 2; g.font = `800 ${tam}px Inter, sans-serif`; }
    g.fillStyle = '#fff'; g.fillText(texto, 256, 72);
    g.fillStyle = '#ffc94a'; g.font = '900 54px Anton, Impact, sans-serif'; g.fillText(sub, 256, 140);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    sp.scale.set(1.25, 0.415, 1);
    return sp;
  }

  zona(t, x, z, art, y = 1.85) {
    const I = t.interior;
    if (t.tipo !== 'depa') return;
    const et = this.etiqueta(art.nombre, art.precio ? '$' + art.precio.toLocaleString('es-MX') : 'GRATIS');
    et.position.set(x, y, z); I.g.add(et);
    const aro = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.44, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffc94a', transparent: true, opacity: 0.55, depthWrite: false }));
    aro.position.set(x, 0.03, z); I.g.add(aro);
    t.zonas.push({ x: I.ox + x, z: I.oz + z, art, et, aro, escala: 1 });
  }

  maniqui(t, x, z, rot, opc, chamarra) {
    const m = crearPersona({ cara: null, estiloPelo: 'rapado', piel: '#d8d2ca', pantalon: '#3a3a40', sombrero: null, falda: false, fijo: true, complexion: 1, edad: 'adulto', sinAccesorios: true, mangaCorta: false, lentes: false, barba: null, ...opc });
    if (chamarra) ponerChamarra(m, chamarra);
    m.grupo.position.set(x, 0, z); m.grupo.rotation.y = rot;
    m.bi.rotation.z = 0.25; m.bd.rotation.z = -0.25;
    t.interior.g.add(m.grupo);
    this.j.mundo.agregar(t.interior.ox + x - 0.3, t.interior.oz + z - 0.3, t.interior.ox + x + 0.3, t.interior.oz + z + 0.3, 2);
    return m;
  }

  texturaPoste() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128;
    const g = c.getContext('2d');
    for (let y = -64; y < 192; y += 16) { g.fillStyle = ['#e8323a', '#ffffff', '#2a5bd7', '#ffffff'][((y + 64) / 16) % 4]; g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 32); g.lineTo(64, y + 48); g.lineTo(0, y + 16); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  construir(t, i) {
    const j = this.j, esc = j.escena, mundo = j.mundo;
    const W = t.tipo === 'armeria' ? 12 : t.tipo === 'arena' ? 22 : t.tipo === 'mercado' ? 24 : t.tipo === 'templo' ? 16 : 14, L = t.tipo === 'arena' ? 19 : t.tipo === 'mercado' ? 20 : t.tipo === 'templo' ? 30 : 11, H = t.tipo === 'arena' ? 6.5 : t.tipo === 'mercado' ? 7 : t.tipo === 'templo' ? 12 : 4;
    const ox = 3000 + (i % 4) * 40, oz = 3000 + Math.floor(i / 4) * 40;
    const g = new THREE.Group(); g.position.set(ox, 0, oz); g.visible = false; esc.add(g);
    t.interior = { g, ox, oz, W, L, H, entrada: new THREE.Vector3(ox, 0, oz + L / 2 - 1.6), salida: new THREE.Vector3(ox, 0, oz + L / 2 - 0.9) };
    const m = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, ...extra });
    const caja = (w, h, d, mat, x, y, z, choca = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = false; b.receiveShadow = false; g.add(b); if (choca) mundo.agregar(ox + x - w / 2, oz + z - d / 2, ox + x + w / 2, oz + z + d / 2, y + h / 2); return b; };
    const pisoTex = t.tipo === 'tienda' ? INT[2].textura : null;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, L), t.tipo === 'tienda' ? m('#d8d0c8', { map: repetir(INT[2].textura, W / 3, L / 3) }) : t.tipo === 'barberia' ? m('#ddd', { map: this.ajedrez() }) : m(t.tipo === 'armeria' ? '#3a3632' : '#8a7060'));
    piso.rotation.x = -Math.PI / 2; g.add(piso);
    const techo = new THREE.Mesh(new THREE.PlaneGeometry(W, L), m('#f2efe8')); techo.rotation.x = Math.PI / 2; techo.position.y = H; g.add(techo);
    const pared = t.tipo === 'tienda' ? m('#e0d8d0', { map: repetir(INT[3].textura, W / 4, 1) }) : m(t.tipo === 'ropa' ? '#c9a3c4' : t.tipo === 'barberia' ? '#b8ad98' : t.tipo === 'mercado' ? '#e8dcc4' : t.tipo === 'templo' ? '#efe4cc' : '#5a5650');
    caja(W, H, 0.3, pared, 0, H / 2, -L / 2);
    caja(W, H, 0.3, pared, 0, H / 2, L / 2);
    caja(0.3, H, L, pared, -W / 2, H / 2, 0);
    caja(0.3, H, L, pared, W / 2, H / 2, 0);
    caja(1.6, 2.6, 0.08, m('#2a3442', { emissive: '#6a8ab0', emissiveIntensity: 0.6 }), 0, 1.3, L / 2 - 0.16, false);
    caja(2.2, 0.5, 0.1, m('#b02030', { emissive: '#ff3040', emissiveIntensity: 0.7 }), 0, 3.1, L / 2 - 0.2, false);
    for (const x of [-W / 4, W / 4]) for (const z of [-L / 4, L / 4]) caja(1.8, 0.06, 0.4, m('#fff', { emissive: '#fff8e8', emissiveIntensity: 1 }), x, H - 0.04, z, false);
    const aro = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffc94a', transparent: true, opacity: 0.8 }));
    aro.position.set(0, 0.03, L / 2 - 0.9); g.add(aro);
    t.interior.mostrador = new THREE.Vector3(ox + W / 2 - 3, 0, oz - L / 2 + 3.2);
    if (t.tipo === 'tienda') {
      const est = m('#fff', { map: INT[0].textura });
      for (const x of [-3.5, 0.3]) {
        caja(0.9, 2, 5, [m('#8a6a4a'), m('#8a6a4a'), m('#6a5040'), m('#6a5040'), est, est], x, 1, 0.4);
        const lado = new THREE.Mesh(new THREE.PlaneGeometry(5, 2), est); lado.rotation.y = Math.PI / 2; lado.position.set(x + 0.46, 1, 0.4); g.add(lado);
        const lado2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 2), est); lado2.rotation.y = -Math.PI / 2; lado2.position.set(x - 0.46, 1, 0.4); g.add(lado2);
      }
      const ref = m('#fff', { map: INT[1].textura, emissive: '#ffffff', emissiveMap: INT[1].textura, emissiveIntensity: 0.35 });
      for (const z of [-3, -0.6, 1.8]) { caja(0.8, 2.3, 2.3, m('#d8dde4'), -W / 2 + 0.55, 1.15, z); const f = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), ref); f.rotation.y = Math.PI / 2; f.position.set(-W / 2 + 0.96, 1.15, z); g.add(f); }
      const frente = m('#fff', { map: INT[4].textura });
      caja(4, 1.05, 1, [m('#7a5638'), m('#7a5638'), m('#c9b08a'), m('#7a5638'), frente, m('#7a5638')], W / 2 - 3, 0.52, -L / 2 + 2.6);
      caja(0.5, 0.35, 0.4, m('#2a2a2e'), W / 2 - 2.2, 1.22, -L / 2 + 2.5, false);
      caja(0.4, 0.22, 0.04, m('#40ff90', { emissive: '#40ff90', emissiveIntensity: 0.9 }), W / 2 - 2.2, 1.45, -L / 2 + 2.72, false);
      const corcho = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), m('#fff', { map: INT[5].textura })); corcho.position.set(-1, 2.6, -L / 2 + 0.17); g.add(corcho);
      const nombre = letrero(t.nombre.toUpperCase(), '#1a1d26', '#ffc94a', 6, 0.8); nombre.position.set(W / 2 - 3, 3.2, -L / 2 + 0.17); g.add(nombre);
      t.interior.mostrador.set(ox + W / 2 - 3, 0, oz - L / 2 + 3.4);
      t.cajero = this.npc(t, W / 2 - 3, -L / 2 + 1.5, { cara: (i * 3) % 8, ropa: null, camisa: '#c0392b', gorra: '#c0392b' });
    } else if (t.tipo === 'ropa') {
      for (let k = 0; k < 3; k++) {
        const z = -2.5 + k * 2.4;
        caja(4, 0.06, 0.06, m('#c0c4cc'), -2.5, 1.7, z, false);
        for (let q = 0; q < 7; q++) caja(0.08, 0.9, 0.5, m(['#e8505b', '#3c8dde', '#f2c84b', '#ffffff', '#a274d8', '#41c2c9', '#e86fa8'][(q + k) % 7]), -4.2 + q * 0.55, 1.2, z, false);
        caja(4.2, 0.4, 0.6, m('#dcd0c0'), -2.5, 0.2, z);
      }
      for (let k = 0; k < 2; k++) { const man = crearPersona({ cara: null, ropa: k * 3 + 1, estiloPelo: 'rapado', piel: '#e8e2da', pantalon: '#3a3a40', fijo: true, complexion: 1, edad: 'adulto', sinAccesorios: true, mangaCorta: false, lentes: false, barba: null }); man.grupo.position.set(2 + k * 1.6, 0, -1); man.grupo.rotation.y = 0.3; g.add(man.grupo); mundo.agregar(ox + 2 + k * 1.6 - 0.3, oz - 1.3, ox + 2 + k * 1.6 + 0.3, oz - 0.7, 2); }
      const espejo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.6), new THREE.MeshStandardMaterial({ color: '#dfe8f2', metalness: 0.55, roughness: 0.15, envMapIntensity: 1.6 })); espejo.position.set(W / 2 - 0.17, 1.5, 1.5); espejo.rotation.y = -Math.PI / 2; g.add(espejo);
      caja(3, 1.05, 1, m('#f2f0ea'), W / 2 - 3, 0.52, -L / 2 + 2.6);
      t.cajero = this.npc(t, W / 2 - 3, -L / 2 + 1.5, { cara: 1, ropa: 4 });
    } else if (t.tipo === 'barberia') {
      for (let k = 0; k < 3; k++) {
        const x = -4 + k * 3.4;
        caja(0.9, 0.5, 0.9, m('#b0202a'), x, 0.55, -L / 2 + 1.8);
        caja(0.9, 0.9, 0.15, m('#b0202a'), x, 1.1, -L / 2 + 1.3);
        caja(0.25, 0.4, 0.25, m('#c0c4cc'), x, 0.2, -L / 2 + 1.8);
        const espejo = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshStandardMaterial({ color: '#dfe8f2', metalness: 0.55, roughness: 0.15, envMapIntensity: 1.6 })); espejo.position.set(x, 2, -L / 2 + 0.17); g.add(espejo);
        caja(1.8, 0.06, 0.4, m('#f2efe8'), x, 1.15, -L / 2 + 0.4, false);
      }
      caja(5, 0.5, 0.6, m('#3a2a20'), 0, 0.25, L / 2 - 2.6);
      t.cajero = this.npc(t, -0.6, -L / 2 + 2.6, { cara: 6, ropa: 2 });
      t.interior.mostrador.set(ox - 0.6, 0, oz - L / 2 + 3.6);
    } else if (t.tipo === 'armeria') {
      caja(W - 1, 1.1, 1, m('#2a2622'), 0, 0.55, -L / 2 + 2.6);
      const panel = m('#4a3a2c'); caja(W - 1, 3, 0.1, panel, 0, 1.9, -L / 2 + 0.22, false);
      IMG_ARMAS.forEach((p, k) => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: p.textura, transparent: true })); pl.position.set(-4.2 + (k % 4) * 2.8, 2.6 - Math.floor(k / 4) * 1.1, -L / 2 + 0.3); g.add(pl); });
      t.cajero = this.npc(t, 0, -L / 2 + 1.5, { cara: 6, ropa: null, camisa: '#2b2b2b', estiloPelo: 'rapado' });
      t.interior.mostrador.set(ox, 0, oz - L / 2 + 3.4);
    } else if (t.tipo === 'cantina') {
      caja(W - 2, 1.1, 0.9, m('#3a2416'), 0, 0.55, -L / 2 + 2.4);
      caja(W - 2, 0.08, 1, m('#5a3a22'), 0, 1.14, -L / 2 + 2.4, false);
      caja(W - 1, 2.6, 0.4, m('#2a1a10'), 0, 1.6, -L / 2 + 0.35, false);
      for (let k = 0; k < 22; k++) caja(0.12, 0.34, 0.12, m(['#5a8a3a', '#a85a2a', '#e8d8a0', '#3a6a8a', '#8a2a2a'][k % 5], { emissive: '#ffb060', emissiveIntensity: 0.15 }), -5 + k * 0.48, 1.4 + (k % 2) * 0.62, -L / 2 + 0.45, false);
      for (const [x, z] of [[-3.5, 1], [0, 2.2], [3.5, 1]]) {
        const mesa = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 16), m('#6a4a2a')); mesa.position.set(x, 0.85, z); g.add(mesa);
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.82, 8), m('#2a1a10')); pata.position.set(x, 0.41, z); g.add(pata);
        mundo.agregar(ox + x - 0.6, oz + z - 0.6, ox + x + 0.6, oz + z + 0.6, 1);
        for (const a of [0, 2.1, 4.2]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10), m('#8a2a2a')); b.position.set(x + Math.cos(a) * 1, 0.25, z + Math.sin(a) * 1); g.add(b); }
      }
      const rockola = caja(1, 1.8, 0.7, m('#5a1a3a', { emissive: '#ff4f9a', emissiveIntensity: 0.6 }), W / 2 - 0.8, 0.9, 2);
      rockola.material.emissiveIntensity = 0.5;
      t.parroquianos = [];
      for (const [x, z] of [[-3.5, 1], [0, 2.2], [3.5, 1]]) for (const a of [0, 2.1]) { const p = crearPersona({ sinAccesorios: Math.random() < 0.5, fijo: false, sombrero: Math.random() < 0.4 }); p.grupo.position.set(x + Math.cos(a) * 1, 0, z + Math.sin(a) * 1); p.grupo.rotation.y = Math.atan2(x - p.grupo.position.x, z - p.grupo.position.z); sentar(p); g.add(p.grupo); t.parroquianos.push({ p, fase: Math.random() * 6 }); }
      t.norteño = [];
      for (let k = 0; k < 3; k++) { const p = crearPersona({ camisa: ['#1d3f8a', '#8a2a26', '#f2efe6'][k], pantalon: '#1a1a1e', fijo: true, sinAccesorios: true, sombrero: true }); p.grupo.position.set(-W / 2 + 1.6 + k * 1.1, 0, L / 2 - 2.4); p.grupo.rotation.y = Math.PI * 0.85; g.add(p.grupo); t.norteño.push({ p, k }); }
      t.cantina = { t: 0, prox: 0, nota: 0 };
      t.cajero = this.npc(t, 0, -L / 2 + 1.3, { cara: 2, ropa: 2 });
      t.interior.mostrador.set(ox, 0, oz - L / 2 + 3.3);
    } else if (t.tipo === 'antro') {
      const baldosas = [];
      for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++) { const k = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#301040' })); k.position.set(-3.2 + a * 1.25, 0.03, -2 + b * 1.25); g.add(k); baldosas.push(k); }
      caja(4.2, 1.1, 1, m('#1a1a22', { emissive: '#4f3fff', emissiveIntensity: 0.25 }), 0, 0.55, -L / 2 + 1.1);
      caja(1.6, 0.12, 0.6, m('#2a2a30'), 0, 1.16, -L / 2 + 1.1, false);
      caja(1, 1.1, 5, m('#24141e'), W / 2 - 1.2, 0.55, 0.5);
      for (let k = 0; k < 10; k++) caja(0.1, 0.3, 0.1, m(['#4fe08a', '#ff4fd8', '#3fd2ff', '#ffd84a'][k % 4], { emissive: ['#4fe08a', '#ff4fd8', '#3fd2ff', '#ffd84a'][k % 4], emissiveIntensity: 0.6 }), W / 2 - 0.35, 1.4 + (k % 2) * 0.5, -1.6 + Math.floor(k / 2) * 0.8, false);
      const focos = [];
      for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.6, 18, 1, true), new THREE.MeshBasicMaterial({ color: '#ff4fd8', transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); c.position.set(-4 + k * 2.7, H - 1.8, -0.5); g.add(c); focos.push(c); }
      const dj = crearPersona({ camisa: '#111', ropa: null, fijo: true, sinAccesorios: true, gorra: '#ff4fd8', mangaCorta: true, lentes: true });
      const aud = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 14, Math.PI), m('#111')); aud.position.set(0, 0.17, 0); aud.rotation.z = 0; dj.cabeza.add(aud);
      dj.grupo.position.set(0, 0, -L / 2 + 0.4); g.add(dj.grupo);
      const bailarines = [];
      for (let k = 0; k < 9; k++) { const p = crearPersona({ sinAccesorios: k % 3 !== 0, fijo: false }); p.grupo.position.set(-3 + (k % 3) * 2.4 + (Math.random() - 0.5), 0, -1.6 + Math.floor(k / 3) * 1.3 + (Math.random() - 0.5) * 0.5); p.grupo.rotation.y = Math.random() * 6; g.add(p.grupo); bailarines.push({ p, fase: Math.random() * 6, estilo: k % 3 }); }
      t.antro = { baldosas, focos, dj, bailarines, t: 0 };
      t.cajero = this.npc(t, W / 2 - 0.5, 0.5, { cara: 5, ropa: 6 });
      t.interior.mostrador.set(ox + W / 2 - 2.2, 0, oz + 0.5);
    } else if (t.tipo === 'templo') {
      const madera = m('#8a5a34'), oro = m('#d8b04a', { emissive: '#7a5a10', emissiveIntensity: 0.3 });
      for (const s2 of [-1, 1]) for (let k = 0; k < 7; k++) { const z = -4 + k * 2.4; caja(5.2, 0.45, 0.5, madera, s2 * 3.6, 0.45, z, true); caja(5.2, 0.8, 0.08, madera, s2 * 3.6, 0.85, z + 0.24, false); }
      for (const s2 of [-1, 1]) for (let k = 0; k < 5; k++) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, H, 14), m('#e6d8b8')); col.position.set(s2 * 6.6, H / 2, -11 + k * 5.5); g.add(col); mundo.agregar(ox + s2 * 6.6 - 0.5, oz - 11 + k * 5.5 - 0.5, ox + s2 * 6.6 + 0.5, oz - 11 + k * 5.5 + 0.5, H); }
      caja(8, 0.6, 4, m('#d8ccb0'), 0, 0.3, -L / 2 + 3);
      caja(3.2, 1.1, 1.2, m('#f4efe2'), 0, 1.15, -L / 2 + 2.6);
      caja(6, 7.5, 0.4, oro, 0, 4.6, -L / 2 + 0.4, false);
      for (let k = 0; k < 5; k++) caja(0.9, 2.4, 0.1, m(['#7a3ab0', '#2a5ab8', '#c8202e', '#2a5ab8', '#7a3ab0'][k], { emissive: '#ffffff', emissiveIntensity: 0.15 }), -2.4 + k * 1.2, 4.8, -L / 2 + 0.62, false);
      const cruz = new THREE.Group(); const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 0.15), oro); const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.15), oro); c2.position.y = 0.5; cruz.add(c1, c2); cruz.position.set(0, 8.6, -L / 2 + 0.7); g.add(cruz);
      const vitral = (x, z, ry) => { const c = document.createElement('canvas'); c.width = 64; c.height = 160; const q = c.getContext('2d'); const cols = ['#c8202e', '#2a5ab8', '#f2c14e', '#3a8f5c', '#7a3ab0']; for (let y = 0; y < 160; y += 16) for (let x2 = 0; x2 < 64; x2 += 16) { q.fillStyle = cols[(x2 / 16 + y / 16) % cols.length | 0]; q.fillRect(x2, y, 15, 15); } q.globalCompositeOperation = 'destination-in'; q.beginPath(); q.moveTo(0, 160); q.lineTo(0, 32); q.arc(32, 32, 32, Math.PI, 0); q.lineTo(64, 160); q.fill(); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const v = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4), new THREE.MeshBasicMaterial({ map: tx, transparent: true, toneMapped: false })); v.position.set(x, 6.5, z); v.rotation.y = ry; g.add(v); };
      for (const s2 of [-1, 1]) for (let k = 0; k < 4; k++) vitral(s2 * (W / 2 - 0.2), -9 + k * 6, -s2 * Math.PI / 2);
      t.velas = [];
      for (let k = 0; k < 14; k++) { const x = 4.6 + (k % 7) * 0.25, z = -L / 2 + 5 + Math.floor(k / 7) * 0.3; const v = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6), m('#f4efe2')); v.position.set(x, 1.0, z); g.add(v); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffcf6a', toneMapped: false })); fl.position.set(x, 1.13, z); fl.visible = k < 5; g.add(fl); t.velas.push(fl); }
      caja(2, 0.9, 0.7, m('#5a3a22'), 5.4, 0.45, -L / 2 + 5.15);
      t.cajero = this.npc(t, 5.4, -L / 2 + 6.4, { cara: 1, ropa: null, camisa: '#1a1a1e', pantalon: '#1a1a1e' });
      t.interior.mostrador.set(ox + 5.4, 0, oz - L / 2 + 7.2);
      const luz = new THREE.PointLight('#ffd9a0', 14, 18, 1.4); luz.position.set(0, 5, -L / 2 + 4); g.add(luz);
    } else if (t.tipo === 'mercado') {
      const azulejo = m('#3a8f6a'); caja(W - 0.4, 1.4, 0.05, azulejo, 0, 0.7, -L / 2 + 0.18, false); caja(0.05, 1.4, L - 0.4, azulejo, -W / 2 + 0.18, 0.7, 0, false); caja(0.05, 1.4, L - 0.4, azulejo, W / 2 - 0.18, 0.7, 0, false);
      for (const x of [-W / 3, 0, W / 3]) for (const z of [-L / 3, L / 6]) caja(2.4, 0.06, 0.5, m('#fff', { emissive: '#fff4d8', emissiveIntensity: 1 }), x, H - 0.04, z, false);
      const lonas = ['#e8317a', '#2a7de0', '#ff7a1a', '#f2c14e', '#2fbf71', '#7a3ab0'];
      const fruta = ['#ff8a1a', '#d8202e', '#f2d23a', '#6ab83a', '#ff5a3a', '#7a2a6a'];
      let n = 0;
      for (const x of [-8, -2.5, 2.5, 8]) for (const z of [-6, 0.5]) {
        n++;
        caja(3.6, 0.95, 1.6, m('#8a6a4a'), x, 0.48, z);
        caja(3.7, 0.06, 1.7, m('#c9b08a'), x, 0.98, z, false);
        const l = caja(4, 0.08, 2.2, m(lonas[n % lonas.length]), x, 2.6, z, false); l.rotation.x = 0.12;
        for (const sx of [-1.8, 1.8]) caja(0.06, 2.6, 0.06, m('#7a7f86'), x + sx, 1.3, z - 0.9, false);
        const tipoP = n % 4;
        for (let k = 0; k < 10; k++) {
          const px = x - 1.5 + (k % 5) * 0.75, pz = z - 0.35 + Math.floor(k / 5) * 0.7;
          if (tipoP === 0) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), m(fruta[k % fruta.length])); f.position.set(px, 1.12, pz); g.add(f); }
          else if (tipoP === 1) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.35), m(['#b84a3a', '#d87a6a', '#a03a2a'][k % 3])); f.position.set(px, 1.07, pz); g.add(f); }
          else if (tipoP === 2) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), m(['#e8317a', '#f2c14e', '#ffffff', '#d8202e'][k % 4])); f.position.set(px, 1.25, pz); f.rotation.x = Math.PI; g.add(f); }
          else { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 10), m(['#c9a040', '#7a4a2a', '#3a8f3a'][k % 3])); f.position.set(px, 1.15, pz); g.add(f); }
        }
        if (n % 2) this.npc(t, x, z - 1.3, { cara: (n * 2) % 8, ropa: n % 7, mangaCorta: true });
      }
      caja(5.5, 1.05, 1.2, m('#7a3a2a'), 0, 0.52, -L / 2 + 2.2);
      const fonda = letrero('FONDA DOÑA CHUY · BIRRIA Y TORTAS AHOGADAS', '#7a2a1a', '#ffe2a0', 9, 0.9); fonda.position.set(0, 3.6, -L / 2 + 0.17); g.add(fonda);
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 10), m('#c8202e')); b.position.set(-2 + k * 1.3, 0.3, -L / 2 + 3.4); g.add(b); }
      for (let k = 0; k < 6; k++) { const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), m(lonas[k % lonas.length], { side: THREE.DoubleSide })); pp.position.set(-10 + k * 4, H - 1.2, 0); g.add(pp); }
      t.cajero = this.npc(t, 0, -L / 2 + 1.2, { cara: 4, ropa: null, camisa: '#f2efe6', mujer: true, peloLargo: true });
      t.interior.mostrador.set(ox, 0, oz - L / 2 + 3.4);
    } else if (t.tipo === 'arena') {
      const rz = -2.5;
      caja(6.4, 1.0, 6.4, m('#2a2c34'), 0, 0.5, rz);
      const lona = new THREE.Mesh(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2), m('#2a5ab8')); lona.position.set(0, 1.01, rz); g.add(lona);
      for (const [sx, sz, c] of [[-1, -1, '#c8202e'], [1, 1, '#2a5ab8'], [1, -1, '#f2f2f2'], [-1, 1, '#f2f2f2']]) caja(0.22, 1.6, 0.22, m(c), sx * 3, 1.8, rz + sz * 3, false);
      for (const y of [1.45, 1.85, 2.25]) { for (const s2 of [-1, 1]) { caja(6, 0.05, 0.05, m(['#c8202e', '#f2f2f2', '#2a5ab8'][Math.round((y - 1.45) / 0.4)]), 0, y, rz + s2 * 3, false); caja(0.05, 0.05, 6, m(['#c8202e', '#f2f2f2', '#2a5ab8'][Math.round((y - 1.45) / 0.4)]), s2 * 3, y, rz, false); } }
      caja(4, 0.4, 4, m('#1a1a1e', { emissive: '#fff4d0', emissiveIntensity: 0.9 }), 0, H - 0.6, rz, false);
      for (const s2 of [-1, 1]) for (let f = 0; f < 3; f++) caja(1.2, 0.5 + f * 0.5, 13, m('#3a3a44'), s2 * (6.8 + f * 1.2), 0.25 + f * 0.25, rz + 1, true);
      const mascara = (p, col, ojos) => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 128, 64); x.fillStyle = ojos; for (const ex of [40, 88]) { x.beginPath(); x.ellipse(ex, 30, 13, 8, 0, 0, 7); x.fill(); } x.strokeStyle = '#ffd23a'; x.lineWidth = 4; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 20); x.stroke(); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const k = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 12), new THREE.MeshLambertMaterial({ map: tx })); k.position.set(0, 0.06, 0.01); k.scale.set(1, 1.15, 1.08); k.rotation.y = -Math.PI / 2; p.cabeza.add(k); };
      const rudo = crearPersona({ camisa: '#1a1a1e', pantalon: '#c8202e', ropa: null, fijo: true, sinAccesorios: true, mangaCorta: true, complexion: 1.25 }); mascara(rudo, '#c8202e', '#1a1a1e');
      const tecnico = crearPersona({ camisa: '#f2f2f2', pantalon: '#2a5ab8', ropa: null, fijo: true, sinAccesorios: true, mangaCorta: true, complexion: 1.1 }); mascara(tecnico, '#c9ced6', '#2a5ab8');
      for (const p of [rudo, tecnico]) { p.grupo.position.set(0, 1.0, rz); g.add(p.grupo); }
      const publico = [];
      for (let k = 0; k < 26; k++) { const s2 = k % 2 ? 1 : -1, f = (k >> 1) % 3, p = crearPersona({ sinAccesorios: k % 3 !== 0, fijo: false }); p.grupo.position.set(s2 * (6.8 + f * 1.2), 0.5 + f * 0.5, rz - 4.5 + ((k >> 1) / 3 | 0) * 1.1 + (Math.random() - 0.5) * 0.3); p.grupo.rotation.y = s2 > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(p.grupo); publico.push({ p, fase: Math.random() * 6 }); }
      const cartel = (titulo, sub, fondo, x, z, ry, w = 3.2, h = 4.2) => { const c = document.createElement('canvas'); c.width = 256; c.height = 340; const q = c.getContext('2d'); q.fillStyle = fondo; q.fillRect(0, 0, 256, 340); q.fillStyle = '#ffd23a'; q.fillRect(0, 0, 256, 18); q.fillRect(0, 322, 256, 18); q.fillStyle = '#fff'; q.textAlign = 'center'; q.font = '900 34px Impact, Arial Black, sans-serif'; titulo.split('|').forEach((l, i) => q.fillText(l, 128, 90 + i * 44)); q.fillStyle = '#ffd23a'; q.font = '800 22px Arial, sans-serif'; sub.split('|').forEach((l, i) => q.fillText(l, 128, 240 + i * 28)); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx })); pl.position.set(x, 3.2, z); pl.rotation.y = ry; g.add(pl); };
      cartel('LUCHA|LIBRE|ESTA NOCHE', 'EL HIJO DEL JACARANDA|VS|EL RUDO DEL NOPAL', '#7a1020', -5, -L / 2 + 0.05, 0);
      cartel('MÁSCARA|CONTRA|MÁSCARA', 'DOMINGO 8 PM|ARENA JACARANDA', '#10307a', 5, -L / 2 + 0.05, 0);
      cartel('ARENA|JACARANDA', 'DESDE 1958|CATEDRAL DEL PANCRACIO', '#1a1a1e', -W / 2 + 0.05, -2, Math.PI / 2, 3.6, 4.4);
      cartel('RUDOS|VS|TÉCNICOS', 'BOLETOS EN|TAQUILLA', '#5a1a7a', W / 2 - 0.05, -2, -Math.PI / 2, 3.6, 4.4);
      t.arena = { rudo, tecnico, publico, rz, t: 0, combate: 0, apuesta: null, caida: null, ruido: 0 };
      t.cajero = this.npc(t, -W / 2 + 2.2, L / 2 - 3.2, { cara: 3, ropa: 5 });
      caja(2.6, 1.1, 0.8, m('#3a1a10'), -W / 2 + 2.2, 0.55, L / 2 - 4.3);
      t.interior.mostrador.set(ox - W / 2 + 2.2, 0, oz + L / 2 - 5.2);
    } else if (t.tipo === 'gimnasio') {
      caja(W - 0.6, 2.2, 0.05, new THREE.MeshStandardMaterial({ color: '#dfe8f2', metalness: 0.55, roughness: 0.15 }), 0, 1.6, -L / 2 + 0.2, false);
      caja(1.6, 0.45, 0.5, m('#2a2a30'), -4, 0.42, -2.6); caja(0.08, 1.4, 0.08, m('#888'), -4.6, 0.7, -3.2, false); caja(0.08, 1.4, 0.08, m('#888'), -3.4, 0.7, -3.2, false);
      const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8), m('#c0c4cc')); barra.rotation.z = Math.PI / 2; barra.position.set(-4, 1.35, -3.2); g.add(barra);
      for (const s2 of [-1, 1]) { const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), m('#1a1a1a')); disco.rotation.z = Math.PI / 2; disco.position.set(-4 + s2 * 0.8, 1.35, -3.2); g.add(disco); }
      caja(0.9, 0.25, 2.2, m('#1a1a1e'), 0, 0.2, -2.6); caja(0.9, 1.2, 0.12, m('#2a2a30'), 0, 0.8, -3.6, false);
      const costal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 14), m('#8a2a2a')); costal.position.set(4, 1.55, -2.6); g.add(costal); this.costal = costal;
      caja(0.05, 1, 0.05, m('#444'), 4, 2.6, -2.6, false);
      mundo.agregar(ox + 3.7, oz - 2.9, ox + 4.3, oz - 2.3, 2);
    } else if (t.tipo === 'depa') {
      caja(2.2, 0.5, 2.6, m('#3a5a8a'), -4.8, 0.25, -3); caja(2.2, 0.2, 0.6, m('#f0ece4'), -4.8, 0.6, -4);
      caja(2.6, 0.5, 0.9, m('#6a4a3a'), 1, 0.25, 2.4); caja(2.6, 0.6, 0.25, m('#6a4a3a'), 1, 0.7, 2.8, false);
      caja(2, 1.1, 0.08, m('#111', { emissive: '#3a7ad8', emissiveIntensity: 0.6 }), 1, 1.5, -L / 2 + 0.2, false);
      caja(3, 0.95, 0.7, m('#d8d0c0'), W / 2 - 1.8, 0.48, -2);
      caja(1.6, 2.4, 0.6, m('#5a3a24'), W / 2 - 0.5, 1.2, 1.5);
      const tapete = new THREE.Mesh(new THREE.PlaneGeometry(3, 2).rotateX(-Math.PI / 2), m('#8a3a5a')); tapete.position.set(1, 0.02, 0.5); g.add(tapete);
    }
    const cat = this.catalogo(t).articulos;
    const ORD = ['puno', 'bate', 'cuchillo', 'pistola', 'escopeta', 'subfusil', 'rifle', 'granada'];
    if (t.tipo === 'tienda') cat.forEach((a, k) => this.zona(t, W / 2 - 4.4 + k * 1.3, -L / 2 + 3.6, a, 1.75));
    else if (t.tipo === 'armeria') {
      const armas = cat.filter(a => ORD.includes(a.id));
      armas.forEach((a, k) => {
        const x = -4.5 + k * 1.5;
        this.zona(t, x, -L / 2 + 3.5, a, 1.85);
        const img = IMG_ARMAS[ORD.indexOf(a.id)];
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshBasicMaterial({ map: img.textura, transparent: true, alphaTest: 0.3 }));
        pl.rotation.x = -1.1; pl.position.set(x, 1.2, -L / 2 + 2.7); g.add(pl);
      });
      cat.filter(a => !ORD.includes(a.id)).forEach((a, k) => { const z = -2.2 + k * 1.25; this.zona(t, -W / 2 + 1.3, z, a, 1.7); caja(0.6, 0.6, 0.8, m('#4a5a3a'), -W / 2 + 0.5, 0.3, z); });
    } else if (t.tipo === 'ropa') {
      cat.forEach((a, k) => {
        const izq = k < 5, x = izq ? -W / 2 + 1 : W / 2 - 1, z = izq ? -3.6 + k * 1.75 : -0.6 + (k - 5) * 1.75;
        this.maniqui(t, x, z, izq ? Math.PI / 2 : -Math.PI / 2, { ropa: k < 8 ? k : null }, k === 8 ? '#7a2f3a' : null);
        this.zona(t, x + (izq ? 1.1 : -1.1), z, a, 2.05);
      });
    } else if (t.tipo === 'barberia') {
      cat.forEach((a, k) => {
        const izq = k < 3, x = izq ? -W / 2 + 1 : W / 2 - 1, z = -0.4 + (k % 3) * 1.9;
        this.maniqui(t, x, z, izq ? Math.PI / 2 : -Math.PI / 2, { cara: [0, 1, 6, 4, 2, 5][k], estiloPelo: ESTILOS_PELO[k], piel: '#c08a62', ropa: 2 });
        this.zona(t, x + (izq ? 1.1 : -1.1), z, a, 2.1);
      });
    } else if (t.tipo === 'cantina') cat.forEach((a, k) => this.zona(t, -3 + k * 2, -L / 2 + 3.4, a, 1.75));
    else if (t.tipo === 'gimnasio') [[-4, -1.6], [0, -1.2], [4, -1.6]].forEach(([x, z], k) => cat[k] && this.zona(t, x, z, cat[k], 2.2));
    else if (t.tipo === 'depa') [[-3.2, -2.6], [W / 2 - 1.6, 1.5], [1, 1.4]].forEach(([x, z], k) => cat[k] && this.zona(t, x, z, cat[k], 1.6));
  }

  ajedrez() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#f2f2f2'; g.fillRect(x * 32, y * 32, 32, 32); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 8); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
    return t;
  }

  npc(t, x, z, vestido) {
    const q = new Peaton(this.j, { x: t.interior.ox + x, z: t.interior.oz + z, estado: 'quieto', vestido });
    q.yaw = 0; q.objetivoMision = true; q.enInterior = t; q.salud = 50;
    q.grupo.visible = false;
    this.j.peatones.push(q);
    return q;
  }

  marcasMapa() { return this.tiendas.map(t => ({ x: t.puerta.x, z: t.puerta.z, tipo: 'icono', ic: { c: COLOR_ICONO[t.tipo], t: LETRA[t.tipo], n: t.nombre } })).concat((this.cajeros || []).map(c => ({ x: c.x, z: c.z, tipo: 'icono', ic: { c: '#3bd16f', t: '$', n: 'Cajero automático' } }))); }

  cerca() {
    const p = this.j.jugador.pos;
    if (!this.dentro) return null;
    const T = this.dentro, M = T.interior.mostrador;
    if (T.tipo !== 'depa' && M && Math.hypot(p.x - M.x, p.z - M.z) < 2.6) return { mostrador: true };
    let mejor = null, md = 0.85;
    for (const z of this.dentro.zonas) { const d = Math.hypot(p.x - z.x, p.z - z.z); if (d < md) { md = d; mejor = z; } }
    return mejor;
  }

  interactuar() {
    const z = this.cerca();
    if (!z || this.robo) return false;
    if (z.mostrador) { this.j.actividades.abrirTienda(this.catalogo(this.dentro)); return true; }
    this.j.actividades.comprarArticulo(z.art);
    return true;
  }

  actualizarPuertas() {
    const j = this.j, jug = j.jugador;
    if (jug.coche || jug.muerto || j.overlay || j.foto) return;
    const p = jug.pos;
    if (this.bloqueo) { if (Math.hypot(p.x - this.bloqueo.x, p.z - this.bloqueo.z) > 1.5) this.bloqueo = null; else return; }
    if (!this.dentro) {
      for (const t of this.tiendas) {
        const d = Math.hypot(p.x - t.puerta.x, p.z - t.puerta.z);
        if (d > 3) continue;
        const cerrado = t.tipo === 'depa' && !j.propiedades?.depa;
        if (cerrado) { j.hud.pista('P', 'Departamento en venta · cómpralo con el teléfono'); continue; }
        if (d < 0.95) { this.entrar(t); return; }
        j.hud.pista('W', 'Camina a la puerta · ' + t.nombre);
      }
    } else {
      const I = this.dentro.interior;
      if (Math.hypot(p.x - I.salida.x, p.z - I.salida.z) < 0.85) this.salir();
    }
  }

  fundido() { const f = document.getElementById('fundido'); f.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on'))); }

  entrar(t) {
    const j = this.j, jug = j.jugador;
    this.fundido();
    for (const x of this.tiendas) x.interior.g.visible = false;
    t.interior.g.visible = true;
    for (const q of j.peatones) if (q.enInterior) q.grupo.visible = q.enInterior === t;
    this.dentro = t;
    jug.interior = t;
    jug.pos.copy(t.interior.entrada);
    this.bloqueo = t.interior.salida.clone();
    jug.yaw = Math.PI; j.camYaw = Math.PI; j.camPitch = -0.15;
    const I = t.interior;
    this.luz1.position.set(I.ox - 3, 3.4, I.oz); this.luz2.position.set(I.ox + 3, 3.4, I.oz - 2);
    const oscuro = t.tipo === 'antro'; this.luz1.intensity = oscuro ? 2.5 : 9; this.luz2.intensity = oscuro ? 2.5 : 9; this.luz1.color.set(oscuro ? '#ff4fd8' : '#ffe2b0'); this.luz2.color.set(oscuro ? '#3fd2ff' : '#fff0d8'); this.avisoAlerta = false;
    j.audio.ui(660);
    j.audio.puerta?.();
    j.hud.notificar('tienda', t.nombre, t.tipo === 'tienda' ? (t.robadaHasta > j.reloj ? 'Ya la robaste hace poco: el cajero está alerta.' : 'Párate frente a un producto y presiona E… o apunta al cajero para robarla.') : t.tipo === 'depa' ? 'Tu casa: aquí puedes dormir y guardar.' : 'Párate frente a lo que quieras y presiona E.', 5);
    if (t.tipo === 'cantina') { j.audio.estacion = 0; j.audio.radioActiva(false); }
    if (j.policia.estrellas > 0) j.hud.notificar('alerta', 'La policía te espera afuera', 'Mientras estés aquí no se van a ir.', 4);
  }

  salir() {
    const j = this.j, jug = j.jugador, t = this.dentro;
    this.fundido();
    this.cancelarRobo();
    t.interior.g.visible = false;
    for (const q of j.peatones) if (q.enInterior) q.grupo.visible = false;
    this.dentro = null; jug.interior = null;
    jug.pos.set(t.puerta.x + t.fx * 0.9, 0, t.puerta.z + t.fz * 0.9);
    this.bloqueo = t.puerta.clone();
    if (t.tipo === 'cantina') j.audio.radioActiva(false);
    jug.yaw = t.rot; j.camYaw = t.rot; j.camPitch = -0.1;
    this.luz1.intensity = 0; this.luz2.intensity = 0;
    j.audio.puerta?.();
  }

  catalogo(t) {
    const j = this.j;
    if (t.tipo === 'armeria') return { titulo: 'ARMERÍA DEL VALLE', sub: 'PAGO EN EFECTIVO, SIN PREGUNTAS', articulos: ARTICULOS };
    if (t.tipo === 'cantina' && j.propiedades?.cantina) return { titulo: 'CANTINA', sub: '', articulos: [
      { id: 'cerveza', nombre: 'Cerveza de la casa', precio: 0, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 10); j.mareo = Math.min(90, (j.mareo || 0) + 18); } },
      { id: 'botana', nombre: 'Botana de la casa', precio: 0, verbo: 'Comer', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 30); } }
    ] };
    if (t.tipo === 'cantina') return { titulo: 'CANTINA', sub: '', articulos: [
      { id: 'cerveza', nombre: 'Cerveza', precio: 25, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 10); j.mareo = Math.min(90, (j.mareo || 0) + 18); } },
      { id: 'tequila', nombre: 'Tequila', precio: 45, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 15); j.mareo = Math.min(90, (j.mareo || 0) + 35); } },
      { id: 'jamaica', nombre: 'Agua de jamaica', precio: 12, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 15); j.mareo = Math.max(0, (j.mareo || 0) - 20); } },
      { id: 'botana', nombre: 'Botana de la casa', precio: 30, verbo: 'Comer', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 30); } }
    ] };
    if (t.tipo === 'antro') return { titulo: 'ANTRO NEÓN', sub: 'BARRA LIBRE DE BUEN AMBIENTE', articulos: [
      { id: 'cerveza', nombre: 'Cerveza', precio: 40, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 10); j.mareo = Math.min(90, (j.mareo || 0) + 18); } },
      { id: 'tequila', nombre: 'Tequila', precio: 70, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 15); j.mareo = Math.min(90, (j.mareo || 0) + 35); } },
      { id: 'jamaica', nombre: 'Agua de jamaica', precio: 25, verbo: 'Tomar', dar: jj => { j.mareo = Math.max(0, (j.mareo || 0) - 25); } },
      { id: 'bailar', nombre: 'Bailar en la pista', precio: 0, verbo: 'Bailar', desc: 'La gente te graba y subes seguidores.', dar: jj => { jj.gesto = { tipo: 'bailar', t: 8 }; j.redes.seguidores += 20 + (Math.random() * 30 | 0); j.redes.publicar('foto', '', { forzar: true }); j.actividades.cerrarTienda(); } }
    ] };
    if (t.tipo === 'templo') return { titulo: 'CATEDRAL DE SANTA JACARANDA', sub: 'UN MOMENTO DE PAZ', articulos: [
      { id: 'veladora', nombre: 'Encender una veladora', precio: 5, verbo: 'Encender', desc: 'Te sientes en paz: recuperas toda la salud.', dar: jj => { jj.salud = jj.saludMax; const v = t.velas?.find(f => !f.visible); if (v) v.visible = true; j.hud.notificar('ok', 'Veladora encendida', 'Recuperaste toda la salud.', 3); } },
      { id: 'limosna', nombre: 'Dejar limosna', precio: 50, verbo: 'Dar', desc: 'La policía se olvida un poco de ti.', dar: () => { if (j.policia.estrellas) { j.policia.estrellas = Math.max(0, j.policia.estrellas - 1); j.hud.notificar('ok', 'Que Dios se lo pague', 'Bajó una estrella.', 3); } else j.hud.notificar('ok', 'Que Dios se lo pague', '', 2); } }
    ] };
    if (t.tipo === 'mercado') return { titulo: 'MERCADO DE SAN JACINTO', sub: 'FONDA DOÑA CHUY', articulos: [
      { id: 'birria', nombre: 'Plato de birria', precio: 70, verbo: 'Comer', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 60); } },
      { id: 'torta', nombre: 'Torta ahogada', precio: 55, verbo: 'Comer', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 45); } },
      { id: 'jugo', nombre: 'Jugo de naranja', precio: 25, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 20); } },
      { id: 'tejuino', nombre: 'Tejuino con nieve de limón', precio: 30, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 25); j.mareo = Math.max(0, (j.mareo || 0) - 15); } }
    ] };
    if (t.tipo === 'arena') {
      const apostar = (lado, monto) => jj => { const A = t.arena; if (!A) return; if (A.combate > 0) { j.hud.notificar('info', 'Ya hay una lucha', 'Espera a que termine esta caída.', 3); jj.dinero += monto; return; } A.apuesta = { lado, monto }; A.combate = 14; A.caida = null; j.audio.tono(880, 0.5, 0.18, 'triangle'); j.hud.grande('¡A LA LONA!', 'Apostaste $' + monto + ' al ' + (lado === 'rudo' ? 'Rudo' : 'Técnico'), 2); };
      return { titulo: 'ARENA JACARANDA', sub: 'LUCHA LIBRE · RUDOS CONTRA TÉCNICOS', articulos: [
        { id: 'rudo', nombre: 'Apostar $100 al Rudo (rojo)', precio: 100, verbo: 'Apostar', desc: 'Si gana, cobras el doble.', dar: apostar('rudo', 100) },
        { id: 'tecnico', nombre: 'Apostar $100 al Técnico (azul)', precio: 100, verbo: 'Apostar', desc: 'Si gana, cobras el doble.', dar: apostar('tecnico', 100) },
        { id: 'cerveza', nombre: 'Cerveza', precio: 35, verbo: 'Tomar', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 10); j.mareo = Math.min(90, (j.mareo || 0) + 18); } },
        { id: 'torta', nombre: 'Torta ahogada', precio: 55, verbo: 'Comer', dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + 40); } }
      ] };
    }
    if (t.tipo === 'gimnasio') return { titulo: 'GIMNASIO', sub: '', articulos: [
      { id: 'pesas', nombre: 'Pesas: +10 de salud máxima', precio: 120, verbo: 'Entrenar', dar: jj => { jj.saludMax = Math.min(160, jj.saludMax + 10); jj.salud = jj.saludMax; j.hud.grande('+10 SALUD MÁXIMA', 'Ahora tienes ' + jj.saludMax, 2.2, 'exito'); }, tiene: jj => jj.saludMax >= 160 },
      { id: 'caminadora', nombre: 'Caminadora: corres más rápido', precio: 80, verbo: 'Entrenar', dar: jj => { jj.bonoVel = Math.min(0.2, jj.bonoVel + 0.04); j.hud.grande('+4% VELOCIDAD', 'Corres ' + Math.round(jj.bonoVel * 100) + '% más rápido', 2.2, 'exito'); }, tiene: jj => jj.bonoVel >= 0.2 },
      { id: 'costal', nombre: 'Costal: golpes más fuertes', precio: 80, verbo: 'Entrenar', dar: jj => { jj.bonoGolpe = Math.min(0.6, jj.bonoGolpe + 0.12); j.hud.grande('+12% FUERZA', 'Tus golpes pegan ' + Math.round(jj.bonoGolpe * 100) + '% más', 2.2, 'exito'); if (this.costal) this.costal.rotation.x = 0.4; }, tiene: jj => jj.bonoGolpe >= 0.6 }
    ] };
    if (t.tipo === 'depa') return { titulo: 'TU DEPARTAMENTO', sub: '', articulos: [
      { id: 'dormir', nombre: 'Dormir: te cura y guarda', precio: 0, verbo: '', dar: jj => this.dormir() },
      { id: 'closet', nombre: 'Clóset: tu ropa de siempre', precio: 0, verbo: '', dar: jj => jj.vestir({ ropa: null }) },
      { id: 'sofa', nombre: 'Cambiar de protagonista', precio: 0, verbo: '', dar: () => { j.duo.pos.copy(j.jugador.pos); j.duo.cambiar(); } }
    ] };
    if (t.tipo === 'ropa') return {
      titulo: 'BOUTIQUE LA JACARANDA', sub: 'TE LO PROBAMOS AQUÍ MISMO',
      articulos: ROPA.map((p, i) => ({ id: 'ropa' + i, nombre: ROPA_NOMBRES[i], precio: 120 + i * 15, desc: 'Te cambias al instante.', icono: p.url ? `<img src="${p.url}" alt="" style="border-radius:8px">` : ICONO.tienda, dar: jj => jj.vestir({ ropa: i }), tiene: jj => jj.estilo.ropa === i }))
        .concat([{ id: 'chamarra', nombre: 'Chamarra guinda', precio: 0, desc: 'Tu look de siempre.', icono: ICONO.ok, dar: jj => jj.vestir({ ropa: null }), tiene: jj => jj.estilo.ropa === null }])
    };
    if (t.tipo === 'barberia') return {
      titulo: 'BARBERÍA EL BIGOTE', sub: 'CORTE, BARBA Y BUENA PLÁTICA',
      articulos: ESTILOS_PELO.map(e => ({ id: 'pelo' + e, nombre: PELO_NOMBRES[e], precio: e === 'sombrero' ? 180 : e === 'gorra' ? 90 : 60, desc: 'Quedas como nuevo.', icono: ICONO_PELO[e], dar: jj => jj.vestir({ estiloPelo: e }), tiene: jj => jj.estilo.estiloPelo === e }))
    };
    const comida = {
      0: [['Papitas y refresco', 25, 20], ['Torta de jamón', 40, 35], ['Bebida energética', 35, 15, true]],
      1: [['Kilo de tortillas', 22, 25], ['Tacos de canasta', 45, 40]],
      2: [['Venda y alcohol', 60, 40], ['Botiquín completo', 160, 100], ['Suero', 30, 20]],
      3: [['Plato de birria', 90, 70], ['Consomé', 40, 30]],
      4: [['Cinta y pegamento (repara coche)', 120, 0, false, true]],
      5: [['Concha', 12, 10], ['Bolsa de pan dulce', 45, 35]],
      6: [['Coctel de camarón', 110, 60], ['Tostada de ceviche', 50, 30]]
    }[t.letrero] || [['Botana', 20, 15]];
    return {
      titulo: t.nombre.toUpperCase(), sub: 'PRECIOS DE BARRIO',
      articulos: comida.map(([n, precio, cura, nitro, repara], k) => ({ id: 'c' + k, nombre: n, precio, desc: repara ? 'Deja tu último coche como nuevo.' : `Recupera ${cura} de salud${nitro ? ' y llena el nitro' : ''}.`, icono: ICONO.ok,
        dar: jj => { jj.salud = Math.min(jj.saludMax, jj.salud + cura); if (nitro) j.nitro = 1; if (repara && j.ultimoCoche) j.ultimoCoche.salud = j.ultimoCoche.t.salud; }, tiene: jj => cura > 0 && jj.salud >= jj.saludMax && !nitro, tieneTxt: 'Tu salud está al máximo' }))
    };
  }

  dormir() {
    const j = this.j;
    const f = document.getElementById('fundido'); f.classList.add('on');
    setTimeout(() => f.classList.remove('on'), 900);
    j.ambiente.hora = (j.ambiente.hora + 8) % 24;
    j.jugador.salud = j.jugador.saludMax;
    j.policia.limpiar();
    j.guardar();
    j.hud.grande('DESCANSASTE', 'Son las ' + j.ambiente.texto + ' · partida guardada', 2.6, 'info');
  }

  cancelarRobo() {
    if (!this.robo) return;
    this.robo = null;
    document.getElementById('robo').classList.remove('on');
  }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, t = performance.now() / 1000;
    if (this.poste) this.poste.material.map.offset.y = (t * 0.4) % 1;
    if (this.matPuerta) this.matPuerta.emissiveIntensity = 0.12 + j.ambiente.noche * 0.8;
    this.actualizarPuertas();
    if (this.dentro && !jug.muerto && !j.overlay) {
      const z = this.cerca();
      if (z?.mostrador && !this.robo) { j.hud.pista('E', 'Ver productos · ' + this.dentro.nombre); if (this.letreroM) this.letreroM.material.opacity = 1; }
      for (const q of this.dentro.zonas) { const obj = q === z ? 1.25 : 1; q.escala += (obj - q.escala) * Math.min(1, dt * 10); q.et.scale.set(1.25 * q.escala, 0.415 * q.escala, 1); q.aro.material.opacity = q === z ? 0.95 : 0.45; }
      if (z && !z.mostrador && !this.robo) {
        const a = z.art, tiene = a.tiene?.(jug), falta = a.requiere && !jug.armas[a.requiere];
        j.hud.pista(tiene || falta ? '·' : 'E', tiene ? a.nombre + ' · ya lo tienes' : falta ? 'Primero compra el arma' : (jug.dinero < a.precio ? 'Te faltan $' + (a.precio - jug.dinero).toLocaleString('es-MX') : (a.verbo || 'Comprar') + ' ' + a.nombre + (a.precio ? ' · $' + a.precio.toLocaleString('es-MX') : '')));
      }
    }
    const T = this.dentro;
    if (T?.arena) this.animarArena(T, dt);
    if (T?.cantina) this.animarCantina(T, dt);
    if (T?.antro) this.animarAntro(T, dt);
    else this.j.audio.antro?.(0);
    if (!T) return;
    const I = T.interior;
    const cam = j.camara;
    if (cam.position.y > I.H - 0.3) cam.position.y = I.H - 0.3;
    const caj = T.cajero;
    if (T.tipo !== 'tienda' || !caj || caj.muerto) { this.cancelarRobo(); return; }
    const arma = ['pistola', 'escopeta', 'subfusil', 'rifle'].includes(jug.arma) ? 'fuego' : ['bate', 'cuchillo'].includes(jug.arma) ? 'golpe' : null;
    const d = Math.hypot(jug.pos.x - caj.pos.x, jug.pos.z - caj.pos.z);
    const ang = Math.atan2(caj.pos.x - jug.pos.x, caj.pos.z - jug.pos.z);
    let dif = ang - j.camYaw; while (dif > Math.PI) dif -= Math.PI * 2; while (dif < -Math.PI) dif += Math.PI * 2;
    const amenaza = arma && d < 11 && ((arma === 'fuego' && jug.apunta && Math.abs(dif) < 0.35) || (arma === 'golpe' && d < 3.5));
    if (!this.robo && amenaza) {
      if (T.robadaHasta > j.reloj) { if (!this.avisoAlerta) { this.avisoAlerta = true; j.hud.dialogos([['Cajero', '¡Otra vez usted! ¡Ya llamé a la policía!']]); j.policia.subir(2); } return; }
      this.robo = { p: 0, alarma: false };
      caj.p.manosArriba = true;
      j.hud.dialogos([['Cajero', ['¡No dispare! ¡Llévese todo!', '¡Tranquilo, tranquilo! Ahorita le doy.', '¡Ay, no! ¡Ya le saco el dinero!'][Math.random() * 3 | 0]]]);
      j.audio.alerta();
      document.getElementById('robo').classList.add('on');
    }
    if (this.robo) {
      const R = this.robo;
      R.p += (amenaza ? 1 : -0.6) * dt / 6.5;
      R.p = Math.max(0, R.p);
      document.querySelector('#robo i').style.width = Math.min(100, R.p * 100) + '%';
      if (R.p > 0.4 && !R.alarma) { R.alarma = true; j.policia.crimen('robo', jug.pos); j.policia.subir(1); j.hud.notificar('alerta', 'Alarma silenciosa', 'El cajero apretó el botón. Termina rápido.', 3.5); }
      if (R.p <= 0 && !amenaza) { caj.p.manosArriba = false; this.cancelarRobo(); return; }
      if (R.p >= 1) {
        const botin = 350 + Math.floor(Math.random() * 6) * 100;
        const I2 = T.interior;
        const r = j.crearRecogible('dinero', I2.mostrador.x, I2.mostrador.z - 0.2, false, botin);
        r.vida = 120;
        T.robadaHasta = j.reloj + 300;
        this.avisoAlerta = true;
        caj.p.manosArriba = false;
        caj.estado = 'quieto';
        caj.agachado = true;
        this.cancelarRobo();
        j.policia.subir(2);
        j.estadisticas.sumar('robos');
        j.hud.grande('¡TIENDA ROBADA!', `Recoge la bolsa: $${botin} · ¡sal antes de que lleguen!`, 3.2, 'exito');
        j.redes?.publicar('robo', T.nombre);
      }
    }
  }
}
