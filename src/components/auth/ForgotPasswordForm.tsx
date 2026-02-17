'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ForgotPasswordFormProps {
  className?: string;
}

/**
 * ForgotPasswordForm Component
 *
 * Allows users to request a password reset email
 */
export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // TODO: Call password reset API endpoint
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success state
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-field/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-field" />
          </div>
          <h2 className="font-headline text-xl font-bold text-navy uppercase tracking-wide mb-2">
            Check Your Email
          </h2>
          <p className="text-sm text-charcoal-light font-body">
            If an account exists for <strong className="text-charcoal">{email}</strong>,
            you will receive a password reset link shortly.
          </p>
        </div>

        <div className="p-4 bg-cream rounded-retro border border-cream-dark">
          <p className="text-xs text-charcoal-light font-body text-center">
            Didn&apos;t receive an email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-leather hover:underline font-semibold"
            >
              try again
            </button>
          </p>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-charcoal hover:text-leather transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Error message */}
      {error && (
        <div className="p-4 bg-cardinal/10 border border-cardinal/20 rounded-retro">
          <p className="text-sm text-cardinal font-body">{error}</p>
        </div>
      )}

      {/* Info text */}
      <p className="text-sm text-charcoal-light font-body text-center">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      {/* Email field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Link'
        )}
      </Button>

      {/* Back to login */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-charcoal hover:text-leather transition-colors font-body"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>
    </form>
  );
}
