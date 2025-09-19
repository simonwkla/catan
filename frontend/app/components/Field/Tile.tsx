import { ReactElement, useMemo } from "react";
import { Vector2 } from "@lib/vector2";
import { cn } from "@lib/cn";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@components/ui/select";
import { cva } from "class-variance-authority";
import { Tile, TileType } from "app/catan/domain/entity/tile";
import { VectorAx } from "@lib/vectorAx";
import { token } from "app/catan/domain/entity/token";

export interface TileProps {
  tile: Tile;
  className?: string;
  onChange: (tile: Tile) => void;
}

const B = `2px`;
const TILE_SIZE = 120;
const SPACING = 3;

const tileVariants = cva("bg-cover bg-center", {
  variants: {
    variant: {
      water: "bg-water-tile",
      desert: "bg-desert-tile",
      sheep: "bg-sheep-tile",
      forest: "bg-forest-tile",
      field: "bg-field-tile",
      mountain: "bg-mountain-tile",
      clay: "bg-clay-tile",
      gold: "bg-gold-tile",
      empty: "",
      placeholder: "",
    },
  },
});

export const TileComponent = ({ tile, className, onChange }: TileProps): ReactElement => {
  const onValueChange = (value: string) => {
    onChange({ ...tile, type: value as Tile["type"] });
  };

  const pos = useMemo(() => Vector2.scale(VectorAx.toVector2(tile.pos), TILE_SIZE / 2 + SPACING), [tile.pos]);

  const tokenPip = Tile.isResource(tile) ? token.toInt(tile.token) : null;

  return (
    <Select value={tile.type} defaultValue={tile.type} onValueChange={onValueChange}>
      <div
        className={cn("absolute cursor-pointer hover:drop-shadow-custom", className)}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}>
        <div
          className={cn("relative w-fit", tileVariants({ variant: tile.type }))}
          style={{
            height: `${TILE_SIZE}px`,
            aspectRatio: "cos(30deg)",
            clipPath: `polygon(-50% 50%,50% 100%,150% 50%,50% 0)`,
          }}>
          <div className="absolute inset-1/2 text-center w-10 h-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 text-black text-3xl font-extrabold">
            {tokenPip}
          </div>
          <SelectTrigger className="absolute bottom-0 top-0 m-auto h-[60%] w-full p-0 opacity-0" />
          <div className="flex h-full items-center justify-center"></div>
          <Border className="absolute inset-0 bg-black" />
        </div>
      </div>
      <SelectContent>
        <SelectItem value={TileType.Empty}>Empty</SelectItem>
        <SelectItem value={TileType.Placeholder}>Placeholder</SelectItem>
        <SelectItem value={TileType.Water}>Water</SelectItem>
        <SelectItem value={TileType.Desert}>Desert</SelectItem>
        <SelectItem value={TileType.Sheep}>Sheep</SelectItem>
        <SelectItem value={TileType.Forest}>Forest</SelectItem>
        <SelectItem value={TileType.Field}>Field</SelectItem>
        <SelectItem value={TileType.Mountain}>Mountain</SelectItem>
        <SelectItem value={TileType.Clay}>Clay</SelectItem>
        <SelectItem value={TileType.Gold}>Gold</SelectItem>
      </SelectContent>
    </Select>
  );
};

const Border = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(className)}
      style={{
        clipPath: `
         polygon(
          50% 0,
          -50% 50%,
          50% 100%,
          150% 50%,
          50% 0,
          50% ${B},
          calc(100% - ${B}*sin(60deg)) calc(25% + ${B}*cos(60deg)),
          calc(100% - ${B}*sin(60deg)) calc(75% - ${B}*cos(60deg)),
          50% calc(100% - ${B}),
          calc(${B}*sin(60deg)) calc(75% - ${B}*cos(60deg)),
          calc(${B}*sin(60deg)) calc(25% + ${B}*cos(60deg)),
          50% ${B}
         )`,
      }}
    />
  );
};
