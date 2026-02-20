/**
 * Zod Validation Schemas for Messages API
 *
 * Provides type-safe validation for all message-related endpoints.
 */

import { z } from 'zod';
import { sanitizeMessageContent } from '../sanitize';
import type { ChannelType } from '@/types/database.types';

// =============================================================================
// CHANNEL SCHEMA
// =============================================================================

/**
 * Valid channel types for team messaging
 */
export const channelTypeSchema = z.enum(['important', 'general', 'substitutes']);

/**
 * Channel metadata for UI display
 */
export const CHANNEL_METADATA: Record<ChannelType, { name: string; description: string; icon: string }> = {
  important: {
    name: 'Important',
    description: 'Announcements from team management',
    icon: 'megaphone',
  },
  general: {
    name: 'General',
    description: 'Team discussions',
    icon: 'message-circle',
  },
  substitutes: {
    name: 'Substitutes',
    description: 'Find subs for games',
    icon: 'users',
  },
};

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Message content schema with length constraints and sanitization
 */
export const messageContentSchema = z
  .string()
  .min(1, 'Message content is required')
  .max(2000, 'Message cannot exceed 2000 characters')
  .transform((val) => sanitizeMessageContent(val.trim(), 2000));

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format')
  .or(z.string().min(1, 'ID is required')); // Allow non-UUID IDs for mock data

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for creating a new message
 * POST /api/teams/[teamId]/messages
 */
export const createMessageSchema = z.object({
  content: messageContentSchema,
  channel: channelTypeSchema.default('general'),
  replyToId: z.string().nullable().optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

/**
 * Schema for editing a message
 * PATCH /api/messages/[messageId]
 */
export const editMessageSchema = z.object({
  content: messageContentSchema,
});

export type EditMessageInput = z.infer<typeof editMessageSchema>;

/**
 * Schema for toggling pin status
 * POST /api/messages/[messageId]/pin
 */
export const togglePinSchema = z.object({
  isPinned: z.boolean(),
});

export type TogglePinInput = z.infer<typeof togglePinSchema>;

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for listing messages (cursor-based pagination)
 * GET /api/teams/[teamId]/messages
 */
export const listMessagesQuerySchema = z.object({
  channel: channelTypeSchema.optional().default('general'),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 50;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 50;
      return Math.min(parsed, 100); // Max 100 messages per request
    }),
  direction: z.enum(['older', 'newer']).optional().default('older'),
  pinnedOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

/**
 * Author information in message response
 */
export const messageAuthorSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
});

/**
 * Full message response schema
 */
export const messageResponseSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  channel: channelTypeSchema,
  authorId: z.string(),
  content: z.string(),
  replyToId: z.string().nullable(),
  isPinned: z.boolean(),
  isEdited: z.boolean(),
  editedAt: z.string().nullable(),
  isDeleted: z.boolean(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  author: messageAuthorSchema,
  replyTo: z.object({
    id: z.string(),
    content: z.string(),
    author: messageAuthorSchema,
  }).nullable().optional(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;

/**
 * Cursor-based pagination response for messages
 */
export const messagesListResponseSchema = z.object({
  messages: z.array(messageResponseSchema),
  cursor: z.object({
    next: z.string().nullable(),
    previous: z.string().nullable(),
  }),
  hasMore: z.boolean(),
  totalPinned: z.number(),
  channel: channelTypeSchema,
});

export type MessagesListResponse = z.infer<typeof messagesListResponseSchema>;

/**
 * Channel info response schema
 */
export const channelInfoSchema = z.object({
  id: channelTypeSchema,
  name: z.string(),
  description: z.string(),
  canWrite: z.boolean(),
  messageCount: z.number(),
  lastMessageAt: z.string().nullable(),
  pinnedCount: z.number(),
});

export const channelsResponseSchema = z.object({
  channels: z.array(channelInfoSchema),
});

export type ChannelInfo = z.infer<typeof channelInfoSchema>;
export type ChannelsResponse = z.infer<typeof channelsResponseSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate and parse create message request body
 */
export function validateCreateMessage(data: unknown): {
  success: true;
  data: CreateMessageInput;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  const result = createMessageSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

/**
 * Validate and parse edit message request body
 */
export function validateEditMessage(data: unknown): {
  success: true;
  data: EditMessageInput;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  const result = editMessageSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

/**
 * Validate and parse toggle pin request body
 */
export function validateTogglePin(data: unknown): {
  success: true;
  data: TogglePinInput;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  const result = togglePinSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

/**
 * Parse and validate list messages query parameters
 */
export function parseListMessagesQuery(searchParams: URLSearchParams): ListMessagesQuery {
  return listMessagesQuerySchema.parse({
    channel: searchParams.get('channel') || undefined,
    cursor: searchParams.get('cursor') || undefined,
    limit: searchParams.get('limit') || undefined,
    direction: searchParams.get('direction') || undefined,
    pinnedOnly: searchParams.get('pinnedOnly') || undefined,
  });
}
