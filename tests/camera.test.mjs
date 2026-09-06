import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Vector3, Quaternion, Euler, PerspectiveCamera } from 'three';
import { cameraDistance } from '../lib/camera-framing.ts';

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
