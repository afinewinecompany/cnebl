'use client';

import * as React from 'react';
import { useState } from 'react';
import { Check, X, HelpCircle, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AvailabilityStatus } from '@/types';

interface AvailabilitySelectorProps {
  gameId: string;
  currentStatus?: AvailabilityStatus;
  currentNote?: string;
  onUpdate?: (status: AvailabilityStatus, note?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  AvailabilityStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  available: {
    label: 'Available',
    icon: Check,
    color: 'text-field',
    bgColor: 'bg-field/10',
    borderColor: 'border-field',
  },
  unavailable: {
    label: 'Unavailable',
    icon: X,
    color: 'text-cardinal',
    bgColor: 'bg-cardinal/10',
    borderColor: 'border-cardinal',
  },
  tentative: {
    label: 'Maybe',
    icon: HelpCircle,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold',
  },
  no_response: {
    label: 'No Response',
    icon: HelpCircle,
    color: 'text-charcoal-light',
    bgColor: 'bg-cream',
    borderColor: 'border-cream-dark',
  },
};

/**
 * AvailabilitySelector Component
 *
 * Allows players to mark their availability for a game
 * - Available / Unavailable / Maybe options
 * - Optional note for absence reason
 */
export function AvailabilitySelector({
  gameId,
  currentStatus = 'no_response',
  currentNote = '',
  onUpdate,
  disabled = false,
  className,
}: AvailabilitySelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(currentStatus);
  const [note, setNote] = useState(currentNote);
  const [showNoteInput, setShowNoteInput] = useState(!!currentNote);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions: AvailabilityStatus[] = ['available', 'unavailable', 'tentative'];

  const handleStatusSelect = async (status: AvailabilityStatus) => {
    if (disabled || isLoading) return;

    setSelectedStatus(status);
    setError(null);

    // Show note input for unavailable or tentative
    if (status === 'unavailable' || status === 'tentative') {
      setShowNoteInput(true);
    }

    // If callback provided, update immediately for "available"
    if (onUpdate && status === 'available') {
      setIsLoading(true);
      try {
        await onUpdate(status, undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
        setSelectedStatus(currentStatus);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmitNote = async () => {
    if (disabled || isLoading || !onUpdate) return;

    setIsLoading(true);
    setError(null);

    try {
      await onUpdate(selectedStatus, note || undefined);
      // Keep the note input visible after submission
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Status Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {statusOptions.map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isSelected = selectedStatus === status;

          return (
            <button
              key={status}
              onClick={() => handleStatusSelect(status)}
              disabled={disabled || isLoading}
              className={cn(
                'w-full sm:flex-1 flex items-center justify-center gap-2 py-4 min-h-[52px] px-4 rounded-retro border-2 transition-all',
                'font-headline text-sm uppercase tracking-wide',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leather',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-[0.98] active:brightness-95',
                isSelected
                  ? cn(config.bgColor, config.borderColor, config.color)
                  : 'border-cream-dark bg-chalk text-charcoal hover:bg-cream'
              )}
              aria-pressed={isSelected}
              aria-label={`Mark as ${config.label}`}
            >
              {isSelected && <Check className="w-5 h-5" aria-hidden="true" />}
              {!isSelected && <Icon className="w-5 h-5" aria-hidden="true" />}
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Note Input */}
      {showNoteInput && (selectedStatus === 'unavailable' || selectedStatus === 'tentative') && (
        <div className="space-y-2 p-3 bg-cream rounded-retro border border-cream-dark">
          <label className="flex items-center gap-2 text-sm font-headline uppercase tracking-wide text-navy">
            <MessageSquare className="w-4 h-4" />
            {selectedStatus === 'unavailable' ? 'Reason for absence' : 'Add a note'}
            <span className="text-charcoal-light font-normal normal-case">(optional)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder={
                selectedStatus === 'unavailable'
                  ? 'e.g., Work commitment, family event...'
                  : 'e.g., Will try to make it, depends on work...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              className="flex-1 min-h-[48px] text-base"
              maxLength={200}
            />
            <Button
              onClick={handleSubmitNote}
              disabled={isLoading}
              size="sm"
              className="shrink-0 min-h-[48px] w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-2 bg-cardinal/10 border border-cardinal/20 rounded text-sm text-cardinal">
          {error}
        </div>
      )}

      {/* Current Status Display (when disabled or loading) */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-charcoal-light mr-2" />
          <span className="text-sm text-charcoal-light">Updating...</span>
        </div>
      )}
    </div>
  );
}

/**
 * AvailabilityBadge Component
 *
 * Compact display of availability status
 */
export function AvailabilityBadge({
  status,
  className,
}: {
  status: AvailabilityStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1',
        config.bgColor,
        config.color,
        'border',
        config.borderColor,
        className
      )}
      variant="outline"
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
