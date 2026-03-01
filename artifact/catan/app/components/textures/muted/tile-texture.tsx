import { useSeed } from "@/hook/use-seed";
import { VectorAx } from "@/lib/2d";
import type { ValidTileTypeValue } from "@/models";
import { texture } from "./textures";

export interface TileTextureProps {
  tileType: ValidTileTypeValue;
  tilePos: VectorAx;
}
export function TileTextureMuted({ tileType, tilePos }: TileTextureProps) {
  const seed = useSeed();
  const url = texture.getTileUrl(tileType, seed, VectorAx.key(tilePos));

  return <div className="absolute inset-0 rotate-30 bg-center bg-cover" style={{ backgroundImage: `url(${url})` }} />;
}
