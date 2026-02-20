/**
 * Team Announcement Email Template
 * Sent when team managers post announcements to their team members
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
} from '../base-layout';

interface TeamAnnouncementTemplateProps {
  /** Player's display name */
  playerName: string;
  /** Name of the team */
  teamName: string;
  /** Manager's display name */
  managerName: string;
  /** Announcement title/headline */
  title: string;
  /** Announcement body content (HTML safe) */
  content: string;
  /** Date the announcement was posted */
  postedAt: string;
  /** URL to view the announcement in the app */
  viewUrl: string;
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
 * Team announcement email template component
 * Team-branded header with announcement content
 */
export function TeamAnnouncementTemplate({
  playerName,
  teamName,
  managerName,
  title,
  content,
  postedAt,
  viewUrl,
}: TeamAnnouncementTemplateProps) {
  const previewText = `${teamName}: ${title}`;

  return (
    <BaseLayout preview={previewText}>
      {/* Team Header Banner */}
      <Section style={styles.teamBanner}>
        <Text style={styles.teamBannerText}>{teamName}</Text>
        <Text style={styles.teamBannerSubtext}>Team Announcement</Text>
      </Section>

      <EmailHeading>{title}</EmailHeading>

      <EmailParagraph>Hi {playerName},</EmailParagraph>

      <EmailParagraph>
        Your team manager has posted an announcement for {teamName}. Please review
        the details below.
      </EmailParagraph>

      {/* Announcement Content Box */}
      <Section style={styles.contentBox}>
        <div
          style={styles.contentText}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Section>

      {/* View in App Button */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={viewUrl}>View in CNEBL</EmailButton>
      </div>

      {/* Author and Date */}
      <Section style={styles.metaSection}>
        <Text style={styles.metaText}>
          Posted by <strong style={{ color: colors.navy }}>{managerName}</strong>
        </Text>
        <Text style={styles.metaDate}>{postedAt}</Text>
      </Section>

      <EmailParagraph>
        You received this email because you are a member of {teamName} in the
        Coastal New England Baseball League. You can manage your notification
        preferences in your account settings.
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
  contentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
    padding: '24px',
    marginTop: '16px',
    marginBottom: '16px',
    border: `1px solid ${colors.grayLight}`,
  },
  contentText: {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0',
  },
  metaSection: {
    borderTop: `1px solid ${colors.grayLight}`,
    paddingTop: '20px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  metaText: {
    color: colors.grayDark,
    fontSize: '14px',
    margin: '0 0 4px 0',
  },
  metaDate: {
    color: colors.grayDark,
    fontSize: '13px',
    margin: '0',
  },
};

export default TeamAnnouncementTemplate;
