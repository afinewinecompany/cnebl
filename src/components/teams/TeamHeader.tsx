"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamDetails } from "@/lib/mock-data";
import { Trophy, User, MapPin, Calendar } from "lucide-react";

interface TeamHeaderProps {
  team: TeamDetails;
  className?: string;
}

/**
 * TeamHeader Component
 * Displays team profile header with logo, name, record, and key info
 */
export function TeamHeader({ team, className }: TeamHeaderProps) {
  const {
    name,
    abbreviation,
    primaryColor,
    secondaryColor,
    manager,
    wins,
    losses,
    homeField,
    founded,
  } = team;

  const winPct = wins + losses > 0 ? (wins / (wins + losses)).toFixed(3).slice(1) : ".000";
  const gamesPlayed = wins + losses;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: primaryColor }}
    >
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            ${secondaryColor} 20px,
            ${secondaryColor} 22px
          )`,
        }}
        aria-hidden="true"
      />

      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-10 lg:py-14 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          {/* Team Logo Placeholder */}
          <div
            className="flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-2xl shrink-0 shadow-xl border-4 transition-transform hover:scale-105"
            style={{
              backgroundColor: secondaryColor,
              borderColor: `${primaryColor}40`,
            }}
            aria-label={`${name} team logo`}
          >
            <span
              className="text-3xl md:text-4xl font-bold uppercase tracking-wider"
              style={{ color: primaryColor }}
            >
              {abbreviation}
            </span>
          </div>

          {/* Team Info */}
          <div className="flex-1">
            <h1
              className="text-3xl lg:text-4xl font-bold mb-3"
              style={{ color: secondaryColor }}
            >
              {name}
            </h1>

            {/* Season Record */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Trophy
                  className="h-5 w-5"
                  style={{ color: secondaryColor }}
                  aria-hidden="true"
                />
                <span
                  className="font-mono text-2xl font-bold"
                  style={{ color: secondaryColor }}
                >
                  {wins}-{losses}
                </span>
              </div>
              <Badge
                className="text-sm font-semibold px-3 py-1"
                style={{
                  backgroundColor: secondaryColor,
                  color: primaryColor,
                }}
              >
                {winPct} PCT
              </Badge>
              <span
                className="text-sm opacity-80"
                style={{ color: secondaryColor }}
              >
                {gamesPlayed} Games Played
              </span>
            </div>

            {/* Team Details */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: secondaryColor }}
              >
                <User className="h-4 w-4 opacity-70" aria-hidden="true" />
                <span>
                  <span className="opacity-70">Manager:</span>{" "}
                  <span className="font-semibold">{manager}</span>
                </span>
              </div>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: secondaryColor }}
              >
                <MapPin className="h-4 w-4 opacity-70" aria-hidden="true" />
                <span>
                  <span className="opacity-70">Home:</span>{" "}
                  <span className="font-semibold">{homeField}</span>
                </span>
              </div>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: secondaryColor }}
              >
                <Calendar className="h-4 w-4 opacity-70" aria-hidden="true" />
                <span>
                  <span className="opacity-70">Est.</span>{" "}
                  <span className="font-semibold">{founded}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamHeader;
