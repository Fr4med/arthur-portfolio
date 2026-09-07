import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Vector3, Quaternion, Euler, PerspectiveCamera, Group, Mesh, BoxGeometry, MeshStandardMaterial, Texture, NoColorSpace, SRGBColorSpace } from 'three';
import { cameraDistance } from '../lib/camera-framing.ts';
import { cameraEntryHeight, cameraHeroReveal, cameraScrollPose, cameraScrollProgress, introCameraDistance } from '../lib/camera-scroll.ts';
import { applyCameraMaterials, createFinishTextures } from '../lib/camera-materials.ts';

const buffer = readFileSync(new URL('../public/models/panasonic-hmc150.glb', import.meta.url));
const jsonLength = buffer.readUInt32LE(12);
const gltf = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString());

test('the shipped camera GLB is complete and self-contained', () => {
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF');
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  assert.equal(buffer.readUInt32LE(16), 0x4e4f534a);
  assert.equal(gltf.meshes.length, 114);
  assert.ok(gltf.images.length > 0);
  assert.ok(gltf.images.every(image => image.bufferView !== undefined && !image.uri));
  assert.ok(gltf.buffers.every(data => !data.uri));
  const binOffset = 20 + jsonLength;
  assert.equal(buffer.readUInt32LE(binOffset + 4), 0x004e4942);
  assert.ok(buffer.readUInt32LE(binOffset) >= gltf.buffers[0].byteLength);
});

function assetBounds() {
  const combined = new Box3();
  function visit(index, parentMatrix) {
    const node = gltf.nodes[index];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation || [0, 0, 0]),
      new Quaternion().fromArray(node.rotation || [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale || [1, 1, 1]),
    );
    const world = parentMatrix.clone().multiply(local);
    if (node.mesh !== undefined) for (const primitive of gltf.meshes[node.mesh].primitives) {
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      combined.union(new Box3(new Vector3().fromArray(accessor.min), new Vector3().fromArray(accessor.max)).applyMatrix4(world));
    }
    for (const child of node.children || []) visit(child, world);
  }
  for (const index of gltf.scenes[gltf.scene || 0].nodes) visit(index, new Matrix4());
  return combined;
}

test('the complete camera stays inside the frame throughout a turn on desktop and phone', () => {
  const size = assetBounds().getSize(new Vector3());
  size.multiplyScalar(3.8 / Math.max(size.x, size.y, size.z));
  const half = size.clone().multiplyScalar(0.5);
  for (const [width, height] of [[1100, 550], [840, 363], [360, 312], [280, 300], [1440, 460]]) {
    const aspect = width / height;
    const camera = new PerspectiveCamera(32, aspect, 0.01, 100);
    camera.position.set(0, 0.35, cameraDistance(size.x, size.y, size.z, aspect));
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24) {
      const rotation = new Matrix4().makeRotationFromEuler(new Euler(0.035, angle, -0.035));
      for (const x of [-half.x, half.x]) for (const y of [-half.y, half.y]) for (const z of [-half.z, half.z]) {
        const point = new Vector3(x, y, z).applyMatrix4(rotation);
        point.y += 0.06;
        point.project(camera);
        assert.ok(Math.abs(point.x) < 0.98 && Math.abs(point.y) < 0.98, `Clipping at ${width}×${height}, angle ${angle}`);
        assert.ok(point.z > -1 && point.z < 1);
      }
    }
  }
});

function scrollRotation(pose) {
  return new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), pose.yaw)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pose.pitch));
}

test('scroll starts lens-up and ends with exactly one revolution and a 90-degree turn toward the viewer', () => {
  const start = cameraScrollPose(0, 5);
  const finish = cameraScrollPose(1, 5);
  assert.equal(start.y, 5);
  assert.equal(finish.y, 0.35);
  assert.ok(Math.abs(finish.yaw - start.yaw - 2 * Math.PI) < 1e-10);
  assert.ok(Math.abs(finish.pitch - start.pitch - Math.PI / 2) < 1e-10);
  const lens = new Vector3(0, 0, 1);
  assert.ok(lens.clone().applyQuaternion(scrollRotation(start)).distanceTo(new Vector3(0, 1, 0)) < 1e-10);
  assert.ok(lens.clone().applyQuaternion(scrollRotation(finish)).distanceTo(new Vector3(0, 0, 1)) < 1e-10);
  assert.ok(new Vector3(0, 1, 0).applyQuaternion(scrollRotation(finish)).distanceTo(new Vector3(0, 1, 0)) < 1e-10);
});

test('descent is monotonic and the finished pose holds before the original site enters', () => {
  let previous = cameraScrollPose(0, 5);
  for (let step = 1; step <= 100; step++) {
    const pose = cameraScrollPose(step / 100, 5);
    assert.ok(pose.y <= previous.y);
    assert.ok(pose.yaw >= previous.yaw);
    assert.ok(pose.pitch >= previous.pitch);
    previous = pose;
  }
  assert.deepEqual(cameraScrollPose(0.82, 5), cameraScrollPose(1, 5));
  assert.deepEqual(cameraScrollPose(-1, 5), cameraScrollPose(0, 5));
  assert.deepEqual(cameraScrollPose(2, 5), cameraScrollPose(1, 5));
});

test('scroll coordinates clamp at the section boundaries and reverse when scrolling back', () => {
  assert.equal(cameraScrollProgress(0, 3200, 1000), 0);
  assert.equal(cameraScrollProgress(-1100, 3200, 1000), 0.5);
  assert.equal(cameraScrollProgress(-2200, 3200, 1000), 1);
  assert.equal(cameraScrollProgress(-4000, 3200, 1000), 1);
  assert.equal(cameraScrollProgress(-550, 3200, 1000), 0.25);
  assert.equal(cameraScrollProgress(100, 3200, 1000), 0);
  assert.ok(Number.isFinite(cameraScrollProgress(0, 1000, 1000)));
});

