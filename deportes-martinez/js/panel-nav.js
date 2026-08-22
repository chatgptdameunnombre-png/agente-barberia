const $ = s => document.querySelector(s);

/* ============================================================
   Navegación del panel (menú de tres rayitas)
   ============================================================ */
const NAV = {
  productos: ["secProductos"],
  visitas: ["estad"],
  cuentas: ["secCuentas"]
};

export function mostrarSeccion(sec, sub) {
  Object.entries(NAV).forEach(([k, ids]) => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = k !== sec;
    });
  });
  document.querySelectorAll(".pnav__item").forEach(b => b.classList.toggle("on", b.dataset.sec === sec));
  if (sec === "visitas") {
    const bloques = document.querySelectorAll("#estadBody .st-bloque");
    bloques.forEach(b => { b.hidden = !!sub && b.dataset.sub !== sub; });
    document.querySelectorAll(".pnav__sub").forEach(b => b.classList.toggle("on", !!sub && b.dataset.sub === sub));
    if (sub) {
      const t = document.querySelector(`#estadBody .st-bloque[data-sub="${sub}"]`);
      t?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  cerrarNav();
  if (sec !== "visitas") window.scrollTo({ top: 0, behavior: "smooth" });
}

const abrirNav = () => { $("#pnav").hidden = false; $("#pnavFondo").hidden = false; $("#pnavBtn")?.classList.add("on"); };
const cerrarNav = () => { $("#pnav").hidden = true; $("#pnavFondo").hidden = true; $("#pnavBtn")?.classList.remove("on"); };

$("#pnavBtn")?.addEventListener("click", () => ($("#pnav").hidden ? abrirNav() : cerrarNav()));
$("#pnavFondo")?.addEventListener("click", cerrarNav);

document.addEventListener("click", e => {
  const item = e.target.closest(".pnav__item");
  if (item) {
    if (item.dataset.sec === "agregar") { cerrarNav(); document.dispatchEvent(new CustomEvent("panel:nuevo")); return; }
    mostrarSeccion(item.dataset.sec);
    if (item.dataset.sec === "cuentas") document.dispatchEvent(new CustomEvent("panel:cuentas"));
    return;
  }
  const sub = e.target.closest(".pnav__sub");
  if (sub) { mostrarSeccion("visitas", sub.dataset.sub); return; }
});

