/**
 * CNEBL 2025 Season Data
 * Real statistics from the 2025 season
 */

export type GameStatus = "scheduled" | "in_progress" | "final" | "postponed" | "cancelled";

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  location: string;
  field: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  inning?: number;
  isTopInning?: boolean;
}

// 2025 Season Teams
export const teams: Team[] = [
  {
    id: "rays",
    name: "Rays",
    abbreviation: "RAY",
    primaryColor: "#092C5C",
    secondaryColor: "#8FBCE6",
  },
  {
    id: "pirates",
    name: "Pirates",
    abbreviation: "PIR",
    primaryColor: "#27251F",
    secondaryColor: "#FDB827",
  },
  {
    id: "athletics",
    name: "Athletics",
    abbreviation: "ATH",
    primaryColor: "#003831",
    secondaryColor: "#EFB21E",
  },
  {
    id: "mariners",
    name: "Mariners",
    abbreviation: "MAR",
    primaryColor: "#0C2C56",
    secondaryColor: "#005C5C",
  },
  {
    id: "rockies",
    name: "Rockies",
    abbreviation: "ROC",
    primaryColor: "#33006F",
    secondaryColor: "#C4CED4",
  },
  {
    id: "diamondbacks",
    name: "Diamondbacks",
    abbreviation: "DBK",
    primaryColor: "#A71930",
    secondaryColor: "#E3D4AD",
  },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id);
}

