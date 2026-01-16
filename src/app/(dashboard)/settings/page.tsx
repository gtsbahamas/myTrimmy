/**
 * Settings Page - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * User settings page with multiple sections including:
 * - Profile settings (name, email, avatar)
 * - Account settings (password change, email preferences)
 * - Notification settings (email/push toggles)
 * - Appearance settings (theme toggle)
 * - Danger zone (delete account)
 *
 * Place in: app/(dashboard)/settings/page.tsx
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/components/auth-guard';
import { AuthGuard } from '@/components/auth-guard';
import { createClient } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FormField, FormError, FormSuccess, SubmitButton } from '@/components/forms';
import { FileUpload, type UploadedFile } from '@/components/files';
import Image from 'next/image';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const NotificationSchema = z.object({
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  securityAlerts: z.boolean(),
  productUpdates: z.boolean(),
  pushNotifications: z.boolean(),
  pushNewMessages: z.boolean(),
  pushMentions: z.boolean(),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;
type PasswordFormData = z.infer<typeof PasswordSchema>;
type NotificationFormData = z.infer<typeof NotificationSchema>;
type ThemeValue = 'light' | 'dark' | 'system';

// ============================================================
// SETTINGS PAGE COMPONENT
// ============================================================

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="presets" className="space-y-6">
            <PresetsSettings />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <APIKeysSettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
            <DangerZone />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <AppearanceSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

// ============================================================
// PROFILE SETTINGS
// ============================================================

function ProfileSettings() {
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
    },
  });

  // Load user profile data
  React.useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user?.id)
        .single();

      if (data) {
        form.setValue('name', data.name || '');
        setAvatarUrl(data.avatar_url);
      }
    }

    if (user?.id) {
      loadProfile();
    }
  }, [user?.id, form]);

  async function handleSubmit(data: ProfileFormData) {
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name: data.name,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Update email if changed
      if (data.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (emailError) {
          setError(emailError.message);
          return;
        }

        setSuccess('Profile updated. Please check your email to confirm the address change.');
        return;
      }

      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  async function handleAvatarUpload(files: UploadedFile[]) {
    if (files.length === 0) return;

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: files[0].url })
      .eq('id', user?.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setAvatarUrl(files[0].url);
    setSuccess('Avatar updated successfully.');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal information and profile picture.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-6">
          <FormError message={error} />
          <FormSuccess message={success} />

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-6">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-muted-foreground">
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <FileUpload
                  bucket="avatars"
                  pathPrefix={user?.id}
                  allowedTypes={['image/*']}
                  maxSizeMB={2}
                  maxFiles={1}
                  onUploadComplete={handleAvatarUpload}
                  onError={(err) => setError(err.type === 'file_too_large' ? 'Image must be less than 2MB' : 'Failed to upload image')}
                  placeholder="Click or drag to upload a new avatar"
                  showProgress={false}
                  className="max-w-xs"
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              {...form.register('name')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...form.register('email')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
            />
            {form.formState.errors.email && (
              <p id="email-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Changing your email requires verification.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isSubmitting={form.formState.isSubmitting}>
            Save Changes
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

// ============================================================
// ACCOUNT SETTINGS
// ============================================================

function AccountSettings() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function handleSubmit(data: PasswordFormData) {
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // Verify current password by attempting sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        setError('Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess('Password updated successfully.');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardContent className="space-y-4">
          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...form.register('currentPassword')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.currentPassword}
              aria-describedby={form.formState.errors.currentPassword ? 'currentPassword-error' : undefined}
            />
            {form.formState.errors.currentPassword && (
              <p id="currentPassword-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('newPassword')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.newPassword}
              aria-describedby={form.formState.errors.newPassword ? 'newPassword-error' : 'newPassword-help'}
            />
            {form.formState.errors.newPassword ? (
              <p id="newPassword-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.newPassword.message}
              </p>
            ) : (
              <p id="newPassword-help" className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
              disabled={form.formState.isSubmitting}
              aria-invalid={!!form.formState.errors.confirmPassword}
              aria-describedby={form.formState.errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {form.formState.errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isSubmitting={form.formState.isSubmitting}>
            Update Password
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

// ============================================================
// API KEYS SETTINGS
// ============================================================

interface MyTrimmyApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key_suffix: string;
  created_at: string;
  last_used_at: string | null;
}

const ReplicateKeySchema = z.object({
  replicateApiKey: z.string().optional(),
});

type ReplicateKeyFormData = z.infer<typeof ReplicateKeySchema>;

function APIKeysSettings() {
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // myTrimmy API Keys state
  const [apiKeys, setApiKeys] = React.useState<MyTrimmyApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  // Replicate (3rd party) key state
  const [hasReplicateKey, setHasReplicateKey] = React.useState(false);
  const [showReplicateKey, setShowReplicateKey] = React.useState(false);

  const replicateForm = useForm<ReplicateKeyFormData>({
    resolver: zodResolver(ReplicateKeySchema),
    defaultValues: {
      replicateApiKey: '',
    },
  });

  // Load myTrimmy API keys
  React.useEffect(() => {
    async function loadApiKeys() {
      try {
        const response = await fetch('/api/api-keys');
        const data = await response.json();
        if (data.success) {
          setApiKeys(data.data);
        }
      } catch (err) {
        console.error('Failed to load API keys:', err);
      } finally {
        setLoadingKeys(false);
      }
    }

    if (user?.id) {
      loadApiKeys();
    }
  }, [user?.id]);

  // Load Replicate API key status
  React.useEffect(() => {
    async function loadReplicateKey() {
      if (!user?.id) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('replicate_api_key')
        .eq('id', user.id)
        .single();

      if (data?.replicate_api_key) {
        setHasReplicateKey(true);
        replicateForm.setValue('replicateApiKey', '••••••••••••••••');
      }
    }
    loadReplicateKey();
  }, [user?.id, replicateForm]);

  // Create new myTrimmy API key
  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      setError('Please enter a name for your API key');
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create API key');
        return;
      }

      // Show the full key ONCE
      setNewlyCreatedKey(data.data.key);
      setApiKeys(prev => [data.data, ...prev]);
      setNewKeyName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  }

  // Copy key to clipboard
  async function handleCopyKey() {
    if (!newlyCreatedKey) return;
    try {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }

  // Close the new key modal
  function handleCloseNewKeyModal() {
    setNewlyCreatedKey(null);
    setCopied(false);
    setSuccess('API key created successfully');
  }

  // Revoke API key
  async function handleRevokeKey(id: string) {
    setRevokingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to revoke API key');
        return;
      }

      setApiKeys(prev => prev.filter(k => k.id !== id));
      setSuccess('API key revoked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setRevokingId(null);
    }
  }

  // Replicate key handlers
  async function handleReplicateSubmit(data: ReplicateKeyFormData) {
    if (!user?.id) return;

    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const keyToSave = data.replicateApiKey === '••••••••••••••••'
        ? undefined
        : data.replicateApiKey || null;

      if (keyToSave !== undefined) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            replicate_api_key: keyToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setHasReplicateKey(!!keyToSave);
        if (keyToSave) {
          replicateForm.setValue('replicateApiKey', '••••••••••••••••');
        }
      }

      setSuccess('Replicate API key updated successfully.');
      setShowReplicateKey(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    }
  }

  async function handleRemoveReplicateKey() {
    if (!user?.id) return;

    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          replicate_api_key: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setHasReplicateKey(false);
      replicateForm.setValue('replicateApiKey', '');
      setSuccess('Replicate API key removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key');
    }
  }

  return (
    <div className="space-y-6">
      {/* myTrimmy API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>myTrimmy API Keys</CardTitle>
          <CardDescription>
            Create API keys to access myTrimmy programmatically. Use these keys to integrate
            image processing into your own applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormError message={error} />
          <FormSuccess message={success} />

          {/* Create New Key */}
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g., Production, Development)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              disabled={isCreating}
              className="max-w-sm"
            />
            <Button onClick={handleCreateKey} disabled={isCreating || !newKeyName.trim()}>
              {isCreating ? 'Creating...' : 'Create Key'}
            </Button>
          </div>

          {/* Existing Keys List */}
          {loadingKeys ? (
            <p className="text-sm text-muted-foreground">Loading keys...</p>
          ) : apiKeys.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No API keys yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        {key.key_prefix}...{key.key_suffix}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(key.created_at).toLocaleDateString()}
                      {key.last_used_at && (
                        <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={revokingId === key.id}
                      >
                        {revokingId === key.id ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to revoke &quot;{key.name}&quot;? Any applications
                          using this key will immediately lose access.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevokeKey(key.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Revoke Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}

          {/* Usage Example */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="text-sm font-medium">Usage Example</h4>
            <pre className="rounded bg-background p-3 text-xs font-mono overflow-x-auto">
{`curl -X GET "https://mytrimmy.com/api/presets" \\
  -H "Authorization: Bearer mt_live_your_key_here"`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* New Key Created Modal */}
      <AlertDialog open={!!newlyCreatedKey} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              API Key Created
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Copy this key now — you won&apos;t be able to see it again!
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newlyCreatedKey || ''}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant={copied ? 'default' : 'outline'}
                      onClick={handleCopyKey}
                      className="shrink-0"
                    >
                      {copied ? (
                        <>
                          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Store this key securely. For security reasons, we only show the full key once.
                  If you lose it, you&apos;ll need to create a new one.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseNewKeyModal}>
              I&apos;ve copied my key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Third-Party API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Third-Party API Keys</CardTitle>
          <CardDescription>
            Add your own API keys for unlimited access to premium features.
            Your keys are encrypted at rest and never shared.
          </CardDescription>
        </CardHeader>
        <form onSubmit={replicateForm.handleSubmit(handleReplicateSubmit)}>
          <CardContent className="space-y-6">
            {/* Replicate API Key */}
            <div className="space-y-4 rounded-lg border border-border/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">Replicate API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Used for AI-powered background removal. Get your key at{' '}
                    <a
                      href="https://replicate.com/account/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      replicate.com
                    </a>
                  </p>
                </div>
                {hasReplicateKey && (
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                    Configured
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="replicateApiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="replicateApiKey"
                    type={showReplicateKey ? 'text' : 'password'}
                    placeholder="r8_xxxxxxxxxxxx"
                    {...replicateForm.register('replicateApiKey')}
                    disabled={replicateForm.formState.isSubmitting}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReplicateKey(!showReplicateKey)}
                  >
                    {showReplicateKey ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Without your own key, you&apos;ll use the shared pool (limited usage).
                  With your own key, usage is unlimited and billed directly to your Replicate account.
                </p>
              </div>

              {hasReplicateKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveReplicateKey}
                  className="text-destructive hover:text-destructive"
                >
                  Remove Key
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton isSubmitting={replicateForm.formState.isSubmitting}>
              Save Replicate Key
            </SubmitButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// ============================================================
// NOTIFICATION SETTINGS
// ============================================================

function NotificationSettings() {
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(NotificationSchema),
    defaultValues: {
      emailNotifications: true,
      marketingEmails: false,
      securityAlerts: true,
      productUpdates: true,
      pushNotifications: false,
      pushNewMessages: true,
      pushMentions: true,
    },
  });

  // Load notification preferences
  React.useEffect(() => {
    async function loadPreferences() {
      const supabase = createClient();
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        form.reset({
          emailNotifications: data.email_notifications ?? true,
          marketingEmails: data.marketing_emails ?? false,
          securityAlerts: data.security_alerts ?? true,
          productUpdates: data.product_updates ?? true,
          pushNotifications: data.push_notifications ?? false,
          pushNewMessages: data.push_new_messages ?? true,
          pushMentions: data.push_mentions ?? true,
        });
      }
    }

    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id, form]);

  async function handleSubmit(data: NotificationFormData) {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const supabase = createClient();

      const { error: upsertError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          email_notifications: data.emailNotifications,
          marketing_emails: data.marketingEmails,
          security_alerts: data.securityAlerts,
          product_updates: data.productUpdates,
          push_notifications: data.pushNotifications,
          push_new_messages: data.pushNewMessages,
          push_mentions: data.pushMentions,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      setSuccess('Notification preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  const NotificationToggle = ({
    name,
    label,
    description,
  }: {
    name: keyof NotificationFormData;
    label: string;
    description: string;
  }) => {
    const value = form.watch(name);
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={name} className="text-base">
            {label}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={name}
          checked={value}
          onCheckedChange={(checked) => form.setValue(name, checked)}
          aria-describedby={`${name}-description`}
        />
      </div>
    );
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what emails you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormError message={error} />
          <FormSuccess message={success} />

          <NotificationToggle
            name="emailNotifications"
            label="Email Notifications"
            description="Receive email notifications for important updates"
          />
          <NotificationToggle
            name="marketingEmails"
            label="Marketing Emails"
            description="Receive emails about new features and promotions"
          />
          <NotificationToggle
            name="securityAlerts"
            label="Security Alerts"
            description="Get notified about security-related events"
          />
          <NotificationToggle
            name="productUpdates"
            label="Product Updates"
            description="Receive updates about product changes and improvements"
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Manage push notification preferences for your devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <NotificationToggle
            name="pushNotifications"
            label="Push Notifications"
            description="Enable push notifications on this device"
          />
          <NotificationToggle
            name="pushNewMessages"
            label="New Messages"
            description="Get notified when you receive new messages"
          />
          <NotificationToggle
            name="pushMentions"
            label="Mentions"
            description="Get notified when someone mentions you"
          />
        </CardContent>
        <CardFooter>
          <SubmitButton isSubmitting={saving}>
            Save Preferences
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}

// ============================================================
// APPEARANCE SETTINGS
// ============================================================

function AppearanceSettings() {
  const [theme, setTheme] = React.useState<ThemeValue>('system');
  const [success, setSuccess] = React.useState<string | null>(null);

  // Load theme preference from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeValue | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  React.useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  function handleThemeChange(newTheme: ThemeValue) {
    setTheme(newTheme);
    setSuccess('Theme preference saved.');
    setTimeout(() => setSuccess(null), 3000);
  }

  const ThemeOption = ({
    value,
    label,
    icon,
  }: {
    value: ThemeValue;
    label: string;
    icon: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => handleThemeChange(value)}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
        theme === value
          ? 'border-primary bg-primary/5'
          : 'border-muted hover:border-primary/50'
      }`}
      aria-pressed={theme === value}
      aria-label={`Select ${label} theme`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the application looks on your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormSuccess message={success} />

        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption
              value="light"
              label="Light"
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
            />
            <ThemeOption
              value="dark"
              label="Dark"
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              }
            />
            <ThemeOption
              value="system"
              label="System"
              icon={
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Select a theme preference. System will automatically switch based on your device settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// PRESETS SETTINGS
// ============================================================

interface ProcessSettings {
  trim?: {
    enabled?: boolean;
    threshold?: number;
    lineArt?: boolean;
  };
  crop?: {
    enabled?: boolean;
    mode?: 'manual' | 'aspect';
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    aspectRatio?: string;
  };
  rotate?: {
    enabled?: boolean;
    angle?: 0 | 90 | 180 | 270;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
  };
  resize?: {
    enabled?: boolean;
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    withoutEnlargement?: boolean;
  };
  optimize?: {
    enabled?: boolean;
    quality?: number;
  };
  convert?: {
    enabled?: boolean;
    format?: 'jpeg' | 'png' | 'webp';
  };
}

interface Preset {
  id: string;
  name: string;
  description: string | null;
  settings: ProcessSettings;
  is_default: boolean;
  created_at: string;
}

function PresetsSettings() {
  const { user } = useAuth();
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form state for new/edit preset
  const [formName, setFormName] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formIsDefault, setFormIsDefault] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Trim settings
  const [trimEnabled, setTrimEnabled] = React.useState(true);
  const [trimThreshold, setTrimThreshold] = React.useState(10);
  const [trimLineArt, setTrimLineArt] = React.useState(false);

  // Crop settings
  const [cropEnabled, setCropEnabled] = React.useState(false);
  const [cropMode, setCropMode] = React.useState<'manual' | 'aspect'>('aspect');
  const [cropAspectRatio, setCropAspectRatio] = React.useState('16:9');
  const [cropLeft, setCropLeft] = React.useState<number | ''>(0);
  const [cropTop, setCropTop] = React.useState<number | ''>(0);
  const [cropWidth, setCropWidth] = React.useState<number | ''>('');
  const [cropHeight, setCropHeight] = React.useState<number | ''>('');

  // Rotate settings
  const [rotateEnabled, setRotateEnabled] = React.useState(false);
  const [rotateAngle, setRotateAngle] = React.useState<0 | 90 | 180 | 270>(0);
  const [flipHorizontal, setFlipHorizontal] = React.useState(false);
  const [flipVertical, setFlipVertical] = React.useState(false);

  // Resize settings
  const [resizeEnabled, setResizeEnabled] = React.useState(false);
  const [resizeWidth, setResizeWidth] = React.useState<number | ''>('');
  const [resizeHeight, setResizeHeight] = React.useState<number | ''>('');
  const [resizeFit, setResizeFit] = React.useState<'cover' | 'contain' | 'fill' | 'inside' | 'outside'>('inside');
  const [resizeNoEnlarge, setResizeNoEnlarge] = React.useState(true);

  // Optimize settings
  const [optimizeEnabled, setOptimizeEnabled] = React.useState(false);
  const [optimizeQuality, setOptimizeQuality] = React.useState(80);

  // Convert settings
  const [convertEnabled, setConvertEnabled] = React.useState(false);
  const [convertFormat, setConvertFormat] = React.useState<'jpeg' | 'png' | 'webp'>('webp');

  // Load presets
  React.useEffect(() => {
    async function loadPresets() {
      try {
        const response = await fetch('/api/presets');
        const data = await response.json();

        if (data.success) {
          setPresets(data.data);
        } else {
          setError(data.error || 'Failed to load presets');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load presets');
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadPresets();
    }
  }, [user?.id]);

  function resetForm() {
    setFormName('');
    setFormDescription('');
    setFormIsDefault(false);
    setIsCreating(false);
    setEditingId(null);
    // Trim
    setTrimEnabled(true);
    setTrimThreshold(10);
    setTrimLineArt(false);
    // Crop
    setCropEnabled(false);
    setCropMode('aspect');
    setCropAspectRatio('16:9');
    setCropLeft(0);
    setCropTop(0);
    setCropWidth('');
    setCropHeight('');
    // Rotate
    setRotateEnabled(false);
    setRotateAngle(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    // Resize
    setResizeEnabled(false);
    setResizeWidth('');
    setResizeHeight('');
    setResizeFit('inside');
    setResizeNoEnlarge(true);
    // Optimize
    setOptimizeEnabled(false);
    setOptimizeQuality(80);
    // Convert
    setConvertEnabled(false);
    setConvertFormat('webp');
  }

  function startEdit(preset: Preset) {
    setFormName(preset.name);
    setFormDescription(preset.description || '');
    setFormIsDefault(preset.is_default);
    setEditingId(preset.id);
    setIsCreating(false);

    const s = preset.settings;
    // Trim - handle legacy format (threshold/lineArt at root) and new format
    const isLegacy = 'threshold' in s && !('trim' in s);
    if (isLegacy) {
      setTrimEnabled(true);
      setTrimThreshold((s as unknown as { threshold: number }).threshold ?? 10);
      setTrimLineArt((s as unknown as { lineArt: boolean }).lineArt ?? false);
    } else {
      setTrimEnabled(s.trim?.enabled !== false);
      setTrimThreshold(s.trim?.threshold ?? 10);
      setTrimLineArt(s.trim?.lineArt ?? false);
    }
    // Crop
    setCropEnabled(s.crop?.enabled ?? false);
    setCropMode(s.crop?.mode ?? 'aspect');
    setCropAspectRatio(s.crop?.aspectRatio ?? '16:9');
    setCropLeft(s.crop?.left ?? 0);
    setCropTop(s.crop?.top ?? 0);
    setCropWidth(s.crop?.width ?? '');
    setCropHeight(s.crop?.height ?? '');
    // Rotate
    setRotateEnabled(s.rotate?.enabled ?? false);
    setRotateAngle(s.rotate?.angle ?? 0);
    setFlipHorizontal(s.rotate?.flipHorizontal ?? false);
    setFlipVertical(s.rotate?.flipVertical ?? false);
    // Resize
    setResizeEnabled(s.resize?.enabled ?? false);
    setResizeWidth(s.resize?.width ?? '');
    setResizeHeight(s.resize?.height ?? '');
    setResizeFit(s.resize?.fit ?? 'inside');
    setResizeNoEnlarge(s.resize?.withoutEnlargement ?? true);
    // Optimize
    setOptimizeEnabled(s.optimize?.enabled ?? false);
    setOptimizeQuality(s.optimize?.quality ?? 80);
    // Convert
    setConvertEnabled(s.convert?.enabled ?? false);
    setConvertFormat(s.convert?.format ?? 'webp');
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const settings: ProcessSettings = {
        trim: {
          enabled: trimEnabled,
          threshold: trimThreshold,
          lineArt: trimLineArt,
        },
        crop: {
          enabled: cropEnabled,
          mode: cropMode,
          aspectRatio: cropMode === 'aspect' ? cropAspectRatio : undefined,
          left: cropMode === 'manual' ? (cropLeft || 0) : undefined,
          top: cropMode === 'manual' ? (cropTop || 0) : undefined,
          width: cropMode === 'manual' ? (cropWidth || undefined) : undefined,
          height: cropMode === 'manual' ? (cropHeight || undefined) : undefined,
        },
        rotate: {
          enabled: rotateEnabled,
          angle: rotateAngle,
          flipHorizontal: flipHorizontal,
          flipVertical: flipVertical,
        },
        resize: {
          enabled: resizeEnabled,
          width: resizeWidth || undefined,
          height: resizeHeight || undefined,
          fit: resizeFit,
          withoutEnlargement: resizeNoEnlarge,
        },
        optimize: {
          enabled: optimizeEnabled,
          quality: optimizeQuality,
        },
        convert: {
          enabled: convertEnabled,
          format: convertFormat,
        },
      };

      const payload = {
        name: formName,
        description: formDescription || undefined,
        settings,
        is_default: formIsDefault,
      };

      const url = editingId ? `/api/presets/${editingId}` : '/api/presets';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save preset');
        return;
      }

      // Update presets list
      if (editingId) {
        setPresets(prev => prev.map(p => p.id === editingId ? data.data : p));
        // If this one is now default, unset others
        if (formIsDefault) {
          setPresets(prev => prev.map(p => ({
            ...p,
            is_default: p.id === editingId,
          })));
        }
      } else {
        setPresets(prev => {
          const newPresets = [data.data, ...prev];
          // If new one is default, unset others
          if (formIsDefault) {
            return newPresets.map(p => ({
              ...p,
              is_default: p.id === data.data.id,
            }));
          }
          return newPresets;
        });
      }

      setSuccess(editingId ? 'Preset updated!' : 'Preset created!');
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/presets/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete preset');
        return;
      }

      setPresets(prev => prev.filter(p => p.id !== id));
      setSuccess('Preset deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preset');
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to set default');
        return;
      }

      setPresets(prev => prev.map(p => ({
        ...p,
        is_default: p.id === id,
      })));
      setSuccess('Default preset updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default');
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading presets...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Trim Presets</CardTitle>
          <CardDescription>
            Save your favorite trim settings as presets for quick access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={error} />
          <FormSuccess message={success} />

          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <div className="rounded-lg border p-4 space-y-6">
              <h4 className="font-medium">
                {editingId ? 'Edit Preset' : 'New Preset'}
              </h4>

              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Name</Label>
                  <Input
                    id="preset-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Web Optimized"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preset-description">Description</Label>
                  <Input
                    id="preset-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              {/* TRIM Section */}
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Trim</h5>
                    <p className="text-xs text-muted-foreground">Remove whitespace borders</p>
                  </div>
                  <Switch checked={trimEnabled} onCheckedChange={setTrimEnabled} />
                </div>
                {trimEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="preset-threshold">Threshold: {trimThreshold}</Label>
                      <input
                        id="preset-threshold"
                        type="range"
                        min="0"
                        max="100"
                        value={trimThreshold}
                        onChange={(e) => setTrimThreshold(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Higher = more aggressive (0-100)</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Line Art Mode</Label>
                        <p className="text-xs text-muted-foreground">Optimized for drawings</p>
                      </div>
                      <Switch checked={trimLineArt} onCheckedChange={setTrimLineArt} />
                    </div>
                  </div>
                )}
              </div>

              {/* CROP Section */}
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Crop</h5>
                    <p className="text-xs text-muted-foreground">Extract region or apply aspect ratio</p>
                  </div>
                  <Switch checked={cropEnabled} onCheckedChange={setCropEnabled} />
                </div>
                {cropEnabled && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="crop-mode">Crop Mode</Label>
                      <select
                        id="crop-mode"
                        value={cropMode}
                        onChange={(e) => setCropMode(e.target.value as 'manual' | 'aspect')}
                        className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="aspect">Aspect Ratio (center crop)</option>
                        <option value="manual">Manual (exact pixels)</option>
                      </select>
                    </div>

                    {cropMode === 'aspect' ? (
                      <div className="space-y-2">
                        <Label htmlFor="crop-aspect">Aspect Ratio</Label>
                        <select
                          id="crop-aspect"
                          value={cropAspectRatio}
                          onChange={(e) => setCropAspectRatio(e.target.value)}
                          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="16:9">16:9 (Widescreen)</option>
                          <option value="4:3">4:3 (Standard)</option>
                          <option value="1:1">1:1 (Square)</option>
                          <option value="3:2">3:2 (Photo)</option>
                          <option value="9:16">9:16 (Portrait)</option>
                          <option value="2:3">2:3 (Portrait Photo)</option>
                        </select>
                        <p className="text-xs text-muted-foreground">Image will be center-cropped to this ratio</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="crop-left">Left (px)</Label>
                          <Input
                            id="crop-left"
                            type="number"
                            min="0"
                            value={cropLeft}
                            onChange={(e) => setCropLeft(e.target.value ? Number(e.target.value) : '')}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="crop-top">Top (px)</Label>
                          <Input
                            id="crop-top"
                            type="number"
                            min="0"
                            value={cropTop}
                            onChange={(e) => setCropTop(e.target.value ? Number(e.target.value) : '')}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="crop-width">Width (px)</Label>
                          <Input
                            id="crop-width"
                            type="number"
                            min="1"
                            value={cropWidth}
                            onChange={(e) => setCropWidth(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Required"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="crop-height">Height (px)</Label>
                          <Input
                            id="crop-height"
                            type="number"
                            min="1"
                            value={cropHeight}
                            onChange={(e) => setCropHeight(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Required"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ROTATE Section */}
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Rotate / Flip</h5>
                    <p className="text-xs text-muted-foreground">Rotate or flip image orientation</p>
                  </div>
                  <Switch checked={rotateEnabled} onCheckedChange={setRotateEnabled} />
                </div>
                {rotateEnabled && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="rotate-angle">Rotation</Label>
                      <select
                        id="rotate-angle"
                        value={rotateAngle}
                        onChange={(e) => setRotateAngle(Number(e.target.value) as 0 | 90 | 180 | 270)}
                        className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value={0}>No rotation</option>
                        <option value={90}>90° clockwise</option>
                        <option value={180}>180°</option>
                        <option value={270}>270° clockwise (90° counter)</option>
                      </select>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-3">
                        <Switch checked={flipHorizontal} onCheckedChange={setFlipHorizontal} />
                        <div>
                          <Label>Flip Horizontal</Label>
                          <p className="text-xs text-muted-foreground">Mirror left-right</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={flipVertical} onCheckedChange={setFlipVertical} />
                        <div>
                          <Label>Flip Vertical</Label>
                          <p className="text-xs text-muted-foreground">Mirror top-bottom</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RESIZE Section */}
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Resize</h5>
                    <p className="text-xs text-muted-foreground">Scale images to target dimensions</p>
                  </div>
                  <Switch checked={resizeEnabled} onCheckedChange={setResizeEnabled} />
                </div>
                {resizeEnabled && (
                  <div className="space-y-4 pt-2">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="resize-width">Width (px)</Label>
                        <Input
                          id="resize-width"
                          type="number"
                          placeholder="Auto"
                          value={resizeWidth}
                          onChange={(e) => setResizeWidth(e.target.value ? Number(e.target.value) : '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resize-height">Height (px)</Label>
                        <Input
                          id="resize-height"
                          type="number"
                          placeholder="Auto"
                          value={resizeHeight}
                          onChange={(e) => setResizeHeight(e.target.value ? Number(e.target.value) : '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resize-fit">Fit Mode</Label>
                        <select
                          id="resize-fit"
                          value={resizeFit}
                          onChange={(e) => setResizeFit(e.target.value as typeof resizeFit)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="inside">Inside (fit within)</option>
                          <option value="cover">Cover (fill & crop)</option>
                          <option value="contain">Contain (letterbox)</option>
                          <option value="fill">Fill (stretch)</option>
                          <option value="outside">Outside (minimum)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Don&apos;t Enlarge</Label>
                        <p className="text-xs text-muted-foreground">Skip if image is smaller than target</p>
                      </div>
                      <Switch checked={resizeNoEnlarge} onCheckedChange={setResizeNoEnlarge} />
                    </div>
                  </div>
                )}
              </div>

              {/* OPTIMIZE Section */}
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Optimize</h5>
                    <p className="text-xs text-muted-foreground">Compress for smaller file size</p>
                  </div>
                  <Switch checked={optimizeEnabled} onCheckedChange={setOptimizeEnabled} />
                </div>
                {optimizeEnabled && (
                  <div className="pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="optimize-quality">Quality: {optimizeQuality}%</Label>
                      <input
                        id="optimize-quality"
                        type="range"
                        min="10"
                        max="100"
                        value={optimizeQuality}
                        onChange={(e) => setOptimizeQuality(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Lower = smaller file, less quality</p>
                    </div>
                  </div>
                )}
              </div>

              {/* CONVERT Section */}
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Convert Format</h5>
                    <p className="text-xs text-muted-foreground">Change output image format</p>
                  </div>
                  <Switch checked={convertEnabled} onCheckedChange={setConvertEnabled} />
                </div>
                {convertEnabled && (
                  <div className="pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="convert-format">Output Format</Label>
                      <select
                        id="convert-format"
                        value={convertFormat}
                        onChange={(e) => setConvertFormat(e.target.value as typeof convertFormat)}
                        className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="webp">WebP (best compression)</option>
                        <option value="jpeg">JPEG (photos)</option>
                        <option value="png">PNG (lossless)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Default toggle and actions */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-3">
                  <Switch checked={formIsDefault} onCheckedChange={setFormIsDefault} />
                  <div>
                    <Label>Set as Default</Label>
                    <p className="text-xs text-muted-foreground">Use automatically for new images</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !formName.trim()}>
                    {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add Button */}
          {!isCreating && !editingId && (
            <Button onClick={() => setIsCreating(true)}>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Preset
            </Button>
          )}

          {/* Presets List */}
          {presets.length === 0 && !isCreating ? (
            <p className="text-sm text-muted-foreground py-4">
              No presets yet. Create one to save your trim settings.
            </p>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => {
                const s = preset.settings;
                // Handle legacy format
                const isLegacy = 'threshold' in s && !('trim' in s);
                const trimInfo = isLegacy
                  ? `Trim: ${(s as unknown as { threshold: number }).threshold}`
                  : s.trim?.enabled !== false
                    ? `Trim: ${s.trim?.threshold ?? 10}`
                    : null;
                const cropInfo = s.crop?.enabled
                  ? s.crop.mode === 'aspect'
                    ? `Crop: ${s.crop.aspectRatio}`
                    : `Crop: ${s.crop.width}×${s.crop.height}`
                  : null;
                const rotateInfo = s.rotate?.enabled
                  ? [
                      s.rotate.angle ? `${s.rotate.angle}°` : null,
                      s.rotate.flipHorizontal ? 'flipH' : null,
                      s.rotate.flipVertical ? 'flipV' : null,
                    ].filter(Boolean).join('+') || null
                  : null;
                const resizeInfo = s.resize?.enabled ? `Resize: ${s.resize.width || 'auto'}×${s.resize.height || 'auto'}` : null;
                const optimizeInfo = s.optimize?.enabled ? `Quality: ${s.optimize.quality ?? 80}%` : null;
                const convertInfo = s.convert?.enabled ? `→ ${s.convert.format?.toUpperCase()}` : null;
                const features = [trimInfo, cropInfo, rotateInfo, resizeInfo, optimizeInfo, convertInfo].filter(Boolean);

                return (
                <div
                  key={preset.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{preset.name}</span>
                      {preset.is_default && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {features.join(' • ')}
                      {preset.description && ` — ${preset.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!preset.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(preset.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(preset)}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Preset</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{preset.name}&quot;? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(preset.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ============================================================
// DANGER ZONE
// ============================================================

function DangerZone() {
  const { signOut } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('No user found');
        return;
      }

      // Delete user data (cascading deletes should handle related data)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Sign out (account deletion via Supabase requires admin or Edge Function)
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible and destructive actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError message={error} />

        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
          <div className="space-y-1">
            <p className="font-medium">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This action cannot be undone. This will permanently delete your
                    account and remove all of your data from our servers.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete">
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      disabled={isDeleting}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmText !== 'DELETE'}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
