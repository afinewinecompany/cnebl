'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  PauseCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { GameStatus } from '@/types';

interface GameStatusBadgeProps {
  status: GameStatus;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * GameStatusBadge Component
 *
 * Displays a color-coded badge for game status with optional icon.
 * Uses the Heritage Diamond theme colors.
 */
export function GameStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className,
}: GameStatusBadgeProps) {
  const statusConfig: Record<
    GameStatus,
    {
      label: string;
      variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'live' | 'secondary';
      icon: React.ElementType;
      bgClass?: string;
      textClass?: string;
    }
  > = {
    scheduled: {
      label: 'Scheduled',
      variant: 'secondary',
      icon: Calendar,
    },
    warmup: {
      label: 'Warmup',
      variant: 'warning',
      icon: Clock,
    },
    in_progress: {
      label: 'Live',
      variant: 'live',
      icon: PlayCircle,
    },
    final: {
      label: 'Final',
      variant: 'default',
      icon: CheckCircle,
    },
    postponed: {
      label: 'Postponed',
      variant: 'warning',
      icon: PauseCircle,
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'danger',
      icon: XCircle,
    },
    suspended: {
      label: 'Suspended',
      variant: 'warning',
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={cn(
        'gap-1',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {showIcon && <Icon className={cn(
        size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'
      )} />}
      {config.label}
    </Badge>
  );
}

/**
 * Get status color for use outside of badges (e.g., calendar dots)
 */
export function getStatusColor(status: GameStatus): string {
  const colors: Record<GameStatus, string> = {
    scheduled: '#6B7280', // gray-500
    warmup: '#F59E0B', // amber-500
    in_progress: '#BE1E2D', // cardinal
    final: '#1F2937', // gray-800
    postponed: '#D97706', // amber-600
    cancelled: '#DC2626', // red-600
    suspended: '#EA580C', // orange-600
  };
  return colors[status];
}

export default GameStatusBadge;
