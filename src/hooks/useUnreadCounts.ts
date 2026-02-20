/**
 * useUnreadCounts Hook
 *
 * Polls for unread message counts across all channels.
 * Updates the channel store with new counts.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChannelType } from '@/types/database.types';
import { useChannelStore } from '@/stores/channelStore';

// =============================================================================
// Types
// =============================================================================

interface UseUnreadCountsOptions {
  teamId: string;
  activeChannel: ChannelType;
  pollInterval?: number; // Default 30000ms (30 seconds)
  enabled?: boolean;
}

interface UseUnreadCountsReturn {
  unreadCounts: Record<ChannelType, number>;
  totalUnread: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

interface ChannelInfo {
  id: ChannelType;
  messageCount: number;
  lastMessageAt: string | null;
  pinnedCount: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds
const API_BASE = '/api/teams';

const DEFAULT_COUNTS: Record<ChannelType, number> = {
  important: 0,
  general: 0,
  substitutes: 0,
};

// =============================================================================
// Hook
// =============================================================================

export function useUnreadCounts(
  options: UseUnreadCountsOptions
): UseUnreadCountsReturn {
  const {
    teamId,
    activeChannel,
    pollInterval = DEFAULT_POLL_INTERVAL,
    enabled = true,
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(true);

  // Store
  const unreadCounts = useChannelStore(
    (state) => state.unreadCounts[teamId] ?? DEFAULT_COUNTS
  );
  const lastReadTimestamps = useChannelStore(
    (state) => state.lastReadTimestamps[teamId] ?? {}
  );
  const setUnreadCounts = useChannelStore((state) => state.setUnreadCounts);

  // Refs
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  /**
   * Calculate total unread across all channels
   */
  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  /**
   * Fetch channel stats from the API
   */
  const fetchChannelStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/${teamId}/channels`);

      if (!response.ok) {
        throw new Error('Failed to fetch channel stats');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch channel stats');
      }

      return result.data.channels as ChannelInfo[];
    } catch (err) {
      console.error('Failed to fetch channel stats:', err);
      return null;
    }
  }, [teamId]);

  /**
   * Calculate unread counts based on last read timestamps
   * This is a simplified version - in production, the API should return
   * unread counts based on user-specific last read timestamps
   */
  const calculateUnreadCounts = useCallback(
    (channels: ChannelInfo[]): Record<ChannelType, number> => {
      const counts: Record<ChannelType, number> = { ...DEFAULT_COUNTS };

      for (const channel of channels) {
        const lastRead = lastReadTimestamps[channel.id];
        const lastMessage = channel.lastMessageAt;

        // If there's a last message and it's after our last read, mark as unread
        // In production, the API should return actual unread counts
        if (lastMessage && lastRead) {
          const lastMessageTime = new Date(lastMessage).getTime();
          const lastReadTime = new Date(lastRead).getTime();

          if (lastMessageTime > lastReadTime) {
            // We don't know the exact count, so just mark as having unread
            // In production, the API should return the actual count
            counts[channel.id] = 1;
          }
        } else if (lastMessage && !lastRead) {
          // Never read this channel, has messages
          counts[channel.id] = channel.messageCount > 0 ? 1 : 0;
        }
      }

      // Active channel is always 0 (user is viewing it)
      counts[activeChannel] = 0;

      return counts;
    },
    [lastReadTimestamps, activeChannel]
  );

  /**
   * Refresh unread counts
   */
  const refresh = useCallback(async () => {
    const channels = await fetchChannelStats();
    if (channels) {
      const counts = calculateUnreadCounts(channels);
      setUnreadCounts(teamId, counts);
    }
  }, [fetchChannelStats, calculateUnreadCounts, setUnreadCounts, teamId]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadInitial = async () => {
      setIsLoading(true);

      const channels = await fetchChannelStats();
      if (!cancelled && channels) {
        const counts = calculateUnreadCounts(channels);
        setUnreadCounts(teamId, counts);
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [teamId, enabled, fetchChannelStats, calculateUnreadCounts, setUnreadCounts]);

  /**
   * Poll for updates
   */
  useEffect(() => {
    if (!enabled || isLoading) return;

    const poll = async () => {
      // Don't poll if page is hidden
      if (!isVisibleRef.current) return;

      await refresh();
    };

    // Start polling
    pollTimeoutRef.current = setInterval(poll, pollInterval);

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, [enabled, isLoading, pollInterval, refresh]);

  /**
   * Handle page visibility
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';

      // Refresh when page becomes visible
      if (isVisibleRef.current) {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  return {
    unreadCounts,
    totalUnread,
    isLoading,
    refresh,
  };
}
