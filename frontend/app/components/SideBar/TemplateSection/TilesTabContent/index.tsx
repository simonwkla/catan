import { Label } from "@components/ui/label";
import { useMemo } from "react";
import type { PartialTemplate } from "app/catan/domain/entity/template";
import { TileTypeCounter } from "./TileTypeCounter";

type TileTypeKey = keyof PartialTemplate["tileTypesMap"];

interface TilesTabContent {
  tileTypesMap: PartialTemplate["tileTypesMap"];
  onChange: (tileTypeMap: PartialTemplate["tileTypesMap"]) => void;
  totalTilesCount: number;
}

export const TilesTabContent = ({ tileTypesMap, onChange, totalTilesCount }: TilesTabContent) => {
  const onCountChange = (type: TileTypeKey, count: number) => {
    return onChange({ ...tileTypesMap, [type]: count });
  };

  const tilesLeftCount = useMemo(
    () => Object.values(tileTypesMap).reduce((acc, curr) => acc - curr, totalTilesCount),
    [tileTypesMap, totalTilesCount],
  );

  return (
    <div>
      <div className="flex flex-row gap-4 *:flex *:flex-row *:items-center *:gap-2">
        <div>
          <Label>Total number of tiles: </Label>
          <p>{totalTilesCount}</p>
        </div>

        <div>
          <Label>Tiles left: </Label>
          <p>{tilesLeftCount}</p>
        </div>
      </div>
      <div className="mt-4 grid w-fit auto-cols-min grid-cols-2 gap-x-1 gap-y-2">
        {(Object.entries(tileTypesMap) as [TileTypeKey, number | undefined][]).map(([type, count]) => (
          <TileTypeCounter
            key={type}
            type={type as any}
            count={count ?? 0}
            onChange={(k, c) => onCountChange(k as any, c)}
            max={(count ?? 0) + tilesLeftCount}
          />
        ))}
      </div>
    </div>
  );
};
