import { describe, expect, it } from "vitest";
import { VectorAx } from "@lib/vectorAx";
import { TileType } from "../../../domain/entity/tile";
import { Token } from "../../../domain/entity/token";
import { Template } from "../../../domain/entity/template";
import { FieldService } from "../../../domain/service/field.service";

function createEmptyTypesMap(): Template["tileTypesMap"] {
  return {
    [TileType.Water]: 0,
    [TileType.Desert]: 0,
    [TileType.Sheep]: 0,
    [TileType.Forest]: 0,
    [TileType.Field]: 0,
    [TileType.Mountain]: 0,
    [TileType.Clay]: 0,
    [TileType.Gold]: 0,
  };
}

function createEmptyTokensMap(): Template["tokensMap"] {
  return {
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
  };
}

describe("generateValidField", () => {
  it("does not change a field without empty or placeholder tiles", () => {
    const tiles = [
      {
        pos: VectorAx.create(0, 0),
        type: TileType.Water,
      },
      {
        pos: VectorAx.create(0, 1),
        type: TileType.Desert,
      },
      {
        pos: VectorAx.create(1, 0),
        type: TileType.Forest,
        token: Token.Ten,
      },
    ];

    const template = {
      tileTypesMap: {
        ...createEmptyTypesMap(),
        [TileType.Water]: 1,
        [TileType.Desert]: 1,
        [TileType.Forest]: 1,
      },
      tokensMap: {
        ...createEmptyTokensMap(),
        [Token.Ten]: 1,
      },
    };

    const field = { tiles };
    const newField = FieldService.generateValidField(field, template);
    expect(newField).toEqual(field);
  });
});
