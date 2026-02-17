"use client";

/**
 * MessageBubble Component
 *
 * Individual message display with author info, timestamp, content,
 * edited indicator, and pinned badge. Supports replies with indentation.
 *
 * @example
 * <MessageBubble
 *   message={messageWithAuthor}
 *   isOwn={message.authorId === currentUserId}
 *   onReply={() => handleReply(message)}
 * />
 */

import { forwardRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, Reply, Pencil, Trash2 } from "lucide-react";
import type { MessageWithAuthor } from "./types";

interface MessageBubbleProps {
  /** The message data including author information */
  message: MessageWithAuthor;
  /** Whether this message was sent by the current user */
  isOwn?: boolean;
  /** Whether this is a reply (renders indented) */
  isReply?: boolean;
  /** Callback when user clicks reply */
  onReply?: () => void;
  /** Callback when user clicks pin/unpin */
  onPin?: () => void;
  /** Callback when user clicks edit */
  onEdit?: () => void;
  /** Callback when user clicks delete */
  onDelete?: () => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Whether this message is new (triggers entrance animation) */
  isNew?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format timestamp for display
 * Shows "Today at HH:MM" or "Yesterday at HH:MM" or "MMM D at HH:MM"
 */
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Get initials from name for avatar fallback
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get role badge color
 */
function getRoleBadgeVariant(role?: string): "gold" | "primary" | "default" {
  switch (role) {
    case "manager":
      return "gold";
    case "admin":
    case "commissioner":
      return "primary";
    default:
      return "default";
  }
}

// Animation variants for new messages
const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Inner content shared between animated and static wrappers
 */
interface MessageContentProps {
  message: MessageWithAuthor;
  isOwn: boolean;
  isReply: boolean;
  showActions: boolean;
  onReply?: () => void;
  onPin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function MessageContent({
  message,
  isOwn,
  isReply,
  showActions,
  onReply,
  onPin,
  onEdit,
  onDelete,
}: MessageContentProps) {
  const { author, content, createdAt, isPinned, isEdited, isDeleted, replyTo } = message;

  return (
    <>
      {/* Reply indicator line */}
      {isReply && (
        <div
          className="absolute -left-4 top-4 h-4 w-4 border-l-2 border-t-2 border-cream-dark rounded-tl-lg"
          aria-hidden="true"
        />
      )}

      {/* Reply preview */}
      {replyTo && !isDeleted && (
        <div className="mb-1 pl-12 md:pl-14">
          <div className="flex items-center gap-2 text-xs text-charcoal-light">
            <Reply className="h-3 w-3 rotate-180" aria-hidden="true" />
            <span className="font-medium">{replyTo.author.name}</span>
            <span className="truncate max-w-[200px]">
              {replyTo.isDeleted ? "[Message deleted]" : replyTo.content}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-headline text-sm font-bold",
            isOwn ? "bg-field text-chalk" : "bg-leather text-cream"
          )}
          aria-hidden="true"
        >
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitials(author.name)
          )}
        </div>

        {/* Message content */}
        <div className="min-w-0 flex-1">
          {/* Header: Author name, role badge, timestamp */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "font-headline text-sm font-semibold",
                isOwn ? "text-field-dark" : "text-navy"
              )}
            >
              {author.name}
            </span>

            {author.role && author.role !== "player" && (
              <Badge
                variant={getRoleBadgeVariant(author.role)}
                size="sm"
                className="uppercase"
              >
                {author.role}
              </Badge>
            )}

            {isPinned && (
              <Badge variant="warning" size="sm" className="gap-1">
                <Pin className="h-2.5 w-2.5" aria-hidden="true" />
                Pinned
              </Badge>
            )}

            <span className="text-xs text-charcoal-light">
              {formatMessageTime(createdAt)}
            </span>

            {isEdited && !isDeleted && (
              <span className="text-xs text-charcoal-light italic">(edited)</span>
            )}
          </div>

          {/* Message body */}
          <div
            className={cn(
              "mt-1 font-body text-sm leading-relaxed",
              isDeleted ? "italic text-charcoal-light" : "text-charcoal"
            )}
          >
            {isDeleted ? "[Message deleted]" : content}
          </div>
        </div>

        {/* Action buttons - always visible on mobile, hover-show on desktop */}
        {showActions && !isDeleted && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1 transition-opacity",
              "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
            )}
          >
            {onReply && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onReply}
                aria-label="Reply to message"
                className="h-11 w-11 md:h-8 md:w-8 text-charcoal-light hover:text-navy active:bg-cream-dark rounded-full"
              >
                <Reply className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}

            {onPin && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onPin}
                aria-label={isPinned ? "Unpin message" : "Pin message"}
                className={cn(
                  "h-11 w-11 md:h-8 md:w-8 active:bg-cream-dark rounded-full",
                  isPinned
                    ? "text-gold hover:text-gold-dark"
                    : "text-charcoal-light hover:text-navy"
                )}
              >
                <Pin className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}

            {isOwn && onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onEdit}
                aria-label="Edit message"
                className="h-11 w-11 md:h-8 md:w-8 text-charcoal-light hover:text-navy active:bg-cream-dark rounded-full"
              >
                <Pencil className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}

            {isOwn && onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label="Delete message"
                className="h-11 w-11 md:h-8 md:w-8 text-charcoal-light hover:text-cardinal active:bg-cream-dark rounded-full"
              >
                <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  (
    {
      message,
      isOwn = false,
      isReply = false,
      onReply,
      onPin,
      onEdit,
      onDelete,
      showActions = true,
      isNew = false,
      className,
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = isNew && !prefersReducedMotion;

    const wrapperClassName = cn(
      "group relative transition-colors duration-300",
      isReply && "ml-8 md:ml-12",
      className
    );

    const contentProps: MessageContentProps = {
      message,
      isOwn,
      isReply,
      showActions,
      onReply,
      onPin,
      onEdit,
      onDelete,
    };

    if (shouldAnimate) {
      return (
        <motion.div
          ref={ref}
          id={`message-${message.id}`}
          className={wrapperClassName}
          initial="hidden"
          animate="visible"
          variants={messageVariants}
        >
          <MessageContent {...contentProps} />
        </motion.div>
      );
    }

    return (
      <div ref={ref} id={`message-${message.id}`} className={wrapperClassName}>
        <MessageContent {...contentProps} />
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
