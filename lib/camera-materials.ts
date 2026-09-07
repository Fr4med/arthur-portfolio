import * as THREE from 'three';

type Finish = 'housing' | 'rubber' | 'metal' | 'fabric';

/** Small, repeatable PBR maps. No external images or extra model download. */
export function createFinishTextures(finish: Finish) {
  const size = 256;
  const heights = new Float32Array(size * size);
  const albedo = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  let seed = { housing: 901, rubber: 215, metal: 607, fabric: 443 }[finish];
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const brushedLines = Array.from({ length: size }, random);

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const grain = random();
    const weave = Math.sin(x * Math.PI / 4) * Math.sin(y * Math.PI / 4);
    const height = finish === 'fabric' ? 0.5 + weave * 0.3 + grain * 0.12
      : finish === 'metal' ? brushedLines[y] * 0.75 + grain * 0.25
      : finish === 'rubber' ? grain ** 1.6 : grain;
    heights[i] = height;
    const shade = Math.round(220 + height * 35);
    const rough = Math.round((finish === 'metal' ? 155 : 210) + height * 40);
    albedo.set([shade, shade, shade, 255], i * 4);
    roughness.set([rough, rough, rough, 255], i * 4);
  }
  const sample = (x: number, y: number) => heights[((y + size) % size) * size + (x + size) % size];
  const strength = finish === 'fabric' ? 1.7 : finish === 'rubber' ? 0.9 : finish === 'metal' ? 0.25 : 0.5;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (sample(x - 1, y) - sample(x + 1, y)) * strength;
    const dy = (sample(x, y - 1) - sample(x, y + 1)) * strength;
    const length = Math.hypot(dx, dy, 1);
    normal.set([
      Math.round((dx / length * 0.5 + 0.5) * 255),
      Math.round((dy / length * 0.5 + 0.5) * 255),
      Math.round((1 / length * 0.5 + 0.5) * 255), 255,
    ], (y * size + x) * 4);
  }
  function texture(data: Uint8Array, color = false) {
    const map = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    map.name = `Camera ${finish} ${color ? 'color' : 'surface'}`;
    map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.setScalar(finish === 'fabric' ? 3 : 4);
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
    return map;
  }
  return { map: texture(albedo, true), normalMap: texture(normal), roughnessMap: texture(roughness) };
}

export function applyCameraMaterials(root: THREE.Object3D, anisotropy = 1) {
  const finishes = new Map<Finish, ReturnType<typeof createFinishTextures>>();
  const processed = new Set<THREE.Material>();
  function finish(material: THREE.MeshStandardMaterial, name: Finish) {
    let maps = finishes.get(name);
    if (!maps) {
      maps = createFinishTextures(name);
      Object.values(maps).forEach(map => { map.anisotropy = Math.min(anisotropy, 4); });
      finishes.set(name, maps);
    }
    Object.assign(material, maps);
  }
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    // The cloth strap has its own finish; the other rubber parts keep their shared material.
    if (/GripStrap/i.test(object.name) && object.material instanceof THREE.MeshStandardMaterial) {
      object.material = object.material.clone();
      object.material.name = 'WovenStrap';
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial) || processed.has(material)) continue;
      processed.add(material);
      switch (material.name) {
        case 'Housing':
          material.color.set('#292e33');
          material.roughness = 0.92;
          material.metalness = 0.04;
          material.envMapIntensity = 0.45;
          finish(material, 'housing');
          break;
        case 'Rubber':
        case 'WovenStrap':
          material.color.set('#171a1e');
          material.roughness = 1;
          material.metalness = 0;
          material.envMapIntensity = 0.2;
          finish(material, material.name === 'WovenStrap' ? 'fabric' : 'rubber');
          break;
        case 'Metal':
          material.color.set('#626970');
          material.metalness = 0.85;
          material.roughness = 0.65;
          material.envMapIntensity = 0.7;
          finish(material, 'metal');
          break;
        case 'Glass':
          material.color.set('#163440');
          material.metalness = 0.65;
          material.roughness = 0.12;
          material.envMapIntensity = 0.9;
          break;
        case 'FoamGrain':
          // Keep the model's baked microphone maps and their UVs.
          material.color.set('#777777');
          material.roughness = 1;
          material.metalness = 0;
          material.envMapIntensity = 0.18;
          break;
      }
      material.needsUpdate = true;
    }
  });
}
