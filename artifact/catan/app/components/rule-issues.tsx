import { AlertTriangle } from "lucide-react";
import { match } from "ts-pattern";
import { TILE_TYPE_DISPLAY_NAMES, Token } from "@/models/catan";
import type { RuleIssue } from "@/models/err";

interface RuleIssuesProps {
  issues: readonly RuleIssue[];
}

function plural(count: number, singular: string, multiple = `${singular}s`) {
  return count === 1 ? singular : multiple;
}

function getIssueMessage(issue: RuleIssue): string {
  return match(issue)
    .returnType<string>()
    .with({ kind: "empty-field" }, () => "Add at least one board slot.")
    .with(
      { kind: "invalid-position" },
      ({ tileIndex, position }) =>
        `Board slot ${tileIndex + 1} has an invalid coordinate (${position.q}, ${position.r}).`,
    )
    .with(
      { kind: "duplicate-position" },
      ({ position }) => `Multiple board slots use coordinate (${position.q}, ${position.r}).`,
    )
    .with({ kind: "tile-count-mismatch" }, ({ fieldCount, configuredCount }) => {
      const difference = fieldCount - configuredCount;
      return difference > 0
        ? `Assign ${difference} more tile ${plural(difference, "type")} in Counts.`
        : `Remove ${Math.abs(difference)} configured ${plural(Math.abs(difference), "tile")} in Counts.`;
    })
    .with(
      { kind: "pinned-tile-type-count-exceeded" },
      ({ pinnedCount, tileType, configuredCount }) =>
        `${pinnedCount} ${TILE_TYPE_DISPLAY_NAMES[tileType]} tiles are pinned, but only ${configuredCount} are configured.`,
    )
    .with(
      { kind: "no-allowed-tile-types" },
      ({ tileIndex }) => `Board slot ${tileIndex + 1} has no tile type allowed by the configured inventory.`,
    )
    .with({ kind: "token-resource-count-mismatch" }, ({ configuredResourceCount, configuredTokenCount }) => {
      const difference = configuredResourceCount - configuredTokenCount;
      return difference > 0
        ? `Add ${difference} number ${plural(difference, "token")} for the configured resources.`
        : `Remove ${Math.abs(difference)} configured number ${plural(Math.abs(difference), "token")}.`;
    })
    .with(
      { kind: "pinned-token-count-exceeded" },
      ({ token, pinnedCount, configuredCount }) =>
        `Token ${Token.fromValue(token).int} is pinned ${pinnedCount} times, but only ${configuredCount} are configured.`,
    )
    .with(
      { kind: "disconnected-field" },
      ({ componentCount }) => `The board is split into ${componentCount} disconnected sections.`,
    )
    .with(
      { kind: "adjacent-same-resource" },
      ({ tileType }) => `Two adjacent pinned tiles both use ${TILE_TYPE_DISPLAY_NAMES[tileType]}.`,
    )
    .with(
      { kind: "adjacent-same-token" },
      ({ token }) => `Two adjacent pinned tiles both use token ${Token.fromValue(token).int}.`,
    )
    .with({ kind: "adjacent-6-or-8" }, () => "Two adjacent pinned tiles use a 6 or 8 token.")
    .with(
      { kind: "gold-token-pips-out-of-range" },
      ({ tileIndex, token, pipCount, minimumPips, maximumPips }) =>
        `Gold tile ${tileIndex + 1} uses token ${Token.fromValue(token).int} with ${pipCount} pips; Gold tokens require ${minimumPips}–${maximumPips} pips.`,
    )
    .with(
      { kind: "intersection-pips-exceeded" },
      ({ pipCount, maximumPips }) => `A pinned intersection has ${pipCount} pips; the maximum is ${maximumPips}.`,
    )
    .exhaustive();
}

export function RuleIssues({ issues }: RuleIssuesProps) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
      <div className="mb-2 flex items-center gap-2 font-semibold text-sm">
        <AlertTriangle className="size-4" />
        Board rules need attention
      </div>
      <ul className="space-y-1 pl-5 text-xs">
        {issues.map((issue) => (
          <li key={JSON.stringify(issue)} className="list-disc">
            {getIssueMessage(issue)}
          </li>
        ))}
      </ul>
    </div>
  );
}
