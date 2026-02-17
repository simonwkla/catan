import { Hexagon, Map, Maximize } from "lucide-react";
import { useState } from "react";

const SIZES = [
  { value: 1, label: "Small", description: "Compact 7-tile board", icon: <Hexagon className="h-5 w-5" /> },
  { value: 2, label: "Standard", description: "Classic 19-tile Catan board", icon: <Map className="h-5 w-5" /> },
  { value: 3, label: "Large", description: "Expanded 37-tile board", icon: <Maximize className="h-5 w-5" /> },
];

export function GeneralSection() {
  const [size, setSize] = useState(2);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {SIZES.map((s) => (
          <button
            key={s.value}
            onClick={() => setSize(s.value)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
              size === s.value
                ? "border-primary bg-primary/20 text-foreground"
                : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span className={size === s.value ? "text-primary" : "text-muted-foreground"}>{s.icon}</span>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{s.label}</span>
              <span className="text-muted-foreground text-xs">{s.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
