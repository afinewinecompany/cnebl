'use client';

import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameAvailabilityCard } from '@/components/availability/GameAvailabilityCard';
import { TeamAvailabilitySummary } from '@/components/availability/TeamAvailabilitySummary';
import { mockGames, getUpcomingGames, getGamesByTeam } from '@/lib/mock-data';
import type { AvailabilityStatus } from '@/types';
import { Calendar, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Mock availability data for demo
const mockPlayerAvailability: Record<string, { status: AvailabilityStatus; note?: string }> = {
  'game-005': { status: 'available' },
  'game-006': { status: 'no_response' },
};

// Mock team availability for managers
const mockTeamAvailability = [
  { playerId: 'p1', playerName: 'David Giarusso', jerseyNumber: 5, position: 'UTIL', status: 'available' as AvailabilityStatus, respondedAt: '2026-02-15T10:30:00Z' },
  { playerId: 'p2', playerName: 'Matt Baczewski', jerseyNumber: 9, position: 'UTIL', status: 'available' as AvailabilityStatus, respondedAt: '2026-02-15T11:15:00Z' },
  { playerId: 'p3', playerName: 'Curt Gebo', jerseyNumber: 11, position: 'UTIL', status: 'unavailable' as AvailabilityStatus, note: 'Work travel', respondedAt: '2026-02-15T09:00:00Z' },
  { playerId: 'p4', playerName: 'Ryan Costa', jerseyNumber: 19, position: 'SP', status: 'available' as AvailabilityStatus, respondedAt: '2026-02-15T14:00:00Z' },
  { playerId: 'p5', playerName: 'Alex Koulet', jerseyNumber: 31, position: 'UTIL', status: 'tentative' as AvailabilityStatus, note: 'Will try to make it after work', respondedAt: '2026-02-15T12:30:00Z' },
  { playerId: 'p6', playerName: 'Sean Fonteyne', jerseyNumber: 35, position: 'UTIL', status: 'no_response' as AvailabilityStatus },
  { playerId: 'p7', playerName: 'John Hebert', jerseyNumber: 36, position: 'UTIL', status: 'available' as AvailabilityStatus, respondedAt: '2026-02-14T18:00:00Z' },
  { playerId: 'p8', playerName: 'Ryan Klink', jerseyNumber: 37, position: 'UTIL', status: 'no_response' as AvailabilityStatus },
  { playerId: 'p9', playerName: 'Joe Belakonis', jerseyNumber: 40, position: 'UTIL', status: 'available' as AvailabilityStatus, respondedAt: '2026-02-15T08:00:00Z' },
  { playerId: 'p10', playerName: 'Joey Jones', jerseyNumber: 44, position: 'UTIL', status: 'unavailable' as AvailabilityStatus, note: 'Family commitment', respondedAt: '2026-02-14T20:00:00Z' },
];

/**
 * Availability Page
 *
 * Shows upcoming games with availability status for the current player
 * Managers can see team availability summary
 */
export default function AvailabilityPage() {
  const { user, isLoading, isAuthenticated, hasRole, teamId, teamName } = useAuth();
  const [availability, setAvailability] = useState(mockPlayerAvailability);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Get upcoming games for the user's team
  const upcomingGames = React.useMemo(() => {
    if (teamId) {
      return getGamesByTeam(teamId).filter((game) => {
        const gameDate = new Date(game.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return gameDate >= today && game.status === 'scheduled';
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return getUpcomingGames(5);
  }, [teamId]);

  // Calculate counts for each status
  const availabilityCounts = React.useMemo(() => {
    const counts = {
      available: 0,
      unavailable: 0,
      tentative: 0,
      no_response: 0,
      total: upcomingGames.length,
    };

    upcomingGames.forEach((game) => {
      const status = availability[game.id]?.status || 'no_response';
      counts[status]++;
    });

    return counts;
  }, [upcomingGames, availability]);

  // Team availability counts for each game (mock data)
  const getTeamAvailabilityCounts = () => {
    const available = mockTeamAvailability.filter(p => p.status === 'available').length;
    const unavailable = mockTeamAvailability.filter(p => p.status === 'unavailable').length;
    const tentative = mockTeamAvailability.filter(p => p.status === 'tentative').length;
    const no_response = mockTeamAvailability.filter(p => p.status === 'no_response').length;
    return { available, unavailable, tentative, no_response, total: mockTeamAvailability.length };
  };

  // Handle availability update
  const handleAvailabilityUpdate = async (gameId: string, status: AvailabilityStatus, note?: string) => {
    setIsUpdating(gameId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setAvailability((prev) => ({
      ...prev,
      [gameId]: { status, note },
    }));

    setIsUpdating(null);
  };

  const isManager = hasRole('manager');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-leather" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
            <h2 className="font-headline text-xl text-navy mb-2">Sign In Required</h2>
            <p className="text-charcoal-light">
              Please sign in to view and manage your game availability.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-field/10 rounded-full">
            <Calendar className="h-6 w-6 text-field" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
              Game Availability
            </h1>
            <p className="text-charcoal-light font-body">
              {teamName
                ? `Mark your availability for upcoming ${teamName} games`
                : 'Mark your availability for upcoming games'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Available"
          count={availabilityCounts.available}
          total={availabilityCounts.total}
          color="bg-field"
          icon={CheckCircle}
        />
        <StatCard
          label="Unavailable"
          count={availabilityCounts.unavailable}
          total={availabilityCounts.total}
          color="bg-cardinal"
          icon={AlertCircle}
        />
        <StatCard
          label="Maybe"
          count={availabilityCounts.tentative}
          total={availabilityCounts.total}
          color="bg-gold"
          icon={Calendar}
        />
        <StatCard
          label="Pending"
          count={availabilityCounts.no_response}
          total={availabilityCounts.total}
          color="bg-charcoal-light"
          icon={Calendar}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Games - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-headline text-xl font-semibold text-navy uppercase tracking-wide">
            Upcoming Games
          </h2>

          {upcomingGames.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
                <p className="text-charcoal-light">
                  No upcoming games scheduled
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingGames.map((game) => (
                <GameAvailabilityCard
                  key={game.id}
                  game={game}
                  currentStatus={availability[game.id]?.status || 'no_response'}
                  currentNote={availability[game.id]?.note}
                  onUpdate={(status, note) => handleAvailabilityUpdate(game.id, status, note)}
                  teamAvailabilityCounts={getTeamAvailabilityCounts()}
                  isTeamMember={!!teamId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Team Summary (Managers Only) */}
        <div className="space-y-6">
          {isManager && teamName && upcomingGames.length > 0 && (
            <TeamAvailabilitySummary
              gameId={upcomingGames[0].id}
              gameDate={upcomingGames[0].date}
              teamId={teamId || ''}
              teamName={teamName}
              availability={mockTeamAvailability}
            />
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Mark all as available
                  const updates: Record<string, { status: AvailabilityStatus }> = {};
                  upcomingGames.forEach((game) => {
                    updates[game.id] = { status: 'available' };
                  });
                  setAvailability((prev) => ({ ...prev, ...updates }));
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2 text-field" />
                Mark all as Available
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-charcoal-light"
                asChild
              >
                <a href="/schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Schedule
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Help Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-charcoal-light">
              <p>
                <strong className="text-navy">Available:</strong> You can play in this game
              </p>
              <p>
                <strong className="text-navy">Unavailable:</strong> You cannot make this game
              </p>
              <p>
                <strong className="text-navy">Maybe:</strong> You are unsure but will try
              </p>
              <p className="pt-2 border-t border-cream-dark">
                Please respond at least 24 hours before game time to help your team plan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  count,
  total,
  color,
  icon: Icon,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-chalk" aria-hidden="true" />
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-navy">{count}</div>
            <div className="text-xs text-charcoal-light uppercase tracking-wide">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
