import { match } from "ts-pattern";
import type { Field } from "../field";
import type { Template } from "../template";
import {
  BalancedResourceProbabilitiesRule,
  GoldTokenProbabilityRule,
  Maximum7PipsPerGoldIntersectionRule,
  Maximum11PipsPerIntersectionRule,
} from "./definitions/balance.rules";
import { AllowedTileTypesCountRule, AllowedTokensCountRule } from "./definitions/inventory.rules";
import {
  MatchingTemplateSizeRule,
  NonEmptyFieldRule,
  UniqueFieldPositionsRule,
  ValidFieldPositionsRule,
} from "./definitions/structural.rules";
import {
  ConnectedFieldRule,
  NeighbouringResourceTilesRule,
  NeighbouringTokensRule,
  NoAdjacent6Or8Rule,
} from "./definitions/topology.rules";
import type { RuleCheckPhase, RuleIssue, RuleKind, Rule as RuleModel } from "./model";

export * from "./model";

const NON_EMPTY_FIELD = NonEmptyFieldRule.create();
const VALID_FIELD_POSITIONS = ValidFieldPositionsRule.create();
const UNIQUE_FIELD_POSITIONS = UniqueFieldPositionsRule.create();
const MATCHING_TEMPLATE_SIZE = MatchingTemplateSizeRule.create();
const ALLOWED_TILE_TYPES_COUNT = AllowedTileTypesCountRule.create();
const ALLOWED_TOKENS_COUNT = AllowedTokensCountRule.create();
const CONNECTED_FIELD = ConnectedFieldRule.create();
const NEIGHBOURING_RESOURCE_TILES = NeighbouringResourceTilesRule.create();
const NEIGHBOURING_TOKENS = NeighbouringTokensRule.create();
const NO_ADJACENT_6_OR_8 = NoAdjacent6Or8Rule.create();
const BALANCED_RESOURCE_PROBABILITIES = BalancedResourceProbabilitiesRule.create();
const GOLD_TOKEN_PROBABILITY = GoldTokenProbabilityRule.create();
const MAXIMUM_PIPS_PER_GOLD_INTERSECTION = Maximum7PipsPerGoldIntersectionRule.create();
const MAXIMUM_PIPS_PER_INTERSECTION = Maximum11PipsPerIntersectionRule.create();

const ALL = [
  NON_EMPTY_FIELD,
  VALID_FIELD_POSITIONS,
  UNIQUE_FIELD_POSITIONS,
  MATCHING_TEMPLATE_SIZE,
  ALLOWED_TILE_TYPES_COUNT,
  ALLOWED_TOKENS_COUNT,
  CONNECTED_FIELD,
  NEIGHBOURING_RESOURCE_TILES,
  NEIGHBOURING_TOKENS,
  NO_ADJACENT_6_OR_8,
  BALANCED_RESOURCE_PROBABILITIES,
  GOLD_TOKEN_PROBABILITY,
  MAXIMUM_PIPS_PER_GOLD_INTERSECTION,
  MAXIMUM_PIPS_PER_INTERSECTION,
] as const satisfies readonly RuleModel[];

const VISIBLE = ALL.filter((rule) => rule.configuration.visibility === "visible");
const DEFAULT = VISIBLE.filter(
  (rule) => rule.configuration.requirement === "optional" && rule.configuration.defaultEnabled,
);
const CHECK_PHASES: readonly RuleCheckPhase[] = ["structure", "configuration", "policy"];

function fromKind(kind: RuleKind): RuleModel {
  return match(kind)
    .with("non-empty-field", () => NON_EMPTY_FIELD)
    .with("valid-field-positions", () => VALID_FIELD_POSITIONS)
    .with("unique-field-positions", () => UNIQUE_FIELD_POSITIONS)
    .with("matching-template-size", () => MATCHING_TEMPLATE_SIZE)
    .with("allowed-tile-types-count", () => ALLOWED_TILE_TYPES_COUNT)
    .with("allowed-tokens-count", () => ALLOWED_TOKENS_COUNT)
    .with("connected-field", () => CONNECTED_FIELD)
    .with("neighbouring-resource-tiles", () => NEIGHBOURING_RESOURCE_TILES)
    .with("neighbouring-tokens", () => NEIGHBOURING_TOKENS)
    .with("no-adjacent-6-or-8", () => NO_ADJACENT_6_OR_8)
    .with("balanced-resource-probabilities", () => BALANCED_RESOURCE_PROBABILITIES)
    .with("gold-token-probability", () => GOLD_TOKEN_PROBABILITY)
    .with("maximum-pips-per-gold-intersection", () => MAXIMUM_PIPS_PER_GOLD_INTERSECTION)
    .with("maximum-pips-per-intersection", () => MAXIMUM_PIPS_PER_INTERSECTION)
    .exhaustive();
}

function resolve(ruleKinds: readonly RuleKind[]): readonly RuleModel[] {
  const selectedKinds = new Set(ruleKinds);
  return ALL.filter((rule) =>
    match(rule.configuration.requirement)
      .with("required", () => true)
      .with("optional", () => selectedKinds.has(rule.kind))
      .exhaustive(),
  );
}

function check(rules: readonly RuleModel[], template: Template, field: Field): readonly RuleIssue[] {
  for (const phase of CHECK_PHASES) {
    const issues = rules
      .filter((rule) => rule.configuration.checkPhase === phase)
      .flatMap<RuleIssue>((rule) => rule.check(template, field).map((issue) => ({ ...issue, ruleKind: rule.kind })));
    if (issues.length > 0) {
      return issues;
    }
  }

  return [];
}

export const Rule = {
  ALL,
  VISIBLE,
  DEFAULT,
  fromKind,
  resolve,
  check,
} as const;
