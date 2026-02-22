import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

// Mock next-auth
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockUpdate = vi.fn();
let mockSessionData: { data: unknown; status: string } = {
  data: null,
  status: 'unauthenticated',
};

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    ...mockSessionData,
    update: mockUpdate,
  }),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionData = { data: null, status: 'unauthenticated' };
  });

  describe('unauthenticated state', () => {
    it('returns null user when not authenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.role).toBeNull();
    });

    it('returns false for all role checks', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isPlayer).toBe(false);
      expect(result.current.isManager).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isCommissioner).toBe(false);
    });

    it('returns null for team info', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.teamId).toBeNull();
      expect(result.current.teamName).toBeNull();
    });
  });

  describe('loading state', () => {
    it('returns isLoading true when status is loading', () => {
      mockSessionData = { data: null, status: 'loading' };

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('authenticated state', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'player' as const,
      teamId: 'team-123',
      teamName: 'Test Team',
    };

    beforeEach(() => {
      mockSessionData = {
        data: { user: mockUser },
        status: 'authenticated',
      };
    });

    it('returns user data when authenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns correct role', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.role).toBe('player');
      expect(result.current.isPlayer).toBe(true);
      expect(result.current.isManager).toBe(false);
    });

    it('returns role display name', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.roleDisplayName).toBe('Player');
    });

    it('returns team info', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.teamId).toBe('team-123');
      expect(result.current.teamName).toBe('Test Team');
    });
  });

  describe('role checks', () => {
    it('hasRole returns true for same or lower roles', () => {
      mockSessionData = {
        data: {
          user: { id: '1', email: 'a@b.c', name: 'A', role: 'admin' },
        },
        status: 'authenticated',
      };

      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole('player')).toBe(true);
      expect(result.current.hasRole('manager')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('commissioner')).toBe(false);
    });

    it('returns correct role flags for manager', () => {
      mockSessionData = {
        data: {
          user: { id: '1', email: 'a@b.c', name: 'A', role: 'manager' },
        },
        status: 'authenticated',
      };

      const { result } = renderHook(() => useAuth());

      expect(result.current.isPlayer).toBe(false);
      expect(result.current.isManager).toBe(true);
      expect(result.current.isAdmin).toBe(false);
    });

    it('returns correct role flags for commissioner', () => {
      mockSessionData = {
        data: {
          user: { id: '1', email: 'a@b.c', name: 'A', role: 'commissioner' },
        },
        status: 'authenticated',
      };

      const { result } = renderHook(() => useAuth());

      expect(result.current.isCommissioner).toBe(true);
      expect(result.current.hasRole('commissioner')).toBe(true);
    });
  });

  describe('login', () => {
    it('calls signIn with credentials', async () => {
      mockSignIn.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      });
    });

    it('redirects to dashboard on success', async () => {
      mockSignIn.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('redirects to custom callback URL on success', async () => {
      mockSignIn.mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password', '/profile');
      });

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('throws error on login failure', async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: 'CredentialsSignin',
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong');
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('calls signOut with redirect', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalledWith({
        redirect: true,
        callbackUrl: '/login',
      });
    });

    it('accepts custom callback URL', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout('/goodbye');
      });

      expect(mockSignOut).toHaveBeenCalledWith({
        redirect: true,
        callbackUrl: '/goodbye',
      });
    });
  });

  describe('refresh', () => {
    it('calls session update', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
