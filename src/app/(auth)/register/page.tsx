import type { Metadata } from 'next';
import { AuthCard, RegisterForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Create Account - CNEBL',
  description: 'Create a new account to join the Coastal New England Baseball League',
};

/**
 * Registration Page
 *
 * Displays the registration form for new users
 */
export default function RegisterPage() {
  return (
    <AuthCard
      title="Join the League"
      description="Create your CNEBL account to get started"
    >
      <RegisterForm />
    </AuthCard>
  );
}
