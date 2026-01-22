# Video Bundles Feature Design

*Created: 2026-01-21*
*Status: Approved*

---

## 1. Product Vision & Value Proposition

**Feature Name:** Video Bundles

**One-liner:** One URL in, professional promo videos out - landscape, portrait, and square formats ready for every platform.

**How it fits myTrimmy's brand:**
- Extends "one logo → 50+ assets" to "one URL → complete video kit"
- Same philosophy: eliminate tedious multi-format busywork
- Complements existing asset bundles - users get icons AND promo videos

**Target output per generation:**

| Format | Dimensions | Use Case |
|--------|------------|----------|
| Landscape | 1920×1080 | Product Hunt, landing pages, YouTube |
| Portrait | 1080×1920 | TikTok, Reels, Stories |
| Square | 1080×1080 | Instagram feed, Twitter/X, LinkedIn |

**User journey:**
1. Paste URL → AI analyzes site (colors, content, screenshots)
2. User selects from AI-suggested options (theme, pacing, music mood)
3. Generation runs → structured validation → Gemini quality review
4. Preview all three formats → light post-editing if needed
5. Download bundle (MP4s + thumbnail stills)

**Target users:**
- Indie developers / solo founders (speed)
- Small teams / startups (quality)
- Marketers / content creators (volume)
- Tiered output serves all segments

---

## 2. Technical Architecture

**Hybrid Stack: Remotion + Fal.ai**

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                               │
│                     (URL + preferences)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    URL ANALYSIS ENGINE                          │
│  • Playwright screenshots (full page, key sections)             │
│  • Color extraction (dominant palette, contrast pairs)          │
│  • Content extraction (headlines, stats, features, CTA)         │
│  • Logo detection (for consistent branding)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AI COMPOSITION LAYER                           │
│  • Claude generates video script (scenes, timing, text)         │
│  • Suggests 2-3 theme options (minimal/energetic/corporate)     │
│  • Maps content to template structure                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────────┐               ┌─────────────────────┐
│     REMOTION        │               │      FAL.AI         │
│  (Structured Core)  │               │  (AI Flourishes)    │
│                     │               │                     │
│  • Text animations  │               │  • Intro motion     │
│  • Screenshot pans  │               │  • Background video │
│  • Transitions      │               │  • Outro effects    │
│  • Layout/timing    │               │  • Abstract visuals │
│  • CTA sequences    │               │                     │
└─────────────────────┘               └─────────────────────┘
         │                                         │
         └────────────────────┬────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPOSITION & RENDER                         │
│  • Remotion composes final video (3 format variants)            │
│  • Fal.ai assets layered as backgrounds/overlays                │
│  • Parallel render: landscape, portrait, square                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    QUALITY PIPELINE                             │
│  1. Structured Validation (programmatic)                        │
│     • Text within safe zones (no cut-off)                       │
│     • Color contrast ≥ 4.5:1 (WCAG AA)                          │
│     • Scene duration bounds (2-8 sec per scene)                 │
│     • Audio sync verification                                   │
│                                                                 │
│  2. Gemini Video Understanding (holistic)                       │
│     • Pacing assessment                                         │
│     • Transition smoothness                                     │
│     • Overall coherence score                                   │
│     • Improvement suggestions → auto-apply or surface to user   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OUTPUT BUNDLE                              │
│  • landscape.mp4 (1920×1080)                                    │
│  • portrait.mp4 (1080×1920)                                     │
│  • square.mp4 (1080×1080)                                       │
│  • thumbnail-landscape.png                                      │
│  • thumbnail-portrait.png                                       │
│  • thumbnail-square.png                                         │
│  • metadata.json (colors used, music, duration)                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key tech decisions:**
- **Remotion runs server-side** via Vercel Functions or dedicated render service (Lambda/Render)
- **Fal.ai called async** - fire requests during URL analysis to parallelize
- **Three renders in parallel** - same content, different compositions for each aspect ratio

---

## 3. User Flow & Interface

