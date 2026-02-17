import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard, LoginForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Sign In - CNEBL',
  description: 'Sign in to your Coastal New England Baseball League account',
};

/**
 * Login Page
 *
 * Displays the login form with email/password authentication
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to access your CNEBL account"
    >
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

/**
 * Loading skeleton for login form
 */
function LoginFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-cream-dark rounded" />
        <div className="h-10 bg-cream-dark rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 bg-cream-dark rounded" />
        <div className="h-10 bg-cream-dark rounded" />
      </div>
      <div className="h-12 bg-cream-dark rounded" />
    </div>
  );
}
