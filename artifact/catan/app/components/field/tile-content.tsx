import { TileTexture } from "@/components/textures";
import { TokenComponent } from "@/components/token";
import { isResourceTileType, type Tile } from "@/models/catan";

interface TileContentProps {
  tile: Tile;
}

export function TileContent({ tile }: TileContentProps) {
  if (tile.type === "empty") {
    return null;
  }

  const isValidType = tile.type !== "placeholder";

  return (
    <>
      {isValidType && <TileTexture tileType={tile.type} tilePos={tile.pos} />}

      {tile.token && isResourceTileType(tile.type) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <TokenComponent token={tile.token} size="board" />
        </div>
      )}
    </>
  );
}
