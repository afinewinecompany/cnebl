'use client';

import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Props for team data in score entry
interface TeamInfo {
  name: string;
  abbreviation: string;
  primaryColor?: string;
}

export interface ScoreEntryCardProps {
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  awayScore: number;
  homeScore: number;
  onScoreChange: (team: 'home' | 'away', score: number) => void;
  onSave: () => void;
  hasChanges: boolean;
  isSaving?: boolean;
  disabled?: boolean;
}

/**
 * ScoreEntryCard Component
 *
 * A simple card for entering final game scores.
 * Displays both teams side by side with large score inputs.
 *
 * Usage:
 * ```tsx
 * <ScoreEntryCard
 *   awayTeam={{ name: 'Diamondbacks', abbreviation: 'ARI', primaryColor: '#A71930' }}
 *   homeTeam={{ name: 'Rockies', abbreviation: 'COL', primaryColor: '#33006F' }}
 *   awayScore={4}
 *   homeScore={2}
 *   onScoreChange={(team, score) => handleScoreChange(team, score)}
 *   onSave={() => handleSave()}
 *   hasChanges={true}
 * />
 * ```
 */
export function ScoreEntryCard({
  awayTeam,
  homeTeam,
  awayScore,
  homeScore,
  onScoreChange,
  onSave,
  hasChanges,
  isSaving = false,
  disabled = false,
}: ScoreEntryCardProps) {
  // Handle score input change with validation
  const handleScoreInput = (team: 'home' | 'away', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
      onScoreChange(team, numValue);
    }
  };

  // Handle increment/decrement via keyboard
  const handleKeyDown = (
    team: 'home' | 'away',
    currentScore: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentScore < 99) {
        onScoreChange(team, currentScore + 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentScore > 0) {
        onScoreChange(team, currentScore - 1);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
          Final Score
        </h3>
        <Button
          onClick={onSave}
          disabled={!hasChanges || isSaving || disabled}
          size="sm"
          aria-label="Save final score"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" aria-hidden="true" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Score Entry Content */}
      <div className="p-6">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Away Team */}
          <div className="flex-1 max-w-[200px]">
            <div
              className={cn(
                'rounded-lg border-2 p-4 transition-colors',
                disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
              )}
            >
              {/* Team indicator with color */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: awayTeam.primaryColor || '#6B7280' }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Away
                </span>
              </div>

              {/* Team name */}
              <p className="font-semibold text-gray-900 truncate" title={awayTeam.name}>
                {awayTeam.name}
              </p>
              <p className="text-xs text-gray-500 font-mono">{awayTeam.abbreviation}</p>

              {/* Score input */}
              <div className="mt-4">
                <label htmlFor="away-score" className="sr-only">
                  {awayTeam.name} score
                </label>
                <input
                  id="away-score"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={awayScore}
                  onChange={(e) => handleScoreInput('away', e.target.value)}
                  onKeyDown={(e) => handleKeyDown('away', awayScore, e)}
                  disabled={disabled || isSaving}
                  className={cn(
                    'w-full h-16 text-center font-mono text-4xl font-bold rounded-lg border-2 transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy',
                    'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
                    hasChanges ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                  )}
                  aria-describedby="away-team-name"
                />
                <span id="away-team-name" className="sr-only">
                  {awayTeam.name}
                </span>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="flex flex-col items-center text-gray-400">
            <span className="text-sm font-medium uppercase tracking-wide">at</span>
          </div>

          {/* Home Team */}
          <div className="flex-1 max-w-[200px]">
            <div
              className={cn(
                'rounded-lg border-2 p-4 transition-colors',
                disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
              )}
            >
              {/* Team indicator with color */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: homeTeam.primaryColor || '#6B7280' }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Home
                </span>
              </div>

              {/* Team name */}
              <p className="font-semibold text-gray-900 truncate" title={homeTeam.name}>
                {homeTeam.name}
              </p>
              <p className="text-xs text-gray-500 font-mono">{homeTeam.abbreviation}</p>

              {/* Score input */}
              <div className="mt-4">
                <label htmlFor="home-score" className="sr-only">
                  {homeTeam.name} score
                </label>
                <input
                  id="home-score"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={homeScore}
                  onChange={(e) => handleScoreInput('home', e.target.value)}
                  onKeyDown={(e) => handleKeyDown('home', homeScore, e)}
                  disabled={disabled || isSaving}
                  className={cn(
                    'w-full h-16 text-center font-mono text-4xl font-bold rounded-lg border-2 transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy',
                    'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
                    hasChanges ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                  )}
                  aria-describedby="home-team-name"
                />
                <span id="home-team-name" className="sr-only">
                  {homeTeam.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Unsaved changes indicator */}
        {hasChanges && !disabled && (
          <p className="mt-4 text-center text-sm text-amber-600 font-medium">
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
}

export default ScoreEntryCard;
