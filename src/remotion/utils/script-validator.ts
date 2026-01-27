// src/remotion/utils/script-validator.ts
// Validates video scripts against Promo Video Mastery skill guidelines

import type { VideoScript, VideoScene } from '@/types/video-bundle';
import {
  DURATION_GUIDELINES,
  SCENE_DURATIONS,
  HOOK_WINDOW_FRAMES,
  MAX_FEATURES,
  STRUCTURE_RULES,
} from '../skill-config';
import { FPS } from './timing';

export interface ValidationWarning {
  level: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  scene?: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  score: number; // 0-100
}

/**
 * Validate a video script against skill guidelines
 * Call this before rendering to catch issues early
 */
export function validateScript(script: VideoScript): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Calculate total duration
  const totalDuration = script.scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalSeconds = totalDuration / FPS;

  // 1. Check total duration
  if (totalDuration < DURATION_GUIDELINES.saasExplainer.min) {
    warnings.push({
      level: 'warning',
      rule: 'duration-too-short',
      message: `Video is ${totalSeconds.toFixed(1)}s - consider extending to at least 60s for better engagement`,
    });
  } else if (totalDuration > DURATION_GUIDELINES.saasExplainer.max) {
    warnings.push({
      level: 'warning',
      rule: 'duration-too-long',
      message: `Video is ${totalSeconds.toFixed(1)}s - consider trimming to under 120s to maintain attention`,
    });
  }

  // 2. Check hook window (first 15 seconds must grab attention)
  const introScene = script.scenes.find(s => s.type === 'intro');
  if (introScene) {
    const introDuration = introScene.duration || SCENE_DURATIONS.intro.ideal;
    if (introDuration > HOOK_WINDOW_FRAMES) {
      warnings.push({
        level: 'warning',
        rule: 'intro-too-long',
        message: `Intro is ${(introDuration / FPS).toFixed(1)}s - hook should complete within 15s`,
      });
    }
  } else {
    warnings.push({
      level: 'info',
      rule: 'no-intro',
      message: 'No intro scene - consider adding a hook to grab attention',
    });
  }

  // 3. Check for CTA
  const ctaScene = script.scenes.find(s => s.type === 'cta');
  if (!ctaScene && STRUCTURE_RULES.requiresCta) {
    warnings.push({
      level: 'error',
      rule: 'missing-cta',
      message: 'No CTA scene - every video needs a clear call to action',
    });
  }

  // 4. Check feature count
  const featureScenes = script.scenes.filter(s => s.type === 'feature');
  if (featureScenes.length > MAX_FEATURES) {
    warnings.push({
      level: 'warning',
      rule: 'too-many-features',
      message: `${featureScenes.length} feature scenes - focus on ${MAX_FEATURES} max for clarity`,
    });
  }

  // 5. Validate individual scene durations
  script.scenes.forEach((scene, index) => {
    const duration = scene.duration || 0;
    const limits = SCENE_DURATIONS[scene.type as keyof typeof SCENE_DURATIONS];

    if (limits) {
      if (duration > 0 && duration < limits.min) {
        warnings.push({
          level: 'warning',
          rule: 'scene-too-short',
          message: `Scene ${index + 1} (${scene.type}) is ${(duration / FPS).toFixed(1)}s - minimum recommended is ${(limits.min / FPS).toFixed(1)}s`,
          scene: index,
        });
      } else if (duration > limits.max) {
        warnings.push({
          level: 'info',
          rule: 'scene-too-long',
          message: `Scene ${index + 1} (${scene.type}) is ${(duration / FPS).toFixed(1)}s - consider trimming to ${(limits.max / FPS).toFixed(1)}s`,
          scene: index,
        });
      }
    }
  });

  // 6. Check for empty content
  script.scenes.forEach((scene, index) => {
    if (scene.type === 'intro' && !scene.headline) {
      warnings.push({
        level: 'error',
        rule: 'empty-intro',
        message: `Scene ${index + 1} (intro) has no headline`,
        scene: index,
      });
    }
    if (scene.type === 'feature' && !scene.title && !scene.description) {
      warnings.push({
        level: 'error',
        rule: 'empty-feature',
        message: `Scene ${index + 1} (feature) has no title or description`,
        scene: index,
      });
    }
    if (scene.type === 'cta' && !scene.headline && !scene.buttonText) {
      warnings.push({
        level: 'error',
        rule: 'empty-cta',
        message: `Scene ${index + 1} (cta) has no headline or button text`,
        scene: index,
      });
    }
    if (scene.type === 'stats') {
      const statsScene = scene as { items?: Array<{ value: string; label: string }> };
      if (!statsScene.items || statsScene.items.length === 0) {
        warnings.push({
          level: 'error',
          rule: 'empty-stats',
          message: `Scene ${index + 1} (stats) has no stat items`,
          scene: index,
        });
      }
    }
  });

  // Calculate score
  const errorCount = warnings.filter(w => w.level === 'error').length;
  const warningCount = warnings.filter(w => w.level === 'warning').length;
  const infoCount = warnings.filter(w => w.level === 'info').length;

  // Start at 100, deduct for issues
  let score = 100;
  score -= errorCount * 20;    // Errors are serious
  score -= warningCount * 10;  // Warnings matter
  score -= infoCount * 2;      // Info is minor
  score = Math.max(0, score);

  return {
    valid: errorCount === 0,
    warnings,
    score,
  };
}

/**
 * Format validation result for logging
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`\n=== Script Validation (Score: ${result.score}/100) ===\n`);

  if (result.warnings.length === 0) {
    lines.push('✓ All checks passed!\n');
  } else {
    const errors = result.warnings.filter(w => w.level === 'error');
    const warnings = result.warnings.filter(w => w.level === 'warning');
    const infos = result.warnings.filter(w => w.level === 'info');

    if (errors.length > 0) {
      lines.push('ERRORS:');
      errors.forEach(w => lines.push(`  ✗ ${w.message}`));
      lines.push('');
    }

    if (warnings.length > 0) {
      lines.push('WARNINGS:');
      warnings.forEach(w => lines.push(`  ⚠ ${w.message}`));
      lines.push('');
    }

    if (infos.length > 0) {
      lines.push('INFO:');
      infos.forEach(w => lines.push(`  ℹ ${w.message}`));
      lines.push('');
    }
  }

  lines.push(`Valid: ${result.valid ? 'YES' : 'NO'}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Quick check - returns true if script passes basic validation
 */
export function isValidScript(script: VideoScript): boolean {
  const result = validateScript(script);
  return result.valid;
}
