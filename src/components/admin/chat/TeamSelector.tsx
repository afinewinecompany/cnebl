"use client";

/**
 * TeamSelector Component
 *
 * Dropdown for admins to select which team's chat to view.
 * Shows team name, color swatch, and unread count.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown, MessageCircle } from "lucide-react";

export interface TeamOption {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
  unreadCount?: number;
}

export interface TeamSelectorProps {
  teams: TeamOption[];
  selectedTeamId: string;
  onSelect: (teamId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TeamSelector({
  teams,
  selectedTeamId,
  onSelect,
  disabled = false,
  className,
}: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (teamId: string) => {
    onSelect(teamId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="team-selector-label"
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-retro border border-cream-dark bg-ivory px-4 py-3",
          "font-headline text-sm font-medium tracking-wide uppercase",
          "transition-colors duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-navy ring-offset-2",
          !disabled && "hover:bg-cream-dark/50"
        )}
      >
        <span className="flex items-center gap-3">
          {/* Team color swatch */}
          {selectedTeam && (
            <span
              className="h-6 w-6 shrink-0 rounded-md shadow-sm"
              style={{ backgroundColor: selectedTeam.primaryColor }}
              aria-hidden="true"
            />
          )}
          <span className="truncate text-charcoal-dark">
            {selectedTeam?.name || "Select Team"}
          </span>
        </span>

        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-charcoal-light transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-0 right-0 top-full z-50 mt-1",
              "max-h-72 overflow-y-auto rounded-retro border border-cream-dark bg-ivory shadow-lg"
            )}
            role="listbox"
            aria-labelledby="team-selector-label"
          >
            {teams.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-charcoal-light">
                No teams available
              </div>
            ) : (
              teams.map((team) => {
                const isSelected = team.id === selectedTeamId;

                return (
                  <button
                    key={team.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(team.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3",
                      "font-body text-sm",
                      "transition-colors duration-100",
                      "focus:outline-none focus-visible:bg-cream-dark",
                      isSelected
                        ? "bg-navy/5 text-navy"
                        : "text-charcoal hover:bg-cream-dark/50"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {/* Team color swatch */}
                      <span
                        className="h-6 w-6 shrink-0 rounded-md shadow-sm"
                        style={{ backgroundColor: team.primaryColor }}
                        aria-hidden="true"
                      />
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-xs text-charcoal-light">
                          {team.abbreviation}
                        </span>
                      </span>
                    </span>

                    {/* Unread badge */}
                    {team.unreadCount && team.unreadCount > 0 && (
                      <span className="flex items-center gap-1.5 rounded-full bg-cardinal px-2 py-0.5 text-xs font-medium text-chalk">
                        <MessageCircle className="h-3 w-3" />
                        {team.unreadCount > 99 ? "99+" : team.unreadCount}
                      </span>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-navy"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeamSelector;
