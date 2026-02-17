import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardEdit,
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  Play,
  ArrowRight,
  Radio
} from 'lucide-react';
import { mockGames, getGamesByTeam } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Live Scoring - CNEBL',
  description: 'Score games for your team',
};

/**
 * Format date for display
 */
function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const gameDate = new Date(date);
  gameDate.setHours(0, 0, 0, 0);

  if (gameDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (gameDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Format time for display
 */
function formatGameTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Scoring Page
 *
 * Lists games that the manager can score for their team.
 * Only managers can access this page.
 */
export default async function ScoringPage() {
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
                <AlertCircle className="w-12 h-12 text-cardinal" />
              </div>
              <h2 className="font-headline text-xl text-navy uppercase tracking-wide mb-2">
                Manager Access Required
              </h2>
              <p className="text-charcoal-light font-body mb-6">
                Only team managers can score games. Contact your league administrator
                if you should have manager access.
              </p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user has a team
  if (!user.teamId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="p-4 bg-gold/10 rounded-full w-fit mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-gold" />
              </div>
              <h2 className="font-headline text-xl text-navy uppercase tracking-wide mb-2">
                No Team Assigned
              </h2>
              <p className="text-charcoal-light font-body mb-6">
                You need to be assigned to a team before you can score games.
                Contact your league administrator.
              </p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get games for manager's team
  const teamGames = getGamesByTeam(user.teamId);

  // Filter games into categories
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // In-progress games (can continue scoring)
  const inProgressGames = teamGames.filter(game => game.status === 'in_progress');

  // Scheduled games (upcoming games that can be started)
  const scheduledGames = teamGames
    .filter(game => {
      if (game.status !== 'scheduled') return false;
      const gameDate = new Date(game.date);
      gameDate.setHours(0, 0, 0, 0);
      // Include games from today onwards
      return gameDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Recently completed games (last 5)
  const recentGames = teamGames
    .filter(game => game.status === 'final')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const teamName = user.teamName || 'Your Team';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-cardinal/10 rounded-full">
            <ClipboardEdit className="h-6 w-6 text-cardinal" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
              Live Scoring
            </h1>
            <p className="text-charcoal-light font-body">
              Score games for {teamName}
            </p>
          </div>
        </div>
      </div>

      {/* In Progress Games - Priority Section */}
      {inProgressGames.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="live-indicator">
              <Radio className="h-5 w-5 text-cardinal" />
            </div>
            <h2 className="font-headline text-xl font-semibold text-navy uppercase tracking-wide">
              Live Games
            </h2>
            <Badge variant="live" size="sm">In Progress</Badge>
          </div>

          <div className="space-y-4">
            {inProgressGames.map(game => {
              const isHome = game.homeTeam.id === user.teamId;
              const opponent = isHome ? game.awayTeam : game.homeTeam;
              const myScore = isHome ? game.homeScore : game.awayScore;
              const theirScore = isHome ? game.awayScore : game.homeScore;

              return (
                <Card key={game.id} className="border-2 border-cardinal/30 bg-cardinal/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="live">
                            <span className="w-2 h-2 rounded-full bg-chalk animate-pulse mr-2" />
                            {game.isTopInning ? 'Top' : 'Bot'} {game.inning}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: opponent.primaryColor }}
                            />
                            <span className="font-headline text-lg text-navy">
                              {isHome ? 'vs' : '@'} {opponent.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-2xl font-mono font-bold">
                          <span className={cn(
                            myScore !== null && theirScore !== null && myScore > theirScore
                              ? 'text-field'
                              : 'text-navy'
                          )}>
                            {teamName.split(' ').pop()}: {myScore ?? 0}
                          </span>
                          <span className="text-charcoal-light">-</span>
                          <span className={cn(
                            myScore !== null && theirScore !== null && theirScore > myScore
                              ? 'text-cardinal'
                              : 'text-navy'
                          )}>
                            {opponent.abbreviation}: {theirScore ?? 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-charcoal-light">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {game.location}
                          </span>
                        </div>
                      </div>

                      <Button asChild size="lg" className="min-w-[180px]">
                        <Link href={`/scoring/${game.id}`}>
                          <Play className="w-5 h-5 mr-2" />
                          Continue Scoring
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Scheduled Games */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-navy" />
          <h2 className="font-headline text-xl font-semibold text-navy uppercase tracking-wide">
            Upcoming Games
          </h2>
          <Badge variant="default" size="sm">{scheduledGames.length}</Badge>
        </div>

        {scheduledGames.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
              <p className="text-charcoal-light">
                No upcoming games scheduled
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {scheduledGames.map(game => {
              const isHome = game.homeTeam.id === user.teamId;
              const opponent = isHome ? game.awayTeam : game.homeTeam;
              const gameDate = formatGameDate(game.date);
              const gameTime = formatGameTime(game.time);

              return (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="secondary">{gameDate}</Badge>
                          <span className="text-sm text-charcoal-light flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {gameTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: opponent.primaryColor }}
                          />
                          <span className="font-headline text-lg text-navy">
                            {isHome ? 'vs' : '@'} {opponent.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-charcoal-light">
                          <MapPin className="w-4 h-4" />
                          {game.location} - {game.field}
                        </div>
                      </div>

                      <Button asChild variant="outline" className="min-w-[160px]">
                        <Link href={`/scoring/${game.id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          Start Scoring
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-charcoal-light" />
            <h2 className="font-headline text-xl font-semibold text-navy uppercase tracking-wide">
              Recent Games
            </h2>
          </div>

          <div className="space-y-2">
            {recentGames.map(game => {
              const isHome = game.homeTeam.id === user.teamId;
              const opponent = isHome ? game.awayTeam : game.homeTeam;
              const myScore = isHome ? game.homeScore : game.awayScore;
              const theirScore = isHome ? game.awayScore : game.homeScore;
              const won = myScore !== null && theirScore !== null && myScore > theirScore;
              const lost = myScore !== null && theirScore !== null && myScore < theirScore;
              const tied = myScore === theirScore;

              return (
                <Card key={game.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={won ? 'success' : lost ? 'danger' : 'secondary'}
                          className="w-8 text-center"
                        >
                          {won ? 'W' : lost ? 'L' : 'T'}
                        </Badge>
                        <div>
                          <span className="text-sm text-charcoal-light">
                            {new Date(game.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-charcoal-light mx-2">|</span>
                          <span className="font-headline text-navy">
                            {isHome ? 'vs' : '@'} {opponent.name}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-bold text-navy">
                        {myScore} - {theirScore}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {inProgressGames.length === 0 && scheduledGames.length === 0 && recentGames.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardEdit className="w-16 h-16 text-charcoal-light mx-auto mb-4" />
            <h2 className="font-headline text-xl text-navy mb-2">No Games to Score</h2>
            <p className="text-charcoal-light mb-6">
              There are no games available for scoring at this time.
              Check back when games are scheduled.
            </p>
            <Button asChild variant="outline">
              <Link href="/schedule">
                <Calendar className="w-4 h-4 mr-2" />
                View Full Schedule
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
