# Promo Video Mastery Skill

> Create compelling SaaS promo videos that convert using battle-tested patterns from Stripe, Linear, Vercel, and Apple.

---

## Overview

This skill codifies best practices for creating promo videos that:
1. Capture attention in the first 3 seconds
2. Communicate value clearly and quickly
3. Drive action with compelling CTAs
4. Feel polished and professional

**Sources:** Motion design research, Stripe payment animation team, Vercel's product tour design, Linear quality principles, Apple launch video patterns.

---

## Video Duration Guidelines

| Video Type | Ideal Duration | Max Duration |
|------------|----------------|--------------|
| Hero loop (homepage) | 3-5 seconds | 10 seconds |
| Product teaser | 15-30 seconds | 45 seconds |
| **SaaS explainer** | **60-90 seconds** | 120 seconds |
| Feature demo | 2-3 minutes | 5 minutes |
| Tutorial | 3-5 minutes | 10 minutes |

**Critical:** First 15 seconds are make-or-break for retention. Front-load value.

---

## Video Structure (60-90 Second Explainer)

### The 4-Act Structure

```
Act 1: Hook (0-8s)        → Emotional hook, pain point, or bold claim
Act 2: Problem (8-20s)    → Show the problem your audience faces
Act 3: Solution (20-60s)  → Your product in action (3-5 features max)
Act 4: CTA (60-75s)       → Clear call to action
```

### Scene Breakdown

| Scene Type | Duration | Purpose |
|------------|----------|---------|
| **Intro/Hook** | 3-5 seconds | Bold headline, logo reveal, grab attention |
| **Problem** | 5-10 seconds | Show pain point (optional, can skip) |
| **Feature** | 4-6 seconds each | One idea per scene, benefit over feature |
| **Stats** | 4-5 seconds | Social proof, credibility |
| **Screenshot** | 5-7 seconds | Product in action |
| **CTA** | 4-6 seconds | Clear next step |

**Rule:** One idea per scene. If explaining two things, use two scenes.

---

## Animation Timing Standards

### Micro-interactions (UI Polish)

| Animation | Duration | Frames @30fps |
|-----------|----------|---------------|
| Button hover | 100-150ms | 3-5 |
| Icon state change | 150-200ms | 5-6 |
| Tooltip appear | 200-250ms | 6-8 |
| Loading spinner | 300-400ms | 9-12 |

### Element Animations

| Animation | Duration | Frames @30fps |
|-----------|----------|---------------|
| Text fade in | 400-500ms | 12-15 |
| Text slide up | 400-600ms | 12-18 |
| Logo reveal | 600-800ms | 18-24 |
| Screenshot zoom | 500-700ms | 15-21 |
| Counter tick | 50ms per digit | 1-2 |
| Counter total | 1-1.5 seconds | 30-45 |

### Scene Transitions

| Transition | Duration | Frames @30fps |
|------------|----------|---------------|
| Fade | 400-600ms | 12-18 |
| Slide | 300-500ms | 9-15 |
| Wipe | 400-600ms | 12-18 |
| Zoom | 500-700ms | 15-21 |

**Best Practice:** Use 500ms (15 frames) as default transition duration.

---

## Spring Animation Configs

Springs create natural motion. Match spring config to brand personality:

### Recommended Configs

```typescript
const SPRING_CONFIGS = {
  // Smooth, professional (Stripe, Linear style)
  smooth: { damping: 200 },

  // Snappy, responsive (Vercel style)
  snappy: { damping: 20, stiffness: 200 },

  // Bouncy, playful (consumer apps)
  bouncy: { damping: 8 },

  // Subtle overshoot (premium feel)
  elegant: { damping: 15, stiffness: 120 },
};
```

### When to Use Each

| Config | Use Case | Brand Feel |
|--------|----------|------------|
| `smooth` | Text reveals, fades, subtle motion | Professional, calm |
| `snappy` | UI interactions, quick reveals | Modern, efficient |
| `bouncy` | Headlines, CTAs, attention-grabbers | Fun, energetic |
| `elegant` | Logo reveals, premium moments | Sophisticated |

