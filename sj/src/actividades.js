import * as THREE from 'three';
import { linea, CARRIL } from './ciudad.js?v=202611220244';
import { ARMAS } from './jugador.js?v=202611220244';
import { ICONO_ARMA, ICONO, iconoArma } from './iconos.js?v=202611220244';
const PRODUCTOS = { 'Papitas y refresco': 0, 'Torta de jamón': 1, 'Bebida energética': 2, 'Kilo de tortillas': 3, 'Tacos de canasta': 4, 'Venda y alcohol': 5, 'Botiquín completo': 6, 'Suero': 7, 'Plato de birria': 8, 'Consomé': 9, 'Cinta y pegamento (repara coche)': 10, 'Concha': 11, 'Bolsa de pan dulce': 12, 'Coctel de camarón': 13, 'Tostada de ceviche': 14, 'Cerveza': 15, 'Cerveza de la casa': 15, 'Tequila': 16, 'Agua de jamaica': 17, 'Botana de la casa': 18, 'Chaleco antibalas': 19 };
import { Peaton } from './peatones.js?v=202611220244';

export class Estadisticas {
  constructor() {
    this.d = { tiempo: 0, km: 0, robados: 0, disparos: 0, aciertos: 0, atropellos: 0, despistes: 0, saltos: 0, mejorSalto: 0, maxEstrellas: 0, muertes: 0, arrestos: 0, ganado: 0, granadas: 0, viajesTaxi: 0, flores: 0 };
  }
  sumar(k, n = 1) { this.d[k] = (this.d[k] || 0) + n; }
  max(k, v) { this.d[k] = Math.max(this.d[k] || 0, v); }
  filas() {
    const d = this.d, h = Math.floor(d.tiempo / 3600), m = Math.floor(d.tiempo / 60) % 60;
    return [
      ['Tiempo jugado', (h ? h + ' h ' : '') + m + ' min'], ['Distancia manejada', d.km.toFixed(1) + ' km'], ['Coches robados', d.robados],
      ['Disparos', d.disparos], ['Puntería', d.disparos ? Math.round(d.aciertos / d.disparos * 100) + '%' : '—'], ['Granadas lanzadas', d.granadas],
      ['Atropellos', d.atropellos], ['Tiendas robadas', d.robos || 0], ['Veces que perdiste a la policía', d.despistes], ['Máximo de estrellas', d.maxEstrellas ? d.maxEstrellas + ' de 5' : '—'],
      ['Saltos', d.saltos], ['Mejor salto', d.mejorSalto ? d.mejorSalto.toFixed(0) + ' m' : '—'], ['Viajes de taxi', d.viajesTaxi], ['Carreras ganadas', d.carreras || 0], ['Pedidos entregados', d.entregas || 0], ['Criminales detenidos', d.detenidos || 0], ['Pacientes rescatados', d.rescates || 0], ['Encuentros en la calle', d.eventos || 0],
      ['Viajes en tren ligero', d.viajesTren || 0], ['Hidrantes reventados', d.hidrantes || 0], ['Topes que te comiste', d.topes || 0], ['Propinas a limpiaparabrisas', d.propinas || 0], ['Serenatas pedidas', d.serenatas || 0],
      ['Jacarandas doradas', d.flores + ' / 12'], ['Muertes', d.muertes], ['Arrestos', d.arrestos], ['Dinero ganado', '$' + Math.round(d.ganado).toLocaleString('es-MX')]
    ];
  }
}

