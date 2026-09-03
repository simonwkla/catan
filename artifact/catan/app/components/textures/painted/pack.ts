import type { NonEmptyReadonlyArray, TextureImageAsset, TexturePack } from "@/models";

const waterTiles = textureImages(
  "/textures/painted/tiles/water/water-01.webp",
  "/textures/painted/tiles/water/water-02.webp",
  "/textures/painted/tiles/water/water-03.webp",
  "/textures/painted/tiles/water/water-04.webp",
);
const desertTiles = textureImages("/textures/painted/tiles/desert/desert-01.webp");
const sheepTiles = textureImages("/textures/painted/tiles/sheep/sheep-01.webp");
const forestTiles = textureImages("/textures/painted/tiles/forest/forest-01.webp");
const fieldTiles = textureImages("/textures/painted/tiles/field/field-01.webp");
const mountainTiles = textureImages("/textures/painted/tiles/mountain/mountain-01.webp");
const clayTiles = textureImages("/textures/painted/tiles/clay/clay-01.webp");
const goldTiles = textureImages(
  "/textures/painted/tiles/gold/gold-river-01.webp",
  "/textures/painted/tiles/gold/gold-river-02.webp",
);

export const PAINTED_TEXTURE_PACK = {
  id: "painted",
  name: "Painted",
  description: "Vibrant hand-painted terrain with illustrated water and gold rivers.",
  tileTypes: {
    water: paintedTileType(waterTiles, "#1c88b6"),
    desert: paintedTileType(desertTiles, "#cda54f"),
    sheep: paintedTileType(sheepTiles, "#8f9916"),
    forest: paintedTileType(forestTiles, "#5a7021"),
    field: paintedTileType(fieldTiles, "#be8816"),
    mountain: paintedTileType(mountainTiles, "#8e7958"),
    clay: paintedTileType(clayTiles, "#9e561e"),
    gold: paintedTileType(goldTiles, "#a18c40"),
  },
  token: {
    backgroundColor: "#f3e2b9",
    borderColor: "#795a31",
    foregroundColor: "#2b2117",
    emphasizedColor: "#b53a2d",
  },
} as const satisfies TexturePack;

function textureImages(firstPath: string, ...otherPaths: string[]): NonEmptyReadonlyArray<TextureImageAsset> {
  return [{ src: firstPath }, ...otherPaths.map((src) => ({ src }))];
}

function paintedTileType(images: NonEmptyReadonlyArray<TextureImageAsset>, backgroundColor: string) {
  return {
    tile: {
      images,
      presentation: { fit: "cover" },
    },
    icon: {
      image: images[0],
      backgroundColor,
      presentation: { fit: "cover", scale: 1.15 },
    },
  } as const;
}
