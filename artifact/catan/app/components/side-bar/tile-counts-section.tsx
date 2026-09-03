import { shallow } from "zustand/shallow";
import { TileTypeIcon } from "@/components/textures";
import { TokenComponent } from "@/components/token";
import {
  TILE_TYPE_DISPLAY_NAMES,
  Token,
  type Token as TokenDefinition,
  VALID_TILE_TYPES,
  type ValidTileTypeValue,
} from "@/models";
import {
  selectFieldTokenCounts,
  selectFieldTypeCounts,
  selectTemplateTileCount,
  selectTemplateTokenResourceCounts,
  useBoardStore,
} from "@/store/board-store";
import { Badge } from "../ui/badge";
import { Counter } from "../ui/counter";
import { Label } from "../ui/label";

export function TileCountsSection() {
  const template = useBoardStore((state) => state.template);
  const totalSlots = useBoardStore((state) => state.field.tiles.length);
  const totalAssigned = useBoardStore(selectTemplateTileCount);
  const fieldTypeCounts = useBoardStore(selectFieldTypeCounts, shallow);
  const fieldTokenCounts = useBoardStore(selectFieldTokenCounts, shallow);
  const tokenResourceCounts = useBoardStore(selectTemplateTokenResourceCounts, shallow);
  const setTileTypeCount = useBoardStore((state) => state.setTileTypeCount);
  const setTokenCount = useBoardStore((state) => state.setTokenCount);
  const remaining = totalSlots - totalAssigned;

  return (
    <div className="flex flex-col gap-3">
      <CountSummary
        title="Tiles"
        count={totalAssigned}
        total={totalSlots}
        message={
          remaining > 0
            ? `${remaining} board slot${remaining === 1 ? "" : "s"} still need a tile type.`
            : `Remove ${Math.abs(remaining)} configured tile${remaining === -1 ? "" : "s"}.`
        }
      />

      <div className="flex flex-col gap-1.5">
        {VALID_TILE_TYPES.map((type) => (
          <TileCountRow
            key={type}
            type={type}
            fieldCount={fieldTypeCounts[type]}
            configuredCount={template.tileTypesMap[type]}
            maximum={totalSlots}
            onChange={(count) => setTileTypeCount(type, count)}
          />
        ))}
      </div>

      <CountSummary
        title="Tokens"
        count={tokenResourceCounts.tokenCount}
        total={tokenResourceCounts.resourceTilesCount}
        message="Number tokens must match the configured resource tiles."
      />

      <div className="grid grid-cols-1 gap-1">
        {Token.all.map((token) => (
          <TokenCountRow
            key={token.value}
            token={token}
            fieldCount={fieldTokenCounts[token.value]}
            configuredCount={template.tokensMap[token.value]}
            maximum={totalSlots}
            onChange={(count) => setTokenCount(token.value, count)}
          />
        ))}
      </div>
    </div>
  );
}

interface CountSummaryProps {
  title: string;
  count: number;
  total: number;
  message: string;
}

function CountSummary({ title, count, total, message }: CountSummaryProps) {
  const balanced = count === total;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <Badge variant={balanced ? "default" : "destructive"}>
          {count}/{total}
        </Badge>
      </div>
      {!balanced && <p className="mt-1 text-muted-foreground text-xs">{message}</p>}
    </div>
  );
}

interface TileCountRowProps {
  type: ValidTileTypeValue;
  fieldCount: number;
  configuredCount: number;
  maximum: number;
  onChange: (count: number) => void;
}

function TileCountRow({ type, fieldCount, configuredCount, maximum, onChange }: TileCountRowProps) {
  return (
    <div className="grid grid-cols-[8rem_1fr_auto] items-center gap-2 rounded-full bg-secondary/30 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <TileTypeIcon tileType={type} />
        <Label>{TILE_TYPE_DISPLAY_NAMES[type]}</Label>
      </div>
      <Badge variant={fieldCount > configuredCount ? "destructive" : "secondary"}>
        {fieldCount} / {configuredCount}
      </Badge>
      <Counter count={configuredCount} onChange={onChange} max={maximum} />
    </div>
  );
}

interface TokenCountRowProps {
  token: TokenDefinition;
  fieldCount: number;
  configuredCount: number;
  maximum: number;
  onChange: (count: number) => void;
}

function TokenCountRow({ token, fieldCount, configuredCount, maximum, onChange }: TokenCountRowProps) {
  return (
    <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-full bg-secondary/30 px-2">
      <TokenComponent token={token.value} />
      <Badge variant={fieldCount > configuredCount ? "destructive" : "secondary"}>
        {fieldCount} / {configuredCount}
      </Badge>
      <Counter count={configuredCount} onChange={onChange} max={maximum} />
    </div>
  );
}
