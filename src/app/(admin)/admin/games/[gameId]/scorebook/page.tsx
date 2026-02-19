'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  StatsEntryHeader,
  ScoreEntryCard,
  PitchingStatsForm,
  PlayerStatsForm,
} from '@/components/admin';
import type { PlayerBattingEntry } from '@/components/admin/PlayerStatsForm';
import type { PitchingStatsEntry } from '@/components/admin/PitchingStatsForm';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { GameWithTeams, PitchingStats, FieldPosition } from '@/types';
import type { PlateAppearanceEntry } from '@/types/plate-appearance.types';

// =============================================================================
// TYPES
// =============================================================================

type TabType = 'away' | 'home';

interface RosterPlayer {
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  primaryPosition?: FieldPosition;
  isPitcher?: boolean;
}

interface ExistingBattingStats {
  playerId: string;
  plateAppearances: PlateAppearanceEntry[];
  runs: number;
  rbis: number;
  stolenBases: number;
  caughtStealing: number;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const mockGame: GameWithTeams = {
  id: 'game-003',
  seasonId: 'season-2026',
  gameNumber: 3,
  homeTeamId: 'rockies',
  awayTeamId: 'diamondbacks',
  gameDate: '2026-02-15',
  gameTime: '13:00:00',
  timezone: 'America/New_York',
  locationName: 'Coastal Park',
  locationAddress: 'Main Field, Coastal Park',
  status: 'final',
  homeScore: 2,
  awayScore: 4,
  currentInning: null,
  currentInningHalf: null,
  outs: null,
  homeInningScores: [0, 0, 1, 0, 0, 0, 1, 0, 0],
  awayInningScores: [0, 1, 0, 2, 0, 0, 1, 0, 0],
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-15T18:00:00Z',
  startedAt: '2026-02-15T13:00:00Z',
  endedAt: '2026-02-15T16:30:00Z',
  homeTeam: {
    id: 'rockies',
    name: 'Rockies',
    abbreviation: 'ROC',
    primaryColor: '#33006F',
    secondaryColor: '#C4CED4',
    logoUrl: null,
  },
  awayTeam: {
    id: 'diamondbacks',
    name: 'Diamondbacks',
    abbreviation: 'DBK',
    primaryColor: '#A71930',
    secondaryColor: '#E3D4AD',
    logoUrl: null,
  },
};

const mockHomeRoster: RosterPlayer[] = [
  { playerId: 'roc-1', playerName: 'Mike Johnson', jerseyNumber: '7', primaryPosition: 'CF' },
  { playerId: 'roc-2', playerName: 'David Smith', jerseyNumber: '12', primaryPosition: 'SS' },
  { playerId: 'roc-3', playerName: 'Chris Williams', jerseyNumber: '21', primaryPosition: '1B' },
  { playerId: 'roc-4', playerName: 'Alex Brown', jerseyNumber: '35', primaryPosition: '3B' },
  { playerId: 'roc-5', playerName: 'Ryan Davis', jerseyNumber: '8', primaryPosition: 'LF' },
  { playerId: 'roc-6', playerName: 'Tyler Miller', jerseyNumber: '24', primaryPosition: 'RF' },
  { playerId: 'roc-7', playerName: 'Kevin Wilson', jerseyNumber: '5', primaryPosition: '2B' },
  { playerId: 'roc-8', playerName: 'Matt Taylor', jerseyNumber: '18', primaryPosition: 'C' },
  { playerId: 'roc-9', playerName: 'Jake Anderson', jerseyNumber: '42', primaryPosition: 'DH' },
  { playerId: 'roc-10', playerName: 'Tom Roberts', jerseyNumber: '31', primaryPosition: 'P', isPitcher: true },
  { playerId: 'roc-11', playerName: 'Sam Thompson', jerseyNumber: '45', primaryPosition: 'P', isPitcher: true },
  { playerId: 'roc-12', playerName: 'Josh Martinez', jerseyNumber: '52', primaryPosition: 'UTIL' },
];

const mockAwayRoster: RosterPlayer[] = [
  { playerId: 'dbk-1', playerName: 'Brian Lee', jerseyNumber: '3', primaryPosition: 'CF' },
  { playerId: 'dbk-2', playerName: 'Jason Clark', jerseyNumber: '11', primaryPosition: 'SS' },
  { playerId: 'dbk-3', playerName: 'Steve Young', jerseyNumber: '28', primaryPosition: '1B' },
  { playerId: 'dbk-4', playerName: 'Eric Hall', jerseyNumber: '16', primaryPosition: '3B' },
  { playerId: 'dbk-5', playerName: 'Dan Wright', jerseyNumber: '9', primaryPosition: 'LF' },
  { playerId: 'dbk-6', playerName: 'Jeff King', jerseyNumber: '23', primaryPosition: 'RF' },
  { playerId: 'dbk-7', playerName: 'Mark Lopez', jerseyNumber: '4', primaryPosition: '2B' },
  { playerId: 'dbk-8', playerName: 'Paul Green', jerseyNumber: '17', primaryPosition: 'C' },
  { playerId: 'dbk-9', playerName: 'Nick Hill', jerseyNumber: '44', primaryPosition: 'DH' },
  { playerId: 'dbk-10', playerName: 'Rick Scott', jerseyNumber: '33', primaryPosition: 'P', isPitcher: true },
  { playerId: 'dbk-11', playerName: 'Ben Adams', jerseyNumber: '48', primaryPosition: 'P', isPitcher: true },
  { playerId: 'dbk-12', playerName: 'Joe Baker', jerseyNumber: '55', primaryPosition: 'UTIL' },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Scorebook Page
 *
 * Full scorebook-style stats entry interface for a specific game.
 * Uses plate appearance entry (PA-by-PA) for batting stats instead of totals.
 * Includes tabs for home/away teams with batting and pitching forms.
 */
export default function ScorebookPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  // Game state
  const [game, setGame] = useState<GameWithTeams | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Score state
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [scoreHasChanges, setScoreHasChanges] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('away');

  // Batting stats state (PA-based)
  const [homeBattingStats, setHomeBattingStats] = useState<ExistingBattingStats[]>([]);
  const [awayBattingStats, setAwayBattingStats] = useState<ExistingBattingStats[]>([]);

  // Pitching stats state
  const [homePitchingStats, setHomePitchingStats] = useState<PitchingStats[]>([]);
  const [awayPitchingStats, setAwayPitchingStats] = useState<PitchingStats[]>([]);

  // Global state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load game data
  useEffect(() => {
    const timer = setTimeout(() => {
      // In real app, fetch from API
      setGame(mockGame);
      setHomeScore(mockGame.homeScore ?? 0);
      setAwayScore(mockGame.awayScore ?? 0);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [gameId]);

  // Track unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges || scoreHasChanges) {
      setSaveStatus('idle');
    }
  }, [hasUnsavedChanges, scoreHasChanges]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || scoreHasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, scoreHasChanges]);

