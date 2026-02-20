/**
 * Message Queries
 * Query functions for team chat messages
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import type { Message, ChannelType } from '@/types';
import type { MessageResponse, MessagesListResponse } from '@/lib/api/schemas/messages';
import { DEFAULT_CHANNEL } from '@/lib/constants/channels';

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Mock message data for development
 * In production, this will be replaced with actual database queries
 */
const mockMessages: (Message & {
  author: { id: string; fullName: string; avatarUrl: string | null };
})[] = [
  // Important channel messages (manager announcements)
  {
    id: 'msg-imp-001',
    teamId: 'rays',
    authorId: 'user-003',
    channelType: 'important',
    content: 'IMPORTANT: Practice schedule updated for the rest of the season. Check the calendar!',
    replyToId: null,
    isPinned: true,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-17T10:00:00Z',
    author: { id: 'user-003', fullName: 'Coach Williams', avatarUrl: null },
  },
  {
    id: 'msg-imp-002',
    teamId: 'rays',
    authorId: 'user-003',
    channelType: 'important',
    content: 'Game against Pirates rescheduled to Saturday 2pm due to weather.',
    replyToId: null,
    isPinned: true,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T20:00:00Z',
    author: { id: 'user-003', fullName: 'Coach Williams', avatarUrl: null },
  },
  // General channel messages (team chat)
  {
    id: 'msg-001',
    teamId: 'rays',
    authorId: 'user-001',
    channelType: 'general',
    content: 'Great game today everyone! Really proud of how we came together in the 7th inning.',
    replyToId: null,
    isPinned: true,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T18:30:00Z',
    author: { id: 'user-001', fullName: 'Mike Johnson', avatarUrl: null },
  },
  {
    id: 'msg-002',
    teamId: 'rays',
    authorId: 'user-002',
    channelType: 'general',
    content: 'Thanks coach! That double play was clutch.',
    replyToId: 'msg-001',
    isPinned: false,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T18:35:00Z',
    author: { id: 'user-002', fullName: 'Tom Davis', avatarUrl: null },
  },
  {
    id: 'msg-003',
    teamId: 'rays',
    authorId: 'user-003',
    channelType: 'general',
    content: 'Practice moved to 6pm tomorrow due to field conditions.',
    replyToId: null,
    isPinned: true,
    isEdited: true,
    editedAt: '2026-02-16T19:00:00Z',
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T18:45:00Z',
    author: { id: 'user-003', fullName: 'Coach Williams', avatarUrl: null },
  },
  {
    id: 'msg-004',
    teamId: 'rays',
    authorId: 'user-004',
    channelType: 'general',
    content: 'Got it, see you all there!',
    replyToId: 'msg-003',
    isPinned: false,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T18:50:00Z',
    author: { id: 'user-004', fullName: 'Steve Miller', avatarUrl: null },
  },
  {
    id: 'msg-005',
    teamId: 'rays',
    authorId: 'user-001',
    channelType: 'general',
    content: 'Reminder: team dinner at Captain Jacks on Friday at 7pm',
    replyToId: null,
    isPinned: false,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T19:15:00Z',
    author: { id: 'user-001', fullName: 'Mike Johnson', avatarUrl: null },
  },
  // Substitutes channel messages
  {
    id: 'msg-sub-001',
    teamId: 'rays',
    authorId: 'user-002',
    channelType: 'substitutes',
    content: 'Looking for a sub for Saturday\'s game. Need someone who can play outfield.',
    replyToId: null,
    isPinned: false,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T15:00:00Z',
    author: { id: 'user-002', fullName: 'Tom Davis', avatarUrl: null },
  },
  {
    id: 'msg-sub-002',
    teamId: 'rays',
    authorId: 'user-004',
    channelType: 'substitutes',
    content: 'I can cover! What time is the game?',
    replyToId: 'msg-sub-001',
    isPinned: false,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T15:30:00Z',
    author: { id: 'user-004', fullName: 'Steve Miller', avatarUrl: null },
  },
  // Other teams - General channel
  {
    id: 'msg-006',
    teamId: 'pirates',
    authorId: 'user-010',
    channelType: 'general',
    content: 'Nice win today Pirates! Keep the momentum going.',
    replyToId: null,
    isPinned: true,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T17:00:00Z',
    author: { id: 'user-010', fullName: 'Jake Roberts', avatarUrl: null },
  },
  {
    id: 'msg-007',
    teamId: 'athletics',
    authorId: 'user-020',
    channelType: 'general',
    content: 'Equipment check tomorrow before practice. Make sure your gear is ready.',
    replyToId: null,
    isPinned: true,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-16T16:00:00Z',
    author: { id: 'user-020', fullName: 'Chris Anderson', avatarUrl: null },
  },
  // Important channel for other teams
  {
    id: 'msg-imp-003',
    teamId: 'pirates',
    authorId: 'user-010',
    channelType: 'important',
    content: 'Team meeting this Thursday at 7pm. Attendance is mandatory.',
    replyToId: null,
    isPinned: true,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-02-15T14:00:00Z',
    author: { id: 'user-010', fullName: 'Jake Roberts', avatarUrl: null },
  },
];

