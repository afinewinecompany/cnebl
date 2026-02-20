/**
 * Game Reminder Email Template
 * Sent the day before a scheduled game as a reminder
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
  EmailAlert,
} from '../base-layout';

/** Player's RSVP status for the game */
export type PlayerRsvpStatus = 'available' | 'unavailable' | 'tentative' | 'no_response';

interface GameReminderTemplateProps {
  /** Player's display name */
  playerName: string;
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Date of the game (formatted string) */
  gameDate: string;
  /** Time of the game (formatted string) */
  gameTime: string;
  /** Name of the location/field */
  location: string;
  /** Full address of the location */
  locationAddress: string;
  /** URL to update RSVP/availability */
  rsvpUrl: string;
  /** Player's current RSVP status */
  playerRsvpStatus: PlayerRsvpStatus;
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
 * Get status display text and color
 */
function getStatusDisplay(status: PlayerRsvpStatus): { text: string; bgColor: string; textColor: string } {
  switch (status) {
    case 'available':
      return { text: 'Available', bgColor: colors.field, textColor: colors.white };
    case 'unavailable':
      return { text: 'Unavailable', bgColor: colors.cardinal, textColor: colors.white };
    case 'tentative':
      return { text: 'Tentative', bgColor: colors.gold, textColor: colors.navy };
    case 'no_response':
    default:
      return { text: 'No Response', bgColor: colors.grayDark, textColor: colors.white };
  }
}

/**
 * Game reminder email template component
 * Shows game details with urgent messaging for players who haven't confirmed availability
 */
export function GameReminderTemplate({
  playerName,
  homeTeam,
  awayTeam,
  gameDate,
  gameTime,
  location,
  locationAddress,
  rsvpUrl,
  playerRsvpStatus,
}: GameReminderTemplateProps) {
  const needsResponse = playerRsvpStatus === 'no_response' || playerRsvpStatus === 'tentative';
  const statusDisplay = getStatusDisplay(playerRsvpStatus);

  const previewText = needsResponse
    ? `Action needed: Please confirm your availability for tomorrow's game - ${awayTeam} @ ${homeTeam}`
    : `Game tomorrow: ${awayTeam} @ ${homeTeam} - ${gameTime}`;

  return (
    <BaseLayout preview={previewText}>
      {/* Tomorrow Header */}
      <Section style={styles.tomorrowBanner}>
        <Text style={styles.tomorrowText}>GAME TOMORROW</Text>
      </Section>

      <EmailHeading>Game Day Reminder</EmailHeading>

      <EmailParagraph>Hi {playerName},</EmailParagraph>

      <EmailParagraph>
        This is a reminder that your team has a game scheduled for tomorrow.
        Here are the details:
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
            <Text style={styles.gameInfoLabel}>Date</Text>
            <Text style={styles.gameInfoValue}>{gameDate}</Text>
          </div>
          <div style={styles.gameInfoRow}>
            <Text style={styles.gameInfoLabel}>Time</Text>
            <Text style={styles.gameInfoValue}>{gameTime}</Text>
          </div>
          <div style={styles.gameInfoRow}>
            <Text style={styles.gameInfoLabel}>Location</Text>
            <Text style={styles.gameInfoValue}>{location}</Text>
          </div>
          <div style={styles.gameInfoRow}>
            <Text style={styles.gameInfoLabel}>Address</Text>
            <Text style={styles.gameInfoValue}>{locationAddress}</Text>
          </div>
          <div style={{ ...styles.gameInfoRow, borderBottom: 'none' }}>
            <Text style={styles.gameInfoLabel}>Your Status</Text>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: statusDisplay.bgColor,
                color: statusDisplay.textColor,
              }}
            >
              {statusDisplay.text}
            </span>
          </div>
        </div>
      </Section>

      {/* Urgent Alert for No Response or Tentative */}
      {needsResponse && (
        <EmailAlert variant="warning">
          <strong>Action Required:</strong> Your team manager needs to know if you
          can make it to tomorrow's game. Please update your availability as soon
          as possible.
        </EmailAlert>
      )}

      {/* RSVP Button */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={rsvpUrl}>Update Availability</EmailButton>
      </div>

      {playerRsvpStatus === 'available' && (
        <EmailParagraph>
          Great to see you're available! If your plans change, please update your
          status so your manager knows.
        </EmailParagraph>
      )}

      {playerRsvpStatus === 'unavailable' && (
        <EmailParagraph>
          We see you're marked as unavailable. If your plans change and you can
          make it, please update your status.
        </EmailParagraph>
      )}

      <EmailParagraph>
        See you on the diamond!
        <br />
        <strong style={{ color: colors.navy }}>The CNEBL Team</strong>
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  tomorrowBanner: {
    backgroundColor: colors.field,
    padding: '12px 20px',
    marginBottom: '24px',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  tomorrowText: {
    color: colors.white,
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '2px',
    margin: '0',
    textTransform: 'uppercase' as const,
  },
  gameDetailsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: `2px solid ${colors.navy}`,
    overflow: 'hidden',
    marginTop: '24px',
    marginBottom: '16px',
  },
  matchupHeader: {
    backgroundColor: colors.navy,
    padding: '16px 24px',
    textAlign: 'center' as const,
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
    alignItems: 'center',
    borderBottom: `1px solid ${colors.grayLight}`,
    padding: '12px 0',
  },
  gameInfoLabel: {
    color: colors.grayDark,
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
    width: '80px',
    flexShrink: 0,
  },
  gameInfoValue: {
    color: colors.navy,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0',
    flex: 1,
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
};

export default GameReminderTemplate;
