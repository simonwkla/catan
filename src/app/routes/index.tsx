import { useCallback } from "react";
import { catanBff } from "@/.server/bff/catan";
import { FieldComponent } from "@/components/Field";
import { PaintToolbar } from "@/components/PaintToolbar";
import { SideBar } from "@/components/SideBar";
import { useLoaderData } from "@/hook/use-data";
import { TemplateStoreProvider, useTemplateStore } from "@/hook/use-template";
import type { VectorAx } from "@/lib/vec";

export const loader = async () => {
  const [template, field] = catanBff.createDefaultTemplate(DEFAULT_SIZE);
  return { template, field };
};

const DEFAULT_SIZE = 2;

export default function Page() {
  const { template, field } = useLoaderData<typeof loader>();

  return (
    <TemplateStoreProvider field={field} template={template}>
      <Board />
    </TemplateStoreProvider>
  );
}

function Board() {
  const field = useTemplateStore((state) => state.field);
  const brush = useTemplateStore((state) => state.brush);
  const selectTile = useTemplateStore((state) => state.selectTile);
  const setTileType = useTemplateStore((state) => state.setTileType);
  const setTileToken = useTemplateStore((state) => state.setTileToken);
  const clearTile = useTemplateStore((state) => state.clearTile);
  const selectedTile = useTemplateStore((state) => state.selectedTile);

  const handleTileClick = useCallback(
    (pos: VectorAx) => {
      if (brush.kind === "select") {
        selectTile(pos);
        return;
      }

      if (brush.kind === "tile") {
        setTileType(pos, brush.type);
        return;
      }

      if (brush.kind === "token") {
        setTileToken(pos, brush.token);
        return;
      }

      if (brush.kind === "eraser") {
        clearTile(pos);
      }
    },
    [brush, selectTile, setTileType, setTileToken, clearTile],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <SideBar onGenerate={() => {}} />

      {/* Board area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-border border-b bg-card/50 px-6 py-3">
          <div className="flex items-center gap-2">
            {selectedTile && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
                Editing: ({selectedTile.pos.q}, {selectedTile.pos.r})
              </span>
            )}
          </div>
        </div>

        {/* Board + toolbar */}
        <div className="relative min-h-0 flex-1 p-4">
          <FieldComponent field={field} selectedTilePos={selectedTile?.pos ?? null} onTileClick={handleTileClick} />
          <PaintToolbar />
        </div>

        {/* Bottom legend */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-4 border-border border-t bg-card/50 px-6 py-2.5">
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Pinned = survives generation
          </span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />6 & 8 = highest probability
          </span>
          <span className="text-muted-foreground text-xs">Use toolbar below to paint or erase</span>
        </div>
      </div>
    </div>
  );
}
