/**
 * Message Queries
 * Query functions for team chat messages
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import type { Message, ChannelType } from '@/types';
import type { MessageResponse, MessagesListResponse } from '@/lib/api/schemas/messages';
import { DEFAULT_CHANNEL } from '@/lib/constants/channels';
import { getUserWithAssignment } from './admin-users';

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
 * Supports both mock data slug IDs and database UUIDs
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  // First check mock data (for backwards compatibility)
  if (teamMemberships[teamId]?.includes(userId)) {
    return true;
  }

  // Check database for UUID-based team IDs
  try {
    const { query } = await import('../client');
    const result = await query<{ id: string }>(
      `SELECT p.id FROM players p
       WHERE p.user_id = $1 AND p.team_id = $2 AND p.is_active = true`,
      [userId, teamId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('[Messages] Error checking team membership:', error);
    return false;
  }
}

/**
 * Check if a user is a team manager or admin
 * Supports both mock data slug IDs and database UUIDs
 */
export async function isTeamManagerOrAdmin(userId: string, teamId: string): Promise<boolean> {
  // First check mock data (for backwards compatibility)
  const members = teamMemberships[teamId];
  if (members && members.length > 0 && members[0] === userId) {
    return true;
  }

  // Check database - user is manager if they're the team captain or have manager/admin role
  try {
    const { query } = await import('../client');
    const result = await query<{ is_captain: boolean; role: string }>(
      `SELECT p.is_captain, u.role
       FROM players p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1 AND p.team_id = $2 AND p.is_active = true`,
      [userId, teamId]
    );

    if (result.rows.length === 0) return false;

    const { is_captain, role } = result.rows[0];
    return is_captain || role === 'manager' || role === 'admin' || role === 'commissioner';
  } catch (error) {
    console.error('[Messages] Error checking team manager status:', error);
    return false;
  }
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
 * Supports both mock data (slug IDs) and database (UUID IDs)
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
  const { channel = DEFAULT_CHANNEL, cursor, limit = 50, direction = 'older', pinnedOnly = false } = options;

  // Check if this is a UUID (database team) or slug (mock data)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);

  if (isUUID) {
    // Use database for UUID team IDs
    try {
      const { query } = await import('../client');

      // Build the query with optional cursor
      let queryText = `
        SELECT m.id, m.team_id, m.author_id, m.content, m.reply_to_id,
               m.is_pinned, m.is_edited, m.edited_at, m.is_deleted, m.deleted_at, m.created_at,
               u.full_name as author_name, u.avatar_url as author_avatar
        FROM messages m
        JOIN users u ON u.id = m.author_id
        WHERE m.team_id = $1 AND m.is_deleted = false
      `;
      const params: unknown[] = [teamId];
      let paramIndex = 2;

      if (pinnedOnly) {
        queryText += ` AND m.is_pinned = true`;
      }

      if (cursor) {
        const cursorResult = await query<{ created_at: string }>(
          'SELECT created_at FROM messages WHERE id = $1',
          [cursor]
        );
        if (cursorResult.rows.length > 0) {
          const cursorDate = cursorResult.rows[0].created_at;
          queryText += direction === 'older'
            ? ` AND m.created_at < $${paramIndex}`
            : ` AND m.created_at > $${paramIndex}`;
          params.push(cursorDate);
          paramIndex++;
        }
      }

      queryText += direction === 'older'
        ? ` ORDER BY m.created_at DESC`
        : ` ORDER BY m.created_at ASC`;
      queryText += ` LIMIT $${paramIndex}`;
      params.push(limit + 1); // Fetch one extra to check hasMore

      const result = await query<{
        id: string;
        team_id: string;
        author_id: string;
        content: string;
        reply_to_id: string | null;
        is_pinned: boolean;
        is_edited: boolean;
        edited_at: string | null;
        is_deleted: boolean;
        deleted_at: string | null;
        created_at: string;
        author_name: string;
        author_avatar: string | null;
      }>(queryText, params);

      const hasMore = result.rows.length > limit;
      const rows = hasMore ? result.rows.slice(0, limit) : result.rows;

      // Get pinned count
      const pinnedResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM messages WHERE team_id = $1 AND is_pinned = true AND is_deleted = false',
        [teamId]
      );
      const totalPinned = parseInt(pinnedResult.rows[0]?.count || '0', 10);

      const messages: MessageResponse[] = rows.map((row) => ({
        id: row.id,
        teamId: row.team_id,
        channel: channel, // Database doesn't have channel yet, default to requested
        authorId: row.author_id,
        content: row.content,
        replyToId: row.reply_to_id,
        isPinned: row.is_pinned,
        isEdited: row.is_edited,
        editedAt: row.edited_at,
        isDeleted: row.is_deleted,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        author: {
          id: row.author_id,
          fullName: row.author_name,
          avatarUrl: row.author_avatar,
        },
        replyTo: null, // TODO: fetch reply info if needed
      }));

      return {
        messages,
        cursor: {
          next: hasMore && messages.length > 0 ? messages[messages.length - 1].id : null,
          previous: cursor ? rows[0]?.id ?? null : null,
        },
        hasMore,
        totalPinned,
        channel,
      };
    } catch (error) {
      console.error('[Messages] Error fetching from database:', error);
      // Return empty on error
      return { messages: [], cursor: { next: null, previous: null }, hasMore: false, totalPinned: 0, channel };
    }
  }

  // Fall back to mock data for slug IDs
  await new Promise((resolve) => setTimeout(resolve, 20));

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
 * Stores in database for UUID team IDs, mock data for slug IDs
 */
