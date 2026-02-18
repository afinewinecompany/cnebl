'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AnnouncementEditModal, DeleteConfirmModal } from '@/components/admin';
import type { AnnouncementFormData } from '@/components/admin';
import type { AnnouncementResponse } from '@/lib/api/schemas/announcements';
import type { Season } from '@/types';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
} from 'lucide-react';

/**
 * Announcements Management Page
 *
 * Admin page to view, create, edit, and delete announcements.
 */
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterPriority, setFilterPriority] = useState<number | null>(null);
  const [filterSeason, setFilterSeason] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load announcements from API
  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/announcements?includeExpired=true&pageSize=100');
      if (response.ok) {
        const data = await response.json();
        // The API returns published announcements only, but for admin we need all
        // For now we'll work with what we have - in production this would need an admin endpoint
        setAnnouncements(data.data?.announcements || []);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load seasons from API
  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(data.data?.seasons || []);
      }
    } catch (error) {
      console.error('Failed to fetch seasons:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchSeasons();
  }, []);

  // Filter and search announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'published' && announcement.isPublished) ||
        (filterStatus === 'draft' && !announcement.isPublished);

      // Priority filter
      const matchesPriority = filterPriority === null || announcement.priority === filterPriority;

      // Season filter
      const matchesSeason = filterSeason === null || announcement.seasonId === filterSeason;

      return matchesSearch && matchesStatus && matchesPriority && matchesSeason;
    });
  }, [announcements, searchQuery, filterStatus, filterPriority, filterSeason]);

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3:
        return 'Urgent';
      case 2:
        return 'Important';
      default:
        return 'Normal';
    }
  };

  const getPriorityBadgeVariant = (priority: number) => {
    switch (priority) {
      case 3:
        return 'danger' as const;
      case 2:
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Handle opening Edit modal
  const handleEditAnnouncement = (announcement: AnnouncementResponse) => {
    setSelectedAnnouncement(announcement);
    setIsEditModalOpen(true);
  };

  // Handle opening Add modal
  const handleAddAnnouncement = () => {
    setSelectedAnnouncement(null);
    setIsEditModalOpen(true);
  };

  // Handle opening Delete modal
  const handleDeleteClick = (announcement: AnnouncementResponse) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  // Quick action: Toggle publish status
  const handleTogglePublish = async (announcement: AnnouncementResponse) => {
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !announcement.isPublished }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? data.data : a))
        );
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  };

  // Quick action: Toggle pinned status
  const handleTogglePin = async (announcement: AnnouncementResponse) => {
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !announcement.isPinned }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? data.data : a))
        );
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  // Save announcement (create or update)
  const handleSaveAnnouncement = async (formData: AnnouncementFormData) => {
    setIsSaving(true);
    try {
      if (selectedAnnouncement) {
        // Update existing announcement
        const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          setAnnouncements((prev) =>
            prev.map((a) => (a.id === selectedAnnouncement.id ? data.data : a))
          );
          setIsEditModalOpen(false);
          setSelectedAnnouncement(null);
        }
      } else {
        // Create new announcement
        const response = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          setAnnouncements((prev) => [data.data, ...prev]);
          setIsEditModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to save announcement:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== selectedAnnouncement.id));
        setIsDeleteModalOpen(false);
        setSelectedAnnouncement(null);
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Stats calculations
  const publishedCount = announcements.filter((a) => a.isPublished).length;
  const draftCount = announcements.filter((a) => !a.isPublished).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;
  const urgentCount = announcements.filter((a) => a.priority === 3).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Announcements
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            Manage league-wide announcements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleAddAnnouncement}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-navy">{announcements.length}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-field/10 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-field" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-field">{publishedCount}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Pin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-gold">{pinnedCount}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Pinned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cardinal/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-cardinal" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-cardinal">{urgentCount}</p>
                <p className="text-xs text-charcoal-light uppercase tracking-wide">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-charcoal-light" />

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
                className="h-10 rounded-md border border-gray-200 bg-chalk px-3 text-sm text-charcoal focus:border-accent focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority === null ? '' : filterPriority}
                onChange={(e) => setFilterPriority(e.target.value === '' ? null : parseInt(e.target.value))}
                className="h-10 rounded-md border border-gray-200 bg-chalk px-3 text-sm text-charcoal focus:border-accent focus:outline-none"
              >
                <option value="">All Priority</option>
                <option value="1">Normal</option>
                <option value="2">Important</option>
                <option value="3">Urgent</option>
              </select>

              {/* Season Filter */}
              <select
                value={filterSeason === null ? '' : filterSeason}
                onChange={(e) => setFilterSeason(e.target.value === '' ? null : e.target.value)}
                className="h-10 rounded-md border border-gray-200 bg-chalk px-3 text-sm text-charcoal focus:border-accent focus:outline-none"
              >
                <option value="">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="overflow-hidden">
            <div className="flex">
              {/* Priority indicator bar */}
              <div
                className={`w-1 ${
                  announcement.priority === 3
                    ? 'bg-cardinal'
                    : announcement.priority === 2
                      ? 'bg-gold'
                      : 'bg-gray-300'
                }`}
              />
              <div className="flex-1 p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-headline text-lg font-semibold text-navy">
                        {announcement.title}
                      </h3>
                      {announcement.isPinned && (
                        <Badge variant="primary" size="sm">
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      <Badge variant={getPriorityBadgeVariant(announcement.priority)} size="sm">
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                      <Badge
                        variant={announcement.isPublished ? 'success' : 'default'}
                        size="sm"
                      >
                        {announcement.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      {isExpired(announcement.expiresAt) && (
                        <Badge variant="danger" size="sm">
                          <Clock className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-charcoal-light line-clamp-2 mb-3">
                      {announcement.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-light">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created: {formatDate(announcement.createdAt)}
                      </span>
                      {announcement.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Published: {formatDate(announcement.publishedAt)}
                        </span>
                      )}
                      {announcement.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {formatDate(announcement.expiresAt)}
                        </span>
                      )}
                      {announcement.author && (
                        <span>By: {announcement.author.fullName}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleTogglePublish(announcement)}
                      title={announcement.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {announcement.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleTogglePin(announcement)}
                      title={announcement.isPinned ? 'Unpin' : 'Pin'}
                    >
                      {announcement.isPinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAnnouncement(announcement)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-cardinal hover:text-cardinal hover:bg-cardinal/10"
                      onClick={() => handleDeleteClick(announcement)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAnnouncements.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-charcoal-light mx-auto mb-4" />
            <h3 className="font-headline text-lg font-semibold text-navy uppercase tracking-wide mb-2">
              No Announcements Found
            </h3>
            <p className="text-sm text-charcoal-light font-body mb-4">
              {searchQuery || filterStatus !== 'all' || filterPriority !== null || filterSeason !== null
                ? 'No announcements match your filters'
                : 'No announcements have been created yet.'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterPriority === null && filterSeason === null && (
              <Button onClick={handleAddAnnouncement}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Modal */}
      <AnnouncementEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        announcement={selectedAnnouncement}
        onSave={handleSaveAnnouncement}
        isLoading={isSaving}
        seasons={seasons.map((s) => ({ id: s.id, name: s.name, year: s.year }))}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onConfirm={handleDeleteAnnouncement}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action cannot be undone."
        itemName={selectedAnnouncement?.title || ''}
        isLoading={isSaving}
      />
    </div>
  );
}
