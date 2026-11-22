import * as THREE from 'three';
import { linea, CARRIL } from './ciudad.js?v=202611220139';
import { Coche } from './vehiculos.js?v=202611220139';
import { Peaton } from './peatones.js?v=202611220139';
import { CONTACTOS } from './contactos.js?v=202611220139';
import { crearPersona, animar, nivelDetalle } from './persona.js?v=202611220139';
import { crearHumano } from './humanos.js?v=202611220139';

export function crearMarcador(escena, color) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 28, 1, true), m);
  cil.position.y = 0.5;
  const aro = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }));
  aro.position.y = 0.08;
  const flecha = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 4), new THREE.MeshBasicMaterial({ color }));
  flecha.rotation.x = Math.PI;
  g.add(cil, aro, flecha);
  g.visible = false;
  escena.add(g);
  return { g, cil, aro, flecha, m, op: m.opacity };
}

const ix = i => linea(i);

export class Misiones {
  constructor(juego) {
    this.j = juego;
    this.indice = 0;
    this.otros = Object.fromEntries(Object.keys(CONTACTOS).map(k => [k, 0]));
    this.contacto = 'chuy';
    this.marcasC = {};
    this.avisados = {};
    this.activa = null;
    this.paso = 0;
    this.t = 0;
    this.objetivos = [];
    this.marcadores = [crearMarcador(juego.escena, '#ffc94a'), crearMarcador(juego.escena, '#ff4f9a'), crearMarcador(juego.escena, '#3fd2ff')];
    this.textoBase = '';
    this.reloj = null;
    this.extra = [];
    this.esperaReintento = 0;
  }

  marcar(i, x, z, radio = 3, alto = 4, color) {
    const m = this.marcadores[i];
    m.g.visible = true;
    m.g.position.set(x, 0, z);
    m.cil.scale.set(radio, alto, radio);
    m.aro.scale.set(radio, 1, radio);
    m.flecha.position.y = alto + 1.5;
    m.radio = radio;
    m.x = x; m.z = z;
    m.m.opacity = m.op;
    if (color) { m.m.color.set(color); m.aro.material.color.set(color); m.flecha.material.color.set(color); }
    return m;
  }
  ocultar(i) { if (i === undefined) this.marcadores.forEach(m => m.g.visible = false); else this.marcadores[i].g.visible = false; }
  dentro(i, p, margen = 0) { const m = this.marcadores[i]; return m.g.visible && Math.hypot(p.x - m.x, p.z - m.z) < m.radio + margen; }

  rutaGPS() {
    const A = this.activa;
    if (!A || !this.puntos || this.paso < 0 || !A.rutaFija) return null;
    return this.puntos.slice(this.paso);
  }

  destinoGPS() {
    if (!this.activa) return null;
    for (const o of this.objetivos) if (o.pos && !o.muerto && !o.quemado && this.j.jugador.coche !== o) return { x: o.pos.x, z: o.pos.z, tipo: 'mision' };
    for (const i of [1, 2]) { const m = this.marcadores[i]; if (m.g.visible) return { x: m.x, z: m.z, tipo: 'mision' }; }
    return null;
  }

  marcasMapa() {
    const l = [];
    if (!this.activa && this.indice < LISTA.length) {
      const t = this.j.ciudad.lugares.taller;
      l.push({ x: t.x, z: t.z, tipo: 'objetivo', color: '#ffc94a', texto: 'C', nombre: 'Don Chuy · Taller (misiones de la historia)' });
    }
    if (!this.activa) for (const id in CONTACTOS) if (this.disponible(id)) { const C = CONTACTOS[id], p = this.lugarC(id); l.push({ x: p.x, z: p.z, tipo: 'objetivo', color: C.color, texto: C.letra, nombre: `${C.nombre} · ${C.zona} (${this.otros[id] + 1} de ${C.lista.length})` }); }
    this.marcadores.forEach((m, i) => { if (m.g.visible && !(i === 0 && !this.activa)) l.push({ x: m.x, z: m.z, tipo: 'objetivo', color: '#' + m.m.color.getHexString() }); });
    for (const o of this.objetivos) if (o.pos && !o.muerto && !o.quemado) l.push({ x: o.pos.x, z: o.pos.z, tipo: 'objetivo', color: '#ff4f9a' });
    return l;
  }

