'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  PlateAppearanceResultType,
  PlateAppearanceSubtype,
  HitType,
  WalkType,
  OutType,
  SacrificeType,
} from '@/types/plate-appearance.types';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface ResultTypeConfig {
  label: string;
  subtypes: PlateAppearanceSubtype[];
  color: {
    default: string;
    selected: string;
  };
}

const RESULT_TYPE_CONFIG: Record<PlateAppearanceResultType, ResultTypeConfig> = {
  hit: {
    label: 'Hit',
    subtypes: ['1B', '2B', '3B', 'HR'] as HitType[],
    color: {
      default: 'border-field/30 text-field hover:bg-field/10',
      selected: 'bg-field text-white border-field hover:bg-field-light',
    },
  },
  walk: {
    label: 'Walk',
    subtypes: ['BB', 'IBB', 'HBP'] as WalkType[],
    color: {
      default: 'border-blue-400/30 text-blue-600 hover:bg-blue-50',
      selected: 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600',
    },
  },
  out: {
    label: 'Out',
    subtypes: ['K', 'Kc', 'GO', 'FO', 'LO', 'PO', 'DP', 'FC'] as OutType[],
    color: {
      default: 'border-cardinal/30 text-cardinal hover:bg-cardinal/10',
      selected: 'bg-cardinal text-white border-cardinal hover:bg-cardinal-light',
    },
  },
  sacrifice: {
    label: 'Sacrifice',
    subtypes: ['SAC', 'SF'] as SacrificeType[],
    color: {
      default: 'border-amber-400/30 text-amber-600 hover:bg-amber-50',
      selected: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600',
    },
  },
};

const SUBTYPE_LABELS: Record<PlateAppearanceSubtype, string> = {
  // Hits
  '1B': '1B',
  '2B': '2B',
  '3B': '3B',
  'HR': 'HR',
  // Walks
  'BB': 'BB',
  'IBB': 'IBB',
  'HBP': 'HBP',
  // Outs
  'K': 'K',
  'Kc': 'Kc',
  'GO': 'GO',
  'FO': 'FO',
  'LO': 'LO',
  'PO': 'PO',
  'DP': 'DP',
  'FC': 'FC',
  // Sacrifices
  'SAC': 'SAC',
  'SF': 'SF',
};

const SUBTYPE_TOOLTIPS: Record<PlateAppearanceSubtype, string> = {
  '1B': 'Single',
  '2B': 'Double',
  '3B': 'Triple',
  'HR': 'Home Run',
  'BB': 'Base on Balls',
  'IBB': 'Intentional Walk',
  'HBP': 'Hit By Pitch',
  'K': 'Strikeout (Swinging)',
  'Kc': 'Strikeout (Called)',
  'GO': 'Ground Out',
  'FO': 'Fly Out',
  'LO': 'Line Out',
  'PO': 'Pop Out',
  'DP': 'Double Play',
  'FC': "Fielder's Choice",
  'SAC': 'Sacrifice Bunt',
  'SF': 'Sacrifice Fly',
};

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface ResultTypeSelectorProps {
  resultType: PlateAppearanceResultType | null;
  resultSubtype: PlateAppearanceSubtype | null;
  onResultTypeChange: (type: PlateAppearanceResultType) => void;
  onSubtypeChange: (subtype: PlateAppearanceSubtype) => void;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ResultTypeSelector Component
 *
 * A visual button group for selecting plate appearance result types.
 * Shows main categories (Hit, Walk, Out, Sacrifice) and reveals
 * appropriate subtypes when a category is selected.
 *
 * Usage:
 * ```tsx
 * <ResultTypeSelector
 *   resultType={resultType}
 *   resultSubtype={resultSubtype}
 *   onResultTypeChange={setResultType}
 *   onSubtypeChange={setSubtype}
 * />
 * ```
 */
export function ResultTypeSelector({
  resultType,
  resultSubtype,
  onResultTypeChange,
  onSubtypeChange,
  disabled = false,
}: ResultTypeSelectorProps) {
  // Get subtypes for the selected result type
  const activeSubtypes = useMemo(() => {
    if (!resultType) return [];
    return RESULT_TYPE_CONFIG[resultType].subtypes;
  }, [resultType]);

  // Get color config for selected type
  const selectedTypeConfig = resultType ? RESULT_TYPE_CONFIG[resultType] : null;

  return (
    <div className="space-y-3">
      {/* Main Result Type Buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Result type">
        {(Object.keys(RESULT_TYPE_CONFIG) as PlateAppearanceResultType[]).map((type) => {
          const config = RESULT_TYPE_CONFIG[type];
          const isSelected = resultType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onResultTypeChange(type)}
              disabled={disabled}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected ? config.color.selected : config.color.default
              )}
              aria-pressed={isSelected}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Subtype Buttons - shown when a main type is selected */}
      {resultType && activeSubtypes.length > 0 && (
        <div
          className={cn(
            'p-3 rounded-lg border border-gray-200 bg-gray-50',
            'animate-in fade-in slide-in-from-top-1 duration-200'
          )}
        >
          <p className="text-xs font-medium text-gray-500 mb-2">
            Select {RESULT_TYPE_CONFIG[resultType].label} Type
          </p>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={`${RESULT_TYPE_CONFIG[resultType].label} subtypes`}
          >
            {activeSubtypes.map((subtype) => {
              const isSelected = resultSubtype === subtype;

              return (
                <button
                  key={subtype}
                  type="button"
                  onClick={() => onSubtypeChange(subtype)}
                  disabled={disabled}
                  title={SUBTYPE_TOOLTIPS[subtype]}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-md border transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected
                      ? selectedTypeConfig?.color.selected
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-100'
                  )}
                  aria-pressed={isSelected}
                >
                  {SUBTYPE_LABELS[subtype]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Result Summary */}
      {resultType && resultSubtype && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Selected:</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-semibold',
              selectedTypeConfig?.color.selected
            )}
          >
            {SUBTYPE_TOOLTIPS[resultSubtype]}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ResultTypeSelectorProps };
