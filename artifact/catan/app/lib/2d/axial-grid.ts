import { graph } from "../std/graph";
import { VectorAx } from "./vector-ax";

/**
 * Returns a copy in canonical coordinate order: ascending q, then ascending r.
 */
function sort(coordinates: Iterable<VectorAx>): VectorAx[] {
  return Array.from(coordinates).sort((a, b) => a.q - b.q || a.r - b.r);
}

function keyed(coordinates: Iterable<VectorAx>): Map<string, VectorAx> {
  const result = new Map<string, VectorAx>();
  for (const coordinate of coordinates) {
    result.set(VectorAx.key(coordinate), coordinate);
  }
  return result;
}

/** Returns the unoccupied cells adjacent to `anchor` in canonical order. */
function openNeighbours(anchor: VectorAx, occupied: Iterable<VectorAx>): VectorAx[] {
  const occupiedKeys = new Set(Array.from(occupied, VectorAx.key));
  return sort(VectorAx.getNeighbours(anchor).filter((cell) => !occupiedKeys.has(VectorAx.key(cell))));
}

/**
 * Returns every unoccupied cell adjacent to at least one occupied cell.
 * Coordinates are unique and returned in canonical order.
 */
function frontier(occupied: Iterable<VectorAx>): VectorAx[] {
  const occupiedByKey = keyed(occupied);
  const result = new Map<string, VectorAx>();

  for (const anchor of occupiedByKey.values()) {
    for (const neighbour of VectorAx.getNeighbours(anchor)) {
      const key = VectorAx.key(neighbour);
      if (!occupiedByKey.has(key)) {
        result.set(key, neighbour);
      }
    }
  }

  return sort(result.values());
}

/** Returns the number of edge-connected groups of unique occupied cells. */
function componentCount(occupied: Iterable<VectorAx>): number {
  return graph.connectedComponents(occupied, VectorAx.getNeighbours, VectorAx.key).length;
}

/** Returns whether all unique occupied cells are edge-connected. */
function isConnected(occupied: Iterable<VectorAx>): boolean {
  return componentCount(occupied) <= 1;
}

/**
 * Returns whether the occupied cells stay connected after removing `cell`.
 * Removing the final cell leaves an empty grid, which is considered connected.
 */
function remainsConnectedWithout(occupied: Iterable<VectorAx>, cell: VectorAx): boolean {
  const remaining = keyed(occupied);
  remaining.delete(VectorAx.key(cell));
  return isConnected(remaining.values());
}

export const AxialGrid = {
  sort,
  openNeighbours,
  frontier,
  componentCount,
  isConnected,
  remainsConnectedWithout,
} as const;
