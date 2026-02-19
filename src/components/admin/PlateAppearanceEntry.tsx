'use client';

import { useCallback, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResultTypeSelector } from './ResultTypeSelector';
import { OutNotationInput } from './OutNotationInput';
import type {
  PlateAppearanceEntry as PlateAppearanceEntryType,
  PlateAppearanceResultType,
  PlateAppearanceSubtype,
  OutType,
  HitType,
  WalkType,
  SacrificeType,
} from '@/types/plate-appearance.types';

// =============================================================================
// NOTATION MAPPINGS
// =============================================================================

/**
 * Auto-generated notations for non-out result types
 * These are set automatically when subtype is selected
 */
const AUTO_NOTATIONS: Record<Exclude<PlateAppearanceSubtype, OutType>, string> = {
  // Hits - notation matches subtype
  '1B': '1B',
  '2B': '2B',
  '3B': '3B',
  'HR': 'HR',
  // Walks
  'BB': 'BB',
  'IBB': 'IBB',
  'HBP': 'HBP',
  // Sacrifices
  'SAC': 'SAC',
  'SF': 'SF',
};

/**
 * Ordinal suffix for PA numbers
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface PlateAppearanceEntryProps {
  /** The plate appearance data */
  pa: PlateAppearanceEntryType;
  /** The PA number (1-based index) */
  paNumber: number;
  /** Callback when the PA is updated */
  onUpdate: (updated: PlateAppearanceEntryType) => void;
  /** Callback when the PA is deleted */
  onDelete: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PlateAppearanceEntry Component
 *
 * A single plate appearance input row for scorebook-style stats entry.
 * Displays PA number, result type selector, notation input, RBI counter,
 * and a delete button in a compact horizontal layout.
 *
 * @example
 * ```tsx
 * <PlateAppearanceEntry
 *   pa={plateAppearance}
 *   paNumber={1}
 *   onUpdate={(updated) => handleUpdate(updated)}
 *   onDelete={() => handleDelete(plateAppearance.id)}
 * />
 * ```
 */
