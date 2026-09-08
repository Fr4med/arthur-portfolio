import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { cameraDistance } from './camera-framing';
import { cameraEntryHeight, cameraScrollPose, introCameraDistance } from './camera-scroll';
import { applyCameraMaterials } from './camera-materials';

type Options = {
  signal: AbortSignal;
  onReady: () => void;
  onError: () => void;
  onPauseChange: (paused: boolean) => void;
  scrollDriven?: boolean;
};

function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => {
    const image = texture.source.data;
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
    texture.dispose();
  });
}

export function mountCameraScene(host: HTMLElement, options: Options) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(getComputedStyle(host).getPropertyValue('--background').trim() || '#0b0d10');
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.75;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight('#ffffff', 3.2);
  key.position.set(-3, 5, 4);
  const fill = new THREE.DirectionalLight('#cde4ff', 1.4);
  fill.position.set(4, 1, 2);
  const rim = new THREE.DirectionalLight('#659fd5', 2.8);
  rim.position.set(-2, 2, -4);
  scene.add(key, fill, rim);

  const pivot = new THREE.Group();
  scene.add(pivot);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let disposed = false;
  let ready = false;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let yaw = -0.85;
  let width = 1;
  let height = 1;
  let dimensions = new THREE.Vector3(1, 1, 1);
  let progress = 0;
  let entryHeight = 4;
  const spin = new THREE.Quaternion();
  const tilt = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const horizontal = new THREE.Vector3(1, 0, 0);
  let pointer: { id: number; x: number; y: number } | null = null;
  options.onPauseChange(paused);

  function render(time: number) {
    frame = 0;
    if (disposed || !ready || !visible || document.hidden) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    if (!options.scrollDriven && !paused) {
      elapsed += delta;
      yaw += delta * 0.12;
    }
    applyPose();
    renderer.render(scene, camera);
    if (!options.scrollDriven && !paused) frame = requestAnimationFrame(render);
  }

  function applyPose() {
    if (options.scrollDriven) {
      // No model fragments on the initial frame, including after returning to the top.
      pivot.visible = progress > 0 || motion.matches;
      const pose = cameraScrollPose(motion.matches ? 1 : progress, entryHeight);
      spin.setFromAxisAngle(up, pose.yaw);
      tilt.setFromAxisAngle(horizontal, pose.pitch);
      pivot.quaternion.copy(spin).multiply(tilt);
      pivot.position.set(0, pose.y, 0);
    } else {
      pivot.rotation.set(0.035, yaw, -0.035);
      pivot.position.y = Math.sin(elapsed * 0.8) * 0.06;
    }
  }

  function setProgress(value: number) {
    const next = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    if (progress === next) return;
    progress = next;
    refresh();
  }

  function refresh() {
    lastTime = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!disposed && ready && visible && !document.hidden) frame = requestAnimationFrame(render);
  }

  function setPaused(value: boolean) {
    paused = value;
    options.onPauseChange(value);
    refresh();
  }

  function resize() {
    width = Math.max(host.clientWidth, 1);
    height = Math.max(host.clientHeight, 1);
    camera.aspect = width / height;
    const distance = options.scrollDriven
      ? introCameraDistance(dimensions.x, dimensions.y, dimensions.z, camera.aspect)
      : cameraDistance(dimensions.x, dimensions.y, dimensions.z, camera.aspect);
    camera.position.set(0, options.scrollDriven ? 0 : 0.35, distance);
    entryHeight = cameraEntryHeight(dimensions.x, dimensions.y, dimensions.z, distance, camera.fov);
    camera.lookAt(0, 0, 0);
    // Shift the entire projection exactly 50 CSS pixels up at every scroll pose.
    if (options.scrollDriven) camera.setViewOffset(width, height, 0, 50, width, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    refresh();
  }

  function reset() {
    yaw = -0.85;
    elapsed = 0;
    refresh();
  }

  function pointerDown(event: PointerEvent) {
    if (options.scrollDriven || !ready || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function pointerMove(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    // Vertical touch gestures continue scrolling the page.
    if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) {
      pointer = null;
      return;
    }
    if (Math.abs(dx) < 2) return;
    host.setPointerCapture(event.pointerId);
    yaw += dx * 0.008;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    setPaused(true);
  }

  function pointerUp() { pointer = null; }
  function keyDown(event: KeyboardEvent) {
    if (options.scrollDriven || !ready) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      yaw += event.key === 'ArrowLeft' ? -0.15 : 0.15;
      setPaused(true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      reset();
    }
  }
  function motionChange() { setPaused(motion.matches); }
  function contextLost(event: Event) {
    event.preventDefault();
    dispose();
    if (!options.signal.aborted) options.onError();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    refresh();
  });
  visibilityObserver.observe(host);
  document.addEventListener('visibilitychange', refresh);
  motion.addEventListener('change', motionChange);
  host.addEventListener('pointerdown', pointerDown);
  host.addEventListener('pointermove', pointerMove);
  host.addEventListener('pointerup', pointerUp);
  host.addEventListener('pointercancel', pointerUp);
  host.addEventListener('lostpointercapture', pointerUp);
  host.addEventListener('keydown', keyDown);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  options.signal.addEventListener('abort', dispose, { once: true });

  async function load() {
    try {
      const response = await fetch('/models/panasonic-hmc150.glb', {
        signal: AbortSignal.any([options.signal, AbortSignal.timeout(20000)]),
      });
      if (!response.ok) throw new Error('Camera model could not be loaded');
      const data = await response.arrayBuffer();
      if (disposed) return;
      const gltf = await new GLTFLoader().parseAsync(data, '/models/');
      if (disposed) { disposeModel(gltf.scene); return; }
      const root = gltf.scene;
      applyCameraMaterials(root, renderer.capabilities.getMaxAnisotropy());
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const scale = 3.8 / Math.max(size.x, size.y, size.z);
      root.scale.multiplyScalar(scale);
      root.position.sub(center.multiplyScalar(scale));
      dimensions = size.multiplyScalar(scale);
      pivot.add(root);
      ready = true;
      resize();
      // Only hide the loading state after the first complete frame.
      renderer.compile(scene, camera);
      applyPose();
      renderer.render(scene, camera);
      options.onReady();
      refresh();
    } catch {
      if (!disposed) {
        dispose();
        if (!options.signal.aborted) options.onError();
      }
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener('visibilitychange', refresh);
    motion.removeEventListener('change', motionChange);
    host.removeEventListener('pointerdown', pointerDown);
    host.removeEventListener('pointermove', pointerMove);
    host.removeEventListener('pointerup', pointerUp);
    host.removeEventListener('pointercancel', pointerUp);
    host.removeEventListener('lostpointercapture', pointerUp);
    host.removeEventListener('keydown', keyDown);
    options.signal.removeEventListener('abort', dispose);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    disposeModel(pivot);
    environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  resize();
  void load();
  return { setPaused, setProgress, reset, dispose };
}
