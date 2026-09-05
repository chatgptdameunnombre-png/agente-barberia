const DESCANSO = 9;
const PRIMERA_ESPERA = 2.5;

export class Rondas {
  constructor(cfg) {
    this.puntos = cfg.puntos;
    this.crear = cfg.crear;
    this.soltar = cfg.soltar;
    this.anunciar = cfg.anunciar;
    this.bloqueado = cfg.bloqueado || (() => false);
    this.numero = 0;
    this.estado = 'descanso';
    this.reloj = DESCANSO - PRIMERA_ESPERA;
  }

  perfil(n) {
    return {
      cuantos: Math.min(20, 2 + Math.floor(n * 1.5)),
      vida: 55 + (n - 1) * 13,
      velocidad: Math.min(7.2, 4 + n * 0.2),
      dano: Math.min(26, 12 + n)
    };
  }

  puntosLejanos(jugador, cuantos) {
    const orden = this.puntos
      .map(p => ({ p, d: Math.hypot(p.x - jugador.pos.x, p.z - jugador.pos.z) }))
      .sort((a, b) => b.d - a.d)
      .map(o => o.p);
    const salida = [];
    for (let i = 0; i < cuantos; i++) salida.push(orden[i % orden.length]);
    return salida;
  }

  lanzar(jugador) {
    this.numero++;
    const cfg = this.perfil(this.numero);
    const puntos = this.puntosLejanos(jugador, cfg.cuantos);
    puntos.forEach((p, i) => {
      const angulo = (i / puntos.length) * Math.PI * 2;
      const pos = p.clone();
      pos.x += Math.cos(angulo) * 2.2;
      pos.z += Math.sin(angulo) * 2.2;
      this.crear(pos, cfg);
    });
    this.estado = 'combate';
    this.anunciar('RONDA ' + this.numero, cfg.cuantos + ' ENEMIGOS');
  }

  reiniciar() {
    this.numero = 0;
    this.estado = 'descanso';
    this.reloj = DESCANSO - PRIMERA_ESPERA;
  }

  actualizar(dt, enemigos, jugador) {
    if (this.estado === 'descanso') {
      if (this.bloqueado()) return;
      this.reloj += dt;
      if (this.reloj >= DESCANSO) {
        this.reloj = 0;
        this.lanzar(jugador);
      }
      return;
    }
    const quedan = enemigos.some(e => e.vivo);
    if (!quedan) {
      this.estado = 'descanso';
      this.reloj = 0;
      this.soltar(this.numero);
      this.anunciar('RONDA ' + this.numero + ' LIMPIA', 'PULSA E PARA COMERCIAR');
    }
  }
}
