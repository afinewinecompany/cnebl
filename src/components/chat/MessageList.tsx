"use client";

/**
 * MessageList Component
 *
 * Scrollable container for chat messages with automatic scroll-to-bottom
 * behavior for new messages. Groups messages by date and handles
 * reply threading.
 *
 * @example
 * <MessageList
 *   messages={messages}
 *   currentUserId={user.id}
 *   onReply={setReplyingTo}
 * />
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import type { MessageWithAuthor } from "./types";

interface MessageListProps {
  /** Array of messages to display */
  messages: MessageWithAuthor[];
  /** Current user ID to determine "own" messages */
  currentUserId: string;
  /** Callback when user clicks reply on a message */
  onReply?: (message: MessageWithAuthor) => void;
  /** Callback when user clicks pin/unpin on a message */
  onPin?: (message: MessageWithAuthor) => void;
  /** Callback when user clicks edit on a message */
  onEdit?: (message: MessageWithAuthor) => void;
  /** Callback when user clicks delete on a message */
  onDelete?: (message: MessageWithAuthor) => void;
  /** Whether the current user can pin messages (manager only) */
  canPin?: boolean;
  /** Whether messages are loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format date for date separator
 */
function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Group messages by date for date separators
 */
function groupMessagesByDate(messages: MessageWithAuthor[]) {
  const groups: { date: string; messages: MessageWithAuthor[] }[] = [];

  messages.forEach((message) => {
    const dateKey = new Date(message.createdAt).toDateString();
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && new Date(lastGroup.date).toDateString() === dateKey) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        date: message.createdAt,
        messages: [message],
      });
    }
  });

  return groups;
}

export function MessageList({
  messages,
  currentUserId,
  onReply,
  onPin,
  onEdit,
  onDelete,
  canPin = false,
  isLoading = false,
  className,
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const previousMessageCountRef = useRef(messages.length);

  // Track new messages for entrance animations
  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      const newIds = new Set(
        messages
          .slice(previousMessageCountRef.current)
          .map((m) => m.id)
      );
      setNewMessageIds((prev) => new Set([...prev, ...newIds]));

      // Clear new message IDs after animation completes
      const timer = setTimeout(() => {
        setNewMessageIds(new Set());
      }, 500);

      return () => clearTimeout(timer);
    }
    previousMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom when new messages arrive (if auto-scroll is enabled)
  // Use scrollTop instead of scrollIntoView to avoid scrolling the entire page
  useEffect(() => {
    if (shouldAutoScroll && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, shouldAutoScroll]);

  // Detect if user has scrolled up (disable auto-scroll)
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // Group messages by date
  const messageGroups = groupMessagesByDate(messages);

  // Separate top-level messages from replies
  const getTopLevelMessages = (groupMessages: MessageWithAuthor[]) => {
    return groupMessages.filter((m) => !m.replyToId);
  };

  const getRepliesForMessage = (
    messageId: string,
    allMessages: MessageWithAuthor[]
  ) => {
    return allMessages.filter((m) => m.replyToId === messageId);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4",
        "scrollbar-thin scrollbar-track-cream scrollbar-thumb-leather/30",
        className
      )}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-charcoal-light">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-leather border-t-transparent" />
            <span className="font-body text-sm">Loading messages...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark">
            <svg
              className="h-8 w-8 text-charcoal-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="font-headline text-lg font-semibold text-navy">
            No messages yet
          </h3>
          <p className="mt-1 font-body text-sm text-charcoal-light">
            Be the first to start the conversation!
          </p>
        </div>
      )}

      {/* Message groups by date */}
      <AnimatePresence mode="sync">
        {messageGroups.map((group) => (
          <div key={group.date} className="mb-6">
            {/* Date separator */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-cream-dark" />
              </div>
              <div className="relative px-4 bg-cream">
                <span className="font-headline text-xs font-medium uppercase tracking-wider text-charcoal-light">
                  {formatDateSeparator(group.date)}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {getTopLevelMessages(group.messages).map((message) => {
                const replies = getRepliesForMessage(message.id, messages);
                const isOwn = message.authorId === currentUserId;
                const isNew = newMessageIds.has(message.id);

                return (
                  <div key={message.id}>
                    {/* Parent message */}
                    <MessageBubble
                      message={message}
                      isOwn={isOwn}
                      isNew={isNew}
                      onReply={onReply ? () => onReply(message) : undefined}
                      onPin={canPin && onPin ? () => onPin(message) : undefined}
                      onEdit={isOwn && onEdit ? () => onEdit(message) : undefined}
                      onDelete={isOwn && onDelete ? () => onDelete(message) : undefined}
                    />

                    {/* Thread replies */}
                    {replies.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {replies.map((reply) => {
                          const isReplyOwn = reply.authorId === currentUserId;
                          const isReplyNew = newMessageIds.has(reply.id);

                          return (
                            <MessageBubble
                              key={reply.id}
                              message={reply}
                              isOwn={isReplyOwn}
                              isReply
                              isNew={isReplyNew}
                              onReply={onReply ? () => onReply(reply) : undefined}
                              onPin={canPin && onPin ? () => onPin(reply) : undefined}
                              onEdit={isReplyOwn && onEdit ? () => onEdit(reply) : undefined}
                              onDelete={isReplyOwn && onDelete ? () => onDelete(reply) : undefined}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={bottomRef} aria-hidden="true" />

      {/* Scroll to bottom indicator */}
      {!shouldAutoScroll && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: "smooth",
              });
            }
            setShouldAutoScroll(true);
          }}
          className={cn(
            "fixed bottom-28 sm:bottom-24 right-6 z-10 min-h-[48px]",
            "flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-chalk shadow-lg",
            "transition-transform hover:scale-105 active:scale-95"
          )}
          aria-label="Scroll to latest messages"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <span className="font-headline text-xs font-semibold uppercase tracking-wide">
            New messages
          </span>
        </motion.button>
      )}
    </div>
  );
}

export default MessageList;
