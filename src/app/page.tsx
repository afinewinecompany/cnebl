import Link from "next/link";
import Image from "next/image";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, BarChart3, Users, MapPin, Clock, ChevronRight, UserCircle, Timer } from "lucide-react";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {/* Hero Section - Background image with gradient overlay */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background Image */}
          <Image
            src="/bg_01.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            aria-hidden="true"
          />
          {/* Dark gradient overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary-dark/80 to-gray-900/90" aria-hidden="true" />
          {/* Decorative baseball stitching pattern */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" role="presentation">
              <pattern id="stitches" patternUnits="userSpaceOnUse" width="50" height="50">
                <path d="M0 25 Q 12.5 20, 25 25 T 50 25" stroke="white" strokeWidth="2" fill="none" />
                <path d="M0 25 Q 12.5 30, 25 25 T 50 25" stroke="white" strokeWidth="2" fill="none" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#stitches)" />
            </svg>
          </div>
          {/* Gradient orbs for visual interest */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" aria-hidden="true" />

          <div className="container mx-auto px-4 text-center relative z-10">
            {/* Large Logo */}
            <div className="mb-8">
              <Image
                src="/logo.png"
                alt="CNEBL - Coastal New England Baseball League"
                width={560}
                height={560}
                className="mx-auto drop-shadow-2xl"
                priority
              />
            </div>

            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Where the love of the game meets the spirit of New England.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent text-white px-8 py-3 text-lg shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40">
                <Link href="/schedule">View Schedule</Link>
              </Button>
              <Button variant="secondary" asChild className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-primary px-8 py-3 text-lg transition-all duration-300 hover:scale-105">
                <Link href="/standings">View Standings</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Links - Enhanced cards with gradients and better hover states */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">Quick Access</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Everything You Need
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Schedule Card */}
              <Card className="text-center group cursor-pointer border-2 border-transparent hover:border-accent/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-2 overflow-hidden">
                <CardContent className="pt-10 pb-8 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/30 group-hover:scale-110 transition-transform duration-300 delay-75">
                    <Calendar className="w-10 h-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Schedule
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    View upcoming games and plan your season
                  </p>
                  <Link href="/schedule" className="inline-flex items-center gap-2 text-accent font-semibold hover:text-accent-dark transition-colors group/link">
                    View Schedule
                    <ChevronRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>

              {/* Standings Card */}
              <Card className="text-center group cursor-pointer border-2 border-transparent hover:border-gold/30 transition-all duration-300 hover:shadow-xl hover:shadow-gold/10 hover:-translate-y-2 overflow-hidden">
                <CardContent className="pt-10 pb-8 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold to-warning opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold to-warning-dark flex items-center justify-center shadow-lg shadow-gold/30 group-hover:scale-110 transition-transform duration-300 delay-75">
                    <Trophy className="w-10 h-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Standings
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Check league standings and team records
                  </p>
                  <Link href="/standings" className="inline-flex items-center gap-2 text-gold font-semibold hover:text-warning-dark transition-colors group/link">
                    View Standings
                    <ChevronRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="text-center group cursor-pointer border-2 border-transparent hover:border-success/30 transition-all duration-300 hover:shadow-xl hover:shadow-success/10 hover:-translate-y-2 overflow-hidden">
                <CardContent className="pt-10 pb-8 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-success-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-success to-success-dark flex items-center justify-center shadow-lg shadow-success/30 group-hover:scale-110 transition-transform duration-300 delay-75">
                    <BarChart3 className="w-10 h-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Statistics
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Track batting averages, ERA, and more
                  </p>
                  <Link href="/stats" className="inline-flex items-center gap-2 text-success font-semibold hover:text-success-dark transition-colors group/link">
                    View Stats
                    <ChevronRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Season Stats - Vibrant gradient with glowing numbers */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary-dark to-gray-900 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" aria-hidden="true" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge className="bg-gold text-gray-900 font-semibold mb-6 px-4 py-1">Current Season</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wide mb-12">
              2025 Season Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Users, value: "6", label: "Teams", color: "accent" },
                { icon: UserCircle, value: "90", label: "Players", color: "gold" },
                { icon: Calendar, value: "45", label: "Games", color: "success" },
                { icon: Timer, value: "405", label: "Innings", color: "warning" },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${
                    stat.color === 'accent' ? 'from-accent/20 to-accent/10' :
                    stat.color === 'gold' ? 'from-gold/20 to-gold/10' :
                    stat.color === 'success' ? 'from-success/20 to-success/10' :
                    'from-warning/20 to-warning/10'
                  } flex items-center justify-center border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-8 h-8 md:w-10 md:h-10 ${
                      stat.color === 'accent' ? 'text-accent' :
                      stat.color === 'gold' ? 'text-gold' :
                      stat.color === 'success' ? 'text-success' :
                      'text-warning'
                    }`} aria-hidden="true" />
                  </div>
                  <div className={`font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-2 ${
                    stat.color === 'accent' ? 'text-accent drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]' :
                    stat.color === 'gold' ? 'text-gold drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]' :
                    stat.color === 'success' ? 'text-success drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]' :
                    'text-warning drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                  }`}>{stat.value}</div>
                  <div className="text-gray-400 text-sm uppercase tracking-widest font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Games - Enhanced cards with team colors and animations */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Coming Up</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Upcoming Games
                </h2>
              </div>
              <Link href="/schedule" className="hidden md:inline-flex items-center gap-2 text-primary font-semibold hover:text-accent transition-colors group">
                View Full Schedule
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { home: "Rays", away: "Pirates", date: "Sat, Mar 15", time: "2:00 PM", field: "Leary Field - Portsmouth", homeColor: "#092C5C", awayColor: "#27251F" },
                { home: "Athletics", away: "Mariners", date: "Sat, Mar 15", time: "5:00 PM", field: "Leary Field - Portsmouth", homeColor: "#003831", awayColor: "#0C2C56" },
                { home: "Rockies", away: "Diamondbacks", date: "Sun, Mar 16", time: "1:00 PM", field: "Leary Field - Portsmouth", homeColor: "#33006F", awayColor: "#A71930" },
              ].map((game, i) => (
                <Card key={i} className="overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 shadow-lg">
                  {/* Gradient header */}
                  <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{game.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gold font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>{game.time}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="py-8 px-6 bg-white">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-center flex-1">
                        <div
                          className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110"
                          style={{ background: `linear-gradient(135deg, ${game.awayColor} 0%, ${game.awayColor}dd 100%)` }}
                        >
                          <span className="text-white font-bold text-lg drop-shadow-sm">{game.away.charAt(0)}</span>
                        </div>
                        <div className="font-bold text-xl text-gray-900">{game.away}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Away</div>
                      </div>
                      <div className="px-4 md:px-6">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="font-bold text-gray-400 text-sm md:text-lg">VS</span>
                        </div>
                      </div>
                      <div className="text-center flex-1">
                        <div
                          className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110"
                          style={{ background: `linear-gradient(135deg, ${game.homeColor} 0%, ${game.homeColor}dd 100%)` }}
                        >
                          <span className="text-white font-bold text-lg drop-shadow-sm">{game.home.charAt(0)}</span>
                        </div>
                        <div className="font-bold text-xl text-gray-900">{game.home}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Home</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-500 bg-gray-50 rounded-lg py-3 px-4">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="font-medium">{game.field}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/schedule" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-accent transition-colors">
                View Full Schedule
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* League Info Section - Vibrant gradient with better contrast */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-accent via-primary to-primary-dark relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" aria-hidden="true" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-white/10 backdrop-blur-sm" aria-hidden="true">
              <Trophy className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Spirit of New England Baseball
            </h2>
            <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Since 2015, the Coastal New England Baseball League has brought together
              players who share a passion for America&apos;s pastime.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105">
                <Link href="/teams">Meet the Teams</Link>
              </Button>
              <Button variant="outline" className="border-2 border-white/50 text-white hover:bg-white hover:text-primary px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm" asChild>
                <Link href="/stats">View Statistics</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
