import { Field as DomainField } from "@/.server/backend/catan/model/field";
import { Template as DomainTemplate } from "@/.server/backend/catan/model/template";
import { Tile as DomainTile } from "@/.server/backend/catan/model/tile";
import { TileType } from "@/.server/backend/catan/model/tile-type";
import { Token as DomainToken } from "@/.server/backend/catan/model/token";
import { fn, type Result } from "@/lib/std";
import type {
  Field as FrontendField,
  Template as FrontendTemplate,
  Tile as FrontendTile,
  Token as FrontendToken,
  UnsolvableError as FrontendUnsolvableError,
  TileTypeValue,
} from "@/models";
import type { UnsolvableError as DomainUnsolvableError } from "@/models/err";
import { templateApplication } from "../backend/cmd/application";

export const catanBff = {
  createDefaultTemplate: (size: number): [FrontendTemplate, FrontendField] => {
    const [template, field] = templateApplication.createDefaultTemplate(size);
    return [FromDomain.template(template), FromDomain.field(field)];
  },

  solve: async (
    template: FrontendTemplate,
    field: FrontendField,
  ): Promise<Result<FrontendField, FrontendUnsolvableError>> => {
    const [domainTemplate, domainField] = [FromBff.template(template), FromBff.field(field)];
    const result = await templateApplication.solve(domainTemplate, domainField);
    return result.map(FromDomain.field).mapErr(FromDomain.error);
  },
};

const FromDomain = {
  field: (domain: DomainField): FrontendField => ({
    tiles: domain.tiles.map(FromDomain.tile),
  }),

  error: (domain: DomainUnsolvableError): FrontendUnsolvableError => ({
    kind: domain.kind,
    message: domain.message,
    type: domain.type,
  }),

  tile: (domain: DomainTile): FrontendTile => ({
    pos: domain.pos,
    type: domain.type.value,
    token: fn.applyOptional(domain.token, FromDomain.token),
  }),

  token: (domain: DomainToken): FrontendToken => ({
    value: domain.value,
    int: domain.int,
    pips: domain.pips,
    displayName: domain.displayName,
  }),

  template: (domain: DomainTemplate): FrontendTemplate => ({
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

  token: (token: FrontendToken): DomainToken => {
    return DomainToken.fromValue(token.value);
  },

  field: (bff: FrontendField): DomainField => {
    return DomainField.fromTiles(bff.tiles.map(FromBff.tile));
  },

  tile: (bff: FrontendTile): DomainTile => {
    return DomainTile.create({
      pos: bff.pos,
      type: FromBff.tileType(bff.type),
      token: fn.applyOptional(bff.token, FromBff.token),
    });
  },

  template: (bff: FrontendTemplate): DomainTemplate => {
    return DomainTemplate.create(bff.tileTypesMap, bff.tokensMap);
  },
};

export { FromDomain, FromBff };
