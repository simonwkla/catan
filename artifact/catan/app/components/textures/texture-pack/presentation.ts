import type { CSSProperties } from "react";
import type { TextureImagePresentation } from "@/models";

function transform(presentation?: TextureImagePresentation): string | undefined {
  const transforms: string[] = [];

  if (presentation?.rotationDeg !== undefined) {
    transforms.push(`rotate(${presentation.rotationDeg}deg)`);
  }
  if (presentation?.scale !== undefined) {
    transforms.push(`scale(${presentation.scale})`);
  }

  return transforms.length > 0 ? transforms.join(" ") : undefined;
}

function image(presentation?: TextureImagePresentation): CSSProperties {
  return {
    objectFit: presentation?.fit,
    objectPosition: presentation?.position,
    transform: transform(presentation),
  };
}

function background(presentation?: TextureImagePresentation): CSSProperties {
  return {
    backgroundPosition: presentation?.position,
    backgroundSize: presentation?.fit,
    transform: transform(presentation),
  };
}

export const TextureStyle = {
  image,
  background,
} as const;
