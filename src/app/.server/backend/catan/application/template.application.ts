import { Field } from "@/.server/backend/catan/model/field";
import { Template } from "@/.server/backend/catan/model/template";
import type { Result } from "@/lib/std";
import { Rule, type RuleKind, SolverContext, type UnsolvableError } from "../model/rule";

export class TemplateApplication {
  createDefaultTemplate = (size: number): [Template, Field] => {
    const field = Field.empty(size);
    const template = Template.default(field);
    return [template, field];
  };

  solve = async (
    template: Template,
    field: Field,
    ruleKinds: readonly RuleKind[],
  ): Promise<Result<Field, UnsolvableError>> => {
    const rules = ruleKinds.map(Rule.fromKind);
    const context = await SolverContext.create(field, template);
    return context.solve(rules);
  };

  getAllRules = (): readonly Rule[] => {
    return Rule.ALL;
  };

  getDefaultRules = (): readonly Rule[] => {
    return Rule.DEFAULT;
  };
}