// Sample games for schedule display
export const mockGames: Game[] = [
  {
    id: "game-001",
    homeTeam: teams[0],
    awayTeam: teams[1],
    date: "2026-02-14",
    time: "14:00",
    location: "Leary Field",
    field: "Portsmouth",
    status: "final",
    homeScore: 7,
    awayScore: 3,
  },
  {
    id: "game-002",
    homeTeam: teams[2],
    awayTeam: teams[3],
    date: "2026-02-14",
    time: "17:00",
    location: "Leary Field",
    field: "Portsmouth",
    status: "final",
    homeScore: 5,
    awayScore: 6,
  },
  {
    id: "game-003",
    homeTeam: teams[4],
    awayTeam: teams[5],
    date: "2026-02-15",
    time: "13:00",
    location: "Leary Field",
    field: "Portsmouth",
    status: "final",
    homeScore: 2,
    awayScore: 4,
  },
  {
    id: "game-004",
    homeTeam: teams[1],
    awayTeam: teams[4],
    date: "2026-02-16",
    time: "14:00",
    location: "Leary Field",
    field: "Portsmouth",
    status: "in_progress",
    homeScore: 4,
    awayScore: 3,
    inning: 6,
    isTopInning: false,
  },
  {
    id: "game-005",
    homeTeam: teams[0],
    awayTeam: teams[3],
    date: "2026-02-16",
    time: "17:00",
    location: "Leary Field",
    field: "Portsmouth",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    id: "game-006",
    homeTeam: teams[5],
    awayTeam: teams[2],
    date: "2026-02-17",
    time: "14:00",
    location: "Leary Field",
    field: "Portsmouth",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
];

// Helper functions for filtering
export function getGamesByTeam(teamId: string): Game[] {
  return mockGames.filter(
    (game) => game.homeTeam.id === teamId || game.awayTeam.id === teamId
  );
}

export function getGamesByDateRange(startDate: Date, endDate: Date): Game[] {
  return mockGames.filter((game) => {
    const gameDate = new Date(game.date);
    return gameDate >= startDate && gameDate <= endDate;
  });
}

export function getGamesByMonth(year: number, month: number): Game[] {
  return mockGames.filter((game) => {
    const gameDate = new Date(game.date);
    return gameDate.getFullYear() === year && gameDate.getMonth() === month;
  });
}

export function getUpcomingGames(limit?: number): Game[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = mockGames
    .filter((game) => {
      const gameDate = new Date(game.date);
      return gameDate >= today && game.status !== "final";
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export function getLiveGames(): Game[] {
  return mockGames.filter((game) => game.status === "in_progress");
}

export function getRecentResults(limit?: number): Game[] {
  const results = mockGames
    .filter((game) => game.status === "final")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return limit ? results.slice(0, limit) : results;
}

// ============================================================================
// PLAYER STATISTICS - 2025 SEASON
// ============================================================================

export type Position = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH" | "OF" | "INF" | "UTIL" | "SP" | "RP";

export interface BattingStats {
  playerId: string;
  playerName: string;
  teamId: string;
  teamAbbr: string;
  position: Position;
  gamesPlayed: number;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  hitByPitch: number;
  stolenBases: number;
  caughtStealing: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface PitchingStats {
  playerId: string;
  playerName: string;
  teamId: string;
  teamAbbr: string;
  position: "P" | "SP" | "RP";
  gamesPlayed: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  saves: number;
  inningsPitched: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  hitBatters: number;
  completeGames: number;
  era: number;
  whip: number;
}

// 2025 Season Batting Statistics (83 players)
export const battingStats: BattingStats[] = [
  { playerId: "b1", playerName: "Ben Douglas", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 17, plateAppearances: 66, atBats: 57, runs: 25, hits: 34, doubles: 6, triples: 0, homeRuns: 2, rbi: 17, walks: 9, strikeouts: 1, hitByPitch: 0, stolenBases: 17, caughtStealing: 0, avg: 0.596, obp: 0.652, slg: 0.807, ops: 1.459 },
  { playerId: "b2", playerName: "Jordan Thivierge", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 11, plateAppearances: 38, atBats: 33, runs: 11, hits: 19, doubles: 6, triples: 0, homeRuns: 0, rbi: 13, walks: 4, strikeouts: 1, hitByPitch: 1, stolenBases: 2, caughtStealing: 0, avg: 0.576, obp: 0.632, slg: 0.758, ops: 1.389 },
  { playerId: "b3", playerName: "Dave Nieves", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 16, plateAppearances: 64, atBats: 52, runs: 18, hits: 29, doubles: 5, triples: 0, homeRuns: 2, rbi: 9, walks: 11, strikeouts: 6, hitByPitch: 1, stolenBases: 9, caughtStealing: 3, avg: 0.558, obp: 0.641, slg: 0.769, ops: 1.410 },
  { playerId: "b4", playerName: "Keegan Taylor", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 16, plateAppearances: 69, atBats: 57, runs: 33, hits: 31, doubles: 7, triples: 0, homeRuns: 2, rbi: 13, walks: 8, strikeouts: 1, hitByPitch: 4, stolenBases: 11, caughtStealing: 1, avg: 0.544, obp: 0.623, slg: 0.772, ops: 1.395 },
  { playerId: "b5", playerName: "David Giarusso", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 10, plateAppearances: 41, atBats: 31, runs: 11, hits: 16, doubles: 6, triples: 0, homeRuns: 0, rbi: 20, walks: 6, strikeouts: 4, hitByPitch: 3, stolenBases: 4, caughtStealing: 0, avg: 0.516, obp: 0.610, slg: 0.710, ops: 1.319 },
  { playerId: "b6", playerName: "David Lilly", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 12, plateAppearances: 47, atBats: 41, runs: 14, hits: 20, doubles: 5, triples: 0, homeRuns: 0, rbi: 9, walks: 4, strikeouts: 3, hitByPitch: 1, stolenBases: 2, caughtStealing: 0, avg: 0.488, obp: 0.532, slg: 0.610, ops: 1.142 },
  { playerId: "b7", playerName: "Sam Grattan", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 8, plateAppearances: 33, atBats: 29, runs: 14, hits: 14, doubles: 1, triples: 0, homeRuns: 0, rbi: 7, walks: 4, strikeouts: 3, hitByPitch: 0, stolenBases: 4, caughtStealing: 1, avg: 0.483, obp: 0.545, slg: 0.517, ops: 1.063 },
  { playerId: "b8", playerName: "Drew Marcotte", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 16, plateAppearances: 64, atBats: 56, runs: 14, hits: 25, doubles: 6, triples: 0, homeRuns: 3, rbi: 22, walks: 7, strikeouts: 8, hitByPitch: 1, stolenBases: 1, caughtStealing: 0, avg: 0.446, obp: 0.516, slg: 0.714, ops: 1.230 },
  { playerId: "b9", playerName: "Matt Baczewski", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 13, plateAppearances: 46, atBats: 39, runs: 11, hits: 17, doubles: 4, triples: 1, homeRuns: 0, rbi: 6, walks: 6, strikeouts: 3, hitByPitch: 1, stolenBases: 9, caughtStealing: 0, avg: 0.436, obp: 0.522, slg: 0.590, ops: 1.111 },
  { playerId: "b10", playerName: "Ari Alexenberg", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 17, plateAppearances: 66, atBats: 58, runs: 16, hits: 25, doubles: 5, triples: 1, homeRuns: 0, rbi: 20, walks: 6, strikeouts: 8, hitByPitch: 0, stolenBases: 6, caughtStealing: 0, avg: 0.431, obp: 0.470, slg: 0.552, ops: 1.021 },
  { playerId: "b11", playerName: "Curt Gebo", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 9, plateAppearances: 37, atBats: 33, runs: 14, hits: 14, doubles: 2, triples: 0, homeRuns: 0, rbi: 13, walks: 2, strikeouts: 3, hitByPitch: 2, stolenBases: 4, caughtStealing: 0, avg: 0.424, obp: 0.486, slg: 0.485, ops: 0.971 },
  { playerId: "b12", playerName: "Matt LoStocco", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 10, plateAppearances: 36, atBats: 33, runs: 8, hits: 14, doubles: 3, triples: 0, homeRuns: 0, rbi: 5, walks: 3, strikeouts: 7, hitByPitch: 0, stolenBases: 2, caughtStealing: 0, avg: 0.424, obp: 0.472, slg: 0.515, ops: 0.987 },
  { playerId: "b13", playerName: "Jesse Hill", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 17, plateAppearances: 67, atBats: 52, runs: 29, hits: 22, doubles: 5, triples: 1, homeRuns: 0, rbi: 3, walks: 10, strikeouts: 8, hitByPitch: 5, stolenBases: 30, caughtStealing: 0, avg: 0.423, obp: 0.552, slg: 0.558, ops: 1.110 },
  { playerId: "b14", playerName: "John Flannery", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 17, plateAppearances: 65, atBats: 58, runs: 16, hits: 24, doubles: 6, triples: 3, homeRuns: 0, rbi: 15, walks: 4, strikeouts: 9, hitByPitch: 3, stolenBases: 19, caughtStealing: 4, avg: 0.414, obp: 0.477, slg: 0.621, ops: 1.098 },
  { playerId: "b15", playerName: "Andrew Simpson", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 8, plateAppearances: 25, atBats: 22, runs: 2, hits: 9, doubles: 0, triples: 0, homeRuns: 0, rbi: 2, walks: 3, strikeouts: 4, hitByPitch: 0, stolenBases: 2, caughtStealing: 0, avg: 0.409, obp: 0.480, slg: 0.409, ops: 0.889 },
  { playerId: "b16", playerName: "Matt Morris", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 13, plateAppearances: 48, atBats: 45, runs: 5, hits: 18, doubles: 0, triples: 0, homeRuns: 0, rbi: 2, walks: 3, strikeouts: 11, hitByPitch: 0, stolenBases: 6, caughtStealing: 0, avg: 0.400, obp: 0.437, slg: 0.400, ops: 0.837 },
  { playerId: "b17", playerName: "Cam Duquette", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 9, plateAppearances: 33, atBats: 30, runs: 8, hits: 12, doubles: 0, triples: 0, homeRuns: 0, rbi: 3, walks: 3, strikeouts: 2, hitByPitch: 0, stolenBases: 12, caughtStealing: 1, avg: 0.400, obp: 0.455, slg: 0.400, ops: 0.855 },
  { playerId: "b18", playerName: "Elan Alexenberg", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 16, plateAppearances: 65, atBats: 64, runs: 17, hits: 25, doubles: 5, triples: 0, homeRuns: 0, rbi: 8, walks: 0, strikeouts: 11, hitByPitch: 1, stolenBases: 9, caughtStealing: 1, avg: 0.391, obp: 0.400, slg: 0.469, ops: 0.869 },
  { playerId: "b19", playerName: "Ryan Costa", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 16, plateAppearances: 63, atBats: 54, runs: 20, hits: 21, doubles: 3, triples: 0, homeRuns: 0, rbi: 11, walks: 9, strikeouts: 6, hitByPitch: 0, stolenBases: 11, caughtStealing: 0, avg: 0.389, obp: 0.476, slg: 0.444, ops: 0.921 },
  { playerId: "b20", playerName: "Jose Mercedes", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 16, plateAppearances: 61, atBats: 50, runs: 9, hits: 19, doubles: 2, triples: 0, homeRuns: 1, rbi: 17, walks: 8, strikeouts: 7, hitByPitch: 1, stolenBases: 5, caughtStealing: 0, avg: 0.380, obp: 0.459, slg: 0.480, ops: 0.939 },
  { playerId: "b21", playerName: "Willy Rincon", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 16, plateAppearances: 57, atBats: 43, runs: 9, hits: 16, doubles: 3, triples: 0, homeRuns: 0, rbi: 14, walks: 13, strikeouts: 10, hitByPitch: 0, stolenBases: 3, caughtStealing: 0, avg: 0.372, obp: 0.509, slg: 0.442, ops: 0.951 },
  { playerId: "b22", playerName: "Rich Blalock", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 15, plateAppearances: 60, atBats: 58, runs: 13, hits: 21, doubles: 5, triples: 0, homeRuns: 0, rbi: 14, walks: 2, strikeouts: 12, hitByPitch: 0, stolenBases: 6, caughtStealing: 0, avg: 0.362, obp: 0.383, slg: 0.448, ops: 0.832 },
  { playerId: "b23", playerName: "Max Imhoff", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 11, plateAppearances: 42, atBats: 39, runs: 11, hits: 14, doubles: 3, triples: 0, homeRuns: 0, rbi: 11, walks: 3, strikeouts: 6, hitByPitch: 0, stolenBases: 3, caughtStealing: 0, avg: 0.359, obp: 0.405, slg: 0.436, ops: 0.841 },
  { playerId: "b24", playerName: "Vinny Panetta-V", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 16, plateAppearances: 64, atBats: 45, runs: 17, hits: 16, doubles: 3, triples: 0, homeRuns: 0, rbi: 14, walks: 13, strikeouts: 11, hitByPitch: 1, stolenBases: 25, caughtStealing: 2, avg: 0.356, obp: 0.476, slg: 0.422, ops: 0.898 },
  { playerId: "b25", playerName: "Michael Sullivan", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 14, plateAppearances: 46, atBats: 37, runs: 9, hits: 13, doubles: 2, triples: 0, homeRuns: 0, rbi: 7, walks: 7, strikeouts: 6, hitByPitch: 1, stolenBases: 5, caughtStealing: 1, avg: 0.351, obp: 0.457, slg: 0.405, ops: 0.862 },
  { playerId: "b26", playerName: "David Liz", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 12, plateAppearances: 48, atBats: 40, runs: 7, hits: 14, doubles: 3, triples: 0, homeRuns: 1, rbi: 8, walks: 7, strikeouts: 6, hitByPitch: 0, stolenBases: 1, caughtStealing: 0, avg: 0.350, obp: 0.437, slg: 0.500, ops: 0.937 },
  { playerId: "b27", playerName: "Brian ODonnell", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 14, plateAppearances: 59, atBats: 54, runs: 17, hits: 18, doubles: 4, triples: 0, homeRuns: 0, rbi: 7, walks: 4, strikeouts: 9, hitByPitch: 1, stolenBases: 3, caughtStealing: 1, avg: 0.333, obp: 0.390, slg: 0.407, ops: 0.797 },
  { playerId: "b28", playerName: "Sam Arcand", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 14, plateAppearances: 52, atBats: 45, runs: 11, hits: 15, doubles: 3, triples: 0, homeRuns: 0, rbi: 8, walks: 5, strikeouts: 7, hitByPitch: 2, stolenBases: 6, caughtStealing: 0, avg: 0.333, obp: 0.423, slg: 0.400, ops: 0.823 },
  { playerId: "b29", playerName: "Brian Johnson", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 13, plateAppearances: 47, atBats: 42, runs: 10, hits: 14, doubles: 2, triples: 1, homeRuns: 0, rbi: 6, walks: 3, strikeouts: 5, hitByPitch: 1, stolenBases: 6, caughtStealing: 2, avg: 0.333, obp: 0.383, slg: 0.429, ops: 0.812 },
  { playerId: "b30", playerName: "Rob Thomas", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 14, plateAppearances: 53, atBats: 39, runs: 11, hits: 13, doubles: 2, triples: 0, homeRuns: 1, rbi: 9, walks: 9, strikeouts: 5, hitByPitch: 5, stolenBases: 1, caughtStealing: 0, avg: 0.333, obp: 0.509, slg: 0.462, ops: 0.971 },
  { playerId: "b31", playerName: "Alex Koulet", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 14, plateAppearances: 55, atBats: 49, runs: 16, hits: 16, doubles: 6, triples: 0, homeRuns: 0, rbi: 10, walks: 6, strikeouts: 6, hitByPitch: 0, stolenBases: 6, caughtStealing: 1, avg: 0.327, obp: 0.400, slg: 0.449, ops: 0.849 },
  { playerId: "b32", playerName: "Ryan Lantz", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 15, plateAppearances: 59, atBats: 49, runs: 15, hits: 16, doubles: 2, triples: 0, homeRuns: 0, rbi: 6, walks: 7, strikeouts: 4, hitByPitch: 3, stolenBases: 6, caughtStealing: 0, avg: 0.327, obp: 0.441, slg: 0.367, ops: 0.808 },
  { playerId: "b33", playerName: "Chase Stanley", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 12, plateAppearances: 50, atBats: 43, runs: 14, hits: 14, doubles: 5, triples: 0, homeRuns: 0, rbi: 5, walks: 5, strikeouts: 9, hitByPitch: 2, stolenBases: 7, caughtStealing: 1, avg: 0.326, obp: 0.420, slg: 0.442, ops: 0.862 },
  { playerId: "b34", playerName: "Troy Panetta-T", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 14, plateAppearances: 52, atBats: 37, runs: 8, hits: 12, doubles: 0, triples: 0, homeRuns: 0, rbi: 10, walks: 12, strikeouts: 7, hitByPitch: 1, stolenBases: 6, caughtStealing: 0, avg: 0.324, obp: 0.490, slg: 0.324, ops: 0.815 },
  { playerId: "b35", playerName: "Sean Fonteyne", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 13, plateAppearances: 54, atBats: 47, runs: 17, hits: 15, doubles: 1, triples: 0, homeRuns: 0, rbi: 5, walks: 6, strikeouts: 10, hitByPitch: 0, stolenBases: 10, caughtStealing: 0, avg: 0.319, obp: 0.389, slg: 0.340, ops: 0.729 },
  { playerId: "b36", playerName: "John Hebert", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 15, plateAppearances: 56, atBats: 47, runs: 3, hits: 15, doubles: 1, triples: 0, homeRuns: 0, rbi: 8, walks: 8, strikeouts: 12, hitByPitch: 1, stolenBases: 2, caughtStealing: 0, avg: 0.319, obp: 0.429, slg: 0.340, ops: 0.769 },
  { playerId: "b37", playerName: "Ryan Klink", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 11, plateAppearances: 50, atBats: 44, runs: 14, hits: 14, doubles: 0, triples: 0, homeRuns: 0, rbi: 3, walks: 5, strikeouts: 4, hitByPitch: 1, stolenBases: 11, caughtStealing: 1, avg: 0.318, obp: 0.400, slg: 0.318, ops: 0.718 },
  { playerId: "b38", playerName: "Thomas Miller", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 14, plateAppearances: 46, atBats: 35, runs: 10, hits: 11, doubles: 0, triples: 0, homeRuns: 0, rbi: 2, walks: 10, strikeouts: 7, hitByPitch: 0, stolenBases: 9, caughtStealing: 0, avg: 0.314, obp: 0.457, slg: 0.314, ops: 0.771 },
  { playerId: "b39", playerName: "Joey Grattan", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 14, plateAppearances: 59, atBats: 52, runs: 13, hits: 16, doubles: 2, triples: 0, homeRuns: 0, rbi: 11, walks: 5, strikeouts: 4, hitByPitch: 0, stolenBases: 2, caughtStealing: 0, avg: 0.308, obp: 0.356, slg: 0.346, ops: 0.702 },
  { playerId: "b40", playerName: "Joe Belakonis", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 17, plateAppearances: 66, atBats: 59, runs: 17, hits: 18, doubles: 5, triples: 0, homeRuns: 0, rbi: 18, walks: 4, strikeouts: 8, hitByPitch: 3, stolenBases: 7, caughtStealing: 0, avg: 0.305, obp: 0.379, slg: 0.390, ops: 0.769 },
  { playerId: "b41", playerName: "Paul Sonnet", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 11, plateAppearances: 37, atBats: 33, runs: 4, hits: 10, doubles: 2, triples: 0, homeRuns: 0, rbi: 4, walks: 3, strikeouts: 5, hitByPitch: 1, stolenBases: 1, caughtStealing: 0, avg: 0.303, obp: 0.378, slg: 0.364, ops: 0.742 },
  { playerId: "b42", playerName: "Paul Stanley", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 16, plateAppearances: 60, atBats: 50, runs: 12, hits: 15, doubles: 1, triples: 0, homeRuns: 0, rbi: 6, walks: 7, strikeouts: 8, hitByPitch: 2, stolenBases: 7, caughtStealing: 1, avg: 0.300, obp: 0.400, slg: 0.320, ops: 0.720 },
  { playerId: "b43", playerName: "Matt Gladu", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 13, plateAppearances: 53, atBats: 47, runs: 8, hits: 14, doubles: 1, triples: 0, homeRuns: 1, rbi: 12, walks: 4, strikeouts: 4, hitByPitch: 2, stolenBases: 2, caughtStealing: 0, avg: 0.298, obp: 0.377, slg: 0.383, ops: 0.760 },
  { playerId: "b44", playerName: "Joey Jones", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 13, plateAppearances: 50, atBats: 38, runs: 22, hits: 11, doubles: 2, triples: 0, homeRuns: 0, rbi: 4, walks: 11, strikeouts: 16, hitByPitch: 1, stolenBases: 13, caughtStealing: 0, avg: 0.289, obp: 0.460, slg: 0.342, ops: 0.802 },
  { playerId: "b45", playerName: "Jeff Perrault", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 14, plateAppearances: 50, atBats: 45, runs: 4, hits: 13, doubles: 3, triples: 0, homeRuns: 0, rbi: 7, walks: 4, strikeouts: 5, hitByPitch: 1, stolenBases: 1, caughtStealing: 1, avg: 0.289, obp: 0.360, slg: 0.356, ops: 0.716 },
  { playerId: "b46", playerName: "James Parkington", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 13, plateAppearances: 40, atBats: 28, runs: 4, hits: 8, doubles: 0, triples: 0, homeRuns: 0, rbi: 7, walks: 10, strikeouts: 8, hitByPitch: 1, stolenBases: 1, caughtStealing: 0, avg: 0.286, obp: 0.475, slg: 0.286, ops: 0.761 },
  { playerId: "b47", playerName: "JJ Brigham", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 15, plateAppearances: 51, atBats: 48, runs: 9, hits: 13, doubles: 3, triples: 0, homeRuns: 0, rbi: 5, walks: 2, strikeouts: 4, hitByPitch: 0, stolenBases: 5, caughtStealing: 0, avg: 0.271, obp: 0.294, slg: 0.333, ops: 0.627 },
  { playerId: "b48", playerName: "Craig Annis", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 15, plateAppearances: 44, atBats: 41, runs: 4, hits: 11, doubles: 1, triples: 0, homeRuns: 0, rbi: 4, walks: 3, strikeouts: 8, hitByPitch: 0, stolenBases: 0, caughtStealing: 0, avg: 0.268, obp: 0.318, slg: 0.293, ops: 0.611 },
  { playerId: "b49", playerName: "Sean OMalley", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 18, plateAppearances: 74, atBats: 69, runs: 14, hits: 18, doubles: 6, triples: 0, homeRuns: 1, rbi: 18, walks: 3, strikeouts: 13, hitByPitch: 1, stolenBases: 4, caughtStealing: 0, avg: 0.261, obp: 0.297, slg: 0.391, ops: 0.689 },
  { playerId: "b50", playerName: "Scott Coleman", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 16, plateAppearances: 59, atBats: 50, runs: 7, hits: 13, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 7, strikeouts: 15, hitByPitch: 1, stolenBases: 10, caughtStealing: 2, avg: 0.260, obp: 0.362, slg: 0.260, ops: 0.622 },
  { playerId: "b51", playerName: "Jonathan St. Pierre", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 13, plateAppearances: 49, atBats: 47, runs: 9, hits: 12, doubles: 1, triples: 0, homeRuns: 0, rbi: 9, walks: 2, strikeouts: 6, hitByPitch: 0, stolenBases: 0, caughtStealing: 0, avg: 0.255, obp: 0.286, slg: 0.277, ops: 0.562 },
  { playerId: "b52", playerName: "Glen Fieldsend", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 17, plateAppearances: 61, atBats: 52, runs: 3, hits: 13, doubles: 0, triples: 0, homeRuns: 0, rbi: 4, walks: 5, strikeouts: 21, hitByPitch: 3, stolenBases: 3, caughtStealing: 0, avg: 0.250, obp: 0.344, slg: 0.250, ops: 0.594 },
  { playerId: "b53", playerName: "Tom Gillis", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 15, plateAppearances: 54, atBats: 44, runs: 10, hits: 11, doubles: 2, triples: 0, homeRuns: 0, rbi: 7, walks: 9, strikeouts: 17, hitByPitch: 0, stolenBases: 1, caughtStealing: 0, avg: 0.250, obp: 0.370, slg: 0.295, ops: 0.666 },
  { playerId: "b54", playerName: "Christian Puello", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 13, plateAppearances: 43, atBats: 36, runs: 6, hits: 9, doubles: 1, triples: 0, homeRuns: 1, rbi: 7, walks: 4, strikeouts: 9, hitByPitch: 2, stolenBases: 2, caughtStealing: 1, avg: 0.250, obp: 0.349, slg: 0.361, ops: 0.710 },
  { playerId: "b55", playerName: "Stephen Miller", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 9, plateAppearances: 32, atBats: 28, runs: 5, hits: 7, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, walks: 3, strikeouts: 4, hitByPitch: 0, stolenBases: 1, caughtStealing: 0, avg: 0.250, obp: 0.312, slg: 0.250, ops: 0.562 },
  { playerId: "b56", playerName: "Kevin Sullivan", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 15, plateAppearances: 46, atBats: 41, runs: 3, hits: 10, doubles: 1, triples: 0, homeRuns: 0, rbi: 3, walks: 4, strikeouts: 4, hitByPitch: 1, stolenBases: 0, caughtStealing: 0, avg: 0.244, obp: 0.326, slg: 0.268, ops: 0.594 },
  { playerId: "b57", playerName: "Alex Corona", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 14, plateAppearances: 53, atBats: 41, runs: 7, hits: 10, doubles: 1, triples: 0, homeRuns: 0, rbi: 4, walks: 12, strikeouts: 6, hitByPitch: 0, stolenBases: 1, caughtStealing: 1, avg: 0.244, obp: 0.415, slg: 0.268, ops: 0.683 },
  { playerId: "b58", playerName: "Jim Lamond", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 15, plateAppearances: 50, atBats: 46, runs: 1, hits: 11, doubles: 0, triples: 0, homeRuns: 0, rbi: 6, walks: 4, strikeouts: 14, hitByPitch: 0, stolenBases: 0, caughtStealing: 1, avg: 0.239, obp: 0.300, slg: 0.239, ops: 0.539 },
  { playerId: "b59", playerName: "Mel Allen", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 14, plateAppearances: 54, atBats: 47, runs: 4, hits: 11, doubles: 0, triples: 0, homeRuns: 0, rbi: 9, walks: 4, strikeouts: 2, hitByPitch: 1, stolenBases: 0, caughtStealing: 0, avg: 0.234, obp: 0.302, slg: 0.234, ops: 0.536 },
  { playerId: "b60", playerName: "Michael Amundsen", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 10, plateAppearances: 29, atBats: 26, runs: 2, hits: 6, doubles: 0, triples: 0, homeRuns: 0, rbi: 4, walks: 3, strikeouts: 11, hitByPitch: 0, stolenBases: 6, caughtStealing: 0, avg: 0.231, obp: 0.310, slg: 0.231, ops: 0.541 },
  { playerId: "b61", playerName: "Jim Burke", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 17, plateAppearances: 61, atBats: 55, runs: 4, hits: 12, doubles: 1, triples: 0, homeRuns: 0, rbi: 5, walks: 5, strikeouts: 15, hitByPitch: 1, stolenBases: 0, caughtStealing: 0, avg: 0.218, obp: 0.295, slg: 0.236, ops: 0.531 },
  { playerId: "b62", playerName: "Derek Kattar", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 16, plateAppearances: 60, atBats: 46, runs: 5, hits: 10, doubles: 0, triples: 0, homeRuns: 0, rbi: 2, walks: 14, strikeouts: 12, hitByPitch: 0, stolenBases: 5, caughtStealing: 3, avg: 0.217, obp: 0.400, slg: 0.217, ops: 0.617 },
  { playerId: "b63", playerName: "Steve McManus", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 8, plateAppearances: 26, atBats: 24, runs: 1, hits: 5, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 2, strikeouts: 0, hitByPitch: 0, stolenBases: 0, caughtStealing: 0, avg: 0.208, obp: 0.269, slg: 0.208, ops: 0.478 },
  { playerId: "b64", playerName: "Khaled Hiari", teamId: "athletics", teamAbbr: "ATH", position: "UTIL", gamesPlayed: 15, plateAppearances: 55, atBats: 45, runs: 14, hits: 9, doubles: 1, triples: 0, homeRuns: 0, rbi: 2, walks: 10, strikeouts: 19, hitByPitch: 0, stolenBases: 7, caughtStealing: 0, avg: 0.200, obp: 0.345, slg: 0.222, ops: 0.568 },
  { playerId: "b65", playerName: "Luke Hart", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 14, plateAppearances: 46, atBats: 37, runs: 2, hits: 7, doubles: 1, triples: 0, homeRuns: 0, rbi: 5, walks: 7, strikeouts: 18, hitByPitch: 1, stolenBases: 1, caughtStealing: 1, avg: 0.189, obp: 0.326, slg: 0.216, ops: 0.542 },
  { playerId: "b66", playerName: "Chris Ricker", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 14, plateAppearances: 51, atBats: 43, runs: 4, hits: 8, doubles: 0, triples: 0, homeRuns: 0, rbi: 5, walks: 6, strikeouts: 9, hitByPitch: 2, stolenBases: 1, caughtStealing: 1, avg: 0.186, obp: 0.314, slg: 0.186, ops: 0.500 },
  { playerId: "b67", playerName: "Todd Allen", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 10, plateAppearances: 31, atBats: 28, runs: 3, hits: 5, doubles: 2, triples: 0, homeRuns: 0, rbi: 2, walks: 3, strikeouts: 6, hitByPitch: 0, stolenBases: 2, caughtStealing: 0, avg: 0.179, obp: 0.258, slg: 0.250, ops: 0.508 },
  { playerId: "b68", playerName: "Joshua Dubois", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 10, plateAppearances: 33, atBats: 30, runs: 6, hits: 5, doubles: 0, triples: 0, homeRuns: 0, rbi: 2, walks: 2, strikeouts: 3, hitByPitch: 1, stolenBases: 1, caughtStealing: 0, avg: 0.167, obp: 0.242, slg: 0.167, ops: 0.409 },
  { playerId: "b69", playerName: "Ned Reynolds", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 9, plateAppearances: 25, atBats: 24, runs: 4, hits: 4, doubles: 0, triples: 0, homeRuns: 0, rbi: 2, walks: 1, strikeouts: 6, hitByPitch: 0, stolenBases: 0, caughtStealing: 0, avg: 0.167, obp: 0.200, slg: 0.167, ops: 0.367 },
  { playerId: "b70", playerName: "Bobby Williams", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 14, plateAppearances: 52, atBats: 44, runs: 5, hits: 7, doubles: 0, triples: 0, homeRuns: 0, rbi: 6, walks: 5, strikeouts: 6, hitByPitch: 3, stolenBases: 1, caughtStealing: 0, avg: 0.159, obp: 0.288, slg: 0.159, ops: 0.448 },
  { playerId: "b71", playerName: "Jason Fellows", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 18, plateAppearances: 62, atBats: 59, runs: 4, hits: 9, doubles: 0, triples: 0, homeRuns: 0, rbi: 3, walks: 3, strikeouts: 16, hitByPitch: 0, stolenBases: 0, caughtStealing: 1, avg: 0.153, obp: 0.194, slg: 0.153, ops: 0.346 },
  { playerId: "b72", playerName: "Eric Moore", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 14, plateAppearances: 48, atBats: 46, runs: 6, hits: 7, doubles: 0, triples: 0, homeRuns: 0, rbi: 3, walks: 1, strikeouts: 13, hitByPitch: 1, stolenBases: 1, caughtStealing: 0, avg: 0.152, obp: 0.187, slg: 0.152, ops: 0.340 },
  { playerId: "b73", playerName: "Eddie Brown", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 15, plateAppearances: 52, atBats: 47, runs: 3, hits: 7, doubles: 0, triples: 0, homeRuns: 0, rbi: 4, walks: 5, strikeouts: 18, hitByPitch: 0, stolenBases: 0, caughtStealing: 0, avg: 0.149, obp: 0.231, slg: 0.149, ops: 0.380 },
  { playerId: "b74", playerName: "Pat Healey", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 15, plateAppearances: 51, atBats: 42, runs: 3, hits: 6, doubles: 0, triples: 0, homeRuns: 0, rbi: 3, walks: 8, strikeouts: 24, hitByPitch: 1, stolenBases: 0, caughtStealing: 0, avg: 0.143, obp: 0.294, slg: 0.143, ops: 0.437 },
  { playerId: "b75", playerName: "Carlos Dominguez", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 8, plateAppearances: 25, atBats: 22, runs: 2, hits: 3, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 2, strikeouts: 10, hitByPitch: 0, stolenBases: 0, caughtStealing: 0, avg: 0.136, obp: 0.208, slg: 0.136, ops: 0.345 },
  { playerId: "b76", playerName: "Harper Marshall", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 10, plateAppearances: 34, atBats: 30, runs: 4, hits: 4, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, walks: 3, strikeouts: 11, hitByPitch: 1, stolenBases: 1, caughtStealing: 0, avg: 0.133, obp: 0.235, slg: 0.133, ops: 0.369 },
  { playerId: "b77", playerName: "Eric McAllister", teamId: "mariners", teamAbbr: "MAR", position: "UTIL", gamesPlayed: 8, plateAppearances: 26, atBats: 24, runs: 0, hits: 3, doubles: 0, triples: 0, homeRuns: 0, rbi: 3, walks: 0, strikeouts: 5, hitByPitch: 2, stolenBases: 1, caughtStealing: 0, avg: 0.125, obp: 0.192, slg: 0.125, ops: 0.317 },
  { playerId: "b78", playerName: "Vic Casado", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 10, plateAppearances: 40, atBats: 33, runs: 4, hits: 4, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 7, strikeouts: 9, hitByPitch: 0, stolenBases: 1, caughtStealing: 0, avg: 0.121, obp: 0.275, slg: 0.121, ops: 0.396 },
  { playerId: "b79", playerName: "Olin Meyers", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 15, plateAppearances: 46, atBats: 43, runs: 6, hits: 5, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 3, strikeouts: 19, hitByPitch: 0, stolenBases: 4, caughtStealing: 0, avg: 0.116, obp: 0.174, slg: 0.116, ops: 0.290 },
  { playerId: "b80", playerName: "SM Brett", teamId: "pirates", teamAbbr: "PIR", position: "UTIL", gamesPlayed: 15, plateAppearances: 46, atBats: 36, runs: 4, hits: 4, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 8, strikeouts: 12, hitByPitch: 1, stolenBases: 3, caughtStealing: 0, avg: 0.111, obp: 0.289, slg: 0.111, ops: 0.400 },
  { playerId: "b81", playerName: "Jeff Frazier", teamId: "diamondbacks", teamAbbr: "DBK", position: "UTIL", gamesPlayed: 7, plateAppearances: 24, atBats: 19, runs: 0, hits: 2, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 5, strikeouts: 2, hitByPitch: 0, stolenBases: 0, caughtStealing: 0, avg: 0.105, obp: 0.292, slg: 0.105, ops: 0.397 },
  { playerId: "b82", playerName: "Jon Gore Sr", teamId: "rays", teamAbbr: "RAY", position: "UTIL", gamesPlayed: 11, plateAppearances: 40, atBats: 38, runs: 1, hits: 3, doubles: 0, triples: 0, homeRuns: 0, rbi: 1, walks: 1, strikeouts: 7, hitByPitch: 0, stolenBases: 2, caughtStealing: 0, avg: 0.079, obp: 0.103, slg: 0.079, ops: 0.182 },
  { playerId: "b83", playerName: "Joseph Connors", teamId: "rockies", teamAbbr: "ROC", position: "UTIL", gamesPlayed: 14, plateAppearances: 38, atBats: 32, runs: 1, hits: 1, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, walks: 4, strikeouts: 27, hitByPitch: 2, stolenBases: 0, caughtStealing: 0, avg: 0.031, obp: 0.184, slg: 0.031, ops: 0.215 },
];

// 2025 Season Pitching Statistics (21 pitchers)
export const pitchingStats: PitchingStats[] = [
  { playerId: "p1", playerName: "Ari Alexenberg", teamId: "athletics", teamAbbr: "ATH", position: "P", gamesPlayed: 8, gamesStarted: 4, wins: 4, losses: 1, saves: 0, inningsPitched: 34.0, hits: 22, runs: 8, earnedRuns: 5, walks: 12, strikeouts: 35, hitBatters: 3, completeGames: 0, era: 1.32, whip: 1.00 },
  { playerId: "p2", playerName: "Keegan Taylor", teamId: "mariners", teamAbbr: "MAR", position: "SP", gamesPlayed: 9, gamesStarted: 9, wins: 4, losses: 0, saves: 0, inningsPitched: 32.1, hits: 16, runs: 11, earnedRuns: 8, walks: 13, strikeouts: 63, hitBatters: 4, completeGames: 0, era: 2.23, whip: 0.90 },
  { playerId: "p3", playerName: "Stephen Miller", teamId: "rockies", teamAbbr: "ROC", position: "P", gamesPlayed: 7, gamesStarted: 3, wins: 0, losses: 3, saves: 0, inningsPitched: 25.2, hits: 25, runs: 15, earnedRuns: 7, walks: 8, strikeouts: 29, hitBatters: 1, completeGames: 1, era: 2.45, whip: 1.29 },
  { playerId: "p4", playerName: "Jesse Hill", teamId: "pirates", teamAbbr: "PIR", position: "SP", gamesPlayed: 17, gamesStarted: 15, wins: 12, losses: 2, saves: 0, inningsPitched: 137.2, hits: 137, runs: 66, earnedRuns: 40, walks: 43, strikeouts: 121, hitBatters: 7, completeGames: 12, era: 2.62, whip: 1.31 },
  { playerId: "p5", playerName: "Ryan Costa", teamId: "rays", teamAbbr: "RAY", position: "SP", gamesPlayed: 15, gamesStarted: 13, wins: 7, losses: 3, saves: 0, inningsPitched: 93.1, hits: 120, runs: 53, earnedRuns: 38, walks: 26, strikeouts: 56, hitBatters: 1, completeGames: 1, era: 3.66, whip: 1.56 },
  { playerId: "p6", playerName: "Dave Nieves", teamId: "athletics", teamAbbr: "ATH", position: "RP", gamesPlayed: 11, gamesStarted: 0, wins: 0, losses: 0, saves: 2, inningsPitched: 26.2, hits: 27, runs: 18, earnedRuns: 14, walks: 16, strikeouts: 39, hitBatters: 1, completeGames: 0, era: 4.73, whip: 1.61 },
  { playerId: "p7", playerName: "Adam Johnson", teamId: "rockies", teamAbbr: "ROC", position: "P", gamesPlayed: 5, gamesStarted: 2, wins: 3, losses: 0, saves: 0, inningsPitched: 30.2, hits: 38, runs: 25, earnedRuns: 18, walks: 16, strikeouts: 19, hitBatters: 4, completeGames: 2, era: 5.28, whip: 1.76 },
  { playerId: "p8", playerName: "Ben Douglas", teamId: "athletics", teamAbbr: "ATH", position: "P", gamesPlayed: 12, gamesStarted: 9, wins: 6, losses: 3, saves: 0, inningsPitched: 58.1, hits: 56, runs: 47, earnedRuns: 36, walks: 38, strikeouts: 50, hitBatters: 4, completeGames: 1, era: 5.55, whip: 1.61 },
  { playerId: "p9", playerName: "Pat Healey", teamId: "rays", teamAbbr: "RAY", position: "P", gamesPlayed: 6, gamesStarted: 2, wins: 2, losses: 0, saves: 1, inningsPitched: 23.0, hits: 34, runs: 16, earnedRuns: 15, walks: 10, strikeouts: 11, hitBatters: 2, completeGames: 0, era: 5.87, whip: 1.91 },
  { playerId: "p10", playerName: "Steve McManus", teamId: "mariners", teamAbbr: "MAR", position: "P", gamesPlayed: 5, gamesStarted: 2, wins: 2, losses: 1, saves: 0, inningsPitched: 24.0, hits: 29, runs: 18, earnedRuns: 16, walks: 8, strikeouts: 18, hitBatters: 1, completeGames: 0, era: 6.00, whip: 1.54 },
  { playerId: "p11", playerName: "Joey Grattan", teamId: "athletics", teamAbbr: "ATH", position: "RP", gamesPlayed: 6, gamesStarted: 1, wins: 1, losses: 0, saves: 0, inningsPitched: 16.0, hits: 14, runs: 12, earnedRuns: 12, walks: 11, strikeouts: 14, hitBatters: 1, completeGames: 0, era: 6.75, whip: 1.56 },
  { playerId: "p12", playerName: "Drew Marcotte", teamId: "mariners", teamAbbr: "MAR", position: "P", gamesPlayed: 12, gamesStarted: 2, wins: 1, losses: 4, saves: 1, inningsPitched: 41.1, hits: 42, runs: 49, earnedRuns: 38, walks: 34, strikeouts: 41, hitBatters: 6, completeGames: 1, era: 8.27, whip: 1.84 },
  { playerId: "p13", playerName: "Eddie Brown", teamId: "diamondbacks", teamAbbr: "DBK", position: "SP", gamesPlayed: 14, gamesStarted: 7, wins: 0, losses: 8, saves: 0, inningsPitched: 76.1, hits: 130, runs: 92, earnedRuns: 75, walks: 12, strikeouts: 67, hitBatters: 0, completeGames: 3, era: 8.84, whip: 1.86 },
  { playerId: "p14", playerName: "James Parkington", teamId: "rockies", teamAbbr: "ROC", position: "P", gamesPlayed: 5, gamesStarted: 1, wins: 0, losses: 1, saves: 0, inningsPitched: 15.0, hits: 19, runs: 16, earnedRuns: 15, walks: 10, strikeouts: 6, hitBatters: 3, completeGames: 0, era: 9.00, whip: 1.93 },
  { playerId: "p15", playerName: "Ryan Lantz", teamId: "diamondbacks", teamAbbr: "DBK", position: "P", gamesPlayed: 8, gamesStarted: 3, wins: 0, losses: 3, saves: 0, inningsPitched: 27.2, hits: 40, runs: 33, earnedRuns: 30, walks: 21, strikeouts: 19, hitBatters: 4, completeGames: 0, era: 9.76, whip: 2.21 },
  { playerId: "p16", playerName: "Sam Arcand", teamId: "diamondbacks", teamAbbr: "DBK", position: "P", gamesPlayed: 6, gamesStarted: 4, wins: 1, losses: 3, saves: 0, inningsPitched: 27.0, hits: 48, runs: 38, earnedRuns: 32, walks: 19, strikeouts: 22, hitBatters: 3, completeGames: 1, era: 10.67, whip: 2.48 },
  { playerId: "p17", playerName: "Eric McAllister", teamId: "mariners", teamAbbr: "MAR", position: "P", gamesPlayed: 5, gamesStarted: 2, wins: 1, losses: 3, saves: 1, inningsPitched: 25.0, hits: 35, runs: 37, earnedRuns: 34, walks: 22, strikeouts: 17, hitBatters: 1, completeGames: 0, era: 12.24, whip: 2.28 },
  { playerId: "p18", playerName: "Jonathan St. Pierre", teamId: "athletics", teamAbbr: "ATH", position: "P", gamesPlayed: 7, gamesStarted: 4, wins: 1, losses: 1, saves: 0, inningsPitched: 17.0, hits: 26, runs: 25, earnedRuns: 24, walks: 20, strikeouts: 16, hitBatters: 5, completeGames: 0, era: 12.71, whip: 2.71 },
  { playerId: "p19", playerName: "JJ Brigham", teamId: "rockies", teamAbbr: "ROC", position: "P", gamesPlayed: 10, gamesStarted: 4, wins: 0, losses: 3, saves: 0, inningsPitched: 29.1, hits: 59, runs: 53, earnedRuns: 42, walks: 31, strikeouts: 20, hitBatters: 3, completeGames: 0, era: 12.89, whip: 3.07 },
  { playerId: "p20", playerName: "Brian Johnson", teamId: "rockies", teamAbbr: "ROC", position: "P", gamesPlayed: 4, gamesStarted: 3, wins: 0, losses: 2, saves: 0, inningsPitched: 16.1, hits: 29, runs: 28, earnedRuns: 24, walks: 18, strikeouts: 12, hitBatters: 4, completeGames: 0, era: 13.22, whip: 2.88 },
  { playerId: "p21", playerName: "David Lilly", teamId: "mariners", teamAbbr: "MAR", position: "P", gamesPlayed: 3, gamesStarted: 1, wins: 0, losses: 1, saves: 0, inningsPitched: 16.0, hits: 22, runs: 29, earnedRuns: 27, walks: 22, strikeouts: 11, hitBatters: 2, completeGames: 0, era: 15.19, whip: 2.75 },
];

// Minimum qualifiers for stats
export const BATTING_MIN_AB = 30;
export const PITCHING_MIN_IP = 15;

export function getQualifiedBatters(minAB: number = BATTING_MIN_AB): BattingStats[] {
  return battingStats.filter((player) => player.atBats >= minAB);
}

export function getQualifiedPitchers(minIP: number = PITCHING_MIN_IP): PitchingStats[] {
  return pitchingStats.filter((player) => player.inningsPitched >= minIP);
}

// ============================================================================
// TEAM DETAILS & ROSTERS - 2025 SEASON
// ============================================================================

export type BatsThrows = "R/R" | "L/L" | "S/R" | "R/L" | "L/R" | "S/L";

export interface TeamDetails extends Team {
  manager: string;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  runsFor: number;
  runsAgainst: number;
  homeField: string;
  founded: number;
}

export interface RosterPlayer {
  id: string;
  teamId: string;
  jerseyNumber: number;
  name: string;
  position: Position;
  batsThrows: BatsThrows;
  battingStatsId?: string;
  pitchingStatsId?: string;
}

// 2025 Season Standings
export const teamDetails: TeamDetails[] = [
  {
    ...teams[0], // Rays
    manager: "TBD",
    wins: 14,
    losses: 4,
    ties: 0,
    gamesPlayed: 18,
    runsFor: 168,
    runsAgainst: 87,
    homeField: "Leary Field - Portsmouth",
    founded: 2020,
  },
  {
    ...teams[1], // Pirates
    manager: "TBD",
    wins: 12,
    losses: 4,
    ties: 1,
    gamesPlayed: 17,
    runsFor: 119,
    runsAgainst: 81,
    homeField: "Leary Field - Portsmouth",
    founded: 2020,
  },
  {
    ...teams[2], // Athletics
    manager: "TBD",
    wins: 12,
    losses: 6,
    ties: 1,
    gamesPlayed: 19,
    runsFor: 184,
    runsAgainst: 118,
    homeField: "Leary Field - Portsmouth",
    founded: 2020,
  },
  {
    ...teams[3], // Mariners
    manager: "TBD",
    wins: 8,
    losses: 10,
    ties: 0,
    gamesPlayed: 18,
    runsFor: 148,
    runsAgainst: 171,
    homeField: "Leary Field - Portsmouth",
    founded: 2020,
  },
  {
    ...teams[4], // Rockies
    manager: "TBD",
    wins: 4,
    losses: 12,
    ties: 0,
    gamesPlayed: 16,
    runsFor: 93,
    runsAgainst: 176,
    homeField: "Shipyard Stadium",
    founded: 2020,
  },
  {
    ...teams[5], // Diamondbacks
    manager: "TBD",
    wins: 1,
    losses: 15,
    ties: 0,
    gamesPlayed: 16,
    runsFor: 92,
    runsAgainst: 171,
    homeField: "Shipyard Stadium",
    founded: 2020,
  },
];

// Generate rosters from batting stats
export const rosters: RosterPlayer[] = battingStats.map((player, index) => ({
  id: `r${index + 1}`,
  teamId: player.teamId,
  jerseyNumber: index + 1,
  name: player.playerName,
  position: player.position,
  batsThrows: "R/R" as BatsThrows,
  battingStatsId: player.playerId,
}));

export function getTeamDetailsById(teamId: string): TeamDetails | undefined {
  return teamDetails.find((team) => team.id === teamId);
}

export function getRosterByTeamId(teamId: string): RosterPlayer[] {
  return rosters.filter((player) => player.teamId === teamId);
}

export function getPlayerStats(player: RosterPlayer): { batting?: BattingStats; pitching?: PitchingStats } {
  const batting = player.battingStatsId
    ? battingStats.find((s) => s.playerId === player.battingStatsId)
    : undefined;
  const pitching = player.pitchingStatsId
    ? pitchingStats.find((s) => s.playerId === player.pitchingStatsId)
    : undefined;
  return { batting, pitching };
}
