export const TINTES = [
  { id: 'bronce', nombre: 'BRONCE', filtro: 'none', muestra: '#b48a3a' },
  { id: 'plata',  nombre: 'PLATA',  filtro: 'saturate(.15) brightness(1.25)', muestra: '#c9ccd4' },
  { id: 'oro',    nombre: 'ORO',    filtro: 'saturate(1.7) brightness(1.2) hue-rotate(-12deg)', muestra: '#e8c14a' },
  { id: 'sangre', nombre: 'SANGRE', filtro: 'hue-rotate(-38deg) saturate(1.5)', muestra: '#8f2118' },
  { id: 'egeo',   nombre: 'EGEO',   filtro: 'hue-rotate(150deg) saturate(1.2)', muestra: '#2d7396' },
  { id: 'hades',  nombre: 'HADES',  filtro: 'grayscale(.85) brightness(.62)', muestra: '#4a4640' }
];

export const COLORES = [
  { id: 'dorado', nombre: 'DORADO', valor: '#e8c14a' },
  { id: 'hueso',  nombre: 'HUESO',  valor: '#f2e2b0' },
  { id: 'olivo',  nombre: 'OLIVO',  valor: '#8c9c3a' },
  { id: 'egeo',   nombre: 'EGEO',   valor: '#4aa9d4' },
  { id: 'sangre', nombre: 'SANGRE', valor: '#d4452d' },
  { id: 'violeta',nombre: 'VIOLETA',valor: '#a97fd4' }
];

export const MIRAS = [
  { id: 'cruz',   nombre: 'CRUZ' },
  { id: 'punto',  nombre: 'PUNTO' },
  { id: 'anillo', nombre: 'ANILLO' },
  { id: 'nada',   nombre: 'SIN MIRA' }
];

const PREDET = { tinte: 'bronce', color: 'dorado', mira: 'cruz' };

export function leer() {
  try {
    return { ...PREDET, ...JSON.parse(localStorage.getItem('nostos.estilo') || '{}') };
  } catch (e) {
    return { ...PREDET };
  }
}

export function guardar(estilo) {
  try {
    localStorage.setItem('nostos.estilo', JSON.stringify(estilo));
  } catch (e) {}
}

export function aplicar(estilo, arma) {
  const t = TINTES.find(x => x.id === estilo.tinte) || TINTES[0];
  if (arma) arma.style.filter = t.filtro;
  const cara = document.getElementById('cara');
  if (cara) cara.style.filter = t.filtro;
  const c = COLORES.find(x => x.id === estilo.color) || COLORES[0];
  document.documentElement.style.setProperty('--tono', c.valor);
  document.body.dataset.mira = estilo.mira;
}
