const HASTA = new Date("2026-12-08T00:00:00-06:00");
const KEY = "dm_promo_vista";

function mostrar() {
  const m = document.createElement("div");
  m.className = "aviso-modal promo-abre";
  m.innerHTML = `
    <div class="aviso-modal__caja promo-abre__caja" role="dialog" aria-modal="true" aria-labelledby="promoT">
      <button type="button" class="aviso-modal__x" aria-label="Cerrar">×</button>
      <span class="promo-abre__eti">Precio de apertura</span>
      <h2 class="promo-abre__t" id="promoT">Todos los jerseys a <b>$600</b></h2>
      <p class="promo-abre__p">Para celebrar la apertura de la tienda. Válido hasta el 7 de diciembre.</p>
      <a class="btn promo-abre__btn" href="futbol.html">Ver jerseys →</a>
    </div>`;
  const cerrar = () => { m.remove(); document.removeEventListener("keydown", tecla); };
  const tecla = e => { if (e.key === "Escape") cerrar(); };
  m.addEventListener("click", e => { if (e.target === m || e.target.closest(".aviso-modal__x")) cerrar(); });
  m.querySelector(".promo-abre__btn").addEventListener("click", e => {
    if (location.pathname.endsWith("futbol.html")) { e.preventDefault(); cerrar(); }
  });
  document.addEventListener("keydown", tecla);
  document.body.appendChild(m);
}

try {
  if (Date.now() < HASTA.getTime() && !sessionStorage.getItem(KEY)) {
    sessionStorage.setItem(KEY, "1");
    setTimeout(mostrar, 900);
  }
} catch {}
