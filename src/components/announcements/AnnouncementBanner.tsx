'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types';
import { X, Pin, AlertTriangle, Megaphone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnnouncementBannerProps {
  /** The announcement to display in the banner */
  announcement: Announcement;
  /** Handler when the banner is clicked (to view full announcement) */
  onClick?: () => void;
  /** Handler when the banner is dismissed */
  onDismiss?: () => void;
  /** Whether the banner is dismissible */
  dismissible?: boolean;
  /** Storage key for persisting dismissed state (uses localStorage) */
  storageKey?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get banner styling based on priority level
 */
function getBannerStyles(priority: number) {
  if (priority >= 3) {
    return {
      bg: 'bg-cardinal',
      text: 'text-chalk',
      icon: AlertTriangle,
      iconClass: 'text-chalk',
      hoverBg: 'hover:bg-cardinal-dark',
      buttonVariant: 'ghost' as const,
    };
  }
  if (priority >= 2) {
    return {
      bg: 'bg-gold',
      text: 'text-charcoal-dark',
      icon: Megaphone,
      iconClass: 'text-charcoal-dark',
      hoverBg: 'hover:bg-gold-dark',
      buttonVariant: 'ghost' as const,
    };
  }
  return {
    bg: 'bg-navy',
    text: 'text-chalk',
    icon: Megaphone,
    iconClass: 'text-chalk',
    hoverBg: 'hover:bg-navy-dark',
    buttonVariant: 'ghost' as const,
  };
}

/**
 * AnnouncementBanner Component
 *
 * A top banner for displaying high-priority or pinned announcements.
 * Supports dismissal with optional localStorage persistence.
 *
 * @example
 * <AnnouncementBanner
 *   announcement={urgentAnnouncement}
 *   onClick={() => openModal(urgentAnnouncement)}
 *   onDismiss={() => handleDismiss(urgentAnnouncement.id)}
 *   dismissible
 *   storageKey={`dismissed-${urgentAnnouncement.id}`}
 * />
 */
export function AnnouncementBanner({
  announcement,
  onClick,
  onDismiss,
  dismissible = true,
  storageKey,
  className,
}: AnnouncementBannerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(true);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Check localStorage for dismissed state on mount
  React.useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(storageKey);
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    }
    setIsInitialized(true);
  }, [storageKey]);

  const handleDismiss = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsVisible(false);

      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
      }

      onDismiss?.();
    },
    [storageKey, onDismiss]
  );

  const handleClick = React.useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const { title, isPinned, priority } = announcement;
  const styles = getBannerStyles(priority);
  const Icon = styles.icon;

  // Don't render until we've checked localStorage
  if (!isInitialized) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'relative overflow-hidden',
            styles.bg,
            className
          )}
          role="banner"
          aria-label="Important announcement"
        >
          {/* Retro diagonal stripe pattern (subtle) */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 8px)',
            }}
            aria-hidden="true"
          />

          <div
            className={cn(
              'relative flex items-center justify-between gap-4 px-4 py-3 sm:px-6',
              onClick && 'cursor-pointer',
              onClick && styles.hoverBg
            )}
            onClick={onClick ? handleClick : undefined}
            onKeyDown={onClick ? handleKeyDown : undefined}
            tabIndex={onClick ? 0 : undefined}
            role={onClick ? 'button' : undefined}
          >
            {/* Left side: Icon and content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  'shrink-0 flex items-center justify-center w-8 h-8 rounded-full',
                  priority >= 3 ? 'bg-chalk/20' : priority >= 2 ? 'bg-charcoal/10' : 'bg-chalk/20'
                )}
              >
                {isPinned ? (
                  <Pin className={cn('w-4 h-4 rotate-45', styles.iconClass)} aria-hidden="true" />
                ) : (
                  <Icon className={cn('w-4 h-4', styles.iconClass)} aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-headline text-sm sm:text-base uppercase tracking-wide truncate',
                    styles.text
                  )}
                >
                  {title}
                </p>
              </div>

              {/* Read more indicator */}
              {onClick && (
                <ChevronRight
                  className={cn(
                    'w-5 h-5 shrink-0 hidden sm:block transition-transform group-hover:translate-x-1',
                    styles.iconClass
                  )}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Dismiss button */}
            {dismissible && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDismiss}
                className={cn(
                  'shrink-0',
                  styles.text,
                  'hover:bg-chalk/20 focus-visible:ring-chalk'
                )}
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * AnnouncementBannerStack Component
 *
 * Displays multiple announcement banners stacked.
 * Useful when there are several high-priority announcements.
 */
interface AnnouncementBannerStackProps {
  /** Array of announcements to display as banners */
  announcements: Announcement[];
  /** Handler when a banner is clicked */
  onAnnouncementClick?: (announcement: Announcement) => void;
  /** Handler when a banner is dismissed */
  onDismiss?: (announcementId: string) => void;
  /** Maximum number of banners to show */
  maxBanners?: number;
  /** Additional CSS classes */
  className?: string;
}

export function AnnouncementBannerStack({
  announcements,
  onAnnouncementClick,
  onDismiss,
  maxBanners = 3,
  className,
}: AnnouncementBannerStackProps) {
  // Filter to only pinned or high-priority, non-expired, published announcements
  const eligibleAnnouncements = React.useMemo(() => {
    const now = new Date();
    return announcements
      .filter((a) => {
        if (!a.isPublished) return false;
        if (a.expiresAt && new Date(a.expiresAt) < now) return false;
        return a.isPinned || a.priority >= 2;
      })
      .sort((a, b) => {
        // Sort by priority (desc), then pinned, then date
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt);
        const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, maxBanners);
  }, [announcements, maxBanners]);

  if (eligibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      {eligibleAnnouncements.map((announcement) => (
        <AnnouncementBanner
          key={announcement.id}
          announcement={announcement}
          onClick={
            onAnnouncementClick
              ? () => onAnnouncementClick(announcement)
              : undefined
          }
          onDismiss={
            onDismiss
              ? () => onDismiss(announcement.id)
              : undefined
          }
          storageKey={`cnebl-banner-dismissed-${announcement.id}`}
        />
      ))}
    </div>
  );
}
