'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X, UserPlus, Shield, AlertCircle } from 'lucide-react';
import type { FieldPosition, BattingSide, ThrowingArm } from '@/types/database.types';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  teamId: string | null;
  teamName: string | null;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition | null;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide | null;
  throws: ThrowingArm | null;
  isCaptain: boolean;
}

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
}

interface PlayerAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  teams: TeamData[];
  onSave: (data: {
    teamId: string;
    jerseyNumber: string;
    primaryPosition: FieldPosition;
    secondaryPosition: FieldPosition | null;
    bats: BattingSide;
    throws: ThrowingArm;
    isCaptain: boolean;
  }) => void;
}

const FIELD_POSITIONS: FieldPosition[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL'
];

const BATTING_SIDES: { value: BattingSide; label: string }[] = [
  { value: 'R', label: 'Right' },
  { value: 'L', label: 'Left' },
  { value: 'S', label: 'Switch' },
];

const THROWING_ARMS: { value: ThrowingArm; label: string }[] = [
  { value: 'R', label: 'Right' },
  { value: 'L', label: 'Left' },
];

/**
 * PlayerAssignment Component
 *
 * Modal dialog for assigning a player to a team with player details.
 */
export function PlayerAssignment({
  isOpen,
  onClose,
  user,
  teams,
  onSave,
}: PlayerAssignmentProps) {
  const [teamId, setTeamId] = useState<string>('');
  const [jerseyNumber, setJerseyNumber] = useState<string>('');
  const [primaryPosition, setPrimaryPosition] = useState<FieldPosition>('UTIL');
  const [secondaryPosition, setSecondaryPosition] = useState<FieldPosition | ''>('');
  const [bats, setBats] = useState<BattingSide>('R');
  const [throws, setThrows] = useState<ThrowingArm>('R');
  const [isCaptain, setIsCaptain] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setTeamId(user.teamId || '');
      setJerseyNumber(user.jerseyNumber || '');
      setPrimaryPosition(user.primaryPosition || 'UTIL');
      setSecondaryPosition(user.secondaryPosition || '');
      setBats(user.bats || 'R');
      setThrows(user.throws || 'R');
      setIsCaptain(user.isCaptain || false);
      setErrors({});
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!teamId) {
      newErrors.teamId = 'Please select a team';
    }

    if (!jerseyNumber) {
      newErrors.jerseyNumber = 'Jersey number is required';
    } else if (!/^\d+$/.test(jerseyNumber)) {
      newErrors.jerseyNumber = 'Jersey number must be a number';
    }

    if (!primaryPosition) {
      newErrors.primaryPosition = 'Primary position is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSave({
      teamId,
      jerseyNumber,
      primaryPosition,
      secondaryPosition: secondaryPosition || null,
      bats,
      throws,
      isCaptain,
    });
  };

  const selectedTeam = teams.find((t) => t.id === teamId);

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
            <div className="w-10 h-10 bg-field/10 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-field" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide">
                Assign Player
              </h2>
              <p className="text-sm text-charcoal-light">{user.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-charcoal-light" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Team <span className="text-cardinal">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setTeamId(team.id)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    teamId === team.id
                      ? 'border-navy bg-navy/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.abbreviation}
                    </div>
                    <span className="text-sm font-medium text-charcoal">
                      {team.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {errors.teamId && (
              <p className="mt-2 text-sm text-cardinal flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.teamId}
              </p>
            )}
          </div>

          {/* Jersey Number */}
          <div>
            <label
              htmlFor="jerseyNumber"
              className="block text-sm font-medium text-charcoal mb-2"
            >
              Jersey Number <span className="text-cardinal">*</span>
            </label>
            <Input
              id="jerseyNumber"
              type="text"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="e.g. 42"
              error={!!errors.jerseyNumber}
              className="max-w-[120px]"
            />
            {errors.jerseyNumber && (
              <p className="mt-2 text-sm text-cardinal flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.jerseyNumber}
              </p>
            )}
          </div>

          {/* Positions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Primary Position <span className="text-cardinal">*</span>
              </label>
              <select
                value={primaryPosition}
                onChange={(e) => setPrimaryPosition(e.target.value as FieldPosition)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-chalk px-4 py-2 font-body text-sm text-charcoal transition-all focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)]"
              >
                {FIELD_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Secondary Position
              </label>
              <select
                value={secondaryPosition}
                onChange={(e) => setSecondaryPosition(e.target.value as FieldPosition | '')}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-chalk px-4 py-2 font-body text-sm text-charcoal transition-all focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)]"
              >
                <option value="">None</option>
                {FIELD_POSITIONS.filter((pos) => pos !== primaryPosition).map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bats / Throws */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Bats
              </label>
              <div className="flex gap-2">
                {BATTING_SIDES.map((side) => (
                  <button
                    key={side.value}
                    type="button"
                    onClick={() => setBats(side.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                      bats === side.value
                        ? 'border-navy bg-navy text-chalk'
                        : 'border-gray-200 text-charcoal hover:border-gray-300'
                    )}
                  >
                    {side.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Throws
              </label>
              <div className="flex gap-2">
                {THROWING_ARMS.map((arm) => (
                  <button
                    key={arm.value}
                    type="button"
                    onClick={() => setThrows(arm.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                      throws === arm.value
                        ? 'border-navy bg-navy text-chalk'
                        : 'border-gray-200 text-charcoal hover:border-gray-300'
                    )}
                  >
                    {arm.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Captain */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCaptain}
                onChange={(e) => setIsCaptain(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy"></div>
            </label>
            <div>
              <span className="text-sm font-medium text-charcoal">Team Captain</span>
              <p className="text-xs text-charcoal-light">
                Captains have additional team management permissions
              </p>
            </div>
          </div>

          {/* Selected Team Preview */}
          {selectedTeam && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedTeam.primaryColor }}
                >
                  {selectedTeam.abbreviation}
                </div>
                <div>
                  <p className="font-medium text-charcoal">
                    Assigning to <span className="text-navy">{selectedTeam.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-charcoal-light">
                    <span>#{jerseyNumber || '?'}</span>
                    <span>|</span>
                    <span>{primaryPosition}</span>
                    {secondaryPosition && (
                      <>
                        <span>/</span>
                        <span>{secondaryPosition}</span>
                      </>
                    )}
                    <span>|</span>
                    <span>{bats}/{throws}</span>
                    {isCaptain && (
                      <Badge variant="gold" size="sm">Captain</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default" onClick={handleSubmit}>
            <Shield className="w-4 h-4 mr-2" />
            Assign Player
          </Button>
        </div>
      </div>
    </div>
  );
}
