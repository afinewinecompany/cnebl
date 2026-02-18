'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Mail,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Admin Settings Page
 *
 * League-wide settings management for commissioners.
 */
export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const sections = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'integrations', name: 'Integrations', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-navy uppercase tracking-wide">
            Settings
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            Manage league-wide settings and configurations
          </p>
        </div>
        <Badge variant="warning" size="lg">
          <Shield className="w-4 h-4 mr-1" />
          Commissioner Only
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
                    activeSection === section.id
                      ? 'bg-navy text-chalk'
                      : 'text-charcoal hover:bg-gray-100'
                  )}
                >
                  <section.icon
                    className={cn(
                      'w-4 h-4',
                      activeSection === section.id ? 'text-chalk' : 'text-charcoal-light'
                    )}
                  />
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'general' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    League Information
                  </CardTitle>
                  <CardDescription>
                    Basic information about your league
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-charcoal mb-1.5 block">
                      League Name
                    </label>
                    <Input defaultValue="Coastal New England Baseball League" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-charcoal mb-1.5 block">
                      Abbreviation
                    </label>
                    <Input defaultValue="CNEBL" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-charcoal mb-1.5 block">
                      Contact Email
                    </label>
                    <Input type="email" defaultValue="contact@cnebl.org" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-charcoal mb-1.5 block">
                      Website URL
                    </label>
                    <Input defaultValue="https://cnebl.org" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Season Settings</CardTitle>
                  <CardDescription>
                    Configure default season parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-1.5 block">
                        Default Game Length (innings)
                      </label>
                      <Input type="number" defaultValue="9" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-1.5 block">
                        Playoff Teams
                      </label>
                      <Input type="number" defaultValue="4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-1.5 block">
                        Min At-Bats for Batting Title
                      </label>
                      <Input type="number" defaultValue="50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-charcoal mb-1.5 block">
                        Min IP for ERA Title
                      </label>
                      <Input type="number" defaultValue="20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when notifications are sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal">Game Reminders</p>
                    <p className="text-sm text-charcoal-light">Send reminders 24 hours before games</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal">Score Updates</p>
                    <p className="text-sm text-charcoal-light">Notify when final scores are posted</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal">Announcement Alerts</p>
                    <p className="text-sm text-charcoal-light">Notify users of new announcements</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage access and security configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal">Require Email Verification</p>
                    <p className="text-sm text-charcoal-light">Users must verify email to access features</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal">Allow Public Registration</p>
                    <p className="text-sm text-charcoal-light">Anyone can create an account</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal">Manager Approval Required</p>
                    <p className="text-sm text-charcoal-light">New managers need admin approval</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Integrations
                </CardTitle>
                <CardDescription>
                  Connect external services and APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">Email Service</p>
                        <p className="text-sm text-charcoal-light">SendGrid</p>
                      </div>
                    </div>
                    <Badge variant="success">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">Database</p>
                        <p className="text-sm text-charcoal-light">PostgreSQL via Supabase</p>
                      </div>
                    </div>
                    <Badge variant="success">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className={cn('w-4 h-4 mr-2', isSaving && 'animate-spin')} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
