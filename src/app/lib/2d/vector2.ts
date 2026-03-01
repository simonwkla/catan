import { VectorAx } from "./vector-ax";
import type { Viewport } from "./viewport";

const N8 = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

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

function key(v: Vector2): string {
  return `(${v.x}, ${v.y})}`;
}

// returns the index of the vector in the viewport
function index(v: Vector2, vp: Viewport): number {
  return v.y * vp.W + v.x;
}

function equals(a: Vector2, b: Vector2): boolean {
  return a.x === b.x && a.y === b.y;
}

function all(vp: Viewport): Vector2[] {
  const points: Vector2[] = [];
  for (let x = 0; x < vp.W; x++) {
    for (let y = 0; y < vp.H; y++) {
      points.push(create(x, y));
    }
  }
  return points;
}

function scale(v: Vector2, n: number): Vector2 {
  return create(v.x * n, v.y * n);
}

function add(a: Vector2, b: Vector2): Vector2 {
  return create(a.x + b.x, a.y + b.y);
}

function sub(a: Vector2, b: Vector2): Vector2 {
  return create(a.x - b.x, a.y - b.y);
}

function n8(v: Vector2): Vector2[] {
  return N8.map(([dx, dy]) => add(v, create(dx, dy)));
}

function n4(v: Vector2): Vector2[] {
  return N4.map(([dx, dy]) => add(v, create(dx, dy)));
}

/**
 * Normalizes a 2D vector to a unit length vector
 */
function normalize(v: Vector2): Vector2 {
  const len = Math.hypot(v.x, v.y);
  if (len < 1e-6) {
    return create(0, 0);
  }
  return create(v.x / len, v.y / len);
}

function toVectorAx(v: Vector2): VectorAx {
  const q = (Math.sqrt(3) / 3) * v.x - (1 / 3) * v.y;
  const r = (2 / 3) * v.y;
  return VectorAx.round(VectorAx.create(q, r));
}

export const Vector2 = {
  create,
  scale,
  key,
  add,
  sub,
  toVectorAx,
  all,
  equals,
  index,
  n8,
  n4,
  normalize,
  zero: create(0, 0),
};
