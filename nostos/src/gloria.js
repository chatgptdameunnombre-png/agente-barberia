export const MODOS = [
  { id: 'pesadilla', insignia: 0, nombre: 'PESADILLA', precio: 2000,
    desc: 'Enemigos al doble desde la ronda 1, pero ganas el triple de gloria' },
  { id: 'otroladoFijo', insignia: 1, nombre: 'OTRO LADO ETERNO', precio: 2500,
    desc: 'Toda la partida en el mundo rojo: casi el doble de vida enemiga y triple oro' },
  { id: 'salto', insignia: 2, nombre: 'SALTO', precio: 1800,
    desc: 'Empiezas en la ronda 5 con 300 de oro' },
  { id: 'cerco', insignia: 8, nombre: 'CERCO DE TROYA', precio: 1600,
    desc: 'Cada 5 rondas un anillo de fuego se cierra sobre el palacio y quema al que se quede fuera' },
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

export const OBJETOS = [
  { id: 'iniCuerno', arma: 'portales', icono: ['cuerno', 1], nombre: 'CUERNO DE HERMES', precio: 2500,
    desc: 'Empiezas la partida con la pistola de portales puesta' },
  { id: 'iniGuante', arma: 'guante', icono: ['guante', 2], nombre: 'GUANTE DE ZEUS', precio: 3000,
    desc: 'Empiezas con el guante del rayo' },
  { id: 'iniGancho', arma: 'gancho', icono: ['hilo', 1], nombre: 'HILO DE ARIADNA', precio: 2200,
    desc: 'Empiezas con el gancho' },
  { id: 'iniPico', arma: 'pico', icono: ['pico', 0], nombre: 'PICO DE HEFESTO', precio: 2400,
    desc: 'Empiezas con el pico que rompe muros' },
  { id: 'iniMano', arma: 'manoP', icono: ['mano', 2], nombre: 'MANO DE POSEIDON', precio: 2600,
    desc: 'Empiezas con la mano que lanza escombros' },
  { id: 'iniCazador', arma: 'cazador', icono: ['insignias', 7], nombre: 'OJO DEL CAZADOR', precio: 2800,
    desc: 'Empiezas con la punteria del cazador' }
];

export const LIMITE_OBJETOS = 2;

export const ESTILOS = [
  { id: 'esPlata', grupo: 'tinte', valor: 'plata', nombre: 'ARMA DE PLATA', precio: 300, muestra: '#c9ccd4' },
  { id: 'esOro', grupo: 'tinte', valor: 'oro', nombre: 'ARMA DE ORO', precio: 400, muestra: '#e8c14a' },
  { id: 'esSangre', grupo: 'tinte', valor: 'sangre', nombre: 'ARMA DE SANGRE', precio: 400, muestra: '#8f2118' },
  { id: 'esEgeo', grupo: 'tinte', valor: 'egeo', nombre: 'ARMA DEL EGEO', precio: 400, muestra: '#2d7396' },
  { id: 'esHades', grupo: 'tinte', valor: 'hades', nombre: 'ARMA DE HADES', precio: 600, muestra: '#4a4640' },
  { id: 'coHueso', grupo: 'color', valor: 'hueso', nombre: 'TABLERO HUESO', precio: 250, muestra: '#f2e2b0' },
  { id: 'coOlivo', grupo: 'color', valor: 'olivo', nombre: 'TABLERO OLIVO', precio: 250, muestra: '#8c9c3a' },
  { id: 'coEgeo', grupo: 'color', valor: 'egeo', nombre: 'TABLERO EGEO', precio: 250, muestra: '#4aa9d4' },
  { id: 'coSangre', grupo: 'color', valor: 'sangre', nombre: 'TABLERO SANGRE', precio: 250, muestra: '#d4452d' },
  { id: 'coVioleta', grupo: 'color', valor: 'violeta', nombre: 'TABLERO VIOLETA', precio: 350, muestra: '#a97fd4' },
  { id: 'miPunto', grupo: 'mira', valor: 'punto', nombre: 'MIRA DE PUNTO', precio: 200, muestra: '#e8c14a' },
  { id: 'miAnillo', grupo: 'mira', valor: 'anillo', nombre: 'MIRA DE ANILLO', precio: 200, muestra: '#e8c14a' },
  { id: 'miNada', grupo: 'mira', valor: 'nada', nombre: 'SIN MIRA', precio: 200, muestra: '#4a3418' }
];

export const TODO = [...MODOS, ...MEJORAS_MERCADER, ...OBJETOS, ...ESTILOS];
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
