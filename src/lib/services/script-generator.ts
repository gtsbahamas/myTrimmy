// src/lib/services/script-generator.ts

import Anthropic from '@anthropic-ai/sdk';
import type {
  VideoScript,
  VideoScene,
  IntroScene,
  FeatureScene,
  StatsScene,
  ScreenshotScene,
  CtaScene,
  VideoStyle,
  MusicMood,
  SiteAnalysis,
  ColorPalette,
} from '@/types/video-bundle';

// ============================================
// Configuration
// ============================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FPS = 30;

// ============================================
// Types
// ============================================

export interface GenerateScriptParams {
  siteAnalysis: SiteAnalysis;
  style: VideoStyle;
  musicMood: MusicMood;
  durationSeconds: number;
}

export interface ScriptGenerationResult {
  script: VideoScript;
  rawResponse: string;
}

// ============================================
// Style Configuration
// ============================================

interface StyleConfig {
  introScene: {
    durationFrames: number;
    description: string;
  };
  featureScene: {
    durationFrames: number;
    description: string;
  };
  statsScene: {
    durationFrames: number;
    description: string;
  };
  screenshotScene: {
    durationFrames: number;
    description: string;
  };
  ctaScene: {
    durationFrames: number;
    description: string;
  };
}

const STYLE_CONFIGS: Record<VideoStyle, StyleConfig> = {
  minimal: {
    introScene: {
      durationFrames: 4 * FPS, // 4 seconds
      description: 'Clean fade in with subtle motion',
    },
    featureScene: {
      durationFrames: 4 * FPS,
      description: 'Gentle text reveal with soft transitions',
    },
    statsScene: {
      durationFrames: 4 * FPS,
      description: 'Numbers counting up with elegant typography',
    },
    screenshotScene: {
      durationFrames: 5 * FPS,
      description: 'Subtle ken-burns effect, minimal overlay',
    },
    ctaScene: {
      durationFrames: 4 * FPS,
      description: 'Clean fade with focused call-to-action',
    },
  },
  energetic: {
    introScene: {
      durationFrames: 3 * FPS, // 3 seconds - faster
      description: 'Dynamic zoom with punchy motion',
    },
    featureScene: {
      durationFrames: 3 * FPS,
      description: 'Quick cuts with bold text animations',
    },
    statsScene: {
      durationFrames: 3 * FPS,
      description: 'Fast counter animations with impact',
    },
    screenshotScene: {
      durationFrames: 4 * FPS,
      description: 'Quick zoom and pan with dynamic overlay',
    },
    ctaScene: {
      durationFrames: 3 * FPS,
      description: 'Energetic pulse animation on CTA',
    },
  },
  professional: {
    introScene: {
      durationFrames: 5 * FPS, // 5 seconds - more deliberate
      description: 'Sophisticated reveal with cinematic feel',
    },
    featureScene: {
      durationFrames: 5 * FPS,
      description: 'Smooth glides with premium typography',
    },
    statsScene: {
      durationFrames: 5 * FPS,
      description: 'Elegant counter with business-appropriate styling',
    },
    screenshotScene: {
      durationFrames: 6 * FPS,
      description: 'Slow, confident pan with depth of field effect',
    },
    ctaScene: {
      durationFrames: 5 * FPS,
      description: 'Refined closing with strong branding',
    },
  },
};

// ============================================
// Prompt Templates
// ============================================

function buildSystemPrompt(style: VideoStyle): string {
  const styleConfig = STYLE_CONFIGS[style];

  return `You are an expert video script writer for promotional videos. You create compelling, professional video scripts that convert viewers into users.

Your task is to generate a JSON video script based on the provided site analysis.

## Style Guidelines for "${style}" videos:
- Intro: ${styleConfig.introScene.description}
- Features: ${styleConfig.featureScene.description}
- Stats: ${styleConfig.statsScene.description}
- Screenshots: ${styleConfig.screenshotScene.description}
- CTA: ${styleConfig.ctaScene.description}

## Output Format

You MUST return a valid JSON object with this exact structure:

\`\`\`json
{
  "scenes": [
    {
      "type": "intro",
      "duration": 120,
      "headline": "Short punchy headline",
      "logoUrl": null
    },
    {
      "type": "feature",
      "duration": 120,
      "title": "Feature Name",
      "description": "One sentence description",
      "screenshot": null
    },
    {
      "type": "stats",
      "duration": 90,
      "items": [
        { "label": "Metric Label", "value": "50+" }
      ]
    },
    {
      "type": "screenshot",
      "duration": 150,
      "imageUrl": "https://...",
      "caption": "Optional caption"
    },
    {
      "type": "cta",
      "duration": 120,
      "headline": "Final call to action",
      "buttonText": "Get Started",
      "url": "https://..."
    }
  ]
}
\`\`\`

## Rules:
1. Duration is in FRAMES (30 fps). 30 frames = 1 second.
2. Keep headlines punchy (under 10 words)
3. Feature descriptions should be one sentence
4. Use stats if available, otherwise skip the stats scene
5. Include at least one screenshot scene if screenshots are provided
6. Always end with a CTA scene
7. Total duration should match the requested duration (±10%)
8. Order scenes logically: intro → features/stats → screenshots → cta

Return ONLY the JSON object, no explanation or markdown fencing.`;
}

