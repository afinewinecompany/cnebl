'use client';

import { cn } from '@/lib/utils';

export interface GameTotalsEntryProps {
  runs: number;
  rbis: number;
  stolenBases: number;
  caughtStealing: number;
  computedRbis?: number;
  onUpdate: (field: 'runs' | 'rbis' | 'stolenBases' | 'caughtStealing', value: number) => void;
  disabled?: boolean;
}

/**
 * GameTotalsEntry Component
 *
 * Compact input row for per-game totals including runs, RBIs, stolen bases,
 * and caught stealing. Used in stats entry forms.
 *
 * @example
 * <GameTotalsEntry
 *   runs={2}
 *   rbis={1}
 *   stolenBases={0}
 *   caughtStealing={0}
 *   computedRbis={3}
 *   onUpdate={(field, value) => handleUpdate(field, value)}
 * />
 */
export function GameTotalsEntry({
  runs,
  rbis,
  stolenBases,
  caughtStealing,
  computedRbis,
  onUpdate,
  disabled = false,
}: GameTotalsEntryProps) {
  const showComputedRbisDiff = computedRbis !== undefined && computedRbis !== rbis;

  const handleChange = (
    field: 'runs' | 'rbis' | 'stolenBases' | 'caughtStealing',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      onUpdate(field, value);
    }
  };

  const inputBaseClass = cn(
    'w-full px-2 py-1.5 text-sm border border-gray-200 rounded',
    'focus:ring-1 focus:ring-primary focus:border-primary',
    'font-mono text-center',
    disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed'
  );

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
        Game Totals
      </h4>
      <div className="grid grid-cols-4 gap-4">
        {/* Runs */}
        <div>
          <label
            htmlFor="game-totals-runs"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Runs
          </label>
          <input
            id="game-totals-runs"
            type="number"
            min={0}
            value={runs}
            onChange={(e) => handleChange('runs', e)}
            disabled={disabled}
            className={inputBaseClass}
            aria-label="Runs scored"
          />
        </div>

        {/* RBIs */}
        <div>
          <label
            htmlFor="game-totals-rbis"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            RBIs
          </label>
          <input
            id="game-totals-rbis"
            type="number"
            min={0}
            value={rbis}
            onChange={(e) => handleChange('rbis', e)}
            disabled={disabled}
            className={inputBaseClass}
            aria-label="Runs batted in"
          />
          {showComputedRbisDiff && (
            <p className="text-xs text-amber-600 mt-1">
              (computed: {computedRbis})
            </p>
          )}
        </div>

        {/* Stolen Bases */}
        <div>
          <label
            htmlFor="game-totals-sb"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            SB
          </label>
          <input
            id="game-totals-sb"
            type="number"
            min={0}
            value={stolenBases}
            onChange={(e) => handleChange('stolenBases', e)}
            disabled={disabled}
            className={inputBaseClass}
            aria-label="Stolen bases"
          />
        </div>

        {/* Caught Stealing */}
        <div>
          <label
            htmlFor="game-totals-cs"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            CS
          </label>
          <input
            id="game-totals-cs"
            type="number"
            min={0}
            value={caughtStealing}
            onChange={(e) => handleChange('caughtStealing', e)}
            disabled={disabled}
            className={inputBaseClass}
            aria-label="Caught stealing"
          />
        </div>
      </div>
    </div>
  );
}
