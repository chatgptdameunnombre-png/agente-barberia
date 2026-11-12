import { NIVEL_CUEVA, NIVEL_CIRCE, NIVEL_BARCO, NIVEL_SIRENAS, NIVEL_HADES, ESTILOS_NIVEL } from './mapa.js?v=20261112102002';
import { NORMAL_CUEVA, NORMAL_CIRCE, NORMAL_BARCO, NORMAL_SIRENAS, NORMAL_HADES } from './otrolado.js?v=20261112102002';

export const MAPAS = {
  palacio: { nombre: 'EL PALACIO DE ITACA', radio: 13 },
  cueva: {
    nombre: 'LA CUEVA DE POLIFEMO', rejilla: NIVEL_CUEVA, estilo: ESTILOS_NIVEL.cueva, normal: NORMAL_CUEVA, radio: 4.5,
    texturas: './arte/crudo/cueva-texturas.webp?v=20261112102002', decoracion: './arte/crudo/cueva-decoracion.webp?v=20261112102002',
    claves: ['roca', 'musgo', 'tierra', 'techo', 'pilar', 'cerca'],
    recortes: { pilar: [0.12, 0.88], cerca: [0.02, 0.8] },
    respaldo: b => ({ roca: b.roca, musgo: b.roca, tierra: b.piedra, techo: b.roca, pilar: b.columna, cerca: b.terracota }),
    decor: {
      a: { celda: 0, alto: 3.2, basico: true, altura: 4.6, pared: true, luz: 34 },
      o: { celda: 1, alto: 2.9 },
      q: { celda: 2, alto: 1.9 },
      h: { celda: 3, alto: 1.9 },
      k: { celda: 4, alto: 2.0 },
      v: { celda: 5, alto: 3.0 },
      b: { celda: 6, alto: 1.8 },
      g: { celda: 7, alto: 2.4, basico: true, luz: 30 },
      p: { celda: 8, alto: 7.5 },
      s: { celda: 11, alto: 3.8 }
    }
  },
  circe: {
    nombre: 'LA ISLA DE CIRCE', rejilla: NIVEL_CIRCE, estilo: ESTILOS_NIVEL.circe, normal: NORMAL_CIRCE, radio: 5,
    texturas: './arte/crudo/circe-texturas.webp?v=20261112102002', decoracion: './arte/crudo/circe-decoracion.webp?v=20261112102002',
    claves: ['hiedra', 'flores', 'losas', 'pergola', 'columna', 'friso'],
    recortes: { columna: [0, 0.86] },
    respaldo: b => ({ hiedra: b.marmol, flores: b.marmol, losas: b.mosaico, pergola: b.roca, columna: b.columna, friso: b.terracota }),
    decor: {
      b: { celda: 0, alto: 3.0, basico: true, luz: 30, color: 0xb070ff },
      f: { celda: 1, alto: 4.2 },
      c: { celda: 2, alto: 2.8, basico: true, luz: 26, color: 0x70ff90 },
      l: { celda: 3, alto: 4.0 },
      m: { celda: 4, alto: 2.6 },
      t: { celda: 5, alto: 3.6 },
      v: { celda: 6, alto: 3.0 },
      a: { celda: 7, alto: 3.2 },
      w: { celda: 8, alto: 3.8 },
      n: { celda: 9, alto: 1.8 },
      g: { celda: 10, alto: 2.6 },
      o: { celda: 11, alto: 4.4 }
    }
  },
  barco: {
    nombre: 'EL BARCO DE ODISEO', rejilla: NIVEL_BARCO, estilo: ESTILOS_NIVEL.barco, normal: NORMAL_BARCO, radio: 6,
    texturas: './arte/crudo/barco-texturas.webp?v=20261112102002', decoracion: './arte/crudo/barco-decoracion.webp?v=20261112102002',
    claves: ['casco', 'ojo', 'cubierta', 'cielo', 'mastil', 'vela'],
    recortes: {},
    respaldo: b => ({ casco: b.piedra, ojo: b.terracota, cubierta: b.piedra, cielo: b.roca, mastil: b.columna, vela: b.terracota }),
    decor: {
      l: { celda: 0, alto: 2.6, basico: true, altura: 5.2, pared: true, luz: 32, color: 0xffb060 },
      b: { celda: 1, alto: 3.0 },
      c: { celda: 2, alto: 1.6 },
      a: { celda: 3, alto: 3.6 },
      r: { celda: 4, alto: 3.4 },
      k: { celda: 5, alto: 2.0 },
      v: { celda: 6, alto: 2.8 },
      n: { celda: 7, alto: 3.6 },
      o: { celda: 8, alto: 2.2 },
      s: { celda: 9, alto: 1.5 },
      e: { celda: 10, alto: 2.6 },
      f: { celda: 11, alto: 2.8, basico: true, luz: 30 }
    }
  },
  sirenas: {
    nombre: 'LA ISLA DE LAS SIRENAS', rejilla: NIVEL_SIRENAS, estilo: ESTILOS_NIVEL.sirenas, normal: NORMAL_SIRENAS, radio: 5.5,
    texturas: './arte/crudo/sirenas-texturas.webp?v=20261112102002', decoracion: './arte/crudo/sirenas-decoracion.webp?v=20261112102002',
    claves: ['roca', 'conchas', 'arena', 'niebla', 'coral', 'naufragio'],
    recortes: {},
    respaldo: b => ({ roca: b.roca, conchas: b.roca, arena: b.piedra, niebla: b.roca, coral: b.columna, naufragio: b.terracota }),
    canto: true,
    decor: {
      b: { celda: 0, alto: 3.0, basico: true, luz: 30, color: 0x70ff90 },
      e: { celda: 1, alto: 4.6 },
      a: { celda: 2, alto: 3.0 },
      k: { celda: 3, alto: 2.0 },
      h: { celda: 4, alto: 1.8 },
      p: { celda: 5, alto: 3.2 },
      v: { celda: 6, alto: 2.6 },
      n: { celda: 7, alto: 2.4 },
      m: { celda: 8, alto: 6.0 },
      o: { celda: 9, alto: 2.6 },
      c: { celda: 10, alto: 2.0 },
      l: { celda: 11, alto: 3.4, basico: true, luz: 32 }
    }
  },
  hades: {
    nombre: 'EL HADES', rejilla: NIVEL_HADES, estilo: ESTILOS_NIVEL.hades, normal: NORMAL_HADES, radio: 5.5,
    texturas: './arte/crudo/hades-texturas.webp?v=20261112102002', decoracion: './arte/crudo/hades-decoracion.webp?v=20261112102002',
    claves: ['basalto', 'craneos', 'ceniza', 'caverna', 'obsidiana', 'estigia'],
    recortes: {},
    respaldo: b => ({ basalto: b.roca, craneos: b.piedra, ceniza: b.piedra, caverna: b.roca, obsidiana: b.columna, estigia: b.roca }),
    decor: {
      b: { celda: 0, alto: 3.0, basico: true, luz: 34, color: 0x6aa0ff },
      c: { celda: 1, alto: 4.2 },
      k: { celda: 2, alto: 2.6 },
      t: { celda: 3, alto: 4.0 },
      g: { celda: 4, alto: 2.4 },
      l: { celda: 5, alto: 2.4 },
      o: { celda: 6, alto: 1.4 },
      v: { celda: 7, alto: 2.6 },
      a: { celda: 8, alto: 4.4 },
      j: { celda: 9, alto: 2.8, basico: true, luz: 24, color: 0x60e0ff },
      h: { celda: 10, alto: 1.8 },
      f: { celda: 11, alto: 3.4, basico: true, luz: 34, color: 0x6aa0ff }
    }
  }
};

