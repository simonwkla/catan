import { Plus } from "lucide-react";
import { Border } from "@/components/field/border";
import type { VectorAx } from "@/lib/2d";
import { FIELD_TILE_HEIGHT, FieldGeometry, POINTY_HEX_ASPECT_RATIO, POINTY_HEX_CLIP_PATH } from "./geometry";

interface AddFieldSlotProps {
  position: VectorAx;
  onAdd: (position: VectorAx) => void;
}

export function AddFieldSlot({ position, onAdd }: AddFieldSlotProps) {
  const pixelPos = FieldGeometry.getTilePosition(position);

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pixelPos.x}px`, top: `${pixelPos.y}px` }}
    >
      <button
        type="button"
        onClick={() => onAdd(position)}
        aria-label={`Add board slot at ${position.q}, ${position.r}`}
        className="group relative flex items-center justify-center bg-primary/5 text-primary/70 transition-all duration-150 hover:scale-[105%] hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
        style={{
          height: `${FIELD_TILE_HEIGHT}px`,
          aspectRatio: POINTY_HEX_ASPECT_RATIO,
          clipPath: POINTY_HEX_CLIP_PATH,
        }}
      >
        <Plus className="size-8 transition-transform group-hover:scale-110" />
        <Border
          variant="dashed"
          className="stroke-[2px] *:stroke-primary/50 group-hover:stroke-[4px] group-hover:*:stroke-primary"
        />
      </button>
    </div>
  );
}
