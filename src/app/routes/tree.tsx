// tree.tsx
import { match, P } from "ts-pattern";
import { type Circle, circle, type Mask, mask, Vector2, type Viewport, viewport } from "@/lib/2d";
import { color, num, Rand, type RGB, type Seed } from "@/lib/std";
import { colors } from "./colors";

type TreeSpriteOpts = {
  debug?: boolean;
  lighting?: boolean;
  seed?: Seed;
};

function gradCentral(W: number, H: number, f: Float32Array, x: number, y: number) {
  const xm = Math.max(0, x - 1);
  const xp = Math.min(W - 1, x + 1);
  const ym = Math.max(0, y - 1);
  const yp = Math.min(H - 1, y + 1);
  const dx = f[y * W + xp] - f[y * W + xm];
  const dy = f[yp * W + x] - f[ym * W + x];
  return { dx, dy };
}

/**
 * Canopy generation strategy:
 * - a few big “structural” balls (stable silhouette)
 * - a few small “bump” balls near the perimeter (organic but controlled)
 * - sample metaball field -> threshold -> morphological close to stabilize -> then union trunk -> outline
 */
function buildCanopyFieldAndMask(vp: Viewport, rand: Rand, threshold: number) {
  const { W, H } = vp;
  const cx = viewport.cx(vp);
  const cy = viewport.cy(vp);

  const balls: Circle[] = [];
  const minWH = Math.min(W, H);

  // Structural blobs (4–6)
  const bigCount = Math.floor(rand.number(4, 7));
  for (let i = 0; i < bigCount; i++) {
    const px = cx + rand.number(-0.18, 0.18) * W;
    const py = cy + rand.number(-0.22, 0.12) * H;
    const r = minWH * rand.number(0.23, 0.29);
    balls.push({ x: px, y: py, r });
  }

  // Perimeter bumps (6–10), biased outward
  const bumpCount = Math.floor(rand.number(6, 11));
  for (let i = 0; i < bumpCount; i++) {
    const ang = rand.number(0, Math.PI * 2);
    const rad = rand.number(0.26, 0.42);
    const px = cx + Math.cos(ang) * rad * W * 0.7;
    const py = cy + Math.sin(ang) * rad * H * 0.6 + rand.number(-0.05, 0.05) * H;
    const r = minWH * rand.number(0.1, 0.16);
    balls.push({ x: px, y: py, r });
  }

  const inside = new Uint8Array(W * H);
  const fieldVals = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const F = circle.field(x, y, balls);
      const i = y * W + x;
      fieldVals[i] = F;
      inside[i] = F > threshold ? 1 : 0;
    }
  }

  // Morphological close to remove holes/jaggies
  const insideClosed = mask.close8(vp, inside);

  return { inside: insideClosed, fieldVals, balls };
}

function drawDebug(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    vp: Viewport;
    balls: Circle[];
    outline: Uint8Array;
  },
) {
  const { x, y, vp, balls, outline } = opts;
  const { W, H } = vp;
  ctx.save();
  ctx.translate(x + 0.5, y + 0.5);
  ctx.lineWidth = 1;

  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      const i = yy * W + xx;
      if (outline[i] !== 1) {
        continue;
      }
      ctx.fillStyle = "rgba(255, 0, 0, 1)";
      ctx.fillRect(xx, yy, 1, 1);
    }
  }

  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  for (const b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // draw frame of the viewport
  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.rect(0, 0, vp.W, vp.H);
  ctx.stroke();

  ctx.restore();
}

function trunkMask(vp: Viewport): Mask {
  // the default trunk is a 2x{vp.H/2} rectangle at the center of the viewport
  const trunk = new Uint8Array(vp.W * vp.H);
  for (const v of Vector2.all(vp)) {
    const i = Vector2.index(v, vp);
    if (Math.abs(v.x - viewport.cx(vp)) <= 1 && v.y >= viewport.cy(vp)) {
      trunk[i] = 1;
    } else {
      trunk[i] = 0;
    }
  }

  return trunk;
}

