import { useTemplateStore } from "@/hook/use-template";
import { TILE_TYPE_INFO, VALID_TILE_TYPES } from "@/models/catan";
import { Badge } from "../ui/badge";
import { Counter } from "../ui/counter";
import { Label } from "../ui/label";

export function TileCountsSection() {
  const template = useTemplateStore((state) => state.template);
  const setTileTypeCount = useTemplateStore((state) => state.setTileTypeCount);

  const totalSlots = useTemplateStore((state) => state.field.tiles.length);
  const totalAssigned = Object.values(template.tileTypesMap).reduce((sum, c) => sum + c, 0);
  const remaining = totalSlots - totalAssigned;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Badge variant={remaining === 0 ? "default" : remaining < 0 ? "destructive" : "secondary"}>
          {totalAssigned}/{totalSlots}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        {VALID_TILE_TYPES.map((type) => {
          const count = template.tileTypesMap[type];
          const info = TILE_TYPE_INFO[type];

          return (
            <div key={type} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/30 px-2 py-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs"
                  style={{ backgroundColor: info.color }}
                >
                  <span style={{ fontSize: "14px" }}>{info.icon}</span>
                </div>
                <Label>{info.label}</Label>
              </div>
              <div className="flex items-center gap-1">
                <Counter count={count} onChange={(c) => setTileTypeCount(type, c)} max={totalSlots} min={0} />
              </div>
            </div>
          );
        })}
      </div>

      {remaining < 0 && (
        <p className="text-destructive text-xs">
          Too many tiles assigned! Remove {Math.abs(remaining)} tile{Math.abs(remaining) !== 1 ? "s" : ""}.
        </p>
      )}
      {remaining > 0 && (
        <p className="text-muted-foreground text-xs">
          {remaining} slot{remaining !== 1 ? "s" : ""} unassigned. These will be randomly filled.
        </p>
      )}
    </div>
  );
}
