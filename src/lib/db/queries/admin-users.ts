/**
 * Admin Users/Players Queries
 * Query functions for admin user and player management
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { teams as mockTeams } from '@/lib/mock-data';
import type {
  User,
  Player,
  Team,
  UserRole,
  FieldPosition,
  BattingSide,
  ThrowingArm,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * User with their player assignment details (if any)
 */
export interface UserWithAssignment {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  // Player assignment info (null if not assigned to a team)
  playerId: string | null;
  teamId: string | null;
  teamName: string | null;
  teamAbbreviation: string | null;
  teamPrimaryColor: string | null;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition | null;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide | null;
  throws: ThrowingArm | null;
  isCaptain: boolean;
}

export interface GetUsersWithAssignmentsOptions {
  search?: string;
  role?: UserRole;
  teamId?: string;
  assignmentStatus?: 'assigned' | 'unassigned' | 'all';
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'email' | 'team' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface AssignPlayerInput {
  userId: string;
  teamId: string;
  jerseyNumber: string;
  primaryPosition: FieldPosition;
  secondaryPosition?: FieldPosition | null;
  bats: BattingSide;
  throws: ThrowingArm;
  isCaptain?: boolean;
  seasonId?: string;
}

export interface UpdatePlayerInput {
  teamId?: string;
  jerseyNumber?: string;
  primaryPosition?: FieldPosition;
  secondaryPosition?: FieldPosition | null;
  bats?: BattingSide;
  throws?: ThrowingArm;
  isCaptain?: boolean;
  isActive?: boolean;
}

export interface PlayerWithDetails {
  id: string;
  userId: string;
  teamId: string;
  seasonId: string;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide;
  throws: ThrowingArm;
  isActive: boolean;
  isCaptain: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: UserRole;
  };
  team: {
    id: string;
    name: string;
    abbreviation: string;
    primaryColor: string | null;
  };
}

// =============================================================================
// MOCK DATA
// =============================================================================