---

## TransitionSeries Best Practices

### Basic Pattern

```tsx
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={120}>
    <IntroScene />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={fade()}
    timing={springTiming({
      config: { damping: 200 },
      durationInFrames: 15,
      durationRestThreshold: 0.001, // Smoother cutoff
    })}
  />

  <TransitionSeries.Sequence durationInFrames={150}>
    <FeatureScene />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

### Available Presentations

| Presentation | Effect | Best For |
|--------------|--------|----------|
| `fade()` | Cross-dissolve | Most transitions (default) |
| `slide()` | Push left/right | Sequential flow |
| `wipe()` | Reveal wipe | Dramatic reveals |
| `flip()` | 3D card flip | Playful transitions |
| `cube()` | 3D cube rotation | Feature showcases |
| `clockWipe()` | Circular wipe | Countdown reveals |
| `iris()` | Circular in/out | Focus attention |

### Transition Duration Rule

```
Scene duration > Transition duration + buffer

Minimum scene duration = transition_duration + 1 frame
Recommended = transition_duration × 3
```

---

## Text Animation Patterns

### Headline Reveal (Primary)

```typescript
// Fade + slide up (professional)
const translateY = interpolate(springProgress, [0, 1], [30, 0]);
const opacity = interpolate(progress, [0, 1], [0, 1]);

// Scale bounce (energetic)
const scale = interpolate(bouncySpring, [0, 1], [0.8, 1]);
```

### Staggered Text (Multiple Lines)

```typescript
const LINE_DELAY = 8; // frames between lines

lines.map((line, i) => (
  <AnimatedText delay={baseDelay + (i * LINE_DELAY)}>
    {line}
  </AnimatedText>
));
```

### Counter Animation (Stats)

```typescript
// Fast at start, slow at end (easeOutCubic)
const progress = easeOutCubic(linearProgress);
const displayValue = Math.round(targetValue * progress);
```

---

## Visual Design Principles

### Typography Hierarchy

| Level | Size (Landscape) | Size (Portrait) | Weight |
|-------|------------------|-----------------|--------|
| Headline | 64-96px | 48-72px | 600-700 |
| Subheadline | 36-48px | 28-36px | 400-500 |
| Body | 24-32px | 18-24px | 400 |
| Caption | 18-24px | 14-18px | 400 |

### Color Contrast

- Text on dark: Minimum 4.5:1 contrast ratio
- Headlines: 100% opacity
- Subtext: 70-80% opacity
- Disabled: 40-50% opacity

### Safe Zones

```
Action Safe: 5% padding from edges (important content)
Title Safe: 10% padding from edges (text)
```

---

## Scene Composition Patterns

### Intro Scene

```
┌─────────────────────────────────────┐
│                                     │
│            [Logo]                   │
│                                     │
│     "One logo in, 50+ assets out"   │
│                                     │
│     Generated in seconds            │
│                                     │
└─────────────────────────────────────┘

Animation Order:
1. Logo fade in (0-800ms)
2. Headline slide up (400ms delay, 500ms duration)
3. Subheadline fade (200ms delay after headline)
```

### Feature Scene

```
┌─────────────────────────────────────┐
│                                     │
│          "Feature Title"            │
│                                     │
│    • Benefit one                    │
│    • Benefit two                    │
│    • Benefit three                  │
│                                     │
└─────────────────────────────────────┘

Animation Order:
1. Title enters
2. Bullets stagger in (100-150ms apart)
```

### Stats Scene

```
┌─────────────────────────────────────┐
│                                     │
│   53        4        <10s           │
│  Assets  Platforms  Generation      │
│                                     │
└─────────────────────────────────────┘

