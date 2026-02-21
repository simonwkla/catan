import { useTemplateStore } from "@/hook/use-template";
import { ALL_TOKENS, TILE_TYPE_INFO, VALID_TILE_TYPES } from "@/models/catan";
import { Badge } from "../ui/badge";
import { Counter } from "../ui/counter";
import { Label } from "../ui/label";
import { Token } from "../ui/token";
import { Separator } from "../ui/separator";

export function TileCountsSection() {
  const template = useTemplateStore((state) => state.template);
  const setTileTypeCount = useTemplateStore((state) => state.setTileTypeCount);
  const setTokenCount = useTemplateStore((state) => state.setTokenCount);

  const totalSlots = useTemplateStore((state) => state.field.tiles.length);
  const totalAssigned = Object.values(template.tileTypesMap).reduce((sum, c) => sum + c, 0);
  const remaining = totalSlots - totalAssigned;

  const fieldTypeCount = useTemplateStore((state) => state.getFieldTypeCount());
  const fieldTokenCount = useTemplateStore((state) => state.getFieldTokenCount());
  const tokenResourceTilesDiff = useTemplateStore((state) => state.getTemplateTokenResourceTilesDiff());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Tiles</h4>
        <Badge variant={remaining === 0 ? "default" : "destructive"}>
          {totalAssigned}/{totalSlots}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        {VALID_TILE_TYPES.map((type) => {
          const count = template.tileTypesMap[type];
          const info = TILE_TYPE_INFO[type];

          return (
            <div
              key={type}
              className="grid grid-cols-[8rem_1fr_auto] items-center gap-2 rounded-full bg-secondary/30 px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs"
                  style={{ backgroundColor: info.color }}
                >
                  <span style={{ fontSize: "14px" }}>{info.icon}</span>
                </div>
                <Label>{info.label}</Label>
              </div>
              <Badge variant={fieldTypeCount[type] > template.tileTypesMap[type] ? "destructive" : "secondary"}>
                {fieldTypeCount[type]} / {template.tileTypesMap[type]}
              </Badge>
              <div className="flex items-center gap-1">
                <Counter count={count} onChange={(c) => setTileTypeCount(type, c)} max={totalSlots} min={0} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Tokens</h4>
      <Badge
        variant={
          tokenResourceTilesDiff.tokenCount === tokenResourceTilesDiff.resourceTilesCount ? "default" : "destructive"
        }
      >
        {tokenResourceTilesDiff.tokenCount} / {tokenResourceTilesDiff.resourceTilesCount}
      </Badge></div>

      <div className="grid grid-cols-1 gap-1">
        {ALL_TOKENS.map((token) => {
          return (
            <div
              key={token.value}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-full bg-secondary/30 px-2"
            >
              <Token token={token} />
              <Badge
                variant={fieldTokenCount[token.value] > template.tokensMap[token.value] ? "destructive" : "secondary"}
              >
                {fieldTokenCount[token.value]} / {template.tokensMap[token.value]}
              </Badge>
              <Counter
                count={template.tokensMap[token.value]}
                onChange={(c) => setTokenCount(token.value, c)}
                max={totalSlots}
                min={0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
