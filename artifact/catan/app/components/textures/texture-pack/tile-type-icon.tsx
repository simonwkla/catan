import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import type { ValidTileTypeValue } from "@/models";
import { useTexturePack } from "./context";
import { TextureStyle } from "./presentation";

interface TileTypeIconProps extends Omit<ComponentProps<"span">, "children"> {
  tileType: ValidTileTypeValue;
}

export function TileTypeIcon({ tileType, className, ...props }: TileTypeIconProps) {
  const texturePack = useTexturePack();
  const icon = texturePack.tileTypes[tileType].icon;

  return (
    <span
      aria-hidden="true"
      className={cn("relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded", className)}
      style={{ backgroundColor: icon.backgroundColor }}
      {...props}
    >
      <img
        src={icon.image.src}
        alt=""
        draggable={false}
        className="size-full"
        style={TextureStyle.image(icon.presentation)}
      />
    </span>
  );
}
