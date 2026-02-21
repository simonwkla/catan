import { Eraser, MousePointer2, X } from "lucide-react";
import { useState } from "react";
import { useTemplateStore } from "@/hook/use-template";
import { cn } from "@/lib/cn";
import { ALL_TOKENS, type Brush, TILE_TYPE_INFO, VALID_TILE_TYPES } from "@/models/catan";
import { Token } from "./ui/token";

export function PaintToolbar() {
  const brush = useTemplateStore((state) => state.brush);
  const selectBrush = useTemplateStore((state) => state.selectBrush);
  const [expanded, setExpanded] = useState<"tokens" | null>(null);

  const isActive = (check: Brush) => {
    if (brush.kind !== check.kind) {
      return false;
    }
    if (brush.kind === "tile" && check.kind === "tile") {
      return brush.type === check.type;
    }
    if (brush.kind === "token" && check.kind === "token") {
      return brush.token.value === check.token.value;
    }
    return true;
  };

  return (
    <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
      {/* Token expansion panel */}
      {expanded === "tokens" && (
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur-sm">
          <span className="mr-2 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">Tokens</span>
          {ALL_TOKENS.map((token) => {
            const active = isActive({ kind: "token", token });
            return (
              <button
                key={token.value}
                onClick={() => {
                  selectBrush({ kind: "token", token });
                  setExpanded(null);
                }}
              >
                <Token
                  token={token}
                  className={cn("hover:bg-secondary", active && "bg-primary/20 ring-2 ring-primary")}
                />
              </button>
            );
          })}
          <button
            onClick={() => setExpanded(null)}
            className="ml-1 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main toolbar */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 px-2 py-1.5 shadow-xl backdrop-blur-sm">
        {/* Select cursor */}
        <ToolbarButton
          active={brush.kind === "select"}
          onClick={() => {
            selectBrush({ kind: "select" });
            setExpanded(null);
          }}
          title="Select & inspect tiles"
        >
          <MousePointer2 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Resource brushes */}
        {VALID_TILE_TYPES.map((type) => {
          const info = TILE_TYPE_INFO[type];
          const active = isActive({ kind: "tile", type });
          return (
            <ToolbarButton
              key={type}
              active={active}
              onClick={() => {
                selectBrush({ kind: "tile", type });
                setExpanded(null);
              }}
              title={`Paint ${info.label} (pins tile)`}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded" style={{ backgroundColor: info.color }}>
                <span className="text-sm leading-none">{info.icon}</span>
              </div>
            </ToolbarButton>
          );
        })}

        <Divider />

        {/* Token brush toggle */}
        <ToolbarButton
          active={brush.kind === "token"}
          onClick={() => setExpanded(expanded === "tokens" ? null : "tokens")}
          title="Pick a number token to paint"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#8b7e6a] bg-[#f5f0e1]">
            <span className="font-bold font-serif text-[#2c2416] text-[10px]">
              {brush.kind === "token" ? brush.token.int : "#"}
            </span>
          </div>
        </ToolbarButton>

        <Divider />

        {/* Eraser */}
        <ToolbarButton
          active={brush.kind === "eraser"}
          onClick={() => {
            selectBrush({ kind: "eraser" });
            setExpanded(null);
          }}
          title="Eraser: unpin and clear tiles"
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Hint text */}
      <div className="rounded-full border border-border/50 bg-card/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-sm">
        {brush.kind === "select" && "Click a tile to inspect or edit in sidebar"}
        {brush.kind === "tile" && `Click tiles to paint ${TILE_TYPE_INFO[brush.type].label} and pin them`}
        {brush.kind === "token" && `Click resource tiles to assign token ${brush.token.int} and pin it`}
        {brush.kind === "eraser" && "Click tiles to unpin and clear them"}
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 ${
        active
          ? "bg-primary/20 text-primary ring-2 ring-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-6 w-px bg-border" />;
}
