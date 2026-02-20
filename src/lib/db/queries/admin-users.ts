/**
 * Admin Users/Players Queries
 * Query functions for admin user and player management
 * Uses PostgreSQL database for persistence
 */

import { query, getClient } from '@/lib/db/client';
import type {
  UserRole,
  FieldPosition,
  BattingSide,
  ThrowingArm,
} from '@/types';

// =============================================================================
// STATIC TEAM DATA
// =============================================================================

/**
 * Static teams data - these never change
 * Used for display and mapping team slugs to database team IDs
 */
export const mockTeams = [
  {
    id: 'rays',
    name: 'Rays',
    abbreviation: 'RAY',
    primaryColor: '#092C5C',
    secondaryColor: '#8FBCE6',
  },
  {
    id: 'pirates',
    name: 'Pirates',
    abbreviation: 'PIR',
    primaryColor: '#27251F',
    secondaryColor: '#FDB827',
  },
  {
    id: 'athletics',
    name: 'Athletics',
    abbreviation: 'ATH',
    primaryColor: '#003831',
    secondaryColor: '#EFB21E',
  },
  {
    id: 'mariners',
    name: 'Mariners',
    abbreviation: 'MAR',
    primaryColor: '#0C2C56',
    secondaryColor: '#005C5C',
  },
  {
    id: 'rockies',
    name: 'Rockies',
    abbreviation: 'ROC',
    primaryColor: '#33006F',
    secondaryColor: '#C4CED4',
  },
  {
    id: 'diamondbacks',
    name: 'Diamondbacks',
    abbreviation: 'DBK',
    primaryColor: '#A71930',
    secondaryColor: '#E3D4AD',
  },
];

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
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely convert a date value to ISO string
 * PostgreSQL returns dates as strings, but sometimes as Date objects
 */
function toISOString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * Get the database team ID from a team slug (like 'athletics')
 * Uses case-insensitive matching on team name
 */
