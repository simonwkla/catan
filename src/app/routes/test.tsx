import { useEffect, useState } from "react";
import { match, P } from "ts-pattern";
import { Switch } from "@/components/ui/switch";
import { color, num, obj, Rand, type RGB, type Seed } from "@/lib/std";
import { circle } from "@/lib/2d";
import { Vector2 } from "@/lib/vec";

const colors = {
  red: {
    900: "#513344",
    800: "#7E3C42",
    700: "#9B4937",
    600: "#B8552C",
    500: "#CF664E",
    400: "#E0755A",
    300: "#DA8353",
  },
  orange: {
    900: "#513344",
    800: "#7E3C42",
    700: "#9B4937",
    600: "#B8552C",
    500: "#DA8353",
    400: "#F3AF6C",
    300: "#F5C283",
    200: "#FBD993",
    100: "#F9E1A2",
    50: "#F8E9B4",
    25: "#FDF5DD",
  },
  green: {
    800: "#513344",
    700: "#514243",
    600: "#45584F",
    500: "#597960",
    400: "#979967",
    300: "#BBBD76",
    200: "#CDC675",
    100: "#E4DBA7",
    50: "#FDF5DF",
  },
  olive: {
    800: "#513344",
    700: "#514243",
    600: "#655940",
    500: "#726E57",
    400: "#988357",
    300: "#D3B370",
  },
  brown: {
    800: "#513344",
    700: "#514243",
    600: "#654D4B",
    500: "#8F7268",
    400: "#AB9586",
    300: "#C4B4A9",
    200: "#C8C3B2",
    100: "#E6E2CF",
    50: "#FDF5DF",
  },
  gray: {
    800: "#513344",
    700: "#393244",
    600: "#4F5363",
    500: "#6B748D",
    400: "#9E9AAA",
    300: "#BAB5BE",
    200: "#C1BCC6",
    100: "#E6E2D1",
    50: "#FDF5DD",
  },
};

export default function Test() {
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    color_palette();
    canvas({ debug });

    return () => {
      document.getElementById("content")?.replaceChildren();
      document.getElementById("color-palette")?.replaceChildren();
    };
  }, [debug]);

  return (
    <main className="relative flex h-screen w-screen" id="main">
      <Switch className="absolute top-0 right-0" checked={debug} onCheckedChange={setDebug} />

      <section className="absolute top-0 left-0" id="color-palette" />
      <section className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" id="content" />
    </main>
  );
}

const seed: Seed = [1, 2, 3, 4];

const rng = new Rand(seed);

type Circle = {
  x: number;
  y: number;
  r: number;
};

function buildCanopyMask({ W, H, rand, threshold }: { W: number; H: number; rand: Rand; threshold: number }) {
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;

  // metaballs
  const balls: Circle[] = [];
  // we want 3 balls at roughly the same position
  // 1. top center left ball
  // 2. top center right ball
  // 2. bottom left ball
  // 3. bottom right ball

  const r: (min: number, max: number) => number = (min, max) => Math.min(W, H) * rand.number(min, max);

  // generate 12 small balls in random positions around the center
  for (let i = 0; i < 20; i++) {
    balls.push({
      x: cx + rand.number(-0.4, 0.4) * W * 0.7,
      y: cy + rand.number(-0.4, 0.3) * H * 0.7,
      r: r(0.22, 0.25),
    });
  }

  const inside = new Uint8Array(W * H);
  const fieldVals = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const F = circle.field(x, y, balls);
      fieldVals[y * W + x] = F;
      inside[y * W + x] = F > threshold ? 1 : 0;
    }
  }

  return { inside, fieldVals, balls, cx, cy };
}

function computeOutlineAndDist(W: number, H: number, inside: Uint8Array, balls: Circle[]) {
  // a bitmask describing the outline of the shape
  const outline = new Uint8Array(W * H);
  // a distance map from the outline
  const dist = new Int16Array(W * H);
  dist.fill(-1);

  const dirs4 = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  const qx = new Int16Array(W * H);
  const qy = new Int16Array(W * H);
  let qh = 0;
  let qt = 0;

  // find the outline pixel and initialize the distance map
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      // a pixel that is not inside the shape is not on the outline
      if (!inside[i]) {
        continue;
      }

      let edge = false;

      for (const [dx, dy] of dirs4) {
        const nx = x + dx;
        const ny = y + dy;
        // a pixel is the outline if at least one of its 4 neighbours is outside
        // or off the canvas
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !inside[ny * W + nx]) {
          edge = true;
          break;
        }
      }

      // if the pixel is on the outline, we init the distance map with 0 and add it to the queue
      if (edge) {
        outline[i] = 1;
        dist[i] = 0;
        qx[qt] = x;
        qy[qt] = y;
        qt++;
      }
    }
  }

  // for every pixel compute how many grid steps it is away from the outline
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;
    const i = y * W + x;

    for (const [dx, dy] of dirs4) {
      const nx = x + dx;
      const ny = y + dy;
      // if the pixel is off the canvas, not inside the shape, or already visited, skip
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
        continue;
      }
      const ni = ny * W + nx;
      if (!inside[ni] || dist[ni] !== -1) {
        continue;
      }

      // otherwise the distance is the distance of the current pixel plus 1
      dist[ni] = dist[i] + 1;
      // we add it to the queue
      qx[qt] = nx;
      qy[qt] = ny;
      qt++;
    }
  }

  // find the maximum distance
  let maxDist = 1;
  for (let i = 0; i < dist.length; i++) {
    if (dist[i] > maxDist) {
      maxDist = dist[i];
    }
  }

  return { outline, dist, maxDist};
}

