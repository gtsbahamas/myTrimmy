// src/types/video-bundle.ts

// ============================================
// Enums as const objects (for runtime + type safety)
// ============================================

export const VIDEO_STYLES = ['minimal', 'energetic', 'professional'] as const;
export type VideoStyle = typeof VIDEO_STYLES[number];

export const MUSIC_MOODS = ['ambient', 'upbeat', 'cinematic', 'none'] as const;
export type MusicMood = typeof MUSIC_MOODS[number];

export const VIDEO_BUNDLE_STATUSES = [
  'pending',
  'analyzing',
  'composing',
  'rendering',
  'validating',
  'reviewing',
  'completed',
  'failed',
] as const;
export type VideoBundleStatus = typeof VIDEO_BUNDLE_STATUSES[number];

export const SUBSCRIPTION_PLANS = ['free', 'pro', 'studio', 'studio_annual', 'agency'] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

export const SUBSCRIPTION_STATUSES = ['active', 'canceled', 'past_due', 'paused'] as const;
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number];

export const EDIT_TYPES = ['text_change', 'duration_change', 'style_change', 'single_format'] as const;
export type EditType = typeof EDIT_TYPES[number];

export const FAL_JOB_TYPES = ['intro', 'outro', 'background'] as const;
export type FalJobType = typeof FAL_JOB_TYPES[number];

export const FAL_JOB_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type FalJobStatus = typeof FAL_JOB_STATUSES[number];

export const VIDEO_FORMATS = ['landscape', 'portrait', 'square'] as const;
export type VideoFormat = typeof VIDEO_FORMATS[number];

// ============================================
// Site Analysis Types
// ============================================

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface SiteScreenshots {
  full: string;
  sections: string[];
}

export interface SiteContent {
  headline: string;
  subheadline: string | null;
  features: string[];
  stats: string[];
  cta: string;
}

export interface SiteAnalysis {
  screenshots: SiteScreenshots;
  colors: ColorPalette;
  content: SiteContent;
  logoUrl: string | null;
  siteType: 'tech' | 'ecommerce' | 'enterprise' | 'other';
}

// ============================================
// Video Output Types
// ============================================

export interface VideoFormatOutput {
  videoUrl: string;
  thumbnailUrl: string;
}

export interface VideoOutputs {
  landscape: VideoFormatOutput;
  portrait: VideoFormatOutput;
  square: VideoFormatOutput;
  metadata: {
    duration: number;
    colors: string[];
    musicTrack: string | null;
  };
}

// ============================================
// Quality Pipeline Types
// ============================================

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  value: string | number;
  threshold: string | number;
  autoFixApplied?: boolean;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

export interface GeminiReview {
  overallScore: number;
  pacing: { score: number; feedback: string };
  transitions: { score: number; feedback: string };
  coherence: { score: number; feedback: string };
  improvements: Array<{
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    autoApplicable: boolean;
  }>;
}

// ============================================
// Video Script Types (for Remotion)
// ============================================

export interface SceneBase {
  duration: number; // in frames (30fps)
}

export interface IntroScene extends SceneBase {
  type: 'intro';
  headline: string;
  logoUrl: string | null;
}

export interface FeatureScene extends SceneBase {
  type: 'feature';
  title: string;
  description: string;
  screenshot: string | null;
}

export interface StatsScene extends SceneBase {
  type: 'stats';
  items: Array<{ label: string; value: string }>;
}

export interface ScreenshotScene extends SceneBase {
  type: 'screenshot';
  imageUrl: string;
  caption: string | null;
}

export interface CtaScene extends SceneBase {
  type: 'cta';
  headline: string;
  buttonText: string;
  url: string;
}

export type VideoScene = IntroScene | FeatureScene | StatsScene | ScreenshotScene | CtaScene;

export interface VideoScript {
  scenes: VideoScene[];
  style: VideoStyle;
  musicMood: MusicMood;
  totalDuration: number;
  colors: ColorPalette;
  logoUrl: string | null;
}

// ============================================
// Database Row Types (matches Supabase schema)
// ============================================

export interface VideoBundleRow {
  id: string;
  user_id: string;
  source_url: string;
  site_analysis: SiteAnalysis;
  style: VideoStyle;
  music_mood: MusicMood;
  duration_seconds: number;
  status: VideoBundleStatus;
  validation_result: ValidationResult | null;
  gemini_review: GeminiReview | null;
  outputs: VideoOutputs | null;
  edit_count: number;
  last_edited_at: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  video_bundles_used: number;
  video_bundles_limit: number | null;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface VideoEditRow {
  id: string;
  video_bundle_id: string;
  edit_type: EditType;
  changes: Record<string, unknown>;
  applied_at: string;
  applied_by: string;
}

export interface FalJobRow {
  id: string;
  video_bundle_id: string;
  fal_request_id: string;
  job_type: FalJobType;
  status: FalJobStatus;
  output_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ============================================
// API Request/Response Types
// ============================================

export interface AnalyzeUrlRequest {
  url: string;
}

export interface AnalyzeUrlResponse {
  analysis: SiteAnalysis;
  suggestedStyle: VideoStyle;
  suggestedMusicMood: MusicMood;
  suggestedDuration: number;
}

export interface GenerateVideoRequest {
  sourceUrl: string;
  style: VideoStyle;
  musicMood: MusicMood;
  durationSeconds: number;
}

export interface GenerateVideoResponse {
  bundleId: string;
  status: VideoBundleStatus;
}

export interface VideoBundleStatusResponse {
  id: string;
  status: VideoBundleStatus;
  progress: number;
  currentStep: string;
  outputs: VideoOutputs | null;
  error: string | null;
}

// ============================================
// Subscription Limits
// ============================================

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, { videoBundles: number | null }> = {
  free: { videoBundles: 3 }, // Free tier gets 3 watermarked videos
  pro: { videoBundles: 5 },  // Pro tier gets 5 videos
  studio: { videoBundles: 20 },
  studio_annual: { videoBundles: 20 },
  agency: { videoBundles: null }, // Unlimited
};

export function canGenerateVideo(plan: SubscriptionPlan, used: number): boolean {
  const limit = SUBSCRIPTION_LIMITS[plan].videoBundles;
  if (limit === null) return true;
  return used < limit;
}

export function getVideoQuotaRemaining(plan: SubscriptionPlan, used: number): number | null {
  const limit = SUBSCRIPTION_LIMITS[plan].videoBundles;
  if (limit === null) return null;
  return Math.max(0, limit - used);
}
