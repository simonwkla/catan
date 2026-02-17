const TileTypeValue = {
  Empty: "empty",
  Placeholder: "placeholder",
  Water: "water",
  Desert: "desert",
  Sheep: "sheep",
  Forest: "forest",
  Field: "field",
  Mountain: "mountain",
  Clay: "clay",
  Gold: "gold",
} as const;
type TileTypeValue = (typeof TileTypeValue)[keyof typeof TileTypeValue];

const TILE_TYPE_VALUE_TO_INT = {
  [TileTypeValue.Empty]: 0,
  [TileTypeValue.Placeholder]: 1,
  [TileTypeValue.Water]: 2,
  [TileTypeValue.Desert]: 3,
  [TileTypeValue.Sheep]: 4,
  [TileTypeValue.Forest]: 5,
  [TileTypeValue.Field]: 6,
  [TileTypeValue.Mountain]: 7,
  [TileTypeValue.Clay]: 8,
  [TileTypeValue.Gold]: 9,
} as const;

// biome-ignore lint/suspicious/noExplicitAny: no other way to do this
type DistributeTile<T extends TileTypeValue> = T extends any ? TileType<T> : never;

export class TileType<TT extends TileTypeValue = TileTypeValue> {
  readonly value: TT;

  private constructor(tt: TT) {
    this.value = tt;
  }

  get int(): (typeof TILE_TYPE_VALUE_TO_INT)[TT] {
    return TILE_TYPE_VALUE_TO_INT[this.value];
  }

  isValid(): this is TileType<(typeof TileType.ValidTileTypes)[number]["value"]> {
    return TileType.ValidTileTypes.some((t) => t.eq(this));
  }

  isResource(): this is TileType<(typeof TileType.ResourceTileTypes)[number]["value"]> {
    return TileType.ResourceTileTypes.some((t) => t.eq(this));
  }

  eq(other: TileType): boolean {
    return other.value === this.value;
  }

  static fromValue<TT extends TileTypeValue>(value: TT): DistributeTile<TT> {
    return new TileType(value) as DistributeTile<TT>;
  }

  static Empty: TileType<typeof TileTypeValue.Empty> = new TileType(TileTypeValue.Empty);
  static Placeholder: TileType<typeof TileTypeValue.Placeholder> = new TileType(TileTypeValue.Placeholder);
  static Water: TileType<typeof TileTypeValue.Water> = new TileType(TileTypeValue.Water);
  static Desert: TileType<typeof TileTypeValue.Desert> = new TileType(TileTypeValue.Desert);
  static Sheep: TileType<typeof TileTypeValue.Sheep> = new TileType(TileTypeValue.Sheep);
  static Forest: TileType<typeof TileTypeValue.Forest> = new TileType(TileTypeValue.Forest);
  static Field: TileType<typeof TileTypeValue.Field> = new TileType(TileTypeValue.Field);
  static Mountain: TileType<typeof TileTypeValue.Mountain> = new TileType(TileTypeValue.Mountain);
  static Clay: TileType<typeof TileTypeValue.Clay> = new TileType(TileTypeValue.Clay);
  static Gold: TileType<typeof TileTypeValue.Gold> = new TileType(TileTypeValue.Gold);

  static ResourceTileTypes = [
    TileType.Sheep,
    TileType.Forest,
    TileType.Field,
    TileType.Mountain,
    TileType.Clay,
    TileType.Gold,
  ] as const;

  static NonResourceValidTileTypes = [TileType.Water, TileType.Desert] as const;

  static ValidLandTileTypes = [TileType.Desert, ...TileType.ResourceTileTypes] as const;

  static ValidTileTypes = [TileType.Water, ...TileType.ValidLandTileTypes] as const;
}
