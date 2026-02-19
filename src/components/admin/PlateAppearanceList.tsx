'use client';

import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlateAppearanceEntry as PlateAppearanceEntryComponent } from './PlateAppearanceEntry';
import type { PlateAppearanceEntry } from '@/types/plate-appearance.types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface PlateAppearanceListProps {
  plateAppearances: PlateAppearanceEntry[];
  onUpdate: (plateAppearances: PlateAppearanceEntry[]) => void;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PlateAppearanceList Component
 *
 * Manages a list of plate appearances for a player. Provides functionality
 * for adding, updating, and deleting individual plate appearances with
 * automatic renumbering when entries are removed.
 *
 * Usage:
 * ```tsx
 * const [plateAppearances, setPlateAppearances] = useState<PlateAppearanceEntry[]>([]);
 *
 * <PlateAppearanceList
 *   plateAppearances={plateAppearances}
 *   onUpdate={setPlateAppearances}
 *   disabled={isSaving}
 * />
 * ```
 */
export function PlateAppearanceList({
  plateAppearances,
  onUpdate,
  disabled = false,
}: PlateAppearanceListProps) {
  /**
   * Create a new empty plate appearance entry
   */
  const createNewPA = useCallback((): PlateAppearanceEntry => {
    return {
      id: crypto.randomUUID(),
      paNumber: plateAppearances.length + 1,
      resultType: null as unknown as PlateAppearanceEntry['resultType'],
      resultSubtype: null as unknown as PlateAppearanceEntry['resultSubtype'],
      notation: '',
      rbiOnPlay: 0,
      runScored: false,
      hasChanges: true,
    };
  }, [plateAppearances.length]);

  /**
   * Add a new plate appearance to the list
   */
  const handleAddPA = useCallback(() => {
    const newPA = createNewPA();
    onUpdate([...plateAppearances, newPA]);
  }, [createNewPA, plateAppearances, onUpdate]);

  /**
   * Update a specific plate appearance
   * The PlateAppearanceEntry component passes the full updated PA object
   */
  const handleUpdatePA = useCallback(
    (updatedPA: PlateAppearanceEntry) => {
      const updated = plateAppearances.map((pa) => {
        if (pa.id !== updatedPA.id) return pa;
        return {
          ...updatedPA,
          hasChanges: true,
        };
      });
      onUpdate(updated);
    },
    [plateAppearances, onUpdate]
  );

  /**
   * Delete a plate appearance and renumber remaining entries
   */
  const handleDeletePA = useCallback(
    (id: string) => {
      const filtered = plateAppearances.filter((pa) => pa.id !== id);
      // Renumber remaining plate appearances
      const renumbered = filtered.map((pa, index) => ({
        ...pa,
        paNumber: index + 1,
        hasChanges: true,
      }));
      onUpdate(renumbered);
    },
    [plateAppearances, onUpdate]
  );

  return (
    <div className="space-y-0">
      {/* Plate Appearance Entries */}
      {plateAppearances.length > 0 ? (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {plateAppearances.map((pa, index) => (
            <div
              key={pa.id}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
            >
              <PlateAppearanceEntryComponent
                pa={pa}
                paNumber={pa.paNumber}
                onUpdate={handleUpdatePA}
                onDelete={() => handleDeletePA(pa.id)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 px-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-4">
            No plate appearances recorded yet.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPA}
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Plate Appearance
          </Button>
        </div>
      )}

      {/* Add Plate Appearance Button */}
      {plateAppearances.length > 0 && (
        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPA}
            disabled={disabled}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Plate Appearance
          </Button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { PlateAppearanceListProps };
