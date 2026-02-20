"use client";

/**
 * TeamMessengerContainer Component
 *
 * Main orchestrator for the team chat with channels.
 * Combines channel tabs, chat container, and state management.
 *
 * @example
 * <TeamMessengerContainer
 *   teamId="rays"
 *   teamName="Rays"
 *   teamColor="#1B3A5F"
 *   currentUserId={user.id}
 *   currentUserRole="player"
 *   initialMessages={messages}
 * />
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChannelTabs } from "./channels/ChannelTabs";
import { ChannelHeader } from "./channels/ChannelHeader";
import { ChatContainer } from "./ChatContainer";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ChevronUp, X, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useChannelStore, selectTeamUnreadCounts } from "@/stores/channelStore";
import { canUserPostToChannel, getPostingRestrictionMessage } from "@/lib/constants/channels";
import type { ChannelType } from "@/types/database.types";
import type { UserRole } from "@/types/auth";
import type { MessageWithAuthor } from "./types";
import type { MessageResponse } from "@/lib/api/schemas/messages";

// =============================================================================
// Types
// =============================================================================

interface TeamMessengerContainerProps {
  /** Team ID for API calls */
  teamId: string;
  /** Team name for display */
  teamName: string;
  /** Team primary color */
  teamColor?: string;
  /** Current user's ID */
  currentUserId: string;
  /** Current user's role */
  currentUserRole: UserRole;
  /** Whether user is the team manager */
  isTeamManager?: boolean;
  /** Initial channel to display */
  initialChannel?: ChannelType;
  /** Initial messages for the initial channel */
  initialMessages?: MessageResponse[];
  /** Additional CSS classes */
  className?: string;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_POLL_INTERVAL = 5000;
const UNREAD_POLL_INTERVAL = 30000;

const DEFAULT_UNREAD_COUNTS: Record<ChannelType, number> = {
  important: 0,
  general: 0,
  substitutes: 0,
};

// =============================================================================
// Component
// =============================================================================

