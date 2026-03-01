import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

const P: [number, number][] = [
  [50, 0],
  [100, 25],
  [100, 75],
  [50, 100],
  [0, 75],
  [0, 25],
];

/**
 * Edges, all parameterized in a consistent "world" direction so
 * neighbors share the exact same dash placement on shared edges.
 *
 *  - vertical:   top -> bottom
 *  - diagonals:  left -> right
 */
const EDGES: [[number, number], [number, number]][] = [
  [P[0], P[1]], // top-right diagonal (left->right)
  [P[1], P[2]], // right vertical     (top->bottom)
  [P[3], P[2]], // bottom-right diag  (left->right)
  [P[4], P[3]], // bottom-left  diag  (left->right)
  [P[5], P[4]], // left vertical      (top->bottom)
  [P[5], P[0]], // top-left diagonal  (left->right)
] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Build N dash segments along [a->b] with a dash at BOTH corners.
 * Gaps are proportional to dash length via `gapToDash`.
 *
 * N dashes + (N-1) gaps fill the whole edge: N*d + (N-1)*g = 1
 *  -> d = 1 / (N + gapToDash*(N-1))
 *  -> g = gapToDash * d
 */
function segmentsByCount(
  a: readonly [number, number],
  b: readonly [number, number],
  dashCount: number,
  gapFrac = 0.75,
) {
  const d = 1 / (dashCount + gapFrac * (dashCount - 1));
  const g = d * gapFrac;

  const lines: ReactElement[] = [];
  for (let n = 0; n < dashCount; n++) {
    const t1 = n * (d + g);
    const t2 = n === dashCount - 1 ? 1 : t1 + d;

    const x1 = lerp(a[0], b[0], t1);
    const y1 = lerp(a[1], b[1], t1);
    const x2 = lerp(a[0], b[0], t2);
    const y2 = lerp(a[1], b[1], t2);

    lines.push(<line key={`${a}-${b}-${n}`} x1={x1} y1={y1} x2={x2} y2={y2} />);
  }
  return lines;
}

interface BorderProps {
  variant: "solid" | "dashed";
  dashCount: number;
  gapFrac: number;
  className?: string;
}

export function Border({ variant, dashCount, gapFrac, className }: BorderProps) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {variant === "solid" && (
        <polygon
          points="50,0 100,25 100,75 50,100 0,75 0,25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {variant === "dashed" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          shapeRendering="geometricPrecision"
        >
          {EDGES.flatMap(([a, b]) => segmentsByCount(a, b, dashCount, gapFrac))}
        </g>
      )}
    </svg>
  );
}
