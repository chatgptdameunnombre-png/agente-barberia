import { CELDA } from './mapa.js?v=20260905173303';

const COLORES = {
  '#': '#8a7f66',
  'T': '#a3502c',
  'C': '#d9cfb4',
  'F': '#c9a227',
  'R': '#4a4640'
};

export class Minimapa {
  constructor(lienzo, nivel) {
    this.lienzo = lienzo;
    this.ctx = lienzo.getContext('2d');
    this.nivel = nivel;
    this.escala = Math.min(lienzo.width / nivel.ancho, lienzo.height / nivel.alto);
    this.margenX = (lienzo.width - nivel.ancho * this.escala) / 2;
    this.margenZ = (lienzo.height - nivel.alto * this.escala) / 2;
    this.pulso = 0;
    this._fondo();
  }

  _fondo() {
    const c = document.createElement('canvas');
    c.width = this.lienzo.width;
    c.height = this.lienzo.height;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(10,7,4,.82)';
    x.fillRect(0, 0, c.width, c.height);
    const e = this.escala;
    for (let z = 0; z < this.nivel.alto; z++) {
      for (let cx = 0; cx < this.nivel.ancho; cx++) {
        const s = this.nivel.rejilla[z][cx];
        const px = this.margenX + cx * e;
        const pz = this.margenZ + z * e;
        if (COLORES[s]) {
          x.fillStyle = COLORES[s];
          x.fillRect(px, pz, Math.ceil(e), Math.ceil(e));
        } else {
          x.fillStyle = 'rgba(45,60,80,.55)';
          x.fillRect(px, pz, Math.ceil(e), Math.ceil(e));
        }
      }
    }
    this.fondo = c;
  }

  refrescar() {
    this._fondo();
  }

  _punto(x, z) {
    return [this.margenX + (x / CELDA) * this.escala, this.margenZ + (z / CELDA) * this.escala];
  }

  dibujar(dt, jugador, enemigos, objetos) {
    this.pulso += dt * 5;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.lienzo.width, this.lienzo.height);
    ctx.drawImage(this.fondo, 0, 0);

    ctx.fillStyle = '#e8c14a';
    for (const o of objetos) {
      const [px, pz] = this._punto(o.pos.x, o.pos.z);
      ctx.fillRect(px - 1.5, pz - 1.5, 3, 3);
    }

    const brillo = 0.55 + Math.sin(this.pulso) * 0.45;
    for (const e of enemigos) {
      const [px, pz] = this._punto(e.pos.x, e.pos.z);
      if (!e.vivo) {
        ctx.fillStyle = 'rgba(90,20,16,.5)';
        ctx.fillRect(px - 1.5, pz - 1.5, 3, 3);
        continue;
      }
      ctx.fillStyle = `rgba(226,58,40,${brillo})`;
      ctx.beginPath();
      ctx.arc(px, pz, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const [jx, jz] = this._punto(jugador.pos.x, jugador.pos.z);
    ctx.save();
    ctx.translate(jx, jz);
    ctx.rotate(-jugador.yaw);
    ctx.fillStyle = '#f2e2b0';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export class Marcas {
  constructor(lienzo) {
    this.lienzo = lienzo;
    this.ctx = lienzo.getContext('2d');
  }

  medir() {
    this.lienzo.width = innerWidth;
    this.lienzo.height = innerHeight;
  }

  dibujar(jugador, enemigos) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.lienzo.width, this.lienzo.height);
    const cerca = enemigos
      .filter(e => e.vivo)
      .map(e => ({ e, d: Math.hypot(e.pos.x - jugador.pos.x, e.pos.z - jugador.pos.z) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);

    const cx = this.lienzo.width / 2;
    const cy = this.lienzo.height / 2;
    const radio = Math.min(cx, cy) * 0.93;

    for (const { e, d } of cerca) {
      const dx = e.pos.x - jugador.pos.x;
      const dz = e.pos.z - jugador.pos.z;
      let rel = Math.atan2(dx, -dz) - (-jugador.yaw);
      rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      if (Math.abs(rel) < 0.55) continue;
      const fuerza = Math.max(0.45, 1 - d / 80);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rel);
      ctx.translate(0, -radio);
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(14, 9);
      ctx.lineTo(0, 3);
      ctx.lineTo(-14, 9);
      ctx.closePath();
      ctx.fillStyle = `rgba(226,58,40,${fuerza})`;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = `rgba(0,0,0,${fuerza})`;
      ctx.stroke();
      ctx.restore();
    }
  }
}
