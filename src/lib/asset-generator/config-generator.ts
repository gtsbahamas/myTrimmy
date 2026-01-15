/**
 * Config Generator
 *
 * Generates configuration files for the asset bundle:
 * - manifest.json (PWA)
 * - browserconfig.xml (Microsoft)
 * - README.md (documentation with HTML snippet)
 * - Framework-specific code (Next.js, Expo, HTML)
 */

import type { ValidatedAssetBundleInput } from '@/lib/validation/asset-bundle';

// =============================================================================
// FRAMEWORK CODE GENERATORS
// =============================================================================

/**
 * Generate Next.js App Router icon.tsx file content.
 * This creates a dynamic favicon using Next.js image generation.
 */
export function generateNextJsIcon(config: ValidatedAssetBundleInput): string {
  return `import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '${config.backgroundColor}',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '${config.themeColor}',
          borderRadius: 6,
        }}
      >
        {/* Replace with your logo SVG or text */}
        ${config.appName.charAt(0).toUpperCase()}
      </div>
    ),
    {
      ...size,
    }
  );
}
`;
}

/**
 * Generate Next.js App Router apple-icon.tsx file content.
 */
export function generateNextJsAppleIcon(config: ValidatedAssetBundleInput): string {
  return `import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: '${config.backgroundColor}',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '${config.themeColor}',
          borderRadius: 36,
        }}
      >
        {/* Replace with your logo SVG or text */}
        ${config.appName.charAt(0).toUpperCase()}
      </div>
    ),
    {
      ...size,
    }
  );
}
`;
}

/**
 * Generate Next.js metadata configuration.
 */
export function generateNextJsMetadata(config: ValidatedAssetBundleInput): string {
  return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${config.appName}',
  description: '${config.description || config.appName}',
  manifest: '/manifest.json',
  themeColor: '${config.themeColor}',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '${config.appName}',
  },
  openGraph: {
    title: '${config.appName}',
    description: '${config.description || config.appName}',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '${config.appName}',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '${config.appName}',
    description: '${config.description || config.appName}',
    images: ['/twitter-card.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};
`;
}

/**
 * Generate Expo app.json icon configuration.
 */
export function generateExpoConfig(config: ValidatedAssetBundleInput): string {
  const appSlug = config.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return JSON.stringify(
    {
      expo: {
        name: config.appName,
        slug: appSlug,
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/ios/Icon-1024.png',
        userInterfaceStyle: 'automatic',
        splash: {
          image: './assets/web/icon-512x512.png',
          resizeMode: 'contain',
          backgroundColor: config.backgroundColor,
        },
        ios: {
          supportsTablet: true,
          bundleIdentifier: `com.${appSlug.replace(/-/g, '')}`,
        },
        android: {
          adaptiveIcon: {
            foregroundImage: './assets/android/mipmap-xxxhdpi/ic_launcher_foreground.png',
            backgroundColor: config.backgroundColor,
          },
          package: `com.${appSlug.replace(/-/g, '')}`,
        },
        web: {
          bundler: 'metro',
          favicon: './assets/web/favicon.ico',
        },
      },
    },
    null,
    2
  );
}

/**
 * Generate React Native/Expo app.config.js.
 */
export function generateExpoAppConfig(config: ValidatedAssetBundleInput): string {
  const appSlug = config.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return `export default {
  name: '${config.appName}',
  slug: '${appSlug}',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/ios/Icon-1024.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/web/icon-512x512.png',
    resizeMode: 'contain',
    backgroundColor: '${config.backgroundColor}',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.${appSlug.replace(/-/g, '')}',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android/mipmap-xxxhdpi/ic_launcher_foreground.png',
      backgroundColor: '${config.backgroundColor}',
    },
    package: 'com.${appSlug.replace(/-/g, '')}',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/web/favicon.ico',
  },
};
`;
}

/**
 * Generate HTML head snippet.
 */
export function generateHtmlHead(config: ValidatedAssetBundleInput): string {
  return `<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color -->
<meta name="theme-color" content="${config.themeColor}">
<meta name="msapplication-TileColor" content="${config.themeColor}">
<meta name="msapplication-config" content="/browserconfig.xml">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${config.appName}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${config.appName}">
<meta property="og:description" content="${config.description || config.appName}">
<meta property="og:image" content="/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${config.appName}">
<meta name="twitter:description" content="${config.description || config.appName}">
<meta name="twitter:image" content="/twitter-card.png">

<!-- LinkedIn -->
<meta property="og:image" content="/linkedin-share.png">
`;
}

/**
 * Generate PWA manifest.json content.
 */
export function generateManifest(config: ValidatedAssetBundleInput): string {
  const manifest = {
    name: config.appName,
    short_name: config.shortName || config.appName.slice(0, 12),
    description: config.description || '',
    start_url: config.startUrl,
    display: 'standalone',
    theme_color: config.themeColor,
    background_color: config.backgroundColor,
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/maskable-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate Microsoft browserconfig.xml content.
 */
export function generateBrowserconfig(config: ValidatedAssetBundleInput): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>${config.themeColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
}

/**
 * Generate README.md with HTML snippet and file documentation.
 */
export function generateReadme(config: ValidatedAssetBundleInput): string {
  return `# ${config.appName} - App Assets

Generated by Iconym — The last mile for your brand

## HTML Snippet

Add this to your \`<head>\` section:

\`\`\`html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color -->
<meta name="theme-color" content="${config.themeColor}">
<meta name="msapplication-TileColor" content="${config.themeColor}">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Open Graph -->
<meta property="og:image" content="/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="/twitter-card.png">
\`\`\`

## Included Files

### Favicons
- \`favicon.ico\` - Multi-resolution favicon (16x16, 32x32, 48x48)
- \`favicon-16x16.png\` - Small favicon
- \`favicon-32x32.png\` - Standard favicon
- \`favicon-48x48.png\` - Large favicon

### Apple Touch Icons
- \`apple-touch-icon.png\` (180x180) - Default iOS home screen
- \`apple-touch-icon-152x152.png\` - iPad
- \`apple-touch-icon-120x120.png\` - iPhone retina

### PWA Icons
- \`icon-192x192.png\` - Standard PWA icon
- \`icon-512x512.png\` - Large PWA icon / splash screen
- \`maskable-icon-192x192.png\` - Adaptive icon with safe zone
- \`maskable-icon-512x512.png\` - Large adaptive icon with safe zone

### Social Media
- \`og-image.png\` (1200x630) - Open Graph image (Facebook, LinkedIn, iMessage)
- \`twitter-card.png\` (1200x600) - Twitter card image

### Microsoft
- \`mstile-150x150.png\` - Windows Start tile

### Config Files
- \`manifest.json\` - PWA web app manifest
- \`browserconfig.xml\` - Microsoft browser configuration

## Installation

1. Copy all files to your \`public/\` directory (or equivalent static folder)
2. Add the HTML snippet above to your \`<head>\`
3. Update any paths if you placed files in a subdirectory

## Customization

If you need different background colors for social images, or custom theme colors, regenerate the bundle with updated settings.
`;
}