// Mock team membership data
const teamMemberships: Record<string, string[]> = {
  rays: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'],
  pirates: ['user-010', 'user-011', 'user-012', 'user-013'],
  athletics: ['user-020', 'user-021', 'user-022', 'user-023'],
  mariners: ['user-030', 'user-031', 'user-032'],
  rockies: ['user-040', 'user-041', 'user-042'],
  diamondbacks: ['user-050', 'user-051', 'user-052'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a user is a member of a team
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 5));
  return teamMemberships[teamId]?.includes(userId) ?? false;
}

/**
 * Check if a user is a team manager or admin
 */
export async function isTeamManagerOrAdmin(userId: string, teamId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 5));
  // For mock data, the first user in each team is the manager
  const members = teamMemberships[teamId];
  if (!members || members.length === 0) return false;
  return members[0] === userId;
}

/**
 * Transform a message to the API response format
 */
function transformMessage(
  message: typeof mockMessages[0],
  allMessages: typeof mockMessages
): MessageResponse {
  let replyTo: MessageResponse['replyTo'] = null;

  if (message.replyToId) {
    const replyMessage = allMessages.find((m) => m.id === message.replyToId);
    if (replyMessage && !replyMessage.isDeleted) {
      replyTo = {
        id: replyMessage.id,
        content: replyMessage.content.length > 100
          ? replyMessage.content.substring(0, 100) + '...'
          : replyMessage.content,
        author: replyMessage.author,
      };
    }
  }

  return {
    id: message.id,
    teamId: message.teamId,
    channel: message.channelType,
    authorId: message.authorId,
    content: message.isDeleted ? '[Message deleted]' : message.content,
    replyToId: message.replyToId,
    isPinned: message.isPinned,
    isEdited: message.isEdited,
    editedAt: message.editedAt,
    isDeleted: message.isDeleted,
    deletedAt: message.deletedAt,
    createdAt: message.createdAt,
    author: message.author,
    replyTo,
  };
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get messages for a team with cursor-based pagination
 */
export async function getTeamMessages(
  teamId: string,
  options: {
    channel?: ChannelType;
    cursor?: string;
    limit?: number;
    direction?: 'older' | 'newer';
    pinnedOnly?: boolean;
  }
): Promise<MessagesListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));

  const { channel = DEFAULT_CHANNEL, cursor, limit = 50, direction = 'older', pinnedOnly = false } = options;

  // Filter messages for this team and channel
  let teamMessages = mockMessages.filter(
    (m) => m.teamId === teamId && m.channelType === channel && !m.isDeleted
  );

  // Filter pinned only if requested
  if (pinnedOnly) {
    teamMessages = teamMessages.filter((m) => m.isPinned);
  }

  // Sort by createdAt descending (newest first)
  teamMessages.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate total pinned count for this channel
  const totalPinned = mockMessages.filter(
    (m) => m.teamId === teamId && m.channelType === channel && m.isPinned && !m.isDeleted
  ).length;

  // Apply cursor-based pagination
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = teamMessages.findIndex((m) => m.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = direction === 'older' ? cursorIndex + 1 : Math.max(0, cursorIndex - limit);
    }
  }

  // Get the page of messages
  const pageMessages = teamMessages.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < teamMessages.length;

  // Transform to response format
  const messages = pageMessages.map((m) => transformMessage(m, mockMessages));

  return {
    messages,
    cursor: {
      next: hasMore ? pageMessages[pageMessages.length - 1]?.id ?? null : null,
      previous: startIndex > 0 ? teamMessages[startIndex - 1]?.id ?? null : null,
    },
    hasMore,
    totalPinned,
    channel,
  };
}

