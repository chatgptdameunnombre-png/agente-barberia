const az = a => a[Math.random() * a.length | 0];

export const USUARIOS = [
  { id: 'lupita', nombre: 'Lupita Ramírez', usuario: '@lupitaramirez', avatar: 1, estilo: 'normal' },
  { id: 'kevin', nombre: 'Kevin', usuario: '@kevin_sj', avatar: 0, estilo: 'minus' },
  { id: 'don_beto', nombre: 'Roberto Gómez', usuario: '@betogomez61', avatar: 15, estilo: 'senor' },
  { id: 'abuela', nombre: 'Doña Chela', usuario: '@chela.flores', avatar: 2, estilo: 'abuela' },
  { id: 'taquero', nombre: 'Tacos El Primo', usuario: '@tacoselprimo', avatar: 3, estilo: 'negocio' },
  { id: 'estudiante', nombre: 'Fer Castillo', usuario: '@ferr.castillo', avatar: 4, estilo: 'minus' },
  { id: 'motero', nombre: 'Iván Moto', usuario: '@ivan_en_moto', avatar: 5, estilo: 'compa' },
  { id: 'mama', nombre: 'Karla Ortiz', usuario: '@karlaortizm', avatar: 6, estilo: 'normal' },
  { id: 'aficionado', nombre: 'Chuy Morado', usuario: '@chuy_morado10', avatar: 7, estilo: 'compa' },
  { id: 'fan', nombre: 'Andrea', usuario: '@andreeeaa', avatar: 8, estilo: 'exagerada' },
  { id: 'firulais', nombre: 'Firulais Oficial', usuario: '@firulais_sj', avatar: 9, estilo: 'mascota' },
  { id: 'atardeceres', nombre: 'Atardeceres SJ', usuario: '@atardeceres.sj', avatar: 10, estilo: 'pagina' },
  { id: 'taxista', nombre: 'Don Pancho Taxi', usuario: '@pancho_taxi', avatar: 11, estilo: 'senor' },
  { id: 'maestra', nombre: 'Maestra Rocío', usuario: '@profe.rocio', avatar: 12, estilo: 'formal' },
  { id: 'skater', nombre: 'Santi', usuario: '@santi.skt', avatar: 13, estilo: 'minus' },
  { id: 'pareja', nombre: 'Dani y Memo', usuario: '@danimemo', avatar: 14, estilo: 'normal' },
  { id: 'noticias', nombre: 'Noticias Jacaranda', usuario: '@noticiasjacaranda', avatar: 10, logo: ['NJ', '#c23a3a'], estilo: 'noticia', oficial: true },
  { id: 'trafico', nombre: 'Tráfico SJ', usuario: '@traficosj', avatar: 11, logo: ['TSJ', '#d88a1a'], estilo: 'noticia', oficial: true }
];

