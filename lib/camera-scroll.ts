const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const restHeight = 0.35;

export function cameraScrollProgress(sectionTop: number, sectionHeight: number, viewportHeight: number) {
  return clamp(-sectionTop / Math.max(sectionHeight - viewportHeight, 1));
}

/** Reveal from the angled, lens-forward pose in Arthur's reference, through the final turn. */
export function cameraHeroReveal(progress: number) {
  const t = clamp(progress);
  const copy = ease((t - 0.58) / 0.32);
  const art = ease((t - 0.61) / 0.32);
  return { copy, art, cue: 1 - ease((t - 0.56) / 0.12) };
}

/** Put the whole bounding sphere above even the farthest edge of the view frustum. */
export function cameraEntryHeight(width: number, height: number, depth: number, distance: number, fov = 32) {
  const radius = Math.hypot(width, height, depth) / 2;
  return (distance + radius) * Math.tan(fov * Math.PI / 360) + radius + 0.1;
}

/** User axes: X = toward viewer, Y = screen-horizontal, Z = up.
 * Three.js axes: X = screen-horizontal, Y = up, Z = toward viewer.
 * The GLB's lens points along Three.js +Z in its unrotated pose.
 */
export function cameraScrollPose(progress: number, entryHeight: number) {
  const t = clamp(progress);
  // Arthur's upward Z axis maps to Three.js Y. Hold slightly above center.
  return {
    y: restHeight + (entryHeight - restHeight) * (1 - ease(t / 0.4)),
    // A complete revolution in the user's XY plane, about their upward Z axis.
    yaw: Math.PI * 2 * ease(t / 0.72),
    // Start lens-up, then turn 90 degrees toward the viewer. Hold after 82%.
    pitch: -Math.PI / 2 * (1 - ease((t - 0.18) / 0.64)),
  };
}

/** Fit the full turn with enough headroom for the raised resting position. */
export function introCameraDistance(width: number, height: number, depth: number, aspect: number, fov = 32) {
  const verticalHalfAngle = fov * Math.PI / 360;
  const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * Math.max(aspect, 0.1));
  const radius = Math.hypot(width, height, depth) / 2;
  return Math.max(
    (radius + restHeight) / Math.sin(verticalHalfAngle),
    radius / Math.sin(horizontalHalfAngle),
  ) * 1.08;
}
