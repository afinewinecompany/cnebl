'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Trophy,
  MoreHorizontal,
  MessageCircle,
} from 'lucide-react';
import type { UserRole } from '@/types/database.types';

interface AdminSidebarProps {
  userRole: UserRole;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  requiredRole?: UserRole;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Players',
    href: '/admin/players',
    icon: Users,
  },
  {
    name: 'Teams',
    href: '/admin/teams',
    icon: Shield,
  },
  {
    name: 'Games',
    href: '/admin/games',
    icon: Calendar,
  },
  {
    name: 'Statistics',
    href: '/admin/stats',
    icon: BarChart3,
  },
  {
    name: 'Standings',
    href: '/admin/standings',
    icon: Trophy,
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: Megaphone,
  },
  {
    name: 'Team Chats',
    href: '/admin/chat',
    icon: MessageCircle,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    requiredRole: 'commissioner',
  },
];

/**
 * AdminSidebar Component
 *
 * Navigation sidebar for admin pages with collapsible functionality.
 * Includes mobile bottom navigation with drawer for overflow items.
 */
export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiredRole) return true;
    const roleHierarchy: UserRole[] = ['player', 'manager', 'admin', 'commissioner'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(item.requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  });

  // Split items for mobile: first 4 in bottom bar, rest in drawer
  const mobileBottomItems = filteredNavItems.slice(0, 4);
  const mobileDrawerItems = filteredNavItems.slice(4);

  const isActiveLink = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Check if any drawer item is active (to highlight the More button)
  const isDrawerItemActive = mobileDrawerItems.some((item) => isActiveLink(item.href));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {!isCollapsed && (
              <span className="font-headline text-sm font-semibold text-navy uppercase tracking-wide">
                Admin Panel
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-charcoal-light"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = isActiveLink(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                    isActive
                      ? 'bg-navy text-chalk shadow-sm'
                      : 'text-charcoal hover:bg-gray-100',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive ? 'text-chalk' : 'text-charcoal-light group-hover:text-navy'
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span
                      className={cn(
                        'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full',
                        isActive
                          ? 'bg-chalk/20 text-chalk'
                          : 'bg-cardinal/10 text-cardinal'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {!isCollapsed ? (
              <div className="text-xs text-charcoal-light">
                <p className="font-medium">Role: {userRole}</p>
                <p className="mt-1 opacity-70">Admin Panel v1.0</p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-2 h-2 rounded-full bg-field" title="Connected" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {/* First 4 nav items */}
          {mobileBottomItems.map((item) => {
            const isActive = isActiveLink(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[64px] py-1 transition-colors',
                  isActive ? 'text-navy' : 'text-charcoal-light'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* More button (only show if there are overflow items) */}
          {mobileDrawerItems.length > 0 && (
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center min-w-[64px] py-1 transition-colors',
                isDrawerItemActive || isMobileDrawerOpen ? 'text-navy' : 'text-charcoal-light'
              )}
              aria-label="More navigation options"
              aria-expanded={isMobileDrawerOpen}
            >
              <MoreHorizontal className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-medium">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Additional navigation options"
          >
            {/* Pull indicator */}
            <div className="pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            </div>

            {/* Drawer nav items */}
            <nav className="px-4 pb-4">
              {mobileDrawerItems.map((item) => {
                const isActive = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 min-h-[56px] rounded-lg transition-colors',
                      isActive
                        ? 'bg-navy/5 text-navy'
                        : 'text-charcoal hover:bg-gray-100'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-6 h-6 flex-shrink-0',
                        isActive ? 'text-navy' : 'text-charcoal-light'
                      )}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'ml-auto px-2 py-0.5 text-xs font-semibold rounded-full',
                          isActive
                            ? 'bg-navy/10 text-navy'
                            : 'bg-cardinal/10 text-cardinal'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
