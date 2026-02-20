"use client";

/**
 * ChatContainer Component
 *
 * Main wrapper for the team chat feature. Combines header, pinned messages,
 * message list, and input into a cohesive chat interface.
 *
 * @example
 * <ChatContainer
 *   teamName="Rays"
 *   teamColor="#1B3A5F"
 *   messages={messages}
 *   currentUserId={user.id}
 *   onSendMessage={handleSend}
 * />
 */

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Settings, MoreVertical } from "lucide-react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { PinnedMessages } from "./PinnedMessages";
import type { MessageWithAuthor } from "./types";

interface ChatContainerProps {
  /** Team name for header display */
  teamName: string;
  /** Team primary color for header accent */
  teamColor?: string;
  /** Array of all messages */
  messages: MessageWithAuthor[];
  /** Current user ID */
  currentUserId: string;
  /** Current user role */
  currentUserRole?: "player" | "manager" | "admin" | "commissioner";
  /** Number of online team members (optional) */
  onlineCount?: number;
  /** Callback when user sends a message (optional if posting is disabled) */
  onSendMessage?: (content: string, replyToId?: string) => void;
  /** Callback when user pins/unpins a message */
  onPinMessage?: (message: MessageWithAuthor) => void;
  /** Callback when user edits a message */
  onEditMessage?: (message: MessageWithAuthor, newContent: string) => void;
  /** Callback when user deletes a message */
  onDeleteMessage?: (message: MessageWithAuthor) => void;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
  /** Callback when members button is clicked */
  onMembersClick?: () => void;
  /** Whether messages are loading */
  isLoading?: boolean;
  /** Whether a message is being sent */
  isSending?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ChatContainer({
  teamName,
  teamColor = "#1B3A5F",
  messages,
  currentUserId,
  currentUserRole = "player",
  onlineCount,
  onSendMessage,
  onPinMessage,
  onEditMessage,
  onDeleteMessage,
  onSettingsClick,
  onMembersClick,
  isLoading = false,
  isSending = false,
  className,
}: ChatContainerProps) {
  const [replyingTo, setReplyingTo] = useState<MessageWithAuthor | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageWithAuthor | null>(null);

  // Determine if current user can pin messages (managers and above)
  const canPin = ["manager", "admin", "commissioner"].includes(currentUserRole);

  // Filter pinned messages
  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.isPinned && !m.isDeleted);
  }, [messages]);

  // Handle message send
  const handleSend = useCallback(
    (content: string, replyToId?: string) => {
      onSendMessage?.(content, replyToId);
      setReplyingTo(null);
    },
    [onSendMessage]
  );

  // Handle reply click
  const handleReply = useCallback((message: MessageWithAuthor) => {
    setReplyingTo(message);
    setEditingMessage(null);
  }, []);

  // Handle pin click
  const handlePin = useCallback(
    (message: MessageWithAuthor) => {
      onPinMessage?.(message);
    },
    [onPinMessage]
  );

  // Handle edit click
  const handleEdit = useCallback((message: MessageWithAuthor) => {
    setEditingMessage(message);
    setReplyingTo(null);
  }, []);

  // Handle delete click
  const handleDelete = useCallback(
    (message: MessageWithAuthor) => {
      // Could show confirmation dialog here
      onDeleteMessage?.(message);
    },
    [onDeleteMessage]
  );

  // Handle pinned message click (scroll to message)
  const handlePinnedMessageClick = useCallback((message: MessageWithAuthor) => {
    // Find and scroll to the message element
    const element = document.getElementById(`message-${message.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add highlight effect
      element.classList.add("bg-gold/20");
      setTimeout(() => {
        element.classList.remove("bg-gold/20");
      }, 2000);
    }
  }, []);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-cream-dark bg-cream shadow-card",
        className
      )}
    >
      {/* Header */}
      <header
        className="relative shrink-0 border-b-2 border-cream-dark bg-ivory px-4 py-3"
        style={{ borderTopColor: teamColor }}
      >
        {/* Team color accent bar */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: teamColor }}
          aria-hidden="true"
        />

        <div className="flex items-center justify-between">
          {/* Team info */}
          <div className="flex items-center gap-3">
            {/* Team logo placeholder */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
              style={{ backgroundColor: teamColor }}
              aria-hidden="true"
            >
              <span className="font-headline text-sm font-bold text-chalk">
                {teamName.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div>
              <h2 className="font-headline text-lg font-semibold uppercase tracking-wide text-navy">
                {teamName} Chat
              </h2>
              {onlineCount !== undefined && (
                <div className="flex items-center gap-1.5 text-xs text-charcoal-light">
                  <span
                    className="h-2 w-2 rounded-full bg-field"
                    aria-hidden="true"
                  />
                  <span>{onlineCount} online</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onMembersClick && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onMembersClick}
                aria-label="View team members"
                className="text-charcoal-light hover:text-navy"
              >
                <Users className="h-5 w-5" />
              </Button>
            )}
            {onSettingsClick && canPin && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSettingsClick}
                aria-label="Chat settings"
                className="text-charcoal-light hover:text-navy"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Pinned messages banner */}
      <PinnedMessages
        messages={pinnedMessages}
        onMessageClick={handlePinnedMessageClick}
      />

      {/* Message list */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onReply={handleReply}
        onPin={handlePin}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canPin={canPin}
        isLoading={isLoading}
        className="flex-1"
      />

      {/* Message input (only show if onSendMessage is provided) */}
      {onSendMessage && (
        <MessageInput
          onSend={handleSend}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          isSending={isSending}
          maxLength={500}
          placeholder={`Message ${teamName}...`}
        />
      )}
    </div>
  );
}

export default ChatContainer;
