import { TileType, ValidTile } from "./tile";
import { Token } from "./token";
import { fromEntries, getEntries } from "@lib/object";
import { Field } from "./field";

type TileTypesMap = Readonly<Record<ValidTile["type"], number>>;
type TokensMap = Readonly<Record<Token, number>>;

export interface Template {
  readonly tileTypesMap: TileTypesMap;
  readonly tokensMap: TokensMap;
}

export interface PartialTemplate {
  readonly tileTypesMap: Partial<TileTypesMap>;
  readonly tokensMap: Partial<TokensMap>;
}

/**
 * Returns the size which is the total number of tiles in the template
 */
function getSize(template: Template): number {
  return Object.values(template.tileTypesMap).reduce((p, c) => p + c, 0);
}

/**
 * A field is compatible when it has the same size as the template,
 * and it does not contain more tokens or tiles of one type than are allowed
 * by the template.
 */
function isCompatibleWithField(template: Template, field: Field): boolean {
  if (getSize(template) !== field.tiles.length) return false;

  const hasCompatibleTiles = getEntries(template.tileTypesMap).every(
    ([tileType, count]) => Field.countTilesByType(field, tileType) <= count,
  );
  const hasCompatibleTokens = getEntries(template.tokensMap).every(
    ([token, count]) => Field.countTilesByToken(field, token) <= count,
  );
  return hasCompatibleTiles && hasCompatibleTokens;
}

/**
 * returns all tile types that are not present in their full capacity on the field because of empty or placeholder tiles
 */
function getUnsetTileTypes(template: Template, field: Field): ValidTile["type"][] {
  if (!isCompatibleWithField(template, field)) {
    throw new Error("field is not compatible with template");
  }

  return getEntries(template.tileTypesMap)
    .filter(([tileType, count]) => Field.countTilesByType(field, tileType) < count)
    .map(([tileType]) => tileType);
}

/**
 * returns all tokens that are not present in their full capacity on the field because of empty or placeholder tiles
 */
function getUnsetTokens(template: Template, field: Field): Token[] {
  if (!isCompatibleWithField(template, field)) {
    throw new Error("field is not compatible with template");
  }

  return getEntries(template.tokensMap)
    .filter(([token, count]) => Field.countTilesByToken(field, token) < count)
    .map(([token]) => token);
}

function Empty(): Template {
  return {
    tileTypesMap: {
      [TileType.Water]: 0,
      [TileType.Desert]: 0,
      [TileType.Sheep]: 0,
      [TileType.Forest]: 0,
      [TileType.Field]: 0,
      [TileType.Mountain]: 0,
      [TileType.Clay]: 0,
      [TileType.Gold]: 0,
    },
    tokensMap: {
      [Token.Two]: 0,
      [Token.Three]: 0,
      [Token.Four]: 0,
      [Token.Five]: 0,
      [Token.Six]: 0,
      [Token.Eight]: 0,
      [Token.Nine]: 0,
      [Token.Ten]: 0,
      [Token.Eleven]: 0,
      [Token.Twelve]: 0,
    },
  };
}
export const Template = {
  isCompatibleWithField,
  getUnsetTileTypes,
  getUnsetTokens,
  Empty,
};

function toTemplate(template: PartialTemplate): Template {
  const emptyTemplate = Empty();
  const tileTypesMap = fromEntries(
    getEntries(emptyTemplate.tileTypesMap).map(([tileType, count]) => {
      return [tileType, template.tileTypesMap[tileType] || count];
    }),
  );
  const tokensMap = fromEntries(
    getEntries(emptyTemplate.tokensMap).map(([token, count]) => {
      return [token, template.tokensMap[token] || count];
    }),
  );
  return {
    tileTypesMap,
    tokensMap,
  };
}

export const PartialTemplate = {
  toTemplate,
};