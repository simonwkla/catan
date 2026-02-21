import { type Arith, type Context, init, type Solver } from "z3-solver";
import { Err, Exception, Ok, type Result } from "@/lib/std";
import { Field, type ValidField } from "./field";
import type { Template } from "./template";
import { Tile, type ValidTile } from "./tile";
import { type TILE_TYPE_VALUE_TO_INT, TileType } from "./tile-type";
import { Token } from "./token";

export class SolverContext<C extends "catan"> {
  private constructor(
    public readonly Z3: Context<C>,
    public readonly solver: Solver<C>,
    public readonly field: Field,
    public readonly template: Template,
    public readonly typeVars: Arith<C>[],
    public readonly tokenVars: Arith<C>[],
  ) {}

  static async create(field: Field, template: Template): Promise<SolverContext<"catan">> {
    const { Context } = await init();

    const Z3 = new Context("catan");

    const solver = new Z3.Solver();

    const typeVars = field.tiles.map((tile) => Z3.Int.const(`type-${tile.pos.q}-${tile.pos.r}`));
    const tokenVars = field.tiles.map((tile) => Z3.Int.const(`token-${tile.pos.q}-${tile.pos.r}`));

    return new SolverContext(Z3, solver, field, template, typeVars, tokenVars);
  }

  async solve(rules: Rule[]): Promise<Result<ValidField, UnsolvableError>> {
    for (const rule of rules) {
      rule.apply(this);
    }

    const result = await this.solver.check();

    if (result === "unknown") {
      return Err(UnsolvableError.unknown());
    }

    if (result === "unsat") {
      return Err(UnsolvableError.unsat());
    }

    const model = this.solver.model();

    const field = Field.fromTiles(
      this.field.tiles.map((tile, i) => {
        const typeInt = Number.parseInt(
          model.get(this.typeVars[i]).toString(),
          10,
        ) as (typeof TILE_TYPE_VALUE_TO_INT)[ValidTile["type"]["value"]];
        const tokenInt = Number.parseInt(model.get(this.tokenVars[i]).toString(), 10) as Parameters<
          typeof Token.fromInt
        >[0];

        const type = TileType.fromInt(typeInt);
        const token = Token.fromInt(tokenInt);

        return Tile.create({ pos: tile.pos, type, token });
      }),
    );

    return Ok(field);
  }
}

export class UnsolvableError extends Exception {
  readonly kind = "unsolvable" as const;

  private constructor(
    readonly type: "unknown" | "unsat",
    message: string,
  ) {
    super(message);
  }

  static unknown(): UnsolvableError {
    return new UnsolvableError("unknown", "Satisfiability could not be determined.");
  }

  static unsat(): UnsolvableError {
    return new UnsolvableError("unsat", "With the selected rules the given template is unsatisfiable.");
  }
}

interface Rule {
  name: string;
  description: string;
  apply: <Context extends "catan">(context: SolverContext<Context>) => void;
}

class ApplyRuleError extends Error {}

class NoAllowedTileTypesError extends ApplyRuleError {
  readonly tile: Tile;
  readonly template: Template;
  constructor(tile: Tile, template: Template) {
    super("No allowed tile types exist for a tile given the template");
    this.tile = tile;
    this.template = template;
  }
}

