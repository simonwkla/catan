import { type Arith, type Context, init, type Solver } from "z3-solver";
import type { VectorAx as AxialPosition } from "@/lib/2d";
import { Err, Exception, Ok, Result, type Result as ResultType } from "@/lib/std";
import { Field, type ValidField } from "../field";
import type { Template } from "../template";
import { Tile, type ValidTile } from "../tile";
import { type TILE_TYPE_VALUE_TO_INT, TileType } from "../tile-type";
import { Token, type TokenValue } from "../token";

export type RuleKind =
  | "non-empty-field"
  | "valid-field-positions"
  | "unique-field-positions"
  | "matching-template-size"
  | "allowed-tile-types-count"
  | "allowed-tokens-count"
  | "connected-field"
  | "neighbouring-resource-tiles"
  | "neighbouring-tokens"
  | "no-adjacent-6-or-8"
  | "balanced-resource-probabilities"
  | "gold-token-probability"
  | "maximum-pips-per-gold-intersection"
  | "maximum-pips-per-intersection";

export type RuleRequirement = "required" | "optional";
export type RuleVisibility = "hidden" | "visible";
export type RuleCheckPhase = "structure" | "configuration" | "policy";
export type SolverStage = "tile-type" | "token";

export interface RuleConfiguration {
  readonly requirement: RuleRequirement;
  readonly visibility: RuleVisibility;
  readonly checkPhase: RuleCheckPhase;
  readonly defaultEnabled: boolean;
}

export type RuleIssueData =
  | {
      readonly kind: "empty-field";
    }
  | {
      readonly kind: "invalid-position";
      readonly tileIndex: number;
      readonly position: AxialPosition;
    }
  | {
      readonly kind: "duplicate-position";
      readonly position: AxialPosition;
      readonly tileIndices: readonly number[];
    }
  | {
      readonly kind: "tile-count-mismatch";
      readonly configuredCount: number;
      readonly fieldCount: number;
    }
  | {
      readonly kind: "pinned-tile-type-count-exceeded";
      readonly tileType: ValidTile["type"]["value"];
      readonly configuredCount: number;
      readonly pinnedCount: number;
    }
  | {
      readonly kind: "no-allowed-tile-types";
      readonly tileIndex: number;
      readonly position: AxialPosition;
    }
  | {
      readonly kind: "token-resource-count-mismatch";
      readonly configuredTokenCount: number;
      readonly configuredResourceCount: number;
    }
  | {
      readonly kind: "pinned-token-count-exceeded";
      readonly token: TokenValue;
      readonly configuredCount: number;
      readonly pinnedCount: number;
    }
  | {
      readonly kind: "disconnected-field";
      readonly componentCount: number;
    }
  | {
      readonly kind: "adjacent-same-resource";
      readonly tileIndices: readonly [number, number];
      readonly tileType: ValidTile["type"]["value"];
    }
  | {
      readonly kind: "adjacent-same-token";
      readonly tileIndices: readonly [number, number];
      readonly token: TokenValue;
    }
  | {
      readonly kind: "adjacent-6-or-8";
      readonly tileIndices: readonly [number, number];
      readonly tokens: readonly [TokenValue, TokenValue];
    }
  | {
      readonly kind: "gold-token-pips-out-of-range";
      readonly tileIndex: number;
      readonly token: TokenValue;
      readonly pipCount: number;
      readonly minimumPips: number;
      readonly maximumPips: number;
    }
  | {
      readonly kind: "intersection-pips-exceeded";
      readonly tileIndices: readonly [number, number, number];
      readonly pipCount: number;
      readonly maximumPips: number;
    };

export type RuleIssue = RuleIssueData & {
  readonly ruleKind: RuleKind;
};

export interface RuleBase {
  readonly kind: RuleKind;
  readonly name: string;
  readonly description: string;
  readonly configuration: RuleConfiguration;
  check(template: Template, field: Field): readonly RuleIssueData[];
}

export interface ValidationRule extends RuleBase {
  readonly type: "validation";
}

export interface SolverRule extends RuleBase {
  readonly type: "solver";
  readonly solverStage: SolverStage;
  constrain(context: SolverContext<"catan">): void;
}

export type Rule = ValidationRule | SolverRule;

export function isSolverRule(rule: Rule): rule is SolverRule {
  return rule.type === "solver";
}

export class RuleCheckError extends Exception {
  readonly kind = "rule-check-failed" as const;
  readonly issues: readonly RuleIssue[];