  // Score change handler
  const handleScoreChange = useCallback((team: 'home' | 'away', score: number) => {
    if (team === 'home') {
      setHomeScore(score);
    } else {
      setAwayScore(score);
    }
    setScoreHasChanges(true);
    setHasUnsavedChanges(true);
  }, []);

  // Save score handler
  const handleSaveScore = useCallback(async () => {
    setIsSavingScore(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Update game state
      setGame((prev) =>
        prev
          ? {
              ...prev,
              homeScore,
              awayScore,
            }
          : null
      );

      setScoreHasChanges(false);
      setSaveStatus('success');
    } catch (error) {
      console.error('Failed to save score:', error);
      setSaveStatus('error');
    } finally {
      setIsSavingScore(false);
    }
  }, [homeScore, awayScore]);

  // Save batting stats handler (PA-based)
  const handleSaveBattingStats = useCallback(
    async (entries: PlayerBattingEntry[], teamType: 'home' | 'away') => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Transform entries to our storage format
        const stats: ExistingBattingStats[] = entries.map((entry) => ({
          playerId: entry.playerId,
          plateAppearances: entry.plateAppearances,
          runs: entry.runs,
          rbis: entry.rbis,
          stolenBases: entry.stolenBases,
          caughtStealing: entry.caughtStealing,
        }));

        if (teamType === 'home') {
          setHomeBattingStats(stats);
        } else {
          setAwayBattingStats(stats);
        }

        setSaveStatus('success');
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Failed to save batting stats:', error);
        setSaveStatus('error');
        throw error;
      }
    },
    []
  );

  // Save pitching stats handler
  const handleSavePitchingStats = useCallback(
    async (entries: PitchingStatsEntry[], teamType: 'home' | 'away') => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Transform entries to PitchingStats
        const stats: PitchingStats[] = entries.map((entry) => ({
          id: `${gameId}-${entry.playerId}-pitching`,
          gameId,
          playerId: entry.playerId,
          teamId: teamType === 'home' ? game!.homeTeamId : game!.awayTeamId,
          isStarter: entry.isStarter ?? false,
          inningsPitched: entry.inningsPitched ?? 0,
          hitsAllowed: entry.hitsAllowed ?? 0,
          runsAllowed: entry.runsAllowed ?? 0,
          earnedRuns: entry.earnedRuns ?? 0,
          walks: entry.walks ?? 0,
          strikeouts: entry.strikeouts ?? 0,
          homeRunsAllowed: entry.homeRunsAllowed ?? 0,
          battersFaced: entry.battersFaced ?? 0,
          pitchesThrown: entry.pitchesThrown ?? null,
          strikes: entry.strikes ?? null,
          hitBatters: entry.hitBatters ?? 0,
          wildPitches: entry.wildPitches ?? 0,
          balks: entry.balks ?? 0,
          decision: entry.decision ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        if (teamType === 'home') {
          setHomePitchingStats(stats);
        } else {
          setAwayPitchingStats(stats);
        }

        setSaveStatus('success');
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Failed to save pitching stats:', error);
        setSaveStatus('error');
        throw error;
      }
    },
    [game, gameId]
  );

  // Calculate completion status
  const getTeamStatsStatus = (teamType: 'home' | 'away') => {
    const battingStats = teamType === 'home' ? homeBattingStats : awayBattingStats;
    const pitchingStats = teamType === 'home' ? homePitchingStats : awayPitchingStats;

    if (battingStats.length > 0 && pitchingStats.length > 0) {
      return 'complete';
    } else if (battingStats.length > 0 || pitchingStats.length > 0) {
      return 'partial';
    }
    return 'missing';
  };

  // Loading state
  if (isLoading || !game) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const activeTeam = activeTab === 'home' ? game.homeTeam : game.awayTeam;
  const activeRoster = activeTab === 'home' ? mockHomeRoster : mockAwayRoster;
  const activeBattingStats = activeTab === 'home' ? homeBattingStats : awayBattingStats;
  const activePitchingStats = activeTab === 'home' ? homePitchingStats : awayPitchingStats;

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <StatsEntryHeader game={game} hasUnsavedChanges={hasUnsavedChanges || scoreHasChanges} />

      {/* Save Status Banner */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">Stats saved successfully!</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">Failed to save stats. Please try again.</span>
        </div>
      )}

      {/* Score Entry Card */}
      <ScoreEntryCard
        awayTeam={{
          name: game.awayTeam.name,
          abbreviation: game.awayTeam.abbreviation,
          primaryColor: game.awayTeam.primaryColor ?? undefined,
        }}
        homeTeam={{
          name: game.homeTeam.name,
          abbreviation: game.homeTeam.abbreviation,
          primaryColor: game.homeTeam.primaryColor ?? undefined,
        }}
        awayScore={awayScore}
        homeScore={homeScore}
        onScoreChange={handleScoreChange}
        onSave={handleSaveScore}
        hasChanges={scoreHasChanges}
        isSaving={isSavingScore}
      />

      {/* Team Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200">
          {/* Away Team Tab */}
          <button
            onClick={() => setActiveTab('away')}
            className={cn(
              'flex-1 px-6 py-4 text-left transition-colors relative',
              activeTab === 'away' ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'
            )}
            aria-selected={activeTab === 'away'}
            role="tab"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: game.awayTeam.primaryColor || '#1E3A5F' }}
                  aria-hidden="true"
                >
                  {game.awayTeam.abbreviation}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{game.awayTeam.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Away Team</p>
                </div>
              </div>
              {getTeamStatsStatus('away') === 'complete' && (
                <Badge variant="success" size="sm">
                  Complete
                </Badge>
              )}
              {getTeamStatsStatus('away') === 'partial' && (
                <Badge variant="warning" size="sm">
                  Partial
                </Badge>
              )}
            </div>
            {activeTab === 'away' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: game.awayTeam.primaryColor || '#1E3A5F' }}
                aria-hidden="true"
              />
            )}
          </button>

          {/* Home Team Tab */}
          <button
            onClick={() => setActiveTab('home')}
            className={cn(
              'flex-1 px-6 py-4 text-left transition-colors relative border-l border-gray-200',
              activeTab === 'home' ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'
            )}
            aria-selected={activeTab === 'home'}
            role="tab"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: game.homeTeam.primaryColor || '#1E3A5F' }}
                  aria-hidden="true"
                >
                  {game.homeTeam.abbreviation}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{game.homeTeam.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Home Team</p>
                </div>
              </div>
              {getTeamStatsStatus('home') === 'complete' && (
                <Badge variant="success" size="sm">
                  Complete
                </Badge>
              )}
              {getTeamStatsStatus('home') === 'partial' && (
                <Badge variant="warning" size="sm">
                  Partial
                </Badge>
              )}
            </div>
            {activeTab === 'home' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: game.homeTeam.primaryColor || '#1E3A5F' }}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Team Context Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Entering stats for <span className="font-semibold">{activeTeam.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Scorebook Entry Mode</span>
          </div>
        </div>
      </div>

      {/* Batting Stats Form (PA-based via PlayerStatsForm) */}
      <PlayerStatsForm
        teamId={activeTeam.id}
        teamName={activeTeam.name}
        gameId={gameId}
        roster={activeRoster}
        existingStats={activeBattingStats}
        onSave={(entries) => handleSaveBattingStats(entries, activeTab)}
      />

      {/* Pitching Stats Form */}
      <PitchingStatsForm
        teamId={activeTeam.id}
        teamName={activeTeam.name}
        gameId={gameId}
        roster={activeRoster}
        existingStats={activePitchingStats}
        onSave={(entries) => handleSavePitchingStats(entries, activeTab)}
      />

      {/* Stats Entry Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Stats Entry Progress</h4>
              <p className="text-sm text-gray-500 mt-1">
                {getTeamStatsStatus('away') === 'complete' &&
                getTeamStatsStatus('home') === 'complete'
                  ? 'All stats have been entered for this game.'
                  : 'Some stats are still missing. Complete all sections for both teams.'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Away:</span>
                  {getTeamStatsStatus('away') === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" aria-label="Complete" />
                  ) : getTeamStatsStatus('away') === 'partial' ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" aria-label="Partial" />
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      aria-label="Not started"
                    />
                  )}
                  <span className="text-gray-500 ml-4">Home:</span>
                  {getTeamStatsStatus('home') === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" aria-label="Complete" />
                  ) : getTeamStatsStatus('home') === 'partial' ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" aria-label="Partial" />
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      aria-label="Not started"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Score Status */}
          {scoreHasChanges && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>You have unsaved score changes</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
