import { Coche, puntoCalleAleatorio, TIPOS } from './vehiculos.js?v=202611220210';

export const NEGOCIOS = [
  { id: 'depa', nombre: 'Departamento Jacaranda', precio: 6000, renta: 0, desc: 'Tu casa: duerme, cúrate y guarda la partida.' },
  { id: 'taqueria', nombre: 'Tacos La Calzada', precio: 8000, renta: 60, desc: 'Deja dinero cada hora del juego.' },
  { id: 'lavado', nombre: 'Autolavado Burbujas', precio: 14000, renta: 110, desc: 'Más clientes, más ganancia.' },
  { id: 'cantina', nombre: 'Cantina La Jacaranda', precio: 25000, renta: 200, desc: 'Y las bebidas te salen gratis.' },
  { id: 'gasolinera', nombre: 'Gasolinera Jacaranda', precio: 40000, renta: 330, desc: 'El negocio más rentable de la ciudad.' }
];

export const AUTOS = [
  { id: 'compacto', nombre: 'Compacto urbano', precio: 2500, color: '#2e5a8a' },
  { id: 'sedan', nombre: 'Sedán clásico', precio: 4000, color: '#8a2a26' },
  { id: 'moto', nombre: 'Moto de calle', precio: 4500, color: '#1c1c22' },
  { id: 'camioneta', nombre: 'Camioneta de trabajo', precio: 6500, color: '#3a6a44' },
  { id: 'deportivo', nombre: 'Deportivo Rayo', precio: 18000, color: '#b8962e' }
];

export const MEJORAS = [
  { id: 'motor', nombre: 'Motor afinado', precio: 2500, desc: '+18% de velocidad y aceleración' },
  { id: 'frenos', nombre: 'Frenos de carreras', precio: 1200, desc: 'Frena mucho más rápido' },
  { id: 'blindaje', nombre: 'Blindaje', precio: 3500, desc: 'Aguanta casi el doble de golpes y balas' },
  { id: 'nitro', nombre: 'Tanque de nitro doble', precio: 2000, desc: 'El nitro dura el doble' }
];

export const COMIDA = [
  { id: 'torta', nombre: 'Torta ahogada', precio: 60, cura: 60 },
  { id: 'tacos', nombre: 'Orden de tacos', precio: 90, cura: 100 },
  { id: 'agua', nombre: 'Agua de horchata', precio: 25, cura: 20 },
  { id: 'birria', nombre: 'Birria con consomé', precio: 85, cura: 90 },
  { id: 'elote', nombre: 'Elote preparado', precio: 35, cura: 30 },
  { id: 'tamales', nombre: 'Tamales (3)', precio: 50, cura: 50 }
];

export class Economia {
  constructor(juego) {
    this.j = juego;
    this.cajas = {};
    this.garaje = [];
    this.cocheMio = null;
    this.reloj = 0;
    this.pedidos = [];
  }

  tiene(id) { return !!this.j.propiedades[id]; }

  comprarNegocio(id) {
    const j = this.j, n = NEGOCIOS.find(x => x.id === id);
    if (!n || this.tiene(id)) return;
    if (!this.pagar(n.precio)) return;
    j.propiedades[id] = true;
    j.hud.grande('¡ES TUYO!', n.nombre, 2.6, 'exito');
    j.audio.compra();
    j.guardar();
  }

  pagar(n) {
    const j = this.j, jug = j.jugador;
    const total = jug.dinero + j.banco;
    if (total < n) { j.hud.notificar('alerta', 'No te alcanza', 'Te faltan $' + (n - total).toLocaleString('es-MX'), 3); j.audio.alerta(); return false; }
    const deMano = Math.min(jug.dinero, n);
    jug.dinero -= deMano; j.banco -= n - deMano;
    j.hud.popDinero(-n);
    return true;
  }

  depositar(todo) { const j = this.j, n = todo ? j.jugador.dinero : Math.min(500, j.jugador.dinero); if (!n) return; j.jugador.dinero -= n; j.banco += n; j.audio.dinero(); j.guardar(); }
  retirar(todo) { const j = this.j, n = todo ? j.banco : Math.min(500, j.banco); if (!n) return; j.banco -= n; j.jugador.dinero += n; j.audio.dinero(); j.guardar(); }

  cobrar() {
    const j = this.j;
    let total = 0;
    for (const k in this.cajas) { total += Math.floor(this.cajas[k]); this.cajas[k] = 0; }
    if (!total) { j.hud.notificar('dinero', 'Tus negocios', 'Todavía no juntan nada.', 2.5); return; }
    j.banco += total; j.estadisticas.sumar('ganado', total);
    j.hud.notificar('dinero', 'Cobraste tus negocios', '+$' + total.toLocaleString('es-MX') + ' al banco', 3.5);
    j.audio.compra(); j.guardar();
  }