// Mock users data - will be replaced with database queries
const mockUsers: Array<{
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}> = [
  { id: 'user-001', email: 'ben.douglas@email.com', fullName: 'Ben Douglas', phone: '555-0101', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-01-15T00:00:00Z' },
  { id: 'user-002', email: 'keegan.taylor@email.com', fullName: 'Keegan Taylor', phone: '555-0102', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-01-20T00:00:00Z' },
  { id: 'user-003', email: 'jesse.hill@email.com', fullName: 'Jesse Hill', phone: '555-0103', avatarUrl: null, role: 'manager', isActive: true, createdAt: '2024-02-01T00:00:00Z' },
  { id: 'user-004', email: 'ryan.costa@email.com', fullName: 'Ryan Costa', phone: '555-0104', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-02-10T00:00:00Z' },
  { id: 'user-005', email: 'dave.nieves@email.com', fullName: 'Dave Nieves', phone: '555-0105', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-02-15T00:00:00Z' },
  { id: 'user-006', email: 'eddie.brown@email.com', fullName: 'Eddie Brown', phone: '555-0106', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-03-01T00:00:00Z' },
  { id: 'user-007', email: 'jj.brigham@email.com', fullName: 'JJ Brigham', phone: '555-0107', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-03-05T00:00:00Z' },
  { id: 'user-008', email: 'drew.marcotte@email.com', fullName: 'Drew Marcotte', phone: '555-0108', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-03-10T00:00:00Z' },
  { id: 'user-009', email: 'john.smith@email.com', fullName: 'John Smith', phone: '555-0109', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-03-15T00:00:00Z' },
  { id: 'user-010', email: 'mike.johnson@email.com', fullName: 'Mike Johnson', phone: '555-0110', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-03-20T00:00:00Z' },
  { id: 'user-011', email: 'tom.wilson@email.com', fullName: 'Tom Wilson', phone: '555-0111', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-03-25T00:00:00Z' },
  { id: 'user-012', email: 'chris.davis@email.com', fullName: 'Chris Davis', phone: '555-0112', avatarUrl: null, role: 'player', isActive: true, createdAt: '2024-04-01T00:00:00Z' },
  { id: 'user-013', email: 'james.martinez@email.com', fullName: 'James Martinez', phone: '555-0113', avatarUrl: null, role: 'player', isActive: false, createdAt: '2024-04-05T00:00:00Z' },
  { id: 'user-014', email: 'admin@cnebl.com', fullName: 'League Admin', phone: null, avatarUrl: null, role: 'admin', isActive: true, createdAt: '2023-01-01T00:00:00Z' },
  { id: 'user-015', email: 'commissioner@cnebl.com', fullName: 'Commissioner', phone: null, avatarUrl: null, role: 'commissioner', isActive: true, createdAt: '2023-01-01T00:00:00Z' },
];

// Mock player assignments (links users to teams)
const mockPlayers: Array<{
  id: string;
  userId: string;
  teamId: string;
  seasonId: string;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide;
  throws: ThrowingArm;
  isActive: boolean;
  isCaptain: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}> = [
  { id: 'player-001', userId: 'user-001', teamId: 'athletics', seasonId: 'season-2026', jerseyNumber: '7', primaryPosition: 'SS', secondaryPosition: '2B', bats: 'R', throws: 'R', isActive: true, isCaptain: true, joinedAt: '2024-01-15T00:00:00Z', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
  { id: 'player-002', userId: 'user-002', teamId: 'mariners', seasonId: 'season-2026', jerseyNumber: '21', primaryPosition: 'P', secondaryPosition: null, bats: 'L', throws: 'L', isActive: true, isCaptain: false, joinedAt: '2024-01-20T00:00:00Z', createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: 'player-003', userId: 'user-003', teamId: 'pirates', seasonId: 'season-2026', jerseyNumber: '12', primaryPosition: 'P', secondaryPosition: 'CF', bats: 'R', throws: 'R', isActive: true, isCaptain: true, joinedAt: '2024-02-01T00:00:00Z', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { id: 'player-004', userId: 'user-004', teamId: 'rays', seasonId: 'season-2026', jerseyNumber: '45', primaryPosition: 'P', secondaryPosition: null, bats: 'R', throws: 'R', isActive: true, isCaptain: false, joinedAt: '2024-02-10T00:00:00Z', createdAt: '2024-02-10T00:00:00Z', updatedAt: '2024-02-10T00:00:00Z' },
  { id: 'player-005', userId: 'user-005', teamId: 'athletics', seasonId: 'season-2026', jerseyNumber: '33', primaryPosition: 'P', secondaryPosition: 'LF', bats: 'S', throws: 'R', isActive: true, isCaptain: false, joinedAt: '2024-02-15T00:00:00Z', createdAt: '2024-02-15T00:00:00Z', updatedAt: '2024-02-15T00:00:00Z' },
  { id: 'player-006', userId: 'user-006', teamId: 'diamondbacks', seasonId: 'season-2026', jerseyNumber: '8', primaryPosition: 'P', secondaryPosition: null, bats: 'R', throws: 'R', isActive: true, isCaptain: false, joinedAt: '2024-03-01T00:00:00Z', createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
  { id: 'player-007', userId: 'user-007', teamId: 'rockies', seasonId: 'season-2026', jerseyNumber: '15', primaryPosition: 'P', secondaryPosition: '2B', bats: 'R', throws: 'R', isActive: true, isCaptain: false, joinedAt: '2024-03-05T00:00:00Z', createdAt: '2024-03-05T00:00:00Z', updatedAt: '2024-03-05T00:00:00Z' },
  { id: 'player-008', userId: 'user-008', teamId: 'mariners', seasonId: 'season-2026', jerseyNumber: '3', primaryPosition: 'C', secondaryPosition: 'P', bats: 'R', throws: 'R', isActive: true, isCaptain: true, joinedAt: '2024-03-10T00:00:00Z', createdAt: '2024-03-10T00:00:00Z', updatedAt: '2024-03-10T00:00:00Z' },
];

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all users with their team assignment information
 */
export async function getAllUsersWithAssignments(
  options: GetUsersWithAssignmentsOptions = {}
): Promise<{
  users: UserWithAssignment[];
  totalCount: number;
}> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Join users with their player assignments
  let users: UserWithAssignment[] = mockUsers.map((user) => {
    const playerAssignment = mockPlayers.find((p) => p.userId === user.id && p.isActive);
    const team = playerAssignment
      ? mockTeams.find((t) => t.id === playerAssignment.teamId)
      : null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      playerId: playerAssignment?.id || null,
      teamId: playerAssignment?.teamId || null,
      teamName: team?.name || null,
      teamAbbreviation: team?.abbreviation || null,
      teamPrimaryColor: team?.primaryColor || null,
      jerseyNumber: playerAssignment?.jerseyNumber || null,
      primaryPosition: playerAssignment?.primaryPosition || null,
      secondaryPosition: playerAssignment?.secondaryPosition || null,
      bats: playerAssignment?.bats || null,
      throws: playerAssignment?.throws || null,
      isCaptain: playerAssignment?.isCaptain || false,
    };
  });

  // Apply filters
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
    );
  }

  if (options.role) {
    users = users.filter((u) => u.role === options.role);
  }

  if (options.teamId) {
    users = users.filter((u) => u.teamId === options.teamId);
  }

  if (options.assignmentStatus === 'assigned') {
    users = users.filter((u) => u.teamId !== null);
  } else if (options.assignmentStatus === 'unassigned') {
    users = users.filter((u) => u.teamId === null);
  }

  if (options.isActive !== undefined) {
    users = users.filter((u) => u.isActive === options.isActive);
  }

  // Sort
  const sortDir = options.sortDir === 'desc' ? -1 : 1;
  if (options.sortBy === 'name') {
    users.sort((a, b) => a.fullName.localeCompare(b.fullName) * sortDir);
  } else if (options.sortBy === 'email') {
    users.sort((a, b) => a.email.localeCompare(b.email) * sortDir);
  } else if (options.sortBy === 'team') {
    users.sort((a, b) => {
      const aTeam = a.teamName || 'zzz'; // Put unassigned at end
      const bTeam = b.teamName || 'zzz';
      return aTeam.localeCompare(bTeam) * sortDir;
    });
  } else if (options.sortBy === 'createdAt') {
    users.sort(
      (a, b) =>
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortDir
    );
  } else {
    // Default sort by name
    users.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  const totalCount = users.length;

  // Pagination
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  const start = (page - 1) * pageSize;
  const paginated = users.slice(start, start + pageSize);

  return {
    users: paginated,
    totalCount,
  };
}

/**
 * Get a single user by ID with their assignment
 */
export async function getUserWithAssignment(userId: string): Promise<UserWithAssignment | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return null;

  const playerAssignment = mockPlayers.find((p) => p.userId === user.id && p.isActive);
  const team = playerAssignment
    ? mockTeams.find((t) => t.id === playerAssignment.teamId)
    : null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    playerId: playerAssignment?.id || null,
    teamId: playerAssignment?.teamId || null,
    teamName: team?.name || null,
    teamAbbreviation: team?.abbreviation || null,
    teamPrimaryColor: team?.primaryColor || null,
    jerseyNumber: playerAssignment?.jerseyNumber || null,
    primaryPosition: playerAssignment?.primaryPosition || null,
    secondaryPosition: playerAssignment?.secondaryPosition || null,
    bats: playerAssignment?.bats || null,
    throws: playerAssignment?.throws || null,
    isCaptain: playerAssignment?.isCaptain || false,
  };
}

/**
 * Get a player by ID with full details
 */
export async function getPlayerById(playerId: string): Promise<PlayerWithDetails | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const player = mockPlayers.find((p) => p.id === playerId);
  if (!player) return null;

  const user = mockUsers.find((u) => u.id === player.userId);
  const team = mockTeams.find((t) => t.id === player.teamId);

  if (!user || !team) return null;

  return {
    ...player,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    team: {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      primaryColor: team.primaryColor,
    },
  };
}

/**
 * Assign a user to a team (create player record)
 */
export async function assignPlayerToTeam(input: AssignPlayerInput): Promise<PlayerWithDetails> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Check if user exists
  const user = mockUsers.find((u) => u.id === input.userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if team exists
  const team = mockTeams.find((t) => t.id === input.teamId);
  if (!team) {
    throw new Error('Team not found');
  }

  // Check if user is already assigned to a team in this season
  const existingAssignment = mockPlayers.find(
    (p) => p.userId === input.userId && p.isActive
  );
  if (existingAssignment) {
    throw new Error('User is already assigned to a team. Remove them first.');
  }

  // Check for duplicate jersey number on the team
  const duplicateJersey = mockPlayers.find(
    (p) => p.teamId === input.teamId && p.jerseyNumber === input.jerseyNumber && p.isActive
  );
  if (duplicateJersey) {
    throw new Error(`Jersey number ${input.jerseyNumber} is already taken on this team`);
  }

  // Create new player assignment
  const now = new Date().toISOString();
  const newPlayer = {
    id: `player-${Date.now()}`,
    userId: input.userId,
    teamId: input.teamId,
    seasonId: input.seasonId || 'season-2026',
    jerseyNumber: input.jerseyNumber,
    primaryPosition: input.primaryPosition,
    secondaryPosition: input.secondaryPosition || null,
    bats: input.bats,
    throws: input.throws,
    isActive: true,
    isCaptain: input.isCaptain || false,
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // In production, this would insert into the database
  // For mock, we could add to the array but it won't persist

  return {
    ...newPlayer,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    team: {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      primaryColor: team.primaryColor,
    },
  };
}

/**
 * Update a player's assignment details
 */
export async function updatePlayerAssignment(
  playerId: string,
  updates: UpdatePlayerInput
): Promise<PlayerWithDetails> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const player = mockPlayers.find((p) => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  const user = mockUsers.find((u) => u.id === player.userId);
  if (!user) {
    throw new Error('User not found');
  }

  // If changing team, verify the new team exists
  let team = mockTeams.find((t) => t.id === player.teamId);
  if (updates.teamId) {
    const newTeam = mockTeams.find((t) => t.id === updates.teamId);
    if (!newTeam) {
      throw new Error('Team not found');
    }
    team = newTeam;
  }

  if (!team) {
    throw new Error('Team not found');
  }

  // Check for duplicate jersey number if changing jersey or team
  if (updates.jerseyNumber || updates.teamId) {
    const targetTeamId = updates.teamId || player.teamId;
    const targetJersey = updates.jerseyNumber || player.jerseyNumber;
    const duplicateJersey = mockPlayers.find(
      (p) =>
        p.id !== playerId &&
        p.teamId === targetTeamId &&
        p.jerseyNumber === targetJersey &&
        p.isActive
    );
    if (duplicateJersey) {
      throw new Error(`Jersey number ${targetJersey} is already taken on this team`);
    }
  }

  // Build updated player (in production, this would update the database)
  const updatedPlayer = {
    ...player,
    teamId: updates.teamId ?? player.teamId,
    jerseyNumber: updates.jerseyNumber ?? player.jerseyNumber,
    primaryPosition: updates.primaryPosition ?? player.primaryPosition,
    secondaryPosition:
      updates.secondaryPosition !== undefined
        ? updates.secondaryPosition
        : player.secondaryPosition,
    bats: updates.bats ?? player.bats,
    throws: updates.throws ?? player.throws,
    isCaptain: updates.isCaptain ?? player.isCaptain,
    isActive: updates.isActive ?? player.isActive,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...updatedPlayer,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    team: {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      primaryColor: team.primaryColor,
    },
  };
}

/**
 * Remove a player from their team (soft delete - sets isActive to false)
 */
export async function removePlayerFromTeam(playerId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const player = mockPlayers.find((p) => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  if (!player.isActive) {
    throw new Error('Player is already removed from their team');
  }

  // In production, this would update the database to set isActive = false
  // For mock, we just simulate the operation
}

/**
 * Get teams available for player assignment
 */
export async function getTeamsForAssignment(): Promise<
  Array<{
    id: string;
    name: string;
    abbreviation: string;
    primaryColor: string;
    playerCount: number;
  }>
> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  return mockTeams.map((team) => ({
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    primaryColor: team.primaryColor,
    playerCount: mockPlayers.filter((p) => p.teamId === team.id && p.isActive).length,
  }));
}

/**
 * Check if a jersey number is available for a team
 */
export async function isJerseyNumberAvailable(
  teamId: string,
  jerseyNumber: string,
  excludePlayerId?: string
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const taken = mockPlayers.find(
    (p) =>
      p.teamId === teamId &&
      p.jerseyNumber === jerseyNumber &&
      p.isActive &&
      p.id !== excludePlayerId
  );

  return !taken;
}
