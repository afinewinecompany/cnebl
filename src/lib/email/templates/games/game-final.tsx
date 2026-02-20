/**
 * Game Final Email Template
 * Sent after a game is completed with final score and box score link
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
} from '../base-layout';

interface GameFinalTemplateProps {
  /** Player's display name */
  playerName: string;
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Home team's final score */
  homeScore: number;
  /** Away team's final score */
  awayScore: number;
  /** Date of the game (formatted string) */
  gameDate: string;
  /** Name of the winning team (or null for tie) */
  winningTeam: string | null;
  /** URL to view the full box score */
  boxScoreUrl: string;
}

/**
 * Heritage Diamond theme colors
 */
const colors = {
  leather: '#8B4513',
  navy: '#1B3A5F',
  gold: '#C9A227',
  cardinal: '#BE1E2D',
  field: '#2D5A27',
  white: '#FFFFFF',
  cream: '#F5F0E1',
  grayDark: '#6B7280',
  grayLight: '#E5E7EB',
};

/**
 * Game final email template component
 * Shows scoreboard-style final score with winner indicator
 */
export function GameFinalTemplate({
  playerName,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  gameDate,
  winningTeam,
  boxScoreUrl,
}: GameFinalTemplateProps) {
  const isTie = homeScore === awayScore;
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;

  const previewText = isTie
    ? `Final: ${awayTeam} ${awayScore}, ${homeTeam} ${homeScore} (Tie)`
    : `Final: ${winningTeam} wins! ${awayTeam} ${awayScore}, ${homeTeam} ${homeScore}`;

  return (
    <BaseLayout preview={previewText}>
      {/* Final Banner */}
      <Section style={styles.finalBanner}>
        <Text style={styles.finalText}>FINAL</Text>
      </Section>

      <EmailHeading>Game Results</EmailHeading>

      <EmailParagraph>Hi {playerName},</EmailParagraph>

      <EmailParagraph>
        The final score is in! Here's how the game ended:
      </EmailParagraph>

      {/* Scoreboard */}
      <Section style={styles.scoreboard}>
        {/* Away Team Row */}
        <div style={awayWon ? styles.teamRowWinner : styles.teamRow}>
          <div style={styles.teamNameContainer}>
            {awayWon && <span style={styles.winIndicator}>W</span>}
            <Text style={awayWon ? styles.teamNameWinner : styles.teamName}>
              {awayTeam}
            </Text>
          </div>
          <Text style={awayWon ? styles.scoreWinner : styles.score}>
            {awayScore}
          </Text>
        </div>

        {/* Divider */}
        <div style={styles.scoreboardDivider} />

        {/* Home Team Row */}
        <div style={homeWon ? styles.teamRowWinner : styles.teamRow}>
          <div style={styles.teamNameContainer}>
            {homeWon && <span style={styles.winIndicator}>W</span>}
            <Text style={homeWon ? styles.teamNameWinner : styles.teamName}>
              {homeTeam}
            </Text>
          </div>
          <Text style={homeWon ? styles.scoreWinner : styles.score}>
            {homeScore}
          </Text>
        </div>

        {/* Game Date */}
        <div style={styles.gameDateRow}>
          <Text style={styles.gameDateText}>{gameDate}</Text>
        </div>
      </Section>

      {/* Winner/Tie Message */}
      {isTie ? (
        <Section style={styles.resultBox}>
          <Text style={styles.tieText}>This game ended in a tie!</Text>
        </Section>
      ) : (
        <Section style={styles.resultBox}>
          <Text style={styles.winnerText}>
            <span style={styles.winnerLabel}>Winner:</span> {winningTeam}
          </Text>
        </Section>
      )}

      {/* View Box Score Button */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={boxScoreUrl}>View Box Score</EmailButton>
      </div>

      <EmailParagraph>
        Check out the full box score for complete game statistics, including
        individual player stats and play-by-play details.
      </EmailParagraph>

      <EmailParagraph>
        <strong style={{ color: colors.navy }}>The CNEBL Team</strong>
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  finalBanner: {
    backgroundColor: colors.navy,
    padding: '10px 20px',
    marginBottom: '24px',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  finalText: {
    color: colors.gold,
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '3px',
    margin: '0',
    textTransform: 'uppercase' as const,
  },
  scoreboard: {
    backgroundColor: colors.navy,
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  teamRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamRowWinner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    backgroundColor: 'rgba(45, 90, 39, 0.3)',
  },
  teamNameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  teamName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
  },
  teamNameWinner: {
    color: colors.white,
    fontSize: '18px',
    fontWeight: '700',
    margin: '0',
  },
  winIndicator: {
    backgroundColor: colors.field,
    color: colors.white,
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    marginRight: '8px',
  },
  score: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    fontFamily: 'Georgia, serif',
  },
  scoreWinner: {
    color: colors.white,
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    fontFamily: 'Georgia, serif',
  },
  scoreboardDivider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    margin: '0 24px',
  },
  gameDateRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '10px 24px',
    textAlign: 'center' as const,
  },
  gameDateText: {
    color: colors.gold,
    fontSize: '12px',
    fontWeight: '500',
    margin: '0',
    letterSpacing: '0.5px',
  },
  resultBox: {
    textAlign: 'center' as const,
    padding: '16px 0',
  },
  winnerText: {
    color: colors.navy,
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
  },
  winnerLabel: {
    color: colors.grayDark,
    fontWeight: '400',
  },
  tieText: {
    color: colors.gold,
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
  },
};

export default GameFinalTemplate;
