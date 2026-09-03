import { hash, Rand } from "@/lib/std";
import type { Field, RuleKind, Template } from "./catan";
import { Token, VALID_TILE_TYPES } from "./catan";

export type GenerationSeed = number;

export interface GenerationInput {
  readonly field: Field;
  readonly template: Template;
  readonly rules: readonly RuleKind[];
}

export interface GenerationRequest extends GenerationInput {
  readonly seed: GenerationSeed;
}

function createSource({ field, template, rules }: GenerationInput): string {
  const source = {
    version: 1,
    field: [...field.tiles]
      .sort((left, right) => left.pos.q - right.pos.q || left.pos.r - right.pos.r)
      .map((tile) => [tile.pos.q, tile.pos.r, tile.type, tile.token]),
    tileTypes: VALID_TILE_TYPES.map((type) => [type, template.tileTypesMap[type]]),
    tokens: Token.all.map((token) => [token.value, template.tokensMap[token.value]]),
    rules: [...rules].sort(),
  };

  return JSON.stringify(source);
}

function createSourceHash(input: GenerationInput): string {
  return hash.string(createSource(input));
}

function createSeed(): GenerationSeed {
  return Rand.seed()[0];
}

function isSeed(value: unknown): value is GenerationSeed {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 0xffffffff;
}

export const Generation = {
  createSeed,
  isSeed,
  createSourceHash,
} as const;
