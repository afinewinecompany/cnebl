'use client';

import { useState, useCallback, useMemo } from 'react';
import { Save, Plus, AlertCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PitchingStats, PitchingDecision, Player } from '@/types';

// Pitching decisions
const PITCHING_DECISIONS: Array<{ value: PitchingDecision | 'ND'; label: string }> = [
  { value: 'ND', label: 'No Decision' },
  { value: 'W', label: 'Win' },
  { value: 'L', label: 'Loss' },
  { value: 'S', label: 'Save' },
  { value: 'H', label: 'Hold' },
  { value: 'BS', label: 'Blown Save' },
];

// Pitching stat field type
interface PitchingFieldConfig {
  key: string;
  label: string;
  width: string;
  type: 'number' | 'select' | 'checkbox' | 'innings';
  min?: number;
}

// Pitching stat fields configuration
const PITCHING_FIELDS: PitchingFieldConfig[] = [
  { key: 'isStarter', label: 'Start', width: 'w-14', type: 'checkbox' },
  { key: 'decision', label: 'Dec', width: 'w-20', type: 'select' },
  { key: 'inningsPitched', label: 'IP', width: 'w-16', type: 'innings', min: 0 },
  { key: 'hitsAllowed', label: 'H', width: 'w-12', type: 'number', min: 0 },
  { key: 'runsAllowed', label: 'R', width: 'w-12', type: 'number', min: 0 },
  { key: 'earnedRuns', label: 'ER', width: 'w-12', type: 'number', min: 0 },
  { key: 'walks', label: 'BB', width: 'w-12', type: 'number', min: 0 },
  { key: 'strikeouts', label: 'K', width: 'w-12', type: 'number', min: 0 },
  { key: 'homeRunsAllowed', label: 'HR', width: 'w-12', type: 'number', min: 0 },
  { key: 'battersFaced', label: 'BF', width: 'w-14', type: 'number', min: 0 },
  { key: 'pitchesThrown', label: 'PC', width: 'w-14', type: 'number', min: 0 },
  { key: 'strikes', label: 'STR', width: 'w-14', type: 'number', min: 0 },
  { key: 'hitBatters', label: 'HB', width: 'w-12', type: 'number', min: 0 },
  { key: 'wildPitches', label: 'WP', width: 'w-12', type: 'number', min: 0 },
  { key: 'balks', label: 'BK', width: 'w-12', type: 'number', min: 0 },
];

// Player with pitching stats entry
export interface PitchingStatsEntry extends Partial<PitchingStats> {
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  isSelected: boolean;
  hasChanges: boolean;
  errors?: Record<string, string>;
}

interface PitchingStatsFormProps {
  teamId: string;
  teamName: string;
  gameId: string;
  roster: Array<{
    playerId: string;
    playerName: string;
    jerseyNumber?: string;
    isPitcher?: boolean;
  }>;
  existingStats?: PitchingStats[];
  onSave: (stats: PitchingStatsEntry[]) => Promise<void>;
}

/**
 * Format innings pitched for display (e.g., 6.1 for 6 1/3 innings)
 */
function formatIP(innings: number): string {
  const fullInnings = Math.floor(innings);
  const thirds = Math.round((innings - fullInnings) * 3);
  return thirds === 0 ? `${fullInnings}` : `${fullInnings}.${thirds}`;
}

/**
 * Parse innings pitched input (e.g., "6.1" => 6.333...)
 */
function parseIP(value: string): number {
  const parts = value.split('.');
  const fullInnings = parseInt(parts[0] || '0', 10);
  const thirds = parseInt(parts[1] || '0', 10);
  // Convert thirds (1, 2) to decimal (.333..., .666...)
  return fullInnings + (thirds / 3);
}

/**
 * PitchingStatsForm Component
 *
 * Form for entering pitching statistics for a team.
 * Supports adding multiple pitchers with full stat entry.
 */
