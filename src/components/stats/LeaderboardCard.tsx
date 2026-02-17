"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Position badge for ranking (gold, silver, bronze styling)
interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold text-sm shadow-sm shadow-yellow-400/30">
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-white font-bold text-sm">
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold text-sm">
        3
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center font-semibold text-sm text-gray-500">
      {rank}
    </div>
  );
}

// Leader entry data structure
export interface LeaderEntry {
  playerId: string;
  playerName: string;
  teamAbbr: string;
  position: string;
  value: number | string;
  rank: number;
}

interface LeaderboardCardProps {
  title: string;
  statLabel: string;
  leaders: LeaderEntry[];
  formatValue?: (value: number | string) => string;
  className?: string;
}

/**
 * LeaderboardCard Component
 * Displays a leaderboard for a specific baseball statistic
 * Shows top players with rank badges (gold/silver/bronze for top 3)
 *
 * Usage:
 * <LeaderboardCard
 *   title="Batting Average"
 *   statLabel="AVG"
 *   leaders={battingAvgLeaders}
 *   formatValue={(v) => v.toFixed(3)}
 * />
 */
export function LeaderboardCard({
  title,
  statLabel,
  leaders,
  formatValue = (v) => String(v),
  className,
}: LeaderboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gray-50 border-b border-gray-200 pb-3 pt-4">
        <CardTitle className="text-gray-900 text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table header */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          <div className="w-10">Rank</div>
          <div className="flex-1">Player</div>
          <div className="w-16 text-right">{statLabel}</div>
        </div>

        {/* Leader entries */}
        <div className="divide-y divide-gray-100">
          {leaders.map((leader) => (
            <div
              key={leader.playerId}
              className="flex items-center px-4 py-3 transition-colors hover:bg-gray-50"
            >
              {/* Rank */}
              <div className="w-10">
                <RankBadge rank={leader.rank} />
              </div>

              {/* Player info */}
              <div className="flex flex-1 flex-col min-w-0">
                <span className="font-semibold text-gray-900 truncate">
                  {leader.playerName}
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500 border-gray-300">
                    {leader.teamAbbr}
                  </Badge>
                  <span className="text-gray-500 text-xs">{leader.position}</span>
                </div>
              </div>

              {/* Stat value */}
              <div className="w-16 text-right">
                <span className="font-mono font-bold text-lg text-gray-900">
                  {formatValue(leader.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for mobile or smaller displays
 */
interface CompactLeaderboardProps {
  title: string;
  statLabel: string;
  leaders: LeaderEntry[];
  formatValue?: (value: number | string) => string;
  className?: string;
  showCount?: number;
}

export function CompactLeaderboard({
  title,
  statLabel,
  leaders,
  formatValue = (v) => String(v),
  className,
  showCount = 5,
}: CompactLeaderboardProps) {
  const displayLeaders = leaders.slice(0, showCount);

  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-sm text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">{statLabel}</span>
      </div>

      <div className="space-y-2">
        {displayLeaders.map((leader) => (
          <div key={leader.playerId} className="flex items-center gap-2 hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors">
            <span
              className={cn(
                "w-5 text-center text-sm font-bold",
                leader.rank === 1 && "text-amber-500",
                leader.rank === 2 && "text-gray-400",
                leader.rank === 3 && "text-amber-700",
                leader.rank > 3 && "text-gray-500"
              )}
            >
              {leader.rank}
            </span>
            <span className="flex-1 truncate text-sm text-gray-900">
              {leader.playerName}
            </span>
            <span className="text-xs text-gray-500">{leader.teamAbbr}</span>
            <span className="font-mono font-semibold text-sm text-gray-900">
              {formatValue(leader.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
