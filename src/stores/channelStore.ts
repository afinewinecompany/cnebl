/**
 * Channel State Store
 *
 * Manages channel state including active channel selection,
 * unread counts, and last read timestamps.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChannelType } from '@/types/database.types';

// =============================================================================
// Types
// =============================================================================

interface ChannelState {
  /**
   * Active channel per team (persisted)
   * { [teamId]: channelType }
   */
  activeChannel: Record<string, ChannelType>;

  /**
   * Unread message counts per team per channel
   * { [teamId]: { important: n, general: n, substitutes: n } }
   */
  unreadCounts: Record<string, Record<ChannelType, number>>;

  /**
   * Last read timestamp per team per channel (ISO string, persisted)
   * Used to calculate unread counts on page load
   */
  lastReadTimestamps: Record<string, Record<ChannelType, string>>;

  // Actions
  setActiveChannel: (teamId: string, channel: ChannelType) => void;
  markChannelRead: (teamId: string, channel: ChannelType) => void;
  incrementUnread: (teamId: string, channel: ChannelType) => void;
  setUnreadCounts: (teamId: string, counts: Record<ChannelType, number>) => void;
  resetTeamState: (teamId: string) => void;
  getActiveChannel: (teamId: string) => ChannelType;
  getTotalUnread: (teamId: string) => number;
}

// =============================================================================
// Default values
// =============================================================================

const DEFAULT_CHANNEL: ChannelType = 'general';

const DEFAULT_UNREAD_COUNTS: Record<ChannelType, number> = {
  important: 0,
  general: 0,
  substitutes: 0,
};

// =============================================================================
// Store
// =============================================================================

export const useChannelStore = create<ChannelState>()(
  persist(
    (set, get) => ({
      activeChannel: {},
      unreadCounts: {},
      lastReadTimestamps: {},

      /**
       * Set the active channel for a team
       */
      setActiveChannel: (teamId: string, channel: ChannelType) =>
        set((state) => ({
          activeChannel: { ...state.activeChannel, [teamId]: channel },
        })),

      /**
       * Mark a channel as read (clears unread count and updates timestamp)
       */
      markChannelRead: (teamId: string, channel: ChannelType) =>
        set((state) => ({
          lastReadTimestamps: {
            ...state.lastReadTimestamps,
            [teamId]: {
              ...(state.lastReadTimestamps[teamId] ?? {}),
              [channel]: new Date().toISOString(),
            },
          },
          unreadCounts: {
            ...state.unreadCounts,
            [teamId]: {
              ...(state.unreadCounts[teamId] ?? DEFAULT_UNREAD_COUNTS),
              [channel]: 0,
            },
          },
        })),

      /**
       * Increment unread count for a channel (used when new message arrives)
       */
      incrementUnread: (teamId: string, channel: ChannelType) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [teamId]: {
              ...(state.unreadCounts[teamId] ?? DEFAULT_UNREAD_COUNTS),
              [channel]:
                (state.unreadCounts[teamId]?.[channel] ?? 0) + 1,
            },
          },
        })),

      /**
       * Set all unread counts for a team (used on initial load)
       */
      setUnreadCounts: (teamId: string, counts: Record<ChannelType, number>) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [teamId]: counts },
        })),

      /**
       * Reset all state for a team
       */
      resetTeamState: (teamId: string) =>
        set((state) => {
          const { [teamId]: _active, ...restActive } = state.activeChannel;
          const { [teamId]: _unread, ...restUnread } = state.unreadCounts;
          const { [teamId]: _timestamps, ...restTimestamps } =
            state.lastReadTimestamps;

          return {
            activeChannel: restActive,
            unreadCounts: restUnread,
            lastReadTimestamps: restTimestamps,
          };
        }),

      /**
       * Get active channel for a team (with fallback to default)
       */
      getActiveChannel: (teamId: string): ChannelType => {
        return get().activeChannel[teamId] ?? DEFAULT_CHANNEL;
      },

      /**
       * Get total unread count for a team (sum of all channels)
       */
      getTotalUnread: (teamId: string): number => {
        const counts = get().unreadCounts[teamId];
        if (!counts) return 0;
        return Object.values(counts).reduce((sum, count) => sum + count, 0);
      },
    }),
    {
      name: 'cnebl-channels',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        activeChannel: state.activeChannel,
        lastReadTimestamps: state.lastReadTimestamps,
      }),
    }
  )
);

// =============================================================================
// Selectors (for performance optimization)
// =============================================================================

/**
 * Select unread counts for a specific team
 */
export const selectTeamUnreadCounts = (teamId: string) => (state: ChannelState) =>
  state.unreadCounts[teamId] ?? DEFAULT_UNREAD_COUNTS;

/**
 * Select active channel for a specific team
 */
export const selectActiveChannel = (teamId: string) => (state: ChannelState) =>
  state.activeChannel[teamId] ?? DEFAULT_CHANNEL;

/**
 * Select total unread for a specific team
 */
export const selectTotalUnread = (teamId: string) => (state: ChannelState) => {
  const counts = state.unreadCounts[teamId];
  if (!counts) return 0;
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
};
