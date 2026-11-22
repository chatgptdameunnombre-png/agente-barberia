import { esCalle } from './ciudad.js?v=202611212210';
import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=202611212210';
import { Peaton } from './peatones.js?v=202611212210';

const AZUL = '#3fa8ff';
const banqueta = (j, cerca, a, b) => {
  for (let k = 0; k < 40; k++) {
    const ang = Math.random() * 6.28, d = a + Math.random() * (b - a);
    const x = cerca.x + Math.cos(ang) * d, z = cerca.z + Math.sin(ang) * d;
    if (!esCalle(x, z) && !j.mundo.dentro(x, 1, z) && Math.abs(x) < 320 && Math.abs(z) < 320) return { x, z };
  }
  return null;
};

export class Aleatorios {
  constructor(juego) {
    this.j = juego;
    this.reloj = 50 + Math.random() * 40;
    this.e = null;
  }

  quitar(lista) { const j = this.j; for (const o of lista) { if (o instanceof Peaton && j.peatones.includes(o) && !o.muerto) { o.objetivoMision = false; o.estado = 'pasear'; o.asignarRutaCercana?.(); } if (o instanceof Coche) o.marcado = false; } }

  fin(motivo, premio, publicar) {
    const j = this.j, E = this.e;
    if (!E) return;
    this.quitar(E.gente || []);
    if (E.bolsa?.malla && !E.bolsa.tomado) j.escena.remove(E.bolsa.malla);
    this.e = null;
    this.reloj = 80 + Math.random() * 80;
    if (premio) { j.jugador.dinero += premio; j.estadisticas.sumar('ganado', premio); j.hud.popDinero(premio); j.audio.dinero(); }
    if (motivo) j.hud.notificar(premio ? 'dinero' : 'alerta', motivo, premio ? '+$' + premio.toLocaleString('es-MX') : '', 3.5);
    if (publicar) { j.redes.publicar('foto', '', { forzar: true }); j.redes.seguidores += 15; }
    j.estadisticas.sumar('eventos');
  }