const COTIDIANO = [
  ['¿Alguien sabe si ya abrieron la birria de la esquina de {c}? Ando con un hambre', 'normal'],
  ['otra vez el bache de {c} me dejó sin rin. ya van tres', 'minus'],
  ['Se vende sala de tres piezas, poco uso, entrega en {z}. Mensaje directo.', 'senor'],
  ['Hoy hice pozole para toda la familia y nadie vino. Me lo voy a comer yo sola.', 'abuela'],
  ['HOY 2x1 en tacos de pastor después de las 8. Los esperamos en {c}.', 'negocio'],
  ['examen de cálculo mañana y yo viendo videos de perritos', 'minus'],
  ['Rodada nocturna este viernes, salimos de {z} a las 10. Casco obligatorio compas.', 'compa'],
  ['Mi hijo de 5 años me preguntó por qué la luna nos sigue. No supe qué contestarle.', 'normal'],
  ['Si el Morado no gana el domingo me retiro de las redes. Ahora sí es en serio.', 'compa'],
  ['NO PUEDE SER el concierto se pospuso OTRA VEZ estoy llorando', 'exagerada'],
  ['Hoy me dieron premio por portarme bien. Fue mentira, me lo robé.', 'mascota'],
  ['El cielo de hoy sobre {z}. Comparte si tú también lo viste.', 'pagina'],
  ['Joven, si usted dejó un paraguas negro en mi taxi ayer en {c}, aquí lo tengo.', 'senor'],
  ['Recuerden: mañana no hay clases por junta de maestros. Que descansen.', 'formal'],
  ['me caí en el skatepark frente a como 20 personas. día normal', 'minus'],
  ['Un año juntos y seguimos peleando por quién escoge la película.', 'normal'],
  ['Se perdió perrito café con collar rojo por {z}. Responde a "Canelo". Hay recompensa.', 'normal'],
  ['quién más tiene la canción de la radio pegada desde la mañana', 'minus'],
  ['El agua de horchata de la plaza ya está a 30 pesos. Así no se puede.', 'senor'],
  ['Mis nietos me enseñaron a usar esto. Hola a todos.', 'abuela'],
  ['Corte de agua en {z} de 9 a 3. Llenen sus cubetas.', 'noticia'],
  ['Cierre parcial en {c} por obras. Tomen alternativas.', 'noticia'],
  ['ya llovió y ya se inundó la esquina de siempre', 'minus'],
  ['Buscamos ayudante de cocina, turno de noche. Pregunten en {c}.', 'negocio'],
  ['Las jacarandas de {z} están preciosas esta semana.', 'pagina'],
  ['alguien que me explique por qué el camión pasa lleno SIEMPRE', 'exagerada'],
  ['Domingo de carne asada con los compas. Así sí.', 'compa'],
  ['Hoy ladré a un señor de bigote por 20 minutos. Era un buzón.', 'mascota']
];

const EVENTOS = {
  robo: [['Acaban de asaltar {d}. Mi prima trabaja ahí, gracias a Dios está bien.', 'normal'], ['otro asalto en {d}… ya ni para comprar papitas se puede', 'minus'], ['Reportan robo en {d}, en {z}. La policía va en camino.', 'noticia'], ['Vi salir corriendo a uno de {d} con una bolsa, iba volando', 'compa']],
  persecucion: [['Tremenda persecución por {c}, iban como cinco patrullas', 'normal'], ['helicóptero encima de {z} desde hace rato alguien sabe qué pasa', 'minus'], ['Se reporta persecución en {c}. Eviten la zona.', 'noticia'], ['Casi me avientan el coche en {c}, iba la policía detrás de un loco', 'senor'], ['ESTOY TEMBLANDO acaban de pasar a mil por mi casa', 'exagerada']],
  salto: [['Acabo de ver un coche VOLAR sobre {c}. No me lo van a creer.', 'normal'], ['alguien grabó al loco que saltó la rampa de {c}? necesito ese video', 'minus'], ['Eso sí es manejar. Saltó la rampa de {c} como si nada.', 'compa']],
  explosion: [['Se escuchó un estruendo enorme por {c}. ¿Alguien sabe qué fue?', 'normal'], ['Se reporta un incendio de vehículo en {z}. Bomberos en camino.', 'noticia'], ['se cimbró todo mi depa, qué susto', 'minus']],
  mision: [['Dicen que el taller de Don Chuy anda muy movido últimamente.', 'senor'], ['¿Desde cuándo el taller de Don Chuy tiene tantos clientes de noche?', 'normal']],
  taxi: [['Pedí taxi y el chofer manejaba como piloto de carreras. Llegué antes de salir.', 'normal'], ['El taxista más rápido de Santa Jacaranda. Diez de diez.', 'compa']],
  flor: [['¿Alguien más vio una jacaranda dorada brillando en {z}? Juraría que la vi.', 'exagerada'], ['Lo de las jacarandas doradas es real. Mi tío vio una en {z}.', 'senor']],
  camion: [['¡Asaltaron un camión de valores en {c}! Había billetes por todos lados.', 'normal'], ['Se reporta asalto a camión de valores en {z}.', 'noticia']],
  arresto: [['Agarraron a uno en {z}, ya iba con las esposas puestas.', 'normal']]
};

