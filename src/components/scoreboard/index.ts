/**
 * Scoreboard Components
 *
 * Live game scoreboard UI components following the Heritage Diamond retro baseball theme.
 * Features classic stadium scoreboard aesthetics with navy backgrounds, cream/gold text,
 * and monospace fonts for numbers.
 *
 * @example
 * // Full line score scoreboard
 * import { LiveScoreboard } from '@/components/scoreboard';
 * <LiveScoreboard game={game} homeTeam={home} awayTeam={away} />
 *
 * @example
 * // Compact scoreboard for cards/lists
 * import { ScoreboardCompact } from '@/components/scoreboard';
 * <ScoreboardCompact game={game} homeTeam={home} awayTeam={away} />
 *
 * @example
 * // Home page banner with live games
 * import { LiveGameBanner } from '@/components/scoreboard';
 * <LiveGameBanner games={liveGames} autoScrollInterval={5000} />
 */

export { LiveScoreboard } from './LiveScoreboard';
export { ScoreboardCompact } from './ScoreboardCompact';
export { InningIndicator } from './InningIndicator';
export { OutsDisplay } from './OutsDisplay';
export { LiveGameBanner, LiveGameBannerMultiple } from './LiveGameBanner';