### Phase 1: URL Input & Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│  VIDEO BUNDLES                                        [Pro]     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🔗  https://mytrimmy.com                            [→]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Paste any URL. We'll analyze your site and generate           │
│  promo videos for every platform.                               │
└─────────────────────────────────────────────────────────────────┘
```

On submit → loading state shows real-time progress:
- ✓ Capturing screenshots...
- ✓ Extracting color palette...
- ✓ Analyzing content...
- ○ Generating options...

### Phase 2: Guided Customization (AI-Suggested Options)

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR SITE AT A GLANCE                                          │
│                                                                 │
│  ┌──────────┐  Detected:                                        │
│  │ [screenshot│  • "App Asset Bundle Generator"                 │
│  │  preview] │  • 50+ assets, 4 platforms                       │
│  │          │  • Amber/gold + dark theme                        │
│  └──────────┘  • Key stat: "One logo in, 50+ assets out"        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHOOSE YOUR STYLE                                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   MINIMAL   │  │  ENERGETIC  │  │ PROFESSIONAL│             │
│  │ ─────────── │  │ ─────────── │  │ ─────────── │             │
│  │ Clean fades │  │ Punchy cuts │  │ Smooth glides│             │
│  │ Subtle motion│ │ Dynamic zoom│  │ Elegant pans │             │
│  │ 45 sec      │  │ 30 sec      │  │ 60 sec       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│       [ ● ]            [ ○ ]            [ ○ ]                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MUSIC MOOD                                                     │
│                                                                 │
│  [ ● ] Ambient & Techy    [ ○ ] Upbeat & Confident             │
│  [ ○ ] Cinematic          [ ○ ] No music                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PACING                                                         │
│                                                                 │
│  Slower ○───────●───────○ Faster                               │
│         30s     45s     60s                                     │
│                                                                 │
│                                    [ Generate Videos → ]        │
└─────────────────────────────────────────────────────────────────┘
```

**AI pre-selects defaults** based on site analysis:
- Tech/dev tools → Minimal + Ambient
- E-commerce → Energetic + Upbeat
- Enterprise → Professional + Cinematic

### Phase 3: Generation Progress

```
┌─────────────────────────────────────────────────────────────────┐
│  GENERATING YOUR VIDEO BUNDLE                                   │
│                                                                 │
│  ████████████████████░░░░░░░░░░  68%                           │
│                                                                 │
│  ✓ Composing scenes                                             │
│  ✓ Generating AI flourishes                                     │
│  ● Rendering landscape...                                       │
│  ○ Rendering portrait                                           │
│  ○ Rendering square                                             │
│  ○ Quality validation                                           │
│  ○ Final review                                                 │
│                                                                 │
│  Estimated: ~2 minutes remaining                                │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Preview & Edit

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR VIDEO BUNDLE                                    [Download]│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │              [ ▶ LANDSCAPE PREVIEW ]                        ││
│  │                   1920 × 1080                               ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                   │
│  │ LANDSCAPE │  │ PORTRAIT  │  │  SQUARE   │                   │
│  │  [thumb]  │  │  [thumb]  │  │  [thumb]  │                   │
│  │    ✓      │  │           │  │           │                   │
│  └───────────┘  └───────────┘  └───────────┘                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  QUICK EDITS                                          [Edit ↓] │
│                                                                 │
│  Headline:  [ One logo in, 50+ assets out          ] [Regen]   │
│  CTA Text:  [ Try Free                              ] [Regen]   │
│  Duration:  [ 45s ▼ ]                                          │
│                                                                 │
│  ⚡ Regenerate Single Format    🔄 Regenerate All               │
└─────────────────────────────────────────────────────────────────┘
```

**Post-edit capabilities:**
- Edit text overlays → regenerates affected scenes only
- Adjust duration → re-renders with different pacing
- Swap style → full regeneration with new template
- Regenerate single format (if portrait has issues, fix just that one)

---

## 4. Pricing Model & Recurring Revenue

**Current State:**
- Free: 10 logo bundles/month
- Pro: $19 one-time, unlimited logo bundles

**New Structure with Video Bundles:**

| Tier | Logo Bundles | Video Bundles | Price |
|------|--------------|---------------|-------|
| **Free** | 10/month | 1 preview (watermarked) | $0 |
| **Pro** | Unlimited | — | $19 one-time |
| **Studio** | Unlimited | 5/month | $12/month |
| **Studio Annual** | Unlimited | 5/month | $99/year (save 31%) |
| **Agency** | Unlimited | Unlimited | $39/month |

**Why this structure:**

1. **Pro stays one-time** - Existing customers aren't forced to subscribe. Logo bundles remain the entry point.

2. **Studio is the subscription gateway** - Video generation has real compute costs (Remotion render + Fal.ai + Gemini). Recurring revenue covers recurring costs.

3. **Free preview hooks users** - They see what their video looks like (watermarked), experience the value, then subscribe to download clean.

4. **Agency tier captures power users** - Marketers generating videos for multiple clients pay for unlimited access.

**Compute Cost Estimation (per video bundle):**

| Service | Cost per Generation |
|---------|---------------------|
| Fal.ai (intro/outro flourishes) | ~$0.15-0.40 |
| Gemini Video Understanding | ~$0.05-0.10 |
| Remotion render (3 formats) | ~$0.10-0.30 (Lambda) |
| Supabase storage (temp) | ~$0.01 |
| **Total** | **~$0.30-0.80** |

At $12/month for 5 videos = $2.40/video revenue vs ~$0.50 cost = **healthy margin**.

---

