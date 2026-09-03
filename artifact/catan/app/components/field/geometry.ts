import { Bounds2, Vector2, VectorAx } from "@/lib/2d";

export const POINTY_HEX_ASPECT_RATIO = "cos(30deg)";
export const POINTY_HEX_CLIP_PATH = "polygon(-50% 50%,50% 100%,150% 50%,50% 0)";
export const FIELD_TILE_HEIGHT = 175;
export const FIELD_TILE_WIDTH = FIELD_TILE_HEIGHT * Math.cos(Math.PI / 6);

function getTilePosition(position: VectorAx): Vector2 {
  return Vector2.scale(VectorAx.toVector2(position), FIELD_TILE_HEIGHT / 2);
}

function getBounds(positions: Iterable<VectorAx>): Bounds2 | null {
  const centerBounds = Bounds2.fromPoints(Array.from(positions, getTilePosition));
  return centerBounds ? Bounds2.expand(centerBounds, FIELD_TILE_WIDTH / 2, FIELD_TILE_HEIGHT / 2) : null;
}

function getScene(positions: Iterable<VectorAx>) {
  const bounds = getBounds(positions);
  return bounds ? { bounds, center: Bounds2.center(bounds) } : null;
}

export const FieldGeometry = {
  getTilePosition,
  getBounds,
  getScene,
} as const;
