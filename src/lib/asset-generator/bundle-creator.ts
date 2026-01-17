/**
 * Bundle Creator
 *
 * Orchestrates asset generation and creates a ZIP bundle.
 * Uses archiver for efficient streaming ZIP creation.
 * Supports platform-specific generation (iOS, Android, Web, Social).
 */

import archiver from 'archiver';
import {
  getAssetsForPlatforms,
  DEFAULT_PLATFORM_SELECTION,
  IOS_ASSETS,
  ANDROID_ASSETS,
  WEB_ASSETS,
  SOCIAL_ASSETS,
  type PlatformSelection,
  type PlatformAssetCounts,
} from '@/types/asset-bundle';
import type { ValidatedAssetBundleInput } from '@/lib/validation/asset-bundle';
import { generateAsset, createLightDarkVariants } from './image-generator';
import { createIcoFile } from './ico-generator';
import sharp from 'sharp';
import {
  generateManifest,
  generateBrowserconfig,
  generateReadme,
  generateNextJsIcon,
  generateNextJsAppleIcon,
  generateNextJsMetadata,
  generateExpoConfig,
  generateExpoAppConfig,
  generateHtmlHead,
} from './config-generator';
import { generateIOSAssets, generateIOSContentsJson } from './ios-generator';
import {
  generateAndroidAssets,
  generateAdaptiveIconXml,
  generateAdaptiveRoundIconXml,
  generateColorsXml,
} from './android-generator';

/** Bundle creation result with platform breakdown */
export interface BundleResult {
  readonly buffer: Buffer;
  readonly platformCounts: PlatformAssetCounts;
}

/** Mode variant for asset generation */
type ColorMode = 'light' | 'dark';

/**
 * Create a complete asset bundle as a ZIP file.
 *
 * @param sourceBuffer - The source logo image buffer (512x512+)
 * @param config - Validated configuration (app name, colors, etc.)
 * @returns Object with ZIP buffer and asset counts
 */
export async function createAssetBundle(
  sourceBuffer: Buffer,
  config: ValidatedAssetBundleInput
): Promise<Buffer> {
  const result = await createAssetBundleWithCounts(sourceBuffer, config);
  return result.buffer;
}

/**
 * Create a complete asset bundle with platform-specific counts.
 * Generates three variants: original, light-mode (transparent), dark-mode (inverted).
 */
