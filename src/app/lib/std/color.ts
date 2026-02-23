import { num } from ".";

export type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const [r, g, b] = hex.match(/\w\w/g)?.map((c) => Number.parseInt(c, 16));
  return [r, g, b];
}
function rampPickDiscrete(ramp: RGB[], value: number): RGB {
  const n = ramp.length;
  const idx = Math.round(num.clamp01(value) * (n - 1));
  return ramp[idx];
}

export const color = {
  hexToRgb,
  rampPickDiscrete,
};
