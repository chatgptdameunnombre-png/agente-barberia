const DESCANSO = 9;
const PRIMERA_ESPERA = 2.5;

export class Rondas {
  constructor(cfg) {
    this.puntos = cfg.puntos;
    this.crear = cfg.crear;
    this.soltar = cfg.soltar;
    this.anunciar = cfg.anunciar;
    this.bloqueado = cfg.bloqueado || (() => false);
    this.ajustar = cfg.ajustar || (p => p);
    this.alEmpezar = cfg.alEmpezar || (() => {});
    this.numero = 0;
    this.estado = 'descanso';
    this.reloj = DESCANSO - PRIMERA_ESPERA;
  }

  get restante() {
    if (this.estado !== 'descanso') return 0;
    return Math.max(0, DESCANSO - this.reloj);
  }

  esRondaJefe(n) {
    return n === 15;
  }

  vidaDe(n) {
    return n <= 8 ? 55 + (n - 1) * 13 : 146 + (n - 8) * 6;
  }

  perfil(n) {
    const base = {
      vida: this.vidaDe(n),
      velocidad: Math.min(6.6, 4 + n * 0.17),
      dano: Math.min(21, 11 + Math.floor(n * 0.75))
    };
    if (this.esRondaJefe(n)) return { ...base, cuantos: 5, jefe: true };
    return { ...base, cuantos: Math.min(16, 2 + Math.floor(n * 1.2)) };
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
    const cfg = this.ajustar(this.perfil(this.numero));
    this.ultimoPerfil = cfg;
    const puntos = this.puntosLejanos(jugador, cfg.cuantos);
    puntos.forEach((p, i) => {
      const angulo = (i / puntos.length) * Math.PI * 2;
      const pos = p.clone();
      pos.x += Math.cos(angulo) * 2.2;
      pos.z += Math.sin(angulo) * 2.2;
      this.crear(pos, cfg, i);
    });
    this.estado = 'combate';
    if (cfg.jefe) this.anunciar('POLIFEMO DESPIERTA', 'EL QUE TE COMIO A TUS HOMBRES');
    this.alEmpezar(this.numero, cfg);
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
