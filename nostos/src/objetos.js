import * as THREE from 'three';
import { Billboard } from './sprites.js?v=20260905153439';

export const CATALOGO = [
  { id: 'flechas',  celda: 0,  alto: 2.0, efecto: 'flechas',  valor: 10, aviso: '+10 FLECHAS' },
  { id: 'aljaba',   celda: 1,  alto: 2.6, efecto: 'flechas',  valor: 25, aviso: '+25 FLECHAS' },
  { id: 'espada',   celda: 2,  alto: 2.6, efecto: 'oro',      valor: 50, aviso: 'ESPADA DE BRONCE' },
  { id: 'lanza',    celda: 3,  alto: 3.0, efecto: 'guarda',   guarda: 'jabalina', aviso: 'JABALINA GUARDADA' },
  { id: 'antorcha', celda: 4,  alto: 2.6, efecto: 'guarda',   guarda: 'fuego',    aviso: 'FUEGO GRIEGO GUARDADO' },
  { id: 'escudo',   celda: 5,  alto: 2.6, efecto: 'armadura', valor: 30, aviso: '+30 ESCUDO' },
  { id: 'vino',     celda: 6,  alto: 2.4, efecto: 'guarda',   guarda: 'vino',     aviso: 'VINO GUARDADO' },
  { id: 'ambrosia', celda: 7,  alto: 2.1, efecto: 'guarda',   guarda: 'frasco',   aviso: 'FRASCO GUARDADO' },
  { id: 'casco',    celda: 8,  alto: 2.6, efecto: 'armadura', valor: 50, aviso: '+50 CASCO' },
  { id: 'oro',      celda: 9,  alto: 2.0, efecto: 'oro',      valor: 200, aviso: 'ORO' },
  { id: 'llave',    celda: 10, alto: 2.1, efecto: 'oro',      valor: 80, aviso: 'LLAVE' },
  { id: 'estaca',   celda: 11, alto: 2.3, efecto: 'oro',      valor: 40, aviso: 'ESTACA ARDIENTE' }
];

const RADIO_RECOGER = 3.2;

export class Objeto {
  constructor(tipo, textura, pos) {
    this.tipo = tipo;
    this.sprite = new Billboard([textura], 1, tipo.alto, { basico: true });
    this.sprite.grupo.position.copy(pos);
    this.sprite.malla.position.y = tipo.alto / 2 + 0.35;
    this.malla = this.sprite.grupo;
    this.baseY = this.sprite.malla.position.y;
    this.fase = Math.random() * 6.28;
    this.tomado = false;
  }

  get pos() { return this.sprite.grupo.position; }

  sirve(jugador) {
    const t = this.tipo;
    if (t.efecto === 'vida') return jugador.vida < jugador.vidaMax;
    if (t.efecto === 'armadura') return jugador.armadura < jugador.armaduraMax;
    if (t.efecto === 'flechas') return jugador.flechas < jugador.flechasMax;
    if (t.efecto === 'guarda') return jugador.hayHueco(t.guarda);
    return true;
  }

  aplicar(jugador) {
    const t = this.tipo;
    if (t.efecto === 'vida') jugador.vida = Math.min(jugador.vidaMax, jugador.vida + t.valor);
    else if (t.efecto === 'armadura') jugador.armadura = Math.min(jugador.armaduraMax, jugador.armadura + t.valor);
    else if (t.efecto === 'flechas') jugador.flechas = Math.min(jugador.flechasMax, jugador.flechas + t.valor);
    else if (t.efecto === 'guarda') jugador.guardar(t.guarda);
    else jugador.oro += t.valor;
  }

  actualizar(dt, jugador, camara) {
    this.fase += dt * 2.4;
    this.sprite.malla.position.y = this.baseY + Math.sin(this.fase) * 0.16;
    this.sprite.encarar(camara, 0);
    if (this.tomado) return false;
    const dx = jugador.pos.x - this.pos.x;
    const dz = jugador.pos.z - this.pos.z;
    if (dx * dx + dz * dz < RADIO_RECOGER * RADIO_RECOGER && this.sirve(jugador)) {
      this.tomado = true;
      this.aplicar(jugador);
      return true;
    }
    return false;
  }
}
