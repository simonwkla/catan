import { cn } from "@/lib/cn";
import type { Tile, TileTypeInfo } from "@/models/catan";
import { TileTextureFlat } from "../textures/flat";

interface TileContentProps {
  tile: Tile;
  tileInfo: TileTypeInfo | null;
  isRedToken: boolean;
  size: number;
  isEmpty: boolean;
  isPlaceholder: boolean;
}

export function TileContent({ tile, isRedToken, isEmpty }: TileContentProps) {
  if (isEmpty) {
    return null;
  }

  const isValidType = tile.type !== "empty" && tile.type !== "placeholder";
  const isResourceType = isValidType && tile.type !== "water" && tile.type !== "desert";

  return (
    <>
      {isValidType && <TileTextureFlat tileType={tile.type} tilePos={tile.pos} />}

      {tile.token && isResourceType && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-black bg-background">
            <div className="-mt-1.5 flex flex-col items-center">
              <span
                className={cn(
                  "font-bold font-serif",
                  tile.token.pips === 5 && "text-2xl",
                  tile.token.pips === 4 && "text-xl",
                  tile.token.pips === 3 && "text-lg",
                  tile.token.pips === 2 && "text-base",
                  tile.token.pips === 1 && "text-sm",
                )}
                style={{
                  color: isRedToken ? "#b83b3b" : "#2c2416",
                }}
              >
                {tile.token.int}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: tile.token.pips }).map((_, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: correct here
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