Animation Order:
1. Numbers count up simultaneously (1.5s)
2. Labels fade in (staggered 100ms)
```

### CTA Scene

```
┌─────────────────────────────────────┐
│                                     │
│    "Ready to ship your brand?"      │
│                                     │
│      [ Generate Assets Free ]       │
│                                     │
│        mytrimmy.vercel.app          │
│                                     │
└─────────────────────────────────────┘

Animation Order:
1. Headline enters
2. Button slides/scales in (200ms delay)
3. URL fades in (200ms delay after button)
```

---

## Quality Checklist

### Before Rendering

- [ ] Total duration: 60-90 seconds
- [ ] First scene hooks in <5 seconds
- [ ] One idea per scene
- [ ] Text readable (check contrast)
- [ ] Transitions consistent (same type/duration)
- [ ] Scene durations feel balanced
- [ ] CTA is clear and prominent

### Animation Quality

- [ ] No abrupt starts/stops (use springs)
- [ ] Consistent timing language
- [ ] Staggered elements (not all at once)
- [ ] Smooth transitions (15+ frames)
- [ ] Counter animations feel satisfying

### Brand Alignment

- [ ] Colors match brand palette
- [ ] Typography matches brand voice
- [ ] Animation style matches brand personality
- [ ] No conflicting visual metaphors

---

## Anti-Patterns to Avoid

| Don't | Why | Do Instead |
|-------|-----|------------|
| Abrupt cuts | Jarring | Use 400-600ms transitions |
| Too many features | Overwhelming | Focus on 3-5 max |
| Wall of text | Unreadable | One idea per scene |
| Slow intro | Loses attention | Hook in first 3 seconds |
| Generic CTA | No urgency | Specific action + benefit |
| Everything bounces | Unprofessional | Reserve bounce for emphasis |
| Linear easing | Mechanical | Use springs or curves |
| Identical animations | Boring | Vary timing/entrance types |

---

## Format-Specific Adjustments

### Landscape (16:9) - YouTube, Website

- Standard font sizes
- Horizontal stats layout
- Wide screenshots

### Portrait (9:16) - TikTok, Reels, Stories

- Increase font size 1.3x
- Vertical stats layout
- Phone-framed screenshots
- Center content higher

### Square (1:1) - Instagram, LinkedIn

- Slightly larger fonts
- Tighter compositions
- Consider grid-based layouts

---

## Example Script Structure

```json
{
  "scenes": [
    {
      "type": "intro",
      "headline": "One logo in, 50+ assets out",
      "duration": 120
    },
    {
      "type": "feature",
      "title": "The Last Mile for Your Brand",
      "description": "iOS icons • Android adaptive icons • Favicons • PWA assets • Social cards",
      "duration": 150
    },
    {
      "type": "stats",
      "items": [
        { "value": "53", "label": "Assets Generated" },
        { "value": "4", "label": "Platforms Covered" },
        { "value": "<10s", "label": "Generation Time" }
      ],
      "duration": 120
    },
    {
      "type": "cta",
      "headline": "Ready to ship your brand?",
      "buttonText": "Generate Assets Free",
      "url": "mytrimmy.vercel.app",
      "duration": 120
    }
  ],
  "style": "minimal",
  "totalDuration": 510
}
```

---

## Sources & References

- [Stripe: Improve Payment Experience with Animations](https://medium.com/bridge-collection/improve-the-payment-experience-with-animations-3d1b0a9b810e)
- [Vercel: Designing the Virtual Product Tour](https://vercel.com/blog/designing-the-vercel-virtual-product-tour)
- [Remotion: Animation Properties](https://www.remotion.dev/docs/animating-properties)
- [Remotion: Spring Animations](https://www.remotion.dev/docs/spring)
- [Remotion: TransitionSeries](https://www.remotion.dev/docs/transitions/)
- [Josh Comeau: Springs and Bounces](https://www.joshwcomeau.com/animation/linear-timing-function/)
- [Emil Kowalski: Great Animations](https://emilkowal.ski/ui/great-animations)