## 5. Quality Pipeline & Gemini Integration

**Two-Layer Quality Control:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: STRUCTURED VALIDATION               │
│                    (Deterministic, Fast, Blocking)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                         PASS/FAIL
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: GEMINI VIDEO REVIEW                 │
│                    (Holistic, AI-Powered, Advisory)             │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 1: Structured Validation (Programmatic)

| Check | Rule | Auto-Fix |
|-------|------|----------|
| **Text Safe Zones** | No text within 5% of edges | Reposition text inward |
| **Text Readability** | Min 24px effective size at 1080p | Scale up text |
| **Color Contrast** | ≥ 4.5:1 ratio (WCAG AA) | Add text shadow/backdrop |
| **Scene Duration** | 2-8 seconds per scene | Adjust timing |
| **Total Duration** | Within ±5% of target | Trim/extend transitions |
| **Audio Sync** | Music ends within 0.5s of video | Fade audio to match |
| **Aspect Integrity** | No stretched/squished elements | Recrop, don't stretch |
| **Logo Placement** | Logo visible, not cropped | Reposition to safe zone |
| **CTA Visibility** | Final CTA on screen ≥3 seconds | Extend final scene |

### Layer 2: Gemini Video Understanding API

After structured validation passes, upload to Gemini for holistic review.

**Review dimensions:**
- Pacing (1-10): Is the rhythm appropriate?
- Transitions (1-10): Are transitions smooth and purposeful?
- Coherence (1-10): Does the video tell a clear story?
- Improvements: Specific, actionable suggestions

**Quality Decision Flow:**
- Score ≥ 8/10 → Deliver to user
- Score < 8/10 with auto-applicable fixes → Apply and re-render
- Score < 8/10 requiring user decision → Surface suggestions in edit UI

---

## 6. Data Model & Database Schema

### New Tables

```sql
-- Video generation requests and their outputs
CREATE TABLE video_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Input
  source_url TEXT NOT NULL,

  -- Analysis results (cached for re-generation)
  site_analysis JSONB NOT NULL,

  -- User selections
  style TEXT NOT NULL CHECK (style IN ('minimal', 'energetic', 'professional')),
  music_mood TEXT NOT NULL CHECK (music_mood IN ('ambient', 'upbeat', 'cinematic', 'none')),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 15 AND 90),

  -- Generation state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'analyzing', 'composing', 'rendering',
    'validating', 'reviewing', 'completed', 'failed'
  )),

  -- Quality results
  validation_result JSONB,
  gemini_review JSONB,

  -- Outputs
  outputs JSONB,

  -- Edit history
  edit_count INTEGER NOT NULL DEFAULT 0,
  last_edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  error_details JSONB
);

-- Subscription management
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'studio', 'studio_annual', 'agency')),

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  video_bundles_used INTEGER NOT NULL DEFAULT 0,
  video_bundles_limit INTEGER,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id)
);

-- Video edits tracking
CREATE TABLE video_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_bundle_id UUID NOT NULL REFERENCES video_bundles(id) ON DELETE CASCADE,

  edit_type TEXT NOT NULL CHECK (edit_type IN (
    'text_change', 'duration_change', 'style_change', 'single_format'
  )),

  changes JSONB NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Fal.ai job tracking
CREATE TABLE fal_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_bundle_id UUID NOT NULL REFERENCES video_bundles(id) ON DELETE CASCADE,

  fal_request_id TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('intro', 'outro', 'background')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  output_url TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

### RLS Policies

- Users can only view/modify their own video bundles
- Subscriptions modified via service role only (Stripe webhooks)
- Video edits follow parent bundle permissions

---

## 7. Remotion Template Architecture

### Project Structure

```
src/remotion/
├── Root.tsx                    # Remotion entry point
├── Video.tsx                   # Main composition wrapper
│
├── compositions/
│   ├── PromoVideo.tsx          # Master composition
│   ├── LandscapeComposition.tsx
│   ├── PortraitComposition.tsx
│   └── SquareComposition.tsx
│
├── scenes/
│   ├── IntroScene.tsx          # Logo + hook text
│   ├── FeatureScene.tsx        # Single feature highlight
│   ├── StatsScene.tsx          # Key metrics/numbers
│   ├── ScreenshotScene.tsx     # Product screenshot with pan
│   └── CtaScene.tsx            # Final call-to-action
│
├── components/
│   ├── AnimatedText.tsx        # Text with entrance animations
│   ├── Screenshot.tsx          # Image with ken-burns effect
│   ├── LogoReveal.tsx          # Logo animation
│   ├── GradientBackground.tsx  # Dynamic gradient from site colors
│   ├── FalOverlay.tsx          # Fal.ai generated video layer
│   └── SafeZone.tsx            # Ensures content stays in bounds
│
├── styles/
│   ├── minimal.ts              # Clean fades, subtle motion
│   ├── energetic.ts            # Punchy cuts, dynamic zoom
│   └── professional.ts         # Smooth glides, elegant pans
│
└── utils/
    ├── timing.ts               # Duration calculations
    ├── easing.ts               # Custom easing functions
    └── safeZones.ts            # Per-format safe zone calculations
