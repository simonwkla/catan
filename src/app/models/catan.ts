import type { VectorAx } from "@/lib/vec";

// ─── TileType value arrays (single source of truth) ────────────

export const RESOURCE_TILE_TYPES = ["sheep", "forest", "field", "mountain", "clay", "gold"] as const;
export const VALID_LAND_TILE_TYPES = ["desert", ...RESOURCE_TILE_TYPES] as const;
export const VALID_TILE_TYPES = ["water", ...VALID_LAND_TILE_TYPES] as const;

export function isResourceTileType(type: TileTypeValue): type is ResourceTileTypeValue {
  return RESOURCE_TILE_TYPES.includes(type as ResourceTileTypeValue);
}

export function isValidLandTileType(type: TileTypeValue): type is ValidLandTileTypeValue {
  return VALID_LAND_TILE_TYPES.includes(type as ValidLandTileTypeValue);
}

export function isValidTileType(type: TileTypeValue): type is ValidTileTypeValue {
  return VALID_TILE_TYPES.includes(type as ValidTileTypeValue);
}

// ─── TileType value types (derived from arrays) ────────────────

export type ResourceTileTypeValue = (typeof RESOURCE_TILE_TYPES)[number];
export type ValidLandTileTypeValue = (typeof VALID_LAND_TILE_TYPES)[number];
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

export const TILE_TYPE_IMAGES: Partial<Readonly<Record<TileTypeValue, string>>> = {
  clay: "/img/tiles/clay.png",
  desert: "/img/tiles/desert.png",
  field: "/img/tiles/field.png",
  forest: "/img/tiles/forest.png",
  gold: "/img/tiles/gold.png",
  mountain: "/img/tiles/mountain.png",
  sheep: "/img/tiles/sheep.png",
  water: "/img/tiles/water.png",
};

export type TileTypeInfo = { label: string; color: string; icon: string; textColor: string };

export const TILE_TYPE_INFO: Readonly<Record<ValidTileTypeValue, TileTypeInfo>> = {
  water: { label: "Water", color: "#2980b9", icon: "🌊", textColor: "#ffffff" },
  desert: { label: "Desert", color: "#d2b48c", icon: "🏜️", textColor: "#1a1a2e" },
  sheep: { label: "Sheep", color: "#7cb342", icon: "🐑", textColor: "#1a1a2e" },
  forest: { label: "Forest", color: "#2d6a2d", icon: "🌲", textColor: "#ffffff" },
  field: { label: "Field", color: "#d4a843", icon: "🌾", textColor: "#1a1a2e" },
  mountain: { label: "Mountain", color: "#5c5c6e", icon: "⛰️", textColor: "#ffffff" },
  clay: { label: "Clay", color: "#b5451b", icon: "🧱", textColor: "#ffffff" },
  gold: { label: "Gold", color: "#ffd700", icon: "💰", textColor: "#1a1a2e" },
};

export type TokenValue = "two" | "three" | "four" | "five" | "six" | "eight" | "nine" | "ten" | "eleven" | "twelve";

export type Token = {
  readonly value: TokenValue;
  readonly int: number;
  readonly pips: number;
  readonly displayName: string;
};

export const ALL_TOKENS: readonly Token[] = [
  { value: "two", int: 2, pips: 1, displayName: "2" },
  { value: "three", int: 3, pips: 2, displayName: "3" },
  { value: "four", int: 4, pips: 3, displayName: "4" },
  { value: "five", int: 5, pips: 4, displayName: "5" },
  { value: "six", int: 6, pips: 5, displayName: "6" },
  { value: "eight", int: 8, pips: 5, displayName: "8" },
  { value: "nine", int: 9, pips: 4, displayName: "9" },
  { value: "ten", int: 10, pips: 3, displayName: "10" },
  { value: "eleven", int: 11, pips: 2, displayName: "11" },
  { value: "twelve", int: 12, pips: 1, displayName: "12" },
];

export function tokenFromValue(value: TokenValue): Token {
  const token = ALL_TOKENS.find((t) => t.value === value);
  if (!token) {
    throw new Error(`Unknown token value: ${value}`);
  }
  return token;
}

export type Tile = {
  readonly pos: VectorAx;
  readonly type: TileTypeValue;
  readonly token: Token | null;
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
      kind: "select";
    }
  | {
      kind: "tile";
      type: ValidTileTypeValue;
    }
  | {
      kind: "token";
      token: Token;
    }
  | {
      kind: "eraser";
    };
