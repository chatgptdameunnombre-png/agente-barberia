import { linea, BLOQUES } from './ciudad.js?v=202611212243';
import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=202611212243';
import { Peaton } from './peatones.js?v=202611212243';
import { crearMarcador } from './misiones.js?v=202611212243';

const ix = i => linea(i);
export const SALIDAS = [
  { id: 'calzada', nombre: 'Calzada del Valle', i: 2, k: 7 },
  { id: 'periferico', nombre: 'Periférico', i: 0, k: 4 },
  { id: 'torres', nombre: 'Zona de Torres', i: 7, k: 1 }
];
const NOMBRE = { carrera: 'Carrera callejera', reparto: 'Repartidor', vigilante: 'Vigilante', paramedico: 'Paramédico' };
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + '.' + Math.floor((s % 1) * 10);

export class Trabajos {
  constructor(juego) {
    this.j = juego;
    this.activo = null;
    this.mejores = {};
    this.marca = crearMarcador(juego.escena, '#3fd2ff');
  }

  rutaAleatoria(i, k, n) {
    const pts = [{ i, k }], vistos = new Set([i + ',' + k]);
    let dir = null;
    for (let s = 0; s < 40 && pts.length < n + 1; s++) {
      const opciones = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => !dir || d[0] !== -dir[0] || d[1] !== -dir[1]);
      const d = opciones[Math.random() * opciones.length | 0];
      const paso = 2 + (Math.random() * 2 | 0);
      const ni = i + d[0] * paso, nk = k + d[1] * paso;
      if (ni < 0 || nk < 0 || ni > BLOQUES || nk > BLOQUES || vistos.has(ni + ',' + nk)) continue;
      vistos.add(ni + ',' + nk); pts.push({ i: ni, k: nk }); i = ni; k = nk; dir = d;
    }
    return pts.slice(1).map(p => ({ x: ix(p.i), z: ix(p.k) }));
  }

  tecla() {
    const j = this.j, c = j.jugador.coche;
    if (this.activo) { this.terminar('Dejaste el trabajo.'); return; }
    if (!c || j.misiones.activa) return;
    const s = this.salidaCerca();
    if (s) { this.empezarCarrera(s); return; }
    if (c.tipo === 'moto') this.empezar('reparto');
    else if (c.tipo === 'policia') this.empezar('vigilante');
    else if (c.tipo === 'ambulancia') this.empezar('paramedico');
  }

  salidaCerca() {
    const c = this.j.jugador.coche;
    if (!c || c.tipo === 'moto' && false) return null;
    return SALIDAS.find(s => Math.hypot(ix(s.i) - c.pos.x, ix(s.k) - c.pos.z) < 12) || null;
  }

  empezarCarrera(s) {
    const j = this.j, c = j.jugador.coche;
    const puntos = this.rutaAleatoria(s.i, s.k, 7);
    if (puntos.length < 5) return;
    let largo = Math.hypot(puntos[0].x - c.pos.x, puntos[0].z - c.pos.z);
    for (let q = 1; q < puntos.length; q++) largo += Math.hypot(puntos[q].x - puntos[q - 1].x, puntos[q].z - puntos[q - 1].z);
    this.activo = { tipo: 'carrera', salida: s, puntos, paso: 0, cuenta: 3.2, crono: 0, limite: 12 + largo / 20, rivales: [], fuera: 0, premio: Math.round(400 + largo * 0.9), ultimoNum: 4 };
    j.gps.trazar(puntos, 1);
    j.hud.objetivo('<b>Carrera:</b> espera la salida…');
    j.audio.ui?.(600);
  }

  empezar(tipo) {
    this.activo = { tipo, racha: 0, ganado: 0, nivel: 1 };
    const ayuda = { reparto: 'Recoge pedidos y entrégalos calientes.', vigilante: 'Detén a los criminales marcados en rojo.', paramedico: 'Lleva a los heridos al Hospital Civil.' }[tipo];
    this.j.hud.notificar('mision', NOMBRE[tipo], ayuda + ' T para dejarlo.', 4);
    this.siguiente();
  }

  siguiente() {
    const j = this.j, A = this.activo, p = j.jugador.posicion;
    if (A.tipo === 'reparto') {
      const locales = j.interiores.tiendas.filter(t => t.tipo === 'tienda' || t.tipo === 'cantina');
      const l = locales.sort((a, b) => Math.hypot(a.puerta.x - p.x, a.puerta.z - p.z) - Math.hypot(b.puerta.x - p.x, b.puerta.z - p.z))[Math.random() * 3 | 0] || locales[0];
      A.recoger = { x: l.puerta.x + l.fx * 3, z: l.puerta.z + l.fz * 3, nombre: l.nombre };
      A.entrega = null; A.cliente = null;
      this.marca.g.visible = true; this.ponerMarca(A.recoger, '#ffb347');
      j.hud.objetivo(`<b>Repartidor:</b> recoge el pedido en <b>${l.nombre}</b>.`);
      j.hud.temporizador(null);
    } else if (A.tipo === 'paramedico') {
      const q = this.peatonLejos(80, 170);
      q.estado = 'agachado'; q.tAgachado = 9999; q.herido = true;
      A.paciente = q; A.abordo = false;
      this.marca.g.visible = false;
      A.reloj = 45 + Math.hypot(q.pos.x - p.x, q.pos.z - p.z) / 9; A.limite = A.reloj;
      j.hud.objetivo('<b>Paramédico:</b> recoge al herido antes de que sea tarde.');
    } else if (A.tipo === 'vigilante') {
      A.criminales = [];
      const n = A.nivel >= 3 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const pt = puntoCalleAleatorio(p, 120, 220);
        if (!pt) continue;
        const c = new Coche(j, ['sedan', 'camioneta', 'deportivo'][Math.random() * 3 | 0], '#1a1a1e', pt.x, pt.z, pt.yaw);
        c.conductor = 'ia'; c.marcado = true; c.criminal = true; c.panico = 999;
        j.coches.push(c); A.criminales.push(c);
      }
      this.marca.g.visible = false;
      j.hud.objetivo(`<b>Vigilante · nivel ${A.nivel}:</b> detén ${A.criminales.length > 1 ? 'a los criminales' : 'al criminal'} (rojo en el mapa).`);
    }
  }

  peatonLejos(a, b) {
    const j = this.j, p = j.jugador.posicion;
    const bl = j.ciudad.bloques.filter(x => { const d = Math.hypot(x.cx - p.x, x.cz - p.z); return d > a && d < b; });
    const k = bl[Math.random() * bl.length | 0] || j.ciudad.bloques[0];
    const lado = Math.random() * 4 | 0;
    const x = lado === 0 ? k.x0 + 0.8 : lado === 1 ? k.x1 - 0.8 : k.cx + (Math.random() - 0.5) * 30;
    const z = lado === 2 ? k.z0 + 0.8 : lado === 3 ? k.z1 - 0.8 : k.cz + (Math.random() - 0.5) * 30;
    const q = new Peaton(j, { x, z, estado: 'quieto' });
    q.objetivoMision = true;
    j.peatones.push(q);
    return q;
  }

  ponerMarca(p, color, radio = 3.5) {
    const m = this.marca;
    m.g.visible = true; m.g.position.set(p.x, 0, p.z);
    m.cil.scale.set(radio, 3, radio); m.aro.scale.set(radio, 1, radio); m.flecha.position.y = 4.5;
    m.m.color.set(color); m.aro.material.color.set(color); m.flecha.material.color.set(color);
  }

  pagar(n, titulo, detalle) {
    const j = this.j, A = this.activo;
    A.racha++; A.ganado += n;
    j.jugador.dinero += n; j.estadisticas.sumar('ganado', n);
    j.hud.popDinero(n); j.audio.dinero();
    j.hud.notificar('dinero', titulo, detalle || '+$' + n.toLocaleString('es-MX'), 3.5);
  }

  terminar(motivo, exito) {
    const j = this.j, A = this.activo;
    if (!A) return;
    this.activo = null;
    this.marca.g.visible = false;
    j.gps.trazar(null);
    j.hud.temporizador(null);
    j.hud.objetivo(j.misiones.activa ? j.hud.textoMision || '' : '');
    if (A.tipo === 'carrera') {
      for (const r of A.rivales) if (j.coches.includes(r) && r !== j.jugador.coche) { r.quitar(); j.coches.splice(j.coches.indexOf(r), 1); }
      if (!exito) j.hud.grande('CARRERA PERDIDA', motivo, 2.6, 'falla');
      return;
    }
    if (A.cliente && j.peatones.includes(A.cliente)) A.cliente.estado = 'pasear';
    if (A.paciente && j.peatones.includes(A.paciente) && !A.abordo) { A.paciente.estado = 'pasear'; A.paciente.herido = false; }
    for (const c of A.criminales || []) { c.marcado = false; c.criminal = false; c.panico = 0; }
    j.hud.notificar('mision', 'Fin del turno · ' + NOMBRE[A.tipo], `${motivo} Ganaste $${A.ganado.toLocaleString('es-MX')} (${A.racha}).`, 4.5);
  }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, c = jug.coche, A = this.activo;
    this.relojLancha = (this.relojLancha || 0) - dt;
    if (this.relojLancha <= 0 && j.ciudad.lago) {
      this.relojLancha = 5;
      const L = j.ciudad.lago, M = L.muelle, p = jug.posicion;
      if (Math.hypot(p.x - M.x, p.z - M.z1) < 200 && !j.coches.some(k => k.tipo === 'lancha')) for (const [s, col] of [[-1, '#1f6fd0'], [1, '#d83a3a']]) { const b = new Coche(j, 'lancha', col, M.x + s * 3.6, M.z0 + 4.5, Math.PI); j.coches.push(b); }
    }
    this.relojAmb = (this.relojAmb || 0) - dt;
    if (this.relojAmb <= 0) {
      this.relojAmb = 4;
      const H = j.ciudad.lugares.hospital, p = jug.posicion;
      if (H && Math.hypot(p.x - H.x, p.z - H.z) < 260 && !j.coches.some(k => k.tipo === 'ambulancia' && !k.quemado && Math.hypot(k.pos.x - H.x, k.pos.z - H.z) < 120)) {
        const pt = puntoCalleAleatorio(H, 12, 60);
        if (pt && Math.hypot(pt.x - p.x, pt.z - p.z) > 25) { const amb = new Coche(j, 'ambulancia', '#f2f4f7', pt.x, pt.z, pt.yaw); j.coches.push(amb); }
      }
    }
    if (!A) {
      if (c && !j.misiones.activa && !j.actividades.taxi) {
        const s = this.salidaCerca();
        if (s) j.hud.pista('T', 'Carrera callejera · ' + s.nombre + (this.mejores[s.id] ? ' · récord ' + fmt(this.mejores[s.id]) : ''));
        else if (c.tipo === 'moto') j.hud.pista('T', 'Trabajar de repartidor');
        else if (c.tipo === 'policia') j.hud.pista('T', 'Trabajar de vigilante');
        else if (c.tipo === 'ambulancia') j.hud.pista('T', 'Trabajar de paramédico');
      }
      return;
    }
    if (j.misiones.activa) { this.terminar('Empezó una misión.'); return; }
    if (A.tipo === 'carrera') return this.actualizarCarrera(dt);
    const requerido = { reparto: 'moto', vigilante: 'policia', paramedico: 'ambulancia' }[A.tipo];
    if (!c || c.tipo !== requerido) { A.fuera = (A.fuera || 0) + dt; if (A.fuera > 12) this.terminar('Te bajaste del vehículo.'); else j.hud.objetivo(`Regresa a tu vehículo (${Math.ceil(12 - A.fuera)} s).`); return; }
    if (A.fuera) { A.fuera = 0; this.siguiente(); return; }
    if (c.quemado) { this.terminar('Tu vehículo quedó destruido.'); return; }
    if (A.tipo === 'reparto') this.actualizarReparto(dt, c);
    else if (A.tipo === 'paramedico') this.actualizarParamedico(dt, c);
    else this.actualizarVigilante(dt, c);
  }

  actualizarReparto(dt, c) {
    const j = this.j, A = this.activo;
    if (!A.entrega) {
      if (Math.hypot(A.recoger.x - c.pos.x, A.recoger.z - c.pos.z) < 5 && c.vel < 4) {
        const q = this.peatonLejos(90, 190);
        const d = Math.hypot(q.pos.x - c.pos.x, q.pos.z - c.pos.z);
        A.cliente = q; A.entrega = q.pos; A.dist = d;
        A.reloj = 16 + d / 8.5; A.limite = A.reloj;
        this.marca.g.visible = false;
        j.audio.ui?.(880);
        j.hud.objetivo(`<b>Repartidor:</b> lleva el pedido a <b>${j.zonaDe(q.pos.x, q.pos.z)}</b>. ¡Que llegue caliente!`);
      }
      return;
    }
    A.reloj -= dt;
    j.hud.temporizador(A.reloj);
    if (A.reloj <= 0) { this.terminar('El pedido llegó frío y lo cancelaron.'); return; }
    const q = A.cliente;
    if (!j.peatones.includes(q) || q.muerto) { j.hud.notificar('alerta', 'Cliente perdido', 'Te asignamos otro pedido.'); this.siguiente(); return; }
    const d = Math.hypot(q.pos.x - c.pos.x, q.pos.z - c.pos.z);
    if (d < 16) { q.estado = 'perseguir'; q.arma = 'puno'; q.hostil = false; }
    if (d < 4 && c.vel < 4) {
      const propina = A.reloj > A.limite * 0.45 ? 40 + (A.reloj | 0) * 2 : 0;
      const pago = Math.round(55 + A.dist * 0.35 + propina + A.racha * 12);
      q.estado = 'pasear'; q.objetivoMision = false;
      j.estadisticas.sumar('entregas');
      this.pagar(pago, `Pedido ${A.racha + 1} entregado`, `+$${pago}${propina ? ' con propina' : ''}`);
      j.hud.temporizador(null);
      this.siguiente();
    }
  }

  actualizarParamedico(dt, c) {
    const j = this.j, A = this.activo, H = j.ciudad.lugares.hospital;
    c.sirena = true;
    A.reloj -= dt;
    j.hud.temporizador(A.reloj);
    if (A.reloj <= 0) { this.terminar('El paciente no resistió el viaje.'); return; }
    if (!A.abordo) {
      const q = A.paciente;
      if (!j.peatones.includes(q) || q.muerto) { this.siguiente(); return; }
      q.estado = 'agachado'; q.tAgachado = 9999;
      if (Math.hypot(q.pos.x - c.pos.x, q.pos.z - c.pos.z) < 6 && c.vel < 3) {
        A.abordo = true;
        q.quitar(); j.peatones.splice(j.peatones.indexOf(q), 1);
        const d = Math.hypot(H.x - c.pos.x, H.z - c.pos.z);
        A.reloj = Math.max(A.reloj, 20 + d / 9);
        this.ponerMarca({ x: H.x, z: H.z }, '#ff5a6a', 6);
        j.hud.objetivo('<b>Paramédico:</b> lleva al paciente al <b>Hospital Civil</b>. Maneja con cuidado.');
        A.golpes = 0;
      }
      return;
    }
    if (c.ultimoChoque > 6) { A.golpes++; c.ultimoChoque = 0; A.reloj -= 3; j.hud.notificar('alerta', '¡Cuidado con el paciente!', '-3 s', 1.5); }
    if (Math.hypot(H.x - c.pos.x, H.z - c.pos.z) < 8 && c.vel < 4) {
      const pago = Math.round(150 + A.reloj * 5 + A.racha * 30 - A.golpes * 15);
      j.estadisticas.sumar('rescates');
      this.pagar(Math.max(80, pago), `Paciente ${A.racha + 1} a salvo`, `+$${Math.max(80, pago)}`);
      this.marca.g.visible = false;
      this.siguiente();
    }
  }

  actualizarVigilante(dt, c) {
    const j = this.j, A = this.activo;
    c.sirena = true;
    for (const k of A.criminales) {
      if (k.detenido) continue;
      const d = Math.hypot(k.pos.x - c.pos.x, k.pos.z - c.pos.z);
      if (d < 40) k.panico = 999;
      if (k.quemado || (k.salud < k.t.salud * 0.35 && k.vel < 2 && d < 14)) {
        k.detenido = true; k.marcado = false; k.criminal = false; k.conductor = k.quemado ? k.conductor : null;
        j.estadisticas.sumar('detenidos');
        j.hud.notificar('estrella', 'Criminal detenido', k.quemado ? 'Quedó fuera de combate.' : 'Lo obligaste a detenerse.', 3);
      }
    }
    A.criminales = A.criminales.filter(k => j.coches.includes(k));
    if (!A.criminales.length || A.criminales.every(k => k.detenido)) {
      const pago = 250 + A.nivel * 150;
      this.pagar(pago, `Nivel ${A.nivel} completado`, `+$${pago}`);
      A.nivel++;
      this.siguiente();
    }
  }

  actualizarCarrera(dt) {
    const j = this.j, A = this.activo, c = j.jugador.coche;
    if (A.cuenta > 0) {
      A.cuenta -= dt;
      if (c) { c.vx = 0; c.vz = 0; c.adelante = 0; }
      const n = Math.ceil(A.cuenta);
      if (n !== A.ultimoNum && n > 0) { A.ultimoNum = n; j.hud.grande(String(n), '', 0.8); j.audio.ui?.(520); }
      if (A.cuenta <= 0) {
        j.hud.grande('¡YA!', '', 1, 'exito'); j.audio.ui?.(1040);
        for (let k = 0; k < 2 && c; k++) {
          const lado = k ? -3.2 : 3.2;
          const r = new Coche(j, 'deportivo', ['#e8c23a', '#2e8ad8'][k], c.pos.x + c.fz * lado - c.fx * 2, c.pos.z - c.fx * lado - c.fz * 2, c.yaw);
          r.conductor = 'rival'; r.rival = { i: 0, puntos: A.puntos };
          j.coches.push(r); A.rivales.push(r);
        }
        this.marcarPaso();
      }
      return;
    }
    A.crono += dt;
    j.hud.temporizador(Math.max(0, A.limite - A.crono));
    if (A.crono > A.limite) { this.terminar('Se acabó el tiempo.'); return; }
    if (!c) { A.fuera += dt; j.hud.objetivo(`¡Regresa al coche! (${Math.ceil(10 - A.fuera)} s)`); if (A.fuera > 10) this.terminar('Abandonaste la carrera.'); return; }
    if (A.fuera) { A.fuera = 0; this.marcarPaso(); }
    if (c.quemado) { this.terminar('Tu coche quedó destruido.'); return; }
    const q = A.puntos[A.paso];
    if (Math.hypot(q.x - c.pos.x, q.z - c.pos.z) < 9) {
      A.paso++;
      j.audio.dinero();
      if (A.paso >= A.puntos.length) { this.finCarrera(); return; }
      this.marcarPaso();
    }
  }

  marcarPaso() {
    const A = this.activo, q = A.puntos[A.paso];
    this.ponerMarca(q, '#3fd2ff', 6);
    this.j.gps.trazar(A.puntos.slice(A.paso), A.paso + 1);
    this.j.hud.objetivo(`<b>Carrera ${A.salida.nombre}:</b> punto ${A.paso + 1} de ${A.puntos.length}. Sigue la línea azul.`);
  }

  finCarrera() {
    const j = this.j, A = this.activo;
    const lugar = 1 + A.rivales.filter(r => r.rival.i >= A.puntos.length).length;
    const t = A.crono, id = A.salida.id;
    const record = !this.mejores[id] || t < this.mejores[id];
    if (lugar <= 2 && record) this.mejores[id] = t;
    const premio = lugar === 1 ? A.premio : lugar === 2 ? Math.round(A.premio * 0.35) : 0;
    this.terminar('', true);
    if (premio) { j.jugador.dinero += premio; j.estadisticas.sumar('ganado', premio); j.hud.popDinero(premio); }
    if (lugar === 1) j.estadisticas.sumar('carreras');
    j.hud.grande(lugar === 1 ? '¡PRIMER LUGAR!' : lugar === 2 ? 'SEGUNDO LUGAR' : 'TERCER LUGAR', `${fmt(t)}${record && lugar <= 2 ? ' · nuevo récord' : ''}${premio ? ' · +$' + premio.toLocaleString('es-MX') : ''}`, 3.2, lugar === 1 ? 'exito' : 'mision');
    if (lugar === 1) j.redes?.publicar('persecucion', A.salida.nombre);
    j.guardar();
  }

  rutaGPS() { const A = this.activo; return A && A.tipo === 'carrera' && A.cuenta <= 0 ? A.puntos.slice(A.paso) : null; }

  destinoGPS() {
    const A = this.activo;
    if (!A) return null;
    if (A.tipo === 'reparto') return A.entrega ? { x: A.entrega.x, z: A.entrega.z, tipo: 'mision' } : { x: A.recoger.x, z: A.recoger.z, tipo: 'mision' };
    if (A.tipo === 'paramedico') { const p = A.abordo ? this.j.ciudad.lugares.hospital : A.paciente?.pos; return p ? { x: p.x, z: p.z, tipo: 'mision' } : null; }
    if (A.tipo === 'vigilante') { const k = A.criminales?.find(x => !x.detenido); return k ? { x: k.pos.x, z: k.pos.z, tipo: 'mision' } : null; }
    return null;
  }

  marcasMapa() {
    const l = [], A = this.activo;
    if (!A) for (const s of SALIDAS) l.push({ x: ix(s.i), z: ix(s.k), tipo: 'icono', ic: { c: '#3fd2ff', t: 'bandera', n: 'Carrera callejera' } });
    if (A?.tipo === 'reparto') l.push(A.entrega ? { x: A.entrega.x, z: A.entrega.z, tipo: 'objetivo', color: '#ffb347', texto: 'persona' } : { x: A.recoger.x, z: A.recoger.z, tipo: 'objetivo', color: '#ffb347', texto: 'bolsa' });
    if (A?.tipo === 'paramedico') { const p = A.abordo ? this.j.ciudad.lugares.hospital : A.paciente?.pos; if (p) l.push({ x: p.x, z: p.z, tipo: 'objetivo', color: '#ff5a6a', texto: A.abordo ? 'cruzroja' : 'persona' }); }
    if (A?.tipo === 'vigilante') for (const k of A.criminales || []) if (!k.detenido) l.push({ x: k.pos.x, z: k.pos.z, tipo: 'objetivo', color: '#ff3b3b', texto: 'coche' });
    return l;
  }

  guardar() { return { mejores: this.mejores }; }
  cargar(d) { if (d?.mejores) this.mejores = d.mejores; }
}
