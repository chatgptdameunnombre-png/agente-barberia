const LLAVE = 'nostos.misiones';

export const ARCOS = [
  { id: 'fontanero', hoja: 'arcoFontanero', nombre: 'ARCO DE FONTANERO',
    mision: 'muros', meta: 0, gratis: true, escala: 0.95,
    pista: 'Es tuyo desde el principio' },
  { id: 'sierra', hoja: 'arcoSierra', nombre: 'ARCO DE LA SIERRA',
    mision: 'bajas', meta: 300,
    pista: 'Acumula 300 bajas entre todas tus partidas' },
  { id: 'portal', hoja: 'arcoPortal', nombre: 'ARCO DEL PORTAL',
    mision: 'portales', meta: 50,
    pista: 'Cruza 50 portales con el Cuerno de Hermes' },
  { id: 'fantasma', hoja: 'arcoFantasma', nombre: 'ARCO CAZAFANTASMAS',
    mision: 'otroLado', meta: 5,
    pista: 'Sobrevive 5 rondas seguidas dentro del Otro Lado' },
  { id: 'sable', hoja: 'arcoSable', nombre: 'ARCO DE SABLE',
    mision: 'victorias', meta: 1,
    pista: 'Gana la partida: mata a Polifemo' },
  { id: 'abismo', hoja: 'arcoAbismo', nombre: 'ARCO DEL ABISMO',
    mision: 'bajasOtroLado', meta: 150,
    pista: 'Mata 150 enemigos dentro del Otro Lado' }
];

const VACIO = { muros: 0, bajas: 0, portales: 0, otroLado: 0, victorias: 0, bajasOtroLado: 0, puesto: null };

export class Misiones {
  constructor(alGanar) {
    this.alGanar = alGanar || (() => {});
    this.datos = this._leer();
    this.rachaOtroLado = 0;
  }

  _leer() {
    try {
      return { ...VACIO, ...JSON.parse(localStorage.getItem(LLAVE) || '{}') };
    } catch (e) {
      return { ...VACIO };
    }
  }

  _guardar() {
    try { localStorage.setItem(LLAVE, JSON.stringify(this.datos)); } catch (e) {}
  }

  get(clave) { return this.datos[clave] || 0; }

  ganado(id) {
    const a = ARCOS.find(x => x.id === id);
    if (!a) return false;
    return a.gratis || this.get(a.mision) >= a.meta;
  }

  sumar(clave, cuanto = 1) {
    if (!(clave in this.datos)) return;
    const antes = this.datos[clave];
    this.datos[clave] = antes + cuanto;
    this._guardar();
    for (const a of ARCOS) {
      if (a.mision !== clave) continue;
      if (antes < a.meta && this.datos[clave] >= a.meta) this.alGanar(a);
    }
  }

  poner(clave, valor) {
    if (!(clave in this.datos)) return;
    if (valor <= this.datos[clave]) return;
    const antes = this.datos[clave];
    this.datos[clave] = valor;
    this._guardar();
    for (const a of ARCOS) {
      if (a.mision !== clave) continue;
      if (antes < a.meta && valor >= a.meta) this.alGanar(a);
    }
  }

  rondaDentro(dentro) {
    if (!dentro) { this.rachaOtroLado = 0; return; }
    this.rachaOtroLado++;
    this.poner('otroLado', this.rachaOtroLado);
  }

  get arcoPuesto() { return this.datos.puesto; }

  ponerArco(id) {
    this.datos.puesto = id && this.ganado(id) ? id : null;
    this._guardar();
    return this.datos.puesto;
  }

  progreso(a) {
    if (a.gratis) return { hecho: 1, meta: 1, listo: true, gratis: true };
    return { hecho: Math.min(this.get(a.mision), a.meta), meta: a.meta, listo: this.ganado(a.id) };
  }
}
