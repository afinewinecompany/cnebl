'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AvailabilityStatus } from '@/types';
import {
  Check,
  X,
  HelpCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PlayerAvailability {
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  position?: string;
  status: AvailabilityStatus;
  note?: string;
  respondedAt?: string;
}

interface TeamAvailabilitySummaryProps {
  gameId: string;
  gameDate: string;
  teamId: string;
  teamName: string;
  availability: PlayerAvailability[];
  className?: string;
}

const STATUS_CONFIG: Record<
  AvailabilityStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  available: {
    label: 'Available',
    icon: Check,
    color: 'text-field',
    bgColor: 'bg-field',
  },
  unavailable: {
    label: 'Unavailable',
    icon: X,
    color: 'text-cardinal',
    bgColor: 'bg-cardinal',
  },
  tentative: {
    label: 'Maybe',
    icon: HelpCircle,
    color: 'text-gold',
    bgColor: 'bg-gold',
  },
  no_response: {
    label: 'No Response',
    icon: Clock,
    color: 'text-charcoal-light',
    bgColor: 'bg-charcoal-light',
  },
};

/**
 * TeamAvailabilitySummary Component
 *
 * Shows team availability summary for managers
 * - Count of available/unavailable/maybe
 * - Expandable list of players
 * - Notes from players
 */
export function TeamAvailabilitySummary({
  gameId,
  gameDate,
  teamId,
  teamName,
  availability,
  className,
}: TeamAvailabilitySummaryProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate summary counts
  const counts = React.useMemo(() => {
    return {
      available: availability.filter((p) => p.status === 'available').length,
      unavailable: availability.filter((p) => p.status === 'unavailable').length,
      tentative: availability.filter((p) => p.status === 'tentative').length,
      no_response: availability.filter((p) => p.status === 'no_response').length,
      total: availability.length,
    };
  }, [availability]);

  // Group players by status
  const groupedPlayers = React.useMemo(() => {
    const groups: Record<AvailabilityStatus, PlayerAvailability[]> = {
      available: [],
      unavailable: [],
      tentative: [],
      no_response: [],
    };

    availability.forEach((player) => {
      groups[player.status].push(player);
    });

    return groups;
  }, [availability]);

  // Calculate response rate
  const responseRate = Math.round(
    ((counts.total - counts.no_response) / counts.total) * 100
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="stitch-border bg-cream border-b border-cream-dark pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-leather" aria-hidden="true" />
            {teamName} Availability
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {counts.total} Players
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 border-b border-cream-dark">
          {(['available', 'unavailable', 'tentative', 'no_response'] as AvailabilityStatus[]).map(
            (status) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const count = counts[status];

              return (
                <div
                  key={status}
                  className={cn(
                    'flex flex-col items-center justify-center py-4 px-2',
                    'border-r border-cream-dark last:border-r-0'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2',
                      config.bgColor
                    )}
                  >
                    <span className="text-lg font-bold text-chalk">{count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon
                      className={cn('w-3 h-3', config.color)}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'text-xs font-headline uppercase tracking-wide',
                        config.color
                      )}
                    >
                      {status === 'no_response' ? 'Pending' : config.label}
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Response Rate */}
        <div className="px-4 py-3 bg-ivory border-b border-cream-dark">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-charcoal-light">Response Rate</span>
            <span className="font-mono text-sm font-bold text-navy">
              {responseRate}%
            </span>
          </div>
          <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                responseRate >= 80
                  ? 'bg-field'
                  : responseRate >= 50
                  ? 'bg-gold'
                  : 'bg-cardinal'
              )}
              style={{ width: `${responseRate}%` }}
            />
          </div>
        </div>

        {/* Expandable Player List */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-headline uppercase tracking-wide text-navy hover:bg-cream transition-colors"
          aria-expanded={isExpanded}
        >
          <span>View Player Details</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-cream-dark">
            {/* Group by Status */}
            {(
              ['available', 'unavailable', 'tentative', 'no_response'] as AvailabilityStatus[]
            ).map((status) => {
              const players = groupedPlayers[status];
              if (players.length === 0) return null;

              const config = STATUS_CONFIG[status];
              const Icon = config.icon;

              return (
                <div key={status} className="border-b border-cream-dark last:border-b-0">
                  {/* Status Header */}
                  <div
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 bg-cream',
                      config.color
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="font-headline text-xs uppercase tracking-wide">
                      {config.label} ({players.length})
                    </span>
                  </div>

                  {/* Player List */}
                  <ul className="divide-y divide-cream-dark">
                    {players.map((player) => (
                      <li
                        key={player.playerId}
                        className="px-4 py-3 flex items-start gap-3"
                      >
                        {/* Jersey Number */}
                        {player.jerseyNumber !== undefined && (
                          <span className="w-8 h-8 rounded-full bg-navy text-chalk flex items-center justify-center text-sm font-mono font-bold shrink-0">
                            {player.jerseyNumber}
                          </span>
                        )}

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-body font-medium text-charcoal truncate">
                              {player.playerName}
                            </span>
                            {player.position && (
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {player.position}
                              </Badge>
                            )}
                          </div>

                          {/* Note */}
                          {player.note && (
                            <p className="text-sm text-charcoal-light mt-1 italic">
                              &quot;{player.note}&quot;
                            </p>
                          )}

                          {/* Response Time */}
                          {player.respondedAt && (
                            <p className="text-xs text-charcoal-light mt-1">
                              Responded{' '}
                              {new Date(player.respondedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
