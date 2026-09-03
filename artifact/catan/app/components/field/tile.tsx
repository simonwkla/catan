import { Border } from "@/components/field/border";
import { cn } from "@/lib/cn";
import type { Tile } from "@/models/catan";
import { FIELD_TILE_HEIGHT, FieldGeometry, POINTY_HEX_ASPECT_RATIO, POINTY_HEX_CLIP_PATH } from "./geometry";
import { TileContent } from "./tile-content";

export type TileIntent = "default" | "delete";

interface TileProps {
  tile: Tile;
  intent?: TileIntent;
  disabled?: boolean;
  title?: string | undefined;
  onClick?: () => void;
  onPointerEnter?: () => void;
}

export function TileComponent({
  tile,
  intent = "default",
  disabled = false,
  title,
  onClick,
  onPointerEnter,
}: TileProps) {
  const pixelPos = FieldGeometry.getTilePosition(tile.pos);
  const isEmpty = tile.type === "empty";
  const borderVariant = isEmpty ? "dashed" : "solid";

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 hover:z-30"
      style={{
        left: `${pixelPos.x}px`,
        top: `${pixelPos.y}px`,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        disabled={disabled}
        title={title}
        className={cn(
          "group relative w-fit cursor-pointer transition-transform duration-75 hover:scale-[105%]",
          isEmpty ? "bg-muted" : "bg-background",
          intent === "delete" && !disabled && "hover:bg-destructive/15",
          disabled && "cursor-not-allowed opacity-60 hover:scale-100",
        )}
        style={{
          height: `${FIELD_TILE_HEIGHT}px`,
          aspectRatio: POINTY_HEX_ASPECT_RATIO,
          clipPath: POINTY_HEX_CLIP_PATH,
        }}
      >
        {/* Content */}
        <TileContent tile={tile} />

        {/* Border */}
        <Border
          variant={borderVariant}
          className={cn(
            "stroke-[2px] transition-all duration-150",
            borderVariant === "solid" && "text-foreground/30",
            borderVariant === "dashed" && "stroke-[2px] *:stroke-border group-hover:stroke-[4px]",
            intent === "delete" && !disabled && "group-hover:stroke-[4px] group-hover:text-destructive",
          )}
        />

        {/* Hover highlight */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity hover:opacity-10",
            intent === "delete" ? "bg-destructive" : "bg-white",
          )}
          style={{ clipPath: POINTY_HEX_CLIP_PATH }}
        />
      </button>
    </div>
  );
}
