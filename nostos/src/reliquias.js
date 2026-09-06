export const RELIQUIAS = [
  { id: 'manzana',  celda: 0, hoja: 'reliquias',  nombre: 'MANZANA DE LA DISCORDIA', precio: 110,
    desc: 'Los enemigos se pelean entre ellos 12 segundos' },
  { id: 'espejo',   celda: 6, hoja: 'reliquias',  nombre: 'ESPEJO DE PERSEO', precio: 105,
    desc: 'Durante 12 segundos las lanzas rebotan y se les devuelven' },
  { id: 'vellocino',celda: 7, hoja: 'reliquias',  nombre: 'VELLOCINO DE ORO', precio: 120,
    desc: 'Recuperas vida poco a poco durante 15 segundos' },
  { id: 'sandalias',celda: 8, hoja: 'reliquias',  nombre: 'SANDALIAS ALADAS', precio: 70,
    desc: 'Un impulso instantaneo para salir de un cerco' },
  { id: 'ojo',      celda: 9, hoja: 'reliquias',  nombre: 'OJO DE LAS GREAS', precio: 85,
    desc: 'Ves a todos a traves de los muros 20 segundos' },
  { id: 'eolo',     celda: 4, hoja: 'reliquias',  nombre: 'ODRE DE LOS VIENTOS', precio: 90,
    desc: 'Sueltas los vientos y te llevan de golpe a otro rincon del palacio' },
  { id: 'dracma',   celda: 11, hoja: 'reliquias', nombre: 'DRACMA DE CARONTE', precio: 180,
    desc: 'Si mueres, revives una vez con media vida' }
];

export const porReliquia = id => RELIQUIAS.find(r => r.id === id);
