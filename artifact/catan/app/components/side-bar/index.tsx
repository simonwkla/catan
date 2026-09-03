import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { RuleIssues } from "@/components/rule-issues";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { RuleIssue } from "@/models";
import { useBoardStore } from "@/store/board-store";
import { Separator } from "../ui/separator";
import { RulesSection } from "./rules-section";
import { TileCountsSection } from "./tile-counts-section";

interface SideBarProps {
  onGenerate: () => void;
  loading: boolean;
  ruleIssues: readonly RuleIssue[];
}

export function SideBar({ onGenerate, loading, ruleIssues }: SideBarProps) {
  const resetBoard = useBoardStore((state) => state.resetBoard);

  return (
    <div className="flex w-md shrink-0 flex-col overflow-hidden border-border border-r bg-card transition-all duration-300">
      <Tabs defaultValue="rules" className="mt-2 flex-1">
        <div className="px-1">
          <TabsList className="w-full">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="tiles">Counts</TabsTrigger>
          </TabsList>
        </div>

        <div className="px-2">
          <TabsContent value="rules">
            <RulesSection />
          </TabsContent>
          <TabsContent value="tiles">
            <TileCountsSection />
          </TabsContent>
        </div>
      </Tabs>

      <Separator />
      <div className="space-y-2 p-2">
        {ruleIssues.length > 0 && <RuleIssues issues={ruleIssues} />}
        <Button onClick={onGenerate} className="w-full py-3 font-semibold" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Board
        </Button>
        <Button variant="secondary" className="w-full py-2" onClick={resetBoard}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Board
        </Button>
      </div>
    </div>
  );
}
