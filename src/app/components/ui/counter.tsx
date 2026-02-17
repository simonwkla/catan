import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "./button";

interface CounterProps {
  count: number;
  onChange: (count: number) => void;
  min?: number;
  max?: number;
}

export function Counter({ count, onChange, min = 0, max = Number.POSITIVE_INFINITY }: CounterProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="secondary"
        size="icon-xs"
        onClick={() => onChange(Math.max(min, count - 1))}
        disabled={count <= min}
      >
        <MinusIcon />
      </Button>
      <span className="w-8 text-center text-sm tabular-nums">{count}</span>
      <Button
        variant="secondary"
        size="icon-xs"
        onClick={() => onChange(Math.min(max, count + 1))}
        disabled={count >= max}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
