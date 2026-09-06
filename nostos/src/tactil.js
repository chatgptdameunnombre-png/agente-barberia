export function esTactil() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

const BOTONES = [
  { id: 'tArco', texto: 'ARCO', clase: 'grande' },
  { id: 'tTajo', texto: 'F' },
  { id: 'tLanzar', texto: 'T' },
  { id: 'tCambiar', texto: 'Z' },
  { id: 'tTienda', texto: 'E' },
  { id: 'tGrieta', texto: 'V' }
];

export class Tactil {
  constructor(jugador, acciones) {
    this.jugador = jugador;
    this.acciones = acciones;
    this.mirando = null;
    this.palanca = null;
    this._crear();
  }

  _crear() {
    document.body.classList.add('tactil');

    const capa = document.createElement('div');
    capa.id = 'tactil';
    capa.innerHTML = `
      <div id="palanca"><div class="base"><div class="pomo"></div></div></div>
      <div id="botones">
        ${BOTONES.map(b => `<button id="${b.id}" class="tb ${b.clase || ''}">${b.texto}</button>`).join('')}
      </div>`;
    document.body.appendChild(capa);

    this.pomo = capa.querySelector('.pomo');
    this.base = capa.querySelector('.base');

    const zonaPalanca = capa.querySelector('#palanca');
    zonaPalanca.addEventListener('touchstart', e => this._tomarPalanca(e), { passive: false });
    zonaPalanca.addEventListener('touchmove', e => this._moverPalanca(e), { passive: false });
    zonaPalanca.addEventListener('touchend', () => this._soltarPalanca());
    zonaPalanca.addEventListener('touchcancel', () => this._soltarPalanca());

    addEventListener('touchstart', e => this._mirarInicio(e), { passive: false });
    addEventListener('touchmove', e => this._mirarMover(e), { passive: false });
    addEventListener('touchend', e => this._mirarFin(e));
    addEventListener('touchcancel', e => this._mirarFin(e));

    const pulsa = (id, alTocar, alSoltar) => {
      const b = document.getElementById(id);
      b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); alTocar(); }, { passive: false });
      if (alSoltar) {
        b.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); alSoltar(); });
        b.addEventListener('touchcancel', () => alSoltar());
      }
    };

    pulsa('tArco', () => { this.jugador.tensando = true; },
                   () => { if (this.jugador.tensando) { this.jugador.tensando = false; this.jugador._soltar(); } });
    pulsa('tTajo', () => this.jugador.tajo());
    pulsa('tLanzar', () => this.acciones.lanzar());
    pulsa('tCambiar', () => this.acciones.cambiar());
    pulsa('tTienda', () => this.acciones.tienda());
    pulsa('tGrieta', () => this.acciones.grieta());
  }

  _dentroDeUi(t) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    return el && el.closest && el.closest('#tactil, #botonera, #panel, #tienda, #menu');
  }

  _tomarPalanca(e) {
    e.preventDefault();
    e.stopPropagation();
    const t = e.changedTouches[0];
    const r = this.base.getBoundingClientRect();
    this.palanca = { id: t.identifier, cx: r.left + r.width / 2, cy: r.top + r.height / 2, radio: r.width / 2 };
    this._moverPalanca(e);
  }

  _moverPalanca(e) {
    if (!this.palanca) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== this.palanca.id) continue;
      let dx = t.clientX - this.palanca.cx;
      let dy = t.clientY - this.palanca.cy;
      const d = Math.hypot(dx, dy) || 1;
      const tope = this.palanca.radio;
      if (d > tope) { dx = dx / d * tope; dy = dy / d * tope; }
      this.pomo.style.transform = `translate(${dx}px, ${dy}px)`;
      const nx = dx / tope, ny = dy / tope;
      const k = this.jugador.teclas;
      k.KeyW = ny < -0.28;
      k.KeyS = ny > 0.28;
      k.KeyA = nx < -0.28;
      k.KeyD = nx > 0.28;
    }
  }

  _soltarPalanca() {
    this.palanca = null;
    this.pomo.style.transform = 'translate(0,0)';
    const k = this.jugador.teclas;
    k.KeyW = k.KeyS = k.KeyA = k.KeyD = false;
  }

  _mirarInicio(e) {
    for (const t of e.changedTouches) {
      if (this.mirando || this._dentroDeUi(t)) continue;
      this.mirando = { id: t.identifier, x: t.clientX, y: t.clientY };
      e.preventDefault();
    }
  }

  _mirarMover(e) {
    if (!this.mirando) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== this.mirando.id) continue;
      e.preventDefault();
      const dx = t.clientX - this.mirando.x;
      const dy = t.clientY - this.mirando.y;
      this.mirando.x = t.clientX;
      this.mirando.y = t.clientY;
      this.jugador.yaw -= dx * 0.005;
      this.jugador.pitch = Math.max(-1.04, Math.min(1.04, this.jugador.pitch - dy * 0.005));
    }
  }

  _mirarFin(e) {
    if (!this.mirando) return;
    for (const t of e.changedTouches) {
      if (t.identifier === this.mirando.id) this.mirando = null;
    }
  }
}
