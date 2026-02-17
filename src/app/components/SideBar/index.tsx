import { Dices, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplateStore } from "@/hook/use-template";
import { cn } from "@/lib/cn";
import { Separator } from "../ui/separator";
import { GeneralSection } from "./GeneralSection";
import { TileCountsSection } from "./TileCountsSection";

interface SideBarProps {
  onGenerate: () => void;
}

export function SideBar({ onGenerate }: SideBarProps) {
  const reset = useTemplateStore((state) => state.reset);

  return (
    <div
      className={cn(
        "flex w-80 shrink-0 flex-col overflow-hidden border-border border-r bg-card transition-all duration-300",
      )}
    >
      {/* Header */}
      <div className="shrink-0 p-2">
        <div className="flex items-center gap-2">
          <Dices className="h-5 w-5 text-primary" />
          <h1 className="font-bold text-foreground text-lg tracking-tight">Catan Board Forge</h1>
        </div>
        <p className="mt-1 text-muted-foreground text-xs">Configure and generate balanced boards</p>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="shape" className="mt-2 flex-1">
        <div className="px-1">
          <TabsList className="w-full">
            <TabsTrigger value="shape">Shape</TabsTrigger>
            <TabsTrigger value="tiles">Counts</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content */}
        <div className="px-2">
          <TabsContent value="shape">
            <GeneralSection />
          </TabsContent>
          <TabsContent value="tiles">
            <TileCountsSection />
          </TabsContent>
        </div>
      </Tabs>

      <Separator />
      <div className="space-y-1 p-2">
        <Button onClick={onGenerate} className="w-full py-3 font-semibold">
          <Sparkles className="h-4 w-4" />
          Generate Board
        </Button>
        <Button variant="secondary" className="w-full py-2" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Board
        </Button>
      </div>
    </div>
  );
}