export const ARTICULOS = [
  { id: 'bate', nombre: 'Bate de madera', precio: 150, desc: 'Golpea fuerte y avienta lejos.', dar: j => j.darArma('bate'), tiene: j => !!j.armas.bate },
  { id: 'cuchillo', nombre: 'Cuchillo', precio: 80, desc: 'Rápido y silencioso.', dar: j => j.darArma('cuchillo'), tiene: j => !!j.armas.cuchillo },
  { id: 'pistola', nombre: 'Pistola', precio: 400, desc: 'Incluye 36 balas.', dar: j => j.darArma('pistola', 36), tiene: j => !!j.armas.pistola },
  { id: 'balaP', icono: 'pistola', nombre: 'Balas de pistola ×36', precio: 60, desc: 'Para la pistola.', dar: j => j.darArma('pistola', 36), requiere: 'pistola' },
  { id: 'escopeta', nombre: 'Escopeta', precio: 900, desc: 'Brutal de cerca. Incluye 12 cartuchos.', dar: j => j.darArma('escopeta', 12), tiene: j => !!j.armas.escopeta },
  { id: 'balaE', icono: 'escopeta', nombre: 'Cartuchos ×12', precio: 90, desc: 'Para la escopeta.', dar: j => j.darArma('escopeta', 12), requiere: 'escopeta' },
  { id: 'subfusil', nombre: 'Subfusil', precio: 1600, desc: 'Ráfaga rápida. Incluye 90 balas.', dar: j => j.darArma('subfusil', 90), tiene: j => !!j.armas.subfusil },
  { id: 'balaS', icono: 'subfusil', nombre: 'Balas de subfusil ×90', precio: 150, desc: 'Para el subfusil.', dar: j => j.darArma('subfusil', 90), requiere: 'subfusil' },
  { id: 'rifle', nombre: 'Rifle de asalto', precio: 2600, desc: 'Preciso y potente. Incluye 90 balas.', dar: j => j.darArma('rifle', 90), tiene: j => !!j.armas.rifle },
  { id: 'balaR', icono: 'rifle', nombre: 'Balas de rifle ×90', precio: 180, desc: 'Para el rifle.', dar: j => j.darArma('rifle', 90), requiere: 'rifle' },
  { id: 'granada', nombre: 'Granadas ×4', precio: 400, desc: 'Mantén clic derecho para ver el arco.', dar: j => j.darArma('granada', 4) },
  { id: 'machete', nombre: 'Machete', precio: 250, desc: 'Largo y brutal cuerpo a cuerpo.', dar: j => j.darArma('machete'), tiene: j => !!j.armas.machete },
  { id: 'llave', nombre: 'Llave inglesa', precio: 120, desc: 'Herramienta de taller… y algo más.', dar: j => j.darArma('llave'), tiene: j => !!j.armas.llave },
  { id: 'revolver', nombre: 'Revólver', precio: 900, desc: 'Lento pero muy potente. Incluye 18 balas.', dar: j => j.darArma('revolver', 18), tiene: j => !!j.armas.revolver },
  { id: 'balaV', icono: 'revolver', nombre: 'Balas de revólver ×18', precio: 90, desc: 'Para el revólver.', dar: j => j.darArma('revolver', 18), requiere: 'revolver' },
  { id: 'recortada', nombre: 'Escopeta recortada', precio: 1200, desc: 'Dos tiros devastadores de cerca. Incluye 16 cartuchos.', dar: j => j.darArma('recortada', 16), tiene: j => !!j.armas.recortada },
  { id: 'balaC', icono: 'recortada', nombre: 'Cartuchos de recortada ×16', precio: 110, desc: 'Para la recortada.', dar: j => j.darArma('recortada', 16), requiere: 'recortada' },
  { id: 'ametralladora', nombre: 'Ametralladora', precio: 4500, desc: 'Cien balas sin parar. Incluye 200.', dar: j => j.darArma('ametralladora', 200), tiene: j => !!j.armas.ametralladora },
  { id: 'balaA', icono: 'ametralladora', nombre: 'Cinta de 200 balas', precio: 350, desc: 'Para la ametralladora.', dar: j => j.darArma('ametralladora', 200), requiere: 'ametralladora' },
  { id: 'francotirador', nombre: 'Rifle de francotirador', precio: 5200, desc: 'Mira telescópica con clic derecho. Incluye 15 balas.', dar: j => j.darArma('francotirador', 15), tiene: j => !!j.armas.francotirador },
  { id: 'balaF', icono: 'francotirador', nombre: 'Balas de francotirador ×15', precio: 260, desc: 'Para el francotirador.', dar: j => j.darArma('francotirador', 15), requiere: 'francotirador' },
  { id: 'lanzacohetes', nombre: 'Lanzacohetes', precio: 9000, desc: 'Vuela coches de un tiro. Incluye 3 cohetes.', dar: j => j.darArma('lanzacohetes', 3), tiene: j => !!j.armas.lanzacohetes },
  { id: 'cohetes', icono: 'lanzacohetes', nombre: 'Cohetes ×3', precio: 1200, desc: 'Para el lanzacohetes.', dar: j => j.darArma('lanzacohetes', 3), requiere: 'lanzacohetes' },
  { id: 'molotov', nombre: 'Bombas molotov ×4', precio: 300, desc: 'Dejan el piso en llamas unos segundos.', dar: j => j.darArma('molotov', 4) },
  { id: 'chaleco', icono: null, nombre: 'Chaleco antibalas', precio: 250, desc: 'Absorbe la mayoría del daño.', dar: j => { j.chaleco = 100; }, tiene: j => j.chaleco >= 100 }
];

