'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TeamEditModal, DeleteConfirmModal } from '@/components/admin';
import type { TeamFormData } from '@/components/admin';
import type { TeamWithManager } from '@/types';
import {
  Shield,
  Users,
  Trophy,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
} from 'lucide-react';

interface TeamWithAdminDetails extends TeamWithManager {
  rosterCount?: number;
}

/**
 * Team Management Page
 *
 * Admin page to view, create, edit, and delete teams.
 */
export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithAdminDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithAdminDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load teams from API
  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'Failed to load teams');
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

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

  // Handle opening Edit modal
  const handleEditTeam = (team: TeamWithAdminDetails) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  // Handle opening Add modal
  const handleAddTeam = () => {
    setSelectedTeam(null);
    setIsEditModalOpen(true);
  };

  // Handle opening Delete modal
  const handleDeleteClick = (team: TeamWithAdminDetails) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  // Save team (create or update)
  const handleSaveTeam = async (formData: TeamFormData) => {
    setIsSaving(true);
    try {
      if (selectedTeam) {
        // Update existing team
        const response = await fetch(`/api/admin/teams/${selectedTeam.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          setTeams((prev) =>
            prev.map((team) =>
              team.id === selectedTeam.id ? { ...team, ...data.data } : team
            )
          );
          toast.success('Team updated successfully');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error?.message || 'Failed to update team');
          return;
        }
      } else {
        // Create new team
        const response = await fetch('/api/admin/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          setTeams((prev) => [...prev, { ...data.data, rosterCount: 0 }]);
          toast.success('Team created successfully');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error?.message || 'Failed to create team');
          return;
        }
      }
      setIsEditModalOpen(false);
      setSelectedTeam(null);
    } catch (err) {
      console.error('Failed to save team:', err);
      toast.error('Failed to save team. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete team
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/teams/${selectedTeam.id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setTeams((prev) => prev.filter((team) => team.id !== selectedTeam.id));
        toast.success('Team deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedTeam(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to delete team');
      }
    } catch (err) {
      console.error('Failed to delete team:', err);
      toast.error('Failed to delete team. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Stats calculations
  const activeTeams = teams.filter((t) => t.isActive);
  const totalPlayers = teams.reduce((sum, t) => {
    return sum + (t.rosterCount || 0);
  }, 0);
  const teamsWithoutManager = teams.filter((t) => !t.managerId).length;

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTeams}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleAddTeam}>
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>
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
                <Shield className="w-5 h-5 text-field" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-field">{activeTeams.length}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Active Teams</p>
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
                  {teamsWithoutManager}
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
                  {teams.length > 0 ? Math.round(totalPlayers / teams.length) : 0}
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
              style={{ backgroundColor: team.primaryColor || '#374151' }}
            />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-headline font-bold text-lg"
                    style={{ backgroundColor: team.primaryColor || '#374151' }}
                  >
                    {team.abbreviation}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <CardDescription>
                      {team.manager?.fullName ? (
                        <span>Manager: {team.manager.fullName}</span>
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
                    View Roster
                  </span>
                </div>
                <Link
                  href={`/admin/players?team=${team.id}`}
                  className="text-xs text-navy hover:underline"
                >
                  Manage Players →
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditTeam(team)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-cardinal hover:text-cardinal hover:bg-cardinal/10"
                  onClick={() => handleDeleteClick(team)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
            <h3 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide mb-2">
              No Teams Found
            </h3>
            <p className="text-sm text-charcoal-light font-body mb-4">
              {searchQuery
                ? `No teams match "${searchQuery}"`
                : 'No teams have been created yet.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddTeam}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Modal */}
      <TeamEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
        onSave={handleSaveTeam}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTeam(null);
        }}
        onConfirm={handleDeleteTeam}
        title="Delete Team"
        description="Are you sure you want to delete this team? This action cannot be undone. All player assignments will be removed."
        itemName={selectedTeam?.name || ''}
        isLoading={isSaving}
      />
    </div>
  );
}
