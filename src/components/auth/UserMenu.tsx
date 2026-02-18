'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Users,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * UserMenu Component
 *
 * Dropdown menu showing user info and actions
 * Displays login button if not authenticated
 */
export function UserMenu() {
  const { user, isLoading, isAuthenticated, roleDisplayName, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-cream-dark animate-pulse" />
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Join League</Link>
        </Button>
      </div>
    );
  }

  // Authenticated - show user menu
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-retro transition-colors',
          'hover:bg-cream-dark',
          isOpen && 'bg-cream-dark'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-chalk font-headline text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name (hidden on mobile) */}
        <span className="hidden md:block font-body text-sm text-charcoal max-w-32 truncate">
          {user.name}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-charcoal-light transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
          {/* User info header */}
          <div className="p-4 border-b border-gray-200">
            <p className="font-semibold text-sm text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={user.role === 'commissioner' ? 'gold' : 'default'} className="text-xs">
                {roleDisplayName}
              </Badge>
              {user.teamName && (
                <span className="text-xs text-gray-500 truncate">
                  {user.teamName}
                </span>
              )}
            </div>
          </div>

          {/* Menu items */}
          <nav className="p-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <Link
              href="/availability"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Availability
            </Link>

            {user.teamId && (
              <Link
                href={`/teams/${user.teamId}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Users className="w-4 h-4" />
                My Team
              </Link>
            )}

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>

            {['admin', 'commissioner'].includes(user.role) && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Admin Settings
              </Link>
            )}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