export function treeSprite(vp: Viewport, opts: TreeSpriteOpts) {
  const rand = new Rand(opts.seed);

  const c = document.createElement("canvas");
  c.width = vp.W;
  c.height = vp.H;

  const g = c.getContext("2d");
  if (!g) {
    throw new Error("Context not found");
  }
  g.imageSmoothingEnabled = false;

  const threshold = 0.2;

  let { inside, balls } = buildCanopyFieldAndMask(vp, rand, threshold);

  let trunk = trunkMask(vp);
  trunk = mask.diff(trunk, inside);

  // final stabilize pass after union (small, but helps seam)
  inside = mask.union(trunk, inside);

  const outline = mask.outlineFromMask(vp, inside);
  const dist = mask.dfInteriorGrid(vp, inside);

  // SDF field for lighting gradient:
  // positive inside, negative outside
  const sdf = mask.sdfEuclidean(vp, inside);

  // lighting
  const L = Vector2.normalize({ x: -1, y: -0.9 });
  const cool = colors.gray[600];

  const img = new ImageData(vp.W, vp.H);
  const data = img.data;

  for (const v of Vector2.all(vp)) {
    const i = Vector2.index(v, vp);
    const o = i * 4;

    const baseCol = (): RGB => {
      if (trunk[i]) {
        return colors.orange[700];
      }

      if (Vector2.n8(v).some((n) => trunk[Vector2.index(n, vp)])) {
        // 75% chance to be trunk color
        if (rand.number(0, 1) < 0.75) {
          return rand.pick([colors.orange[800], colors.orange[700]]);
        }
      }

      // neighbours of neighbours
      const nns = Vector2.n8(v).flatMap((n) => Vector2.n8(n));
      if (nns.some((n) => trunk[Vector2.index(n, vp)])) {
        // 25% chance to be trunk color
        if (rand.number(0, 1) < 0.25) {
          return rand.pick([colors.orange[800], colors.orange[700]]);
        }
      }

      if (outline[i]) {
        return colors.green[600];
      }

      let col = match(dist[i])
        .with(P.number.between(0, 1), () => colors.green[500])
        .with(P.number.between(2, 3), () => colors.green[400])
        .otherwise(() => colors.green[300]);

      if (dist[i] >= 4) {
        col = color.mix(col, colors.green[200], 0.18);
      }

      return col;
    };

    const applyLightning = (base: RGB) => {
      // Compute normal from SDF gradient (outward normal ≈ -∇f)
      const { dx, dy } = gradCentral(vp.W, vp.H, sdf, v.x, v.y);
      const nn = Vector2.normalize({ x: -dx, y: -dy });

      const ndl = num.clamp01(nn.x * L.x + nn.y * L.y);

      // A) stylized highlight / shade modulation (keeps base palette dominant)
      const lightTint = colors.green[100];
      const shadeTint = colors.green[400];

      const lightAmt = num.clamp01((ndl - 0.45) / 0.55) * 0.35; // highlight only when facing light
      const shadeAmt = num.clamp01((0.55 - ndl) / 0.55) * 0.25; // mild darkening on shadow side

      let col = base;
      col = color.mix(col, lightTint, lightAmt);
      col = color.mix(col, shadeTint, shadeAmt);

      // B) cool shadow tint, stronger near silhouette
      const edge = num.clamp01(1 - dist[i] / 4); // 1 at edge -> 0 inward
      const shadowAmt = (1 - ndl) * 0.55 * (0.35 + 0.65 * edge);
      col = color.mix(col, cool, shadowAmt);

      return col;
    };

    if (!inside[i]) {
      data[o + 3] = 0;
      continue;
    }

    let col = baseCol();
    if (opts.lighting) {
      col = applyLightning(col);
    }

    data[o + 0] = col[0];
    data[o + 1] = col[1];
    data[o + 2] = col[2];
    data[o + 3] = 255;
  }

  g.putImageData(img, 0, 0);

  if (opts.debug) {
    drawDebug(g, { x: 0, y: 0, vp, balls, outline });
  }

  return c;
}
