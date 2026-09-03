import type { Arith } from "z3-solver";
import { AxialGrid } from "@/lib/2d";
import type { Field } from "../../field";
import type { Template } from "../../template";
import { TileType } from "../../tile-type";
import { Token } from "../../token";
import type { RuleConfiguration, RuleIssueData, SolverContext, SolverRule, ValidationRule } from "../model";

const DEFAULT_POLICY_RULE = {
  requirement: "optional",
  visibility: "visible",
  checkPhase: "policy",
  defaultEnabled: true,
} as const satisfies RuleConfiguration;

export class ConnectedFieldRule implements ValidationRule {
  readonly type = "validation" as const;
  readonly kind = "connected-field" as const;
  readonly name = "Connected field";
  readonly description = "Requires all field tiles to form one edge-connected component.";
  readonly configuration = DEFAULT_POLICY_RULE;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    const componentCount = AxialGrid.componentCount(field.tiles.map((tile) => tile.pos));
    return componentCount > 1 ? [{ kind: "disconnected-field", componentCount }] : [];
  }

  static create(): ConnectedFieldRule {
    return new ConnectedFieldRule();
  }
}

export class NeighbouringResourceTilesRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "neighbouring-resource-tiles" as const;
  readonly name = "Neighbouring resource tiles cannot have the same resource";
  readonly description = "Ensures that neighbouring resource tiles have different resource types.";
  readonly configuration = DEFAULT_POLICY_RULE;
  readonly solverStage = "tile-type" as const;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    return field.getNeighbouringIndices().flatMap<RuleIssueData>(([leftIndex, rightIndex]) => {
      const left = field.tiles[leftIndex];
      const right = field.tiles[rightIndex];
      if (left.isValid() && left.isResource() && right.isValid() && right.isResource() && left.type.eq(right.type)) {
        return [
          {
            kind: "adjacent-same-resource",
            tileIndices: [leftIndex, rightIndex],
            tileType: left.type.value,
          },
        ];
      }

      return [];
    });
  }

  constrain({ Z3, solver, field, typeVars }: SolverContext<"catan">): void {
    const isResource = (index: number) =>
      Z3.Or(...TileType.ResourceTileTypes.map((type) => typeVars[index].eq(type.int)));

    for (const [leftIndex, rightIndex] of field.getNeighbouringIndices()) {
      solver.add(
        Z3.Implies(
          Z3.And(isResource(leftIndex), isResource(rightIndex)),
          typeVars[leftIndex].neq(typeVars[rightIndex]),
        ),
      );
    }
  }

  static create(): NeighbouringResourceTilesRule {
    return new NeighbouringResourceTilesRule();
  }
}

export class NeighbouringTokensRule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "neighbouring-tokens" as const;
  readonly name = "Neighbouring tiles cannot have the same token";
  readonly description = "Ensures that neighbouring numbered tiles have different tokens.";
  readonly configuration = DEFAULT_POLICY_RULE;
  readonly solverStage = "token" as const;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    return field.getNeighbouringIndices().flatMap<RuleIssueData>(([leftIndex, rightIndex]) => {
      const leftToken = field.tiles[leftIndex].token;
      const rightToken = field.tiles[rightIndex].token;
      return leftToken && rightToken && leftToken.eq(rightToken)
        ? [
            {
              kind: "adjacent-same-token",
              tileIndices: [leftIndex, rightIndex],
              token: leftToken.value,
            },
          ]
        : [];
    });
  }

  constrain({ Z3, solver, field, tokenVars }: SolverContext<"catan">): void {
    for (const [leftIndex, rightIndex] of field.getNeighbouringIndices()) {
      solver.add(
        Z3.Implies(
          Z3.And(tokenVars[leftIndex].neq(0), tokenVars[rightIndex].neq(0)),
          tokenVars[leftIndex].neq(tokenVars[rightIndex]),
        ),
      );
    }
  }

  static create(): NeighbouringTokensRule {
    return new NeighbouringTokensRule();
  }
}

export class NoAdjacent6Or8Rule implements SolverRule {
  readonly type = "solver" as const;
  readonly kind = "no-adjacent-6-or-8" as const;
  readonly name = "No adjacent 6 or 8";
  readonly description = "Ensures that no 6 or 8 tokens are adjacent.";
  readonly configuration = DEFAULT_POLICY_RULE;
  readonly solverStage = "token" as const;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    const isHighProbability = (token: Token | null): token is Token =>
      token !== null && (token.eq(Token.Six) || token.eq(Token.Eight));

    return field.getNeighbouringIndices().flatMap<RuleIssueData>(([leftIndex, rightIndex]) => {
      const leftToken = field.tiles[leftIndex].token;
      const rightToken = field.tiles[rightIndex].token;
      return isHighProbability(leftToken) && isHighProbability(rightToken)
        ? [
            {
              kind: "adjacent-6-or-8",
              tileIndices: [leftIndex, rightIndex],
              tokens: [leftToken.value, rightToken.value],
            },
          ]
        : [];
    });
  }

  constrain({ Z3, solver, field, tokenVars }: SolverContext<"catan">): void {
    const isHighProbability = (variable: Arith<"catan">) =>
      Z3.Or(variable.eq(Token.Six.int), variable.eq(Token.Eight.int));

    for (const [leftIndex, rightIndex] of field.getNeighbouringIndices()) {
      solver.add(Z3.Not(Z3.And(isHighProbability(tokenVars[leftIndex]), isHighProbability(tokenVars[rightIndex]))));
    }
  }

  static create(): NoAdjacent6Or8Rule {
    return new NoAdjacent6Or8Rule();
  }
}
