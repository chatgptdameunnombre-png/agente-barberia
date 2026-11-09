import { promotorActual, promoVigente } from "./promotor.js?v=111";

const KEY = "dm_codigos";
const VIDA = 2 * 24 * 3600 * 1000;

function leer() {
  try {
    const g = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    const ahora = Date.now();
    for (const k of Object.keys(g)) if (!g[k] || !(g[k].valor > 0) || ahora - g[k].t > VIDA) delete g[k];
    return g;
  } catch { return {}; }
}

export function codigoDe(id) {
  const propio = leer()[id];
  if (propio) return propio;
  const pr = promoVigente() ? promotorActual() : null;
  return pr ? { codigo: pr.codigo, valor: 0, etiqueta: "", promotor: true } : null;
}

export function ponerCodigo(id, c) {
  const g = leer();
  g[id] = { codigo: String(c.codigo || "").toUpperCase(), tipo: c.tipo === "fijo" ? "fijo" : "porcentaje", valor: Number(c.valor) || 0, etiqueta: c.etiqueta || "", t: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(g)); } catch { }
}

export function descuentoCodigo(cod, precio) {
  if (!cod || !(cod.valor > 0) || !(precio > 1)) return 0;
  const d = cod.tipo === "fijo" ? Math.min(cod.valor, precio - 1) : Math.round(precio * cod.valor / 100);
  return Math.max(0, d);
}
