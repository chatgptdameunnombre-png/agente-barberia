import { Peaton } from './peatones.js?v=202611221845';
import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=202611221845';
import { NEGOCIOS } from './economia.js?v=202611221845';

const libre = (j, x, z) => {
  for (let r = 0; r < 14; r += 1) for (let a = 0; a < 12; a++) { const px = x + Math.cos(a * Math.PI / 6) * r, pz = z + Math.sin(a * Math.PI / 6) * r; if (!j.mundo.dentro(px, 1, pz)) return { x: px, z: pz }; }
  return { x, z };
};

export class NegociosVivos {
  constructor(juego) { this.j = juego; this.ev = null; this.prox = 300 + Math.random() * 200; this.forzar = null; }

  lugar(id) {
    const j = this.j, L = j.ciudad.lugares;
    if (id === 'taqueria') { const p = j.ambulantes?.puestos?.find(q => q.tipo === 'tacos'); return p ? { x: p.x, z: p.z + 2 } : L.plaza; }
    if (id === 'cantina') { const t = j.interiores.tiendas.find(q => q.tipo === 'cantina'); return t ? { x: t.puerta.x + t.fx * 2, z: t.puerta.z + t.fz * 2 } : L.mercado; }
    return L.gasolinera;
  }

  malos(x, z, n, estado, armas) {
    const j = this.j, l = [];
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, p = libre(j, x + Math.cos(a) * 3, z + Math.sin(a) * 3);
      const g = new Peaton(j, { tipo: 'matón', x: p.x, z: p.z, estado, arma: armas[k % armas.length] });
      g.fila = true; g.yaw = a + Math.PI; j.peatones.push(g); l.push(g);
    }
    return l;
  }

  empezar(tipo, id) {
    const j = this.j, N = NEGOCIOS.find(n => n.id === id), P = this.lugar(id);
    const ev = { tipo, id, nombre: N.nombre, P, t: tipo === 'mercancia' ? 240 : 180, malos: null, coche: null };
    if (tipo === 'mercancia') {
      const q = puntoCalleAleatorio(P, 160, 260, 60) || { x: P.x + 180, z: P.z, yaw: 0 };
      const c = new Coche(j, 'reparto', undefined, q.x, q.z, q.yaw); c.marcado = true; c.conductor = null; j.coches.push(c); ev.coche = c;
      j.hud.notificar('tienda', ev.nombre, 'Se atrasó la mercancía. Recoge el camión de reparto y llévalo a tu negocio en 4 minutos.', 6);
    } else if (tipo === 'piso') {
      ev.malos = this.malos(P.x, P.z, 3, 'quieto', ['pistola', 'bate', 'subfusil']);
      const q = puntoCalleAleatorio(P, 6, 20, 15); if (q) { const c = new Coche(j, 'camioneta', '#1a1a1e', q.x, q.z, q.yaw); c.marcado = true; c.conductor = null; j.coches.push(c); ev.coche = c; }
      j.hud.notificar('alerta', ev.nombre, 'Unos tipos llegaron a cobrar "piso" en tu negocio. Ve a sacarlos en 3 minutos.', 6);
    } else {
      j.hud.notificar('alerta', ev.nombre, '¡Están asaltando tu negocio! Llega en 3 minutos o se llevan lo que juntó.', 6);
    }
    j.audio.alerta?.(); this.ev = ev;
  }

  terminar(gano, texto) {
    const j = this.j, ev = this.ev;
    if (gano) { j.jugador.dinero += ev.premio || 700; j.hud.grande('¡NEGOCIO A SALVO!', texto, 3, 'exito'); j.audio.compra(); }
    else { j.economia.cajas[ev.id] = 0; j.hud.notificar('alerta', ev.nombre, texto, 4.5); }
    for (const g of ev.malos || []) if (!g.muerto && g.estado === 'quieto') { const i = j.peatones.indexOf(g); if (i >= 0) { g.quitar(); j.peatones.splice(i, 1); } }
    if (ev.coche && ev.tipo !== 'mercancia' && !ev.coche.conductor) { const i = j.coches.indexOf(ev.coche); if (i >= 0 && j.jugador.coche !== ev.coche) { ev.coche.quitar(); j.coches.splice(i, 1); } }
    this.ev = null; this.prox = 360 + Math.random() * 300; j.guardar();
  }

  actualizar(dt) {
    const j = this.j, jp = j.jugador.posicion;
    if (!this.ev) {
      const mios = NEGOCIOS.filter(n => n.renta && j.economia.tiene(n.id));
      if (!mios.length && !this.forzar) return;
      this.prox -= dt;
      if (this.forzar || (this.prox <= 0 && !j.misiones?.activa && !j.jugador.interior && (j.policia.estrellas || 0) < 2 && !j.territorio?.guerra && !j.territorio?.ataque)) {
        const f = this.forzar; this.forzar = null;
        const id = f?.id || mios[Math.random() * mios.length | 0].id, tipo = f?.tipo || ['asalto', 'piso', 'mercancia'][Math.random() * 3 | 0];
        this.empezar(tipo, id);
      } else if (this.prox <= 0) this.prox = 30;
      return;
    }
    const ev = this.ev, P = ev.P;
    ev.t -= dt;
    const d = Math.hypot(jp.x - P.x, jp.z - P.z);
    if (ev.tipo === 'mercancia') {
      const c = ev.coche;
      if (!c || c.quemado || c.ahogado || !j.coches.includes(c)) return this.terminar(false, 'Se perdió la mercancía.');
      if (j.jugador.coche === c && Math.hypot(c.pos.x - P.x, c.pos.z - P.z) < 9 && Math.abs(c.vel || 0) < 4) { ev.premio = 700; j.economia.cajas[ev.id] = (j.economia.cajas[ev.id] || 0) + (NEGOCIOS.find(n => n.id === ev.id).renta || 0) * 3; c.marcado = false; return this.terminar(true, 'Llegó la mercancía · +$700 y tu negocio vende más'); }
      if (ev.t <= 0) return this.terminar(false, 'No llegó la mercancía a tiempo: se perdió la venta del día.');
      if (j.jugador.coche !== c) j.hud.pista('·', `Recoge el camión de reparto · ${Math.ceil(ev.t)} s`); else j.hud.pista('·', `Lleva la mercancía a ${ev.nombre} · ${Math.ceil(ev.t)} s`);
      return;
    }
    if (!ev.malos && d < 55) { ev.malos = this.malos(P.x, P.z, 4, 'atacar', ['pistola', 'subfusil', 'escopeta', 'bate']); j.hud.grande('¡DEFIENDE TU NEGOCIO!', ev.nombre, 2); }
    if (ev.malos) {
      if (ev.tipo === 'piso' && d < 30) for (const g of ev.malos) if (!g.muerto && g.estado === 'quieto') { g.estado = 'atacar'; j.hud.burbuja?.(g, 'Aquí se paga piso, compa.'); }
      const vivos = ev.malos.filter(g => !g.muerto);
      if (!vivos.length) { ev.premio = ev.tipo === 'piso' ? 900 : 600; return this.terminar(true, ev.tipo === 'piso' ? 'Ya nadie te cobra piso · +$900' : 'Asaltantes fuera · +$600'); }
      if (d < 60) j.hud.pista('·', `Quedan ${vivos.length} en ${ev.nombre}`);
    }
    if (ev.t <= 0) return this.terminar(false, ev.tipo === 'piso' ? 'Se llevaron la cuota: perdiste lo que juntó el negocio.' : 'Se llevaron lo que juntó el negocio.');
    if (d >= 60) j.hud.pista('·', `${ev.nombre} te necesita · ${Math.ceil(ev.t)} s`);
  }

  marcasMapa() {
    const ev = this.ev; if (!ev) return [];
    if (ev.tipo === 'mercancia' && ev.coche && this.j.jugador.coche !== ev.coche) return [{ x: ev.coche.pos.x, z: ev.coche.pos.z, tipo: 'objetivo', color: '#ff4f9a' }];
    return [{ x: ev.P.x, z: ev.P.z, tipo: 'objetivo', color: '#ff4f9a' }];
  }
}
