import { useMemo } from "react";
import { useElementSize } from "@/hook/use-element-size";
import { Bounds2, VectorAx } from "@/lib/2d";
import type { Field } from "@/models/catan";
import { AddFieldSlot } from "./add-field-slot";
import { FieldGeometry } from "./geometry";
import { TileComponent, type TileIntent } from "./tile";

interface FieldAdditions {
  positions: readonly VectorAx[];
  onAdd: (pos: VectorAx) => void;
}

interface FieldProps {
  field: Field;
  onTileClick?: (pos: VectorAx) => void;
  onTileHover?: (pos: VectorAx | null) => void;
  additions?: FieldAdditions;
  tileIntent?: TileIntent;
  isTileDisabled?: (pos: VectorAx) => boolean;
  getTileTitle?: (pos: VectorAx) => string | undefined;
}

export function FieldComponent({
  field,
  onTileClick,
  onTileHover,
  additions,
  tileIntent = "default",
  isTileDisabled,
  getTileTitle,
}: FieldProps) {
  const scene = useMemo(
    () => FieldGeometry.getScene([...field.tiles.map((tile) => tile.pos), ...(additions?.positions ?? [])]),
    [additions?.positions, field.tiles],
  );
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const scale = scene ? Bounds2.scaleToFit(scene.bounds, { W: width, H: height }, 24) : 1;

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden" onPointerLeave={() => onTileHover?.(null)}>
      <div
        className="absolute top-1/2 left-1/2 h-0 w-0 transition-transform duration-300"
        style={{ transform: `scale(${scale})` }}
      >
        <div
          className="relative transition-transform duration-300"
          style={{ transform: `translate(${-1 * (scene?.center.x ?? 0)}px, ${-1 * (scene?.center.y ?? 0)}px)` }}
        >
          {additions?.positions.map((position) => (
            <AddFieldSlot key={VectorAx.key(position)} position={position} onAdd={additions.onAdd} />
          ))}
          {field.tiles.map((t) => {
            const tileId = VectorAx.key(t.pos);
            return (
              <TileComponent
                key={tileId}
                tile={t}
                intent={tileIntent}
                disabled={isTileDisabled?.(t.pos) ?? false}
                title={getTileTitle?.(t.pos)}
                onClick={() => onTileClick?.(t.pos)}
                onPointerEnter={() => onTileHover?.(t.pos)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
