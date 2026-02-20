/**
 * Team Channel Constants
 *
 * Defines the channel types, their display information, and permission rules
 * for the team messaging system.
 */

import type { ChannelType, ChannelConfig, UserRole } from '@/types/database.types';

// =============================================================================
// Channel Definitions
// =============================================================================

/**
 * Default channel configurations with display information
 */
export const TEAM_CHANNELS: readonly ChannelConfig[] = [
  {
    type: 'important',
    name: 'Important',
    description: 'Team announcements and critical updates. Only managers can post.',
    icon: 'megaphone',
    canAllPost: false,
  },
  {
    type: 'general',
    name: 'General',
    description: 'General team discussion and coordination.',
    icon: 'chat-bubble',
    canAllPost: true,
  },
  {
    type: 'substitutes',
    name: 'Substitutes',
    description: 'Find or offer substitute players for games.',
    icon: 'user-plus',
    canAllPost: true,
  },
] as const;

/**
 * Default channel when none is specified
 */
export const DEFAULT_CHANNEL: ChannelType = 'general';

/**
 * All valid channel types
 */
export const CHANNEL_TYPES: readonly ChannelType[] = ['important', 'general', 'substitutes'] as const;

// =============================================================================
// Permission Configuration
// =============================================================================

/**
 * Roles that can post to the Important channel
 */
export const IMPORTANT_CHANNEL_POST_ROLES: readonly string[] = ['manager', 'admin', 'commissioner'];

/**
 * Roles that have read access to all team chats (oversight)
 */
export const OVERSIGHT_ROLES: readonly UserRole[] = ['admin', 'commissioner'];

/**
 * Channel permission configuration
 * Defines who can read, post, and pin messages in each channel
 */
export const CHANNEL_PERMISSIONS = {
  important: {
    // Who can post messages
    canPost: ['manager', 'admin', 'commissioner'] as const,
    // Who can read messages (all team members plus oversight roles)
    canRead: ['player', 'manager', 'admin', 'commissioner'] as const,
    // Who can pin/unpin messages
    canPin: ['manager', 'admin', 'commissioner'] as const,
    // Who can delete messages (their own + managers can delete any)
    canDelete: ['manager', 'admin', 'commissioner'] as const,
  },
  general: {
    canPost: ['player', 'manager', 'admin', 'commissioner'] as const,
    canRead: ['player', 'manager', 'admin', 'commissioner'] as const,
    canPin: ['player', 'manager', 'admin', 'commissioner'] as const,
    canDelete: ['player', 'manager', 'admin', 'commissioner'] as const,
  },
  substitutes: {
    canPost: ['player', 'manager', 'admin', 'commissioner'] as const,
    canRead: ['player', 'manager', 'admin', 'commissioner'] as const,
    canPin: ['player', 'manager', 'admin', 'commissioner'] as const,
    canDelete: ['player', 'manager', 'admin', 'commissioner'] as const,
  },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get channel configuration by type
 */
export function getChannelConfig(channelType: ChannelType): ChannelConfig {
  const config = TEAM_CHANNELS.find((c) => c.type === channelType);
  if (!config) {
    throw new Error(`Invalid channel type: ${channelType}`);
  }
  return config;
}

/**
 * Check if a channel type is valid
 */
export function isValidChannelType(value: string): value is ChannelType {
  return CHANNEL_TYPES.includes(value as ChannelType);
}

/**
 * Check if a user can post to a specific channel
 *
 * @param userRole - The user's global role
 * @param isTeamManager - Whether the user is the manager of this specific team
 * @param channelType - The channel to check
 * @returns true if the user can post to the channel
 */
export function canUserPostToChannel(
  userRole: UserRole,
  isTeamManager: boolean,
  channelType: ChannelType
): boolean {
  // Important channel requires special permissions
  if (channelType === 'important') {
    // Team manager can always post to their team's Important channel
    if (isTeamManager) return true;
    // Admins and commissioners can post to any Important channel
    return OVERSIGHT_ROLES.includes(userRole);
  }

  // General and Substitutes channels allow all team members
  // The team membership check happens elsewhere
  return true;
}

/**
 * Check if a user can view team messages (any channel)
 *
 * @param userRole - The user's global role
 * @param isTeamMember - Whether the user is a member of this team
 * @param isTeamManager - Whether the user is the manager of this team
 * @returns true if the user can view team messages
 */
export function canUserViewTeamMessages(
  userRole: UserRole,
  isTeamMember: boolean,
  isTeamManager: boolean
): boolean {
  // Admins and commissioners have oversight access
  if (OVERSIGHT_ROLES.includes(userRole)) return true;

  // Team managers can view their team's messages
  if (isTeamManager) return true;

  // Active team members can view messages
  return isTeamMember;
}

/**
 * Check if a user can pin messages in a channel
 *
 * @param userRole - The user's global role
 * @param isTeamManager - Whether the user is the manager of this team
 * @param channelType - The channel to check
 * @returns true if the user can pin messages
 */
export function canUserPinInChannel(
  userRole: UserRole,
  isTeamManager: boolean,
  channelType: ChannelType
): boolean {
  // Important channel: only managers and oversight roles
  if (channelType === 'important') {
    return isTeamManager || OVERSIGHT_ROLES.includes(userRole);
  }

  // General and Substitutes: any team member can pin
  return true;
}

/**
 * Get the display name for a channel type
 */
export function getChannelDisplayName(channelType: ChannelType): string {
  const config = getChannelConfig(channelType);
  return config.name;
}

/**
 * Get message explaining why posting is restricted
 */
export function getPostingRestrictionMessage(channelType: ChannelType): string | null {
  if (channelType === 'important') {
    return 'Only team managers can post in the Important channel.';
  }
  return null;
}

// =============================================================================
// Type Exports
// =============================================================================

export type { ChannelType, ChannelConfig };
