"use client";

/**
 * FloatingChatButton Component
 *
 * A sleek, animated floating action button for team chat.
 * Shows unread message count and has smooth hover/click animations.
 *
 * @example
 * <FloatingChatButton
 *   unreadCount={3}
 *   isOpen={false}
 *   onClick={() => setIsOpen(true)}
 * />
 */

import { forwardRef } from "react";
import { motion, type Variants } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface FloatingChatButtonProps {
  /** Number of unread messages to display */
  unreadCount?: number;
  /** Whether the chat drawer is currently open */
  isOpen: boolean;
  /** Click handler to toggle chat */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Animation Variants
// =============================================================================

const buttonVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1], // easeOut cubic bezier
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

const iconVariants: Variants = {
  closed: {
    rotate: 0,
    scale: 1,
  },
  open: {
    rotate: 90,
    scale: 0.9,
  },
};

const badgeVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

const pulseRingVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 0,
  },
  animate: {
    scale: [1, 1.4, 1.4],
    opacity: [0, 0.4, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0, 0, 0.2, 1], // easeOut cubic bezier
    },
  },
};

// =============================================================================
// Component
// =============================================================================

export const FloatingChatButton = forwardRef<HTMLButtonElement, FloatingChatButtonProps>(
  ({ unreadCount = 0, isOpen, onClick, className }, ref) => {
    const hasUnread = unreadCount > 0 && !isOpen;

    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        className={cn(
          // Base styles
          "relative flex items-center justify-center",
          "h-14 w-14 rounded-full",
          // Gradient background
          "bg-gradient-to-br from-primary via-primary-light to-accent",
          // Shadow and depth
          "shadow-lg shadow-primary/25",
          // Focus and accessibility
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          // Cursor
          "cursor-pointer",
          className
        )}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        aria-label={isOpen ? "Close team chat" : `Open team chat${hasUnread ? `, ${unreadCount} unread messages` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {/* Pulse ring animation for unread messages */}
        {hasUnread && (
          <motion.span
            className="absolute inset-0 rounded-full bg-accent"
            variants={pulseRingVariants}
            initial="initial"
            animate="animate"
            aria-hidden="true"
          />
        )}

        {/* Glassmorphism inner circle */}
        <span
          className={cn(
            "absolute inset-[3px] rounded-full",
            "bg-gradient-to-br from-white/20 to-transparent",
            "backdrop-blur-[1px]"
          )}
          aria-hidden="true"
        />

        {/* Icon container with animation */}
        <motion.span
          className="relative z-10 flex items-center justify-center"
          variants={iconVariants}
          animate={isOpen ? "open" : "closed"}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" strokeWidth={2.5} />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
          )}
        </motion.span>

        {/* Unread badge */}
        {hasUnread && (
          <motion.span
            className={cn(
              "absolute -right-1 -top-1 z-20",
              "flex h-6 min-w-6 items-center justify-center",
              "rounded-full px-1.5",
              "bg-danger text-white",
              "text-xs font-bold",
              "shadow-md shadow-danger/30",
              "border-2 border-white"
            )}
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>
    );
  }
);

FloatingChatButton.displayName = "FloatingChatButton";

export default FloatingChatButton;
