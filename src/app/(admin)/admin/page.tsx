'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Shield,
  Calendar,
  UserPlus,
  AlertCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';

// Mock data for admin dashboard
const mockStats = {
  totalPlayers: 83,
  totalTeams: 6,
  unassignedPlayers: 12,
  recentActivity: [
    { id: 1, action: 'Player assigned', details: 'John Smith assigned to Rays', time: '2 hours ago', type: 'assignment' },
    { id: 2, action: 'Team created', details: 'New team "Marlins" created', time: '1 day ago', type: 'team' },
    { id: 3, action: 'Role changed', details: 'Mike Johnson promoted to Manager', time: '2 days ago', type: 'role' },
    { id: 4, action: 'Player registered', details: 'New player registration: Tom Wilson', time: '3 days ago', type: 'registration' },
  ],
};

/**
 * Admin Dashboard Page
 *
 * Overview of league administration with quick stats and actions.
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState(mockStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      title: 'Total Players',
      value: stats.totalPlayers,
      icon: Users,
      color: 'bg-navy',
      href: '/admin/players',
    },
    {
      title: 'Total Teams',
      value: stats.totalTeams,
      icon: Shield,
      color: 'bg-field',
      href: '/admin/teams',
    },
    {
      title: 'Unassigned Players',
      value: stats.unassignedPlayers,
      icon: AlertCircle,
      color: stats.unassignedPlayers > 0 ? 'bg-cardinal' : 'bg-gray-400',
      href: '/admin/players?filter=unassigned',
    },
    {
      title: 'Upcoming Games',
      value: 4,
      icon: Calendar,
      color: 'bg-gold',
      href: '/admin/games',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Players',
      description: 'View, assign, and manage player team assignments',
      icon: Users,
      href: '/admin/players',
      variant: 'default' as const,
    },
    {
      title: 'Manage Teams',
      description: 'Create, edit, and configure team settings',
      icon: Shield,
      href: '/admin/teams',
      variant: 'outline' as const,
    },
    {
      title: 'Assign Player',
      description: 'Quick assign an unassigned player to a team',
      icon: UserPlus,
      href: '/admin/players?action=assign',
      variant: 'outline' as const,
    },
  ];

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'success';
      case 'team':
        return 'primary';
      case 'role':
        return 'warning';
      case 'registration':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
          Admin Dashboard
        </h1>
        <p className="text-charcoal-light font-body mt-1">
          Manage players, teams, and league settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal-light uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="font-mono text-3xl font-bold text-navy mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center group-hover:-translate-y-0.5 transition-transform`}
                  >
                    <stat.icon className="w-6 h-6 text-chalk" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-navy hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center group-hover:bg-navy/20 transition-colors">
                          <action.icon className="w-5 h-5 text-navy" />
                        </div>
                        <h3 className="font-headline text-sm font-semibold text-navy uppercase tracking-wide">
                          {action.title}
                        </h3>
                      </div>
                      <p className="text-xs text-charcoal-light font-body">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest administrative actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-navy mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-charcoal truncate">
                          {activity.action}
                        </span>
                        <Badge
                          variant={getActivityBadgeVariant(activity.type) as 'default' | 'primary' | 'success' | 'warning'}
                          size="sm"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-charcoal-light truncate">
                        {activity.details}
                      </p>
                      <p className="text-xs text-charcoal-light/70 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unassigned Players Alert */}
      {stats.unassignedPlayers > 0 && (
        <Card className="border-cardinal/20 bg-cardinal/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cardinal/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-cardinal" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-semibold text-cardinal uppercase tracking-wide">
                    Unassigned Players
                  </h3>
                  <p className="text-sm text-charcoal-light font-body">
                    {stats.unassignedPlayers} players need to be assigned to a team
                  </p>
                </div>
              </div>
              <Button variant="danger" asChild>
                <Link href="/admin/players?filter=unassigned">
                  View & Assign
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
