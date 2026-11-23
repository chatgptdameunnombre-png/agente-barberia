import { Coche, puntoCalleAleatorio } from './vehiculos.js?v=202611231659';
import { Peaton } from './peatones.js?v=202611231659';
import { SUBIDA, MIRADOR, alturaCerro } from './sierradatos.js?v=202611231659';

const libre = (j, x, z) => {
  for (let r = 0; r < 16; r += 1) for (let a = 0; a < 12; a++) { const px = x + Math.cos(a * Math.PI / 6) * r, pz = z + Math.sin(a * Math.PI / 6) * r; if (!j.mundo.dentro(px, 1, pz)) return { x: px, z: pz }; }
  return { x, z };
};
const malos = (m, x, z, n, armas, estado = 'atacar', rad = 5) => {
  const l = [];
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2, p = libre(m.j, x + Math.cos(a) * rad, z + Math.sin(a) * rad);
    const g = new Peaton(m.j, { tipo: 'matón', x: p.x, z: p.z, estado, arma: armas[k % armas.length] });
    g.yaw = a + Math.PI; m.j.peatones.push(g); m.extra.push(g); l.push(g);
  }
  return l;
};
const coche = (m, tipo, color, p, ia) => {
  const c = new Coche(m.j, tipo, color, p.x, p.z, p.yaw || 0);
  if (ia) { c.conductor = 'ia'; c.id = 950 + (Math.random() * 40 | 0); } else c.conductor = null;
  c.marcado = true; m.j.coches.push(c); m.extra.push(c); return c;
};
const reset = m => { m.malos = null; m.jefe = null; m.huye = null; m.auto = null; m.camiones = null; m.fotos = 0; m.cp = 0; m.espera = 0; m.seguir = 0; m.cerca = 0; m.rehen = null; };
const cine = (m, x, y, z, dur = 5, radio = 10, alto = 3.5) => m.j.cinematica?.mostrar(x, y, z, dur, radio, alto);