export function TeamMessengerContainer({
  teamId,
  teamName,
  teamColor = "#1B3A5F",
  currentUserId,
  currentUserRole,
  isTeamManager = false,
  initialChannel = "general",
  initialMessages = [],
  className,
}: TeamMessengerContainerProps) {
  // ==========================================================================
  // State
  // ==========================================================================

  // Channel state from Zustand store
  const activeChannel = useChannelStore(
    (state) => state.activeChannel[teamId] ?? initialChannel
  );
  const setActiveChannel = useChannelStore((state) => state.setActiveChannel);
  const markChannelRead = useChannelStore((state) => state.markChannelRead);
  const unreadCounts = useChannelStore(selectTeamUnreadCounts(teamId));

  // Messages state per channel
  const [channelMessages, setChannelMessages] = useState<
    Record<ChannelType, MessageWithAuthor[]>
  >(() => ({
    important: [],
    general: initialChannel === "general" ? transformMessages(initialMessages) : [],
    substitutes: initialChannel === "substitutes" ? transformMessages(initialMessages) : [],
  }));

  // Track which channels have been loaded
  const [loadedChannels, setLoadedChannels] = useState<Set<ChannelType>>(
    () => new Set([initialChannel])
  );

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Ref to track pending channel fetch to handle race conditions
  const pendingChannelFetchRef = useRef<ChannelType | null>(null);

  // ==========================================================================
  // Computed
  // ==========================================================================

  // Current channel's messages
  const currentMessages = channelMessages[activeChannel] || [];

  // Check if user can post to current channel
  const canPost = useMemo(
    () => canUserPostToChannel(currentUserRole, isTeamManager, activeChannel),
    [currentUserRole, isTeamManager, activeChannel]
  );

  // Get posting restriction message if applicable
  const postingRestriction = canPost ? null : getPostingRestrictionMessage(activeChannel);

  // ==========================================================================
  // API Functions
  // ==========================================================================

  /**
   * Fetch messages for a channel
   */
  const fetchChannelMessages = useCallback(
    async (channel: ChannelType) => {
      try {
        const response = await fetch(
          `/api/teams/${teamId}/messages?channel=${channel}&limit=50`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || "Failed to fetch messages");
        }

        return transformMessages(result.data.messages);
      } catch (err) {
        console.error(`[Chat] Failed to fetch ${channel} messages:`, err);
        throw err;
      }
    },
    [teamId]
  );

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      setIsSending(true);

      try {
        const response = await fetch(`/api/teams/${teamId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            channel: activeChannel,
            replyToId: replyToId ?? null,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error?.message || "Failed to send message");
        }

        const result = await response.json();
        const newMessage = transformMessage(result.data);

        // Add to channel messages
        setChannelMessages((prev) => ({
          ...prev,
          [activeChannel]: [newMessage, ...prev[activeChannel]],
        }));

        showNotification("success", "Message sent");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to send message";
        showNotification("error", msg);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [teamId, activeChannel]
  );

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * Handle channel change
   */
  const handleChannelChange = useCallback(
    async (channel: ChannelType) => {
      if (channel === activeChannel) return;

      // Update active channel in store
      setActiveChannel(teamId, channel);

      // Load messages if not already loaded
      if (!loadedChannels.has(channel)) {
        setIsLoading(true);
        setError(null);

        // Track this fetch request to handle race conditions when user rapidly switches channels
        pendingChannelFetchRef.current = channel;

        try {
          const messages = await fetchChannelMessages(channel);

          // Only update state if this is still the pending fetch (user hasn't switched away)
          if (pendingChannelFetchRef.current === channel) {
            setChannelMessages((prev) => ({
              ...prev,
              [channel]: messages,
            }));

            setLoadedChannels((prev) => new Set([...prev, channel]));
            pendingChannelFetchRef.current = null;
          }
        } catch (err) {
          // Only show error if this is still the pending fetch
          if (pendingChannelFetchRef.current === channel) {
            setError("Failed to load messages");
            pendingChannelFetchRef.current = null;
          }
        } finally {
          // Only clear loading state if this is still the pending fetch
          if (pendingChannelFetchRef.current === channel || pendingChannelFetchRef.current === null) {
            setIsLoading(false);
          }
        }
      }

      // Mark channel as read
      markChannelRead(teamId, channel);
    },
    [activeChannel, teamId, loadedChannels, fetchChannelMessages, setActiveChannel, markChannelRead]
  );

  /**
   * Handle pin message
   */
  const handlePinMessage = useCallback(
    async (message: MessageWithAuthor) => {
      try {
        const response = await fetch(
          `/api/teams/${teamId}/messages/${message.id}/pin`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPinned: !message.isPinned }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update pin status");
        }

        // Update message in state
        setChannelMessages((prev) => ({
          ...prev,
          [activeChannel]: prev[activeChannel].map((m) =>
            m.id === message.id ? { ...m, isPinned: !message.isPinned } : m
          ),
        }));

        showNotification("success", message.isPinned ? "Message unpinned" : "Message pinned");
      } catch (err) {
        showNotification("error", "Failed to update pin status");
      }
    },
    [teamId, activeChannel]
  );

  /**
   * Handle edit message
   */
  const handleEditMessage = useCallback(
    async (message: MessageWithAuthor, newContent: string) => {
      try {
        const response = await fetch(
          `/api/teams/${teamId}/messages/${message.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: newContent }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to edit message");
        }

        const result = await response.json();
        const updatedMessage = transformMessage(result.data);

        // Update message in state
        setChannelMessages((prev) => ({
          ...prev,
          [activeChannel]: prev[activeChannel].map((m) =>
            m.id === message.id ? updatedMessage : m
          ),
        }));

        showNotification("success", "Message edited");
      } catch (err) {
        showNotification("error", "Failed to edit message");
      }
    },
    [teamId, activeChannel]
  );

  /**
   * Handle delete message
   */
  const handleDeleteMessage = useCallback(
    async (message: MessageWithAuthor) => {
      if (!window.confirm("Are you sure you want to delete this message?")) {
        return;
      }

      try {
        const response = await fetch(
          `/api/teams/${teamId}/messages/${message.id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete message");
        }

        // Soft delete in state
        setChannelMessages((prev) => ({
          ...prev,
          [activeChannel]: prev[activeChannel].map((m) =>
            m.id === message.id
              ? { ...m, isDeleted: true, deletedAt: new Date().toISOString() }
              : m
          ),
        }));

        showNotification("success", "Message deleted");
      } catch (err) {
        showNotification("error", "Failed to delete message");
      }
    },
    [teamId, activeChannel]
  );

  /**
   * Show notification
   */
  const showNotification = useCallback(
    (type: Notification["type"], message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setNotifications((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    []
  );

  /**
   * Dismiss notification
   */
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Mark initial channel as read on mount
  useEffect(() => {
    markChannelRead(teamId, activeChannel);
  }, [teamId, activeChannel, markChannelRead]);

  // Poll for new messages in active channel
  useEffect(() => {
    if (currentMessages.length === 0) return;

    // Capture the channel at effect setup time to avoid race conditions
    const channelToFetch = activeChannel;
    let isCancelled = false;

    const poll = async () => {
      try {
        const messages = await fetchChannelMessages(channelToFetch);

        // Check if the effect was cancelled (channel changed) before updating state
        if (isCancelled) return;

        // Merge new messages - use channelToFetch (captured at setup time)
        // instead of activeChannel to prevent message leakage between channels
        setChannelMessages((prev) => {
          const existingIds = new Set(prev[channelToFetch].map((m) => m.id));
          const newMessages = messages.filter((m) => !existingIds.has(m.id));

          if (newMessages.length > 0) {
            return {
              ...prev,
              [channelToFetch]: [...newMessages, ...prev[channelToFetch]],
            };
          }
          return prev;
        });
      } catch (err) {
        // Silently fail polling
      }
    };

    const interval = setInterval(poll, DEFAULT_POLL_INTERVAL);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activeChannel, currentMessages.length, fetchChannelMessages]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-cream-dark bg-cream shadow-card",
        className
      )}
    >
      {/* Notification Toasts */}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                "flex max-w-sm items-center gap-3 rounded-retro px-4 py-3 shadow-lg",
                notification.type === "success" && "bg-field text-chalk",
                notification.type === "error" && "bg-cardinal text-chalk",
                notification.type === "info" && "bg-navy text-chalk"
              )}
            >
              {notification.type === "success" && (
                <CheckCircle className="h-5 w-5 shrink-0" />
              )}
              {notification.type === "error" && (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              {notification.type === "info" && (
                <RefreshCw className="h-5 w-5 shrink-0" />
              )}
              <p className="flex-1 font-body text-sm">{notification.message}</p>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="rounded p-1 transition-colors hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Channel Header */}
      <ChannelHeader
        channel={activeChannel}
        teamName={teamName}
        canPost={canPost}
      />

      {/* Channel Tabs */}
      <ChannelTabs
        activeChannel={activeChannel}
        unreadCounts={unreadCounts}
        onChange={handleChannelChange}
        disabled={isLoading}
      />

      {/* Chat Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChannel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-navy" />
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                <p className="text-center font-body text-charcoal-light">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => handleChannelChange(activeChannel)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <ChatContainer
                teamName={teamName}
                teamColor={teamColor}
                messages={currentMessages}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onSendMessage={canPost ? sendMessage : undefined}
                onPinMessage={handlePinMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                isLoading={false}
                isSending={isSending}
                hideHeader
                className="flex-1 border-0 shadow-none"
              />
            )}

            {/* Posting restriction message */}
            {postingRestriction && (
              <div className="flex items-center justify-center gap-2 border-t border-cream-dark bg-gray-100 px-4 py-3">
                <Lock className="h-4 w-4 text-charcoal-light" />
                <p className="text-center font-body text-sm italic text-charcoal-light">
                  {postingRestriction}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Transform API message to component format
 */
function transformMessage(apiMessage: MessageResponse): MessageWithAuthor {
  const message: MessageWithAuthor = {
    id: apiMessage.id,
    teamId: apiMessage.teamId,
    authorId: apiMessage.authorId,
    content: apiMessage.content,
    replyToId: apiMessage.replyToId,
    isPinned: apiMessage.isPinned,
    isEdited: apiMessage.isEdited,
    editedAt: apiMessage.editedAt,
    isDeleted: apiMessage.isDeleted,
    deletedAt: apiMessage.deletedAt,
    createdAt: apiMessage.createdAt,
    author: {
      id: apiMessage.author.id,
      name: apiMessage.author.fullName,
      avatarUrl: apiMessage.author.avatarUrl || undefined,
    },
  };

  if (apiMessage.replyTo) {
    message.replyTo = {
      id: apiMessage.replyTo.id,
      teamId: apiMessage.teamId,
      authorId: "",
      content: apiMessage.replyTo.content,
      replyToId: null,
      isPinned: false,
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      createdAt: "",
      author: {
        id: apiMessage.replyTo.author.id,
        name: apiMessage.replyTo.author.fullName,
        avatarUrl: apiMessage.replyTo.author.avatarUrl || undefined,
      },
    };
  }

  return message;
}

/**
 * Transform an array of API messages
 */
function transformMessages(apiMessages: MessageResponse[]): MessageWithAuthor[] {
  return apiMessages.map(transformMessage);
}

export default TeamMessengerContainer;
