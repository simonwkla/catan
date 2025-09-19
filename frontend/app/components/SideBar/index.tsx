import { cn } from "@lib/cn";
import { GeneralSection } from "@components/SideBar/GeneralSection";
import { TemplateSection } from "@components/SideBar/TemplateSection";
import type { PartialTemplate } from "app/catan/domain/entity/template";
import { Button } from "@components/ui/button";

type PartialTileTypeMap = PartialTemplate["tileTypesMap"];
type PartialTokenMap = PartialTemplate["tokensMap"];

interface SideBarProps {
  totalTilesCount: number;
  className?: string;
  template: PartialTemplate;
  fieldSize: number;
  onSizeChange: (size: number) => void;
  onTemplateChange: (template: PartialTemplate) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const SideBar = ({
  className,
  totalTilesCount,
  template,
  fieldSize,
  onSizeChange,
  onTemplateChange,
  onSubmit,
  disabled,
}: SideBarProps) => {
  return (
    <div className={cn("flex flex-col gap-6 p-4", className)}>
      <GeneralSection size={fieldSize} onSizeChange={onSizeChange} />
      <TemplateSection
        totalTilesCount={totalTilesCount}
        template={template}
        onChange={onTemplateChange}
      />
      <Button onClick={onSubmit} disabled={disabled}>
        {disabled ? "Generating…" : "Generate"}
      </Button>
    </div>
  );
};
