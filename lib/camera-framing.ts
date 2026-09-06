/** Fits every yaw angle of the model, including a little room for its float. */
export function cameraDistance(width: number, height: number, depth: number, aspect: number, fov = 32) {
  const radius = Math.hypot(width, depth) / 2;
  const verticalTangent = Math.tan(fov * Math.PI / 360);
  const horizontalTangent = verticalTangent * Math.max(aspect, 0.1);
  return Math.max((height / 2 + 0.18) / verticalTangent, radius / horizontalTangent) * 1.12 + radius;
}
