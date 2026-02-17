import type { Metadata } from 'next';
import { AuthCard, ForgotPasswordForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Forgot Password - CNEBL',
  description: 'Reset your Coastal New England Baseball League account password',
};

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email
 */
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset Password"
      description="We'll send you a link to reset your password"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
