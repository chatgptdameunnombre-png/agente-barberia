import * as THREE from 'three';
import { CELDA, ALTO, esSolido } from './mapa.js?v=20260906095424';

const ANCHO_PORTAL = 3.7;
const ALTO_PORTAL = 5.5;
const RADIO_CRUCE = 2.1;

export function trazar(nivel, origen, dir, alcance = 90) {
  let mapX = Math.floor(origen.x / CELDA);
  let mapZ = Math.floor(origen.z / CELDA);
  const dx = dir.x, dz = dir.z;
  if (Math.abs(dx) < 1e-6 && Math.abs(dz) < 1e-6) return null;

  const deltaX = Math.abs(dx) < 1e-6 ? Infinity : Math.abs(CELDA / dx);
  const deltaZ = Math.abs(dz) < 1e-6 ? Infinity : Math.abs(CELDA / dz);
  const pasoX = dx < 0 ? -1 : 1;
  const pasoZ = dz < 0 ? -1 : 1;
  let ladoX = dx < 0
    ? (origen.x - mapX * CELDA) / CELDA * deltaX
    : ((mapX + 1) * CELDA - origen.x) / CELDA * deltaX;
  let ladoZ = dz < 0
    ? (origen.z - mapZ * CELDA) / CELDA * deltaZ
    : ((mapZ + 1) * CELDA - origen.z) / CELDA * deltaZ;

  let cara = 0;
  for (let i = 0; i < 256; i++) {
    if (ladoX < ladoZ) { ladoX += deltaX; mapX += pasoX; cara = 0; }
    else { ladoZ += deltaZ; mapZ += pasoZ; cara = 1; }
    const dist = cara === 0 ? ladoX - deltaX : ladoZ - deltaZ;
    if (dist > alcance) return null;
    if (!esSolido(nivel.rejilla, mapX, mapZ)) continue;

    const punto = new THREE.Vector3(
      origen.x + dir.x * dist,
      origen.y + dir.y * dist,
      origen.z + dir.z * dist
    );
    const normal = cara === 0
      ? new THREE.Vector3(-pasoX, 0, 0)
      : new THREE.Vector3(0, 0, -pasoZ);
    const fila = nivel.rejilla[mapZ];
    const signo = fila ? fila[mapX] : '#';
    return { punto, normal, celda: { x: mapX, z: mapZ }, signo, dist };
  }
  return null;
}

const VERTEX = `
varying vec4 vPantalla;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vPantalla = pos;
  gl_Position = pos;
}`;

const FRAGMENT = `
uniform sampler2D vista;
uniform vec3 borde;
uniform float tiempo;
uniform float activo;
varying vec4 vPantalla;
varying vec2 vUv;

float ruido(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 centro = vUv - 0.5;
  vec2 estirado = vec2(centro.x * 1.3, centro.y);
  float r = length(estirado);
  float ang = atan(estirado.y, estirado.x);

  float onda = 0.012 * sin(ang * 9.0 + tiempo * 3.2) + 0.008 * sin(ang * 5.0 - tiempo * 2.1);
  if (r > 0.5 + onda) discard;

  vec2 uv = (vPantalla.xy / vPantalla.w) * 0.5 + 0.5;
  float remolino = (0.5 - r) * 0.05;
  uv += vec2(cos(tiempo * 0.8), sin(tiempo * 0.8)) * remolino * 0.06;
  vec3 col = texture2D(vista, uv).rgb;

  float dentro = smoothstep(0.5, 0.30, r);
  col *= activo > 0.5 ? 1.0 : 0.0;

  float anillo = smoothstep(0.30, 0.47, r);
  float latido = 0.78 + 0.22 * sin(tiempo * 3.4);
  col = mix(col, borde * latido * 1.25, anillo);

  float chispa = step(0.9965, ruido(floor(vUv * 42.0) + floor(tiempo * 14.0)));
  col += borde * chispa * (1.0 - anillo) * 1.6;

  float filo = smoothstep(0.44, 0.5, r);
  col += borde * pow(filo, 2.0) * 1.5;
  col += borde * pow(1.0 - dentro, 4.0) * 0.35;

  gl_FragColor = vec4(col, 1.0);
}`;

