'use client';

/**
 * TeamDirectory Component
 *
 * Displays player contact information organized by team.
 * Shows email and phone for all players across all teams.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users,
  Mail,
  Phone,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface PlayerContactInfo {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  jerseyNumber: string | null;
  primaryPosition: string | null;
  isCaptain: boolean;
}

interface TeamWithRoster {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  players: PlayerContactInfo[];
}

interface TeamDirectoryProps {
  teams: TeamWithRoster[];
  currentUserTeamId?: string;
}

// =============================================================================
// Sub-components
// =============================================================================

function PlayerCard({ player }: { player: PlayerContactInfo }) {
  return (
    <div className="flex items-start gap-3 rounded-retro border border-cream-dark bg-chalk p-3">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/10">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt={player.fullName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-navy" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-headline text-sm font-semibold uppercase tracking-wide text-navy">
            {player.fullName}
          </span>
          {player.isCaptain && (
            <Star className="h-4 w-4 shrink-0 fill-gold text-gold" aria-label="Team Captain" />
          )}
          {player.jerseyNumber && (
            <Badge variant="outline" className="shrink-0 text-xs">
              #{player.jerseyNumber}
            </Badge>
          )}
        </div>

        {player.primaryPosition && (
          <p className="text-xs text-charcoal-light">{player.primaryPosition}</p>
        )}

        {/* Contact Info */}
        <div className="mt-2 space-y-1">
          <a
            href={`mailto:${player.email}`}
            className="flex items-center gap-2 text-xs text-navy hover:text-navy-light hover:underline"
          >
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{player.email}</span>
          </a>
          {player.phone && (
            <a
              href={`tel:${player.phone}`}
              className="flex items-center gap-2 text-xs text-navy hover:text-navy-light hover:underline"
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span>{player.phone}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamSection({
  team,
  isExpanded,
  onToggle,
  isCurrentUserTeam,
}: {
  team: TeamWithRoster;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrentUserTeam: boolean;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-retro border',
        isCurrentUserTeam ? 'border-gold' : 'border-cream-dark'
      )}
    >
      {/* Team Header */}
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3 transition-colors',
          isCurrentUserTeam ? 'bg-gold/10 hover:bg-gold/20' : 'bg-cream hover:bg-cream-dark/20'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-sm"
            style={{ backgroundColor: team.primaryColor }}
          />
          <span className="font-headline text-sm font-semibold uppercase tracking-wide text-navy">
            {team.name}
          </span>
          {isCurrentUserTeam && (
            <Badge variant="gold" className="text-xs">
              Your Team
            </Badge>
          )}
          <span className="text-xs text-charcoal-light">
            ({team.players.length} players)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-charcoal-light" />
        ) : (
          <ChevronDown className="h-5 w-5 text-charcoal-light" />
        )}
      </button>

      {/* Player List */}
      {isExpanded && (
        <div className="border-t border-cream-dark bg-chalk/50 p-3">
          {team.players.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {team.players.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm italic text-charcoal-light">
              No players on this team yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TeamDirectory({ teams, currentUserTeamId }: TeamDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(() => {
    // Initially expand the current user's team
    return currentUserTeamId ? new Set([currentUserTeamId]) : new Set();
  });

  // Toggle team expansion
  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  // Expand/collapse all
  const expandAll = () => {
    setExpandedTeams(new Set(teams.map((t) => t.id)));
  };

  const collapseAll = () => {
    setExpandedTeams(new Set());
  };

  // Filter teams based on search
  const filteredTeams = teams.map((team) => {
    if (!searchQuery.trim()) return team;

    const query = searchQuery.toLowerCase();
    const filteredPlayers = team.players.filter(
      (p) =>
        p.fullName.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.phone?.includes(query)
    );

    return { ...team, players: filteredPlayers };
  });

  // Sort teams - current user's team first
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (a.id === currentUserTeamId) return -1;
    if (b.id === currentUserTeamId) return 1;
    return a.name.localeCompare(b.name);
  });

  // Only show teams with matching players when searching
  const teamsToShow = searchQuery.trim()
    ? sortedTeams.filter((t) => t.players.length > 0)
    : sortedTeams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Directory
        </CardTitle>
        <CardDescription>
          Contact information for all league players
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-light" />
            <Input
              type="search"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        {/* Team List */}
        <div className="space-y-3">
          {teamsToShow.length > 0 ? (
            teamsToShow.map((team) => (
              <TeamSection
                key={team.id}
                team={team}
                isExpanded={expandedTeams.has(team.id)}
                onToggle={() => toggleTeam(team.id)}
                isCurrentUserTeam={team.id === currentUserTeamId}
              />
            ))
          ) : (
            <p className="py-8 text-center text-sm italic text-charcoal-light">
              No players found matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamDirectory;
