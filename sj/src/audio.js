const ESTACIONES = [
  { nombre: 'RADIO APAGADO', tipo: null },
  { nombre: 'JACARANDA ESTÉREO 97.3', tipo: 'cumbia', bpm: 98 },
  { nombre: 'PERLA SYNTH 88.8', tipo: 'synth', bpm: 108 },
  { nombre: 'LA NOCTURNA 104.1', tipo: 'lofi', bpm: 76 }
];

export class Audio {
  constructor(juego) {
    this.juego = juego;
    this.ctx = null;
    this.estacion = 1;
    this.volumen = 0.8;
  }

  iniciar() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.volumen;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(c.destination);
    this.efectos = c.createGain(); this.efectos.gain.value = 0.9; this.efectos.connect(this.master);
    this.musica = c.createGain(); this.musica.gain.value = 0; this.musica.connect(this.master);
    const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.ruido = b;
    this.motorOsc = c.createOscillator(); this.motorOsc.type = 'sawtooth';
    this.motorOsc2 = c.createOscillator(); this.motorOsc2.type = 'square';
    this.motorFiltro = c.createBiquadFilter(); this.motorFiltro.type = 'lowpass'; this.motorFiltro.frequency.value = 400;
    this.motorGain = c.createGain(); this.motorGain.gain.value = 0;
    const g2 = c.createGain(); g2.gain.value = 0.35;
    this.motorOsc.connect(this.motorFiltro); this.motorOsc2.connect(g2); g2.connect(this.motorFiltro);
    this.motorFiltro.connect(this.motorGain); this.motorGain.connect(this.efectos);
    this.motorOsc.start(); this.motorOsc2.start();
    this.sirenaOsc = c.createOscillator(); this.sirenaOsc.type = 'sawtooth'; this.sirenaOsc.frequency.value = 940;
    this.sirenaOsc2 = c.createOscillator(); this.sirenaOsc2.type = 'square'; this.sirenaOsc2.frequency.value = 951;
    this.sirenaMezcla = c.createGain(); this.sirenaMezcla.gain.value = 0.35;
    this.sirenaFiltro = c.createBiquadFilter(); this.sirenaFiltro.type = 'lowpass'; this.sirenaFiltro.frequency.value = 2600; this.sirenaFiltro.Q.value = 0.9;
    this.sirenaBanda = c.createBiquadFilter(); this.sirenaBanda.type = 'peaking'; this.sirenaBanda.frequency.value = 1400; this.sirenaBanda.gain.value = 6;
    this.sirenaLfo = c.createOscillator(); this.sirenaLfo.type = 'triangle'; this.sirenaLfo.frequency.value = 0.3;
    this.sirenaProf = c.createGain(); this.sirenaProf.gain.value = 430;
    this.sirenaLfo.connect(this.sirenaProf); this.sirenaProf.connect(this.sirenaOsc.frequency); this.sirenaProf.connect(this.sirenaOsc2.frequency);
    this.sirenaGain = c.createGain(); this.sirenaGain.gain.value = 0;
    this.sirenaOsc.connect(this.sirenaFiltro); this.sirenaOsc2.connect(this.sirenaMezcla); this.sirenaMezcla.connect(this.sirenaFiltro);
    this.sirenaFiltro.connect(this.sirenaBanda); this.sirenaBanda.connect(this.sirenaGain); this.sirenaGain.connect(this.efectos);
    this.sirenaOsc.start(); this.sirenaOsc2.start(); this.sirenaLfo.start();
    this.sirenaModo = 'wail'; this.sirenaCambio = 0;
    this.ciudadSrc = c.createBufferSource(); this.ciudadSrc.buffer = this.ruido; this.ciudadSrc.loop = true; this.ciudadSrc.playbackRate.value = 0.5;
    this.ciudadFiltro = c.createBiquadFilter(); this.ciudadFiltro.type = 'lowpass'; this.ciudadFiltro.frequency.value = 320;
    this.ciudadGain = c.createGain(); this.ciudadGain.gain.value = 0;
    this.ciudadSrc.connect(this.ciudadFiltro); this.ciudadFiltro.connect(this.ciudadGain); this.ciudadGain.connect(this.efectos); this.ciudadSrc.start();
    this.lluviaSrc = c.createBufferSource(); this.lluviaSrc.buffer = this.ruido; this.lluviaSrc.loop = true;
    const lf = c.createBiquadFilter(); lf.type = 'bandpass'; lf.frequency.value = 2400; lf.Q.value = 0.4;
    this.lluviaGain = c.createGain(); this.lluviaGain.gain.value = 0;
    this.lluviaSrc.connect(lf); lf.connect(this.lluviaGain); this.lluviaGain.connect(this.efectos); this.lluviaSrc.start();
    this.ambSrc = c.createBufferSource(); this.ambSrc.buffer = this.ruido; this.ambSrc.loop = true;
    const af = c.createBiquadFilter(); af.type = 'lowpass'; af.frequency.value = 300;
    this.ambGain = c.createGain(); this.ambGain.gain.value = 0.05;
    this.ambSrc.connect(af); af.connect(this.ambGain); this.ambGain.connect(this.efectos); this.ambSrc.start();
    this.derSrc = c.createBufferSource(); this.derSrc.buffer = this.ruido; this.derSrc.loop = true;
    const df = c.createBiquadFilter(); df.type = 'bandpass'; df.frequency.value = 1800; df.Q.value = 6;
    this.derGain = c.createGain(); this.derGain.gain.value = 0;
    this.derSrc.connect(df); df.connect(this.derGain); this.derGain.connect(this.efectos); this.derSrc.start();
    this.master.gain.value = this.volumen;
    this.paso16 = 0; this.siguiente = c.currentTime + 0.1;
    this.reloj = setInterval(() => this.programar(), 40);
  }

  dist(p) {
    if (!p) return 1;
    const j = this.juego.jugador.posicion;
    const d = Math.hypot(p.x - j.x, p.z - j.z);
    return Math.max(0, 1 - d / 160) ** 1.6;
  }

  ruidoCorto(dur, frec, vol, tipo = 'lowpass', q = 0.8, destino) {
    const c = this.ctx; if (!c || vol <= 0.001) return;
    const s = c.createBufferSource(); s.buffer = this.ruido;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(); f.type = tipo; f.frequency.value = frec; f.Q.value = q;
    const g = c.createGain(); const t = c.currentTime;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(destino || this.efectos);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  tono(frec, dur, vol, tipo = 'square', destino, cuando, deslizar) {
    const c = this.ctx; if (!c || !(vol > 0.0005)) return;
    const o = c.createOscillator(); o.type = tipo;
    const g = c.createGain(); const t = cuando || c.currentTime;
    o.frequency.setValueAtTime(frec, t);
    if (deslizar) o.frequency.exponentialRampToValueAtTime(deslizar, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(destino || this.efectos);
    o.start(t); o.stop(t + dur + 0.05);
  }

  disparo(arma, p) {
    const v = this.dist(p);
    if (arma === 'silenciado') { this.ruidoCorto(0.07, 2400, 0.22 * v, 'bandpass', 0.8); this.tono(260, 0.05, 0.07 * v, 'triangle', null, null, 120); return; }
    if (arma === 'recortada' || arma === 'escopetaAuto') arma = 'escopeta';
    if (arma === 'pistolaOro') { this.ruidoCorto(0.2, 1500, 0.7 * v); this.tono(220, 0.1, 0.35 * v, 'square', null, null, 70); this.tono(1800, 0.25, 0.04 * v, 'sine'); return; }
    if (arma === 'ballesta') { this.tono(180, 0.16, 0.22 * v, 'triangle', null, null, 90); this.ruidoCorto(0.08, 2200, 0.12 * v, 'bandpass'); return; }
    if (arma === 'taser') { this.tono(2400, 0.35, 0.08 * v, 'sawtooth', null, null, 1900); this.ruidoCorto(0.35, 4000, 0.18 * v, 'highpass'); return; }
    if (arma === 'ametralladora') arma = 'subfusil';
    if (arma === 'francotirador') { this.ruidoCorto(0.35, 1100, 0.9 * v); this.tono(70, 0.35, 0.6 * v, 'sine', null, null, 30); this.ruidoCorto(0.5, 400, 0.25 * v, 'lowpass', 0.4); return; }
    if (arma === 'revolver') { this.ruidoCorto(0.3, 1000, 0.85 * v); this.tono(110, 0.18, 0.5 * v, 'square', null, null, 40); return; }
    if (arma === 'lanzacohetes') { this.ruidoCorto(0.6, 700, 0.7 * v, 'bandpass', 0.5); this.tono(200, 0.5, 0.2 * v, 'sawtooth', null, null, 90); return; }
    if (arma === 'escopeta') { this.ruidoCorto(0.45, 900, 1.0 * v); this.tono(80, 0.25, 0.6 * v, 'sine', null, null, 35); this.ruidoCorto(0.12, 3000, 0.4 * v, 'highpass'); }
    else if (arma === 'rifle') { this.ruidoCorto(0.16, 1500, 0.65 * v); this.tono(120, 0.1, 0.35 * v, 'square', null, null, 50); }
    else if (arma === 'subfusil') { this.ruidoCorto(0.12, 1800, 0.5 * v); this.tono(140, 0.08, 0.3 * v, 'square', null, null, 60); }
    else if (arma === 'heli') { this.ruidoCorto(0.1, 1400, 0.4 * v); }
    else { this.ruidoCorto(0.22, 1300, 0.7 * v); this.tono(170, 0.12, 0.4 * v, 'square', null, null, 50); }
  }
  golpe(fuerte = true) { if (!fuerte) { this.ruidoCorto(0.12, 2500, 0.15, 'bandpass'); return; } this.ruidoCorto(0.09, 600, 0.5); this.tono(90, 0.08, 0.3, 'sine'); }
  nitro() { this.ruidoCorto(0.8, 500, 0.5, 'bandpass', 0.6); this.tono(180, 0.6, 0.15, 'sawtooth', null, null, 420); }
  salto() { }
  ui(f = 660) { this.tono(f, 0.05, 0.08, 'sine'); }
  compra() { const t = this.ctx?.currentTime || 0; [880, 1320, 1760].forEach((f, i) => this.tono(f, 0.1, 0.12, 'triangle', null, t + i * 0.06)); }
  explosion(p) { const v = this.dist(p); this.ruidoCorto(1.6, 380, 1.2 * v); this.tono(60, 1.0, 0.7 * v, 'sine', null, null, 25); }
  choque(f, p) {
    const v = this.dist(p) * Math.min(1, f / 15);
    this.ruidoCorto(0.3, 700, 0.8 * v, 'lowpass');
    this.tono(70 + Math.random() * 30, 0.2, 0.4 * v, 'triangle');
  }
  claxon() { this.tono(392, 0.35, 0.18, 'sawtooth'); this.tono(494, 0.35, 0.14, 'sawtooth'); }
  recarga() { const t = this.ctx?.currentTime || 0; this.tono(1600, 0.03, 0.15, 'square', null, t); this.tono(1200, 0.03, 0.15, 'square', null, t + 0.5); }
  dinero() { const t = this.ctx?.currentTime || 0; this.tono(1320, 0.08, 0.15, 'square', null, t); this.tono(1760, 0.14, 0.15, 'square', null, t + 0.07); }
  alerta() { const t = this.ctx?.currentTime || 0; this.tono(880, 0.12, 0.12, 'square', null, t); this.tono(660, 0.18, 0.12, 'square', null, t + 0.12); }
  ladrido(p, herido) { const v = this.dist(p); const t = this.ctx?.currentTime || 0; if (herido) { this.tono(900, 0.4, 0.25 * v, 'sawtooth', null, t, 500); return; } for (const k of [0, 0.18]) { this.tono(520, 0.09, 0.22 * v, 'sawtooth', null, t + k, 300); this.ruidoCorto(0.08, 900, 0.15 * v); } }
  aleteo() { for (let k = 0; k < 4; k++) setTimeout(() => this.ruidoCorto(0.05, 1200, 0.08, 'bandpass'), k * 60); }
  puerta() { this.ruidoCorto(0.15, 400, 0.3); this.tono(180, 0.12, 0.12, 'triangle'); }
  obturador() { this.ruidoCorto(0.04, 4000, 0.4, 'highpass'); setTimeout(() => this.ruidoCorto(0.05, 3000, 0.3, 'highpass'), 70); }
  notif() { const t = this.ctx?.currentTime || 0; this.tono(1175, 0.08, 0.1, 'sine', null, t); this.tono(1568, 0.12, 0.1, 'sine', null, t + 0.09); }
  grito(p) { const v = this.dist(p) * 0.6; const f = 500 + Math.random() * 400; this.tono(f, 0.35, 0.12 * v, 'sawtooth', null, null, f * 1.4); }
  desenfundar(arma) { if (arma === 'puno') return; const t = this.ctx?.currentTime || 0; this.ruidoCorto(0.08, 2500, 0.12, 'bandpass'); this.tono(arma === 'bate' ? 200 : 1400, 0.04, 0.06, 'square', null, t + 0.12); }
  trueno() { this.ruidoCorto(3, 160, 0.9); }
  mision(bien = true) {
    const c = this.ctx; if (!c) return; const t = c.currentTime;
    const notas = bien ? [523, 659, 784, 1047] : [392, 330, 262];
    notas.forEach((f, i) => { this.tono(f, 0.35, 0.18, 'triangle', null, t + i * 0.14); this.tono(f / 2, 0.35, 0.12, 'square', null, t + i * 0.14); });
  }

  motor(rpm, encendido) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.motorOsc.frequency.setTargetAtTime(38 + rpm * 120, t, 0.05);
    this.motorOsc2.frequency.setTargetAtTime(19 + rpm * 60, t, 0.05);
    this.motorFiltro.frequency.setTargetAtTime(300 + rpm * 1400, t, 0.05);
    this.motorGain.gain.setTargetAtTime(encendido ? 0.07 + rpm * 0.08 : 0, t, 0.1);
  }

  sirena(nivel, atenuar = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (t > this.sirenaCambio) {
      this.sirenaModo = this.sirenaModo === 'wail' ? 'yelp' : 'wail';
      this.sirenaCambio = t + (this.sirenaModo === 'wail' ? 6 + Math.random() * 3 : 2.5 + Math.random() * 1.5);
      const yelp = this.sirenaModo === 'yelp';
      this.sirenaLfo.frequency.setTargetAtTime(yelp ? 3.4 : 0.3, t, 0.08);
      this.sirenaProf.gain.setTargetAtTime(yelp ? 320 : 430, t, 0.08);
      this.sirenaOsc.frequency.setTargetAtTime(yelp ? 1020 : 940, t, 0.08);
      this.sirenaOsc2.frequency.setTargetAtTime(yelp ? 1031 : 951, t, 0.08);
    }
    this.sirenaFiltro.frequency.setTargetAtTime(1400 + nivel * 1800, t, 0.2);
    this.sirenaGain.gain.setTargetAtTime(nivel * 0.055 * atenuar, t, 0.15);
  }

  derrape(n) { if (this.ctx) this.derGain.gain.setTargetAtTime(n * 0.09, this.ctx.currentTime, 0.06); }
  ambiente(noche, ciudad, lluvia, dentro) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime;
    this.ciudadGain.gain.setTargetAtTime(dentro ? 0.01 : (0.045 * ciudad + 0.012) * (1 - noche * 0.45), t, 0.8);
    if (dentro || lluvia > 0.5) return;
    this.relojAmb = (this.relojAmb || 0) - 1;
    if (t < (this.proxAve || 0)) return;
    if (noche < 0.5) {
      this.proxAve = t + 1.5 + Math.random() * 4;
      const f = 2600 + Math.random() * 1800, n = 2 + (Math.random() * 4 | 0);
      for (let k = 0; k < n; k++) this.tono(f + (Math.random() - 0.5) * 600, 0.07 + Math.random() * 0.05, 0.012 + Math.random() * 0.012, 'sine', undefined, t + k * (0.09 + Math.random() * 0.06), f * (0.8 + Math.random() * 0.5));
    } else {
      this.proxAve = t + 0.35 + Math.random() * 0.5;
      const f = 4200 + Math.random() * 500;
      for (let k = 0; k < 3; k++) this.tono(f, 0.035, 0.006 + Math.random() * 0.005, 'triangle', undefined, t + k * 0.06);
    }
  }

  paso(fuerza, superficie) {
    if (!this.ctx) return;
    const f = superficie === 'pasto' ? 700 : superficie === 'madera' ? 1100 : 1800;
    this.ruidoCorto(0.05 + fuerza * 0.03, f, 0.05 + fuerza * 0.07, 'bandpass', superficie === 'pasto' ? 0.5 : 1.4);
    this.tono(90 + Math.random() * 30, 0.05, 0.03 * fuerza, 'sine');
  }

  radioPolicia(vol) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime;
    this.tono(1200, 0.08, 0.05 * vol, 'square', undefined, t);
    this.ruidoCorto(0.9, 1800, 0.035 * vol, 'bandpass', 2.5);
    const n = 5 + (Math.random() * 6 | 0);
    for (let k = 0; k < n; k++) this.tono(180 + Math.random() * 140, 0.08 + Math.random() * 0.08, 0.03 * vol, 'sawtooth', undefined, t + 0.12 + k * 0.13, 150 + Math.random() * 120);
    this.tono(1200, 0.06, 0.05 * vol, 'square', undefined, t + 0.25 + n * 0.13);
  }

  antro(on) {
    const c = this.ctx; if (!c) return;
    if (!on) { this.antroSig = 0; return; }
    const ahora = c.currentTime, paso = 60 / 124 / 4;
    if (!this.antroSig || this.antroSig < ahora - 0.5) { this.antroSig = ahora + 0.05; this.antroN = 0; }
    const BAJO = [41, 41, 53, 41, 44, 44, 56, 44, 39, 39, 51, 39, 46, 46, 58, 46], hz = n => 440 * Math.pow(2, (n - 69) / 12), v = 0.5 * (this.volMusica ?? 0.7);
    while (this.antroSig < ahora + 0.25) {
      const n = this.antroN, t = this.antroSig;
      if (n % 4 === 0) { this.tono(140, 0.18, 0.5 * v, 'sine', undefined, t, 45); }
      if (n % 4 === 2) this.ruidoCorto(0.04, 9000, 0.08 * v, 'highpass');
      if (n % 8 === 4) this.ruidoCorto(0.12, 1800, 0.12 * v, 'bandpass', 0.6);
      if (n % 2 === 1) { this.tono(hz(BAJO[(n >> 2) % BAJO.length]), paso * 0.9, 0.16 * v, 'sawtooth', undefined, t); }
      if (n % 16 === 0 || n % 16 === 6 || n % 16 === 10) for (const d of [0, 3, 7]) this.tono(hz(65 + d + ((n >> 4) % 2) * 2), paso * 1.6, 0.05 * v, 'square', undefined, t);
      this.antroSig += paso; this.antroN++;
    }
  }

  lluvia(n) { if (this.ctx) this.lluviaGain.gain.setTargetAtTime(n * 0.12, this.ctx.currentTime, 0.5); }

  cambiarEstacion(paso) {
    this.estacion = (this.estacion + paso + ESTACIONES.length) % ESTACIONES.length;
    return ESTACIONES[this.estacion].nombre;
  }
  get nombreEstacion() { return ESTACIONES[this.estacion].nombre; }

  radioActiva(si) {
    if (!this.ctx) return;
    const on = si && ESTACIONES[this.estacion].tipo;
    this.musica.gain.setTargetAtTime(on ? 0.6 * (this.volMusica ?? 0.7) : 0, this.ctx.currentTime, 0.3);
  }

  programar() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const e = ESTACIONES[this.estacion];
    const bpm = e.bpm || 100, dur = 60 / bpm / 4;
    while (this.siguiente < c.currentTime + 0.15) {
      if (e.tipo && this.musica.gain.value > 0.01) this.nota(e.tipo, this.paso16, this.siguiente, dur);
      this.siguiente += dur;
      this.paso16 = (this.paso16 + 1) % 256;
    }
  }

  nota(tipo, p, t, dur) {
    const M = this.musica;
    const s16 = p % 16, compas = (p / 16 | 0) % 8;
    const golpeBombo = (f, v) => this.tono(f, 0.22, v, 'sine', M, t, 40);
    const caja = v => { const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.ruido; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500; const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14); s.connect(f); f.connect(g); g.connect(M); s.start(t, Math.random()); s.stop(t + 0.2); };
    const hat = v => { const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.ruido; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); s.connect(f); f.connect(g); g.connect(M); s.start(t, Math.random()); s.stop(t + 0.06); };
    const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
    if (tipo === 'cumbia') {
      const prog = [[57, 60, 64], [62, 65, 69], [64, 68, 71], [57, 60, 64], [55, 59, 62], [60, 64, 67], [64, 68, 71], [57, 60, 64]];
      const ac = prog[compas];
      if (s16 % 8 === 0) golpeBombo(90, 0.5);
      if (s16 % 4 === 2) caja(0.12);
      if (s16 % 2 === 1) hat(0.06);
      if (s16 === 0 || s16 === 6 || s16 === 8 || s16 === 14) this.tono(mtof(ac[0] - 24 + (s16 >= 8 ? 7 : 0)), dur * 1.8, 0.22, 'triangle', M, t);
      if (s16 % 4 === 2) for (const n of ac) this.tono(mtof(n), dur * 0.9, 0.035, 'square', M, t);
      const mel = [0, -1, 2, -1, 1, -1, 2, 0, 1, -1, 2, -1, 0, 1, 2, -1];
      const idx = mel[(s16 + compas * 3) % 16];
      if (idx >= 0 && (p * 7 + compas) % 5 !== 0) this.tono(mtof(ac[idx] + 12), dur * 1.6, 0.06, 'sawtooth', M, t);
    } else if (tipo === 'synth') {
      const raices = [45, 41, 48, 43];
      const r = raices[(compas / 2 | 0) % 4];
      if (s16 % 4 === 0) golpeBombo(110, 0.6);
      if (s16 === 4 || s16 === 12) caja(0.2);
      if (s16 % 2 === 0) hat(0.05);
      this.tono(mtof(r - 12), dur * 0.9, 0.16, 'sawtooth', M, t);
      const arp = [0, 7, 12, 15, 19, 15, 12, 7];
      this.tono(mtof(r + 24 + arp[s16 % 8]), dur * 0.8, 0.045, 'square', M, t);
      if (s16 === 0) for (const n of [12, 15, 19]) this.tono(mtof(r + n + 12), dur * 15, 0.025, 'sawtooth', M, t);
    } else if (tipo === 'lofi') {
      const acordes = [[50, 53, 57, 60], [55, 58, 62, 65], [48, 52, 55, 59], [53, 57, 60, 64]];
      const ac = acordes[(compas / 2 | 0) % 4];
      if (s16 === 0 || s16 === 10) golpeBombo(70, 0.45);
      if (s16 === 8) caja(0.1);
      if (s16 % 4 === 2) hat(0.03);
      if (s16 === 0) for (const n of ac) this.tono(mtof(n), dur * 14, 0.03, 'triangle', M, t + Math.random() * 0.02);
      if (s16 === 0) this.tono(mtof(ac[0] - 12), dur * 6, 0.2, 'sine', M, t);
      if ((s16 === 6 || s16 === 11) && Math.random() < 0.7) this.tono(mtof(ac[(Math.random() * 4) | 0] + 12), dur * 3, 0.04, 'sine', M, t);
    }
  }
}