const COMENTARIOS = {
  normal: ['Qué miedo, cuídense mucho', 'Yo también lo vi', 'No manches, qué fuerte', 'Jajaja ni modo', 'Necesito más detalles', 'Gracias por avisar'],
  minus: ['jajaja no manches', 'literal yo', 'sí es cierto', 'alguien más', 'ok pero por qué', 'tal cual'],
  senor: ['Así es, joven.', 'Esto antes no pasaba.', 'Qué barbaridad.', 'Muy cierto.'],
  abuela: ['Dios los bendiga mijitos', 'Cuídense mucho', 'Qué bonito', 'Mi nieto dice que eso es falso'],
  compa: ['simón compa', 'puro Santa Jacaranda', 'eso mero', 'ahí andamos'],
  exagerada: ['NO PUEDE SER', 'me muero', 'ESTOY LLORANDO', 'esto es demasiado para mí'],
  formal: ['Muy buena información, gracias.', 'Les recomiendo tener cuidado.'],
  negocio: ['Los esperamos', 'Pásenle'],
  mascota: ['Guau.', 'Yo no fui.'],
  pagina: ['Comparte si estás de acuerdo.'],
  noticia: ['Seguiremos informando.']
};

const PROPIAS = {
  foto: ['Una vuelta por {z}', 'La vista desde {c}', 'Domingo tranquilo en {z}', 'Aquí andamos', 'Santa Jacaranda nunca falla'],
  responder: ['Jajaja así mero', 'Cuídense', 'Yo estuve ahí', 'No era yo eh', 'Qué buena foto']
};

const humanizar = (t, estilo) => {
  if (estilo === 'minus' || estilo === 'compa') t = t.toLowerCase().replace(/[¿¡]/g, '');
  if (estilo === 'minus' && Math.random() < 0.3) t = t.replace(/ que /, ' q ').replace(/porque/, 'xq');
  if (estilo === 'exagerada' && Math.random() < 0.5) t = t.toUpperCase();
  if (Math.random() < 0.08) { const i = 3 + Math.random() * (t.length - 6) | 0; t = t.slice(0, i) + t[i + 1] + t[i] + t.slice(i + 2); }
  return t;
};

export class Redes {
  constructor(juego) {
    this.j = juego;
    this.posts = [];
    this.mensajes = [];
    this.ultimo = {};
    this.sinLeer = 0;
    this.seguidores = 12;
    this.sigo = new Set(['noticias', 'trafico']);
    this.reloj = 8;
    this.patrocinios = [];
    this.temas = ['#SantaJacaranda', '#Jacarandas', '#Morado', '#Tráfico', '#Birria'];
    for (let i = 0; i < 8; i++) this.ambiente(true);
  }

  usuario(id) { return USUARIOS.find(u => u.id === id); }
  porEstilo(estilo) { const l = USUARIOS.filter(u => u.estilo === estilo); return l.length ? az(l) : az(USUARIOS); }

  texto(t, dato) {
    const j = this.j, p = j.jugador.posicion;
    return t.replace('{d}', dato || 'una tienda').replace('{c}', j.calleDe(p.x, p.z)).replace('{z}', j.zonaDe(p.x, p.z));
  }

