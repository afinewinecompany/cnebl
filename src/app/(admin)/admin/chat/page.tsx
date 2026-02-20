import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminMessengerView, TeamOption } from "@/components/admin";
import { hasPermission } from "@/types/auth";

/**
 * Admin Chat Page
 *
 * Allows admins and commissioners to view and moderate all team chats.
 */

async function getTeams(): Promise<TeamOption[]> {
  // In production, this would fetch from the database
  // For now, return mock data
  return [
    {
      id: "rays",
      name: "Rays",
      abbreviation: "RAY",
      primaryColor: "#1B3A5F",
      unreadCount: 3,
    },
    {
      id: "pirates",
      name: "Pirates",
      abbreviation: "PIT",
      primaryColor: "#27251F",
      unreadCount: 1,
    },
    {
      id: "athletics",
      name: "Athletics",
      abbreviation: "OAK",
      primaryColor: "#003831",
      unreadCount: 0,
    },
    {
      id: "mariners",
      name: "Mariners",
      abbreviation: "SEA",
      primaryColor: "#0C2C56",
      unreadCount: 0,
    },
    {
      id: "rockies",
      name: "Rockies",
      abbreviation: "COL",
      primaryColor: "#33006F",
      unreadCount: 2,
    },
    {
      id: "diamondbacks",
      name: "Diamondbacks",
      abbreviation: "ARI",
      primaryColor: "#A71930",
      unreadCount: 0,
    },
  ];
}

export default async function AdminChatPage() {
  // Check authentication and authorization
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only admins and commissioners can access
  if (!hasPermission(session.user.role, "admin")) {
    redirect("/dashboard");
  }

  // Fetch teams
  const teams = await getTeams();

  return (
    <div className="h-[calc(100vh-4rem)]">
      <AdminMessengerView
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
        initialTeams={teams}
        className="h-full"
      />
    </div>
  );
}
