import { promotorActual, promoVigente } from "./promotor.js?v=110";

const KEY = "dm_codigos";
const VIDA = 7 * 24 * 3600 * 1000;

function leer() {
  try {
    const g = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    const ahora = Date.now();
    for (const k of Object.keys(g)) if (!g[k] || !(g[k].descuento > 0) || ahora - g[k].t > VIDA) delete g[k];
    return g;
  } catch { return {}; }
}

export function codigoDe(id) {
  const propio = leer()[id];
  if (propio) return propio;
  const pr = promoVigente() ? promotorActual() : null;
  return pr ? { codigo: pr.codigo, descuento: 0, etiqueta: "", promotor: true } : null;
}

export function ponerCodigo(id, c) {
  const g = leer();
  g[id] = { codigo: String(c.codigo || "").toUpperCase(), descuento: Number(c.descuento) || 0, etiqueta: c.etiqueta || "", t: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(g)); } catch { }
}
