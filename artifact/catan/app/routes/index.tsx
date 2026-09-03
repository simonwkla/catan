import { Hexagon, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { match, P } from "ts-pattern";
import { shallow } from "zustand/shallow";
import { catanBff } from "@/.server/bff/catan";
import { BoardEditor } from "@/components/board-editor";
import { BoardToolbar } from "@/components/board-toolbar";
import { FieldComponent } from "@/components/field";
import { SideBar } from "@/components/side-bar";
import { TexturePackSwapper } from "@/components/texture-pack-swapper";
import { TexturePackProvider } from "@/components/textures";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoaderData } from "@/hook/use-router-data";
import { SeedProvider } from "@/hook/use-seed";
import { Rand } from "@/lib/std";
import { Generation, type GenerationRequest } from "@/models";
import { BoardStoreProvider, selectSelectedRuleKinds, useBoardStore } from "@/store/board-store";
import type { Route } from "./+types";

export const loader = async () => {
  const [template, field] = catanBff.createDefaultTemplate();
  const allRules = catanBff.getAllRules();
  const selectedRules = catanBff.getDefaultRules();
  const textureSeed = Rand.seed();

  return { template, field, allRules, selectedRules, textureSeed };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { template, field, rules, seed } = (await request.json()) as GenerationRequest;
  if (!Generation.isSeed(seed)) {
    throw new Response("Invalid generation seed", { status: 400 });
  }

  const sourceHash = Generation.createSourceHash({ template, field, rules });
  const result = await catanBff.solve(template, field, rules, { seed, signal: request.signal });

  return { sourceHash, seed, result };
};

export default function Page() {
  const { template, field, allRules, selectedRules, textureSeed } = useLoaderData<typeof loader>();

  return (
    <TexturePackProvider>
      <SeedProvider seed={textureSeed}>
        <BoardStoreProvider field={field} template={template} allRules={allRules} selectedRules={selectedRules}>
          <BoardWorkspace />
        </BoardStoreProvider>
      </SeedProvider>
    </TexturePackProvider>
  );
}

function BoardWorkspace() {
  const field = useBoardStore((state) => state.field);
  const template = useBoardStore((state) => state.template);
  const selectedRuleKinds = useBoardStore(selectSelectedRuleKinds, shallow);
  const fetcher = useFetcher<typeof action>();
  const [activeTab, setActiveTab] = useState("setup");

  const currentSourceHash = useMemo(
    () => Generation.createSourceHash({ field, template, rules: selectedRuleKinds }),
    [field, selectedRuleKinds, template],
  );
  const responseIsCurrent = fetcher.data?.sourceHash === currentSourceHash;
  const currentError = responseIsCurrent && fetcher.data && !fetcher.data.result.ok ? fetcher.data.result.err : null;
  const ruleIssues = currentError?.kind === "rule-check-failed" ? currentError.issues : [];

  useEffect(() => {
    if (currentError?.kind === "rule-check-failed") {
      setActiveTab("setup");
    }
  }, [currentError]);

  function handleGenerate() {
    setActiveTab("generated");
    fetcher.submit(
      { template, field, rules: selectedRuleKinds, seed: Generation.createSeed() },
      { method: "POST", encType: "application/json" },
    );
  }

  const isGenerating = fetcher.state !== "idle";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SideBar onGenerate={handleGenerate} loading={isGenerating} ruleIssues={ruleIssues} />

      <Tabs
        className="relative flex min-w-0 flex-1 flex-col py-2 pr-2 pl-1"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="generated">Generated</TabsTrigger>
        </TabsList>
        <TexturePackSwapper className="absolute top-2 right-2 z-40" />

        <TabsContent value="setup" className="relative min-h-0 flex-1">
          <BoardEditor />
          <BoardToolbar />
        </TabsContent>
        <TabsContent value="generated" className="relative flex min-h-0 flex-1 items-center justify-center">
          <GeneratedBoard
            loading={isGenerating}
            result={fetcher.data?.result}
            responseIsCurrent={responseIsCurrent}
            onGenerate={handleGenerate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type SolveResult = Awaited<ReturnType<typeof catanBff.solve>>;

interface GeneratedBoardProps {
  loading: boolean;
  result: SolveResult | undefined;
  responseIsCurrent: boolean;
  onGenerate: () => void;
}

function GeneratedBoard({ loading, result, responseIsCurrent, onGenerate }: GeneratedBoardProps) {
  return match([loading, result] as const)
    .with([true, P._], () => <Loader2 className="size-4 animate-spin" />)
    .with([false, P.nullish], () => <EmptyGeneration onGenerate={onGenerate} />)
    .with([false, { ok: true }], ([_, { val }]) => (
      <div className="relative h-full w-full">
        {!responseIsCurrent && (
          <div className="absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-700 text-xs shadow-sm dark:text-amber-300">
            This result was generated from an earlier setup. Generate again to update it.
          </div>
        )}
        <FieldComponent field={val} />
      </div>
    ))
    .with([false, { ok: false, err: { kind: "rule-check-failed" } }], () => null)
    .with([false, { ok: false, err: { kind: "unsolvable" } }], ([_, { err }]) => (
      <div className="max-w-md rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center text-destructive">
        {err.message}
      </div>
    ))
    .exhaustive();
}

function EmptyGeneration({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Hexagon className="size-6" />
        </EmptyMedia>
        <EmptyTitle>No field yet</EmptyTitle>
        <EmptyDescription>
          You haven't generated a fair Catan field yet. Get started by clicking the generate button.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onGenerate}>
          <Sparkles className="size-4" />
          Generate Field
        </Button>
      </EmptyContent>
    </Empty>
  );
}
