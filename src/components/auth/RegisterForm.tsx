'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RegisterFormProps {
  className?: string;
}

// Password requirements - stronger requirements for security
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 10 characters', test: (pw: string) => pw.length >= 10 },
  { id: 'uppercase', label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
  { id: 'special', label: 'One special character (!@#$%^&*)', test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];

/**
 * RegisterForm Component
 *
 * Handles user registration with validation
 * Shows password strength requirements
 */
export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Check password requirements
  const passwordChecks = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    passed: req.test(password),
  }));
  const allPasswordRequirementsMet = passwordChecks.every((check) => check.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

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
      // Call registration API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes with user-friendly messages
        if (data.error?.code === 'EMAIL_EXISTS') {
          setError('An account with this email already exists. Please log in instead.');
        } else if (data.error?.code === 'RATE_LIMIT_EXCEEDED') {
          setError('Too many registration attempts. Please try again later.');
        } else if (data.error?.code === 'VALIDATION_ERROR') {
          const firstError = Object.values(data.error.details || {})[0];
          setError(Array.isArray(firstError) ? firstError[0] : 'Please check your information and try again.');
        } else {
          setError('Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Redirect to login with success message
      router.push('/login?registered=true');
    } catch {
      setError('Unable to connect to the server. Please check your connection and try again.');
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

      {/* Name field */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="name"
            type="text"
            placeholder="John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            className="pl-10"
            autoComplete="name"
          />
        </div>
      </div>

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
        <label
          htmlFor="password"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowPasswordRequirements(true)}
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
        {showPasswordRequirements && (
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
        )}
      </div>

      {/* Confirm password field */}
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Confirm Password
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

      {/* Terms agreement */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          required
          className="mt-1 h-4 w-4 rounded border-cream-dark text-leather focus:ring-leather"
        />
        <label htmlFor="terms" className="text-xs text-charcoal-light font-body">
          I agree to the{' '}
          <Link href="/terms" className="text-leather hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-leather hover:underline">
            Privacy Policy
          </Link>
        </label>
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
            Creating Account...
          </>
        ) : (
          'Create Account'
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

      {/* Login link */}
      <div className="text-center">
        <p className="text-sm text-charcoal font-body">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-leather hover:text-leather-light transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
