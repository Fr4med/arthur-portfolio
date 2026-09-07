# Scroll-driven camera introduction

The homepage opens with the original navigation fixed at the top of the viewport and one combined camera/hero sequence on the existing charcoal background. Once the camera finishes turning, the original headline and paper film cover pop into view. The archive, About section and footer follow unchanged.

## Animation

components/camera-scroll-intro.tsx measures native page scroll through a sticky section with 260svh of scroll travel. The navigation height and actual hero height are measured so the stage fits the available viewport and long mobile content can scroll normally after the reveal. The scrollable distance drives a normalized 0-1 progress value. There is no scroll interception, autoplay, inertia or drag rotation. Stopping the scroll stops the model. Scrolling back reverses the same sequence.

Arthur's coordinate convention maps to Three.js as follows:

| Arthur's axis | Direction | Three.js axis |
| --- | --- | --- |
| X | Toward the viewer | +Z |
| Y | Across the screen | +X |
| Z | Upward | +Y |

The supplied model's lens points along Three.js +Z in its original orientation. lib/camera-scroll.ts defines the motion:

- Start above the viewport center with the lens pointing upward.
- Descend to the center over the first 40% of scroll progress.
- Complete a 360-degree turn in Arthur's XY plane by 72%.
- Tilt the lens 90 degrees from Arthur's +Z toward +X between 18% and 82%.
- Hold the exact front-facing pose from 82%.
- Fade the camera between 84% and 93%, reveal the copy from 86% to 96%, and pop in the film card from 88% to 98%.
- Release the sticky section at 100%, continuing through the same original hero into the archive.

The rotations overlap during the descent. Separate spin and tilt quaternions preserve a complete revolution and exact final alignment. A spherical camera fit accommodates the pitch and yaw on landscape and portrait screens.

## Runtime and accessibility

lib/camera-scene.ts contains the shared Three.js renderer and GLB loader. The intro enables its scroll-driven mode. It renders on demand, stops off-screen and while the tab is hidden, and disposes GPU resources on unmount. The model fetch times out after 20 seconds. The older components/camera-hero.tsx remains as an unmounted turntable prototype.

The redundant Arthur Khitrik / Enter Site line is removed. Scroll to Explore advances to the revealed hero and transfers keyboard focus. Invisible hero content is inert during the camera sequence. Reduced-motion, no-JavaScript, model-load failure and WebGL failure all show the original hero directly, without an empty animation runway. Navigation anchors account for the sticky header.

lib/camera-materials.ts adds deterministic 256px color, normal and roughness maps for grained plastic, rubber, brushed metal and a woven strap. Maps repeat with mipmaps and bounded anisotropy. Microphone foam retains the GLB's baked textures, while text and colored control details keep their original materials. Coated lens glass and restrained environment lighting keep the camera dark. All textures are generated locally, shared by finish, and disposed with the scene; the GLB download is unchanged.

The GLB is copied from ../outputs/panasonic-hmc150/panasonic-hmc150.glb. It is approximately 6.8 MB with 114 meshes, 88,787 triangles and three embedded textures. The editable Blender source and renders remain in that output directory. It is an approximate visualization of a Panasonic AG-HMC150, without baked animation clips.

## Checkpoints and validation

- Original site checkpoint: 6a34a43717baf16b118982a2ae6196c74224116d, tag pre-threejs-redesign.
- Restored opening before scroll integration: 2ec6075d53446fd091d96c7fe3ba09cbb1a2b4d5.

Run node --experimental-strip-types --test tests/camera.test.mjs to verify asset integrity, coordinate mapping, complete rotation, final hold, reverse scroll mapping, framing, reveal timing, texture data and preservation of the existing baked maps. Build with npm run build.
