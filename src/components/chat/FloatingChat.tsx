"use client";

/**
 * FloatingChat Component
 *
 * Main floating chat interface that combines the button and drawer.
 * Handles state management, authentication checks, and visibility logic.
 *
 * This component should be added to the protected layout to appear on all
 * authenticated pages (except admin pages which have their own chat).
 *
 * @example
 * // In layout.tsx
 * <FloatingChat
 *   user={session.user}
 * />
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingChatButton } from "./FloatingChatButton";
import { FloatingChatDrawer } from "./FloatingChatDrawer";
import { useChannelStore, selectTotalUnread } from "@/stores/channelStore";
import type { SessionUser } from "@/types/auth";

// =============================================================================
// Types
// =============================================================================

interface FloatingChatProps {
  /** Current authenticated user */
  user: SessionUser;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Paths where the floating chat should NOT appear
 * - Admin routes have their own chat interface
 * - Chat-specific pages already show chat
 */
const EXCLUDED_PATHS = [
  "/admin",
  "/chat",
  "/team/chat",
];

/**
 * Check if the current path should hide the floating chat
 */
function shouldHideChat(pathname: string): boolean {
  return EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

// =============================================================================
// Component
// =============================================================================

export function FloatingChat({ user }: FloatingChatProps) {
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasAttemptedRefresh = useRef(false);

  // Use session data if available, fall back to prop
  const currentUser = session?.user || user;
  const teamId = currentUser.teamId;
  const teamName = currentUser.teamName;

  // Get unread count from channel store
  const unreadCount = useChannelStore(
    teamId ? selectTotalUnread(teamId) : () => 0
  );

  // Determine if user can see chat (must have a team)
  const canAccessChat = Boolean(teamId && teamName);

  // Determine if chat should be visible on this page
  const isVisibleOnPage = !shouldHideChat(pathname);

  // Only show if user can access and page allows
  const shouldShow = canAccessChat && isVisibleOnPage;

  // Handle mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for team assignment if session doesn't have team info
  // This handles the case where admin assigns themselves to a team while logged in
  useEffect(() => {
    async function checkAndRefreshTeam() {
      // Skip if already have team info, already attempted refresh, or not mounted
      if (teamId || hasAttemptedRefresh.current || !isMounted) {
        return;
      }

      hasAttemptedRefresh.current = true;

      try {
        // Check if user has a team assignment in the database
        const response = await fetch("/api/user/team-status");
        if (response.ok) {
          const data = await response.json();
          if (data.hasTeam) {
            // Refresh session to get updated team info
            await updateSession({ refreshTeam: true });
          }
        }
      } catch (error) {
        console.error("[FloatingChat] Failed to check team status:", error);
      }
    }

    checkAndRefreshTeam();
  }, [teamId, isMounted, updateSession]);

  // Close drawer when navigating to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Toggle handlers
  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Don't render anything if conditions aren't met
  if (!isMounted || !shouldShow || !teamId) {
    return null;
  }

  return (
    <>
      {/* Chat Drawer */}
      <FloatingChatDrawer
        isOpen={isOpen}
        onClose={handleClose}
        teamId={teamId}
        teamName={teamName || "Team"}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        isTeamManager={currentUser.role === "manager"}
      />

      {/* Floating Action Button */}
      <AnimatePresence>
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.5,
          }}
        >
          <FloatingChatButton
            unreadCount={unreadCount}
            isOpen={isOpen}
            onClick={handleToggle}
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default FloatingChat;
