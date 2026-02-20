import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Header, Footer } from '@/components/layout';
import { FloatingChat } from '@/components/chat';

/**
 * Protected Layout
 *
 * Layout for authenticated pages with header and footer.
 * Verifies authentication server-side before rendering.
 * Includes a floating team chat button for users with a team.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const session = await auth();

  if (!session?.user) {
    // Redirect to login if not authenticated
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Floating team chat - appears for users with a teamId */}
      <FloatingChat user={session.user} />
    </div>
  );
}
