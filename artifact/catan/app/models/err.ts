import type { VectorAx } from "@/lib/2d";
import type { RuleKind, TokenValue, ValidTileTypeValue } from "./catan";

export type Exception = {
  readonly kind: string;
  readonly message: string;
};

export type UnsolvableError = Exception & {
  readonly kind: "unsolvable";
  readonly type: "unknown" | "unsat";
};

export type RuleIssue =
  | {
      readonly kind: "empty-field";
      readonly ruleKind: RuleKind;
    }
  | {
      readonly kind: "invalid-position";
      readonly ruleKind: RuleKind;
      readonly tileIndex: number;
      readonly position: VectorAx;
    }
  | {
      readonly kind: "duplicate-position";
      readonly ruleKind: RuleKind;
      readonly position: VectorAx;
      readonly tileIndices: readonly number[];
    }
  | {
      readonly kind: "tile-count-mismatch";
      readonly ruleKind: RuleKind;
      readonly configuredCount: number;
      readonly fieldCount: number;
    }
  | {
      readonly kind: "pinned-tile-type-count-exceeded";
      readonly ruleKind: RuleKind;
      readonly tileType: ValidTileTypeValue;
      readonly configuredCount: number;
      readonly pinnedCount: number;
    }
  | {
      readonly kind: "no-allowed-tile-types";
      readonly ruleKind: RuleKind;
      readonly tileIndex: number;
      readonly position: VectorAx;
    }
  | {
      readonly kind: "token-resource-count-mismatch";
      readonly ruleKind: RuleKind;
      readonly configuredTokenCount: number;
      readonly configuredResourceCount: number;
    }
  | {
      readonly kind: "pinned-token-count-exceeded";
      readonly ruleKind: RuleKind;
      readonly token: TokenValue;
      readonly configuredCount: number;
      readonly pinnedCount: number;
    }
  | {
      readonly kind: "disconnected-field";
      readonly ruleKind: RuleKind;
      readonly componentCount: number;
    }
  | {
      readonly kind: "adjacent-same-resource";
      readonly ruleKind: RuleKind;
      readonly tileIndices: readonly [number, number];
      readonly tileType: ValidTileTypeValue;
    }
  | {
      readonly kind: "adjacent-same-token";
      readonly ruleKind: RuleKind;
      readonly tileIndices: readonly [number, number];
      readonly token: TokenValue;
    }
  | {
      readonly kind: "adjacent-6-or-8";
      readonly ruleKind: RuleKind;
      readonly tileIndices: readonly [number, number];
      readonly tokens: readonly [TokenValue, TokenValue];
    }
  | {
      readonly kind: "gold-token-pips-out-of-range";
      readonly ruleKind: RuleKind;
      readonly tileIndex: number;
      readonly token: TokenValue;
      readonly pipCount: number;
      readonly minimumPips: number;
      readonly maximumPips: number;
    }
  | {
      readonly kind: "intersection-pips-exceeded";
      readonly ruleKind: RuleKind;
      readonly tileIndices: readonly [number, number, number];
      readonly pipCount: number;
      readonly maximumPips: number;
    };

export type RuleCheckError = Exception & {
  readonly kind: "rule-check-failed";
  readonly issues: readonly RuleIssue[];
};

export type GenerateError = RuleCheckError | UnsolvableError;
