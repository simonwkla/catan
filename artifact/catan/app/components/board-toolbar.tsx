import { Eraser, Plus, Trash2, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { match } from "ts-pattern";
import { TileTypeIcon } from "@/components/textures";
import { TokenComponent } from "@/components/token";
import { cn } from "@/lib/cn";
import { type Brush, TILE_TYPE_DISPLAY_NAMES, Token, VALID_TILE_TYPES } from "@/models/catan";
import { useBoardStore } from "@/store/board-store";

export function BoardToolbar() {
  const brush = useBoardStore((state) => state.brush);
  const setBrush = useBoardStore((state) => state.setBrush);
  const [showTokens, setShowTokens] = useState(false);

  const select = (next: Brush) => {
    setBrush(next);
    setShowTokens(false);
  };

  return (
    <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
      {showTokens && <TokenBrushPicker brush={brush} onSelect={select} onClose={() => setShowTokens(false)} />}

      <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 px-2 py-1.5 shadow-xl backdrop-blur-sm">
        <ToolbarButton
          active={brush.kind === "add-slot"}
          onClick={() => select({ kind: "add-slot" })}
          title="Add board slots"
        >
          <Plus className="h-4 w-4" />
        </ToolbarButton>

        <Divider />
        {VALID_TILE_TYPES.map((type) => (
          <ToolbarButton
            key={type}
            active={isBrushActive(brush, { kind: "tile", type })}
            onClick={() => select({ kind: "tile", type })}
            title={`Paint ${TILE_TYPE_DISPLAY_NAMES[type]} (pins tile)`}
          >
            <TileTypeIcon tileType={type} />
          </ToolbarButton>
        ))}
        <Divider />

        <ToolbarButton
          active={brush.kind === "token"}
          onClick={() => setShowTokens((current) => !current)}
          title="Pick a number token to paint"
        >
          {brush.kind === "token" ? (
            <TokenComponent token={brush.token} size="small" />
          ) : (
            <TokenComponent size="small" />
          )}
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={brush.kind === "eraser"}
          onClick={() => select({ kind: "eraser" })}
          title="Clear tile content without removing the board slot"
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={brush.kind === "delete-slot"}
          onClick={() => select({ kind: "delete-slot" })}
          title="Delete board slots"
          variant="destructive"
        >
          <Trash2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <BrushHint brush={brush} />
    </div>
  );
}

interface TokenBrushPickerProps {
  brush: Brush;
  onSelect: (brush: Brush) => void;
  onClose: () => void;
}

function TokenBrushPicker({ brush, onSelect, onClose }: TokenBrushPickerProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <span className="mr-2 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Tokens</span>
      {Token.all.map((token) => (
        <button type="button" key={token.value} onClick={() => onSelect({ kind: "token", token: token.value })}>
          <TokenComponent
            token={token.value}
            className={cn(
              "hover:ring-2 hover:ring-primary/40",
              isBrushActive(brush, { kind: "token", token: token.value }) && "ring-2 ring-primary",
            )}
          />
        </button>
      ))}
      <button type="button" onClick={onClose} className="ml-1 rounded p-1 text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function BrushHint({ brush }: { brush: Brush }) {
  const hint = match(brush)
    .with({ kind: "add-slot" }, () => "Hover a hex, then click an adjacent + to expand the board")
    .with({ kind: "tile" }, ({ type }) => `Click tiles to paint ${TILE_TYPE_DISPLAY_NAMES[type]} and pin them`)
    .with(
      { kind: "token" },
      ({ token }) => `Click resource tiles to assign token ${Token.fromValue(token).int} and pin it`,
    )
    .with({ kind: "eraser" }, () => "Click tiles to clear their content without removing the slot")
    .with({ kind: "delete-slot" }, () => "Click tiles to delete their board slots")
    .exhaustive();

  return (
    <div className="rounded-full border border-border/50 bg-card/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-sm">
      {hint}
    </div>
  );
}

function isBrushActive(brush: Brush, candidate: Brush): boolean {
  return match<[Brush, Brush], boolean>([brush, candidate])
    .with([{ kind: "add-slot" }, { kind: "add-slot" }], () => true)
    .with([{ kind: "eraser" }, { kind: "eraser" }], () => true)
    .with([{ kind: "delete-slot" }, { kind: "delete-slot" }], () => true)
    .with([{ kind: "tile" }, { kind: "tile" }], ([current, next]) => current.type === next.type)
    .with([{ kind: "token" }, { kind: "token" }], ([current, next]) => current.token === next.token)
    .otherwise(() => false);
}

interface ToolbarButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
  variant?: "default" | "destructive";
}

function ToolbarButton({ active, onClick, title, children, variant = "default" }: ToolbarButtonProps) {
  const stateClassName = match({ active, variant })
    .with({ active: true, variant: "default" }, () => "bg-primary/20 text-primary ring-2 ring-primary")
    .with({ active: false, variant: "default" }, () => "text-muted-foreground hover:bg-secondary hover:text-foreground")
    .with({ active: true, variant: "destructive" }, () => "bg-destructive text-white ring-2 ring-destructive")
    .with({ active: false, variant: "destructive" }, () => "text-destructive hover:bg-destructive/10")
    .exhaustive();

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150",
        stateClassName,
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-6 w-px bg-border" />;
}
