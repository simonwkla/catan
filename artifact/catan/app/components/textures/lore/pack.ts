import type { NonEmptyReadonlyArray, TextureImageAsset, TexturePack } from "@/models";

const waterTiles = textureImages("/textures/flat/ocean-small");
const desertTiles = textureImages("/textures/flat/desert-clearing");
const sheepTiles = textureImages("/textures/flat/hills-dense");
const forestTiles = textureImages("/textures/flat/jungle-forest-dense");
const fieldTiles = textureImages("/textures/flat/wheat-dense");
const mountainTiles = textureImages("/textures/flat/mountain-valley");
const clayTiles = textureImages("/textures/flat/swamp-dense");
const goldTiles = textureImages("/textures/flat/valley-lake");

export const LORE_TEXTURE_PACK = {
  id: "lore",
  name: "Isle of Lore",
  description: "Bold illustrated tiles from the Lore asset set.",
  tileTypes: {
    water: loreTileType(waterTiles, "#3ca2a5"),
    desert: loreTileType(desertTiles, "#e1bd62"),
    sheep: loreTileType(sheepTiles, "#98a75e"),
    forest: loreTileType(forestTiles, "#3b5745"),
    field: loreTileType(fieldTiles, "#d8a04d"),
    mountain: loreTileType(mountainTiles, "#5e8585"),
    clay: loreTileType(clayTiles, "#3b5745"),
    gold: loreTileType(goldTiles, "#efc858"),
  },
  token: {
    backgroundColor: "#f5f0e1",
    borderColor: "#8b7e6a",
    foregroundColor: "#2c2416",
    emphasizedColor: "#b83b3b",
  },
} as const satisfies TexturePack;

function textureImages(path: string): NonEmptyReadonlyArray<TextureImageAsset> {
  return [{ src: `${path}/0.png` }, { src: `${path}/1.png` }, { src: `${path}/2.png` }, { src: `${path}/3.png` }];
}

function loreTileType(images: NonEmptyReadonlyArray<TextureImageAsset>, backgroundColor: string) {
  return {
    tile: {
      images,
      presentation: { fit: "cover" },
    },
    icon: {
      image: images[0],
      backgroundColor,
      presentation: { fit: "cover", scale: 1.25 },
    },
  } as const;
}
