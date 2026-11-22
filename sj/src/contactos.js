import { linea, esCalle, BLOQUES, PASO } from './ciudad.js?v=202611212313';
import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=202611212313';
import { Peaton } from './peatones.js?v=202611212313';

const ix = i => linea(i);
const libre = (j, x, z) => {
  for (let r = 0; r < 16; r += 1) for (let a = 0; a < 12; a++) {
    const px = x + Math.cos(a * Math.PI / 6) * r, pz = z + Math.sin(a * Math.PI / 6) * r;
    if (!j.mundo.dentro(px, 1, pz) && !esCalle(px, pz)) return { x: px, z: pz };
  }
  return { x, z };
};
const pie = j => j.jugador.coche ? j.jugador.coche.pos : j.jugador.pos;
const matones = (m, x, z, n, armas = ['pistola'], estado = 'quieto') => {
  const l = [];
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2, p = libre(m.j, x + Math.cos(a) * 5, z + Math.sin(a) * 5);
    const g = new Peaton(m.j, { tipo: 'matón', x: p.x, z: p.z, estado, arma: armas[k % armas.length] });
    g.yaw = Math.random() * 6; m.j.peatones.push(g); m.extra.push(g); l.push(g);
  }
  return l;
};
const coche = (m, tipo, color, p, ia) => {
  const jp = m.j.jugador.posicion;
  p = p || puntoCalleAleatorio(jp, 25, 320, 80) || { x: jp.x + 24, z: jp.z, yaw: 0 };
  const c = new Coche(m.j, tipo, color, p.x, p.z, p.yaw || 0);
  if (ia) { c.conductor = 'ia'; c.id = 900 + (Math.random() * 99 | 0); }
  c.marcado = true; m.j.coches.push(c); m.extra.push(c);
  return c;
};
const despertar = (m, lista, d = 38) => { const jp = m.j.jugador.posicion; for (const g of lista) if (!g.muerto && g.estado === 'quieto' && g.pos.distanceTo(jp) < d) g.estado = 'atacar'; };
const llegar = (m, i, enCoche) => { const j = m.j; if (enCoche === true && !j.jugador.coche) return false; if (enCoche === false && j.jugador.coche) return false; return m.dentro(i, pie(j), 1.5); };

