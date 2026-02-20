import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TeamHeader } from "@/components/teams/TeamHeader";
import { RosterTable } from "@/components/teams/RosterTable";
import { GameCard } from "@/components/games/GameCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getTeamDetailsById,
  getRosterByTeamId,
  getGamesByTeam,
  battingStats,
  pitchingStats,
} from "@/lib/mock-data";
import { getTeamById, getTeamRoster } from "@/lib/db/queries";
import {
  ChevronLeft,
  Calendar,
  Users,
  TrendingUp,
  Target,
  Award,
} from "lucide-react";

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

/**
 * Team Profile Page
 * Displays detailed team information, roster, and games
 */
export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;

  // Check if this is a UUID (database team) or slug (mock data)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);

  // Fetch team from database for UUIDs, mock data for slugs
  const team = isUUID
    ? await getTeamById(teamId)
    : getTeamDetailsById(teamId);

  if (!team) {
    notFound();
  }

  // Fetch roster from database for UUIDs, mock data for slugs
  const rosterData = isUUID
    ? await getTeamRoster(teamId)
    : null;
  const roster = isUUID
    ? (rosterData?.players || [])
    : getRosterByTeamId(teamId);

  // Games are only available for mock data teams for now
  const allGames = isUUID ? [] : getGamesByTeam(teamId);

  // Normalize team object structure for rendering
  const normalizedTeam = {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    primaryColor: team.primaryColor || '#1B3A5F',
    secondaryColor: team.secondaryColor || '#6B7280',
    wins: 'wins' in team ? team.wins : 0,
    losses: 'losses' in team ? team.losses : 0,
    ties: 'ties' in team ? team.ties : 0,
    runsScored: 'runsScored' in team ? team.runsScored : 0,
    runsAllowed: 'runsAllowed' in team ? team.runsAllowed : 0,
  };

  // Separate upcoming and recent games
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingGames = allGames
    .filter((game) => {
      const gameDate = new Date(game.date);
      return gameDate >= today && game.status !== "final";
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const recentGames = allGames
    .filter((game) => game.status === "final")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Calculate team stats
  const teamBattingStats = battingStats.filter((s) => s.teamId === teamId);
  const teamPitchingStats = pitchingStats.filter((s) => s.teamId === teamId);

  const teamAvg =
    teamBattingStats.length > 0
      ? (teamBattingStats.reduce((sum, s) => sum + s.avg, 0) / teamBattingStats.length)
          .toFixed(3)
          .slice(1)
      : "-";

  const teamEra =
    teamPitchingStats.length > 0
      ? (teamPitchingStats.reduce((sum, s) => sum + s.era, 0) / teamPitchingStats.length).toFixed(2)
      : "-";

  const totalHR = teamBattingStats.reduce((sum, s) => sum + s.homeRuns, 0);
  const totalSB = teamBattingStats.reduce((sum, s) => sum + s.stolenBases, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Back Link */}
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to Teams
          </Link>
        </div>

        {/* Team Header */}
        <TeamHeader team={normalizedTeam} />

        {/* Team Stats Summary */}
        <section className="container mx-auto px-4 -mt-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Team AVG"
              value={teamAvg}
              color={normalizedTeam.primaryColor}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Team ERA"
              value={teamEra}
              color={normalizedTeam.primaryColor}
            />
            <StatCard
              icon={<Award className="h-5 w-5" />}
              label="Home Runs"
              value={totalHR.toString()}
              color={normalizedTeam.primaryColor}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Stolen Bases"
              value={totalSB.toString()}
              color={normalizedTeam.primaryColor}
            />
          </div>
        </section>

        {/* Content Grid */}
        <section className="container mx-auto px-4 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Roster - Full width on mobile, 2/3 on desktop */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" aria-hidden="true" />
                    Team Roster
                    <Badge variant="outline" className="ml-auto">
                      {roster.length} Players
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <RosterTable roster={roster} teamPrimaryColor={normalizedTeam.primaryColor} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Games */}
            <div className="space-y-8">
              {/* Upcoming Games */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-success" aria-hidden="true" />
                    Upcoming Games
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {upcomingGames.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingGames.map((game) => (
                        <GameCard key={game.id} game={game} variant="compact" />
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <Link href="/schedule">View Full Schedule</Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">
                      No upcoming games scheduled
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Results */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-gold" aria-hidden="true" />
                    Recent Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {recentGames.length > 0 ? (
                    <div className="space-y-4">
                      {recentGames.map((game) => {
                        const isHome = game.homeTeam.id === teamId;
                        const teamScore = isHome ? game.homeScore : game.awayScore;
                        const oppScore = isHome ? game.awayScore : game.homeScore;
                        const opponent = isHome ? game.awayTeam : game.homeTeam;
                        const won =
                          teamScore !== null && oppScore !== null && teamScore > oppScore;

                        return (
                          <div
                            key={game.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={won ? "success" : "danger"}
                                className="text-xs w-8 justify-center"
                              >
                                {won ? "W" : "L"}
                              </Badge>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {isHome ? "vs" : "@"} {opponent.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(game.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-lg text-gray-800">
                              {teamScore}-{oppScore}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">
                      No recent games
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Stat Card component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
      <div
        className="p-2 rounded-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
          {label}
        </div>
        <div className="font-mono font-bold text-gray-900 text-xl">{value}</div>
      </div>
    </div>
  );
}
