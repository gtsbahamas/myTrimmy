/**
 * Dashboard Home Page - myTrimmy
 *
 * Main dashboard with image upload, auto-trim processing, batch processing, and gallery view.
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  FileUpload,
  type UploadedFile,
  type FileUploadError,
  getFileUploadErrorMessage,
  formatFileSize,
} from '@/components/files';
import {
  ImageIcon,
  Trash2,
  Download,
  RefreshCw,
  Upload,
  Scissors,
  CheckCircle,
  XCircle,
  Clock,
  CheckSquare,
  Square,
  Layers,
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Tables } from '@/types/database';

type ImageRecord = Tables<'images'>;

interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
}

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
}

export default function DashboardPage() {
  const [images, setImages] = React.useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Batch processing state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = React.useState(false);
  const [batchProgress, setBatchProgress] = React.useState<BatchProgress | null>(null);

  // Presets state
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>(null);

  // Inline quick settings (override preset)
  const [showQuickSettings, setShowQuickSettings] = React.useState(false);
  const [cropEnabled, setCropEnabled] = React.useState(false);
  const [cropMode, setCropMode] = React.useState<'manual' | 'aspect'>('aspect');
  const [cropAspectRatio, setCropAspectRatio] = React.useState('16:9');
  const [cropWidth, setCropWidth] = React.useState<number | ''>('');
  const [cropHeight, setCropHeight] = React.useState<number | ''>('');
  const [rotateEnabled, setRotateEnabled] = React.useState(false);
  const [rotateAngle, setRotateAngle] = React.useState<0 | 90 | 180 | 270>(0);
  const [flipHorizontal, setFlipHorizontal] = React.useState(false);
  const [flipVertical, setFlipVertical] = React.useState(false);
  const [resizeEnabled, setResizeEnabled] = React.useState(false);
  const [resizeWidth, setResizeWidth] = React.useState<number | ''>('');
  const [resizeHeight, setResizeHeight] = React.useState<number | ''>('');
  const [optimizeEnabled, setOptimizeEnabled] = React.useState(false);
  const [optimizeQuality, setOptimizeQuality] = React.useState(80);
  const [convertEnabled, setConvertEnabled] = React.useState(false);
  const [convertFormat, setConvertFormat] = React.useState<'jpeg' | 'png' | 'webp'>('webp');

  const supabase = createClient();

  // Get current user ID for upload path
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  // Fetch presets
  React.useEffect(() => {
    async function fetchPresets() {
      try {
        const response = await fetch('/api/presets');
        const data = await response.json();
        if (data.success && data.data) {
          setPresets(data.data);
          // Auto-select default preset
          const defaultPreset = data.data.find((p: Preset) => p.is_default);
          if (defaultPreset) {
            setSelectedPresetId(defaultPreset.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch presets:', err);
      }
    }
    fetchPresets();
  }, []);

  // Fetch user's images
  const fetchImages = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view your images');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setImages(data || []);
      // Clear selection when images refresh
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle upload complete - save to database
  const handleUploadComplete = React.useCallback(async (files: UploadedFile[]) => {
    setUploadError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUploadError('Please sign in to upload images');
        return;
      }

      // Insert image records into database
      const imageRecords = files.map(file => ({
        user_id: user.id,
        filename: file.name,
        original_url: file.url,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('images')
        .insert(imageRecords);

      if (insertError) {
        setUploadError(insertError.message);
        return;
      }

      // Refresh the image list
      await fetchImages();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to save image');
    }
  }, [supabase, fetchImages]);

  // Handle upload error
  const handleUploadError = React.useCallback((error: FileUploadError) => {
    setUploadError(getFileUploadErrorMessage(error));
  }, []);

  // Build inline settings object
  const buildInlineSettings = React.useCallback((): ProcessSettings | undefined => {
    // If no inline options enabled, return undefined to use preset only
    if (!cropEnabled && !rotateEnabled && !resizeEnabled && !optimizeEnabled && !convertEnabled) {
      return undefined;
    }

    const settings: ProcessSettings = {};

    if (cropEnabled) {
      settings.crop = {
        enabled: true,
        mode: cropMode,
        aspectRatio: cropMode === 'aspect' ? cropAspectRatio : undefined,
        width: cropMode === 'manual' ? (cropWidth || undefined) : undefined,
        height: cropMode === 'manual' ? (cropHeight || undefined) : undefined,
      };
    }

    if (rotateEnabled && (rotateAngle !== 0 || flipHorizontal || flipVertical)) {
      settings.rotate = {
        enabled: true,
        angle: rotateAngle,
        flipHorizontal: flipHorizontal,
        flipVertical: flipVertical,
      };
    }

    if (resizeEnabled && (resizeWidth || resizeHeight)) {
      settings.resize = {
        enabled: true,
        width: resizeWidth || undefined,
        height: resizeHeight || undefined,
        fit: 'inside',
        withoutEnlargement: true,
      };
    }

    if (optimizeEnabled) {
      settings.optimize = {
        enabled: true,
        quality: optimizeQuality,
      };
    }

    if (convertEnabled) {
      settings.convert = {
        enabled: true,
        format: convertFormat,
      };
    }

    return settings;
  }, [cropEnabled, cropMode, cropAspectRatio, cropWidth, cropHeight, rotateEnabled, rotateAngle, flipHorizontal, flipVertical, resizeEnabled, resizeWidth, resizeHeight, optimizeEnabled, optimizeQuality, convertEnabled, convertFormat]);

  // Process a single image (auto-trim)
  const handleProcess = React.useCallback(async (image: ImageRecord) => {
    setProcessingId(image.id);
    setError(null);

    try {
      setImages(prev => prev.map(img =>
        img.id === image.id ? { ...img, status: 'processing' } : img
      ));

      const inlineSettings = buildInlineSettings();

      const response = await fetch(`/api/images/${image.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: selectedPresetId || undefined,
          settings: inlineSettings,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      setImages(prev => prev.map(img =>
        img.id === image.id
          ? {
              ...img,
              status: 'completed',
              processed_url: result.data.processed_url,
              width: result.data.width,
              height: result.data.height,
            }
          : img
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setImages(prev => prev.map(img =>
        img.id === image.id ? { ...img, status: 'failed' } : img
      ));
    } finally {
      setProcessingId(null);
    }
  }, [selectedPresetId, buildInlineSettings]);

  // Batch process selected images
  const handleBatchProcess = React.useCallback(async () => {
    const pendingIds = Array.from(selectedIds).filter(id => {
      const img = images.find(i => i.id === id);
      return img && (img.status === 'pending' || img.status === 'failed');
    });

    if (pendingIds.length === 0) {
      setError('No pending images selected');
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress({ total: pendingIds.length, processed: 0, successful: 0, failed: 0 });
    setError(null);

    try {
      // Update local state to show all as processing
      setImages(prev => prev.map(img =>
        pendingIds.includes(img.id) ? { ...img, status: 'processing' } : img
      ));

      const inlineSettings = buildInlineSettings();

      const response = await fetch('/api/images/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageIds: pendingIds,
          presetId: selectedPresetId || undefined,
          settings: inlineSettings,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Batch processing failed');
      }

      // Update local state with results
      type ProcessResult = { id: string; success: boolean; processed_url?: string; width?: number; height?: number };
      const resultMap = new Map<string, ProcessResult>(
        result.data.results.map((r: ProcessResult) => [r.id, r] as [string, ProcessResult])
      );

      setImages(prev => prev.map(img => {
        const processResult = resultMap.get(img.id);
        if (processResult) {
          if (processResult.success) {
            return {
              ...img,
              status: 'completed',
              processed_url: processResult.processed_url ?? null,
              width: processResult.width ?? null,
              height: processResult.height ?? null,
            };
          } else {
            return { ...img, status: 'failed' };
          }
        }
        return img;
      }));

      setBatchProgress({
        total: result.data.total,
        processed: result.data.total,
        successful: result.data.successful,
        failed: result.data.failed,
      });

      // Clear selection after successful batch
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch processing failed');
      // Revert status on error
      setImages(prev => prev.map(img =>
        pendingIds.includes(img.id) ? { ...img, status: 'failed' } : img
      ));
    } finally {
      setIsBatchProcessing(false);
      // Clear progress after a delay
      setTimeout(() => setBatchProgress(null), 5000);
    }
  }, [selectedIds, images, selectedPresetId, buildInlineSettings]);

  // Delete an image
  const handleDelete = React.useCallback(async (image: ImageRecord) => {
    setDeletingId(image.id);

    try {
      const storagePath = image.original_url.split('/').pop();
      if (storagePath && userId) {
        await supabase.storage.from('images').remove([`${userId}/${storagePath}`]);
      }

      if (image.processed_url) {
        const processedPath = image.processed_url.split('/processed/')[1];
        if (processedPath) {
          await supabase.storage.from('processed').remove([processedPath]);
        }
      }

      const { error: deleteError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setImages(prev => prev.filter(img => img.id !== image.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(image.id);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  }, [supabase, userId]);

  // Selection handlers
  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllPending = React.useCallback(() => {
    const pendingIds = images
      .filter(img => img.status === 'pending' || img.status === 'failed')
      .map(img => img.id);
    setSelectedIds(new Set(pendingIds));
  }, [images]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Computed values
  const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'failed');
  const selectedPendingCount = Array.from(selectedIds).filter(id => {
    const img = images.find(i => i.id === id);
    return img && (img.status === 'pending' || img.status === 'failed');
  }).length;

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-500', icon: CheckCircle, text: 'Trimmed' };
      case 'processing':
        return { color: 'bg-blue-500', icon: RefreshCw, text: 'Processing' };
      case 'failed':
        return { color: 'bg-red-500', icon: XCircle, text: 'Failed' };
      default:
        return { color: 'bg-yellow-500', icon: Clock, text: 'Pending' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Images</h1>
          <p className="text-muted-foreground mt-2">
            Upload images and auto-trim whitespace with one click.
          </p>
        </div>
        <Button onClick={fetchImages} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Images
          </CardTitle>
          <CardDescription>
            Drag and drop images or click to select. Supports PNG, JPG, WebP up to 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userId ? (
            <FileUpload
              bucket="images"
              pathPrefix={userId}
              allowedTypes={['image/png', 'image/jpeg', 'image/webp', 'image/gif']}
              maxSizeMB={10}
              maxFiles={10}
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
              showProgress
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          )}
          {uploadError && (
            <p className="mt-2 text-sm text-destructive">{uploadError}</p>
          )}
        </CardContent>
      </Card>

      {/* Batch Processing Controls */}
      {images.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              Batch Processing
            </CardTitle>
            <CardDescription>
              Select multiple images to process them all at once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              {/* Selection buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllPending}
                disabled={pendingImages.length === 0 || isBatchProcessing}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select All Pending ({pendingImages.length})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selectedIds.size === 0 || isBatchProcessing}
              >
                <Square className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>

              {/* Preset Selector */}
              {presets.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Preset:</span>
                  <select
                    value={selectedPresetId || ''}
                    onChange={(e) => setSelectedPresetId(e.target.value || null)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isBatchProcessing}
                  >
                    <option value="">Default (threshold: 10)</option>
                    {presets.map((preset) => {
                      const s = preset.settings;
                      const threshold = s.trim?.threshold ?? 10;
                      return (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} (threshold: {threshold})
                          {preset.is_default ? ' *' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Quick Settings Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickSettings(!showQuickSettings)}
                className={showQuickSettings ? 'bg-primary/10' : ''}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Quick Settings
                {showQuickSettings ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>

              {/* Batch process button */}
              <Button
                onClick={handleBatchProcess}
                disabled={selectedPendingCount === 0 || isBatchProcessing}
                className="ml-auto"
              >
                {isBatchProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4 mr-2" />
                    Process Selected ({selectedPendingCount})
                  </>
                )}
              </Button>
            </div>

            {/* Quick Settings Panel */}
            {showQuickSettings && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border space-y-4">
                <p className="text-sm text-muted-foreground">
                  These settings override or add to the selected preset.
                </p>

                {/* Crop Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="crop-toggle"
                        checked={cropEnabled}
                        onCheckedChange={setCropEnabled}
                        disabled={isBatchProcessing}
                      />
                      <Label htmlFor="crop-toggle" className="font-medium">Crop</Label>
                    </div>
                    {cropEnabled && (
                      <span className="text-xs text-muted-foreground">
                        {cropMode === 'aspect' ? `Center crop to ${cropAspectRatio}` : 'Manual crop'}
                      </span>
                    )}
                  </div>
                  {cropEnabled && (
                    <div className="pl-10 space-y-3">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm whitespace-nowrap">Mode:</Label>
                        <select
                          value={cropMode}
                          onChange={(e) => setCropMode(e.target.value as 'manual' | 'aspect')}
                          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                          disabled={isBatchProcessing}
                        >
                          <option value="aspect">Aspect Ratio</option>
                          <option value="manual">Manual (px)</option>
                        </select>

                        {cropMode === 'aspect' && (
                          <select
                            value={cropAspectRatio}
                            onChange={(e) => setCropAspectRatio(e.target.value)}
                            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                            disabled={isBatchProcessing}
                          >
                            <option value="16:9">16:9</option>
                            <option value="4:3">4:3</option>
                            <option value="1:1">1:1</option>
                            <option value="3:2">3:2</option>
                            <option value="9:16">9:16</option>
                          </select>
                        )}
                      </div>

                      {cropMode === 'manual' && (
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="crop-width" className="text-sm whitespace-nowrap">Width:</Label>
                            <Input
                              id="crop-width"
                              type="number"
                              placeholder="px"
                              value={cropWidth}
                              onChange={(e) => setCropWidth(e.target.value ? Number(e.target.value) : '')}
                              className="w-20 h-8"
                              disabled={isBatchProcessing}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="crop-height" className="text-sm whitespace-nowrap">Height:</Label>
                            <Input
                              id="crop-height"
                              type="number"
                              placeholder="px"
                              value={cropHeight}
                              onChange={(e) => setCropHeight(e.target.value ? Number(e.target.value) : '')}
                              className="w-20 h-8"
                              disabled={isBatchProcessing}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rotate/Flip Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="rotate-toggle"
                        checked={rotateEnabled}
                        onCheckedChange={setRotateEnabled}
                        disabled={isBatchProcessing}
                      />
                      <Label htmlFor="rotate-toggle" className="font-medium">Rotate/Flip</Label>
                    </div>
                    {rotateEnabled && (
                      <span className="text-xs text-muted-foreground">
                        {[
                          rotateAngle !== 0 ? `${rotateAngle}°` : null,
                          flipHorizontal ? 'H-flip' : null,
                          flipVertical ? 'V-flip' : null,
                        ].filter(Boolean).join(' + ') || 'No changes'}
                      </span>
                    )}
                  </div>
                  {rotateEnabled && (
                    <div className="pl-10 space-y-3">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm whitespace-nowrap">Rotate:</Label>
                        <select
                          value={rotateAngle}
                          onChange={(e) => setRotateAngle(Number(e.target.value) as 0 | 90 | 180 | 270)}
                          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                          disabled={isBatchProcessing}
                        >
                          <option value={0}>None</option>
                          <option value={90}>90° CW</option>
                          <option value={180}>180°</option>
                          <option value={270}>270° CW</option>
                        </select>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="flip-h"
                            checked={flipHorizontal}
                            onCheckedChange={setFlipHorizontal}
                            disabled={isBatchProcessing}
                          />
                          <Label htmlFor="flip-h" className="text-sm">Flip H</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="flip-v"
                            checked={flipVertical}
                            onCheckedChange={setFlipVertical}
                            disabled={isBatchProcessing}
                          />
                          <Label htmlFor="flip-v" className="text-sm">Flip V</Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resize Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="resize-toggle"
                        checked={resizeEnabled}
                        onCheckedChange={setResizeEnabled}
                        disabled={isBatchProcessing}
                      />
                      <Label htmlFor="resize-toggle" className="font-medium">Resize</Label>
                    </div>
                    {resizeEnabled && (
                      <span className="text-xs text-muted-foreground">
                        Scales to fit within dimensions
                      </span>
                    )}
                  </div>
                  {resizeEnabled && (
                    <div className="flex gap-4 pl-10">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="resize-width" className="text-sm whitespace-nowrap">Width:</Label>
                        <Input
                          id="resize-width"
                          type="number"
                          placeholder="Auto"
                          value={resizeWidth}
                          onChange={(e) => setResizeWidth(e.target.value ? Number(e.target.value) : '')}
                          className="w-24 h-8"
                          disabled={isBatchProcessing}
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="resize-height" className="text-sm whitespace-nowrap">Height:</Label>
                        <Input
                          id="resize-height"
                          type="number"
                          placeholder="Auto"
                          value={resizeHeight}
                          onChange={(e) => setResizeHeight(e.target.value ? Number(e.target.value) : '')}
                          className="w-24 h-8"
                          disabled={isBatchProcessing}
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optimize Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="optimize-toggle"
                        checked={optimizeEnabled}
                        onCheckedChange={setOptimizeEnabled}
                        disabled={isBatchProcessing}
                      />
                      <Label htmlFor="optimize-toggle" className="font-medium">Optimize</Label>
                    </div>
                    {optimizeEnabled && (
                      <span className="text-xs text-muted-foreground">
                        Quality: {optimizeQuality}%
                      </span>
                    )}
                  </div>
                  {optimizeEnabled && (
                    <div className="pl-10">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={optimizeQuality}
                        onChange={(e) => setOptimizeQuality(Number(e.target.value))}
                        className="w-48"
                        disabled={isBatchProcessing}
                      />
                    </div>
                  )}
                </div>

                {/* Convert Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="convert-toggle"
                        checked={convertEnabled}
                        onCheckedChange={setConvertEnabled}
                        disabled={isBatchProcessing}
                      />
                      <Label htmlFor="convert-toggle" className="font-medium">Convert Format</Label>
                    </div>
                  </div>
                  {convertEnabled && (
                    <div className="pl-10">
                      <select
                        value={convertFormat}
                        onChange={(e) => setConvertFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
                        className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                        disabled={isBatchProcessing}
                      >
                        <option value="webp">WebP (best compression)</option>
                        <option value="jpeg">JPEG (photos)</option>
                        <option value="png">PNG (lossless)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Active settings summary */}
                {(cropEnabled || rotateEnabled || resizeEnabled || optimizeEnabled || convertEnabled) && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <span className="font-medium">Active: </span>
                    {[
                      cropEnabled && (cropMode === 'aspect' ? `Crop ${cropAspectRatio}` : `Crop ${cropWidth}×${cropHeight}`),
                      rotateEnabled && [
                        rotateAngle !== 0 ? `Rotate ${rotateAngle}°` : null,
                        flipHorizontal ? 'Flip H' : null,
                        flipVertical ? 'Flip V' : null,
                      ].filter(Boolean).join(' + '),
                      resizeEnabled && `Resize to ${resizeWidth || 'auto'}×${resizeHeight || 'auto'}`,
                      optimizeEnabled && `Optimize ${optimizeQuality}%`,
                      convertEnabled && `Convert to ${convertFormat.toUpperCase()}`,
                    ].filter(Boolean).join(' → ')}
                  </div>
                )}
              </div>
            )}

            {/* Batch Progress */}
            {batchProgress && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {isBatchProcessing ? 'Processing...' : 'Batch Complete'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {batchProgress.processed} / {batchProgress.total}
                  </span>
                </div>
                <Progress
                  value={(batchProgress.processed / batchProgress.total) * 100}
                  className="h-2"
                />
                {!isBatchProcessing && (
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-green-600">
                      {batchProgress.successful} successful
                    </span>
                    {batchProgress.failed > 0 && (
                      <span className="text-red-600">
                        {batchProgress.failed} failed
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Images Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Your Images
            <Badge variant="secondary" className="ml-2">
              {images.length}
            </Badge>
            {selectedIds.size > 0 && (
              <Badge variant="default" className="ml-2">
                {selectedIds.size} selected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Select images and click &quot;Process Selected&quot; for batch processing, or process individually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images uploaded yet.</p>
              <p className="text-sm">Upload your first image above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => {
                const statusInfo = getStatusInfo(image.status);
                const StatusIcon = statusInfo.icon;
                const isProcessing = processingId === image.id || (isBatchProcessing && selectedIds.has(image.id) && image.status === 'processing');
                const isDeleting = deletingId === image.id;
                const canProcess = image.status === 'pending' || image.status === 'failed';
                const isSelected = selectedIds.has(image.id);

                return (
                  <Card
                    key={image.id}
                    className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(image.id)}
                        disabled={isBatchProcessing}
                        className="bg-white/90 border-2"
                      />
                    </div>

                    {/* Image Preview */}
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={image.processed_url || image.original_url}
                        alt={image.filename}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className={`${statusInfo.color} text-white`}>
                          <StatusIcon className={`h-3 w-3 mr-1 ${image.status === 'processing' ? 'animate-spin' : ''}`} />
                          {statusInfo.text}
                        </Badge>
                      </div>

                      {/* Processed indicator */}
                      {image.processed_url && (
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary" className="bg-white/90">
                            <Scissors className="h-3 w-3 mr-1" />
                            Trimmed
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Image Info */}
                    <CardContent className="p-4">
                      <h3 className="font-medium truncate" title={image.filename}>
                        {image.filename}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {image.file_size ? formatFileSize(image.file_size) : 'Unknown size'}
                        {image.width && image.height && ` • ${image.width}×${image.height}`}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        {/* Process Button */}
                        {canProcess && (
                          <Button
                            size="sm"
                            onClick={() => handleProcess(image)}
                            disabled={isProcessing || isBatchProcessing}
                            className="flex-1"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Scissors className="h-4 w-4 mr-2" />
                                Auto Trim
                              </>
                            )}
                          </Button>
                        )}

                        {/* Download Button */}
                        <Button
                          size="sm"
                          variant={canProcess ? "outline" : "default"}
                          className={canProcess ? "" : "flex-1"}
                          asChild
                        >
                          <a
                            href={image.processed_url || image.original_url}
                            download={image.filename}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {image.processed_url ? 'Download' : 'Download'}
                          </a>
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(image)}
                          disabled={isDeleting || isProcessing || isBatchProcessing}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          {isDeleting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Show both images if processed */}
                      {image.processed_url && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Compare:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={image.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View Original
                            </a>
                            <a
                              href={image.processed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View Trimmed
                            </a>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
