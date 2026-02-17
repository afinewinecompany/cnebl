'use client';

import { useState, useCallback, useMemo } from 'react';
import { Save, Trash2, Plus, AlertCircle, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BattingStats, FieldPosition, Player } from '@/types';

// Field positions for dropdown
const FIELD_POSITIONS: FieldPosition[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL'
];

// Batting stat field type
interface BattingFieldConfig {
  key: string;
  label: string;
  width: string;
  type: 'number' | 'select';
  min?: number;
  max?: number;
  computed?: boolean;
}

// Batting stat fields configuration
const BATTING_FIELDS: BattingFieldConfig[] = [
  { key: 'battingOrder', label: '#', width: 'w-12', type: 'number', min: 1, max: 9 },
  { key: 'positionPlayed', label: 'Pos', width: 'w-16', type: 'select' },
  { key: 'plateAppearances', label: 'PA', width: 'w-14', type: 'number', min: 0, computed: true },
  { key: 'atBats', label: 'AB', width: 'w-14', type: 'number', min: 0 },
  { key: 'runs', label: 'R', width: 'w-12', type: 'number', min: 0 },
  { key: 'hits', label: 'H', width: 'w-12', type: 'number', min: 0 },
  { key: 'doubles', label: '2B', width: 'w-12', type: 'number', min: 0 },
  { key: 'triples', label: '3B', width: 'w-12', type: 'number', min: 0 },
  { key: 'homeRuns', label: 'HR', width: 'w-12', type: 'number', min: 0 },
  { key: 'runsBattedIn', label: 'RBI', width: 'w-14', type: 'number', min: 0 },
  { key: 'walks', label: 'BB', width: 'w-12', type: 'number', min: 0 },
  { key: 'strikeouts', label: 'K', width: 'w-12', type: 'number', min: 0 },
  { key: 'hitByPitch', label: 'HBP', width: 'w-14', type: 'number', min: 0 },
  { key: 'sacrificeFlies', label: 'SF', width: 'w-12', type: 'number', min: 0 },
  { key: 'sacrificeBunts', label: 'SAC', width: 'w-14', type: 'number', min: 0 },
  { key: 'stolenBases', label: 'SB', width: 'w-12', type: 'number', min: 0 },
  { key: 'caughtStealing', label: 'CS', width: 'w-12', type: 'number', min: 0 },
];

// Player with batting stats entry
export interface BattingStatsEntry extends Partial<BattingStats> {
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  isSelected: boolean;
  hasChanges: boolean;
  errors?: Record<string, string>;
}

interface BattingStatsFormProps {
  teamId: string;
  teamName: string;
  gameId: string;
  roster: Array<{
    playerId: string;
    playerName: string;
    jerseyNumber?: string;
    primaryPosition?: FieldPosition;
  }>;
  existingStats?: BattingStats[];
  onSave: (stats: BattingStatsEntry[]) => Promise<void>;
  onImportFromGame?: (gameId: string) => Promise<BattingStatsEntry[]>;
}

/**
 * BattingStatsForm Component
 *
 * Table-based form for entering batting statistics for a team.
 * Features inline editing, auto-calculation of PA, and validation.
 */