  private constructor(issues: readonly RuleIssue[]) {
    super("One or more Catan rules failed their concrete checks.");
    this.issues = [...issues];
  }

  static create(issues: readonly RuleIssue[]): RuleCheckError {
    if (issues.length === 0) {
      throw new Error("Cannot create a rule check error without issues");
    }

    return new RuleCheckError(issues);
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

const TOKEN_NONE = 0;

export class SolverContext<C extends "catan"> {
  private constructor(
    public readonly Z3: Context<C>,
    private _solver: Solver<C>,
    private readonly _typeVars: Arith<C>[],
    private readonly _tokenVars: Arith<C>[],
    private _field: Field,
    public readonly template: Template,
    private readonly randomSeed: number,
  ) {}

  get field(): Field {
    return this._field;
  }

  get solver(): Solver<C> {
    return this._solver;
  }

  get typeVars(): Arith<C>[] {
    return this._typeVars;
  }

  get tokenVars(): Arith<C>[] {
    return this._tokenVars;
  }

  static async create(field: Field, template: Template, randomSeed: number): Promise<SolverContext<"catan">> {
    const { Context } = await init();
    const Z3 = new Context("catan");
    const solver = new Z3.Solver();
    solver.set("random_seed", randomSeed);
    const typeVars = field.tiles.map((tile) => Z3.Int.const(`type-${tile.pos.q}-${tile.pos.r}`));
    const tokenVars = field.tiles.map((tile) => Z3.Int.const(`token-${tile.pos.q}-${tile.pos.r}`));

    return new SolverContext(Z3, solver, typeVars, tokenVars, field, template, randomSeed);
  }

  async solve(rules: readonly SolverRule[], signal: AbortSignal): Promise<ResultType<ValidField, UnsolvableError>> {
    return this.solveCurrent(rules, false, signal);
  }

  /**
   * Solves tile types first and tokens second, reducing the size of each SAT problem.
   */
  async solveTwoStep(
    rules: readonly SolverRule[],
    signal: AbortSignal,
  ): Promise<ResultType<ValidField, UnsolvableError>> {
    const tileTypeRules = rules.filter((rule) => rule.solverStage === "tile-type");
    const tokenRules = rules.filter((rule) => rule.solverStage === "token");

    const [field, error] = (await this.solveCurrent(tileTypeRules, true, signal)).unpack();
    if (error) {
      return Err(error);
    }

    this._field = field;
    this._solver = new this.Z3.Solver();
    this._solver.set("random_seed", this.randomSeed);

    for (let i = 0; i < field.tiles.length; i++) {
      this.solver.add(this.typeVars[i].eq(field.tiles[i].type.int));
    }

    return this.solveCurrent(tokenRules, false, signal);
  }

  private async solveCurrent(
    rules: readonly SolverRule[],
    preserveExistingTokens: boolean,
    signal: AbortSignal,
  ): Promise<ResultType<ValidField, UnsolvableError>> {
    signal.throwIfAborted();
    for (const rule of rules) {
      rule.constrain(this as unknown as SolverContext<"catan">);
      signal.throwIfAborted();
    }

    const interrupt = () => this.Z3.interrupt();
    signal.addEventListener("abort", interrupt, { once: true });

    let result: Awaited<ReturnType<Solver<C>["check"]>>;
    try {
      result = await this.solver.check();
      signal.throwIfAborted();
    } finally {
      signal.removeEventListener("abort", interrupt);
    }
    if (result === "unknown") {
      return Err(UnsolvableError.unknown());
    }
    if (result === "unsat") {
      return Err(UnsolvableError.unsat());
    }

    const model = this.solver.model();
    const field = Field.fromTiles(
      this.field.tiles.map((tile, index) => {
        const typeInt = Number.parseInt(
          model.get(this.typeVars[index]).toString(),
          10,
        ) as (typeof TILE_TYPE_VALUE_TO_INT)[ValidTile["type"]["value"]];
        const type = TileType.fromInt(typeInt);

        const token = preserveExistingTokens
          ? tile.token
          : Result.tryOr(() => {
              const tokenInt = Number.parseInt(model.get(this.tokenVars[index]).toString(), 10);
              return tokenInt === TOKEN_NONE ? null : Token.fromInt(tokenInt as Parameters<typeof Token.fromInt>[0]);
            }, null);

        return Tile.create({ pos: tile.pos, type, token });
      }),
    );

    return Ok(field);
  }
}
