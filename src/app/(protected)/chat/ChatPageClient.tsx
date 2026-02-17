'use client';

/**
 * ChatPageClient Component
 *
 * Client-side wrapper for the team chat functionality.
 * Handles:
 * - Sending messages via API
 * - Polling for new messages
 * - Pin/edit/delete actions
 * - Load more history
 * - Toast notifications (inline)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ChevronUp, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageWithAuthor } from '@/components/chat/types';
import type { UserRole } from '@/types/auth';

/**
 * API response types (slightly different from component types)
 */
interface ApiAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

interface ApiMessage {
  id: string;
  teamId: string;
  authorId: string;
  content: string;
  replyToId: string | null;
  isPinned: boolean;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  author: ApiAuthor;
  replyTo?: {
    id: string;
    content: string;
    author: ApiAuthor;
  } | null;
}

/**
 * Transform API response to component format
 * Normalizes author.fullName to author.name
 */
function transformMessage(apiMessage: ApiMessage): MessageWithAuthor {
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
      authorId: '',
      content: apiMessage.replyTo.content,
      replyToId: null,
      isPinned: false,
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      createdAt: '',
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
function transformMessages(apiMessages: ApiMessage[]): MessageWithAuthor[] {
  return apiMessages.map(transformMessage);
}

interface ChatPageClientProps {
  /** Team ID for API calls */
  teamId: string;
  /** Team name for display */
  teamName: string;
  /** Team primary color */
  teamColor: string;
  /** Current user's ID */
  currentUserId: string;
  /** Current user's role */
  currentUserRole: UserRole;
  /** Initial messages from server (API format, will be transformed) */
  initialMessages: ApiMessage[];
  /** Whether there are more messages to load */
  initialHasMore: boolean;
  /** Cursor for pagination */
  initialCursor: string | null;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Polling interval in milliseconds (5 seconds)
const POLL_INTERVAL = 5000;

export function ChatPageClient({
  teamId,
  teamName,
  teamColor,
  currentUserId,
  currentUserRole,
  initialMessages,
  initialHasMore,
  initialCursor,
}: ChatPageClientProps) {
  // Message state - transform initial messages from API format
  const [messages, setMessages] = useState<MessageWithAuthor[]>(() =>
    transformMessages(initialMessages)
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | null>(initialCursor);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Refs for polling
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Show a notification toast
   */
  const showNotification = useCallback((type: Notification['type'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  /**
   * Dismiss a notification
   */
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Fetch messages from API
   */
  const fetchMessages = useCallback(
    async (options?: { cursor?: string; direction?: 'older' | 'newer' }) => {
      try {
        const params = new URLSearchParams();
        if (options?.cursor) {
          params.set('cursor', options.cursor);
        }
        if (options?.direction) {
          params.set('direction', options.direction);
        }
        params.set('limit', '50');

        const response = await fetch(`/api/teams/${teamId}/messages?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch messages');
        }

        const data = await response.json();
        const apiMessages = data.data?.messages || [];

        return {
          messages: transformMessages(apiMessages),
          hasMore: data.data?.hasMore || false,
          cursor: data.data?.cursor?.next || null,
        };
      } catch (err) {
        console.error('[Chat] Fetch error:', err);
        throw err;
      }
    },
    [teamId]
  );

  /**
   * Poll for new messages
   */
  const pollForNewMessages = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // Get the most recent message ID to check for new messages
      const latestMessageId = messages.length > 0 ? messages[messages.length - 1]?.id : null;

      const result = await fetchMessages({
        cursor: latestMessageId || undefined,
        direction: 'newer',
      });

      if (result.messages.length > 0 && isMountedRef.current) {
        // Filter out duplicates and add new messages
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = result.messages.filter(
            (m: MessageWithAuthor) => !existingIds.has(m.id)
          );

          if (newMessages.length > 0) {
            return [...prev, ...newMessages];
          }
          return prev;
        });
      }
    } catch (err) {
      // Silently fail polling - don't show errors for background updates
      console.error('[Chat] Poll error:', err);
    }

    // Schedule next poll
    if (isMountedRef.current) {
      pollTimeoutRef.current = setTimeout(pollForNewMessages, POLL_INTERVAL);
    }
  }, [messages, fetchMessages]);

  /**
   * Start/restart polling
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Start polling after initial delay
    pollTimeoutRef.current = setTimeout(pollForNewMessages, POLL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [pollForNewMessages]);

  /**
   * Load more (older) messages
   */
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !cursor) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await fetchMessages({
        cursor,
        direction: 'older',
      });

      // Prepend older messages
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const olderMessages = result.messages.filter(
          (m: MessageWithAuthor) => !existingIds.has(m.id)
        );
        return [...olderMessages, ...prev];
      });

      setHasMore(result.hasMore);
      setCursor(result.cursor);
    } catch (err) {
      setError('Failed to load more messages');
      showNotification('error', 'Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, cursor, fetchMessages, showNotification]);

  /**
   * Send a new message
   */
  const handleSendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      setIsSending(true);

      try {
        const response = await fetch(`/api/teams/${teamId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            replyToId: replyToId || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        const newMessage = transformMessage(data.data as ApiMessage);

        // Add the new message to the list
        setMessages((prev) => [...prev, newMessage]);

        showNotification('success', 'Message sent');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        showNotification('error', errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [teamId, showNotification]
  );

  /**
   * Pin/unpin a message
   */
  const handlePinMessage = useCallback(
    async (message: MessageWithAuthor) => {
      const action = message.isPinned ? 'unpin' : 'pin';

      try {
        const response = await fetch(`/api/teams/${teamId}/messages/${message.id}/pin`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPinned: !message.isPinned,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to ${action} message`);
        }

        // Update the message in state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, isPinned: !message.isPinned } : m
          )
        );

        showNotification('success', `Message ${action}ned`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to ${action} message`;
        showNotification('error', errorMessage);
      }
    },
    [teamId, showNotification]
  );

  /**
   * Edit a message
   */
  const handleEditMessage = useCallback(
    async (message: MessageWithAuthor, newContent: string) => {
      try {
        const response = await fetch(`/api/teams/${teamId}/messages/${message.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to edit message');
        }

        const data = await response.json();
        const updatedMessage = transformMessage(data.data as ApiMessage);

        // Update the message in state
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? updatedMessage : m))
        );

        showNotification('success', 'Message edited');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
        showNotification('error', errorMessage);
      }
    },
    [teamId, showNotification]
  );

  /**
   * Delete a message
   */
  const handleDeleteMessage = useCallback(
    async (message: MessageWithAuthor) => {
      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this message?')) {
        return;
      }

      try {
        const response = await fetch(`/api/teams/${teamId}/messages/${message.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete message');
        }

        // Mark the message as deleted in state (soft delete)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? { ...m, isDeleted: true, deletedAt: new Date().toISOString() }
              : m
          )
        );

        showNotification('success', 'Message deleted');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
        showNotification('error', errorMessage);
      }
    },
    [teamId, showNotification]
  );

  /**
   * Manual refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchMessages();
      setMessages(result.messages);
      setHasMore(result.hasMore);
      setCursor(result.cursor);
      showNotification('info', 'Chat refreshed');
    } catch (err) {
      setError('Failed to refresh messages');
      showNotification('error', 'Failed to refresh messages');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages, showNotification]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-retro shadow-lg max-w-sm animate-in slide-in-from-right',
              notification.type === 'success' && 'bg-field text-chalk',
              notification.type === 'error' && 'bg-cardinal text-chalk',
              notification.type === 'info' && 'bg-navy text-chalk'
            )}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'info' && <RefreshCw className="w-5 h-5 flex-shrink-0" />}
            <p className="text-sm font-body flex-1">{notification.message}</p>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Load Earlier Messages
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-cardinal/10 border border-cardinal/20 rounded-retro">
          <div className="flex items-center justify-between">
            <p className="text-sm text-cardinal font-body">{error}</p>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <ChatContainer
        teamName={teamName}
        teamColor={teamColor}
        messages={messages}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onSendMessage={handleSendMessage}
        onPinMessage={handlePinMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        isLoading={isLoading}
        isSending={isSending}
        className="flex-1"
      />

      {/* Refresh Button - Floating */}
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className={cn(
          'absolute bottom-4 left-4 z-10',
          'p-3 rounded-full bg-navy text-chalk shadow-lg',
          'hover:bg-navy-light transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label="Refresh messages"
      >
        <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
      </button>
    </div>
  );
}

export default ChatPageClient;
