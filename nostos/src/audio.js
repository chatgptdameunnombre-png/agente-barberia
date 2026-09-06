const MAX_DIST = 70;

const MUESTRAS = ['carne', 'piedra', 'garrote', 'muereEnemigo', 'dano', 'tajo', 'comprar',
  'recoger', 'curar', 'vacio', 'fallo', 'ronda', 'portalAzul', 'portalNaranja', 'cruzar',
  'rayo', 'muerte'];

export class Audio {
  constructor() {
    this.ctx = null;
    this.listo = false;
    this.silencio = localStorage.getItem('nostos.mudo') === '1';
    this.volumen = 0.75;
    this.oyente = { x: 0, z: 0, yaw: 0 };
    this.musicaViva = false;
    this.intensidad = 0;
  }

  arrancar() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.maestro = this.ctx.createGain();
    this.maestro.gain.value = this.silencio ? 0 : this.volumen;
    this.maestro.connect(this.ctx.destination);

    this.canalEfectos = this.ctx.createGain();
    this.canalEfectos.gain.value = 1;
    this.canalEfectos.connect(this.maestro);

    this.canalMusica = this.ctx.createGain();
    this.canalMusica.gain.value = 0;
    this.canalMusica.connect(this.maestro);

    this.ruidoBuffer = this._ruido(1.6);
    this.listo = true;
    this._cargarMuestras();
  }

  _cargarMuestras() {
    if (this.muestras) return;
    this.muestras = {};
    const base = new URL('../sfx/', import.meta.url).href;
    for (const id of MUESTRAS) {
      fetch(base + id + '.mp3')
        .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then(b => this.ctx.decodeAudioData(b))
        .then(buf => { this.muestras[id] = buf; })
        .catch(() => {});
    }
  }

  _tocarMuestra(buf, salida, fuerza) {
    const f = this.ctx.createBufferSource();
    f.buffer = buf;
    f.playbackRate.value = 0.92 + Math.random() * 0.16;
    f.connect(salida);
    f.start();
  }

  _ruido(segundos) {
    const n = Math.floor(this.ctx.sampleRate * segundos);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  mudo(valor) {
    this.silencio = valor === undefined ? !this.silencio : valor;
    localStorage.setItem('nostos.mudo', this.silencio ? '1' : '0');
    if (this.maestro) {
      this.maestro.gain.setTargetAtTime(this.silencio ? 0 : this.volumen, this.ctx.currentTime, 0.05);
    }
    return this.silencio;
  }

  oir(pos, yaw) {
    this.oyente.x = pos.x;
    this.oyente.z = pos.z;
    this.oyente.yaw = yaw;
  }

  _espacio(pos) {
    if (!pos) return { ganancia: 1, pan: 0 };
    const dx = pos.x - this.oyente.x;
    const dz = pos.z - this.oyente.z;
    const dist = Math.hypot(dx, dz);
    if (dist > MAX_DIST) return null;
    const ganancia = Math.pow(1 - dist / MAX_DIST, 1.7);
    const rel = Math.atan2(dx, dz) - (this.oyente.yaw + Math.PI);
    const pan = Math.max(-1, Math.min(1, Math.sin(rel) * -1));
    return { ganancia, pan };
  }

  _salida(pos, volumen) {
    const esp = this._espacio(pos);
    if (!esp) return null;
    const g = this.ctx.createGain();
    g.gain.value = volumen * esp.ganancia;
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = esp.pan;
      g.connect(p);
      p.connect(this.canalEfectos);
    } else {
      g.connect(this.canalEfectos);
    }
    return g;
  }

  _tono(destino, { tipo = 'sine', de, a, dur, ataque = 0.005, pico = 1, curva = 'exp' }) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.setValueAtTime(de, t);
    if (a !== undefined && a !== de) {
      if (curva === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, a), t + dur);
      else osc.frequency.linearRampToValueAtTime(Math.max(1, a), t + dur);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(destino);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _ruidoVoz(destino, { dur, tipoFiltro = 'lowpass', de = 1200, a, Q = 1, pico = 1, ataque = 0.004 }) {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.ruidoBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = tipoFiltro;
    f.Q.value = Q;
    f.frequency.setValueAtTime(de, t);
    if (a !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(40, a), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(destino);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  sonar(nombre, pos, fuerza = 1) {
    if (!this.listo || this.silencio) return;
    const voz = VOCES[nombre];
    if (!voz) return;
    const salida = this._salida(pos, voz.vol === undefined ? 1 : voz.vol);
    if (!salida) return;
    const buf = this.muestras && this.muestras[nombre];
    if (buf) this._tocarMuestra(buf, salida, fuerza);
    else voz.tocar(this, salida, fuerza);
  }

  musica(intensidad) {
    if (!this.listo) return;
    this.intensidad = intensidad;
    if (!this.musicaViva) this._arrancarMusica();
    const t = this.ctx.currentTime;
    this.canalMusica.gain.setTargetAtTime(0.06 + Math.min(0.16, intensidad * 0.02), t, 1.5);
    if (this.filtroDrone) {
      this.filtroDrone.frequency.setTargetAtTime(180 + Math.min(500, intensidad * 60), t, 2);
    }
  }

  callarMusica() {
    if (!this.listo) return;
    this.canalMusica.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8);
  }

  _arrancarMusica() {
    this.musicaViva = true;
    const t = this.ctx.currentTime;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 220;
    filtro.Q.value = 4;
    filtro.connect(this.canalMusica);
    this.filtroDrone = filtro;

    for (const [freq, detune, tipo] of [[55, 0, 'sawtooth'], [55, 7, 'sawtooth'], [82.4, -5, 'triangle'], [110, 4, 'sine']]) {
      const o = this.ctx.createOscillator();
      o.type = tipo;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = 0.22;
      o.connect(g);
      g.connect(filtro);
      o.start(t);
    }

    const golpe = () => {
      if (!this.listo) return;
      const espera = Math.max(0.55, 2.2 - this.intensidad * 0.12);
      if (!this.silencio && this.intensidad > 0) {
        const d = this.ctx.createGain();
        d.gain.value = 0.55;
        d.connect(this.canalMusica);
        this._tono(d, { tipo: 'sine', de: 88, a: 34, dur: 0.34, pico: 0.9 });
        this._ruidoVoz(d, { dur: 0.16, de: 400, a: 90, pico: 0.34 });
      }
      this.tempo = setTimeout(golpe, espera * 1000);
    };
    golpe();
  }
}

