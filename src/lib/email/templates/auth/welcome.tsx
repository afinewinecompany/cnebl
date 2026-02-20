/**
 * Welcome Email Template
 * Sent after a user verifies their email address
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
} from '../base-layout';

interface WelcomeTemplateProps {
  /** User's display name */
  userName: string;
  /** URL to the dashboard (optional) */
  dashboardUrl?: string;
}

/**
 * Welcome email template component
 * Introduces the user to CNEBL features and provides CTA to dashboard
 */
export function WelcomeTemplate({ userName, dashboardUrl }: WelcomeTemplateProps) {
  const previewText = `Welcome to the Coastal New England Baseball League!`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cnebl.com';
  const dashboard = dashboardUrl || `${baseUrl}/dashboard`;

  return (
    <BaseLayout preview={previewText}>
      <EmailHeading>Welcome to the League, {userName}!</EmailHeading>

      <EmailParagraph>
        Your email has been verified and your CNEBL account is now active.
        Welcome to the Coastal New England Baseball League family!
      </EmailParagraph>

      <EmailParagraph>
        As a member, you now have access to everything you need to stay
        connected with the league:
      </EmailParagraph>

      {/* Feature highlights */}
      <Section style={styles.featuresSection}>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <span style={styles.iconText}>&#128197;</span>
          </div>
          <div style={styles.featureContent}>
            <Text style={styles.featureTitle}>View the Schedule</Text>
            <Text style={styles.featureDescription}>
              See all upcoming games, locations, and times. Never miss a game!
            </Text>
          </div>
        </div>

        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <span style={styles.iconText}>&#128202;</span>
          </div>
          <div style={styles.featureContent}>
            <Text style={styles.featureTitle}>Check Your Stats</Text>
            <Text style={styles.featureDescription}>
              Track your batting average, pitching stats, and see where you rank.
            </Text>
          </div>
        </div>

        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <span style={styles.iconText}>&#128276;</span>
          </div>
          <div style={styles.featureContent}>
            <Text style={styles.featureTitle}>Get Game Reminders</Text>
            <Text style={styles.featureDescription}>
              Receive notifications for upcoming games and league announcements.
            </Text>
          </div>
        </div>

        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <span style={styles.iconText}>&#128172;</span>
          </div>
          <div style={styles.featureContent}>
            <Text style={styles.featureTitle}>Team Communication</Text>
            <Text style={styles.featureDescription}>
              Stay in touch with your teammates through team chat.
            </Text>
          </div>
        </div>
      </Section>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={dashboard}>
          Go to Dashboard
        </EmailButton>
      </div>

      <EmailParagraph>
        If you have any questions or need help getting started, don't hesitate
        to reach out. You can contact the league at{' '}
        <a href="mailto:info@cnebl.com" style={styles.link}>info@cnebl.com</a>.
      </EmailParagraph>

      <EmailParagraph>
        Play ball!
        <br />
        <strong style={{ color: '#1B3A5F' }}>The CNEBL Team</strong>
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  featuresSection: {
    margin: '24px 0',
  },
  featureItem: {
    display: 'flex',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#1B3A5F',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
    flexShrink: 0,
  },
  iconText: {
    fontSize: '20px',
    lineHeight: '40px',
    textAlign: 'center' as const,
    width: '40px',
    display: 'block',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#1B3A5F',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  featureDescription: {
    color: '#6B7280',
    fontSize: '14px',
    margin: '0',
    lineHeight: '1.4',
  },
  link: {
    color: '#8B4513',
    textDecoration: 'none',
  },
};

export default WelcomeTemplate;