  crear(u, texto, extra = {}) {
    const red = extra.red || (extra.foto || Math.random() < 0.6 ? 'jacagram' : 'chisme');
    const post = { id: Math.random().toString(36).slice(2), red, autor: u.id, texto, likes: extra.likes ?? (u.oficial ? 40 + Math.random() * 400 | 0 : Math.random() * 30 | 0), meta: 0, foto: extra.foto || null, hora: this.j.ambiente.texto, propio: !!extra.propio, comentarios: [], gusta: false, reenvios: Math.random() * 6 | 0 };
    post.meta = post.likes + (extra.propio ? this.seguidores * (0.08 + Math.random() * 0.2) | 0 : Math.random() * (u.oficial ? 900 : 120) | 0);
    const nc = extra.propio ? 0 : Math.random() * 4 | 0;
    for (let k = 0; k < nc; k++) this.comentarioAuto(post);
    if (red === 'jacagram' && !post.foto && !u.oficial) (this.j.fotosPendientes || (this.j.fotosPendientes = [])).push(url => { post.foto = url; this.j.telefono?.repintarSiAbierto(); });
    this.posts.unshift(post);
    if (this.posts.length > 60) this.posts.pop();
    this.j.telefono?.repintarSiAbierto();
    return post;
  }

  comentarioAuto(post) {
    const u = az(USUARIOS.filter(x => x.id !== post.autor));
    post.comentarios.push({ autor: u.id, texto: humanizar(az(COMENTARIOS[u.estilo] || COMENTARIOS.normal), u.estilo) });
  }

  ambiente(silencio) {
    const [t, estilo] = az(COTIDIANO);
    const u = this.porEstilo(estilo);
    this.crear(u, humanizar(this.texto(t), estilo));
    if (!silencio) this.sinLeer++;
  }

