export const RELIQUIAS = [
  { id: 'manzana',  celda: 0, hoja: 'reliquias',  nombre: 'MANZANA DE LA DISCORDIA', precio: 110,
    desc: 'Los enemigos se pelean entre ellos 12 segundos' },
  { id: 'casco',    celda: 1, hoja: 'reliquias',  nombre: 'CASCO DE HADES', precio: 100,
    desc: 'Te vuelves invisible 8 segundos: dejan de verte' },
  { id: 'medusa',   celda: 2, hoja: 'reliquias',  nombre: 'CABEZA DE MEDUSA', precio: 140,
    desc: 'Petrifica 7 segundos a todo el que te este mirando' },
  { id: 'cadenas',  celda: 3, hoja: 'reliquias',  nombre: 'CADENAS DE HEFESTO', precio: 90,
    desc: 'Clava al suelo a los que tengas cerca' },
  { id: 'anfora',   celda: 4, hoja: 'reliquias',  nombre: 'ANFORA DE EOLO', precio: 80,
    desc: 'Un viento que empuja lejos a todo lo que te rodea' },
  { id: 'lira',     celda: 5, hoja: 'reliquias',  nombre: 'LIRA DE ORFEO', precio: 95,
    desc: 'Duerme 8 segundos a los enemigos cercanos' },
  { id: 'espejo',   celda: 6, hoja: 'reliquias',  nombre: 'ESPEJO DE PERSEO', precio: 105,
    desc: 'Durante 12 segundos las lanzas rebotan y se les devuelven' },
  { id: 'vellocino',celda: 7, hoja: 'reliquias',  nombre: 'VELLOCINO DE ORO', precio: 120,
    desc: 'Recuperas vida poco a poco durante 15 segundos' },
  { id: 'sandalias',celda: 8, hoja: 'reliquias',  nombre: 'SANDALIAS ALADAS', precio: 70,
    desc: 'Un impulso instantaneo para salir de un cerco' },
  { id: 'ojo',      celda: 9, hoja: 'reliquias',  nombre: 'OJO DE LAS GREAS', precio: 85,
    desc: 'Ves a todos a traves de los muros 20 segundos' },
  { id: 'piedra',   celda: 10, hoja: 'reliquias', nombre: 'PIEDRA DE SISIFO', precio: 115,
    desc: 'La echas a rodar y aplasta lo que se le atraviese' },
  { id: 'dracma',   celda: 11, hoja: 'reliquias', nombre: 'DRACMA DE CARONTE', precio: 180,
    desc: 'Si mueres, revives una vez con media vida' }
];

export const porReliquia = id => RELIQUIAS.find(r => r.id === id);
