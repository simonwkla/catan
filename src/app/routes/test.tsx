// test.tsx

import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { obj, Rand, type Seed } from "@/lib/std";
import { colors } from "./colors";
import { treeSprite } from "./tree";

export default function Test() {
  const [debug, setDebug] = useState(false);
  const [lighting, setLighting] = useState(true);

  const [seed, setSeed] = useState<Seed>(Rand.seed());

  useEffect(() => {
    color_palette();
    drawCanvas({ debug, lighting, seed });

    return () => {
      document.getElementById("content")?.replaceChildren();
      document.getElementById("color-palette")?.replaceChildren();
    };
  }, [debug, lighting, seed]);

  return (
    <main className="relative flex h-screen w-screen" id="main">
      <Card className="absolute top-0 right-0 w-md">
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal" className="max-w-sm">
              <FieldContent>
                <FieldLabel htmlFor="switch-debug">Debug</FieldLabel>
                <FieldDescription>Enable debug mode</FieldDescription>
              </FieldContent>
              <Switch id="switch-debug" checked={debug} onCheckedChange={setDebug} />
            </Field>
            <Field orientation="horizontal" className="max-w-sm">
              <FieldContent>
                <FieldLabel htmlFor="switch-lighting">Lighting</FieldLabel>
                <FieldDescription>Enable lighting effect</FieldDescription>
              </FieldContent>
              <Switch id="switch-lighting" checked={lighting} onCheckedChange={setLighting} />
            </Field>
            <Field orientation="horizontal" className="max-w-sm">
              <FieldContent>
                <FieldLabel htmlFor="input-seed">Seed</FieldLabel>
                <FieldDescription>Seed for the tree</FieldDescription>
              </FieldContent>
              <Button id="button-seed" onClick={() => setSeed(Rand.seed())}>
                <RefreshCcwIcon className="size-4" />
                Change seed
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <section className="absolute top-0 left-0" id="color-palette" />
      <section className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" id="content" />
    </main>
  );
}

function drawCanvas({ debug = false, lighting = false, seed }: { debug?: boolean; lighting?: boolean; seed?: Seed }) {
  const c = document.createElement("canvas");
  c.width = 24 * 4;
  c.height = 24 * 4;
  c.style.width = `${c.width * 5}px`;
  c.style.height = `${c.height * 5}px`;
  c.style.imageRendering = "pixelated";

  const parent = document.getElementById("content");
  if (!parent) {
    throw new Error("Parent element not found");
  }
  parent.appendChild(c);

  const ctx = c.getContext("2d");
  if (!ctx) {
    throw new Error("Context not found");
  }

  const tree = treeSprite(
    { W: 24, H: 24 },
    {
      debug,
      lighting,
      seed: seed ?? Rand.seed(),
    },
  );

  const scale = 4;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tree, 0, 0, 24 * scale, 24 * scale);
}

function color_palette() {
  const shades = ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
  const w = shades.length * 4;
  const h = Object.keys(colors).length * 4;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w * 10}px`;
  canvas.style.height = `${h * 10}px`;
  canvas.style.imageRendering = "pixelated";

  const parent = document.getElementById("color-palette");
  if (!parent) {
    throw new Error("Parent element not found");
  }
  parent.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Context not found");
  }
  ctx.imageSmoothingEnabled = false;

  obj.getEntries(colors).forEach(([colorName, shade]) => {
    obj.getEntries(shade).forEach(([shadeKey, hex]) => {
      ctx.fillStyle = `rgb(${hex[0]}, ${hex[1]}, ${hex[2]})` as const;

      const shadeIndex = shades.indexOf(shadeKey.toString());
      const colorIndex = Object.keys(colors).indexOf(colorName);

      ctx.fillRect(shadeIndex * 4 + 1, colorIndex * 4, 2, 1);
      ctx.fillRect(shadeIndex * 4, colorIndex * 4 + 1, 4, 2);
      ctx.fillRect(shadeIndex * 4 + 1, colorIndex * 4 + 3, 2, 1);
    });
  });
}
