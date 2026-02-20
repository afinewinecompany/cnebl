/**
 * useChannelMessages Hook
 *
 * Manages channel-specific message fetching, sending, and real-time updates.
 * Uses polling for updates (WebSocket can be added in future).
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChannelType } from '@/types/database.types';
import type { MessageResponse, MessagesListResponse } from '@/lib/api/schemas/messages';
import { useChannelStore } from '@/stores/channelStore';

// =============================================================================
// Types
// =============================================================================

interface UseChannelMessagesOptions {
  teamId: string;
  channel: ChannelType;
  initialMessages?: MessageResponse[];
  pollInterval?: number; // Default 5000ms
  enabled?: boolean;
}

interface UseChannelMessagesReturn {
  messages: MessageResponse[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  hasMore: boolean;
  totalPinned: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds
const API_BASE = '/api/teams';

// =============================================================================
// Hook
// =============================================================================

export function useChannelMessages(
  options: UseChannelMessagesOptions
): UseChannelMessagesReturn {
  const {
    teamId,
    channel,
    initialMessages = [],
    pollInterval = DEFAULT_POLL_INTERVAL,
    enabled = true,
  } = options;

  // State
  const [messages, setMessages] = useState<MessageResponse[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(initialMessages.length === 0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalPinned, setTotalPinned] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);

  // Refs for polling
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Store actions
  const markChannelRead = useChannelStore((state) => state.markChannelRead);
  const incrementUnread = useChannelStore((state) => state.incrementUnread);

  /**
   * Fetch messages from the API
   */
  const fetchMessages = useCallback(
    async (fetchCursor?: string, direction: 'older' | 'newer' = 'older') => {
      try {
        const params = new URLSearchParams({
          channel,
          direction,
        });
        if (fetchCursor) {
          params.set('cursor', fetchCursor);
        }

        const response = await fetch(
          `${API_BASE}/${teamId}/messages?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch messages');
        }

        return result.data as MessagesListResponse;
      } catch (err) {
        throw err;
      }
    },
    [teamId, channel]
  );

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    if (!enabled || initialMessages.length > 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadInitial = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchMessages();

        if (!cancelled) {
          setMessages(data.messages);
          setHasMore(data.hasMore);
          setTotalPinned(data.totalPinned);
          setCursor(data.cursor.next);
          markChannelRead(teamId, channel);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [teamId, channel, enabled, fetchMessages, initialMessages.length, markChannelRead]);

  /**
   * Poll for new messages
   */
  useEffect(() => {
    if (!enabled || isLoading) return;

    const poll = async () => {
      // Don't poll if page is hidden
      if (!isVisibleRef.current) return;

      try {
        // Get messages newer than the first message
        const newestMessage = messages[0];
        if (!newestMessage) return;

        const data = await fetchMessages(newestMessage.id, 'newer');

        if (data.messages.length > 0) {
          // Prepend new messages (deduplicate)
          const existingIds = new Set(messages.map((m) => m.id));
          const newMessages = data.messages.filter(
            (m) => !existingIds.has(m.id)
          );

          if (newMessages.length > 0) {
            setMessages((prev) => [...newMessages, ...prev]);
            setTotalPinned(data.totalPinned);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Start polling
    pollTimeoutRef.current = setInterval(poll, pollInterval);

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, [enabled, isLoading, messages, pollInterval, fetchMessages]);

  /**
   * Handle page visibility for polling
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Send a new message
   */
  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      setIsSending(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/${teamId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            channel,
            replyToId: replyToId ?? null,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error?.message || 'Failed to send message');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to send message');
        }

        // Add the new message to the top
        setMessages((prev) => [result.data, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [teamId, channel]
  );

  /**
   * Load more (older) messages
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !cursor) return;

    setIsLoading(true);

    try {
      const data = await fetchMessages(cursor, 'older');

      // Deduplicate and append
      const existingIds = new Set(messages.map((m) => m.id));
      const newMessages = data.messages.filter((m) => !existingIds.has(m.id));

      setMessages((prev) => [...prev, ...newMessages]);
      setHasMore(data.hasMore);
      setCursor(data.cursor.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, cursor, fetchMessages, messages]);

  /**
   * Refresh messages
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMessages();

      setMessages(data.messages);
      setHasMore(data.hasMore);
      setTotalPinned(data.totalPinned);
      setCursor(data.cursor.next);
      markChannelRead(teamId, channel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh messages');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages, markChannelRead, teamId, channel]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    loadMore,
    refresh,
    hasMore,
    totalPinned,
  };
}
