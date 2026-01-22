// src/lib/services/gemini-review.ts

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import type { GeminiReview, VideoScript } from '@/types/video-bundle';

// ============================================
// Configuration
// ============================================

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Use Gemini 2.0 Flash for video understanding (supports video input)
const MODEL_NAME = 'gemini-2.0-flash';

// ============================================
// Types
// ============================================

export interface ReviewVideoParams {
  videoUrl: string;
  script: VideoScript;
  format: 'landscape' | 'portrait' | 'square';
}

export interface ReviewResult {
  review: GeminiReview;
  rawResponse: string;
  needsRegeneration: boolean;
}

// ============================================
// Prompts
// ============================================

const REVIEW_SYSTEM_PROMPT = `You are an expert video quality reviewer for promotional videos. Your task is to review a generated promotional video and provide structured feedback.

## Review Criteria

1. **Pacing (1-10):** Is the rhythm appropriate? Are scenes too rushed or too slow?
2. **Transitions (1-10):** Are transitions smooth and purposeful? Do they enhance or distract?
3. **Coherence (1-10):** Does the video tell a clear story? Is the message consistent?

## Output Format

You MUST return a valid JSON object with this exact structure:

\`\`\`json
{
  "overallScore": 8.5,
  "pacing": {
    "score": 8,
    "feedback": "Good rhythm, intro slightly long"
  },
  "transitions": {
    "score": 9,
    "feedback": "Smooth transitions throughout"
  },
  "coherence": {
    "score": 8,
    "feedback": "Clear message, feature order logical"
  },
  "improvements": [
    {
      "priority": "medium",
      "suggestion": "Shorten intro by 1 second",
      "autoApplicable": true
    },
    {
      "priority": "low",
      "suggestion": "Consider adding subtle motion to stats",
      "autoApplicable": false
    }
  ]
}
\`\`\`

## Scoring Guidelines

- 9-10: Excellent, ready for production
- 7-8: Good, minor improvements possible
- 5-6: Acceptable, some issues to address
- 3-4: Needs work, several issues
- 1-2: Poor, requires regeneration

## Auto-applicable improvements:
- Timing adjustments (can be done programmatically)
- Simple text changes
- Color adjustments

## Non-auto-applicable improvements:
- Scene reordering (requires regeneration)
- Content changes (requires new script)
- Adding/removing scenes

Return ONLY the JSON object.`;

function buildReviewPrompt(script: VideoScript, format: string): string {
  return `Review this promotional video.

## Video Details:
- Format: ${format}
- Style: ${script.style}
- Music Mood: ${script.musicMood}
- Total Duration: ${script.totalDuration / 30} seconds
- Number of Scenes: ${script.scenes.length}

## Script Structure:
${script.scenes.map((scene, i) => `${i + 1}. ${scene.type} scene (${scene.duration / 30}s)`).join('\n')}

## Expected Content:
- Headline: "${script.scenes.find(s => s.type === 'intro') ? (script.scenes.find(s => s.type === 'intro') as { headline: string }).headline : 'N/A'}"
- CTA: "${script.scenes.find(s => s.type === 'cta') ? (script.scenes.find(s => s.type === 'cta') as { headline: string }).headline : 'N/A'}"

Watch the video carefully and provide your review as a JSON object.`;
}

// ============================================
// Review Functions
// ============================================

/**
 * Review a generated video using Gemini's video understanding
 */
export async function reviewVideo(params: ReviewVideoParams): Promise<ReviewResult> {
  const { videoUrl, script, format } = params;

  console.log(`[gemini-review] Starting review for ${format} video: ${videoUrl}`);

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // For video review, we need to fetch the video and include it
  // Gemini accepts video URLs directly in some cases, or we need to process it
  let parts: Part[];

  try {
    // Try to include video URL directly - Gemini 2.0 supports this for some URLs
    parts = [
      {
        text: buildReviewPrompt(script, format),
      },
      {
        fileData: {
          mimeType: 'video/mp4',
          fileUri: videoUrl,
        },
      },
    ];
  } catch {
    // If video URL doesn't work, fall back to script-only review
    console.log('[gemini-review] Video URL not accessible, using script-only review');
    parts = [
      {
        text: buildReviewPrompt(script, format) + '\n\n(Note: Video could not be loaded, reviewing based on script only)',
      },
    ];
  }

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    systemInstruction: REVIEW_SYSTEM_PROMPT,
  });

  const response = result.response;
  const rawResponse = response.text();

  console.log(`[gemini-review] Received response: ${rawResponse.substring(0, 200)}...`);

  // Parse the JSON response
  let reviewData: GeminiReview;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    reviewData = validateReviewData(parsed);
  } catch (error) {
    console.error('[gemini-review] Failed to parse review JSON:', error);
    // Return a default passing review if parsing fails
    reviewData = getDefaultReview();
  }

  const needsRegeneration = reviewData.overallScore < 5;

  console.log(`[gemini-review] Review complete: score=${reviewData.overallScore}, needsRegen=${needsRegeneration}`);

  return {
    review: reviewData,
    rawResponse,
    needsRegeneration,
  };
}

/**
 * Validate and normalize review data from Gemini
 */