  actualizar(dt) {
    const j = this.j;
    const t = performance.now() / 1000;
    for (const m of this.marcadores) if (m.g.visible) { m.flecha.position.y = m.cil.scale.y + 1.5 + Math.sin(t * 3) * 0.3; m.flecha.rotation.y += dt * 2; }
    if (j.jugador.muerto) return;
    if (this.esperaReintento > 0) this.esperaReintento -= dt;
    if (!this.activa) {
      if (this.indice < LISTA.length && this.esperaReintento <= 0) {
        const tl = j.ciudad.lugares.taller;
        this.marcar(0, tl.x, tl.z, 1.6, 3, '#ffc94a');
        if (!j.jugador.coche && this.dentro(0, j.jugador.pos)) this.empezar();
      } else this.ocultar(0);
      for (const id in CONTACTOS) {
        const C = CONTACTOS[id], ok = this.disponible(id) && this.esperaReintento <= 0;
        let mk = this.marcasC[id];
        if (!mk && ok) { mk = this.marcasC[id] = crearMarcador(j.escena, C.color); const p = this.lugarC(id); mk.g.position.set(p.x, 0, p.z); mk.cil.scale.set(1.6, 3, 1.6); mk.aro.scale.set(1.6, 1, 1.6); mk.x = p.x; mk.z = p.z; this.figura(mk, C, p); }
        if (mk?.fig) this.animarFigura(mk, dt);
        if (!mk) continue;
        mk.g.visible = ok;
        if (mk.fig) mk.fig.grupo.visible = this.otros[id] < C.lista.length && !mk.fig.lejos;
        if (!ok) continue;
        mk.flecha.position.y = 4.5 + Math.sin(t * 3) * 0.3; mk.flecha.rotation.y += dt * 2;
        if (!this.avisados[id] && this.otros[id] === 0) { this.avisados[id] = true; if (C.requisito > 0) j.hud.notificar('mision', 'Nuevo contacto: ' + C.nombre, `Te espera en ${C.zona}. Búscalo con la letra ${C.letra} en el mapa.`, 6); }
        if (!j.jugador.coche && Math.hypot(j.jugador.pos.x - mk.x, j.jugador.pos.z - mk.z) < 1.8) { this.empezar(id); break; }
      }
      return;
    }
    for (const id in this.marcasC) { const mk = this.marcasC[id]; mk.g.visible = false; if (mk.fig) { mk.fig.grupo.visible = this.contacto !== id && this.otros[id] < CONTACTOS[id].lista.length && !mk.fig.lejos; this.animarFigura(mk, dt); if (this.contacto === id) mk.fig.grupo.visible = false; } }
    if (this.reloj !== null) {
      this.reloj -= dt;
      j.hud.temporizador(this.reloj);
      if (this.reloj <= 0) { this.fallar('Se acabó el tiempo.'); return; }
    }
    this.t += dt;
    const r = this.activa.actualizar(this, dt);
    if (r === 'ok') this.completar();
    else if (typeof r === 'string' && r.startsWith('falla')) this.fallar(r.slice(6));
  }

  figura(mk, C, p) {
    if (C.modelo && !this.j.sinRealista) {
      const g = new THREE.Group(); g.position.set(p.x + 1.5, 0, p.z - 0.9); g.rotation.y = Math.atan2(-1.5, 0.9); this.j.escena.add(g);
      mk.fig = { grupo: g, yawBase: g.rotation.y, real: true };
      crearHumano(C.modelo).then(h => { g.add(h.grupo); mk.fig.h = h; h.tocar('Idle_Loop', 0); }).catch(() => {});
      return;
    }
    if (!C.apariencia) return;
    const f = crearPersona({ ...C.apariencia, fijo: true });
    f.grupo.position.set(p.x + 1.5, 0, p.z - 0.9); f.grupo.rotation.y = Math.atan2(-1.5, 0.9);
    this.j.escena.add(f.grupo); mk.fig = f; f.yawBase = f.grupo.rotation.y;
  }