test('camera starts entirely outside the view and the raised pose stays in frame on desktop and phones', () => {
  const size = assetBounds().getSize(new Vector3());
  size.multiplyScalar(3.8 / Math.max(size.x, size.y, size.z));
  const half = size.clone().multiplyScalar(0.5);
  for (const [width, height] of [[1440, 900], [930, 856], [390, 844], [320, 568], [844, 390]]) {
    const camera = new PerspectiveCamera(32, width / height, 0.01, 100);
    camera.position.z = introCameraDistance(size.x, size.y, size.z, camera.aspect);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const entry = cameraEntryHeight(size.x, size.y, size.z, camera.position.z);
    for (const progress of [0, 0.0001]) {
      const pose = cameraScrollPose(progress, entry);
      const rotation = scrollRotation(pose);
      for (const x of [-half.x, half.x]) for (const y of [-half.y, half.y]) for (const z of [-half.z, half.z]) {
        const point = new Vector3(x, y, z).applyQuaternion(rotation);
        point.y += pose.y;
        point.project(camera);
        assert.ok(point.y > 1, `Camera visible at start at ${width}×${height}`);
      }
    }
    for (let step = 40; step <= 100; step++) {
      const pose = cameraScrollPose(step / 100, entry);
      const rotation = scrollRotation(pose);
      for (const x of [-half.x, half.x]) for (const y of [-half.y, half.y]) for (const z of [-half.z, half.z]) {
        const point = new Vector3(x, y, z).applyQuaternion(rotation);
        point.y += pose.y;
        point.project(camera);
        assert.ok(Math.abs(point.x) < 0.98 && Math.abs(point.y) < 0.98, `Clipping at ${width}×${height}, progress ${step}%`);
      }
    }
  }
});

test('the original hero reveals after the camera finishes, with a reversible handoff', () => {
  for (const p of [0, 0.5, 0.72, 0.82, 0.84, 0.86]) {
    assert.equal(cameraHeroReveal(p).copy, 0);
    assert.equal(cameraHeroReveal(p).art, 0);
  }
  const middle = cameraHeroReveal(0.91);
  assert.ok(middle.copy > 0 && middle.copy < 1);
  assert.ok(middle.art > 0 && middle.art < middle.copy);
  assert.deepEqual(cameraScrollPose(0.91, 5), cameraScrollPose(1, 5));
  assert.deepEqual(cameraHeroReveal(1), { copy: 1, art: 1, cue: 0 });
  assert.deepEqual(cameraHeroReveal(0), { copy: 0, art: 0, cue: 1 });
  // A tall mobile hero gets the same scroll runway, then releases into normal document flow.
  const header = 130, contentHeight = 1100, runway = 2000;
  assert.equal(cameraScrollProgress(header - header, contentHeight + runway, contentHeight), 0);
  assert.equal(cameraScrollProgress(header - runway - header, contentHeight + runway, contentHeight), 1);
});

test('surface maps contain actual detail, valid normals and correct texture color spaces', () => {
  for (const finish of ['housing', 'rubber', 'metal', 'fabric']) {
    const maps = createFinishTextures(finish);
    assert.equal(maps.map.colorSpace, SRGBColorSpace);
    assert.equal(maps.normalMap.colorSpace, NoColorSpace);
    assert.equal(maps.roughnessMap.colorSpace, NoColorSpace);
    assert.ok(new Set(maps.roughnessMap.image.data).size > 20);
    const normals = maps.normalMap.image.data;
    for (let i = 0; i < normals.length; i += 4) {
      const length = Math.hypot(normals[i] / 255 * 2 - 1, normals[i + 1] / 255 * 2 - 1, normals[i + 2] / 255 * 2 - 1);
      assert.ok(Math.abs(length - 1) < 0.014);
      assert.equal(normals[i + 3], 255);
    }
    Object.values(maps).forEach(texture => texture.dispose());
  }
});

test('camera materials retain baked foam and lettering while adding distinct shared surface maps', () => {
  const root = new Group();
  const originals = new Map();
  for (const definition of gltf.materials) {
    const material = new MeshStandardMaterial({ name: definition.name });
    if (definition.name === 'FoamGrain') material.normalMap = new Texture();
    originals.set(definition.name, material);
    root.add(new Mesh(new BoxGeometry(), material));
  }
  const strap = new Mesh(new BoxGeometry(), originals.get('Rubber'));
  strap.name = 'HMC_GripStrap';
  root.add(strap);
  const foamNormal = originals.get('FoamGrain').normalMap;
  applyCameraMaterials(root, 16);
  assert.equal(originals.get('FoamGrain').normalMap, foamNormal);
  assert.equal(originals.get('Label').map, null);
  assert.notEqual(strap.material, originals.get('Rubber'));
  assert.notEqual(strap.material.normalMap, originals.get('Rubber').normalMap);
  for (const name of ['Housing', 'Rubber', 'Metal']) {
    const material = originals.get(name);
    assert.ok(material.normalMap && material.roughnessMap && material.map);
    assert.equal(material.normalMap.anisotropy, 4);
    for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
      if (gltf.materials[primitive.material].name === name) assert.notEqual(primitive.attributes.TEXCOORD_0, undefined);
    }
  }
  const textures = new Set();
  root.traverse(object => {
    if (!object.isMesh) return;
    for (const value of Object.values(object.material)) if (value?.isTexture) textures.add(value);
    object.geometry.dispose();
    object.material.dispose();
  });
  textures.forEach(texture => texture.dispose());
});
