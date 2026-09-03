import { Check, ChevronDown, Layers3 } from "lucide-react";
import { type ComponentProps, type PointerEvent, useEffect, useRef, useState } from "react";
import { type TexturePackId, TexturePackPreview, useTexturePackContext } from "@/components/textures";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/cn";

interface TexturePackSwapperProps extends Omit<ComponentProps<"div">, "children"> {}

export function TexturePackSwapper({ className, ...props }: TexturePackSwapperProps) {
  const { activeTexturePack, activeTexturePackId, texturePacks, selectTexturePack } = useTexturePackContext();
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedFromHoverRef = useRef(false);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  function cancelScheduledClose() {
    if (closeTimerRef.current === null) {
      return;
    }

    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function handlePointerEnter(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }

    cancelScheduledClose();
    openedFromHoverRef.current = true;
    setOpen(true);
  }

  function handlePointerLeave(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }

    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 140);
  }

  function handleOpenChange(nextOpen: boolean) {
    cancelScheduledClose();
    openedFromHoverRef.current = false;
    setOpen(nextOpen);
  }

  function handleSelect(texturePackId: TexturePackId) {
    selectTexturePack(texturePackId);
    openedFromHoverRef.current = false;
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)} {...props}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <div onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
          <PopoverTrigger asChild={true}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 bg-background/90 px-2 shadow-sm backdrop-blur-sm"
              aria-label={`Texture pack: ${activeTexturePack.name}. Choose texture pack`}
            >
              <Layers3 className="size-4 text-muted-foreground" />
              <TexturePackPreview texturePack={activeTexturePack} className="h-6 w-12 rounded-md p-0.5" />
              <ChevronDown
                className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
              />
            </Button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(23rem,calc(100vw-1rem))] gap-3 p-3"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onOpenAutoFocus={(event) => {
            if (openedFromHoverRef.current) {
              event.preventDefault();
              openedFromHoverRef.current = false;
            }
          }}
        >
          <PopoverHeader className="gap-0.5 px-1">
            <PopoverTitle>Board texture</PopoverTitle>
            <PopoverDescription>Choose an illustration style for every tile and number token.</PopoverDescription>
          </PopoverHeader>

          <div className="flex flex-col gap-1">
            {texturePacks.map((texturePack) => {
              const selected = texturePack.id === activeTexturePackId;

              return (
                <Button
                  key={texturePack.id}
                  type="button"
                  variant={selected ? "secondary" : "ghost"}
                  className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl p-2 text-left"
                  aria-pressed={selected}
                  onClick={() => handleSelect(texturePack.id)}
                >
                  <TexturePackPreview texturePack={texturePack} />
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <span className="font-medium text-sm leading-none">{texturePack.name}</span>
                    {texturePack.description !== undefined && (
                      <span className="line-clamp-2 text-muted-foreground text-xs leading-snug">
                        {texturePack.description}
                      </span>
                    )}
                  </span>
                  <Check
                    className={cn("size-4 text-primary transition-opacity", selected ? "opacity-100" : "opacity-0")}
                  />
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
