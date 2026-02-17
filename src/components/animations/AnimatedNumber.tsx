"use client";

/**
 * AnimatedNumber Component
 *
 * Animates numeric values with smooth spring transitions
 * Respects prefers-reduced-motion for accessibility
 *
 * @example
 * <AnimatedNumber value={1234} prefix="$" decimals={2} />
 * <AnimatedNumber value={0.345} suffix="%" decimals={1} />
 */

import { useEffect, useState } from "react";
import { useSpring, useTransform, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  /** The target number to animate to */
  value: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Number of decimal places to display */
  decimals?: number;
  /** Additional CSS classes */
  className?: string;
  /** Text to display before the number (e.g., "$") */
  prefix?: string;
  /** Text to display after the number (e.g., "%") */
  suffix?: string;
  /** ARIA label for screen readers */
  ariaLabel?: string;
}

export function AnimatedNumber({
  value,
  duration = 1,
  decimals = 0,
  className = "",
  prefix = "",
  suffix = "",
  ariaLabel,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  const spring = useSpring(0, {
    duration: prefersReducedMotion ? 0 : duration * 1000,
    bounce: 0,
  });

  const rounded = useTransform(spring, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(parseFloat(latest));
    });
    return unsubscribe;
  }, [rounded]);

  // Format the display value
  const formattedValue = displayValue.toFixed(decimals);
  const fullValue = `${prefix}${formattedValue}${suffix}`;
  const staticValue = `${prefix}${value.toFixed(decimals)}${suffix}`;

  // For reduced motion, show static value immediately
  if (prefersReducedMotion) {
    return (
      <span
        className={cn("tabular-nums", className)}
        aria-label={ariaLabel || staticValue}
      >
        {staticValue}
      </span>
    );
  }

  return (
    <motion.span
      className={cn("tabular-nums", className)}
      aria-label={ariaLabel || staticValue}
      aria-live="polite"
    >
      {fullValue}
    </motion.span>
  );
}
