'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Minus,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamWithManager, Game } from '@/types';

// Form data for creating/editing a game
export interface GameFormData {
  homeTeamId: string;
  awayTeamId: string;
  gameDate: string;
  gameTime: string;
  timezone: string;
  locationName: string;
  locationAddress: string;
  notes: string;
}

// For creating a series of games
export interface SeriesGameData extends GameFormData {
  seriesIndex: number;
}

interface GameFormProps {
  initialData?: Partial<Game>;
  teams: TeamWithManager[];
  seasonId: string;
  onSubmit: (data: GameFormData | SeriesGameData[]) => Promise<void>;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  allowSeries?: boolean;
  isSubmitting?: boolean;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
];

const DEFAULT_LOCATIONS = [
  { name: 'Harbor Field', address: 'Harbor Field, Diamond 1' },
  { name: 'Coastal Park', address: 'Coastal Park, Main Field' },
  { name: 'Shipyard Stadium', address: 'Shipyard Stadium' },
];

/**
 * GameForm Component
 *
 * Reusable form for creating or editing games.
 * Supports both single game and series creation.
 */
export function GameForm({
  initialData,
  teams,
  seasonId,
  onSubmit,
  onCancel,
  mode = 'create',
  allowSeries = true,
  isSubmitting = false,
}: GameFormProps) {
  const router = useRouter();
  const [isSeries, setIsSeries] = useState(false);
  const [seriesCount, setSeriesCount] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<GameFormData>({
    homeTeamId: initialData?.homeTeamId || '',
    awayTeamId: initialData?.awayTeamId || '',
    gameDate: initialData?.gameDate || '',
    gameTime: initialData?.gameTime?.slice(0, 5) || '', // Remove seconds
    timezone: initialData?.timezone || 'America/New_York',
    locationName: initialData?.locationName || '',
    locationAddress: initialData?.locationAddress || '',
    notes: initialData?.notes || '',
  });

  // Series dates when creating multiple games
  const [seriesDates, setSeriesDates] = useState<string[]>(['', '']);

  // Update series dates array when count changes
  useEffect(() => {
    setSeriesDates((prev) => {
      if (prev.length < seriesCount) {
        return [...prev, ...Array(seriesCount - prev.length).fill('')];
      }
      return prev.slice(0, seriesCount);
    });
  }, [seriesCount]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSeriesDateChange = (index: number, value: string) => {
    setSeriesDates((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleLocationSelect = (location: typeof DEFAULT_LOCATIONS[0]) => {
    setFormData((prev) => ({
      ...prev,
      locationName: location.name,
      locationAddress: location.address,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.homeTeamId) {
      newErrors.homeTeamId = 'Home team is required';
    }

    if (!formData.awayTeamId) {
      newErrors.awayTeamId = 'Away team is required';
    }

    if (formData.homeTeamId && formData.awayTeamId && formData.homeTeamId === formData.awayTeamId) {
      newErrors.awayTeamId = 'Home and away teams must be different';
    }

    if (isSeries) {
      seriesDates.forEach((date, index) => {
        if (!date) {
          newErrors[`seriesDate${index}`] = `Game ${index + 1} date is required`;
        }
      });
    } else {
      if (!formData.gameDate) {
        newErrors.gameDate = 'Game date is required';
      }
    }

    if (!formData.gameTime) {
      newErrors.gameTime = 'Game time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isSeries) {
      const seriesData: SeriesGameData[] = seriesDates.map((date, index) => ({
        ...formData,
        gameDate: date,
        seriesIndex: index + 1,
      }));
      await onSubmit(seriesData);
    } else {
      await onSubmit(formData);
    }
  };

  const homeTeam = teams.find((t) => t.id === formData.homeTeamId);
  const awayTeam = teams.find((t) => t.id === formData.awayTeamId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Team Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Selection
          </CardTitle>
          <CardDescription>
            Select the home and away teams for this {isSeries ? 'series' : 'game'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview matchup */}
          {homeTeam && awayTeam && (
            <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: awayTeam.primaryColor || '#374151' }}
                >
                  {awayTeam.abbreviation}
                </div>
                <span className="font-semibold text-gray-900">{awayTeam.name}</span>
              </div>
              <span className="text-gray-400">@</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: homeTeam.primaryColor || '#374151' }}
                >
                  {homeTeam.abbreviation}
                </div>
                <span className="font-semibold text-gray-900">{homeTeam.name}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Team */}
            <div>
              <label htmlFor="homeTeamId" className="block text-sm font-medium text-gray-700 mb-1">
                Home Team
              </label>
              <select
                id="homeTeamId"
                name="homeTeamId"
                value={formData.homeTeamId}
                onChange={handleInputChange}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-navy focus:border-navy',
                  errors.homeTeamId ? 'border-cardinal' : 'border-gray-200'
                )}
              >
                <option value="">Select home team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.homeTeamId && (
                <p className="mt-1 text-xs text-cardinal flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.homeTeamId}
                </p>
              )}
            </div>

            {/* Away Team */}
            <div>
              <label htmlFor="awayTeamId" className="block text-sm font-medium text-gray-700 mb-1">
                Away Team
              </label>
              <select
                id="awayTeamId"
                name="awayTeamId"
                value={formData.awayTeamId}
                onChange={handleInputChange}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-navy focus:border-navy',
                  errors.awayTeamId ? 'border-cardinal' : 'border-gray-200'
                )}
              >
                <option value="">Select away team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.awayTeamId && (
                <p className="mt-1 text-xs text-cardinal flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.awayTeamId}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date & Time
          </CardTitle>
          <CardDescription>
            {isSeries
              ? `Set the dates and time for the ${seriesCount}-game series`
              : 'Set the date and time for this game'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Series toggle */}
          {mode === 'create' && allowSeries && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Create a series</p>
                <p className="text-sm text-gray-500">
                  Schedule multiple games at once with the same teams
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSeries(!isSeries)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  isSeries ? 'bg-navy' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    isSeries ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          )}

          {/* Series count selector */}
          {isSeries && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Number of games:</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSeriesCount(Math.max(2, seriesCount - 1))}
                  disabled={seriesCount <= 2}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-mono text-lg font-bold w-8 text-center">{seriesCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSeriesCount(Math.min(7, seriesCount + 1))}
                  disabled={seriesCount >= 7}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Date inputs */}
          {isSeries ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seriesDates.map((date, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Game {index + 1} Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => handleSeriesDateChange(index, e.target.value)}
                      className={cn('pl-10', errors[`seriesDate${index}`] && 'border-cardinal')}
                    />
                  </div>
                  {errors[`seriesDate${index}`] && (
                    <p className="mt-1 text-xs text-cardinal">{errors[`seriesDate${index}`]}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="gameDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    id="gameDate"
                    name="gameDate"
                    value={formData.gameDate}
                    onChange={handleInputChange}
                    className={cn('pl-10', errors.gameDate && 'border-cardinal')}
                  />
                </div>
                {errors.gameDate && (
                  <p className="mt-1 text-xs text-cardinal">{errors.gameDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="gameTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="time"
                    id="gameTime"
                    name="gameTime"
                    value={formData.gameTime}
                    onChange={handleInputChange}
                    className={cn('pl-10', errors.gameTime && 'border-cardinal')}
                  />
                </div>
                {errors.gameTime && (
                  <p className="mt-1 text-xs text-cardinal">{errors.gameTime}</p>
                )}
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-navy focus:border-navy"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Shared time for series */}
          {isSeries && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div>
                <label htmlFor="gameTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Game Time (all games)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="time"
                    id="gameTime"
                    name="gameTime"
                    value={formData.gameTime}
                    onChange={handleInputChange}
                    className={cn('pl-10', errors.gameTime && 'border-cardinal')}
                  />
                </div>
                {errors.gameTime && (
                  <p className="mt-1 text-xs text-cardinal">{errors.gameTime}</p>
                )}
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-navy focus:border-navy"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </CardTitle>
          <CardDescription>
            Select or enter the game location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick location selection */}
          <div className="flex flex-wrap gap-2">
            {DEFAULT_LOCATIONS.map((location) => (
              <button
                key={location.name}
                type="button"
                onClick={() => handleLocationSelect(location)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full border transition-colors',
                  formData.locationName === location.name
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-navy hover:text-navy'
                )}
              >
                {location.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
                Field/Stadium Name
              </label>
              <Input
                type="text"
                id="locationName"
                name="locationName"
                value={formData.locationName}
                onChange={handleInputChange}
                placeholder="e.g., Harbor Field"
              />
            </div>

            <div>
              <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Address/Details
              </label>
              <Input
                type="text"
                id="locationAddress"
                name="locationAddress"
                value={formData.locationAddress}
                onChange={handleInputChange}
                placeholder="e.g., 123 Main St, Diamond 1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>
            Add any additional notes or special instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Optional game notes..."
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-navy focus:border-navy resize-none"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel || (() => router.back())}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          {isSeries && (
            <Badge variant="secondary">
              Creating {seriesCount} games
            </Badge>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create'
                  ? isSeries
                    ? `Create ${seriesCount} Games`
                    : 'Create Game'
                  : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default GameForm;