/**
 * Get a single message by ID
 */
export async function getMessageById(
  messageId: string
): Promise<MessageResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const message = mockMessages.find((m) => m.id === messageId);
  if (!message) return null;

  return transformMessage(message, mockMessages);
}

/**
 * Create a new message
 */
export async function createMessage(data: {
  teamId: string;
  authorId: string;
  content: string;
  channel?: ChannelType;
  replyToId?: string | null;
}): Promise<MessageResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));

  const newMessage = {
    id: `msg-${Date.now()}`,
    teamId: data.teamId,
    authorId: data.authorId,
    channelType: data.channel ?? DEFAULT_CHANNEL,
    content: data.content,
    replyToId: data.replyToId ?? null,
    isPinned: false,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    author: {
      id: data.authorId,
      fullName: 'Current User', // In production, fetch from database
      avatarUrl: null,
    },
  };

  // Add to mock data (in memory only)
  mockMessages.unshift(newMessage);

  return transformMessage(newMessage, mockMessages);
}

/**
 * Get channel statistics for a team
 */
export async function getTeamChannelStats(teamId: string): Promise<{
  important: { messageCount: number; pinnedCount: number; lastMessageAt: string | null };
  general: { messageCount: number; pinnedCount: number; lastMessageAt: string | null };
  substitutes: { messageCount: number; pinnedCount: number; lastMessageAt: string | null };
}> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const channels: ChannelType[] = ['important', 'general', 'substitutes'];
  const stats: Record<ChannelType, { messageCount: number; pinnedCount: number; lastMessageAt: string | null }> = {
    important: { messageCount: 0, pinnedCount: 0, lastMessageAt: null },
    general: { messageCount: 0, pinnedCount: 0, lastMessageAt: null },
    substitutes: { messageCount: 0, pinnedCount: 0, lastMessageAt: null },
  };

  for (const channel of channels) {
    const channelMessages = mockMessages.filter(
      (m) => m.teamId === teamId && m.channelType === channel && !m.isDeleted
    );

    stats[channel].messageCount = channelMessages.length;
    stats[channel].pinnedCount = channelMessages.filter((m) => m.isPinned).length;

    if (channelMessages.length > 0) {
      const sortedMessages = [...channelMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      stats[channel].lastMessageAt = sortedMessages[0].createdAt;
    }
  }

  return stats;
}

/**
 * Update a message (edit content)
 */
export async function updateMessage(
  messageId: string,
  content: string
): Promise<MessageResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 15));

  const messageIndex = mockMessages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) return null;

  const message = mockMessages[messageIndex];

  // Update the message
  message.content = content;
  message.isEdited = true;
  message.editedAt = new Date().toISOString();

  return transformMessage(message, mockMessages);
}

/**
 * Soft delete a message
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const message = mockMessages.find((m) => m.id === messageId);
  if (!message) return false;

  message.isDeleted = true;
  message.deletedAt = new Date().toISOString();

  return true;
}

/**
 * Toggle pin status of a message
 */
export async function toggleMessagePin(
  messageId: string,
  isPinned: boolean
): Promise<MessageResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const message = mockMessages.find((m) => m.id === messageId);
  if (!message) return null;

  message.isPinned = isPinned;

  return transformMessage(message, mockMessages);
}

/**
 * Get the author ID of a message (for authorization checks)
 */
export async function getMessageAuthorId(messageId: string): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 5));

  const message = mockMessages.find((m) => m.id === messageId);
  return message?.authorId ?? null;
}

/**
 * Get the team ID of a message (for authorization checks)
 */
export async function getMessageTeamId(messageId: string): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 5));

  const message = mockMessages.find((m) => m.id === messageId);
  return message?.teamId ?? null;
}
