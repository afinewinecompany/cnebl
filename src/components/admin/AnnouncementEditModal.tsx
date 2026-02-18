'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X, Megaphone, AlertCircle, Calendar, Pin } from 'lucide-react';
import type { AnnouncementResponse } from '@/lib/api/schemas/announcements';

interface AnnouncementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementResponse | null; // null = creating new announcement
  onSave: (data: AnnouncementFormData) => Promise<void>;
  isLoading?: boolean;
  seasons?: { id: string; name: string; year: number }[];
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  seasonId: string | null;
  priority: number;
  isPinned: boolean;
  isPublished: boolean;
  expiresAt: string | null;
}

// Priority options
const PRIORITY_OPTIONS = [
  { value: 1, label: 'Normal', description: 'Standard announcement', color: 'text-charcoal' },
  { value: 2, label: 'Important', description: 'Highlighted for attention', color: 'text-gold' },
  { value: 3, label: 'Urgent', description: 'Critical information', color: 'text-cardinal' },
];

/**
 * AnnouncementEditModal Component
 *
 * Modal dialog for creating or editing an announcement.
 */
export function AnnouncementEditModal({
  isOpen,
  onClose,
  announcement,
  onSave,
  isLoading = false,
  seasons = [],
}: AnnouncementEditModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [priority, setPriority] = useState(1);
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = announcement !== null;

  // Reset form when announcement changes
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setSeasonId(announcement.seasonId);
      setPriority(announcement.priority);
      setIsPinned(announcement.isPinned);
      setIsPublished(announcement.isPublished);
      setExpiresAt(announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : '');
    } else {
      setTitle('');
      setContent('');
      setSeasonId(null);
      setPriority(1);
      setIsPinned(false);
      setIsPublished(false);
      setExpiresAt('');
    }
    setErrors({});
  }, [announcement, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length > 10000) {
      newErrors.content = 'Content must be 10,000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSave({
      title: title.trim(),
      content: content.trim(),
      seasonId: seasonId || null,
      priority,
      isPinned,
      isPublished,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide">
                {isEditMode ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <p className="text-sm text-charcoal-light">
                {isEditMode ? `Editing: ${announcement.title}` : 'Create a new league announcement'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-charcoal-light" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="announcementTitle"
              className="block text-sm font-medium text-charcoal mb-2"
            >
              Title <span className="text-cardinal">*</span>
            </label>
            <Input
              id="announcementTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Important Schedule Update"
              error={!!errors.title}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="mt-2 text-sm text-cardinal flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="announcementContent"
              className="block text-sm font-medium text-charcoal mb-2"
            >
              Content <span className="text-cardinal">*</span>
            </label>
            <textarea
              id="announcementContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement content here..."
              className={cn(
                'flex min-h-[150px] w-full rounded-md border bg-chalk px-4 py-3 font-body text-sm text-charcoal transition-all placeholder:text-charcoal-light disabled:cursor-not-allowed disabled:opacity-50 resize-y',
                errors.content
                  ? 'border-cardinal focus:border-cardinal focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--cardinal)/0.15)]'
                  : 'border-gray-200 focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)]'
              )}
              disabled={isLoading}
            />
            <div className="flex justify-between mt-2">
              {errors.content ? (
                <p className="text-sm text-cardinal flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.content}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-charcoal-light">
                {content.length} / 10,000
              </span>
            </div>
          </div>

          {/* Season and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Season Selector */}
            <div>
              <label
                htmlFor="seasonId"
                className="block text-sm font-medium text-charcoal mb-2"
              >
                Season (Optional)
              </label>
              <select
                id="seasonId"
                value={seasonId || ''}
                onChange={(e) => setSeasonId(e.target.value || null)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-chalk px-4 py-2 font-body text-sm text-charcoal transition-all focus:border-accent focus:outline-none focus:[box-shadow:0_0_0_3px_rgb(var(--accent)/0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                <option value="">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name} ({season.year})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-charcoal-light">
                Leave empty for league-wide announcements
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                      priority === option.value
                        ? option.value === 3
                          ? 'border-cardinal bg-cardinal/10 text-cardinal'
                          : option.value === 2
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-navy bg-navy/10 text-navy'
                        : 'border-gray-200 hover:border-gray-300 text-charcoal-light'
                    )}
                    disabled={isLoading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-charcoal-light">
                {PRIORITY_OPTIONS.find((o) => o.value === priority)?.description}
              </p>
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label
              htmlFor="expiresAt"
              className="block text-sm font-medium text-charcoal mb-2"
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Expiration Date (Optional)
            </label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="max-w-[280px]"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-charcoal-light">
              Announcement will be hidden after this date
            </p>
          </div>

          {/* Toggles Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pinned Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-navy/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy"></div>
              </label>
              <div>
                <div className="flex items-center gap-1">
                  <Pin className="w-4 h-4 text-charcoal" />
                  <span className="text-sm font-medium text-charcoal">Pin to Top</span>
                </div>
                <p className="text-xs text-charcoal-light">
                  Always show at the top of the list
                </p>
              </div>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-field/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-field"></div>
              </label>
              <div>
                <span className="text-sm font-medium text-charcoal">Publish Now</span>
                <p className="text-xs text-charcoal-light">
                  {isPublished ? 'Visible to everyone' : 'Save as draft'}
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-charcoal-light uppercase tracking-wide mb-3">Preview</p>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-headline font-semibold text-navy">
                  {title || 'Announcement Title'}
                </h4>
                <div className="flex items-center gap-2">
                  {isPinned && (
                    <span className="px-2 py-0.5 text-xs bg-navy/10 text-navy rounded-full flex items-center gap-1">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  )}
                  {priority === 3 && (
                    <span className="px-2 py-0.5 text-xs bg-cardinal/10 text-cardinal rounded-full">
                      Urgent
                    </span>
                  )}
                  {priority === 2 && (
                    <span className="px-2 py-0.5 text-xs bg-gold/10 text-gold rounded-full">
                      Important
                    </span>
                  )}
                  {!isPublished && (
                    <span className="px-2 py-0.5 text-xs bg-gray-200 text-charcoal rounded-full">
                      Draft
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-charcoal-light line-clamp-2">
                {content || 'Announcement content will appear here...'}
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">&#8987;</span>
                Saving...
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4 mr-2" />
                {isEditMode ? 'Save Changes' : 'Create Announcement'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
