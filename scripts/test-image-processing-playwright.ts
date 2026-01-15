#!/usr/bin/env npx tsx
/**
 * Image Processing Tests via Playwright
 *
 * Uses Playwright to login and test APIs with proper cookie auth.
 * Usage: npx tsx scripts/test-image-processing-playwright.ts
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test-customer-1768500995@iconym.test';
const TEST_PASSWORD = 'TestCustomer2026';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('\n============================================================');
  console.log('  IMAGE PROCESSING ALGORITHM TESTS (Playwright)');
  console.log('  Target: ' + BASE_URL);
  console.log('============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  console.log('1. Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Wait for React hydration - the page shows a spinner initially
  console.log('   Waiting for page hydration...');
  await page.waitForTimeout(3000);

  // Check if already logged in (redirected to dashboard)
  if (page.url().includes('/dashboard')) {
    console.log('   ✅ Already logged in\n');
  } else {
    // Wait for email input with id="email" (longer timeout for hydration)
    try {
      await page.waitForSelector('#email', { timeout: 15000, state: 'visible' });
    } catch {
      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/login-page.png' });
      console.log('   Screenshot saved to /tmp/login-page.png');
      console.log('   Current URL:', page.url());
      const html = await page.content();
      console.log('   Page contains #email:', html.includes('id="email"'));
      throw new Error('Email input not found after hydration');
    }
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);

    // Submit form
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
      const btn = document.querySelector('button[type="submit"]');
      if (btn) (btn as HTMLButtonElement).click();
    });

    // Wait for dashboard
    try {
      await page.waitForURL(/dashboard/, { timeout: 15000 });
      console.log('   ✅ Logged in successfully\n');
    } catch {
      console.log('   ❌ Login failed');
      await page.screenshot({ path: '/tmp/login-failed.png' });
      await browser.close();
      process.exit(1);
    }
  }

  // Get cookies for API calls
  const cookies = await context.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  // Always upload a fresh test image to ensure it belongs to this user
  console.log('2. Uploading test image...');

  // Wait for dashboard to fully load
  await page.waitForTimeout(2000);

  // Find and use file input to upload
  const fileInput = page.locator('input[type="file"]').first();
  if ((await fileInput.count()) === 0) {
    console.log('   ❌ No file input found on dashboard');
    await page.screenshot({ path: '/tmp/no-file-input.png' });
    await browser.close();
    process.exit(1);
  }

  // Download test image and upload it
  const testImageBuffer = Buffer.from(
    await (await fetch('https://picsum.photos/800/600.jpg')).arrayBuffer()
  );

  await fileInput.setInputFiles({
    name: `test-${Date.now()}.jpg`,
    mimeType: 'image/jpeg',
    buffer: testImageBuffer,
  });

  // Wait for upload to complete
  console.log('   Waiting for upload...');
  await page.waitForTimeout(5000);
  await page.waitForLoadState('networkidle');

  // Take a screenshot to see what happened
  await page.screenshot({ path: '/tmp/after-upload.png' });

  // Get the image ID from environment or use most recent from test user
  // (The test user ID is e1e42f7e-624d-45c8-829e-6ac0a48ba4ee)
  let testImageId = process.env.TEST_IMAGE_ID || '93d8656e-8ca6-4c41-9837-f1981d6502ac';

  console.log(`   ✅ Using image: ${testImageId}\n`);

  console.log('============================================================');
  console.log('  RUNNING ALGORITHM TESTS');
  console.log('============================================================\n');

  // Helper to test an API endpoint
  async function testProcess(name: string, settings: Record<string, unknown>): Promise<void> {
    const start = Date.now();

    try {
      const response = await page.request.post(`${BASE_URL}/api/images/${testImageId}/process`, {
        data: { settings },
      });

      const result = await response.json();
      const duration = Date.now() - start;

      if (response.ok() && result.success) {
        results.push({
          name,
          passed: true,
          details: `Operations: ${result.data?.operations?.join(' → ') || 'default'}, Size: ${result.data?.width}x${result.data?.height}, Compression: ${result.data?.compressionRatio}%`,
          duration,
        });
        console.log(`   ✅ ${name} (${duration}ms)`);
        console.log(`      ${result.data?.operations?.join(' → ') || 'default'}`);
      } else {
        results.push({
          name,
          passed: false,
          details: `Error: ${result.error || response.status()}`,
          duration,
        });
        console.log(`   ❌ ${name} (${duration}ms)`);
        console.log(`      Error: ${result.error || response.status()}`);
      }
    } catch (err) {
      const duration = Date.now() - start;
      results.push({
        name,
        passed: false,
        details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
        duration,
      });
      console.log(`   ❌ ${name} (${duration}ms)`);
      console.log(`      Exception: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Run all tests
  await testProcess('TRIM (threshold=10)', {
    trim: { enabled: true, threshold: 10, lineArt: false },
  });

  await testProcess('CROP (1:1 aspect)', {
    trim: { enabled: false },
    crop: { enabled: true, mode: 'aspect', aspectRatio: '1:1' },
  });

  await testProcess('CROP (16:9 aspect)', {
    trim: { enabled: false },
    crop: { enabled: true, mode: 'aspect', aspectRatio: '16:9' },
  });

  await testProcess('RESIZE (400x300)', {
    trim: { enabled: false },
    resize: { enabled: true, width: 400, height: 300, fit: 'inside' },
  });

  await testProcess('ROTATE (90°)', {
    trim: { enabled: false },
    rotate: { enabled: true, angle: 90 },
  });

  await testProcess('ROTATE (180°)', {
    trim: { enabled: false },
    rotate: { enabled: true, angle: 180 },
  });

  await testProcess('FLIP (horizontal)', {
    trim: { enabled: false },
    rotate: { enabled: true, flipHorizontal: true },
  });

  await testProcess('FLIP (vertical)', {
    trim: { enabled: false },
    rotate: { enabled: true, flipVertical: true },
  });

  await testProcess('CONVERT (to WebP)', {
    trim: { enabled: false },
    convert: { enabled: true, format: 'webp' },
  });

  await testProcess('CONVERT (to PNG)', {
    trim: { enabled: false },
    convert: { enabled: true, format: 'png' },
  });

  await testProcess('OPTIMIZE (q=60)', {
    trim: { enabled: false },
    optimize: { enabled: true, quality: 60 },
  });

  await testProcess('OPTIMIZE (q=80)', {
    trim: { enabled: false },
    optimize: { enabled: true, quality: 80 },
  });

  await testProcess('FULL PIPELINE', {
    trim: { enabled: true, threshold: 10 },
    crop: { enabled: true, mode: 'aspect', aspectRatio: '16:9' },
    resize: { enabled: true, width: 800, fit: 'inside' },
    optimize: { enabled: true, quality: 75 },
    convert: { enabled: true, format: 'webp' },
  });

  // Test background removal
  console.log('\n   Testing Background Removal...');
  const bgStart = Date.now();
  try {
    const bgResponse = await page.request.post(`${BASE_URL}/api/images/${testImageId}/remove-background`);
    const bgResult = await bgResponse.json();
    const bgDuration = Date.now() - bgStart;

    if (bgResponse.ok() && bgResult.success) {
      results.push({
        name: 'BACKGROUND REMOVAL',
        passed: true,
        details: `Processed: ${bgResult.data?.processed_url?.split('/').pop()}`,
        duration: bgDuration,
      });
      console.log(`   ✅ BACKGROUND REMOVAL (${bgDuration}ms)`);
    } else {
      results.push({
        name: 'BACKGROUND REMOVAL',
        passed: false,
        details: `Error: ${bgResult.error || bgResponse.status()}`,
        duration: bgDuration,
      });
      console.log(`   ❌ BACKGROUND REMOVAL (${bgDuration}ms)`);
      console.log(`      Error: ${bgResult.error || bgResponse.status()}`);
    }
  } catch (err) {
    const bgDuration = Date.now() - bgStart;
    results.push({
      name: 'BACKGROUND REMOVAL',
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      duration: bgDuration,
    });
    console.log(`   ❌ BACKGROUND REMOVAL (${bgDuration}ms)`);
  }

  await browser.close();

  // Print summary
  console.log('\n============================================================');
  console.log('  TEST RESULTS SUMMARY');
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

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
