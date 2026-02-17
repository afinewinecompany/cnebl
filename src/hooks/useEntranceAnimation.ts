"use client";

/**
 * useEntranceAnimation Hook
 *
 * Triggers animations when elements enter the viewport
 * Uses Intersection Observer for efficient viewport detection
 * Respects prefers-reduced-motion for accessibility
 *
 * @example
 * function MyComponent() {
 *   const { ref, isInView, animationProps } = useEntranceAnimation();
 *
 *   return (
 *     <motion.div ref={ref} {...animationProps}>
 *       Content fades in when scrolled into view
 *     </motion.div>
 *   );
 * }
 *
 * // With custom options
 * const { ref, isInView } = useEntranceAnimation({
 *   threshold: 0.5,
 *   triggerOnce: true,
 *   direction: "left",
 *   duration: 0.8,
 * });
 */

import { useRef, useEffect, useState, useMemo } from "react";
import { useReducedMotion, MotionProps } from "framer-motion";

type AnimationDirection = "up" | "down" | "left" | "right" | "none";

interface UseEntranceAnimationOptions {
  /** Percentage of element that must be visible (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Only trigger animation once */
  triggerOnce?: boolean;
  /** Animation direction */
  direction?: AnimationDirection;
  /** Animation duration in seconds */
  duration?: number;
  /** Animation delay in seconds */
  delay?: number;
  /** Distance to animate from (in pixels) */
  distance?: number;
  /** Whether animation is enabled */
  enabled?: boolean;
}

interface UseEntranceAnimationReturn<T extends HTMLElement> {
  /** Ref to attach to the target element */
  ref: React.RefObject<T | null>;
  /** Whether element is currently in view */
  isInView: boolean;
  /** Whether animation has been triggered (for triggerOnce mode) */
  hasAnimated: boolean;
  /** Pre-configured motion props for Framer Motion */
  animationProps: MotionProps;
  /** Animation variants for custom usage */
  variants: {
    hidden: Record<string, number>;
    visible: Record<string, number>;
  };
}

export function useEntranceAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseEntranceAnimationOptions = {}
): UseEntranceAnimationReturn<T> {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    triggerOnce = true,
    direction = "up",
    duration = 0.5,
    delay = 0,
    distance = 30,
    enabled = true,
  } = options;

  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Set up Intersection Observer
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const element = ref.current;
    if (!element) return;

    // If reduced motion is preferred, skip animation logic
    if (prefersReducedMotion) {
      setIsInView(true);
      setHasAnimated(true);
      return;
    }

    // If already animated and triggerOnce is true, skip
    if (hasAnimated && triggerOnce) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setHasAnimated(true);

            if (triggerOnce) {
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, triggerOnce, hasAnimated, prefersReducedMotion]);

  // Calculate direction offsets
  const directionOffset = useMemo(() => {
    switch (direction) {
      case "up":
        return { x: 0, y: distance };
      case "down":
        return { x: 0, y: -distance };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  }, [direction, distance]);

  // Animation variants
  const variants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 1, x: 0, y: 0 },
        visible: { opacity: 1, x: 0, y: 0 },
      };
    }

    return {
      hidden: {
        opacity: 0,
        ...directionOffset,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
      },
    };
  }, [prefersReducedMotion, directionOffset]);

  // Pre-configured motion props
  const animationProps: MotionProps = useMemo(() => {
    if (prefersReducedMotion) {
      return {};
    }

    return {
      initial: "hidden",
      animate: isInView ? "visible" : "hidden",
      variants,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    };
  }, [isInView, variants, duration, delay, prefersReducedMotion]);

  return {
    ref,
    isInView,
    hasAnimated,
    animationProps,
    variants,
  };
}

/**
 * useStaggeredEntrance Hook
 *
 * For animating multiple elements with staggered timing as they enter viewport
 *
 * @example
 * function CardGrid({ items }) {
 *   const { containerRef, getItemProps } = useStaggeredEntrance({
 *     staggerDelay: 0.1,
 *   });
 *
 *   return (
 *     <div ref={containerRef}>
 *       {items.map((item, index) => (
 *         <motion.div key={item.id} {...getItemProps(index)}>
 *           <Card>{item.name}</Card>
 *         </motion.div>
 *       ))}
 *     </div>
 *   );
 * }
 */

interface UseStaggeredEntranceOptions {
  /** Base threshold for intersection observer */
  threshold?: number;
  /** Delay between each item's animation */
  staggerDelay?: number;
  /** Duration of each item's animation */
  duration?: number;
  /** Animation direction */
  direction?: AnimationDirection;
  /** Distance to animate from */
  distance?: number;
}

interface UseStaggeredEntranceReturn<T extends HTMLElement> {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<T | null>;
  /** Whether container is in view */
  isInView: boolean;
  /** Get animation props for an item by index */
  getItemProps: (index: number) => MotionProps;
}

export function useStaggeredEntrance<T extends HTMLElement = HTMLDivElement>(
  options: UseStaggeredEntranceOptions = {}
): UseStaggeredEntranceReturn<T> {
  const {
    threshold = 0.1,
    staggerDelay = 0.08,
    duration = 0.4,
    direction = "up",
    distance = 20,
  } = options;

  const { ref, isInView } = useEntranceAnimation<T>({
    threshold,
    triggerOnce: true,
    direction: "none",
  });

  const prefersReducedMotion = useReducedMotion();

  // Direction offset
  const directionOffset = useMemo(() => {
    switch (direction) {
      case "up":
        return { y: distance };
      case "down":
        return { y: -distance };
      case "left":
        return { x: distance };
      case "right":
        return { x: -distance };
      default:
        return {};
    }
  }, [direction, distance]);

  // Get animation props for each item
  const getItemProps = (index: number): MotionProps => {
    if (prefersReducedMotion) {
      return {};
    }

    return {
      initial: { opacity: 0, ...directionOffset },
      animate: isInView
        ? { opacity: 1, x: 0, y: 0 }
        : { opacity: 0, ...directionOffset },
      transition: {
        duration,
        delay: index * staggerDelay,
        ease: "easeOut",
      },
    };
  };

  return {
    containerRef: ref,
    isInView,
    getItemProps,
  };
}
