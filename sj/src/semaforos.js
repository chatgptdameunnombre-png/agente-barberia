import * as THREE from 'three';
import { linea, BLOQUES, CALLE, LIMITE } from './ciudad.js?v=202611220526';

const CICLO = 26, VERDE = 10.5, AMBAR = 2;

export class Semaforos {
  constructor(juego) {
    this.j = juego;
    this.t = 0;
    this.lista = [];
    const d = CALLE / 2 + 0.6;
    for (let i = 0; i <= BLOQUES; i++) for (let k = 0; k <= BLOQUES; k++) {
      const X = linea(i), Z = linea(k);
      for (const [sx, sz] of [[1, -1], [-1, 1]]) {
        const x = X + sx * d, z = Z + sz * d;
        if (Math.abs(x) > LIMITE || Math.abs(z) > LIMITE) continue;
        this.lista.push({ i, k, x, z, sx, sz });
        juego.mundo.agregar(x - 0.12, z - 0.12, x + 0.12, z + 0.12, 5);
      }
    }
    const n = this.lista.length;
    const metal = new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: 0.45, metalness: 0.6 });
    const caja = new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.5, metalness: 0.3 });
    this.poste = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 4.4, 8).translate(0, 2.2, 0), metal, n);
    this.cajas = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.95, 0.34).translate(0, 4.05, 0), caja, n * 2);
    this.focos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), n * 2 * 3 * 2);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    this.mapa = [];
    this.lista.forEach((L, a) => {
      this.poste.setMatrixAt(a, m.makeTranslation(L.x, 0, L.z));
      for (const [e, ox, oz] of [['x', -L.sx * 0.0, -L.sz * 0.3], ['z', -L.sx * 0.3, 0]]) {
        const b = a * 2 + (e === 'x' ? 0 : 1);
        this.cajas.setMatrixAt(b, m.makeTranslation(L.x + ox, 0, L.z + oz));
        for (let f = 0; f < 3; f++) for (const lado of [-1, 1]) {
          const idx = this.mapa.length;
          if (e === 'x') p.set(L.x + ox + lado * 0.18, 4.36 - f * 0.29, L.z + oz); else p.set(L.x + ox, 4.36 - f * 0.29, L.z + oz + lado * 0.18);
          this.focos.setMatrixAt(idx, m.compose(p, q, s));
          this.mapa.push({ i: L.i, k: L.k, e, f });
        }
      }
    });
    this.poste.castShadow = this.cajas.castShadow = true;
    juego.escena.add(this.poste, this.cajas, this.focos);
    this.colores = { rojo: [new THREE.Color('#ff2a2a'), new THREE.Color('#3a0c0c')], amarillo: [new THREE.Color('#ffc030'), new THREE.Color('#3a2a08')], verde: [new THREE.Color('#3aff7a'), new THREE.Color('#0c2a14')] };
    this.pintar();
  }

  rojoRestante(i, k, eje) {
    const t = ((this.t + (i * 3.1 + k * 1.7)) % CICLO + CICLO) % CICLO;
    const fase = eje === 'x' ? t : (t + CICLO / 2) % CICLO;
    return fase >= VERDE + AMBAR ? CICLO - fase : 0;
  }

  estado(i, k, eje) {
    const t = ((this.t + (i * 3.1 + k * 1.7)) % CICLO + CICLO) % CICLO;
    const fase = eje === 'x' ? t : (t + CICLO / 2) % CICLO;
    return fase < VERDE ? 'verde' : fase < VERDE + AMBAR ? 'amarillo' : 'rojo';
  }

  pintar() {
    const F = ['rojo', 'amarillo', 'verde'];
    this.mapa.forEach((M, idx) => {
      const est = this.estado(M.i, M.k, M.e), luz = F[M.f];
      this.focos.setColorAt(idx, this.colores[luz][est === luz ? 0 : 1]);
    });
    this.focos.instanceColor.needsUpdate = true;
  }

  actualizar(dt) {
    this.t += dt;
    this.reloj = (this.reloj || 0) - dt;
    if (this.reloj <= 0) { this.reloj = 0.25; this.pintar(); }
  }
}
