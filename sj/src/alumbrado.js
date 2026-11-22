import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _o = new THREE.Object3D(), _c = new THREE.Color();

function instancias(geo, mat, lista, poner) {
  const m = new THREE.InstancedMesh(geo, mat, lista.length);
  lista.forEach((p, i) => { poner(p); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); });
  m.instanceMatrix.needsUpdate = true;
  return m;
}

export function alumbrado(juego) {
  const j = juego, escena = j.escena, C = j.ciudad, mundo = j.mundo, tex = C.texSuave;
  const postes = (j.mobiliario?.postesLista || []).filter(P => P.t !== 40);
  const lum = postes.map((P, k) => {
    const nx = P.eje === 'x' ? 0 : -P.lado, nz = P.eje === 'x' ? -P.lado : 0;
    return { x: P.x, z: P.z, nx, nz, hx: P.x + nx * 2.3, hz: P.z + nz * 2.3, led: (k * 7919) % 10 < 3 };
  });
  const gris = new THREE.MeshStandardMaterial({ color: '#6a6c70', roughness: 0.55, metalness: 0.5 });
  const brazoGeo = mergeGeometries([new THREE.CylinderGeometry(0.045, 0.05, 2.45, 6).rotateX(Math.PI / 2).rotateX(-0.12).translate(0, 7.28, 1.15), new THREE.BoxGeometry(0.12, 0.3, 0.12).translate(0, 7.12, 0.02)]);
  const cabezaGeo = new THREE.CapsuleGeometry(0.16, 0.5, 4, 10).rotateX(Math.PI / 2).scale(1.15, 0.55, 1).translate(0, 7.43, 2.35);
  const lenteGeo = new THREE.PlaneGeometry(0.3, 0.55).rotateX(Math.PI / 2).translate(0, 7.36, 2.38);
  const orientar = L => { _o.position.set(L.x, 0, L.z); _o.rotation.set(0, Math.atan2(L.nx, L.nz), 0); _o.scale.setScalar(1); };
  const brazos = instancias(brazoGeo, gris, lum, orientar), cabezas = instancias(cabezaGeo, gris, lum, orientar);
  const matLente = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  const lentes = instancias(lenteGeo, matLente, lum, orientar);
  lum.forEach((L, i) => lentes.setColorAt(i, _c.set(L.led ? '#dfe8ff' : '#ffb35a')));
  lentes.instanceColor.needsUpdate = true;
  brazos.castShadow = cabezas.castShadow = false;
  const charcoGeo = new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2);
  const matCharco = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const charcos = instancias(charcoGeo, matCharco, lum, L => { _o.position.set(L.hx, 0.065, L.hz); _o.rotation.set(0, 0, 0); _o.scale.setScalar(1); });
  lum.forEach((L, i) => charcos.setColorAt(i, _c.set(L.led ? '#9fb4e0' : '#ff9a3a')));
  charcos.instanceColor.needsUpdate = true; charcos.renderOrder = 1;
  const pos = new Float32Array(lum.length * 3), col = new Float32Array(lum.length * 3);
  lum.forEach((L, i) => { pos.set([L.hx, 7.3, L.hz], i * 3); _c.set(L.led ? '#e8f0ff' : '#ffb060'); col.set([_c.r, _c.g, _c.b], i * 3); });
  const gH = new THREE.BufferGeometry(); gH.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gH.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const halos = new THREE.Points(gH, new THREE.PointsMaterial({ map: tex, size: 3.4, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  escena.add(brazos, cabezas, lentes, charcos, halos);

  const col2 = [], Lg = C.lugares, libre = (x, z) => !mundo.dentro(x, 1, z) && !C.bancas.some(b => Math.hypot(b.x - x, b.z - z) < 1.4);
  const anillo = (cx, cz, r, n, fase = 0) => { for (let k = 0; k < n; k++) { const a = fase + k / n * Math.PI * 2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (libre(x, z)) col2.push({ x, z }); } };
  if (Lg.plaza) { anillo(Lg.plaza.x, Lg.plaza.z, 11, 8, Math.PI / 8); anillo(Lg.plaza.x, Lg.plaza.z, 23, 12, 0.2); }
  if (Lg.monumento) anillo(Lg.monumento.x, Lg.monumento.z, 16.5, 8, Math.PI / 8);
  for (const B of C.bloques.filter(b => b.tipo === 'parque')) {
    for (const [dx, dz] of [[-2.4, 12], [2.4, -12], [12, 2.4], [-12, -2.4], [2.4, 21], [-2.4, -21], [21, -2.4], [-21, 2.4], [9, 9], [-9, -9], [9, -9], [-9, 9]]) if (libre(B.cx + dx, B.cz + dz)) col2.push({ x: B.cx + dx, z: B.cz + dz });
  }
  const P = j.catedral?.puerta; if (P) for (const s of [-1, 1]) col2.push({ x: P.x + s * 4.6, z: P.z + 5.5 });
  for (const F of col2) mundo.agregar(F.x - 0.2, F.z - 0.2, F.x + 0.2, F.z + 0.2, 4);
  const negro = new THREE.MeshStandardMaterial({ color: '#1c1d20', roughness: 0.45, metalness: 0.6 });
  const posteC = mergeGeometries([new THREE.CylinderGeometry(0.28, 0.34, 0.5, 10).translate(0, 0.25, 0), new THREE.CylinderGeometry(0.16, 0.22, 0.4, 10).translate(0, 0.7, 0), new THREE.CylinderGeometry(0.07, 0.09, 3.0, 8).translate(0, 2.35, 0), new THREE.BoxGeometry(1.2, 0.06, 0.06).translate(0, 3.7, 0), new THREE.BoxGeometry(0.06, 0.06, 1.2).translate(0, 3.7, 0), new THREE.SphereGeometry(0.1, 8, 6).translate(0, 3.92, 0)]);
  const postesC = instancias(posteC, negro, col2, F => { _o.position.set(F.x, 0, F.z); _o.rotation.set(0, 0, 0); _o.scale.setScalar(1); });
  postesC.castShadow = true;
  const globos = [];
  for (const F of col2) for (const [dx, dz] of [[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]]) globos.push({ x: F.x + dx, z: F.z + dz });
  const matGlobo = new THREE.MeshStandardMaterial({ color: '#f2ece0', roughness: 0.3, emissive: '#ffcf80', emissiveIntensity: 0 });
  const globo = instancias(new THREE.SphereGeometry(0.17, 12, 10).translate(0, 3.93, 0), matGlobo, globos, G => { _o.position.set(G.x, 0, G.z); _o.rotation.set(0, 0, 0); _o.scale.setScalar(1); });
  const matCharco2 = matCharco.clone(); matCharco2.color.set('#ffb870');
  const charcos2 = instancias(new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2), matCharco2, col2, F => { _o.position.set(F.x, 0.21, F.z); _o.rotation.set(0, 0, 0); _o.scale.setScalar(1); });
  charcos2.renderOrder = 1;
  const pos2 = new Float32Array(col2.length * 3); col2.forEach((F, i) => pos2.set([F.x, 3.95, F.z], i * 3));
  const gH2 = new THREE.BufferGeometry(); gH2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  const halos2 = new THREE.Points(gH2, new THREE.PointsMaterial({ map: tex, color: '#ffc880', size: 2.6, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  escena.add(postesC, globo, charcos2, halos2);

  return {
    luminarias: lum.length, coloniales: col2.length,
    actualizar(noche) {
      const n = Math.max(0, Math.min(1, (noche - 0.15) / 0.5));
      charcos.visible = charcos2.visible = halos.visible = halos2.visible = n > 0.01;
      matCharco.opacity = n * 0.5; matCharco2.opacity = n * 0.4;
      halos.material.opacity = n * 0.75; halos2.material.opacity = n * 0.7;
      matLente.color.setScalar(0.35 + n * 0.65);
      matGlobo.emissiveIntensity = n * 2.2;
    }
  };
}
