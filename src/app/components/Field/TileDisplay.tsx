import type { ComponentProps, PropsWithChildren } from "react";
import { Border } from "@/components/Field/border";
import { cn } from "@/lib/cn";
import { TILE_TYPE_IMAGES, type TileTypeValue, type Token } from "@/models/catan";

export interface TileDisplayProps {
  tile: { type: TileTypeValue; token: Token | null };
  label?: string;
  className?: string;
}

const TILE_SIZE = 150;

export function TileDisplay({ tile, label, className }: TileDisplayProps) {
  const isEmpty = tile.type === "empty";
  const isPlaceholder = tile.type === "placeholder";
  const imageUrl = TILE_TYPE_IMAGES[tile.type];

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn("group relative w-fit bg-white", isPlaceholder && "animate-pulse")}
        style={{
          height: `${TILE_SIZE}px`,
          aspectRatio: "cos(30deg)",
          clipPath: "polygon(-50% 50%,50% 100%,150% 50%,50% 0)",
        }}
      >
        {(isEmpty || isPlaceholder) && (
          <TileContent>
            <div className="h-8 w-8 rounded-full bg-gray-400" />
          </TileContent>
        )}
        {imageUrl && <img src={imageUrl} alt={tile.type} className="absolute h-full w-full" />}
        {label && (
          <TileContent>
            <span className="font-medium text-sm text-white drop-shadow-md">{label}</span>
          </TileContent>
        )}
        <Border
          variant={isEmpty || isPlaceholder ? "dashed" : "solid"}
          dashCount={3}
          gapFrac={1}
          className={cn("stroke-[4px] stroke-black", (isEmpty || isPlaceholder) && "stroke-[2px] *:stroke-border")}
        />
      </div>
    </div>
  );
}

function TileContent({ children, className }: PropsWithChildren<ComponentProps<"div">>) {
  return (
    <div
      className={cn(
        "absolute inset-1/2 flex h-full w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
