'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlayerTable, PlayerAssignment } from '@/components/admin';
import { Users, Filter, Download, UserPlus } from 'lucide-react';
import type { UserRole, FieldPosition, BattingSide, ThrowingArm } from '@/types/database.types';

// Mock users data
export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  teamId: string | null;
  teamName: string | null;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition | null;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide | null;
  throws: ThrowingArm | null;
  isCaptain: boolean;
}

// Mock teams for assignment
export interface MockTeam {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
}

const mockTeams: MockTeam[] = [
  { id: 'rays', name: 'Rays', abbreviation: 'RAY', primaryColor: '#092C5C' },
  { id: 'pirates', name: 'Pirates', abbreviation: 'PIR', primaryColor: '#27251F' },
  { id: 'athletics', name: 'Athletics', abbreviation: 'ATH', primaryColor: '#003831' },
  { id: 'mariners', name: 'Mariners', abbreviation: 'MAR', primaryColor: '#0C2C56' },
  { id: 'rockies', name: 'Rockies', abbreviation: 'ROC', primaryColor: '#33006F' },
  { id: 'diamondbacks', name: 'Diamondbacks', abbreviation: 'DBK', primaryColor: '#A71930' },
];

const mockUsers: MockUser[] = [
  // Assigned players
  { id: '1', email: 'ben.douglas@email.com', fullName: 'Ben Douglas', role: 'player', isActive: true, createdAt: '2024-01-15', teamId: 'athletics', teamName: 'Athletics', jerseyNumber: '7', primaryPosition: 'SS', secondaryPosition: '2B', bats: 'R', throws: 'R', isCaptain: true },
  { id: '2', email: 'keegan.taylor@email.com', fullName: 'Keegan Taylor', role: 'player', isActive: true, createdAt: '2024-01-20', teamId: 'mariners', teamName: 'Mariners', jerseyNumber: '21', primaryPosition: 'P', secondaryPosition: null, bats: 'L', throws: 'L', isCaptain: false },
  { id: '3', email: 'jesse.hill@email.com', fullName: 'Jesse Hill', role: 'manager', isActive: true, createdAt: '2024-02-01', teamId: 'pirates', teamName: 'Pirates', jerseyNumber: '12', primaryPosition: 'P', secondaryPosition: 'CF', bats: 'R', throws: 'R', isCaptain: true },
  { id: '4', email: 'ryan.costa@email.com', fullName: 'Ryan Costa', role: 'player', isActive: true, createdAt: '2024-02-10', teamId: 'rays', teamName: 'Rays', jerseyNumber: '45', primaryPosition: 'P', secondaryPosition: null, bats: 'R', throws: 'R', isCaptain: false },
  { id: '5', email: 'dave.nieves@email.com', fullName: 'Dave Nieves', role: 'player', isActive: true, createdAt: '2024-02-15', teamId: 'athletics', teamName: 'Athletics', jerseyNumber: '33', primaryPosition: 'P', secondaryPosition: 'LF', bats: 'S', throws: 'R', isCaptain: false },
  { id: '6', email: 'eddie.brown@email.com', fullName: 'Eddie Brown', role: 'player', isActive: true, createdAt: '2024-03-01', teamId: 'diamondbacks', teamName: 'Diamondbacks', jerseyNumber: '8', primaryPosition: 'P', secondaryPosition: null, bats: 'R', throws: 'R', isCaptain: false },
  { id: '7', email: 'jj.brigham@email.com', fullName: 'JJ Brigham', role: 'player', isActive: true, createdAt: '2024-03-05', teamId: 'rockies', teamName: 'Rockies', jerseyNumber: '15', primaryPosition: 'P', secondaryPosition: '2B', bats: 'R', throws: 'R', isCaptain: false },
  { id: '8', email: 'drew.marcotte@email.com', fullName: 'Drew Marcotte', role: 'player', isActive: true, createdAt: '2024-03-10', teamId: 'mariners', teamName: 'Mariners', jerseyNumber: '3', primaryPosition: 'C', secondaryPosition: 'P', bats: 'R', throws: 'R', isCaptain: true },
  // Unassigned players
  { id: '9', email: 'john.smith@email.com', fullName: 'John Smith', role: 'player', isActive: true, createdAt: '2024-03-15', teamId: null, teamName: null, jerseyNumber: null, primaryPosition: null, secondaryPosition: null, bats: null, throws: null, isCaptain: false },
  { id: '10', email: 'mike.johnson@email.com', fullName: 'Mike Johnson', role: 'player', isActive: true, createdAt: '2024-03-20', teamId: null, teamName: null, jerseyNumber: null, primaryPosition: null, secondaryPosition: null, bats: null, throws: null, isCaptain: false },
  { id: '11', email: 'tom.wilson@email.com', fullName: 'Tom Wilson', role: 'player', isActive: true, createdAt: '2024-03-25', teamId: null, teamName: null, jerseyNumber: null, primaryPosition: null, secondaryPosition: null, bats: null, throws: null, isCaptain: false },
  { id: '12', email: 'chris.davis@email.com', fullName: 'Chris Davis', role: 'player', isActive: true, createdAt: '2024-04-01', teamId: null, teamName: null, jerseyNumber: null, primaryPosition: null, secondaryPosition: null, bats: null, throws: null, isCaptain: false },
  { id: '13', email: 'james.martinez@email.com', fullName: 'James Martinez', role: 'player', isActive: false, createdAt: '2024-04-05', teamId: null, teamName: null, jerseyNumber: null, primaryPosition: null, secondaryPosition: null, bats: null, throws: null, isCaptain: false },
  { id: '14', email: 'admin@cnebl.com', fullName: 'League Admin', role: 'admin', isActive: true, createdAt: '2023-01-01', teamId: null, teamName: null, jerseyNumber: null, primaryPosition: null, secondaryPosition: null, bats: null, throws: null, isCaptain: false },
  { id: '15', email: 'commissioner@cnebl.com', fullName: 'Commissioner', role: 'commissioner', isActive: true, createdAt: '2023-01-01', teamId: null, teamName: null, jerseyNumber: null, primaryPosition: null, secondaryPosition: null, bats: null, throws: null, isCaptain: false },
];

