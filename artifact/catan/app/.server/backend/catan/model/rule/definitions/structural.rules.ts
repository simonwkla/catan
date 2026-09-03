import { VectorAx } from "@/lib/2d";
import type { Field } from "../../field";
import type { Template } from "../../template";
import type { RuleConfiguration, RuleIssueData, ValidationRule } from "../model";

const REQUIRED_STRUCTURAL_RULE = {
  requirement: "required",
  visibility: "hidden",
  checkPhase: "structure",
  defaultEnabled: true,
} as const satisfies RuleConfiguration;

const REQUIRED_CONFIGURATION_RULE = {
  ...REQUIRED_STRUCTURAL_RULE,
  checkPhase: "configuration",
} as const satisfies RuleConfiguration;

export class NonEmptyFieldRule implements ValidationRule {
  readonly type = "validation" as const;
  readonly kind = "non-empty-field" as const;
  readonly name = "Non-empty field";
  readonly description = "Requires the field to contain at least one tile.";
  readonly configuration = REQUIRED_STRUCTURAL_RULE;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    return field.tiles.length === 0 ? [{ kind: "empty-field" }] : [];
  }

  static create(): NonEmptyFieldRule {
    return new NonEmptyFieldRule();
  }
}

export class ValidFieldPositionsRule implements ValidationRule {
  readonly type = "validation" as const;
  readonly kind = "valid-field-positions" as const;
  readonly name = "Valid field positions";
  readonly description = "Requires every axial field position to use finite integer coordinates.";
  readonly configuration = REQUIRED_STRUCTURAL_RULE;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    return field.tiles.flatMap<RuleIssueData>((tile, tileIndex) => {
      const isValid =
        Number.isFinite(tile.pos.q) &&
        Number.isInteger(tile.pos.q) &&
        Number.isFinite(tile.pos.r) &&
        Number.isInteger(tile.pos.r);

      return isValid
        ? []
        : [
            {
              kind: "invalid-position",
              tileIndex,
              position: { q: tile.pos.q, r: tile.pos.r },
            },
          ];
    });
  }

  static create(): ValidFieldPositionsRule {
    return new ValidFieldPositionsRule();
  }
}

export class UniqueFieldPositionsRule implements ValidationRule {
  readonly type = "validation" as const;
  readonly kind = "unique-field-positions" as const;
  readonly name = "Unique field positions";
  readonly description = "Requires every tile to have a unique axial position.";
  readonly configuration = REQUIRED_STRUCTURAL_RULE;

  check(_template: Template, field: Field): readonly RuleIssueData[] {
    const positions = new Map<string, { position: { q: number; r: number }; tileIndices: number[] }>();

    for (let tileIndex = 0; tileIndex < field.tiles.length; tileIndex++) {
      const position = field.tiles[tileIndex].pos;
      const key = VectorAx.key(position);
      const existing = positions.get(key);
      if (existing) {
        existing.tileIndices.push(tileIndex);
      } else {
        positions.set(key, {
          position: { q: position.q, r: position.r },
          tileIndices: [tileIndex],
        });
      }
    }

    return Array.from(positions.values())
      .filter(({ tileIndices }) => tileIndices.length > 1)
      .map(({ position, tileIndices }) => ({ kind: "duplicate-position", position, tileIndices }));
  }

  static create(): UniqueFieldPositionsRule {
    return new UniqueFieldPositionsRule();
  }
}

export class MatchingTemplateSizeRule implements ValidationRule {
  readonly type = "validation" as const;
  readonly kind = "matching-template-size" as const;
  readonly name = "Matching template size";
  readonly description = "Requires the field and template to contain the same number of tiles.";
  readonly configuration = REQUIRED_CONFIGURATION_RULE;

  check(template: Template, field: Field): readonly RuleIssueData[] {
    return template.size === field.tiles.length
      ? []
      : [
          {
            kind: "tile-count-mismatch",
            configuredCount: template.size,
            fieldCount: field.tiles.length,
          },
        ];
  }

  static create(): MatchingTemplateSizeRule {
    return new MatchingTemplateSizeRule();
  }
}
