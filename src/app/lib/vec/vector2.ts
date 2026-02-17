import { VectorAx } from "./vectorAx";

/**
 * Describes a vector in standard two-dimensional space
 */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

function create(x: number, y: number): Vector2 {
  return { x, y };
}

function scale(v: Vector2, n: number): Vector2 {
  return create(v.x * n, v.y * n);
}

function add(a: Vector2, b: Vector2): Vector2 {
  return create(a.x + b.x, a.y + b.y);
}

function key(v: Vector2): string {
  return `(${v.x}, ${v.y})}`;
}

function toVectorAx(v: Vector2): VectorAx {
  const q = (Math.sqrt(3) / 3) * v.x - (1 / 3) * v.y;
  const r = (2 / 3) * v.y;
  return VectorAx.round(VectorAx.create(q, r));
}

function equals(a: Vector2, b: Vector2): boolean {
  return a.x === b.x && a.y === b.y;
}

export const Vector2 = {
  create,
  scale,
  key,
  add,
  toVectorAx,
  equals,
  zero: create(0, 0),
};