  animarFigura(mk, dt) {
    const f = mk.fig, J = this.j.jugador.posicion, dx = J.x - f.grupo.position.x, dz = J.z - f.grupo.position.z, d = Math.hypot(dx, dz);
    f.lejos = d > 110;
    if (f.lejos) { f.grupo.visible = false; return; }
    if (f.real) {
      const meta = d < 14 ? Math.atan2(dx, dz) : f.yawBase;
      let dif = meta - f.grupo.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
      f.grupo.rotation.y += dif * Math.min(1, dt * 3);
      if (f.h && d < 60) { f.h.tocar(d < 8 ? 'Idle_Talking_Loop' : 'Idle_Loop', 0.5); f.h.actualizar(dt); }
      return;
    }
    nivelDetalle(f, d < 35);
    if (d > 60) return;
    const meta = d < 14 ? Math.atan2(dx, dz) : f.yawBase;
    let dif = meta - f.grupo.rotation.y; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    f.grupo.rotation.y += dif * Math.min(1, dt * 3);
    f.habla = d < 6; f.expresion = null;
    animar(f, dt, 0, 'puno', false);
    if (d < 10) { const t = performance.now() / 1000; f.bd.rotation.set(-0.5 + Math.sin(t * 2.1) * 0.25, 0, -0.25); f.cd.rotation.x = -1.1 + Math.sin(t * 3.3) * 0.2; }
  }

  disponible(id) { const C = CONTACTOS[id]; return this.indice >= C.requisito && this.otros[id] < C.lista.length; }
  lugarC(id) { return this.cacheLugar?.[id] || ((this.cacheLugar || (this.cacheLugar = {}))[id] = CONTACTOS[id].lugar(this.j)); }

  empezar(id = 'chuy') {
    const j = this.j;
    const C = CONTACTOS[id];
    const def = C ? C.lista[this.otros[id]] : LISTA[this.indice];
    this.contacto = id;
    this.activa = def;
    this.paso = 0; this.t = 0; this.reloj = null;
    this.objetivos = [];
    this.ocultar();
    j.hud.grande(def.titulo, C ? `${C.nombre} · misión ${this.otros[id] + 1} de ${C.lista.length}` : 'Don Chuy · misión ' + (this.indice + 1) + ' de ' + LISTA.length, 3.4, 'mision');
    j.audio?.mision(true);
    def.inicio(this);
  }

  objetivo(texto) { this.j.hud.objetivo(texto); }
  dialogo(lineas) { this.j.hud.dialogos(lineas); }

  completar() {
    const j = this.j, def = this.activa;
    j.jugador.dinero += def.premio;
    j.estadisticas?.sumar('ganado', def.premio);
    j.hud.grande('¡MISIÓN CUMPLIDA!', '+$' + def.premio.toLocaleString('es-MX'), 4, 'exito');
    j.hud.popDinero(def.premio);
    j.redes?.publicar('mision', '', { forzar: true });
    j.audio?.mision(true);
    this.limpiar();
    const C = CONTACTOS[this.contacto];
    if (C) { this.otros[this.contacto]++; def.fin?.(this); if (this.otros[this.contacto] >= C.lista.length) setTimeout(() => j.hud.notificar('mision', 'Terminaste con ' + C.nombre, 'Todas sus misiones completadas.', 5), 4500); this.contacto = 'chuy'; j.guardar(); this.esperaReintento = 6; return; }
    this.indice++;
    def.fin?.(this);
    j.guardar();
    if (this.indice >= LISTA.length) setTimeout(() => j.hud.grande('SANTA JACARANDA ES TUYA', 'Terminaste la historia. La ciudad sigue abierta.', 6, 'exito'), 4200);
    else this.esperaReintento = 6;
  }

  fallar(motivo) {
    const j = this.j;
    j.hud.grande('MISIÓN FALLIDA', motivo, 4, 'falla');
    j.audio?.mision(false);
    this.activa?.falla?.(this);
    this.limpiar();
    this.esperaReintento = 5;
  }

