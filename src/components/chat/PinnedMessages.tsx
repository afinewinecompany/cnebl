"use client";

/**
 * PinnedMessages Component
 *
 * Collapsible banner displaying pinned messages for quick reference.
 * Shows at the top of the chat container.
 *
 * @example
 * <PinnedMessages
 *   messages={pinnedMessages}
 *   onMessageClick={(msg) => scrollToMessage(msg.id)}
 * />
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pin, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import type { MessageWithAuthor } from "./types";

interface PinnedMessagesProps {
  /** Array of pinned messages */
  messages: MessageWithAuthor[];
  /** Callback when a pinned message is clicked */
  onMessageClick?: (message: MessageWithAuthor) => void;
  /** Whether the banner is expanded by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Truncate message content for preview
 */
function truncateContent(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PinnedMessages({
  messages,
  onMessageClick,
  defaultExpanded = false,
  className,
}: PinnedMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Don't render if no pinned messages
  if (messages.length === 0) return null;

  return (
    <div
      className={cn(
        "border-b-2 border-gold/30 bg-gold/10",
        className
      )}
    >
      {/* Header / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-2.5",
          "transition-colors hover:bg-gold/15",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
        )}
        aria-expanded={isExpanded}
        aria-controls="pinned-messages-content"
      >
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-gold-dark" aria-hidden="true" />
          <span className="font-headline text-sm font-semibold uppercase tracking-wide text-navy">
            Pinned Messages
          </span>
          <Badge variant="gold" size="sm">
            {messages.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-charcoal-light" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-charcoal-light" aria-hidden="true" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="pinned-messages-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto px-4 pb-3">
              <ul className="space-y-2" role="list" aria-label="Pinned messages">
                {messages.map((message) => (
                  <li key={message.id}>
                    <button
                      onClick={() => onMessageClick?.(message)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg bg-chalk/50 p-3 text-left",
                        "transition-all hover:bg-chalk hover:shadow-sm",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-leather"
                      )}
                    >
                      {/* Author avatar */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leather text-cream font-headline text-xs font-bold"
                        aria-hidden="true"
                      >
                        {message.author.avatarUrl ? (
                          <img
                            src={message.author.avatarUrl}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          message.author.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        )}
                      </div>

                      {/* Message content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-headline text-sm font-semibold text-navy">
                            {message.author.name}
                          </span>
                          <span className="text-xs text-charcoal-light">
                            {formatRelativeTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 font-body text-sm text-charcoal">
                          {message.isDeleted
                            ? "[Message deleted]"
                            : truncateContent(message.content)}
                        </p>
                      </div>

                      {/* Jump to indicator */}
                      <MessageSquare
                        className="h-4 w-4 shrink-0 text-charcoal-light"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PinnedMessages;
