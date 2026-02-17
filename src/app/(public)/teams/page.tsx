"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TeamCard } from "@/components/teams/TeamCard";
import { teamDetails } from "@/lib/mock-data";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Teams Page
 * Displays grid of all teams in the league
 */
export default function TeamsPage() {
  // Sort teams by winning percentage (best first)
  const sortedTeams = [...teamDetails].sort((a, b) => {
    const pctA = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
    const pctB = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
    return pctB - pctA;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary-dark to-gray-900 py-12 lg:py-16 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8 text-gold" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">
                  League Teams
                </h1>
                <p className="text-gray-300">
                  {teamDetails.length} teams competing in the 2025 season
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Teams Grid */}
        <section className="container mx-auto px-4 py-10 lg:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTeams.map((team, index) => (
              <TeamCard key={team.id} team={team} rank={index + 1} />
            ))}
          </div>

          {/* Teams Info */}
          <div className="mt-10 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary/10 text-primary border-primary/20">About</Badge>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
                CNEBL Teams
              </h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              The Coastal New England Baseball League features six competitive teams
              representing communities throughout the coastal region. Each team maintains
              a roster of dedicated adult players committed to preserving the tradition
              and spirit of America&apos;s pastime. Click on any team to view their full
              roster, upcoming schedule, and season statistics.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
