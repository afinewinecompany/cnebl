import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Calendar,
  Trophy,
  Users,
  BarChart3,
  Bell,
  Settings,
  User,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { getRoleDisplayName } from '@/types/auth';
import { DashboardAnnouncements } from './DashboardAnnouncements';
import { DashboardChat } from './DashboardChat';
import { TeamDirectory } from './TeamDirectory';
import { getPublishedAnnouncements } from '@/lib/db/queries/announcements';
import { getAllTeamsWithRosters, isTeamManagerOrAdmin } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Dashboard - CNEBL',
  description: 'Your CNEBL dashboard',
};

/**
 * Dashboard Page
 *
 * Protected page showing user-specific content based on role
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;
  const isManagerOrAbove = ['manager', 'admin', 'commissioner'].includes(user.role);
  const isAdminOrAbove = ['admin', 'commissioner'].includes(user.role);

  // Fetch data in parallel
  const [{ announcements }, teams, isTeamManager] = await Promise.all([
    getPublishedAnnouncements({}),
    getAllTeamsWithRosters(),
    user.teamId ? isTeamManagerOrAdmin(user.id, user.teamId) : Promise.resolve(false),
  ]);

  // Quick action cards based on role
  const quickActions = [
    {
      title: 'Availability',
      description: 'Mark game availability',
      icon: CheckCircle,
      href: '/availability',
      color: 'bg-field',
    },
    {
      title: 'Schedule',
      description: 'View upcoming games',
      icon: Calendar,
      href: '/schedule',
      color: 'bg-navy',
    },
    {
      title: 'Standings',
      description: 'Check league standings',
      icon: Trophy,
      href: '/standings',
      color: 'bg-gold',
    },
    {
      title: 'Statistics',
      description: 'View player stats',
      icon: BarChart3,
      href: '/stats',
      color: 'bg-leather',
    },
    ...(user.teamId
      ? [
          {
            title: 'My Team',
            description: user.teamName || 'Team roster',
            icon: Users,
            href: `/teams/${user.teamId}`,
            color: 'bg-navy-light',
          },
          {
            title: 'Team Chat',
            description: 'Chat with teammates',
            icon: MessageSquare,
            href: '/chat',
            color: 'bg-leather',
          },
        ]
      : []),
    {
      title: 'Profile',
      description: 'Edit your profile',
      icon: User,
      href: '/profile',
      color: 'bg-charcoal-light',
    },
    ...(isManagerOrAbove
      ? [
          {
            title: 'Score Game',
            description: 'Enter live scores',
            icon: BarChart3,
            href: '/scoring',
            color: 'bg-cardinal',
          },
        ]
      : []),
    ...(isAdminOrAbove
      ? [
          {
            title: 'Admin',
            description: 'Manage league',
            icon: Settings,
            href: '/admin',
            color: 'bg-charcoal',
          },
        ]
      : []),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Welcome, {user.name.split(' ')[0]}
          </h1>
          <Badge variant={user.role === 'commissioner' ? 'gold' : 'default'}>
            {getRoleDisplayName(user.role)}
          </Badge>
        </div>
        {user.teamName && (
          <p className="text-charcoal-light font-body">
            {user.teamName}
          </p>
        )}
      </div>

      {/* Quick actions grid */}
      <section className="mb-12">
        <h2 className="font-headline text-xl font-semibold text-navy uppercase tracking-wide mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a key={action.title} href={action.href} className="block">
              <Card className="h-full hover:shadow-card-hover transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-retro ${action.color} flex items-center justify-center flex-shrink-0 group-hover:-translate-y-0.5 transition-transform`}
                    >
                      <action.icon className="w-6 h-6 text-chalk" />
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide">
                        {action.title}
                      </h3>
                      <p className="text-sm text-charcoal-light font-body">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* Announcements and upcoming games */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <DashboardAnnouncements initialAnnouncements={announcements.slice(0, 5)} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Games
            </CardTitle>
            <CardDescription>
              Your next scheduled games
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.teamName ? (
              <div className="space-y-4">
                <div className="p-4 border border-cream-dark rounded-retro">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-headline text-sm uppercase tracking-wide text-navy">
                      vs Harbor Hawks
                    </span>
                    <Badge variant="outline">Home</Badge>
                  </div>
                  <p className="text-xs text-charcoal-light font-mono">
                    Sat, Mar 15 @ 1:00 PM - Veterans Field
                  </p>
                </div>
                <div className="p-4 border border-cream-dark rounded-retro">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-headline text-sm uppercase tracking-wide text-navy">
                      @ Lighthouse Bay
                    </span>
                    <Badge variant="outline">Away</Badge>
                  </div>
                  <p className="text-xs text-charcoal-light font-mono">
                    Sun, Mar 23 @ 2:00 PM - Bay Diamond
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-charcoal-light font-body text-center py-4">
                Join a team to see your upcoming games
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Team Chat Section */}
      {user.teamId && (
        <section className="mb-12">
          <h2 className="font-headline text-xl font-semibold text-navy uppercase tracking-wide mb-4">
            Team Chat
          </h2>
          <DashboardChat
            teamId={user.teamId}
            teamName={user.teamName || 'My Team'}
            teamColor={teams.find(t => t.id === user.teamId)?.primaryColor}
            currentUserId={user.id}
            currentUserRole={user.role}
            isTeamManager={isTeamManager}
          />
        </section>
      )}

      {/* Team Directory Section */}
      <section>
        <h2 className="font-headline text-xl font-semibold text-navy uppercase tracking-wide mb-4">
          League Directory
        </h2>
        <TeamDirectory
          teams={teams}
          currentUserTeamId={user.teamId}
        />
      </section>
    </div>
  );
}
