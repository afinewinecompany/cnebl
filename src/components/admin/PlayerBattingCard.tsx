'use client';

import { useMemo } from 'react';
import { ChevronDown, ChevronUp, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlateAppearanceList } from './PlateAppearanceList';
import { GameTotalsEntry } from './GameTotalsEntry';
import { computeStatsFromPAs } from '@/types/plate-appearance.types';
import type { PlateAppearanceEntry } from '@/types/plate-appearance.types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface PlayerBattingCardProps {
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  position?: string;
  plateAppearances: PlateAppearanceEntry[];
  runs: number;
  rbis: number;
  stolenBases: number;
  caughtStealing: number;
  isExpanded: boolean;
  hasChanges: boolean;
  onToggleExpand: () => void;
  onUpdatePlateAppearances: (pas: PlateAppearanceEntry[]) => void;
  onUpdateTotals: (field: 'runs' | 'rbis' | 'stolenBases' | 'caughtStealing', value: number) => void;
  onRemove: () => void;
  onSave: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PlayerBattingCard Component
 *
 * An expandable card for entering a player's batting stats. Displays a compact
 * header row when collapsed with key stats, and expands to show full plate
 * appearance entry, game totals, and computed statistics.
 *
 * Usage:
 * ```tsx
 * <PlayerBattingCard
 *   playerId="player-123"
 *   playerName="John Smith"
 *   jerseyNumber="42"
 *   position="SS"
 *   plateAppearances={playerPAs}
 *   runs={2}
 *   rbis={3}
 *   stolenBases={1}
 *   caughtStealing={0}
 *   isExpanded={expandedId === 'player-123'}
 *   hasChanges={true}
 *   onToggleExpand={() => setExpandedId(expandedId === 'player-123' ? null : 'player-123')}
 *   onUpdatePlateAppearances={(pas) => updatePAs('player-123', pas)}
 *   onUpdateTotals={(field, value) => updateTotal('player-123', field, value)}
 *   onRemove={() => removePlayer('player-123')}
 *   onSave={() => savePlayer('player-123')}
 *   disabled={isSubmitting}
 *   isSaving={savingPlayerId === 'player-123'}
 * />
 * ```
 */
export function PlayerBattingCard({
  playerId,
  playerName,
  jerseyNumber,
  position,
  plateAppearances,
  runs,
  rbis,
  stolenBases,
  caughtStealing,
  isExpanded,
  hasChanges,
  onToggleExpand,
  onUpdatePlateAppearances,
  onUpdateTotals,
  onRemove,
  onSave,
  disabled = false,
  isSaving = false,
}: PlayerBattingCardProps) {
  // Compute stats from plate appearances
  const computedStats = useMemo(() => {
    return computeStatsFromPAs(plateAppearances);
  }, [plateAppearances]);

  // Compute total RBIs from plate appearances for comparison
  const computedRbis = useMemo(() => {
    return plateAppearances.reduce((sum, pa) => sum + (pa.rbiOnPlay || 0), 0);
  }, [plateAppearances]);

  // Format H-AB display (e.g., "2-4")
  const hitsAtBats = `${computedStats.hits}-${computedStats.atBats}`;

  return (
    <div
      className={cn(
        'bg-white border-l-4 transition-colors',
        hasChanges ? 'border-l-amber-400' : 'border-l-transparent'
      )}
    >
      {/* Collapsed Header Row */}
      <div
        className={cn(
          'px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors',
          hasChanges && 'bg-amber-50'
        )}
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${playerName} batting stats`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
      >
        {/* Left side: Player info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {jerseyNumber && (
              <span className="font-mono text-sm text-gray-400">
                #{jerseyNumber}
              </span>
            )}
            <span className="font-semibold text-gray-900">{playerName}</span>
          </div>
          {position && (
            <Badge variant="secondary" size="sm">
              {position}
            </Badge>
          )}
        </div>

        {/* Right side: Quick stats and chevron */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span title="Plate Appearances">
              {computedStats.plateAppearances} PA
            </span>
            <span title="Hits-At Bats" className="font-mono">
              {hitsAtBats}
            </span>
            <span title="Runs">{runs} R</span>
            <span title="RBIs">{rbis} RBI</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          {/* Plate Appearances Section */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Plate Appearances
            </h4>
            <PlateAppearanceList
              plateAppearances={plateAppearances}
              onUpdate={onUpdatePlateAppearances}
              disabled={disabled || isSaving}
            />
          </div>

          {/* Game Totals Entry */}
          <div className="mb-6">
            <GameTotalsEntry
              runs={runs}
              rbis={rbis}
              stolenBases={stolenBases}
              caughtStealing={caughtStealing}
              computedRbis={computedRbis}
              onUpdate={onUpdateTotals}
              disabled={disabled || isSaving}
            />
          </div>

          {/* Computed Stats Display */}
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Computed Stats (from PAs)
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
              <StatDisplay label="PA" value={computedStats.plateAppearances} />
              <StatDisplay label="AB" value={computedStats.atBats} />
              <StatDisplay label="H" value={computedStats.hits} />
              <StatDisplay label="2B" value={computedStats.doubles} />
              <StatDisplay label="3B" value={computedStats.triples} />
              <StatDisplay label="HR" value={computedStats.homeRuns} />
              <StatDisplay label="BB" value={computedStats.walks} />
              <StatDisplay label="K" value={computedStats.strikeouts} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              disabled={disabled || isSaving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Remove Player
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              disabled={disabled || isSaving || !hasChanges}
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
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  Save Player
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * StatDisplay - Compact stat display with label and value
 */
interface StatDisplayProps {
  label: string;
  value: number;
}

function StatDisplay({ label, value }: StatDisplayProps) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900 font-mono">{value}</div>
    </div>
  );
}

