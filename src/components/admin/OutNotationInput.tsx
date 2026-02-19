'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * OutType represents the different types of outs in baseball
 */
export type OutType = 'K' | 'Kc' | 'GO' | 'FO' | 'LO' | 'PO' | 'DP' | 'FC';

/**
 * Quick-select button configuration
 */
interface QuickButton {
  notation: string;
  label: string;
  outType?: OutType;
}

/**
 * Rows of quick-select buttons organized by out category
 */
const QUICK_SELECT_ROWS: QuickButton[][] = [
  // Row 1: Strikeouts
  [
    { notation: 'K', label: 'K', outType: 'K' },
    { notation: 'Kc', label: 'Kc', outType: 'Kc' },
  ],
  // Row 2: Groundouts to first
  [
    { notation: '6-3', label: '6-3', outType: 'GO' },
    { notation: '5-3', label: '5-3', outType: 'GO' },
    { notation: '4-3', label: '4-3', outType: 'GO' },
    { notation: '3-1', label: '3-1', outType: 'GO' },
  ],
  // Row 3: Fly balls to outfield
  [
    { notation: 'F7', label: 'F7', outType: 'FO' },
    { notation: 'F8', label: 'F8', outType: 'FO' },
    { notation: 'F9', label: 'F9', outType: 'FO' },
  ],
  // Row 4: Line outs, pop outs, double plays, fielder's choice
  [
    { notation: 'L5', label: 'L5', outType: 'LO' },
    { notation: 'L6', label: 'L6', outType: 'LO' },
    { notation: 'PO', label: 'PO', outType: 'PO' },
    { notation: 'DP 6-4-3', label: 'DP 6-4-3', outType: 'DP' },
    { notation: 'FC', label: 'FC', outType: 'FC' },
  ],
];

interface OutNotationInputProps {
  /** Current notation value */
  value: string;
  /** Callback when notation changes */
  onChange: (notation: string) => void;
  /** The selected out subtype */
  outType: OutType;
  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * OutNotationInput Component
 *
 * A smart input for entering out notations with quick-select buttons.
 * Provides common baseball out notations organized by category (strikeouts,
 * groundouts, fly balls, etc.) along with a custom input field.
 *
 * @example
 * ```tsx
 * <OutNotationInput
 *   value={notation}
 *   onChange={setNotation}
 *   outType="GO"
 * />
 * ```
 */
export function OutNotationInput({
  value,
  onChange,
  outType,
  disabled = false,
}: OutNotationInputProps) {
  /**
   * Handle quick-select button click
   */
  const handleQuickSelect = useCallback(
    (notation: string) => {
      if (!disabled) {
        onChange(notation);
      }
    },
    [disabled, onChange]
  );

  /**
   * Handle custom input change
   */
  const handleCustomInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  /**
   * Check if a button matches the current out type
   * Used for visual highlighting of relevant buttons
   */
  const isRelevantForOutType = useCallback(
    (button: QuickButton): boolean => {
      return button.outType === outType;
    },
    [outType]
  );

  return (
    <div className="space-y-2">
      {/* Quick-select button rows */}
      <div className="space-y-1.5">
        {QUICK_SELECT_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1">
            {row.map((button) => {
              const isSelected = value === button.notation;
              const isRelevant = isRelevantForOutType(button);

              return (
                <button
                  key={button.notation}
                  type="button"
                  onClick={() => handleQuickSelect(button.notation)}
                  disabled={disabled}
                  className={cn(
                    // Base styles
                    'px-2 py-1 text-xs font-medium rounded border transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                    // Default state
                    'bg-gray-100 border-gray-200 text-gray-700',
                    'hover:bg-gray-200 hover:border-gray-300',
                    // Selected state
                    isSelected && 'bg-primary text-white border-primary hover:bg-primary/90 hover:border-primary/90',
                    // Relevant for current out type (subtle highlight)
                    !isSelected && isRelevant && 'bg-gray-200 border-gray-300',
                    // Disabled state
                    disabled && 'opacity-50 cursor-not-allowed hover:bg-gray-100 hover:border-gray-200'
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Select out notation ${button.label}`}
                >
                  {button.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Custom input field */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="custom-notation"
          className="text-xs font-medium text-gray-500 whitespace-nowrap"
        >
          Custom:
        </label>
        <input
          id="custom-notation"
          type="text"
          value={value}
          onChange={handleCustomInput}
          disabled={disabled}
          placeholder="Enter notation..."
          className={cn(
            'flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded',
            'focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none',
            'placeholder:text-gray-400',
            disabled && 'bg-gray-50 cursor-not-allowed opacity-50'
          )}
          aria-label="Custom out notation input"
        />
      </div>
    </div>
  );
}

export default OutNotationInput;
