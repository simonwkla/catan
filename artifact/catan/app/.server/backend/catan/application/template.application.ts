import { Field } from "@/.server/backend/catan/model/field";
import { Template } from "@/.server/backend/catan/model/template";
import { AbortableSerialQueue, Err, type Result } from "@/lib/std";
import {
  isSolverRule,
  Rule,
  RuleCheckError,
  type RuleKind,
  SolverContext,
  type UnsolvableError,
} from "../model/rule/index";
import type { Rule as RuleModel } from "../model/rule/model";

const DEFAULT_FIELD_RADIUS = 3;

interface SolveOptions {
  readonly randomSeed: number;
  readonly signal: AbortSignal;
}

export class TemplateApplication {
  private readonly solveQueue = new AbortableSerialQueue();

  createDefaultTemplate = (): [Template, Field] => {
    const field = Field.empty(DEFAULT_FIELD_RADIUS);
    const template = Template.default();
    return [template, field];
  };

  solve = async (
    template: Template,
    field: Field,
    ruleKinds: readonly RuleKind[],
    { randomSeed, signal }: SolveOptions,
  ): Promise<Result<Field, RuleCheckError | UnsolvableError>> => {
    signal.throwIfAborted();

    const rules = Rule.resolve(ruleKinds);
    const issues = Rule.check(rules, template, field);
    if (issues.length > 0) {
      return Err(RuleCheckError.create(issues));
    }

    const solverRules = rules.filter(isSolverRule);
    return this.solveQueue.run(signal, async () => {
      const context = await SolverContext.create(field, template, randomSeed);
      return context.solveTwoStep(solverRules, signal);
    });
  };

  getAllRules = (): readonly RuleModel[] => {
    return Rule.VISIBLE;
  };

  getDefaultRules = (): readonly RuleModel[] => {
    return Rule.DEFAULT;
  };
}
