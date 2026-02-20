"use client";

/**
 * AdminMessengerView Component
 *
 * Admin wrapper for team chat management.
 * Provides team selector and full messenger access.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TeamSelector, TeamOption } from "./TeamSelector";
import { TeamMessengerContainer } from "@/components/chat";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2 } from "lucide-react";
import type { UserRole } from "@/types/auth";

interface AdminMessengerViewProps {
  /** Current user ID */
  currentUserId: string;
  /** Current user role (should be admin or commissioner) */
  currentUserRole: UserRole;
  /** Initial list of teams */
  initialTeams: TeamOption[];
  /** Initial selected team ID */
  initialTeamId?: string;
  /** Additional CSS classes */
  className?: string;
}

const STORAGE_KEY = "cnebl-admin-chat-team";

export function AdminMessengerView({
  currentUserId,
  currentUserRole,
  initialTeams,
  initialTeamId,
  className,
}: AdminMessengerViewProps) {
  // Get initial team from localStorage or first team
  const getInitialTeam = (): string => {
    if (initialTeamId) return initialTeamId;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && initialTeams.some((t) => t.id === stored)) {
        return stored;
      }
    }

    return initialTeams[0]?.id || "";
  };

  const [selectedTeamId, setSelectedTeamId] = useState<string>(getInitialTeam);
  const [teams, setTeams] = useState<TeamOption[]>(initialTeams);
  const [isLoading, setIsLoading] = useState(false);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Save selected team to localStorage
  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem(STORAGE_KEY, selectedTeamId);
    }
  }, [selectedTeamId]);

  // Handle team selection
  const handleTeamSelect = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
  }, []);

  if (teams.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12", className)}>
        <Shield className="mb-4 h-12 w-12 text-charcoal-light" />
        <h3 className="mb-2 font-headline text-lg font-semibold uppercase tracking-wide text-navy">
          No Teams Available
        </h3>
        <p className="text-center font-body text-sm text-charcoal-light">
          There are no teams in the league yet.
        </p>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className={cn("flex items-center justify-center p-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Admin Header */}
      <div className="flex items-center justify-between border-b border-cream-dark bg-ivory px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-cardinal/10 text-cardinal">
            <Shield className="mr-1 h-3 w-3" />
            Admin View
          </Badge>
          <span className="text-sm text-charcoal-light">
            Viewing team chats as administrator
          </span>
        </div>
      </div>

      {/* Team Selector */}
      <div className="shrink-0 border-b border-cream-dark bg-cream p-4">
        <label
          id="team-selector-label"
          className="mb-2 block font-headline text-xs font-medium uppercase tracking-wide text-charcoal-light"
        >
          Select Team
        </label>
        <TeamSelector
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelect={handleTeamSelect}
          disabled={isLoading}
        />
      </div>

      {/* Messenger */}
      <div className="min-h-0 flex-1">
        <TeamMessengerContainer
          key={selectedTeamId} // Force remount on team change
          teamId={selectedTeamId}
          teamName={selectedTeam.name}
          teamColor={selectedTeam.primaryColor}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isTeamManager={true} // Admins have full access
          initialChannel="general"
          className="h-full rounded-none border-0"
        />
      </div>
    </div>
  );
}

export default AdminMessengerView;
