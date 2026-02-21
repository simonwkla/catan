import { obj } from "@/lib/std";
import type { Field } from "./field";
import type { ValidTile } from "./tile";
import { TileType } from "./tile-type";
import { Token } from "./token";

type TileTypesMap = Readonly<Record<ValidTile["type"]["value"], number>>;
type TokensMap = Readonly<Record<Token["value"], number>>;

export class Template {
  private constructor(
    readonly tileTypesMap: TileTypesMap,
    readonly tokensMap: TokensMap,
  ) {}

  static create(tileTypesMap: TileTypesMap, tokensMap: TokensMap): Template {
    return new Template(tileTypesMap, tokensMap);
  }

  get size(): number {
    return Object.values(this.tileTypesMap).reduce((p, c) => p + c, 0);
  }

  typeCount(tileType: ValidTile["type"]): number {
    return this.tileTypesMap[tileType.value];
  }

  tokenCount(token: Token): number {
    return this.tokensMap[token.value];
  }

  getAllowedTokens(): readonly Token[] {
    return obj
      .getEntries(this.tokensMap)
      .filter(([_, count]) => count > 0)
      .map(([token]) => Token.fromValue(token));
  }

  getAllowedResourceTileTypes(): readonly ValidTile["type"][] {
    return TileType.ResourceTileTypes.filter((t) => this.typeCount(t) > 0);
  }

  isCompatibleWithField(field: Field): boolean {
    if (this.size !== field.tiles.length) {
      return false;
    }

    const hasCompatibleTiles = obj
      .getEntries(this.tileTypesMap)
      .every(([tileType, count]) => field.tileCountByType(TileType.fromValue(tileType)) <= count);
    const hasCompatibleTokens = obj
      .getEntries(this.tokensMap)
      .every(([token, count]) => field.tileCountByToken(Token.fromValue(token)) <= count);
    return hasCompatibleTiles && hasCompatibleTokens;
  }

  getUnsetTileTypes(field: Field): readonly ValidTile["type"][] {
    if (!this.isCompatibleWithField(field)) {
      throw new Error("field is not compatible with template");
    }

    return obj
      .getEntries(this.tileTypesMap)
      .filter(([tileType, count]) => field.tileCountByType(TileType.fromValue(tileType)) < count)
      .map(([tileType]) => TileType.fromValue(tileType));
  }

  /**
   * returns all tokens that are not present in their full capacity on the field because of empty or placeholder tiles
   */
  getUnsetTokens(field: Field): readonly Token[] {
    if (!this.isCompatibleWithField(field)) {
      throw new Error("field is not compatible with template");
    }

    return obj
      .getEntries(this.tokensMap)
      .filter(([token, count]) => field.tileCountByToken(Token.fromValue(token)) < count)
      .map(([token]) => Token.fromValue(token));
  }

  static default(field: Field): Template {
    const tileCount = field.tiles.length;
    const desertCount = 1;
    const landSlots = tileCount - desertCount;
    const perType = Math.floor(landSlots / TileType.ResourceTileTypes.length);
    let remaining = landSlots - perType * TileType.ResourceTileTypes.length;

    function nextResourceCount(): number {
      const count = perType + (remaining > 0 ? 1 : 0);
      if (remaining > 0) {
        remaining--;
      }
      return count;
    }

    const tileTypesMap: Record<ValidTile["type"]["value"], number> = {
      water: 0,
      desert: desertCount,
      sheep: nextResourceCount(),
      forest: nextResourceCount(),
      field: nextResourceCount(),
      mountain: nextResourceCount(),
      clay: nextResourceCount(),
      gold: nextResourceCount(),
    };

    const tokensMap: Record<Token["value"], number> = {
      two: 1,
      three: 2,
      four: 2,
      five: 2,
      six: 2,
      eight: 2,
      nine: 2,
      ten: 2,
      eleven: 2,
      twelve: 1,
    };

    return new Template(tileTypesMap, tokensMap);
  }
}
