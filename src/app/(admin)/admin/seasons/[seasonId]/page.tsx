'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  ArrowLeft,
  Save,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  Shield,
  Users,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import type { SeasonDetailResponse } from '@/lib/api/schemas/seasons';

interface PageProps {
  params: Promise<{ seasonId: string }>;
}

/**
 * Season Detail/Edit Page
 *
 * Admin page to view and edit a specific season.
 * Shows season details, teams, and schedule overview.
 */
export default function SeasonDetailPage({ params }: PageProps) {
  const { seasonId } = use(params);
  const router = useRouter();
  const [season, setSeason] = useState<SeasonDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    startDate: '',
    endDate: '',
    registrationOpen: false,
  });

  useEffect(() => {
    async function fetchSeason() {
      try {
        const response = await fetch(`/api/seasons/${seasonId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Season not found');
          }
          throw new Error('Failed to fetch season');
        }
        const data = await response.json();
        setSeason(data.data);
        setFormData({
          name: data.data.name,
          year: data.data.year.toString(),
          startDate: data.data.startDate,
          endDate: data.data.endDate,
          registrationOpen: data.data.registrationOpen,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSeason();
  }, [seasonId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          year: parseInt(formData.year),
          startDate: formData.startDate,
          endDate: formData.endDate,
          registrationOpen: formData.registrationOpen,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update season');
      }

      const data = await response.json();
      setSeason((prev) => prev ? { ...prev, ...data.data } : null);
      setSuccessMessage('Season updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm('This will set this season as the active season and deactivate all others. Continue?')) {
      return;
    }

    setIsActivating(true);
    setError(null);

    try {
      const response = await fetch(`/api/seasons/${seasonId}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to activate season');
      }

      const data = await response.json();
      setSeason((prev) => prev ? { ...prev, isActive: true } : null);
      setSuccessMessage('Season activated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this season? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/seasons/${seasonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete season');
      }

      router.push('/admin/seasons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsDeleting(false);
    }
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
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error && !season) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/seasons"
          className="inline-flex items-center text-sm text-charcoal-light hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Seasons
        </Link>
        <Card className="border-cardinal/20 bg-cardinal/5">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-cardinal mx-auto mb-4" />
            <p className="text-cardinal font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              asChild
            >
              <Link href="/admin/seasons">Go to Seasons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!season) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/seasons"
            className="inline-flex items-center text-sm text-charcoal-light hover:text-navy transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Seasons
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
              {season.name}
            </h1>
            {season.isActive && (
              <Badge variant="success" size="lg">
                <CheckCircle className="w-4 h-4 mr-1" />
                Active
              </Badge>
            )}
            {season.registrationOpen && (
              <Badge variant="warning" size="lg">
                <Clock className="w-4 h-4 mr-1" />
                Registration Open
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!season.isActive && (
            <Button
              variant="success"
              onClick={handleActivate}
              disabled={isActivating}
            >
              <Play className="w-4 h-4 mr-2" />
              {isActivating ? 'Activating...' : 'Set as Active'}
            </Button>
          )}
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting || season.isActive}
            title={season.isActive ? 'Cannot delete active season' : 'Delete season'}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-field/10 border border-field/30 text-field px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {error && season && (
        <div className="bg-cardinal/10 border border-cardinal/30 text-cardinal px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Games</p>
                <p className="font-mono text-xl font-bold text-navy">
                  {season.stats?.gamesPlayed || 0}/{season.stats?.gamesScheduled || 0}
                </p>
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
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Teams</p>
                <p className="font-mono text-xl font-bold text-navy">
                  {season.stats?.teamsCount || 0}
                </p>
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
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Players</p>
                <p className="font-mono text-xl font-bold text-navy">
                  {season.stats?.playersCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cardinal/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cardinal" />
              </div>
              <div>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Duration</p>
                <p className="font-mono text-sm font-bold text-navy">
                  {formatDate(season.startDate)} - {formatDate(season.endDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Season Details</CardTitle>
              <CardDescription>
                Edit season information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Season Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., CNEBL 2026 Summer Season"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Year
                </label>
                <Input
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Start Date
                  </label>
                  <Input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    End Date
                  </label>
                  <Input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="registrationOpen"
                  name="registrationOpen"
                  checked={formData.registrationOpen}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                />
                <label htmlFor="registrationOpen" className="text-sm font-medium text-charcoal">
                  Registration is open
                </label>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Schedule Overview</CardTitle>
              <CardDescription>
                Games by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {season.scheduleOverview && season.scheduleOverview.length > 0 ? (
                <div className="space-y-3">
                  {season.scheduleOverview.map((item) => {
                    const progress = item.gamesCount > 0
                      ? (item.completedCount / item.gamesCount) * 100
                      : 0;
                    return (
                      <div key={item.month} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-charcoal">{item.month}</span>
                          <span className="text-charcoal-light">
                            {item.completedCount}/{item.gamesCount} games
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-navy rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-charcoal-light text-center py-4">
                  No games scheduled
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teams List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                Teams in this season
              </CardDescription>
            </CardHeader>
            <CardContent>
              {season.teams && season.teams.length > 0 ? (
                <div className="space-y-2">
                  {season.teams
                    .sort((a, b) => {
                      const aWinPct = (a.wins + a.losses + a.ties) > 0
                        ? a.wins / (a.wins + a.losses + a.ties)
                        : 0;
                      const bWinPct = (b.wins + b.losses + b.ties) > 0
                        ? b.wins / (b.wins + b.losses + b.ties)
                        : 0;
                      return bWinPct - aWinPct;
                    })
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-chalk text-sm font-bold"
                            style={{ backgroundColor: team.primaryColor || '#1B3A5F' }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-charcoal">{team.name}</p>
                            <p className="text-xs text-charcoal-light">{team.abbreviation}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-navy">
                            {team.wins}-{team.losses}{team.ties > 0 ? `-${team.ties}` : ''}
                          </p>
                          <p className="text-xs text-charcoal-light">
                            {((team.wins / (team.wins + team.losses + team.ties || 1)) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-charcoal-light text-center py-4">
                  No teams assigned
                </p>
              )}

              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/teams">
                    Manage Teams
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
