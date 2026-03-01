import { useSeed } from "@/hook/use-seed";
import { VectorAx } from "@/lib/2d";
import type { ValidTileTypeValue } from "@/models";
import { texture } from "./textures";

export interface TileTextureProps {
  tileType: ValidTileTypeValue;
  tilePos: VectorAx;
}

export function TileTextureFlat({ tileType, tilePos }: TileTextureProps) {
  const seed = useSeed();
  const tileId = VectorAx.key(tilePos);
  const url = texture.getTileUrl(tileType, seed, tileId);

  return <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${url})` }} />;
}
