'use client';

import * as React from 'react';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordChangeFormProps {
  className?: string;
}

interface PasswordStrength {
  score: number;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

/**
 * PasswordChangeForm Component
 *
 * Form for changing user password with:
 * - Current password verification
 * - Password strength indicator
 * - Confirmation matching
 */
export function PasswordChangeForm({ className }: PasswordChangeFormProps) {
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate password strength
  const getPasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    return { score, checks };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Get strength bar color
  const getStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-cardinal';
    if (score <= 3) return 'bg-gold';
    if (score <= 4) return 'bg-field/70';
    return 'bg-field';
  };

  // Get strength label
  const getStrengthLabel = (score: number) => {
    if (score <= 1) return 'Weak';
    if (score <= 2) return 'Fair';
    if (score <= 3) return 'Good';
    if (score <= 4) return 'Strong';
    return 'Very Strong';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // In a real implementation, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // Password requirement check item
  const RequirementCheck = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="w-3 h-3 text-field" />
      ) : (
        <X className="w-3 h-3 text-charcoal-light" />
      )}
      <span className={cn(met ? 'text-field' : 'text-charcoal-light')}>
        {label}
      </span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Error message */}
      {error && (
        <div className="p-4 bg-cardinal/10 border border-cardinal/20 rounded-retro">
          <p className="text-sm text-cardinal font-body">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-4 bg-field/10 border border-field/20 rounded-retro">
          <p className="text-sm text-field font-body">{success}</p>
        </div>
      )}

      {/* Current Password */}
      <div className="space-y-2">
        <label
          htmlFor="currentPassword"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Current Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading}
            className="pl-10 pr-10"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
            tabIndex={-1}
            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
          >
            {showCurrentPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <label
          htmlFor="newPassword"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            className="pl-10 pr-10"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
            tabIndex={-1}
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
          >
            {showNewPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {newPassword && (
          <div className="space-y-2 mt-3">
            {/* Strength bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    getStrengthColor(passwordStrength.score)
                  )}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-charcoal-light min-w-[60px] text-right">
                {getStrengthLabel(passwordStrength.score)}
              </span>
            </div>

            {/* Requirements checklist */}
            <div className="grid grid-cols-2 gap-1 p-3 bg-cream rounded-retro">
              <RequirementCheck
                met={passwordStrength.checks.length}
                label="8+ characters"
              />
              <RequirementCheck
                met={passwordStrength.checks.uppercase}
                label="Uppercase letter"
              />
              <RequirementCheck
                met={passwordStrength.checks.lowercase}
                label="Lowercase letter"
              />
              <RequirementCheck
                met={passwordStrength.checks.number}
                label="Number"
              />
              <RequirementCheck
                met={passwordStrength.checks.special}
                label="Special character"
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
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
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className={cn(
              'pl-10 pr-10',
              confirmPassword && (passwordsMatch ? 'border-field' : 'border-cardinal')
            )}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {confirmPassword && (
          <p
            className={cn(
              'text-xs',
              passwordsMatch ? 'text-field' : 'text-cardinal'
            )}
          >
            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-cream-dark">
        <Button
          type="submit"
          disabled={isLoading || !passwordsMatch || passwordStrength.score < 3}
          variant="secondary"
          className="min-w-[180px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Changing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