  comprarAuto(id) {
    const a = AUTOS.find(x => x.id === id);
    if (!a || this.garaje.some(g => g.tipo === id)) return;
    if (!this.pagar(a.precio)) return;
    this.garaje.push({ tipo: id, color: a.color, mejoras: {} });
    this.j.hud.grande('NUEVO VEHÍCULO', a.nombre + ' · pídelo desde el teléfono', 2.6, 'exito');
    this.j.audio.compra(); this.j.guardar();
  }

  pedirAuto(i) {
    const j = this.j, g = this.garaje[i];
    if (!g) return;
    const p = puntoCalleAleatorio(j.jugador.posicion, 10, 60, 400);
    if (!p) { j.hud.notificar('alerta', 'Sin lugar', 'Ve a una calle para que te lo dejen.', 3); return; }
    if (this.cocheMio && this.cocheMio !== j.jugador.coche && j.coches.includes(this.cocheMio)) { this.cocheMio.quitar(); j.coches.splice(j.coches.indexOf(this.cocheMio), 1); }
    const c = new Coche(j, g.tipo, g.color, p.x, p.z, p.yaw);
    c.marcado = true; c.propio = true;
    aplicarMejoras(c, g.mejoras);
    j.coches.push(c);
    this.cocheMio = c;
    j.gps.marcar(p.x, p.z);
    j.hud.notificar('coche', 'Tu ' + AUTOS.find(a => a.id === g.tipo).nombre.toLowerCase() + ' llegó', 'Te lo marcamos en el GPS.', 3.5);
  }

  mejorar(i, id) {
    const j = this.j, g = this.garaje[i], m = MEJORAS.find(x => x.id === id);
    if (!g || !m || g.mejoras[id]) return;
    if (!this.pagar(m.precio)) return;
    g.mejoras[id] = true;
    if (this.cocheMio?.tipo === g.tipo) aplicarMejoras(this.cocheMio, g.mejoras);
    j.hud.notificar('coche', m.nombre, 'Instalado en tu ' + AUTOS.find(a => a.id === g.tipo).nombre.toLowerCase(), 3);
    j.audio.compra(); j.guardar();
  }

  pedirComida(id) {
    const c = COMIDA.find(x => x.id === id);
    if (!c || !this.pagar(c.precio)) return;
    this.pedidos.push({ t: 8, c });
    this.j.hud.notificar('tienda', 'Pedido en camino', c.nombre + ' llega en unos segundos.', 3);
  }

  actualizar(dt) {
    const j = this.j;
    const horas = dt * j.ambiente.velocidad;
    if (this.horaPrevia !== undefined && j.ambiente.hora < this.horaPrevia - 12) { const pago = j.redes.pagoDiario(); if (pago) { j.banco += pago; j.hud.notificar('dinero', 'Pago de patrocinios', '+$' + pago.toLocaleString('es-MX') + ' al banco', 4); } }
    this.horaPrevia = j.ambiente.hora;
    for (const n of NEGOCIOS) if (n.renta && this.tiene(n.id)) this.cajas[n.id] = Math.min(n.renta * 48, (this.cajas[n.id] || 0) + n.renta * horas);
    this.reloj += dt;
    if (this.reloj > 120) {
      this.reloj = 0;
      const total = Object.values(this.cajas).reduce((a, b) => a + b, 0);
      if (total > 300) { j.hud.notificar('dinero', 'Tus negocios juntaron $' + Math.floor(total).toLocaleString('es-MX'), 'Cóbralo en el teléfono (P) → Negocios.', 4); j.audio.notif?.(); }
    }
    for (let i = this.pedidos.length - 1; i >= 0; i--) {
      const p = this.pedidos[i]; p.t -= dt;
      if (p.t <= 0) { this.pedidos.splice(i, 1); const jug = j.jugador; jug.salud = Math.min(jug.saludMax, jug.salud + p.c.cura); j.hud.notificar('ok', 'Llegó tu ' + p.c.nombre.toLowerCase(), '+' + p.c.cura + ' de salud', 3); j.audio.dinero(); }
    }
  }

  marcasMapa() {
    const c = this.cocheMio;
    return c && !c.quemado && c !== this.j.jugador.coche && this.j.coches.includes(c) ? [{ x: c.pos.x, z: c.pos.z, tipo: 'actividad', color: '#4fe08a', texto: 'coche', nombre: 'Tu coche' }] : [];
  }

  guardar() { return { cajas: this.cajas, garaje: this.garaje }; }
  cargar(d) { if (!d) return; this.cajas = d.cajas || {}; this.garaje = d.garaje || []; }
}

export function aplicarMejoras(c, m) {
  const base = TIPOS[c.tipo];
  c.t = { ...base };
  if (m.motor) { c.t.vmax *= 1.18; c.t.acel *= 1.25; }
  if (m.frenos) c.t.freno *= 1.6;
  if (m.blindaje) { c.t.salud = Math.round(base.salud * 1.9); c.t.masa *= 1.25; }
  c.salud = c.t.salud;
  c.mejoras = m;
}
