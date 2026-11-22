import * as THREE from 'three';

const suave = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

export class Intro {
  constructor(juego) { this.j = juego; this.activa = false; }

  empezar() {
    if (navigator.webdriver) return false;
    const j = this.j, L = j.ciudad.lugares, jp = j.jugador.pos, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const lago = L.lago || L.plaza, cat = L.catedral || L.plaza, pla = L.plaza || cat;
    this.ruta = new THREE.CatmullRomCurve3([V(lago.x + 190, 150, lago.z + 230), V(cat.x + 90, 85, cat.z + 120), V(pla.x + 38, 34, pla.z + 30), V(jp.x + 26, 14, jp.z + 22), V(jp.x + 6, 3.2, jp.z + 7)]);
    this.mira = new THREE.CatmullRomCurve3([V(cat.x, 10, cat.z), V(pla.x, 6, pla.z), V(pla.x, 3, pla.z), V(jp.x, 2, jp.z), V(jp.x, 1.4, jp.z)]);
    this.t = 0; this.t0 = performance.now(); this.dur = 10; this.activa = true;
    const d = document.createElement('div'); d.id = 'intro';
    d.innerHTML = '<div class="t">SANTA JACARANDA</div><div class="s">Una ciudad que nunca duerme</div><div class="k">Cualquier tecla para saltar</div>';
    const est = document.createElement('style'); est.textContent = '#intro{position:fixed;inset:0;z-index:50;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:12vh;background:linear-gradient(transparent 55%,rgba(0,0,0,.55));opacity:0;transition:opacity 1.2s;font-family:Inter,Arial,sans-serif;color:#fff;text-align:center}#intro.on{opacity:1}#intro .t{font-weight:900;font-size:clamp(34px,7vw,86px);letter-spacing:.08em;text-shadow:0 6px 30px rgba(0,0,0,.6)}#intro .s{font-size:clamp(14px,2vw,22px);opacity:.85;margin-top:6px;letter-spacing:.2em;text-transform:uppercase}#intro .k{position:absolute;bottom:22px;right:26px;font-size:13px;opacity:.6}body.intro #hud,body.intro #banner,body.intro #notifs{opacity:0;transition:opacity .6s}';
    document.head.appendChild(est); document.body.appendChild(d); this.caja = d; this.estilo = est;
    requestAnimationFrame(() => d.classList.add('on'));
    document.body.classList.add('intro');
    this.saltar = () => this.terminar();
    setTimeout(() => { if (this.activa) { window.addEventListener('keydown', this.saltar, { once: true }); window.addEventListener('mousedown', this.saltar, { once: true }); } }, 400);
    const a = j.audio; if (a?.ctx) { const t0 = a.ctx.currentTime + 0.2; [[196, 0], [261.63, 0.5], [329.63, 1], [392, 1.5], [523.25, 2.2]].forEach(([f, dt]) => { a.tono(f, 2.6, 0.06, 'triangle', null, t0 + dt); a.tono(f * 2, 1.4, 0.02, 'sine', null, t0 + dt); }); }
    return true;
  }

  camara(cam, dt) {
    this.t = (performance.now() - this.t0) / 1000;
    const u = Math.min(1, this.t / this.dur), e = suave(u);
    cam.position.copy(this.ruta.getPointAt(e)); cam.lookAt(this.mira.getPointAt(e));
    if (cam.fov !== 55) { cam.fov = 55; cam.updateProjectionMatrix(); }
    if (u > 0.82 && this.caja) this.caja.classList.remove('on');
    if (u >= 1) this.terminar();
  }

  terminar() {
    if (!this.activa) return;
    this.activa = false;
    window.removeEventListener('keydown', this.saltar); window.removeEventListener('mousedown', this.saltar);
    document.body.classList.remove('intro');
    const d = this.caja; if (d) { d.classList.remove('on'); setTimeout(() => { d.remove(); this.estilo?.remove(); }, 1300); }
    this.j.hud.notificar('info', 'Santa Jacaranda', 'Bienvenido. Abre las <b>Novedades</b> del menú para ver lo nuevo.', 4);
  }
}
