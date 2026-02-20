"use client";

/**
 * ChannelHeader Component
 *
 * Displays the current channel name, icon, and description.
 * Shows posting restrictions for manager-only channels.
 * Features a colored accent bar matching the channel type.
 *
 * @example
 * <ChannelHeader
 *   channel="important"
 *   teamName="Rays"
 *   canPost={false}
 * />
 */

import { Megaphone, MessageCircle, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getChannelConfig } from "@/lib/constants/channels";
import type { ChannelType } from "@/types/database.types";

export interface ChannelHeaderProps {
  /** Current channel type */
  channel: ChannelType;
  /** Team name for display */
  teamName: string;
  /** Whether the current user can post to this channel */
  canPost: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Map icon names to Lucide components */
const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  megaphone: Megaphone,
  "chat-bubble": MessageCircle,
  "user-plus": Users,
};

/** Channel accent bar colors */
const CHANNEL_ACCENT_COLORS: Record<ChannelType, string> = {
  important: "bg-cardinal",
  general: "bg-navy",
  substitutes: "bg-field",
};

/** Channel icon colors when active */
const CHANNEL_ICON_COLORS: Record<ChannelType, string> = {
  important: "text-cardinal",
  general: "text-navy",
  substitutes: "text-field",
};

/** Channel header background tints */
const CHANNEL_BG_COLORS: Record<ChannelType, string> = {
  important: "bg-cardinal/5",
  general: "bg-ivory",
  substitutes: "bg-field/5",
};

export function ChannelHeader({
  channel,
  teamName,
  canPost,
  className,
}: ChannelHeaderProps) {
  const config = getChannelConfig(channel);
  const Icon = CHANNEL_ICONS[config.icon] || MessageCircle;

  return (
    <header
      className={cn(
        "relative shrink-0 border-b border-cream-dark px-4 py-3",
        CHANNEL_BG_COLORS[channel],
        className
      )}
      role="banner"
      aria-label={`${config.name} channel for ${teamName}`}
    >
      {/* Channel color accent bar */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          CHANNEL_ACCENT_COLORS[channel]
        )}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        {/* Channel info */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Channel icon container */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              "border border-cream-dark bg-chalk shadow-sm",
              channel === "important" && "border-cardinal/20"
            )}
            aria-hidden="true"
          >
            <Icon
              className={cn("h-5 w-5", CHANNEL_ICON_COLORS[channel])}
            />
          </div>

          {/* Channel text */}
          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-semibold uppercase tracking-wide text-navy truncate">
                {teamName} - {config.name}
              </h2>

              {/* Important channel badge */}
              {channel === "important" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                    "bg-cardinal/10 text-cardinal",
                    "font-headline text-[10px] font-bold uppercase tracking-wide"
                  )}
                >
                  <Megaphone className="h-3 w-3" aria-hidden="true" />
                  Announcements
                </span>
              )}
            </div>

            {/* Channel description */}
            <p className="text-xs text-charcoal-light mt-0.5 truncate">
              {config.description}
            </p>
          </div>
        </div>

        {/* Posting restriction indicator */}
        {!canPost && (
          <div
            className={cn(
              "flex items-center gap-1.5 shrink-0",
              "px-2.5 py-1.5 rounded-md",
              "bg-gray-100 border border-gray-200"
            )}
            role="status"
            aria-label="You cannot post in this channel"
          >
            <Lock className="h-3.5 w-3.5 text-charcoal-light" aria-hidden="true" />
            <span className="text-xs text-charcoal-light font-medium whitespace-nowrap">
              View only
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

export default ChannelHeader;
