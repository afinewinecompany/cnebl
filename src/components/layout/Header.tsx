"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Schedule", href: "/schedule" },
  { name: "Standings", href: "/standings" },
  { name: "Stats", href: "/stats" },
  { name: "Teams", href: "/teams" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      <nav className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Image
              src="/logo_02.png"
              alt="CNEBL Logo"
              width={72}
              height={72}
              className="w-16 h-16 sm:w-14 sm:h-14 object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="font-medium text-sm text-gray-600 transition-colors hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="font-medium text-sm text-primary bg-primary/5 px-3 py-2 rounded-md transition-colors hover:bg-primary/10"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:block">
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-[500px] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="font-medium text-sm text-gray-600 transition-colors hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-gray-200">
              {isLoading ? (
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="space-y-3">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.teamName || user.email}
                      </p>
                    </div>
                  </div>

                  {/* Mobile nav links */}
                  <div className="space-y-1">
                    <Link
                      href="/dashboard"
                      className="block font-medium text-sm text-primary bg-primary/5 px-3 py-2 rounded-md transition-colors hover:bg-primary/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/availability"
                      className="block font-medium text-sm text-gray-600 px-3 py-2 rounded-md transition-colors hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Availability
                    </Link>
                    {user.teamId && (
                      <>
                        <Link
                          href={`/teams/${user.teamId}`}
                          className="block font-medium text-sm text-gray-600 px-3 py-2 rounded-md transition-colors hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Team
                        </Link>
                        <Link
                          href="/chat"
                          className="block font-medium text-sm text-gray-600 px-3 py-2 rounded-md transition-colors hover:text-gray-900 hover:bg-gray-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Team Chat
                        </Link>
                      </>
                    )}
                    <Link
                      href="/profile"
                      className="block font-medium text-sm text-gray-600 px-3 py-2 rounded-md transition-colors hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {['admin', 'commissioner'].includes(user.role) && (
                      <Link
                        href="/admin"
                        className="block font-medium text-sm text-gray-600 px-3 py-2 rounded-md transition-colors hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                  </div>

                  {/* Logout button */}
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 flex-1"
                    asChild
                  >
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" className="flex-1" asChild>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
