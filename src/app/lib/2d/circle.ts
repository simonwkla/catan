import type { Vector2 } from "../vec";
import type { Viewport } from "./canvas";

export type Circle = {
  x: number;
  y: number;
  r: number;
};


/**
 * The field is a continuous scalar F(x,y) computed for every pixel. It measures
 * "how inside the blob" of circles we created a pixel is.
 * For each ball we add a contribution that's strongest near the center and fades outward.
 * Let $D_i^2(x,y)$ be
  $$
  D_i^2(x,y) = (x-x_{b_i})^2 + (y-y_{b_i})^2
  $$
 * Then the field is given by:
  $$
  F(x,y) = \sum_{i=1}^n \max\left(0, 1 - \frac{D_i^2(x,y)}{r_i^2}\right)
  $$
 */
const field = (x: number, y: number, circle: Circle | Circle[]) => {
    const circles = Array.isArray(circle) ? circle : [circle];

    let F = 0;
    for (const b of circles) {
        const dx = x - b.x;
        const dy = y - b.y;
        const D2 = dx * dx + dy * dy + 1e-6;
        F += Math.max(0, 1 - D2 / (b.r * b.r));
    }
    return F;
};

/**
 * Returns exact pixel coordinates on the circle outline using the midpoint
 * (Bresenham) circle algorithm. Center and radius can be fractional; output
 * coordinates are rounded to integers.
 */
const outlinePixels = (
    circle: Circle,
    vp: Viewport,
): Vector2[] => {
    const { x: cx, y: cy, r } = circle;
    const points: Vector2[] = [];

    const add = (px: number, py: number) => {
        const gx = Math.round(cx + px);
        const gy = Math.round(cy + py);
        if (gx >= 0 && gx < vp.W && gy >= 0 && gy < vp.H) {
            points.push({x: gx, y: gy});
        }
    };

    let x = 0;
    let y = Math.round(r);

    let d = 3 - 2 * r;

    while (x <= y) {
        add(x, y);
        add(-x, y);
        add(x, -y);
        add(-x, -y);
        add(y, x);
        add(-y, x);
        add(y, -x);
        add(-y, -x);

        if (d < 0) {
            d += 4 * x + 6;
        } else {
            d += 4 * (x - y) + 10;
            y--;
        }
        x++;
    }

    return points;
};

export const circle = {
    field,
    outlinePixels,
};