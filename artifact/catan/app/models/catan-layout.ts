import { AxialGrid, VectorAx } from "@/lib/2d";
import type { Field, Tile } from "./catan";

function getPositions(field: Field): readonly VectorAx[] {
  return field.tiles.map((tile) => tile.pos);
}

function hasFieldSlot(field: Field, pos: VectorAx): boolean {
  return field.tiles.some((tile) => tile.pos.q === pos.q && tile.pos.r === pos.r);
}

function getOpenFieldSlotPositions(field: Field, anchor: VectorAx): readonly VectorAx[] {
  if (!hasFieldSlot(field, anchor)) {
    return [];
  }

  return AxialGrid.openNeighbours(anchor, getPositions(field));
}

function canAddFieldSlot(field: Field, pos: VectorAx): boolean {
  if (hasFieldSlot(field, pos)) {
    return false;
  }

  if (field.tiles.length === 0) {
    return true;
  }

  const occupiedKeys = new Set(getPositions(field).map(VectorAx.key));
  return VectorAx.getNeighbours(pos).some((neighbour) => occupiedKeys.has(VectorAx.key(neighbour)));
}

function addFieldSlot(field: Field, pos: VectorAx): Field {
  if (!canAddFieldSlot(field, pos)) {
    return field;
  }

  const tile: Tile = { pos, type: "empty", token: null };
  return {
    tiles: [...field.tiles, tile].sort((left, right) => left.pos.q - right.pos.q || left.pos.r - right.pos.r),
  };
}

function canRemoveFieldSlot(field: Field, pos: VectorAx, preserveConnectivity = true): boolean {
  if (field.tiles.length <= 1 || !hasFieldSlot(field, pos)) {
    return false;
  }

  return !preserveConnectivity || AxialGrid.remainsConnectedWithout(getPositions(field), pos);
}

function removeFieldSlot(field: Field, pos: VectorAx, preserveConnectivity = true): Field {
  if (!canRemoveFieldSlot(field, pos, preserveConnectivity)) {
    return field;
  }

  return {
    tiles: field.tiles.filter((tile) => tile.pos.q !== pos.q || tile.pos.r !== pos.r),
  };
}

export const Layout = {
  getOpenFieldSlotPositions,
  addFieldSlot,
  canRemoveFieldSlot,
  removeFieldSlot,
} as const;
