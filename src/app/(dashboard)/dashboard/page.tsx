/**
 * Dashboard - myTrimmy
 *
 * A2ui-inspired interface: Upload is central, options appear on demand,
 * activity streams real-time, gallery at the bottom.
 */

'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  HeroDropZone,
  LogoCanvas,
  ActivityStream,
  GalleryRail,
  useActivityStream,
} from '@/components/a2ui';
import type { Tables } from '@/types/database';

type ImageRecord = Tables<'images'>;

export default function DashboardPage() {
  const [images, setImages] = React.useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<ImageRecord | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const { activities, addActivity, updateActivity } = useActivityStream();
  const supabase = createClient();

  // Get current user
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  // Fetch images
  const fetchImages = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setImages(data || []);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle file upload
  const handleFilesSelected = React.useCallback(async (files: File[]) => {
    if (!userId) return;

    setIsUploading(true);

    for (const file of files) {
      const activityId = addActivity('upload', `Uploading ${file.name}`, {
        status: 'processing',
        filename: file.name,
      });

      const startTime = Date.now();

      try {
        // Generate unique filename
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
        const path = `${userId}/${filename}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(path, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(path);

        // Insert record
        const { data: imageData, error: insertError } = await supabase
          .from('images')
          .insert({
            user_id: userId,
            filename: file.name,
            original_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        updateActivity(activityId, {
          status: 'completed',
          message: `Uploaded ${file.name}`,
          duration: Date.now() - startTime,
        });

        // Add to images and select it
        if (imageData) {
          setImages(prev => [imageData, ...prev]);
          setSelectedImage(imageData);
        }
      } catch (error) {
        updateActivity(activityId, {
          status: 'failed',
          message: `Failed to upload ${file.name}`,
        });
        console.error('Upload error:', error);
      }
    }

    setIsUploading(false);
  }, [userId, supabase, addActivity, updateActivity]);

  // Handle background removal - currently disabled, will be server-side
  const handleBackgroundRemoval = React.useCallback(async () => {
    // TODO: Implement server-side background removal
    // The client-side @imgly/background-removal library has issues in production
    // Will implement via API endpoint with proper ML model hosting
    throw new Error('Background removal is temporarily unavailable. Coming soon!');
  }, []);

  // Handle image processing
  const handleProcess = React.useCallback(async (
    action: string | null,
    options?: Record<string, unknown>
  ) => {
    if (!selectedImage || !action) return;

    setIsProcessing(true);

    const activityId = addActivity('process', `Processing: ${action}`, {
      status: 'processing',
      action: action as 'trim' | 'resize' | 'convert' | 'rotate' | 'optimize' | 'bundle',
      filename: selectedImage.filename,
    });

    const startTime = Date.now();

    try {
      // Build settings based on action
      const settings: Record<string, unknown> = {};

      switch (action) {
        case 'removeBackground':
          // Handle client-side background removal
          await handleBackgroundRemoval();
          updateActivity(activityId, {
            status: 'completed',
            message: 'Background removed',
            duration: Date.now() - startTime,
          });
          setIsProcessing(false);
          return;
        case 'trim':
          settings.trim = { enabled: true, threshold: 10 };
          break;
        case 'resize':
          settings.resize = {
            enabled: true,
            width: options?.width,
            height: options?.height,
            fit: 'inside',
            withoutEnlargement: true,
          };
          break;
        case 'convert':
          settings.convert = {
            enabled: true,
            format: options?.format || 'webp',
          };
          break;
        case 'rotate':
          settings.rotate = {
            enabled: true,
            angle: options?.angle,
            flipHorizontal: options?.flipHorizontal,
            flipVertical: options?.flipVertical,
          };
          break;
        case 'optimize':
          settings.optimize = {
            enabled: true,
            quality: options?.quality || 80,
          };
          break;
        case 'bundle':
          // Handle bundle generation separately
          await handleBundleGeneration(selectedImage, options?.appName as string);
          updateActivity(activityId, {
            status: 'completed',
            message: `Generated app bundle`,
            duration: Date.now() - startTime,
          });
          setIsProcessing(false);
          return;
      }

      const response = await fetch(`/api/images/${selectedImage.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      // Update local state
      const updatedImage = {
        ...selectedImage,
        status: 'completed' as const,
        processed_url: result.data.processed_url,
        width: result.data.width,
        height: result.data.height,
      };

      setSelectedImage(updatedImage);
      setImages(prev =>
        prev.map(img => img.id === selectedImage.id ? updatedImage : img)
      );

      updateActivity(activityId, {
        status: 'completed',
        message: `${action} completed`,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      updateActivity(activityId, {
        status: 'failed',
        message: `${action} failed`,
      });
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, addActivity, updateActivity]);

  // Handle bundle generation
  const handleBundleGeneration = async (image: ImageRecord, appName?: string) => {
    const response = await fetch('/api/assets/bundle', {
      method: 'POST',
      body: await createBundleFormData(image, appName),
    });

    if (!response.ok) {
      throw new Error('Bundle generation failed');
    }

    // Download the ZIP
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName || 'app'}-assets.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createBundleFormData = async (image: ImageRecord, appName?: string) => {
    const imageUrl = image.processed_url || image.original_url;
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('image', blob, image.filename);
    formData.append('config', JSON.stringify({ appName: appName || 'MyApp' }));

    return formData;
  };

  // Handle download
  const handleDownload = React.useCallback((image?: ImageRecord) => {
    const img = image || selectedImage;
    if (!img) return;

    const url = img.processed_url || img.original_url;
    const a = document.createElement('a');
    a.href = url;
    a.download = img.filename;
    a.click();

    addActivity('download', `Downloaded ${img.filename}`, {
      status: 'completed',
      filename: img.filename,
    });
  }, [selectedImage, addActivity]);

  // Handle delete
  const handleDelete = React.useCallback(async (image: ImageRecord) => {
    try {
      // Delete from storage
      if (userId) {
        const storagePath = image.original_url.split('/').pop();
        if (storagePath) {
          await supabase.storage.from('images').remove([`${userId}/${storagePath}`]);
        }
        if (image.processed_url) {
          const processedPath = image.processed_url.split('/processed/')[1];
          if (processedPath) {
            await supabase.storage.from('processed').remove([processedPath]);
          }
        }
      }

      // Delete from database
      await supabase.from('images').delete().eq('id', image.id);

      // Update local state
      setImages(prev => prev.filter(img => img.id !== image.id));
      if (selectedImage?.id === image.id) {
        setSelectedImage(null);
      }

      addActivity('process', `Deleted ${image.filename}`, {
        status: 'completed',
        filename: image.filename,
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  }, [userId, supabase, selectedImage, addActivity]);

  // Handle clear selected image
  const handleClear = React.useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Handle image selection from gallery
  const handleImageClick = React.useCallback((image: ImageRecord) => {
    setSelectedImage(image);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {selectedImage ? (
          /* Logo Canvas - when image is selected */
          <LogoCanvas
            imageUrl={selectedImage.processed_url || selectedImage.original_url}
            filename={selectedImage.filename}
            width={selectedImage.width}
            height={selectedImage.height}
            isProcessing={isProcessing}
            processedUrl={selectedImage.processed_url}
            onProcess={handleProcess}
            onDownload={() => handleDownload()}
            onClear={handleClear}
          />
        ) : (
          /* Hero Drop Zone - when no image selected */
          <HeroDropZone
            onFilesSelected={handleFilesSelected}
            isUploading={isUploading}
            hasImage={false}
          />
        )}

        {/* Compact upload button when image is selected */}
        {selectedImage && (
          <div className="mt-8">
            <HeroDropZone
              onFilesSelected={handleFilesSelected}
              isUploading={isUploading}
              hasImage={true}
            />
          </div>
        )}
      </div>

      {/* Activity Stream */}
      {activities.length > 0 && (
        <div className="px-6 py-4 border-t border-border/30">
          <ActivityStream activities={activities} />
        </div>
      )}

      {/* Gallery Rail */}
      {images.length > 0 && (
        <div className="px-6 py-6 border-t border-border/30 bg-card/30">
          <GalleryRail
            images={images}
            onImageClick={handleImageClick}
            onDownload={handleDownload}
            onDelete={handleDelete}
            selectedId={selectedImage?.id}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