function buildUserPrompt(params: GenerateScriptParams): string {
  const { siteAnalysis, style, durationSeconds } = params;
  const targetFrames = durationSeconds * FPS;

  return `Create a ${durationSeconds}-second (${targetFrames} frames) promotional video script in the "${style}" style.

## Site Analysis:

**Type:** ${siteAnalysis.siteType}

**Content:**
- Headline: "${siteAnalysis.content.headline}"
- Subheadline: "${siteAnalysis.content.subheadline || 'None'}"
- Features: ${JSON.stringify(siteAnalysis.content.features)}
- Stats: ${JSON.stringify(siteAnalysis.content.stats)}
- CTA: "${siteAnalysis.content.cta}"

**Logo:** ${siteAnalysis.logoUrl || 'None detected'}

**Screenshots:**
- Full page: ${siteAnalysis.screenshots.full || 'None'}
- Section screenshots: ${JSON.stringify(siteAnalysis.screenshots.sections)}

**Colors:**
- Primary: ${siteAnalysis.colors.primary}
- Secondary: ${siteAnalysis.colors.secondary}
- Accent: ${siteAnalysis.colors.accent}

Generate the video script JSON now.`;
}

// ============================================
// Script Generation
// ============================================

/**
 * Generate a video script using Claude
 */
export async function generateVideoScript(
  params: GenerateScriptParams
): Promise<ScriptGenerationResult> {
  const { siteAnalysis, style, musicMood, durationSeconds } = params;

  console.log(`[script-generator] Generating script: style=${style}, duration=${durationSeconds}s`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: buildSystemPrompt(style),
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(params),
      },
    ],
  });

  // Extract text content from response
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  const rawResponse = textContent.text;
  console.log(`[script-generator] Received response: ${rawResponse.substring(0, 200)}...`);

  // Parse the JSON response
  let parsedScript: { scenes: Array<Record<string, unknown>> };
  try {
    // Try to extract JSON from the response (in case it includes markdown)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    parsedScript = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[script-generator] Failed to parse script JSON:', error);
    throw new Error('Failed to parse video script from Claude response');
  }

  // Validate and transform the script
  const scenes = parseScenes(parsedScript.scenes, siteAnalysis);
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  const script: VideoScript = {
    scenes,
    style,
    musicMood,
    totalDuration,
    colors: siteAnalysis.colors,
    logoUrl: siteAnalysis.logoUrl,
  };

  console.log(`[script-generator] Generated script with ${scenes.length} scenes, total duration: ${totalDuration / FPS}s`);

  return {
    script,
    rawResponse,
  };
}

/**
 * Parse and validate scenes from Claude's response
 */
