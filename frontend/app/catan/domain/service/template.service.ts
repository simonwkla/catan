import { Template } from "../entity/template";
import { Tile } from "../entity/tile";
import { getEntries } from "@lib/object";

function generateEmptyTemplate(): Template {
  return Template.Empty();
}

/**
 * Calculates how many tokens could be placed on fields with the given template
 */
function calculateAllowedTokensCount(template: Template): number {
  return getEntries(template.tileTypesMap)
    .filter(([type]) => Tile.isResourceType(type))
    .reduce((acc, [, count]) => acc + count, 0);
}

export const TemplateService = {
  generateEmptyTemplate,
  calculateAllowedTokensCount,
};
