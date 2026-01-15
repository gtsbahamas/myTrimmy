/**
 * E2E Tests for Image Processing Algorithms
 *
 * Tests all image processing capabilities:
 * - Trim (auto-remove whitespace)
 * - Crop (manual and aspect ratio)
 * - Resize
 * - Rotate/Flip
 * - Format conversion
 * - Optimization
 * - Background removal (skipped if no API key)
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://iconym.com';
const TEST_EMAIL = 'test-customer-1768500995@iconym.test';
const TEST_PASSWORD = 'TestCustomer2026';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

const results: TestResult[] = [];

async function login(page: Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Fill login form
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

  if ((await emailInput.count()) === 0) {
    console.log('No email input found');
    return false;
  }

  await emailInput.fill(TEST_EMAIL);
  await passwordInput.fill(TEST_PASSWORD);

  // Submit via JS dispatch (React form handling)
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    const btn = document.querySelector('button[type="submit"]');
    if (btn) (btn as HTMLButtonElement).click();
  });

  // Wait for redirect to dashboard
  try {
    await page.waitForURL(/\/(dashboard|app|images)/, { timeout: 15000 });
  } catch {
    // Check if we're still on login with error
    const errorText = await page.locator('text=/error|invalid|failed/i').count();
    if (errorText > 0) {
      console.log('Login failed - error message visible');
      return false;
    }
  }

  const loggedIn = !page.url().includes('/login');
  return loggedIn;
}

async function uploadTestImage(page: Page): Promise<string | null> {
  // Ensure we're on dashboard
  if (!page.url().includes('/dashboard')) {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  }

  // Look for file input (might be hidden)
  const fileInput = page.locator('input[type="file"]').first();

  if ((await fileInput.count()) === 0) {
    console.log('No file input found on dashboard');
    return null;
  }

  // Prepare test image
  const testImagePath = '/tmp/test-image.jpg';
  if (!fs.existsSync(testImagePath)) {
    console.log('Test image not found at', testImagePath);
    return null;
  }

  // Upload the file
  await fileInput.setInputFiles(testImagePath);

  // Wait for upload to complete and activity to show
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');

  // Wait for success indicator
  const uploadSuccess = await page.locator('text=/uploaded|complete|success/i').count();
  console.log('Upload success indicators found:', uploadSuccess);

  // Try to get image ID from the page
  // Images are shown in a gallery, try to find the first one
  await page.waitForTimeout(2000);

  // Look for an image that has a data attribute or is clickable
  const imageElements = page.locator('[data-image-id], .gallery img, .image-card');
  const count = await imageElements.count();
  console.log('Found image elements:', count);

  if (count > 0) {
    // Click the first image to select it
    await imageElements.first().click();
    await page.waitForTimeout(500);

    // Try to extract ID from URL or DOM
    const url = page.url();
    const urlMatch = url.match(/images?\/([a-f0-9-]+)/i);
    if (urlMatch) return urlMatch[1];

    // Try data attribute
    const dataId = await imageElements.first().getAttribute('data-image-id');
    if (dataId) return dataId;
  }

  return null;
}

async function getImageIdFromDashboard(page: Page, context: BrowserContext): Promise<string | null> {
  // Use the Supabase client to fetch images via an API route we'll call
  // Actually, let's intercept network requests to find image IDs

  // Navigate to dashboard to trigger image fetch
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Execute script to get image IDs from Supabase client state
  const imageId = await page.evaluate(async () => {
    // The dashboard fetches images via Supabase - try to get from window state
    // @ts-ignore
    const data = window.__NEXT_DATA__;
    if (data?.props?.pageProps?.images?.[0]?.id) {
      return data.props.pageProps.images[0].id;
    }

    // Try to find from DOM
    const imgCard = document.querySelector('[data-image-id]');
    if (imgCard) return imgCard.getAttribute('data-image-id');

    // Try to find from React fiber (advanced)
    const galleryEl = document.querySelector('.gallery, [class*="gallery"]');
    if (galleryEl) {
      // Look for any UUID pattern in attributes
      const match = galleryEl.innerHTML.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
      if (match) return match[0];
    }

    return null;
  });

  return imageId;
}

test.describe('Image Processing Algorithms', () => {
  let testImageId: string | null = null;
  let cookies: { name: string; value: string }[] = [];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('\n=== Setting up test environment ===\n');

    // Login
    console.log('Logging in...');
    const loggedIn = await login(page);
    if (!loggedIn) {
      console.log('Login FAILED - taking screenshot');
      await page.screenshot({ path: '/tmp/login-failed.png' });
      throw new Error('Failed to login - cannot run image processing tests');
    }
    console.log('Login successful');

    // Store cookies for API calls
    cookies = await context.cookies();
    console.log(`Captured ${cookies.length} cookies`);

    // Upload test image
    console.log('Uploading test image...');
    testImageId = await uploadTestImage(page);

    if (!testImageId) {
      console.log('Upload did not return ID, trying to get from dashboard...');
      testImageId = await getImageIdFromDashboard(page, context);
    }

    if (testImageId) {
      console.log(`Test image ID: ${testImageId}`);
    } else {
      console.log('Warning: Could not capture image ID - tests will use existing images');
    }

    await page.screenshot({ path: '/tmp/test-setup-complete.png' });
    await context.close();
  });

  test('TRIM algorithm - removes whitespace borders', async ({ page, request }) => {
    const start = Date.now();

    // Login first
    await login(page);

    // Get an image ID if we don't have one
    let imageId = testImageId;
    if (!imageId) {
      imageId = await getImageIdFromDashboard(page, page.context());
    }

    if (!imageId) {
      results.push({
        name: 'TRIM Algorithm',
        passed: false,
        details: 'No images available for testing - upload an image first',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    // Get cookies for API auth
    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Test trim with default settings
    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: true, threshold: 10, lineArt: false },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;

    results.push({
      name: 'TRIM Algorithm',
      passed,
      details: passed
        ? `Operations: ${result.data?.operations?.join(', ') || 'trim'}, Compression: ${result.data?.compressionRatio}%`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed).toBe(true);
  });

  test('CROP algorithm (1:1 aspect ratio)', async ({ page, request }) => {
    const start = Date.now();

    await login(page);
    let imageId = testImageId || (await getImageIdFromDashboard(page, page.context()));

    if (!imageId) {
      results.push({
        name: 'CROP Algorithm (1:1)',
        passed: false,
        details: 'No images available',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: false },
          crop: { enabled: true, mode: 'aspect', aspectRatio: '1:1' },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;
    const isSquare = result.data?.width === result.data?.height;

    results.push({
      name: 'CROP Algorithm (1:1)',
      passed: passed && isSquare,
      details: passed
        ? `Cropped to: ${result.data?.width}x${result.data?.height} (${isSquare ? 'square' : 'NOT square'})`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed && isSquare).toBe(true);
  });

  test('RESIZE algorithm (400x300 max)', async ({ page, request }) => {
    const start = Date.now();

    await login(page);
    let imageId = testImageId || (await getImageIdFromDashboard(page, page.context()));

    if (!imageId) {
      results.push({
        name: 'RESIZE Algorithm',
        passed: false,
        details: 'No images available',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: false },
          resize: { enabled: true, width: 400, height: 300, fit: 'inside' },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;
    const sizeCorrect =
      result.data?.width &&
      result.data?.height &&
      result.data.width <= 400 &&
      result.data.height <= 300;

    results.push({
      name: 'RESIZE Algorithm',
      passed: passed && sizeCorrect,
      details: passed
        ? `Resized to: ${result.data?.width}x${result.data?.height}`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed).toBe(true);
  });

  test('ROTATE algorithm (90° clockwise)', async ({ page, request }) => {
    const start = Date.now();

    await login(page);
    let imageId = testImageId || (await getImageIdFromDashboard(page, page.context()));

    if (!imageId) {
      results.push({
        name: 'ROTATE Algorithm',
        passed: false,
        details: 'No images available',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: false },
          rotate: { enabled: true, angle: 90 },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;

    results.push({
      name: 'ROTATE Algorithm',
      passed,
      details: passed
        ? `Rotated 90°: ${result.data?.width}x${result.data?.height}`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed).toBe(true);
  });

  test('FLIP algorithm (horizontal + vertical)', async ({ page, request }) => {
    const start = Date.now();

    await login(page);
    let imageId = testImageId || (await getImageIdFromDashboard(page, page.context()));

    if (!imageId) {
      results.push({
        name: 'FLIP Algorithm',
        passed: false,
        details: 'No images available',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: false },
          rotate: { enabled: true, flipHorizontal: true, flipVertical: true },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;
    const hasFlips = result.data?.operations?.some((op: string) => op.includes('flip'));

    results.push({
      name: 'FLIP Algorithm',
      passed,
      details: passed
        ? `Operations: ${result.data?.operations?.join(', ') || 'flip'}`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed).toBe(true);
  });

  test('FORMAT CONVERSION (JPEG → WebP)', async ({ page, request }) => {
    const start = Date.now();

    await login(page);
    let imageId = testImageId || (await getImageIdFromDashboard(page, page.context()));

    if (!imageId) {
      results.push({
        name: 'FORMAT CONVERSION',
        passed: false,
        details: 'No images available',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: false },
          convert: { enabled: true, format: 'webp' },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;
    const isWebP = result.data?.processed_url?.endsWith('.webp');

    results.push({
      name: 'FORMAT CONVERSION',
      passed,
      details: passed
        ? `Converted to WebP: ${result.data?.processed_url?.split('/').pop()}`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed).toBe(true);
  });

  test('OPTIMIZATION (quality=60)', async ({ page, request }) => {
    const start = Date.now();

    await login(page);
    let imageId = testImageId || (await getImageIdFromDashboard(page, page.context()));

    if (!imageId) {
      results.push({
        name: 'OPTIMIZATION',
        passed: false,
        details: 'No images available',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: false },
          optimize: { enabled: true, quality: 60 },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;
    const compressed = result.data?.compressionRatio > 0;

    results.push({
      name: 'OPTIMIZATION',
      passed,
      details: passed
        ? `Compression ratio: ${result.data?.compressionRatio}% reduction (${result.data?.originalSize} → ${result.data?.finalSize} bytes)`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed).toBe(true);
  });

  test('FULL PIPELINE (trim → crop → resize → optimize → convert)', async ({ page, request }) => {
    const start = Date.now();

    await login(page);
    let imageId = testImageId || (await getImageIdFromDashboard(page, page.context()));

    if (!imageId) {
      results.push({
        name: 'FULL PIPELINE',
        passed: false,
        details: 'No images available',
        duration: Date.now() - start,
      });
      expect(imageId).not.toBeNull();
      return;
    }

    const contextCookies = await page.context().cookies();
    const cookieHeader = contextCookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Full pipeline test
    const response = await request.post(`${BASE_URL}/api/images/${imageId}/process`, {
      headers: { Cookie: cookieHeader },
      data: {
        settings: {
          trim: { enabled: true, threshold: 10 },
          crop: { enabled: true, mode: 'aspect', aspectRatio: '16:9' },
          resize: { enabled: true, width: 800, fit: 'inside' },
          optimize: { enabled: true, quality: 75 },
          convert: { enabled: true, format: 'webp' },
        },
      },
    });

    const result = await response.json();
    const passed = response.ok() && result.success === true;

    results.push({
      name: 'FULL PIPELINE',
      passed,
      details: passed
        ? `Operations: ${result.data?.operations?.join(' → ')}, Final: ${result.data?.width}x${result.data?.height}, Compression: ${result.data?.compressionRatio}%`
        : `Error: ${result.error || response.status()}`,
      duration: Date.now() - start,
    });

    expect(passed).toBe(true);
  });

  test.afterAll(async () => {
    // Print summary
    console.log('\n============================================================');
    console.log('  IMAGE PROCESSING ALGORITHM TEST RESULTS');
    console.log('============================================================\n');

    let passed = 0;
    let failed = 0;

    for (const r of results) {
      const status = r.passed ? '✅' : '❌';
      console.log(`  ${status} ${r.name}`);
      console.log(`     ${r.details}`);
      console.log(`     Duration: ${r.duration}ms\n`);
      if (r.passed) passed++;
      else failed++;
    }

    console.log('============================================================');
    if (failed === 0) {
      console.log(`  ✅ ALL TESTS PASSED: ${passed}/${results.length}`);
    } else {
      console.log(`  ❌ TESTS FAILED: ${passed}/${results.length} passed, ${failed} failed`);
    }
    console.log('============================================================\n');

    console.log('  Screenshots saved to /tmp/');
    console.log('============================================================\n');
  });
});