async function getDbTeamId(teamSlug: string): Promise<string | null> {
  try {
    // First try to find by name (case-insensitive)
    const staticTeam = mockTeams.find((t) => t.id === teamSlug);
    if (!staticTeam) return null;

    const result = await query<{ id: string }>(
      `SELECT id FROM teams WHERE LOWER(name) = LOWER($1) AND is_active = true LIMIT 1`,
      [staticTeam.name]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // If not found by name, try by abbreviation
    const resultByAbbr = await query<{ id: string }>(
      `SELECT id FROM teams WHERE LOWER(abbreviation) = LOWER($1) AND is_active = true LIMIT 1`,
      [staticTeam.abbreviation]
    );

    return resultByAbbr.rows.length > 0 ? resultByAbbr.rows[0].id : null;
  } catch (error) {
    console.error('[AdminUsers] Error getting DB team ID:', error);
    return null;
  }
}

/**
 * Get the static team slug from a database team (by name matching)
 */
function getStaticTeamByName(teamName: string): (typeof mockTeams)[0] | null {
  return (
    mockTeams.find(
      (t) => t.name.toLowerCase() === teamName.toLowerCase()
    ) || null
  );
}

/**
 * Get the current active season ID
 */
async function getActiveSeasonId(): Promise<string | null> {
  try {
    const result = await query<{ id: string }>(
      `SELECT id FROM seasons WHERE is_active = true LIMIT 1`
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error('[AdminUsers] Error getting active season:', error);
    return null;
  }
}

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
  try {
    // Build the base query
    let queryText = `
      SELECT
        u.id,
        u.email,
        u.full_name as "fullName",
        u.phone,
        u.avatar_url as "avatarUrl",
        u.role,
        u.is_active as "isActive",
        u.created_at as "createdAt",
        p.id as "playerId",
        t.name as "teamName",
        t.abbreviation as "teamAbbreviation",
        t.primary_color as "teamPrimaryColor",
        p.jersey_number as "jerseyNumber",
        p.primary_position as "primaryPosition",
        p.secondary_position as "secondaryPosition",
        p.bats,
        p.throws,
        p.is_captain as "isCaptain"
      FROM users u
      LEFT JOIN players p ON p.user_id = u.id AND p.is_active = true
      LEFT JOIN teams t ON t.id = p.team_id
    `;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Filter by search term
    if (options.search) {
      conditions.push(
        `(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      );
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    // Filter by role
    if (options.role) {
      conditions.push(`u.role = $${paramIndex}`);
      params.push(options.role);
      paramIndex++;
    }

    // Filter by team (using team name matching)
    if (options.teamId) {
      const staticTeam = mockTeams.find((t) => t.id === options.teamId);
      if (staticTeam) {
        conditions.push(`LOWER(t.name) = LOWER($${paramIndex})`);
        params.push(staticTeam.name);
        paramIndex++;
      }
    }

    // Filter by assignment status
    if (options.assignmentStatus === 'assigned') {
      conditions.push(`p.id IS NOT NULL`);
    } else if (options.assignmentStatus === 'unassigned') {
      conditions.push(`p.id IS NULL`);
    }

    // Filter by active status
    if (options.isActive !== undefined) {
      conditions.push(`u.is_active = $${paramIndex}`);
      params.push(options.isActive);
      paramIndex++;
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Sorting
    const sortDir = options.sortDir === 'desc' ? 'DESC' : 'ASC';
    let orderBy = 'u.full_name';
    if (options.sortBy === 'email') {
      orderBy = 'u.email';
    } else if (options.sortBy === 'team') {
      orderBy = `COALESCE(t.name, 'ZZZZZ')`; // Put unassigned at end
    } else if (options.sortBy === 'createdAt') {
      orderBy = 'u.created_at';
    }
    queryText += ` ORDER BY ${orderBy} ${sortDir}`;

    // Get total count first
    const countQuery = queryText.replace(
      /SELECT[\s\S]*?FROM users u/,
      'SELECT COUNT(*) as count FROM users u'
    );
    // Remove ORDER BY clause from count query
    const countQueryClean = countQuery.replace(/ORDER BY[\s\S]*$/, '');
    const countResult = await query<{ count: string }>(countQueryClean, params);
    const totalCount = parseInt(countResult.rows[0]?.count || '0', 10);

    // Pagination
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await query<{
      id: string;
      email: string;
      fullName: string;
      phone: string | null;
      avatarUrl: string | null;
      role: UserRole;
      isActive: boolean;
      createdAt: string;
      playerId: string | null;
      teamName: string | null;
      teamAbbreviation: string | null;
      teamPrimaryColor: string | null;
      jerseyNumber: string | null;
      primaryPosition: FieldPosition | null;
      secondaryPosition: FieldPosition | null;
      bats: BattingSide | null;
      throws: ThrowingArm | null;
      isCaptain: boolean | null;
    }>(queryText, params);

    // Transform results to include static team ID
    const users: UserWithAssignment[] = result.rows.map((row) => {
      const staticTeam = row.teamName
        ? getStaticTeamByName(row.teamName)
        : null;

      return {
        id: row.id,
        email: row.email,
        fullName: row.fullName,
        phone: row.phone,
        avatarUrl: row.avatarUrl,
        role: row.role,
        isActive: row.isActive,
        createdAt: toISOString(row.createdAt),
        playerId: row.playerId,
        teamId: staticTeam?.id || null,
        teamName: row.teamName,
        teamAbbreviation: row.teamAbbreviation,
        teamPrimaryColor: row.teamPrimaryColor,
        jerseyNumber: row.jerseyNumber,
        primaryPosition: row.primaryPosition,
        secondaryPosition: row.secondaryPosition,
        bats: row.bats,
        throws: row.throws,
        isCaptain: row.isCaptain ?? false,
      };
    });

    return { users, totalCount };
  } catch (error) {
    console.error('[AdminUsers] Error getting users with assignments:', error);
    throw new Error('Failed to fetch users. Please try again later.');
  }
}

/**
 * Get a single user by ID with their assignment
 */
export async function getUserWithAssignment(
  userId: string
): Promise<UserWithAssignment | null> {
  try {
    const result = await query<{
      id: string;
      email: string;
      fullName: string;
      phone: string | null;
      avatarUrl: string | null;
      role: UserRole;
      isActive: boolean;
      createdAt: string;
      playerId: string | null;
      teamName: string | null;
      teamAbbreviation: string | null;
      teamPrimaryColor: string | null;
      jerseyNumber: string | null;
      primaryPosition: FieldPosition | null;
      secondaryPosition: FieldPosition | null;
      bats: BattingSide | null;
      throws: ThrowingArm | null;
      isCaptain: boolean | null;
    }>(
      `
      SELECT
        u.id,
        u.email,
        u.full_name as "fullName",
        u.phone,
        u.avatar_url as "avatarUrl",
        u.role,
        u.is_active as "isActive",
        u.created_at as "createdAt",
        p.id as "playerId",
        t.name as "teamName",
        t.abbreviation as "teamAbbreviation",
        t.primary_color as "teamPrimaryColor",
        p.jersey_number as "jerseyNumber",
        p.primary_position as "primaryPosition",
        p.secondary_position as "secondaryPosition",
        p.bats,
        p.throws,
        p.is_captain as "isCaptain"
      FROM users u
      LEFT JOIN players p ON p.user_id = u.id AND p.is_active = true
      LEFT JOIN teams t ON t.id = p.team_id
      WHERE u.id = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const staticTeam = row.teamName ? getStaticTeamByName(row.teamName) : null;

    return {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      role: row.role,
      isActive: row.isActive,
      createdAt: toISOString(row.createdAt),
      playerId: row.playerId,
      teamId: staticTeam?.id || null,
      teamName: row.teamName,
      teamAbbreviation: row.teamAbbreviation,
      teamPrimaryColor: row.teamPrimaryColor,
      jerseyNumber: row.jerseyNumber,
      primaryPosition: row.primaryPosition,
      secondaryPosition: row.secondaryPosition,
      bats: row.bats,
      throws: row.throws,
      isCaptain: row.isCaptain ?? false,
    };
  } catch (error) {
    console.error('[AdminUsers] Error getting user with assignment:', error);
    throw new Error('Failed to fetch user. Please try again later.');
  }
}

/**
 * Get a player by ID with full details
 */
export async function getPlayerById(
  playerId: string
): Promise<PlayerWithDetails | null> {
  try {
    const result = await query<{
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
      userFullName: string;
      userEmail: string;
      userAvatarUrl: string | null;
      userRole: UserRole;
      teamName: string;
      teamAbbreviation: string;
      teamPrimaryColor: string | null;
    }>(
      `
      SELECT
        p.id,
        p.user_id as "userId",
        p.team_id as "teamId",
        p.season_id as "seasonId",
        p.jersey_number as "jerseyNumber",
        p.primary_position as "primaryPosition",
        p.secondary_position as "secondaryPosition",
        p.bats,
        p.throws,
        p.is_active as "isActive",
        p.is_captain as "isCaptain",
        p.joined_at as "joinedAt",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        u.full_name as "userFullName",
        u.email as "userEmail",
        u.avatar_url as "userAvatarUrl",
        u.role as "userRole",
        t.name as "teamName",
        t.abbreviation as "teamAbbreviation",
        t.primary_color as "teamPrimaryColor"
      FROM players p
      JOIN users u ON u.id = p.user_id
      JOIN teams t ON t.id = p.team_id
      WHERE p.id = $1
    `,
      [playerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const staticTeam = getStaticTeamByName(row.teamName);

    return {
      id: row.id,
      userId: row.userId,
      teamId: staticTeam?.id || row.teamId,
      seasonId: row.seasonId,
      jerseyNumber: row.jerseyNumber,
      primaryPosition: row.primaryPosition,
      secondaryPosition: row.secondaryPosition,
      bats: row.bats,
      throws: row.throws,
      isActive: row.isActive,
      isCaptain: row.isCaptain,
      joinedAt: toISOString(row.joinedAt),
      createdAt: toISOString(row.createdAt),
      updatedAt: toISOString(row.updatedAt),
      user: {
        id: row.userId,
        fullName: row.userFullName,
        email: row.userEmail,
        avatarUrl: row.userAvatarUrl,
        role: row.userRole,
      },
      team: {
        id: staticTeam?.id || row.teamId,
        name: row.teamName,
        abbreviation: row.teamAbbreviation,
        primaryColor: row.teamPrimaryColor,
      },
    };
  } catch (error) {
    console.error('[AdminUsers] Error getting player by ID:', error);
    throw new Error('Failed to fetch player. Please try again later.');
  }
}

/**
 * Assign a user to a team (create player record)
 */
export async function assignPlayerToTeam(
  input: AssignPlayerInput
): Promise<PlayerWithDetails> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get the database team ID from the slug
    const dbTeamId = await getDbTeamId(input.teamId);
    if (!dbTeamId) {
      throw new Error('Team not found');
    }

    // Check if user exists
    const userResult = await client.query<{
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
      role: UserRole;
    }>('SELECT id, full_name, email, avatar_url, role FROM users WHERE id = $1', [
      input.userId,
    ]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get team info
    const teamResult = await client.query<{
      id: string;
      name: string;
      abbreviation: string;
      primary_color: string | null;
    }>('SELECT id, name, abbreviation, primary_color FROM teams WHERE id = $1', [
      dbTeamId,
    ]);

    if (teamResult.rows.length === 0) {
      throw new Error('Team not found');
    }

    const team = teamResult.rows[0];
    const staticTeam = getStaticTeamByName(team.name);

    // Check if user is already assigned to a team in this season
    const existingResult = await client.query(
      `SELECT id FROM players
       WHERE user_id = $1 AND is_active = true`,
      [input.userId]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('User is already assigned to a team. Remove them first.');
    }

    // Check for duplicate jersey number on the team
    const duplicateResult = await client.query(
      `SELECT id FROM players
       WHERE team_id = $1 AND jersey_number = $2 AND is_active = true`,
      [dbTeamId, input.jerseyNumber]
    );

    if (duplicateResult.rows.length > 0) {
      throw new Error(
        `Jersey number ${input.jerseyNumber} is already taken on this team`
      );
    }

    // Get active season ID
    let seasonId: string | undefined = input.seasonId;
    if (!seasonId) {
      const activeSeasonId = await getActiveSeasonId();
      if (!activeSeasonId) {
        throw new Error('No active season found');
      }
      seasonId = activeSeasonId;
    }

    // Create new player assignment
    const insertResult = await client.query<{
      id: string;
      user_id: string;
      team_id: string;
      season_id: string;
      jersey_number: string | null;
      primary_position: FieldPosition;
      secondary_position: FieldPosition | null;
      bats: BattingSide;
      throws: ThrowingArm;
      is_active: boolean;
      is_captain: boolean;
      joined_at: string;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO players (
        user_id, team_id, season_id, jersey_number,
        primary_position, secondary_position, bats, throws,
        is_active, is_captain
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
      RETURNING
        id, user_id, team_id, season_id, jersey_number,
        primary_position, secondary_position, bats, throws,
        is_active, is_captain, joined_at, created_at, updated_at`,
      [
        input.userId,
        dbTeamId,
        seasonId,
        input.jerseyNumber,
        input.primaryPosition,
        input.secondaryPosition || null,
        input.bats,
        input.throws,
        input.isCaptain || false,
      ]
    );

    await client.query('COMMIT');

    const player = insertResult.rows[0];

    return {
      id: player.id,
      userId: player.user_id,
      teamId: staticTeam?.id || input.teamId,
      seasonId: player.season_id,
      jerseyNumber: player.jersey_number,
      primaryPosition: player.primary_position,
      secondaryPosition: player.secondary_position,
      bats: player.bats,
      throws: player.throws,
      isActive: player.is_active,
      isCaptain: player.is_captain,
      joinedAt: toISOString(player.joined_at),
      createdAt: toISOString(player.created_at),
      updatedAt: toISOString(player.updated_at),
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        avatarUrl: user.avatar_url,
        role: user.role,
      },
      team: {
        id: staticTeam?.id || input.teamId,
        name: team.name,
        abbreviation: team.abbreviation,
        primaryColor: team.primary_color,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[AdminUsers] Error assigning player to team:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to assign player to team. Please try again later.');
  } finally {
    client.release();
  }
}

/**
 * Update a player's assignment details
 */
export async function updatePlayerAssignment(
  playerId: string,
  updates: UpdatePlayerInput
): Promise<PlayerWithDetails> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get current player info
    const playerResult = await client.query<{
      id: string;
      user_id: string;
      team_id: string;
      season_id: string;
      jersey_number: string | null;
      primary_position: FieldPosition;
      secondary_position: FieldPosition | null;
      bats: BattingSide;
      throws: ThrowingArm;
      is_active: boolean;
      is_captain: boolean;
    }>(
      `SELECT id, user_id, team_id, season_id, jersey_number,
              primary_position, secondary_position, bats, throws,
              is_active, is_captain
       FROM players WHERE id = $1`,
      [playerId]
    );

    if (playerResult.rows.length === 0) {
      throw new Error('Player not found');
    }

    const currentPlayer = playerResult.rows[0];

    // Get the target team ID (either new team or current)
    let targetDbTeamId = currentPlayer.team_id;
    if (updates.teamId) {
      const newDbTeamId = await getDbTeamId(updates.teamId);
      if (!newDbTeamId) {
        throw new Error('Team not found');
      }
      targetDbTeamId = newDbTeamId;
    }

    // Check for duplicate jersey number if changing jersey or team
    if (updates.jerseyNumber || updates.teamId) {
      const targetJersey = updates.jerseyNumber || currentPlayer.jersey_number;
      const duplicateResult = await client.query(
        `SELECT id FROM players
         WHERE team_id = $1 AND jersey_number = $2 AND is_active = true AND id != $3`,
        [targetDbTeamId, targetJersey, playerId]
      );

      if (duplicateResult.rows.length > 0) {
        throw new Error(
          `Jersey number ${targetJersey} is already taken on this team`
        );
      }
    }

    // Build the update query dynamically
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (updates.teamId !== undefined) {
      setClauses.push(`team_id = $${paramIndex}`);
      params.push(targetDbTeamId);
      paramIndex++;
    }
    if (updates.jerseyNumber !== undefined) {
      setClauses.push(`jersey_number = $${paramIndex}`);
      params.push(updates.jerseyNumber);
      paramIndex++;
    }
    if (updates.primaryPosition !== undefined) {
      setClauses.push(`primary_position = $${paramIndex}`);
      params.push(updates.primaryPosition);
      paramIndex++;
    }
    if (updates.secondaryPosition !== undefined) {
      setClauses.push(`secondary_position = $${paramIndex}`);
      params.push(updates.secondaryPosition);
      paramIndex++;
    }
    if (updates.bats !== undefined) {
      setClauses.push(`bats = $${paramIndex}`);
      params.push(updates.bats);
      paramIndex++;
    }
    if (updates.throws !== undefined) {
      setClauses.push(`throws = $${paramIndex}`);
      params.push(updates.throws);
      paramIndex++;
    }
    if (updates.isCaptain !== undefined) {
      setClauses.push(`is_captain = $${paramIndex}`);
      params.push(updates.isCaptain);
      paramIndex++;
    }
    if (updates.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex}`);
      params.push(updates.isActive);
      paramIndex++;
    }

    // Add updated_at
    setClauses.push('updated_at = NOW()');

    // Add the player ID as the last parameter
    params.push(playerId);

    const updateResult = await client.query<{
      id: string;
      user_id: string;
      team_id: string;
      season_id: string;
      jersey_number: string | null;
      primary_position: FieldPosition;
      secondary_position: FieldPosition | null;
      bats: BattingSide;
      throws: ThrowingArm;
      is_active: boolean;
      is_captain: boolean;
      joined_at: string;
      created_at: string;
      updated_at: string;
    }>(
      `UPDATE players SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, user_id, team_id, season_id, jersey_number,
                 primary_position, secondary_position, bats, throws,
                 is_active, is_captain, joined_at, created_at, updated_at`,
      params
    );

    // Get user info
    const userResult = await client.query<{
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
      role: UserRole;
    }>(
      'SELECT id, full_name, email, avatar_url, role FROM users WHERE id = $1',
      [currentPlayer.user_id]
    );

    // Get team info
    const teamResult = await client.query<{
      id: string;
      name: string;
      abbreviation: string;
      primary_color: string | null;
    }>(
      'SELECT id, name, abbreviation, primary_color FROM teams WHERE id = $1',
      [targetDbTeamId]
    );

    await client.query('COMMIT');

    const player = updateResult.rows[0];
    const user = userResult.rows[0];
    const team = teamResult.rows[0];
    const staticTeam = getStaticTeamByName(team.name);

    return {
      id: player.id,
      userId: player.user_id,
      teamId: staticTeam?.id || updates.teamId || mockTeams[0].id,
      seasonId: player.season_id,
      jerseyNumber: player.jersey_number,
      primaryPosition: player.primary_position,
      secondaryPosition: player.secondary_position,
      bats: player.bats,
      throws: player.throws,
      isActive: player.is_active,
      isCaptain: player.is_captain,
      joinedAt: toISOString(player.joined_at),
      createdAt: toISOString(player.created_at),
      updatedAt: toISOString(player.updated_at),
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        avatarUrl: user.avatar_url,
        role: user.role,
      },
      team: {
        id: staticTeam?.id || team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        primaryColor: team.primary_color,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[AdminUsers] Error updating player assignment:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update player. Please try again later.');
  } finally {
    client.release();
  }
}

/**
 * Remove a player from their team (soft delete - sets isActive to false)
 */
export async function removePlayerFromTeam(playerId: string): Promise<void> {
  try {
    // Check if player exists and is active
    const checkResult = await query<{ is_active: boolean }>(
      'SELECT is_active FROM players WHERE id = $1',
      [playerId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Player not found');
    }

    if (!checkResult.rows[0].is_active) {
      throw new Error('Player is already removed from their team');
    }

    // Soft delete by setting is_active to false
    await query(
      `UPDATE players SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [playerId]
    );
  } catch (error) {
    console.error('[AdminUsers] Error removing player from team:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to remove player. Please try again later.');
  }
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
  try {
    const result = await query<{
      name: string;
      abbreviation: string;
      primary_color: string | null;
      player_count: string;
    }>(
      `SELECT
        t.name,
        t.abbreviation,
        t.primary_color,
        COUNT(p.id) FILTER (WHERE p.is_active = true) as player_count
      FROM teams t
      LEFT JOIN players p ON p.team_id = t.id
      WHERE t.is_active = true
      GROUP BY t.id, t.name, t.abbreviation, t.primary_color
      ORDER BY t.name`
    );

    // Map to static teams
    return mockTeams.map((staticTeam) => {
      const dbTeam = result.rows.find(
        (r) => r.name.toLowerCase() === staticTeam.name.toLowerCase()
      );
      return {
        id: staticTeam.id,
        name: staticTeam.name,
        abbreviation: staticTeam.abbreviation,
        primaryColor: staticTeam.primaryColor,
        playerCount: parseInt(dbTeam?.player_count || '0', 10),
      };
    });
  } catch (error) {
    console.error('[AdminUsers] Error getting teams for assignment:', error);
    // Fallback to static teams with 0 players
    return mockTeams.map((team) => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      primaryColor: team.primaryColor,
      playerCount: 0,
    }));
  }
}

/**
 * Check if a jersey number is available for a team
 */
export async function isJerseyNumberAvailable(
  teamId: string,
  jerseyNumber: string,
  excludePlayerId?: string
): Promise<boolean> {
  try {
    const dbTeamId = await getDbTeamId(teamId);
    if (!dbTeamId) {
      return false;
    }

    let queryText = `
      SELECT id FROM players
      WHERE team_id = $1 AND jersey_number = $2 AND is_active = true
    `;
    const params: unknown[] = [dbTeamId, jerseyNumber];

    if (excludePlayerId) {
      queryText += ' AND id != $3';
      params.push(excludePlayerId);
    }

    const result = await query(queryText, params);
    return result.rows.length === 0;
  } catch (error) {
    console.error('[AdminUsers] Error checking jersey availability:', error);
    return false;
  }
}

/**
 * Player contact info for team directory
 */
export interface PlayerContactInfo {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition | null;
  isCaptain: boolean;
}

/**
 * Team with player roster for directory
 */
export interface TeamWithRoster {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  players: PlayerContactInfo[];
}

/**
 * Get all teams with their player rosters for the team directory
 */
export async function getAllTeamsWithRosters(): Promise<TeamWithRoster[]> {
  try {
    const result = await query<{
      teamName: string;
      playerId: string;
      userFullName: string;
      userEmail: string;
      userPhone: string | null;
      userAvatarUrl: string | null;
      jerseyNumber: string | null;
      primaryPosition: FieldPosition | null;
      isCaptain: boolean;
    }>(
      `SELECT
        t.name as "teamName",
        p.id as "playerId",
        u.full_name as "userFullName",
        u.email as "userEmail",
        u.phone as "userPhone",
        u.avatar_url as "userAvatarUrl",
        p.jersey_number as "jerseyNumber",
        p.primary_position as "primaryPosition",
        p.is_captain as "isCaptain"
      FROM teams t
      LEFT JOIN players p ON p.team_id = t.id AND p.is_active = true
      LEFT JOIN users u ON u.id = p.user_id
      WHERE t.is_active = true
      ORDER BY t.name, p.is_captain DESC, u.full_name`
    );

    // Group by team
    const teamMap = new Map<
      string,
      { staticTeam: (typeof mockTeams)[0]; players: PlayerContactInfo[] }
    >();

    // Initialize all teams with empty player arrays
    for (const staticTeam of mockTeams) {
      teamMap.set(staticTeam.name.toLowerCase(), {
        staticTeam,
        players: [],
      });
    }

    // Add players to their teams
    for (const row of result.rows) {
      const teamData = teamMap.get(row.teamName.toLowerCase());
      if (teamData && row.playerId) {
        teamData.players.push({
          id: row.playerId,
          fullName: row.userFullName,
          email: row.userEmail,
          phone: row.userPhone,
          avatarUrl: row.userAvatarUrl,
          jerseyNumber: row.jerseyNumber,
          primaryPosition: row.primaryPosition,
          isCaptain: row.isCaptain,
        });
      }
    }

    // Convert to array
    return mockTeams.map((staticTeam) => {
      const teamData = teamMap.get(staticTeam.name.toLowerCase());
      return {
        id: staticTeam.id,
        name: staticTeam.name,
        abbreviation: staticTeam.abbreviation,
        primaryColor: staticTeam.primaryColor,
        secondaryColor: staticTeam.secondaryColor,
        players: teamData?.players || [],
      };
    });
  } catch (error) {
    console.error('[AdminUsers] Error getting teams with rosters:', error);
    // Fallback to static teams with empty rosters
    return mockTeams.map((team) => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      players: [],
    }));
  }
}
