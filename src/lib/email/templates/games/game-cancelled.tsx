/**
 * Game Cancelled Email Template
 * Sent when a scheduled game is cancelled
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
} from '../base-layout';

interface GameCancelledTemplateProps {
  /** Player's display name */
  playerName: string;
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Original date of the game (formatted string) */
  originalDate: string;
  /** Original time of the game (formatted string) */
  originalTime: string;
  /** Reason for cancellation (optional) */
  reason?: string;
  /** URL to view the schedule */
  scheduleUrl: string;
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
 * Game cancelled email template component
 * Shows cancelled banner with original game details and optional reason
 */
export function GameCancelledTemplate({
  playerName,
  homeTeam,
  awayTeam,
  originalDate,
  originalTime,
  reason,
  scheduleUrl,
}: GameCancelledTemplateProps) {
  const previewText = `Game cancelled: ${awayTeam} @ ${homeTeam} - ${originalDate}`;

  return (
    <BaseLayout preview={previewText}>
      {/* Cancelled Banner */}
      <Section style={styles.cancelledBanner}>
        <Text style={styles.cancelledText}>CANCELLED</Text>
      </Section>

      <EmailHeading>Game Has Been Cancelled</EmailHeading>

      <EmailParagraph>Hi {playerName},</EmailParagraph>

      <EmailParagraph>
        We're writing to inform you that the following game has been cancelled:
      </EmailParagraph>

      {/* Game Details Box */}
      <Section style={styles.gameDetailsBox}>
        {/* Matchup Header */}
        <div style={styles.matchupHeader}>
          <Text style={styles.matchupText}>
            {awayTeam}
            <span style={styles.atSymbol}> @ </span>
            {homeTeam}
          </Text>
        </div>

        {/* Game Info */}
        <div style={styles.gameInfoGrid}>
          <div style={styles.gameInfoRow}>
            <Text style={styles.gameInfoLabel}>Original Date</Text>
            <Text style={styles.gameInfoValueStrike}>{originalDate}</Text>
          </div>
          <div style={{ ...styles.gameInfoRow, borderBottom: 'none' }}>
            <Text style={styles.gameInfoLabel}>Original Time</Text>
            <Text style={styles.gameInfoValueStrike}>{originalTime}</Text>
          </div>
        </div>
      </Section>

      {/* Reason if provided */}
      {reason && (
        <Section style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason for Cancellation:</Text>
          <Text style={styles.reasonText}>{reason}</Text>
        </Section>
      )}

      <EmailParagraph>
        We apologize for any inconvenience this may cause. Please check the
        schedule for any updates or rescheduled games.
      </EmailParagraph>

      {/* View Schedule Button */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={scheduleUrl}>View Schedule</EmailButton>
      </div>

      <EmailParagraph>
        If you have any questions, please reach out to your team manager or
        contact the league directly.
      </EmailParagraph>

      <EmailParagraph>
        <strong style={{ color: colors.navy }}>The CNEBL Team</strong>
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  cancelledBanner: {
    backgroundColor: colors.cardinal,
    padding: '16px 20px',
    marginBottom: '24px',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  cancelledText: {
    color: colors.white,
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '3px',
    margin: '0',
    textTransform: 'uppercase' as const,
  },
  gameDetailsBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: '8px',
    border: `2px solid ${colors.cardinal}`,
    overflow: 'hidden',
    marginTop: '24px',
    marginBottom: '24px',
    opacity: 0.9,
  },
  matchupHeader: {
    backgroundColor: colors.navy,
    padding: '16px 24px',
    textAlign: 'center' as const,
    opacity: 0.8,
  },
  matchupText: {
    color: colors.white,
    fontSize: '20px',
    fontWeight: '700',
    margin: '0',
  },
  atSymbol: {
    color: colors.gold,
    fontWeight: '400',
  },
  gameInfoGrid: {
    padding: '20px 24px',
  },
  gameInfoRow: {
    display: 'flex',
    borderBottom: `1px solid ${colors.grayLight}`,
    padding: '12px 0',
  },
  gameInfoLabel: {
    color: colors.grayDark,
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
    width: '100px',
    flexShrink: 0,
  },
  gameInfoValueStrike: {
    color: colors.cardinal,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0',
    flex: 1,
    textDecoration: 'line-through',
  },
  reasonBox: {
    backgroundColor: '#FFF7ED',
    borderLeft: `4px solid ${colors.gold}`,
    borderRadius: '4px',
    padding: '16px 20px',
    marginBottom: '24px',
  },
  reasonLabel: {
    color: colors.navy,
    fontSize: '13px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  reasonText: {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '1.5',
    margin: '0',
  },
};

export default GameCancelledTemplate;
