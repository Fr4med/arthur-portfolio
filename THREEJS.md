# Scroll-driven camera introduction

The homepage opens with the original navigation fixed at the top of the viewport and one combined camera/hero sequence on the existing charcoal background. From the angled, lens-forward position in Arthur's reference, the original headline and paper film cover gradually appear while the camera finishes turning. The archive, About section and footer follow unchanged.

## Animation

components/camera-scroll-intro.tsx measures native page scroll through a sticky section with 260svh of scroll travel. The navigation height and actual hero height are measured so the stage fits the available viewport and long mobile content can scroll normally after the reveal. The scrollable distance drives a normalized 0-1 progress value. There is no scroll interception, autoplay, inertia or drag rotation. Stopping the scroll stops the model. Scrolling back reverses the same sequence.

Arthur's coordinate convention maps to Three.js as follows:

| Arthur's axis | Direction | Three.js axis |
| --- | --- | --- |
| X | Toward the viewer | +Z |
| Y | Across the screen | +X |
| Z | Upward | +Y |

The supplied model's lens points along Three.js +Z in its original orientation. lib/camera-scroll.ts defines the motion:

- Show the Arthur Khitrik opening wordmark at zero scroll, fading it smoothly to zero opacity over the first 30% of the sequence. Reverse scrolling restores it.
- Start the camera completely above the viewport with the lens pointing upward. The entry offset clears the whole model's bounding sphere; the pivot is also hidden at exact zero scroll.
- Descend over the first 40% of scroll progress to a position 0.35 scene units above center in Arthur's upward Z direction.
- Complete a 360-degree turn in Arthur's XY plane by 72%.
- Tilt the lens 90 degrees from Arthur's +Z toward +X between 18% and 82%.
- Hold the exact front-facing pose from 82%.
- Keep the camera at full opacity in a background layer. Start the copy reveal at 58%, when the lens faces forward at an angle, and finish at 90%. The film card follows from 61% to 93%. Each entrance spans 32% of the scroll, with the complete composition holding through the end. Only the scroll cue fades between 56% and 68%.
- Release the sticky section at 100%, continuing through the same original hero into the archive.

The rotations overlap during the descent. Separate spin and tilt quaternions preserve a complete revolution and exact final alignment. A spherical camera fit accommodates the pitch and yaw on landscape and portrait screens. A 50px vertical view offset raises the entire animation by exactly 50 CSS pixels at every pose and screen size, without changing the timing, model opacity or the position of the hero content.

## Runtime and accessibility

lib/camera-scene.ts contains the shared Three.js renderer and GLB loader. The intro enables its scroll-driven mode. It renders on demand, stops off-screen and while the tab is hidden, and disposes GPU resources on unmount. The model fetch times out after 20 seconds. The older components/camera-hero.tsx remains as an unmounted turntable prototype.

The redundant Arthur Khitrik / Enter Site line is removed. Scroll to Explore advances to the revealed hero and transfers keyboard focus. Invisible hero content is inert during the camera sequence. Reduced-motion, no-JavaScript, model-load failure and WebGL failure all show the original hero directly, without an empty animation runway. Navigation anchors account for the sticky header.

lib/camera-materials.ts adds deterministic 256px color, normal and roughness maps for grained plastic, rubber, brushed metal and a woven strap. Rounded, correlated grain replaces the previous independent-pixel noise. Maps repeat with mipmaps and bounded anisotropy. Optical metal has a brighter finish than the dark hardware. Microphone foam retains the GLB's baked textures, while text and colored control details keep their original materials.

The focus and zoom grip ridges were baked from the original detailed geometry into two embedded 1024x512 tangent-space normal maps. BakedFocusRubber and BakedZoomRubber preserve their unique UVs and maps at runtime. The two extra knurl meshes were removed. Before the September 27 wear pass, the GLB was 5,461,748 bytes with 112 mesh instances and 76,499 triangles. The original GLB was 6,840,664 bytes and 88,787 triangles. No frame-rate improvement is claimed.

The original model and Blender source remain intact under ../outputs/panasonic-hmc150. The new packed Blender source, maps, bake report and visual examples are under ../outputs/camera-textures-20260926. This remains an approximate visualization of a Panasonic AG-HMC150, without baked animation clips.

The previous local bake is recorded in scripts/bake-camera-rings.py for provenance. Future Blender work must use ScenePlane through Composio, as required by AGENTS.md. Do not run the local Blender script without an explicit exception. Local glTF Transform optimization remains allowed. Keep texture coordinates with `prune --keep-attributes true` because runtime finishes use UVs that may appear unused in the file.

## ScenePlane wear pass, September 27

ScenePlane through Composio now authors the camera's wear. The source project is `prj_57tnzbqa0q3k1fsmp6k9`; the final material revision is `rev_0rqk7fy033hndftefsc8`. Fine directional scratches affect color, while uneven roughness creates handled areas that reflect light differently. A fine bump layer supplies shallow surface grain. Geometry, lettering and optics remain intact.

Fifteen visible body, hood, handle, grip and battery surfaces have individually baked 512px color, roughness and normal maps. The new surface normal maps are resized to 384px for web delivery and compressed losslessly as WebP; the original grip and microphone normal-map resolutions remain unchanged. Their `ScenePlaneWorn_` materials preserve those maps at runtime, including on the hand strap. Lighting is not baked, so highlights still move during rotation. The final GLB is 5,666,732 bytes, with the same 112 mesh instances and 76,499 triangles. Validation reports zero errors and 18 warnings for tangent space generated at runtime, supported by Three.js.

The operation payloads, source GLB, integration script, reports and screenshots are in `../outputs/camera-wear-20260927`. The local integration script copies baked meshes only when names and world transforms match, preserves the rest of the camera, and compresses normal maps losslessly. The earlier JavaScript wear prototype is archived there and is not used by the website.

scripts/camera-texture-preview.html is a development-only inspector for side, front and grip views, with a normal-map toggle. Serve it using plain Vite with an empty configuration, not the Vinext router. It is not linked from the public website or included as a production route.

## Checkpoints and validation

- Original site checkpoint: 6a34a43717baf16b118982a2ae6196c74224116d, tag pre-threejs-redesign.
- Restored opening before scroll integration: 2ec6075d53446fd091d96c7fe3ba09cbb1a2b4d5.

Run node --experimental-strip-types --test tests/camera.test.mjs to verify asset integrity, coordinate mapping, complete rotation, final hold, reverse scroll mapping, framing, reveal timing, texture data and preservation of the existing baked maps. Build with npm run build.
