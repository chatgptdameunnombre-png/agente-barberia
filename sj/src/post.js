import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

class Oclusion extends GTAOPass {
  setSize(w, h) { super.setSize(Math.max(1, w * 0.5 | 0), Math.max(1, h * 0.5 | 0)); }
  overrideVisibility() {
    const cache = this._visibilityCache;
    this.scene.traverse(o => {
      cache.set(o, o.visible);
      if (o.isPoints || o.isLine || o.isSprite) o.visible = false;
      else if (o.material && !Array.isArray(o.material) && (o.material.transparent || o.material.alphaTest > 0 || o.material.depthWrite === false)) o.visible = false;
    });
  }
}

const Gradacion = {
  uniforms: {
    tDiffuse: { value: null }, vineta: { value: 0.2 }, saturacion: { value: 1.06 }, contraste: { value: 1.04 },
    tinte: { value: new THREE.Color(1.02, 1.0, 0.97) }, filtro: { value: 0 }, dolor: { value: 0 }, gris: { value: 0 }, aberracion: { value: 0 }, velocidad: { value: 0 }, tiempo: { value: 0 }
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vineta, saturacion, contraste, dolor, gris, aberracion, velocidad, tiempo, filtro; uniform vec3 tinte; varying vec2 vUv;
    float azar(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + tiempo) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float d = length(c);
      vec2 dir = c * (aberracion + velocidad * 0.012) * d;
      vec4 col;
      col.r = texture2D(tDiffuse, vUv - dir).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv + dir).b;
      col.a = 1.0;
      if (velocidad > 0.01) {
        vec3 acc = col.rgb;
        for (int i = 1; i < 6; i++) acc += texture2D(tDiffuse, vUv - c * float(i) * 0.012 * velocidad * smoothstep(0.15, 0.6, d)).rgb;
        col.rgb = acc / 6.0;
      }
      col.rgb = (col.rgb - 0.5) * contraste + 0.5;
      float l = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb = mix(vec3(l), col.rgb, saturacion * (1.0 - gris));
      col.rgb *= tinte;
      col.rgb = mix(col.rgb, col.rgb * vec3(1.4, 0.35, 0.35), dolor * smoothstep(0.25, 0.75, d));
      if (filtro > 0.5) {
        float lf = dot(col.rgb, vec3(0.299, 0.587, 0.114));
        if (filtro < 1.5) col.rgb = vec3(pow(lf, 0.95) * 1.05);
        else if (filtro < 2.5) col.rgb = vec3(lf * 1.07, lf * 0.88, lf * 0.66) + vec3(0.04, 0.02, 0.0);
        else if (filtro < 3.5) col.rgb = mix(col.rgb, col.rgb * vec3(1.18, 1.0, 0.78), 0.8) + vec3(0.02, 0.0, -0.01);
        else col.rgb = mix(vec3(lf), col.rgb, 1.6) * vec3(1.05, 0.9, 1.2) + vec3(0.03, 0.0, 0.05);
        col.rgb *= 1.0 - 0.25 * smoothstep(0.3, 0.8, d);
      }
      col.rgb *= 1.0 - vineta * smoothstep(0.35, 0.85, d);
      gl_FragColor = col;
    }`
};

export class Post {
  constructor(renderer, escena, camara) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(escena, camara));
    this.ao = new Oclusion(escena, camara, innerWidth, innerHeight);
    this.ao.blendIntensity = 0.85;
    this.ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.6, thickness: 2.5, scale: 1.1, samples: 8 });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 8 });
    this.ao.enabled = false;
    this.composer.addPass(this.ao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.55, 0.86);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grado = new ShaderPass(Gradacion);
    this.composer.addPass(this.grado);
    this.smaa = new SMAAPass(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio());
    this.composer.addPass(this.smaa);
    this.activo = true;
    this.dolor = 0;
  }
  tamaño(w, h) { this.composer.setSize(w, h); }
  nivel(q) { this.ao.enabled = q >= 3 && !this.aoApagado; this.smaa.enabled = q >= 2; }
  vigilar(dt, q) {
    if (q < 3 || this.aoApagado) return false;
    this.cuadros = (this.cuadros || 0) + 1; this.tiempo = (this.tiempo || 0) + dt;
    if (this.tiempo < 2) return false;
    const fps = this.cuadros / this.tiempo; this.cuadros = 0; this.tiempo = 0;
    this.lentos = fps < 38 ? (this.lentos || 0) + 1 : 0;
    if (this.lentos >= 3) { this.aoApagado = true; this.ao.enabled = false; return true; }
    return false;
  }
  render(dt, estado) {
    const u = this.grado.uniforms;
    this.dolor = Math.max(0, this.dolor - dt * 1.5);
    u.dolor.value = Math.min(1, this.dolor + (estado.salud < 30 ? (0.35 + Math.sin(performance.now() / 260) * 0.15) * (1 - estado.salud / 30) : 0));
    u.gris.value += ((estado.muerto ? 0.85 : 0) - u.gris.value) * Math.min(1, dt * 2);
    u.aberracion.value = this.dolor * 0.03;
    u.velocidad.value += ((estado.turbo ? 1 : estado.rapido * 0.35) - u.velocidad.value) * Math.min(1, dt * 4);
    u.tiempo.value = (u.tiempo.value + dt) % 100;
    const noche = estado.noche || 0;
    this.bloom.strength = 0.16 + noche * 0.22;
    this.bloom.threshold = 0.93 - noche * 0.1;
    this.bloom.radius = 0.4;
    u.tinte.value.setRGB(1.01 - noche * 0.05, 1.0, 0.98 + noche * 0.08);
    this.composer.render(dt);
  }
}