  limpiar() {
    const j = this.j;
    if (this.guia) this.guia.visible = false;
    this.puntos = null;
    this.j.gps?.trazar(null);
    for (const o of this.extra) {
      if (o instanceof Coche) { if (o !== j.jugador.coche && j.coches.includes(o)) { o.quitar(); j.coches.splice(j.coches.indexOf(o), 1); } else o.marcado = false; }
      else if (o instanceof Peaton) { if (j.peatones.includes(o)) { o.quitar(); j.peatones.splice(j.peatones.indexOf(o), 1); } }
      else if (o.parentNode) o.remove();
      else if (o.isObject3D) j.escena.remove(o);
    }
    this.extra = [];
    this.objetivos = [];
    this.activa = null;
    this.reloj = null;
    this.contacto = this.contacto || 'chuy';
    this.ocultar();
    j.hud.objetivo('');
    j.hud.temporizador(null);
  }
}

const LISTA = [
  {
    titulo: 'PRIMER ENCARGO',
    premio: 500,
    inicio(m) {
      m.dialogo([['Don Chuy', 'Qué onda, mijo. Si vas a trabajar conmigo, primero demuéstrame que sabes manejar.'],
        ['Don Chuy', 'En el Mercado de San Jacinto me guardaron unas refacciones. Ve por ellas y tráemelas rapidito.']]);
      m.objetivo('Consigue un <b>coche</b> y ve al <b>Mercado</b>.');
      const p = m.j.ciudad.lugares.mercado;
      m.marcar(1, p.x, p.z + 4.5, 3, 3, '#ff4f9a');
    },
    actualizar(m) {
      const j = m.j, jug = j.jugador;
      if (m.paso === 0) {
        if (jug.coche && m.dentro(1, jug.coche.pos)) {
          m.paso = 1;
          m.ocultar(1);
          j.audio?.dinero();
          m.objetivo('Lleva las refacciones al <b>Taller</b> antes de que se acabe el tiempo.');
          const t = j.ciudad.lugares.taller;
          m.marcar(1, t.x, t.z + 6, 4, 3, '#ff4f9a');
          m.reloj = 100;
          m.dialogo([['Encargado', '¡Ahí van las cajas en la cajuela! Dile a Don Chuy que me debe una.']]);
        } else if (!jug.coche && m.dentro(1, jug.pos)) m.objetivo('Necesitas un <b>coche</b> para cargar las cajas. Presiona <b>F</b> junto a uno.');
      } else if (m.paso === 1) {
        if (jug.coche && m.dentro(1, jug.coche.pos)) return 'ok';
        if (!jug.coche) m.objetivo('Regresa a un <b>coche</b> y llega al <b>Taller</b>.');
        else m.objetivo('Lleva las refacciones al <b>Taller</b> antes de que se acabe el tiempo.');
      }
    }
  },
  {
    titulo: 'COBRO EN EL TIANGUIS',
    premio: 900,
    inicio(m) {
      const j = m.j;
      j.jugador.darArma('pistola', 48);
      m.dialogo([['Don Chuy', 'El Güero me debe dinero y anda vendiendo en el tianguis como si nada.'],
        ['Don Chuy', 'Llévate esta pistola, por si se pone difícil. Tráeme mi sobre.'], ['', 'Recibiste una <b>pistola</b>. Apunta con clic derecho y dispara con clic.']]);
      m.objetivo('Ve al <b>Tianguis</b> y busca al Güero.');
      const p = j.ciudad.lugares.tianguis;
      const g = new Peaton(j, { x: p.x + 4, z: p.z + 3, estado: 'quieto', vestido: { camisa: '#ffd84a', pantalon: '#3b4a7a', pelo: '#d8b060' } });
      g.salud = 60; g.objetivoMision = true;
      j.peatones.push(g);
      m.extra.push(g);
      m.objetivos = [g];
      m.guero = g;
    },
    actualizar(m) {
      const j = m.j, g = m.guero, jp = j.jugador.posicion;
      if (!j.peatones.includes(g)) return 'falla:El Güero se te escapó.';
      if (m.paso === 0) {
        if (g.pos.distanceTo(jp) < 22) {
          m.paso = 1;
          m.dialogo([['El Güero', '¡Yo no tengo nada! ¡Déjame en paz!']]);
          m.objetivo('¡El Güero se va corriendo! <b>Detenlo</b>.');
          g.estado = 'huir'; g.huyeDe.copy(jp); g.miedo = 999; g.salud = 45;
        }
      } else if (m.paso === 1) {
        g.huyeDe.copy(jp); g.miedo = 999;
        if (g.pos.distanceTo(jp) > 160) return 'falla:El Güero se te escapó.';
        if (g.muerto) {
          m.paso = 2;
          m.objetivos = [];
          const s = m.j.crearRecogible('sobre', g.pos.x + 0.8, g.pos.z);
          m.extra.push(s.malla);
          m.sobre = s;
          m.objetivo('Recoge el <b>sobre</b> con el dinero.');
          m.marcar(1, s.x, s.z, 1.2, 2, '#ff4f9a');
        }
      } else if (m.paso === 2) {
        if (m.sobre.tomado) {
          m.paso = 3;
          const t = j.ciudad.lugares.taller;
          m.marcar(1, t.x, t.z, 2, 3, '#ff4f9a');
          m.objetivo('Lleva el sobre al <b>Taller</b>.' + (j.policia.estrellas ? ' Si quieres, pierde antes a la policía.' : ''));
        }
      } else if (m.paso === 3) {
        const p = j.jugador.coche ? j.jugador.coche.pos : j.jugador.pos;
        if (m.dentro(1, p, 2)) return 'ok';
      }
    }
  },
  {
    titulo: 'LA CARRERA DE LA CALZADA',
    premio: 1500,
    rutaFija: true,
    inicio(m) {
      const j = m.j;
      m.dialogo([['Don Chuy', 'Hay una carrera esta noche. Los muchachos de la Calzada dicen que nadie les gana.'],
        ['Don Chuy', 'Pasa por cada bandera antes de que se acabe el tiempo. Gana y nos llevamos la apuesta.']]);
      const ruta = [[0, 2], [0, 5], [3, 5], [3, 8], [6, 8], [6, 4], [8, 4], [8, 0], [4, 0], [4, 2], [1, 2], [1, 0]];
      m.puntos = ruta.map(([a, b]) => ({ x: ix(a), z: ix(b) }));
      m.paso = -1;
      const p = m.puntos[0];
      const salida = { x: ix(0) + CARRIL, z: ix(0) + 18 };
      m.salida = salida;
      const c = new Coche(j, 'deportivo', '#ff4f9a', salida.x, salida.z + 4, 0);
      j.coches.push(c); m.extra.push(c);
      c.marcado = true;
      m.cocheCarrera = c;
      m.marcar(1, salida.x, salida.z + 4, 3.5, 2, '#3fd2ff');
      m.objetivo('Súbete al <b>deportivo rosa</b> en la línea de salida.');
      m.rivales = [];
    },
    actualizar(m, dt) {
      const j = m.j, jug = j.jugador;
      if (m.cocheCarrera.quemado) return 'falla:Destruiste el coche de carrera.';
      if (m.paso === -1) {
        if (jug.coche === m.cocheCarrera) {
          m.paso = 0;
          m.ocultar(1);
          m.reloj = 125;
          m.objetivo('¡Arranca! Pasa por las <b>banderas</b> (' + 1 + '/' + m.puntos.length + ').');
          j.hud.grande('¡ARRANCA!', '', 1.5);
          for (let k = 0; k < 2; k++) {
            const r = new Coche(j, 'deportivo', ['#ffe066', '#3fd2ff'][k], m.cocheCarrera.pos.x - 4 + k * 8, m.cocheCarrera.pos.z - 3, 0);
            r.conductor = 'rival'; r.rival = { i: 0, puntos: m.puntos };
            r.pos.set(ix(0) + (k ? -3.5 : 3.5) - 0.5, 0, m.cocheCarrera.pos.z - 7 - k * 6);
            j.coches.push(r); m.extra.push(r); m.rivales.push(r);
          }
          m.marcarSiguiente();
        }
        return;
      }
      if (jug.coche !== m.cocheCarrera) {
        m.fuera = (m.fuera || 0) + dt;
        m.objetivo('¡Regresa al <b>deportivo</b>! (' + Math.max(0, 15 - m.fuera).toFixed(0) + ' s)');
        m.marcar(2, m.cocheCarrera.pos.x, m.cocheCarrera.pos.z, 3, 2, '#3fd2ff');
        if (m.fuera > 15) return 'falla:Abandonaste la carrera.';
        return;
      } else if (m.fuera) { m.fuera = 0; m.ocultar(2); m.marcarSiguiente(); }
      if (m.dentro(1, jug.coche.pos, 2)) {
        m.paso++;
        j.audio?.dinero();
        if (m.paso >= m.puntos.length) {
          const ganan = m.rivales.some(r => r.rival.i >= m.puntos.length);
          if (ganan) return 'falla:Un rival llegó antes que tú.';
          return 'ok';
        }
        m.marcarSiguiente();
      }
      for (const r of m.rivales) if (r.rival.i >= m.puntos.length && !m.avisado) { m.avisado = true; j.hud.aviso('¡Un rival ya cruzó la meta!'); }
    },
    fin(m) { if (m.j.jugador.coche === m.cocheCarrera) m.extra = m.extra.filter(o => o !== m.cocheCarrera); }
  },
  {
    titulo: 'COCHE AJENO',
    premio: 2500,
    inicio(m) {
      const j = m.j;
      m.dialogo([['Don Chuy', 'Unos tipos de la zona de las torres me robaron mi camioneta. La tienen en la torre del poniente.'],
        ['Don Chuy', 'Están armados. Recupérala y tráemela entera, que la necesito para el último jale.']]);
      const px = ix(7) - 28, pz = ix(1) + 0.5;
      const cam = new Coche(j, 'camioneta', '#2fae6a', px, pz, Math.PI / 2);
      cam.marcado = true;
      j.coches.push(cam); m.extra.push(cam);
      m.cam = cam;
      m.objetivos = [cam];
      m.malos = [];
      for (let k = 0; k < 4; k++) {
        const a = k / 4 * Math.PI * 2;
        const g = new Peaton(j, { tipo: 'matón', x: px + Math.cos(a) * 6, z: pz + 6 + Math.sin(a) * 3, estado: 'quieto', arma: k === 0 ? 'subfusil' : 'pistola' });
        g.yaw = Math.random() * 6;
        j.peatones.push(g); m.extra.push(g); m.malos.push(g);
      }
      j.crearRecogible('chaleco', ix(5) + 12, ix(1) + 9);
      m.objetivo('Ve a la <b>zona de las torres</b> y recupera la <b>camioneta verde</b>.');
    },
    actualizar(m) {
      const j = m.j, jp = j.jugador.posicion;
      if (m.cam.quemado) return 'falla:La camioneta quedó destruida.';
      for (const g of m.malos) if (!g.muerto && g.estado === 'quieto' && g.pos.distanceTo(jp) < 40) { g.estado = 'atacar'; if (!m.avisoM) { m.avisoM = true; m.dialogo([['Matón', '¡Ahí viene uno de Don Chuy! ¡Quiébrenlo!']]); } }
      if (m.paso === 0 && j.jugador.coche === m.cam) {
        m.paso = 1;
        j.policia.subir(2);
        m.objetivo('Lleva la camioneta al <b>Taller</b>. Cuídala, va ' + Math.round(m.cam.salud / m.cam.t.salud * 100) + '% entera.');
        const t = j.ciudad.lugares.taller;
        m.marcar(1, t.x, t.z + 6, 4, 3, '#ff4f9a');
      }
      if (m.paso === 1) {
        m.objetivo('Lleva la camioneta al <b>Taller</b>. Va ' + Math.max(0, Math.round(m.cam.salud / m.cam.t.salud * 100)) + '% entera.');
        if (j.jugador.coche === m.cam && m.dentro(1, m.cam.pos)) {
          if (j.policia.estrellas > 0) { m.objetivo('<b>Pierde a la policía</b> antes de entrar al taller.'); return; }
          return 'ok';
        }
      }
    },
    fin(m) { m.j.jugador.darArma('subfusil', 90); m.j.hud.aviso('Don Chuy te dio un <b>subfusil</b>. Cámbialo con <kbd>3</kbd>.'); }
  },
  {
    titulo: 'EL GOLPE DEL BANCO',
    premio: 12000,
    inicio(m) {
      const j = m.j;
      m.dialogo([['Don Chuy', 'Ahora sí, el bueno. El Banco de Occidente tiene la bóveda llena este fin.'],
        ['Don Chuy', 'Entras, aguantas mientras se abre la bóveda y luego te pierdes. Que no te sigan hasta aquí.']]);
      const b = j.ciudad.lugares.banco;
      m.marcar(1, b.x, b.z - 4.5, 2.5, 3, '#ff4f9a');
      m.objetivo('Ve al <b>Banco de Occidente</b>. Llega a pie a la entrada.');
      m.carga = 0;
    },
    actualizar(m, dt) {
      const j = m.j, jug = j.jugador;
      if (m.paso === 0) {
        if (!jug.coche && m.dentro(1, jug.pos)) {
          m.paso = 1;
          j.policia.subir(3);
          m.dialogo([['', '¡Suena la alarma! Quédate en la entrada mientras se abre la bóveda.']]);
        }
      } else if (m.paso === 1) {
        if (!jug.coche && m.dentro(1, jug.pos, 1.5)) m.carga += dt;
        m.objetivo('Abriendo la bóveda… <b>' + Math.min(100, Math.round(m.carga / 14 * 100)) + '%</b>. Quédate en el círculo.');
        if (m.carga >= 14) {
          m.paso = 2;
          j.policia.subir(4);
          j.audio?.dinero();
          m.ocultar(1);
          m.objetivo('¡Tienes el dinero! <b>Pierde a la policía</b> y llega al <b>Taller</b>.');
          const t = j.ciudad.lugares.taller;
          m.marcar(1, t.x, t.z + 6, 4, 3, '#ff4f9a');
        }
      } else if (m.paso === 2) {
        const p = jug.posicion;
        if (m.dentro(1, p, 1)) {
          if (j.policia.estrellas > 0) m.objetivo('<b>Pierde a la policía</b> antes de entrar. Prueba la <b>Pintura Express</b> (el ícono de chispa rosa).');
          else return 'ok';
        } else m.objetivo('¡Tienes el dinero! <b>Pierde a la policía</b> y llega al <b>Taller</b>.');
      }
    }
  }
];