  publicar(tipo, dato, extra = {}) {
    const j = this.j;
    const ahora = performance.now() / 1000;
    if (tipo === 'foto' && extra.propio) {
      const yo = this.yo();
      const post = this.crear(yo, this.texto(az(PROPIAS.foto)), { foto: extra.foto, propio: true, red: 'jacagram', likes: 0 });
      let viral = 1;
      if (j.policia.estrellas > 0) viral += 2;
      if (j.jugador.coche?.enAire) viral += 3;
      post.meta = Math.round((8 + this.seguidores * 0.15) * viral * (0.6 + Math.random()));
      post.viral = viral;
      return;
    }
    if (!extra.forzar && this.ultimo[tipo] && ahora - this.ultimo[tipo] < 40) return;
    this.ultimo[tipo] = ahora;
    const lista = EVENTOS[tipo];
    if (!lista) return;
    const n = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const [t, estilo] = az(lista);
      const u = this.porEstilo(estilo);
      const post = this.crear(u, humanizar(this.texto(t, dato), estilo));
      if (k === 0 && ahora - (this.ultimaNotif || -99) > 14) { this.ultimaNotif = ahora; j.hud.notificar('gps', (post.red === 'chisme' ? 'Chisme · ' : 'JacaGram · ') + u.usuario, post.texto, 3.8); j.audio.notif?.(); }
    }
    this.sinLeer += n;
    if (['persecucion', 'salto', 'robo', 'camion'].includes(tipo)) { this.seguidores += 3 + (Math.random() * 10 | 0); this.temaDe(tipo); }
  }

  temaDe(tipo) {
    const t = { persecucion: '#Persecución', salto: '#SaltoÚnico', robo: '#Asalto', camion: '#CamiónDeValores' }[tipo];
    this.temas = [t, ...this.temas.filter(x => x !== t)].slice(0, 6);
  }

  yo() { const n = this.j.jugador.personaje; return { id: 'yo', nombre: n, usuario: '@' + n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '.sj', avatar: n === 'Lucía' ? 'lucia' : 'matias', estilo: 'normal' }; }
  autorDe(post) { return post.autor === 'yo' ? this.yo() : this.usuario(post.autor); }

  meGusta(id) {
    const p = this.posts.find(x => x.id === id); if (!p) return;
    p.gusta = !p.gusta; p.likes += p.gusta ? 1 : -1;
    if (p.gusta && !p.propio && Math.random() < 0.25) { this.seguidores++; }
  }

  comentar(id, texto) {
    const p = this.posts.find(x => x.id === id); if (!p) return;
    p.comentarios.push({ autor: 'yo', texto });
    if (Math.random() < 0.6) setTimeout(() => { const u = this.autorDe(p); if (u && p.autor !== 'yo') { p.comentarios.push({ autor: p.autor, texto: humanizar(az(COMENTARIOS[u.estilo] || COMENTARIOS.normal), u.estilo) }); this.j.telefono?.repintarSiAbierto(); } }, 2500);
    this.seguidores += Math.random() < 0.4 ? 1 : 0;
  }

  reenviar(id) { const p = this.posts.find(x => x.id === id); if (!p || p.reenviado) return; p.reenviado = true; p.reenvios++; this.seguidores += 1 + (Math.random() * 3 | 0); }

  seguir(uid) { if (this.sigo.has(uid)) this.sigo.delete(uid); else { this.sigo.add(uid); if (Math.random() < 0.5) this.seguidores++; } }

  mensaje(de, texto, accion) { this.mensajes.unshift({ de, texto, accion, hora: this.j.ambiente.texto, leido: false }); this.sinLeer++; this.j.hud.notificar('gps', 'Mensaje de ' + de, texto, 4); this.j.audio.notif?.(); }

  aceptar(i) {
    const m = this.mensajes[i]; if (!m || !m.accion || m.aceptado) return;
    m.aceptado = true;
    if (m.accion.tipo === 'patrocinio') { this.patrocinios.push(m.accion); this.j.hud.grande('PATROCINIO', m.accion.marca + ' te paga $' + m.accion.pago.toLocaleString('es-MX') + ' cada día', 2.8, 'exito'); }
    if (m.accion.tipo === 'reto') { this.reto = m.accion; this.j.hud.notificar('mision', 'Reto aceptado', m.accion.desc, 5); }
  }

  actualizar(dt) {
    const j = this.j;
    for (const p of this.posts) if (p.likes < p.meta) {
      const antes = p.likes;
      p.likes += Math.max(1, Math.ceil((p.meta - p.likes) * dt * 0.06));
      if (p.propio) { this.seguidores += Math.max(0, Math.floor(p.likes / 6) - Math.floor(antes / 6)); if (Math.random() < dt * 0.15) this.comentarioAuto(p); }
    }
    this.reloj -= dt;
    if (this.reloj <= 0) { this.reloj = 35 + Math.random() * 45; this.ambiente(); }
    const umbrales = [[150, 'Refresco Jacaranda', 300], [600, 'Llantas El Rayo', 700], [2000, 'JacaMóvil', 1500], [6000, 'Tortas Ahogadas El Güero', 3000]];
    for (const [n, marca, pago] of umbrales) {
      if (this.seguidores >= n && !this.ofrecido?.[marca]) {
        (this.ofrecido || (this.ofrecido = {}))[marca] = true;
        this.mensaje(marca, `Hola, nos encanta tu contenido. ¿Quieres ser imagen de ${marca}? Te pagamos $${pago.toLocaleString('es-MX')} al día.`, { tipo: 'patrocinio', marca, pago });
      }
    }
    if (!this.retoOfrecido && this.seguidores >= 40) {
      this.retoOfrecido = true;
      const L = j.ciudad.lugares.catedral;
      this.mensaje('@tapatio_viral', 'Te reto: súbete una foto frente a la Catedral. Si lo haces te comparto con todos mis seguidores.', { tipo: 'reto', desc: 'Toma una foto cerca de la Catedral (cámara del teléfono).', x: L.x, z: L.z, premio: 120 });
    }
  }

  fotoTomada() {
    const j = this.j, r = this.reto, p = j.jugador.posicion;
    if (r && !r.hecho && Math.hypot(p.x - r.x, p.z - r.z) < 45) {
      r.hecho = true; this.seguidores += r.premio;
      j.hud.grande('RETO CUMPLIDO', '+' + r.premio + ' seguidores', 2.6, 'exito');
    }
  }

  pagoDiario() {
    let t = 0;
    for (const p of this.patrocinios) t += p.pago;
    return t;
  }
}
