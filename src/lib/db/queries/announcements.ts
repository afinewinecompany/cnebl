/**
 * Announcement Queries
 * Query functions for league-wide announcements
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import type { Announcement } from '@/types';
import type {
  AnnouncementResponse,
  AnnouncementsListResponse,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@/lib/api/schemas/announcements';

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Mock announcement data for development
 * In production, this will be replaced with actual database queries
 */
const mockAnnouncements: (Announcement & {
  author: { id: string; fullName: string; avatarUrl: string | null };
})[] = [
  {
    id: 'ann-001',
    authorId: 'commissioner-001',
    seasonId: '2026',
    title: 'Welcome to the 2026 CNEBL Season!',
    content: 'We are excited to announce the start of the 2026 Coastal New England Baseball League season! This year we have 6 teams competing for the championship. Opening day is scheduled for May 1st at Veterans Memorial Field. Good luck to all teams!',
    isPublished: true,
    publishedAt: '2026-02-01T10:00:00Z',
    isPinned: true,
    priority: 3,
    expiresAt: null,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
    author: { id: 'commissioner-001', fullName: 'Bob Richardson', avatarUrl: null },
  },
  {
    id: 'ann-002',
    authorId: 'admin-001',
    seasonId: '2026',
    title: 'Field Maintenance Schedule Update',
    content: 'Due to recent weather conditions, field maintenance will be performed on all home fields during the week of February 20-24. Some practice times may be affected. Team managers will be notified of any schedule changes directly.',
    isPublished: true,
    publishedAt: '2026-02-15T14:00:00Z',
    isPinned: false,
    priority: 2,
    expiresAt: '2026-02-25T00:00:00Z',
    createdAt: '2026-02-15T13:30:00Z',
    updatedAt: '2026-02-15T14:00:00Z',
    author: { id: 'admin-001', fullName: 'Sarah Mitchell', avatarUrl: null },
  },
  {
    id: 'ann-003',
    authorId: 'commissioner-001',
    seasonId: '2026',
    title: 'New Equipment Requirements for 2026',
    content: 'Reminder: All players must have NOCSAE-approved batting helmets and bats that meet USA Baseball standards. Umpires will be checking equipment before each game. Players with non-compliant equipment will not be allowed to participate. Contact the league office if you have questions about specific equipment.',
    isPublished: true,
    publishedAt: '2026-02-10T09:00:00Z',
    isPinned: true,
    priority: 2,
    expiresAt: null,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T09:00:00Z',
    author: { id: 'commissioner-001', fullName: 'Bob Richardson', avatarUrl: null },
  },
  {
    id: 'ann-004',
    authorId: 'admin-001',
    seasonId: '2026',
    title: 'Umpire Registration Open',
    content: 'We are looking for umpires for the 2026 season. If you are interested or know someone who would be a good fit, please contact the league office. Training sessions will be held in late March. Compensation: $50 per game for base umpires, $75 for plate umpires.',
    isPublished: true,
    publishedAt: '2026-02-05T11:00:00Z',
    isPinned: false,
    priority: 1,
    expiresAt: '2026-03-15T00:00:00Z',
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T11:00:00Z',
    author: { id: 'admin-001', fullName: 'Sarah Mitchell', avatarUrl: null },
  },
  {
    id: 'ann-005',
    authorId: 'commissioner-001',
    seasonId: '2026',
    title: 'Draft Announcement',
    content: 'The 2026 CNEBL draft will be held on March 15th at 7pm at the Coastal Community Center. All team managers must attend. Player registration closes on March 10th. We have 15 new players registering this year!',
    isPublished: false,
    publishedAt: null,
    isPinned: false,
    priority: 2,
    expiresAt: null,
    createdAt: '2026-02-12T16:00:00Z',
    updatedAt: '2026-02-12T16:00:00Z',
    author: { id: 'commissioner-001', fullName: 'Bob Richardson', avatarUrl: null },
  },
  {
    id: 'ann-006',
    authorId: 'admin-001',
    seasonId: '2025',
    title: '2025 Season Awards Ceremony',
    content: 'The 2025 season awards ceremony was a great success! Congratulations to the Rays for winning the championship, and to all individual award winners. See you next season!',
    isPublished: true,
    publishedAt: '2025-09-15T20:00:00Z',
    isPinned: false,
    priority: 1,
    expiresAt: '2025-12-31T00:00:00Z',
    createdAt: '2025-09-15T19:00:00Z',
    updatedAt: '2025-09-15T20:00:00Z',
    author: { id: 'admin-001', fullName: 'Sarah Mitchell', avatarUrl: null },
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Transform an announcement to the API response format
 */
function transformAnnouncement(
  announcement: typeof mockAnnouncements[0]
): AnnouncementResponse {
  return {
    id: announcement.id,
    authorId: announcement.authorId,
    seasonId: announcement.seasonId,
    title: announcement.title,
    content: announcement.content,
    isPublished: announcement.isPublished,
    publishedAt: announcement.publishedAt,
    isPinned: announcement.isPinned,
    priority: announcement.priority,
    expiresAt: announcement.expiresAt,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
    author: announcement.author,
  };
}

/**
 * Check if an announcement is expired
 */
function isExpired(announcement: typeof mockAnnouncements[0]): boolean {
  if (!announcement.expiresAt) return false;
  return new Date(announcement.expiresAt) < new Date();
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get published announcements with filtering and pagination
 * Used for public listing (GET /api/announcements)
 */
export async function getPublishedAnnouncements(options: {
  seasonId?: string;
  priority?: number;
  pinnedOnly?: boolean;
  includeExpired?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AnnouncementsListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));

  const {
    seasonId,
    priority,
    pinnedOnly = false,
    includeExpired = false,
    page = 1,
    pageSize = 20,
  } = options;

  // Start with published announcements only
  let filtered = mockAnnouncements.filter((a) => a.isPublished);

  // Filter by season
  if (seasonId) {
    filtered = filtered.filter((a) => a.seasonId === seasonId);
  }

  // Filter by priority
  if (priority !== undefined) {
    filtered = filtered.filter((a) => a.priority === priority);
  }

  // Filter pinned only
  if (pinnedOnly) {
    filtered = filtered.filter((a) => a.isPinned);
  }

  // Exclude expired unless requested
  if (!includeExpired) {
    filtered = filtered.filter((a) => !isExpired(a));
  }

  // Sort: pinned first, then by priority desc, then by publishedAt desc
  filtered.sort((a, b) => {
    // Pinned items first
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    // Then by priority (higher first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Then by publishedAt (newest first)
    const dateA = new Date(a.publishedAt || a.createdAt).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  // Calculate pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const offset = (page - 1) * pageSize;
  const pageItems = filtered.slice(offset, offset + pageSize);

  return {
    announcements: pageItems.map(transformAnnouncement),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Get a single announcement by ID
 */
export async function getAnnouncementById(
  announcementId: string
): Promise<AnnouncementResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const announcement = mockAnnouncements.find((a) => a.id === announcementId);
  if (!announcement) return null;

  return transformAnnouncement(announcement);
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(
  authorId: string,
  data: CreateAnnouncementInput
): Promise<AnnouncementResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));

  const now = new Date().toISOString();
  const publishedAt = data.isPublished ? now : null;

  const newAnnouncement = {
    id: `ann-${Date.now()}`,
    authorId,
    seasonId: data.seasonId ?? null,
    title: data.title,
    content: data.content,
    isPublished: data.isPublished ?? false,
    publishedAt,
    isPinned: data.isPinned ?? false,
    priority: data.priority ?? 1,
    expiresAt: data.expiresAt ?? null,
    createdAt: now,
    updatedAt: now,
    author: {
      id: authorId,
      fullName: 'Current Admin', // In production, fetch from database
      avatarUrl: null,
    },
  };

  // Add to mock data (in memory only)
  mockAnnouncements.unshift(newAnnouncement);

  return transformAnnouncement(newAnnouncement);
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(
  announcementId: string,
  data: UpdateAnnouncementInput
): Promise<AnnouncementResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 15));

  const announcementIndex = mockAnnouncements.findIndex((a) => a.id === announcementId);
  if (announcementIndex === -1) return null;

  const announcement = mockAnnouncements[announcementIndex];
  const now = new Date().toISOString();

  // Update fields if provided
  if (data.title !== undefined) {
    announcement.title = data.title;
  }
  if (data.content !== undefined) {
    announcement.content = data.content;
  }
  if (data.seasonId !== undefined) {
    announcement.seasonId = data.seasonId;
  }
  if (data.isPinned !== undefined) {
    announcement.isPinned = data.isPinned;
  }
  if (data.priority !== undefined) {
    announcement.priority = data.priority;
  }
  if (data.expiresAt !== undefined) {
    announcement.expiresAt = data.expiresAt;
  }

  // Handle publishing
  if (data.isPublished !== undefined) {
    const wasPublished = announcement.isPublished;
    announcement.isPublished = data.isPublished;

    // Set publishedAt when publishing for the first time
    if (data.isPublished && !wasPublished) {
      announcement.publishedAt = now;
    }
  }

  announcement.updatedAt = now;

  return transformAnnouncement(announcement);
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(announcementId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const index = mockAnnouncements.findIndex((a) => a.id === announcementId);
  if (index === -1) return false;

  mockAnnouncements.splice(index, 1);
  return true;
}

/**
 * Get the author ID of an announcement (for authorization checks)
 */
export async function getAnnouncementAuthorId(announcementId: string): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 5));

  const announcement = mockAnnouncements.find((a) => a.id === announcementId);
  return announcement?.authorId ?? null;
}

/**
 * Check if a user can manage announcements (is admin or commissioner)
 */
export async function canManageAnnouncements(userRole: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 5));

  return userRole === 'admin' || userRole === 'commissioner';
}