const VOCES = {
  tensar: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.26, tipoFiltro: 'bandpass', de: 420, a: 900, Q: 2, pico: 0.95 });
    a._tono(s, { tipo: 'triangle', de: 160, a: 250, dur: 0.24, pico: 0.5 });
  } },
  tenso: { vol: 1, tocar: (a, s) => {
    a._tono(s, { tipo: 'sine', de: 880, a: 1180, dur: 0.14, pico: 0.7 });
    a._tono(s, { tipo: 'triangle', de: 440, a: 590, dur: 0.14, pico: 0.35 });
  } },
  flecha: { vol: 0.9, tocar: (a, s, f) => {
    a._ruidoVoz(s, { dur: 0.09, tipoFiltro: 'highpass', de: 900, pico: 0.75 });
    a._tono(s, { tipo: 'triangle', de: 300 + f * 220, a: 90, dur: 0.16, pico: 0.6 });
    a._ruidoVoz(s, { dur: 0.34, tipoFiltro: 'bandpass', de: 2600, a: 700, Q: 3, pico: 0.22 });
  } },
  carne: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.2, tipoFiltro: 'lowpass', de: 700, a: 160, pico: 0.9 });
    a._tono(s, { tipo: 'sine', de: 130, a: 55, dur: 0.22, pico: 0.7 });
  } },
  piedra: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.13, tipoFiltro: 'bandpass', de: 2200, Q: 0.8, pico: 1 });
    a._tono(s, { tipo: 'square', de: 420, a: 180, dur: 0.08, pico: 0.4 });
  } },
  rugido: { vol: 1, tocar: (a, s) => {
    a._tono(s, { tipo: 'sawtooth', de: 70, a: 46, dur: 0.85, ataque: 0.09, pico: 0.75 });
    a._tono(s, { tipo: 'square', de: 104, a: 62, dur: 0.7, ataque: 0.12, pico: 0.22 });
    a._ruidoVoz(s, { dur: 0.8, tipoFiltro: 'lowpass', de: 900, a: 300, pico: 0.3, ataque: 0.1 });
  } },
  garrote: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.3, tipoFiltro: 'lowpass', de: 1400, a: 120, pico: 0.85 });
    a._tono(s, { tipo: 'sine', de: 150, a: 36, dur: 0.34, pico: 0.9 });
  } },
  muereEnemigo: { vol: 1, tocar: (a, s) => {
    a._tono(s, { tipo: 'sawtooth', de: 190, a: 44, dur: 0.7, ataque: 0.03, pico: 0.7 });
    a._ruidoVoz(s, { dur: 0.6, tipoFiltro: 'lowpass', de: 1100, a: 180, pico: 0.4 });
  } },
  lanza: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.4, tipoFiltro: 'bandpass', de: 900, a: 2400, Q: 1.2, pico: 1 });
    a._tono(s, { tipo: 'triangle', de: 520, a: 1500, dur: 0.3, pico: 0.3 });
  } },
  recoger: { vol: 0.7, tocar: (a, s) => {
    a._tono(s, { tipo: 'triangle', de: 620, a: 930, dur: 0.11, pico: 0.5 });
    a._tono(s, { tipo: 'sine', de: 930, a: 1400, dur: 0.16, ataque: 0.06, pico: 0.35 });
  } },
  comprar: { vol: 0.8, tocar: (a, s) => {
    for (const [f, d, v] of [[880, 0.5, 0.4], [1320, 0.7, 0.25], [1760, 0.9, 0.15]]) {
      a._tono(s, { tipo: 'sine', de: f, a: f * 0.98, dur: d, ataque: 0.01, pico: v });
    }
  } },
  portalAzul: { vol: 0.9, tocar: (a, s) => {
    a._tono(s, { tipo: 'sine', de: 220, a: 1400, dur: 0.4, pico: 0.5 });
    a._ruidoVoz(s, { dur: 0.5, tipoFiltro: 'bandpass', de: 600, a: 3200, Q: 8, pico: 0.4 });
  } },
  portalNaranja: { vol: 0.9, tocar: (a, s) => {
    a._tono(s, { tipo: 'sine', de: 180, a: 980, dur: 0.4, pico: 0.5 });
    a._ruidoVoz(s, { dur: 0.5, tipoFiltro: 'bandpass', de: 450, a: 2200, Q: 8, pico: 0.4 });
  } },
  cruzar: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.45, tipoFiltro: 'bandpass', de: 3000, a: 260, Q: 4, pico: 0.7, ataque: 0.02 });
    a._tono(s, { tipo: 'sine', de: 700, a: 160, dur: 0.4, pico: 0.4 });
  } },
  dano: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.26, tipoFiltro: 'lowpass', de: 900, a: 130, pico: 0.8 });
    a._tono(s, { tipo: 'square', de: 190, a: 70, dur: 0.2, pico: 0.35 });
  } },
  muerte: { vol: 1, tocar: (a, s) => {
    a._tono(s, { tipo: 'sawtooth', de: 220, a: 28, dur: 1.6, ataque: 0.04, pico: 0.7 });
    a._tono(s, { tipo: 'sine', de: 110, a: 22, dur: 1.9, ataque: 0.1, pico: 0.5 });
  } },
  ronda: { vol: 0.9, tocar: (a, s) => {
    for (const [f, v] of [[196, 0.5], [294, 0.3], [392, 0.2], [588, 0.1]]) {
      a._tono(s, { tipo: 'sine', de: f, a: f * 0.99, dur: 2.2, ataque: 0.015, pico: v });
    }
  } },
  vacio: { vol: 0.8, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.06, tipoFiltro: 'highpass', de: 2000, pico: 0.7 });
  } },
  fuego: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.9, tipoFiltro: 'lowpass', de: 2200, a: 200, pico: 0.9, ataque: 0.01 });
    a._tono(s, { tipo: 'sawtooth', de: 120, a: 32, dur: 0.8, pico: 0.5 });
  } },
  rayo: { vol: 1, tocar: (a, s, f) => {
    a._ruidoVoz(s, { dur: 0.5, tipoFiltro: 'highpass', de: 2600 - f * 900, pico: 1, ataque: 0.002 });
    a._tono(s, { tipo: 'sawtooth', de: 900 + f * 700, a: 60, dur: 0.42, pico: 0.8 });
    a._tono(s, { tipo: 'square', de: 140, a: 40, dur: 0.5, pico: 0.4, ataque: 0.01 });
  } },
  tajo: { vol: 1, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.22, tipoFiltro: 'bandpass', de: 3400, a: 700, Q: 1.4, pico: 0.9 });
    a._tono(s, { tipo: 'triangle', de: 640, a: 180, dur: 0.18, pico: 0.4 });
  } },
  fallo: { vol: 0.6, tocar: (a, s) => {
    a._ruidoVoz(s, { dur: 0.16, tipoFiltro: 'highpass', de: 1800, pico: 0.4 });
  } },
  curar: { vol: 0.8, tocar: (a, s) => {
    a._tono(s, { tipo: 'sine', de: 520, a: 780, dur: 0.5, ataque: 0.08, pico: 0.45 });
    a._tono(s, { tipo: 'triangle', de: 780, a: 1040, dur: 0.6, ataque: 0.15, pico: 0.25 });
  } }
};
