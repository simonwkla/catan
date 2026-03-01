import { Vector2 } from "./vector2";
import { type Viewport, viewport } from "./viewport";

export type Mask = Uint8Array;

/**
 * Expands a binary mask by 1 pixel using 8-neighborhood dilation.
 *
 * A pixel becomes 1 if it is already 1 OR if any of its 8 surrounding
 * neighbors are 1. This grows the shape outward, filling small gaps
 * and smoothing minor edge defects.
 */
function dilate8(vp: Viewport, src: Mask) {
  const dst = new Uint8Array(src.length);

  for (const v of Vector2.all(vp)) {
    const i = Vector2.index(v, vp);
    if (src[i]) {
      dst[i] = 1;
      continue;
    }

    let on = 0;
    for (const n of Vector2.n8(v)) {
      if (viewport.isOutside(vp, n)) {
        continue;
      }
      if (src[Vector2.index(n, vp)]) {
        on = 1;
        break;
      }
    }

    dst[i] = on;
  }
  return dst;
}

/**
 * Shrinks a binary mask by 1 pixel using 8-neighborhood erosion.
 *
 * A pixel remains 1 only if it and ALL of its 8 surrounding neighbors
 * are 1. This trims the shape inward, removing thin protrusions and
 * isolating solid interior regions.
 */
function erode8(vp: Viewport, src: Mask) {
  const dst = new Uint8Array(src.length);

  for (const v of Vector2.all(vp)) {
    const i = Vector2.index(v, vp);

    // Outside stays outside
    if (!src[i]) {
      dst[i] = 0;
      continue;
    }

    // Inside remains inside only if all neighbors are inside
    let keep = 1;
    for (const n of Vector2.n8(v)) {
      if (viewport.isOutside(vp, n)) {
        keep = 0; // treat OOB as outside
        break;
      }
      if (!src[Vector2.index(n, vp)]) {
        keep = 0;
        break;
      }
    }

    dst[i] = keep;
  }

  return dst;
}

/**
 * 8-neighborhood morphological closing (dilate then erode).
 *
 * First expands the mask to fill small holes and gaps, then shrinks it
 * back to approximately its original size. Useful for smoothing edges
 * and sealing 1px cracks without significantly changing overall shape.
 */
function close8(vp: Viewport, src: Mask): Mask {
  return erode8(vp, dilate8(vp, src));
}

/**
 * Given a binary mask where
 * - 1 = inside
 * - 0 = outside
 * Returns a mask where only the outline of the shape is 1.
 */
function outlineFromMask(vp: Viewport, src: Mask): Mask {
  // erode the mask -> exacly the outline will change and be set to 0
  const eroded = erode8(vp, src);
  const out = new Uint8Array(src.length);
  for (let i = 0; i < src.length; i++) {
    // if the pixel is 1 but 0 after erosion -> it was an outline pixel
    out[i] = src[i] && !eroded[i] ? 1 : 0;
  }
  return out;
}

/**
 * Given a binary mask where
 * - 1 = inside
 * - 0 = outside
 * Returns, for each INSIDE pixel, the Manhattan (L1) distance in grid steps
 * to the nearest outline pixel. Outside pixels remain -1.
 */
function dfInteriorGrid(vp: Viewport, inside: Mask): Int16Array {
  const outline = outlineFromMask(vp, inside);

  const dist = new Int16Array(inside.length);
  dist.fill(-1);

  const qx = new Int16Array(inside.length);
  const qy = new Int16Array(inside.length);

  let qh = 0;
  let qt = 0;

  for (const v of Vector2.all(vp)) {
    const i = Vector2.index(v, vp);
    if (!inside[i] || !outline[i]) {
      continue;
    }
    dist[i] = 0;
    qx[qt] = v.x;
    qy[qt] = v.y;
    qt++;
  }

  while (qh < qt) {
    const v = Vector2.create(qx[qh], qy[qh]);
    const i = Vector2.index(v, vp);
    qh++;

    for (const n of Vector2.n4(v)) {
      if (viewport.isOutside(vp, n)) {
        continue;
      }

      const ni = Vector2.index(n, vp);
      if (!inside[ni] || dist[ni] !== -1) {
        continue;
      }

      dist[ni] = dist[i] + 1;
      qx[qt] = n.x;
      qy[qt] = n.y;
      qt++;
    }
  }

  return dist;
}

class MinHeap {
  private xs: Int16Array;
  private ys: Int16Array;
  private ds: Float32Array;
  private size = 0;

  constructor(capacity: number) {
    this.xs = new Int16Array(capacity);
    this.ys = new Int16Array(capacity);
    this.ds = new Float32Array(capacity);
  }

