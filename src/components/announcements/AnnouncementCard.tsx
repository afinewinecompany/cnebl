'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types';
import { Pin, Clock, AlertTriangle, Megaphone } from 'lucide-react';

/**
 * Priority configuration for visual styling
 * 1 = normal, 2 = important (gold), 3 = urgent (cardinal)
 */
const priorityConfig = {
  1: {
    borderClass: 'border-gray-200',
    badgeVariant: 'default' as const,
    badgeText: null,
    icon: null,
  },
  2: {
    borderClass: 'border-gold border-2',
    badgeVariant: 'gold' as const,
    badgeText: 'Important',
    icon: Megaphone,
  },
  3: {
    borderClass: 'border-cardinal border-2',
    badgeVariant: 'danger' as const,
    badgeText: 'Urgent',
    icon: AlertTriangle,
  },
} as const;

interface AnnouncementCardProps {
  /** The announcement data to display */
  announcement: Announcement;
  /** Author name for display (optional, resolved from authorId) */
  authorName?: string;
  /** Click handler to open full announcement modal */
  onClick?: () => void;
  /** Truncate content after this many characters (0 = no truncation) */
  maxContentLength?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AnnouncementCard Component
 *
 * Displays a single announcement with title, content preview, date, and priority badge.
 * Supports pinned, priority levels, and "NEW" badge for recent announcements.
 *
 * @example
 * <AnnouncementCard
 *   announcement={announcement}
 *   authorName="John Smith"
 *   onClick={() => setSelectedAnnouncement(announcement)}
 * />
 */
export function AnnouncementCard({
  announcement,
  authorName,
  onClick,
  maxContentLength = 200,
  className,
}: AnnouncementCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const {
    title,
    content,
    isPinned,
    priority,
    publishedAt,
    expiresAt,
    createdAt,
  } = announcement;

  // Determine if announcement is new (less than 24 hours old)
  const publishDate = publishedAt ? new Date(publishedAt) : new Date(createdAt);
  const isNew = Date.now() - publishDate.getTime() < 24 * 60 * 60 * 1000;

  // Determine if announcement is expired
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  // Get priority configuration (clamp to valid range)
  const priorityLevel = Math.max(1, Math.min(3, priority)) as 1 | 2 | 3;
  const config = priorityConfig[priorityLevel];

  // Format date for display
  const formattedDate = publishDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: publishDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });

  // Truncate content if needed
  const truncatedContent =
    maxContentLength > 0 && content.length > maxContentLength
      ? `${content.slice(0, maxContentLength).trim()}...`
      : content;

  const PriorityIcon = config.icon;

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={prefersReducedMotion ? {} : { y: -2 }}
      className={cn('group', className)}
    >
      <Card
        variant={onClick ? 'interactive' : 'default'}
        className={cn(
          'overflow-hidden transition-all',
          config.borderClass,
          isExpired && 'opacity-60',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {/* Priority Banner for urgent/important */}
        {priorityLevel >= 2 && (
          <div
            className={cn(
              'py-1.5 px-4 flex items-center justify-center gap-2',
              priorityLevel === 3 ? 'bg-cardinal' : 'bg-gold'
            )}
          >
            {PriorityIcon && (
              <PriorityIcon
                className={cn(
                  'w-4 h-4',
                  priorityLevel === 3 ? 'text-chalk' : 'text-charcoal-dark'
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'font-headline text-xs uppercase tracking-wider',
                priorityLevel === 3 ? 'text-chalk' : 'text-charcoal-dark'
              )}
            >
              {config.badgeText}
            </span>
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {/* Pin indicator */}
              {isPinned && (
                <Pin
                  className="w-4 h-4 text-navy shrink-0 mt-1 rotate-45"
                  aria-label="Pinned announcement"
                />
              )}
              <CardTitle
                className={cn(
                  'line-clamp-2',
                  isExpired && 'text-charcoal-light'
                )}
              >
                {title}
              </CardTitle>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              {isNew && !isExpired && (
                <Badge variant="success" size="sm">
                  NEW
                </Badge>
              )}
              {isExpired && (
                <Badge variant="outline" size="sm">
                  Expired
                </Badge>
              )}
            </div>
          </div>

          {/* Date and author info */}
          <div className="flex items-center gap-2 text-sm text-charcoal-light mt-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{formattedDate}</span>
            {authorName && (
              <>
                <span aria-hidden="true">|</span>
                <span>{authorName}</span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p
            className={cn(
              'text-charcoal leading-relaxed whitespace-pre-line',
              isExpired && 'text-charcoal-light'
            )}
          >
            {truncatedContent}
          </p>

          {/* Read more indicator */}
          {onClick && content.length > maxContentLength && (
            <span className="inline-block mt-2 text-sm font-medium text-navy group-hover:text-leather transition-colors">
              Read more
            </span>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
