(() => {
  const WA = "525659062267";
  const ICONO_WA = '<svg class="ico-wa" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  document.querySelectorAll("[data-wa]").forEach(a => {
    a.querySelectorAll("svg").forEach(s => s.remove());
    a.insertAdjacentHTML("afterbegin", ICONO_WA);
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(a.dataset.wa);
    a.target = "_blank";
    a.rel = "noopener";
  });

  const nav = document.getElementById("nav");
  const pintarNav = () => nav.classList.toggle("solida", scrollY > 30);
  addEventListener("scroll", pintarNav, {passive: true});
  pintarNav();

  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const D = window.MANDALA || {fotos: [], resenas: [], articulos: []};

  const fotos = document.getElementById("fotos");
  fotos.innerHTML = D.fotos.map(f => `<figure class="anim"><a href="https://www.instagram.com/consultorio_mandala/" target="_blank" rel="noopener"><img src="${esc(f.src)}" alt="${esc(f.alt)}" loading="lazy"></a></figure>`).join("");
  if (!D.fotos.length) document.getElementById("frases").remove();

  const car = document.getElementById("carrusel");
  const tarjeta = r => `<article class="resena"><span class="estrellas">★★★★★</span><p>“${esc(r.texto)}”</p><span class="quien">${esc(r.nombre)}</span></article>`;
  car.innerHTML = D.resenas.map(tarjeta).join("") + D.resenas.map(tarjeta).join("");

  document.getElementById("articulos").innerHTML = D.articulos.map(a => `
    <a class="articulo anim" href="${esc(a.link)}" target="_blank" rel="noopener">
      <span class="etiqueta">${esc(a.tema)}</span>
      <h3>${esc(a.titulo)}</h3>
      <p>${esc(a.extracto)}</p>
      <span class="leer">Leer artículo →</span>
    </a>`).join("");

  let pausa = false, reanudar;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const detener = () => { pausa = true; clearTimeout(reanudar); };
  const soltar = () => { clearTimeout(reanudar); reanudar = setTimeout(() => pausa = false, 2500); };
  let x0 = 0, s0 = 0, arrastra = false;
  car.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; arrastra = true; x0 = e.clientX; s0 = car.scrollLeft; car.classList.add("arrastrando"); detener(); });
  addEventListener("pointermove", e => { if (arrastra) car.scrollLeft = s0 - (e.clientX - x0); });
  addEventListener("pointerup", () => { if (arrastra) { arrastra = false; car.classList.remove("arrastrando"); soltar(); } });
  car.addEventListener("touchstart", detener, {passive: true});
  car.addEventListener("touchend", soltar, {passive: true});
  car.addEventListener("wheel", () => { detener(); soltar(); }, {passive: true});
  let acumulado = 0, previo = performance.now();
  const avanzar = t => {
    const dt = Math.min(t - previo, 60); previo = t;
    if (!pausa && !quieto && car.scrollWidth > car.clientWidth) {
      acumulado += dt * 0.035;
      if (acumulado >= 1) { const p = Math.floor(acumulado); acumulado -= p; car.scrollLeft += p; }
      const mitad = car.scrollWidth / 2;
      if (car.scrollLeft >= mitad) car.scrollLeft -= mitad;
    }
    requestAnimationFrame(avanzar);
  };
  requestAnimationFrame(avanzar);

  const animados = [...document.querySelectorAll(".anim")];
  if (window.gsap && !quieto && "IntersectionObserver" in window) {
    gsap.from(".anim-hero", {opacity: 0, y: 26, duration: 1, stagger: .14, ease: "power3.out", clearProps: "all"});
    gsap.set(animados, {opacity: 0, y: 34});
    const io = new IntersectionObserver(entradas => {
      const visibles = entradas.filter(e => e.isIntersecting).map(e => e.target);
      if (!visibles.length) return;
      visibles.forEach(el => io.unobserve(el));
      gsap.to(visibles, {opacity: 1, y: 0, duration: .9, stagger: .1, ease: "power3.out", clearProps: "transform"});
    }, {rootMargin: "0px 0px -8% 0px"});
    animados.forEach(el => io.observe(el));
    setTimeout(() => gsap.to(animados.filter(el => getComputedStyle(el).opacity === "0" && el.getBoundingClientRect().top < innerHeight), {opacity: 1, y: 0, duration: .5}), 2500);
    addEventListener("load", () => setTimeout(() => animados.forEach(el => { if (getComputedStyle(el).opacity === "0" && el.getBoundingClientRect().top < innerHeight) gsap.to(el, {opacity: 1, y: 0, duration: .4}); }), 3000));
  }
})();
