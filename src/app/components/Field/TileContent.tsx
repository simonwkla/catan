import type { Tile, TileTypeInfo } from "@/models/catan";
import { TileTextureMuted } from "../textures/muted/TileTexture";

interface TileContentProps {
  tile: Tile;
  tileInfo: TileTypeInfo | null;
  isRedToken: boolean;
  size: number;
  isEmpty: boolean;
  isPlaceholder: boolean;
}

export function TileContent({ tile, tileInfo, isRedToken, size, isEmpty, isPlaceholder }: TileContentProps) {
  if (isEmpty) {
    return null;
  }

  const isValidType = tile.type !== "empty" && tile.type !== "placeholder";
  const isResourceType = isValidType && tile.type !== "water" && tile.type !== "desert";

  return (
    <>
      {isValidType && <TileTextureMuted tileType={tile.type} tilePos={tile.pos} />}

      {tile.token && isResourceType && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-2"
            style={{
              backgroundColor: "#f5f0e1",
              borderColor: "#8b7e6a",
            }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="font-bold font-serif text-lg"
                style={{
                  color: isRedToken ? "#b83b3b" : "#2c2416",
                }}
              >
                {tile.token.int}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: tile.token.pips }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-1 rounded-full"
                    style={{
                      backgroundColor: isRedToken ? "#b83b3b" : "#2c2416",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
