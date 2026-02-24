import { Rand, type Seed } from "@/lib/std";
import type { ValidTileTypeValue } from "@/models/catan";

type TextureVariant = readonly string[];

const TEXTURE_MAP: Record<ValidTileTypeValue, TextureVariant> = {
  water: [
    "/textures/muted/tiles/ocean/ocean-still-1.webp",
    "/textures/muted/tiles/ocean/ocean-still-2.webp",
    "/textures/muted/tiles/ocean/ocean-still-3.webp",
    "/textures/muted/tiles/ocean/ocean-still-4.webp",
    "/textures/muted/tiles/ocean/ocean-still-5.webp",
    "/textures/muted/tiles/ocean/ocean-soft-waves-1.webp",
    "/textures/muted/tiles/ocean/ocean-soft-waves-2.webp",
    "/textures/muted/tiles/ocean/ocean-waves-1.webp",
    "/textures/muted/tiles/ocean/ocean-waves-2.webp",
  ],
  desert: [
    "/textures/muted/tiles/desert/desert-plains-1.webp",
    "/textures/muted/tiles/desert/desert-plains-2.webp",
  ],
  sheep: [
    "/textures/muted/tiles/pasture/pasture-plains-1.webp",
    "/textures/muted/tiles/pasture/pasture-plains-2.webp",
    "/textures/muted/tiles/pasture/pasture-plains-3.webp",
    "/textures/muted/tiles/pasture/pasture-plains-4.webp",
    "/textures/muted/tiles/pasture/pasture-plains-5.webp",
  ],
  forest: [
    "/textures/muted/tiles/forest/forest-conifer-1.webp",
    "/textures/muted/tiles/forest/forest-conifer-2.webp",
    "/textures/muted/tiles/forest/forest-deciduous-1.webp",
    "/textures/muted/tiles/forest/forest-mixed-1.webp",
  ],
  field: [
    "/textures/muted/tiles/farmland/farmland-1.webp",
    "/textures/muted/tiles/farmland/farmland-2.webp",
    "/textures/muted/tiles/farmland/farmland-3.webp",
  ],
  mountain: [
    "/textures/muted/tiles/mountain/mountain-medium-1.webp",
    "/textures/muted/tiles/mountain/mountain-peak-1.webp",
  ],
  clay: [
    "/textures/muted/tiles/clay/clay-hills-1.webp",
    "/textures/muted/tiles/clay/clay-hills-2.webp",
    "/textures/muted/tiles/clay/clay-hills-3.webp",
    "/textures/muted/tiles/clay/clay-hills-4.webp",
  ],
  gold: [
    //TODO: Add gold textures
    "/textures/muted/tiles/mountain/mountain-peak-1.webp",
  ],
} as const;

export function getTileUrl(tileType: ValidTileTypeValue, seed: Seed, tileId?: string | number): string {
  let rand: Rand;
  
  if (tileId !== undefined) {
    const idStr = typeof tileId === 'string' ? tileId : tileId.toString();
    const salt = seed[0] ^ seed[1] ^ seed[2] ^ seed[3];
    rand = Rand.fromString(idStr, salt);
  } else {
    rand = new Rand(seed);
  }
  
  const variants = TEXTURE_MAP[tileType];
  const index = rand.int(0, variants.length - 1);
  return variants[index];
}


export const texture = {
    getTileUrl: getTileUrl,
}