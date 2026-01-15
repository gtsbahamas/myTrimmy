/**
 * Bundle Creator
 *
 * Orchestrates asset generation and creates a ZIP bundle.
 * Uses archiver for efficient streaming ZIP creation.
 */

import archiver from 'archiver';
import { ASSET_BUNDLE_SPEC } from '@/types/asset-bundle';
import type { ValidatedAssetBundleInput } from '@/lib/validation/asset-bundle';
import { generateAsset } from './image-generator';
import { createIcoFile } from './ico-generator';
import {
  generateManifest,
  generateBrowserconfig,
  generateReadme,
} from './config-generator';

/**
 * Create a complete asset bundle as a ZIP file.
 *
 * @param sourceBuffer - The source logo image buffer (512x512+)
 * @param config - Validated configuration (app name, colors, etc.)
 * @returns Buffer containing the ZIP file
 */
export async function createAssetBundle(
  sourceBuffer: Buffer,
  config: ValidatedAssetBundleInput
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    try {
      // Generate and add each image asset
      for (const spec of ASSET_BUNDLE_SPEC) {
        let buffer: Buffer;

        if (spec.format === 'ico') {
          // Special handling for ICO files
          buffer = await createIcoFile(sourceBuffer);
        } else {
          // Standard image generation
          buffer = await generateAsset(
            sourceBuffer,
            spec,
            config.backgroundColor
          );
        }

        archive.append(buffer, { name: spec.filename });
      }

      // Add configuration files
      archive.append(generateManifest(config), { name: 'manifest.json' });
      archive.append(generateBrowserconfig(config), { name: 'browserconfig.xml' });
      archive.append(generateReadme(config), { name: 'README.md' });

      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get total asset count (images + config files).
 */
export function getAssetCount(): number {
  // 15 images + 3 config files
  return ASSET_BUNDLE_SPEC.length + 3;
}
