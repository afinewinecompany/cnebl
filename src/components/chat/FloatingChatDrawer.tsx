"use client";

/**
 * FloatingChatDrawer Component
 *
 * A sleek, animated chat drawer that slides up from the floating button.
 * Contains the TeamMessengerContainer for full chat functionality.
 *
 * @example
 * <FloatingChatDrawer
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   teamId="rays"
 *   teamName="Rays"
 *   currentUserId={user.id}
 *   currentUserRole="player"
 * />
 */

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X, Minimize2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamMessengerContainer } from "./TeamMessengerContainer";
import type { UserRole } from "@/types/auth";

// =============================================================================
// Types
// =============================================================================

interface FloatingChatDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Team ID for the chat */
  teamId: string;
  /** Team name for display */
  teamName: string;
  /** Optional team color for branding */
  teamColor?: string;
  /** Current user's ID */
  currentUserId: string;
  /** Current user's role */
  currentUserRole: UserRole;
  /** Whether user is team manager */
  isTeamManager?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Animation Variants
// =============================================================================

const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      delay: 0.1,
    },
  },
};

const drawerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1], // easeIn cubic bezier
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.2,
    },
  },
};

// =============================================================================
// Component
// =============================================================================

export function FloatingChatDrawer({
  isOpen,
  onClose,
  teamId,
  teamName,
  teamColor = "#1E3A5F",
  currentUserId,
  currentUserRole,
  isTeamManager = false,
  className,
}: FloatingChatDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Add keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus trap within drawer when open
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      // Focus the drawer when it opens
      const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      // Only prevent scroll on smaller screens
      if (window.innerWidth < 768) {
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Chat Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${teamName} team chat`}
            className={cn(
              // Positioning
              "fixed z-50",
              // Mobile: full screen with padding
              "inset-4 bottom-20",
              // Desktop: positioned above FAB
              "md:inset-auto md:bottom-24 md:right-6",
              "md:h-[600px] md:w-[400px]",
              // Large screens
              "lg:h-[650px] lg:w-[420px]",
              // Container styling
              "flex flex-col overflow-hidden",
              "rounded-2xl",
              // Glass morphism background
              "bg-white/95 backdrop-blur-xl",
              // Border and shadow
              "border border-gray-200/80",
              "shadow-2xl shadow-gray-900/20",
              // Ring effect
              "ring-1 ring-black/5",
              className
            )}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.header
              className={cn(
                "relative flex items-center justify-between",
                "px-4 py-3",
                // Gradient header matching team color
                "bg-gradient-to-r from-primary via-primary-light to-primary",
                // Bottom border accent
                "border-b border-white/10"
              )}
              style={{
                backgroundImage: `linear-gradient(135deg, ${teamColor} 0%, ${adjustColor(teamColor, 20)} 50%, ${teamColor} 100%)`,
              }}
              variants={headerVariants}
            >
              {/* Team info */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center",
                    "rounded-xl",
                    "bg-white/15 backdrop-blur-sm",
                    "border border-white/20"
                  )}
                >
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm leading-tight">
                    {teamName}
                  </h2>
                  <p className="text-xs text-white/70">Team Chat</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {/* Minimize button (larger screens) */}
                <button
                  onClick={onClose}
                  className={cn(
                    "hidden md:flex",
                    "h-8 w-8 items-center justify-center",
                    "rounded-lg",
                    "bg-white/10 hover:bg-white/20",
                    "text-white/80 hover:text-white",
                    "transition-colors duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  )}
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center",
                    "rounded-lg",
                    "bg-white/10 hover:bg-white/20",
                    "text-white/80 hover:text-white",
                    "transition-colors duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  )}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Decorative gradient overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"
                aria-hidden="true"
              />
            </motion.header>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <TeamMessengerContainer
                teamId={teamId}
                teamName={teamName}
                teamColor={teamColor}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isTeamManager={isTeamManager}
                initialChannel="general"
                className="h-full border-0 shadow-none rounded-none"
              />
            </div>

            {/* Bottom accent line */}
            <div
              className="h-1 bg-gradient-to-r from-accent via-primary to-accent"
              aria-hidden="true"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Adjust a hex color's brightness
 * @param color - Hex color string
 * @param percent - Percentage to lighten (positive) or darken (negative)
 */
function adjustColor(color: string, percent: number): string {
  // Remove # if present
  const hex = color.replace("#", "");

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjust = (value: number) => {
    const adjusted = value + (255 * percent) / 100;
    return Math.min(255, Math.max(0, Math.round(adjusted)));
  };

  // Convert back to hex
  const toHex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

export default FloatingChatDrawer;
