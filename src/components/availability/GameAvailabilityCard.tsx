'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvailabilitySelector, AvailabilityBadge } from './AvailabilitySelector';
import { cn } from '@/lib/utils';
import type { AvailabilityStatus } from '@/types';
import type { Game } from '@/lib/mock-data';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface GameAvailabilityCardProps {
  game: Game;
  currentStatus?: AvailabilityStatus;
  currentNote?: string;
  onUpdate?: (status: AvailabilityStatus, note?: string) => Promise<void>;
  teamAvailabilityCounts?: {
    available: number;
    unavailable: number;
    tentative: number;
    no_response: number;
    total: number;
  };
  isTeamMember?: boolean;
  className?: string;
}

/**
 * GameAvailabilityCard Component
 *
 * Shows game details with availability selector for players
 * Includes team availability summary for context
 */
export function GameAvailabilityCard({
  game,
  currentStatus = 'no_response',
  currentNote,
  onUpdate,
  teamAvailabilityCounts,
  isTeamMember = true,
  className,
}: GameAvailabilityCardProps) {
  const { homeTeam, awayTeam, date, time, location, field, status } = game;

  const gameDate = new Date(date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Determine if game is in the past or in progress
  const isPast = gameDate < new Date() || status === 'final';
  const isInProgress = status === 'in_progress';
  const isUpcoming = status === 'scheduled';

  return (
    <Card
      className={cn(
        'overflow-hidden',
        isPast && 'opacity-75',
        className
      )}
    >
      {/* Game Status Banner */}
      {status === 'in_progress' && (
        <div className="bg-cardinal py-1.5 px-4">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-chalk animate-pulse" />
            <span className="font-headline text-xs uppercase tracking-wider text-chalk">
              Game In Progress
            </span>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Teams */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: awayTeam.primaryColor }}
                  aria-hidden="true"
                />
                <span className="font-headline text-base uppercase tracking-wide text-navy">
                  {awayTeam.name}
                </span>
              </div>
              <span className="text-charcoal-light text-sm">@</span>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: homeTeam.primaryColor }}
                  aria-hidden="true"
                />
                <span className="font-headline text-base uppercase tracking-wide text-navy">
                  {homeTeam.name}
                </span>
              </div>
            </div>

            {/* Game Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal-light">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                {formattedDate}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {formattedTime}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {location}
              </div>
            </div>
          </div>

          {/* Current Status Badge (if already responded) */}
          {currentStatus !== 'no_response' && (
            <AvailabilityBadge status={currentStatus} />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Team Availability Summary (for context) */}
        {teamAvailabilityCounts && (
          <div className="flex items-center gap-3 p-3 bg-cream rounded-retro border border-cream-dark">
            <Users className="w-5 h-5 text-charcoal-light" aria-hidden="true" />
            <div className="flex-1">
              <span className="text-sm text-charcoal-light">Team Response</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-field" />
                  <span className="font-mono">{teamAvailabilityCounts.available}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-cardinal" />
                  <span className="font-mono">{teamAvailabilityCounts.unavailable}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  <span className="font-mono">{teamAvailabilityCounts.tentative}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-charcoal-light" />
                  <span className="font-mono">{teamAvailabilityCounts.no_response}</span>
                </span>
              </div>
            </div>
            <span className="text-sm font-mono text-navy">
              {teamAvailabilityCounts.available} / {teamAvailabilityCounts.total}
            </span>
          </div>
        )}

        {/* Availability Selector */}
        {isTeamMember && isUpcoming && (
          <div>
            <h3 className="font-headline text-sm uppercase tracking-wide text-navy mb-2">
              Your Availability
            </h3>
            <AvailabilitySelector
              gameId={game.id}
              currentStatus={currentStatus}
              currentNote={currentNote}
              onUpdate={onUpdate}
              disabled={isPast || isInProgress}
            />
          </div>
        )}

        {/* Past Game Notice */}
        {isPast && (
          <div className="p-3 bg-cream rounded-retro border border-cream-dark text-center">
            <p className="text-sm text-charcoal-light">
              This game has already been played
            </p>
          </div>
        )}

        {/* Non-member Notice */}
        {!isTeamMember && isUpcoming && (
          <div className="p-3 bg-cream rounded-retro border border-cream-dark text-center">
            <p className="text-sm text-charcoal-light">
              Join a team to mark your availability
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
