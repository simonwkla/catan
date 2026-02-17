import type { ReactElement } from "react";
import { VectorAx } from "@/lib/vec";
import type { Field } from "@/models/catan";
import { TileComponent } from "./Tile";

export interface FieldProps {
  field: Field;
  selectedTilePos?: VectorAx | null;
  onTileClick?: (pos: VectorAx) => void;
}

export const FieldComponent = ({ field, selectedTilePos = null, onTileClick }: FieldProps): ReactElement => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute h-0 w-0">
        <div className="relative">
          {field.tiles.map((t) => {
            const tileId = VectorAx.key(t.pos);
            return (
              <TileComponent
                key={tileId}
                tile={t}
                className="-translate-x-1/2 -translate-y-1/2"
                selected={selectedTilePos !== null && VectorAx.equals(selectedTilePos, t.pos)}
                onClick={() => onTileClick?.(t.pos)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
