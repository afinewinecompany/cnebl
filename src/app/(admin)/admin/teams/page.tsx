'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Shield,
  Users,
  Trophy,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
} from 'lucide-react';

// Mock teams data
interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  managerId: string | null;
  managerName: string | null;
  wins: number;
  losses: number;
  ties: number;
  runsScored: number;
  runsAllowed: number;
  playerCount: number;
  isActive: boolean;
}

const mockTeamsData: TeamData[] = [
  {
    id: 'rays',
    name: 'Rays',
    abbreviation: 'RAY',
    primaryColor: '#092C5C',
    secondaryColor: '#8FBCE6',
    managerId: '4',
    managerName: 'Ryan Costa',
    wins: 14,
    losses: 4,
    ties: 0,
    runsScored: 168,
    runsAllowed: 87,
    playerCount: 14,
    isActive: true,
  },
  {
    id: 'pirates',
    name: 'Pirates',
    abbreviation: 'PIR',
    primaryColor: '#27251F',
    secondaryColor: '#FDB827',
    managerId: '3',
    managerName: 'Jesse Hill',
    wins: 12,
    losses: 4,
    ties: 1,
    runsScored: 119,
    runsAllowed: 81,
    playerCount: 15,
    isActive: true,
  },
  {
    id: 'athletics',
    name: 'Athletics',
    abbreviation: 'ATH',
    primaryColor: '#003831',
    secondaryColor: '#EFB21E',
    managerId: '1',
    managerName: 'Ben Douglas',
    wins: 12,
    losses: 6,
    ties: 1,
    runsScored: 184,
    runsAllowed: 118,
    playerCount: 16,
    isActive: true,
  },
  {
    id: 'mariners',
    name: 'Mariners',
    abbreviation: 'MAR',
    primaryColor: '#0C2C56',
    secondaryColor: '#005C5C',
    managerId: null,
    managerName: null,
    wins: 8,
    losses: 10,
    ties: 0,
    runsScored: 148,
    runsAllowed: 171,
    playerCount: 18,
    isActive: true,
  },
  {
    id: 'rockies',
    name: 'Rockies',
    abbreviation: 'ROC',
    primaryColor: '#33006F',
    secondaryColor: '#C4CED4',
    managerId: null,
    managerName: null,
    wins: 4,
    losses: 12,
    ties: 0,
    runsScored: 93,
    runsAllowed: 176,
    playerCount: 14,
    isActive: true,
  },
  {
    id: 'diamondbacks',
    name: 'Diamondbacks',
    abbreviation: 'DBK',
    primaryColor: '#A71930',
    secondaryColor: '#E3D4AD',
    managerId: null,
    managerName: null,
    wins: 1,
    losses: 15,
    ties: 0,
    runsScored: 92,
    runsAllowed: 171,
    playerCount: 12,
    isActive: true,
  },
];

/**
 * Team Management Page
 *
 * Admin page to view and manage teams.
 */
export default function TeamsPage() {
  const [teams] = useState<TeamData[]>(mockTeamsData);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWinPercentage = (wins: number, losses: number, ties: number) => {
    const total = wins + losses + ties;
    if (total === 0) return '.000';
    return (wins / total).toFixed(3).replace('0.', '.');
  };

  const getRunDifferential = (runsScored: number, runsAllowed: number) => {
    const diff = runsScored - runsAllowed;
    return diff > 0 ? `+${diff}` : diff.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Team Management
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            View and manage league teams
          </p>
        </div>
        <Button variant="default" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-navy">{teams.length}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Total Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-field/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-field" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-field">
                  {teams.reduce((sum, t) => sum + t.playerCount, 0)}
                </p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Total Players</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cardinal/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-cardinal" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-cardinal">
                  {teams.filter((t) => !t.managerId).length}
                </p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">No Manager</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-gold">
                  {Math.round(teams.reduce((sum, t) => sum + t.playerCount, 0) / teams.length)}
                </p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Avg Roster</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="overflow-hidden">
            {/* Team Header with Color */}
            <div
              className="h-3"
              style={{ backgroundColor: team.primaryColor }}
            />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-headline font-bold text-lg"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    {team.abbreviation}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription>
                      {team.managerName ? (
                        <span>Manager: {team.managerName}</span>
                      ) : (
                        <span className="text-cardinal">No manager assigned</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={team.isActive ? 'success' : 'default'}>
                  {team.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Record */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="font-mono text-xl font-bold text-navy">
                    {team.wins}-{team.losses}{team.ties > 0 ? `-${team.ties}` : ''}
                  </p>
                  <p className="text-xs text-charcoal-light uppercase tracking-wide">Record</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="font-mono text-xl font-bold text-navy">
                    {getWinPercentage(team.wins, team.losses, team.ties)}
                  </p>
                  <p className="text-xs text-charcoal-light uppercase tracking-wide">Win %</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className={`font-mono text-xl font-bold ${
                    team.runsScored - team.runsAllowed > 0 ? 'text-field' : 'text-cardinal'
                  }`}>
                    {getRunDifferential(team.runsScored, team.runsAllowed)}
                  </p>
                  <p className="text-xs text-charcoal-light uppercase tracking-wide">Run Diff</p>
                </div>
              </div>

              {/* Players */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-charcoal-light" />
                  <span className="text-sm font-medium text-charcoal">
                    {team.playerCount} Players
                  </span>
                </div>
                <Link
                  href={`/admin/players?team=${team.id}`}
                  className="text-xs text-navy hover:underline"
                >
                  View Roster
                </Link>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/teams/${team.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-cardinal hover:text-cardinal hover:bg-cardinal/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
            <h3 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide mb-2">
              No Teams Found
            </h3>
            <p className="text-sm text-charcoal-light font-body">
              {searchQuery
                ? `No teams match "${searchQuery}"`
                : 'No teams have been created yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
