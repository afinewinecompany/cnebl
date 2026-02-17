'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * AuthCard Component
 *
 * Styled wrapper for authentication forms with Heritage Diamond theme
 * Includes decorative header with baseball motifs
 */
export function AuthCard({
  children,
  title,
  description,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4 py-12">
      {/* Logo/Brand */}
      <Link href="/" className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center">
            <span className="font-script text-2xl text-chalk">C</span>
          </div>
          <span className="font-headline text-3xl font-bold text-navy uppercase tracking-wider">
            CNEBL
          </span>
        </div>
        <p className="text-sm text-charcoal-light mt-2 font-body">
          Coastal New England Baseball League
        </p>
      </Link>

      {/* Main Card */}
      <div
        className={cn(
          'w-full max-w-md',
          className
        )}
      >
        {/* Card with stitch border effect */}
        <div className="relative bg-ivory rounded-retro shadow-card border border-cream-dark overflow-hidden">
          {/* Baseball stitch decorative header */}
          <div className="h-2 bg-leather relative">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  transparent 0px,
                  transparent 12px,
                  #BE1E2D 12px,
                  #BE1E2D 20px,
                  transparent 20px,
                  transparent 32px
                )`,
                backgroundSize: '32px 100%',
              }}
            />
          </div>

          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <h1 className="font-headline text-2xl font-bold text-navy uppercase tracking-wide">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm text-charcoal-light font-body">
                {description}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-8 pb-8 pt-4 border-t border-cream-dark bg-cream/30">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="mt-8 flex items-center gap-4 text-charcoal-light text-sm">
        <span className="w-8 h-px bg-cream-dark" />
        <span className="font-mono text-xs">EST. 2024</span>
        <span className="w-8 h-px bg-cream-dark" />
      </div>
    </div>
  );
}
