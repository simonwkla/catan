import { match } from "ts-pattern";
import { Field as DomainField } from "@/.server/backend/catan/model/field";
import type {
  RuleCheckError as DomainRuleCheckError,
  RuleIssue as DomainRuleIssue,
  UnsolvableError as DomainUnsolvableError,
} from "@/.server/backend/catan/model/rule/index";

import type { Rule as DomainRule } from "@/.server/backend/catan/model/rule/model";
import { Template as DomainTemplate } from "@/.server/backend/catan/model/template";
import { Tile as DomainTile } from "@/.server/backend/catan/model/tile";
import { TileType } from "@/.server/backend/catan/model/tile-type";
import { Token as DomainToken } from "@/.server/backend/catan/model/token";
import type { Result } from "@/lib/std";
import type {
  Field as FrontendField,
  GenerateError as FrontendGenerateError,
  Rule as FrontendRule,
  RuleIssue as FrontendRuleIssue,
  Template as FrontendTemplate,
  Tile as FrontendTile,
  GenerationSeed,
  RuleKind,
  TileTypeValue,
} from "@/models";
import { templateApplication } from "../backend/cmd/application";

interface SolveOptions {
  readonly seed: GenerationSeed;
  readonly signal: AbortSignal;
}

export const catanBff = {
  createDefaultTemplate: (): [FrontendTemplate, FrontendField] => {
    const [template, field] = templateApplication.createDefaultTemplate();
    return [FromDomain.template(template), FromDomain.field(field)];
  },

  solve: async (
    template: FrontendTemplate,
    field: FrontendField,
    rules: readonly RuleKind[],
    options: SolveOptions,
  ): Promise<Result<FrontendField, FrontendGenerateError>> => {
    const [domainTemplate, domainField] = [FromBff.template(template), FromBff.field(field)];
    const result = await templateApplication.solve(domainTemplate, domainField, rules, {
      randomSeed: options.seed,
      signal: options.signal,
    });
    return result.map(FromDomain.field).mapErr(FromDomain.error);
  },

  getAllRules: (): readonly FrontendRule[] => {
    return templateApplication.getAllRules().map(FromDomain.rule);
  },

  getDefaultRules: (): readonly FrontendRule[] => {
    return templateApplication.getDefaultRules().map(FromDomain.rule);
  },
};

const FromDomain = {
  field: (domain: DomainField): FrontendField => ({
    tiles: domain.tiles.map(FromDomain.tile),
  }),

  error: (domain: DomainRuleCheckError | DomainUnsolvableError): FrontendGenerateError =>
    match(domain)
      .returnType<FrontendGenerateError>()
      .with({ kind: "rule-check-failed" }, ({ kind, message, issues }) => ({
        kind,
        message,
        issues: issues.map(FromDomain.ruleIssue),
      }))
      .with({ kind: "unsolvable" }, ({ kind, message, type }) => ({ kind, message, type }))
      .exhaustive(),

  ruleIssue: (domain: DomainRuleIssue): FrontendRuleIssue =>
    match(domain)
      .returnType<FrontendRuleIssue>()
      .with({ kind: "empty-field" }, ({ kind, ruleKind }) => ({ kind, ruleKind }))
      .with({ kind: "invalid-position" }, ({ kind, ruleKind, tileIndex, position }) => ({
        kind,
        ruleKind,
        tileIndex,
        position: { q: position.q, r: position.r },
      }))
      .with({ kind: "duplicate-position" }, ({ kind, ruleKind, position, tileIndices }) => ({
        kind,
        ruleKind,
        position: { q: position.q, r: position.r },
        tileIndices: [...tileIndices],
      }))
      .with({ kind: "tile-count-mismatch" }, ({ kind, ruleKind, configuredCount, fieldCount }) => ({
        kind,
        ruleKind,
        configuredCount,
        fieldCount,
      }))
      .with(
        { kind: "pinned-tile-type-count-exceeded" },
        ({ kind, ruleKind, tileType, configuredCount, pinnedCount }) => ({
          kind,
          ruleKind,
          tileType,
          configuredCount,
          pinnedCount,
        }),
      )
      .with({ kind: "no-allowed-tile-types" }, ({ kind, ruleKind, tileIndex, position }) => ({
        kind,
        ruleKind,
        tileIndex,
        position: { q: position.q, r: position.r },
      }))
      .with(
        { kind: "token-resource-count-mismatch" },
        ({ kind, ruleKind, configuredTokenCount, configuredResourceCount }) => ({
          kind,
          ruleKind,
          configuredTokenCount,
          configuredResourceCount,
        }),
      )
      .with({ kind: "pinned-token-count-exceeded" }, ({ kind, ruleKind, token, configuredCount, pinnedCount }) => ({
        kind,
        ruleKind,
        token,
        configuredCount,
        pinnedCount,
      }))
      .with({ kind: "disconnected-field" }, ({ kind, ruleKind, componentCount }) => ({
        kind,
        ruleKind,
        componentCount,
      }))
      .with({ kind: "adjacent-same-resource" }, ({ kind, ruleKind, tileIndices, tileType }) => ({
        kind,
        ruleKind,
        tileIndices: [tileIndices[0], tileIndices[1]],
        tileType,
      }))
      .with({ kind: "adjacent-same-token" }, ({ kind, ruleKind, tileIndices, token }) => ({
        kind,
        ruleKind,
        tileIndices: [tileIndices[0], tileIndices[1]],
        token,
      }))
      .with({ kind: "adjacent-6-or-8" }, ({ kind, ruleKind, tileIndices, tokens }) => ({
        kind,
        ruleKind,
        tileIndices: [tileIndices[0], tileIndices[1]],
        tokens: [tokens[0], tokens[1]],
      }))
      .with(
        { kind: "gold-token-pips-out-of-range" },
        ({ kind, ruleKind, tileIndex, token, pipCount, minimumPips, maximumPips }) => ({
          kind,
          ruleKind,
          tileIndex,
          token,
          pipCount,
          minimumPips,
          maximumPips,
        }),
      )
      .with({ kind: "intersection-pips-exceeded" }, ({ kind, ruleKind, tileIndices, pipCount, maximumPips }) => ({
        kind,
        ruleKind,
        tileIndices: [tileIndices[0], tileIndices[1], tileIndices[2]],
        pipCount,
        maximumPips,
      }))
      .exhaustive(),

  tile: (domain: DomainTile): FrontendTile => ({
    pos: domain.pos,
    type: domain.type.value,
    token: domain.token?.value ?? null,
  }),

  rule: (domain: DomainRule): FrontendRule => ({
    kind: domain.kind,
    name: domain.name,
    description: domain.description,
    requirement: domain.configuration.requirement,
    visibility: domain.configuration.visibility,
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

  field: (bff: FrontendField): DomainField => {
    return DomainField.fromTiles(bff.tiles.map(FromBff.tile));
  },

  tile: (bff: FrontendTile): DomainTile => {
    return DomainTile.create({
      pos: bff.pos,
      type: FromBff.tileType(bff.type),
      token: bff.token ? DomainToken.fromValue(bff.token) : null,
    });
  },

  template: (bff: FrontendTemplate): DomainTemplate => {
    return DomainTemplate.create(bff.tileTypesMap, bff.tokensMap);
  },
};
