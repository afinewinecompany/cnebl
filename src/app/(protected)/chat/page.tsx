import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatPageClient } from './ChatPageClient';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Team Chat - CNEBL',
  description: 'Chat with your teammates',
};

/**
 * Fetch initial messages for the team chat
 * Server-side data fetching for initial page load
 */
async function getInitialMessages(teamId: string, userId: string) {
  try {
    // In production, this would be a direct database query
    // For now, we'll use the API route internally
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/teams/${teamId}/messages?limit=50`, {
      headers: {
        // Pass auth context for server-side request
        'x-user-id': userId,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[Chat] Failed to fetch messages:', response.status);
      return { messages: [], hasMore: false, cursor: null };
    }

    const data = await response.json();
    return {
      messages: data.data?.messages || [],
      hasMore: data.data?.hasMore || false,
      cursor: data.data?.cursor?.next || null,
    };
  } catch (error) {
    console.error('[Chat] Error fetching initial messages:', error);
    return { messages: [], hasMore: false, cursor: null };
  }
}

/**
 * Fetch team info for display
 */
async function getTeamInfo(teamId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/teams/${teamId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('[Chat] Error fetching team info:', error);
    return null;
  }
}

/**
 * Team Chat Page
 *
 * Protected page for team communication. Requires user to be:
 * 1. Authenticated
 * 2. A member of a team
 *
 * Features:
 * - Real-time team chat (polling for now, WebSocket later)
 * - Message pinning (managers only)
 * - Reply threading
 * - Message editing/deletion
 */
export default async function ChatPage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  // Check if user has a team
  if (!user.teamId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="p-4 bg-gold/10 rounded-full w-fit mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-gold" />
              </div>
              <h2 className="font-headline text-xl text-navy uppercase tracking-wide mb-2">
                No Team Assigned
              </h2>
              <p className="text-charcoal-light font-body mb-6">
                You need to be a member of a team to access the team chat.
                Contact a league administrator to join a team.
              </p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch initial data
  const [initialData, teamInfo] = await Promise.all([
    getInitialMessages(user.teamId, user.id),
    getTeamInfo(user.teamId),
  ]);

  // Get team name from session or team info
  const teamName = user.teamName || teamInfo?.name || 'Team';
  const teamColor = teamInfo?.primaryColor || '#1B3A5F';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-navy/10 rounded-full">
            <MessageSquare className="h-6 w-6 text-navy" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
              Team Chat
            </h1>
            <p className="text-charcoal-light font-body">
              Stay connected with your {teamName} teammates
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="h-[calc(100vh-280px)] min-h-[500px]">
        <ChatPageClient
          teamId={user.teamId}
          teamName={teamName}
          teamColor={teamColor}
          currentUserId={user.id}
          currentUserRole={user.role}
          initialMessages={initialData.messages}
          initialHasMore={initialData.hasMore}
          initialCursor={initialData.cursor}
        />
      </div>
    </div>
  );
}
