import { useSeed } from "@/hook/use-seed";
import { VectorAx } from "@/lib/2d";
import { Textures, type ValidTileTypeValue } from "@/models";
import { useTexturePack } from "./context";
import { TextureStyle } from "./presentation";

interface TileTextureProps {
  tileType: ValidTileTypeValue;
  tilePos: VectorAx;
}

export function TileTexture({ tileType, tilePos }: TileTextureProps) {
  const seed = useSeed();
  const texturePack = useTexturePack();
  const tileTexture = texturePack.tileTypes[tileType].tile;
  const image = Textures.resolveTileImage(texturePack, tileType, seed, VectorAx.key(tilePos));

  return (
    <div
      className="absolute inset-0 bg-center bg-cover"
      style={{
        backgroundImage: `url(${image.src})`,
        ...TextureStyle.background(tileTexture.presentation),
      }}
    />
  );
}