export function PlateAppearanceEntry({
  pa,
  paNumber,
  onUpdate,
  onDelete,
  disabled = false,
}: PlateAppearanceEntryProps) {
  // Determine if RBI input should be visible
  // RBIs are relevant for: hits, sacrifice flies, and certain outs (FC, GO, FO, LO, PO, DP)
  const showRbiInput = useMemo(() => {
    if (!pa.resultType || !pa.resultSubtype) return false;

    // Hits can always produce RBIs
    if (pa.resultType === 'hit') return true;

    // Sacrifice fly can produce RBIs
    if (pa.resultSubtype === 'SF') return true;

    // Certain outs can produce RBIs (runner scores on the play)
    const rbiEligibleOuts: OutType[] = ['GO', 'FO', 'LO', 'PO', 'DP', 'FC'];
    if (pa.resultType === 'out' && rbiEligibleOuts.includes(pa.resultSubtype as OutType)) {
      return true;
    }

    return false;
  }, [pa.resultType, pa.resultSubtype]);

  // Determine if this is an out type that needs notation input
  const isOutType = pa.resultType === 'out';

  // Handle result type change
  const handleResultTypeChange = useCallback(
    (type: PlateAppearanceResultType) => {
      onUpdate({
        ...pa,
        resultType: type,
        resultSubtype: null as unknown as PlateAppearanceSubtype, // Reset subtype when type changes
        notation: '',
        rbiOnPlay: 0, // Reset RBI when type changes
        hasChanges: true,
      });
    },
    [pa, onUpdate]
  );

  // Handle subtype change
  const handleSubtypeChange = useCallback(
    (subtype: PlateAppearanceSubtype) => {
      // Auto-set notation for non-out types
      let notation = pa.notation;
      if (pa.resultType !== 'out') {
        notation = AUTO_NOTATIONS[subtype as Exclude<PlateAppearanceSubtype, OutType>] || subtype;
      } else {
        // For outs, clear notation to prompt user to select via OutNotationInput
        notation = '';
      }

      onUpdate({
        ...pa,
        resultSubtype: subtype,
        notation,
        hasChanges: true,
      });
    },
    [pa, onUpdate]
  );

  // Handle notation change (for outs)
  const handleNotationChange = useCallback(
    (notation: string) => {
      onUpdate({
        ...pa,
        notation,
        hasChanges: true,
      });
    },
    [pa, onUpdate]
  );

  // Handle RBI change
  const handleRbiChange = useCallback(
    (rbi: number) => {
      // Clamp RBI value between 0 and 4
      const clampedRbi = Math.max(0, Math.min(4, rbi));
      onUpdate({
        ...pa,
        rbiOnPlay: clampedRbi,
        hasChanges: true,
      });
    },
    [pa, onUpdate]
  );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-3 rounded-lg border transition-colors',
        pa.hasChanges ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 bg-white',
        disabled && 'opacity-50'
      )}
    >
      {/* Top Row: PA Badge, Delete Button */}
      <div className="flex items-center justify-between">
        {/* PA Number Badge */}
        <div
          className={cn(
            'flex items-center justify-center w-12 h-8 rounded-md text-sm font-semibold',
            pa.resultType === 'hit' && 'bg-field/10 text-field',
            pa.resultType === 'walk' && 'bg-blue-100 text-blue-700',
            pa.resultType === 'out' && 'bg-cardinal/10 text-cardinal',
            pa.resultType === 'sacrifice' && 'bg-amber-100 text-amber-700',
            !pa.resultType && 'bg-gray-100 text-gray-600'
          )}
        >
          {paNumber}
          <span className="text-xs ml-0.5">{getOrdinalSuffix(paNumber)}</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* RBI Counter - only visible when relevant */}
          {showRbiInput && (
            <div className="flex items-center gap-1.5">
              <label
                htmlFor={`rbi-${pa.id}`}
                className="text-xs font-medium text-gray-500"
              >
                RBI
              </label>
              <input
                id={`rbi-${pa.id}`}
                type="number"
                min={0}
                max={4}
                value={pa.rbiOnPlay}
                onChange={(e) => handleRbiChange(parseInt(e.target.value, 10) || 0)}
                disabled={disabled}
                className={cn(
                  'w-12 px-2 py-1 text-center text-sm font-mono border rounded',
                  'focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none',
                  'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                )}
                aria-label={`RBIs for plate appearance ${paNumber}`}
              />
            </div>
          )}

          {/* Notation Display (for non-outs) */}
          {!isOutType && pa.notation && (
            <div
              className={cn(
                'px-2 py-1 text-xs font-semibold rounded',
                pa.resultType === 'hit' && 'bg-field/10 text-field',
                pa.resultType === 'walk' && 'bg-blue-100 text-blue-700',
                pa.resultType === 'sacrifice' && 'bg-amber-100 text-amber-700'
              )}
            >
              {pa.notation}
            </div>
          )}

          {/* Delete Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={disabled}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
            aria-label={`Delete plate appearance ${paNumber}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Result Type Selector */}
      <ResultTypeSelector
        resultType={pa.resultType}
        resultSubtype={pa.resultSubtype}
        onResultTypeChange={handleResultTypeChange}
        onSubtypeChange={handleSubtypeChange}
        disabled={disabled}
      />

      {/* Out Notation Input - only visible for outs */}
      {isOutType && pa.resultSubtype && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Enter play notation
          </p>
          <OutNotationInput
            value={pa.notation}
            onChange={handleNotationChange}
            outType={pa.resultSubtype as OutType}
            disabled={disabled}
          />
        </div>
      )}

      {/* Error Display */}
      {pa.errors && Object.keys(pa.errors).length > 0 && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {Object.values(pa.errors).join(', ')}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { PlateAppearanceEntryProps };
export default PlateAppearanceEntry;