export async function createAssetBundleWithCounts(
  sourceBuffer: Buffer,
  config: ValidatedAssetBundleInput
): Promise<BundleResult> {
  const platforms = config.platforms || DEFAULT_PLATFORM_SELECTION;

  return new Promise(async (resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    const counts: PlatformAssetCounts = {
      ios: 0,
      android: 0,
      web: 0,
      social: 0,
      total: 0,
    };

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () =>
      resolve({
        buffer: Buffer.concat(chunks),
        platformCounts: counts,
      })
    );
    archive.on('error', reject);

    try {
      // =========================================================================
      // 1. Create light and dark mode variants
      // =========================================================================
      const { light: lightLogo, dark: darkLogo } = await createLightDarkVariants(sourceBuffer);

      // =========================================================================
      // 2. Add original logo
      // =========================================================================
      const originalPng = await sharp(sourceBuffer).png().toBuffer();
      archive.append(originalPng, { name: 'original/logo.png' });

      // =========================================================================
      // 3. Add light-mode transparent logo
      // =========================================================================
      archive.append(lightLogo, { name: 'light-mode/logo-transparent.png' });

      // =========================================================================
      // 4. Add dark-mode transparent logo
      // =========================================================================
      archive.append(darkLogo, { name: 'dark-mode/logo-transparent.png' });

      // =========================================================================
      // 5. Generate platform assets for BOTH light and dark modes
      // =========================================================================
      const modes: { mode: ColorMode; logo: Buffer; bgColor: string }[] = [
        { mode: 'light', logo: lightLogo, bgColor: '#ffffff' },
        { mode: 'dark', logo: darkLogo, bgColor: '#000000' },
      ];

      for (const { mode, logo, bgColor } of modes) {
        const modePrefix = `${mode}-mode`;

        // Generate iOS assets
        if (platforms.ios) {
          const iosResult = await generateIOSAssets(logo);
          for (const asset of iosResult.assets) {
            // Change path from ios/ to {mode}-mode/ios/
            const newPath = asset.filename.replace('ios/', `${modePrefix}/ios/`);
            archive.append(asset.buffer, { name: newPath });
          }
          archive.append(generateIOSContentsJson(), {
            name: `${modePrefix}/ios/AppIcon.appiconset/Contents.json`,
          });
          if (mode === 'light') {
            (counts as { ios: number }).ios = iosResult.assetCount;
          }
        }

        // Generate Android assets
        if (platforms.android) {
          const androidResult = await generateAndroidAssets(logo, bgColor);
          for (const asset of androidResult.assets) {
            const newPath = asset.filename.replace('android/', `${modePrefix}/android/`);
            archive.append(asset.buffer, { name: newPath });
          }
          archive.append(generateAdaptiveIconXml(bgColor), {
            name: `${modePrefix}/android/mipmap-anydpi-v26/ic_launcher.xml`,
          });
          archive.append(generateAdaptiveRoundIconXml(), {
            name: `${modePrefix}/android/mipmap-anydpi-v26/ic_launcher_round.xml`,
          });
          archive.append(generateColorsXml(bgColor), {
            name: `${modePrefix}/android/values/colors.xml`,
          });
          if (mode === 'light') {
            (counts as { android: number }).android = androidResult.assetCount;
          }
        }

        // Generate Web assets
        if (platforms.web) {
          const webSpecs = WEB_ASSETS;
          for (const spec of webSpecs) {
            let buffer: Buffer;

            if (spec.format === 'ico') {
              buffer = await createIcoFile(logo);
            } else {
              buffer = await generateAsset(logo, spec, bgColor);
            }

            const newPath = spec.filename.replace('web/', `${modePrefix}/web/`);
            archive.append(buffer, { name: newPath });
          }
          archive.append(generateManifest({ ...config, backgroundColor: bgColor }), {
            name: `${modePrefix}/web/manifest.json`,
          });
          archive.append(generateBrowserconfig({ ...config, backgroundColor: bgColor }), {
            name: `${modePrefix}/web/browserconfig.xml`,
          });
          if (mode === 'light') {
            (counts as { web: number }).web = webSpecs.length;
          }
        }

        // Generate Social assets
        if (platforms.social) {
          const socialSpecs = SOCIAL_ASSETS;
          for (const spec of socialSpecs) {
            const buffer = await generateAsset(logo, spec, bgColor);
            const newPath = spec.filename.replace('social/', `${modePrefix}/social/`);
            archive.append(buffer, { name: newPath });
          }
          if (mode === 'light') {
            (counts as { social: number }).social = socialSpecs.length;
          }
        }
      }

      // Calculate total (multiply by 2 for both modes, +3 for original/transparent logos)
      (counts as { total: number }).total =
        (counts.ios + counts.android + counts.web + counts.social) * 2 + 3;

      // =========================================================================
      // 6. Add README with new structure documentation
      // =========================================================================
      archive.append(generateReadmeWithModes(config, platforms, counts), {
        name: 'README.md',
      });

      // =========================================================================
      // 7. Add framework code snippets (in code/ folder)
      // =========================================================================
      archive.append(generateNextJsIcon(config), {
        name: 'code/nextjs/icon.tsx',
      });
      archive.append(generateNextJsAppleIcon(config), {
        name: 'code/nextjs/apple-icon.tsx',
      });
      archive.append(generateNextJsMetadata(config), {
        name: 'code/nextjs/metadata.ts',
      });
      archive.append(generateExpoConfig(config), {
        name: 'code/expo/app.json',
      });
      archive.append(generateExpoAppConfig(config), {
        name: 'code/expo/app.config.js',
      });
      archive.append(generateHtmlHead(config), {
        name: 'code/html/head.html',
      });

      // =========================================================================
      // 8. Add manifest.json for bundle metadata
      // =========================================================================
      archive.append(generateBundleManifest(config, counts), {
        name: 'manifest.json',
      });

      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate bundle manifest with all variants documented.
 */
function generateBundleManifest(
  config: ValidatedAssetBundleInput,
  counts: PlatformAssetCounts
): string {
  return JSON.stringify(
    {
      name: config.appName,
      generatedAt: new Date().toISOString(),
      generator: 'Iconym',
      variants: {
        original: {
          description: 'Original logo as uploaded',
          path: 'original/logo.png',
        },
        lightMode: {
          description: 'Transparent logo for light backgrounds',
          path: 'light-mode/',
          assets: counts,
        },
        darkMode: {
          description: 'Inverted transparent logo for dark backgrounds',
          path: 'dark-mode/',
          assets: counts,
        },
      },
      totalAssets: counts.total,
    },
    null,
    2
  );
}

/**
 * Generate README with light/dark mode structure documentation.
 */
function generateReadmeWithModes(
  config: ValidatedAssetBundleInput,
  platforms: PlatformSelection,
  counts: PlatformAssetCounts
): string {
  let readme = `# ${config.appName} Brand Assets

Generated by Iconym - The last mile for your brand.

## Bundle Structure

This bundle includes **three variants** of your logo:

\`\`\`
${config.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-assets.zip
├── original/
│   └── logo.png              # Original logo as uploaded
│
├── light-mode/               # For light/white backgrounds
│   ├── logo-transparent.png  # Transparent logo
│   ├── ios/                  # iOS app icons
│   ├── android/              # Android adaptive icons
│   ├── web/                  # Favicons, PWA icons
│   └── social/               # OG images, Twitter cards
│
├── dark-mode/                # For dark/black backgrounds
│   ├── logo-transparent.png  # Color-inverted transparent logo
│   ├── ios/                  # iOS app icons (dark variant)
│   ├── android/              # Android adaptive icons (dark variant)
│   ├── web/                  # Favicons, PWA icons (dark variant)
│   └── social/               # OG images, Twitter cards (dark variant)
│
├── code/                     # Framework code snippets
└── manifest.json             # Bundle metadata
\`\`\`

## Asset Summary

| Variant | Platform | Assets |
|---------|----------|--------|
`;

  if (platforms.ios) {
    readme += `| Light Mode | iOS | ${counts.ios} icons |\n`;
    readme += `| Dark Mode | iOS | ${counts.ios} icons |\n`;
  }
  if (platforms.android) {
    readme += `| Light Mode | Android | ${counts.android} icons |\n`;
    readme += `| Dark Mode | Android | ${counts.android} icons |\n`;
  }
  if (platforms.web) {
    readme += `| Light Mode | Web/PWA | ${counts.web} assets |\n`;
    readme += `| Dark Mode | Web/PWA | ${counts.web} assets |\n`;
  }
  if (platforms.social) {
    readme += `| Light Mode | Social | ${counts.social} images |\n`;
    readme += `| Dark Mode | Social | ${counts.social} images |\n`;
  }

  readme += `| **Total** | | **${counts.total} files** |\n\n`;

  readme += `## When to Use Each Variant

### Light Mode (\`light-mode/\`)
Use these assets when your app/website has a **light background** (white, light gray, etc.).
The logo has its original colors optimized for light backgrounds.

### Dark Mode (\`dark-mode/\`)
Use these assets when your app/website has a **dark background** (black, dark gray, etc.).
The logo colors are inverted so dark elements become light and remain visible.

## Quick Start

### iOS (Both Modes)
1. For light mode: Copy \`light-mode/ios/AppIcon.appiconset/\` to Assets.xcassets
2. For dark mode: Copy \`dark-mode/ios/AppIcon.appiconset/\` to a dark mode asset catalog

### Android (Both Modes)
1. For light mode: Copy \`light-mode/android/\` contents to \`app/src/main/res/\`
2. For dark mode: Use \`dark-mode/android/\` for dark theme resources

### Web (Automatic Dark Mode)
\`\`\`html
<!-- Light mode favicon (default) -->
<link rel="icon" href="/light-mode/web/favicon.ico">

<!-- Dark mode favicon (for prefers-color-scheme: dark) -->
<link rel="icon" href="/dark-mode/web/favicon.ico" media="(prefers-color-scheme: dark)">
\`\`\`

### PWA Manifest
Use \`light-mode/web/manifest.json\` as your base, and consider generating a separate
dark mode manifest if your PWA supports theme switching.

---
Generated at ${new Date().toISOString()}
`;

  return readme;
}


/**
 * Get total asset count for selected platforms.
 */
export function getAssetCount(platforms?: PlatformSelection): number {
  const selection = platforms || DEFAULT_PLATFORM_SELECTION;
  const assets = getAssetsForPlatforms(selection);
  // Add config files: 1 for iOS Contents.json, 3 for Android XMLs, 2 for Web configs, 1 README
  let configCount = 1; // README
  if (selection.ios) configCount += 1;
  if (selection.android) configCount += 3;
  if (selection.web) configCount += 2;
  return assets.length + configCount;
}
