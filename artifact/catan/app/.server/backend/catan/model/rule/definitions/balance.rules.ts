import type { Arith } from "z3-solver";
import type { Field } from "../../field";
import type { Template } from "../../template";
import type { ValidTile } from "../../tile";
import { TileType } from "../../tile-type";
import { Token } from "../../token";
import type { RuleConfiguration, RuleIssueData, SolverContext, SolverRule } from "../model";

const DEFAULT_POLICY_RULE = {
  requirement: "optional",
  visibility: "visible",
  checkPhase: "policy",
  defaultEnabled: true,
} as const satisfies RuleConfiguration;

function pipExpression(Z3: SolverContext<"catan">["Z3"], variable: Arith<"catan">): Arith<"catan"> {
  let expression: Arith<"catan"> = Z3.Int.val(0);
  for (const token of Token.All) {
    expression = Z3.If(variable.eq(token.int), Z3.Int.val(token.pips), expression);
  }
  return expression;
}

export class BalancedResourceProbabilitiesRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "balanced-resource-probabilities" as const;
  readonly name = "Balanced resource probabilities";
  readonly description = "Keeps total token probability balanced across configured resource types.";
  readonly configuration = DEFAULT_POLICY_RULE;
  readonly solverStage = "token" as const;

  check(_template: Template, _field: Field): readonly RuleIssueData[] {
    return [];
  }

  constrain({ Z3, solver, field, template, typeVars, tokenVars }: SolverContext<"catan">): void {
    const pipsByTile = tokenVars.map((variable) => pipExpression(Z3, variable));
    const pipSumByResource = new Map<ValidTile["type"], Arith<"catan">>();
    const standardResourceTypes = template
      .getAllowedResourceTileTypes()
      .filter((resourceType) => !resourceType.eq(TileType.Gold));

    for (const resourceType of standardResourceTypes) {
      let sum: Arith<"catan"> = Z3.Int.val(0);
      for (let index = 0; index < field.tiles.length; index++) {
        sum = sum.add(Z3.If(typeVars[index].eq(resourceType.int), pipsByTile[index], Z3.Int.val(0)));
      }
      pipSumByResource.set(resourceType, sum);
    }

    const resources = Array.from(pipSumByResource.values());
    for (let left = 0; left < resources.length; left++) {
      for (let right = left + 1; right < resources.length; right++) {
        const difference = resources[left].sub(resources[right]);
        solver.add(difference.le(1));
        solver.add(difference.ge(-1));
      }
    }

    if (template.typeCount(TileType.Gold) > 1) {
      const goldPipBandStart = Z3.Int.const("gold-pip-band-start");

      // A shared two-value band is equivalent to every pair of Gold tiles differing by at most one pip.
      for (let index = 0; index < field.tiles.length; index++) {
        solver.add(
          Z3.Implies(
            typeVars[index].eq(TileType.Gold.int),
            Z3.And(pipsByTile[index].ge(goldPipBandStart), pipsByTile[index].le(goldPipBandStart.add(1))),
          ),
        );
      }
    }
  }

  static create(): BalancedResourceProbabilitiesRule {
    return new BalancedResourceProbabilitiesRule();
  }
}

const MINIMUM_GOLD_TOKEN_PIPS = 3;
const MAXIMUM_GOLD_TOKEN_PIPS = 4;

export class GoldTokenProbabilityRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "gold-token-probability" as const;
  readonly name = "Gold token probability";
  readonly description = "Requires each Gold tile's token to have between 3 and 4 pips.";
  readonly configuration = DEFAULT_POLICY_RULE;
  readonly solverStage = "token" as const;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    return field.tiles.flatMap<RuleIssueData>((tile, tileIndex) => {
      if (!tile.type.eq(TileType.Gold) || !tile.token) {
        return [];
      }

      const pipCount = tile.token.pips;
      return pipCount >= MINIMUM_GOLD_TOKEN_PIPS && pipCount <= MAXIMUM_GOLD_TOKEN_PIPS
        ? []
        : [
            {
              kind: "gold-token-pips-out-of-range",
              tileIndex,
              token: tile.token.value,
              pipCount,
              minimumPips: MINIMUM_GOLD_TOKEN_PIPS,
              maximumPips: MAXIMUM_GOLD_TOKEN_PIPS,
            },
          ];
    });
  }

  constrain({ Z3, solver, field, template, typeVars, tokenVars }: SolverContext<"catan">): void {
    if (template.typeCount(TileType.Gold) === 0) {
      return;
    }

    for (let index = 0; index < field.tiles.length; index++) {
      const pips = pipExpression(Z3, tokenVars[index]);
      solver.add(
        Z3.Implies(
          typeVars[index].eq(TileType.Gold.int),
          Z3.And(pips.ge(MINIMUM_GOLD_TOKEN_PIPS), pips.le(MAXIMUM_GOLD_TOKEN_PIPS)),
        ),
      );
    }
  }

  static create(): GoldTokenProbabilityRule {
    return new GoldTokenProbabilityRule();
  }
}

