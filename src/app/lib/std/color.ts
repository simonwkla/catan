import { num } from ".";

export type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const match = hex.match(/\w\w/g);
  if (!match) {
    throw new Error("Invalid hex color");
  }

  const [r, g, b] = match.map((c) => Number.parseInt(c, 16));
  return [r, g, b];
}
function rampPickDiscrete(ramp: RGB[], value: number): RGB {
  const n = ramp.length;
  const idx = Math.round(num.clamp01(value) * (n - 1));
  return ramp[idx];
}

/**
 * Blends two colors by mixing their RGB components using linear interpolation.
 * The blend amount t is clamped to [0,1]; t=0 returns `a`, t=1 returns `b`.
 */
function mix(a: RGB, b: RGB, t: number): RGB {
  const tt = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * tt),
    Math.round(a[1] + (b[1] - a[1]) * tt),
    Math.round(a[2] + (b[2] - a[2]) * tt),
  ];
}

export const color = {
  hexToRgb,
  rampPickDiscrete,
  mix,
};
