/**
 * Asset Generator Component
 *
 * UI for uploading a logo and generating an app asset bundle.
 * Allows user to upload a high-quality logo, enter app name, and download ZIP.
 */

'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface AssetGeneratorState {
  image: File | null;
  imagePreview: string | null;
  imageDimensions: { width: number; height: number } | null;
  appName: string;
  isGenerating: boolean;
  error: string | null;
  success: boolean;
  progress: number;
}

const initialState: AssetGeneratorState = {
  image: null,
  imagePreview: null,
  imageDimensions: null,
  appName: '',
  isGenerating: false,
  error: null,
  success: false,
  progress: 0,
};

export function AssetGenerator() {
  const [state, setState] = React.useState<AssetGeneratorState>(initialState);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (state.imagePreview) {
        URL.revokeObjectURL(state.imagePreview);
      }
    };
  }, [state.imagePreview]);

  // Handle file selection
  const handleFileSelect = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setState((prev) => ({
          ...prev,
          error: 'Please upload a PNG, JPEG, WebP, or SVG image.',
          image: null,
          imagePreview: null,
          imageDimensions: null,
        }));
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setState((prev) => ({
          ...prev,
          error: 'Image must be smaller than 10MB.',
          image: null,
          imagePreview: null,
          imageDimensions: null,
        }));
        return;
      }

      // Create preview and validate dimensions
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        if (img.width < 512 || img.height < 512) {
          URL.revokeObjectURL(previewUrl);
          setState((prev) => ({
            ...prev,
            error: `Image must be at least 512x512 pixels. Your image is ${img.width}x${img.height}.`,
            image: null,
            imagePreview: null,
            imageDimensions: null,
          }));
        } else {
          // Revoke old preview if exists
          if (state.imagePreview) {
            URL.revokeObjectURL(state.imagePreview);
          }
          setState((prev) => ({
            ...prev,
            image: file,
            imagePreview: previewUrl,
            imageDimensions: { width: img.width, height: img.height },
            error: null,
            success: false,
          }));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        setState((prev) => ({
          ...prev,
          error: 'Failed to load image. Please try another file.',
          image: null,
          imagePreview: null,
          imageDimensions: null,
        }));
      };

      img.src = previewUrl;
    },
    [state.imagePreview]
  );

  // Handle drag and drop
  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files?.[0];
      if (file && fileInputRef.current) {
        // Create a new DataTransfer to set files on input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;

        // Trigger the change event handler
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
    },
    []
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  // Clear selected image
  const handleClearImage = React.useCallback(() => {
    if (state.imagePreview) {
      URL.revokeObjectURL(state.imagePreview);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setState((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
      imageDimensions: null,
      error: null,
      success: false,
    }));
  }, [state.imagePreview]);

  // Handle app name change
  const handleAppNameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({
        ...prev,
        appName: event.target.value,
        error: null,
        success: false,
      }));
    },
    []
  );

  // Generate and download bundle
  const handleGenerate = React.useCallback(async () => {
    if (!state.image || !state.appName.trim()) {
      setState((prev) => ({
        ...prev,
        error: 'Please provide both an image and an app name.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isGenerating: true,
      progress: 10,
      error: null,
      success: false,
    }));

    try {
      const formData = new FormData();
      formData.append('image', state.image);
      formData.append(
        'config',
        JSON.stringify({
          appName: state.appName.trim(),
        })
      );

      setState((prev) => ({ ...prev, progress: 30 }));

      const response = await fetch('/api/assets/bundle', {
        method: 'POST',
        body: formData,
      });

      setState((prev) => ({ ...prev, progress: 70 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      setState((prev) => ({ ...prev, progress: 90 }));

      // Download the ZIP file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.appName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-assets.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState((prev) => ({
        ...prev,
        progress: 100,
        success: true,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Generation failed',
        success: false,
      }));
    } finally {
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [state.image, state.appName]);

  const canGenerate = state.image && state.appName.trim() && !state.isGenerating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          App Asset Bundle Generator
        </CardTitle>
        <CardDescription>
          Upload a high-quality logo (512x512 minimum) and generate all favicon,
          app icon, and social media assets in one ZIP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label htmlFor="logo-upload">Logo Image</Label>
          <input
            ref={fileInputRef}
            id="logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!state.imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Click or drag to upload a logo
                <br />
                <span className="text-xs">PNG, JPEG, WebP, or SVG (512x512+ recommended)</span>
              </p>
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={state.imagePreview}
                alt="Logo preview"
                className="max-w-[200px] max-h-[200px] rounded-lg border object-contain"
              />
              <button
                onClick={handleClearImage}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              {state.imageDimensions && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {state.imageDimensions.width}x{state.imageDimensions.height}
                </p>
              )}
            </div>
          )}
        </div>

        {/* App Name Input */}
        <div className="space-y-2">
          <Label htmlFor="app-name">App Name</Label>
          <Input
            id="app-name"
            type="text"
            placeholder="My Awesome App"
            value={state.appName}
            onChange={handleAppNameChange}
            maxLength={100}
            disabled={state.isGenerating}
          />
          <p className="text-xs text-muted-foreground">
            Used in manifest.json and README
          </p>
        </div>

        {/* Progress Bar */}
        {state.isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generating assets...</span>
              <span className="text-muted-foreground">{state.progress}%</span>
            </div>
            <Progress value={state.progress} className="h-2" />
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {/* Success Display */}
        {state.success && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Asset bundle downloaded successfully! Check your downloads folder.
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full"
          size="lg"
        >
          {state.isGenerating ? (
            <>
              <Package className="mr-2 h-4 w-4 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate & Download Bundle
            </>
          )}
        </Button>

        {/* Asset List Preview */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Bundle includes:</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <li>• favicon.ico + PNGs</li>
            <li>• Apple touch icons</li>
            <li>• Android/PWA icons</li>
            <li>• Maskable icons</li>
            <li>• og-image.png</li>
            <li>• twitter-card.png</li>
            <li>• manifest.json</li>
            <li>• README.md</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
