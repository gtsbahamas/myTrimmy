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
import { generateAsset } from './image-generator';
import { createIcoFile } from './ico-generator';
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
      // Generate iOS assets
      if (platforms.ios) {
        const iosResult = await generateIOSAssets(sourceBuffer);
        for (const asset of iosResult.assets) {
          archive.append(asset.buffer, { name: asset.filename });
        }
        // Add iOS Contents.json
        archive.append(generateIOSContentsJson(), {
          name: 'ios/AppIcon.appiconset/Contents.json',
        });
        (counts as { ios: number }).ios = iosResult.assetCount;
      }

      // Generate Android assets
      if (platforms.android) {
        const androidResult = await generateAndroidAssets(
          sourceBuffer,
          config.backgroundColor
        );
        for (const asset of androidResult.assets) {
          archive.append(asset.buffer, { name: asset.filename });
        }
        // Add Android config files
        archive.append(generateAdaptiveIconXml(config.backgroundColor), {
          name: 'android/mipmap-anydpi-v26/ic_launcher.xml',
        });
        archive.append(generateAdaptiveRoundIconXml(), {
          name: 'android/mipmap-anydpi-v26/ic_launcher_round.xml',
        });
        archive.append(generateColorsXml(config.backgroundColor), {
          name: 'android/values/colors.xml',
        });
        (counts as { android: number }).android = androidResult.assetCount;
      }

      // Generate Web assets
      if (platforms.web) {
        const webSpecs = WEB_ASSETS;
        for (const spec of webSpecs) {
          let buffer: Buffer;

          if (spec.format === 'ico') {
            buffer = await createIcoFile(sourceBuffer);
          } else {
            buffer = await generateAsset(
              sourceBuffer,
              spec,
              config.backgroundColor
            );
          }

          archive.append(buffer, { name: spec.filename });
        }
        // Add web config files
        archive.append(generateManifest(config), { name: 'web/manifest.json' });
        archive.append(generateBrowserconfig(config), {
          name: 'web/browserconfig.xml',
        });
        (counts as { web: number }).web = webSpecs.length;
      }

      // Generate Social assets
      if (platforms.social) {
        const socialSpecs = SOCIAL_ASSETS;
        for (const spec of socialSpecs) {
          const buffer = await generateAsset(
            sourceBuffer,
            spec,
            config.backgroundColor
          );
          archive.append(buffer, { name: spec.filename });
        }
        (counts as { social: number }).social = socialSpecs.length;
      }

      // Calculate total
      (counts as { total: number }).total =
        counts.ios + counts.android + counts.web + counts.social;

      // Add README
      archive.append(generateReadmeWithPlatforms(config, platforms, counts), {
        name: 'README.md',
      });

      // Add framework code snippets
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

      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate README with platform-specific information.
 */
function generateReadmeWithPlatforms(
  config: ValidatedAssetBundleInput,
  platforms: PlatformSelection,
  counts: PlatformAssetCounts
): string {
  let readme = `# ${config.appName} Brand Assets

Generated by Iconym - The last mile for your brand.

## Asset Summary

| Platform | Assets |
|----------|--------|
`;

  if (platforms.ios) {
    readme += `| iOS | ${counts.ios} icons |\n`;
  }
  if (platforms.android) {
    readme += `| Android | ${counts.android} icons |\n`;
  }
  if (platforms.web) {
    readme += `| Web/PWA | ${counts.web} assets |\n`;
  }
  if (platforms.social) {
    readme += `| Social | ${counts.social} images |\n`;
  }

  readme += `| **Total** | **${counts.total} files** |\n\n`;

  if (platforms.ios) {
    readme += `## iOS Setup

1. Open your Xcode project
2. Navigate to Assets.xcassets
3. Delete existing AppIcon.appiconset (if any)
4. Drag the \`ios/AppIcon.appiconset\` folder into Assets.xcassets

`;
  }

  if (platforms.android) {
    readme += `## Android Setup

1. Copy the \`android/mipmap-*\` folders to \`app/src/main/res/\`
2. Copy \`android/values/colors.xml\` to \`app/src/main/res/values/\`
3. The adaptive icon XML files go in \`mipmap-anydpi-v26/\`

`;
  }

  if (platforms.web) {
    readme += `## Web Setup

Add to your HTML \`<head>\`:

\`\`\`html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="${config.themeColor}">
\`\`\`

`;
  }

  if (platforms.social) {
    readme += `## Social Media

Add to your HTML \`<head>\`:

\`\`\`html
<meta property="og:image" content="/og-image.png">
<meta name="twitter:image" content="/twitter-card.png">
\`\`\`

`;
  }

  readme += `---
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
