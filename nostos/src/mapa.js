import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { banco } from './texturas.js?v=20261025203439';

export const CELDA = 4;
export const ALTO = 10;

export const NIVEL_PRUEBA = [
  '###################################',
  '##TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT##',
  '##.E...........................E.##',
  '##.....C.........C.........C.....##',
  '##..........C.........C..........##',
  '##...............E...............##',
  '####..##########...##########..####',
  '####..######T#T#...#T#T######..####',
  '##.......##.............##.......##',
  '##.E.....##..C.......C..##....ER.##',
  '##...R...#T.............T#.......##',
  '##...R..........FFF..............##',
  '##..........C...FFF...C..........##',
  '##...........................R...##',
  '##.......#T.............T#...R...##',
  '##.R...E.##..C.......C..##.E.....##',
  '##.......##.............##.......##',
  '####..######T##T...##T#######..####',
  '####..##########...##########..####',
  '##...............................##',
  '##...C...C...C.......C...C...C...##',
  '##...............@...............##',
  '##.E...........................E.##',
  '###################################',
  '###################################'
];

export const NIVEL_CUEVA = [
  '################################',
  '#####h..a...######RR####a..k####',
  '####.........E###....#R#.....###',
  '###...s...........E.........E.##',
  '##o.....C.....R#......##......##',
  '##...........####....####..q..R#',
  '###.....F...####R....R####...###',
  '####......##R###......R####R..##',
  '###R#....###...TT.TT...R##....R#',
  '##E.......#...T..o..T...R.....##',
  '#R.........C..T.v....T..C......#',
  '#R..s.........T...q..T.........#',
  '##R.......#...TT...TT...#...E.##',
  '###R....R###............###..###',
  '###.....RR###...s..s..##R#....##',
  '##...........##......##.......R#',
  '#Rk.E.................b.....s.##',
  '##R..a.....g....@.....F..a..h###',
  '###R#R##R#.......#......####R###',
  '################p###############'
];

export const NIVEL_CIRCE = [
  '################################',
  '#b....m..t.#TTTTTTTT#.t..m....b#',
  '#..........#...E..E.#..........#',
  '#..E.......#........#.......E..#',
  '#....RRR...##......##...RRR....#',
  '#a...R....................R...a#',
  '#....R...C...........C...R.....#',
  '#....R......CC....CC.....R.....#',
  '#.E.........C......C......E....#',
  '#...........C...f..C...........#',
  '#..a.....R..C......C..R.....a..#',
  '#........R..C......C..R........#',
  '#.E......R..CC....CC..R......E.#',
  '#...........c..............l...#',
  '#....RRR...##......##...RRR....#',
  '#..v.......#........#.......v..#',
  '#..........#..n..n..#..........#',
  '#.o....w...TT......TT...w....o.#',
  '#..E.........................E.#',
  '#b.....g.....a.@..a.....g.....b#',
  '################################'
];

export const NIVEL_BARCO = [
  '####RR####RR####RR####RR####RR######',
  '#l..k....b..............b.....l#####',
  '#.E.............E..........E....####',
  '#..s..s..s..s......s..s..s..s....###',
  '#....FF.......TT.......FF.........##',
  '#..........C..........C.......a...##',
  '#r.@...v......................n....#',
  '#r..........E..........C......f....#',
  '#..........C..........C.......c...##',
  '#....FF.......TT.......FF.........##',
  '#..s..s..s..s......s..s..s..s....###',
  '#.E.............E..........E....####',
  '#l..v....b..............b.....l#####',
  '####RR####RR####RR####RR####RR######'
];

const SOLIDOS = new Set(['#', 'C', 'T', 'R', 'F']);

export const ESTILOS_NIVEL = {
  palacio: {
    materiales: { '#': 'marmol', 'C': 'columna', 'T': 'terracota', 'R': 'roca', 'F': 'piedra' },
    piso: 'mosaico', techo: 'roca'
  },
  cueva: {
    materiales: { '#': 'roca', 'C': 'pilar', 'T': 'cerca', 'R': 'musgo', 'F': 'roca' },
    piso: 'tierra', techo: 'techo',
    colores: { '#': '#6e5a46', 'R': '#4e6a3a', 'C': '#b89c74', 'T': '#8a5a2a', 'F': '#6e5a46' }
  },
  circe: {
    materiales: { '#': 'hiedra', 'C': 'columna', 'T': 'friso', 'R': 'flores', 'F': 'hiedra' },
    piso: 'losas', techo: 'pergola',
    colores: { '#': '#8a9a6a', 'R': '#9a6ab4', 'C': '#e8e2d0', 'T': '#5a3a7a', 'F': '#8a9a6a' }
  },
  barco: {
    materiales: { '#': 'casco', 'C': 'mastil', 'T': 'vela', 'R': 'ojo', 'F': 'casco' },
    piso: 'cubierta', techo: 'cielo',
    colores: { '#': '#5a4632', 'R': '#c9a227', 'C': '#a07850', 'T': '#c84a3a', 'F': '#7a5a3a' }
  }
};

export function esSolido(rejilla, cx, cz) {
  if (cz < 0 || cz >= rejilla.length) return true;
  const fila = rejilla[cz];
  if (cx < 0 || cx >= fila.length) return true;
  return SOLIDOS.has(fila[cx]);
}

