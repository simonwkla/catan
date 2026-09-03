import type { VectorAx } from "@/lib/2d";

// ─── TileType value arrays (single source of truth) ────────────

export const RESOURCE_TILE_TYPES = ["sheep", "forest", "field", "mountain", "clay", "gold"] as const;
const VALID_LAND_TILE_TYPES = ["desert", ...RESOURCE_TILE_TYPES] as const;
export const VALID_TILE_TYPES = ["water", ...VALID_LAND_TILE_TYPES] as const;

export function isResourceTileType(type: TileTypeValue): type is ResourceTileTypeValue {
  return RESOURCE_TILE_TYPES.includes(type as ResourceTileTypeValue);
}

// ─── TileType value types (derived from arrays) ────────────────

export type ResourceTileTypeValue = (typeof RESOURCE_TILE_TYPES)[number];
export type ValidTileTypeValue = (typeof VALID_TILE_TYPES)[number];
export type TileTypeValue = "empty" | "placeholder" | ValidTileTypeValue;

export const TILE_TYPE_DISPLAY_NAMES: Readonly<Record<TileTypeValue, string>> = {
  empty: "Empty",
  placeholder: "Placeholder",
  water: "Water",
  desert: "Desert",
  sheep: "Sheep",
  forest: "Forest",
  field: "Field",
  mountain: "Mountain",
  clay: "Clay",
  gold: "Gold",
};

export type TokenValue = "two" | "three" | "four" | "five" | "six" | "eight" | "nine" | "ten" | "eleven" | "twelve";

export type Token = {
  readonly value: TokenValue;
  readonly int: number;
  readonly pips: number;
};

const ALL_TOKENS: readonly Token[] = [
  { value: "two", int: 2, pips: 1 },
  { value: "three", int: 3, pips: 2 },
  { value: "four", int: 4, pips: 3 },
  { value: "five", int: 5, pips: 4 },
  { value: "six", int: 6, pips: 5 },
  { value: "eight", int: 8, pips: 5 },
  { value: "nine", int: 9, pips: 4 },
  { value: "ten", int: 10, pips: 3 },
  { value: "eleven", int: 11, pips: 2 },
  { value: "twelve", int: 12, pips: 1 },
];

function tokenFromValue(value: TokenValue): Token {
  const token = ALL_TOKENS.find((candidate) => candidate.value === value);
  if (!token) {
    throw new Error(`Unknown token value: ${value}`);
  }
  return token;
}

export const Token = {
  all: ALL_TOKENS,
  fromValue: tokenFromValue,
} as const;

export type Tile = {
  readonly pos: VectorAx;
  readonly type: TileTypeValue;
  readonly token: TokenValue | null;
};

export type Field = {
  readonly tiles: readonly Tile[];
};

export type Template = {
  readonly tileTypesMap: Readonly<Record<ValidTileTypeValue, number>>;
  readonly tokensMap: Readonly<Record<TokenValue, number>>;
};

export type Brush =
  | {
      kind: "add-slot";
    }
  | {
      kind: "tile";
      type: ValidTileTypeValue;
    }
  | {
      kind: "token";
      token: TokenValue;
    }
  | {
      kind: "eraser";
    }
  | {
      kind: "delete-slot";
    };

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

export type Rule = {
  readonly kind: RuleKind;
  readonly name: string;
  readonly description: string;
  readonly requirement: "required" | "optional";
  readonly visibility: "hidden" | "visible";
};