export const CONTACTOS = {
  nacho: {
    nombre: 'Tío Nacho', letra: 'N', modelo: 'nacho', color: '#f0a03a', zona: 'Mercado de San Jacinto', requisito: 0,
    apariencia: { camisa: '#f2efe6', pantalon: '#4a3a2a', sombrero: true, colorSombrero: '#e8dcc0', complexion: 1.16, edad: 'mayor', barba: 'bigote', mangaCorta: true, mujer: false, peloLargo: false },
    lugar: j => libre(j, j.ciudad.lugares.mercado.x + 6, j.ciudad.lugares.mercado.z + 2),
    lista: [
      {
        titulo: 'TACOS PARA LLEVAR', premio: 700,
        inicio(m) {
          const j = m.j, L = j.ciudad.lugares.mercado;
          m.dialogo([['Tío Nacho', 'Mijo, se me enfermó el repartidor y tengo tres pedidos esperando.'], ['Tío Nacho', 'Ahí está la moto. Llévalos calientitos, que la gente de aquí es exigente.']]);
          const pt = puntoCalleAleatorio(L, 8, 30) || { x: L.x + 10, z: L.z + 10, yaw: 0 };
          m.moto = coche(m, 'moto', '#c8402a', pt); m.objetivos = [m.moto];
          m.entregas = [0, 1, 2].map(() => puntoCalleAleatorio(L, 90 + Math.random() * 60, 230)).filter(Boolean);
          m.objetivo('Súbete a la <b>moto</b> del Tío Nacho.');
        },
        actualizar(m) {
          const j = m.j;
          if (m.moto.quemado) return 'falla:La moto quedó destruida.';
          if (m.paso === 0 && j.jugador.coche === m.moto) { m.paso = 1; m.objetivos = []; m.reloj = 150; m.sig = 0; m.marcar(1, m.entregas[0].x, m.entregas[0].z, 3, 2.5, '#f0a03a'); }
          if (m.paso === 1) {
            m.objetivo(`Entrega los pedidos: <b>${m.sig} de ${m.entregas.length}</b>.`);
            if (j.jugador.coche === m.moto && m.dentro(1, m.moto.pos, 1) && m.moto.vel < 6) {
              m.sig++; j.audio.dinero(); j.hud.popDinero(40); j.jugador.dinero += 40;
              if (m.sig >= m.entregas.length) return 'ok';
              const q = m.entregas[m.sig]; m.marcar(1, q.x, q.z, 3, 2.5, '#f0a03a');
            }
          }
        }
      },
      {
        titulo: 'LOS DEL PISO', premio: 1400,
        inicio(m) {
          const j = m.j, T = j.ciudad.lugares.tianguis;
          j.jugador.darArma('bate', 0);
          m.dialogo([['Tío Nacho', 'Unos vivos andan cobrando piso en el tianguis. A mis compadres ya les quitaron la venta del día.'], ['Tío Nacho', 'Llévate mi bate. Que entiendan que ese tianguis tiene quien lo cuide.']]);
          m.malos = matones(m, T.x, T.z, 4, ['puno', 'pistola', 'puno', 'cuchillo']);
          m.objetivos = [...m.malos];
          m.objetivo('Ve al <b>Tianguis</b> y saca a los <b>4 extorsionadores</b>.');
        },
        actualizar(m) {
          despertar(m, m.malos);
          m.objetivos = m.malos.filter(g => !g.muerto);
          if (!m.objetivos.length) return 'ok';
          m.objetivo(`Extorsionadores restantes: <b>${m.objetivos.length}</b>.`);
        },
        fin(m) { m.j.hud.dialogos([['Tío Nacho', 'Ya se corrió la voz. Gracias, mijo, aquí siempre tienes un taco.']]); }
      },
      {
        titulo: 'EL CAMIÓN DE FRUTA', premio: 2400,
        inicio(m) {
          const j = m.j, L = j.ciudad.lugares.mercado;
          m.dialogo([['Tío Nacho', '¡Se llevaron la camioneta con toda la fruta de la semana!'], ['Tío Nacho', 'Alcánzala, hazla que se detenga y tráemela. Sin la fruta no abro mañana.']]);
          const pt = puntoCalleAleatorio(j.jugador.posicion, 90, 160) || { x: L.x + 60, z: L.z, yaw: 0 };
          m.cam = coche(m, 'camioneta', '#3a7a3a', pt, true); m.cam.panico = 999;
          m.objetivos = [m.cam];
          m.objetivo('Alcanza la <b>camioneta verde</b> y chócala hasta que se detenga.');
        },
        actualizar(m) {
          const j = m.j, c = m.cam;
          if (c.quemado) return 'falla:La fruta se quemó con todo y camioneta.';
          if (m.paso === 0) {
            c.panico = 999;
            if (c.pos.distanceTo(j.jugador.posicion) > 320) return 'falla:Se te escapó la camioneta.';
            if (c.salud < c.t.salud * 0.55) { m.paso = 1; c.conductor = null; c.panico = 0; m.dialogo([['Ladrón', '¡Ya, ya! ¡Quédese con su fruta!']]); m.objetivo('Súbete a la <b>camioneta</b> y llévala al <b>Mercado</b>.'); }
            else m.objetivo(`Daña la camioneta: <b>${Math.round((1 - c.salud / c.t.salud) / 0.45 * 100)}%</b>.`);
          } else if (m.paso === 1 && j.jugador.coche === c) {
            m.paso = 2; m.objetivos = []; const L = j.ciudad.lugares.mercado; m.marcar(1, L.x, L.z + 6, 4, 3, '#f0a03a');
          } else if (m.paso === 2 && j.jugador.coche === c && m.dentro(1, c.pos)) return 'ok';
        }
      }
    ]
  },
  valeria: {
    nombre: 'Valeria Luna', letra: 'V', modelo: 'valeria', color: '#b46bff', zona: 'Centro Histórico', requisito: 0,
    apariencia: { mujer: true, peloLargo: true, pelo: '#2a1810', camisa: '#b46bff', pantalon: '#1c1c22', aretes: true, collar: true, mangaCorta: true, sombrero: null },
    lugar: j => libre(j, j.ciudad.lugares.plaza.x + 4, j.ciudad.lugares.plaza.z + 4),
    lista: [
      {
        titulo: 'CONTENIDO VIRAL', premio: 800,
        inicio(m) {
          m.dialogo([['Valeria Luna', '¡Hola! Necesito un video que reviente JacaGram. Algo loco.'], ['Valeria Luna', 'Haz un salto de más de 25 metros en coche y yo lo grabo desde aquí. Tienes dos minutos.']]);
          m.reloj = 120; m.objetivo('Haz un <b>salto de 25 m</b> en coche. Busca las rampas amarillas del mapa.');
          m.mejor = 0;
        },
        actualizar(m) {
          const j = m.j, c = j.jugador.coche;
          if (c && c.enAire && !m.aire) m.aire = { x: c.pos.x, z: c.pos.z };
          if (m.aire && c && !c.enAire) { const d = Math.hypot(c.pos.x - m.aire.x, c.pos.z - m.aire.z); m.aire = null; m.mejor = Math.max(m.mejor, d); if (d >= 25) return 'ok'; j.hud.notificar('salto', `Salto de ${d.toFixed(0)} m`, 'Valeria quiere más de 25 m.', 2.5); }
        },
        fin(m) { const R = m.j.redes; R.seguidores += 120; R.publicar('salto', '', { forzar: true }); m.j.hud.notificar('gps', 'Valeria publicó tu salto', '+120 seguidores en JacaGram', 4); }
      },
      {
        titulo: 'PAPARAZZI', premio: 1600,
        inicio(m) {
          const j = m.j, pt = puntoCalleAleatorio(j.jugador.posicion, 50, 90);
          m.dialogo([['Valeria Luna', 'Dicen que el cantante Kike Jacarandoso anda por el centro con alguien misterioso.'], ['Valeria Luna', 'Síguelo sin que te vea: ni muy cerca ni muy lejos. Necesito un minuto de material.']]);
          m.estrella = coche(m, 'deportivo', '#f2f2f0', pt, true);
          m.objetivos = [m.estrella]; m.carga = 0; m.sospecha = 0;
        },
        actualizar(m, dt) {
          const j = m.j, c = m.estrella, d = c.pos.distanceTo(j.jugador.posicion);
          if (c.quemado) return 'falla:Así no se consigue la exclusiva.';
          if (d > 90) return 'falla:Lo perdiste de vista.';
          if (d < 12) m.sospecha += dt; else m.sospecha = Math.max(0, m.sospecha - dt * 0.5);
          if (m.sospecha > 4) return 'falla:Te descubrió y se fue.';
          if (d >= 12 && d <= 70) m.carga += dt;
          m.objetivo(`Graba al cantante: <b>${Math.min(100, Math.round(m.carga / 60 * 100))}%</b> · ${d < 12 ? '<b>¡Muy cerca!</b>' : d > 70 ? '<b>¡Muy lejos!</b>' : 'distancia perfecta'}`);
          if (m.carga >= 60) return 'ok';
        },
        fin(m) { m.j.redes.seguidores += 250; m.j.redes.publicar('foto', '', { forzar: true }); }
      },
      {
        titulo: 'LA EXCLUSIVA', premio: 3000, rutaFija: true,
        inicio(m) {
          const j = m.j;
          m.dialogo([['Valeria Luna', 'Hoy transmito en vivo un recorrido a toda velocidad por la ciudad. Tú manejas, yo hablo.'], ['Valeria Luna', 'Cada choque nos baja la audiencia. Sigue la línea y no me hagas quedar mal.']]);
          const p = j.jugador.posicion, i0 = Math.round(p.x / 80 + 4), k0 = Math.round(p.z / 80 + 4);
          const pasos = [[0, 3], [3, 0], [0, -3], [-2, 0], [0, -2], [2, 0]];
          let i = Math.max(1, Math.min(7, i0)), k = Math.max(1, Math.min(5, k0));
          m.puntos = [];
          for (const [a, b] of pasos) { i = Math.max(0, Math.min(8, i + a)); k = Math.max(0, Math.min(8, k + b)); m.puntos.push({ x: ix(i), z: ix(k) }); }
          m.paso = -1; m.audiencia = 100;
          m.objetivo('Súbete a un <b>coche</b> para empezar la transmisión.');
        },
        actualizar(m, dt) {
          const j = m.j, c = j.jugador.coche;
          if (m.paso === -1) { if (c) { m.paso = 0; m.reloj = 140; m.marcar(1, m.puntos[0].x, m.puntos[0].z, 6, 5, '#b46bff'); j.gps.trazar(m.puntos, 1, '#b46bff'); } return; }
          if (!c) return 'falla:Te bajaste en plena transmisión.';
          if (c.ultimoChoque > 5) { m.audiencia -= Math.min(15, c.ultimoChoque); c.ultimoChoque = 0; }
          m.audiencia = Math.min(100, m.audiencia + dt * 0.4);
          if (m.audiencia <= 30) return 'falla:La audiencia se fue. Demasiados choques.';
          m.objetivo(`En vivo · punto <b>${m.paso + 1} de ${m.puntos.length}</b> · audiencia <b>${Math.round(m.audiencia)}%</b>`);
          if (m.dentro(1, c.pos, 2)) {
            m.paso++; j.audio.dinero();
            if (m.paso >= m.puntos.length) return 'ok';
            const q = m.puntos[m.paso]; m.marcar(1, q.x, q.z, 6, 5, '#b46bff'); j.gps.trazar(m.puntos.slice(m.paso), m.paso + 1, '#b46bff');
          }
        },
        fin(m) { m.j.redes.seguidores += 600; m.j.hud.notificar('gps', 'Transmisión histórica', '+600 seguidores. Valeria te debe una.', 4); }
      }
    ]
  },
  guera: {
    nombre: 'La Güera Reyes', letra: 'G', modelo: 'guera', color: '#e8c25a', zona: 'Zona de Torres', requisito: 2,
    apariencia: { mujer: true, peloLargo: true, pelo: '#e0c070', camisa: '#141416', pantalon: '#141416', aretes: true, collar: true, lentes: true, reloj: true, sombrero: null },
    lugar: j => libre(j, ix(6) + 10, ix(1) + 22),
    lista: [
      {
        titulo: 'DEUDA DE LUJO', premio: 2000,
        inicio(m) {
          const j = m.j, E = j.ciudad.lugares.estadio;
          m.dialogo([['La Güera Reyes', 'Así que tú eres el de Don Chuy. Veamos si vales lo que dicen.'], ['La Güera Reyes', 'Un junior me debe mucho dinero. Su deportivo está junto al estadio. Tráemelo sin un rayón.']]);
          const pt = puntoCalleAleatorio(E, 20, 70) || { x: E.x, z: E.z - 30, yaw: 0 };
          m.lujo = coche(m, 'deportivo', '#d8a020', pt); m.objetivos = [m.lujo];
          m.objetivo('Roba el <b>deportivo dorado</b> junto al <b>Estadio</b>.');
        },
        actualizar(m) {
          const j = m.j, c = m.lujo, pct = Math.round(c.salud / c.t.salud * 100);
          if (c.quemado || pct < 45) return 'falla:El deportivo quedó hecho pedazos.';
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; j.policia.subir(1); const g = CONTACTOS.guera.lugar(j); m.marcar(1, g.x, g.z, 4, 3, '#e8c25a'); }
          if (m.paso === 1) {
            m.objetivo(`Lleva el deportivo con la <b>Güera</b>. Va <b>${pct}%</b> entero.` + (j.policia.estrellas ? ' Pierde a la policía primero.' : ''));
            if (j.jugador.coche === c && m.dentro(1, c.pos, 2) && !j.policia.estrellas) return 'ok';
          }
        }
      },
      {
        titulo: 'EL MALETÍN', premio: 3500,
        inicio(m) {
          const j = m.j, P = j.ciudad.lugares.monumento;
          m.dialogo([['La Güera Reyes', 'Un mensajero dejará un maletín en la Glorieta. Recógelo y tráemelo.'], ['La Güera Reyes', 'No eres el único que lo quiere. Ve armado.']]);
          const p = libre(j, P.x + 12, P.z);
          const s = j.crearRecogible('sobre', p.x, p.z); m.extra.push(s.malla); m.mal = s;
          m.marcar(1, p.x, p.z, 1.5, 2, '#e8c25a');
          m.malos = matones(m, p.x, p.z, 3, ['pistola', 'subfusil']);
          m.objetivo('Recoge el <b>maletín</b> en la <b>Glorieta</b>.');
        },
        actualizar(m) {
          const j = m.j;
          despertar(m, m.malos, 45);
          if (m.paso === 0 && m.mal.tomado) {
            m.paso = 1; j.policia.subir(2);
            const g = CONTACTOS.guera.lugar(j); m.marcar(1, g.x, g.z, 3, 3, '#e8c25a');
            const pt = puntoCalleAleatorio(j.jugador.posicion, 40, 80);
            if (pt) { const c = coche(m, 'sedan', '#222226', pt, true); c.marcado = false; matones(m, pt.x + 3, pt.z + 3, 2, ['subfusil'], 'atacar').forEach(g => m.malos.push(g)); }
            m.dialogo([['', '¡Una camioneta de los rivales te viene siguiendo!']]);
          }
          if (m.paso === 1) {
            m.objetivo('Lleva el maletín con la <b>Güera</b>.' + (j.policia.estrellas ? ' <b>Pierde a la policía</b> antes.' : ''));
            if (llegar(m, 1) && !j.policia.estrellas) return 'ok';
          }
        }
      },
      {
        titulo: 'LA SUBASTA', premio: 7000,
        inicio(m) {
          const j = m.j, T = j.ciudad.lugares.tianguis;
          j.jugador.darArma('rifle', 30);
          m.dialogo([['La Güera Reyes', 'Esta noche subastan una camioneta blindada con algo que me pertenece.'], ['La Güera Reyes', 'Te presto mi rifle. Entra, toma la blindada y no dejes que la sigan hasta acá.']]);
          const pt = puntoCalleAleatorio(T, 20, 60) || { x: T.x + 20, z: T.z, yaw: 0 };
          m.blind = coche(m, 'blindado', '#3a3e44', pt); m.objetivos = [m.blind];
          m.malos = matones(m, pt.x, pt.z, 6, ['pistola', 'subfusil', 'escopeta']);
          m.reloj = 240;
          m.objetivo('Toma la <b>camioneta blindada</b> cerca del <b>Tianguis</b>.');
        },
        actualizar(m) {
          const j = m.j, c = m.blind;
          despertar(m, m.malos, 50);
          if (c.quemado) return 'falla:La blindada voló en pedazos.';
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; j.policia.subir(3); const g = CONTACTOS.guera.lugar(j); m.marcar(1, g.x, g.z, 4.5, 3, '#e8c25a'); }
          if (m.paso === 1) {
            m.objetivo('Lleva la blindada con la <b>Güera</b>.' + (j.policia.estrellas ? ' <b>Pierde a la policía</b>.' : ''));
            if (j.jugador.coche === c && m.dentro(1, c.pos, 2) && !j.policia.estrellas) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['La Güera Reyes', 'Nada mal. Cuando quieras jugar en serio, ya sabes dónde encontrarme.']]); }
      }
    ]
  },
  ibarra: {
    nombre: 'Comandante Ibarra', letra: 'I', modelo: 'ibarra', color: '#4a9bff', zona: 'Comisaría', requisito: 3,
    apariencia: { policia: true, camisa: '#1f3f7a', pantalon: '#16213a', gorra: '#13254a', chaleco: '#0f1a30', barba: 'bigote', complexion: 1.12, mujer: false, peloLargo: false, sombrero: null },
    lugar: j => libre(j, j.ciudad.lugares.comisaria.x + 8, j.ciudad.lugares.comisaria.z + 3),
    lista: [
      {
        titulo: 'TRABAJO SUCIO', premio: 1800,
        inicio(m) {
          const j = m.j, C = j.ciudad.lugares.comisaria;
          m.dialogo([['Comandante Ibarra', 'Mira nada más. El famoso de Don Chuy. Te tengo una propuesta.'], ['Comandante Ibarra', 'Un fugitivo anda suelto y mis muchachos no lo alcanzan. Usa esta patrulla y detenlo. Nadie te va a molestar.']]);
          const pt = puntoCalleAleatorio(C, 8, 30) || { x: C.x + 15, z: C.z, yaw: 0 };
          m.patrulla = coche(m, 'policia', '#f2f4f7', pt); m.objetivos = [m.patrulla];
          m.objetivo('Súbete a la <b>patrulla</b>.');
        },
        actualizar(m) {
          const j = m.j;
          if (m.paso === 0 && j.jugador.coche === m.patrulla) {
            m.paso = 1; m.patrulla.sirena = true;
            const pt = puntoCalleAleatorio(j.jugador.posicion, 110, 180);
            m.fug = coche(m, 'compacto', '#5a2a2a', pt, true); m.fug.panico = 999; m.objetivos = [m.fug];
            m.reloj = 150;
          }
          if (m.paso === 1) {
            const f = m.fug; f.panico = 999;
            if (f.quemado || (f.salud < f.t.salud * 0.4 && f.vel < 2)) return 'ok';
            m.objetivo(`Detén al <b>fugitivo</b>: daño <b>${Math.round((1 - f.salud / f.t.salud) / 0.6 * 100)}%</b>.`);
          }
        }
      },
      {
        titulo: 'EVIDENCIA', premio: 3000,
        inicio(m) {
          const j = m.j, C = j.ciudad.lugares.comisaria;
          m.dialogo([['Comandante Ibarra', 'Hay una camioneta de evidencia que me compromete. Llega de Asuntos Internos.'], ['Comandante Ibarra', 'Róbala, pásala por la Pintura Express para que no la reconozcan y déjala en el Taller de Don Chuy.']]);
          const pt = puntoCalleAleatorio(C, 25, 70) || { x: C.x + 30, z: C.z, yaw: 0 };
          m.ev = coche(m, 'camioneta', '#e8e8e4', pt); m.objetivos = [m.ev];
          m.objetivo('Roba la <b>camioneta blanca</b> de evidencia.');
        },
        actualizar(m) {
          const j = m.j, c = m.ev;
          if (c.quemado) return 'falla:La evidencia se quemó… y tú con ella en las noticias.';
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; j.policia.subir(3); const P = j.ciudad.lugares.pintura; m.marcar(1, P.x, P.z, 4, 3, '#4a9bff'); m.colorAntes = c.color; }
          if (m.paso === 1) {
            m.objetivo('Pasa la camioneta por la <b>Pintura Express</b>.');
            if (j.jugador.coche === c && (c.color !== m.colorAntes || (m.dentro(1, c.pos, 1) && !j.policia.estrellas))) { m.paso = 2; const t = j.ciudad.lugares.taller; m.marcar(1, t.x, t.z + 6, 4, 3, '#4a9bff'); }
          }
          if (m.paso === 2) {
            m.objetivo('Deja la camioneta en el <b>Taller</b>.' + (j.policia.estrellas ? ' Sin policía detrás.' : ''));
            if (j.jugador.coche === c && m.dentro(1, c.pos) && !j.policia.estrellas) return 'ok';
          }
        }
      },
      {
        titulo: 'LA REDADA', premio: 6000,
        inicio(m) {
          const j = m.j, P = j.ciudad.lugares.parque || { x: ix(5) + 40, z: ix(2) + 40 };
          m.dialogo([['Comandante Ibarra', 'Mi informante está escondido en el parque y ya lo encontraron.'], ['Comandante Ibarra', 'Aguanta ahí hasta que llegue mi gente. Si él cae, tú caes conmigo.']]);
          const p = libre(j, P.x, P.z);
          m.info = new Peaton(j, { x: p.x, z: p.z, estado: 'quieto', vestido: { camisa: '#c8c0a8', pantalon: '#3a3a3a' } });
          m.info.objetivoMision = true; m.info.salud = 160; j.peatones.push(m.info); m.extra.push(m.info);
          m.objetivos = [m.info]; m.marcar(1, p.x, p.z, 6, 1, '#4a9bff');
          m.malos = []; m.oleada = 0; m.espera = 0;
          m.objetivo('Llega al <b>parque</b> y protege al <b>informante</b>.');
        },
        actualizar(m, dt) {
          const j = m.j, I = m.info;
          if (!j.peatones.includes(I) || I.muerto) return 'falla:Mataron al informante.';
          I.estado = 'agachado'; I.tAgachado = 99;
          if (m.paso === 0) { if (I.pos.distanceTo(j.jugador.posicion) < 25) { m.paso = 1; m.reloj = 100; } return; }
          m.objetivos = [I, ...m.malos.filter(g => !g.muerto)];
          m.espera -= dt;
          if (m.malos.every(g => g.muerto) && m.oleada < 3 && m.espera <= 0) {
            m.oleada++; m.espera = 6;
            const a = Math.random() * 6;
            matones(m, I.pos.x + Math.cos(a) * 30, I.pos.z + Math.sin(a) * 30, 2 + m.oleada, ['pistola', 'subfusil', 'escopeta'], 'atacar').forEach(g => m.malos.push(g));
            j.hud.notificar('alerta', `Oleada ${m.oleada} de 3`, '¡Vienen por el informante!', 2.5);
          }
          m.objetivo(`Protege al informante · oleada <b>${m.oleada} de 3</b> · salud <b>${Math.max(0, Math.round(I.salud))}</b>`);
          if (m.oleada >= 3 && m.malos.every(g => g.muerto)) return 'ok';
        },
        fin(m) { m.j.policia.estrellas = 0; m.j.hud.dialogos([['Comandante Ibarra', 'Bien hecho. Mientras trabajes para mí, en esta ciudad tienes amigos con placa.']]); }
      }
    ]
  },
  flaco: {
    nombre: 'El Flaco Arreola', letra: 'F', modelo: 'flaco', color: '#ff6a3a', zona: 'Estadio Jacaranda', requisito: 1,
    apariencia: { camisa: '#ff6a3a', pantalon: '#22304d', gorra: '#111114', complexion: 0.9, mangaCorta: true, barba: 'candado', reloj: true, mujer: false, sombrero: null, peloLargo: false },
    lugar: j => libre(j, j.ciudad.lugares.estadio.x + 22, j.ciudad.lugares.estadio.z - 8),
    lista: [
      {
        titulo: 'PEDIDO ESPECIAL', premio: 1500,
        inicio(m) {
          const j = m.j, L = j.ciudad.lugares.lago;
          m.dialogo([['El Flaco Arreola', '¿Tú eres el chavo de Don Chuy? Dicen que manejas bonito.'], ['El Flaco Arreola', 'Un cliente quiere un deportivo rojo que está estacionado por el Lago Azul. Píntamelo en la Pintura Express y tráemelo limpio.']]);
          const pt = puntoCalleAleatorio(L, 15, 60) || { x: L.x + 20, z: L.z, yaw: 0 };
          m.dep = coche(m, 'deportivo', '#c81e2a', pt); m.objetivos = [m.dep];
          m.objetivo('Roba el <b>deportivo rojo</b> junto al <b>Lago Azul</b>.');
        },
        actualizar(m) {
          const j = m.j, c = m.dep;
          if (c.quemado) return 'falla:El cliente no paga por chatarra.';
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; j.policia.subir(1); m.colorAntes = c.color; const P = j.ciudad.lugares.pintura; m.marcar(1, P.x, P.z, 4, 3, '#ff6a3a'); }
          if (m.paso === 1) {
            m.objetivo('Cámbiale el color en la <b>Pintura Express</b>.');
            if (j.jugador.coche === c && c.color !== m.colorAntes) { m.paso = 2; const g = CONTACTOS.flaco.lugar(j); m.marcar(1, g.x, g.z, 4, 3, '#ff6a3a'); }
          }
          if (m.paso === 2) {
            m.objetivo('Llévale el deportivo al <b>Flaco</b> en el <b>Estadio</b>.' + (j.policia.estrellas ? ' Sin policía detrás.' : ''));
            if (j.jugador.coche === c && m.dentro(1, c.pos, 2) && !j.policia.estrellas) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['El Flaco Arreola', 'Quedó de agencia. Así me gusta, sin preguntas y sin rayones.']]); }
      },
      {
        titulo: 'LA VUELTA DEL ESTADIO', premio: 2600,
        inicio(m) {
          const j = m.j, E = j.ciudad.lugares.estadio, g = k => Math.max(1, Math.min(BLOQUES - 1, Math.round(k / PASO + BLOQUES / 2)));
          const a = g(E.x), b = g(E.z), A = Math.max(0, a - 1), B = Math.min(BLOQUES, a + 1), C = Math.max(0, b - 1), D = Math.min(BLOQUES, b + 1);
          const esquinas = [[ix(A), ix(C)], [ix(B), ix(C)], [ix(B), ix(D)], [ix(A), ix(D)]], pts = [];
          for (let v = 0; v < 2; v++) for (let k = 0; k < 4; k++) { const p = esquinas[k], q = esquinas[(k + 1) % 4]; pts.push({ x: (p[0] + q[0]) / 2, z: (p[1] + q[1]) / 2 }, { x: q[0], z: q[1] }); }
          m.puntos = pts; m.sig = 0;
          m.dialogo([['El Flaco Arreola', 'Hoy hay arrancones alrededor del estadio. Dos vueltas, tres rivales y la lana para el primero.'], ['El Flaco Arreola', 'Ahí te dejé un coche listo. No me hagas quedar mal.']]);
          const s = esquinas[0], yaw = Math.atan2(esquinas[1][0] - s[0], esquinas[1][1] - s[1]);
          m.mio = coche(m, 'deportivo', '#1f1f24', { x: s[0], z: s[1], yaw });
          m.rivales = [0, 1, 2].map(k => { const c = coche(m, ['deportivo', 'sedan', 'compacto'][k], ['#f2c21a', '#2a8dff', '#4fdc7a'][k], { x: s[0] - Math.sin(yaw) * (6 + k * 6) + Math.cos(yaw) * (k % 2 ? 2 : -2), z: s[1] - Math.cos(yaw) * (6 + k * 6) - Math.sin(yaw) * (k % 2 ? 2 : -2), yaw }); c.marcado = true; return c; });
          m.objetivos = [m.mio];
          m.objetivo('Súbete al <b>coche negro</b> para arrancar.');
        },
        actualizar(m) {
          const j = m.j, c = m.mio;
          if (c.quemado) return 'falla:Tu coche quedó fuera de la carrera.';
          if (m.paso === 0 && j.jugador.coche === c) {
            m.paso = 1; m.objetivos = []; m.reloj = 150;
            for (const r of m.rivales) { r.conductor = 'rival'; r.rival = { puntos: m.puntos, i: 0 }; }
            m.marcar(1, m.puntos[0].x, m.puntos[0].z, 7, 3, '#ff6a3a');
            j.hud.grande('¡ARRANCAN!', 'Dos vueltas al estadio', 2);
          }
          if (m.paso === 1) {
            if (m.rivales.some(r => r.rival.i >= m.puntos.length)) return 'falla:Un rival cruzó primero la meta.';
            const lugar = 1 + m.rivales.filter(r => r.rival.i > m.sig || (r.rival.i === m.sig && r.pos.distanceTo(new r.pos.constructor(m.puntos[m.sig].x, 0, m.puntos[m.sig].z)) < c.pos.distanceTo(new c.pos.constructor(m.puntos[m.sig].x, 0, m.puntos[m.sig].z)))).length;
            m.objetivo(`Punto <b>${m.sig + 1} de ${m.puntos.length}</b> · vas en <b>${lugar}° lugar</b>.`);
            if (j.jugador.coche === c && m.dentro(1, c.pos, 1.4)) {
              m.sig++; j.audio.dinero?.();
              if (m.sig >= m.puntos.length) return 'ok';
              const q = m.puntos[m.sig]; m.marcar(1, q.x, q.z, 7, 3, '#ff6a3a');
            }
          }
        },
        fin(m) { m.j.redes?.publicar?.('salto', '', { forzar: true }); m.j.hud.dialogos([['El Flaco Arreola', '¡Eso! Ya todo el barrio habla de ti.']]); }
      },
      {
        titulo: 'GRÚA FANTASMA', premio: 4200,
        inicio(m) {
          const j = m.j, T = j.ciudad.lugares.tianguis, M = j.ciudad.lugares.monumento;
          m.dialogo([['El Flaco Arreola', 'Los del otro lado del periférico se llevaron dos de mis joyas.'], ['El Flaco Arreola', 'Una está en el tianguis y otra en la glorieta. Cuidadas, claro. Tráemelas una por una.']]);
          m.autos = [[T, '#2a8d6a'], [M, '#7a2ac8']].map(([L, col]) => { const pt = puntoCalleAleatorio(L, 10, 45) || { x: L.x + 15, z: L.z, yaw: 0 }; const c = coche(m, 'deportivo', col, pt); m.malos = (m.malos || []).concat(matones(m, pt.x, pt.z, 2, ['pistola', 'subfusil'])); return c; });
          m.entregados = 0; m.objetivos = [...m.autos];
          m.objetivo('Recupera los <b>2 deportivos</b> del Flaco.');
        },
        actualizar(m) {
          const j = m.j, g = CONTACTOS.flaco.lugar(j);
          despertar(m, m.malos, 40);
          if (m.autos.some(c => c.quemado && !c.entregado)) return 'falla:Una de las joyas del Flaco se quemó.';
          const pend = m.autos.filter(c => !c.entregado);
          m.objetivos = pend.filter(c => j.jugador.coche !== c);
          const dentroDe = pend.find(c => j.jugador.coche === c);
          if (dentroDe) {
            if (!m.marcado) { m.marcado = true; m.marcar(1, g.x, g.z, 4, 3, '#ff6a3a'); j.policia.subir(2); }
            m.objetivo(`Lleva el deportivo al <b>Flaco</b> (${m.entregados} de 2).` + (j.policia.estrellas ? ' <b>Pierde a la policía.</b>' : ''));
            if (m.dentro(1, dentroDe.pos, 2) && !j.policia.estrellas && dentroDe.vel < 4) { dentroDe.entregado = true; m.entregados++; j.audio.dinero?.(); m.ocultar?.(1); m.marcado = false; if (m.entregados >= 2) return 'ok'; j.hud.notificar('mision', 'Uno menos', 'Falta el otro deportivo.', 3); }
          } else m.objetivo(`Recupera los deportivos del Flaco: <b>${m.entregados} de 2</b>.`);
        },
        fin(m) { m.j.hud.dialogos([['El Flaco Arreola', 'Te debo una grande. Cuando necesites ruedas, aquí está tu compa.']]); }
      }
    ]
  },
  tomas: {
    nombre: 'Padre Tomás', letra: 'T', modelo: 'tomas', color: '#e8e4d8', zona: 'Catedral', requisito: 0,
    apariencia: { camisa: '#121216', pantalon: '#121216', edad: 'mayor', lentes: true, barba: null, mujer: false, sombrero: null, peloLargo: false, mangaCorta: false, complexion: 1.05 },
    lugar: j => libre(j, j.ciudad.lugares.catedral.x + 5, j.ciudad.lugares.catedral.z + 4),
    lista: [
      {
        titulo: 'LA LIMOSNA', premio: 600,
        inicio(m) {
          const j = m.j, C = j.ciudad.lugares.catedral, p = libre(j, C.x - 8, C.z + 10);
          m.dialogo([['Padre Tomás', '¡Hijo, ayúdame! Ese muchacho se llevó la alcancía de los pobres.'], ['Padre Tomás', 'No le hagas daño de más. Sólo recupera lo que es de la gente.']]);
          m.ladron = new Peaton(j, { x: p.x, z: p.z, estado: 'huir', vestido: { camisa: '#3a5a8a', pantalon: '#2a2a2a', gorra: '#8a2a2a' } });
          m.ladron.objetivoMision = true; m.ladron.salud = 90; j.peatones.push(m.ladron); m.extra.push(m.ladron);
          m.objetivos = [m.ladron];
          m.objetivo('Alcanza al <b>ladrón</b> y quítale la alcancía.');
        },
        actualizar(m) {
          const j = m.j, L = m.ladron;
          if (m.paso === 0) {
            if (!j.peatones.includes(L)) return 'falla:El ladrón se escapó.';
            if (L.muerto || L.salud < 60) {
              m.paso = 1; m.objetivos = [];
              if (!L.muerto) { L.estado = 'agachado'; L.tAgachado = 99; j.hud.burbuja?.(L, '¡Ya, ya, tome!'); }
              const s = j.crearRecogible('sobre', L.pos.x + 0.6, L.pos.z); m.extra.push(s.malla); m.caja = s; m.marcar(1, L.pos.x + 0.6, L.pos.z, 1.5, 2, '#e8e4d8');
            } else {
              L.estado = 'huir'; L.miedo = 12; L.huyeDe.copy(j.jugador.posicion);
              if (L.pos.distanceTo(j.jugador.posicion) > 140) return 'falla:El ladrón se escapó.';
            }
          }
          if (m.paso === 1) {
            m.objetivo('Recoge la <b>alcancía</b>.');
            if (m.caja.tomado) { m.paso = 2; const g = CONTACTOS.tomas.lugar(j); m.marcar(1, g.x, g.z, 2, 3, '#e8e4d8'); m.mato = L.muerto; }
          }
          if (m.paso === 2) { m.objetivo('Devuélvele la alcancía al <b>Padre Tomás</b>.'); if (llegar(m, 1, false)) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Padre Tomás', m.mato ? 'Gracias, aunque no era para tanto, hijo. Rezaré por los dos.' : 'Dios te lo pague, hijo. Esta noche cenan los que menos tienen.']]); }
      },
      {
        titulo: 'A TIEMPO', premio: 1300,
        inicio(m) {
          const j = m.j, C = j.ciudad.lugares.catedral, p = libre(j, C.x + 14, C.z + 6);
          m.dialogo([['Padre Tomás', 'Doña Licha se desmayó en misa y la ambulancia no llega.'], ['Padre Tomás', 'Consigue un coche y llévala al Hospital Civil. Maneja con cuidado, por favor.']]);
          m.licha = new Peaton(j, { x: p.x, z: p.z, estado: 'quieto', vestido: { camisa: '#c87aa8', pantalon: '#3a2a4a', pelo: '#d8d4cc', mujer: true, edad: 'mayor', falda: true } });
          m.licha.objetivoMision = true; j.peatones.push(m.licha); m.extra.push(m.licha);
          m.objetivos = [m.licha]; m.estado = 100;
          m.objetivo('Consigue un <b>coche</b> y recoge a <b>Doña Licha</b>.');
        },
        actualizar(m) {
          const j = m.j, L = m.licha, c = j.jugador.coche;
          if (m.paso === 0) {
            if (L.muerto || !j.peatones.includes(L)) return 'falla:Doña Licha no lo logró.';
            L.estado = 'agachado'; L.tAgachado = 99;
            if (c && c.tipo !== 'moto' && c.pos.distanceTo(L.pos) < 6 && c.vel < 3) {
              m.paso = 1; L.quitar(); j.peatones.splice(j.peatones.indexOf(L), 1); m.objetivos = [];
              const H = j.ciudad.lugares.hospital; m.marcar(1, H.x, H.z, 5, 3, '#e8e4d8'); m.reloj = 95; m.coche = c; c.ultimoChoque = 0;
              j.hud.burbuja?.(j.jugador, 'Agárrese, Doña Licha.');
            }
          }
          if (m.paso === 1) {
            if (j.jugador.coche !== m.coche) return 'falla:Dejaste sola a Doña Licha.';
            if ((m.coche.ultimoChoque || 0) > 5) { m.estado -= m.coche.ultimoChoque * 2.5; m.coche.ultimoChoque = 0; j.hud.notificar('alerta', '¡Cuidado!', 'Doña Licha se lastimó con el golpe.', 1.5); }
            if (m.estado <= 0) return 'falla:Doña Licha no aguantó el viaje.';
            m.objetivo(`Llévala al <b>Hospital Civil</b> · estado <b>${Math.max(0, Math.round(m.estado))}%</b>.`);
            if (m.dentro(1, m.coche.pos, 1.6) && m.coche.vel < 4) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Padre Tomás', 'Ya está estable, gracias a ti. Esta ciudad todavía tiene buena gente.']]); }
      },
      {
        titulo: 'LA PROCESIÓN', premio: 3200,
        inicio(m) {
          const j = m.j, C = j.ciudad.lugares.catedral, P = j.ciudad.lugares.plaza;
          m.dialogo([['Padre Tomás', 'Hoy sale la procesión de la Virgen y unos maleantes amenazaron con arruinarla.'], ['Padre Tomás', 'Acompáñanos hasta la Plaza. Que nadie salga lastimado.']]);
          const a = libre(j, C.x, C.z + 6), d = libre(j, P.x, P.z - 4);
          m.ruta = [[a.x, a.z], [a.x + (d.x - a.x) * 0.33, a.z + (d.z - a.z) * 0.33], [a.x + (d.x - a.x) * 0.66, a.z + (d.z - a.z) * 0.66], [d.x, d.z]];
          m.fieles = [];
          for (let k = 0; k < 6; k++) { const g = new Peaton(j, { x: a.x - k * 1.2, z: a.z - (k % 2) * 0.9, estado: 'pasear', vestido: { camisa: ['#f2f0ea', '#e8dcc0', '#d8c0d8'][k % 3], pantalon: '#3a3a40' } }); g.objetivoMision = true; g.ruta = m.ruta; g.indice = 1; g.sentido = 1; j.peatones.push(g); m.extra.push(g); m.fieles.push(g); }
          m.malos = []; m.oleada = 0; m.espera = 8; m.fin = { x: d.x, z: d.z };
          m.marcar(1, d.x, d.z, 6, 1, '#e8e4d8');
          m.objetivo('Acompaña la <b>procesión</b> hasta la <b>Plaza</b>.');
        },
        actualizar(m, dt) {
          const j = m.j, vivos = m.fieles.filter(g => !g.muerto && j.peatones.includes(g));
          if (m.fieles.length - vivos.length >= 2) return 'falla:La procesión terminó en tragedia.';
          for (const g of vivos) { if (g.indice >= 3 && Math.hypot(g.pos.x - m.fin.x, g.pos.z - m.fin.z) < 3) { g.estado = 'quieto'; continue; } g.estado = 'pasear'; g.ruta = m.ruta; g.sentido = 1; if (g.indice === 0) g.indice = 3; }
          m.espera -= dt;
          if (m.oleada < 2 && m.espera <= 0 && m.malos.every(g => g.muerto)) {
            m.oleada++; m.espera = 14;
            const L = vivos[0] || m.fieles[0], a = Math.random() * 6;
            matones(m, L.pos.x + Math.cos(a) * 26, L.pos.z + Math.sin(a) * 26, 2 + m.oleada, ['pistola', 'puno', 'cuchillo'], 'atacar').forEach(g => m.malos.push(g));
            j.hud.notificar('alerta', '¡Ahí vienen!', 'Protege a la procesión.', 2.5);
          }
          despertar(m, m.malos, 60);
          m.objetivos = [...vivos, ...m.malos.filter(g => !g.muerto)];
          const llegaron = vivos.filter(g => Math.hypot(g.pos.x - m.fin.x, g.pos.z - m.fin.z) < 4).length;
          m.objetivo(`Protege la procesión · fieles <b>${vivos.length}</b> · llegaron <b>${llegaron}</b>`);
          if (m.oleada >= 2 && m.malos.every(g => g.muerto) && llegaron >= vivos.length - 1 && llegaron > 0) return 'ok';
        },
        fin(m) { m.j.hud.dialogos([['Padre Tomás', 'La Virgen llegó a la Plaza y la gente cantó toda la tarde. Gracias, hijo.']]); }
      }
    ]
  },
  rosario: {
    nombre: 'Doña Rosario', letra: 'R', modelo: 'rosario', color: '#3bd16f', zona: 'Banco Central', requisito: 4,
    apariencia: { mujer: true, peloLargo: true, pelo: '#2a1a12', camisa: '#1f4a3a', pantalon: '#1a1a1e', lentes: false, aretes: true, collar: true, reloj: true, sombrero: null, complexion: 0.96 },
    lugar: j => libre(j, j.ciudad.lugares.banco.x - 9, j.ciudad.lugares.banco.z + 4),
    lista: [
      {
        titulo: 'LA TARJETA', premio: 3200,
        inicio(m) {
          const j = m.j, B = j.ciudad.lugares.banco;
          m.dialogo([['Doña Rosario', 'Así que tú le arreglaste los problemas a Don Chuy. Yo pago mejor.'], ['Doña Rosario', 'El gerente del banco salió con la tarjeta maestra de la bóveda. Detén su coche y quítasela.']]);
          const pt = puntoCalleAleatorio(B, 50, 110) || { x: B.x + 60, z: B.z, yaw: 0 };
          m.gerente = coche(m, 'sedan', '#e8e4dc', pt, true); m.objetivos = [m.gerente];
          m.objetivo('Alcanza el <b>sedán blanco</b> del gerente y detenlo.');
        },
        actualizar(m) {
          const j = m.j, c = m.gerente;
          if (m.paso === 0) {
            c.panico = c.pos.distanceTo(j.jugador.posicion) < 35 ? 999 : 0;
            if (c.pos.distanceTo(j.jugador.posicion) > 340) return 'falla:El gerente se te escapó.';
            if (c.quemado || c.salud < c.t.salud * 0.55) {
              m.paso = 1; c.conductor = null; c.panico = 0;
              const p = libre(j, c.pos.x + c.fz * 3, c.pos.z - c.fx * 3);
              m.ger = new Peaton(j, { x: p.x, z: p.z, estado: 'huir', vestido: { camisa: '#f2f2f0', pantalon: '#22304d', chaleco: '#2a2a30' } }); m.ger.objetivoMision = true; j.peatones.push(m.ger); m.extra.push(m.ger);
              m.objetivos = [m.ger]; m.dialogo([['Gerente', '¡No me haga nada! ¡Llévese lo que quiera!']]);
            } else m.objetivo(`Daña el coche del gerente: <b>${Math.round((1 - c.salud / c.t.salud) / 0.45 * 100)}%</b>.`);
          }
          if (m.paso === 1) {
            const G = m.ger;
            if (G.muerto || G.salud < 60 || G.estado === 'rendido') {
              m.paso = 2; m.objetivos = []; const s = j.crearRecogible('sobre', G.pos.x + 0.6, G.pos.z); m.extra.push(s.malla); m.tarjeta = s; m.marcar(1, G.pos.x + 0.6, G.pos.z, 1.5, 2, '#3bd16f');
            } else { m.objetivo('Atrapa al <b>gerente</b> (apúntale o derríbalo).'); if (!j.peatones.includes(G)) return 'falla:El gerente se escapó.'; }
          }
          if (m.paso === 2) {
            m.objetivo('Toma la <b>tarjeta maestra</b>.');
            if (m.tarjeta.tomado) { m.paso = 3; j.policia.subir(2); const g = CONTACTOS.rosario.lugar(j); m.marcar(1, g.x, g.z, 2, 3, '#3bd16f'); }
          }
          if (m.paso === 3) { m.objetivo('Llévale la tarjeta a <b>Doña Rosario</b>.' + (j.policia.estrellas ? ' <b>Pierde a la policía.</b>' : '')); if (llegar(m, 1) && !j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Doña Rosario', 'Perfecto. Con esto ya tenemos medio trabajo hecho.']]); }
      },
      {
        titulo: 'DINERO SUCIO', premio: 5200,
        inicio(m) {
          const j = m.j, Lg = j.ciudad.lugares;
          m.dialogo([['Doña Rosario', 'Tres maletas con dinero de mis socios quedaron regadas por la ciudad. Otros ya las andan buscando.'], ['Doña Rosario', 'Tianguis, lago y glorieta. Tienes cuatro minutos antes de que se las lleven.']]);
          m.maletas = [Lg.tianguis, Lg.lago, Lg.monumento].map(L => { const p = libre(j, L.x + 8, L.z + 6); const s = j.crearRecogible('sobre', p.x, p.z); m.extra.push(s.malla); s.px = p.x; s.pz = p.z; m.malos = (m.malos || []).concat(matones(m, p.x, p.z, 2, ['pistola', 'subfusil', 'escopeta'])); return s; });
          m.reloj = 240;
          m.objetivo('Recoge las <b>3 maletas</b>.');
        },
        actualizar(m) {
          const j = m.j, n = m.maletas.filter(s => s.tomado).length;
          despertar(m, m.malos, 45);
          if (m.paso === 0) {
            const q = m.maletas.find(s => !s.tomado);
            if (q && m.ultima !== q) { m.ultima = q; m.marcar(1, q.px, q.pz, 1.5, 2, '#3bd16f'); }
            m.objetivo(`Maletas recogidas: <b>${n} de 3</b>.`);
            if (n >= 3) { m.paso = 1; m.reloj = null; j.policia.subir(2); const g = CONTACTOS.rosario.lugar(j); m.marcar(1, g.x, g.z, 2, 3, '#3bd16f'); }
          }
          if (m.paso === 1) { m.objetivo('Lleva las maletas con <b>Doña Rosario</b>.' + (j.policia.estrellas ? ' <b>Pierde a la policía.</b>' : '')); if (llegar(m, 1) && !j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Doña Rosario', 'Ni un billete menos. Prepárate, que lo que sigue es lo grande.']]); }
      },
      {
        titulo: 'EL GOLPE AL BANCO', premio: 15000,
        inicio(m) {
          const j = m.j, B = j.ciudad.lugares.banco;
          j.jugador.darArma('rifle', 60); j.jugador.darArma('granada', 3);
          m.dialogo([['Doña Rosario', 'Con la tarjeta, la bóveda se abre en cuarenta y cinco segundos. Tú sólo tienes que aguantar afuera.'], ['Doña Rosario', 'Cuando salga el dinero, desaparece. Te veo en el Taller de Don Chuy.']]);
          m.marcar(1, B.x, B.z, 12, 1, '#3bd16f');
          m.objetivo('Ve al <b>Banco Central</b>.');
          m.carga = 0;
        },
        actualizar(m, dt) {
          const j = m.j, B = j.ciudad.lugares.banco, d = Math.hypot(j.jugador.posicion.x - B.x, j.jugador.posicion.z - B.z);
          if (m.paso === 0 && d < 14) { m.paso = 1; j.policia.subir(4); j.hud.grande('¡ABRIENDO LA BÓVEDA!', 'Aguanta 45 segundos', 2.5); }
          if (m.paso === 1) {
            if (d < 22) m.carga += dt;
            j.policia.estrellas = Math.max(j.policia.estrellas, 3);
            m.objetivo(d < 22 ? `Bóveda abriéndose: <b>${Math.min(100, Math.round(m.carga / 45 * 100))}%</b>` : '<b>¡Regresa al banco!</b> La bóveda necesita cobertura.');
            if (m.carga >= 45) { m.paso = 2; const t = j.ciudad.lugares.taller; m.marcar(1, t.x, t.z + 6, 4, 3, '#3bd16f'); j.hud.grande('¡TENEMOS EL DINERO!', 'Escapa al Taller', 2.5); }
          }
          if (m.paso === 2) { m.objetivo('Escapa al <b>Taller de Don Chuy</b>.' + (j.policia.estrellas ? ' <b>Pierde a la policía</b> antes de llegar.' : '')); if (m.dentro(1, j.jugador.posicion, 1.4) && !j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.redes?.publicar?.('explosion', '', { forzar: true }); m.j.hud.dialogos([['Doña Rosario', 'El golpe del año y nadie sabe quién fue. Eres mi mejor inversión.'], ['Don Chuy', 'Mijo… ¿tú tuviste algo que ver con lo del banco? Mejor no me digas.']]); }
      }
    ]
  }
};