export class Portal {
  constructor(color, renderizador) {
    this.color = new THREE.Color(color);
    this.destino = null;
    this.puesto = false;
    this.objetivo = new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter
    });
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        vista: { value: this.objetivo.texture },
        borde: { value: this.color },
        tiempo: { value: 0 },
        activo: { value: 0 }
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT
    });
    this.malla = new THREE.Mesh(
      new THREE.PlaneGeometry(ANCHO_PORTAL, ALTO_PORTAL),
      this.material
    );
    this.malla.visible = false;
    this.luz = new THREE.PointLight(color, 0, 54, 1.5);
  }

  colocar(golpe) {
    const p = golpe.punto.clone().addScaledVector(golpe.normal, 0.06);
    p.y = Math.min(Math.max(p.y, ALTO_PORTAL / 2 + 0.1), ALTO - ALTO_PORTAL / 2 - 0.1);
    this.malla.position.copy(p);
    this.malla.rotation.set(0, Math.atan2(golpe.normal.x, golpe.normal.z), 0);
    this.malla.updateMatrixWorld(true);
    this.normal = golpe.normal.clone();
    this.malla.visible = true;
    this.puesto = true;
    this.luz.position.copy(p).addScaledVector(golpe.normal, 2.4);
    this.luz.intensity = 72;
    this.celdaAcceso = [
      golpe.celda.x + Math.round(golpe.normal.x),
      golpe.celda.z + Math.round(golpe.normal.z)
    ];
  }
}

export class Portales {
  constructor(escena, nivel, renderizador) {
    this.escena = escena;
    this.nivel = nivel;
    this.renderizador = renderizador;
    this.azul = new Portal(0x3fa9ff, renderizador);
    this.naranja = new Portal(0xff8a1f, renderizador);
    this.azul.destino = this.naranja;
    this.naranja.destino = this.azul;
    for (const p of [this.azul, this.naranja]) {
      escena.add(p.malla);
      escena.add(p.luz);
    }
    this.camaraVirtual = new THREE.PerspectiveCamera();
    this.enfriamiento = 0;
    this.tiempo = 0;
    this.antorcha = null;
  }

  get listos() { return this.azul.puesto && this.naranja.puesto; }

  get enlaces() {
    if (!this.listos || !this.azul.celdaAcceso || !this.naranja.celdaAcceso) return null;
    return [[...this.azul.celdaAcceso, ...this.naranja.celdaAcceso]];
  }

  disparar(cual, origen, dir) {
    const golpe = trazar(this.nivel, origen, dir);
    if (!golpe) return 'sin-muro';
    const portal = cual === 'azul' ? this.azul : this.naranja;
    const otro = portal.destino;
    if (otro.puesto && otro.malla.position.distanceTo(golpe.punto) < ANCHO_PORTAL * 0.8) {
      return 'encimado';
    }
    portal.colocar(golpe);
    return 'ok';
  }

  limpiar() {
    for (const p of [this.azul, this.naranja]) {
      p.puesto = false;
      p.malla.visible = false;
      p.luz.intensity = 0;
      p.material.uniforms.activo.value = 0;
    }
  }

  _matrizVirtual(desde, hacia, camara) {
    const m = new THREE.Matrix4();
    m.copy(hacia.malla.matrixWorld);
    m.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    m.multiply(new THREE.Matrix4().copy(desde.malla.matrixWorld).invert());
    m.multiply(camara.matrixWorld);
    return m;
  }

  cruzar(jugador) {
    if (!this.listos || this.enfriamiento > 0) return false;
    for (const p of [this.azul, this.naranja]) {
      const d = Math.hypot(
        jugador.pos.x - p.malla.position.x,
        jugador.pos.z - p.malla.position.z
      );
      if (d > RADIO_CRUCE) continue;
      const otro = p.destino;
      const giro = otro.malla.rotation.y - p.malla.rotation.y + Math.PI;
      jugador.yaw += giro;
      const salida = otro.malla.position.clone().addScaledVector(otro.normal, 3.2);
      jugador.pos.x = salida.x;
      jugador.pos.z = salida.z;
      const v = jugador.vel;
      const cs = Math.cos(giro), sn = Math.sin(giro);
      const nx = v.x * cs - v.z * sn;
      const nz = v.x * sn + v.z * cs;
      v.x = nx; v.z = nz;
      this.enfriamiento = 0.5;
      this.ultimoColor = otro.color;
      return true;
    }
    return false;
  }

  guiaHacia(pos, flujo) {
    if (!this.listos || !flujo) return null;
    const cx = Math.floor(pos.x / CELDA);
    const cz = Math.floor(pos.z / CELDA);
    for (const p of [this.azul, this.naranja]) {
      const otro = p.destino;
      if (!p.celdaAcceso || !otro.celdaAcceso) continue;
      if (p.celdaAcceso[0] !== cx || p.celdaAcceso[1] !== cz) continue;
      const aqui = flujo.distEn(cx, cz);
      const alla = flujo.distEn(otro.celdaAcceso[0], otro.celdaAcceso[1]);
      if (aqui < 0 || alla < 0 || alla >= aqui) continue;
      const vx = p.malla.position.x - pos.x;
      const vz = p.malla.position.z - pos.z;
      const largo = Math.hypot(vx, vz) || 1;
      return { x: vx / largo, z: vz / largo };
    }
    return null;
  }

