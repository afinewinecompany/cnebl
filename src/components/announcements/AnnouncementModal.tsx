'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types';
import {
  X,
  Pin,
  Clock,
  AlertTriangle,
  Megaphone,
  Calendar,
  User,
} from 'lucide-react';

interface AnnouncementModalProps {
  /** The announcement to display (null to close modal) */
  announcement: Announcement | null;
  /** Author name for display */
  authorName?: string;
  /** Handler to close the modal */
  onClose: () => void;
  /** Additional CSS classes for the modal content */
  className?: string;
}

/**
 * Priority configuration for styling
 */
const priorityConfig = {
  1: {
    headerBg: 'bg-navy',
    headerText: 'text-chalk',
    badgeVariant: 'primary' as const,
    badgeText: null,
    icon: null,
  },
  2: {
    headerBg: 'bg-gold',
    headerText: 'text-charcoal-dark',
    badgeVariant: 'gold' as const,
    badgeText: 'Important',
    icon: Megaphone,
  },
  3: {
    headerBg: 'bg-cardinal',
    headerText: 'text-chalk',
    badgeVariant: 'danger' as const,
    badgeText: 'Urgent',
    icon: AlertTriangle,
  },
} as const;

/**
 * AnnouncementModal Component
 *
 * Full-screen modal for viewing complete announcement details.
 * Includes title, full content, date, author, and priority indicators.
 *
 * @example
 * const [selected, setSelected] = useState<Announcement | null>(null);
 *
 * <AnnouncementModal
 *   announcement={selected}
 *   authorName="John Smith"
 *   onClose={() => setSelected(null)}
 * />
 */
export function AnnouncementModal({
  announcement,
  authorName,
  onClose,
  className,
}: AnnouncementModalProps) {
  const prefersReducedMotion = useReducedMotion();

  // Handle escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (announcement) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [announcement, onClose]);

  // Focus trap ref
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Focus modal on open
  React.useEffect(() => {
    if (announcement && modalRef.current) {
      modalRef.current.focus();
    }
  }, [announcement]);

  if (!announcement) {
    return null;
  }

  const {
    title,
    content,
    isPinned,
    priority,
    publishedAt,
    expiresAt,
    createdAt,
    updatedAt,
  } = announcement;

  // Determine if announcement is new (less than 24 hours old)
  const publishDate = publishedAt ? new Date(publishedAt) : new Date(createdAt);
  const isNew = Date.now() - publishDate.getTime() < 24 * 60 * 60 * 1000;

  // Determine if announcement is expired
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  // Get priority configuration
  const priorityLevel = Math.max(1, Math.min(3, priority)) as 1 | 2 | 3;
  const config = priorityConfig[priorityLevel];
  const PriorityIcon = config.icon;

  // Format dates
  const formattedPublishDate = publishDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedPublishTime = publishDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const wasUpdated = updatedAt !== createdAt;
  const formattedUpdateDate = wasUpdated
    ? new Date(updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <AnimatePresence>
      {announcement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'relative w-full max-w-2xl max-h-[90vh] overflow-hidden',
              'bg-ivory rounded-lg shadow-2xl',
              'flex flex-col',
              isExpired && 'opacity-90',
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-title"
            tabIndex={-1}
          >
            {/* Header */}
            <div className={cn('relative', config.headerBg)}>
              {/* Retro stitch pattern */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 16px)',
                }}
                aria-hidden="true"
              />

              <div className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Priority badge */}
                    {priorityLevel >= 2 && (
                      <div className="flex items-center gap-2 mb-2">
                        {PriorityIcon && (
                          <PriorityIcon
                            className={cn('w-4 h-4', config.headerText)}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={cn(
                            'font-headline text-xs uppercase tracking-wider',
                            config.headerText
                          )}
                        >
                          {config.badgeText}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2
                      id="announcement-title"
                      className={cn(
                        'font-headline text-xl sm:text-2xl uppercase tracking-wide',
                        config.headerText
                      )}
                    >
                      <span className="flex items-start gap-2">
                        {isPinned && (
                          <Pin
                            className="w-5 h-5 shrink-0 mt-1 rotate-45"
                            aria-label="Pinned"
                          />
                        )}
                        <span>{title}</span>
                      </span>
                    </h2>
                  </div>

                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className={cn(
                      'shrink-0 -mr-2 -mt-1',
                      config.headerText,
                      'hover:bg-chalk/20 focus-visible:ring-chalk'
                    )}
                    aria-label="Close announcement"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Meta info bar */}
            <div className="px-6 py-3 bg-cream border-b border-cream-dark">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-charcoal-light">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>{formattedPublishDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>{formattedPublishTime}</span>
                </div>
                {authorName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" aria-hidden="true" />
                    <span>{authorName}</span>
                  </div>
                )}

                {/* Status badges */}
                <div className="flex items-center gap-2 ml-auto">
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
                  {isPinned && (
                    <Badge variant="primary" size="sm">
                      Pinned
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div
                className={cn(
                  'prose prose-charcoal max-w-none',
                  'prose-headings:font-headline prose-headings:text-navy prose-headings:uppercase prose-headings:tracking-wide',
                  'prose-p:text-charcoal prose-p:leading-relaxed',
                  'prose-a:text-navy prose-a:font-medium prose-a:underline-offset-2',
                  isExpired && 'opacity-75'
                )}
              >
                {/* Render content as paragraphs, preserving line breaks */}
                {content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-cream border-t border-cream-dark">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-charcoal-light">
                  {wasUpdated && (
                    <span>Last updated: {formattedUpdateDate}</span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
