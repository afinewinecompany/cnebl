import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout';
import { AdminSidebar } from '@/components/admin';

/**
 * Admin Layout
 *
 * Layout for admin pages with sidebar navigation.
 * Only accessible to users with admin or commissioner roles.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect('/login');
  }

  // Check admin/commissioner role
  const isAdmin = ['admin', 'commissioner'].includes(session.user.role);
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <AdminSidebar userRole={session.user.role} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
