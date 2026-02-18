'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  Table,
  LayoutGrid,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  LeaderboardCard,
  BattingStatsTable,
  PitchingStatsTable,
  type LeaderEntry,
} from '@/components/stats';
import {
  battingStats,
  pitchingStats,
  getQualifiedBatters,
  getQualifiedPitchers,
  BATTING_MIN_AB,
  PITCHING_MIN_IP,
  type BattingStats,
  type PitchingStats,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type StatsTab = 'batting' | 'pitching';
type ViewMode = 'leaders' | 'table';

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
 * Admin Statistics Page
 *
 * View and manage league statistics with admin controls.
 */
export default function AdminStatsPage() {
  const [activeTab, setActiveTab] = useState<StatsTab>('batting');
  const [viewMode, setViewMode] = useState<ViewMode>('leaders');
  const [isLoading, setIsLoading] = useState(false);

  const qualifiedBatters = useMemo(() => getQualifiedBatters(), []);
  const qualifiedPitchers = useMemo(() => getQualifiedPitchers(), []);

  const battingLeaders = useMemo(
    () => ({
      avg: createBattingLeaders(qualifiedBatters, 'avg', 10),
      homeRuns: createBattingLeaders(qualifiedBatters, 'homeRuns', 10),
      rbi: createBattingLeaders(qualifiedBatters, 'rbi', 10),
      hits: createBattingLeaders(qualifiedBatters, 'hits', 10),
      runs: createBattingLeaders(qualifiedBatters, 'runs', 10),
      stolenBases: createBattingLeaders(qualifiedBatters, 'stolenBases', 10),
    }),
    [qualifiedBatters]
  );

  const pitchingLeaders = useMemo(
    () => ({
      era: createPitchingLeaders(qualifiedPitchers, 'era', 10, true),
      wins: createPitchingLeaders(qualifiedPitchers, 'wins', 10),
      strikeouts: createPitchingLeaders(qualifiedPitchers, 'strikeouts', 10),
      saves: createPitchingLeaders(qualifiedPitchers, 'saves', 10),
      whip: createPitchingLeaders(qualifiedPitchers, 'whip', 10, true),
    }),
    [qualifiedPitchers]
  );

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Statistics
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            View and manage league statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/stats" target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-navy">{battingStats.length}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Batters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-field/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-field" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-field">{pitchingStats.length}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Pitchers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-gold">
                  {battingStats.reduce((sum, p) => sum + p.homeRuns, 0)}
                </p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Home Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cardinal/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cardinal" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-cardinal">
                  {pitchingStats.reduce((sum, p) => sum + p.strikeouts, 0)}
                </p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Strikeouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'batting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('batting')}
              >
                <Users className="w-4 h-4 mr-2" />
                Batting
              </Button>
              <Button
                variant={activeTab === 'pitching' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('pitching')}
              >
                <Users className="w-4 h-4 mr-2" />
                Pitching
              </Button>
            </div>

            <div className="flex gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => setViewMode('leaders')}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'leaders'
                    ? 'bg-navy text-chalk'
                    : 'text-charcoal hover:bg-gray-200'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                Leaders
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'table'
                    ? 'bg-navy text-chalk'
                    : 'text-charcoal hover:bg-gray-200'
                )}
              >
                <Table className="w-4 h-4" />
                Full Stats
              </button>
            </div>
          </div>

          <div className="mt-2 text-sm text-charcoal-light">
            {activeTab === 'batting' ? (
              <>
                Minimum qualifier: {BATTING_MIN_AB} at-bats | {qualifiedBatters.length} qualified batters
              </>
            ) : (
              <>
                Minimum qualifier: {PITCHING_MIN_IP} innings pitched | {qualifiedPitchers.length} qualified pitchers
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Content */}
      {activeTab === 'batting' && viewMode === 'leaders' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-headline text-lg uppercase tracking-wide text-navy mb-4 flex items-center gap-2">
              <Badge variant="primary">Featured</Badge>
              Top Categories
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <div>
            <h2 className="font-headline text-lg uppercase tracking-wide text-navy mb-4">
              Additional Categories
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {activeTab === 'batting' && viewMode === 'table' && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <BattingStatsTable stats={battingStats} minAtBats={BATTING_MIN_AB} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'pitching' && viewMode === 'leaders' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-headline text-lg uppercase tracking-wide text-navy mb-4 flex items-center gap-2">
              <Badge variant="primary">Featured</Badge>
              Top Categories
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <div>
            <h2 className="font-headline text-lg uppercase tracking-wide text-navy mb-4">
              Additional Categories
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
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

      {activeTab === 'pitching' && viewMode === 'table' && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <PitchingStatsTable stats={pitchingStats} minInningsPitched={PITCHING_MIN_IP} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
