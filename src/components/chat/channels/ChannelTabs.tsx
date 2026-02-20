"use client";

/**
 * ChannelTabs Component
 *
 * Tab bar for switching between team chat channels.
 * Shows channel icons, names, and unread badges.
 * Fully keyboard accessible with proper ARIA attributes.
 *
 * @example
 * <ChannelTabs
 *   activeChannel="general"
 *   unreadCounts={{ important: 3, general: 0, substitutes: 1 }}
 *   onChange={(channel) => setActiveChannel(channel)}
 * />
 */

import { useCallback, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Megaphone, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_CHANNELS } from "@/lib/constants/channels";
import type { ChannelType } from "@/types/database.types";
import { ChannelBadge } from "./ChannelBadge";

export interface ChannelTabsProps {
  /** Currently active channel */
  activeChannel: ChannelType;
  /** Unread message counts per channel */
  unreadCounts: Record<ChannelType, number>;
  /** Callback when channel selection changes */
  onChange: (channel: ChannelType) => void;
  /** Whether tabs are disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Map icon names to Lucide components */
const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  megaphone: Megaphone,
  "chat-bubble": MessageCircle,
  "user-plus": Users,
};

/** Channel color classes for active indicator */
const CHANNEL_COLORS: Record<ChannelType, string> = {
  important: "bg-cardinal",
  general: "bg-navy",
  substitutes: "bg-field",
};

/** Channel background tints when active */
const CHANNEL_BG_TINTS: Record<ChannelType, string> = {
  important: "bg-cardinal/5",
  general: "bg-navy/5",
  substitutes: "bg-field/5",
};

export function ChannelTabs({
  activeChannel,
  unreadCounts,
  onChange,
  disabled = false,
  className,
}: ChannelTabsProps) {
  const tabRefs = useRef<Map<ChannelType, HTMLButtonElement>>(new Map());

  // Get ordered channel types for keyboard navigation
  const channelTypes = TEAM_CHANNELS.map((c) => c.type);

  // Handle keyboard navigation between tabs
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, currentChannel: ChannelType) => {
      if (disabled) return;

      const currentIndex = channelTypes.indexOf(currentChannel);
      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : channelTypes.length - 1;
          break;
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          nextIndex = currentIndex < channelTypes.length - 1 ? currentIndex + 1 : 0;
          break;
        case "Home":
          event.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          event.preventDefault();
          nextIndex = channelTypes.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null) {
        const nextChannel = channelTypes[nextIndex];
        const nextTab = tabRefs.current.get(nextChannel);
        nextTab?.focus();
      }
    },
    [channelTypes, disabled]
  );

  // Set ref for a tab button
  const setTabRef = useCallback((channel: ChannelType, el: HTMLButtonElement | null) => {
    if (el) {
      tabRefs.current.set(channel, el);
    } else {
      tabRefs.current.delete(channel);
    }
  }, []);

  return (
    <div
      role="tablist"
      aria-label="Chat channels"
      className={cn(
        "flex h-12 shrink-0 border-b border-cream-dark bg-ivory",
        className
      )}
    >
      {TEAM_CHANNELS.map((channel) => {
        const isActive = activeChannel === channel.type;
        const unreadCount = unreadCounts[channel.type] || 0;
        const Icon = CHANNEL_ICONS[channel.icon] || MessageCircle;
        const badgeVariant = channel.type === "important" ? "important" : "default";

        return (
          <button
            key={channel.type}
            ref={(el) => setTabRef(channel.type, el)}
            role="tab"
            id={`channel-tab-${channel.type}`}
            aria-selected={isActive}
            aria-controls={`channel-panel-${channel.type}`}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => !disabled && onChange(channel.type)}
            onKeyDown={(e) => handleKeyDown(e, channel.type)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 px-2 sm:px-4",
              "font-headline text-xs sm:text-sm font-medium tracking-wide uppercase",
              "transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isActive
                ? cn("text-charcoal-dark", CHANNEL_BG_TINTS[channel.type])
                : "text-charcoal-light hover:text-charcoal hover:bg-cream-dark/50",
              // Touch-friendly sizing
              "min-h-[48px]"
            )}
            title={channel.description}
          >
            {/* Channel icon */}
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive && channel.type === "important" && "text-cardinal"
              )}
              aria-hidden="true"
            />

            {/* Channel name - short on mobile, full on larger screens */}
            <span className="hidden sm:inline">{channel.name}</span>
            <span className="sm:hidden">
              {channel.type === "substitutes" ? "Subs" : channel.name}
            </span>

            {/* Unread badge (only show on inactive tabs) */}
            {!isActive && unreadCount > 0 && (
              <ChannelBadge
                count={unreadCount}
                variant={badgeVariant}
                className="ml-1"
              />
            )}

            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="activeChannelIndicator"
                className={cn(
                  "absolute inset-x-0 bottom-0 h-[3px]",
                  CHANNEL_COLORS[channel.type]
                )}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ChannelTabs;
