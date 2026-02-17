'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GameForm, type GameFormData, type SeriesGameData } from '@/components/admin';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import type { TeamWithManager } from '@/types';
import toast from 'react-hot-toast';

/**
 * Create New Game Page
 *
 * Form for creating a new game or series of games.
 */
export default function NewGamePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load teams for the form
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data.data || []);
        } else {
          toast.error('Failed to load teams');
        }
      } catch (error) {
        console.error('Failed to load teams:', error);
        toast.error('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeams();
  }, []);

  const handleSubmit = async (data: GameFormData | SeriesGameData[]) => {
    setIsSubmitting(true);

    try {
      // Determine if this is a series or single game
      const isSeries = Array.isArray(data);

      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSeries
            ? { games: data.map((g) => ({
                homeTeamId: g.homeTeamId,
                awayTeamId: g.awayTeamId,
                gameDate: g.gameDate,
                gameTime: g.gameTime,
                timezone: g.timezone,
                locationName: g.locationName || null,
                locationAddress: g.locationAddress || null,
                notes: g.notes || null,
              })) }
            : {
                homeTeamId: (data as GameFormData).homeTeamId,
                awayTeamId: (data as GameFormData).awayTeamId,
                gameDate: (data as GameFormData).gameDate,
                gameTime: (data as GameFormData).gameTime,
                timezone: (data as GameFormData).timezone,
                locationName: (data as GameFormData).locationName || null,
                locationAddress: (data as GameFormData).locationAddress || null,
                notes: (data as GameFormData).notes || null,
              }
        ),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(
          isSeries
            ? `Created ${(data as SeriesGameData[]).length} games successfully!`
            : 'Game created successfully!'
        );
        router.push('/admin/games');
      } else {
        const error = await res.json();
        toast.error(error.error?.message || 'Failed to create game');
      }
    } catch (error) {
      console.error('Failed to create game:', error);
      toast.error('Failed to create game');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-[600px] bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/games">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-2xl font-bold text-navy uppercase tracking-wide">
            Schedule New Game
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            Create a new game or schedule a series
          </p>
        </div>
      </div>

      {/* Form */}
      {teams.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <Calendar className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            No Teams Available
          </h3>
          <p className="text-amber-700 mb-4">
            You need to have at least two teams to schedule a game.
          </p>
          <Button variant="outline" asChild>
            <Link href="/admin/teams">Manage Teams</Link>
          </Button>
        </div>
      ) : teams.length < 2 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <Calendar className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Not Enough Teams
          </h3>
          <p className="text-amber-700 mb-4">
            You need at least two teams to schedule a game. Currently only {teams.length} team exists.
          </p>
          <Button variant="outline" asChild>
            <Link href="/admin/teams">Add More Teams</Link>
          </Button>
        </div>
      ) : (
        <GameForm
          teams={teams}
          seasonId="season-2026" // TODO: Get active season ID
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/games')}
          mode="create"
          allowSeries={true}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
