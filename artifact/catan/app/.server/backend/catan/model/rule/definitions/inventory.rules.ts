import type { Field } from "../../field";
import type { Template } from "../../template";
import { TileType } from "../../tile-type";
import { Token, type TokenValue } from "../../token";
import type { RuleConfiguration, RuleIssueData, SolverContext, SolverRule } from "../model";

const REQUIRED_INVENTORY_RULE = {
  requirement: "required",
  visibility: "hidden",
  checkPhase: "configuration",
  defaultEnabled: true,
} as const satisfies RuleConfiguration;

function allTokens(template: Template): readonly Token[] {
  return (Object.keys(template.tokensMap) as TokenValue[]).map(Token.fromValue);
}

export class AllowedTileTypesCountRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "allowed-tile-types-count" as const;
  readonly name = "Allowed tile types count";
  readonly description =
    "Ensures that tile types are allowed by each field slot and match the counts configured by the template.";
  readonly configuration = REQUIRED_INVENTORY_RULE;
  readonly solverStage = "tile-type" as const;

  check(template: Template, field: Field): readonly RuleIssueData[] {
    const issues: RuleIssueData[] = [];

    for (const tileType of TileType.ValidTileTypes) {
      const configuredCount = template.typeCount(tileType);
      const pinnedCount = field.tileCountByType(tileType);
      if (pinnedCount > configuredCount) {
        issues.push({
          kind: "pinned-tile-type-count-exceeded",
          tileType: tileType.value,
          configuredCount,
          pinnedCount,
        });
      }
    }

    for (let tileIndex = 0; tileIndex < field.tiles.length; tileIndex++) {
      const tile = field.tiles[tileIndex];
      if (tile.getAllowedSubstitutesForTemplate(template).length === 0) {
        issues.push({
          kind: "no-allowed-tile-types",
          tileIndex,
          position: { q: tile.pos.q, r: tile.pos.r },
        });
      }
    }

    return issues;
  }

  constrain({ Z3, solver, field, template, typeVars }: SolverContext<"catan">): void {
    for (let index = 0; index < field.tiles.length; index++) {
      const allowedTypes = field.tiles[index].getAllowedSubstitutesForTemplate(template).map((type) => type.int);

      if (allowedTypes.length === 0) {
        solver.add(typeVars[index].neq(typeVars[index]));
      } else if (allowedTypes.length === 1) {
        solver.add(typeVars[index].eq(allowedTypes[0]));
      } else {
        solver.add(Z3.Or(...allowedTypes.map((type) => typeVars[index].eq(type))));
      }
    }

    for (const tileType of TileType.ValidTileTypes) {
      const indicators = typeVars.map(
        // biome-ignore lint/suspicious/noExplicitAny: z3's conditional arithmetic type cannot be inferred here
        (variable) => Z3.If(variable.eq(tileType.int), Z3.Int.val(1), Z3.Int.val(0)) as any,
      );
      const count = indicators.reduce((sum, indicator) => sum.add(indicator), Z3.Int.val(0));
      solver.add(count.eq(template.typeCount(tileType)));
    }
  }

  static create(): AllowedTileTypesCountRule {
    return new AllowedTileTypesCountRule();
  }
}

export class AllowedTokensCountRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "allowed-tokens-count" as const;
  readonly name = "Allowed tokens count";
  readonly description = "Ensures that tokens match the template counts and are placed only on resource tiles.";
  readonly configuration = REQUIRED_INVENTORY_RULE;
  readonly solverStage = "token" as const;

  check(template: Template, field: Field): readonly RuleIssueData[] {
    const issues: RuleIssueData[] = [];
    const configuredResourceCount = TileType.ResourceTileTypes.reduce(
      (count, tileType) => count + template.typeCount(tileType),
      0,
    );
    const configuredTokenCount = Object.values(template.tokensMap).reduce((count, tokenCount) => count + tokenCount, 0);

    if (configuredTokenCount !== configuredResourceCount) {
      issues.push({
        kind: "token-resource-count-mismatch",
        configuredTokenCount,
        configuredResourceCount,
      });
    }

    for (const token of allTokens(template)) {
      const configuredCount = template.tokenCount(token);
      const pinnedCount = field.tileCountByToken(token);
      if (pinnedCount > configuredCount) {
        issues.push({
          kind: "pinned-token-count-exceeded",
          token: token.value,
          configuredCount,
          pinnedCount,
        });
      }
    }

    return issues;
  }

  constrain({ Z3, solver, field, template, typeVars, tokenVars }: SolverContext<"catan">): void {
    const resourceTypeInts = TileType.ResourceTileTypes.map((type) => type.int);
    const nonResourceTypeInts = TileType.NonResourceValidTileTypes.map((type) => type.int);
    const allowedTokens = template.getAllowedTokens();

    for (let index = 0; index < field.tiles.length; index++) {
      const tile = field.tiles[index];
      if (tile.isValid() && tile.isResource() && tile.token) {
        solver.add(tokenVars[index].eq(tile.token.int));
        continue;
      }
      if (tile.isValid() && !tile.isResource()) {
        solver.add(tokenVars[index].eq(0));
        continue;
      }

      const isResource = Z3.Or(...resourceTypeInts.map((value) => typeVars[index].eq(value)));
      const isNonResource = Z3.Or(...nonResourceTypeInts.map((value) => typeVars[index].eq(value)));
      solver.add(Z3.Or(isResource, isNonResource));
      solver.add(Z3.Implies(isNonResource, tokenVars[index].eq(0)));

      if (allowedTokens.length === 0) {
        solver.add(Z3.Implies(isResource, tokenVars[index].neq(tokenVars[index])));
      } else {
        solver.add(Z3.Implies(isResource, Z3.Or(...allowedTokens.map((token) => tokenVars[index].eq(token.int)))));
      }
    }

    for (const token of allTokens(template)) {
      const indicators = tokenVars.map(
        // biome-ignore lint/suspicious/noExplicitAny: z3's conditional arithmetic type cannot be inferred here
        (variable) => Z3.If(variable.eq(token.int), Z3.Int.val(1), Z3.Int.val(0)) as any,
      );
      const count = indicators.reduce((sum, indicator) => sum.add(indicator), Z3.Int.val(0));
      solver.add(count.eq(template.tokenCount(token)));
    }
  }

  static create(): AllowedTokensCountRule {
    return new AllowedTokensCountRule();
  }
}
