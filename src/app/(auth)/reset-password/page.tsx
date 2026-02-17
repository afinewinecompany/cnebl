import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard, ResetPasswordForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Reset Password - CNEBL',
  description: 'Set a new password for your Coastal New England Baseball League account',
};

/**
 * Reset Password Page
 *
 * Allows users to set a new password using a reset token
 */
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Create New Password"
      description="Enter your new password below"
    >
      <Suspense fallback={<ResetPasswordSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}

/**
 * Loading skeleton for reset password form
 */
function ResetPasswordSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-28 bg-cream-dark rounded" />
        <div className="h-10 bg-cream-dark rounded" />
        <div className="h-24 bg-cream-dark rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-36 bg-cream-dark rounded" />
        <div className="h-10 bg-cream-dark rounded" />
      </div>
      <div className="h-12 bg-cream-dark rounded" />
    </div>
  );
}
