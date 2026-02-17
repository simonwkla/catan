import { Vector2 } from "./vector2";

/**
 * Describes a Vector or point in dimensional axial space
 */
export interface VectorAx {
  readonly q: number;
  readonly r: number;
}

function create(q: number, r: number): VectorAx {
  return { q, r };
}

function add(a: VectorAx, b: VectorAx): VectorAx {
  return {
    q: a.q + b.q,
    r: a.r + b.r,
  };
}

function equals(a: VectorAx, b: VectorAx): boolean {
  return a.q === b.q && a.r === b.r;
}

function toVector2(v: VectorAx): Vector2 {
  const x = Math.sqrt(3) * v.q + (Math.sqrt(3) / 2) * v.r;
  const y = (3 / 2) * v.r;
  return Vector2.create(x, y);
}

function round(v: VectorAx): VectorAx {
  const qGrid = Math.round(v.q);
  const rGrid = Math.round(v.r);
  const q = v.q - qGrid;
  const r = v.r - rGrid;

  if (Math.abs(q) >= Math.abs(r)) {
    return create(qGrid + Math.round(q + 0.5 * r), rGrid);
  }

  return create(qGrid, rGrid + Math.round(r + 0.5 * q));
}

/** Canonical axial directions (pointy-top): E, NE, NW, W, SW, SE */
const DIRS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const;

const dir = (k: number) => DIRS[((k % 6) + 6) % 6];

/** Single neighbor in direction k (0..5; negative allowed, wraps) */
function neighbourAt(v: VectorAx, k: number): VectorAx {
  const d = dir(k);
  return create(v.q + d.q, v.r + d.r);
}

function getNeighbours(v: VectorAx): VectorAx[] {
  return DIRS.map((d) => create(v.q + d.q, v.r + d.r));
}

/** Six corner-adjacent neighbor pairs (k and k-1) for intersections */
function getCornerPairs(v: VectorAx): [VectorAx, VectorAx][] {
  const pairs: [VectorAx, VectorAx][] = [];
  for (let k = 0; k < 6; k++) {
    pairs.push([neighbourAt(v, k), neighbourAt(v, k - 1)]);
  }
  return pairs;
}

/** Stable string key for maps */
function key(v: VectorAx): string {
  return `${v.q}:${v.r}`;
}

export const VectorAx = {
  create,
  add,
  equals,
  toVector2,
  round,
  getNeighbours,
  neighbourAt,
  getCornerPairs,
  key,
} as const;
