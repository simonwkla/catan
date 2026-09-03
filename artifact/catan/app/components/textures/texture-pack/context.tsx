import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import {
  DEFAULT_TEXTURE_PACK_ID,
  getTexturePack,
  type RegisteredTexturePack,
  TEXTURE_PACK_OPTIONS,
  type TexturePackId,
} from "./registry";

interface TexturePackContextValue {
  activeTexturePackId: TexturePackId;
  activeTexturePack: RegisteredTexturePack;
  texturePacks: readonly RegisteredTexturePack[];
  selectTexturePack: (texturePackId: TexturePackId) => void;
}

const TexturePackContext = createContext<TexturePackContextValue | null>(null);

export function TexturePackProvider({
  children,
  initialTexturePackId = DEFAULT_TEXTURE_PACK_ID,
}: PropsWithChildren<{ initialTexturePackId?: TexturePackId }>) {
  const [activeTexturePackId, setActiveTexturePackId] = useState<TexturePackId>(initialTexturePackId);
  const selectTexturePack = useCallback((texturePackId: TexturePackId) => {
    setActiveTexturePackId(texturePackId);
  }, []);
  const activeTexturePack = getTexturePack(activeTexturePackId);
  const value = useMemo(
    () => ({ activeTexturePackId, activeTexturePack, texturePacks: TEXTURE_PACK_OPTIONS, selectTexturePack }),
    [activeTexturePackId, activeTexturePack, selectTexturePack],
  );

  return <TexturePackContext.Provider value={value}>{children}</TexturePackContext.Provider>;
}

export function useTexturePackContext() {
  const context = useContext(TexturePackContext);

  if (!context) {
    throw new Error("useTexturePackContext must be used within a TexturePackProvider");
  }

  return context;
}

export function useTexturePack() {
  return useTexturePackContext().activeTexturePack;
}
