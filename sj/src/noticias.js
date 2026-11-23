const GENERALES = [
  'El tren ligero rompe récord de pasajeros este mes. La Línea 1 ya conecta Hospital, Catedral y Parque.',
  'Vecinos de la colonia Agave piden más topes. Los automovilistas piden menos.',
  'Pronóstico: posibilidad de granizo por la tarde. Usted ya sabe, guarde el coche.',
  'Las jacarandas florecen antes de tiempo y la Plaza se pinta de morado.',
  'Esta noche juega Jacaranda en casa. Se esperan fuegos artificiales si hay gol.',
  'Inauguran la rueda de la fortuna del parque. Dicen que desde arriba se ve hasta la sierra.',
  'La Arena Jacaranda anuncia función de máscara contra máscara para el domingo.',
  'Aumenta el precio de la tortilla. Doña Lupe dice que ella no sube.',
  'Ola de baches en el Periférico. El Ayuntamiento promete taparlos "pronto".',
  'Tráfico lento en la Calzada del Valle por obras del drenaje.'
];

const EVENTOS = {
  helicoptero: ['Se desploma un helicóptero de la policía en Santa Jacaranda. La tripulación salió con vida; buscan al responsable.', 'Derriban la unidad aérea SJ-07. El comandante Ibarra promete dar con quien lo hizo.'],
  gasolinera: ['¡Explosión en la Gasolinera Jacaranda! Bomberos trabajan en la zona. Se desconoce el responsable.', 'Testigos dicen que las bombas de gasolina volaron una tras otra. La policía busca a un sospechoso.'],
  banco: ['Asaltan el Banco de Occidente: se llevan la bóveda completa. La policía no tiene pistas.', '"Nunca vi algo así", dice el gerente del banco tras el golpe del año.'],
  persecucion: ['Persecución a toda velocidad por las calles de Santa Jacaranda. La policía pide precaución.', 'Un conductor huyó de la policía y dejó varios coches dañados.'],
  arena: ['En la Arena Jacaranda, un aficionado se llevó una buena lana apostándole al ganador.'],
  luchador: ['El Hijo del Jacaranda recupera su máscara de gala y anuncia que defenderá el título.'],
  estrellas: ['Alerta: la policía busca a una persona peligrosa en la zona centro. Evite salir.'],
  serenata: ['Reportan serenata sorpresa en la Plaza de Armas. Hubo aplausos y hasta lágrimas.'],
  tormenta: ['Alerta de Protección Civil: tormenta fuerte sobre Santa Jacaranda. Calles inundadas, maneje con precaución.', 'El viento derriba anuncios y las calles parecen ríos. Protección Civil pide no salir.'],
  joyeria: ['Roban la Joyería Diamante: se llevan las vitrinas completas. La policía revisa las cámaras.', 'Golpe en la Joyería Diamante. "Fueron profesionales", dice el dueño.'],
  aeropuerto: ['Roban un avión de carga del Aeropuerto Internacional en pleno despegue. Jacaranda Cargo niega que llevara algo ilegal.', 'Investigan a Jacaranda Cargo tras el robo de su avión: dentro había oro y documentos de la ciudad.'],
  colonia: ['Balacera entre pandillas en el barrio. Los vecinos dicen que la colonia cambió de dueño.']
};

export class Noticias {
  constructor(juego) { this.j = juego; this.t = 45; this.pendientes = []; this.usadas = new Set(); }

  avisar(tipo) {
    const lista = EVENTOS[tipo]; if (!lista) return;
    const texto = lista[Math.random() * lista.length | 0];
    if (!this.pendientes.includes(texto)) this.pendientes.push(texto);
    if (this.pendientes.length > 4) this.pendientes.shift();
  }

  actualizar(dt) {
    const j = this.j, c = j.jugador.coche;
    const radio = c && j.audio?.estacion > 0 && !j.misiones?.activa;
    if (!radio) return;
    this.t -= dt; if (this.t > 0) return;
    this.t = 70 + Math.random() * 60;
    let texto = this.pendientes.shift();
    if (!texto) { const libres = GENERALES.filter(g => !this.usadas.has(g)); if (!libres.length) this.usadas.clear(); texto = (libres.length ? libres : GENERALES)[Math.random() * (libres.length || GENERALES.length) | 0]; this.usadas.add(texto); }
    j.hud.notificar('info', 'Noticias · Jacaranda Estéreo', texto, 7);
    j.audio?.tono(988, 0.12, 0.05, 'sine'); j.audio?.tono(1319, 0.18, 0.05, 'sine', null, (j.audio?.ctx?.currentTime || 0) + 0.13);
  }
}
