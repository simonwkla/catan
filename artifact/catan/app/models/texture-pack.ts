import { Rand, type Seed } from "@/lib/std";
import type { ValidTileTypeValue } from "./catan";

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

export type TextureImageFit = "cover" | "contain";

export interface TextureImageAsset {
  readonly src: string;
}

export interface TextureImagePresentation {
  readonly fit?: TextureImageFit;
  readonly position?: string;
  readonly scale?: number;
  readonly rotationDeg?: number;
}

export interface TextureIcon {
  readonly image: TextureImageAsset;
  readonly presentation?: TextureImagePresentation;
  readonly backgroundColor?: string;
}

export interface TileTexture {
  readonly images: NonEmptyReadonlyArray<TextureImageAsset>;
  readonly presentation?: TextureImagePresentation;
}

export interface TileTypeTexture {
  readonly tile: TileTexture;
  readonly icon: TextureIcon;
}

export type TileTypeTextureMap = Readonly<Record<ValidTileTypeValue, TileTypeTexture>>;

export interface TokenTexture {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly foregroundColor: string;
  readonly emphasizedColor: string;
}

export interface TexturePackMetadata {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

export interface TexturePack extends TexturePackMetadata {
  readonly tileTypes: TileTypeTextureMap;
  readonly token: TokenTexture;
}

function resolveTileImage(
  texturePack: TexturePack,
  tileType: ValidTileTypeValue,
  seed: Seed,
  tileId: string | number,
): TextureImageAsset {
  const images = texturePack.tileTypes[tileType].tile.images;
  const rand = Rand.fromString(String(tileId), seed[0] ^ seed[1] ^ seed[2] ^ seed[3]);

  return images[rand.int(0, images.length - 1)];
}

export const Textures = {
  resolveTileImage,
} as const;