export function construir(rejilla, texturas, estilo = ESTILOS_NIVEL.palacio) {
  const tex = texturas || banco();
  const MATERIAL_POR_SIGNO = estilo.materiales;
  const grupo = new THREE.Group();
  const alto = rejilla.length;
  const ancho = rejilla[0].length;
  const porMaterial = {};
  const spawns = { jugador: null, enemigos: [], items: [], decor: [] };

  for (let z = 0; z < alto; z++) {
    for (let x = 0; x < ancho; x++) {
      const s = rejilla[z][x];
      const mundoX = x * CELDA + CELDA / 2;
      const mundoZ = z * CELDA + CELDA / 2;

      if (SOLIDOS.has(s)) {
        const clave = MATERIAL_POR_SIGNO[s];
        const esColumna = s === 'C';
        const g = new THREE.BoxGeometry(
          esColumna ? CELDA * 0.55 : CELDA,
          ALTO,
          esColumna ? CELDA * 0.55 : CELDA
        );
        g.translate(mundoX, ALTO / 2, mundoZ);
        (porMaterial[clave] ||= []).push(g);
        continue;
      }
      if (s === '@') spawns.jugador = new THREE.Vector3(mundoX, 0, mundoZ);
      if (s === 'E') spawns.enemigos.push(new THREE.Vector3(mundoX, 0, mundoZ));
      if (s === '+') spawns.items.push(new THREE.Vector3(mundoX, 0, mundoZ));
      if (s >= 'a' && s <= 'z') spawns.decor.push({ signo: s, x, z, pos: new THREE.Vector3(mundoX, 0, mundoZ) });
    }
  }

  for (const clave in porMaterial) {
    const geo = mergeGeometries(porMaterial[clave]);
    const t = tex[clave].clone();
    t.needsUpdate = true;
    t.repeat.set(1, ALTO / CELDA);
    const mat = new THREE.MeshLambertMaterial({ map: t });
    grupo.add(new THREE.Mesh(geo, mat));
  }

  const anchoMundo = ancho * CELDA;
  const altoMundo = alto * CELDA;

  const piso = tex[estilo.piso].clone();
  piso.needsUpdate = true;
  piso.repeat.set(ancho, alto);
  const mallaPiso = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoMundo, altoMundo),
    new THREE.MeshLambertMaterial({ map: piso })
  );
  mallaPiso.rotation.x = -Math.PI / 2;
  mallaPiso.position.set(anchoMundo / 2, 0, altoMundo / 2);
  mallaPiso.userData.piso = true;
  grupo.add(mallaPiso);

  const techo = tex[estilo.techo].clone();
  techo.needsUpdate = true;
  techo.repeat.set(ancho, alto);
  const mallaTecho = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoMundo, altoMundo),
    new THREE.MeshLambertMaterial({ map: techo })
  );
  mallaTecho.rotation.x = Math.PI / 2;
  mallaTecho.position.set(anchoMundo / 2, ALTO, altoMundo / 2);
  mallaTecho.userData.techo = true;
  grupo.add(mallaTecho);

  const nivel = { grupo, spawns, rejilla, ancho, alto, tex, estilo, colores: estilo.colores || null };
  nivel.rehacer = () => rehacer(nivel);
  return nivel;
}

function rehacer(nivel) {
  const { grupo, rejilla, ancho, alto, tex } = nivel;
  const MATERIAL_POR_SIGNO = nivel.estilo.materiales;
  for (let i = grupo.children.length - 1; i >= 0; i--) {
    const hijo = grupo.children[i];
    if (!hijo.userData.piso && !hijo.userData.techo && !hijo.userData.decor) {
      grupo.remove(hijo);
      hijo.geometry.dispose();
    }
  }
  const porMaterial = {};
  for (let z = 0; z < alto; z++) {
    for (let x = 0; x < ancho; x++) {
      const s = rejilla[z][x];
      if (!SOLIDOS.has(s)) continue;
      const clave = MATERIAL_POR_SIGNO[s];
      const esColumna = s === 'C';
      const g = new THREE.BoxGeometry(
        esColumna ? CELDA * 0.55 : CELDA,
        ALTO,
        esColumna ? CELDA * 0.55 : CELDA
      );
      g.translate(x * CELDA + CELDA / 2, ALTO / 2, z * CELDA + CELDA / 2);
      (porMaterial[clave] ||= []).push(g);
    }
  }
  for (const clave in porMaterial) {
    const geo = mergeGeometries(porMaterial[clave]);
    const t = tex[clave].clone();
    t.needsUpdate = true;
    t.repeat.set(1, ALTO / CELDA);
    grupo.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: t })));
  }
}

export function romper(nivel, cx, cz) {
  if (cz < 1 || cx < 1 || cz >= nivel.alto - 1 || cx >= nivel.ancho - 1) return false;
  const fila = nivel.rejilla[cz];
  if (!SOLIDOS.has(fila[cx])) return false;
  nivel.rejilla[cz] = fila.substring(0, cx) + '.' + fila.substring(cx + 1);
  nivel.rehacer();
  return true;
}
