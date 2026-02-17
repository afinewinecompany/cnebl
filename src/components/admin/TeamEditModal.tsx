'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X, Shield, AlertCircle, Palette } from 'lucide-react';
import type { TeamWithManager } from '@/types';

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWithManager | null; // null = creating new team
  onSave: (data: TeamFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface TeamFormData {
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
}

// Preset team colors for quick selection
const PRESET_COLORS = [
  { name: 'Navy', primary: '#092C5C', secondary: '#8FBCE6' },
  { name: 'Red', primary: '#C41E3A', secondary: '#FFD700' },
  { name: 'Green', primary: '#003831', secondary: '#EFB21E' },
  { name: 'Purple', primary: '#33006F', secondary: '#C4CED4' },
  { name: 'Orange', primary: '#FA4616', secondary: '#27251F' },
  { name: 'Blue', primary: '#0C2C56', secondary: '#005C5C' },
];

/**
 * TeamEditModal Component
 *
 * Modal dialog for creating or editing a team.
 */
export function TeamEditModal({
  isOpen,
  onClose,
  team,
  onSave,
  isLoading = false,
}: TeamEditModalProps) {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#092C5C');
  const [secondaryColor, setSecondaryColor] = useState('#8FBCE6');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = team !== null;

  // Reset form when team changes
  useEffect(() => {
    if (team) {
      setName(team.name);
      setAbbreviation(team.abbreviation);
      setPrimaryColor(team.primaryColor || '#092C5C');
      setSecondaryColor(team.secondaryColor || '#8FBCE6');
      setIsActive(team.isActive);
    } else {
      setName('');
      setAbbreviation('');
      setPrimaryColor('#092C5C');
      setSecondaryColor('#8FBCE6');
      setIsActive(true);
    }
    setErrors({});
  }, [team, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (name.length > 50) {
      newErrors.name = 'Team name must be 50 characters or less';
    }

    if (!abbreviation.trim()) {
      newErrors.abbreviation = 'Abbreviation is required';
    } else if (abbreviation.length < 2 || abbreviation.length > 4) {
      newErrors.abbreviation = 'Abbreviation must be 2-4 characters';
    }

    if (!primaryColor) {
      newErrors.primaryColor = 'Primary color is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSave({
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      primaryColor,
      secondaryColor,
      isActive,
    });
  };

  const applyPresetColor = (preset: typeof PRESET_COLORS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {abbreviation || <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide">
                {isEditMode ? 'Edit Team' : 'New Team'}
              </h2>
              <p className="text-sm text-charcoal-light">
                {isEditMode ? `Editing ${team.name}` : 'Create a new team'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-charcoal-light" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Team Name */}
          <div>
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-charcoal mb-2"
            >
              Team Name <span className="text-cardinal">*</span>
            </label>
            <Input
              id="teamName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sea Dogs"
              error={!!errors.name}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-cardinal flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Abbreviation */}
          <div>
            <label
              htmlFor="abbreviation"
              className="block text-sm font-medium text-charcoal mb-2"
            >
              Abbreviation <span className="text-cardinal">*</span>
            </label>
            <Input
              id="abbreviation"
              type="text"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
              placeholder="e.g. SEA"
              error={!!errors.abbreviation}
              disabled={isLoading}
              className="max-w-[120px] uppercase"
              maxLength={4}
            />
            {errors.abbreviation && (
              <p className="mt-2 text-sm text-cardinal flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.abbreviation}
              </p>
            )}
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Quick Colors
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPresetColor(preset)}
                  className={cn(
                    'w-8 h-8 rounded-lg border-2 transition-all',
                    primaryColor === preset.primary
                      ? 'border-navy ring-2 ring-navy/30'
                      : 'border-gray-200 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: preset.primary }}
                  title={preset.name}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="primaryColor"
                className="block text-sm font-medium text-charcoal mb-2"
              >
                Primary Color <span className="text-cardinal">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                  disabled={isLoading}
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#000000"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="secondaryColor"
                className="block text-sm font-medium text-charcoal mb-2"
              >
                Secondary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                  disabled={isLoading}
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#FFFFFF"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
                disabled={isLoading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy"></div>
            </label>
            <div>
              <span className="text-sm font-medium text-charcoal">Active Team</span>
              <p className="text-xs text-charcoal-light">
                Inactive teams won&apos;t appear in schedules or standings
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-charcoal-light uppercase tracking-wide mb-3">Preview</p>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-headline font-bold text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {abbreviation || '???'}
              </div>
              <div>
                <p className="font-headline text-lg font-semibold text-navy uppercase tracking-wide">
                  {name || 'Team Name'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <span className="text-xs text-charcoal-light">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">&#8987;</span>
                Saving...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                {isEditMode ? 'Save Changes' : 'Create Team'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
