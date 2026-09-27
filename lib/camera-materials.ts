import * as THREE from 'three';

type Finish = 'housing' | 'rubber' | 'metal' | 'fabric';

/** Tileable surface detail; the focus/zoom normals are baked into the GLB separately. */
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
  // Correlated grain produces rounded pores instead of independent, sparkling pixels.
  const lattice = Array.from({ length: 64 * 64 }, random);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  function noise(x: number, y: number, cells: number) {
    const u = x / size * cells, v = y / size * cells;
    const ix = Math.floor(u), iy = Math.floor(v);
    const sx = smooth(u - ix), sy = smooth(v - iy);
    const at = (a: number, b: number) => lattice[(b % cells) * 64 + a % cells];
    const a = THREE.MathUtils.lerp(at(ix, iy), at(ix + 1, iy), sx);
    const b = THREE.MathUtils.lerp(at(ix, iy + 1), at(ix + 1, iy + 1), sx);
    return THREE.MathUtils.lerp(a, b, sy);
  }

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const grain = random();
    const coarse = noise(x, y, 32), fine = noise(x, y, 64);
    const warp = Math.sin(x * Math.PI / 8), weft = Math.sin(y * Math.PI / 8);
    const weave = Math.abs(warp * weft);
    const height = finish === 'fabric' ? weave * 0.8 + fine * 0.2
      : finish === 'metal' ? brushedLines[y] * 0.6 + fine * 0.3 + grain * 0.1
      : finish === 'rubber' ? coarse * 0.7 + fine * 0.3
      : coarse * 0.5 + fine * 0.45 + grain * 0.05;
    heights[i] = height;
    const shade = Math.round((finish === 'fabric' ? 175 : 214) + height * (finish === 'fabric' ? 80 : 41));
    const rough = Math.round((finish === 'metal' ? 135 : 170) + height * 80);
    albedo.set([shade, shade, shade, 255], i * 4);
    roughness.set([rough, rough, rough, 255], i * 4);
  }
  const sample = (x: number, y: number) => heights[((y + size) % size) * size + (x + size) % size];
  const strength = finish === 'fabric' ? 1.2 : finish === 'rubber' ? 0.65 : finish === 'metal' ? 0.18 : 0.38;
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
    map.repeat.setScalar(finish === 'fabric' ? 3 : finish === 'metal' ? 4 : 6);
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
    if (/GripStrap/i.test(object.name) && object.material instanceof THREE.MeshStandardMaterial && !object.material.name.startsWith('ScenePlaneWorn_')) {
      object.material = object.material.clone();
      object.material.name = 'WovenStrap';
    }
    if (/LensSilverBand|OpticRing|InnerOpticRim/i.test(object.name) && object.material instanceof THREE.MeshStandardMaterial) {
      object.material = object.material.clone();
      object.material.name = 'OpticalMetal';
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial) || processed.has(material)) continue;
      processed.add(material);
      if (material.name.startsWith('ScenePlaneWorn_')) {
        // ScenePlane baked color, roughness and normal maps use unique UVs.
        // Keep the authored wear instead of replacing it with tiled grain.
        material.envMapIntensity = 0.35;
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.anisotropy = Math.min(anisotropy, 4);
        }
        material.needsUpdate = true;
        continue;
      }
      switch (material.name) {
        case 'Housing':
          material.color.set('#24292e');
          material.roughness = 0.9;
          material.metalness = 0.04;
          material.envMapIntensity = 0.35;
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
        case 'BakedFocusRubber':
        case 'BakedZoomRubber':
          // These maps encode the old ridge geometry, with unique non-repeating UVs.
          // Replacing them with the shared rubber grain would erase the baked detail.
          material.color.set('#151a20');
          material.roughness = 0.78;
          material.metalness = 0;
          material.envMapIntensity = 0.25;
          if (material.normalMap) material.normalMap.anisotropy = Math.min(anisotropy, 4);
          break;
        case 'Metal':
        case 'OpticalMetal':
          material.color.set(material.name === 'OpticalMetal' ? '#727c84' : '#303940');
          material.metalness = 0.85;
          material.roughness = material.name === 'OpticalMetal' ? 0.48 : 0.68;
          material.envMapIntensity = 0.7;
          finish(material, 'metal');
          break;
        case 'Glass':
          material.color.set('#102630');
          material.metalness = 0.3;
          material.roughness = 0.16;
          material.envMapIntensity = 0.7;
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
