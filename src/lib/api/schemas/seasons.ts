/**
 * Zod Validation Schemas for Seasons API
 *
 * Provides type-safe validation for all season-related endpoints.
 */

import { z } from 'zod';

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Season name schema with length constraints
 */
export const seasonNameSchema = z
  .string()
  .min(1, 'Season name is required')
  .max(100, 'Season name cannot exceed 100 characters')
  .trim();

/**
 * Year schema - valid baseball season years
 */
export const seasonYearSchema = z
  .number()
  .int('Year must be an integer')
  .min(2000, 'Year must be 2000 or later')
  .max(2100, 'Year must be 2100 or earlier');

/**
 * Date string schema - ISO date format (YYYY-MM-DD)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for creating a new season
 * POST /api/seasons
 */
export const createSeasonSchema = z.object({
  name: seasonNameSchema,
  year: seasonYearSchema,
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  isActive: z.boolean().optional().default(false),
  registrationOpen: z.boolean().optional().default(false),
  copyFromSeasonId: z.string().optional(), // Optional: copy settings from existing season
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: 'Start date must be before end date', path: ['endDate'] }
);

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;

/**
 * Schema for updating a season
 * PATCH /api/seasons/[seasonId]
 */
export const updateSeasonSchema = z.object({
  name: seasonNameSchema.optional(),
  year: seasonYearSchema.optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  isActive: z.boolean().optional(),
  registrationOpen: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for listing seasons
 * GET /api/seasons
 */
export const listSeasonsQuerySchema = z.object({
  year: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return undefined;
      return parsed;
    }),
  activeOnly: z
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

export type ListSeasonsQuery = z.infer<typeof listSeasonsQuerySchema>;

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

/**
 * Season statistics for admin view
 */
export const seasonStatsSchema = z.object({
  gamesPlayed: z.number(),
  gamesScheduled: z.number(),
  teamsCount: z.number(),
  playersCount: z.number(),
});

export type SeasonStats = z.infer<typeof seasonStatsSchema>;

/**
 * Full season response schema with stats
 */
export const seasonResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  registrationOpen: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stats: seasonStatsSchema.optional(),
});

export type SeasonResponse = z.infer<typeof seasonResponseSchema>;

/**
 * Paginated seasons list response
 */
export const seasonsListResponseSchema = z.object({
  seasons: z.array(seasonResponseSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type SeasonsListResponse = z.infer<typeof seasonsListResponseSchema>;

/**
 * Schedule overview by month
 */
export const scheduleOverviewSchema = z.object({
  month: z.string(),
  gamesCount: z.number(),
  completedCount: z.number(),
});

export type ScheduleOverview = z.infer<typeof scheduleOverviewSchema>;

/**
 * Season detail response with teams and schedule
 */
export const seasonDetailResponseSchema = seasonResponseSchema.extend({
  teams: z.array(z.object({
    id: z.string(),
    name: z.string(),
    abbreviation: z.string(),
    primaryColor: z.string().nullable(),
    wins: z.number(),
    losses: z.number(),
    ties: z.number(),
  })),
  scheduleOverview: z.array(scheduleOverviewSchema),
});

export type SeasonDetailResponse = z.infer<typeof seasonDetailResponseSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate and parse create season request body
 */
export function validateCreateSeason(data: unknown): {
  success: true;
  data: CreateSeasonInput;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  const result = createSeasonSchema.safeParse(data);

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
 * Validate and parse update season request body
 */
export function validateUpdateSeason(data: unknown): {
  success: true;
  data: UpdateSeasonInput;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  const result = updateSeasonSchema.safeParse(data);

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
 * Parse and validate list seasons query parameters
 */
export function parseListSeasonsQuery(searchParams: URLSearchParams): ListSeasonsQuery {
  return listSeasonsQuerySchema.parse({
    year: searchParams.get('year') || undefined,
    activeOnly: searchParams.get('activeOnly') || undefined,
    page: searchParams.get('page') || undefined,
    pageSize: searchParams.get('pageSize') || undefined,
  });
}
