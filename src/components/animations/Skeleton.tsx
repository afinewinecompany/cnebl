"use client";

/**
 * Skeleton Loading Components
 *
 * Animated placeholder components for loading states
 * Respects prefers-reduced-motion for accessibility
 *
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="heading" />
 * <Skeleton variant="avatar" size="lg" />
 * <SkeletonCard />
 */

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SkeletonVariant = "text" | "heading" | "avatar" | "button" | "image" | "custom";
type SkeletonSize = "sm" | "md" | "lg" | "xl";

interface SkeletonProps {
  /** Type of skeleton to display */
  variant?: SkeletonVariant;
  /** Size variant for avatar and button types */
  size?: SkeletonSize;
  /** Custom width (CSS value) */
  width?: string | number;
  /** Custom height (CSS value) */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Number of text lines to show (for text variant) */
  lines?: number;
  /** Whether to show animation */
  animate?: boolean;
}

// Size configurations for different variants
const sizeConfig = {
  avatar: {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  },
  button: {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
    xl: "h-14 w-40",
  },
};

export function Skeleton({
  variant = "text",
  size = "md",
  width,
  height,
  className = "",
  lines = 1,
  animate = true,
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  // Base skeleton styles
  const baseStyles = cn(
    "bg-gray-200 rounded",
    shouldAnimate && "animate-pulse"
  );

  // Custom style overrides
  const customStyles = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  // Render based on variant
  switch (variant) {
    case "heading":
      return (
        <div
          className={cn(baseStyles, "h-7 w-3/4", className)}
          style={customStyles}
          role="status"
          aria-label="Loading heading"
        />
      );

    case "avatar":
      return (
        <div
          className={cn(baseStyles, "rounded-full", sizeConfig.avatar[size], className)}
          style={customStyles}
          role="status"
          aria-label="Loading avatar"
        />
      );

    case "button":
      return (
        <div
          className={cn(baseStyles, "rounded-md", sizeConfig.button[size], className)}
          style={customStyles}
          role="status"
          aria-label="Loading button"
        />
      );

    case "image":
      return (
        <div
          className={cn(baseStyles, "h-40 w-full", className)}
          style={customStyles}
          role="status"
          aria-label="Loading image"
        />
      );

    case "custom":
      return (
        <div
          className={cn(baseStyles, className)}
          style={customStyles}
          role="status"
          aria-label="Loading"
        />
      );

    case "text":
    default:
      if (lines === 1) {
        return (
          <div
            className={cn(baseStyles, "h-4 w-full", className)}
            style={customStyles}
            role="status"
            aria-label="Loading text"
          />
        );
      }

      // Multiple lines
      return (
        <div className="space-y-2" role="status" aria-label="Loading text">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseStyles,
                "h-4",
                // Last line is shorter
                i === lines - 1 ? "w-3/4" : "w-full",
                className
              )}
            />
          ))}
        </div>
      );
  }
}

/**
 * SkeletonCard Component
 *
 * Complete card skeleton with image, title, and text placeholders
 */
interface SkeletonCardProps {
  /** Whether to show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

export function SkeletonCard({
  showImage = true,
  lines = 2,
  className = "",
}: SkeletonCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-ivory p-4 shadow-sm",
        className
      )}
      role="status"
      aria-label="Loading card"
    >
      {showImage && (
        <Skeleton
          variant="image"
          className="mb-4 rounded-md"
          animate={!prefersReducedMotion}
        />
      )}
      <Skeleton
        variant="heading"
        className="mb-3"
        animate={!prefersReducedMotion}
      />
      <Skeleton
        variant="text"
        lines={lines}
        animate={!prefersReducedMotion}
      />
    </div>
  );
}

/**
 * SkeletonTable Component
 *
 * Table skeleton with header and rows
 */
interface SkeletonTableProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = "",
}: SkeletonTableProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-gray-200", className)}
      role="status"
      aria-label="Loading table"
    >
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              variant="custom"
              className="h-4 flex-1"
              animate={!prefersReducedMotion}
            />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 bg-white">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="custom"
                className="h-4 flex-1"
                animate={!prefersReducedMotion}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonStats Component
 *
 * Stats card skeleton for leaderboards and statistics
 */
interface SkeletonStatsProps {
  /** Number of stat items */
  items?: number;
  /** Additional CSS classes */
  className?: string;
}

export function SkeletonStats({
  items = 5,
  className = "",
}: SkeletonStatsProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-ivory p-4 shadow-sm",
        className
      )}
      role="status"
      aria-label="Loading statistics"
    >
      <Skeleton
        variant="heading"
        className="mb-4"
        animate={!prefersReducedMotion}
      />
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton
              variant="avatar"
              size="sm"
              animate={!prefersReducedMotion}
            />
            <Skeleton
              variant="text"
              className="flex-1"
              animate={!prefersReducedMotion}
            />
            <Skeleton
              variant="custom"
              className="h-4 w-12"
              animate={!prefersReducedMotion}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonProfile Component
 *
 * Profile page skeleton with avatar, name, and details
 */
interface SkeletonProfileProps {
  /** Additional CSS classes */
  className?: string;
}

export function SkeletonProfile({ className = "" }: SkeletonProfileProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn("space-y-6", className)}
      role="status"
      aria-label="Loading profile"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton
          variant="avatar"
          size="xl"
          animate={!prefersReducedMotion}
        />
        <div className="flex-1 space-y-2">
          <Skeleton
            variant="heading"
            className="w-48"
            animate={!prefersReducedMotion}
          />
          <Skeleton
            variant="text"
            className="w-32"
            animate={!prefersReducedMotion}
          />
        </div>
      </div>

      {/* Details */}
      <div className="rounded-lg border border-gray-200 bg-ivory p-6">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton
                variant="text"
                className="w-24"
                animate={!prefersReducedMotion}
              />
              <Skeleton
                variant="text"
                className="w-32"
                animate={!prefersReducedMotion}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
