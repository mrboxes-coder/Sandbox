export function deadzone(value, threshold = 0.18) {
  return Math.abs(value) <= threshold ? 0 : Math.sign(value) * (Math.abs(value) - threshold) / (1 - threshold);
}
export function displacement(x, y, climb, forward, speed, dt) {
  const length = Math.hypot(forward.x, forward.z);
  const fx = length > 0.01 ? forward.x / length : 0;
  const fz = length > 0.01 ? forward.z / length : -1;
  const norm = Math.max(1, Math.hypot(x, y, climb));
  const amount = speed * Math.min(dt, 0.05) / norm;
  return {x: (-fz * x - fx * y) * amount, y: climb * amount, z: (fx * x - fz * y) * amount};
}
export function snapDirection(axis, armed) {
  return {turn: armed && Math.abs(axis) > 0.65 ? -Math.sign(axis) * 30 : 0,
    armed: Math.abs(axis) < 0.25 ? true : Math.abs(axis) > 0.65 ? false : armed};
}
