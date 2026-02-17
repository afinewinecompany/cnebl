'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';
import { getRoleDisplayName } from '@/types/auth';
import { User, Mail, Users, Eye } from 'lucide-react';

interface ProfilePreviewProps {
  user: SessionUser;
  className?: string;
}

/**
 * ProfilePreview Component
 *
 * Shows a preview of how the user's profile appears to others
 */
export function ProfilePreview({ user, className }: ProfilePreviewProps) {
  // Get initials from name
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="stitch-border bg-cream border-b border-cream-dark">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-leather" aria-hidden="true" />
          Profile Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Profile Header Background */}
        <div className="relative h-20 bg-gradient-to-br from-navy to-navy-light">
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                white 10px,
                white 11px
              )`,
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 -mt-10 relative">
          {/* Avatar */}
          <div className="mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-leather border-4 border-ivory shadow-lg flex items-center justify-center">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-chalk">
                  {initials}
                </span>
              )}
            </div>
          </div>

          {/* Name and Role */}
          <div className="mb-4">
            <h3 className="font-headline text-xl font-bold text-navy uppercase tracking-wide">
              {user.name}
            </h3>
            <Badge
              variant={user.role === 'commissioner' ? 'gold' : 'default'}
              className="mt-1"
            >
              {getRoleDisplayName(user.role)}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center">
                <Mail className="w-4 h-4 text-charcoal-light" />
              </div>
              <span className="text-charcoal">{user.email}</span>
            </div>

            {user.teamName && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center">
                  <Users className="w-4 h-4 text-charcoal-light" />
                </div>
                <span className="text-charcoal">{user.teamName}</span>
              </div>
            )}
          </div>

          {/* Preview Note */}
          <div className="mt-6 p-3 bg-cream rounded-retro border border-cream-dark">
            <p className="text-xs text-charcoal-light text-center">
              This is how other players see your profile
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
