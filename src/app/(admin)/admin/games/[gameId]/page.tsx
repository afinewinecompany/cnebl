'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GameStatusBadge, GameForm, type GameFormData } from '@/components/admin';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  PauseCircle,
  XCircle,
  Play,
  BarChart3,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameWithTeams, TeamWithManager, GameStatus } from '@/types';
import toast from 'react-hot-toast';

interface PageProps {
  params: Promise<{ gameId: string }>;
}

type PageMode = 'view' | 'edit';

/**
 * Game Detail/Edit Page
 *
 * Shows game details and allows editing, status changes,
 * and links to stats entry.
 */
export default function GameDetailPage({ params }: PageProps) {
  const { gameId } = use(params);
  const router = useRouter();

  // State
  const [game, setGame] = useState<GameWithTeams | null>(null);
  const [teams, setTeams] = useState<TeamWithManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<PageMode>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postponeReason, setPostponeReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Load game and teams
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch game
        const gameRes = await fetch(`/api/admin/games/${gameId}`);
        if (gameRes.ok) {
          const gameData = await gameRes.json();
          setGame(gameData.data);
        } else {
          toast.error('Game not found');
          router.push('/admin/games');
          return;
        }

        // Fetch teams
        const teamsRes = await fetch('/api/teams');
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.data || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [gameId, router]);

  const handleEditSubmit = async (data: GameFormData) => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          gameDate: data.gameDate,
          gameTime: data.gameTime,
          timezone: data.timezone,
          locationName: data.locationName || null,
          locationAddress: data.locationAddress || null,
          notes: data.notes || null,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setGame(result.data);
        setMode('view');
        toast.success('Game updated successfully!');
      } else {
        const error = await res.json();
        toast.error(error.error?.message || 'Failed to update game');
      }
    } catch (error) {
      console.error('Failed to update game:', error);
      toast.error('Failed to update game');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostpone = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/games/${gameId}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: postponeReason || undefined,
          rescheduleDate: rescheduleDate || undefined,
          rescheduleTime: rescheduleTime || undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setGame(result.data.game);
        setShowPostponeModal(false);
        setPostponeReason('');
        setRescheduleDate('');
        setRescheduleTime('');
        toast.success(result.data.message);
      } else {
        const error = await res.json();
        toast.error(error.error?.message || 'Failed to postpone game');
      }
    } catch (error) {
      console.error('Failed to postpone game:', error);
      toast.error('Failed to postpone game');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/games/${gameId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason || undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setGame(result.data.game);
        setShowCancelModal(false);
        setCancelReason('');
        toast.success(result.data.message);
      } else {
        const error = await res.json();
        toast.error(error.error?.message || 'Failed to cancel game');
      }
    } catch (error) {
      console.error('Failed to cancel game:', error);
      toast.error('Failed to cancel game');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      });

      if (res.ok || res.status === 204) {
        toast.success('Game deleted successfully');
        router.push('/admin/games');
      } else {
        const error = await res.json();
        toast.error(error.error?.message || 'Failed to delete game');
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
      toast.error('Failed to delete game');
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-[400px] bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Game not found</h2>
        <p className="text-gray-500 mt-2">The requested game could not be found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/games">Back to Games</Link>
        </Button>
      </div>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setMode('view')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-headline text-2xl font-bold text-navy uppercase tracking-wide">
              Edit Game
            </h1>
            <p className="text-charcoal-light font-body mt-1">
              {game.awayTeam.name} @ {game.homeTeam.name}
            </p>
          </div>
        </div>

        <GameForm
          initialData={{
            homeTeamId: game.homeTeamId,
            awayTeamId: game.awayTeamId,
            gameDate: game.gameDate,
            gameTime: game.gameTime || '',
            timezone: game.timezone,
            locationName: game.locationName || '',
            locationAddress: game.locationAddress || '',
            notes: game.notes || '',
          }}
          teams={teams}
          seasonId={game.seasonId}
          onSubmit={(data) => handleEditSubmit(data as GameFormData)}
          onCancel={() => setMode('view')}
          mode="edit"
          allowSeries={false}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/games">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline text-2xl font-bold text-navy">
                {game.awayTeam.name} @ {game.homeTeam.name}
              </h1>
              <GameStatusBadge status={game.status} size="lg" />
            </div>
            <p className="text-charcoal-light font-body mt-1">
              Game #{game.gameNumber || game.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit button - only for scheduled/postponed games */}
          {['scheduled', 'postponed', 'warmup'].includes(game.status) && (
            <Button variant="outline" onClick={() => setMode('edit')}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Game
            </Button>
          )}

          {/* Stats entry link - only for final games */}
          {game.status === 'final' && (
            <Button asChild>
              <Link href={`/admin/games/${gameId}/stats`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Enter Stats
              </Link>
            </Button>
          )}

          {/* Live scoring link - for in_progress games */}
          {game.status === 'in_progress' && (
            <Button asChild variant="danger">
              <Link href={`/scoring/${gameId}`}>
                <Play className="w-4 h-4 mr-2" />
                Live Scoring
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Matchup Card */}
          <Card>
            <CardHeader>
              <CardTitle>Matchup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-4">
                {/* Away Team */}
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold mx-auto"
                    style={{ backgroundColor: game.awayTeam.primaryColor || '#374151' }}
                  >
                    {game.awayTeam.abbreviation}
                  </div>
                  <p className="font-semibold text-gray-900 mt-2">{game.awayTeam.name}</p>
                  <p className="text-sm text-gray-500">Away</p>
                </div>

                {/* Score/VS */}
                {['in_progress', 'final'].includes(game.status) ? (
                  <div className="text-center">
                    <div className="flex items-center gap-4 font-mono text-4xl font-bold">
                      <span>{game.awayScore}</span>
                      <span className="text-gray-400">-</span>
                      <span>{game.homeScore}</span>
                    </div>
                    {game.status === 'final' && (
                      <p className="text-sm text-gray-500 mt-2">Final</p>
                    )}
                    {game.status === 'in_progress' && game.currentInning && (
                      <p className="text-sm text-cardinal mt-2">
                        {game.currentInningHalf === 'top' ? 'Top' : 'Bot'} {game.currentInning}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl text-gray-300 font-light">vs</span>
                  </div>
                )}

                {/* Home Team */}
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold mx-auto"
                    style={{ backgroundColor: game.homeTeam.primaryColor || '#374151' }}
                  >
                    {game.homeTeam.abbreviation}
                  </div>
                  <p className="font-semibold text-gray-900 mt-2">{game.homeTeam.name}</p>
                  <p className="text-sm text-gray-500">Home</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {format(parseISO(game.gameDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">
                      {game.gameTime
                        ? format(parseISO(`2000-01-01T${game.gameTime}`), 'h:mm a')
                        : 'TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">
                      {game.locationName || 'TBD'}
                    </p>
                    {game.locationAddress && (
                      <p className="text-sm text-gray-500">{game.locationAddress}</p>
                    )}
                  </div>
                </div>
              </div>

              {game.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{game.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Postpone - for scheduled/warmup games */}
              {['scheduled', 'warmup', 'suspended'].includes(game.status) && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowPostponeModal(true)}
                >
                  <PauseCircle className="w-4 h-4 mr-2" />
                  Postpone Game
                </Button>
              )}

              {/* Cancel - for non-completed games */}
              {!['final', 'cancelled'].includes(game.status) && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-cardinal border-cardinal/20 hover:bg-cardinal/5"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Game
                </Button>
              )}

              {/* Start game - for scheduled games */}
              {game.status === 'scheduled' && (
                <Button variant="success" className="w-full justify-start" asChild>
                  <Link href={`/scoring/${gameId}`}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Link>
                </Button>
              )}

              {/* Delete - for scheduled/postponed/cancelled */}
              {['scheduled', 'postponed', 'cancelled'].includes(game.status) && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-500 hover:text-cardinal hover:bg-cardinal/5"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Game
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {format(parseISO(game.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-900">
                  {format(parseISO(game.updatedAt), 'MMM d, yyyy')}
                </span>
              </div>
              {game.startedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Started</span>
                  <span className="text-gray-900">
                    {format(parseISO(game.startedAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
              {game.endedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ended</span>
                  <span className="text-gray-900">
                    {format(parseISO(game.endedAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Postpone Modal */}
      {showPostponeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-500" />
                Postpone Game
              </CardTitle>
              <CardDescription>
                This will mark the game as postponed. You can optionally reschedule it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <Input
                  value={postponeReason}
                  onChange={(e) => setPostponeReason(e.target.value)}
                  placeholder="e.g., Weather conditions"
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Reschedule to (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">New Date</label>
                    <Input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">New Time</label>
                    <Input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPostponeModal(false);
                    setPostponeReason('');
                    setRescheduleDate('');
                    setRescheduleTime('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handlePostpone}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : rescheduleDate ? (
                    'Reschedule Game'
                  ) : (
                    'Postpone Game'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cardinal">
                <XCircle className="w-5 h-5" />
                Cancel Game
              </CardTitle>
              <CardDescription>
                This action will cancel the game. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Not enough players"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  disabled={isSubmitting}
                >
                  Keep Game
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Game'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cardinal">
                <AlertTriangle className="w-5 h-5" />
                Delete Game
              </CardTitle>
              <CardDescription>
                Are you sure you want to permanently delete this game? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-cardinal/5 border border-cardinal/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-cardinal font-medium">
                  {game.awayTeam.name} @ {game.homeTeam.name}
                </p>
                <p className="text-sm text-gray-600">
                  {format(parseISO(game.gameDate), 'MMMM d, yyyy')}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Game
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
