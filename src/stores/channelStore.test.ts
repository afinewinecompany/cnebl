import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useChannelStore,
  selectTeamUnreadCounts,
  selectActiveChannel,
  selectTotalUnread,
} from './channelStore';

describe('channelStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useChannelStore());
    act(() => {
      result.current.resetTeamState('team-1');
      result.current.resetTeamState('team-2');
    });
  });

  describe('setActiveChannel', () => {
    it('sets active channel for a team', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.setActiveChannel('team-1', 'important');
      });

      expect(result.current.getActiveChannel('team-1')).toBe('important');
    });

    it('handles multiple teams independently', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.setActiveChannel('team-1', 'important');
        result.current.setActiveChannel('team-2', 'substitutes');
      });

      expect(result.current.getActiveChannel('team-1')).toBe('important');
      expect(result.current.getActiveChannel('team-2')).toBe('substitutes');
    });
  });

  describe('getActiveChannel', () => {
    it('returns default channel when not set', () => {
      const { result } = renderHook(() => useChannelStore());

      expect(result.current.getActiveChannel('team-1')).toBe('general');
    });

    it('returns set channel', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.setActiveChannel('team-1', 'substitutes');
      });

      expect(result.current.getActiveChannel('team-1')).toBe('substitutes');
    });
  });

  describe('incrementUnread', () => {
    it('increments unread count for channel', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.incrementUnread('team-1', 'general');
      });

      const counts = selectTeamUnreadCounts('team-1')(result.current);
      expect(counts.general).toBe(1);
    });

    it('increments from existing count', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.incrementUnread('team-1', 'general');
        result.current.incrementUnread('team-1', 'general');
        result.current.incrementUnread('team-1', 'general');
      });

      const counts = selectTeamUnreadCounts('team-1')(result.current);
      expect(counts.general).toBe(3);
    });

    it('handles multiple channels independently', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.incrementUnread('team-1', 'general');
        result.current.incrementUnread('team-1', 'general');
        result.current.incrementUnread('team-1', 'important');
      });

      const counts = selectTeamUnreadCounts('team-1')(result.current);
      expect(counts.general).toBe(2);
      expect(counts.important).toBe(1);
      expect(counts.substitutes).toBe(0);
    });
  });

  describe('markChannelRead', () => {
    it('clears unread count for channel', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.incrementUnread('team-1', 'general');
        result.current.incrementUnread('team-1', 'general');
        result.current.markChannelRead('team-1', 'general');
      });

      const counts = selectTeamUnreadCounts('team-1')(result.current);
      expect(counts.general).toBe(0);
    });

    it('updates last read timestamp', () => {
      const { result } = renderHook(() => useChannelStore());

      const before = Date.now();

      act(() => {
        result.current.markChannelRead('team-1', 'general');
      });

      const after = Date.now();
      const timestamp = new Date(
        result.current.lastReadTimestamps['team-1']?.general ?? ''
      ).getTime();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('does not affect other channels', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.incrementUnread('team-1', 'general');
        result.current.incrementUnread('team-1', 'important');
        result.current.markChannelRead('team-1', 'general');
      });

      const counts = selectTeamUnreadCounts('team-1')(result.current);
      expect(counts.general).toBe(0);
      expect(counts.important).toBe(1);
    });
  });

  describe('setUnreadCounts', () => {
    it('sets all counts for a team', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.setUnreadCounts('team-1', {
          important: 5,
          general: 10,
          substitutes: 2,
        });
      });

      const counts = selectTeamUnreadCounts('team-1')(result.current);
      expect(counts.important).toBe(5);
      expect(counts.general).toBe(10);
      expect(counts.substitutes).toBe(2);
    });
  });

  describe('getTotalUnread', () => {
    it('returns sum of all channels', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.setUnreadCounts('team-1', {
          important: 5,
          general: 10,
          substitutes: 2,
        });
      });

      expect(result.current.getTotalUnread('team-1')).toBe(17);
    });

    it('returns 0 for unknown team', () => {
      const { result } = renderHook(() => useChannelStore());

      expect(result.current.getTotalUnread('unknown-team')).toBe(0);
    });
  });

  describe('resetTeamState', () => {
    it('removes all state for a team', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.setActiveChannel('team-1', 'important');
        result.current.incrementUnread('team-1', 'general');
        result.current.markChannelRead('team-1', 'general');
        result.current.resetTeamState('team-1');
      });

      expect(result.current.getActiveChannel('team-1')).toBe('general'); // default
      expect(result.current.getTotalUnread('team-1')).toBe(0);
    });

    it('does not affect other teams', () => {
      const { result } = renderHook(() => useChannelStore());

      act(() => {
        result.current.setActiveChannel('team-1', 'important');
        result.current.setActiveChannel('team-2', 'substitutes');
        result.current.resetTeamState('team-1');
      });

      expect(result.current.getActiveChannel('team-1')).toBe('general');
      expect(result.current.getActiveChannel('team-2')).toBe('substitutes');
    });
  });

  describe('selectors', () => {
    it('selectTeamUnreadCounts returns default for unknown team', () => {
      const { result } = renderHook(() => useChannelStore());

      const counts = selectTeamUnreadCounts('unknown')(result.current);

      expect(counts).toEqual({
        important: 0,
        general: 0,
        substitutes: 0,
      });
    });

    it('selectActiveChannel returns default for unknown team', () => {
      const { result } = renderHook(() => useChannelStore());

      const channel = selectActiveChannel('unknown')(result.current);

      expect(channel).toBe('general');
    });

    it('selectTotalUnread returns 0 for unknown team', () => {
      const { result } = renderHook(() => useChannelStore());

      const total = selectTotalUnread('unknown')(result.current);

      expect(total).toBe(0);
    });
  });
});
