import type { TexturePack } from "@/models";
import { CATAN_TEXTURE_PACK } from "../catan";
import { LORE_TEXTURE_PACK } from "../lore";
import { PAINTED_TEXTURE_PACK } from "../painted";

export const TEXTURE_PACKS = {
  catan: CATAN_TEXTURE_PACK,
  lore: LORE_TEXTURE_PACK,
  painted: PAINTED_TEXTURE_PACK,
} as const satisfies Record<string, TexturePack>;

export type TexturePackId = keyof typeof TEXTURE_PACKS;
export type RegisteredTexturePack = (typeof TEXTURE_PACKS)[TexturePackId];

export const TEXTURE_PACK_OPTIONS = Object.values(TEXTURE_PACKS) as readonly RegisteredTexturePack[];
export const DEFAULT_TEXTURE_PACK_ID: TexturePackId = "painted";

export function getTexturePack(texturePackId: TexturePackId): RegisteredTexturePack {
  return TEXTURE_PACKS[texturePackId];
}
