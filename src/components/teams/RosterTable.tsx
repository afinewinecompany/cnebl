"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RosterPlayer } from "@/lib/mock-data";
import { getPlayerStats } from "@/lib/mock-data";
import { ChevronUp, ChevronDown } from "lucide-react";

interface RosterTableProps {
  roster: RosterPlayer[];
  teamPrimaryColor: string;
  className?: string;
}

type SortKey = "jerseyNumber" | "name" | "position" | "stat";
type SortDirection = "asc" | "desc";

/**
 * RosterTable Component
 * Displays full team roster with stats
 */
export function RosterTable({ roster, teamPrimaryColor, className }: RosterTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("jerseyNumber");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  // Separate pitchers from position players
  const pitcherPositions = ["P", "SP", "RP"];
  const pitchers = roster.filter((p) => pitcherPositions.includes(p.position));
  const positionPlayers = roster.filter((p) => !pitcherPositions.includes(p.position));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortPlayers = (players: RosterPlayer[]): RosterPlayer[] => {
    return [...players].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case "jerseyNumber":
          comparison = a.jerseyNumber - b.jerseyNumber;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "position":
          comparison = a.position.localeCompare(b.position);
          break;
        case "stat": {
          const statsA = getPlayerStats(a);
          const statsB = getPlayerStats(b);
          const valA = statsA.batting?.avg || statsA.pitching?.era || 0;
          const valB = statsB.batting?.avg || statsB.pitching?.era || 0;
          comparison = valA - valB;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1" />
    );
  };

  const SortableHeader = ({
    column,
    children,
    className: headerClassName,
  }: {
    column: SortKey;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer",
        "hover:bg-primary-light transition-colors select-none",
        headerClassName
      )}
      onClick={() => handleSort(column)}
      role="columnheader"
      aria-sort={sortKey === column ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
    >
      {children}
      <SortIcon column={column} />
    </th>
  );

  return (
    <div className={cn("space-y-8", className)}>
      {/* Position Players */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: teamPrimaryColor }}
            aria-hidden="true"
          />
          Position Players
          <Badge variant="outline" className="ml-2 text-xs">
            {positionPlayers.length}
          </Badge>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full" role="table" aria-label="Position players roster">
            <thead className="bg-gradient-to-r from-primary to-primary-dark text-white">
              <tr>
                <SortableHeader column="jerseyNumber" className="w-16">
                  #
                </SortableHeader>
                <SortableHeader column="name">Player</SortableHeader>
                <SortableHeader column="position" className="w-20">
                  Pos
                </SortableHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20">
                  B/T
                </th>
                <SortableHeader column="stat" className="w-24 text-right">
                  AVG
                </SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortPlayers(positionPlayers).map((player, index) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isEven={index % 2 === 0}
                  statType="batting"
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pitchers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: teamPrimaryColor }}
            aria-hidden="true"
          />
          Pitchers
          <Badge variant="outline" className="ml-2 text-xs">
            {pitchers.length}
          </Badge>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full" role="table" aria-label="Pitchers roster">
            <thead className="bg-gradient-to-r from-primary to-primary-dark text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-16">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20">
                  B/T
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider w-24">
                  ERA
                </th>
              </tr>
            </thead>
            <tbody>
              {sortPlayers(pitchers).map((player, index) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isEven={index % 2 === 0}
                  statType="pitching"
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Player row component
function PlayerRow({
  player,
  isEven,
  statType,
}: {
  player: RosterPlayer;
  isEven: boolean;
  statType: "batting" | "pitching";
}) {
  const stats = getPlayerStats(player);
  const batting = stats.batting;
  const pitching = stats.pitching;

  const displayStat =
    statType === "batting"
      ? batting?.avg.toFixed(3).slice(1) || "-"
      : pitching?.era.toFixed(2) || "-";

  const positionLabel =
    statType === "pitching"
      ? player.position === "SP"
        ? "Starter"
        : "Reliever"
      : player.position;

  return (
    <tr
      className={cn(
        "border-b border-gray-100 last:border-b-0 hover:bg-accent/5 transition-colors",
        isEven ? "bg-white" : "bg-gray-50"
      )}
    >
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-gray-900">{player.jerseyNumber}</span>
      </td>
      <td className="px-4 py-3">
        <span className="font-medium text-gray-800">{player.name}</span>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs">
          {positionLabel}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500">{player.batsThrows}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={cn(
            "font-mono font-semibold",
            displayStat !== "-" ? "text-gray-900" : "text-gray-400"
          )}
        >
          {displayStat}
        </span>
      </td>
    </tr>
  );
}

export default RosterTable;
