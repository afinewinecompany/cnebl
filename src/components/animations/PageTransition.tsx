"use client";

/**
 * PageTransition Component
 *
 * Wrapper component for page-level transitions using AnimatePresence
 * Works with Next.js App Router for smooth page transitions
 *
 * @example
 * // In layout.tsx
 * <PageTransition>{children}</PageTransition>
 *
 * // With custom animation
 * <PageTransition variant="slideUp" duration={0.4}>
 *   {children}
 * </PageTransition>
 */

import { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion";
import { usePathname } from "next/navigation";

type TransitionVariant = "fade" | "slideUp" | "slideLeft" | "scale" | "none";

interface PageTransitionProps {
  /** Child components to animate */
  children: ReactNode;
  /** Animation variant */
  variant?: TransitionVariant;
  /** Animation duration in seconds */
  duration?: number;
  /** Additional CSS classes */
  className?: string;
}

// Animation variants for different transition styles
const transitionVariants: Record<TransitionVariant, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

export function PageTransition({
  children,
  variant = "fade",
  duration = 0.3,
  className = "",
}: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Use "none" variant if user prefers reduced motion
  const activeVariant = prefersReducedMotion ? "none" : variant;
  const activeDuration = prefersReducedMotion ? 0 : duration;

  const variants = transitionVariants[activeVariant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          duration: activeDuration,
          ease: "easeInOut",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * FadeIn Component
 *
 * Simple fade-in animation for content sections
 * Useful for individual elements that should fade in on mount
 */
interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export function FadeIn({
  children,
  duration = 0.5,
  delay = 0,
  className = "",
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideIn Component
 *
 * Slide-in animation from a specified direction
 */
interface SlideInProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  delay?: number;
  distance?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = "up",
  duration = 0.5,
  delay = 0,
  distance = 20,
  className = "",
}: SlideInProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