export const MUERTES_HOJA = [
  ['lobo', 'muereRayo', './arte/crudo/lobo-rayo.webp?v=20261112102002'],
  ['lobo', 'muereLanza', './arte/crudo/lobo-lanza.webp?v=20261112102002'],
  ['lobo', 'muereCuchillo', './arte/crudo/lobo-cuchillo.webp?v=20261112102002'],
  ['lobo', 'muereFuego', './arte/crudo/lobo-fuego.webp?v=20261112102002'],
  ['lobo', 'muereHacha', './arte/crudo/lobo-hacha.webp?v=20261112102002'],
  ['lobo', 'muereBomba', './arte/crudo/lobo-bomba.webp?v=20261112102002'],
  ['pretendiente', 'muereRayo', './arte/crudo/pretendiente-rayo.webp?v=20261112102002'],
  ['pretendiente', 'muereLanza', './arte/crudo/pretendiente-lanza.webp?v=20261112102002'],
  ['pretendiente', 'muereCuchillo', './arte/crudo/pretendiente-cuchillo.webp?v=20261112102002'],
  ['pretendiente', 'muereFuego', './arte/crudo/pretendiente-fuego.webp?v=20261112102002'],
  ['pretendiente', 'muereHacha', './arte/crudo/pretendiente-hacha.webp?v=20261112102002'],
  ['pretendiente', 'muereBomba', './arte/crudo/pretendiente-bomba.webp?v=20261112102002'],
  ['polifemo', 'muereRayo', './arte/crudo/polifemo-rayo.webp?v=20261112102002'],
  ['polifemo', 'muereLanza', './arte/crudo/polifemo-lanza.webp?v=20261112102002'],
  ['polifemo', 'muereCuchillo', './arte/crudo/polifemo-cuchillo.webp?v=20261112102002'],
  ['polifemo', 'muereFuego', './arte/crudo/polifemo-fuego.webp?v=20261112102002'],
  ['polifemo', 'muereHacha', './arte/crudo/polifemo-hacha.webp?v=20261112102002'],
  ['polifemo', 'muereBomba', './arte/crudo/polifemo-bomba.webp?v=20261112102002'],
  ['sombra', 'muereRayo', './arte/crudo/sombra-rayo.webp?v=20261112102002'],
  ['sombra', 'muereLanza', './arte/crudo/sombra-lanza.webp?v=20261112102002'],
  ['sombra', 'muereCuchillo', './arte/crudo/sombra-cuchillo.webp?v=20261112102002'],
  ['sombra', 'muereFuego', './arte/crudo/sombra-fuego.webp?v=20261112102002'],
  ['sombra', 'muereHacha', './arte/crudo/sombra-hacha.webp?v=20261112102002'],
  ['sombra', 'muereBomba', './arte/crudo/sombra-bomba.webp?v=20261112102002'],
  ['cerdo', 'muereRayo', './arte/crudo/cerdo-rayo.webp?v=20261112102002'],
  ['cerdo', 'muereLanza', './arte/crudo/cerdo-lanza.webp?v=20261112102002'],
  ['cerdo', 'muereCuchillo', './arte/crudo/cerdo-cuchillo.webp?v=20261112102002'],
  ['cerdo', 'muereFuego', './arte/crudo/cerdo-fuego.webp?v=20261112102002'],
  ['cerdo', 'muereHacha', './arte/crudo/cerdo-hacha.webp?v=20261112102002'],
  ['cerdo', 'muereBomba', './arte/crudo/cerdo-bomba.webp?v=20261112102002']
];

