'use client';

/**
 * useAuth Hook
 *
 * Provides authentication state and actions for client components
 * Wraps NextAuth.js session with convenient utilities
 */

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { SessionUser, UserRole } from '@/types/auth';
import { hasPermission, getRoleDisplayName } from '@/types/auth';

interface UseAuthReturn {
  // User state
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Role checks
  role: UserRole | null;
  roleDisplayName: string | null;
  isPlayer: boolean;
  isManager: boolean;
  isAdmin: boolean;
  isCommissioner: boolean;
  hasRole: (requiredRole: UserRole) => boolean;

  // Team info
  teamId: string | null;
  teamName: string | null;

  // Actions
  login: (email: string, password: string, callbackUrl?: string) => Promise<void>;
  logout: (callbackUrl?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Computed values
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user ?? null;
  const role = user?.role ?? null;

  // Role checks
  const isPlayer = role === 'player';
  const isManager = role === 'manager';
  const isAdmin = role === 'admin';
  const isCommissioner = role === 'commissioner';

  // Role display name
  const roleDisplayName = useMemo(() => {
    if (!role) return null;
    return getRoleDisplayName(role);
  }, [role]);

  // Team info
  const teamId = user?.teamId ?? null;
  const teamName = user?.teamName ?? null;

  /**
   * Check if user has at least the required role level
   */
  const hasRole = useCallback(
    (requiredRole: UserRole): boolean => {
      if (!role) return false;
      return hasPermission(role, requiredRole);
    },
    [role]
  );

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (email: string, password: string, callbackUrl?: string): Promise<void> => {
      const redirectTo = callbackUrl || '/dashboard';

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error === 'CredentialsSignin'
          ? 'Invalid email or password'
          : result.error
        );
      }

      // NextAuth v5 with redirect:false doesn't always return url
      // Manually redirect on success
      if (result?.ok) {
        router.push(redirectTo);
        router.refresh();
      }
    },
    [router]
  );

  /**
   * Logout user
   */
  const logout = useCallback(
    async (callbackUrl?: string): Promise<void> => {
      await signOut({
        redirect: true,
        callbackUrl: callbackUrl || '/login',
      });
    },
    []
  );

  /**
   * Refresh session data
   */
  const refresh = useCallback(async (): Promise<void> => {
    await update();
  }, [update]);

  return {
    user,
    isLoading,
    isAuthenticated,
    role,
    roleDisplayName,
    isPlayer,
    isManager,
    isAdmin,
    isCommissioner,
    hasRole,
    teamId,
    teamName,
    login,
    logout,
    refresh,
  };
}

// Export for convenience
export { signIn, signOut };
