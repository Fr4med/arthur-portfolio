# Three.js prototype

The original homepage opening was restored after feedback on 7 September 2026. The prototype and model remain in the project, but app/page.tsx does not import or mount the camera component. Define the camera placement, animation sequence and scroll behavior with Arthur before integrating it into the existing opening section.

The pre-redesign site was committed and pushed before implementation:

- Commit: `6a34a43717baf16b118982a2ae6196c74224116d`
- Tag: `pre-threejs-redesign`

This checkpoint includes the SHABBAT SESH title changes already present in the checkout. It is available in the existing Sites source repository. No separate GitHub repository was created.

`components/camera-hero.tsx` contains the retained prototype composition, loading/fallback states and accessible controls. It imports `lib/camera-scene.ts` only after mounting in the browser. Three.js renders the supplied GLB in a black scene, with studio environment lighting and a blue rim light. The portfolio routes and HTML controls continue to use React; they do not depend on WebGL to function.

The model is copied from `../outputs/panasonic-hmc150/panasonic-hmc150.glb`. It is approximately 6.8 MB, with 114 meshes and 88,787 triangles. Its three textures are embedded. The original Blender source and renders are in the same output directory. The model is an approximate visualization of a Panasonic AG-HMC150.

The scene recenters and scales the full model, then applies a continuous yaw rotation and a small vertical float. No baked animation clips are required. `lib/camera-framing.ts` fits the rotating model to the current viewport. Pixel density is capped to limit GPU load. Vertical touch gestures can scroll the page. Dragging or keyboard rotation pauses automatic movement.

Animation starts paused for `prefers-reduced-motion`. It stops while the viewer is off-screen or the document is hidden. Unmounting cancels pending requests and animation frames and disposes geometry, materials, textures, environment lighting, observers and the WebGL context. A failed model request or lost context shows the supplied render instead.

Run `node --experimental-strip-types --test tests/camera.test.mjs` to verify the shipped GLB and model framing across viewport shapes. Build with `npm run build`.
