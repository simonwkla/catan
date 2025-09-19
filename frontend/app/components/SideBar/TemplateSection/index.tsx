import { Section } from "@components/SideBar/Section";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { TilesTabContent } from "@components/SideBar/TemplateSection/TilesTabContent";
import { TokensTabContent } from "@components/SideBar/TemplateSection/TokensTabContent";
import type { PartialTemplate } from "app/catan/domain/entity/template";
type TileTypesMapPart = PartialTemplate["tileTypesMap"];
type TokensMapPart = PartialTemplate["tokensMap"];

interface TemplateSectionProps {
  template: PartialTemplate;
  onChange: (template: PartialTemplate) => void;
  totalTilesCount: number;
}

export const TemplateSection = ({ template, onChange, totalTilesCount }: TemplateSectionProps) => {
  const onTileTypesMapChange = (tileTypesMap: TileTypesMapPart) => {
    onChange({ ...template, tileTypesMap });
  };

  const onTokensMapChange = (tokensMap: TokensMapPart) => {
    onChange({ ...template, tokensMap });
  };

  const allowedTokensCount = useMemo(() => {
    const t = template.tileTypesMap;
    const resourceKeys = [
      "sheep",
      "forest",
      "field",
      "mountain",
      "clay",
      "gold",
    ] as (keyof typeof t)[];
    return resourceKeys.reduce((acc, k) => acc + (t[k] ?? 0), 0);
  }, [template]);

  return (
    <Section
      title="Template"
      description="The template defines which tile types and the amount of each tile type that can be placed on the field by the generator.">
      <Tabs defaultValue="tiles">
        <TabsList className="w-full *:w-full">
          <TabsTrigger value="tiles">Tiles</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>
        <TabsContent value="tiles">
          <TilesTabContent
            tileTypesMap={template.tileTypesMap}
            onChange={onTileTypesMapChange}
            totalTilesCount={totalTilesCount}
          />
        </TabsContent>
        <TabsContent value="tokens">
          <TokensTabContent
            tokensMap={template.tokensMap}
            onChange={onTokensMapChange}
            totalTokensCount={allowedTokensCount}
          />
        </TabsContent>
      </Tabs>
    </Section>
  );
};
