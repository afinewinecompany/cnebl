'use client';

import * as React from 'react';
import { AnnouncementCard } from './AnnouncementCard';
import { StaggeredList, StaggeredItem } from '@/components/animations';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types';
import { Megaphone } from 'lucide-react';

/**
 * Extended announcement with author info for display
 */
interface AnnouncementWithAuthor extends Announcement {
  authorName?: string;
}

interface AnnouncementListProps {
  /** Array of announcements to display */
  announcements: AnnouncementWithAuthor[];
  /** Handler when an announcement is clicked */
  onAnnouncementClick?: (announcement: Announcement) => void;
  /** Whether to show expired announcements */
  showExpired?: boolean;
  /** Maximum content length for card previews */
  maxContentLength?: number;
  /** Title for the list section */
  title?: string;
  /** Show empty state when no announcements */
  showEmptyState?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sort announcements: pinned first, then by priority (desc), then by date (newest first)
 */
function sortAnnouncements(announcements: AnnouncementWithAuthor[]): AnnouncementWithAuthor[] {
  return [...announcements].sort((a, b) => {
    // Pinned first
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    // Then by priority (higher = more important)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Then by date (newest first)
    const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt);
    const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filter out unpublished and optionally expired announcements
 */
function filterAnnouncements(
  announcements: AnnouncementWithAuthor[],
  showExpired: boolean
): AnnouncementWithAuthor[] {
  const now = new Date();
  return announcements.filter((announcement) => {
    // Must be published
    if (!announcement.isPublished) return false;
    // Check expiration if not showing expired
    if (!showExpired && announcement.expiresAt) {
      return new Date(announcement.expiresAt) >= now;
    }
    return true;
  });
}

/**
 * AnnouncementList Component
 *
 * Displays a list of announcements with proper sorting (pinned first, then by date).
 * Includes staggered animations and empty state.
 *
 * @example
 * <AnnouncementList
 *   announcements={announcements}
 *   onAnnouncementClick={(a) => openModal(a)}
 *   title="League Announcements"
 * />
 */
export function AnnouncementList({
  announcements,
  onAnnouncementClick,
  showExpired = false,
  maxContentLength = 200,
  title,
  showEmptyState = true,
  className,
}: AnnouncementListProps) {
  // Filter and sort announcements
  const filteredAnnouncements = React.useMemo(
    () => filterAnnouncements(announcements, showExpired),
    [announcements, showExpired]
  );

  const sortedAnnouncements = React.useMemo(
    () => sortAnnouncements(filteredAnnouncements),
    [filteredAnnouncements]
  );

  // Separate pinned and regular announcements for visual grouping
  const pinnedAnnouncements = sortedAnnouncements.filter((a) => a.isPinned);
  const regularAnnouncements = sortedAnnouncements.filter((a) => !a.isPinned);

  if (sortedAnnouncements.length === 0 && showEmptyState) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream mb-4">
          <Megaphone className="w-8 h-8 text-charcoal-light" aria-hidden="true" />
        </div>
        <h3 className="font-headline text-lg text-navy mb-2">No Announcements</h3>
        <p className="text-charcoal-light max-w-md mx-auto">
          There are no announcements at this time. Check back later for updates from the league.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h2 className="font-headline text-2xl uppercase tracking-wide text-navy mb-6">
          {title}
        </h2>
      )}

      {/* Pinned Announcements Section */}
      {pinnedAnnouncements.length > 0 && (
        <div className="mb-6">
          <h3 className="font-headline text-sm uppercase tracking-wider text-charcoal-light mb-3 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-navy" aria-hidden="true" />
            Pinned
          </h3>
          <StaggeredList className="space-y-4" staggerDelay={0.08}>
            {pinnedAnnouncements.map((announcement, index) => (
              <StaggeredItem key={announcement.id} index={index}>
                <AnnouncementCard
                  announcement={announcement}
                  authorName={announcement.authorName}
                  onClick={
                    onAnnouncementClick
                      ? () => onAnnouncementClick(announcement)
                      : undefined
                  }
                  maxContentLength={maxContentLength}
                />
              </StaggeredItem>
            ))}
          </StaggeredList>
        </div>
      )}

      {/* Regular Announcements Section */}
      {regularAnnouncements.length > 0 && (
        <div>
          {pinnedAnnouncements.length > 0 && (
            <h3 className="font-headline text-sm uppercase tracking-wider text-charcoal-light mb-3 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-navy" aria-hidden="true" />
              Recent
            </h3>
          )}
          <StaggeredList className="space-y-4" staggerDelay={0.06}>
            {regularAnnouncements.map((announcement, index) => (
              <StaggeredItem key={announcement.id} index={index}>
                <AnnouncementCard
                  announcement={announcement}
                  authorName={announcement.authorName}
                  onClick={
                    onAnnouncementClick
                      ? () => onAnnouncementClick(announcement)
                      : undefined
                  }
                  maxContentLength={maxContentLength}
                />
              </StaggeredItem>
            ))}
          </StaggeredList>
        </div>
      )}
    </div>
  );
}