export const TOTAL_MISIONES = LISTA.length;
export const TITULOS = LISTA.map(d => d.titulo);

Misiones.prototype.guiar = function (p, q) {
  if (!this.guia) {
    const forma = new THREE.Shape();
    forma.moveTo(0, 2.2); forma.lineTo(1.6, 0.4); forma.lineTo(0.7, 0.4); forma.lineTo(0.7, -1.6); forma.lineTo(-0.7, -1.6); forma.lineTo(-0.7, 0.4); forma.lineTo(-1.6, 0.4); forma.closePath();
    const geo = new THREE.ShapeGeometry(forma); geo.rotateX(-Math.PI / 2); geo.rotateY(Math.PI);
    this.guia = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#3fd2ff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    this.j.escena.add(this.guia);
  }
  this.guia.visible = !!q;
  if (!q) return;
  this.guia.position.set(p.x, 7.5, p.z);
  this.guia.rotation.set(0, Math.atan2(q.x - p.x, q.z - p.z), 0);
};

Misiones.prototype.marcarSiguiente = function () {
  const p = this.puntos[this.paso], q = this.puntos[this.paso + 1];
  this.marcar(1, p.x, p.z, 6, 5, '#3fd2ff');
  this.ocultar(2);
  this.j.gps.trazar(this.puntos.slice(this.paso), this.paso + 1);
  this.guiar(p, q);
  this.objetivo('Pasa por las <b>banderas</b> (' + (this.paso + 1) + '/' + this.puntos.length + ').');
};
