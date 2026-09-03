import { createContext, type PropsWithChildren, useContext } from "react";
import type { Seed } from "@/lib/std";

const SeedContext = createContext<Seed | null>(null);

export function SeedProvider({ seed, children }: PropsWithChildren<{ seed: Seed }>) {
  return <SeedContext.Provider value={seed}>{children}</SeedContext.Provider>;
}

export function useSeed() {
  const seed = useContext(SeedContext);
  if (!seed) {
    throw new Error("useSeed must be used within a SeedProvider");
  }

  return seed;
}
