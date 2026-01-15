/**
 * Asset Generator
 *
 * Main export for the asset bundle generation library.
 * Generates iOS, Android, Web, and Social assets from a source logo.
 */

export { generateAsset, generateSquareAsset, generateMaskableAsset, generateSocialAsset, ensureSquare } from './image-generator';
export { createIcoFile } from './ico-generator';
export { generateManifest, generateBrowserconfig, generateReadme } from './config-generator';
export { createAssetBundle, createAssetBundleWithCounts, getAssetCount, type BundleResult } from './bundle-creator';
export { generateIOSAssets, generateIOSContentsJson, getIOSFolderStructure } from './ios-generator';
export { generateAndroidAssets, generateAdaptiveIconXml, generateColorsXml, getAndroidFolderStructure } from './android-generator';
