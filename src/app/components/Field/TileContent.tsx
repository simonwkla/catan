import type { Tile, TileTypeInfo } from "@/models/catan";

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
      {isResourceType && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          style={{
            fontSize: `${size * 0.4}px`,
          }}
        >
          {tileInfo?.icon}
        </div>
      )}

      {tile.type === "desert" && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          {tileInfo?.icon}
        </div>
      )}

      {tile.type === "water" && (
        <svg
          className="absolute inset-0 h-full w-full"
          style={{ clipPath: "polygon(-50% 50%,50% 100%,150% 50%,50% 0)" }}
        >
          <path
            d={`M${size * 0.15},${size * 0.45} Q${size * 0.33},${size * 0.3} ${size * 0.5},${size * 0.45} Q${size * 0.67},${size * 0.6} ${size * 0.85},${size * 0.45}`}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d={`M${size * 0.2},${size * 0.62} Q${size * 0.38},${size * 0.48} ${size * 0.55},${size * 0.62} Q${size * 0.7},${size * 0.75} ${size * 0.8},${size * 0.62}`}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      )}

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

      {isPlaceholder && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground"
          style={{ fontSize: `${size * 0.2}px` }}
        >
          Empty
        </div>
      )}
    </>
  );
}
