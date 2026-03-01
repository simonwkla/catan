function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Smoothstep maps a value x between edge0 and edge1 to a smooth 0..1 range
 * @param a
 * @param b
 * @param x
 */
function smoothstep(a: number, b: number, x: number): number {
  if (a === b) {
    return 0;
  }
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export const num = {
  clamp01,
  smoothstep,
};
