/**
 * Game Scheduled Email Template
 * Sent when a new game is scheduled or an existing game is rescheduled
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
} from '../base-layout';

interface GameScheduledTemplateProps {
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
  /** Whether this is a rescheduled game */
  isReschedule: boolean;
  /** Original date if rescheduled (formatted string) */
  previousDate?: string;
  /** URL to update RSVP/availability */
  rsvpUrl: string;
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
 * Game scheduled email template component
 * Shows game details with an optional reschedule banner
 */
export function GameScheduledTemplate({
  playerName,
  homeTeam,
  awayTeam,
  gameDate,
  gameTime,
  location,
  locationAddress,
  isReschedule,
  previousDate,
  rsvpUrl,
}: GameScheduledTemplateProps) {
  const previewText = isReschedule
    ? `Game rescheduled: ${awayTeam} @ ${homeTeam} - ${gameDate}`
    : `New game scheduled: ${awayTeam} @ ${homeTeam} - ${gameDate}`;

  return (
    <BaseLayout preview={previewText}>
      {/* Reschedule Banner */}
      {isReschedule && (
        <Section style={styles.rescheduleBanner}>
          <Text style={styles.rescheduleBannerText}>RESCHEDULED</Text>
          {previousDate && (
            <Text style={styles.previousDateText}>
              Originally scheduled for {previousDate}
            </Text>
          )}
        </Section>
      )}

      <EmailHeading>
        {isReschedule ? 'Game Has Been Rescheduled' : 'New Game Scheduled'}
      </EmailHeading>

      <EmailParagraph>Hi {playerName},</EmailParagraph>

      <EmailParagraph>
        {isReschedule
          ? 'A game involving your team has been rescheduled. Please review the updated details below and confirm your availability.'
          : 'A new game has been scheduled for your team. Please review the details below and confirm your availability.'}
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
        </div>
      </Section>

      {/* RSVP Button */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={rsvpUrl}>Update Availability</EmailButton>
      </div>

      <EmailParagraph>
        Please update your availability as soon as possible so your team manager
        can plan accordingly.
      </EmailParagraph>

      <EmailParagraph>
        See you on the diamond!
        <br />
        <strong style={{ color: colors.navy }}>The CNEBL Team</strong>
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  rescheduleBanner: {
    backgroundColor: colors.gold,
    padding: '12px 20px',
    marginBottom: '24px',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  rescheduleBannerText: {
    color: colors.navy,
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '1px',
    margin: '0',
    textTransform: 'uppercase' as const,
  },
  previousDateText: {
    color: colors.navy,
    fontSize: '13px',
    fontWeight: '500',
    margin: '6px 0 0 0',
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
};

export default GameScheduledTemplate;
