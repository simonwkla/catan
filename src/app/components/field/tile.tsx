import { useMemo } from "react";
import { Border } from "@/components/field/border";
import { Vector2, VectorAx } from "@/lib/2d";
import { cn } from "@/lib/cn";
import type { Tile, ValidTileTypeValue } from "@/models/catan";
import { TILE_TYPE_INFO } from "@/models/catan";
import { TileContent } from "./tile-content";

export interface TileProps {
  tile: Tile;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

const TILE_SIZE = 175;
const SPACING = 0;

export function TileComponent({ tile, className, onClick }: TileProps) {
  const pixelPos = useMemo(() => {
    const v2 = VectorAx.toVector2(tile.pos);
    return Vector2.scale(v2, TILE_SIZE / 2 + SPACING);
  }, [tile.pos]);

  const isEmpty = tile.type === "empty";
  const isPlaceholder = tile.type === "placeholder";
  const isValidType = tile.type !== "empty" && tile.type !== "placeholder";
  const tileInfo = isValidType ? TILE_TYPE_INFO[tile.type as ValidTileTypeValue] : null;

  const isRedToken = tile.token !== null && (tile.token.int === 6 || tile.token.int === 8);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
  };

  const borderVariant = isEmpty ? "dashed" : "solid";

  return (
    <div
      className={cn("absolute hover:z-20", className)}
      style={{
        left: `${pixelPos.x}px`,
        top: `${pixelPos.y}px`,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group relative w-fit cursor-pointer transition-transform duration-75 hover:scale-[105%]",
          isEmpty ? "bg-muted" : "bg-background",
        )}
        style={{
          height: `${TILE_SIZE}px`,
          aspectRatio: "cos(30deg)",
          clipPath: "polygon(-50% 50%,50% 100%,150% 50%,50% 0)",
        }}
      >
        {/* Content */}
        <TileContent
          tile={tile}
          tileInfo={tileInfo}
          isRedToken={isRedToken}
          size={TILE_SIZE}
          isEmpty={isEmpty}
          isPlaceholder={isPlaceholder}
        />

        {/* Border */}
        <Border
          variant={borderVariant}
          dashCount={3}
          gapFrac={1}
          className={cn(
            "stroke-[2px] transition-all duration-150",
            borderVariant === "solid" && "text-foreground/30",
            borderVariant === "dashed" && "stroke-[2px] *:stroke-border group-hover:stroke-[4px]",
          )}
        />

        {/* Hover highlight */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity hover:opacity-10"
          style={{
            clipPath: "polygon(-50% 50%,50% 100%,150% 50%,50% 0)",
            backgroundColor: "white",
          }}
        />
      </button>
    </div>
  );
}