const MAXIMUM_GOLD_INTERSECTION_PIPS = 6;

export class Maximum7PipsPerGoldIntersectionRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "maximum-pips-per-gold-intersection" as const;
  readonly name = `Maximum ${MAXIMUM_GOLD_INTERSECTION_PIPS} pips per Gold intersection`;
  readonly description =
    `Ensures that token pips meeting at an intersection containing Gold total at most ${MAXIMUM_GOLD_INTERSECTION_PIPS}.`;
  readonly configuration = DEFAULT_POLICY_RULE;
  readonly solverStage = "token" as const;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    return field.getIntersectionsIndices().flatMap<RuleIssueData>((tileIndices) => {
      const containsGold = tileIndices.some((tileIndex) => field.tiles[tileIndex].type.eq(TileType.Gold));
      if (!containsGold) {
        return [];
      }

      const pipCount = tileIndices.reduce((sum, tileIndex) => sum + (field.tiles[tileIndex].token?.pips ?? 0), 0);
      return pipCount > MAXIMUM_GOLD_INTERSECTION_PIPS
        ? [
            {
              kind: "intersection-pips-exceeded",
              tileIndices,
              pipCount,
              maximumPips: MAXIMUM_GOLD_INTERSECTION_PIPS,
            },
          ]
        : [];
    });
  }

  constrain({ Z3, solver, field, template, typeVars, tokenVars }: SolverContext<"catan">): void {
    if (template.typeCount(TileType.Gold) === 0) {
      return;
    }

    for (const [first, second, third] of field.getIntersectionsIndices()) {
      const containsGold = Z3.Or(
        typeVars[first].eq(TileType.Gold.int),
        typeVars[second].eq(TileType.Gold.int),
        typeVars[third].eq(TileType.Gold.int),
      );
      const pipCount = pipExpression(Z3, tokenVars[first])
        .add(pipExpression(Z3, tokenVars[second]))
        .add(pipExpression(Z3, tokenVars[third]));
      solver.add(Z3.Implies(containsGold, pipCount.le(MAXIMUM_GOLD_INTERSECTION_PIPS)));
    }
  }

  static create(): Maximum7PipsPerGoldIntersectionRule {
    return new Maximum7PipsPerGoldIntersectionRule();
  }
}

const MAXIMUM_INTERSECTION_PIPS = 11;

export class Maximum11PipsPerIntersectionRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "maximum-pips-per-intersection" as const;
  readonly name = `Maximum ${MAXIMUM_INTERSECTION_PIPS} pips per intersection`;
  readonly description =
    `Ensures that the token pips meeting at each intersection total at most ${MAXIMUM_INTERSECTION_PIPS}.`;
  readonly configuration = DEFAULT_POLICY_RULE;
  readonly solverStage = "token" as const;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    return field.getIntersectionsIndices().flatMap<RuleIssueData>((tileIndices) => {
      const pipCount = tileIndices.reduce((sum, tileIndex) => sum + (field.tiles[tileIndex].token?.pips ?? 0), 0);
      return pipCount > MAXIMUM_INTERSECTION_PIPS
        ? [
            {
              kind: "intersection-pips-exceeded",
              tileIndices,
              pipCount,
              maximumPips: MAXIMUM_INTERSECTION_PIPS,
            },
          ]
        : [];
    });
  }

  constrain({ Z3, solver, field, tokenVars }: SolverContext<"catan">): void {
    for (const [first, second, third] of field.getIntersectionsIndices()) {
      const pipCount = pipExpression(Z3, tokenVars[first])
        .add(pipExpression(Z3, tokenVars[second]))
        .add(pipExpression(Z3, tokenVars[third]));
      solver.add(pipCount.le(MAXIMUM_INTERSECTION_PIPS));
    }
  }

  static create(): Maximum11PipsPerIntersectionRule {
    return new Maximum11PipsPerIntersectionRule();
  }
}
