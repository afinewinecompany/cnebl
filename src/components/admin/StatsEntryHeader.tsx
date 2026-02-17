'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GameWithTeams } from '@/types';

interface StatsEntryHeaderProps {
  game: GameWithTeams;
  hasUnsavedChanges?: boolean;
}

/**
 * StatsEntryHeader Component
 *
 * Displays game information at the top of the stats entry page.
 * Shows teams, score, date, location, and stats completion status.
 */
export function StatsEntryHeader({ game, hasUnsavedChanges }: StatsEntryHeaderProps) {
  const gameDate = parseISO(game.gameDate);
  const formattedDate = format(gameDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = game.gameTime
    ? format(parseISO(`2000-01-01T${game.gameTime}`), 'h:mm a')
    : 'TBD';

  const getStatusBadge = () => {
    switch (game.status) {
      case 'final':
        return <Badge variant="success">Final</Badge>;
      case 'in_progress':
        return <Badge variant="live">Live</Badge>;
      case 'scheduled':
        return <Badge variant="default">Scheduled</Badge>;
      case 'postponed':
        return <Badge variant="warning">Postponed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{game.status}</Badge>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Back Navigation */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/games"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>
          {hasUnsavedChanges && (
            <Badge variant="warning" size="sm">
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      {/* Game Info */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Teams and Score */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              {/* Away Team */}
              <div className="flex-1 text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-2"
                  style={{ backgroundColor: game.awayTeam.primaryColor || '#1E3A5F' }}
                >
                  <span className="text-white font-bold text-lg">
                    {game.awayTeam.abbreviation}
                  </span>
                </div>
                <p className="font-semibold text-gray-900">{game.awayTeam.name}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Away</p>
              </div>

              {/* Score */}
              <div className="text-center px-6">
                {game.status === 'final' || game.status === 'in_progress' ? (
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-4xl font-bold text-gray-900">
                      {game.awayScore}
                    </span>
                    <span className="text-2xl text-gray-400">-</span>
                    <span className="font-mono text-4xl font-bold text-gray-900">
                      {game.homeScore}
                    </span>
                  </div>
                ) : (
                  <div className="text-2xl font-semibold text-gray-400">vs</div>
                )}
                <div className="mt-2">{getStatusBadge()}</div>
              </div>

              {/* Home Team */}
              <div className="flex-1 text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-2"
                  style={{ backgroundColor: game.homeTeam.primaryColor || '#1E3A5F' }}
                >
                  <span className="text-white font-bold text-lg">
                    {game.homeTeam.abbreviation}
                  </span>
                </div>
                <p className="font-semibold text-gray-900">{game.homeTeam.name}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Home</p>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formattedTime}</span>
            </div>
            {game.locationName && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{game.locationName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