function drawDebug(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    W: number;
    H: number;
    balls: Circle[];
    outline: Uint8Array;
  },
) {
  const { x, y, W, H, balls, outline } = opts;

  ctx.save();
  ctx.translate(x + 0.5, y + 0.5);
  ctx.lineWidth = 1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (outline[i] !== 1) {
        continue;
      }

      ctx.fillStyle = "rgba(255, 0, 0, 1)";
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // metaballs
  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  for (const b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // dent
  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.stroke();
  ctx.restore();
}

function treeSprite({ W = 32, H = 32, debug = false }) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) {
    throw new Error("Context not found");
  }

  g.imageSmoothingEnabled = false;

  const { inside, balls, cx, cy } = buildCanopyMask({
    W: W,
    H: H,
    rand: rng,
    threshold: 0.2,
  });

  const { outline, dist, maxDist } = computeOutlineAndDist(W, H, inside, balls);

  const lightDir = { x: -1, y: -0.9 };

  const img = new ImageData(W, H);
  const data = img.data;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const o = i * 4;

      if (!inside[i]) {
        if(Math.abs(x-cx) < 3  && y > cy) {
          if(x - cx < -2 && y >= H-2) {
            continue;
          }

          if(x - cx > 2) {
            continue;
          }

          // the stem
          const calc_color = () => {
            if(y === H-1) {
              return color.hexToRgb(colors.orange[800]);
            }

            if(x - cx < -2 && y < H-2) {
              return color.hexToRgb(colors.orange[800]);
            }

            return color.hexToRgb(colors.orange[700]);
          }

          const col = calc_color();

          data[o + 0] = col[0];
          data[o + 1] = col[1];
          data[o + 2] = col[2];
          data[o + 3] = 255;
          continue;
        }

        data[o + 3] = 0;
        continue;
      }

      if(outline[i] && Math.abs(cx-x) < 2 && y > cy && rng.number(0, 1) > 0.5) {
        const col = color.hexToRgb(colors.orange[800]);
        data[o + 0] = col[0];
        data[o + 1] = col[1];
        data[o + 2] = col[2];
        data[o + 3] = 255;
        continue;
      }

      if (outline[i]) {
        const col = color.hexToRgb(colors.green[800]);
        data[o + 0] = col[0];
        data[o + 1] = col[1];
        data[o + 2] = col[2];
        data[o + 3] = 255;
        continue;
      }

      // depth shading (BFS distance from outline)

      const calc_color = () => {
        const hex = match(dist[i])
          .with(P.number.between(0, 1), () => colors.green[500])
          .with(P.number.between(2, 2), () => colors.green[400])
          .otherwise(() => colors.green[300]);
        return color.hexToRgb(hex);
      };

      const col = calc_color();

      data[o + 0] = col[0];
      data[o + 1] = col[1];
      data[o + 2] = col[2];
      data[o + 3] = 255;
    }
  }


  g.putImageData(img, 0, 0);
  g.save();

  if (debug) {
    drawDebug(g, {
      x: 0,
      y: 0,
      W: W,
      H: H,
      balls,
      outline,
    });
  }

  return c;
}

function canvas({ debug = false }: { debug?: boolean }) {
  const c = document.createElement("canvas");
  c.width = 32 * 4;
  c.height = 32 * 4;
  c.style.width = `${c.width * 5}px`;
  c.style.height = `${c.height * 5}px`;
  c.style.imageRendering = "pixelated";

  const parent = document.getElementById("content");
  if (!parent) {
    throw new Error("Parent element not found");
  }
  parent.appendChild(c);

  const ctx = c.getContext("2d");
  if (!ctx) {
    throw new Error("Context not found");
  }

  const tree = treeSprite({ W: 24, H: 24, debug });

  const scale = 1;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tree, 0, 0, 24 * scale, 24 * scale);
}

function color_palette() {
  const shades = ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

  const w = shades.length * 4;
  const h = Object.keys(colors).length * 4;

  // create canvas element
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w * 10}px`;
  canvas.style.height = `${h * 10}px`;
  canvas.style.imageRendering = "pixelated";

  // get parent
  const parent = document.getElementById("color-palette");
  if (!parent) {
    throw new Error("Parent element not found");
  }
  parent.appendChild(canvas);

  // get context
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Context not found");
  }
  // draw a red rectangle
  ctx.imageSmoothingEnabled = false;

  obj.getEntries(colors).forEach(([color, shade]) => {
    obj.getEntries(shade).forEach(([shade, hex]) => {
      ctx.fillStyle = hex;

      // get index of shade
      const shadeIndex = shades.indexOf(shade.toString());
      // get index of color in object
      const colorIndex = Object.keys(colors).indexOf(color);

      ctx.fillRect(shadeIndex * 4 + 1, colorIndex * 4, 2, 1);
      ctx.fillRect(shadeIndex * 4, colorIndex * 4 + 1, 4, 2);
      ctx.fillRect(shadeIndex * 4 + 1, colorIndex * 4 + 3, 2, 1);
    });
  });
}
