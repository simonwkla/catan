import { match, P } from "ts-pattern";
import type { VectorAx } from "@/lib/vec";
import type { Template } from "./template";
import { TileType } from "./tile-type";
import type { Token } from "./token";

type CondToken<TT extends TileType> = TT extends (typeof TileType.ResourceTileTypes)[number] ? Token : null | Token;

type TileProps<TT extends TileType> = {
  pos: VectorAx;
  type: TT;
  token: CondToken<TT>;
};
/**
 * A Tile is any tile on a hexagonal field even an invalid (placeholder) tile
 */
export class Tile<TT extends TileType = TileType> {
  private constructor(
    readonly pos: VectorAx,
    readonly type: TT,
    readonly token: CondToken<TT>,
  ) {}

  isResource(): this is ResourceTile {
    return this.type.isResource();
  }

  isValid(): this is ValidTile {
    return this.type.isValid();
  }

  private getAllowedSubstitutes(): readonly ValidTile["type"][] {
    return match(this.type.value)
      .with(TileType.Empty.value, () => TileType.ValidTileTypes)
      .with(TileType.Placeholder.value, () => TileType.ValidLandTileTypes)
      .with(P._, () => [this.type as ValidTile["type"]])
      .exhaustive();
  }

  getAllowedSubstitutesForTemplate(template: Template): readonly ValidTile["type"][] {
    return this.getAllowedSubstitutes().filter((t) => template.typeCount(t) > 0);
  }

  static empty(vectorAx: VectorAx): EmptyTile {
    return new Tile(vectorAx, TileType.Empty, null);
  }

  static create<TT extends TileType = TileType>(props: TileProps<TT>): Tile<TT> {
    return new Tile(props.pos, props.type, props.token);
  }
}

export type EmptyTile = Tile<typeof TileType.Empty>;
export type PlaceholderTile = Tile<typeof TileType.Placeholder>;
export type WaterTile = Tile<typeof TileType.Water>;
export type DesertTile = Tile<typeof TileType.Desert>;
export type SheepTile = Tile<typeof TileType.Sheep>;
export type ForestTile = Tile<typeof TileType.Forest>;
export type FieldTile = Tile<typeof TileType.Field>;
export type MountainTile = Tile<typeof TileType.Mountain>;
export type ClayTile = Tile<typeof TileType.Clay>;
export type GoldTile = Tile<typeof TileType.Gold>;

export type ResourceTile = Tile<(typeof TileType.ResourceTileTypes)[number]>;
export type ValidLandTile = Tile<(typeof TileType.ValidLandTileTypes)[number]>;
export type ValidTile = Tile<(typeof TileType.ValidTileTypes)[number]>;
export type AnyTile = ValidTile | EmptyTile | PlaceholderTile;
