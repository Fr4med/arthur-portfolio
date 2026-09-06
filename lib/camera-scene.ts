import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { cameraDistance } from './camera-framing';

type Options = {
  signal: AbortSignal;
  onReady: () => void;
  onError: () => void;
  onPauseChange: (paused: boolean) => void;
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
  scene.background = new THREE.Color('#000000');
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.25;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight('#ffffff', 3.5);
  key.position.set(-3, 5, 4);
  const fill = new THREE.DirectionalLight('#cde4ff', 2.1);
  fill.position.set(4, 1, 2);
  const rim = new THREE.DirectionalLight('#659fd5', 3.3);
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
  let pointer: { id: number; x: number; y: number } | null = null;
  options.onPauseChange(paused);

  function render(time: number) {
    frame = 0;
    if (disposed || !ready || !visible || document.hidden) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    if (!paused) {
      elapsed += delta;
      yaw += delta * 0.12;
    }
    pivot.rotation.set(0.035, yaw, -0.035);
    pivot.position.y = Math.sin(elapsed * 0.8) * 0.06;
    renderer.render(scene, camera);
    if (!paused) frame = requestAnimationFrame(render);
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
    camera.position.set(0, 0.35, cameraDistance(dimensions.x, dimensions.y, dimensions.z, camera.aspect));
    camera.lookAt(0, 0, 0);
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
    if (!ready || event.button !== 0) return;
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
    if (!ready) return;
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
      const response = await fetch('/models/panasonic-hmc150.glb', { signal: options.signal });
      if (!response.ok) throw new Error('Camera model could not be loaded');
      const data = await response.arrayBuffer();
      if (disposed) return;
      const gltf = await new GLTFLoader().parseAsync(data, '/models/');
      if (disposed) { disposeModel(gltf.scene); return; }
      const root = gltf.scene;
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
      pivot.rotation.set(0.035, yaw, -0.035);
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
  return { setPaused, reset, dispose };
}
