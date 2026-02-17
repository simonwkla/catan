import type { Field as DomainField } from "@/.server/backend/catan/model/field";
import { Template as DomainTemplate } from "@/.server/backend/catan/model/template";
import type { Tile as DomainTile } from "@/.server/backend/catan/model/tile";
import { TileType } from "@/.server/backend/catan/model/tile-type";
import { Token as DomainToken } from "@/.server/backend/catan/model/token";
import { fn } from "@/lib/std";
import type {
  Field as CatanField,
  Template as CatanTemplate,
  Tile as CatanTile,
  Token as CatanToken,
  TileTypeValue,
} from "@/models/catan";
import { templateApplication } from "../backend/cmd/application";

export const catanBff = {
  createDefaultTemplate: (size: number): [CatanTemplate, CatanField] => {
    const [template, field] = templateApplication.createDefaultTemplate(size);
    return [FromDomain.template(template), FromDomain.field(field)];
  },
};

const FromDomain = {
  field: (domain: DomainField): CatanField => ({
    tiles: domain.tiles.map(FromDomain.tile),
  }),

  tile: (domain: DomainTile): CatanTile => ({
    pos: domain.pos,
    type: domain.type.value,
    token: fn.applyOptional(domain.token, FromDomain.token),
  }),

  token: (domain: DomainToken): CatanToken => ({
    value: domain.value,
    int: domain.int,
    pips: domain.pips,
    displayName: domain.displayName,
  }),

  template: (domain: DomainTemplate): CatanTemplate => ({
    tileTypesMap: {
      water: domain.typeCount(TileType.Water),
      desert: domain.typeCount(TileType.Desert),
      sheep: domain.typeCount(TileType.Sheep),
      forest: domain.typeCount(TileType.Forest),
      field: domain.typeCount(TileType.Field),
      mountain: domain.typeCount(TileType.Mountain),
      clay: domain.typeCount(TileType.Clay),
      gold: domain.typeCount(TileType.Gold),
    },
    tokensMap: {
      two: domain.tokenCount(DomainToken.Two),
      three: domain.tokenCount(DomainToken.Three),
      four: domain.tokenCount(DomainToken.Four),
      five: domain.tokenCount(DomainToken.Five),
      six: domain.tokenCount(DomainToken.Six),
      eight: domain.tokenCount(DomainToken.Eight),
      nine: domain.tokenCount(DomainToken.Nine),
      ten: domain.tokenCount(DomainToken.Ten),
      eleven: domain.tokenCount(DomainToken.Eleven),
      twelve: domain.tokenCount(DomainToken.Twelve),
    },
  }),
};

const FromBff = {
  tileType: (value: TileTypeValue): TileType => {
    return TileType.fromValue(value);
  },

  token: (token: CatanToken): DomainToken => {
    return DomainToken.fromValue(token.value);
  },

  template: (bff: CatanTemplate): DomainTemplate => {
    return new DomainTemplate(bff.tileTypesMap, bff.tokensMap);
  },
};

export { FromDomain, FromBff };
