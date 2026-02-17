'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Calendar,
  Save,
  Copy,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { SeasonResponse } from '@/lib/api/schemas/seasons';

/**
 * Create New Season Page
 *
 * Admin page to create a new season.
 * Includes option to copy settings from a previous season.
 */
export default function NewSeasonPage() {
  const router = useRouter();
  const [existingSeasons, setExistingSeasons] = useState<SeasonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear() + 1,
    startDate: '',
    endDate: '',
    isActive: false,
    registrationOpen: false,
    copyFromSeasonId: '',
  });

  useEffect(() => {
    async function fetchSeasons() {
      try {
        const response = await fetch('/api/seasons');
        if (!response.ok) {
          throw new Error('Failed to fetch seasons');
        }
        const data = await response.json();
        setExistingSeasons(data.data.seasons);
      } catch (err) {
        console.error('Failed to fetch existing seasons:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSeasons();

    // Pre-populate dates for next year
    const nextYear = new Date().getFullYear() + 1;
    setFormData((prev) => ({
      ...prev,
      name: `CNEBL ${nextYear} Summer Season`,
      year: nextYear,
      startDate: `${nextYear}-04-15`,
      endDate: `${nextYear}-09-30`,
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCopyFromSeason = (seasonId: string) => {
    const season = existingSeasons.find((s) => s.id === seasonId);
    if (season) {
      // Copy season settings but update the year
      const nextYear = formData.year;
      const yearDiff = nextYear - season.year;

      // Adjust dates by the year difference
      const startDate = new Date(season.startDate);
      startDate.setFullYear(startDate.getFullYear() + yearDiff);

      const endDate = new Date(season.endDate);
      endDate.setFullYear(endDate.getFullYear() + yearDiff);

      setFormData((prev) => ({
        ...prev,
        name: season.name.replace(String(season.year), String(nextYear)),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        copyFromSeasonId: seasonId,
      }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string[]> = {};

    if (!formData.name.trim()) {
      errors.name = ['Season name is required'];
    }

    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      errors.year = ['Year must be between 2000 and 2100'];
    }

    if (!formData.startDate) {
      errors.startDate = ['Start date is required'];
    }

    if (!formData.endDate) {
      errors.endDate = ['End date is required'];
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.endDate = ['End date must be after start date'];
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          year: formData.year,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          registrationOpen: formData.registrationOpen,
          copyFromSeasonId: formData.copyFromSeasonId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error?.details?.errors) {
          setValidationErrors(data.error.details.errors);
          return;
        }
        throw new Error(data.error?.message || 'Failed to create season');
      }

      const data = await response.json();
      router.push(`/admin/seasons/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return validationErrors[field]?.[0];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/seasons"
          className="inline-flex items-center text-sm text-charcoal-light hover:text-navy transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Seasons
        </Link>
        <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
          Create New Season
        </h1>
        <p className="text-charcoal-light font-body mt-1">
          Set up a new season for the league
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-cardinal/10 border border-cardinal/30 text-cardinal px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Season Details</CardTitle>
              <CardDescription>
                Enter the basic information for the new season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Season Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., CNEBL 2027 Summer Season"
                    error={!!getFieldError('name')}
                  />
                  {getFieldError('name') && (
                    <p className="text-sm text-cardinal mt-1">{getFieldError('name')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Year *
                  </label>
                  <Input
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                    min={2000}
                    max={2100}
                    error={!!getFieldError('year')}
                  />
                  {getFieldError('year') && (
                    <p className="text-sm text-cardinal mt-1">{getFieldError('year')}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Start Date *
                    </label>
                    <Input
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      error={!!getFieldError('startDate')}
                    />
                    {getFieldError('startDate') && (
                      <p className="text-sm text-cardinal mt-1">{getFieldError('startDate')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      End Date *
                    </label>
                    <Input
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      error={!!getFieldError('endDate')}
                    />
                    {getFieldError('endDate') && (
                      <p className="text-sm text-cardinal mt-1">{getFieldError('endDate')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-charcoal">
                      Set as active season
                    </label>
                  </div>
                  <p className="text-xs text-charcoal-light ml-6">
                    This will deactivate any other active season
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="registrationOpen"
                      name="registrationOpen"
                      checked={formData.registrationOpen}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                    />
                    <label htmlFor="registrationOpen" className="text-sm font-medium text-charcoal">
                      Registration is open
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center gap-3">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Creating...' : 'Create Season'}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/seasons">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Copy from Previous Season */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Copy from Season
              </CardTitle>
              <CardDescription>
                Optionally copy settings from a previous season
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : existingSeasons.length > 0 ? (
                <div className="space-y-2">
                  {existingSeasons.map((season) => (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => handleCopyFromSeason(season.id)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        formData.copyFromSeasonId === season.id
                          ? 'border-navy bg-navy/5'
                          : 'border-gray-200 hover:border-navy/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-charcoal text-sm">
                            {season.name}
                          </p>
                          <p className="text-xs text-charcoal-light">
                            {season.stats?.teamsCount || 0} teams, {season.stats?.playersCount || 0} players
                          </p>
                        </div>
                        {formData.copyFromSeasonId === season.id && (
                          <CheckCircle className="w-5 h-5 text-navy" />
                        )}
                      </div>
                    </button>
                  ))}

                  {formData.copyFromSeasonId && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, copyFromSeasonId: '' }))}
                      className="w-full text-sm text-charcoal-light hover:text-navy transition-colors mt-2"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 text-charcoal-light mx-auto mb-2" />
                  <p className="text-sm text-charcoal-light">
                    No existing seasons to copy from
                  </p>
                </div>
              )}

              {formData.copyFromSeasonId && (
                <div className="mt-4 p-3 bg-navy/5 rounded-lg border border-navy/20">
                  <p className="text-xs text-charcoal-light">
                    <strong className="text-navy">Note:</strong> Copying a season will copy
                    team structures. You will still need to configure the schedule and
                    player assignments separately.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Info */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h4 className="font-medium text-charcoal text-sm mb-2">
                What happens when you create a season?
              </h4>
              <ul className="text-xs text-charcoal-light space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-field flex-shrink-0 mt-0.5" />
                  <span>A new season record is created with your specified dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-field flex-shrink-0 mt-0.5" />
                  <span>If copying from a previous season, team structures are duplicated</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-field flex-shrink-0 mt-0.5" />
                  <span>You can then add teams, schedule games, and open registration</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
