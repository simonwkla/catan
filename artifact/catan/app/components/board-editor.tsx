import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import { FieldComponent } from "@/components/field";
import type { VectorAx } from "@/lib/2d";
import { Field, Layout } from "@/models";
import { selectPreserveConnectivity, useBoardStore } from "@/store/board-store";

export function BoardEditor() {
  const field = useBoardStore((state) => state.field);
  const brush = useBoardStore((state) => state.brush);
  const setTileType = useBoardStore((state) => state.setTileType);
  const setTileToken = useBoardStore((state) => state.setTileToken);
  const addFieldSlot = useBoardStore((state) => state.addFieldSlot);
  const removeFieldSlot = useBoardStore((state) => state.removeFieldSlot);
  const preserveConnectivity = useBoardStore(selectPreserveConnectivity);
  const [hoveredTilePos, setHoveredTilePos] = useState<VectorAx | null>(null);

  function deleteFieldSlot(pos: VectorAx) {
    if (!Layout.canRemoveFieldSlot(field, pos, preserveConnectivity)) {
      return;
    }

    const tile = Field.getTile(field, pos);
    if (!tile) {
      return;
    }

    const hasPinnedContent = tile.type !== "empty" || tile.token !== null;
    if (hasPinnedContent && !window.confirm("Remove this board slot and its pinned tile data?")) {
      return;
    }

    removeFieldSlot(pos);
    setHoveredTilePos(null);
  }

  function handleTileClick(pos: VectorAx) {
    match(brush)
      .with({ kind: "add-slot" }, () => undefined)
      .with({ kind: "tile" }, ({ type }) => setTileType(pos, type))
      .with({ kind: "token" }, ({ token }) => setTileToken(pos, token))
      .with({ kind: "eraser" }, () => setTileType(pos, "empty"))
      .with({ kind: "delete-slot" }, () => deleteFieldSlot(pos))
      .exhaustive();
  }

  const addablePositions = useMemo(() => {
    if (brush.kind !== "add-slot" || hoveredTilePos === null) {
      return [];
    }

    return Layout.getOpenFieldSlotPositions(field, hoveredTilePos);
  }, [brush.kind, field, hoveredTilePos]);

  function handleAddFieldSlot(pos: VectorAx) {
    addFieldSlot(pos);
    setHoveredTilePos(pos);
  }

  function isTileDisabled(pos: VectorAx) {
    return brush.kind === "delete-slot" && !Layout.canRemoveFieldSlot(field, pos, preserveConnectivity);
  }

  function getTileTitle(pos: VectorAx) {
    if (brush.kind !== "delete-slot") {
      return undefined;
    }
    if (field.tiles.length <= 1) {
      return "The final board slot cannot be deleted";
    }
    if (!Layout.canRemoveFieldSlot(field, pos, preserveConnectivity)) {
      return preserveConnectivity ? "Disable Connected field to delete this slot" : "This board slot cannot be deleted";
    }
    return "Delete this board slot";
  }

  return (
    <FieldComponent
      field={field}
      tileIntent={brush.kind === "delete-slot" ? "delete" : "default"}
      isTileDisabled={isTileDisabled}
      getTileTitle={getTileTitle}
      onTileClick={handleTileClick}
      onTileHover={setHoveredTilePos}
      additions={{ positions: addablePositions, onAdd: handleAddFieldSlot }}
    />
  );
}
