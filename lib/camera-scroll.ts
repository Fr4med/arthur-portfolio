const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function cameraScrollProgress(sectionTop: number, sectionHeight: number, viewportHeight: number) {
  return clamp(-sectionTop / Math.max(sectionHeight - viewportHeight, 1));
}

/** User axes: X = toward viewer, Y = screen-horizontal, Z = up.
 * Three.js axes: X = screen-horizontal, Y = up, Z = toward viewer.
 * The GLB's lens points along Three.js +Z in its unrotated pose.
 */
export function cameraScrollPose(progress: number, entryHeight: number) {
  const t = clamp(progress);
  return {
    y: entryHeight * (1 - ease(t / 0.4)),
    // A complete revolution in the user's XY plane, about their upward Z axis.
    yaw: Math.PI * 2 * ease(t / 0.72),
    // Start lens-up, then turn 90 degrees toward the viewer. Hold after 82%.
    pitch: -Math.PI / 2 * (1 - ease((t - 0.18) / 0.64)),
  };
}

/** A sphere fit leaves room for the full pitch and yaw, at any screen shape. */
export function introCameraDistance(width: number, height: number, depth: number, aspect: number, fov = 32) {
  const verticalHalfAngle = fov * Math.PI / 360;
  const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * Math.max(aspect, 0.1));
  const radius = Math.hypot(width, height, depth) / 2;
  return radius / Math.sin(Math.min(verticalHalfAngle, horizontalHalfAngle)) * 1.08;
}
