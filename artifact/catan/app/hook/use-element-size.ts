import { useEffect, useRef, useState } from "react";

export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

export function useElementSize<Element extends HTMLElement>() {
  const ref = useRef<Element>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      setSize((current) => (current.width === next.width && current.height === next.height ? current : next));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}
