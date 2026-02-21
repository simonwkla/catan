import { cn } from "@/lib/cn";
import type { Token } from "@/models";

export function Token({ token, className }: { token: Token; className?: string }) {
  const isRed = token.pips === 5;

  return (
    <div
      className={cn(
        "flex h-9 w-9 flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-100",
        className,
      )}
    >
      <span className={cn("font-bold font-serif text-foreground text-xs", isRed && "text-destructive")}>
        {token.int}
      </span>

      <div className="flex gap-px">
        {Array.from({ length: token.pips }).map((_, _i) => (
          <div className={cn("h-[3px] w-[3px] rounded-full bg-foreground/60", isRed && "bg-destructive")} />
        ))}
      </div>
    </div>
  );
}
