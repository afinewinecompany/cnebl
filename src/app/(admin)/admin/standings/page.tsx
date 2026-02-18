'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StandingsTable, type TeamStanding } from '@/components/standings/StandingsTable';
import {
  Trophy,
  TrendingUp,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { teamDetails } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

function generateStandings(): TeamStanding[] {
  const sorted = [...teamDetails].sort((a, b) => {
    const pctA = a.wins / (a.wins + a.losses) || 0;
    const pctB = b.wins / (b.wins + b.losses) || 0;
    if (pctB !== pctA) return pctB - pctA;
    const diffA = a.runsFor - a.runsAgainst;
    const diffB = b.runsFor - b.runsAgainst;
    return diffB - diffA;
  });

  const leader = sorted[0];
  const leaderWins = leader.wins;
  const leaderLosses = leader.losses;

  return sorted.map((team, index) => {
    const pct = team.wins / (team.wins + team.losses) || 0;
    const diff = team.runsFor - team.runsAgainst;

    let gb: string | number;
    if (index === 0) {
      gb = '-';
    } else {
      const gamesBack = ((leaderWins - team.wins) + (team.losses - leaderLosses)) / 2;
      gb = gamesBack;
    }

    return {
      id: team.id,
      rank: index + 1,
      name: team.name,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pct: pct,
      gb: gb,
      runsScored: team.runsFor,
      runsAllowed: team.runsAgainst,
      diff: diff,
      streak: '-',
      lastFive: [],
    };
  });
}

/**
 * Admin Standings Page
 *
 * View and manage league standings with admin controls.
 */
export default function AdminStandingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const standings = useMemo(() => generateStandings(), []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const leader = standings.find((t) => t.rank === 1);
  const totalGames = standings.reduce((acc, t) => acc + t.wins + t.losses + (t.ties || 0), 0) / 2;
  const bestDiff = standings.reduce(
    (best, t) => {
      if (t.diff > best.diff) {
        return { team: t.name, diff: t.diff };
      }
      return best;
    },
    { team: '', diff: -999 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Standings
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            View and manage league standings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-accent focus:outline-none"
          >
            <option value="2025">2025 Season</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/standings" target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Current Leader</p>
                <p className="text-lg font-headline font-bold text-navy">{leader?.name || '-'}</p>
                {leader && (
                  <p className="text-xs text-charcoal-light">
                    {leader.wins}-{leader.losses}
                    {leader.ties ? `-${leader.ties}` : ''} (.{Math.round(leader.pct * 1000)})
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-field/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-field" />
              </div>
              <div>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Best Run Diff</p>
                <p className="text-lg font-mono font-bold text-navy">
                  {bestDiff.diff > 0 ? `+${bestDiff.diff}` : bestDiff.diff}
                </p>
                <p className="text-xs text-charcoal-light">{bestDiff.team}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Games Played</p>
                <p className="text-lg font-mono font-bold text-navy">{totalGames}</p>
                <p className="text-xs text-charcoal-light">Season in progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standings Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            {selectedSeason} Season Standings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <StandingsTable standings={standings} />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-headline text-sm uppercase tracking-wider text-navy mb-3">
            Legend
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal-light">
            <span>
              <strong className="text-navy">W</strong> - Wins
            </span>
            <span>
              <strong className="text-navy">L</strong> - Losses
            </span>
            <span>
              <strong className="text-navy">PCT</strong> - Win Percentage
            </span>
            <span>
              <strong className="text-navy">GB</strong> - Games Behind
            </span>
            <span>
              <strong className="text-navy">RS</strong> - Runs Scored
            </span>
            <span>
              <strong className="text-navy">RA</strong> - Runs Allowed
            </span>
            <span>
              <strong className="text-navy">DIFF</strong> - Run Differential
            </span>
            <span>
              <strong className="text-navy">L5</strong> - Last 5 Games
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <p className="text-center text-xs text-charcoal-light">
        Standings updated: {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}
