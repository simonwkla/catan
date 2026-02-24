import { Rand, type Seed } from "@/lib/std";
import { createContext, useCallback, useContext, useState, type PropsWithChildren } from "react";

interface SeedContext {
    seed: Seed;
    updateSeed: () => void;
}

const seedContext = createContext<SeedContext>({
    seed: Rand.seed(),
    updateSeed: () => {},
});

export function SeedProvider({ seed: initialSeed, children }: PropsWithChildren<{ seed: Seed }>) {
    const [seed, setSeed] = useState<Seed>(initialSeed);

    const updateSeed = useCallback(() => {
        setSeed(Rand.seed());
    }, []);

    return <seedContext.Provider value={{ seed, updateSeed }}>{children}</seedContext.Provider>;
}

export function useSeed() {
    const context = useContext(seedContext);
    if (!context) {
        throw new Error("useSeed must be used within a SeedProvider");
    }

    return context.seed;
}

export function useUpdateSeed() {
    const context = useContext(seedContext);
    if (!context) {
        throw new Error("useUpdateSeed must be used within a SeedProvider");
    }

    return context.updateSeed;
}