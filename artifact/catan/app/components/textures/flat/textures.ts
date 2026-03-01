import { Rand, type Seed } from "@/lib/std";
import type { ValidTileTypeValue } from "@/models/catan";

type BiomeName =
  | "desert-clearing"
  | "hills-dense"
  | "jungle-forest-dense"
  | "ocean-small"
  | "wheat-dense"
  | "mountain-clouds"
  | "mountain-valley"
  | "valley-lake"
  | "swamp-dense";

const TILE_TO_BIOME: Record<ValidTileTypeValue, BiomeName> = {
  desert: "desert-clearing",
  sheep: "hills-dense",
  forest: "jungle-forest-dense",
  water: "ocean-small",
  field: "wheat-dense",
  mountain: "mountain-valley",
  gold: "valley-lake",
  clay: "swamp-dense",
} as const;

const BIOME_VARIANT_COUNTS: Record<BiomeName, number> = {
  "desert-clearing": 4,
  "hills-dense": 4,
  "jungle-forest-dense": 4,
  "ocean-small": 4,
  "wheat-dense": 4,
  "mountain-clouds": 4,
  "mountain-valley": 4,
  "valley-lake": 4,
  "swamp-dense": 4,
} as const;

export function getTileUrl(tileType: ValidTileTypeValue, seed: Seed, tileId?: string | number): string {
  const biome = TILE_TO_BIOME[tileType];
  const variantCount = BIOME_VARIANT_COUNTS[biome];

  let rand: Rand;

  if (tileId !== undefined) {
    const idStr = typeof tileId === "string" ? tileId : tileId.toString();
    const salt = seed[0] ^ seed[1] ^ seed[2] ^ seed[3];
    rand = Rand.fromString(idStr, salt);
  } else {
    rand = new Rand(seed);
  }

  const variantIndex = rand.int(0, variantCount - 1);
  return `/textures/flat/${biome}/${variantIndex}.png`;
}

export const texture = {
  getTileUrl,
};
