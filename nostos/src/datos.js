import { NIVEL_CUEVA, NIVEL_CIRCE, NIVEL_BARCO, ESTILOS_NIVEL } from './mapa.js?v=20261112080536';
import { NORMAL_CUEVA, NORMAL_CIRCE, NORMAL_BARCO } from './otrolado.js?v=20261112080536';

export const MAPAS = {
  palacio: { nombre: 'EL PALACIO DE ITACA', radio: 13 },
  cueva: {
    nombre: 'LA CUEVA DE POLIFEMO', rejilla: NIVEL_CUEVA, estilo: ESTILOS_NIVEL.cueva, normal: NORMAL_CUEVA, radio: 4.5,
    texturas: './arte/crudo/cueva-texturas.webp?v=20261112080536', decoracion: './arte/crudo/cueva-decoracion.webp?v=20261112080536',
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
    texturas: './arte/crudo/circe-texturas.webp?v=20261112080536', decoracion: './arte/crudo/circe-decoracion.webp?v=20261112080536',
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
    texturas: './arte/crudo/barco-texturas.webp?v=20261112080536', decoracion: './arte/crudo/barco-decoracion.webp?v=20261112080536',
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
  }
};

export const ARCOS_HOJA = [
  ['arcoFontanero', './arte/crudo/arco-fontanero.webp?v=20261112080536'],
  ['arcoSierra', './arte/crudo/arco-sierra.webp?v=20261112080536'],
  ['arcoPortal', './arte/crudo/arco-portal.webp?v=20261112080536'],
  ['arcoFantasma', './arte/crudo/arco-fantasma.webp?v=20261112080536'],
  ['arcoSable', './arte/crudo/arco-sable.webp?v=20261112080536'],
  ['arcoAbismo', './arte/crudo/arco-abismo.webp?v=20261112080536']
];

export const CARAS_HOJA = [
  ['carasFontanero', './arte/crudo/caras-fontanero.webp?v=20261112080536'],
  ['carasSierra', './arte/crudo/caras-sierra.webp?v=20261112080536'],
  ['carasPortal', './arte/crudo/caras-portal.webp?v=20261112080536'],
  ['carasFantasma', './arte/crudo/caras-fantasma.webp?v=20261112080536'],
  ['carasSable', './arte/crudo/caras-sable.webp?v=20261112080536'],
  ['carasAbismo', './arte/crudo/caras-abismo.webp?v=20261112080536']
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
