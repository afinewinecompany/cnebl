import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { ScoringPageClient } from './ScoringPageClient';
import { mockGames, teams } from '@/lib/mock-data';
import type { GameWithTeams, InningHalf } from '@/types';

export const metadata: Metadata = {
  title: 'Game Scoring - CNEBL',
  description: 'Live game scoring interface',
};

interface ScoringGamePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

/**
 * Transform mock game data to GameWithTeams format
 */
function transformMockGame(mockGame: typeof mockGames[0]): GameWithTeams {
  return {
    id: mockGame.id,
    seasonId: 'season-2025',
    gameNumber: parseInt(mockGame.id.replace('game-', '')),
    homeTeamId: mockGame.homeTeam.id,
    awayTeamId: mockGame.awayTeam.id,
    gameDate: mockGame.date,
    gameTime: mockGame.time + ':00',
    timezone: 'America/New_York',
    locationName: mockGame.location,
    locationAddress: null,
    status: mockGame.status === 'in_progress' ? 'in_progress' :
            mockGame.status === 'final' ? 'final' :
            mockGame.status === 'scheduled' ? 'scheduled' :
            mockGame.status === 'postponed' ? 'postponed' :
            mockGame.status === 'cancelled' ? 'cancelled' : 'scheduled',
    homeScore: mockGame.homeScore ?? 0,
    awayScore: mockGame.awayScore ?? 0,
    currentInning: mockGame.inning ?? 1,
    currentInningHalf: (mockGame.isTopInning ? 'top' : 'bottom') as InningHalf,
    outs: 0,
    homeInningScores: mockGame.status === 'in_progress' || mockGame.status === 'final'
      ? generateMockInningScores(mockGame.homeScore ?? 0, mockGame.inning ?? 9)
      : [],
    awayInningScores: mockGame.status === 'in_progress' || mockGame.status === 'final'
      ? generateMockInningScores(mockGame.awayScore ?? 0, mockGame.inning ?? 9)
      : [],
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: mockGame.status === 'in_progress' || mockGame.status === 'final'
      ? new Date().toISOString()
      : null,
    endedAt: mockGame.status === 'final' ? new Date().toISOString() : null,
    homeTeam: {
      id: mockGame.homeTeam.id,
      name: mockGame.homeTeam.name,
      abbreviation: mockGame.homeTeam.abbreviation,
      primaryColor: mockGame.homeTeam.primaryColor,
      secondaryColor: mockGame.homeTeam.secondaryColor,
      logoUrl: null,
    },
    awayTeam: {
      id: mockGame.awayTeam.id,
      name: mockGame.awayTeam.name,
      abbreviation: mockGame.awayTeam.abbreviation,
      primaryColor: mockGame.awayTeam.primaryColor,
      secondaryColor: mockGame.awayTeam.secondaryColor,
      logoUrl: null,
    },
  };
}

/**
 * Generate mock inning scores that add up to the total
 */
function generateMockInningScores(totalRuns: number, innings: number): number[] {
  const scores: number[] = [];
  let remaining = totalRuns;

  for (let i = 0; i < innings; i++) {
    if (i === innings - 1) {
      // Last inning gets the remaining runs
      scores.push(remaining);
    } else if (remaining <= 0) {
      scores.push(0);
    } else {
      // Random distribution
      const max = Math.min(remaining, 3);
      const runs = Math.floor(Math.random() * (max + 1));
      scores.push(runs);
      remaining -= runs;
    }
  }

  return scores;
}

/**
 * Game Scoring Page (Server Component)
 *
 * Validates user is manager of one of the teams and fetches game data.
 * Renders the client component for actual scoring functionality.
 */
export default async function ScoringGamePage({ params }: ScoringGamePageProps) {
  const resolvedParams = await params;
  const { gameId } = resolvedParams;
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  // Check if user is a manager
  if (user.role !== 'manager' && user.role !== 'admin' && user.role !== 'commissioner') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="p-4 bg-cardinal/10 rounded-full w-fit mx-auto mb-4">
                <Lock className="w-12 h-12 text-cardinal" />
              </div>
              <h2 className="font-headline text-xl text-navy uppercase tracking-wide mb-2">
                Manager Access Required
              </h2>
              <p className="text-charcoal-light font-body mb-6">
                Only team managers can score games.
              </p>
              <Button asChild>
                <Link href="/scoring">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Scoring
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Find the game
  const mockGame = mockGames.find(g => g.id === gameId);

  if (!mockGame) {
    notFound();
  }

  // Check if user is manager of one of the teams
  const isHomeManager = mockGame.homeTeam.id === user.teamId;
  const isAwayManager = mockGame.awayTeam.id === user.teamId;

  // For admins/commissioners, allow access to any game
  const isLeagueAdmin = user.role === 'admin' || user.role === 'commissioner';

  if (!isHomeManager && !isAwayManager && !isLeagueAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="p-4 bg-cardinal/10 rounded-full w-fit mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-cardinal" />
              </div>
              <h2 className="font-headline text-xl text-navy uppercase tracking-wide mb-2">
                Not Your Team&apos;s Game
              </h2>
              <p className="text-charcoal-light font-body mb-6">
                You can only score games for your team ({user.teamName}).
                This game is between {mockGame.homeTeam.name} and {mockGame.awayTeam.name}.
              </p>
              <Button asChild>
                <Link href="/scoring">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Scoring
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if game is in a scorable state
  if (mockGame.status !== 'scheduled' && mockGame.status !== 'in_progress') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="p-4 bg-gold/10 rounded-full w-fit mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-gold" />
              </div>
              <h2 className="font-headline text-xl text-navy uppercase tracking-wide mb-2">
                Game Not Available for Scoring
              </h2>
              <p className="text-charcoal-light font-body mb-2">
                This game is marked as <strong>{mockGame.status}</strong>.
              </p>
              {mockGame.status === 'final' && (
                <p className="text-charcoal-light font-body mb-6">
                  Final Score: {mockGame.homeTeam.abbreviation} {mockGame.homeScore} - {mockGame.awayScore} {mockGame.awayTeam.abbreviation}
                </p>
              )}
              <Button asChild>
                <Link href="/scoring">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Scoring
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Transform to full game data
  const gameData = transformMockGame(mockGame);

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Back Link */}
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/scoring">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Games
          </Link>
        </Button>
      </div>

      {/* Scoring Interface */}
      <ScoringPageClient
        game={gameData}
        currentUserId={user.id}
        currentUserTeamId={user.teamId || ''}
        isHomeManager={isHomeManager || isLeagueAdmin}
        isAwayManager={isAwayManager || isLeagueAdmin}
      />
    </div>
  );
}
