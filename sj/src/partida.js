const MALAS = new Set(['__proto__', 'constructor', 'prototype']);
const CLAVE = 'perla_partida', BUENA = 'perla_partida_ok', MALA = 'perla_partida_mala';

const esObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const claveOk = k => typeof k === 'string' && k.length > 0 && k.length < 48 && !MALAS.has(k);
const num = (v, min, max) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined;
const ent = (v, min, max) => { const n = num(v, min, max); return n === undefined ? undefined : Math.floor(n); };
const texto = (v, max = 60) => typeof v === 'string' && v.length <= max && !/[<>&"'`]/.test(v) ? v : undefined;
const simple = v => typeof v === 'number' ? num(v, -1e9, 1e9) : texto(v);
const mapa = (o, fn) => { const r = {}; if (esObj(o)) for (const k of Object.keys(o)) { if (!claveOk(k)) continue; const v = fn(o[k], k); if (v !== undefined) r[k] = v; } return r; };
const lista = (a, fn, max = 500) => Array.isArray(a) ? a.slice(0, max).map(fn).filter(v => v !== undefined) : [];

function plano(v, prof = 0) {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return num(v, -1e9, 1e9);
  if (typeof v === 'string') return texto(v);
  if (prof > 3) return undefined;
  if (Array.isArray(v)) return lista(v, x => plano(x, prof + 1), 200);
  if (esObj(v)) return mapa(v, x => plano(x, prof + 1));
  return undefined;
}

export const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function sanear(d, C) {
  if (!esObj(d)) return null;
  const r = {};
  const poner = (k, v) => { if (v !== undefined) r[k] = v; };
  if ('mision' in d) poner('mision', ent(d.mision, 0, C.misiones) ?? 0);
  if ('misiones2' in d) r.misiones2 = mapa(d.misiones2, (v, k) => k in C.contactos ? ent(v, 0, C.contactos[k]) : undefined);
  if ('dinero' in d) poner('dinero', num(d.dinero, 0, 1e9) ?? 0);
  if ('banco' in d) poner('banco', num(d.banco, 0, 1e9) ?? 0);
  if ('armas' in d) r.armas = mapa(d.armas, (v, k) => {
    if (!C.armas.includes(k) || !esObj(v)) return undefined;
    const a = { cargador: ent(v.cargador, 0, 9999) ?? 0, reserva: ent(v.reserva, 0, 99999) ?? 0 };
    if (v.silen === true) a.silen = true;
    return a;
  });
  if ('cuerpo' in d && esObj(d.cuerpo)) {
    const c = {}, s = ent(d.cuerpo.saludMax, 100, 160), v = num(d.cuerpo.bonoVel, 0, 0.2), g = num(d.cuerpo.bonoGolpe, 0, 0.6);
    if (s !== undefined) c.saludMax = s; if (v !== undefined) c.bonoVel = v; if (g !== undefined) c.bonoGolpe = g;
    r.cuerpo = c;
  }
  if ('propiedades' in d) r.propiedades = mapa(d.propiedades, v => plano(v, 1));
  if ('eco' in d && esObj(d.eco)) r.eco = {
    cajas: mapa(d.eco.cajas, v => num(v, 0, 1e9)),
    garaje: lista(d.eco.garaje, g => {
      if (!esObj(g) || !C.tipos.includes(g.tipo)) return undefined;
      const x = mapa(g, v => plano(v, 1));
      x.tipo = g.tipo; x.mejoras = mapa(g.mejoras, v => v ? true : undefined);
      return x;
    }, 60)
  };
  if ('enc' in d && esObj(d.enc)) r.enc = { hechos: lista(d.enc.hechos, v => ent(v, 0, 999)) };
  if ('terr' in d) r.terr = mapa(d.terr, v => v === null ? null : C.bandas.includes(v) ? v : undefined);
  if ('act' in d && esObj(d.act)) r.act = { flores: lista(d.act.flores, simple), saltos: lista(d.act.saltos, simple) };
  if ('plac' in d) r.plac = lista(d.plac, simple);
  if ('trab' in d && esObj(d.trab)) r.trab = { mejores: mapa(d.trab.mejores, v => num(v, 0, 1e6)), ganadas: mapa(d.trab.ganadas, v => v ? true : undefined) };
  if ('stats' in d) r.stats = mapa(d.stats, v => num(v, 0, 1e12));
  if ('estilos' in d) r.estilos = mapa(d.estilos, v => esObj(v) ? mapa(v, x => plano(x, 2)) : undefined);
  if ('personaje' in d) poner('personaje', texto(d.personaje, 24));
  const cambios = Object.keys(d).filter(k => d[k] != null && JSON.stringify(d[k]) !== JSON.stringify(r[k]));
  return { datos: r, cambios };
}

export function leerPartida(C) {
  const cruda = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const leer = k => { try { return sanear(JSON.parse(cruda(k) || 'null'), C); } catch (e) { return null; } };
  const txt = cruda(CLAVE);
  if (!txt) return { d: null, origen: null, cambios: [] };
  let r = leer(CLAVE), origen = 'principal';
  if (!r) {
    try { localStorage.setItem(MALA, txt.slice(0, 200000)); } catch (e) { }
    r = leer(BUENA); origen = r ? 'respaldo' : 'perdida';
  }
  if (!r) return { d: null, origen, cambios: [] };
  if (origen === 'principal' && !r.cambios.length) { try { localStorage.setItem(BUENA, txt); } catch (e) { } }
  else if (origen === 'principal') { try { localStorage.setItem(MALA, txt.slice(0, 200000)); } catch (e) { } }
  return { d: r.datos, origen, cambios: r.cambios };
}

export function borrarPartida() { for (const k of [CLAVE, BUENA, MALA]) { try { localStorage.removeItem(k); } catch (e) { } } }

const CALIDADES = ['auto', 3, 2, 1, 0, -1];

export function sanearAjustes(g) {
  const r = {};
  if (!esObj(g)) return r;
  const pon = (k, v) => { if (v !== undefined) r[k] = v; };
  pon('volumen', num(g.volumen, 0, 1)); pon('musica', num(g.musica, 0, 1)); pon('sensibilidad', num(g.sensibilidad, 0.3, 2.5));
  const q = g.calidad === 'auto' ? 'auto' : typeof g.calidad === 'number' || (typeof g.calidad === 'string' && g.calidad.trim() !== '') ? +g.calidad : undefined;
  if (CALIDADES.includes(q)) r.calidad = q;
  for (const k of ['flechas', 'invertir', 'fps']) if (typeof g[k] === 'boolean') r[k] = g[k];
  pon('v', ent(g.v, 0, 99));
  return r;
}
