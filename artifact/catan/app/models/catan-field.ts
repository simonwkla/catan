import { VectorAx } from "@/lib/2d";
import {
  type Field as FieldValue,
  isResourceTileType,
  type Tile,
  type TileTypeValue,
  Token,
  type TokenValue,
  VALID_TILE_TYPES,
  type ValidTileTypeValue,
} from "./catan";

export type Field = FieldValue;

function getTile(field: FieldValue, pos: VectorAx): Tile | null {
  return field.tiles.find((tile) => VectorAx.equals(tile.pos, pos)) ?? null;
}

function updateTile(field: FieldValue, tile: Tile): FieldValue {
  const current = getTile(field, tile.pos);
  if (!current) {
    return field;
  }

  if (current.type === tile.type && current.token === tile.token) {
    return field;
  }

  return {
    ...field,
    tiles: field.tiles.map((candidate) => (VectorAx.equals(candidate.pos, tile.pos) ? tile : candidate)),
  };
}

function setTileType(field: FieldValue, pos: VectorAx, type: TileTypeValue): FieldValue {
  const tile = getTile(field, pos);
  if (!tile) {
    return field;
  }

  return updateTile(field, {
    ...tile,
    type,
    token: isResourceTileType(type) ? tile.token : null,
  });
}

function setTileToken(field: FieldValue, pos: VectorAx, token: TokenValue | null): FieldValue {
  const tile = getTile(field, pos);
  if (!tile || (token !== null && !isResourceTileType(tile.type))) {
    return field;
  }

  return updateTile(field, { ...tile, token });
}

function countByType(field: FieldValue, type: TileTypeValue): number {
  return field.tiles.filter((tile) => tile.type === type).length;
}

function countByToken(field: FieldValue, token: TokenValue): number {
  return field.tiles.filter((tile) => tile.token === token).length;
}

function getTypeCounts(field: FieldValue): Record<ValidTileTypeValue, number> {
  return Object.fromEntries(VALID_TILE_TYPES.map((type) => [type, countByType(field, type)])) as Record<
    ValidTileTypeValue,
    number
  >;
}

function getTokenCounts(field: FieldValue): Record<TokenValue, number> {
  return Object.fromEntries(Token.all.map((token) => [token.value, countByToken(field, token.value)])) as Record<
    TokenValue,
    number
  >;
}

export const Field = {
  getTile,
  setTileType,
  setTileToken,
  getTypeCounts,
  getTokenCounts,
} as const;