  empezar(forzado) {
    const j = this.j, jp = j.jugador.posicion;
    const tipos = j.jugador.coche ? ['aventon', 'asalto', 'bolso'] : ['bolso', 'asalto', 'aventon'];
    const tipo = forzado || tipos[Math.random() * (j.jugador.coche ? 2 : 3) | 0];
    if (tipo === 'bolso') {
      const p = banqueta(j, jp, 35, 60); if (!p) return;
      const v = new Peaton(j, { x: p.x, z: p.z, estado: 'quieto' }); v.objetivoMision = true;
      const l = new Peaton(j, { x: p.x + 2, z: p.z + 1, estado: 'huir', vestido: { camisa: '#2a2a2e', pantalon: '#1a1a1e', gorra: '#111', sombrero: null, ropa: null } });
      l.objetivoMision = true; l.miedo = 999; l.huyeDe.set(p.x, 0, p.z); l.salud = 40;
      j.peatones.push(v, l);
      this.e = { tipo, t: 0, victima: v, ladron: l, gente: [v, l], paso: 0 };
      j.hud.notificar('alerta', '¡Le robaron la bolsa a alguien!', 'Atrapa al ladrón (azul en el mapa).', 4);
      j.hud.burbuja?.(v, '¡Mi bolsa! ¡Ayuda!');
    } else if (tipo === 'asalto') {
      const t = j.interiores.tiendas.filter(x => x.tipo === 'tienda').sort((a, b) => Math.hypot(a.puerta.x - jp.x, a.puerta.z - jp.z) - Math.hypot(b.puerta.x - jp.x, b.puerta.z - jp.z)).find(x => Math.hypot(x.puerta.x - jp.x, x.puerta.z - jp.z) > 40);
      if (!t) return;
      const px = t.puerta.x + t.fx * 3, pz = t.puerta.z + t.fz * 3;
      const v = new Peaton(j, { x: px, z: pz, estado: 'quieto' }); v.objetivoMision = true; v.rendir?.(); v.tRendido = 999;
      const m = new Peaton(j, { tipo: 'matón', x: px + t.fz * 2, z: pz - t.fx * 2, estado: 'quieto', arma: 'pistola' }); m.objetivoMision = true;
      m.yaw = Math.atan2(v.pos.x - m.pos.x, v.pos.z - m.pos.z);
      j.peatones.push(v, m);
      this.e = { tipo, t: 0, victima: v, malo: m, gente: [v, m], tienda: t };
      j.hud.notificar('alerta', 'Asalto en ' + t.nombre, 'Detén al asaltante.', 4);
    } else {
      const p = puntoCalleAleatorio(jp, 60, 110, 60) || puntoCalleAleatorio(jp, 35, 200, 80); if (!p) return;
      const c = new Coche(j, 'sedan', '#6a6e72', p.x, p.z, p.yaw); c.salud = c.t.salud * 0.3; c.marcado = true;
      j.coches.push(c);
      const s = banqueta(j, p, 2, 6) || { x: p.x + 3, z: p.z };
      const q = new Peaton(j, { x: s.x, z: s.z, estado: 'quieto' }); q.objetivoMision = true;
      j.peatones.push(q);
      this.e = { tipo, t: 0, pasajero: q, coche: c, gente: [q], abordo: false };
      j.hud.notificar('gps', 'Alguien necesita un aventón', 'Su coche se descompuso. Detente junto a él.', 4);
    }
  }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, jp = jug.posicion;
    if (!this.e) {
      if (j.misiones.activa || j.policia.estrellas > 1 || jug.interior || j.trabajos?.activo || j.actividades.taxi) return;
      this.reloj -= dt;
      if (this.reloj <= 0) { this.reloj = 20; this.empezar(); }
      return;
    }
    const E = this.e;
    E.t += dt;
    if (E.t > 150 || (E.victima && E.victima.pos.distanceTo(jp) > 260) || (E.pasajero && !E.abordo && E.pasajero.pos.distanceTo(jp) > 260)) { this.fin(null); return; }
    if (j.misiones.activa) { this.fin(null); return; }
    if (E.tipo === 'bolso') {
      const L = E.ladron, V = E.victima;
      if (E.paso === 0) {
        if (j.peatones.includes(L)) { L.estado = 'huir'; L.miedo = 999; if (jp.distanceTo(L.pos) < 30) L.huyeDe.copy(jp); }
        if (!j.peatones.includes(L) || L.muerto || L.salud < 25 || (!jug.coche && jp.distanceTo(L.pos) < 1.3)) {
          if (!L.muerto && j.peatones.includes(L)) { L.salud = 20; L.estado = 'huir'; }
          E.bolsa = j.crearRecogible('sobre', L.pos.x + 0.8, L.pos.z, false);
          E.paso = 1;
          j.hud.notificar('gps', 'Se le cayó la bolsa', 'Recógela y decide: ¿se la regresas o te la quedas?', 4);
        }
      } else if (E.paso === 1 && E.bolsa.tomado) {
        E.paso = 2; E.reloj = 30;
        j.hud.notificar('gps', 'Tienes la bolsa', 'Llévasela a la señora en 30 s… o quédatela.', 4);
      } else if (E.paso === 2) {
        E.reloj -= dt;
        if (!V.muerto && j.peatones.includes(V) && V.pos.distanceTo(jp) < 3) { j.hud.dialogos([['Señora', '¡Gracias, joven! Que Dios se lo pague. Tenga, para su refresco.']]); this.fin('La señora te dio las gracias', 200, true); }
        else if (E.reloj <= 0) this.fin('Te quedaste con la bolsa', 350);
      }
    } else if (E.tipo === 'asalto') {
      const M = E.malo, V = E.victima;
      if (!j.peatones.includes(M) || M.muerto) { j.hud.dialogos([['Dueño de la tienda', '¡Usted nos salvó! Llévese esto, por favor.']]); this.fin('Detuviste el asalto', 350, true); return; }
      if (V.muerto) { this.fin('No llegaste a tiempo'); return; }
      V.estado = 'rendido'; V.tRendido = 999; if (V.p) V.p.manosArriba = true;
      const d = M.pos.distanceTo(jp);
      if (M.estado === 'quieto' && d < 22) { M.estado = Math.random() < 0.5 ? 'atacar' : 'huir'; M.miedo = 999; M.huyeDe?.copy(jp); M.objetivoMision = true; }
      if (M.estado === 'huir' && M.pos.distanceTo(V.pos) > 90) this.fin('El asaltante escapó');
    } else if (E.tipo === 'aventon') {
      const Q = E.pasajero, c = jug.coche;
      if (!E.abordo) {
        if (!j.peatones.includes(Q) || Q.muerto) { this.fin(null); return; }
        Q.yaw = Math.atan2(jp.x - Q.pos.x, jp.z - Q.pos.z);
        if (Math.random() < dt * 0.5) Q.p.bd.rotation.set(-2.6, 0, -0.4);
        if (c && c.tipo !== 'moto' && c.pos.distanceTo(Q.pos) < 6 && c.vel < 2) {
          E.abordo = true; Q.quitar(); j.peatones.splice(j.peatones.indexOf(Q), 1); E.gente = [];
          const L = Object.entries(j.ciudad.lugares).filter(([k, v]) => !['inicio', 'pintura'].includes(k) && Math.hypot(v.x - c.pos.x, v.z - c.pos.z) > 120);
          const [n, v] = L[Math.random() * L.length | 0];
          E.destino = { x: v.x, z: v.z }; E.reloj = 25 + Math.hypot(v.x - c.pos.x, v.z - c.pos.z) / 9;
          j.hud.dialogos([['Desconocido', `¡Gracias! Lléveme a ${j.zonaDe(v.x, v.z)}, por favor. Le pago bien.`]]);
        }
      } else {
        E.reloj -= dt;
        j.hud.temporizador(E.reloj);
        if (!c) { j.hud.temporizador(null); this.fin('El desconocido se bajó'); return; }
        if (E.reloj <= 0) { j.hud.temporizador(null); this.fin('Se le hizo tarde y se bajó'); return; }
        if (Math.hypot(E.destino.x - c.pos.x, E.destino.z - c.pos.z) < 10 && c.vel < 4) { j.hud.temporizador(null); this.fin('Llegaste a tiempo', 280); }
      }
    }
  }

  destinoGPS() {
    const E = this.e;
    if (!E) return null;
    if (E.tipo === 'aventon') return E.abordo ? { ...E.destino, tipo: 'mision' } : { x: E.pasajero.pos.x, z: E.pasajero.pos.z, tipo: 'mision' };
    return null;
  }

  marcasMapa() {
    const E = this.e;
    if (!E) return [];
    if (E.tipo === 'bolso') return E.paso === 0 ? [{ x: E.ladron.pos.x, z: E.ladron.pos.z, tipo: 'objetivo', color: AZUL, texto: 'persona', nombre: 'Ladrón de bolsos' }] : E.paso === 1 ? [{ x: E.bolsa.x, z: E.bolsa.z, tipo: 'objetivo', color: AZUL, texto: 'bolsa', nombre: 'Bolsa robada' }] : [{ x: E.victima.pos.x, z: E.victima.pos.z, tipo: 'objetivo', color: AZUL, texto: 'persona', nombre: 'Dueña de la bolsa' }];
    if (E.tipo === 'asalto') return [{ x: E.malo.pos.x, z: E.malo.pos.z, tipo: 'objetivo', color: AZUL, texto: 'persona', nombre: 'Asaltante' }];
    return E.abordo ? [{ x: E.destino.x, z: E.destino.z, tipo: 'objetivo', color: AZUL, texto: 'bandera', nombre: 'Destino del desconocido' }] : [{ x: E.pasajero.pos.x, z: E.pasajero.pos.z, tipo: 'objetivo', color: AZUL, texto: 'persona', nombre: 'Desconocido sin coche' }];
  }
}
