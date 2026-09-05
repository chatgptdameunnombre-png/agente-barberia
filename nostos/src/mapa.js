import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { banco } from './texturas.js?v=20260905173303';

export const CELDA = 4;
export const ALTO = 10;

export const NIVEL_PRUEBA = [
  '###################################',
  '###################################',
  '##.........###.......###.........##',
  '##.E.....E.###.TTTTT.###.E.....E.##',
  '##..C...C.......FFF.......C...C..##',
  '##...............................##',
  '##...............E...............##',
  '##..C...C..###.......###..C...C..##',
  '##.........#####...#####.........##',
  '#####...########...########...#####',
  '#####...#####.........#####...#####',
  '##........###.C..E..C.###........##',
  '##..C...C.###.........###..C...C.##',
  '##.E.........F...@...F.........E.##',
  '##...............................##',
  '##.........E..C.....C..E.........##',
  '##........###.........###........##',
  '##.EC...C.######...######..C...C.##',
  '##........######...######........##',
  '#####...########.................##',
  '##...............................##',
  '##.ERRR....E........E.......RRRE.##',
  '##...............................##',
  '###################################',
  '###################################'
];

const SOLIDOS = new Set(['#', 'C', 'T', 'R', 'F']);

const MATERIAL_POR_SIGNO = {
  '#': 'marmol',
  'C': 'columna',
  'T': 'terracota',
  'R': 'roca',
  'F': 'piedra'
};

export function esSolido(rejilla, cx, cz) {
  if (cz < 0 || cz >= rejilla.length) return true;
  const fila = rejilla[cz];
  if (cx < 0 || cx >= fila.length) return true;
  return SOLIDOS.has(fila[cx]);
}

export function construir(rejilla, texturas) {
  const tex = texturas || banco();
  const grupo = new THREE.Group();
  const alto = rejilla.length;
  const ancho = rejilla[0].length;
  const porMaterial = {};
  const spawns = { jugador: null, enemigos: [], items: [] };

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

  const piso = tex.mosaico.clone();
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

  const techo = tex.roca.clone();
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

  const nivel = { grupo, spawns, rejilla, ancho, alto, tex };
  nivel.rehacer = () => rehacer(nivel);
  return nivel;
}

function rehacer(nivel) {
  const { grupo, rejilla, ancho, alto, tex } = nivel;
  for (let i = grupo.children.length - 1; i >= 0; i--) {
    const hijo = grupo.children[i];
    if (!hijo.userData.piso && !hijo.userData.techo) {
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
