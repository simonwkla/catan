import type { Template } from "../domain/entity/template";
import { TemplateService } from "../domain/service/template.service";

function generateEmptyTemplate(): Template {
  return TemplateService.generateEmptyTemplate();
}

function calculateAllowedTokensCount(template: Template): number {
  return TemplateService.calculateAllowedTokensCount(template);
}

export const TemplateApplication = {
  generateEmptyTemplate,
  calculateAllowedTokensCount,
};