export function PitchingStatsForm({
  teamId,
  teamName,
  gameId,
  roster,
  existingStats = [],
  onSave,
}: PitchingStatsFormProps) {
  // Initialize entries from roster and existing stats
  const initialEntries = useMemo(() => {
    // Only show pitchers or players with existing stats
    const pitcherIds = new Set([
      ...roster.filter((p) => p.isPitcher).map((p) => p.playerId),
      ...existingStats.map((s) => s.playerId),
    ]);

    return roster
      .filter((player) => pitcherIds.has(player.playerId) || existingStats.length === 0)
      .map((player) => {
        const existing = existingStats.find((s) => s.playerId === player.playerId);
        return {
          playerId: player.playerId,
          playerName: player.playerName,
          jerseyNumber: player.jerseyNumber,
          isSelected: !!existing,
          hasChanges: false,
          isStarter: existing?.isStarter ?? false,
          decision: existing?.decision ?? null,
          inningsPitched: existing?.inningsPitched ?? 0,
          hitsAllowed: existing?.hitsAllowed ?? 0,
          runsAllowed: existing?.runsAllowed ?? 0,
          earnedRuns: existing?.earnedRuns ?? 0,
          walks: existing?.walks ?? 0,
          strikeouts: existing?.strikeouts ?? 0,
          homeRunsAllowed: existing?.homeRunsAllowed ?? 0,
          battersFaced: existing?.battersFaced ?? 0,
          pitchesThrown: existing?.pitchesThrown ?? null,
          strikes: existing?.strikes ?? null,
          hitBatters: existing?.hitBatters ?? 0,
          wildPitches: existing?.wildPitches ?? 0,
          balks: existing?.balks ?? 0,
        } as PitchingStatsEntry;
      });
  }, [roster, existingStats]);

  const [entries, setEntries] = useState<PitchingStatsEntry[]>(initialEntries);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [showAddPitcher, setShowAddPitcher] = useState(false);

  // Get non-selected pitchers for adding
  const availablePitchers = roster.filter(
    (p) => !entries.some((e) => e.playerId === p.playerId)
  );

  // Validate a single entry
  const validateEntry = useCallback((entry: PitchingStatsEntry): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Earned runs cannot exceed runs allowed
    if ((entry.earnedRuns || 0) > (entry.runsAllowed || 0)) {
      errors.earnedRuns = 'ER cannot exceed R';
    }

    // Strikes cannot exceed pitches thrown
    if (entry.pitchesThrown && entry.strikes && entry.strikes > entry.pitchesThrown) {
      errors.strikes = 'Strikes cannot exceed pitches';
    }

    // Only one W/L per team
    const decisionsCount = entries.filter(
      (e) => e.isSelected && e.playerId !== entry.playerId && (e.decision === 'W' || e.decision === 'L')
    ).length;
    if ((entry.decision === 'W' || entry.decision === 'L') && decisionsCount > 0) {
      // Just a warning, not blocking
    }

    return errors;
  }, [entries]);

  // Handle field change
  const handleFieldChange = useCallback((
    playerId: string,
    field: string,
    value: number | string | boolean | null
  ) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.playerId !== playerId) return entry;

        const updated = {
          ...entry,
          [field]: value,
          hasChanges: true,
        };

        // Validate
        updated.errors = validateEntry(updated);

        return updated;
      })
    );
  }, [validateEntry]);

  // Toggle player selection
  const togglePlayerSelection = useCallback((playerId: string) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.playerId !== playerId) return entry;
        return {
          ...entry,
          isSelected: !entry.isSelected,
          hasChanges: true,
        };
      })
    );
  }, []);

  // Add a pitcher from the roster
  const addPitcher = useCallback((player: typeof roster[0]) => {
    setEntries((prev) => [
      ...prev,
      {
        playerId: player.playerId,
        playerName: player.playerName,
        jerseyNumber: player.jerseyNumber,
        isSelected: true,
        hasChanges: true,
        isStarter: prev.filter((e) => e.isSelected).length === 0, // First pitcher is starter
        decision: null,
        inningsPitched: 0,
        hitsAllowed: 0,
        runsAllowed: 0,
        earnedRuns: 0,
        walks: 0,
        strikeouts: 0,
        homeRunsAllowed: 0,
        battersFaced: 0,
        pitchesThrown: null,
        strikes: null,
        hitBatters: 0,
        wildPitches: 0,
        balks: 0,
      },
    ]);
    setShowAddPitcher(false);
  }, []);

  // Remove a pitcher entry
  const removePitcher = useCallback((playerId: string) => {
    setEntries((prev) => prev.filter((e) => e.playerId !== playerId));
  }, []);

  // Reset to initial state
  const handleReset = useCallback(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Save all entries
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const selectedEntries = entries.filter((e) => e.isSelected);
      await onSave(selectedEntries);
      setEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          hasChanges: false,
        }))
      );
    } catch (error) {
      console.error('Failed to save pitching stats:', error);
    } finally {
      setIsSaving(false);
    }
  }, [entries, onSave]);

  // Calculate totals for selected pitchers
  const totals = useMemo(() => {
    const selected = entries.filter((e) => e.isSelected);
    return {
      inningsPitched: selected.reduce((sum, e) => sum + (e.inningsPitched || 0), 0),
      hitsAllowed: selected.reduce((sum, e) => sum + (e.hitsAllowed || 0), 0),
      runsAllowed: selected.reduce((sum, e) => sum + (e.runsAllowed || 0), 0),
      earnedRuns: selected.reduce((sum, e) => sum + (e.earnedRuns || 0), 0),
      walks: selected.reduce((sum, e) => sum + (e.walks || 0), 0),
      strikeouts: selected.reduce((sum, e) => sum + (e.strikeouts || 0), 0),
    };
  }, [entries]);

  // Check if there are any unsaved changes
  const hasUnsavedChanges = entries.some((e) => e.hasChanges);
  const selectedCount = entries.filter((e) => e.isSelected).length;
  const hasErrors = entries.some((e) => e.errors && Object.keys(e.errors).length > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{teamName} Pitching</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCount} pitcher{selectedCount !== 1 ? 's' : ''} entered
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPitcher(!showAddPitcher)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Pitcher
          </Button>
        </div>
      </div>

      {/* Add Pitcher Dropdown */}
      {showAddPitcher && availablePitchers.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Select a player to add:</p>
          <div className="flex flex-wrap gap-2">
            {availablePitchers.map((player) => (
              <button
                key={player.playerId}
                onClick={() => addPitcher(player)}
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

      {/* Pitchers List */}
      {entries.filter((e) => e.isSelected).length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">No pitchers added yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click "Add Pitcher" to start entering pitching stats
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries
            .filter((e) => e.isSelected)
            .map((entry, index) => (
              <div key={entry.playerId} className="bg-white">
                {/* Pitcher Header */}
                <div
                  className={cn(
                    'px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors',
                    entry.hasChanges && 'bg-amber-50'
                  )}
                  onClick={() =>
                    setExpandedPlayer(
                      expandedPlayer === entry.playerId ? null : entry.playerId
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {entry.jerseyNumber && (
                        <span className="font-mono text-sm text-gray-400">
                          #{entry.jerseyNumber}
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">
                        {entry.playerName}
                      </span>
                    </div>
                    {entry.isStarter && (
                      <Badge variant="primary" size="sm">
                        Starter
                      </Badge>
                    )}
                    {entry.decision && entry.decision !== 'ND' && (
                      <Badge
                        variant={entry.decision === 'W' ? 'success' : entry.decision === 'L' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {entry.decision}
                      </Badge>
                    )}
                    {entry.errors && Object.keys(entry.errors).length > 0 && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {formatIP(entry.inningsPitched || 0)} IP, {entry.strikeouts || 0} K
                    </span>
                    {expandedPlayer === entry.playerId ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Stats Entry */}
                {expandedPlayer === entry.playerId && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                      {/* Starter Checkbox */}
                      <div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={entry.isStarter || false}
                            onChange={(e) =>
                              handleFieldChange(entry.playerId, 'isStarter', e.target.checked)
                            }
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-gray-700">Starter</span>
                        </label>
                      </div>

                      {/* Decision */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Decision
                        </label>
                        <select
                          value={entry.decision || 'ND'}
                          onChange={(e) =>
                            handleFieldChange(
                              entry.playerId,
                              'decision',
                              e.target.value === 'ND' ? null : e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                          {PITCHING_DECISIONS.map((dec) => (
                            <option key={dec.value} value={dec.value}>
                              {dec.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Innings Pitched */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          IP
                        </label>
                        <input
                          type="text"
                          value={formatIP(entry.inningsPitched || 0)}
                          onChange={(e) =>
                            handleFieldChange(
                              entry.playerId,
                              'inningsPitched',
                              parseIP(e.target.value)
                            )
                          }
                          placeholder="0"
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:border-primary font-mono text-center"
                        />
                        <p className="text-xs text-gray-400 mt-1">Use .1 or .2 for outs</p>
                      </div>

                      {/* Other numeric fields */}
                      {PITCHING_FIELDS.filter(
                        (f) => f.type === 'number' && f.key !== 'inningsPitched'
                      ).map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {field.label}
                          </label>
                          <input
                            type="number"
                            value={entry[field.key as keyof PitchingStatsEntry] as number ?? ''}
                            onChange={(e) =>
                              handleFieldChange(
                                entry.playerId,
                                field.key,
                                e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                              )
                            }
                            min={field.min}
                            className={cn(
                              'w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary focus:border-primary font-mono text-center',
                              entry.errors?.[field.key] && 'border-red-500 bg-red-50'
                            )}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Remove Button */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlayerSelection(entry.playerId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove Pitcher
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Totals Row */}
      {selectedCount > 0 && (
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-700">Team Totals</span>
            <div className="flex items-center gap-6 font-mono">
              <span>
                <span className="text-gray-500">IP:</span>{' '}
                <span className="text-gray-900">{formatIP(totals.inningsPitched)}</span>
              </span>
              <span>
                <span className="text-gray-500">H:</span>{' '}
                <span className="text-gray-900">{totals.hitsAllowed}</span>
              </span>
              <span>
                <span className="text-gray-500">R:</span>{' '}
                <span className="text-gray-900">{totals.runsAllowed}</span>
              </span>
              <span>
                <span className="text-gray-500">ER:</span>{' '}
                <span className="text-gray-900">{totals.earnedRuns}</span>
              </span>
              <span>
                <span className="text-gray-500">K:</span>{' '}
                <span className="text-gray-900">{totals.strikeouts}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {hasErrors && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span>Please fix validation errors before saving</span>
          </div>
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
            variant="outline"
            onClick={handleReset}
            disabled={!hasUnsavedChanges || isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || hasErrors || isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">...</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Pitching Stats
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