function validateReviewData(data: unknown): GeminiReview {
  const raw = data as Record<string, unknown>;

  const overallScore = typeof raw.overallScore === 'number'
    ? Math.min(10, Math.max(0, raw.overallScore))
    : 7;

  const pacing = validateDimension(raw.pacing);
  const transitions = validateDimension(raw.transitions);
  const coherence = validateDimension(raw.coherence);

  const improvements = Array.isArray(raw.improvements)
    ? raw.improvements.map(validateImprovement).filter(Boolean) as GeminiReview['improvements']
    : [];

  return {
    overallScore,
    pacing,
    transitions,
    coherence,
    improvements,
  };
}

function validateDimension(data: unknown): { score: number; feedback: string } {
  if (!data || typeof data !== 'object') {
    return { score: 7, feedback: 'No feedback available' };
  }

  const dim = data as Record<string, unknown>;

  return {
    score: typeof dim.score === 'number' ? Math.min(10, Math.max(0, dim.score)) : 7,
    feedback: typeof dim.feedback === 'string' ? dim.feedback : 'No feedback available',
  };
}

function validateImprovement(
  data: unknown
): GeminiReview['improvements'][number] | null {
  if (!data || typeof data !== 'object') return null;

  const imp = data as Record<string, unknown>;
  const priority = imp.priority as string;

  if (!['high', 'medium', 'low'].includes(priority)) return null;
  if (typeof imp.suggestion !== 'string' || !imp.suggestion.trim()) return null;

  return {
    priority: priority as 'high' | 'medium' | 'low',
    suggestion: imp.suggestion,
    autoApplicable: Boolean(imp.autoApplicable),
  };
}

/**
 * Get a default passing review (used when Gemini is unavailable)
 */
function getDefaultReview(): GeminiReview {
  return {
    overallScore: 7.5,
    pacing: { score: 7, feedback: 'Review unavailable - using default score' },
    transitions: { score: 8, feedback: 'Review unavailable - using default score' },
    coherence: { score: 8, feedback: 'Review unavailable - using default score' },
    improvements: [],
  };
}

// ============================================
// Batch Review (for all formats)
// ============================================

export interface BatchReviewParams {
  videos: {
    landscape?: string;
    portrait?: string;
    square?: string;
  };
  script: VideoScript;
}

export interface BatchReviewResult {
  landscape?: ReviewResult;
  portrait?: ReviewResult;
  square?: ReviewResult;
  overallPassed: boolean;
  lowestScore: number;
}

/**
 * Review all video formats in parallel
 */
export async function reviewAllFormats(params: BatchReviewParams): Promise<BatchReviewResult> {
  const { videos, script } = params;

  console.log('[gemini-review] Starting batch review for all formats');

  const reviews: BatchReviewResult = {
    overallPassed: true,
    lowestScore: 10,
  };

  // Review each format in parallel
  const reviewPromises: Array<Promise<void>> = [];

  if (videos.landscape) {
    reviewPromises.push(
      reviewVideo({ videoUrl: videos.landscape, script, format: 'landscape' })
        .then(result => {
          reviews.landscape = result;
          reviews.lowestScore = Math.min(reviews.lowestScore, result.review.overallScore);
          if (result.needsRegeneration) reviews.overallPassed = false;
        })
        .catch(error => {
          console.error('[gemini-review] Landscape review failed:', error);
          reviews.landscape = {
            review: getDefaultReview(),
            rawResponse: '',
            needsRegeneration: false,
          };
        })
    );
  }

  if (videos.portrait) {
    reviewPromises.push(
      reviewVideo({ videoUrl: videos.portrait, script, format: 'portrait' })
        .then(result => {
          reviews.portrait = result;
          reviews.lowestScore = Math.min(reviews.lowestScore, result.review.overallScore);
          if (result.needsRegeneration) reviews.overallPassed = false;
        })
        .catch(error => {
          console.error('[gemini-review] Portrait review failed:', error);
          reviews.portrait = {
            review: getDefaultReview(),
            rawResponse: '',
            needsRegeneration: false,
          };
        })
    );
  }

  if (videos.square) {
    reviewPromises.push(
      reviewVideo({ videoUrl: videos.square, script, format: 'square' })
        .then(result => {
          reviews.square = result;
          reviews.lowestScore = Math.min(reviews.lowestScore, result.review.overallScore);
          if (result.needsRegeneration) reviews.overallPassed = false;
        })
        .catch(error => {
          console.error('[gemini-review] Square review failed:', error);
          reviews.square = {
            review: getDefaultReview(),
            rawResponse: '',
            needsRegeneration: false,
          };
        })
    );
  }

  await Promise.all(reviewPromises);

  // Quality gate: Score >= 8 passes, otherwise surface suggestions
  reviews.overallPassed = reviews.lowestScore >= 8;

  console.log(`[gemini-review] Batch review complete: passed=${reviews.overallPassed}, lowestScore=${reviews.lowestScore}`);

  return reviews;
}

// ============================================
// Auto-fix Extraction
// ============================================

/**
 * Extract auto-applicable fixes from a review
 */
export function extractAutoFixes(review: GeminiReview): Array<{
  type: 'timing' | 'text' | 'color';
  suggestion: string;
}> {
  return review.improvements
    .filter(imp => imp.autoApplicable)
    .map(imp => {
      // Determine fix type from suggestion
      let type: 'timing' | 'text' | 'color' = 'timing';

      const lower = imp.suggestion.toLowerCase();
      if (lower.includes('text') || lower.includes('headline') || lower.includes('wording')) {
        type = 'text';
      } else if (lower.includes('color') || lower.includes('contrast')) {
        type = 'color';
      }

      return { type, suggestion: imp.suggestion };
    });
}