const AllowedTileTypesCountRule: Rule = {
  name: "Allowed tile types count",
  description:
    "Ensures that the number of tiles of each allowed tile type is equal to the number of tiles of that type in the template.",
  apply: ({ Z3, solver, field, template, typeVars }): void => {
    for (let i = 0; i < field.tiles.length; i++) {
      const tile = field.tiles[i];
      /**
       * Get with which tile types this tile is allowed to be set.
       */
      const allowedTypes = tile.getAllowedSubstitutesForTemplate(template).map((t) => t.int);
      if (allowedTypes.length === 0) {
        throw new NoAllowedTileTypesError(tile, template);
      }

      // if there is only one allowed type, we can pin it immediately
      if (allowedTypes.length === 1) {
        solver.add(typeVars[i].eq(allowedTypes[0]));
      } else {
        // otherwise, we need to allow any of the allowed types
        const allowedTypeExpr = allowedTypes.map((tt) => typeVars[i].eq(tt));
        solver.add(Z3.Or(...allowedTypeExpr));
      }
    }

    // Global count constraints for tile types
    for (const tt of TileType.ValidTileTypes) {
      const targetCount = template.typeCount(tt);
      // biome-ignore lint/suspicious/noExplicitAny: no other way to do this
      const indicators = typeVars.map((v) => Z3.If(v.eq(tt.int), Z3.Int.val(1), Z3.Int.val(0)) as any);
      const sum = indicators.reduce((acc, x) => acc.add(x), Z3.Int.val(0));
      solver.add(sum.eq(targetCount));
    }
  },
};

const TOKEN_NONE = 0;

const AllowedTokensCountRule: Rule = {
  name: "Allowed tokens count",
  description:
    "Ensures that the number of tokens is equal to the number of tokens in the template and that tokens are only placed on resource tiles.",
  apply: ({ Z3, solver, field, template, typeVars, tokenVars }): void => {
    for (let i = 0; i < field.tiles.length; i++) {
      const tile = field.tiles[i];
      // fixed resource tile with fixed token
      if (tile.isValid() && tile.isResource() && tile.token) {
        solver.add(tokenVars[i].eq(tile.token.int));
        continue;
      }
      // water or desert tile that should not have a token
      if (tile.isValid() && !tile.isResource()) {
        solver.add(tokenVars[i].eq(TOKEN_NONE));
        continue;
      }

      const resourceInts = TileType.ResourceTileTypes.map((t) => t.int);
      const nonResourceInts = TileType.NonResourceValidTileTypes.map((t) => t.int);

      const isResource = Z3.Or(...resourceInts.map((v) => typeVars[i].eq(v)));
      const isNonResource = Z3.Or(...nonResourceInts.map((v) => typeVars[i].eq(v)));

      // type must be either resource or non-resource
      // TODO: can be removed?
      solver.add(Z3.Or(isResource, isNonResource));
      // token == NONE when non-resource
      solver.add(Z3.Implies(isNonResource, tokenVars[i].eq(TOKEN_NONE)));

      // token must be in the allowed template tokens when resource
      const allowedTokenExprs = template.getAllowedTokens().map((t) => tokenVars[i].eq(t.int));

      // If no tokens configured, resource cannot be chosen; counts will guard this. Still keep a guard to avoid empty Or
      if (allowedTokenExprs.length > 0) {
        solver.add(Z3.Implies(isResource, Z3.Or(...allowedTokenExprs)));
      }
    }

    // global count constraints for tokens
    for (const tk of Token.All) {
      const targetCount = template.tokenCount(tk);
      const tkInt = tk.int;
      // biome-ignore lint/suspicious/noExplicitAny: no other way to do this
      const indicators = tokenVars.map((v) => Z3.If(v.eq(tkInt), Z3.Int.val(1), Z3.Int.val(0)) as any);
      const sum = indicators.reduce((acc, x) => acc.add(x), Z3.Int.val(0));
      solver.add(sum.eq(targetCount));
    }
  },
};

const NeighbouringResourceTilesRule: Rule = {
  name: "Neighbouring resource tiles cannot have same resource",
  description: "Ensures that neighbouring resource tiles cannot have same resource",
  apply: ({ Z3, solver, field, typeVars }): void => {
    const neighbours = field.getNeighbouringIndices();
    const isResource = (idx: number) => Z3.Or(...TileType.ResourceTileTypes.map((t) => typeVars[idx].eq(t.int)));

    for (const [i, j] of neighbours) {
      solver.add(Z3.Implies(Z3.And(isResource(i), isResource(j)), typeVars[i].neq(typeVars[j])));
    }
  },
};

