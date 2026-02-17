"use client";

import * as React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandingsTable, type TeamStanding } from "@/components/standings/StandingsTable";
import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, Calendar } from "lucide-react";
import { teamDetails } from "@/lib/mock-data";

// -----------------------------------------------------------------------------
// 2025 Season Standings - Generated from real data
// -----------------------------------------------------------------------------
function generateStandings(): TeamStanding[] {
  // Sort by win percentage (wins / (wins + losses)), handling ties
  const sorted = [...teamDetails].sort((a, b) => {
    const pctA = a.wins / (a.wins + a.losses) || 0;
    const pctB = b.wins / (b.wins + b.losses) || 0;
    if (pctB !== pctA) return pctB - pctA;
    // Tiebreaker: run differential
    const diffA = a.runsFor - a.runsAgainst;
    const diffB = b.runsFor - b.runsAgainst;
    return diffB - diffA;
  });

  // Calculate games behind leader
  const leader = sorted[0];
  const leaderWins = leader.wins;
  const leaderLosses = leader.losses;

  return sorted.map((team, index) => {
    const pct = team.wins / (team.wins + team.losses) || 0;
    const diff = team.runsFor - team.runsAgainst;

    // Calculate games behind
    let gb: string | number;
    if (index === 0) {
      gb = "-";
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
      streak: "-", // Not tracked in current data
      lastFive: [], // Not tracked in current data
    };
  });
}

const STANDINGS_2025: TeamStanding[] = generateStandings();

const AVAILABLE_SEASONS = [
  { value: "2025", label: "2025 Season" },
];

// -----------------------------------------------------------------------------
// Season Selector Component
// -----------------------------------------------------------------------------
interface SeasonSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function SeasonSelector({ value, onChange }: SeasonSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none w-full sm:w-auto px-4 py-2 pr-10",
          "bg-chalk border-2 border-cream-dark rounded-retro",
          "font-headline text-sm uppercase tracking-wider text-navy",
          "focus:border-leather focus:outline-none",
          "cursor-pointer transition-colors"
        )}
        aria-label="Select season"
      >
        {AVAILABLE_SEASONS.map((season) => (
          <option key={season.value} value={season.value}>
            {season.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-charcoal-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Quick Stats Component
// -----------------------------------------------------------------------------
interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

function QuickStat({ icon, label, value, subtext }: QuickStatProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-ivory rounded-retro border border-cream-dark">
      <div className="p-2 bg-navy/10 rounded-full text-navy">{icon}</div>
      <div>
        <div className="text-xs text-charcoal-light uppercase font-headline tracking-wider">
          {label}
        </div>
        <div className="font-mono font-bold text-navy text-lg">{value}</div>
        {subtext && (
          <div className="text-xs text-charcoal-light">{subtext}</div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------
export default function StandingsPage() {
  const [selectedSeason, setSelectedSeason] = React.useState("2025");
  const [standings] = React.useState<TeamStanding[]>(STANDINGS_2025);

  // Calculate quick stats
  const leader = standings.find((t) => t.rank === 1);
  const totalGames = standings.reduce((acc, t) => acc + t.wins + t.losses + (t.ties || 0), 0) / 2;
  // Best run differential
  const bestDiff = standings.reduce((best, t) => {
    if (t.diff > best.diff) {
      return { team: t.name, diff: t.diff };
    }
    return best;
  }, { team: "", diff: -999 });

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-navy py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl lg:text-4xl text-chalk mb-2">
                  League Standings
                </h1>
                <p className="text-cream-light font-body">
                  Current rankings for the {selectedSeason} season
                </p>
              </div>
              <SeasonSelector
                value={selectedSeason}
                onChange={setSelectedSeason}
              />
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="container mx-auto px-4 -mt-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickStat
              icon={<Trophy className="w-5 h-5" />}
              label="Current Leader"
              value={leader?.name || "-"}
              subtext={leader ? `${leader.wins}-${leader.losses}${leader.ties ? `-${leader.ties}` : ""} (.${Math.round(leader.pct * 1000)})` : undefined}
            />
            <QuickStat
              icon={<TrendingUp className="w-5 h-5" />}
              label="Best Run Diff"
              value={bestDiff.diff > 0 ? `+${bestDiff.diff}` : bestDiff.diff.toString()}
              subtext={bestDiff.team || undefined}
            />
            <QuickStat
              icon={<Calendar className="w-5 h-5" />}
              label="Games Played"
              value={totalGames.toString()}
              subtext="Season in progress"
            />
          </div>
        </section>

        {/* Standings Table */}
        <section className="container mx-auto px-4 py-8 lg:py-12">
          <Card className="overflow-hidden">
            <CardHeader className="stitch-border bg-cream border-b border-cream-dark">
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
          <div className="mt-6 p-4 bg-ivory rounded-retro border border-cream-dark">
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
          </div>

          {/* Last Updated */}
          <p className="mt-4 text-center text-xs text-charcoal-light">
            Standings updated: February 16, 2025 at 10:30 AM EST
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