  cruzarSuelo(pos, radio = 2.4) {
    if (!this.listos) return false;
    for (const p of [this.azul, this.naranja]) {
      const d = Math.hypot(pos.x - p.malla.position.x, pos.z - p.malla.position.z);
      if (d > radio) continue;
      const otro = p.destino;
      const salida = otro.malla.position.clone().addScaledVector(otro.normal, 3.0);
      pos.x = salida.x;
      pos.z = salida.z;
      return true;
    }
    return false;
  }

  atravesar(anterior, actual, velocidad) {
    if (!this.listos) return false;
    for (const desde of [this.azul, this.naranja]) {
      const hacia = desde.destino;
      const inv = new THREE.Matrix4().copy(desde.malla.matrixWorld).invert();
      const a = anterior.clone().applyMatrix4(inv);
      const b = actual.clone().applyMatrix4(inv);
      if (a.z <= 0 || b.z > 0) continue;
      const t = a.z / (a.z - b.z);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (Math.abs(x) > ANCHO_PORTAL * 0.45 || Math.abs(y) > ALTO_PORTAL * 0.45) continue;

      const m = new THREE.Matrix4()
        .copy(hacia.malla.matrixWorld)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
        .multiply(inv);
      actual.applyMatrix4(m);
      if (velocidad) {
        const giro = new THREE.Matrix3().setFromMatrix4(m);
        velocidad.applyMatrix3(giro);
      }
      return true;
    }
    return false;
  }

  actualizar(dt, camara) {
    this.tiempo += dt;
    if (this.enfriamiento > 0) this.enfriamiento -= dt;
    const activos = this.listos ? 1 : 0;
    for (const p of [this.azul, this.naranja]) {
      p.material.uniforms.tiempo.value = this.tiempo;
      p.material.uniforms.activo.value = activos;
    }
  }

  _recortar(cam, portal) {
    const normal = portal.normal.clone();
    const punto = portal.malla.position.clone();
    const plano = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, punto);
    plano.applyMatrix4(cam.matrixWorldInverse);
    if (plano.constant > 0) return;
    const q = new THREE.Vector4(
      (Math.sign(plano.normal.x) + cam.projectionMatrix.elements[8]) / cam.projectionMatrix.elements[0],
      (Math.sign(plano.normal.y) + cam.projectionMatrix.elements[9]) / cam.projectionMatrix.elements[5],
      -1,
      (1 + cam.projectionMatrix.elements[10]) / cam.projectionMatrix.elements[14]
    );
    const v = new THREE.Vector4(plano.normal.x, plano.normal.y, plano.normal.z, plano.constant);
    const c = v.multiplyScalar(2 / v.dot(q));
    const e = cam.projectionMatrix.elements;
    e[2] = c.x;
    e[6] = c.y;
    e[10] = c.z + 1;
    e[14] = c.w;
  }

  pintarVistas(camara) {
    if (!this.listos) return;
    const objetivoPrevio = this.renderizador.getRenderTarget();
    const luzPrevia = this.antorcha ? this.antorcha.position.clone() : null;
    for (const [desde, hacia] of [[this.azul, this.naranja], [this.naranja, this.azul]]) {
      const m = this._matrizVirtual(desde, hacia, camara);
      const cam = this.camaraVirtual;
      m.decompose(cam.position, cam.quaternion, cam.scale);
      cam.updateMatrixWorld(true);
      cam.projectionMatrix.copy(camara.projectionMatrix);
      cam.projectionMatrixInverse.copy(camara.projectionMatrixInverse);
      this._recortar(cam, hacia);
      desde.malla.visible = false;
      hacia.malla.visible = false;
      if (this.antorcha) this.antorcha.position.copy(cam.position);
      this.renderizador.setRenderTarget(desde.objetivo);
      this.renderizador.clear();
      this.renderizador.render(this.escena, this.camaraVirtual);
      desde.malla.visible = true;
      hacia.malla.visible = true;
    }
    if (luzPrevia && this.antorcha) this.antorcha.position.copy(luzPrevia);
    this.renderizador.setRenderTarget(objetivoPrevio);
  }
}
