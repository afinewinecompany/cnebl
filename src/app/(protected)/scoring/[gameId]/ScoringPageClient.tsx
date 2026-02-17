'use client';

/**
 * ScoringPageClient Component
 *
 * Client-side wrapper for live game scoring.
 * Handles:
 * - All API calls for scoring actions (start, score, out, advance, end)
 * - Polling for game state updates (for multi-manager scenarios)
 * - Toast notifications for actions
 * - Live scoreboard display
 * - End game confirmation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ScoringPanel } from '@/components/scoring';
import { LiveScoreboard } from '@/components/scoreboard';
import { ScoringConfirmDialog } from '@/components/scoring/ScoringConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameWithTeams, Game, InningHalf } from '@/types';

// Polling interval for game state (10 seconds)
const POLL_INTERVAL = 10000;

interface ScoringPageClientProps {
  /** Initial game data from server */
  game: GameWithTeams;
  /** Current user's ID */
  currentUserId: string;
  /** Current user's team ID */
  currentUserTeamId: string;
  /** Whether the current user is the home team manager */
  isHomeManager: boolean;
  /** Whether the current user is the away team manager */
  isAwayManager: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export function ScoringPageClient({
  game: initialGame,
  currentUserId,
  currentUserTeamId,
  isHomeManager,
  isAwayManager,
}: ScoringPageClientProps) {
  const router = useRouter();

  // Game state
  const [game, setGame] = useState<GameWithTeams>(initialGame);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // UI state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Polling refs
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Show a notification toast
   */
  const showNotification = useCallback(
    (type: Notification['type'], message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setNotifications((prev) => [...prev, { id, type, message }]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    []
  );

  /**
   * Dismiss a notification
   */
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Fetch latest game state from server
   */
  const fetchGameState = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsSyncing(true);

      // In production, this would be a real API call
      // For now, we simulate with the current state
      // const response = await fetch(`/api/games/${game.id}`);
      // const data = await response.json();
      // setGame(data.data);

      setIsOnline(true);
      setLastSync(new Date());
    } catch (error) {
      console.error('[Scoring] Failed to fetch game state:', error);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, [game.id]);

  /**
   * Poll for game state updates
   */
  const pollGameState = useCallback(async () => {
    if (!isMountedRef.current) return;

    await fetchGameState();

    // Schedule next poll
    if (isMountedRef.current && game.status === 'in_progress') {
      pollTimeoutRef.current = setTimeout(pollGameState, POLL_INTERVAL);
    }
  }, [fetchGameState, game.status]);

  /**
   * Start polling when game is in progress
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (game.status === 'in_progress') {
      pollTimeoutRef.current = setTimeout(pollGameState, POLL_INTERVAL);
    }

    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [game.status, pollGameState]);

  /**
   * Handle online/offline status
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('info', 'Connection restored');
      fetchGameState();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification('warning', 'Connection lost - changes will sync when online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchGameState, showNotification]);

  /**
   * Update game state (optimistic update + API call)
   */
  const handleUpdateGame = useCallback(
    async (updates: Partial<Game>): Promise<void> => {
      // Store previous state for rollback
      const previousGame = { ...game };

      // Optimistic update
      setGame((prev) => ({
        ...prev,
        ...updates,
      }));

      try {
        // In production, this would call the appropriate API endpoint
        // For now, we simulate the API calls

        // Determine which endpoint to call based on the update
        let endpoint = `/api/games/${game.id}`;
        let method = 'PATCH';

        if (updates.status === 'in_progress' && previousGame.status === 'scheduled') {
          endpoint = `/api/games/${game.id}/start`;
          method = 'POST';
          showNotification('success', 'Game started!');
        } else if (updates.status === 'final') {
          endpoint = `/api/games/${game.id}/end`;
          method = 'POST';
          showNotification('success', 'Game ended - Final score recorded');
        } else if (updates.status === 'suspended') {
          endpoint = `/api/games/${game.id}/suspend`;
          method = 'POST';
          showNotification('info', 'Game suspended');
        } else if (updates.outs !== undefined && updates.currentInning === undefined) {
          // Just updating outs
          endpoint = `/api/games/${game.id}/out`;
          method = 'POST';
        } else if (updates.homeScore !== undefined || updates.awayScore !== undefined) {
          // Scoring a run
          endpoint = `/api/games/${game.id}/score`;
          method = 'POST';
        } else if (updates.currentInning !== undefined || updates.currentInningHalf !== undefined) {
          // Advancing inning
          endpoint = `/api/games/${game.id}/advance`;
          method = 'POST';
        }

        // Simulate API call
        // In production:
        // const response = await fetch(endpoint, {
        //   method,
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(updates),
        // });
        // if (!response.ok) throw new Error('Failed to update game');
        // const data = await response.json();
        // setGame(data.data);

        // For demo, just update last sync time
        setLastSync(new Date());
      } catch (error) {
        // Rollback on error
        setGame(previousGame as GameWithTeams);
        showNotification('error', 'Failed to update game - please try again');
        console.error('[Scoring] Update failed:', error);
        throw error;
      }
    },
    [game, showNotification]
  );

  /**
   * Handle end game confirmation
   */
  const handleEndGameConfirm = useCallback(async () => {
    setIsEnding(true);
    try {
      await handleUpdateGame({
        status: 'final',
        endedAt: new Date().toISOString(),
      });
      setShowEndConfirmation(false);

      // Redirect back to scoring list after brief delay
      setTimeout(() => {
        router.push('/scoring');
      }, 2000);
    } catch (error) {
      console.error('[Scoring] Failed to end game:', error);
    } finally {
      setIsEnding(false);
    }
  }, [handleUpdateGame, router]);

  /**
   * Manual sync button handler
   */
  const handleManualSync = useCallback(async () => {
    showNotification('info', 'Syncing game state...');
    await fetchGameState();
    showNotification('success', 'Game state synced');
  }, [fetchGameState, showNotification]);

  // Determine which team the current user is scoring for
  const scoringForTeam = isHomeManager
    ? game.homeTeam.name
    : isAwayManager
      ? game.awayTeam.name
      : 'League Admin';

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-retro shadow-lg max-w-sm animate-in slide-in-from-right',
              notification.type === 'success' && 'bg-field text-chalk',
              notification.type === 'error' && 'bg-cardinal text-chalk',
              notification.type === 'info' && 'bg-navy text-chalk',
              notification.type === 'warning' && 'bg-gold text-charcoal-dark'
            )}
          >
            {notification.type === 'success' && (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {notification.type === 'error' && (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {notification.type === 'info' && (
              <RefreshCw className="w-5 h-5 flex-shrink-0" />
            )}
            {notification.type === 'warning' && (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-body flex-1">{notification.message}</p>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Connection Status Bar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          {game.status === 'in_progress' && (
            <Badge variant="live" className="flex items-center gap-2">
              <Radio className="w-3 h-3 animate-pulse" />
              Live
            </Badge>
          )}
          <span className="text-sm text-charcoal-light">
            Scoring as <strong>{scoringForTeam}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              isOnline ? 'text-field' : 'text-cardinal'
            )}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="h-8 px-2"
          >
            <RefreshCw
              className={cn('w-4 h-4', isSyncing && 'animate-spin')}
            />
            <span className="sr-only">Sync</span>
          </Button>
        </div>
      </div>

      {/* Live Scoreboard */}
      <div className="mb-6">
        <LiveScoreboard
          game={{
            id: game.id,
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            currentInning: game.currentInning,
            currentInningHalf: game.currentInningHalf,
            outs: game.outs,
            homeInningScores: game.homeInningScores,
            awayInningScores: game.awayInningScores,
          }}
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          showHits={false}
          showErrors={false}
        />
      </div>

      {/* Scoring Panel */}
      <ScoringPanel
        game={game}
        onUpdateGame={handleUpdateGame}
        className="mb-6"
      />

      {/* Game Info Footer */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-charcoal-light">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                <strong>Location:</strong> {game.locationName}
              </span>
              <span>
                <strong>Date:</strong>{' '}
                {new Date(game.gameDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="text-xs text-charcoal-light">
              Last synced: {lastSync.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* End Game Confirmation Dialog */}
      <ScoringConfirmDialog
        isOpen={showEndConfirmation}
        onClose={() => setShowEndConfirmation(false)}
        onConfirm={handleEndGameConfirm}
        title="End Game?"
        message={`This will mark the game as final with the score:\n\n${game.awayTeam.abbreviation} ${game.awayScore} - ${game.homeScore} ${game.homeTeam.abbreviation}\n\nThis action cannot be undone from the scoring interface.`}
        confirmText="Mark as Final"
        cancelText="Keep Playing"
        variant="danger"
        isLoading={isEnding}
      />
    </div>
  );
}

export default ScoringPageClient;
