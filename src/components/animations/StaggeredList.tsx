"use client";

/**
 * StaggeredList Components
 *
 * Container and item components for staggered list animations
 * Ideal for tables, card grids, and list views
 *
 * @example
 * <StaggeredList>
 *   {items.map((item, index) => (
 *     <StaggeredItem key={item.id} index={index}>
 *       <Card>{item.name}</Card>
 *     </StaggeredItem>
 *   ))}
 * </StaggeredList>
 */

import { ReactNode, createContext, useContext } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Context to share stagger settings between container and items
interface StaggerContextValue {
  staggerDelay: number;
  itemDuration: number;
  reducedMotion: boolean | null;
}

const StaggerContext = createContext<StaggerContextValue>({
  staggerDelay: 0.05,
  itemDuration: 0.3,
  reducedMotion: false,
});

// Container variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Item variants
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

interface StaggeredListProps {
  /** Child StaggeredItem components */
  children: ReactNode;
  /** Delay between each item animation in seconds */
  staggerDelay?: number;
  /** Duration of each item's animation in seconds */
  itemDuration?: number;
  /** Initial delay before animation starts in seconds */
  initialDelay?: number;
  /** Additional CSS classes for the container */
  className?: string;
  /** HTML element to render as */
  as?: "div" | "ul" | "ol" | "section";
}

export function StaggeredList({
  children,
  staggerDelay = 0.05,
  itemDuration = 0.3,
  initialDelay = 0.1,
  className = "",
  as = "div",
}: StaggeredListProps) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as];

  const variants: Variants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
        delayChildren: prefersReducedMotion ? 0 : initialDelay,
      },
    },
  };

  return (
    <StaggerContext.Provider
      value={{ staggerDelay, itemDuration, reducedMotion: prefersReducedMotion }}
    >
      <Component
        initial="hidden"
        animate="visible"
        variants={variants}
        className={className}
      >
        {children}
      </Component>
    </StaggerContext.Provider>
  );
}

interface StaggeredItemProps {
  /** Child content to animate */
  children: ReactNode;
  /** Index for calculating stagger delay (optional, uses context if omitted) */
  index?: number;
  /** Additional CSS classes */
  className?: string;
  /** HTML element to render as */
  as?: "div" | "li" | "article";
  /** Animation direction */
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function StaggeredItem({
  children,
  index,
  className = "",
  as = "div",
  direction = "up",
}: StaggeredItemProps) {
  const { itemDuration, reducedMotion } = useContext(StaggerContext);
  const Component = motion[as];

  // Direction offset values
  const directionOffset = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffset[direction];

  const variants: Variants = {
    hidden: reducedMotion
      ? { opacity: 1 }
      : { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : itemDuration,
        ease: "easeOut",
      },
    },
  };

  return (
    <Component variants={variants} className={className}>
      {children}
    </Component>
  );
}

/**
 * StaggeredTableRow Component
 *
 * Specialized variant for table row animations
 */
interface StaggeredTableRowProps {
  children: ReactNode;
  className?: string;
}

export function StaggeredTableRow({
  children,
  className = "",
}: StaggeredTableRowProps) {
  const { itemDuration, reducedMotion } = useContext(StaggerContext);

  const variants: Variants = {
    hidden: reducedMotion
      ? { opacity: 1 }
      : { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reducedMotion ? 0 : itemDuration,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.tr variants={variants} className={className}>
      {children}
    </motion.tr>
  );
}

/**
 * StaggeredGrid Component
 *
 * Grid container with staggered children animations
 * Pre-configured for card grids
 */
interface StaggeredGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  staggerDelay?: number;
  className?: string;
}

export function StaggeredGrid({
  children,
  columns = 3,
  staggerDelay = 0.08,
  className = "",
}: StaggeredGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <StaggeredList
      staggerDelay={staggerDelay}
      className={cn("grid gap-4", columnClasses[columns], className)}
    >
      {children}
    </StaggeredList>
  );
}
