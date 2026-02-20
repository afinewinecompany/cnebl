'use client';

/**
 * DashboardChat Component
 *
 * Embedded team chat for the dashboard with channel support.
 */

import { TeamMessengerContainer } from '@/components/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { UserRole } from '@/types/auth';

interface DashboardChatProps {
  teamId: string;
  teamName: string;
  teamColor?: string;
  currentUserId: string;
  currentUserRole: UserRole;
  isTeamManager?: boolean;
}

export function DashboardChat({
  teamId,
  teamName,
  teamColor,
  currentUserId,
  currentUserRole,
  isTeamManager = false,
}: DashboardChatProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>{teamName} Chat</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/chat">
              Open Full Chat
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription>
          Stay connected with your teammates
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-[500px]">
          <TeamMessengerContainer
            teamId={teamId}
            teamName={teamName}
            teamColor={teamColor}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            isTeamManager={isTeamManager}
            initialChannel="general"
            className="h-full rounded-none border-0 shadow-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardChat;
