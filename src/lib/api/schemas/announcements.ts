/**
 * Zod Validation Schemas for Announcements API
 *
 * Provides type-safe validation for all announcement-related endpoints.
 */

import { z } from 'zod';

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Announcement title schema with length constraints
 */
export const announcementTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title cannot exceed 200 characters')
  .trim();

/**
 * Announcement content schema with length constraints
 */
export const announcementContentSchema = z
  .string()
  .min(1, 'Content is required')
  .max(10000, 'Content cannot exceed 10000 characters')
  .trim();

/**
 * Priority levels: 1 = normal, 2 = important, 3 = urgent
 */
export const prioritySchema = z
  .number()
  .int('Priority must be an integer')
  .min(1, 'Priority must be at least 1')
  .max(3, 'Priority must be at most 3');

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for creating a new announcement
 * POST /api/announcements
 */
export const createAnnouncementSchema = z.object({
  title: announcementTitleSchema,
  content: announcementContentSchema,
  seasonId: z.string().nullable().optional(),
  isPublished: z.boolean().optional().default(false),
  isPinned: z.boolean().optional().default(false),
  priority: prioritySchema.optional().default(1),
  expiresAt: z.string().datetime({ message: 'expiresAt must be a valid ISO date' }).nullable().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

/**
 * Schema for updating an announcement
 * PATCH /api/announcements/[announcementId]
 */
export const updateAnnouncementSchema = z.object({
  title: announcementTitleSchema.optional(),
  content: announcementContentSchema.optional(),
  seasonId: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  priority: prioritySchema.optional(),
  expiresAt: z.string().datetime({ message: 'expiresAt must be a valid ISO date' }).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for listing announcements
 * GET /api/announcements
 */
export const listAnnouncementsQuerySchema = z.object({
  seasonId: z.string().optional(),
  priority: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 3) return undefined;
      return parsed;
    }),
  pinnedOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  includeExpired: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 1;
      return parsed;
    }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 20;
      return Math.min(parsed, 100); // Max 100 per request
    }),
});

export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsQuerySchema>;

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

/**
 * Author information in announcement response
 */
export const announcementAuthorSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
});

/**
 * Full announcement response schema
 */
export const announcementResponseSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  seasonId: z.string().nullable(),
  title: z.string(),
  content: z.string(),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(),
  isPinned: z.boolean(),
  priority: z.number(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: announcementAuthorSchema,
});

export type AnnouncementResponse = z.infer<typeof announcementResponseSchema>;

/**
 * Paginated announcements list response
 */
export const announcementsListResponseSchema = z.object({
  announcements: z.array(announcementResponseSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type AnnouncementsListResponse = z.infer<typeof announcementsListResponseSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate and parse create announcement request body
 */
export function validateCreateAnnouncement(data: unknown): {
  success: true;
  data: CreateAnnouncementInput;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  const result = createAnnouncementSchema.safeParse(data);

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
 * Validate and parse update announcement request body
 */
export function validateUpdateAnnouncement(data: unknown): {
  success: true;
  data: UpdateAnnouncementInput;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  const result = updateAnnouncementSchema.safeParse(data);

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
 * Parse and validate list announcements query parameters
 */
export function parseListAnnouncementsQuery(searchParams: URLSearchParams): ListAnnouncementsQuery {
  return listAnnouncementsQuerySchema.parse({
    seasonId: searchParams.get('seasonId') || undefined,
    priority: searchParams.get('priority') || undefined,
    pinnedOnly: searchParams.get('pinnedOnly') || undefined,
    includeExpired: searchParams.get('includeExpired') || undefined,
    page: searchParams.get('page') || undefined,
    pageSize: searchParams.get('pageSize') || undefined,
  });
}
