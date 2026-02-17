'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  className?: string;
}

/**
 * LoginForm Component
 *
 * Handles email/password authentication
 * Displays validation errors and loading states
 */
export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get callback URL from query params
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, callbackUrl);
      // Login successful - redirect handled by the hook
    } catch (err) {
      // Use sanitized, user-friendly error messages
      // Never expose internal error details to users
      const errorMessage = err instanceof Error ? err.message : '';

      if (errorMessage.includes('credentials') || errorMessage.includes('password') || errorMessage.includes('Invalid')) {
        setError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
        setError('Too many login attempts. Please try again later.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Unable to connect to the server. Please check your connection.');
      } else {
        // Generic error message - don't expose internal details
        setError('Unable to sign in. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Error message */}
      {error && (
        <div className="p-4 bg-cardinal/10 border border-cardinal/20 rounded-retro">
          <p className="text-sm text-cardinal font-body">{error}</p>
        </div>
      )}

      {/* Success message from registration */}
      {searchParams.get('registered') === 'true' && (
        <div className="p-4 bg-field/10 border border-field/20 rounded-retro">
          <p className="text-sm text-field font-body">
            Registration successful! Please log in.
          </p>
        </div>
      )}

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

      {/* Password field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-headline uppercase tracking-wide text-navy"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-leather hover:text-leather-light transition-colors font-body"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="pl-10 pr-10"
            autoComplete="current-password"
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
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cream-dark" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-ivory px-4 text-charcoal-light font-mono">
            OR
          </span>
        </div>
      </div>

      {/* Register link */}
      <div className="text-center">
        <p className="text-sm text-charcoal font-body">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-leather hover:text-leather-light transition-colors"
          >
            Register now
          </Link>
        </p>
      </div>
    </form>
  );
}
