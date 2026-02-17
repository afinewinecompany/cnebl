"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamDetails } from "@/lib/mock-data";
import { ChevronRight, User, Trophy } from "lucide-react";

interface TeamCardProps {
  team: TeamDetails;
  rank?: number;
  className?: string;
}

/**
 * TeamCard Component
 * Displays team summary with logo placeholder, name, record, and manager
 */
export function TeamCard({ team, rank, className }: TeamCardProps) {
  const { id, name, abbreviation, primaryColor, secondaryColor, manager, wins, losses } = team;

  const winPct = wins + losses > 0 ? (wins / (wins + losses)).toFixed(3).slice(1) : ".000";

  // Rank badge variant
  const getRankBadge = () => {
    if (!rank) return null;
    if (rank === 1) return <Badge variant="gold" className="text-xs">#1</Badge>;
    if (rank === 2) return <Badge variant="silver" className="text-xs">#2</Badge>;
    if (rank === 3) return <Badge variant="bronze" className="text-xs">#3</Badge>;
    return <Badge variant="outline" className="text-xs">#{rank}</Badge>;
  };

  return (
    <Link href={`/teams/${id}`} className="block group">
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
          "border-2 border-transparent hover:border-accent/30",
          "group-focus:ring-2 group-focus:ring-accent group-focus:ring-offset-2",
          className
        )}
      >
        <CardContent className="p-0">
          {/* Team Color Banner with gradient */}
          <div
            className="h-2 bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor || primaryColor})`
            }}
            aria-hidden="true"
          />

          <div className="p-5">
            <div className="flex items-center gap-4">
              {/* Team Logo Placeholder */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: primaryColor }}
                aria-hidden="true"
              >
                <span
                  className="text-xl font-bold uppercase tracking-wider"
                  style={{ color: secondaryColor }}
                >
                  {abbreviation}
                </span>
              </div>

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {name}
                  </h3>
                  {getRankBadge()}
                </div>

                {/* Record */}
                <div className="mt-1 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold" />
                  <span className="font-mono text-lg font-bold text-gray-800">
                    {wins}-{losses}
                  </span>
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    {winPct}
                  </Badge>
                </div>

                {/* Manager */}
                <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="truncate">{manager}</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <ChevronRight
                className="h-5 w-5 text-gray-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent shrink-0"
                aria-hidden="true"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default TeamCard;
