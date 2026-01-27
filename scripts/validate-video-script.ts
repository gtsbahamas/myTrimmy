#!/usr/bin/env npx tsx
// scripts/validate-video-script.ts
// Validates a video script JSON against Promo Video Mastery skill guidelines
// Usage: npx tsx scripts/validate-video-script.ts <script.json>

import { readFileSync } from 'fs';
import { validateScript, formatValidationResult } from '../src/remotion/utils/script-validator';
import type { VideoScript } from '../src/types/video-bundle';

const args = process.argv.slice(2);

if (args.length === 0) {
  // Use default script from Root.tsx
  console.log('No script file provided. Validating default script...\n');

  const defaultScript: VideoScript = {
    scenes: [
      {
        type: 'intro',
        headline: 'One logo in, 50+ assets out',
        logoUrl: null,
        duration: 120,
      },
      {
        type: 'feature',
        title: 'The Last Mile for Your Brand',
        description: 'iOS icons • Android adaptive icons • Favicons • PWA assets • Social cards',
        screenshot: null,
        duration: 150,
      },
      {
        type: 'stats',
        items: [
          { value: '53', label: 'Assets Generated' },
          { value: '4', label: 'Platforms Covered' },
          { value: '<10s', label: 'Generation Time' },
        ],
        duration: 120,
      },
      {
        type: 'cta',
        headline: 'Ready to ship your brand?',
        buttonText: 'Generate Assets Free',
        url: 'mytrimmy.vercel.app',
        duration: 120,
      },
    ],
    style: 'minimal',
    musicMood: 'upbeat',
    totalDuration: 510,
    colors: {
      primary: '#3b82f6',
      secondary: '#f3f4f6',
      accent: '#10b981',
      background: '#0f0f23',
      text: '#ffffff',
    },
    logoUrl: null,
  };

  const result = validateScript(defaultScript);
  console.log(formatValidationResult(result));
  process.exit(result.valid ? 0 : 1);
}

// Load script from file
const scriptPath = args[0];
try {
  const scriptJson = readFileSync(scriptPath, 'utf-8');
  const script = JSON.parse(scriptJson) as VideoScript;

  console.log(`Validating: ${scriptPath}\n`);

  const result = validateScript(script);
  console.log(formatValidationResult(result));

  process.exit(result.valid ? 0 : 1);
} catch (error) {
  console.error(`Error loading script: ${error}`);
  process.exit(1);
}
