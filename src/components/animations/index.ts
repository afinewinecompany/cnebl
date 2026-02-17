/**
 * Animation Components
 *
 * Re-usable animation components built with Framer Motion
 * All components respect prefers-reduced-motion for accessibility
 */

// Animated number display
export { AnimatedNumber } from "./AnimatedNumber";

// Page transitions
export { PageTransition, FadeIn, SlideIn } from "./PageTransition";

// Staggered list animations
export {
  StaggeredList,
  StaggeredItem,
  StaggeredTableRow,
  StaggeredGrid,
} from "./StaggeredList";

// Skeleton loading components
export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonStats,
  SkeletonProfile,
} from "./Skeleton";