export const LISTA2 = [
  {
    titulo: 'LA VISITA', premio: 1800, parte: 2,
    inicio(m) {
      reset(m); const j = m.j, T = j.ciudad.lugares.taller;
      cine(m, T.x, 1.6, T.z, 6, 9);
      m.dialogo([['Don Chuy', 'Mijo, mientras andabas de fiesta vino gente de un tal El Contador. Quieren que les pague por "protección".'], ['Don Chuy', 'Dijeron que regresaban en un rato. Quédate y recíbelos como se debe. Ahí en la caja hay con qué.']]);
      j.jugador.darArma('pistola', 48); j.jugador.darArma('escopeta', 18);
      m.espera = 9; m.objetivo('Espera a la gente de <b>El Contador</b> en el taller.');
    },
    actualizar(m, dt) {
      const j = m.j, T = j.ciudad.lugares.taller, jp = j.jugador.posicion;
      if (m.paso === 0) {
        m.espera -= dt;
        if (m.espera <= 0) {
          m.malos = [];
          for (const a of [0.6, 2.4]) { const p = libre(j, T.x + Math.cos(a) * 32, T.z + Math.sin(a) * 32); m.malos.push(...malos(m, p.x, p.z, 3, ['pistola', 'subfusil', 'bate'])); }
          j.hud.grande('¡YA LLEGARON!', 'Que no toquen el taller', 2); m.paso = 1;
        }
        return;
      }
      if (m.paso === 1) {
        m.objetivos = m.malos.filter(g => !g.muerto);
        m.objetivo(`Acaba con la gente de El Contador: quedan <b>${m.objetivos.length}</b>.`);
        if (!m.objetivos.length) {
          const p = puntoCalleAleatorio(jp, 30, 60, 30) || { x: jp.x + 40, z: jp.z, yaw: 0 };
          m.huye = coche(m, 'deportivo', '#1a1a1e', p, true); m.huye.fugitivo = true; m.huye.panico = 999; m.huye.salud = m.huye.t.salud * 1.4;
          j.hud.grande('¡UNO SE ESCAPA!', 'Destruye su deportivo negro', 2.2); m.paso = 2;
        }
        return;
      }
      const c = m.huye; c.panico = 999; m.objetivos = [c];
      m.objetivo('Alcanza y destruye el <b>deportivo negro</b>.');
      if (c.quemado) return 'ok';
      if (!j.coches.includes(c) || c.pos.distanceTo(jp) > 420) return 'falla Se escapó y le avisó a El Contador.';
    },
    fin(m) { m.j.hud.dialogos([['Don Chuy', 'El Contador… Ruelas ya me había hablado de él. Lava dinero, compra policías y ahora quiere cobrarle a toda la ciudad.'], ['Don Chuy', 'Si ya vino por mí, va a venir por todos. Vamos a encontrarlo primero.']]); }
  },
  {
    titulo: 'SIGUE AL MENSAJERO', premio: 2200, parte: 2,
    inicio(m) {
      reset(m); const j = m.j, jp = j.jugador.posicion;
      m.dialogo([['Don Chuy', 'Uno de sus mensajeros recoge las cuotas en un sedán negro. Síguelo para saber a dónde lleva el dinero.'], ['Don Chuy', 'No te le pegues mucho, que te ve. Y no lo pierdas.']]);
      const p = puntoCalleAleatorio(jp, 50, 110, 40) || { x: jp.x + 70, z: jp.z, yaw: 0 };
      m.auto = coche(m, 'sedan', '#141416', p, true); m.auto.reservado = true; m.auto.fugitivo = true;
      m.objetivo('Síguelo de cerca, pero <b>no a menos de 14 m</b>.');
    },
    actualizar(m, dt) {
      const j = m.j, c = m.auto, jp = j.jugador.posicion;
      if (c.quemado || !j.coches.includes(c)) return 'falla Se arruinó el seguimiento.';
      c.conductor = 'ia'; m.objetivos = [c];
      const d = Math.hypot(c.pos.x - jp.x, c.pos.z - jp.z);
      if (d < 14) { m.cerca += dt; if (m.cerca > 2.5) return 'falla Te vio y cambió de ruta.'; } else m.cerca = Math.max(0, m.cerca - dt);
      if (d > 140) return 'falla Lo perdiste.';
      if (d < 100) m.seguir += dt;
      m.objetivo(`Siguiendo al mensajero: <b>${Math.floor(m.seguir)} de 70 s</b> · distancia <b>${Math.round(d)} m</b>${d < 20 ? ' · ¡muy cerca!' : d > 85 ? ' · se te aleja' : ''}`);
      if (m.seguir >= 70) return 'ok';
    },
    fin(m) { m.j.hud.dialogos([['Don Chuy', 'Paró en una bodega y le entregó todo a un piloto. El dinero sale por avioneta desde el Aeródromo Jacaranda, en la carretera a la Sierra.'], ['Don Chuy', 'Ahora necesitamos ver qué tanto mueve. Desde el aire.']]); }
  },
  {
    titulo: 'DESDE EL AIRE', premio: 2600, parte: 2,
    inicio(m) {
      reset(m); const j = m.j, L = j.ciudad.lugares;
      m.dialogo([['Don Chuy', 'El Contador mueve su mercancía en tres camiones negros por la ciudad. Desde la calle no los vas a encontrar.'], ['Don Chuy', 'Ve al Aeródromo, en la carretera a la Sierra. Agarra el helicóptero y tómales foto desde arriba, a más de 20 metros.']]);
      m.camiones = [L.mercado, L.estadio, L.hospital].map((P, k) => { const p = puntoCalleAleatorio(P, 15, 70, 40) || { x: P.x + 20, z: P.z, yaw: 0 }; const c = coche(m, 'reparto', '#141416', p, false); c.foto = false; return c; });
      const H = j.sierra?.heliPad; if (H) m.marcar(1, H.x, H.z, 5, 3, '#7ae0ff');
      m.objetivo('Ve al <b>Aeródromo</b> y súbete al <b>helicóptero</b> (F).');
    },
    actualizar(m) {
      const j = m.j, V = j.vuelo, A = V?.activa;
      if (m.paso === 0) { if (A?.tipo === 'heli') { m.paso = 1; m.ocultar(1); } return; }
      if (m.paso === 1) {
        const pend = m.camiones.filter(c => !c.foto);
        m.objetivos = pend;
        if (A) for (const c of pend) { const alt = A.pos.y - Math.max(alturaCerro(A.pos.x, A.pos.z), 0); if (Math.hypot(A.pos.x - c.pos.x, A.pos.z - c.pos.z) < 30 && alt > 20) { c.foto = true; m.fotos++; j.audio?.tono?.(1800, 0.08, 0.12, 'square'); j.hud.notificar('ok', 'Foto tomada', `Camión ${m.fotos} de 3`, 2); } }
        m.objetivo(A ? `Vuela sobre los camiones y tómales foto: <b>${m.fotos} de 3</b>.` : 'Regresa al <b>helicóptero</b>.');
        if (m.fotos >= 3) { m.paso = 2; const H = j.sierra.heliPad; m.marcar(1, H.x, H.z, 8, 3, '#7ae0ff'); }
        return;
      }
      m.objetivos = [];
      m.objetivo('Regresa el helicóptero al <b>Aeródromo</b> y aterriza.');
      if (A && V.enTierra(A) && A.vel.length() < 2 && m.dentro(1, A.pos, 25)) return 'ok';
    },
    fin(m) { m.j.hud.dialogos([['Don Chuy', 'Con esas fotos Ruelas ya sabe a dónde le pega. Pero los Halcones de El Contador se sienten muy machos en la sierra.']]); }
  },
  {
    titulo: 'LA SUBIDA', premio: 3000, parte: 2,
    inicio(m) {
      reset(m); const j = m.j;
      m.dialogo([['Don Chuy', 'Un Halcón presume que nadie sube al Mirador más rápido que él. Le aposté a que tú sí.'], ['Don Chuy', 'Sal por la calzada del oriente, cruza la barda y sube hasta arriba en menos de un minuto y medio. En coche, eh.']]);
      const S = SUBIDA.pts;
      m.cps = [[336, 0], [440, 0], [410, -150], S[Math.floor(S.length * 0.35)], S[Math.floor(S.length * 0.7)], [MIRADOR.x, MIRADOR.z]];
      m.marcar(1, 336, 0, 6, 3, '#ffc94a');
      m.objetivo('En <b>coche</b>, ve a la salida de la ciudad por la calzada del oriente.');
    },
    actualizar(m) {
      const j = m.j, c = j.jugador.coche;
      if (!c) { m.objetivo('Necesitas un <b>coche</b>.'); return; }
      const P = m.cps[m.cp];
      if (Math.hypot(c.pos.x - P[0], c.pos.z - P[1]) < (m.cp === m.cps.length - 1 ? 12 : 9)) {
        m.cp++; j.audio?.tono?.(1100, 0.1, 0.12, 'triangle');
        if (m.cp === 1) { m.reloj = 90; j.hud.grande('¡ARRANCA!', '90 segundos al Mirador', 1.6); }
        if (m.cp >= m.cps.length) return 'ok';
        const N = m.cps[m.cp]; m.marcar(1, N[0], N[1], m.cp === m.cps.length - 1 ? 12 : 9, 3, '#ffc94a');
      }
      m.objetivo(m.cp === 0 ? 'Ve a la <b>salida</b> para empezar.' : `Sube al <b>Mirador</b>: punto <b>${m.cp} de ${m.cps.length - 1}</b>.`);
    },
    fin(m) { m.j.hud.dialogos([['Don Chuy', '¡Ja! El Halcón pagó y además soltó la sopa: El Contador tomó San Isidro, el pueblito junto al aeródromo.']]); }
  },
  {
    titulo: 'SAN ISIDRO', premio: 4000, parte: 2,
    inicio(m) {
      reset(m); const j = m.j, P = j.sierra.plazaPueblo;
      cine(m, P.x, 2, P.z, 5, 16, 6);
      m.dialogo([['Don Chuy', 'La gente de El Contador se metió a San Isidro. Asustaron a todos y tienen a Doña Cuca encerrada en su tienda.'], ['Don Chuy', 'Es gente buena, mijo. Sácalos de ahí.']]);
      j.jugador.darArma('rifle', 90); j.jugador.darArma('granada', 3);
      m.malos = [...malos(m, P.x, P.z - 22, 3, ['rifle', 'pistola'], 'quieto', 4), ...malos(m, P.x, P.z, 3, ['subfusil', 'escopeta'], 'quieto', 10), ...malos(m, P.x, P.z + 26, 3, ['pistola', 'escopetaAuto'], 'quieto', 4)];
      for (const g of m.malos) g.salud = 90;
      const r = new Peaton(j, { tipo: 'civil', x: 435.4, z: 69, estado: 'agachado' }); r.tAgachado = 1e9; r.objetivoMision = true; r.fila = true; j.peatones.push(r); m.extra.push(r); m.rehen = r;
      m.marcar(1, P.x, P.z, 14, 3, '#ff4f9a');
      m.objetivo('Ve a <b>San Isidro</b> por la carretera a la Sierra.');
    },
    actualizar(m) {
      const j = m.j, jp = j.jugador.posicion, P = j.sierra.plazaPueblo;
      if (m.rehen.muerto) return 'falla Murió Doña Cuca.';
      if (m.rehen.estado !== 'agachado') { m.rehen.estado = 'agachado'; m.rehen.tAgachado = 1e9; }
      for (const g of m.malos) if (!g.muerto && g.estado === 'quieto' && g.pos.distanceTo(jp) < 45) g.estado = 'atacar';
      const vivos = m.malos.filter(g => !g.muerto);
      if (m.paso === 0) {
        if (Math.hypot(jp.x - P.x, jp.z - P.z) < 70) m.ocultar(1);
        m.objetivos = vivos; m.objetivo(`Libera San Isidro: quedan <b>${vivos.length}</b>.`);
        if (!vivos.length) { m.paso = 1; m.objetivos = [m.rehen]; j.hud.grande('¡PUEBLO LIBRE!', 'Ve por Doña Cuca a su tienda', 2.2, 'exito'); }
        return;
      }
      m.objetivo('Rescata a <b>Doña Cuca</b> en su tienda.');
      if (Math.hypot(jp.x - m.rehen.pos.x, jp.z - m.rehen.pos.z) < 2.5) { m.rehen.estado = 'quieto'; return 'ok'; }
    },
    fin(m) { m.j.hud.dialogos([['Doña Cuca', '¡Dios se lo pague, joven! Esos señores hablaban de una reunión en el Mirador esta misma noche. Su jefe va a estar ahí.']]); }
  },
  {
    titulo: 'EL CONTADOR', premio: 12000, parte: 2,
    inicio(m) {
      reset(m); const j = m.j, X = MIRADOR.x, Z = MIRADOR.z, Y = alturaCerro(X, Z);
      m.dialogo([['Capitán Ruelas', 'Confirmado: El Contador está en el Mirador de la Sierra cerrando un trato. Trae a sus mejores hombres.'], ['Don Chuy', 'Es ahora o nunca, mijo. Te mandé lo más pesado que encontré. Cuídate.']]);
      j.jugador.darArma('rifle', 120); j.jugador.darArma('escopetaAuto', 36); j.jugador.darArma('granada', 4); j.jugador.chaleco = 100;
      m.malos = malos(m, X, Z, 8, ['rifle', 'escopetaAuto', 'subfusil', 'pistolaOro'], 'quieto', 9);
      for (const g of m.malos) g.salud = 110;
      m.jefe = malos(m, X, Z, 1, ['pistolaOro'], 'quieto', 0.5)[0]; m.jefe.salud = 650; m.jefe.jefe = true; m.jefe.modelo = 'novio';
      for (const k of [-1, 1]) coche(m, 'camioneta', '#121214', { x: X + k * 6, z: Z - 7, yaw: 0 }, false);
      m.marcar(1, X, Z, 14, 3, '#ff3b5a');
      m.objetivo('Sube al <b>Mirador de la Sierra</b> y acaba con <b>El Contador</b>.');
      m.Y = Y;
    },
    actualizar(m) {
      const j = m.j, jp = j.jugador.posicion, X = MIRADOR.x, Z = MIRADOR.z;
      const d = Math.hypot(jp.x - X, jp.z - Z);
      if (d < 60) { m.ocultar(1); for (const g of [...m.malos, m.jefe]) if (!g.muerto && g.estado === 'quieto') g.estado = 'atacar'; if (!m.visto) { m.visto = true; cine(m, m.jefe.pos.x, m.Y + 1.6, m.jefe.pos.z, 3.5, 6, 1.5); j.hud.grande('EL CONTADOR', '"Nadie le cobra a El Contador"', 2.6); } }
      const vivos = m.malos.filter(g => !g.muerto);
      m.objetivos = [m.jefe, ...vivos].filter(g => !g.muerto);
      m.objetivo(m.jefe.muerto ? `El Contador cayó. Quedan <b>${vivos.length}</b> de sus hombres.` : `Acaba con <b>El Contador</b> (salud ${Math.max(0, Math.round(m.jefe.salud))}) · hombres: <b>${vivos.length}</b>.`);
      if (m.jefe.muerto && vivos.length <= 1) return 'ok';
    },
    fin(m) {
      const j = m.j;
      cine(m, MIRADOR.x, alturaCerro(MIRADOR.x, MIRADOR.z) + 2, MIRADOR.z, 7, 14, 5);
      j.noticias?.avisar('persecucion');
      j.hud.dialogos([['Don Chuy', 'Se acabó El Contador. Mira la ciudad desde aquí, mijo: Santa Jacaranda otra vez respira.'], ['Capitán Ruelas', 'Sus cuentas ya están en manos de la fiscalía. Y nadie va a preguntar quién hizo el trabajo.'], ['Don Chuy', 'Ahora sí, vámonos al taller. Hay mucho coche que arreglar.']]);
      setTimeout(() => j.hud.grande('FIN DE LA SEGUNDA PARTE', 'La sombra de El Contador', 6, 'exito'), 7500);
    }
  }
];