function parseScenes(
  rawScenes: Array<Record<string, unknown>>,
  siteAnalysis: SiteAnalysis
): VideoScene[] {
  const scenes: VideoScene[] = [];

  for (const raw of rawScenes) {
    const type = raw.type as string;
    const duration = typeof raw.duration === 'number' ? raw.duration : 120;

    switch (type) {
      case 'intro':
        scenes.push({
          type: 'intro',
          duration,
          headline: String(raw.headline || siteAnalysis.content.headline),
          logoUrl: siteAnalysis.logoUrl,
        } satisfies IntroScene);
        break;

      case 'feature':
        scenes.push({
          type: 'feature',
          duration,
          title: String(raw.title || ''),
          description: String(raw.description || ''),
          screenshot: typeof raw.screenshot === 'string' ? raw.screenshot : null,
        } satisfies FeatureScene);
        break;

      case 'stats':
        if (Array.isArray(raw.items) && raw.items.length > 0) {
          scenes.push({
            type: 'stats',
            duration,
            items: raw.items.map((item: unknown) => {
              const i = item as Record<string, unknown>;
              return {
                label: String(i.label || ''),
                value: String(i.value || ''),
              };
            }),
          } satisfies StatsScene);
        }
        break;

      case 'screenshot':
        scenes.push({
          type: 'screenshot',
          duration,
          imageUrl: String(raw.imageUrl || siteAnalysis.screenshots.full),
          caption: typeof raw.caption === 'string' ? raw.caption : null,
        } satisfies ScreenshotScene);
        break;

      case 'cta':
        scenes.push({
          type: 'cta',
          duration,
          headline: String(raw.headline || siteAnalysis.content.cta),
          buttonText: String(raw.buttonText || 'Get Started'),
          url: String(raw.url || ''),
        } satisfies CtaScene);
        break;
    }
  }

  // Ensure we have at least intro and cta
  if (scenes.length === 0 || scenes[0].type !== 'intro') {
    scenes.unshift({
      type: 'intro',
      duration: 4 * FPS,
      headline: siteAnalysis.content.headline,
      logoUrl: siteAnalysis.logoUrl,
    });
  }

  const lastScene = scenes[scenes.length - 1];
  if (lastScene.type !== 'cta') {
    scenes.push({
      type: 'cta',
      duration: 4 * FPS,
      headline: siteAnalysis.content.cta,
      buttonText: 'Get Started',
      url: '',
    });
  }

  return scenes;
}

// ============================================
// Fallback Script Generation (if Claude fails)
// ============================================

/**
 * Generate a simple fallback script without AI
 * Used when Claude API is unavailable or fails
 */
export function generateFallbackScript(params: GenerateScriptParams): VideoScript {
  const { siteAnalysis, style, musicMood, durationSeconds } = params;
  const styleConfig = STYLE_CONFIGS[style];

  console.log('[script-generator] Using fallback script generation');

  const scenes: VideoScene[] = [];
  let remainingFrames = durationSeconds * FPS;

  // Intro scene
  scenes.push({
    type: 'intro',
    duration: styleConfig.introScene.durationFrames,
    headline: siteAnalysis.content.headline,
    logoUrl: siteAnalysis.logoUrl,
  });
  remainingFrames -= styleConfig.introScene.durationFrames;

  // Feature scenes (up to 3)
  const features = siteAnalysis.content.features.slice(0, 3);
  for (const feature of features) {
    if (remainingFrames < styleConfig.featureScene.durationFrames + styleConfig.ctaScene.durationFrames) {
      break;
    }
    scenes.push({
      type: 'feature',
      duration: styleConfig.featureScene.durationFrames,
      title: feature,
      description: '',
      screenshot: null,
    });
    remainingFrames -= styleConfig.featureScene.durationFrames;
  }

  // Stats scene (if we have stats)
  if (siteAnalysis.content.stats.length > 0 && remainingFrames >= styleConfig.statsScene.durationFrames + styleConfig.ctaScene.durationFrames) {
    scenes.push({
      type: 'stats',
      duration: styleConfig.statsScene.durationFrames,
      items: siteAnalysis.content.stats.slice(0, 4).map(stat => {
        const parts = stat.split(':');
        return {
          label: parts[0] || stat,
          value: parts[1] || '',
        };
      }),
    });
    remainingFrames -= styleConfig.statsScene.durationFrames;
  }

  // Screenshot scene (if we have a screenshot)
  if (siteAnalysis.screenshots.full && remainingFrames >= styleConfig.screenshotScene.durationFrames + styleConfig.ctaScene.durationFrames) {
    scenes.push({
      type: 'screenshot',
      duration: styleConfig.screenshotScene.durationFrames,
      imageUrl: siteAnalysis.screenshots.full,
      caption: null,
    });
    remainingFrames -= styleConfig.screenshotScene.durationFrames;
  }

  // CTA scene (always)
  scenes.push({
    type: 'cta',
    duration: Math.max(styleConfig.ctaScene.durationFrames, remainingFrames),
    headline: siteAnalysis.content.cta,
    buttonText: 'Get Started',
    url: '',
  });

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  return {
    scenes,
    style,
    musicMood,
    totalDuration,
    colors: siteAnalysis.colors,
    logoUrl: siteAnalysis.logoUrl,
  };
}
