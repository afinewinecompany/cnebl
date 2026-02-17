import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - CNEBL',
  description: 'Sign in or create an account for the Coastal New England Baseball League',
};

/**
 * Auth Layout
 *
 * Simple layout wrapper for authentication pages
 * No header/footer to maintain focus on auth forms
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