  get length() {
    return this.size;
  }

  push(x: number, y: number, d: number) {
    let i = this.size++;
    this.xs[i] = x;
    this.ys[i] = y;
    this.ds[i] = d;

    // sift up
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.ds[p] <= d) {
        break;
      }
      this.xs[i] = this.xs[p];
      this.ys[i] = this.ys[p];
      this.ds[i] = this.ds[p];
      i = p;
    }
    this.xs[i] = x;
    this.ys[i] = y;
    this.ds[i] = d;
  }

  pop(): { x: number; y: number; d: number } | null {
    if (this.size === 0) {
      return null;
    }

    const x = this.xs[0];
    const y = this.ys[0];
    const d = this.ds[0];

    const lx = this.xs[--this.size];
    const ly = this.ys[this.size];
    const ld = this.ds[this.size];

    if (this.size > 0) {
      let i = 0;
      while (true) {
        const l = i * 2 + 1;
        const r = l + 1;
        if (l >= this.size) {
          break;
        }

        let c = l;
        if (r < this.size && this.ds[r] < this.ds[l]) {
          c = r;
        }

        if (this.ds[c] >= ld) {
          break;
        }

        this.xs[i] = this.xs[c];
        this.ys[i] = this.ys[c];
        this.ds[i] = this.ds[c];
        i = c;
      }
      this.xs[i] = lx;
      this.ys[i] = ly;
      this.ds[i] = ld;
    }

    return { x, y, d };
  }
}

/**
 * Computes an unsigned Euclidean distance field (DF) to the outline.
 *
 * Uses Dijkstra propagation over an 8-neighborhood with orthogonal cost = 1
 * and diagonal cost = sqrt(2), producing a near-Euclidean distance metric.
 *
 * Returns the geometric distance to the nearest outline pixel for ALL pixels
 * (inside and outside).
 */
function dfEuclidean(vp: Viewport, inside: Mask): Float32Array {
  const outline = outlineFromMask(vp, inside);

  const dist = new Float32Array(inside.length);
  dist.fill(Number.POSITIVE_INFINITY);

  const heap = new MinHeap(inside.length);

  // seed the heap with outline pixels
  for (const v of Vector2.all(vp)) {
    const i = Vector2.index(v, vp);
    if (!outline[i]) {
      continue;
    }
    dist[i] = 0;
    heap.push(v.x, v.y, 0);
  }

  const SQRT2 = Math.SQRT2;

  while (heap.length > 0) {
    const node = heap.pop();
    if (!node) {
      break;
    }

    const v = Vector2.create(node.x, node.y);
    const i = Vector2.index(v, vp);

    // stale heap entry
    if (node.d !== dist[i]) {
      continue;
    }

    for (const n of Vector2.n8(v)) {
      if (viewport.isOutside(vp, n)) {
        continue;
      }
      const ni = Vector2.index(n, vp);

      const d = Vector2.sub(n, v);
      const w = d.x === 0 || d.y === 0 ? 1 : SQRT2;

      const nd = node.d + w;
      if (nd < dist[ni]) {
        dist[ni] = nd;
        heap.push(n.x, n.y, nd);
      }
    }
  }

  return dist;
}

/**
 * Computes a signed Euclidean distance field (SDF) to the outline.
 *
 * Same metric as dfEuclidean(), but distances are positive inside the mask
 * and negative outside. The zero level set lies on the outline.
 *
 * Suitable for gradient-based normal estimation, smooth lighting, and
 * geometric effects.
 */
function sdfEuclidean(vp: Viewport, inside: Mask): Float32Array {
  const d = dfEuclidean(vp, inside);
  for (const v of Vector2.all(vp)) {
    const i = Vector2.index(v, vp);
    if (!Number.isFinite(d[i])) {
      continue;
    }
    d[i] = inside[i] ? d[i] : -d[i];
  }
  return d;
}

/**
 * Returns a mask where each pixel is 1 if and only if both a and b are 1.
 */
function intersection(a: Mask, b: Mask): Mask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] && b[i] ? 1 : 0;
  }
  return out;
}

/**
 * Returns a mask where each pixel is 1 if and only if a or b is 1.
 */
function union(a: Mask, b: Mask): Mask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] || b[i] ? 1 : 0;
  }
  return out;
}

/**
 * Returns a mask where each pixel is 1 if and only if a is 1 and b is 0.
 */
function diff(a: Mask, b: Mask): Mask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] && !b[i] ? 1 : 0;
  }
  return out;
}

export const mask = {
  dilate8,
  erode8,
  close8,
  outlineFromMask,
  dfInteriorGrid,
  dfEuclidean,
  sdfEuclidean,
  intersection,
  union,
  diff,
};
