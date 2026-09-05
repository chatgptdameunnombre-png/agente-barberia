export const MODOS = [
  { id: 'pesadilla', insignia: 0, nombre: 'PESADILLA', precio: 2000,
    desc: 'Enemigos al doble desde la ronda 1, pero ganas el triple de gloria' },
  { id: 'otroladoFijo', insignia: 1, nombre: 'OTRO LADO ETERNO', precio: 2500,
    desc: 'Toda la partida en el mundo rojo: casi el doble de vida enemiga y triple oro' },
  { id: 'salto', insignia: 2, nombre: 'SALTO', precio: 1800,
    desc: 'Empiezas en la ronda 5 con 300 de oro' },
  { id: 'sinArco', insignia: 3, nombre: 'SIN ARCO', precio: 3500,
    desc: 'Sin arco: solo hacha, portales y reliquias. El mas dificil' }
];

export const MEJORAS_MERCADER = [
  { id: 'oferta5', insignia: 4, nombre: 'MAS MERCANCIA', precio: 1000,
    desc: 'El mercader te ofrece 5 articulos en vez de 4' },
  { id: 'descuento', insignia: 5, nombre: 'BUEN OJO', precio: 1400,
    desc: '15% de descuento en todo lo del mercader' },
  { id: 'ranura', insignia: 6, nombre: 'MORRAL HONDO', precio: 2000,
    desc: 'Una ranura mas de inventario: 5 en vez de 4' }
];

export const TODO = [...MODOS, ...MEJORAS_MERCADER];
const LLAVE = 'nostos.gloria';

export function estado() {
  try {
    const d = JSON.parse(localStorage.getItem(LLAVE) || '{}');
    return { comprados: d.comprados || [], activos: d.activos || [] };
  } catch (e) {
    return { comprados: [], activos: [] };
  }
}

export function guardar(d) {
  try { localStorage.setItem(LLAVE, JSON.stringify(d)); } catch (e) {}
}

export function tiene(id) {
  return estado().comprados.includes(id);
}

export function activo(id) {
  const e = estado();
  return e.comprados.includes(id) && e.activos.includes(id);
}
