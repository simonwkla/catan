import { RESOURCE_TILE_TYPES, type Template as TemplateValue, type TokenValue, type ValidTileTypeValue } from "./catan";

export type Template = TemplateValue;

function setTileTypeCount(template: TemplateValue, type: ValidTileTypeValue, count: number): TemplateValue {
  const next = Math.max(0, count);
  if (template.tileTypesMap[type] === next) {
    return template;
  }

  return {
    ...template,
    tileTypesMap: { ...template.tileTypesMap, [type]: next },
  };
}

function setTokenCount(template: TemplateValue, token: TokenValue, count: number): TemplateValue {
  const next = Math.max(0, count);
  if (template.tokensMap[token] === next) {
    return template;
  }

  return {
    ...template,
    tokensMap: { ...template.tokensMap, [token]: next },
  };
}

function getTileCount(template: TemplateValue): number {
  return Object.values(template.tileTypesMap).reduce((sum, count) => sum + count, 0);
}

function getResourceCount(template: TemplateValue): number {
  return RESOURCE_TILE_TYPES.reduce((sum, type) => sum + template.tileTypesMap[type], 0);
}

function getTokenCount(template: TemplateValue): number {
  return Object.values(template.tokensMap).reduce((sum, count) => sum + count, 0);
}

function getTokenResourceCounts(template: TemplateValue): { tokenCount: number; resourceTilesCount: number } {
  return {
    tokenCount: getTokenCount(template),
    resourceTilesCount: getResourceCount(template),
  };
}

export const Template = {
  setTileTypeCount,
  setTokenCount,
  getTileCount,
  getTokenResourceCounts,
} as const;
