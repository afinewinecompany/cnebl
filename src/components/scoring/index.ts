/**
 * Scoring Components
 * Live game scoring interface for team managers
 *
 * Components:
 * - ScoringPanel: Main scoring interface with full game state management
 * - RunInput: Quick buttons for recording runs (0-3, 4+)
 * - OutsInput: Touch-friendly outs tracker with visual feedback
 * - GameControls: Game flow controls (start, end, suspend, undo)
 * - ScoringConfirmDialog: Confirmation modal for destructive actions
 *
 * Usage:
 * ```tsx
 * import { ScoringPanel } from '@/components/scoring';
 *
 * <ScoringPanel
 *   game={gameData}
 *   onUpdateGame={async (updates) => await updateGame(game.id, updates)}
 * />
 * ```
 *
 * Or import individual components:
 * ```tsx
 * import { RunInput, OutsInput, GameControls } from '@/components/scoring';
 * ```
 */

export { ScoringPanel } from './ScoringPanel';
export type { ScoringPanelProps } from './ScoringPanel';

export { RunInput } from './RunInput';
export type { RunInputProps } from './RunInput';

export { OutsInput } from './OutsInput';
export type { OutsInputProps } from './OutsInput';

export { GameControls } from './GameControls';
export type { GameControlsProps, GameAction } from './GameControls';

export { ScoringConfirmDialog } from './ScoringConfirmDialog';
export type { ScoringConfirmDialogProps, DialogVariant } from './ScoringConfirmDialog';
