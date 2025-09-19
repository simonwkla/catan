import { Label } from "@components/ui/label";
import { useMemo } from "react";
import { Token, TokenCounter } from "@components/SideBar/TemplateSection/TokensTabContent/TokenCounter";
import type { PartialTemplate } from "app/catan/domain/entity/template";


interface TilesTabContent {
  tokensMap: PartialTemplate["tokensMap"];
  onChange: (tokensMap: PartialTemplate["tokensMap"]) => void;
  totalTokensCount: number;
}

export const TokensTabContent = ({ tokensMap, onChange, totalTokensCount }: TilesTabContent) => {
  const onCountChange = (token: Token, count: number) => {
    return onChange({ ...tokensMap, [token]: count });
  };

  const tilesLeftCount = useMemo(
    () => Object.values(tokensMap).reduce((acc, curr) => acc - curr, totalTokensCount),
    [tokensMap, totalTokensCount],
  );

  return (
    <div>
      <div className="flex flex-row gap-4 *:flex *:flex-row *:items-center *:gap-2">
        <div>
          <Label>Total number of tokens: </Label>
          <p>{totalTokensCount}</p>
        </div>

        <div>
          <Label>Tokens left: </Label>
          <p>{tilesLeftCount}</p>
        </div>
      </div>
      <div className="mt-4 grid w-fit auto-cols-min grid-cols-2 gap-x-1 gap-y-2">
        {(Object.entries(tokensMap) as [Token, number | undefined][]).map(([token, count]) => (
          <TokenCounter
            key={token}
            token={token}
            count={count ?? 0}
            onChange={onCountChange}
            max={(count ?? 0) + tilesLeftCount}
          />
        ))}
      </div>
    </div>
  );
};