export function BattingStatsForm({
  teamId,
  teamName,
  gameId,
  roster,
  existingStats = [],
  onSave,
  onImportFromGame,
}: BattingStatsFormProps) {
  // Initialize entries from roster and existing stats
  const initialEntries = useMemo(() => {
    return roster.map((player) => {
      const existing = existingStats.find((s) => s.playerId === player.playerId);
      return {
        playerId: player.playerId,
        playerName: player.playerName,
        jerseyNumber: player.jerseyNumber,
        isSelected: !!existing,
        hasChanges: false,
        battingOrder: existing?.battingOrder ?? null,
        positionPlayed: existing?.positionPlayed ?? player.primaryPosition ?? null,
        plateAppearances: existing?.plateAppearances ?? 0,
        atBats: existing?.atBats ?? 0,
        runs: existing?.runs ?? 0,
        hits: existing?.hits ?? 0,
        doubles: existing?.doubles ?? 0,
        triples: existing?.triples ?? 0,
        homeRuns: existing?.homeRuns ?? 0,
        runsBattedIn: existing?.runsBattedIn ?? 0,
        walks: existing?.walks ?? 0,
        strikeouts: existing?.strikeouts ?? 0,
        hitByPitch: existing?.hitByPitch ?? 0,
        sacrificeFlies: existing?.sacrificeFlies ?? 0,
        sacrificeBunts: existing?.sacrificeBunts ?? 0,
        stolenBases: existing?.stolenBases ?? 0,
        caughtStealing: existing?.caughtStealing ?? 0,
        groundIntoDoublePlays: existing?.groundIntoDoublePlays ?? 0,
        leftOnBase: existing?.leftOnBase ?? 0,
      } as BattingStatsEntry;
    });
  }, [roster, existingStats]);

  const [entries, setEntries] = useState<BattingStatsEntry[]>(initialEntries);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Calculate plate appearances automatically
  const calculatePA = useCallback((entry: BattingStatsEntry): number => {
    return (
      (entry.atBats || 0) +
      (entry.walks || 0) +
      (entry.hitByPitch || 0) +
      (entry.sacrificeFlies || 0) +
      (entry.sacrificeBunts || 0)
    );
  }, []);

  // Validate a single entry
  const validateEntry = useCallback((entry: BattingStatsEntry): Record<string, string> => {
    const errors: Record<string, string> = {};
    const pa = calculatePA(entry);

    // PA validation
    if (entry.plateAppearances !== undefined && entry.plateAppearances !== pa) {
      // Allow manual override but warn
    }

    // Hits cannot exceed at bats
    if ((entry.hits || 0) > (entry.atBats || 0)) {
      errors.hits = 'Hits cannot exceed AB';
    }

    // Extra base hits cannot exceed hits
    const extraBaseHits = (entry.doubles || 0) + (entry.triples || 0) + (entry.homeRuns || 0);
    if (extraBaseHits > (entry.hits || 0)) {
      errors.doubles = '2B+3B+HR cannot exceed H';
    }

    // Strikeouts cannot exceed at bats
    if ((entry.strikeouts || 0) > (entry.atBats || 0)) {
      errors.strikeouts = 'K cannot exceed AB';
    }

    return errors;
  }, [calculatePA]);

  // Handle field change
  const handleFieldChange = useCallback((
    playerId: string,
    field: string,
    value: number | string | null
  ) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.playerId !== playerId) return entry;

        const updated = {
          ...entry,
          [field]: value,
          hasChanges: true,
        };

        // Auto-calculate PA when related fields change
        if (['atBats', 'walks', 'hitByPitch', 'sacrificeFlies', 'sacrificeBunts'].includes(field)) {
          updated.plateAppearances = calculatePA(updated);
        }

        // Validate
        updated.errors = validateEntry(updated);

        return updated;
      })
    );
  }, [calculatePA, validateEntry]);

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

  // Select all players
  const selectAllPlayers = useCallback(() => {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        isSelected: true,
        hasChanges: true,
      }))
    );
  }, []);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        isSelected: false,
        hasChanges: true,
      }))
    );
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
      console.error('Failed to save batting stats:', error);
    } finally {
      setIsSaving(false);
    }
  }, [entries, onSave]);

  // Filter entries based on showOnlySelected
  const displayedEntries = showOnlySelected
    ? entries.filter((e) => e.isSelected)
    : entries;

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
            <h3 className="text-lg font-semibold text-gray-900">{teamName} Batting</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCount} of {roster.length} players selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Show selected only
            </label>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={selectAllPlayers}>
          <Plus className="w-4 h-4 mr-1" />
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={clearAllSelections}>
          <Trash2 className="w-4 h-4 mr-1" />
          Clear All
        </Button>
        {hasUnsavedChanges && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-10 px-3 py-3 text-left">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs min-w-[150px]">
                Player
              </th>
              {BATTING_FIELDS.map((field) => (
                <th
                  key={field.key}
                  className={cn(
                    'px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wide text-xs',
                    field.width,
                    field.computed && 'bg-gray-100'
                  )}
                  title={field.label}
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedEntries.map((entry) => (
              <tr
                key={entry.playerId}
                className={cn(
                  'transition-colors',
                  entry.isSelected ? 'bg-white' : 'bg-gray-50 opacity-60',
                  entry.hasChanges && 'bg-amber-50',
                  entry.errors && Object.keys(entry.errors).length > 0 && 'bg-red-50'
                )}
              >
                {/* Selection Checkbox */}
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={entry.isSelected}
                    onChange={() => togglePlayerSelection(entry.playerId)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>

                {/* Player Name */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {entry.jerseyNumber && (
                      <span className="font-mono text-xs text-gray-400 w-6">
                        #{entry.jerseyNumber}
                      </span>
                    )}
                    <span className={cn(
                      'font-medium',
                      entry.isSelected ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {entry.playerName}
                    </span>
                    {entry.errors && Object.keys(entry.errors).length > 0 && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </td>

                {/* Stat Fields */}
                {BATTING_FIELDS.map((field) => (
                  <td
                    key={field.key}
                    className={cn(
                      'px-1 py-1',
                      field.computed && 'bg-gray-50'
                    )}
                  >
                    {field.type === 'select' ? (
                      <select
                        value={entry[field.key as keyof BattingStatsEntry] as string || ''}
                        onChange={(e) =>
                          handleFieldChange(
                            entry.playerId,
                            field.key,
                            e.target.value || null
                          )
                        }
                        disabled={!entry.isSelected}
                        className={cn(
                          'w-full px-1 py-1.5 text-center text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary',
                          'disabled:bg-gray-100 disabled:text-gray-400',
                          entry.errors?.[field.key] && 'border-red-500'
                        )}
                      >
                        <option value="">-</option>
                        {FIELD_POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={entry[field.key as keyof BattingStatsEntry] as number ?? ''}
                        onChange={(e) =>
                          handleFieldChange(
                            entry.playerId,
                            field.key,
                            e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                          )
                        }
                        disabled={!entry.isSelected || field.computed}
                        min={field.min}
                        max={field.max}
                        className={cn(
                          'w-full px-1 py-1.5 text-center text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary font-mono',
                          'disabled:bg-gray-100 disabled:text-gray-400',
                          field.computed && 'bg-gray-100 font-semibold',
                          entry.errors?.[field.key] && 'border-red-500 bg-red-50'
                        )}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                Save Batting Stats
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
