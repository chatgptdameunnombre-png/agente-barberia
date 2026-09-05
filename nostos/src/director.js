export class Director {
  constructor() {
    this.presion = 1;
    this.relojRonda = 0;
    this.bajoDeVida = 0;
    this.socorro = 0;
  }

  reiniciar() {
    this.presion = 1;
    this.relojRonda = 0;
    this.bajoDeVida = 0;
    this.socorro = 0;
  }

  empiezaRonda() {
    this.relojRonda = 0;
    this.bajoDeVida = 0;
  }

  terminaRonda(jugador, cuantos) {
    const salud = jugador.vida / jugador.vidaMax;
    const porEnemigo = cuantos ? this.relojRonda / cuantos : this.relojRonda;
    let ajuste = 0;
    if (salud > 0.8) ajuste += 0.12;
    if (salud < 0.35) ajuste -= 0.15;
    if (porEnemigo < 3) ajuste += 0.1;
    if (porEnemigo > 8) ajuste -= 0.1;
    if (this.bajoDeVida > 8) ajuste -= 0.12;
    this.presion = Math.max(0.65, Math.min(1.45, this.presion + ajuste));
    return this.presion;
  }

  actualizar(dt, jugador) {
    this.relojRonda += dt;
    if (jugador.vida / jugador.vidaMax < 0.3) this.bajoDeVida += dt;
    if (this.socorro > 0) this.socorro -= dt;
  }

  pideSocorro(jugador) {
    if (this.socorro > 0) return false;
    if (jugador.vida / jugador.vidaMax > 0.22) return false;
    if (this.bajoDeVida < 6) return false;
    this.socorro = 35;
    return true;
  }

  ajustar(perfil) {
    return {
      ...perfil,
      cuantos: Math.max(2, Math.round(perfil.cuantos * this.presion)),
      vida: Math.round(perfil.vida * (0.85 + this.presion * 0.15)),
      velocidad: perfil.velocidad * (0.92 + this.presion * 0.08)
    };
  }
}
