import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=202611231901';

export const PEDIDOS = [
  { tipo: 'deportivo', color: '#c8a030', nombre: 'Deportivo dorado', pago: 3500 },
  { tipo: 'vocho', color: '#6fb6e8', nombre: 'Vocho azul cielo', pago: 1500 },
  { tipo: 'camioneta', color: '#141416', nombre: 'Camioneta negra', pago: 2500 },
  { tipo: 'taxi', color: null, nombre: 'Taxi', pago: 1800 },
  { tipo: 'compacto', color: '#ecece8', nombre: 'Compacto blanco', pago: 1600 },
  { tipo: 'moto', color: '#b81e2a', nombre: 'Moto roja', pago: 2200 },
  { tipo: 'sedan', color: '#2a6a3a', nombre: 'Sedán verde', pago: 2000 },
  { tipo: 'reparto', color: null, nombre: 'Camión de reparto', pago: 3000 },
  { tipo: 'ambulancia', color: null, nombre: 'Ambulancia', pago: 4000, estrellas: 1 },
  { tipo: 'policia', color: null, nombre: 'Patrulla', pago: 5000, estrellas: 2 }
];

export class Encargos {
  constructor(juego) {
    this.j = juego; this.hechos = []; this.coche = null; this.i = -1; this.espera = 25; this.dentro = false; this.entregado = null;
  }

  get punto() { return this.j.tuneo?.punto || this.j.ciudad.lugares.taller; }

  siguiente() { return PEDIDOS.findIndex((_, i) => !this.hechos.includes(i)); }

  aparecer() {
    const j = this.j, i = this.siguiente(); if (i < 0) return;
    const P = PEDIDOS[i], jp = j.jugador.posicion, T = this.punto;
    let p = null;
    for (let k = 0; k < 12 && !p; k++) { const q = puntoCalleAleatorio(jp, 150, 330, 60); if (q && Math.hypot(q.x - T.x, q.z - T.z) > 120 && Math.abs(q.x) < 320 && Math.abs(q.z) < 320) p = q; }
    if (!p) { this.espera = 10; return; }
    const c = new Coche(j, P.tipo, P.color || undefined, p.x, p.z, p.yaw);
    c.marcado = true; c.encargo = true; c.conductor = null; c.vx = c.vz = 0;
    j.coches.push(c); this.coche = c; this.i = i; this.dentro = false;
    j.hud.notificar('coche', 'Encargo de Don Chuy', `Quiere un <b>${P.nombre}</b>. Está marcado en el mapa. Paga $${P.pago.toLocaleString('es-MX')}.`, 5);
    j.audio.notif?.();
  }

  perder(motivo) {
    const j = this.j;
    if (motivo) j.hud.notificar('alerta', 'Encargo perdido', motivo, 3.5);
    this.coche = null; this.i = -1; this.espera = 60; this.dentro = false;
  }

  entregar() {
    const j = this.j, c = this.coche, P = PEDIDOS[this.i];
    const k = Math.max(0, Math.min(1, c.salud / c.t.salud)), pago = Math.round(P.pago * (0.4 + 0.6 * k) / 10) * 10;
    j.jugador.dinero += pago; j.estadisticas?.sumar?.('ganado', pago); j.estadisticas?.sumar?.('encargos');
    this.hechos.push(this.i);
    j.subirBajar(true);
    j.hud.grande('ENCARGO ENTREGADO', `${P.nombre} · $${pago.toLocaleString('es-MX')}${k < 0.75 ? ' (Don Chuy te descontó por los golpes)' : ''}`, 3, 'exito');
    j.audio.compra();
    this.entregado = { c, t: 2.5 };
    this.coche = null; this.i = -1; this.dentro = false;
    if (this.hechos.length >= PEDIDOS.length) { j.jugador.dinero += 15000; setTimeout(() => j.hud.grande('¡LISTA COMPLETA!', 'Don Chuy te da $15,000 extra', 3.5, 'exito'), 3200); }
    else this.espera = 40;
    j.guardar();
  }

  actualizar(dt) {
    const j = this.j, J = j.jugador;
    if (this.entregado) { this.entregado.t -= dt; if (this.entregado.t <= 0) { const c = this.entregado.c, ix = j.coches.indexOf(c); if (ix >= 0 && J.coche !== c) { c.quitar(); j.coches.splice(ix, 1); } this.entregado = null; } }
    if (!this.coche) {
      if (this.siguiente() < 0 || j.misiones?.activa || J.interior) return;
      this.espera -= dt; if (this.espera <= 0) this.aparecer();
      return;
    }
    const c = this.coche, P = PEDIDOS[this.i];
    if (!j.coches.includes(c)) return this.perder('El coche desapareció.');
    if (c.quemado || c.ahogado) return this.perder('Se destruyó el ' + P.nombre.toLowerCase() + '. Don Chuy buscará otro.');
    if (J.coche === c && !this.dentro) {
      this.dentro = true;
      j.gps.marcar(this.punto.x, this.punto.z);
      j.hud.grande('ENCARGO', 'Llévalo al taller de Don Chuy sin golpearlo mucho', 2.6);
      if (P.estrellas && j.policia.estrellas < P.estrellas) j.policia.subir(P.estrellas);
    }
    if (J.coche !== c) this.dentro = false;
    if (J.coche === c) {
      const d = Math.hypot(c.pos.x - this.punto.x, c.pos.z - this.punto.z);
      if (d < 6) {
        if (j.policia.estrellas) j.hud.pista('·', 'Don Chuy no recibe coches con la policía detrás');
        else if (Math.abs(c.vel || 0) < 3) this.entregar();
        else j.hud.pista('·', 'Frena para entregar el encargo');
      }
    }
  }

  marcasMapa() {
    const c = this.coche;
    if (!c || this.j.jugador.coche === c) return this.coche ? [{ x: this.punto.x, z: this.punto.z, tipo: 'icono', ic: { c: '#f6c431', t: 'llave', n: 'Entrega del encargo' } }] : [];
    return [{ x: c.pos.x, z: c.pos.z, tipo: 'icono', ic: { c: '#f6c431', t: 'coche', n: 'Encargo: ' + PEDIDOS[this.i].nombre } }];
  }

  guardar() { return { hechos: this.hechos }; }
  cargar(d) { if (d?.hechos) this.hechos = d.hechos.filter(i => i < PEDIDOS.length); }
}
