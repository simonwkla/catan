import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import type { ValidTileTypeValue } from "@/models";
import { TextureStyle } from "./presentation";
import type { RegisteredTexturePack } from "./registry";

const previewTileTypes = ["water", "forest", "field", "mountain"] as const satisfies readonly ValidTileTypeValue[];

interface TexturePackPreviewProps extends Omit<ComponentProps<"span">, "children"> {
  texturePack: RegisteredTexturePack;
}

export function TexturePackPreview({ texturePack, className, ...props }: TexturePackPreviewProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-12 w-28 shrink-0 grid-cols-4 items-center gap-0.5 overflow-hidden rounded-lg bg-muted/60 p-1",
        className,
      )}
      {...props}
    >
      {previewTileTypes.map((tileType) => {
        const icon = texturePack.tileTypes[tileType].icon;

        return (
          <span
            key={tileType}
            className="aspect-[1.1] min-w-0 overflow-hidden bg-muted [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]"
            style={{ backgroundColor: icon.backgroundColor }}
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
      })}
    </span>
  );
}
