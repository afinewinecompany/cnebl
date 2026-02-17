import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Header, Footer } from '@/components/layout';

/**
 * Protected Layout
 *
 * Layout for authenticated pages with header and footer.
 * Verifies authentication server-side before rendering.
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
    </div>
  );
}
