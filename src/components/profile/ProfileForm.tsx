'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Save, User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';

interface ProfileFormProps {
  user: SessionUser;
  className?: string;
}

/**
 * ProfileForm Component
 *
 * Form for editing user profile information
 * - Full name
 * - Phone number
 * - Avatar upload
 */
export function ProfileForm({ user, className }: ProfileFormProps) {
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState(user.name || '');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // In a real implementation, this would call an API
      // For now, we simulate a successful update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('Profile updated successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

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

      {/* Avatar Upload */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-cream-dark border-4 border-cream flex items-center justify-center">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-charcoal-light" />
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center bg-charcoal-dark/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="w-8 h-8 text-chalk" />
            <span className="sr-only">Upload avatar</span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            aria-label="Upload profile picture"
          />
        </div>
        <div className="text-center sm:text-left">
          <h3 className="font-headline text-sm uppercase tracking-wide text-navy">
            Profile Photo
          </h3>
          <p className="text-sm text-charcoal-light mt-1">
            Click the image to upload a new photo
          </p>
          <p className="text-xs text-charcoal-light mt-0.5">
            JPG, PNG, or GIF. Max 2MB.
          </p>
        </div>
      </div>

      {/* Email (Read Only) */}
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
            value={user.email}
            disabled
            className="pl-10 bg-cream cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-charcoal-light">
          Contact support to change your email address
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <label
          htmlFor="fullName"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <label
          htmlFor="phone"
          className="block text-sm font-headline uppercase tracking-wide text-navy"
        >
          Phone Number
          <span className="ml-1 text-charcoal-light font-normal normal-case">(optional)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-light" />
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={handlePhoneChange}
            disabled={isLoading}
            className="pl-10"
            maxLength={14}
          />
        </div>
        <p className="text-xs text-charcoal-light">
          Used for game reminders and team notifications
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-cream-dark">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
