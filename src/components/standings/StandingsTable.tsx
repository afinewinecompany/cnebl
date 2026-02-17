"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown } from "lucide-react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export interface TeamStanding {
  id: string;
  rank: number;
  name: string;
  logoUrl?: string;
  wins: number;
  losses: number;
  ties?: number;
  pct: number;
  gb: number | string;
  runsScored: number;
  runsAllowed: number;
  diff: number;
  streak?: string;
  lastFive?: ("W" | "L")[];
}

type SortKey = keyof Pick<
  TeamStanding,
  "rank" | "wins" | "losses" | "pct" | "gb" | "runsScored" | "runsAllowed" | "diff"
>;

interface StandingsTableProps {
  standings: TeamStanding[];
  className?: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function formatPct(pct: number): string {
  return pct.toFixed(3).replace(/^0/, "");
}

function formatDiff(diff: number): string {
  if (diff > 0) return `+${diff}`;
  return diff.toString();
}

function formatGb(gb: number | string): string {
  if (typeof gb === "string") return gb;
  if (gb === 0) return "-";
  return gb.toFixed(1);
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------
interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
  title?: string;
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  direction,
  onSort,
  className,
  title,
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey;

  return (
    <th
      className={cn(
        "px-2 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors",
        "hover:bg-gray-200",
        isActive ? "text-gray-900" : "text-gray-500",
        className
      )}
      onClick={() => onSort(sortKey)}
      title={title}
      role="columnheader"
      aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-gray-900">
            {direction === "asc" ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

interface LastFiveProps {
  results: ("W" | "L")[];
}

function LastFive({ results }: LastFiveProps) {
  return (
    <div className="flex gap-1 justify-center">
      {results.map((result, idx) => (
        <span
          key={idx}
          className={cn(
            "w-5 h-5 flex items-center justify-center rounded-sm text-xs font-mono font-bold",
            result === "W"
              ? "bg-success text-white"
              : "bg-danger text-white"
          )}
          title={result === "W" ? "Win" : "Loss"}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Mobile Card View
// -----------------------------------------------------------------------------
interface MobileStandingCardProps {
  team: TeamStanding;
  isLeader: boolean;
}

function MobileStandingCard({ team, isLeader }: MobileStandingCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-shadow bg-white",
        isLeader
          ? "border-l-4 border-l-yellow-400 border-t border-r border-b border-gray-200 bg-yellow-50/50 shadow-sm"
          : "border-gray-200"
      )}
    >
      {/* Header: Rank + Team Name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full font-mono font-bold text-sm",
            isLeader
              ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
              : "bg-gray-100 text-gray-700"
          )}
        >
          {team.rank}
        </div>
        <div className="flex items-center gap-2 flex-1">
          {/* Logo placeholder */}
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500">
              {team.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-gray-900">
            {team.name}
          </span>
          {isLeader && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">1st</Badge>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 text-center mb-3">
        <div>
          <div className="text-xs text-gray-500 uppercase font-medium">Record</div>
          <div className="font-mono font-bold text-gray-900">
            {team.wins}-{team.losses}{team.ties ? `-${team.ties}` : ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-medium">PCT</div>
          <div className="font-mono font-bold text-gray-900">{formatPct(team.pct)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-medium">GB</div>
          <div className="font-mono font-bold text-gray-900">{formatGb(team.gb)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-medium">DIFF</div>
          <div
            className={cn(
              "font-mono font-bold",
              team.diff > 0 ? "text-success" : team.diff < 0 ? "text-danger" : "text-gray-900"
            )}
          >
            {formatDiff(team.diff)}
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
        <div className="flex gap-4">
          <span className="text-gray-500">
            RS: <span className="font-mono text-gray-900">{team.runsScored}</span>
          </span>
          <span className="text-gray-500">
            RA: <span className="font-mono text-gray-900">{team.runsAllowed}</span>
          </span>
        </div>
        {team.streak && team.streak !== "-" && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-mono font-bold",
                team.streak.startsWith("W")
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              )}
            >
              {team.streak}
            </span>
          </div>
        )}
      </div>

      {/* Last 5 - only show if data exists */}
      {team.lastFive && team.lastFive.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase font-medium">Last 5</span>
            <LastFive results={team.lastFive} />
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export function StandingsTable({ standings, className }: StandingsTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const handleSort = React.useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        // Default sort direction based on stat type
        const descendingByDefault: SortKey[] = ["wins", "pct", "runsScored", "diff"];
        setSortDirection(descendingByDefault.includes(key) ? "desc" : "asc");
      }
    },
    [sortKey]
  );

  const sortedStandings = React.useMemo(() => {
    const sorted = [...standings].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle "gb" which can be string or number
      if (sortKey === "gb") {
        aVal = typeof aVal === "string" ? 0 : aVal;
        bVal = typeof bVal === "string" ? 0 : bVal;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [standings, sortKey, sortDirection]);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse" role="table" aria-label="League standings">
          <thead className="bg-gray-100 text-gray-500 sticky top-0">
            <tr>
              <SortableHeader
                label="#"
                sortKey="rank"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-12 text-center"
                title="Rank"
              />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Team
              </th>
              <SortableHeader
                label="W"
                sortKey="wins"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-14"
                title="Wins"
              />
              <SortableHeader
                label="L"
                sortKey="losses"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-14"
                title="Losses"
              />
              {standings.some(t => t.ties !== undefined && t.ties > 0) && (
                <th
                  className="px-2 py-3 w-14 text-xs font-medium uppercase tracking-wider text-gray-500 text-center"
                  title="Ties"
                >
                  T
                </th>
              )}
              <SortableHeader
                label="PCT"
                sortKey="pct"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-16"
                title="Win Percentage"
              />
              <SortableHeader
                label="GB"
                sortKey="gb"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-14"
                title="Games Behind"
              />
              <SortableHeader
                label="RS"
                sortKey="runsScored"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-14"
                title="Runs Scored"
              />
              <SortableHeader
                label="RA"
                sortKey="runsAllowed"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-14"
                title="Runs Allowed"
              />
              <SortableHeader
                label="DIFF"
                sortKey="diff"
                currentSort={sortKey}
                direction={sortDirection}
                onSort={handleSort}
                className="w-16"
                title="Run Differential"
              />
              <th
                className="px-2 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 w-16 text-center"
                title="Current Streak"
              >
                Streak
              </th>
              <th
                className="px-2 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 w-28 text-center"
                title="Last 5 Games"
              >
                L5
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((team) => {
              const isLeader = team.rank === 1;

              return (
                <tr
                  key={team.id}
                  className={cn(
                    "border-b border-gray-100 transition-colors hover:bg-gray-50",
                    isLeader && "bg-yellow-50/50 border-l-4 border-l-yellow-400"
                  )}
                >
                  {/* Rank */}
                  <td className="px-2 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex w-7 h-7 items-center justify-center rounded-full font-mono font-bold text-sm",
                        isLeader
                          ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {team.rank}
                    </span>
                  </td>

                  {/* Team Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Logo placeholder */}
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500">
                          {team.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {team.name}
                      </span>
                      {isLeader && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">1st</Badge>}
                    </div>
                  </td>

                  {/* W */}
                  <td className="px-2 py-3 text-center font-mono font-bold text-gray-900">
                    {team.wins}
                  </td>

                  {/* L */}
                  <td className="px-2 py-3 text-center font-mono font-bold text-gray-900">
                    {team.losses}
                  </td>

                  {/* T (ties) */}
                  {sortedStandings.some(t => t.ties !== undefined && t.ties > 0) && (
                    <td className="px-2 py-3 text-center font-mono font-bold text-gray-900">
                      {team.ties || 0}
                    </td>
                  )}

                  {/* PCT */}
                  <td className="px-2 py-3 text-center font-mono font-bold text-gray-900">
                    {formatPct(team.pct)}
                  </td>

                  {/* GB */}
                  <td className="px-2 py-3 text-center font-mono text-gray-500">
                    {formatGb(team.gb)}
                  </td>

                  {/* RS */}
                  <td className="px-2 py-3 text-center font-mono text-gray-900">
                    {team.runsScored}
                  </td>

                  {/* RA */}
                  <td className="px-2 py-3 text-center font-mono text-gray-900">
                    {team.runsAllowed}
                  </td>

                  {/* DIFF */}
                  <td
                    className={cn(
                      "px-2 py-3 text-center font-mono font-bold",
                      team.diff > 0 ? "text-success" : team.diff < 0 ? "text-danger" : "text-gray-900"
                    )}
                  >
                    {formatDiff(team.diff)}
                  </td>

                  {/* Streak */}
                  <td className="px-2 py-3 text-center">
                    {team.streak && team.streak !== "-" ? (
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-mono font-bold",
                          team.streak.startsWith("W")
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        )}
                      >
                        {team.streak}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* Last 5 */}
                  <td className="px-2 py-3">
                    {team.lastFive && team.lastFive.length > 0 ? (
                      <LastFive results={team.lastFive} />
                    ) : (
                      <span className="text-gray-400 text-center block">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {sortedStandings.map((team) => (
          <MobileStandingCard
            key={team.id}
            team={team}
            isLeader={team.rank === 1}
          />
        ))}
      </div>
    </div>
  );
}

export default StandingsTable;
