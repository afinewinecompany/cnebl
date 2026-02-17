"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BattingStats, PitchingStats } from "@/lib/mock-data";

// Column definition for the table
interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  format?: (value: T[keyof T]) => string;
  className?: string;
  headerClassName?: string;
}

// -----------------------------------------------------------------------------
// Mobile Card Components
// -----------------------------------------------------------------------------

interface MobileBattingCardProps {
  player: BattingStats;
  rank: number;
}

/**
 * MobileBattingCard Component
 * Card view for batting stats on mobile devices
 */
function MobileBattingCard({ player, rank }: MobileBattingCardProps) {
  return (
    <div className="rounded-lg border border-cream-dark bg-chalk p-4">
      {/* Header: Rank + Player Name + Team + Position */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-navy text-white font-mono font-bold text-sm">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-headline text-navy truncate">{player.playerName}</div>
          <div className="text-sm text-charcoal">
            {player.teamAbbr} <span className="text-field">| {player.position}</span>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid (4 cols): AVG, HR, RBI, OPS */}
      <div className="grid grid-cols-4 gap-2 text-center mb-3">
        <div>
          <div className="text-xs text-field uppercase font-medium">AVG</div>
          <div className="font-mono font-bold text-navy">{player.avg.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-xs text-field uppercase font-medium">HR</div>
          <div className="font-mono font-bold text-navy">{player.homeRuns}</div>
        </div>
        <div>
          <div className="text-xs text-field uppercase font-medium">RBI</div>
          <div className="font-mono font-bold text-navy">{player.rbi}</div>
        </div>
        <div>
          <div className="text-xs text-field uppercase font-medium">OPS</div>
          <div className="font-mono font-bold text-navy">{player.ops.toFixed(3)}</div>
        </div>
      </div>

      {/* Secondary Stats Row: G, H, AB, OBP */}
      <div className="flex items-center justify-between text-sm border-t border-cream-dark pt-3">
        <span className="text-charcoal">
          G: <span className="font-mono text-navy">{player.gamesPlayed}</span>
        </span>
        <span className="text-charcoal">
          H: <span className="font-mono text-navy">{player.hits}</span>
        </span>
        <span className="text-charcoal">
          AB: <span className="font-mono text-navy">{player.atBats}</span>
        </span>
        <span className="text-charcoal">
          OBP: <span className="font-mono text-navy">{player.obp.toFixed(3)}</span>
        </span>
      </div>
    </div>
  );
}

interface MobilePitchingCardProps {
  player: PitchingStats;
  rank: number;
}

/**
 * MobilePitchingCard Component
 * Card view for pitching stats on mobile devices
 */
function MobilePitchingCard({ player, rank }: MobilePitchingCardProps) {
  return (
    <div className="rounded-lg border border-cream-dark bg-chalk p-4">
      {/* Header: Rank + Player Name + Team + W-L Record */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-navy text-white font-mono font-bold text-sm">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-headline text-navy truncate">{player.playerName}</div>
          <div className="text-sm text-charcoal">
            {player.teamAbbr} <span className="text-field">| {player.wins}-{player.losses}</span>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid (4 cols): ERA, IP, K, WHIP */}
      <div className="grid grid-cols-4 gap-2 text-center mb-3">
        <div>
          <div className="text-xs text-field uppercase font-medium">ERA</div>
          <div className="font-mono font-bold text-navy">{player.era.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-field uppercase font-medium">IP</div>
          <div className="font-mono font-bold text-navy">{player.inningsPitched.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-xs text-field uppercase font-medium">K</div>
          <div className="font-mono font-bold text-navy">{player.strikeouts}</div>
        </div>
        <div>
          <div className="text-xs text-field uppercase font-medium">WHIP</div>
          <div className="font-mono font-bold text-navy">{player.whip.toFixed(2)}</div>
        </div>
      </div>

      {/* Secondary Stats Row: G, GS, SV, BB */}
      <div className="flex items-center justify-between text-sm border-t border-cream-dark pt-3">
        <span className="text-charcoal">
          G: <span className="font-mono text-navy">{player.gamesPlayed}</span>
        </span>
        <span className="text-charcoal">
          GS: <span className="font-mono text-navy">{player.gamesStarted}</span>
        </span>
        <span className="text-charcoal">
          SV: <span className="font-mono text-navy">{player.saves}</span>
        </span>
        <span className="text-charcoal">
          BB: <span className="font-mono text-navy">{player.walks}</span>
        </span>
      </div>
    </div>
  );
}

// Sort direction type
type SortDirection = "asc" | "desc";

// Props for BattingStatsTable
interface BattingStatsTableProps {
  stats: BattingStats[];
  className?: string;
  minAtBats?: number;
}

/**
 * BattingStatsTable Component
 * Full stats table for batting statistics with sortable columns
 *
 * Usage:
 * <BattingStatsTable stats={battingStats} minAtBats={50} />
 */
export function BattingStatsTable({
  stats,
  className,
  minAtBats = 0,
}: BattingStatsTableProps) {
  const [sortKey, setSortKey] = useState<keyof BattingStats>("avg");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const columns: Column<BattingStats>[] = [
    { key: "playerName", label: "Player", sortable: true, className: "text-left min-w-[140px]" },
    { key: "teamAbbr", label: "Team", sortable: true, className: "text-center" },
    { key: "position", label: "Pos", sortable: true, className: "text-center" },
    { key: "gamesPlayed", label: "G", sortable: true, className: "text-center" },
    { key: "atBats", label: "AB", sortable: true, className: "text-center" },
    { key: "runs", label: "R", sortable: true, className: "text-center" },
    { key: "hits", label: "H", sortable: true, className: "text-center" },
    { key: "doubles", label: "2B", sortable: true, className: "text-center" },
    { key: "triples", label: "3B", sortable: true, className: "text-center" },
    { key: "homeRuns", label: "HR", sortable: true, className: "text-center" },
    { key: "rbi", label: "RBI", sortable: true, className: "text-center" },
    { key: "walks", label: "BB", sortable: true, className: "text-center" },
    { key: "strikeouts", label: "K", sortable: true, className: "text-center" },
    { key: "stolenBases", label: "SB", sortable: true, className: "text-center" },
    {
      key: "avg",
      label: "AVG",
      sortable: true,
      format: (v) => (v as number).toFixed(3),
      className: "text-center font-semibold",
    },
    {
      key: "obp",
      label: "OBP",
      sortable: true,
      format: (v) => (v as number).toFixed(3),
      className: "text-center",
    },
    {
      key: "slg",
      label: "SLG",
      sortable: true,
      format: (v) => (v as number).toFixed(3),
      className: "text-center",
    },
    {
      key: "ops",
      label: "OPS",
      sortable: true,
      format: (v) => (v as number).toFixed(3),
      className: "text-center font-semibold",
    },
  ];

  const filteredAndSortedStats = useMemo(() => {
    const filtered = stats.filter((s) => s.atBats >= minAtBats);
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [stats, sortKey, sortDirection, minAtBats]);

  const handleSort = (key: keyof BattingStats) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Default to descending for stats, ascending for names
      setSortDirection(key === "playerName" || key === "teamAbbr" ? "asc" : "desc");
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-retro border border-cream-dark">
        <table className="stats-table w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-navy text-center w-10">#</th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    col.sortable && "cursor-pointer select-none hover:bg-navy-light",
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedStats.map((player, index) => (
              <tr key={player.playerId}>
                <td className="sticky left-0 bg-inherit text-center font-mono text-sm">
                  {index + 1}
                </td>
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("font-mono text-sm", col.className)}
                  >
                    {col.format
                      ? col.format(player[col.key])
                      : String(player[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredAndSortedStats.map((player, index) => (
          <MobileBattingCard
            key={player.playerId}
            player={player}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

// Props for PitchingStatsTable
interface PitchingStatsTableProps {
  stats: PitchingStats[];
  className?: string;
  minInningsPitched?: number;
}

/**
 * PitchingStatsTable Component
 * Full stats table for pitching statistics with sortable columns
 *
 * Usage:
 * <PitchingStatsTable stats={pitchingStats} minInningsPitched={20} />
 */
export function PitchingStatsTable({
  stats,
  className,
  minInningsPitched = 0,
}: PitchingStatsTableProps) {
  const [sortKey, setSortKey] = useState<keyof PitchingStats>("era");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const columns: Column<PitchingStats>[] = [
    { key: "playerName", label: "Player", sortable: true, className: "text-left min-w-[140px]" },
    { key: "teamAbbr", label: "Team", sortable: true, className: "text-center" },
    { key: "gamesPlayed", label: "G", sortable: true, className: "text-center" },
    { key: "gamesStarted", label: "GS", sortable: true, className: "text-center" },
    { key: "wins", label: "W", sortable: true, className: "text-center" },
    { key: "losses", label: "L", sortable: true, className: "text-center" },
    { key: "saves", label: "SV", sortable: true, className: "text-center" },
    {
      key: "inningsPitched",
      label: "IP",
      sortable: true,
      format: (v) => (v as number).toFixed(1),
      className: "text-center",
    },
    { key: "hits", label: "H", sortable: true, className: "text-center" },
    { key: "earnedRuns", label: "ER", sortable: true, className: "text-center" },
    { key: "walks", label: "BB", sortable: true, className: "text-center" },
    { key: "strikeouts", label: "K", sortable: true, className: "text-center" },
    { key: "hitBatters", label: "HBP", sortable: true, className: "text-center" },
    { key: "completeGames", label: "CG", sortable: true, className: "text-center" },
    {
      key: "era",
      label: "ERA",
      sortable: true,
      format: (v) => (v as number).toFixed(2),
      className: "text-center font-semibold",
    },
    {
      key: "whip",
      label: "WHIP",
      sortable: true,
      format: (v) => (v as number).toFixed(2),
      className: "text-center font-semibold",
    },
  ];

  const filteredAndSortedStats = useMemo(() => {
    const filtered = stats.filter((s) => s.inningsPitched >= minInningsPitched);
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [stats, sortKey, sortDirection, minInningsPitched]);

  const handleSort = (key: keyof PitchingStats) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // ERA and WHIP should default to ascending (lower is better)
      // Other stats default to descending
      const ascendingStats: (keyof PitchingStats)[] = ["era", "whip", "playerName", "teamAbbr"];
      setSortDirection(ascendingStats.includes(key) ? "asc" : "desc");
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-retro border border-cream-dark">
        <table className="stats-table w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-navy text-center w-10">#</th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    col.sortable && "cursor-pointer select-none hover:bg-navy-light",
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedStats.map((player, index) => (
              <tr key={player.playerId}>
                <td className="sticky left-0 bg-inherit text-center font-mono text-sm">
                  {index + 1}
                </td>
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("font-mono text-sm", col.className)}
                  >
                    {col.format
                      ? col.format(player[col.key])
                      : String(player[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredAndSortedStats.map((player, index) => (
          <MobilePitchingCard
            key={player.playerId}
            player={player}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
