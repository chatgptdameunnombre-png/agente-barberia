(function(){
  const d = new Date().getDay();
  const k = d >= 1 && d <= 5 ? '1' : String(d);
  document.querySelectorAll('#horas [data-d="' + k + '"]').forEach(e => e.classList.add('hoy'));

  const WA = 'https://wa.me/' + document.body.dataset.wa;
  const sel = new Set();
  const caja = document.getElementById('carrito');
  const nEl = document.getElementById('c-n');
  const go = document.getElementById('c-go');
  function render(){
    const n = sel.size;
    nEl.textContent = n === 1 ? '1 servicio' : n + ' servicios';
    caja.classList.toggle('ver', n > 0);
    const names = [...sel];
    const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1] : names[0];
    go.href = WA + '?text=' + encodeURIComponent(n ? 'Hola, me gustaría agendar una cita para ' + list + '.' : 'Hola, me gustaría agendar una cita.');
  }
  document.querySelectorAll('.item').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.name;
    if (sel.has(name)) { sel.delete(name); b.classList.remove('sel'); }
    else { sel.add(name); b.classList.add('sel'); }
    render();
  }));
  render();

  document.querySelectorAll('.pista').forEach(p => p.innerHTML += p.innerHTML);

  const vids = [...document.querySelectorAll('video')];
  function revisaVideos(){
    const vh = window.innerHeight || 800;
    vids.forEach(v => {
      const r = v.getBoundingClientRect();
      if (!r.height) return;
      const visible = r.top < vh * 0.9 && r.bottom > vh * 0.1;
      if (visible && v.paused) { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else if (!visible && !v.paused) v.pause();
    });
  }
  window.addEventListener('scroll', revisaVideos, {passive:true});
  setInterval(revisaVideos, 1000);
  revisaVideos();

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('[data-h]', {opacity:0, y:30, duration:1, ease:'power3.out', stagger:.12});
  gsap.utils.toArray('[data-r]').forEach((el, i) => {
    gsap.from(el, {opacity:0, y:36, duration:.9, ease:'power2.out', delay:(i % 3) * .08, scrollTrigger:{trigger:el, start:'top 88%', once:true}});
  });
})();
