"use client";

import { useState, useMemo } from "react";
import { BarChart3, Users, Table, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LeaderboardCard,
  BattingStatsTable,
  PitchingStatsTable,
  type LeaderEntry,
} from "@/components/stats";
import {
  battingStats,
  pitchingStats,
  getQualifiedBatters,
  getQualifiedPitchers,
  BATTING_MIN_AB,
  PITCHING_MIN_IP,
  type BattingStats,
  type PitchingStats,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Tab types
type StatsTab = "batting" | "pitching";
type ViewMode = "leaders" | "table";

// Helper to create leaderboard entries from batting stats
function createBattingLeaders(
  stats: BattingStats[],
  sortKey: keyof BattingStats,
  limit: number = 10,
  ascending: boolean = false
): LeaderEntry[] {
  const sorted = [...stats].sort((a, b) => {
    const aVal = a[sortKey] as number;
    const bVal = b[sortKey] as number;
    return ascending ? aVal - bVal : bVal - aVal;
  });

  return sorted.slice(0, limit).map((player, index) => ({
    playerId: player.playerId,
    playerName: player.playerName,
    teamAbbr: player.teamAbbr,
    position: player.position,
    value: player[sortKey] as number,
    rank: index + 1,
  }));
}

// Helper to create leaderboard entries from pitching stats
function createPitchingLeaders(
  stats: PitchingStats[],
  sortKey: keyof PitchingStats,
  limit: number = 10,
  ascending: boolean = false
): LeaderEntry[] {
  const sorted = [...stats].sort((a, b) => {
    const aVal = a[sortKey] as number;
    const bVal = b[sortKey] as number;
    return ascending ? aVal - bVal : bVal - aVal;
  });

  return sorted.slice(0, limit).map((player, index) => ({
    playerId: player.playerId,
    playerName: player.playerName,
    teamAbbr: player.teamAbbr,
    position: player.position,
    value: player[sortKey] as number,
    rank: index + 1,
  }));
}

/**
 * Statistics Page
 * Displays batting and pitching leaders for the CNEBL
 * Features tab navigation, leaderboard cards, and full stats tables
 */
export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<StatsTab>("batting");
  const [viewMode, setViewMode] = useState<ViewMode>("leaders");

  // Get qualified players
  const qualifiedBatters = useMemo(() => getQualifiedBatters(), []);
  const qualifiedPitchers = useMemo(() => getQualifiedPitchers(), []);

  // Generate batting leaderboards
  const battingLeaders = useMemo(
    () => ({
      avg: createBattingLeaders(qualifiedBatters, "avg", 10),
      homeRuns: createBattingLeaders(qualifiedBatters, "homeRuns", 10),
      rbi: createBattingLeaders(qualifiedBatters, "rbi", 10),
      hits: createBattingLeaders(qualifiedBatters, "hits", 10),
      runs: createBattingLeaders(qualifiedBatters, "runs", 10),
      stolenBases: createBattingLeaders(qualifiedBatters, "stolenBases", 10),
    }),
    [qualifiedBatters]
  );

  // Generate pitching leaderboards
  const pitchingLeaders = useMemo(
    () => ({
      era: createPitchingLeaders(qualifiedPitchers, "era", 10, true), // Lower is better
      wins: createPitchingLeaders(qualifiedPitchers, "wins", 10),
      strikeouts: createPitchingLeaders(qualifiedPitchers, "strikeouts", 10),
      saves: createPitchingLeaders(qualifiedPitchers, "saves", 10),
      whip: createPitchingLeaders(qualifiedPitchers, "whip", 10, true), // Lower is better
    }),
    [qualifiedPitchers]
  );

  return (
    <div className="min-h-screen bg-cream">
        {/* Page Header */}
        <section className="bg-navy py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-8 w-8 text-gold" />
              <h1 className="font-headline text-3xl md:text-4xl font-bold uppercase tracking-wide text-chalk">
                League Statistics
              </h1>
            </div>
            <p className="text-cream-light text-lg">
              2026 Season Leaders and Full Statistical Breakdowns
            </p>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="sticky top-16 z-40 bg-cream border-b border-cream-dark shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              {/* Stats Type Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "batting" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("batting")}
                  className={cn(
                    activeTab !== "batting" && "text-charcoal hover:text-leather"
                  )}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Batting
                </Button>
                <Button
                  variant={activeTab === "pitching" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("pitching")}
                  className={cn(
                    activeTab !== "pitching" && "text-charcoal hover:text-leather"
                  )}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Pitching
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 rounded-retro border border-cream-dark p-1 bg-ivory">
                <button
                  onClick={() => setViewMode("leaders")}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-headline uppercase tracking-wider transition-colors",
                    viewMode === "leaders"
                      ? "bg-navy text-chalk"
                      : "text-charcoal hover:bg-cream-dark"
                  )}
                  aria-label="View leaderboards"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Leaders</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-headline uppercase tracking-wider transition-colors",
                    viewMode === "table"
                      ? "bg-navy text-chalk"
                      : "text-charcoal hover:bg-cream-dark"
                  )}
                  aria-label="View full stats table"
                >
                  <Table className="h-4 w-4" />
                  <span className="hidden sm:inline">Full Stats</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Qualifier Note */}
        <section className="bg-cream-light border-b border-cream-dark">
          <div className="container mx-auto px-4 py-2">
            <p className="text-sm text-charcoal-light">
              {activeTab === "batting" ? (
                <>
                  <span className="font-semibold">Minimum qualifier:</span> {BATTING_MIN_AB} at-bats
                  {" | "}
                  <span className="font-semibold">{qualifiedBatters.length}</span> qualified batters
                </>
              ) : (
                <>
                  <span className="font-semibold">Minimum qualifier:</span> {PITCHING_MIN_IP} innings pitched
                  {" | "}
                  <span className="font-semibold">{qualifiedPitchers.length}</span> qualified pitchers
                </>
              )}
            </p>
          </div>
        </section>

        {/* Stats Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Batting Leaders View */}
            {activeTab === "batting" && viewMode === "leaders" && (
              <div className="space-y-8">
                {/* Primary Stats - Featured */}
                <div>
                  <h2 className="font-headline text-xl uppercase tracking-wide text-navy mb-4 flex items-center gap-2">
                    <Badge variant="gold">Featured</Badge>
                    Top Categories
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <LeaderboardCard
                      title="Batting Average"
                      statLabel="AVG"
                      leaders={battingLeaders.avg}
                      formatValue={(v) => (v as number).toFixed(3)}
                    />
                    <LeaderboardCard
                      title="Home Runs"
                      statLabel="HR"
                      leaders={battingLeaders.homeRuns}
                      formatValue={(v) => String(v)}
                    />
                    <LeaderboardCard
                      title="Runs Batted In"
                      statLabel="RBI"
                      leaders={battingLeaders.rbi}
                      formatValue={(v) => String(v)}
                    />
                  </div>
                </div>

                {/* Secondary Stats */}
                <div>
                  <h2 className="font-headline text-xl uppercase tracking-wide text-navy mb-4">
                    Additional Categories
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <LeaderboardCard
                      title="Hits"
                      statLabel="H"
                      leaders={battingLeaders.hits}
                      formatValue={(v) => String(v)}
                    />
                    <LeaderboardCard
                      title="Runs Scored"
                      statLabel="R"
                      leaders={battingLeaders.runs}
                      formatValue={(v) => String(v)}
                    />
                    <LeaderboardCard
                      title="Stolen Bases"
                      statLabel="SB"
                      leaders={battingLeaders.stolenBases}
                      formatValue={(v) => String(v)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Batting Full Table View */}
            {activeTab === "batting" && viewMode === "table" && (
              <div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <BattingStatsTable
                      stats={battingStats}
                      minAtBats={BATTING_MIN_AB}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pitching Leaders View */}
            {activeTab === "pitching" && viewMode === "leaders" && (
              <div className="space-y-8">
                {/* Primary Stats - Featured */}
                <div>
                  <h2 className="font-headline text-xl uppercase tracking-wide text-navy mb-4 flex items-center gap-2">
                    <Badge variant="gold">Featured</Badge>
                    Top Categories
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <LeaderboardCard
                      title="Earned Run Average"
                      statLabel="ERA"
                      leaders={pitchingLeaders.era}
                      formatValue={(v) => (v as number).toFixed(2)}
                    />
                    <LeaderboardCard
                      title="Wins"
                      statLabel="W"
                      leaders={pitchingLeaders.wins}
                      formatValue={(v) => String(v)}
                    />
                    <LeaderboardCard
                      title="Strikeouts"
                      statLabel="K"
                      leaders={pitchingLeaders.strikeouts}
                      formatValue={(v) => String(v)}
                    />
                  </div>
                </div>

                {/* Secondary Stats */}
                <div>
                  <h2 className="font-headline text-xl uppercase tracking-wide text-navy mb-4">
                    Additional Categories
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    <LeaderboardCard
                      title="Saves"
                      statLabel="SV"
                      leaders={pitchingLeaders.saves}
                      formatValue={(v) => String(v)}
                    />
                    <LeaderboardCard
                      title="WHIP"
                      statLabel="WHIP"
                      leaders={pitchingLeaders.whip}
                      formatValue={(v) => (v as number).toFixed(2)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pitching Full Table View */}
            {activeTab === "pitching" && viewMode === "table" && (
              <div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <PitchingStatsTable
                      stats={pitchingStats}
                      minInningsPitched={PITCHING_MIN_IP}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* Season Summary Card */}
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <Card className="stitch-border overflow-hidden">
              <CardContent className="p-6">
                <h2 className="font-headline text-xl uppercase tracking-wide text-navy mb-4">
                  2026 Season Snapshot
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-retro bg-cream p-4 text-center">
                    <div className="font-mono text-3xl font-bold text-navy">
                      {battingStats.length}
                    </div>
                    <div className="text-sm text-charcoal-light uppercase tracking-wide">
                      Total Batters
                    </div>
                  </div>
                  <div className="rounded-retro bg-cream p-4 text-center">
                    <div className="font-mono text-3xl font-bold text-navy">
                      {pitchingStats.length}
                    </div>
                    <div className="text-sm text-charcoal-light uppercase tracking-wide">
                      Total Pitchers
                    </div>
                  </div>
                  <div className="rounded-retro bg-cream p-4 text-center">
                    <div className="font-mono text-3xl font-bold text-gold">
                      {battingStats.reduce((sum, p) => sum + p.homeRuns, 0)}
                    </div>
                    <div className="text-sm text-charcoal-light uppercase tracking-wide">
                      League Home Runs
                    </div>
                  </div>
                  <div className="rounded-retro bg-cream p-4 text-center">
                    <div className="font-mono text-3xl font-bold text-field">
                      {pitchingStats.reduce((sum, p) => sum + p.strikeouts, 0)}
                    </div>
                    <div className="text-sm text-charcoal-light uppercase tracking-wide">
                      League Strikeouts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
    </div>
  );
}
