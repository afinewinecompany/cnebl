/**
 * Announcements API Route
 * GET /api/announcements - List published announcements (public, filtered by season)
 * POST /api/announcements - Create announcement (admin/commissioner only)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import {
  parseListAnnouncementsQuery,
  validateCreateAnnouncement,
} from '@/lib/api/schemas/announcements';
import {
  getPublishedAnnouncements,
  createAnnouncement,
  canManageAnnouncements,
} from '@/lib/db/queries/announcements';

/**
 * GET /api/announcements
 *
 * Returns a paginated list of published announcements. This endpoint is public
 * and does not require authentication.
 *
 * Query parameters:
 * - seasonId: Filter by season (optional)
 * - priority: Filter by priority level (1=normal, 2=important, 3=urgent)
 * - pinnedOnly: If 'true', only return pinned announcements
 * - includeExpired: If 'true', include expired announcements (default: false)
 * - page: Page number for pagination (default: 1)
 * - pageSize: Number of items per page (default: 20, max: 100)
 *
 * Announcements are sorted by:
 * 1. Pinned status (pinned first)
 * 2. Priority (higher priority first)
 * 3. Published date (newest first)
 *
 * Example requests:
 * - GET /api/announcements
 * - GET /api/announcements?seasonId=2026
 * - GET /api/announcements?priority=3&pinnedOnly=true
 * - GET /api/announcements?page=2&pageSize=10
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "announcements": [
 *       {
 *         "id": "ann-001",
 *         "authorId": "commissioner-001",
 *         "seasonId": "2026",
 *         "title": "Welcome to the 2026 CNEBL Season!",
 *         "content": "We are excited to announce...",
 *         "isPublished": true,
 *         "publishedAt": "2026-02-01T10:00:00Z",
 *         "isPinned": true,
 *         "priority": 3,
 *         "expiresAt": null,
 *         "createdAt": "2026-02-01T09:00:00Z",
 *         "updatedAt": "2026-02-01T10:00:00Z",
 *         "author": {
 *           "id": "commissioner-001",
 *           "fullName": "Bob Richardson",
 *           "avatarUrl": null
 *         }
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "pageSize": 20,
 *       "totalItems": 4,
 *       "totalPages": 1,
 *       "hasNextPage": false,
 *       "hasPreviousPage": false
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = parseListAnnouncementsQuery(searchParams);

    // Fetch published announcements (public access)
    const result = await getPublishedAnnouncements({
      seasonId: query.seasonId,
      priority: query.priority,
      pinnedOnly: query.pinnedOnly,
      includeExpired: query.includeExpired,
      page: query.page,
      pageSize: query.pageSize,
    });

    return successResponse(result);
  } catch (error) {
    console.error('[API] GET /api/announcements error:', error);
    return internalErrorResponse('Failed to fetch announcements');
  }
}

/**
 * POST /api/announcements
 *
 * Create a new league announcement. Only administrators and commissioners
 * can create announcements.
 *
 * Request body:
 * {
 *   "title": "Announcement title (1-200 characters)",
 *   "content": "Announcement content (1-10000 characters)",
 *   "seasonId": "2026" (optional - associate with a specific season),
 *   "isPublished": false (optional - publish immediately, default: false),
 *   "isPinned": false (optional - pin to top, default: false),
 *   "priority": 1 (optional - 1=normal, 2=important, 3=urgent, default: 1),
 *   "expiresAt": "2026-03-15T00:00:00Z" (optional - auto-hide after this date)
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must have 'admin' or 'commissioner' role
 *
 * Example request:
 * POST /api/announcements
 * {
 *   "title": "Important Schedule Change",
 *   "content": "Due to weather conditions, all games on Saturday will be postponed.",
 *   "seasonId": "2026",
 *   "isPublished": true,
 *   "priority": 2
 * }
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ann-new-001",
 *     "authorId": "commissioner-001",
 *     "seasonId": "2026",
 *     "title": "Important Schedule Change",
 *     "content": "Due to weather conditions...",
 *     "isPublished": true,
 *     "publishedAt": "2026-02-16T20:00:00Z",
 *     "isPinned": false,
 *     "priority": 2,
 *     "expiresAt": null,
 *     "createdAt": "2026-02-16T20:00:00Z",
 *     "updatedAt": "2026-02-16T20:00:00Z",
 *     "author": {
 *       "id": "commissioner-001",
 *       "fullName": "Bob Richardson",
 *       "avatarUrl": null
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to create announcements');
    }

    // Check authorization - must be admin or commissioner
    const canManage = await canManageAnnouncements(session.user.role);
    if (!canManage) {
      return forbiddenResponse('Only administrators and commissioners can create announcements');
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    const validation = validateCreateAnnouncement(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Create the announcement
    const announcement = await createAnnouncement(session.user.id, validation.data);

    return createdResponse(announcement);
  } catch (error) {
    console.error('[API] POST /api/announcements error:', error);
    return internalErrorResponse('Failed to create announcement');
  }
}
