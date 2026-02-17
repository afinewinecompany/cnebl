/**
 * Message Queries
 * Query functions for team chat messages
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import type { Message } from '@/types';
import type { MessageResponse, MessagesListResponse } from '@/lib/api/schemas/messages';

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
  {
    id: 'msg-001',
    teamId: 'rays',
    authorId: 'user-001',
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
  {
    id: 'msg-006',
    teamId: 'pirates',
    authorId: 'user-010',
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
    cursor?: string;
    limit?: number;
    direction?: 'older' | 'newer';
    pinnedOnly?: boolean;
  }
): Promise<MessagesListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));

  const { cursor, limit = 50, direction = 'older', pinnedOnly = false } = options;

  // Filter messages for this team
  let teamMessages = mockMessages.filter(
    (m) => m.teamId === teamId && !m.isDeleted
  );

  // Filter pinned only if requested
  if (pinnedOnly) {
    teamMessages = teamMessages.filter((m) => m.isPinned);
  }

  // Sort by createdAt descending (newest first)
  teamMessages.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate total pinned count
  const totalPinned = mockMessages.filter(
    (m) => m.teamId === teamId && m.isPinned && !m.isDeleted
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
  replyToId?: string | null;
}): Promise<MessageResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));

  const newMessage = {
    id: `msg-${Date.now()}`,
    teamId: data.teamId,
    authorId: data.authorId,
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
