'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Plus,
  Users,
  Shield,
  Trophy,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import type { SeasonResponse } from '@/lib/api/schemas/seasons';

/**
 * Seasons List Page
 *
 * Admin page to view and manage all seasons.
 * Shows season status badges, quick stats, and actions.
 */
export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSeasons() {
      try {
        const response = await fetch('/api/seasons');
        if (!response.ok) {
          throw new Error('Failed to fetch seasons');
        }
        const data = await response.json();
        setSeasons(data.data.seasons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSeasons();
  }, []);

  // Calculate totals across all seasons
  const totalGamesPlayed = seasons.reduce((sum, s) => sum + (s.stats?.gamesPlayed || 0), 0);
  const totalTeams = seasons.find(s => s.isActive)?.stats?.teamsCount || 0;
  const totalPlayers = seasons.find(s => s.isActive)?.stats?.playersCount || 0;
  const activeSeason = seasons.find(s => s.isActive);

  const getSeasonStatusBadge = (season: SeasonResponse) => {
    const badges = [];

    if (season.isActive) {
      badges.push(
        <Badge key="active" variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }

    if (season.registrationOpen) {
      badges.push(
        <Badge key="registration" variant="warning" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          Registration Open
        </Badge>
      );
    }

    // Check if season is upcoming
    const startDate = new Date(season.startDate);
    const now = new Date();
    if (startDate > now) {
      badges.push(
        <Badge key="upcoming" variant="primary" size="sm">
          Upcoming
        </Badge>
      );
    }

    // Check if season is completed
    const endDate = new Date(season.endDate);
    if (endDate < now && !season.isActive) {
      badges.push(
        <Badge key="completed" variant="default" size="sm">
          Completed
        </Badge>
      );
    }

    return badges;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
          Seasons
        </h1>
        <Card className="border-cardinal/20 bg-cardinal/5">
          <CardContent className="p-6 text-center">
            <p className="text-cardinal font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Seasons
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            Manage league seasons and settings
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/seasons/new">
            <Plus className="w-4 h-4 mr-2" />
            New Season
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-light uppercase tracking-wide">
                  Total Games
                </p>
                <p className="font-mono text-3xl font-bold text-navy mt-1">
                  {totalGamesPlayed}
                </p>
                <p className="text-xs text-charcoal-light mt-1">
                  All-time played
                </p>
              </div>
              <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-chalk" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-light uppercase tracking-wide">
                  Active Teams
                </p>
                <p className="font-mono text-3xl font-bold text-navy mt-1">
                  {totalTeams}
                </p>
                <p className="text-xs text-charcoal-light mt-1">
                  Current season
                </p>
              </div>
              <div className="w-12 h-12 bg-field rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-chalk" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal-light uppercase tracking-wide">
                  Registered Players
                </p>
                <p className="font-mono text-3xl font-bold text-navy mt-1">
                  {totalPlayers}
                </p>
                <p className="text-xs text-charcoal-light mt-1">
                  Current season
                </p>
              </div>
              <div className="w-12 h-12 bg-gold rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-charcoal-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Season Highlight */}
      {activeSeason && (
        <Card className="border-field/30 bg-field/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-field/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-field" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide">
                      {activeSeason.name}
                    </h3>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                  <p className="text-sm text-charcoal-light font-body">
                    {formatDate(activeSeason.startDate)} - {formatDate(activeSeason.endDate)}
                    <span className="mx-2">|</span>
                    {activeSeason.stats?.gamesPlayed || 0} of {activeSeason.stats?.gamesScheduled || 0} games played
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/admin/seasons/${activeSeason.id}`}>
                  Manage
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Seasons List */}
      <Card>
        <CardHeader>
          <CardTitle>All Seasons</CardTitle>
          <CardDescription>
            Complete list of league seasons
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seasons.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
              <p className="text-charcoal-light font-body">No seasons found</p>
              <Button className="mt-4" asChild>
                <Link href="/admin/seasons/new">
                  Create Your First Season
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {seasons.map((season) => (
                <Link
                  key={season.id}
                  href={`/admin/seasons/${season.id}`}
                  className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-headline text-base font-semibold text-navy uppercase tracking-wide">
                        {season.name}
                      </h3>
                      <div className="flex gap-1">
                        {getSeasonStatusBadge(season)}
                      </div>
                    </div>
                    <p className="text-sm text-charcoal-light font-body">
                      {formatDate(season.startDate)} - {formatDate(season.endDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <p className="font-mono font-semibold text-navy">
                        {season.stats?.gamesPlayed || 0}
                      </p>
                      <p className="text-xs text-charcoal-light">Games</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-semibold text-navy">
                        {season.stats?.teamsCount || 0}
                      </p>
                      <p className="text-xs text-charcoal-light">Teams</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-semibold text-navy">
                        {season.stats?.playersCount || 0}
                      </p>
                      <p className="text-xs text-charcoal-light">Players</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-charcoal-light" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
