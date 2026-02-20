"use client";

/**
 * ChannelBadge Component
 *
 * Displays unread message count for a channel tab.
 * Shows "9+" when count exceeds 9.
 * Animates on entrance and when count increases.
 *
 * @example
 * <ChannelBadge count={5} />
 * <ChannelBadge count={15} variant="important" />
 */

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ChannelBadgeProps {
  /** Number of unread messages */
  count: number;
  /** Visual variant - important uses cardinal, default uses navy */
  variant?: "important" | "default";
  /** Additional CSS classes */
  className?: string;
}

export function ChannelBadge({
  count,
  variant = "default",
  className,
}: ChannelBadgeProps) {
  // Don't render if no unread messages
  if (count <= 0) {
    return null;
  }

  // Display "9+" for counts over 9
  const displayCount = count > 9 ? "9+" : count.toString();

  // Screen reader label
  const ariaLabel = `${count} unread message${count === 1 ? "" : "s"}`;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count > 9 ? "overflow" : count}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 25,
        }}
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[18px] h-[18px] px-1.5",
          "rounded-full text-[10px] font-headline font-bold",
          "shadow-sm",
          variant === "important"
            ? "bg-cardinal text-chalk"
            : "bg-navy text-chalk",
          className
        )}
        aria-label={ariaLabel}
        role="status"
      >
        {displayCount}
      </motion.span>
    </AnimatePresence>
  );
}

export default ChannelBadge;
