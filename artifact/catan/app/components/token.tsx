import { useTexturePack } from "@/components/textures";
import { cn } from "@/lib/cn";
import { Token, type TokenValue } from "@/models";

type TokenSize = "small" | "default" | "board";

const PIP_KEYS = ["pip-1", "pip-2", "pip-3", "pip-4", "pip-5"] as const;

interface TokenComponentProps {
  token?: TokenValue;
  size?: TokenSize;
  className?: string;
}

export function TokenComponent({ token, size = "default", className }: TokenComponentProps) {
  const texturePack = useTexturePack();
  const tokenDefinition = token ? Token.fromValue(token) : null;
  const isEmphasized = tokenDefinition?.pips === 5;
  const color = isEmphasized ? texturePack.token.emphasizedColor : texturePack.token.foregroundColor;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-full border transition-all duration-100",
        size === "small" && "size-6 gap-px",
        size === "default" && "size-9 gap-0.5",
        size === "board" && "size-14 gap-0.5",
        className,
      )}
      style={{
        color,
        backgroundColor: texturePack.token.backgroundColor,
        borderColor: texturePack.token.borderColor,
      }}
    >
      <span
        className={cn(
          "font-bold font-serif leading-none",
          size === "small" && "text-[10px]",
          size === "default" && "text-xs",
          size === "board" && "text-2xl",
        )}
      >
        {tokenDefinition?.int ?? "#"}
      </span>

      {tokenDefinition && (
        <div className="flex gap-px">
          {PIP_KEYS.slice(0, tokenDefinition.pips).map((pipKey) => (
            <div
              key={pipKey}
              className={cn(
                "rounded-full bg-current",
                size === "small" && "size-0.5",
                size === "default" && "size-0.75",
                size === "board" && "size-1",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
