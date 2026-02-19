'use client';

import { useState, useCallback, useMemo } from 'react';
import { Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerBattingCard } from './PlayerBattingCard';
import type { PlateAppearanceEntry } from '@/types/plate-appearance.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Entry type for each player's batting stats
 */
export interface PlayerBattingEntry {
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  position?: string;
  plateAppearances: PlateAppearanceEntry[];
  runs: number;
  rbis: number;
  stolenBases: number;
  caughtStealing: number;
  isSelected: boolean;
  hasChanges: boolean;
}

interface PlayerStatsFormProps {
  teamId: string;
  teamName: string;
  gameId: string;
  roster: Array<{
    playerId: string;
    playerName: string;
    jerseyNumber?: string;
    primaryPosition?: string;
  }>;
  existingStats?: Array<{
    playerId: string;
    plateAppearances: PlateAppearanceEntry[];
    runs: number;
    rbis: number;
    stolenBases: number;
    caughtStealing: number;
  }>;
  onSave: (stats: PlayerBattingEntry[]) => Promise<void>;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PlayerStatsForm Component
 *
 * Form for entering batting statistics for all players on a team.
 * Supports adding players from the roster, expandable cards for each player,
 * and bulk save functionality.
 *
 * Usage:
 * ```tsx
 * <PlayerStatsForm
 *   teamId="team-123"
 *   teamName="Blue Jays"
 *   gameId="game-456"
 *   roster={teamRoster}
 *   existingStats={savedStats}
 *   onSave={handleSaveBattingStats}
 * />
 * ```
 */
export function PlayerStatsForm({
  teamId,
  teamName,
  gameId,
  roster,
  existingStats = [],
  onSave,
}: PlayerStatsFormProps) {
  // Initialize entries from roster and existing stats
  const initialEntries = useMemo(() => {
    // Create a map of existing stats by playerId for quick lookup
    const existingMap = new Map(
      existingStats.map((s) => [s.playerId, s])
    );

    // Initialize entries for players that have existing stats
    return existingStats.map((stat) => {
      const rosterPlayer = roster.find((p) => p.playerId === stat.playerId);
      return {
        playerId: stat.playerId,
        playerName: rosterPlayer?.playerName ?? 'Unknown Player',
        jerseyNumber: rosterPlayer?.jerseyNumber,
        position: rosterPlayer?.primaryPosition,
        plateAppearances: stat.plateAppearances,
        runs: stat.runs,
        rbis: stat.rbis,
        stolenBases: stat.stolenBases,
        caughtStealing: stat.caughtStealing,
        isSelected: true,
        hasChanges: false,
      } as PlayerBattingEntry;
    });
  }, [roster, existingStats]);

  const [entries, setEntries] = useState<PlayerBattingEntry[]>(initialEntries);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Get roster players not yet added
  const availablePlayers = roster.filter(
    (p) => !entries.some((e) => e.playerId === p.playerId)
  );

  // Add a player from the roster
  const addPlayer = useCallback((player: typeof roster[0]) => {
    const newEntry: PlayerBattingEntry = {
      playerId: player.playerId,
      playerName: player.playerName,
      jerseyNumber: player.jerseyNumber,
      position: player.primaryPosition,
      plateAppearances: [],
      runs: 0,
      rbis: 0,
      stolenBases: 0,
      caughtStealing: 0,
      isSelected: true,
      hasChanges: true,
    };

    setEntries((prev) => [...prev, newEntry]);
    setShowAddPlayer(false);
    // Expand the newly added player
    setExpandedPlayerId(player.playerId);
  }, []);

  // Remove a player entry
  const removePlayer = useCallback((playerId: string) => {
    setEntries((prev) => prev.filter((e) => e.playerId !== playerId));
    if (expandedPlayerId === playerId) {
      setExpandedPlayerId(null);
    }
  }, [expandedPlayerId]);

  // Update plate appearances for a player
  const updatePlateAppearances = useCallback((playerId: string, pas: PlateAppearanceEntry[]) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.playerId !== playerId) return entry;
        return {
          ...entry,
          plateAppearances: pas,
          hasChanges: true,
        };
      })
    );
  }, []);

  // Update totals for a player
  const updateTotals = useCallback((
    playerId: string,
    field: 'runs' | 'rbis' | 'stolenBases' | 'caughtStealing',
    value: number
  ) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.playerId !== playerId) return entry;
        return {
          ...entry,
          [field]: value,
          hasChanges: true,
        };
      })
    );
  }, []);

  // Save a single player's stats (marks as saved)
  const savePlayerStats = useCallback((playerId: string) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.playerId !== playerId) return entry;
        return {
          ...entry,
          hasChanges: false,
        };
      })
    );
  }, []);

  // Toggle expanded state for a player card
  const toggleExpanded = useCallback((playerId: string) => {
    setExpandedPlayerId((prev) => (prev === playerId ? null : playerId));
  }, []);

  // Save all entries with changes
  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      const selectedEntries = entries.filter((e) => e.isSelected && e.hasChanges);
      await onSave(selectedEntries);
      // Mark all saved entries as no longer having changes
      setEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          hasChanges: false,
        }))
      );
    } catch (error) {
      console.error('Failed to save batting stats:', error);
    } finally {
      setIsSaving(false);
    }
  }, [entries, onSave]);

  // Check if there are any unsaved changes
  const hasUnsavedChanges = entries.some((e) => e.isSelected && e.hasChanges);
  const selectedCount = entries.filter((e) => e.isSelected).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{teamName} Batting</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCount} player{selectedCount !== 1 ? 's' : ''} entered
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            disabled={availablePlayers.length === 0}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Add Player Dropdown */}
      {showAddPlayer && availablePlayers.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Select a player to add:</p>
          <div className="flex flex-wrap gap-2">
            {availablePlayers.map((player) => (
              <button
                key={player.playerId}
                onClick={() => addPlayer(player)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {player.jerseyNumber && (
                  <span className="font-mono text-xs text-gray-400 mr-1">
                    #{player.jerseyNumber}
                  </span>
                )}
                {player.playerName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Players List */}
      {entries.filter((e) => e.isSelected).length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">No players added yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click "Add Player" to start entering batting stats
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries
            .filter((e) => e.isSelected)
            .map((entry) => (
              <PlayerBattingCard
                key={entry.playerId}
                playerId={entry.playerId}
                playerName={entry.playerName}
                jerseyNumber={entry.jerseyNumber}
                position={entry.position}
                plateAppearances={entry.plateAppearances}
                runs={entry.runs}
                rbis={entry.rbis}
                stolenBases={entry.stolenBases}
                caughtStealing={entry.caughtStealing}
                isExpanded={expandedPlayerId === entry.playerId}
                hasChanges={entry.hasChanges}
                onToggleExpand={() => toggleExpanded(entry.playerId)}
                onUpdatePlateAppearances={(pas) => updatePlateAppearances(entry.playerId, pas)}
                onUpdateTotals={(field, value) => updateTotals(entry.playerId, field, value)}
                onRemove={() => removePlayer(entry.playerId)}
                onSave={() => savePlayerStats(entry.playerId)}
                disabled={isSaving}
                isSaving={false}
              />
            ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {hasUnsavedChanges ? (
            <span className="text-amber-600 font-medium">You have unsaved changes</span>
          ) : (
            <span>All changes saved</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
