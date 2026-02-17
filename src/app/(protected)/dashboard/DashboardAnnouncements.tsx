'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnnouncementCard, AnnouncementModal } from '@/components/announcements';
import type { Announcement } from '@/types';
import { Bell, Megaphone, RefreshCw } from 'lucide-react';

interface DashboardAnnouncementsProps {
  /** Initial announcements from server */
  initialAnnouncements: Announcement[];
}

/**
 * DashboardAnnouncements Component
 *
 * Displays the latest league announcements on the dashboard.
 * Supports viewing full announcements in a modal.
 */
export function DashboardAnnouncements({ initialAnnouncements }: DashboardAnnouncementsProps) {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(initialAnnouncements);
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState<Announcement | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Refresh announcements
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/announcements?pageSize=5');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.announcements) {
          setAnnouncements(data.data.announcements);
        }
      }
    } catch {
      // Silently fail on refresh errors
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get urgent/important announcements count
  const urgentCount = announcements.filter(a => a.priority >= 2).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                League Announcements
                {urgentCount > 0 && (
                  <Badge variant="danger" size="sm">
                    {urgentCount} important
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Latest updates from the league
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh announcements"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  maxContentLength={100}
                  className="text-sm"
                />
              ))}
              {announcements.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="link" size="sm" asChild>
                    <a href="/announcements">
                      View all {announcements.length} announcements
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-charcoal-light">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-body">No announcements at this time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcement Modal */}
      {selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </>
  );
}
