import { ReactElement } from "react";
import { Vector2 } from "@lib/vector2";
import { Catan } from "@catan";
import { TileComponent } from "./Tile";
import { VectorAx } from "@lib/vectorAx";
import type { Field } from "app/catan/domain/entity/field";
import type { Tile } from "app/catan/domain/entity/tile";

export interface FieldProps {
  field: Field;
  onChange: (field: Field) => void;
}

export const FieldComponent = ({ field, onChange }: FieldProps): ReactElement => {
  const onTileChange = (tile: Tile) => {
    onChange(Catan.replaceTile(field, tile, tile));
  };

  return (
    <div className="relative m-auto h-full w-full">
      <div className="absolute left-1/2 top-1/2 h-0 w-0">
        <div className="relative">
          {field.tiles.map((t) => (
            <TileComponent
              onChange={onTileChange}
              key={Vector2.toString(VectorAx.toVector2(t.pos))}
              tile={t}
              className="-translate-x-1/2 -translate-y-1/2"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
