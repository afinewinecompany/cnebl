'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlayerTable, PlayerAssignment } from '@/components/admin';
import { Users, Filter, Download, UserPlus, RefreshCw } from 'lucide-react';
import type { UserRole, FieldPosition, BattingSide, ThrowingArm } from '@/types/database.types';

// User with assignment data from API
export interface UserWithAssignment {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  playerId: string | null;
  teamId: string | null;
  teamName: string | null;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition | null;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide | null;
  throws: ThrowingArm | null;
  isCaptain: boolean;
}

// Team for assignment dropdown
export interface TeamOption {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
}

type FilterType = 'all' | 'assigned' | 'unassigned';
type RoleFilter = 'all' | UserRole;

/**
 * Player Management Page
 *
 * Admin page to view, filter, and manage player team assignments.
 */
export default function PlayersPage() {
  const [users, setUsers] = useState<UserWithAssignment[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithAssignment | null>(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch users and teams from API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch users and teams in parallel
      const [usersRes, teamsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/teams'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      } else {
        console.error('Failed to fetch users');
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(
          (teamsData.data || []).map((t: TeamOption & { primaryColor?: string | null }) => ({
            id: t.id,
            name: t.name,
            abbreviation: t.abbreviation,
            primaryColor: t.primaryColor || '#374151',
          }))
        );
      } else {
        console.error('Failed to fetch teams');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleAssignPlayer = (user: UserWithAssignment) => {
    setSelectedUser(user);
    setIsAssignmentOpen(true);
  };

  const handleRemoveFromTeam = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user?.playerId) return;

    try {
      const response = await fetch(`/api/admin/players/${user.playerId}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  playerId: null,
                  teamId: null,
                  teamName: null,
                  jerseyNumber: null,
                  primaryPosition: null,
                  secondaryPosition: null,
                  bats: null,
                  throws: null,
                  isCaptain: false,
                }
              : u
          )
        );
        toast.success('Player removed from team');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to remove player');
      }
    } catch (error) {
      console.error('Failed to remove player:', error);
      toast.error('Failed to remove player');
    }
  };

  const handleSaveAssignment = async (data: {
    teamId: string;
    jerseyNumber: string;
    primaryPosition: FieldPosition;
    secondaryPosition: FieldPosition | null;
    bats: BattingSide;
    throws: ThrowingArm;
    isCaptain: boolean;
  }) => {
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const team = teams.find((t) => t.id === data.teamId);

      if (selectedUser.playerId) {
        // Update existing assignment
        const response = await fetch(`/api/admin/players/${selectedUser.playerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
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
          toast.success('Player updated successfully');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error?.message || 'Failed to update player');
          return;
        }
      } else {
        // Create new assignment
        const response = await fetch('/api/admin/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUser.id,
            ...data,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setUsers((prev) =>
            prev.map((user) =>
              user.id === selectedUser.id
                ? {
                    ...user,
                    playerId: result.data?.id || `player-${Date.now()}`,
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
          toast.success('Player assigned successfully');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error?.message || 'Failed to assign player');
          return;
        }
      }

      setIsAssignmentOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast.error('Failed to save assignment');
    } finally {
      setIsSaving(false);
    }
  };

  // Export users to CSV
  const handleExport = () => {
    const headers = [
      'Name',
      'Email',
      'Role',
      'Team',
      'Jersey #',
      'Position',
      'Secondary Position',
      'Bats',
      'Throws',
      'Captain',
      'Active',
    ];

    const csvRows = [
      headers.join(','),
      ...filteredUsers.map((user) => [
        `"${user.fullName}"`,
        `"${user.email}"`,
        user.role,
        user.teamName || 'Unassigned',
        user.jerseyNumber || '',
        user.primaryPosition || '',
        user.secondaryPosition || '',
        user.bats || '',
        user.throws || '',
        user.isCaptain ? 'Yes' : 'No',
        user.isActive ? 'Yes' : 'No',
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `players-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

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
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
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
                {teams.map((team) => (
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
          teams={teams}
          onSave={handleSaveAssignment}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
