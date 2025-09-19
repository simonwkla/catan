import { FieldService } from "../domain/service/field.service";
import { Field as DomainField, Field } from "../domain/entity/field";
import type { Template } from "../domain/entity/template";
import type { Tile } from "../domain/entity/tile";

function generateEmptyField(radius: number): Field {
  return FieldService.generateEmptyField(radius);
}

function generateValidField(field: Field, template: Template): Field {
  return FieldService.generateValidField(field, template);
}

function replaceTile(field: Field, tile: Tile, replacement: Tile): Field {
  return Field.replaceTile(field, tile, replacement);
}

export const FieldApplication = {
  generateEmptyField,
  generateValidField,
  replaceTile,
};
