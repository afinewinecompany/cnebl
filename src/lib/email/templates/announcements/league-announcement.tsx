/**
 * League Announcement Email Template
 * Sent when league administrators post announcements to members
 */

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
} from '../base-layout';
import { sanitizeHtmlForEmail } from '@/lib/api/sanitize';

/**
 * Priority levels for announcements
 */
export type AnnouncementPriority = 'urgent' | 'important' | 'normal';

interface LeagueAnnouncementTemplateProps {
  /** Priority level affects visual styling */
  priority: AnnouncementPriority;
  /** Announcement title/headline */
  title: string;
  /** Announcement body content (HTML safe) */
  content: string;
  /** Name of the person who posted the announcement */
  authorName: string;
  /** Date the announcement was posted */
  postedAt: string;
  /** URL to view the announcement in the app */
  viewUrl: string;
}

/**
 * Heritage Diamond theme colors
 */
const colors = {
  cardinal: '#BE1E2D',
  gold: '#C9A227',
  navy: '#1B3A5F',
  white: '#FFFFFF',
  grayDark: '#6B7280',
};

/**
 * League announcement email template component
 * Supports urgent, important, and normal priority levels with distinct styling
 */
export function LeagueAnnouncementTemplate({
  priority,
  title,
  content,
  authorName,
  postedAt,
  viewUrl,
}: LeagueAnnouncementTemplateProps) {
  const priorityLabel = priority === 'urgent' ? 'Urgent' : priority === 'important' ? 'Important' : '';
  const previewText = priorityLabel
    ? `${priorityLabel}: ${title}`
    : `CNEBL Announcement: ${title}`;

  return (
    <BaseLayout preview={previewText}>
      {/* Priority Banner - Urgent */}
      {priority === 'urgent' && (
        <Section style={styles.urgentBanner}>
          <Text style={styles.urgentText}>URGENT ANNOUNCEMENT</Text>
        </Section>
      )}

      {/* Priority Banner - Important */}
      {priority === 'important' && (
        <Section style={styles.importantBanner}>
          <Text style={styles.importantText}>IMPORTANT ANNOUNCEMENT</Text>
        </Section>
      )}

      <EmailHeading>{title}</EmailHeading>

      {/* Announcement Content */}
      <Section style={styles.contentBox}>
        <div
          style={styles.contentText}
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForEmail(content) }}
        />
      </Section>

      {/* View in App Button */}
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={viewUrl}>View in CNEBL</EmailButton>
      </div>

      {/* Author and Date */}
      <Section style={styles.metaSection}>
        <Text style={styles.metaText}>
          Posted by <strong style={{ color: colors.navy }}>{authorName}</strong>
        </Text>
        <Text style={styles.metaDate}>{postedAt}</Text>
      </Section>

      <EmailParagraph>
        You received this email because you are a member of the Coastal New
        England Baseball League. You can manage your notification preferences
        in your account settings.
      </EmailParagraph>
    </BaseLayout>
  );
}

const styles = {
  urgentBanner: {
    backgroundColor: colors.cardinal,
    padding: '12px 20px',
    marginBottom: '24px',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  urgentText: {
    color: colors.white,
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '1px',
    margin: '0',
    textTransform: 'uppercase' as const,
  },
  importantBanner: {
    backgroundColor: colors.gold,
    padding: '12px 20px',
    marginBottom: '24px',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  importantText: {
    color: colors.navy,
    fontSize: '14px',
    fontWeight: '700',
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
  },
  contentText: {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0',
  },
  metaSection: {
    borderTop: '1px solid #E5E7EB',
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

export default LeagueAnnouncementTemplate;