```

### Style Configuration

Each style defines:
- Scene transition duration and type
- Text entrance animations
- Screenshot effects (static, ken-burns, parallax)
- Typography sizes per format
- Visual treatments (shadows, blur, overlay opacity)

---

## 8. Fal.ai Integration

### Asset Types

| Asset Type | Purpose | Model | Duration |
|------------|---------|-------|----------|
| **Intro Motion** | Eye-catching opening | Kling | 3-5 sec |
| **Background Loop** | Subtle ambient motion | Luma | 5-10 sec |
| **Outro Effect** | Dramatic closing | Veo 3 | 3-5 sec |

### Prompt Engineering by Style

- **Minimal:** Subtle gradients, soft light particles, meditative
- **Energetic:** Bold geometric shapes, fast cuts, tech startup vibe
- **Professional:** Sophisticated 3D surfaces, cinematic lighting

### Graceful Degradation

If Fal.ai fails or times out:
- Intro → Falls back to animated gradient
- Background → Falls back to static gradient
- Outro → Falls back to simple fade

Videos still render without AI flourishes.

---

## 9. Error Handling & Recovery

### Error Classification

| Error Type | Auto-Retry | User Action |
|------------|------------|-------------|
| **Transient** (timeout, rate limit) | Yes (3x) | None |
| **Recoverable** (bad Fal output) | Yes (1x) | None - uses fallback |
| **User-Fixable** (invalid URL) | No | Prompt to fix input |
| **Fatal** (OOM, codec crash) | No | Refund credits |

### Pipeline Checkpointing

Each stage saves progress to database:
- URL analysis → checkpoint
- AI script → checkpoint
- Fal.ai assets → checkpoint
- Per-format renders → checkpoint each

On failure, resume from last checkpoint instead of starting over.

### User-Facing Error Messages

- Invalid URL → "Make sure it's a valid, publicly accessible website"
- No content → "Try a page with more text and images"
- Timeout → "We've saved your progress - try again to resume"
- Partial success → "Download available formats or retry failed ones"

---

## 10. Implementation Phases

### Phase 1: Foundation
- Database schema migration
- TypeScript types generation
- Subscription tier updates
- URL analyzer service
- Basic API routes

### Phase 2: AI Integration
- Claude script generator
- Fal.ai integration + webhooks
- Gemini review integration
- Prompt templates per style

### Phase 3: Remotion Core
- Project setup and structure
- Style configurations
- Core scene components
- Single-format render test

### Phase 4: Multi-Format & Quality
- Portrait and square compositions
- Parallel render orchestration
- Structured validation
- Auto-fix implementations

### Phase 5: UI & User Flow
- URL input page
- Customization UI
- Progress indicator
- Preview & download UI
- Quick edit interface
- Subscription gate

### Phase 6: Polish & Production
- Error handling UI
- Watermark for free tier
- Usage tracking & limits
- Email notifications
- Analytics events
- Load testing

---

## Launch Checklist

### Infrastructure
- [ ] Supabase tables deployed with RLS policies
- [ ] Stripe products created (Studio $12/mo, Agency $39/mo)
- [ ] Fal.ai API key configured, webhook URL registered
- [ ] Gemini API key configured
- [ ] Remotion render service deployed
- [ ] Supabase Storage bucket for video outputs
- [ ] CDN configured for video delivery

### Quality Gates
- [ ] All 3 formats render correctly for test URLs
- [ ] Structured validation catches common issues
- [ ] Gemini review returns actionable feedback
- [ ] Fallback renders work when Fal.ai fails
- [ ] Error recovery resumes from checkpoint

### User Flows
- [ ] Free user sees watermarked preview, upgrade prompt
- [ ] Pro user sees upgrade prompt to Studio
- [ ] Studio user can generate 5/month, sees limit
- [ ] Agency user has unlimited access
- [ ] Quick edits regenerate correctly
- [ ] Download bundle contains all formats + thumbnails

### Dogfood
- [ ] Generated myTrimmy promo video (all 3 formats)
- [ ] Used in actual marketing
- [ ] Collected feedback, fixed issues

---

## Success Metrics (First 90 Days)

| Metric | Target |
|--------|--------|
| Video generations | 500+ |
| Studio conversions | 50+ |
| Completion rate | >85% |
| Quality score avg | >7.5/10 |
| Time to first video | <5 min |
| Support tickets | <5% of generations |
