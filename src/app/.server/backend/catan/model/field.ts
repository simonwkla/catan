import { VectorAx } from "@/lib/vec";
import { type EmptyTile, Tile, type ValidTile } from "./tile";
import type { TileType } from "./tile-type";
import type { Token } from "./token";

export class Field<T extends Tile = Tile> {
  readonly tiles: readonly T[];

  private constructor(tiles: readonly T[]) {
    this.tiles = tiles;
  }

  tileCountByType(type: TileType): number {
    return this.tiles.filter((t) => t.type.eq(type)).length;
  }

  tileCountByToken(token: Token): number {
    return this.tiles.filter((t) => t.token?.eq(token)).length;
  }

  /**
   * Replaces the given tile in the field with the replacement
   */
  replaceTile(tile: Tile, replacement: Tile): Field {
    const existingIndex = this.tiles.findIndex((t) => VectorAx.equals(t.pos, tile.pos));
    if (existingIndex === -1) {
      throw new Error("The tile to replace does not exist in field");
    }

    return new Field(this.tiles.map((t, i) => (i === existingIndex ? replacement : t)));
  }

  static fromTiles<T extends Tile = Tile>(tiles: readonly T[]): Field<T> {
    return new Field(tiles);
  }

  static empty(radius: number): EmptyField {
    const tiles: EmptyTile[] = [];
    const n = radius;
    for (let q = -n; q <= n; q++) {
      for (let r = Math.max(-n, -q - n); r <= Math.min(n, -q + n); r++) {
        tiles.push(Tile.empty(VectorAx.create(q, r)));
      }
    }

    return new Field(tiles);
  }

  // returns an array of pairs of neighbouring tiles indices
  getNeighbouringIndices(): [number, number][] {
    const indexByKey = this.tiles.reduce((acc, t, i) => {
      acc.set(VectorAx.key(t.pos), i);
      return acc;
    }, new Map<string, number>());

    return this.tiles.reduce(
      (acc, t, i) => {
        const ns = VectorAx.getNeighbours(t.pos);
        for (const n of ns) {
          const j = indexByKey.get(VectorAx.key(n));
          if (j !== undefined && j > i) {
            acc.push([i, j]);
          }
        }
        return acc;
      },
      [] as [number, number][],
    );
  }

  /** Returns unique triples of tile indices that meet at a vertex (intersection). */
  getIntersectionsIndices(): [number, number, number][] {
    const indexByKey = this.tiles.reduce((acc, t, i) => {
      acc.set(VectorAx.key(t.pos), i);
      return acc;
    }, new Map<string, number>());

    const out: [number, number, number][] = [];

    for (let i = 0; i < this.tiles.length; i++) {
      const p = this.tiles[i].pos;
      // For each corner, look at the two neighboring tiles that share that corner.
      for (const [a, b] of VectorAx.getCornerPairs(p)) {
        const j = indexByKey.get(VectorAx.key(a));
        const l = indexByKey.get(VectorAx.key(b));
        if (j === undefined || l === undefined) {
          continue;
        }

        // Ownership rule: emit only when i is the smallest index of the triple.
        if (i < j && i < l) {
          out.push(j < l ? [i, j, l] : [i, l, j]);
        }
      }
    }

    return out;
  }
}

/**
 * An Empty field only contains empty tiles
 */
export type EmptyField = Field<EmptyTile>;

/**
 * A ValidField is a field that only consists of valid tiles
 */
export type ValidField = Field<ValidTile>;
