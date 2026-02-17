'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Lock, Check, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ResetPasswordFormProps {
  className?: string;
}

// Password requirements
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
];

/**
 * ResetPasswordForm Component
 *
 * Allows users to set a new password with a valid reset token
 */
export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check password requirements
  const passwordChecks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.test(password),
  }));
  const allPasswordRequirementsMet = passwordChecks.every((check) => check.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Check if token exists
  if (!token) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-cardinal/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-cardinal" />
          </div>
          <h2 className="font-headline text-xl font-bold text-navy uppercase tracking-wide mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-sm text-charcoal-light font-body">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
        </div>

        <Button asChild className="w-full" size="lg">
          <Link href="/forgot-password">
            Request New Link
          </Link>
        </Button>

        <Link
          href="/login"
          className="block text-center text-sm text-charcoal hover:text-leather transition-colors font-body"
        >
          Back to login
        </Link>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-field/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-field" />
          </div>
          <h2 className="font-headline text-xl font-bold text-navy uppercase tracking-wide mb-2">
            Password Reset Complete
          </h2>
          <p className="text-sm text-charcoal-light font-body">
            Your password has been successfully changed.
            You can now log in with your new password.
          </p>
        </div>

        <Button asChild className="w-full" size="lg">
          <Link href="/login">
            Sign In
          </Link>
        </Button>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!allPasswordRequirementsMet) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call password reset API endpoint with token
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success state
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again or request a new reset link.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      {/* Error message */}
      {error && (
        <div className="p-4 bg-cardinal/10 border border-cardinal/20 rounded-retro">
          <p className="text-sm text-cardinal font-body">{error}</p>
        </div>
      )}

      {/* Password field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="pl-10 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Password requirements */}
        <div className="mt-3 p-3 bg-cream rounded-retro border border-cream-dark">
          <p className="text-xs font-headline uppercase tracking-wide text-charcoal-light mb-2">
            Password Requirements
          </p>
          <ul className="space-y-1">
            {passwordChecks.map((check) => (
              <li
                key={check.id}
                className={cn(
                  'flex items-center gap-2 text-xs font-mono',
                  check.passed ? 'text-field' : 'text-charcoal-light'
                )}
              >
                {check.passed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                {check.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Confirm password field */}
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              'pl-10 pr-10',
              confirmPassword.length > 0 && (passwordsMatch ? 'border-field' : 'border-cardinal')
            )}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-cardinal font-body">Passwords do not match</p>
        )}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading || !allPasswordRequirementsMet}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Resetting Password...
          </>
        ) : (
          'Reset Password'
        )}
      </Button>

      {/* Back to login */}
      <Link
        href="/login"
        className="block text-center text-sm text-charcoal hover:text-leather transition-colors font-body"
      >
        Back to login
      </Link>
    </form>
  );
}
