import type { NonEmptyReadonlyArray, TextureImageAsset, TexturePack } from "@/models";

const waterTiles = textureImages("water/water-01.webp");
const desertTiles = textureImages("desert/desert-01.webp");
const sheepTiles = textureImages(
  "sheep/pasture-01.webp",
  "sheep/pasture-02.webp",
  "sheep/pasture-03.webp",
  "sheep/pasture-04.webp",
);
const forestTiles = textureImages(
  "forest/forest-01.webp",
  "forest/forest-02.webp",
  "forest/forest-03.webp",
  "forest/forest-04.webp",
);
const fieldTiles = textureImages(
  "field/fields-01.webp",
  "field/fields-02.webp",
  "field/fields-03.webp",
  "field/fields-04.webp",
);
const mountainTiles = textureImages(
  "mountain/mountain-01.webp",
  "mountain/mountain-02.webp",
  "mountain/mountain-03.webp",
);
const clayTiles = textureImages("clay/hills-01.webp", "clay/hills-02.webp", "clay/hills-03.webp");
const goldTiles = textureImages("gold/gold-field-01.webp", "gold/gold-field-02.webp");

export const CATAN_TEXTURE_PACK = {
  id: "catan",
  name: "Catan",
  description: "Faithful digital remasters of the fifth-edition Catan terrain artwork.",
  tileTypes: {
    water: catanTileType(waterTiles, "#327d97"),
    desert: catanTileType(desertTiles, "#c7a56a"),
    sheep: catanTileType(sheepTiles, "#71944c"),
    forest: catanTileType(forestTiles, "#345b3d"),
    field: catanTileType(fieldTiles, "#c99b3d"),
    mountain: catanTileType(mountainTiles, "#77786f"),
    clay: catanTileType(clayTiles, "#a95f3d"),
    gold: catanTileType(goldTiles, "#b58e3d"),
  },
  token: {
    backgroundColor: "#f3e2b9",
    borderColor: "#795a31",
    foregroundColor: "#2b2117",
    emphasizedColor: "#b53a2d",
  },
} as const satisfies TexturePack;

function textureImages(firstPath: string, ...otherPaths: string[]): NonEmptyReadonlyArray<TextureImageAsset> {
  const image = (path: string): TextureImageAsset => ({
    src: `/textures/catan-fifth-edition/tiles/${path}?v=point-up-2`,
  });

  return [image(firstPath), ...otherPaths.map(image)];
}

function catanTileType(images: NonEmptyReadonlyArray<TextureImageAsset>, backgroundColor: string) {
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
