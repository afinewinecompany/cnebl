/**
 * Individual Announcement API Route
 * GET /api/announcements/[announcementId] - Get a single announcement
 * PATCH /api/announcements/[announcementId] - Update announcement (author or admin)
 * DELETE /api/announcements/[announcementId] - Delete announcement (author or admin)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  noContentResponse,
} from '@/lib/api';
import { validateRequired } from '@/lib/api/validation';
import { validateUpdateAnnouncement } from '@/lib/api/schemas/announcements';
import {
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementAuthorId,
  canManageAnnouncements,
} from '@/lib/db/queries/announcements';

interface RouteParams {
  params: Promise<{ announcementId: string }>;
}

/**
 * GET /api/announcements/[announcementId]
 *
 * Get a single announcement by ID. Published announcements are publicly
 * accessible. Unpublished announcements require admin/commissioner access.
 *
 * Authorization:
 * - Public access for published announcements
 * - Admin/commissioner access required for unpublished announcements
 *
 * Example request:
 * GET /api/announcements/ann-001
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ann-001",
 *     "authorId": "commissioner-001",
 *     "seasonId": "2026",
 *     "title": "Welcome to the 2026 CNEBL Season!",
 *     "content": "We are excited to announce the start of the 2026 season...",
 *     "isPublished": true,
 *     "publishedAt": "2026-02-01T10:00:00Z",
 *     "isPinned": true,
 *     "priority": 3,
 *     "expiresAt": null,
 *     "createdAt": "2026-02-01T09:00:00Z",
 *     "updatedAt": "2026-02-01T10:00:00Z",
 *     "author": {
 *       "id": "commissioner-001",
 *       "fullName": "Bob Richardson",
 *       "avatarUrl": null
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { announcementId } = await params;

    // Validate announcement ID
    const validation = validateRequired(announcementId, 'announcementId');
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Get the announcement
    const announcement = await getAnnouncementById(announcementId);
    if (!announcement) {
      return notFoundResponse('Announcement', announcementId);
    }

    // If announcement is not published, check authorization
    if (!announcement.isPublished) {
      const session = await auth();
      if (!session?.user) {
        return notFoundResponse('Announcement', announcementId);
      }

      const canManage = await canManageAnnouncements(session.user.role);
      if (!canManage) {
        return notFoundResponse('Announcement', announcementId);
      }
    }

    return successResponse(announcement);
  } catch (error) {
    console.error('[API] GET /api/announcements/[announcementId] error:', error);
    return internalErrorResponse('Failed to fetch announcement');
  }
}

/**
 * PATCH /api/announcements/[announcementId]
 *
 * Update an announcement. Only the original author or administrators
 * can update announcements.
 *
 * Request body (all fields optional, at least one required):
 * {
 *   "title": "Updated title",
 *   "content": "Updated content",
 *   "seasonId": "2026" (or null to remove),
 *   "isPublished": true,
 *   "isPinned": true,
 *   "priority": 2,
 *   "expiresAt": "2026-03-15T00:00:00Z" (or null to remove)
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must be either:
 *   - The original author of the announcement, OR
 *   - Have 'admin' or 'commissioner' role
 *
 * Example request:
 * PATCH /api/announcements/ann-001
 * {
 *   "isPinned": false,
 *   "priority": 1
 * }
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ann-001",
 *     "title": "Welcome to the 2026 CNEBL Season!",
 *     "isPinned": false,
 *     "priority": 1,
 *     "updatedAt": "2026-02-16T20:30:00Z",
 *     ...
 *   }
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to update announcements');
    }

    const { announcementId } = await params;

    // Validate announcement ID
    const idValidation = validateRequired(announcementId, 'announcementId');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    // Check if announcement exists and get the author
    const authorId = await getAnnouncementAuthorId(announcementId);
    if (!authorId) {
      return notFoundResponse('Announcement', announcementId);
    }

    // Check authorization: user must be author OR admin/commissioner
    const isAuthor = authorId === session.user.id;
    const canManage = await canManageAnnouncements(session.user.role);

    if (!isAuthor && !canManage) {
      return forbiddenResponse(
        'You can only update your own announcements or must be an administrator'
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    const validation = validateUpdateAnnouncement(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Update the announcement
    const announcement = await updateAnnouncement(announcementId, validation.data);
    if (!announcement) {
      return notFoundResponse('Announcement', announcementId);
    }

    return successResponse(announcement);
  } catch (error) {
    console.error('[API] PATCH /api/announcements/[announcementId] error:', error);
    return internalErrorResponse('Failed to update announcement');
  }
}

/**
 * DELETE /api/announcements/[announcementId]
 *
 * Delete an announcement permanently. Only the original author or
 * administrators can delete announcements.
 *
 * Authorization:
 * - User must be authenticated
 * - User must be either:
 *   - The original author of the announcement, OR
 *   - Have 'admin' or 'commissioner' role
 *
 * Example request:
 * DELETE /api/announcements/ann-001
 *
 * Example response:
 * HTTP 204 No Content
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to delete announcements');
    }

    const { announcementId } = await params;

    // Validate announcement ID
    const idValidation = validateRequired(announcementId, 'announcementId');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    // Get the author ID for authorization check
    const authorId = await getAnnouncementAuthorId(announcementId);
    if (!authorId) {
      return notFoundResponse('Announcement', announcementId);
    }

    // Check authorization: user must be author OR admin/commissioner
    const isAuthor = authorId === session.user.id;
    const canManage = await canManageAnnouncements(session.user.role);

    if (!isAuthor && !canManage) {
      return forbiddenResponse(
        'You can only delete your own announcements or must be an administrator'
      );
    }

    // Delete the announcement
    const deleted = await deleteAnnouncement(announcementId);
    if (!deleted) {
      return notFoundResponse('Announcement', announcementId);
    }

    return noContentResponse();
  } catch (error) {
    console.error('[API] DELETE /api/announcements/[announcementId] error:', error);
    return internalErrorResponse('Failed to delete announcement');
  }
}