export async function createMessage(data: {
  teamId: string;
  authorId: string;
  content: string;
  channel?: ChannelType;
  replyToId?: string | null;
}): Promise<MessageResponse> {
  // Check if this is a UUID (database team) or slug (mock data)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.teamId);

  if (isUUID) {
    // Store in database for UUID team IDs
    try {
      const { query } = await import('../client');

      const result = await query<{
        id: string;
        team_id: string;
        author_id: string;
        content: string;
        reply_to_id: string | null;
        is_pinned: boolean;
        is_edited: boolean;
        edited_at: string | null;
        is_deleted: boolean;
        deleted_at: string | null;
        created_at: string;
      }>(
        `INSERT INTO messages (team_id, author_id, content, reply_to_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, team_id, author_id, content, reply_to_id,
                   is_pinned, is_edited, edited_at, is_deleted, deleted_at, created_at`,
        [data.teamId, data.authorId, data.content, data.replyToId || null]
      );

      const row = result.rows[0];

      // Fetch author info
      const user = await getUserWithAssignment(data.authorId);

      return {
        id: row.id,
        teamId: row.team_id,
        channel: data.channel ?? DEFAULT_CHANNEL,
        authorId: row.author_id,
        content: row.content,
        replyToId: row.reply_to_id,
        isPinned: row.is_pinned,
        isEdited: row.is_edited,
        editedAt: row.edited_at,
        isDeleted: row.is_deleted,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        author: {
          id: data.authorId,
          fullName: user?.fullName ?? 'Unknown User',
          avatarUrl: user?.avatarUrl ?? null,
        },
        replyTo: null,
      };
    } catch (error) {
      console.error('[Messages] Error creating message in database:', error);
      throw new Error('Failed to create message');
    }
  }

  // Fall back to mock data for slug IDs
  await new Promise((resolve) => setTimeout(resolve, 20));

  // Fetch the user's actual name from the database
  const user = await getUserWithAssignment(data.authorId);
  const authorName = user?.fullName ?? 'Unknown User';
  const authorAvatar = user?.avatarUrl ?? null;

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
      fullName: authorName,
      avatarUrl: authorAvatar,
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
