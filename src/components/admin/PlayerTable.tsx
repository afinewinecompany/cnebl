'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  UserMinus,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Mail,
  Shield,
} from 'lucide-react';
import type { UserRole, FieldPosition, BattingSide, ThrowingArm } from '@/types/database.types';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  teamId: string | null;
  teamName: string | null;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition | null;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide | null;
  throws: ThrowingArm | null;
  isCaptain: boolean;
}

interface PlayerTableProps {
  users: UserData[];
  onAssign: (user: UserData) => void;
  onRemove: (userId: string) => void;
}

type SortField = 'fullName' | 'email' | 'role' | 'teamName' | 'createdAt';
type SortDirection = 'asc' | 'desc';

/**
 * MobilePlayerCard Component
 *
 * Card view for player data on mobile devices.
 * Displays player info in a compact, touch-friendly format.
 */
function MobilePlayerCard({
  user,
  onAssign,
  onRemove,
  getRoleBadgeVariant,
}: {
  user: UserData;
  onAssign: (user: UserData) => void;
  onRemove: (userId: string) => void;
  getRoleBadgeVariant: (role: UserRole) => 'gold' | 'primary' | 'success' | 'default';
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Header: Avatar, Name, Captain Badge, Status */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
          <span className="text-navy font-semibold text-lg">
            {user.fullName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-charcoal truncate">
              {user.fullName}
            </span>
            {user.isCaptain && (
              <Badge variant="gold" size="sm">
                C
              </Badge>
            )}
          </div>
          <div className="mt-1">
            <Badge
              variant={user.isActive ? 'success' : 'default'}
              size="sm"
            >
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Details Grid: 2 columns */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Team */}
        <div>
          <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
            Team
          </span>
          {user.teamName ? (
            <Badge variant="primary" size="sm">
              {user.teamName}
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Unassigned
            </Badge>
          )}
        </div>

        {/* Role */}
        <div>
          <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
            Role
          </span>
          <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
            {user.role}
          </Badge>
        </div>

        {/* Position */}
        <div>
          <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
            Position
          </span>
          {user.primaryPosition ? (
            <span className="text-sm font-mono text-charcoal">
              {user.primaryPosition}
              {user.secondaryPosition && `/${user.secondaryPosition}`}
            </span>
          ) : (
            <span className="text-sm text-charcoal-light">-</span>
          )}
        </div>

        {/* Jersey Number */}
        <div>
          <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
            Jersey
          </span>
          {user.jerseyNumber ? (
            <span className="text-sm font-mono text-charcoal">
              #{user.jerseyNumber}
            </span>
          ) : (
            <span className="text-sm text-charcoal-light">-</span>
          )}
        </div>
      </div>

      {/* Action Button */}
      {user.teamId ? (
        <Button
          variant="ghost"
          className="w-full min-h-[48px] text-cardinal hover:text-cardinal hover:bg-cardinal/10 border border-cardinal/20"
          onClick={() => onRemove(user.id)}
        >
          <UserMinus className="w-5 h-5 mr-2" />
          Remove from Team
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="w-full min-h-[48px] text-field hover:text-field hover:bg-field/10 border border-field/20"
          onClick={() => onAssign(user)}
          disabled={user.role !== 'player'}
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Assign to Team
        </Button>
      )}
    </div>
  );
}

/**
 * PlayerTable Component
 *
 * Sortable table displaying all players with actions for assignment.
 * Includes responsive mobile card view for smaller screens.
 */
export function PlayerTable({ users, onAssign, onRemove }: PlayerTableProps) {
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue = a[sortField] ?? '';
    let bValue = b[sortField] ?? '';

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'commissioner':
        return 'gold';
      case 'admin':
        return 'primary';
      case 'manager':
        return 'success';
      default:
        return 'default';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-charcoal-light uppercase tracking-wider cursor-pointer hover:text-navy transition-colors',
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
        <h3 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide mb-2">
          No Players Found
        </h3>
        <p className="text-sm text-charcoal-light font-body">
          No players match the current filters.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {sortedUsers.map((user) => (
          <MobilePlayerCard
            key={user.id}
            user={user}
            onAssign={onAssign}
            onRemove={onRemove}
            getRoleBadgeVariant={getRoleBadgeVariant}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableHeader field="fullName">Name</SortableHeader>
            <SortableHeader field="email" className="hidden md:table-cell">
              Email
            </SortableHeader>
            <SortableHeader field="teamName">Team</SortableHeader>
            <SortableHeader field="role" className="hidden sm:table-cell">
              Role
            </SortableHeader>
            <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-light uppercase tracking-wider hidden lg:table-cell">
              Position
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-light uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-charcoal-light uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedUsers.map((user) => (
            <>
              <tr
                key={user.id}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  expandedRow === user.id && 'bg-gray-50'
                )}
              >
                {/* Name */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-navy font-semibold text-sm">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-charcoal truncate">
                          {user.fullName}
                        </span>
                        {user.isCaptain && (
                          <Badge variant="gold" size="sm">
                            C
                          </Badge>
                        )}
                      </div>
                      {user.jerseyNumber && (
                        <span className="text-xs text-charcoal-light">
                          #{user.jerseyNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="flex items-center gap-2 text-sm text-charcoal-light">
                    <Mail className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{user.email}</span>
                  </div>
                </td>

                {/* Team */}
                <td className="px-4 py-4">
                  {user.teamName ? (
                    <Badge variant="primary">{user.teamName}</Badge>
                  ) : (
                    <Badge variant="outline">Unassigned</Badge>
                  )}
                </td>

                {/* Role */}
                <td className="px-4 py-4 hidden sm:table-cell">
                  <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                    {user.role}
                  </Badge>
                </td>

                {/* Position */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  {user.primaryPosition ? (
                    <span className="text-sm font-mono text-charcoal">
                      {user.primaryPosition}
                      {user.secondaryPosition && `/${user.secondaryPosition}`}
                    </span>
                  ) : (
                    <span className="text-sm text-charcoal-light">-</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <Badge
                    variant={user.isActive ? 'success' : 'default'}
                    size="sm"
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {user.teamId ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onRemove(user.id)}
                        className="text-cardinal hover:text-cardinal hover:bg-cardinal/10"
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onAssign(user)}
                        className="text-field hover:text-field hover:bg-field/10"
                        disabled={user.role !== 'player'}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Assign</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setExpandedRow(expandedRow === user.id ? null : user.id)
                      }
                      className="text-charcoal-light"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>

              {/* Expanded Row */}
              {expandedRow === user.id && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
                          Email
                        </span>
                        <span className="text-charcoal">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
                          Role
                        </span>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
                          Bats / Throws
                        </span>
                        <span className="text-charcoal font-mono">
                          {user.bats && user.throws
                            ? `${user.bats} / ${user.throws}`
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-charcoal-light block text-xs uppercase tracking-wide mb-1">
                          Joined
                        </span>
                        <span className="text-charcoal">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
