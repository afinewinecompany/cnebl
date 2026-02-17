/**
 * Authentication Types for CNEBL
 *
 * Defines session types, form data, and auth-related interfaces
 */

// Re-export UserRole from database types for consistency
import type { UserRole } from './database.types';
export type { UserRole };

// User interface matching the database users table
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  profileImage?: string;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Session user (minimal info stored in JWT)
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  image?: string;
}

// Registration form data
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Password reset request
export interface ForgotPasswordFormData {
  email: string;
}

// Password reset form
export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

// Auth response types
export interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Role permission levels (higher number = more permissions)
export const ROLE_LEVELS: Record<UserRole, number> = {
  player: 1,
  manager: 2,
  admin: 3,
  commissioner: 4,
};

// Check if a role has at least the required permission level
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    player: 'Player',
    manager: 'Team Manager',
    admin: 'Administrator',
    commissioner: 'Commissioner',
  };
  return displayNames[role];
}
