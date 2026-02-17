import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRoleDisplayName } from '@/types/auth';
import { User, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile Settings - CNEBL',
  description: 'Manage your CNEBL profile settings',
};

/**
 * Profile Page
 *
 * Protected page allowing users to edit their profile information
 * Features:
 * - Edit full name, phone, avatar
 * - Change password
 * - Profile preview
 */
export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-leather/10 rounded-full">
            <Settings className="h-6 w-6 text-leather" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
              Profile Settings
            </h1>
            <p className="text-charcoal-light font-body">
              Manage your account information and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Form - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Info Card */}
          <Card>
            <CardHeader className="stitch-border bg-cream border-b border-cream-dark">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-leather" aria-hidden="true" />
                Account Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProfileForm user={user} />
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card>
            <CardHeader className="stitch-border bg-cream border-b border-cream-dark">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-navy" aria-hidden="true" />
                Security
              </CardTitle>
              <CardDescription>
                Update your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <PasswordChangeForm />
            </CardContent>
          </Card>
        </div>

        {/* Profile Preview Sidebar */}
        <div className="space-y-6">
          <ProfilePreview user={user} />

          {/* Account Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal-light">Role</span>
                <Badge variant={user.role === 'commissioner' ? 'gold' : 'default'}>
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
              {user.teamName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal-light">Team</span>
                  <span className="text-sm font-medium text-navy">{user.teamName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal-light">Email Verified</span>
                <Badge variant="success">Verified</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