type FilterType = 'all' | 'assigned' | 'unassigned';
type RoleFilter = 'all' | UserRole;

/**
 * Player Management Page
 *
 * Admin page to view, filter, and manage player team assignments.
 */
export default function PlayersPage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Assignment filter
      const matchesAssignment =
        filterType === 'all' ||
        (filterType === 'assigned' && user.teamId !== null) ||
        (filterType === 'unassigned' && user.teamId === null);

      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      // Team filter
      const matchesTeam =
        teamFilter === 'all' ||
        (teamFilter === 'unassigned' && user.teamId === null) ||
        user.teamId === teamFilter;

      return matchesSearch && matchesAssignment && matchesRole && matchesTeam;
    });
  }, [users, searchQuery, filterType, roleFilter, teamFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    assigned: users.filter((u) => u.teamId !== null).length,
    unassigned: users.filter((u) => u.teamId === null && u.role === 'player').length,
    active: users.filter((u) => u.isActive).length,
  }), [users]);

  const handleAssignPlayer = (user: MockUser) => {
    setSelectedUser(user);
    setIsAssignmentOpen(true);
  };

  const handleRemoveFromTeam = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              teamId: null,
              teamName: null,
              jerseyNumber: null,
              primaryPosition: null,
              secondaryPosition: null,
              bats: null,
              throws: null,
              isCaptain: false,
            }
          : user
      )
    );
  };

  const handleSaveAssignment = (data: {
    teamId: string;
    jerseyNumber: string;
    primaryPosition: FieldPosition;
    secondaryPosition: FieldPosition | null;
    bats: BattingSide;
    throws: ThrowingArm;
    isCaptain: boolean;
  }) => {
    if (!selectedUser) return;

    const team = mockTeams.find((t) => t.id === data.teamId);
    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              teamId: data.teamId,
              teamName: team?.name || null,
              jerseyNumber: data.jerseyNumber,
              primaryPosition: data.primaryPosition,
              secondaryPosition: data.secondaryPosition,
              bats: data.bats,
              throws: data.throws,
              isCaptain: data.isCaptain,
            }
          : user
      )
    );
    setIsAssignmentOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Player Management
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            View and manage player team assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              const unassigned = users.find((u) => u.teamId === null && u.role === 'player');
              if (unassigned) {
                handleAssignPlayer(unassigned);
              }
            }}
            disabled={stats.unassigned === 0}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Assign Player
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-navy">{stats.total}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Total Users</p>
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
                <p className="text-2xl font-mono font-bold text-field">{stats.assigned}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cardinal/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-cardinal" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-cardinal">{stats.unassigned}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-gold">{stats.active}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-charcoal-light uppercase tracking-wide mb-1.5">
                Search
              </label>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Assignment Status */}
            <div>
              <label className="block text-xs font-medium text-charcoal-light uppercase tracking-wide mb-1.5">
                Assignment Status
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-chalk px-4 py-2 font-body text-sm text-charcoal transition-all focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)]"
              >
                <option value="all">All Players</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-charcoal-light uppercase tracking-wide mb-1.5">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-chalk px-4 py-2 font-body text-sm text-charcoal transition-all focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)]"
              >
                <option value="all">All Roles</option>
                <option value="player">Player</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="commissioner">Commissioner</option>
              </select>
            </div>

            {/* Team */}
            <div>
              <label className="block text-xs font-medium text-charcoal-light uppercase tracking-wide mb-1.5">
                Team
              </label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-chalk px-4 py-2 font-body text-sm text-charcoal transition-all focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)]"
              >
                <option value="all">All Teams</option>
                <option value="unassigned">Unassigned</option>
                {mockTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Players</CardTitle>
              <CardDescription>
                Showing {filteredUsers.length} of {users.length} users
              </CardDescription>
            </div>
            {filteredUsers.length > 0 && filterType === 'unassigned' && (
              <Badge variant="warning">{stats.unassigned} need assignment</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PlayerTable
            users={filteredUsers}
            onAssign={handleAssignPlayer}
            onRemove={handleRemoveFromTeam}
          />
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      {selectedUser && (
        <PlayerAssignment
          isOpen={isAssignmentOpen}
          onClose={() => {
            setIsAssignmentOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          teams={mockTeams}
          onSave={handleSaveAssignment}
        />
      )}
    </div>
  );
}