const NeighbouringTokensRule: Rule = {
  name: "Neighbouring tiles cannot have same token",
  description: "Ensures that neighbouring tiles cannot have same token",
  apply: ({ Z3, solver, field, tokenVars }): void => {
    const neighbours = field.getNeighbouringIndices();
    for (const [i, j] of neighbours) {
      solver.add(
        Z3.Implies(Z3.And(tokenVars[i].neq(TOKEN_NONE), tokenVars[j].neq(TOKEN_NONE)), tokenVars[i].neq(tokenVars[j])),
      );
    }
  },
};

const NoAdjacent6Or8Rule: Rule = {
  name: "No adjacent 6 or 8",
  description: "Ensures that no adjacent 6 or 8 are placed on the field",
  apply: <C extends "catan">({ Z3, solver, field, tokenVars }: SolverContext<C>): void => {
    const neighbours = field.getNeighbouringIndices();
    const isHigh = (v: Arith<C>) => Z3.Or(v.eq(Token.Six.int), v.eq(Token.Eight.int));
    for (const [i, j] of neighbours) {
      solver.add(Z3.Not(Z3.And(isHigh(tokenVars[i]), isHigh(tokenVars[j]))));
    }
  },
};

const BalancedResourceProbabilitiesRule: Rule = {
  name: "Balanced resource probabilities",
  description: "Ensures that the probabilities over the same resource as balanced",
  apply: <C extends "catan">({ Z3, solver, field, template, typeVars, tokenVars }: SolverContext<C>): void => {
    const pipExpr = (v: Arith<C>) => {
      let expr = Z3.Int.val(0);
      for (const tk of Token.All) {
        expr = Z3.If(v.eq(tk.int), Z3.Int.val(tk.pips), expr);
      }
      return expr;
    };

    const resourceTypes = template.getAllowedResourceTileTypes();
    // sum of pips for each resource type
    const pipSumByResource = new Map<ValidTile["type"], Arith<C>>();
    for (const rt of resourceTypes) {
      let sum: Arith<C> = Z3.Int.val(0);
      for (let i = 0; i < field.tiles.length; i++) {
        sum = sum.add(Z3.If(typeVars[i].eq(rt.int), pipExpr(tokenVars[i]), Z3.Int.val(0)));
      }
      pipSumByResource.set(rt, sum);
    }

    // for each pair of resource types, ensure that the difference in pips is at most 1
    const resList = Array.from(pipSumByResource.entries());
    for (let a = 0; a < resList.length; a++) {
      for (let b = a + 1; b < resList.length; b++) {
        const sa = resList[a][1];
        const sb = resList[b][1];
        const diff = sa.sub(sb);
        solver.add(diff.le(1));
        solver.add(diff.ge(-1));
      }
    }
  },
};

const Maximum11PipsPerIntersectionRule: Rule = {
  name: "Maximum 11 pips per intersection",
  description: "Ensures that the sum of pips for each intersection is at most 11",
  apply: <C extends "catan">({ Z3, solver, field, tokenVars }: SolverContext<C>): void => {
    const pipExpr = (v: Arith<C>) => {
      let expr = Z3.Int.val(0);
      for (const tk of Token.All) {
        expr = Z3.If(v.eq(tk.int), Z3.Int.val(tk.pips), expr);
      }
      return expr;
    };

    for (const [i, j, k] of field.getIntersectionsIndices()) {
      const s = pipExpr(tokenVars[i]).add(pipExpr(tokenVars[j])).add(pipExpr(tokenVars[k]));
      solver.add(s.le(11));
    }
  },
};

export const DefaultRules: Rule[] = [
  AllowedTileTypesCountRule,
  AllowedTokensCountRule,
  NeighbouringResourceTilesRule,
  NeighbouringTokensRule,
  NoAdjacent6Or8Rule,
  BalancedResourceProbabilitiesRule,
  Maximum11PipsPerIntersectionRule,
];
