export class ResolucionDinamica {
  constructor(juego) {
    this.j = juego; this.cuadros = 0; this.tiempo = 0; this.bien = 0; this.mal = 0; this.factor = 1; this.min = 0.62;
  }

  maximo() { return Math.min(devicePixelRatio || 1, this.j.perfil?.pr || 1.5); }

  aplicar() {
    const j = this.j, pr = Math.max(0.4, this.maximo() * this.factor);
    j.renderer.setPixelRatio(pr); j.post?.composer?.setPixelRatio?.(pr);
    j.renderer.setSize(innerWidth, innerHeight); j.post?.tamaño?.(innerWidth, innerHeight);
  }

  actualizar(real) {
    const j = this.j;
    if (navigator.webdriver || !j.jugando || j.pausado || j.overlay || j.foto || j.ajustes?.resFija) { this.cuadros = this.tiempo = 0; return; }
    this.cuadros++; this.tiempo += real;
    if (this.tiempo < 1.5) return;
    const fps = this.cuadros / this.tiempo; this.cuadros = 0; this.tiempo = 0;
    if (fps < 47) { this.mal++; this.bien = 0; } else if (fps > 57) { this.bien++; this.mal = 0; } else { this.bien = 0; this.mal = 0; }
    if (this.mal >= 2 && this.factor > this.min) { this.factor = Math.max(this.min, this.factor - 0.1); this.mal = 0; this.aplicar(); }
    else if (this.bien >= 5 && this.factor < 1) { this.factor = Math.min(1, this.factor + 0.1); this.bien = 0; this.aplicar(); }
  }
}
