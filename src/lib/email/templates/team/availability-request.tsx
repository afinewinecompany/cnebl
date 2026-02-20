/**
 * Availability Request Email Template
 * Sent by team managers to request availability for upcoming games
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
} from '../base-layout';

/**
 * Game information for availability requests
 */
export interface GameForAvailability {
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
}

interface AvailabilityRequestTemplateProps {
  /** Player's display name */
  playerName: string;
  /** Manager's display name */
  managerName: string;
  /** Name of the team */
  teamName: string;
  /** Array of upcoming games */
  games: GameForAvailability[];
  /** URL to update availability */
  availabilityUrl: string;
}

/**
 * Heritage Diamond theme colors
 */
const colors = {
  leather: '#8B4513',
  navy: '#1B3A5F',
  gold: '#C9A227',
  field: '#2D5A27',
  cream: '#F5F0E1',
  white: '#FFFFFF',
  grayDark: '#6B7280',
  grayLight: '#E5E7EB',
};

/**
 * Availability request email template component
 * Lists upcoming games and prompts player to update their availability
 */
export function AvailabilityRequestTemplate({
  playerName,
  managerName,
  teamName,
  games,
  availabilityUrl,
}: AvailabilityRequestTemplateProps) {
  const gameCount = games.length;
  const previewText = `${managerName} is requesting your availability for ${gameCount} upcoming game${gameCount !== 1 ? 's' : ''}`;

  return (
    <BaseLayout preview={previewText}>
      {/* Team Header Banner */}
      <Section style={styles.teamBanner}>
        <Text style={styles.teamBannerText}>{teamName}</Text>
        <Text style={styles.teamBannerSubtext}>Availability Request</Text>
      </Section>

      <EmailHeading>Your Availability is Needed</EmailHeading>

      <EmailParagraph>Hi {playerName},</EmailParagraph>

      <EmailParagraph>
        <strong style={{ color: colors.navy }}>{managerName}</strong> is requesting your
        availability for the following upcoming game{gameCount !== 1 ? 's' : ''}. Please
        update your availability so we can plan our lineups accordingly.
      </EmailParagraph>

      {/* Games List */}
      <Section style={styles.gamesContainer}>
        {games.map((game, index) => (
          <div key={index} style={styles.gameCard}>
            {/* Matchup */}
            <div style={styles.matchupRow}>
              <Text style={styles.matchupText}>
                {game.awayTeam}
                <span style={styles.atSymbol}> @ </span>
                {game.homeTeam}
              </Text>
            </div>

            {/* Game Details */}
            <div style={styles.gameDetails}>
              <div style={styles.detailRow}>
                <Text style={styles.detailIcon}>&#128197;</Text>
                <Text style={styles.detailText}>{game.gameDate}</Text>
              </div>
              <div style={styles.detailRow}>
                <Text style={styles.detailIcon}>&#128336;</Text>
                <Text style={styles.detailText}>{game.gameTime}</Text>
              </div>
              <div style={styles.detailRow}>
                <Text style={styles.detailIcon}>&#128205;</Text>
                <Text style={styles.detailText}>{game.location}</Text>
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* Update Availability Button */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={availabilityUrl}>Update Availability</EmailButton>
      </div>

      {/* Note about helping manager */}
      <Section style={styles.noteBox}>
        <Text style={styles.noteText}>
          <strong>Why this matters:</strong> Updating your availability helps your manager
          plan lineups, coordinate substitutes if needed, and ensure we have enough players
          for each game. Even if you are unsure, marking yourself as tentative is helpful!
        </Text>
      </Section>

      <EmailParagraph>
        Thank you for being part of the team!
        <br />
        <strong style={{ color: colors.navy }}>The CNEBL Team</strong>
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  teamBanner: {
    backgroundColor: colors.field,
    padding: '16px 24px',
    marginBottom: '24px',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  teamBannerText: {
    color: colors.white,
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    margin: '0 0 4px 0',
  },
  teamBannerSubtext: {
    color: colors.gold,
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '1px',
    margin: '0',
    textTransform: 'uppercase' as const,
  },
  gamesContainer: {
    marginTop: '24px',
    marginBottom: '16px',
  },
  gameCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: `1px solid ${colors.grayLight}`,
    overflow: 'hidden',
    marginBottom: '16px',
  },
  matchupRow: {
    backgroundColor: colors.navy,
    padding: '12px 20px',
    textAlign: 'center' as const,
  },
  matchupText: {
    color: colors.white,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
  },
  atSymbol: {
    color: colors.gold,
    fontWeight: '400',
  },
  gameDetails: {
    padding: '16px 20px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  detailIcon: {
    fontSize: '14px',
    margin: '0 10px 0 0',
    width: '20px',
  },
  detailText: {
    color: colors.navy,
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
  },
  noteBox: {
    backgroundColor: colors.cream,
    borderLeft: `4px solid ${colors.leather}`,
    borderRadius: '4px',
    padding: '16px 20px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  noteText: {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
  },
};

export default AvailabilityRequestTemplate;
