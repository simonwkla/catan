import { Hexagon, Loader2, Sparkles } from "lucide-react";
import { useCallback } from "react";
import { useFetcher } from "react-router";
import { match, P } from "ts-pattern";
import { catanBff } from "@/.server/bff/catan";
import { FieldComponent } from "@/components/Field";
import { PaintToolbar } from "@/components/PaintToolbar";
import { SideBar } from "@/components/SideBar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoaderData } from "@/hook/use-data";
import { TemplateStoreProvider, useTemplateStore } from "@/hook/use-template";
import type { VectorAx } from "@/lib/vec";
import type { Field, Template } from "@/models";
import type { Route } from "./+types";

export const loader = async () => {
  const [template, field] = catanBff.createDefaultTemplate(DEFAULT_SIZE);
  return { template, field };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { template, field } = (await request.json()) as { template: Template; field: Field };

  const result = await catanBff.solve(template, field);

  return result;
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
  const template = useTemplateStore((state) => state.template);
  const brush = useTemplateStore((state) => state.brush);
  const selectTile = useTemplateStore((state) => state.selectTile);
  const setTileType = useTemplateStore((state) => state.setTileType);
  const setTileToken = useTemplateStore((state) => state.setTileToken);
  const clearTile = useTemplateStore((state) => state.clearTile);
  const selectedTile = useTemplateStore((state) => state.selectedTile);
  const fetcher = useFetcher<typeof action>();

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

  const handleGenerate = useCallback(() => {
    fetcher.submit({ template, field }, { method: "POST", encType: "application/json" });
  }, [fetcher, template, field]);

  const isGenerating = fetcher.state !== "idle";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SideBar onGenerate={handleGenerate} loading={isGenerating} />

      <Tabs className="flex min-w-0 flex-1 flex-col py-2 pr-2 pl-1" defaultValue="template">
        <div className="flex shrink-0 items-center justify-between">
          <TabsList>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="generated">Generated</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {selectedTile && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
                Editing: ({selectedTile.pos.q}, {selectedTile.pos.r})
              </span>
            )}
          </div>
        </div>

        {/* Board + toolbar */}
        <TabsContent value="template" className="relative min-h-0 flex-1">
          <FieldComponent field={field} selectedTilePos={selectedTile?.pos ?? null} onTileClick={handleTileClick} />
          <PaintToolbar />
        </TabsContent>
        <TabsContent value="generated" className="relative flex min-h-0 flex-1 items-center justify-center">
          {match([isGenerating, fetcher.data])
            .with([true, P._], () => <Loader2 className="size-4 animate-spin" />)
            .with([false, P.nullish], () => (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Hexagon className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No field yet</EmptyTitle>
                  <EmptyDescription>
                    You haven't generated a fair catan field yet. Get started by clicking the generate button.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={handleGenerate}>
                    <Sparkles className="size-4" />
                    Generate Field
                  </Button>
                </EmptyContent>
              </Empty>
            ))
            .with([false, { ok: true }], ([_, { val }]) => <FieldComponent field={val} />)
            .with([false, { ok: false }], ([_, { err }]) => <div>Error: {err.message}</div>)
            .exhaustive()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
