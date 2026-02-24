import type { Vector2 } from "./vector2";

export type Viewport = {
  readonly W: number;
  readonly H: number;
};

function isInside(vp: Viewport, v: Vector2): boolean {
  return v.x >= 0 && v.x < vp.W && v.y >= 0 && v.y < vp.H;
}

function isOutside(vp: Viewport, v: Vector2): boolean {
  return v.x < 0 || v.x >= vp.W || v.y < 0 || v.y >= vp.H;
}

function cx(vp: Viewport): number {
  return (vp.W - 1) / 2;
}
function cy(vp: Viewport): number {
  return (vp.H - 1) / 2;
}

export const viewport = {
  isInside,
  isOutside,
  cx,
  cy,
};
