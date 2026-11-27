import { linea, esCalle, BLOQUES, PASO } from './ciudad.js?v=20261126192148';
import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=20261126192148';
import { Peaton } from './peatones.js?v=20261126192148';
import { romperVitrina, reponerVitrinas } from './joyeria.js?v=20261126192148';

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
const matonesDentro = (m, t, n, armas) => {
  const I = t.interior, l = [], j = m.j;
  for (let k = 0; k < n; k++) {
    const x = I.ox + (Math.random() - 0.5) * (I.W - 4), z = I.oz - I.L / 2 + 1.8 + Math.random() * Math.max(2, I.L - 8.5);
    const g = new Peaton(j, { tipo: 'matón', x, z, estado: 'atacar', arma: armas[k % armas.length] });
    g.enInterior = t; g.salud = 80; g.yaw = Math.random() * 6; g.grupo.visible = j.interiores?.dentro === t;
    j.peatones.push(g); m.extra.push(g); l.push(g);
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
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; j.policia.subir(3); const P = j.ciudad.lugares.pintura; m.marcar(1, P.x, P.z, 4, 3, '#4a9bff'); m.colorAntes = c.color; c.pintarMision = true; }
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
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; j.policia.subir(1); m.colorAntes = c.color; c.pintarMision = true; const P = j.ciudad.lugares.pintura; m.marcar(1, P.x, P.z, 4, 3, '#ff6a3a'); }
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
        fin(m) { m.j.noticias?.avisar('banco'); m.j.redes?.publicar?.('explosion', '', { forzar: true }); m.j.hud.dialogos([['Doña Rosario', 'El golpe del año y nadie sabe quién fue. Eres mi mejor inversión.'], ['Don Chuy', 'Mijo… ¿tú tuviste algo que ver con lo del banco? Mejor no me digas.']]); }
      }
    ]
  },
  chava: {
    nombre: 'Chava', letra: 'S', modelo: 'chava', color: '#ffb020', zona: 'Gasolinera Jacaranda', requisito: 1,
    apariencia: { camisa: '#c8202e', pantalon: '#4a4c54', sombrero: true, colorSombrero: '#c8202e', complexion: 1.02, barba: 'bigote', mangaCorta: true, mujer: false, peloLargo: false },
    lugar: j => libre(j, j.ciudad.lugares.gasolinera.x - 13, j.ciudad.lugares.gasolinera.z + 5),
    lista: [
      {
        titulo: 'LA CAMIONETA DE LA GASOLINERA', premio: 1600,
        inicio(m) {
          const j = m.j, G = j.ciudad.lugares.gasolinera;
          m.dialogo([['Chava', '¡Qué onda! Unos chavos se llevaron la camioneta de reparto de la gasolinera mientras yo despachaba.'], ['Chava', 'Si el patrón se entera, me corre. Tráemela entera, porfa.']]);
          const pt = puntoCalleAleatorio(G, 120, 260) || { x: G.x - 150, z: G.z, yaw: 0 };
          m.camion = coche(m, 'reparto', '#f2f2ee', pt, true); m.objetivos = [m.camion];
          m.objetivo('Encuentra el <b>camión de reparto</b> robado y quítaselo al ratero.');
        },
        actualizar(m) {
          const j = m.j, c = m.camion, G = j.ciudad.lugares.gasolinera;
          if (c.quemado) return 'falla:La camioneta quedó destruida.';
          if (m.paso === 0) {
            c.panico = c.pos.distanceTo(j.jugador.posicion) < 30 ? 999 : 0;
            if (c.pos.distanceTo(j.jugador.posicion) > 380) return 'falla:El ratero se escapó con la camioneta.';
            if (j.jugador.coche === c) { m.paso = 1; m.objetivos = []; m.marcar(1, G.x, G.z, 5, 2.5, '#ffb020'); }
          }
          if (m.paso === 1) {
            m.objetivo('Lleva la camioneta a la <b>Gasolinera Jacaranda</b>.' + (c.salud < c.t.salud * 0.5 ? ' <b>¡Cuídala!</b>' : ''));
            if (j.jugador.coche === c && m.dentro(1, c.pos, 1) && c.vel < 5) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Chava', '¡Eres un ídolo! Ten, de mi propina de toda la semana. Y si un día necesitas gasolina, aquí estoy.']]); }
      },
      {
        titulo: 'EL CARTERISTA DEL TREN', premio: 2400,
        inicio(m) {
          const j = m.j, T = j.tren;
          m.dialogo([['Chava', 'A mi carnal le bajaron la cartera en el tren ligero. Dicen que la banda se baja en la Estación Parque.'], ['Chava', 'Súbete en la Estación Catedral y cáelos cuando se bajen. Van armados, aguas.']]);
          const mq = T.maquinas.find(q => q.i === 1 && q.x > T.X);
          m.marcar(1, mq.x, mq.z, 2.5, 3, '#ffb020');
          m.objetivo('Ve a la <b>Estación Catedral</b> y toma el tren ligero.');
        },
        actualizar(m) {
          const j = m.j, T = j.tren, P = T.maquinas.find(q => q.i === 2 && q.x > T.X);
          if (m.paso === 0) {
            if (T.viaje && T.viaje.b === T.estaciones[2]) { m.paso = 1; m.objetivo('Viajas a la <b>Estación Parque</b>…'); }
            else if (T.viaje) m.objetivo('Ese tren no va a la Estación Parque. Bájate y toma el bueno.');
            else if (Math.hypot(j.jugador.posicion.x - P.x, j.jugador.posicion.z - P.z) < 20) m.paso = 1;
          }
          if (m.paso === 1 && !T.viaje) {
            m.paso = 2; m.objetivos = [];
            m.banda = matones(m, P.x + 7, P.z + 5, 3, ['pistola', 'bate', 'pistola'], 'atacar');
            m.banda.forEach(g => { g.objetivoMision = true; }); m.objetivos = m.banda;
            j.hud.grande('¡AHÍ ESTÁN!', 'Recupera la cartera', 2);
          }
          if (m.paso === 2) {
            const vivos = m.banda.filter(g => !g.muerto).length;
            m.objetivo(`Acaba con los <b>carteristas</b>: quedan <b>${vivos}</b>.`);
            if (!vivos) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Chava', 'La cartera completa y hasta la credencial. Mi carnal dice que te debe una.']]); }
      },
      {
        titulo: 'APAGÓN EN EL ESTADIO', premio: 3600,
        inicio(m) {
          const j = m.j, E = j.ciudad.lugares.estadio;
          m.dialogo([['Chava', 'Hoy juega Jacaranda y una banda quiere tumbar las torres de luz para robar en lo oscuro.'], ['Chava', 'Llégale al estadio antes que ellos y sácalos de ahí.']]);
          j.jugador.darArma('subfusil', 90);
          m.marcar(1, E.x, E.z, 10, 1, '#ffb020');
          m.objetivo('Ve al <b>Estadio Jacaranda</b>.');
        },
        actualizar(m) {
          const j = m.j, E = j.ciudad.lugares.estadio, G = j.ciudad.lugares.gasolinera;
          if (m.paso === 0 && Math.hypot(j.jugador.posicion.x - E.x, j.jugador.posicion.z - E.z) < 70) {
            m.paso = 1; m.ocultar?.(1);
            m.banda = [...matones(m, E.x - 14, E.z + 2, 3, ['pistola', 'escopeta']), ...matones(m, E.x + 14, E.z + 2, 3, ['subfusil', 'pistola'])];
            m.banda.forEach(g => { g.objetivoMision = true; }); m.objetivos = m.banda;
          }
          if (m.paso === 1) {
            despertar(m, m.banda, 45);
            const vivos = m.banda.filter(g => !g.muerto).length;
            m.objetivo(`Saca a la banda del estadio: quedan <b>${vivos}</b>.`);
            if (!vivos) { m.paso = 2; m.objetivos = []; j.policia.subir(Math.max(2, j.policia.estrellas)); m.marcar(1, G.x, G.z, 5, 2.5, '#ffb020'); j.hud.grande('¡ESTADIO SALVADO!', 'Regresa con Chava', 2.2); }
          }
          if (m.paso === 2) {
            m.objetivo('Regresa a la <b>Gasolinera</b>.' + (j.policia.estrellas ? ' <b>Pierde a la policía</b> antes de llegar.' : ''));
            if (m.dentro(1, j.jugador.posicion, 1.2) && !j.policia.estrellas) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Chava', 'Ganamos tres a uno y ni se enteraron de nada. Ya eres leyenda en la gasolinera.']]); }
      }
    ]
  },
  luchador: {
    nombre: 'El Hijo del Jacaranda', letra: 'J', modelo: 'luchador', mascara: ['#c9ced6', '#2a5ab8'], color: '#4a8dff', zona: 'Arena Jacaranda', requisito: 2,
    apariencia: { camisa: '#1d3f8a', pantalon: '#b8bec8', complexion: 1.3, mangaCorta: true, mujer: false },
    lugar: j => { const t = j.interiores?.tiendas?.find(t => t.tipo === 'arena'); if (!t) return libre(j, j.ciudad.lugares.plaza.x + 10, j.ciudad.lugares.plaza.z); return libre(j, t.puerta.x + t.fx * 2.5 + t.fz * 2.5, t.puerta.z + t.fz * 2.5 - t.fx * 2.5); },
    lista: [
      {
        titulo: 'LA MÁSCARA ROBADA', premio: 1800,
        inicio(m) {
          const j = m.j, T = j.ciudad.lugares.tianguis;
          m.dialogo([['El Hijo del Jacaranda', '¡Hermano! Unos rudos me robaron mi máscara de gala. Sin ella no puedo luchar el domingo.'], ['El Hijo del Jacaranda', 'Andan presumiéndola en el tianguis. Recupérala, pero sin balazos: entre luchadores se arregla a golpes.']]);
          j.jugador.darArma('bate', 1);
          m.banda = matones(m, T.x, T.z, 4, ['bate', 'puno', 'bate', 'cuchillo']);
          m.banda.forEach(g => { g.objetivoMision = true; }); m.objetivos = m.banda;
          m.marcar(1, T.x, T.z, 14, 1, '#4a8dff');
          m.objetivo('Ve al <b>tianguis</b> y quítales la máscara a los rudos.');
        },
        actualizar(m) {
          const j = m.j, T = j.ciudad.lugares.tianguis;
          if (m.paso === 0) {
            despertar(m, m.banda, 30);
            const vivos = m.banda.filter(g => !g.muerto);
            m.objetivo(`Dales una lección a los rudos: quedan <b>${vivos.length}</b>.`);
            if (!vivos.length) { m.paso = 1; m.objetivos = []; const u = m.banda[m.banda.length - 1].pos, p = libre(j, u.x, u.z); m.mascara = j.crearRecogible('sobre', p.x, p.z); m.extra.push(m.mascara.malla); m.marcar(1, p.x, p.z, 1.6, 2.5, '#4a8dff'); }
          }
          if (m.paso === 1) { m.objetivo('Recoge la <b>máscara de gala</b>.'); if (m.mascara.tomado) { m.paso = 2; const L = m.lugarC('luchador'); m.marcar(1, L.x, L.z, 3, 2.5, '#4a8dff'); } }
          if (m.paso === 2) { m.objetivo('Regrésale la máscara al <b>Hijo del Jacaranda</b> en la Arena.' + (j.policia.estrellas ? ' <b>Pierde a la policía.</b>' : '')); if (llegar(m, 1) && !j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.noticias?.avisar('luchador'); m.j.hud.dialogos([['El Hijo del Jacaranda', '¡Mi máscara! La hizo mi abuelo con hilo de plata. Eres un técnico de corazón, hermano.']]); }
      },
      {
        titulo: 'EL CINTURÓN DE CAMPEÓN', premio: 2600,
        inicio(m) {
          const j = m.j, E = j.ciudad.lugares.estadio;
          m.dialogo([['El Hijo del Jacaranda', 'El cinturón de campeón está en el estadio, en la exhibición. La función empieza en dos minutos.'], ['El Hijo del Jacaranda', 'Tráelo antes de que suene la campana o me lo quitan por no presentarlo.']]);
          const p = libre(j, E.x + 6, E.z + 2); m.cinturon = j.crearRecogible('sobre', p.x, p.z); m.extra.push(m.cinturon.malla);
          m.marcar(1, p.x, p.z, 1.6, 2.5, '#ffd23a'); m.reloj = 120;
          m.objetivo('Ve por el <b>cinturón</b> al Estadio Jacaranda.');
        },
        actualizar(m, dt) {
          const j = m.j; m.reloj -= dt;
          if (m.reloj <= 0) return 'falla:Sonó la campana y no llegó el cinturón.';
          const t = Math.ceil(m.reloj), reloj = ` <b>${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</b>`;
          if (m.paso === 0) { m.objetivo('Recoge el <b>cinturón de campeón</b>.' + reloj); if (m.cinturon.tomado) { m.paso = 1; const L = m.lugarC('luchador'); m.marcar(1, L.x, L.z, 3, 2.5, '#4a8dff'); j.hud.grande('¡LO TIENES!', 'Corre a la Arena', 1.8); } }
          if (m.paso === 1) { m.objetivo('Lleva el cinturón a la <b>Arena Jacaranda</b>.' + reloj); if (llegar(m, 1)) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['El Hijo del Jacaranda', '¡Justo a tiempo! Hoy defiendo el título y lo dedico a ti.']]); }
      },
      {
        titulo: 'EMBOSCADA DE RUDOS', premio: 3400,
        inicio(m) {
          const j = m.j, L = m.lugarC('luchador');
          m.dialogo([['El Hijo del Jacaranda', 'Los rudos no aceptaron la derrota. Están esperándome afuera de la arena con fierros.'], ['El Hijo del Jacaranda', 'Tú y yo, hermano. Como en las luchas de parejas.']]);
          j.jugador.darArma('pistola', 36);
          m.banda = matones(m, L.x + 12, L.z + 8, 6, ['pistola', 'bate', 'pistola', 'cuchillo', 'escopeta', 'bate'], 'atacar');
          m.banda.forEach(g => { g.objetivoMision = true; }); m.objetivos = m.banda;
          j.hud.grande('¡A LA LONA!', 'Acaba con los rudos', 2);
        },
        actualizar(m) {
          const j = m.j, vivos = m.banda.filter(g => !g.muerto).length;
          m.objetivo(`Acaba con los <b>rudos</b>: quedan <b>${vivos}</b>.`);
          if (!vivos) return 'ok';
        },
        fin(m) { m.j.redes?.publicar?.('explosion', '', { forzar: true }); m.j.hud.dialogos([['El Hijo del Jacaranda', 'Rudos a la lona y la afición feliz. Desde hoy tienes lugar en primera fila, hermano.']]); }
      }
    ]
  },
  neto: {
    nombre: 'Don Neto', letra: 'D', modelo: 'neto', color: '#3fb8d8', zona: 'Lago Azul', requisito: 1,
    apariencia: { camisa: '#6a2a30', pantalon: '#3a5a8a', gorra: '#3a6a8a', complexion: 1.05, edad: 'mayor', barba: 'bigote', mangaCorta: false, mujer: false, peloLargo: false, sombrero: null },
    lugar: j => { const M = j.ciudad.lago.muelle; return libre(j, M.x + 4, M.z1 + 3); },
    lista: [
      {
        titulo: 'LOS ENCARGOS AL AGUA', premio: 1400,
        inicio(m) {
          const j = m.j, L = j.ciudad.lago;
          m.dialogo([['Don Neto', '¡Ah, qué chamacos! Me aventaron al lago las bolsas con los encargos de mis clientes.'], ['Don Neto', 'Yo ya no estoy para nadar, mijo. Sácamelas antes de que se hundan y tráemelas al muelle.']]);
          m.paq = [];
          for (let k = 0; k < 4; k++) {
            let x = 0, z = 0, n = 0;
            do { x = L.x0 + 4 + Math.random() * (L.x1 - L.x0 - 8); z = L.z0 + 4 + Math.random() * (L.z1 - L.z0 - 8); n++; } while (n < 40 && (Math.abs(x - L.muelle.x) < 4 || m.paq.some(q => Math.hypot(q.x - x, q.z - z) < 7)));
            const r = j.crearRecogible('sobre', x, z); r.alto = 0.55; r.pos = { x, z }; m.extra.push(r.malla); m.paq.push(r);
          }
          m.objetivos = m.paq.slice(); m.reloj = 150;
          m.objetivo('Nada por las <b>4 bolsas</b> que flotan en el lago.');
        },
        actualizar(m) {
          const j = m.j, M = j.ciudad.lago.muelle, quedan = m.paq.filter(r => !r.tomado);
          m.objetivos = quedan;
          if (m.paso === 0) {
            m.objetivo(`Nada por las bolsas que flotan en el lago: quedan <b>${quedan.length}</b>.`);
            if (!quedan.length) { m.paso = 1; m.marcar(1, M.x + 4, M.z1 + 3, 2.5, 2.5, '#3fb8d8'); }
          }
          if (m.paso === 1) {
            m.objetivo('Lleva las bolsas a <b>Don Neto</b>, junto al muelle.');
            if (!j.jugador.nadando && m.dentro(1, j.jugador.pos, 1.5)) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Don Neto', '¡Ni una se mojó por dentro! Nadas como bagre, mijo. Toma, por las molestias.']]); }
      },
      {
        titulo: 'LA CAMIONETA DEL COMPADRE', premio: 2600,
        inicio(m) {
          const j = m.j, L = j.ciudad.lugares.lago;
          m.dialogo([['Don Neto', 'Mi compadre Rigo quiere que desaparezca su camioneta vieja. Dice que es para el seguro… yo no pregunto.'], ['Don Neto', 'Échala al lago y sal nadando. Ah, y el vecino ya llamó a la patrulla. Ponte abusado.']]);
          const pt = puntoCalleAleatorio(L, 150, 260) || { x: L.x + 150, z: L.z, yaw: 0 };
          m.cam = coche(m, 'camioneta', '#7a6a5a', pt, false); m.objetivos = [m.cam];
          m.objetivo('Ve por la <b>camioneta del compadre</b>.');
        },
        actualizar(m) {
          const j = m.j, c = m.cam, P = j.policia;
          if (c.quemado) return 'falla:La camioneta se quemó antes de llegar al lago.';
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; P.subir(Math.max(2, P.estrellas)); const L = j.ciudad.lago; m.marcar(1, (L.x0 + L.x1) / 2, (L.z0 + L.z1) / 2, 14, 2, '#3fb8d8'); j.hud.grande('¡LA PATRULLA!', 'Échala al lago', 2); }
          if (m.paso === 1) {
            m.objetivo('Métete con la camioneta al <b>Lago Azul</b> hasta que se hunda.');
            if (c.ahogado) { m.paso = 2; m.ocultar(1); }
          }
          if (m.paso === 2) {
            m.objetivo(P.estrellas ? 'Sal del agua y <b>pierde a la policía</b>.' : 'Sal del agua.');
            if (!j.jugador.nadando && !P.estrellas) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Don Neto', 'Dice Rigo que ya cobró. A mí ni me cuentes nada. Toma tu parte.']]); }
      },
      {
        titulo: 'EL MUELLE ES MÍO', premio: 3800,
        inicio(m) {
          const j = m.j, M = j.ciudad.lago.muelle;
          m.dialogo([['Don Neto', 'Unos del Mercado quieren quedarse con mi muelle para vender ahí. Ya vienen en camino.'], ['Don Neto', 'Yo me escondo en la lancha. Que no se queden con lo único que tengo, mijo.']]);
          m.marcar(1, M.x + 4, M.z1 + 3, 3, 2.5, '#3fb8d8');
          m.objetivo('Espera a los del Mercado junto al <b>muelle</b>.');
        },
        actualizar(m) {
          const j = m.j, M = j.ciudad.lago.muelle;
          if (m.paso === 0 && (m.t > 6 || m.dentro(1, j.jugador.posicion, 1))) {
            m.paso = 1; m.objetivos = [];
            const L = j.ciudad.lugares.lago;
            const p1 = puntoCalleAleatorio(L, 18, 45) || { x: L.x + 20, z: L.z + 8, yaw: 0 }, p2 = puntoCalleAleatorio(L, 18, 45) || { x: L.x - 20, z: L.z + 8, yaw: 0 };
            coche(m, 'camioneta', '#2a2a30', p1, false); coche(m, 'deportivo', '#8a1a20', p2, false);
            m.malos = matones(m, p1.x, p1.z, 3, ['pistola', 'bate', 'subfusil'], 'atacar').concat(matones(m, p2.x, p2.z, 3, ['pistola', 'escopeta', 'cuchillo'], 'atacar'));
            m.malos.forEach(g => { g.objetivoMision = true; }); m.objetivos = m.malos;
            j.hud.grande('¡YA LLEGARON!', 'Defiende el muelle', 2);
          }
          if (m.paso === 1) {
            const vivos = m.malos.filter(g => !g.muerto).length;
            m.objetivo(`Corre a los del <b>Mercado</b>: quedan <b>${vivos}</b>.`);
            if (!vivos) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Don Neto', 'Ahí quedó claro quién manda en este muelle. Cuando quieras, te llevo a pescar. Gratis.']]); }
      }
    ]
  },
  rigo: {
    nombre: 'Rigo', letra: 'O', modelo: 'rigo', color: '#2a8a4a', zona: 'Glorieta del Monumento', requisito: 1,
    apariencia: { camisa: '#2a5aa8', pantalon: '#3a5a8a', gorra: '#2a8a4a', complexion: 1, mujer: false, peloLargo: false, sombrero: null, mangaCorta: false },
    lugar: j => libre(j, j.ciudad.lugares.monumento.x + 17, j.ciudad.lugares.monumento.z + 6),
    lista: [
      {
        titulo: 'VOCHOS DE CARRERAS', premio: 1800,
        inicio(m) {
          const j = m.j, M = j.ciudad.lugares.monumento, g = k => Math.max(1, Math.min(BLOQUES - 1, Math.round(k / PASO + BLOQUES / 2)));
          const a = g(M.x), b = g(M.z), A = Math.max(0, a - 1), B = Math.min(BLOQUES, a + 1), C = Math.max(0, b - 1), D = Math.min(BLOQUES, b + 1);
          const esquinas = [[ix(A), ix(C)], [ix(B), ix(C)], [ix(B), ix(D)], [ix(A), ix(D)]], pts = [];
          for (let k = 0; k < 4; k++) { const p = esquinas[k], q = esquinas[(k + 1) % 4]; pts.push({ x: (p[0] + q[0]) / 2, z: (p[1] + q[1]) / 2 }, { x: q[0], z: q[1] }); }
          m.puntos = pts; m.sig = 0;
          m.dialogo([['Rigo', '¡Qué onda! Los del club de vochos me retaron a una vuelta alrededor de la glorieta.'], ['Rigo', 'Yo no manejo ni a la tienda, así que te presto el mío. El azul cielo. ¡Que no le pase nada!']]);
          const s = esquinas[0], yaw = Math.atan2(esquinas[1][0] - s[0], esquinas[1][1] - s[1]);
          m.mio = coche(m, 'vocho', '#7ab0c8', { x: s[0], z: s[1], yaw });
          m.rivales = [0, 1, 2].map(k => { const c = coche(m, 'vocho', ['#c83a2a', '#e6d6a0', '#3a7a4a'][k], { x: s[0] - Math.sin(yaw) * (6 + k * 6) + Math.cos(yaw) * (k % 2 ? 2 : -2), z: s[1] - Math.cos(yaw) * (6 + k * 6) - Math.sin(yaw) * (k % 2 ? 2 : -2), yaw }); c.t = { ...c.t, vmax: 27 }; return c; });
          m.objetivos = [m.mio];
          m.objetivo('Súbete al <b>vocho azul cielo</b> de Rigo.');
        },
        actualizar(m) {
          const j = m.j, c = m.mio;
          if (c.quemado) return 'falla:El vocho de Rigo quedó hecho chatarra.';
          if (m.paso === 0 && j.jugador.coche === c) {
            m.paso = 1; m.objetivos = []; m.reloj = 120;
            for (const r of m.rivales) { r.conductor = 'rival'; r.rival = { puntos: m.puntos, i: 0 }; }
            m.marcar(1, m.puntos[0].x, m.puntos[0].z, 7, 3, '#2a8a4a');
            j.hud.grande('¡ARRANCAN LOS VOCHOS!', 'Una vuelta a la glorieta', 2);
          }
          if (m.paso === 1) {
            if (m.rivales.some(r => r.rival.i >= m.puntos.length)) return 'falla:Un vocho rival llegó primero.';
            m.objetivo(`Punto <b>${m.sig + 1} de ${m.puntos.length}</b> · no dejes que te rebasen.`);
            if (j.jugador.coche === c && m.dentro(1, c.pos, 1.4)) {
              m.sig++; j.audio.dinero?.();
              if (m.sig >= m.puntos.length) return 'ok';
              const q = m.puntos[m.sig]; m.marcar(1, q.x, q.z, 7, 3, '#2a8a4a');
            }
          }
        },
        fin(m) { m.j.hud.dialogos([['Rigo', '¡Ese es mi vocho! Ahora sí, el club me tiene que respetar.']]); }
      },
      {
        titulo: 'EL VOCHO VERDE', premio: 2400,
        inicio(m) {
          const j = m.j, jp = j.jugador.posicion;
          m.dialogo([['Rigo', 'Unos de la colonia se llevaron el vocho verde de mi jefa. Lo tienen en una esquina del barrio.'], ['Rigo', 'Son tres y andan armados. Tráemelo y que no te siga la patrulla.']]);
          const pt = puntoCalleAleatorio(jp, 160, 280) || { x: jp.x + 160, z: jp.z, yaw: 0 };
          m.verde = coche(m, 'vocho', '#3a7a4a', pt, false);
          m.malos = matones(m, pt.x, pt.z, 3, ['pistola', 'bate', 'pistola']); m.objetivos = [m.verde];
          m.objetivo('Recupera el <b>vocho verde</b>.');
        },
        actualizar(m) {
          const j = m.j, c = m.verde;
          if (c.quemado) return 'falla:El vocho verde se quemó.';
          despertar(m, m.malos, 30);
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.objetivos = []; const g = CONTACTOS.rigo.lugar(j); m.marcar(1, g.x, g.z, 4, 3, '#2a8a4a'); }
          if (m.paso === 1) {
            m.objetivo('Llévale el vocho a <b>Rigo</b>.' + (j.policia.estrellas ? ' <b>Pierde a la policía primero.</b>' : ''));
            if (j.jugador.coche === c && m.dentro(1, c.pos, 2) && !j.policia.estrellas) return 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Rigo', 'Mi jefa te manda decir que eres bienvenido a comer cuando quieras. Y esto es de mi parte.']]); }
      },
      {
        titulo: 'LAVADITO Y A TIEMPO', premio: 2000,
        inicio(m) {
          const j = m.j, jp = j.jugador.posicion;
          m.dialogo([['Rigo', 'Vendí un vocho y el cliente lo quiere limpio en la Catedral en menos de cuatro minutos.'], ['Rigo', 'Está todo enlodado. Pásalo por el autolavado de la gasolinera y luego a la Catedral. ¡Vuélale!']]);
          const pt = puntoCalleAleatorio(jp, 25, 80) || { x: jp.x + 25, z: jp.z, yaw: 0 };
          m.sucio = coche(m, 'vocho', '#e6d6a0', pt, false); m.sucio.suciedad = 0.85; j.lavado?.ensuciar(m.sucio, 0); m.objetivos = [m.sucio];
          m.objetivo('Súbete al <b>vocho enlodado</b>.');
        },
        actualizar(m) {
          const j = m.j, c = m.sucio, W = j.lavado;
          if (c.quemado) return 'falla:El vocho del cliente se quemó.';
          if (m.paso === 0 && j.jugador.coche === c) { m.paso = 1; m.reloj = 240; m.objetivos = []; if (W?.LX !== undefined) m.marcar(1, W.LX, W.LZ + 7, 3, 3, '#2a6ec8'); }
          if (m.paso === 1) {
            m.objetivo('Lleva el vocho al <b>autolavado</b> de la gasolinera y entra despacio.');
            if ((c.suciedad || 0) < 0.05) { m.paso = 2; const L = j.ciudad.lugares.catedral; m.marcar(1, L.x, L.z + 18, 5, 3, '#2a8a4a'); j.hud.grande('¡RECHINANDO DE LIMPIO!', 'Ahora a la Catedral', 2); }
          }
          if (m.paso === 2) {
            m.objetivo('Entrega el vocho en la <b>Catedral</b>.' + ((c.suciedad || 0) > 0.15 ? ' Se está ensuciando, ¡no te tardes!' : ''));
            if (j.jugador.coche === c && m.dentro(1, c.pos, 2) && c.vel < 6) return (c.suciedad || 0) > 0.3 ? 'falla:El cliente dijo que así no lo quería.' : 'ok';
          }
        },
        fin(m) { m.j.hud.dialogos([['Rigo', '¡Vendido! El cliente hasta se tomó una foto con él. Toma tu comisión.']]); }
      }
    ]
  },
  lupe: {
    nombre: 'Doña Lupe', letra: 'U', modelo: 'peaton4', color: '#e86fa8', zona: 'Departamentos Jacaranda', requisito: 2,
    apariencia: { mujer: true, peloLargo: true, pelo: '#d8d4cc', camisa: '#c86a8a', pantalon: '#3a2a4a', edad: 'mayor', aretes: true, collar: true, lentes: true, sombrero: null, complexion: 1.0 },
    lugar: j => { const t = j.interiores?.tiendas?.find(q => q.tipo === 'depa'); return t ? libre(j, t.puerta.x + t.fx * 2.6 + t.fz * 2.2, t.puerta.z + t.fz * 2.6 - t.fx * 2.2) : { ...libre(j, j.ciudad.lugares.plaza.x + 20, j.ciudad.lugares.plaza.z + 20), provisional: true }; },
    lista: [
      {
        titulo: 'LA CENA DE ANIVERSARIO', premio: 1800,
        inicio(m) {
          const j = m.j, P = j.pesca?.punto || j.ciudad.lugares.lago;
          m.dialogo([['Doña Lupe', '¡Mis inquilinos favoritos! Hoy cumplo cuarenta años de casada y mi viejo quiere pescado del Lago Azul.'], ['Doña Lupe', 'Pesquen dos en el muelle y llévenlos al Mercado en el camión de la Ruta 7. Allá me lo guisan.']]);
          m.p0 = j.estadisticas.d.peces || 0; m.marcar(1, P.x, P.z, 2, 2, '#e86fa8');
          m.objetivo('Pesca <b>2 peces</b> en la punta del muelle del <b>Lago Azul</b> (E).');
        },
        actualizar(m) {
          const j = m.j, d = j.estadisticas.d;
          if (m.paso === 0) {
            const n = (d.peces || 0) - m.p0;
            m.objetivo(`Pesca <b>2 peces</b> en el muelle del <b>Lago Azul</b> · llevas <b>${n}</b>.`);
            if (n >= 2) { m.paso = 1; m.c0 = d.viajesCamion || 0; const jp = j.jugador.posicion, P = [...(j.autobuses?.paradas || [])].sort((a, b) => Math.hypot(a.x - jp.x, a.z - jp.z) - Math.hypot(b.x - jp.x, b.z - jp.z))[0]; if (P) m.marcar(1, P.x, P.z, 2.5, 2, '#e86fa8'); j.hud.notificar('mision', '¡Ya están los dos!', 'Ahora al camión de la Ruta 7.', 3); }
          }
          if (m.paso === 1) {
            m.objetivo('Súbete al camión <b>Ruta 7</b> en una parada (E cuando llegue) y baja en la siguiente.');
            if ((d.viajesCamion || 0) > m.c0) { m.paso = 2; const M = j.ciudad.lugares.mercado; m.marcar(1, M.x, M.z, 3, 3, '#e86fa8'); }
          }
          if (m.paso === 2) { m.objetivo('Lleva el pescado al <b>Mercado</b>.'); if (m.dentro(1, j.jugador.posicion, 1.5)) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Doña Lupe', '¡Qué bonito! Mi viejo dice que es el mejor pescado en cuarenta años. Este mes no les cobro la renta… bueno, nomás la mitad.']]); }
      },
      {
        titulo: 'OJOS EN EL CIELO', premio: 4000,
        inicio(m) {
          const j = m.j;
          m.dialogo([['Doña Lupe', 'Ese helicóptero de la policía no deja dormir a nadie con su reflector.'], ['Doña Lupe', 'Les presté el rifle de mi difunto. Bájenlo y que no los agarren, ¿eh?']]);
          j.jugador.darArma('rifle', 90); m.h0 = j.estadisticas.d.helicopteros || 0; j.policia.subir(4);
          m.objetivo('Derriba el <b>helicóptero</b> de la policía.');
        },
        actualizar(m) {
          const j = m.j;
          if (m.paso === 0) {
            if (j.policia.estrellas < 4) j.policia.subir(4);
            if ((j.estadisticas.d.helicopteros || 0) > m.h0) { m.paso = 1; j.hud.grande('¡LO BAJASTE!', 'Ahora pierde a la policía', 2.5, 'exito'); }
          }
          if (m.paso === 1) { m.objetivo('<b>Pierde a la policía.</b>'); if (!j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Doña Lupe', 'Por fin una noche en paz. Duerman bien, muchachos.']]); }
      },
      {
        titulo: 'LOS DOS AL RESCATE', premio: 5000,
        inicio(m) {
          const j = m.j, T = j.ciudad.lugares.tianguis;
          m.dialogo([['Doña Lupe', 'Unos maleantes se llevaron a mi sobrino al tianguis.'], ['Doña Lupe', 'Vayan los dos: uno abre camino y el otro termina el trabajo. Confío en ustedes.']]);
          m.quien0 = j.jugador.personaje; m.otro = m.quien0 === 'Lucía' ? 'Matías' : 'Lucía';
          m.grupoA = matones(m, T.x - 10, T.z, 3, ['puno', 'pistola']); m.grupoB = matones(m, T.x + 14, T.z + 6, 3, ['pistola', 'escopeta']);
          m.objetivos = [...m.grupoA];
          m.objetivo(`<b>${m.quien0}</b>: acaba con los <b>3 de la entrada</b> del tianguis.`);
        },
        actualizar(m) {
          const j = m.j;
          if (m.paso === 0) { despertar(m, m.grupoA, 35); m.objetivos = m.grupoA.filter(g => !g.muerto); if (!m.objetivos.length) { m.paso = 1; j.hud.grande('¡CAMBIO!', 'Presiona Z para jugar con ' + m.otro, 2.5); } }
          if (m.paso === 1) { m.objetivos = []; m.objetivo(`Presiona <b>Z</b> para que <b>${m.otro}</b> termine el trabajo.`); if (j.jugador.personaje !== m.quien0) { m.paso = 2; for (const g of m.grupoB) if (!g.muerto) g.estado = 'atacar'; } }
          if (m.paso === 2) { m.objetivos = m.grupoB.filter(g => !g.muerto); m.objetivo(`<b>${j.jugador.personaje}</b>: acaba con los <b>otros ${m.objetivos.length}</b>.`); if (!m.objetivos.length) { m.paso = 3; const g = CONTACTOS.lupe.lugar(j); m.marcar(1, g.x, g.z, 2, 3, '#e86fa8'); } }
          if (m.paso === 3) { m.objetivo('Regresen con <b>Doña Lupe</b> con el sobrino a salvo.'); if (llegar(m, 1)) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Doña Lupe', 'Mi sobrino ya está en casa. Ustedes dos juntos son de temer, ¿eh? Gracias.']]); }
      }
    ]
  },
  jefa: {
    nombre: 'Marisol "La Jefa"', letra: 'K', modelo: 'peaton10', color: '#ff3b5a', zona: 'Mercado', requisito: 1,
    apariencia: { mujer: true, peloLargo: true, pelo: '#120c0a', camisa: '#1a1a1e', pantalon: '#1a1a1e', lentes: true, aretes: true, collar: true, reloj: true, sombrero: null, complexion: 1.0 },
    lugar: j => { const M = j.ciudad.lugares.mercado; return libre(j, M.x - 18, M.z - 10); },
    lista: [
      {
        titulo: 'ATRACO EN LA TIENDA', premio: 2500,
        inicio(m) {
          m.malos = null; m.jefe = null; m.charro = null; m.tienda = null; m.oleada = 0;
          const j = m.j, jp = j.jugador.posicion;
          m.dialogo([['Marisol "La Jefa"', 'Unos novatos de los Nopaleros se metieron a una tienda de mi zona y la tienen tomada.'], ['Marisol "La Jefa"', 'Entra y sácalos. Van armados, así que tú también. Toma.']]);
          j.jugador.darArma('escopeta', 24); j.jugador.darArma('pistola', 60);
          m.tienda = [...j.interiores.tiendas.filter(t => t.tipo === 'tienda')].sort((a, b) => Math.hypot(a.puerta.x - jp.x, a.puerta.z - jp.z) - Math.hypot(b.puerta.x - jp.x, b.puerta.z - jp.z))[0];
          m.marcar(1, m.tienda.puerta.x, m.tienda.puerta.z, 2, 3, '#ff3b5a');
          m.objetivo(`Entra a <b>${m.tienda.nombre}</b> y acaba con los Nopaleros.`);
        },
        actualizar(m) {
          const j = m.j, I = j.interiores;
          if (m.paso === 0) {
            if (I.dentro === m.tienda && !m.malos) { m.malos = matonesDentro(m, m.tienda, 5, ['pistola', 'escopeta', 'subfusil']); j.hud.grande('¡ESTÁN ADENTRO!', 'Cúbrete detrás de los anaqueles', 2); }
            if (m.malos) { m.objetivos = m.malos.filter(g => !g.muerto); m.objetivo(`Acaba con los Nopaleros: quedan <b>${m.objetivos.length}</b>.`); if (!m.objetivos.length) { m.paso = 1; j.policia.subir(3); j.hud.grande('¡LIMPIO!', 'Ya viene la policía', 2.2); } }
          }
          if (m.paso === 1) { m.objetivo('Sal de la tienda y <b>pierde a la policía</b>.'); if (!I.dentro && !j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Marisol "La Jefa"', 'Así se hace. En mi zona nadie entra sin preguntar.']]); }
      },
      {
        titulo: 'AJUSTE EN LA CANTINA', premio: 4000,
        inicio(m) {
          m.malos = null; m.jefe = null; m.charro = null; m.tienda = null; m.oleada = 0;
          const j = m.j;
          m.dialogo([['Marisol "La Jefa"', 'El Tuerto Salinas se tomó la Cantina La Jacaranda con su gente. Dicen que no le entra ni una bala.'], ['Marisol "La Jefa"', 'Pues que le entren varias. Ahí te va un rifle.']]);
          j.jugador.darArma('rifle', 90); j.jugador.darArma('granada', 2);
          m.tienda = j.interiores.tiendas.find(t => t.tipo === 'cantina');
          m.marcar(1, m.tienda.puerta.x, m.tienda.puerta.z, 2, 3, '#ff3b5a');
          m.objetivo('Entra a la <b>Cantina La Jacaranda</b> y acaba con <b>El Tuerto</b>.');
        },
        actualizar(m) {
          const j = m.j, I = j.interiores;
          if (m.paso === 0) {
            if (I.dentro === m.tienda && !m.malos) {
              m.malos = matonesDentro(m, m.tienda, 5, ['pistola', 'subfusil', 'escopeta']);
              m.jefe = matonesDentro(m, m.tienda, 1, ['escopeta'])[0]; m.jefe.salud = 320; m.jefe.jefe = true;
              j.hud.grande('EL TUERTO SALINAS', '¡Que no salga vivo!', 2.4);
            }
            if (m.malos) { m.objetivos = [...m.malos, m.jefe].filter(g => !g.muerto); m.objetivo(m.jefe.muerto ? `Acaba con los que quedan: <b>${m.objetivos.length}</b>.` : `Acaba con <b>El Tuerto</b> (salud ${Math.max(0, Math.round(m.jefe.salud))}) y su gente.`); if (!m.objetivos.length) { m.paso = 1; j.policia.subir(4); } }
          }
          if (m.paso === 1) { m.objetivo('Sal de la cantina y <b>pierde a la policía</b> (4 estrellas).'); if (!I.dentro && !j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Marisol "La Jefa"', 'Se acabó El Tuerto. Ahora la cantina invita… a nosotros.']]); }
      },
      {
        titulo: 'EMBOSCADA EN EL TIANGUIS', premio: 4500,
        inicio(m) {
          m.malos = null; m.jefe = null; m.charro = null; m.tienda = null; m.oleada = 0;
          const j = m.j, T = j.ciudad.lugares.tianguis;
          m.dialogo([['Marisol "La Jefa"', 'Voy a cobrar la plaza del tianguis y los Nopaleros me quieren emboscar.'], ['Marisol "La Jefa"', 'Llega antes que ellos y aguanta. Van a venir en oleadas.']]);
          j.jugador.darArma('subfusil', 150); j.jugador.darArma('escopeta', 24);
          m.marcar(1, T.x, T.z, 6, 2, '#ff3b5a'); m.oleada = 0; m.espera = 0;
          m.objetivo('Ve al <b>tianguis</b> y prepárate.');
        },
        actualizar(m, dt) {
          const j = m.j, T = j.ciudad.lugares.tianguis, jp = j.jugador.posicion, J = j.jugador;
          if (m.paso === 0) { if (Math.hypot(jp.x - T.x, jp.z - T.z) < 20) { m.paso = 1; m.ocultar?.(1); m.espera = 2; } return; }
          if (m.paso === 1) {
            const vivos = (m.malos || []).filter(g => !g.muerto);
            m.objetivos = vivos;
            if (!vivos.length) {
              if (m.oleada >= 3) { m.paso = 2; j.policia.subir(3); j.hud.grande('¡AGUANTASTE!', 'Ahora pierde a la policía', 2.4, 'exito'); return; }
              m.espera -= dt;
              m.objetivo(`Oleada <b>${m.oleada + 1} de 3</b> en camino…`);
              if (m.espera <= 0) {
                m.oleada++; J.salud = Math.min(J.saludMax, J.salud + 35); m.malos = [];
                for (let k = 0; k < 2 + m.oleada; k++) { const a = Math.random() * 6.28; m.malos.push(...matones(m, jp.x + Math.cos(a) * 30, jp.z + Math.sin(a) * 30, 2, ['subfusil', 'escopeta', 'pistola'], 'atacar')); }
                for (const g of m.malos) g.salud = 70 + m.oleada * 15;
                m.espera = 5; j.hud.grande('OLEADA ' + m.oleada, 'Vienen ' + m.malos.length + ' Nopaleros', 1.8);
              }
            } else m.objetivo(`Oleada <b>${m.oleada} de 3</b> · quedan <b>${vivos.length}</b>.`);
          }
          if (m.paso === 2) { m.objetivo('<b>Pierde a la policía.</b>'); if (!j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Marisol "La Jefa"', 'El tianguis es mío. Te ganaste tu parte, y un lugar en mi mesa.']]); }
      },
      {
        titulo: 'GUERRA EN EL ESTADIO', premio: 9000,
        inicio(m) {
          m.malos = null; m.jefe = null; m.charro = null; m.tienda = null; m.oleada = 0;
          const j = m.j, E = j.ciudad.lugares.estadio;
          m.dialogo([['Marisol "La Jefa"', 'Se acabó el juego. El jefe de los Nopaleros, El Charro Durán, está en el estacionamiento del estadio.'], ['Marisol "La Jefa"', 'Trae a toda su gente y dos camionetas blindadas. Llévate todo lo que tengas.']]);
          j.jugador.darArma('rifle', 120); j.jugador.darArma('granada', 4); j.jugador.darArma('lanzacohetes', 3);
          const p = libre(j, E.x + 40, E.z + 20); m.base = p;
          m.malos = matones(m, p.x, p.z, 8, ['subfusil', 'escopeta', 'rifle', 'pistola']);
          m.charro = matones(m, p.x + 3, p.z + 3, 1, ['escopeta'])[0]; m.charro.salud = 420; m.charro.jefe = true;
          for (const k of [-1, 1]) { const c = coche(m, 'camioneta', '#1a1a1e', { x: p.x + k * 8, z: p.z - 6, yaw: Math.PI / 2 }); c.salud = c.t.salud * 2.5; }
          m.marcar(1, p.x, p.z, 8, 3, '#ff3b5a');
          m.objetivo('Ve al <b>estacionamiento del estadio</b> y acaba con <b>El Charro Durán</b>.');
        },
        actualizar(m) {
          const j = m.j;
          despertar(m, [...m.malos, m.charro], 55);
          if (m.paso === 0) {
            m.objetivos = [m.charro, ...m.malos].filter(g => !g.muerto);
            m.objetivo(m.charro.muerto ? `El Charro cayó. Quedan <b>${m.objetivos.length}</b> de su gente.` : `Acaba con <b>El Charro Durán</b> (salud ${Math.max(0, Math.round(m.charro.salud))}) · gente: <b>${m.malos.filter(g => !g.muerto).length}</b>.`);
            if (m.charro.muerto && m.malos.filter(g => !g.muerto).length <= 2) { m.paso = 1; j.policia.subir(5); j.hud.grande('¡CAYÓ EL CHARRO!', 'Toda la policía viene por ti', 2.6); }
          }
          if (m.paso === 1) { m.objetivo('<b>Pierde a la policía</b> (5 estrellas y helicóptero).'); if (!j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.noticias?.avisar('persecucion'); m.j.hud.dialogos([['Marisol "La Jefa"', 'Santa Jacaranda ya tiene dueña. Y tú eres mi mano derecha.']]); }
      }
    ]
  },
  ruelas: {
    nombre: 'Capitán Ruelas', letra: 'Q', modelo: 'peaton7', color: '#4a8aff', zona: 'Hospital', requisito: 1,
    apariencia: { camisa: '#1a2a4a', pantalon: '#22262e', lentes: true, reloj: true, sombrero: null, complexion: 1.15, edad: 'adulto', barba: 'candado', mangaCorta: false, mujer: false, peloLargo: false },
    lugar: j => { const H = j.ciudad.lugares.hospital; return libre(j, H.x + 22, H.z + 6); },
    lista: [
      {
        titulo: 'REHENES EN LA FARMACIA', premio: 3200,
        inicio(m) {
          m.malos = null; m.rehenes = null; m.jefe = null; m.tienda = null; m.alarma = false; m.convoy = null; m.venado = null; m.huye = null;
          const j = m.j, jp = j.jugador.posicion, T = j.interiores.tiendas.filter(t => t.tipo === 'tienda');
          m.dialogo([['Capitán Ruelas', 'Soy Ruelas, jefe de Seguridad Escudo. Unos asaltantes tienen a tres empleados de rodillas en una farmacia.'], ['Capitán Ruelas', 'La policía va a entrar a lo bruto. Tú entras antes. Te presto un táser: si los dejas tirados, rematas sin tirarle a los rehenes.']]);
          j.jugador.darArma('taser', 9); j.jugador.darArma('pistola', 36);
          m.tienda = T.find(t => /farmacia/i.test(t.nombre)) || T.sort((a, b) => Math.hypot(a.puerta.x - jp.x, a.puerta.z - jp.z) - Math.hypot(b.puerta.x - jp.x, b.puerta.z - jp.z))[0];
          m.marcar(1, m.tienda.puerta.x, m.tienda.puerta.z, 2, 3, '#4a8aff');
          m.objetivo(`Entra a <b>${m.tienda.nombre}</b> y libera a los rehenes.`);
        },
        actualizar(m) {
          const j = m.j, I = j.interiores, t = m.tienda;
          if (m.paso === 0) {
            if (I.dentro === t && !m.malos) {
              m.malos = matonesDentro(m, t, 4, ['pistola', 'subfusil', 'escopeta']);
              const X = t.interior.ox, Z = t.interior.oz - t.interior.L / 2 + 1.3;
              m.rehenes = [-2.4, -0.4, 1.6].map((dx, k) => { const g = new Peaton(j, { tipo: 'civil', x: X + dx, z: Z + 2.2 + (k % 2) * 0.6, estado: 'agachado' }); g.tAgachado = 1e9; g.enInterior = t; g.objetivoMision = true; g.rehen = true; g.yaw = 0; g.grupo.visible = true; j.peatones.push(g); m.extra.push(g); return g; });
              j.hud.grande('¡REHENES!', 'Cuidado con a quién le tiras', 2.2);
            }
            if (m.rehenes) {
              if (m.rehenes.some(g => g.muerto)) return 'falla Murió un rehén.';
              for (const g of m.rehenes) if (g.estado !== 'agachado') { g.estado = 'agachado'; g.tAgachado = 1e9; }
              m.objetivos = m.malos.filter(g => !g.muerto);
              m.objetivo(`Acaba con los asaltantes sin herir a los rehenes: quedan <b>${m.objetivos.length}</b>.`);
              if (!m.objetivos.length) { m.paso = 1; for (const g of m.rehenes) { g.estado = 'quieto'; g.p.cuerpo.position.y = 0; } j.hud.grande('¡REHENES A SALVO!', 'Sal de la farmacia', 2.2, 'exito'); }
            }
          }
          if (m.paso === 1) { m.objetivos = []; m.objetivo('Sal de la farmacia.'); if (!I.dentro) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Capitán Ruelas', 'Tres empleados vivos y ni un rasguño. Así se trabaja.']]); }
      },
      {
        titulo: 'SILENCIO EN EL MERCADO', premio: 4500,
        inicio(m) {
          m.malos = null; m.rehenes = null; m.jefe = null; m.tienda = null; m.alarma = false; m.convoy = null; m.venado = null; m.huye = null; m.libreta = null;
          const j = m.j;
          m.dialogo([['Capitán Ruelas', 'El Contador lava dinero en la fonda del mercado de noche. Tiene una libreta con todos los nombres.'], ['Capitán Ruelas', 'Entra con esta ballesta. Si nadie oye nada, te doy un extra. Si suena un balazo, se te vienen todos encima.']]);
          j.jugador.darArma('ballesta', 12); j.jugador.darArma('cuchillo');
          m.tienda = j.interiores.tiendas.find(t => t.tipo === 'mercado');
          m.marcar(1, m.tienda.puerta.x, m.tienda.puerta.z, 2, 3, '#4a8aff');
          m.objetivo('Entra al <b>Mercado de San Jacinto</b> sin hacer ruido.');
        },
        actualizar(m) {
          const j = m.j, I = j.interiores, t = m.tienda;
          if (m.paso === 0) {
            if (I.dentro === t && !m.malos) {
              m.malos = matonesDentro(m, t, 5, ['pistola', 'subfusil', 'escopeta']);
              m.jefe = matonesDentro(m, t, 1, ['pistola'])[0]; m.jefe.salud = 130; m.jefe.jefe = true;
              for (const g of [...m.malos, m.jefe]) { g.estado = 'quieto'; g.yaw = Math.random() * 6.28; }
              j.hud.grande('EL CONTADOR', 'Sin ruido: usa la ballesta', 2.2);
            }
            if (m.malos) {
              const todos = [...m.malos, m.jefe], vivos = todos.filter(g => !g.muerto);
              if (!m.alarma && vivos.some(g => g.estado === 'atacar' || g.estado === 'perseguir')) { m.alarma = true; for (const g of vivos) g.estado = 'atacar'; j.hud.grande('¡TE DESCUBRIERON!', 'Ya no hay extra', 2); }
              m.objetivos = vivos;
              m.objetivo(m.alarma ? `Acaba con todos: quedan <b>${vivos.length}</b>.` : `Elimina a los <b>${vivos.length}</b> sin que te descubran.`);
              if (!vivos.length) { m.paso = 1; m.libreta = j.crearRecogible('sobre', m.jefe.pos.x + 0.5, m.jefe.pos.z); m.extra.push(m.libreta.malla); m.objetivos = []; }
            }
          }
          if (m.paso === 1) { m.objetivo('Recoge <b>la libreta</b> de El Contador.'); if (m.libreta.tomado) { m.paso = 2; if (m.alarma) j.policia.subir(3); } }
          if (m.paso === 2) { m.objetivo(m.alarma ? 'Sal del mercado y <b>pierde a la policía</b>.' : 'Sal del mercado.'); if (!I.dentro && !j.policia.estrellas) { if (!m.alarma) { j.jugador.dinero += 1500; j.hud.notificar('ok', 'Trabajo limpio', 'Extra de $1,500 por no hacer ruido.', 3); } return 'ok'; } }
        },
        fin(m) { m.j.hud.dialogos([['Capitán Ruelas', 'Con esta libreta caen veinte. Y nadie supo que fuiste tú.']]); }
      },
      {
        titulo: 'EL CONVOY', premio: 6500,
        inicio(m) {
          m.malos = []; m.rehenes = null; m.jefe = null; m.tienda = null; m.alarma = false; m.venado = null; m.huye = null;
          const j = m.j, jp = j.jugador.posicion;
          m.dialogo([['Capitán Ruelas', 'Tres camionetas blindadas van a cruzar la ciudad con el dinero de El Contador.'], ['Capitán Ruelas', 'Ahí te va una escopeta de tambor y un lanzacohetes. Que no llegue ninguna.']]);
          j.jugador.darArma('escopetaAuto', 36); j.jugador.darArma('lanzacohetes', 3); j.jugador.darArma('granada', 3);
          const p0 = puntoCalleAleatorio(jp, 110, 200, 80) || { x: jp.x + 140, z: jp.z, yaw: 0 };
          m.convoy = [0, 1, 2].map(k => { const p = puntoCalleAleatorio(p0, 4 + k * 9, 14 + k * 12, 30) || { x: p0.x + k * 10, z: p0.z, yaw: p0.yaw }; const c = coche(m, 'camioneta', '#141416', p, true); c.salud = c.t.salud * 2.2; c.fugitivo = true; c.convoy = true; c.escolta = false; return c; });
          m.objetivo('Destruye las <b>3 camionetas</b> del convoy.');
        },
        actualizar(m) {
          const j = m.j, jp = j.jugador.posicion;
          const vivas = m.convoy.filter(c => !c.quemado && j.coches.includes(c));
          for (const c of vivas) {
            if (c.pos.distanceTo(jp) < 70) c.panico = Math.max(c.panico || 0, 8);
            if (!c.escolta && c.salud < c.t.salud * 0.9) { c.escolta = true; m.malos.push(...matones(m, c.pos.x, c.pos.z, 2, ['subfusil', 'escopeta'], 'atacar')); if (!j.policia.estrellas) j.policia.subir(2); }
          }
          for (const c of m.convoy) if (!c.escolta && c.quemado) { c.escolta = true; m.malos.push(...matones(m, c.pos.x, c.pos.z, 2, ['subfusil', 'escopeta'], 'atacar')); }
          if (m.paso === 0) {
            m.objetivos = vivas;
            m.objetivo(`Destruye las camionetas del convoy: quedan <b>${vivas.length}</b>.`);
            if (!vivas.length) { m.paso = 1; j.policia.subir(3); j.hud.grande('¡CONVOY DESTRUIDO!', 'Pierde a la policía', 2.4, 'exito'); }
            if (vivas.some(c => c.pos.distanceTo(jp) > 520)) return 'falla Se te escapó una camioneta.';
          }
          if (m.paso === 1) { m.objetivos = m.malos.filter(g => !g.muerto && g.pos.distanceTo(jp) < 60); m.objetivo('<b>Pierde a la policía.</b>'); if (!j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.noticias?.avisar('persecucion'); m.j.hud.dialogos([['Capitán Ruelas', 'Tres camionetas en llamas en pleno centro. Mañana vas a salir en el noticiero.']]); }
      },
      {
        titulo: 'CAZA EN EL LAGO', premio: 8000,
        inicio(m) {
          m.malos = null; m.rehenes = null; m.jefe = null; m.tienda = null; m.alarma = false; m.convoy = null; m.huye = null;
          const j = m.j, L = j.ciudad.lugares.lago;
          m.dialogo([['Capitán Ruelas', 'El Venado Arriaga, el sicario de El Contador, está en el muelle del Lago Azul con su escolta.'], ['Capitán Ruelas', 'Si te ve llegar, se sube a su deportivo y no lo vuelves a ver. Tíralo de lejos.']]);
          j.jugador.darArma('francotirador', 15); j.jugador.darArma('ballesta', 12);
          const p = libre(j, L.x + 14, L.z + 4); m.base = p;
          m.malos = matones(m, p.x, p.z, 5, ['subfusil', 'escopeta', 'rifle']);
          m.venado = matones(m, p.x, p.z, 1, ['pistolaOro'])[0]; m.venado.salud = 90; m.venado.jefe = true;
          const pc = puntoCalleAleatorio(p, 8, 30, 20) || { x: p.x + 10, z: p.z, yaw: 0 };
          m.auto = coche(m, 'deportivo', '#e8e8ec', pc, false); m.auto.reservado = true;
          m.marcar(1, p.x, p.z, 10, 3, '#4a8aff');
          m.objetivo('Acaba con <b>El Venado Arriaga</b> antes de que te vea. Usa el francotirador.');
        },
        actualizar(m) {
          const j = m.j, jp = j.jugador.posicion, v = m.venado;
          if (m.paso === 0) {
            despertar(m, m.malos, 40);
            m.objetivos = [v];
            const alerta = !v.muerto && (v.pos.distanceTo(jp) < 42 || v.estado === 'atacar' || m.malos.some(g => g.estado === 'atacar' || g.muerto));
            if (v.muerto) { m.paso = 2; j.policia.subir(3); j.hud.grande('¡CAYÓ EL VENADO!', 'Pierde a la policía', 2.2, 'exito'); }
            else if (alerta) {
              m.paso = 1; const c = m.auto; v.grupo.visible = false; const i = j.peatones.indexOf(v); if (i >= 0) { v.quitar(); j.peatones.splice(i, 1); }
              c.conductor = 'ia'; c.id = 960; c.fugitivo = true; c.panico = 999; c.salud = c.t.salud * 1.6; c.reservado = false; m.huye = c;
              for (const g of m.malos) if (!g.muerto) g.estado = 'atacar';
              j.hud.grande('¡SE ESCAPA!', 'Destruye el deportivo blanco', 2.2);
            }
          }
          if (m.paso === 1) {
            const c = m.huye; m.objetivos = [c];
            m.objetivo('El Venado huye: <b>destruye el deportivo blanco</b>.');
            c.panico = 999;
            if (c.quemado) { m.paso = 2; j.policia.subir(3); j.hud.grande('¡CAYÓ EL VENADO!', 'Pierde a la policía', 2.2, 'exito'); }
            else if (!j.coches.includes(c) || c.pos.distanceTo(jp) > 420) return 'falla Se escapó El Venado.';
          }
          if (m.paso === 2) { m.objetivos = []; m.objetivo('<b>Pierde a la policía.</b>'); if (!j.policia.estrellas) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['Capitán Ruelas', 'Sin su sicario, El Contador está solo. Cuando quieras trabajo, ya sabes dónde estoy.']]); }
      }
    ]
  },
  profe: {
    nombre: 'El Profe', letra: 'H', modelo: 'peaton9', color: '#7ae0ff', zona: 'Banco Central', requisito: 2,
    apariencia: { camisa: '#3a3a44', pantalon: '#22262e', lentes: true, reloj: true, sombrero: null, complexion: 0.95, edad: 'mayor', barba: 'candado', mangaCorta: false, mujer: false, peloLargo: false },
    lugar: j => { const B = j.ciudad.lugares.banco; return libre(j, B.x - 22, B.z + 10); },
    lista: [
      {
        titulo: 'EL RECONOCIMIENTO', premio: 600,
        inicio(m) {
          m.malos = null; m.joyas = null; m.fotos = null; m.modo = null; m.alarma = false; m.auto = null; m.maleta = null;
          const j = m.j;
          m.dialogo([['El Profe', 'Llevo veinte años planeando golpes y nunca he pisado una cárcel. ¿Sabes por qué? Porque primero se mira.'], ['El Profe', 'Ve a la Joyería Diamante como cliente. Fíjate en las cámaras, las vitrinas y la caja fuerte. Párate junto a cada cosa.']]);
          m.tienda = j.interiores.tiendas.find(t => t.tipo === 'joyeria');
          m.marcar(1, m.tienda.puerta.x, m.tienda.puerta.z, 2, 3, '#7ae0ff');
          m.objetivo('Entra a la <b>Joyería Diamante</b>.');
        },
        actualizar(m) {
          const j = m.j, I = j.interiores, t = m.tienda, J = j.jugador;
          if (m.paso === 0 && I.dentro === t) {
            const X = t.interior.ox, Z = t.interior.oz, L = t.interior.L, W = t.interior.W;
            m.fotos = [['las cámaras', X - W / 2 + 1.4, Z - L / 2 + 1.6], ['las vitrinas', X, Z + 1.0], ['la caja fuerte', X + W / 2 - 2, Z - L / 2 + 2.0]].map(([n, x, z]) => { const r = j.crearRecogible('sobre', x, z); r.texto = 'Viste ' + n; m.extra.push(r.malla); return r; });
            m.paso = 1;
          }
          if (m.paso === 1) {
            const n = m.fotos.filter(r => r.tomado).length;
            m.objetivo(`Revisa la joyería: <b>${n} de 3</b> (cámaras, vitrinas, caja fuerte).`);
            if (n === 3) { m.paso = 2; j.hud.grande('YA LO VISTE TODO', 'Sal sin llamar la atención', 2); }
          }
          if (m.paso === 2) { m.objetivo('Sal de la joyería.'); if (!I.dentro) return 'ok'; }
        },
        fin(m) { m.j.hud.dialogos([['El Profe', 'Tres cámaras, seis vitrinas y una caja que no vale la pena. Ahora necesitamos con qué irnos.']]); }
      },
      {
        titulo: 'EL AUTO DE ESCAPE', premio: 900,
        inicio(m) {
          m.malos = null; m.joyas = null; m.fotos = null; m.modo = null; m.alarma = false; m.maleta = null;
          const j = m.j, t = j.interiores.tiendas.find(q => q.tipo === 'joyeria');
          m.tienda = t;
          m.dialogo([['El Profe', 'Hay un deportivo negro estacionado en la ciudad que nadie va a extrañar. Es el más rápido que conozco.'], ['El Profe', 'Llévalo a la vuelta de la joyería y déjalo ahí. Sin policía detrás, que no lo vean.']]);
          m.auto = coche(m, 'deportivo', '#101012', null, false);
          m.escondite = puntoCalleAleatorio(t.puerta, 25, 55, 30) || { x: t.puerta.x + 30, z: t.puerta.z, yaw: 0 };
          m.objetivos = [m.auto];
          m.objetivo('Roba el <b>deportivo negro</b>.');
        },
        actualizar(m) {
          const j = m.j, c = m.auto, J = j.jugador;
          if (c.quemado || c.ahogado) return 'falla Se destruyó el auto de escape.';
          if (m.paso === 0) { if (J.coche === c) { m.paso = 1; m.objetivos = []; m.marcar(1, m.escondite.x, m.escondite.z, 4, 2, '#7ae0ff'); } return; }
          if (m.paso === 1) {
            const d = Math.hypot(c.pos.x - m.escondite.x, c.pos.z - m.escondite.z);
            m.objetivo(j.policia.estrellas ? '<b>Pierde a la policía</b> antes de dejar el auto.' : d < 6 ? 'Bájate y <b>deja el auto</b> ahí.' : 'Deja el auto a la <b>vuelta de la joyería</b>.');
            if (d < 6 && J.coche !== c && !j.policia.estrellas) { j.atracoEscondite = { x: c.pos.x, z: c.pos.z, yaw: c.yaw }; return 'ok'; }
          }
        },
        fin(m) { m.j.hud.dialogos([['El Profe', 'Perfecto. Ahí se queda hasta el día del golpe.']]); }
      },
      {
        titulo: 'EL EQUIPO', premio: 900,
        inicio(m) {
          m.malos = null; m.joyas = null; m.fotos = null; m.modo = null; m.alarma = false; m.auto = null;
          const j = m.j, T = j.interiores.tiendas.find(q => q.tipo === 'trinchera') || j.interiores.tiendas.find(q => q.tipo === 'armeria');
          m.dialogo([['El Profe', 'En Excedentes La Trinchera me guardan una maleta: cortavidrios, guantes y uniformes de Seguridad Escudo.'], ['El Profe', 'Los Halcones saben que existe. Recógela y tráemela.']]);
          const p = libre(j, T.puerta.x + T.fx * 4 + T.fz * 3, T.puerta.z + T.fz * 4 - T.fx * 3);
          m.maleta = j.crearRecogible('sobre', p.x, p.z); m.maleta.texto = 'Tienes la maleta del Profe'; m.extra.push(m.maleta.malla);
          m.marcar(1, p.x, p.z, 2, 3, '#7ae0ff');
          m.objetivo('Recoge la <b>maleta</b> afuera de La Trinchera.');
        },
        actualizar(m) {
          const j = m.j;
          if (m.paso === 0 && m.maleta.tomado) {
            m.paso = 1; const jp = j.jugador.posicion;
            m.malos = [];
            for (const a of [0.8, 3.6]) { const p = libre(j, jp.x + Math.cos(a) * 26, jp.z + Math.sin(a) * 26); m.malos.push(...matones(m, p.x, p.z, 3, ['pistola', 'subfusil', 'escopeta'], 'atacar')); }
            j.hud.grande('¡LOS HALCONES!', 'Te estaban esperando', 2);
            const P = CONTACTOS.profe.lugar(j); m.marcar(1, P.x, P.z, 2, 3, '#7ae0ff');
          }
          if (m.paso === 1) {
            m.objetivos = m.malos.filter(g => !g.muerto && g.pos.distanceTo(j.jugador.posicion) < 60);
            m.objetivo('Lleva la maleta con <b>El Profe</b>' + (m.objetivos.length ? ` · quedan <b>${m.objetivos.length}</b> Halcones cerca.` : '.'));
            const P = CONTACTOS.profe.lugar(j), jp = j.jugador.posicion;
            if (Math.hypot(jp.x - P.x, jp.z - P.z) < 4 && !j.policia.estrellas) { j.jugador.darArma('taser', 9); return 'ok'; }
            if (Math.hypot(jp.x - P.x, jp.z - P.z) < 4) m.objetivo('<b>Pierde a la policía</b> antes de entregar la maleta.');
          }
        },
        fin(m) { m.j.hud.dialogos([['El Profe', 'Todo completo. Te dejo un táser: mañana no quiero muertos si se puede evitar.']]); }
      },
      {
        titulo: 'EL GOLPE A LA JOYERÍA', premio: 12000,
        inicio(m) {
          m.malos = null; m.joyas = null; m.fotos = null; m.modo = null; m.alarma = false; m.maleta = null;
          const j = m.j, t = j.interiores.tiendas.find(q => q.tipo === 'joyeria');
          m.tienda = t; reponerVitrinas(t);
          m.dialogo([['El Profe', 'Hoy es el día. Tienes dos caminos.'], ['El Profe', 'Callado: párate en la marca azul, te pones el uniforme de Seguridad Escudo y entras como guardia. Duerme a los 3 guardias sin que nadie oiga (táser, silenciador o por la espalda) y vacía las vitrinas. Pago completo.'], ['El Profe', 'A lo bruto: entras directo, suena la alarma y tienes la policía encima. Se gana menos. Tú decides.']]);
          const E = j.atracoEscondite || puntoCalleAleatorio(t.puerta, 25, 55, 30) || { x: t.puerta.x + 30, z: t.puerta.z, yaw: 0 };
          m.auto = coche(m, 'deportivo', '#101012', E, false); m.auto.reservado = true;
          m.azul = libre(j, t.puerta.x + t.fz * 6 + t.fx * 2, t.puerta.z - t.fx * 6 + t.fz * 2);
          m.marcar(1, m.azul.x, m.azul.z, 1.5, 2, '#3a8aff'); m.marcar(2, t.puerta.x, t.puerta.z, 2, 3, '#ff3b5a');
          m.objetivo('Elige: <b>marca azul</b> (callado) o <b>puerta</b> (a lo bruto).');
        },
        actualizar(m, dt) {
          const j = m.j, I = j.interiores, t = m.tienda, J = j.jugador, jp = J.posicion;
          if (m.paso === 0) {
            if (!m.modo && Math.hypot(jp.x - m.azul.x, jp.z - m.azul.z) < 1.6) { m.modo = 'callado'; m.ocultar?.(1); j.hud.grande('UNIFORME PUESTO', 'Ahora eres de Seguridad Escudo', 2); m.objetivo('Entra a la joyería <b>sin hacer ruido</b>.'); }
            if (I.dentro === t) {
              if (!m.modo) m.modo = 'bruto';
              m.ocultar?.(1); m.ocultar?.(2);
              m.malos = matonesDentro(m, t, 3, ['pistola', 'escopeta', 'pistola']);
              m.joyas = t.vitrinas.map(v => { const r = j.crearRecogible('sobre', v.x, v.z); r.texto = 'Joyas en la bolsa'; r.vit = v; m.extra.push(r.malla); r.malla.children[0].material.color.set('#e0b040'); return r; });
              if (m.modo === 'callado') for (const g of m.malos) { g.estado = 'quieto'; g.yaw = Math.random() * 6.28; }
              else { m.alarma = true; j.policia.subir(3); j.hud.grande('¡A LO BRUTO!', 'Ya sonó la alarma: rápido', 2); }
              m.paso = 1; m.reloj = 75;
            }
          }
          if (m.paso === 1) {
            for (const r of m.joyas) if (r.tomado && !r.vit.rota) romperVitrina(j, r.vit);
            const vivos = m.malos.filter(g => !g.muerto), n = m.joyas.filter(r => r.tomado).length;
            if (!m.alarma && (vivos.some(g => g.estado === 'atacar' || g.estado === 'perseguir') || j.policia.estrellas)) { m.alarma = true; for (const g of vivos) g.estado = 'atacar'; if (j.policia.estrellas < 3) j.policia.subir(3); j.hud.grande('¡SONÓ LA ALARMA!', 'Ya no es pago completo', 2); }
            if (m.alarma) { m.reloj -= dt; if (m.reloj <= 0 && j.policia.estrellas < 4) { j.policia.subir(4); j.hud.grande('¡LLEGÓ EL GRUPO ESPECIAL!', 'Sal de ahí', 2); } }
            m.objetivos = m.modo === 'callado' && !m.alarma ? vivos : [];
            m.objetivo((m.modo === 'callado' && !m.alarma && vivos.length ? `Duerme a los guardias sin ruido: <b>${vivos.length}</b> · ` : '') + `Joyas: <b>${n} de 6</b> (mínimo 4)` + (m.alarma ? ` · grupo especial en <b>${Math.max(0, Math.ceil(m.reloj))} s</b>` : ''));
            if (n >= 4 && (n === 6 || !I.dentro)) { m.paso = 2; m.botin = n; }
            if (!I.dentro && n < 4) m.objetivo(`Te faltan joyas: <b>${n} de 4</b>. Regresa a la joyería.`);
          }
          if (m.paso === 2) {
            const c = m.auto, P = j.tuneo?.punto || j.ciudad.lugares.taller;
            if (c.quemado || c.ahogado) return 'falla Se destruyó el auto de escape.';
            if (J.coche !== c) { m.objetivos = I.dentro ? [] : [c]; m.objetivo('Sal y súbete al <b>auto de escape</b> negro.'); return; }
            m.objetivos = []; m.marcar(1, P.x, P.z, 4, 2, '#7ae0ff');
            const d = Math.hypot(c.pos.x - P.x, c.pos.z - P.z);
            m.objetivo(j.policia.estrellas ? '<b>Pierde a la policía</b> y lleva el botín al taller de Don Chuy.' : 'Lleva el botín al <b>taller de Don Chuy</b>.');
            if (d < 7 && !j.policia.estrellas) { const extra = m.modo === 'callado' && !m.alarma ? 13000 : m.botin * 1500; j.jugador.dinero += extra; j.hud.notificar('dinero', m.modo === 'callado' && !m.alarma ? 'Golpe perfecto' : 'Golpe ruidoso', '+$' + extra.toLocaleString('es-MX') + ' extra', 4); return 'ok'; }
          }
        },
        fin(m) { m.j.noticias?.avisar('joyeria'); m.j.hud.dialogos([['El Profe', m.modo === 'callado' && !m.alarma ? 'Ni una alarma. Eso, mi alumno, es arte.' : 'Ruidoso, pero salimos. La próxima vez, más fino.']]); }
      }
    ]
  },
  ines: {
    nombre: 'Capitana Inés Robles', letra: 'I', modelo: 'peaton8', color: '#7ae0ff', zona: 'Aeropuerto Internacional', requisito: 1,
    apariencia: { mujer: true, peloLargo: true, pelo: '#2a1a10', camisa: '#1a2846', pantalon: '#1a1a1e', lentes: true, reloj: true, sombrero: null, complexion: 1.0 },
    lugar: j => ({ x: 62, z: 380 }),
    lista: [
      {
        titulo: 'UNIFORME PRESTADO', premio: 1500,
        inicio(m) {
          m.malos = null; m.pena = null; m.uniforme = null; m.fotos = null;
          const j = m.j;
          m.dialogo([['Capitana Inés Robles', 'Fui piloto de Jacaranda Cargo hasta que vi lo que meten en sus aviones. Me corrieron y nadie me creyó.'], ['Capitana Inés Robles', 'Para entrar a la pista necesitas uniforme de seguridad. El Oficial Peña fuma a escondidas detrás de la terminal. Duérmelo y quítale el suyo.']]);
          const g = new Peaton(j, { tipo: 'poli', x: 125, z: 404, estado: 'quieto', arma: 'pistola' }); g.fila = true; g.objetivoMision = true; g.yaw = -Math.PI / 2; g.salud = 60; j.peatones.push(g); m.extra.push(g); m.pena = g;
          m.objetivos = [g];
          m.objetivo('Noquea al <b>Oficial Peña</b> detrás de la terminal (táser, golpe por la espalda agachado o como puedas).');
        },
        actualizar(m) {
          const j = m.j, g = m.pena;
          if (m.paso === 0 && (g.muerto || g.estado === 'aturdido')) {
            m.paso = 1; m.objetivos = []; m.uniforme = j.crearRecogible('sobre', g.pos.x + 1, g.pos.z); m.uniforme.texto = 'Tienes el uniforme de seguridad'; m.extra.push(m.uniforme.malla);
            if (g.estado === 'aturdido') g.tAturdido = 30;
          }
          if (m.paso === 0 && g.estado === 'perseguir') m.objetivo('¡Te vio! Noquéalo rápido.');
          if (m.paso === 1) { m.objetivo('Toma el <b>uniforme</b>.'); if (m.uniforme.tomado) { j.propiedades.uniforme = true; j.guardar(); return 'ok'; } }
        },
        fin(m) { m.j.hud.dialogos([['Capitana Inés Robles', 'Perfecto. Póntelo en los vestidores del personal, junto a la puerta de servicio. Con él los guardias no te molestan si no corres cerca ni disparas.']]); }
      },
      {
        titulo: 'LA LISTA DE CARGA', premio: 3500,
        inicio(m) {
          m.malos = null; m.pena = null; m.uniforme = null; m.fotos = null;
          const j = m.j, V = j.aeropuerto.vestidor;
          m.dialogo([['Capitana Inés Robles', 'Necesito pruebas. En el Hangar 7 están los papeles de la carga: tómales foto a los tres.'], ['Capitana Inés Robles', 'Ponte el uniforme y entra por la puerta de servicio. Si te descubren, se acabó.']]);
          m.marcar(1, V.x, V.z - 1.5, 1.5, 2, '#7ae0ff');
          m.objetivo('Ponte el <b>uniforme</b> en los vestidores del personal (E).');
        },
        actualizar(m) {
          const j = m.j, AP = j.aeropuerto, J = j.jugador;
          if (AP.alerta > 0) return 'falla Te descubrieron en la pista.';
          if (m.paso === 0) { if (J.disfraz) { m.paso = 1; m.ocultar(1); m.fotos = AP.fotosHangar.map(([x, z]) => { const r = j.crearRecogible('sobre', x, z); r.texto = 'Foto de la lista de carga'; m.extra.push(r.malla); return r; }); m.marcar(1, AP.hangar7.x, AP.hangar7.z + 18, 4, 3, '#7ae0ff'); } return; }
          if (m.paso === 1) {
            if (j.jugador.pos.distanceTo(new m.j.camara.position.constructor(AP.hangar7.x, 0, AP.hangar7.z)) < 30) m.ocultar(1);
            const n = m.fotos.filter(r => r.tomado).length;
            m.objetivo(`Entra al <b>Hangar 7</b> sin correr cerca de los guardias y toma las fotos: <b>${n} de 3</b>.`);
            if (n >= 3) m.paso = 2;
            return;
          }
          m.objetivo('Sal del aeropuerto sin levantar sospechas.');
          if (!AP.enZonaAerea(J.pos.x, J.pos.z)) return 'ok';
        },
        fin(m) { m.j.hud.dialogos([['Capitana Inés Robles', 'Aquí está: oro, dinero y documentos de la ciudad. Esta noche se van en el Vuelo 7. No se van a ir.']]); }
      },
      {
        titulo: 'EL VUELO 7', premio: 15000,
        inicio(m) {
          m.malos = null; m.pena = null; m.uniforme = null; m.fotos = null;
          const j = m.j, V = j.vuelo, JT = V.jet;
          m.dialogo([['Capitana Inés Robles', 'El avión de carga está frente al Hangar 7. Súbete, despega por el rodaje o la pista y llévalo al Aeródromo Jacaranda, en la carretera a la Sierra.'], ['Capitana Inés Robles', 'En cuanto arranquen los motores va a sonar todo. Vuela bajo hasta salir y aterriza despacio: W para acelerar, Espacio para subir, Shift para bajar.']]);
          V.jetMision = true; if (!JT.quemado) V.reponer(JT);
          m.objetivos = [JT];
          m.objetivo('Llega al <b>avión de carga</b> frente al Hangar 7 y súbete (F). Mejor con uniforme.');
        },
        actualizar(m) {
          const j = m.j, V = j.vuelo, JT = V.jet, A = V.activa;
          if (JT.quemado) return 'falla Se destruyó el avión.';
          if (m.paso === 0) { if (A === JT) { m.paso = 1; m.objetivos = []; j.aeropuerto.alarma('¡Se están robando el avión!'); const P = { x: 561, z: 0 }; m.marcar(1, P.x, P.z, 40, 6, '#7ae0ff'); } return; }
          m.objetivo(A === JT ? 'Vuela al <b>Aeródromo Jacaranda</b> y aterriza el avión.' : 'Regresa al <b>avión de carga</b>.');
          if (A === JT && V.enTierra(JT) && JT.v < 3 && Math.hypot(JT.pos.x - 561, JT.pos.z) < 260) { j.propiedades.jet = true; return 'ok'; }
        },
        falla(m) { m.j.vuelo.jetMision = false; },
        fin(m) { const j = m.j; j.vuelo.jetMision = false; j.propiedades.jet = true; j.guardar(); j.noticias?.avisar('aeropuerto'); j.hud.dialogos([['Capitana Inés Robles', '¡Lo hiciste! Con lo que traía ese avión, Jacaranda Cargo se acabó. Y el avión… digamos que ahora es tuyo. Te espera en el Aeródromo.']]); }
      }
    ]
  }
};
