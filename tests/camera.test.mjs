import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Vector3, Quaternion, Euler, PerspectiveCamera } from 'three';
import { cameraDistance } from '../lib/camera-framing.ts';
import { cameraScrollPose, cameraScrollProgress, introCameraDistance } from '../lib/camera-scroll.ts';

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
  assert.equal(finish.y, 0);
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

test('pitch and yaw remain in frame after the entrance, including portrait phones', () => {
  const size = assetBounds().getSize(new Vector3());
  size.multiplyScalar(3.8 / Math.max(size.x, size.y, size.z));
  const half = size.clone().multiplyScalar(0.5);
  for (const [width, height] of [[1440, 900], [930, 856], [390, 844], [320, 568], [844, 390]]) {
    const camera = new PerspectiveCamera(32, width / height, 0.01, 100);
    camera.position.z = introCameraDistance(size.x, size.y, size.z, camera.aspect);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    for (let step = 40; step <= 100; step++) {
      const rotation = scrollRotation(cameraScrollPose(step / 100, 10));
      for (const x of [-half.x, half.x]) for (const y of [-half.y, half.y]) for (const z of [-half.z, half.z]) {
        const point = new Vector3(x, y, z).applyQuaternion(rotation).project(camera);
        assert.ok(Math.abs(point.x) < 0.98 && Math.abs(point.y) < 0.98, `Clipping at ${width}×${height}, progress ${step}%`);
      }
    }
  }
});