export const ARCOS_HOJA = [
  ['arcoFontanero', './arte/crudo/arco-fontanero.webp?v=20261112102002'],
  ['arcoSierra', './arte/crudo/arco-sierra.webp?v=20261112102002'],
  ['arcoPortal', './arte/crudo/arco-portal.webp?v=20261112102002'],
  ['arcoFantasma', './arte/crudo/arco-fantasma.webp?v=20261112102002'],
  ['arcoSable', './arte/crudo/arco-sable.webp?v=20261112102002'],
  ['arcoAbismo', './arte/crudo/arco-abismo.webp?v=20261112102002']
];

export const CARAS_HOJA = [
  ['carasFontanero', './arte/crudo/caras-fontanero.webp?v=20261112102002'],
  ['carasSierra', './arte/crudo/caras-sierra.webp?v=20261112102002'],
  ['carasPortal', './arte/crudo/caras-portal.webp?v=20261112102002'],
  ['carasFantasma', './arte/crudo/caras-fantasma.webp?v=20261112102002'],
  ['carasSable', './arte/crudo/caras-sable.webp?v=20261112102002'],
  ['carasAbismo', './arte/crudo/caras-abismo.webp?v=20261112102002']
];

export const CONTROLES = [
  ['W A S D', 'Moverte por el palacio'],
  ['RATON', 'Mirar alrededor'],
  ['CLIC IZQUIERDO', 'Manten para tensar el arco, suelta para disparar. Mas tension, mas dano y alcance'],
  ['F', 'Golpe cuerpo a cuerpo. El cuchillo apuñala fuerte y no gasta; el hacha le pega a todos los de enfrente'],
  ['T', 'Lanzar. El cuchillo se pierde y gasta uno; el hacha atraviesa a todos y vuelve sola'],
  ['Z', 'Cambiar entre cuchillo y hacha (cuando tengas el hacha)'],
  ['R', 'Guante de Zeus: manten para cargar el rayo y suelta'],
  ['G', 'Hilo de Ariadna: te jalas a un muro, o jalas al enemigo hacia ti'],
  ['CLIC DERECHO', 'Portal azul (necesitas el Cuerno de Hermes)'],
  ['Q', 'Portal naranja'],
  ['1 2 3 4', 'Usar lo que llevas en el inventario'],
  ['SHIFT + 1 2 3 4', 'Soltar esa ranura para hacer sitio (tambien sirve para quitarte un arma)'],
  ['E', 'Abrir la tienda, solo entre rondas'],
  ['X', 'Ojo del cazador: manten X y apunta a hasta 5 enemigos, suelta y les disparas a todos'],
  ['B', 'Pico de Hefesto: rompes el muro al que apuntes y deja escombros'],
  ['C', 'Mano de Poseidon: agarra un escombro, y con C otra vez lo lanzas'],
  ['V', 'Recordar donde esta la grieta cuando se abre'],
  ['M', 'Silenciar y devolver el sonido'],
  ['ESC', 'Pausa']
];
