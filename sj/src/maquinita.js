const TEMAS = {
  marcianos: { titulo: 'MARCIANOS DEL NOPAL', c1: '#3fd2ff', c2: '#ff4fd8', fondo: '#05060f', texto: 'Dispara cuando la nave esté en la mira' },
  carrerita: { titulo: 'CARRERITA JACARANDA', c1: '#ffd23a', c2: '#ff5a3a', fondo: '#0b0f0a', texto: 'Mete el turbo justo en la zona verde' },
  pelea: { titulo: 'LUCHA EN PIXELES', c1: '#ff3b3b', c2: '#ffd23a', fondo: '#120608', texto: 'Suelta el golpe cuando el rival baje la guardia' }
};

export function jugarMaquinita(juego, tipo, alTerminar) {
  const T = TEMAS[tipo] || TEMAS.marcianos, RONDAS = 6;
  const caja = document.createElement('div');
  caja.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);font-family:Inter,Arial,sans-serif';
  const cv = document.createElement('canvas'); cv.width = 520; cv.height = 360;
  cv.style.cssText = `width:min(92vw,620px);border-radius:18px;border:3px solid ${T.c1};box-shadow:0 0 40px ${T.c1}66`;
  caja.appendChild(cv); document.body.appendChild(caja);
  const x = cv.getContext('2d');
  let ronda = 0, aciertos = 0, t = 0, centro = 0.3 + Math.random() * 0.4, ancho = 0.16, msg = '', msgT = 0, fin = false, finT = 0, ult = performance.now(), anim = 0;
  const estrellas = Array.from({ length: 60 }, () => [Math.random() * 520, Math.random() * 360, Math.random() * 1.5 + 0.5]);
  const antesPausa = juego.pausado, antesOverlay = juego.overlay;
  juego.pausado = true; juego.overlay = 'maquinita';
  const pos = () => (Math.sin(t * (1.6 + ronda * 0.55)) + 1) / 2;
  const tecla = e => {
    if (!['Space', 'Enter', 'KeyE', 'Escape'].includes(e.code)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (e.type !== 'keydown' || e.repeat) return;
    if (e.code === 'Escape') { cerrar(); return; }
    if (fin) { if (finT > 0.6) cerrar(); return; }
    const p = pos(), bien = Math.abs(p - centro) < ancho / 2;
    if (bien) { aciertos++; msg = '¡BIEN!'; juego.audio?.tono?.(1040, 0.12, 0.12, 'square'); } else { msg = 'FALLASTE'; juego.audio?.tono?.(180, 0.2, 0.12, 'sawtooth'); }
    msgT = 0.7; ronda++; centro = 0.15 + Math.random() * 0.7; ancho = Math.max(0.07, 0.16 - ronda * 0.015);
    if (ronda >= RONDAS) { fin = true; finT = 0; }
  };
  window.addEventListener('keydown', tecla, true); window.addEventListener('keyup', tecla, true);
  const premio = () => aciertos * 15 + (aciertos === RONDAS ? 120 : 0);
  function cerrar() {
    if (!caja.parentNode) return;
    cancelAnimationFrame(anim);
    window.removeEventListener('keydown', tecla, true); window.removeEventListener('keyup', tecla, true);
    caja.remove(); juego.pausado = antesPausa; juego.overlay = antesOverlay || null;
    alTerminar?.(fin ? aciertos : -1, fin ? premio() : 0);
  }
  function dibujar() {
    const ahora = performance.now(), dt = Math.min(0.05, (ahora - ult) / 1000); ult = ahora; t += dt; msgT -= dt; if (fin) finT += dt;
    x.fillStyle = T.fondo; x.fillRect(0, 0, 520, 360);
    for (const s of estrellas) { s[1] += s[2] * (tipo === 'carrerita' ? 3 : 0.4); if (s[1] > 360) s[1] = 0; x.fillStyle = tipo === 'carrerita' ? '#2a2a2a' : '#ffffff'; x.fillRect(s[0], s[1], s[2] * (tipo === 'carrerita' ? 3 : 1), s[2] * (tipo === 'carrerita' ? 10 : 1)); }
    if (tipo === 'carrerita') { x.fillStyle = '#ffffff'; for (let k = 0; k < 8; k++) x.fillRect(256, ((k * 50 + t * 300) % 400) - 40, 8, 26); }
    if (tipo === 'pelea') { x.strokeStyle = '#c8202e'; x.lineWidth = 3; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(30, 150 + k * 22); x.lineTo(490, 150 + k * 22); x.stroke(); } }
    x.fillStyle = T.c1; x.font = '900 26px Inter, Arial'; x.textAlign = 'center'; x.fillText(T.titulo, 260, 44);
    x.fillStyle = '#cfd6e4'; x.font = '600 14px Inter, Arial'; x.fillText(T.texto, 260, 70);
    x.fillStyle = '#ffffff'; x.font = '800 16px Inter, Arial'; x.fillText(`Ronda ${Math.min(ronda + 1, RONDAS)} de ${RONDAS}   ·   Aciertos ${aciertos}`, 260, 330);
    const bx = 60, by = 220, bw = 400;
    x.fillStyle = '#1a1e2a'; x.fillRect(bx, by, bw, 26);
    x.fillStyle = '#2fdc7a'; x.fillRect(bx + (centro - ancho / 2) * bw, by, ancho * bw, 26);
    const p = fin ? centro : pos(), px = bx + p * bw;
    if (tipo === 'marcianos') { x.fillStyle = T.c2; x.beginPath(); x.moveTo(px, by - 40); x.lineTo(px - 18, by - 12); x.lineTo(px + 18, by - 12); x.fill(); for (let k = 0; k < 6; k++) { x.fillStyle = T.c1; x.fillRect(90 + k * 62 + Math.sin(t * 2) * 20, 100 + (k % 2) * 18, 26, 16); } }
    else if (tipo === 'carrerita') { x.fillStyle = T.c2; x.fillRect(px - 14, by - 48, 28, 40); x.fillStyle = '#111'; x.fillRect(px - 18, by - 44, 6, 12); x.fillRect(px + 12, by - 44, 6, 12); x.fillRect(px - 18, by - 22, 6, 12); x.fillRect(px + 12, by - 22, 6, 12); }
    else { x.fillStyle = T.c1; x.fillRect(px - 12, by - 70, 24, 56); x.fillStyle = '#f2d2b0'; x.beginPath(); x.arc(px, by - 80, 12, 0, 6.3); x.fill(); x.fillStyle = '#2a5ab8'; x.fillRect(250 + Math.sin(t * 3) * 120 - 12, 92, 24, 50); }
    x.fillStyle = '#ffffff'; x.fillRect(px - 2, by - 4, 4, 34);
    if (msgT > 0) { x.fillStyle = msg === '¡BIEN!' ? '#2fdc7a' : '#ff3b5a'; x.font = '900 34px Inter, Arial'; x.fillText(msg, 260, 180); }
    if (fin) { x.fillStyle = 'rgba(0,0,0,0.75)'; x.fillRect(60, 110, 400, 150); x.fillStyle = T.c1; x.font = '900 30px Inter, Arial'; x.fillText(aciertos === RONDAS ? '¡PERFECTO!' : 'FIN DEL JUEGO', 260, 160); x.fillStyle = '#ffffff'; x.font = '700 18px Inter, Arial'; x.fillText(`${aciertos} de ${RONDAS} · premio $${premio()}`, 260, 196); x.fillStyle = '#cfd6e4'; x.font = '600 14px Inter, Arial'; x.fillText('Espacio para salir', 260, 232); }
    else { x.fillStyle = '#8a93a8'; x.font = '600 12px Inter, Arial'; x.fillText('Espacio o E para atinarle · Esc para salir', 260, 356); }
    anim = requestAnimationFrame(dibujar);
  }
  dibujar();
  return { cerrar, estado: () => ({ ronda, aciertos, fin }) };
}
