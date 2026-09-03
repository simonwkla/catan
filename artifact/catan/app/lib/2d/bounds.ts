import type { Vector2 } from "./vector2";
import type { Viewport } from "./viewport";

export type Bounds2 = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

function fromPoints(points: Iterable<Vector2>): Bounds2 | null {
  let bounds: Bounds2 | null = null;

  for (const point of points) {
    bounds = bounds
      ? {
          minX: Math.min(bounds.minX, point.x),
          minY: Math.min(bounds.minY, point.y),
          maxX: Math.max(bounds.maxX, point.x),
          maxY: Math.max(bounds.maxY, point.y),
        }
      : { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y };
  }

  return bounds;
}

function expand(bounds: Bounds2, horizontal: number, vertical = horizontal): Bounds2 {
  return {
    minX: bounds.minX - horizontal,
    minY: bounds.minY - vertical,
    maxX: bounds.maxX + horizontal,
    maxY: bounds.maxY + vertical,
  };
}

function width(bounds: Bounds2): number {
  return bounds.maxX - bounds.minX;
}

function height(bounds: Bounds2): number {
  return bounds.maxY - bounds.minY;
}

function center(bounds: Bounds2): Vector2 {
  return {
    x: bounds.minX + width(bounds) / 2,
    y: bounds.minY + height(bounds) / 2,
  };
}

function scaleToFit(bounds: Bounds2, viewport: Viewport, padding = 0, maximumScale = 1): number {
  const availableWidth = Math.max(0, viewport.W - padding * 2);
  const availableHeight = Math.max(0, viewport.H - padding * 2);
  const contentWidth = width(bounds);
  const contentHeight = height(bounds);

  if (contentWidth === 0 || contentHeight === 0 || availableWidth === 0 || availableHeight === 0) {
    return maximumScale;
  }

  return Math.min(maximumScale, availableWidth / contentWidth, availableHeight / contentHeight);
}

export const Bounds2 = {
  fromPoints,
  expand,
  width,
  height,
  center,
  scaleToFit,
} as const;
