/**
 * useChannelMessages Hook Tests
 *
 * Tests message fetching, sending, and state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChannelMessages } from './useChannelMessages';

// Mock the channel store
const mockMarkChannelRead = vi.fn();
const mockIncrementUnread = vi.fn();

vi.mock('@/stores/channelStore', () => ({
  useChannelStore: vi.fn((selector) => {
    const state = {
      markChannelRead: mockMarkChannelRead,
      incrementUnread: mockIncrementUnread,
    };
    return selector(state);
  }),
}));

// Test data
const mockMessages = [
  {
    id: 'msg-1',
    teamId: 'team-1',
    authorId: 'user-1',
    content: 'Hello team!',
    channel: 'general',
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    createdAt: '2026-02-20T10:00:00.000Z',
    author: { id: 'user-1', fullName: 'John Player', avatarUrl: null },
  },
  {
    id: 'msg-2',
    teamId: 'team-1',
    authorId: 'user-2',
    content: 'Practice at 5pm!',
    channel: 'general',
    isPinned: true,
    isEdited: false,
    isDeleted: false,
    createdAt: '2026-02-20T09:00:00.000Z',
    author: { id: 'user-2', fullName: 'Jane Manager', avatarUrl: null },
  },
];

const mockApiResponse = {
  success: true,
  data: {
    messages: mockMessages,
    cursor: { next: 'msg-3', previous: null },
    hasMore: true,
    totalPinned: 1,
  },
};

describe('useChannelMessages', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });
    global.fetch = fetchMock;

    // Mock document visibility
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial loading state when no initialMessages', () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          enabled: false, // Disable to prevent fetch
        })
      );

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSending).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(true);
      expect(result.current.totalPinned).toBe(0);
    });

    it('uses initialMessages when provided', () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.isLoading).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('skips fetch when disabled', () => {
      renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          enabled: false,
        })
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Send Message', () => {
    it('sends a message with correct payload', async () => {
      const newMessage = {
        id: 'msg-new',
        teamId: 'team-1',
        authorId: 'user-1',
        content: 'New message',
        channel: 'general',
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: '2026-02-20T11:00:00.000Z',
        author: { id: 'user-1', fullName: 'John Player', avatarUrl: null },
      };

      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      // Mock send response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: newMessage }),
      });

      await act(async () => {
        await result.current.sendMessage('New message');
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/teams/team-1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'New message',
          channel: 'general',
          replyToId: null,
        }),
      });

      // New message should be prepended
      expect(result.current.messages[0]).toEqual(newMessage);
      expect(result.current.messages).toHaveLength(3);
    });

    it('sends a reply with replyToId', async () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { ...mockMessages[0], id: 'msg-reply' },
          }),
      });

      await act(async () => {
        await result.current.sendMessage('Reply content', 'msg-1');
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/teams/team-1/messages',
        expect.objectContaining({
          body: JSON.stringify({
            content: 'Reply content',
            channel: 'general',
            replyToId: 'msg-1',
          }),
        })
      );
    });

    it('throws on HTTP error', async () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ error: { message: 'Not authorized' } }),
      });

      let thrownError: Error | null = null;
      try {
        await act(async () => {
          await result.current.sendMessage('Test');
        });
      } catch (err) {
        thrownError = err as Error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.message).toBe('Not authorized');
      // Original messages should remain
      expect(result.current.messages).toHaveLength(2);
    });

    it('throws on API error response', async () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'Rate limited' },
          }),
      });

      let thrownError: Error | null = null;
      try {
        await act(async () => {
          await result.current.sendMessage('Test');
        });
      } catch (err) {
        thrownError = err as Error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.message).toBe('Rate limited');
    });
  });

  describe('Refresh', () => {
    it('refreshes messages and marks channel read', async () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      const refreshedMessages = [
        { ...mockMessages[0], content: 'Updated content' },
        mockMessages[1],
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              messages: refreshedMessages,
              cursor: { next: null, previous: null },
              hasMore: false,
              totalPinned: 2,
            },
          }),
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.messages).toEqual(refreshedMessages);
      expect(result.current.totalPinned).toBe(2);
      expect(result.current.hasMore).toBe(false);
      expect(mockMarkChannelRead).toHaveBeenCalledWith('team-1', 'general');
    });

    it('handles refresh error', async () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.refresh();
      });

      // The hook extracts err.message for Error instances
      expect(result.current.error).toBe('Network error');
      // Original messages should remain
      expect(result.current.messages).toEqual(mockMessages);
    });
  });

  describe('Load More', () => {
    it('does not load more when no cursor', async () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
          enabled: false, // No initial fetch means no cursor
        })
      );

      await act(async () => {
        await result.current.loadMore();
      });

      // Should not have made any fetch calls
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Hook Interface', () => {
    it('exposes all required functions and state', () => {
      const { result } = renderHook(() =>
        useChannelMessages({
          teamId: 'team-1',
          channel: 'general',
          initialMessages: mockMessages,
        })
      );

      // State
      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isSending');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('hasMore');
      expect(result.current).toHaveProperty('totalPinned');

      // Functions
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.loadMore).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });
});