const FLORES = [
  [-250, -322], [-160, -205], [-40, -84], [36, -40], [120, -120], [205, -105], [300, -300], [318, 40], [200, 240], [40, 320], [-120, 310], [-280, 20]
];

const RAMPAS = [
  { x: 0, z: -205, dx: 0, dz: 1 }, { x: -200, z: 0, dx: 1, dz: 0 }, { x: 160, z: 120, dx: 0, dz: -1 },
  { x: 120, z: 240, dx: -1, dz: 0 }, { x: -240, z: 200, dx: 0, dz: -1 }, { x: 280, z: -160, dx: -1, dz: 0 }
];

function texturaRampa() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#ffc94a';
  for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 16); g.lineTo(64, y + 32); g.lineTo(0, y + 16); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Actividades {
  constructor(juego) {
    this.j = juego;
    this.flores = [];
    this.tomadas = new Set();
    this.rampas = [];
    this.saltosHechos = new Set();
    this.aire = null;
    this.taxi = null;
    this.tiendaAbierta = false;
    this.crearFlores();
    this.crearRampas();
    this.prepararTienda();
  }

  anillo(color) {
    const g = new THREE.Group();
    const aro = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.45, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
    const cil = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 1.6, 32, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    cil.position.y = 0.8;
    g.add(aro, cil);
    this.j.escena.add(g);
    return g;
  }

  crearFlores() {
    const pet = new THREE.SphereGeometry(0.16, 8, 6);
    const oro = new THREE.MeshBasicMaterial({ color: '#ffd25a' });
    const lila = new THREE.MeshBasicMaterial({ color: '#c48bff' });
    FLORES.forEach(([x, z], i) => {
      const g = new THREE.Group();
      for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(pet, lila); const a = k / 5 * Math.PI * 2; m.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0); g.add(m); }
      const c = new THREE.Mesh(pet, oro); c.scale.setScalar(0.9); g.add(c);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.j.ciudad.texSuave, color: '#ffd27a', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(2.4); g.add(halo);
      g.position.set(x, 1.3, z);
      this.j.mundo.empujar(g.position, 0.6);
      this.j.escena.add(g);
      this.flores.push({ id: i, g });
    });
  }

  crearRampas() {
    const tex = texturaRampa();
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const cl = document.createElement('canvas'); cl.width = cl.height = 128; const gl = cl.getContext('2d');
    gl.fillStyle = '#1c1c1e'; gl.fillRect(0, 0, 128, 128); gl.fillStyle = '#f2c41e';
    for (let k = -128; k < 256; k += 32) { gl.beginPath(); gl.moveTo(k, 0); gl.lineTo(k + 16, 0); gl.lineTo(k + 16 + 128, 128); gl.lineTo(k + 128, 128); gl.fill(); }
    for (let i = 0; i < 900; i++) { gl.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.12})`; gl.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
    const tl = new THREE.CanvasTexture(cl); tl.colorSpace = THREE.SRGBColorSpace; tl.wrapS = tl.wrapT = THREE.RepeatWrapping; tl.repeat.set(1.2, 4);
    const lado = new THREE.MeshLambertMaterial({ map: tl });
    for (const r of RAMPAS) {
      const largo = 10, ancho = 3.4, alto = 2.4;
      const forma = new THREE.Shape();
      forma.moveTo(0, 0); forma.lineTo(largo, 0); forma.lineTo(largo, alto); forma.closePath();
      const geo = new THREE.ExtrudeGeometry(forma, { depth: ancho, bevelEnabled: false });
      geo.translate(0, 0, -ancho / 2);
      geo.rotateY(-Math.PI / 2);
      const m = new THREE.Mesh(geo, [lado, mat]);
      m.castShadow = true; m.receiveShadow = true;
      const ini = { x: r.x - r.dx * largo / 2, z: r.z - r.dz * largo / 2 };
      m.position.set(ini.x, 0, ini.z);
      m.rotation.y = Math.atan2(r.dx, r.dz);
      this.j.escena.add(m);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.3, uv.getY(i) * 0.1);
      this.rampas.push({ ...r, ini, largo, ancho, alto, id: this.rampas.length });
    }
  }

  altura(x, z) {
    for (const r of this.rampas) {
      const ax = x - r.ini.x, az = z - r.ini.z;
      if (Math.abs(ax) > 14 || Math.abs(az) > 14) continue;
      const t = ax * r.dx + az * r.dz;
      const l = Math.abs(ax * -r.dz + az * r.dx);
      if (t >= 0 && t <= r.largo && l < r.ancho / 2) return { h: r.alto * t / r.largo, rampa: r };
    }
    return null;
  }

  prepararTienda() {
    const el = document.getElementById('tienda');
    el.addEventListener('click', e => {
      const f = e.target.closest('[data-sel]');
      if (f) { this.sel = +f.dataset.sel; this.pintarTienda(); this.j.audio?.ui?.(720); }
      if (e.target.closest('.comprar')) this.comprarSel();
      const c = e.target.closest('[data-cat]');
      if (c) { this.filtro = c.dataset.cat; this.sel = 0; this.pintarTienda(); }
      if (e.target.closest('.cerrar')) this.cerrarTienda();
    });
    el.addEventListener('dblclick', e => { if (e.target.closest('[data-sel]')) this.comprarSel(); });
    addEventListener('keydown', e => {
      if (!this.tiendaAbierta) return;
      const n = this.visibles().length;
      if (['ArrowDown', 'KeyS'].includes(e.code)) { this.sel = (this.sel + 1) % n; this.pintarTienda(); this.j.audio?.ui?.(700); e.preventDefault(); }
      if (['ArrowUp', 'KeyW'].includes(e.code)) { this.sel = (this.sel - 1 + n) % n; this.pintarTienda(); this.j.audio?.ui?.(700); e.preventDefault(); }
      if (['Enter', 'KeyE', 'Space'].includes(e.code)) { this.comprarSel(); e.preventDefault(); }
    });
  }

  abrirTienda(cat) {
    if (this.tiendaAbierta) return;
    this.catalogo = cat || { titulo: 'ARMERÍA DEL VALLE', sub: 'PAGO EN EFECTIVO, SIN PREGUNTAS', articulos: ARTICULOS };
    this.tiendaAbierta = true; this.sel = 0; this.filtro = 'todo';
    document.querySelector('#tienda h2').innerHTML = `${this.catalogo.titulo}<small>${this.catalogo.sub}</small>`;
    this.j.abrirOverlay('tienda');
    this.pintarTienda();
    this.j.audio?.ui?.(600);
  }
  cerrarTienda() {
    if (!this.tiendaAbierta) return;
    this.tiendaAbierta = false;
    this.j.cerrarOverlay('tienda');
  }

  categoriaDe(a) {
    const id = a.requiere || a.icono || a.id;
    const W = ARMAS[id];
    if (a.requiere) return 'municion';
    if (!W) return 'otros';
    return W.tipo === 'golpe' ? 'mano' : W.tipo === 'lanzar' || W.tipo === 'cohete' ? 'pesadas' : 'fuego';
  }

  visibles() { return this.catalogo.articulos.filter(a => this.filtro === 'todo' || this.categoriaDe(a) === this.filtro); }

  imagen(a, grande) {
    const id = a.requiere || (typeof a.icono === 'string' && ARMAS[a.icono] ? a.icono : a.id);
    if (ARMAS[id]) return `<div class="im arma">${iconoArma(id)}${a.requiere ? '<em>MUNICIÓN</em>' : ''}</div>`;
    const k = PRODUCTOS[a.nombre];
    if (k !== undefined) return `<div class="im foto" style="background-position:${(k % 5) * 25}% ${Math.floor(k / 5) * 33.333}%"></div>`;
    if (a.icono && typeof a.icono === 'string') return `<div class="im">${a.icono}</div>`;
    return `<div class="im">${ICONO.tienda}</div>`;
  }

  pintarTienda() {
    const j = this.j.jugador, L = this.visibles();
    if (this.sel >= L.length) this.sel = 0;
    const cats = [...new Set(this.catalogo.articulos.map(a => this.categoriaDe(a)))];
    const NOM = { todo: 'Todo', mano: 'Cuerpo a cuerpo', fuego: 'Armas de fuego', pesadas: 'Pesadas', municion: 'Munición', otros: 'Equipo' };
    document.querySelector('#tienda .cats').innerHTML = cats.length > 1 ? ['todo', ...cats].map(c => `<button data-cat="${c}" class="${this.filtro === c ? 'on' : ''}" type="button">${NOM[c] || c}</button>`).join('') : '';
    document.querySelector('#tienda .articulos').innerHTML = L.map((a, i) => {
      const tiene = a.tiene?.(j), falta = a.requiere && !j.armas[a.requiere], caro = j.dinero < a.precio;
      return `<button class="art ${i === this.sel ? 'sel' : ''} ${tiene || falta ? 'no' : ''}" data-sel="${i}" type="button">${this.imagen(a)}<span class="t"><b>${a.nombre}</b><small>${tiene ? (a.tieneTxt || 'Ya lo tienes') : falta ? 'Necesitas el arma' : caro ? 'No te alcanza' : (a.verbo || 'Disponible')}</small></span><span class="p ${caro && !tiene ? 'caro' : ''}">${a.precio ? '$' + a.precio.toLocaleString('es-MX') : 'Gratis'}</span></button>`;
    }).join('');
    const a = L[this.sel], D = document.querySelector('#tienda .detalle');
    if (a) {
      const id = a.requiere || (typeof a.icono === 'string' && ARMAS[a.icono] ? a.icono : a.id), W = ARMAS[id];
      const tiene = a.tiene?.(j), falta = a.requiere && !j.armas[a.requiere], caro = j.dinero < a.precio;
      const barras = W && W.tipo !== 'lanzar' ? [['Daño', W.tipo === 'cohete' ? 1 : Math.min(1, (W.daño * (W.perdigones || 1)) / 170)], ['Cadencia', W.tipo === 'golpe' ? 0.4 / W.cadencia : Math.min(1, 0.12 / W.cadencia)], ['Alcance', Math.min(1, (W.alcance || 2) / 220)], ['Cargador', W.cargador ? Math.min(1, W.cargador / 100) : 0]] : null;
      D.innerHTML = `${this.imagen(a, true)}<h3>${a.nombre}</h3><p>${a.desc || ''}</p>
        ${barras ? `<div class="stats">${barras.map(([n, v]) => `<span><em>${n}</em><i style="--v:${Math.max(0.04, Math.min(1, v)) * 100}%"></i></span>`).join('')}</div>` : ''}
        <div class="compra"><b class="${caro && !tiene ? 'caro' : ''}">${a.precio ? '$' + a.precio.toLocaleString('es-MX') : 'Gratis'}</b>
        <button class="comprar boton" type="button" ${tiene || falta ? 'disabled' : ''}>${tiene ? (a.tieneTxt || 'Ya lo tienes') : falta ? 'Primero compra el arma' : caro ? 'No te alcanza' : (a.verbo || 'Comprar')} <kbd>Enter</kbd></button></div>`;
    } else D.innerHTML = '';
    document.querySelector('#tienda .saldo').textContent = '$' + j.dinero.toLocaleString('es-MX');
    document.querySelector('#tienda .art.sel')?.scrollIntoView({ block: 'nearest' });
  }

  comprarSel() {
    const a = this.visibles()[this.sel];
    if (!a) return;
    const antes = this.j.jugador.dinero;
    this.comprar(a.id);
    if (this.j.jugador.dinero !== antes || !a.precio) { const b = document.querySelector('#tienda .detalle .im'); b?.classList.remove('compra'); void b?.offsetWidth; b?.classList.add('compra'); }
  }

  comprarArticulo(a) {
    const prev = this.catalogo;
    this.catalogo = { articulos: [a] };
    this.comprar(a.id, true);
    this.catalogo = prev;
  }

  comprar(id, sinPintar) {
    const a = this.catalogo.articulos.find(x => x.id === id), j = this.j.jugador;
    if (!a || a.tiene?.(j) || (a.requiere && !j.armas[a.requiere])) return;
    if (j.dinero < a.precio) { this.j.audio.alerta(); this.j.hud.notificar('alerta', 'No te alcanza', 'Te faltan $' + (a.precio - j.dinero).toLocaleString('es-MX')); return; }
    j.dinero -= a.precio;
    a.dar(j);
    this.j.audio.compra();
    if (a.precio) this.j.hud.popDinero(-a.precio);
    if (a.precio) this.j.hud.notificar('tienda', a.nombre, 'Pagaste $' + a.precio.toLocaleString('es-MX'), 3);
    this.j.guardar();
    if (!sinPintar) this.pintarTienda();
  }

  marcasMapa() {
    const l = [];
    if (this.taxi?.pasajero && !this.taxi.abordo) l.push({ x: this.taxi.pasajero.pos.x, z: this.taxi.pasajero.pos.z, tipo: 'objetivo', color: '#ffd84a', texto: 'persona' });
    if (this.taxi?.destino) l.push({ x: this.taxi.destino.x, z: this.taxi.destino.z, tipo: 'objetivo', color: '#ffd84a', texto: 'bandera' });
    for (const r of this.rampas) if (!this.saltosHechos.has(r.id)) l.push({ x: r.x, z: r.z, tipo: 'actividad', color: '#ffc94a', texto: 'rampa', nombre: 'Salto único (+$500)' });
    return l;
  }

  destinoGPS() {
    if (!this.taxi) return null;
    if (this.taxi.pasajero && !this.taxi.abordo) return { x: this.taxi.pasajero.pos.x, z: this.taxi.pasajero.pos.z, tipo: 'mision' };
    if (this.taxi.destino) return { x: this.taxi.destino.x, z: this.taxi.destino.z, tipo: 'mision' };
    return null;
  }

  iniciarTaxi() {
    if (this.taxi) { this.terminarTaxi('Dejaste de trabajar de taxista.'); return; }
    this.taxi = { racha: 0, ganado: 0 };
    this.j.hud.notificar('taxi', 'Taxista', 'Recoge pasajeros y llévalos rápido. T para dejarlo.');
    this.nuevoPasajero();
  }

  terminarTaxi(motivo) {
    const t = this.taxi;
    if (!t) return;
    if (t.pasajero && this.j.peatones.includes(t.pasajero) && !t.abordo) t.pasajero.estado = 'pasear';
    this.taxi = null;
    this.j.hud.objetivo(this.j.misiones.activa ? this.j.hud.textoMision || '' : '');
    this.j.hud.temporizador(null);
    this.j.hud.notificar('taxi', 'Fin del turno', `${motivo} Ganaste $${t.ganado.toLocaleString('es-MX')} en ${t.racha} viajes.`);
  }

  nuevoPasajero() {
    const j = this.j, p = j.jugador.posicion;
    const bloques = j.ciudad.bloques.filter(b => { const d = Math.hypot(b.cx - p.x, b.cz - p.z); return d > 70 && d < 170; });
    const b = bloques[Math.random() * bloques.length | 0];
    const lado = Math.random() * 4 | 0;
    const x = lado === 0 ? b.x0 + 0.8 : lado === 1 ? b.x1 - 0.8 : b.cx + (Math.random() - 0.5) * 30;
    const z = lado === 2 ? b.z0 + 0.8 : lado === 3 ? b.z1 - 0.8 : b.cz + (Math.random() - 0.5) * 30;
    const q = new Peaton(j, { x, z, estado: 'quieto' });
    q.objetivoMision = true;
    j.peatones.push(q);
    this.taxi.pasajero = q; this.taxi.abordo = false; this.taxi.destino = null;
    j.hud.objetivo('<b>Taxi:</b> recoge al pasajero marcado en amarillo.');
  }

  actualizar(dt) {
    const j = this.j, jug = j.jugador, p = jug.posicion, t = performance.now() / 1000;
    for (const f of this.flores) {
      if (this.tomadas.has(f.id)) { f.g.visible = false; continue; }
      f.g.rotation.y = t * 1.6; f.g.position.y = 1.3 + Math.sin(t * 2 + f.id) * 0.2;
      if (!jug.muerto && Math.hypot(p.x - f.g.position.x, p.z - f.g.position.z) < (jug.coche ? 2.6 : 1.4)) {
        this.tomadas.add(f.id);
        j.estadisticas.sumar('flores');
        const n = this.tomadas.size;
        jug.dinero += 250; j.estadisticas.sumar('ganado', 250);
        j.audio.compra();
        j.hud.notificar('flor', `Jacaranda dorada ${n} de 12`, n === 12 ? '¡Las encontraste todas! +$10,000' : '+$250');
        j.hud.popDinero(250);
        j.redes?.publicar('flor');
        if (n === 12) { jug.dinero += 10000; j.hud.grande('COLECCIONISTA', 'Encontraste las 12 jacarandas doradas', 4); }
        j.guardar();
      }
    }
    const c = jug.coche;
    if (c && c.enAire && !this.aire) this.aire = { t: 0, x: c.pos.x, z: c.pos.z, rampa: c.ultimaRampa, alto: 0 };
    if (this.aire) {
      if (c && c.enAire) { this.aire.t += dt; this.aire.alto = Math.max(this.aire.alto, c.y); }
      else {
        const A = this.aire; this.aire = null;
        if (A.t > 0.55 && c) {
          const d = Math.hypot(c.pos.x - A.x, c.pos.z - A.z);
          j.estadisticas.sumar('saltos'); j.estadisticas.max('mejorSalto', d);
          const unico = A.rampa && !this.saltosHechos.has(A.rampa.id);
          if (unico) {
            this.saltosHechos.add(A.rampa.id);
            jug.dinero += 500; j.estadisticas.sumar('ganado', 500);
            j.hud.grande('¡SALTO ÚNICO!', `${d.toFixed(0)} m · ${A.t.toFixed(1)} s en el aire · +$500`, 2.6);
            j.hud.popDinero(500);
            j.redes?.publicar('salto');
            j.audio.compra();
            j.guardar();
          } else j.hud.notificar('salto', `Salto de ${d.toFixed(0)} m`, `${A.t.toFixed(1)} s en el aire`);
        }
      }
    }
    if (this.taxi) this.actualizarTaxi(dt);
    else if (c && c.tipo === 'taxi' && !j.misiones.activa) j.hud.pista('T', 'Trabajar de taxista');
  }

  actualizarTaxi(dt) {
    const j = this.j, t = this.taxi, c = j.jugador.coche;
    if (!c || c.tipo !== 'taxi') { this.terminarTaxi('Te bajaste del taxi.'); return; }
    if (c.quemado) { this.terminarTaxi('El taxi quedó destruido.'); return; }
    if (j.misiones.activa) { this.terminarTaxi('Empezó una misión.'); return; }
    const q = t.pasajero;
    if (!t.abordo) {
      if (!j.peatones.includes(q) || q.muerto) { j.hud.notificar('alerta', 'Se fue el pasajero', 'Te buscamos otro.'); this.nuevoPasajero(); return; }
      const d = Math.hypot(q.pos.x - c.pos.x, q.pos.z - c.pos.z);
      if (d < 18) { q.estado = 'perseguir'; q.arma = 'puno'; q.hostil = false; }
      if (d < 4.5 && c.vel < 3) {
        t.abordo = true;
        q.quitar(); j.peatones.splice(j.peatones.indexOf(q), 1);
        const lugares = Object.entries(j.ciudad.lugares).filter(([k, v]) => !['inicio', 'pintura'].includes(k) && Math.hypot(v.x - c.pos.x, v.z - c.pos.z) > 160);
        const [nombre, v] = lugares[Math.random() * lugares.length | 0];
        const dist = Math.hypot(v.x - c.pos.x, v.z - c.pos.z);
        t.destino = { x: v.x, z: v.z, nombre };
        t.limite = 18 + dist / 10;
        t.reloj = t.limite;
        t.dist = dist;
        j.hud.objetivo(`<b>Taxi:</b> lleva al pasajero a <b>${j.zonaDe(v.x, v.z)}</b>.`);
        j.hud.dialogos([['Pasajero', ['¡Rápido, que se me hace tarde!', 'Por favor, sin prisas pero sin pausas.', '¿Me lleva? Le doy buena propina.'][Math.random() * 3 | 0]]]);
      }
    } else {
      t.reloj -= dt;
      j.hud.temporizador(t.reloj);
      if (t.reloj <= 0) { this.terminarTaxi('El pasajero se bajó enojado.'); return; }
      if (Math.hypot(t.destino.x - c.pos.x, t.destino.z - c.pos.z) < 9 && c.vel < 5) {
        const pago = Math.round(40 + t.dist * 0.5 + t.reloj * 4 + t.racha * 25);
        t.racha++; t.ganado += pago;
        j.jugador.dinero += pago; j.estadisticas.sumar('ganado', pago); j.estadisticas.sumar('viajesTaxi');
        j.hud.popDinero(pago);
        j.redes?.publicar('taxi');
        j.hud.notificar('taxi', `Viaje ${t.racha} completado`, `+$${pago} (incluye propina)`);
        j.audio.dinero();
        j.hud.temporizador(null);
        this.nuevoPasajero();
      }
    }
  }

  guardar() { return { flores: [...this.tomadas], saltos: [...this.saltosHechos] }; }
  cargar(d) { if (!d) return; (d.flores || []).forEach(f => this.tomadas.add(f)); (d.saltos || []).forEach(s => this.saltosHechos.add(s)); }
}
