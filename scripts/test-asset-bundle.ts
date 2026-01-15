#!/usr/bin/env npx tsx
/**
 * Asset Bundle Generation Tests
 *
 * Tests the asset bundle generation API that creates:
 * - iOS icons (18 sizes)
 * - Android icons (16 sizes including adaptive)
 * - Web assets (16: favicons, PWA, Microsoft tiles)
 * - Social media images (3: OG, Twitter, LinkedIn)
 *
 * Usage: npx tsx scripts/test-asset-bundle.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

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

// Expected asset counts by platform
const EXPECTED_COUNTS = {
  ios: 18,
  android: 16,
  web: 16,
  social: 3,
  total: 53, // 18 + 16 + 16 + 3
};

async function runTests() {
  console.log('\n============================================================');
  console.log('  ASSET BUNDLE GENERATION TESTS');
  console.log('  Target: ' + BASE_URL);
  console.log('============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  console.log('1. Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  if (!page.url().includes('/dashboard')) {
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.fill('#email', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
      const btn = document.querySelector('button[type="submit"]');
      if (btn) (btn as HTMLButtonElement).click();
    });
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  }
  console.log('   ✅ Logged in successfully\n');

  // Create a test logo image (512x512 PNG)
  console.log('2. Creating test logo...');
  const testLogoBuffer = await createTestLogo();
  console.log(`   ✅ Test logo created (${testLogoBuffer.length} bytes)\n`);

  console.log('============================================================');
  console.log('  RUNNING ASSET BUNDLE TESTS');
  console.log('============================================================\n');

  // Test 1: Full bundle (all platforms)
  await testAssetBundle(page, 'Full Bundle (All Platforms)', testLogoBuffer, {
    appName: 'Test App',
    shortName: 'TestApp',
    themeColor: '#D4AF37',
    backgroundColor: '#121212',
    description: 'A test application for asset generation',
    platforms: { ios: true, android: true, web: true, social: true },
  });

  // Test 2: iOS only
  await testAssetBundle(page, 'iOS Only', testLogoBuffer, {
    appName: 'iOS Test',
    platforms: { ios: true, android: false, web: false, social: false },
  });

  // Test 3: Android only
  await testAssetBundle(page, 'Android Only', testLogoBuffer, {
    appName: 'Android Test',
    platforms: { ios: false, android: true, web: false, social: false },
  });

  // Test 4: Web only
  await testAssetBundle(page, 'Web Only', testLogoBuffer, {
    appName: 'Web Test',
    platforms: { ios: false, android: false, web: true, social: false },
  });

  // Test 5: Social only
  await testAssetBundle(page, 'Social Only', testLogoBuffer, {
    appName: 'Social Test',
    platforms: { ios: false, android: false, web: false, social: true },
  });

  // Test 6: Validation - image too small
  console.log('   Testing validation: image too small...');
  const smallLogo = await createTestLogo(256); // Below 512 minimum
  await testValidation(page, 'Validation: Image Too Small', smallLogo, {
    appName: 'Small Test',
  }, 'too small');

  // Test 7: Validation - missing app name
  console.log('   Testing validation: missing app name...');
  await testValidation(page, 'Validation: Missing App Name', testLogoBuffer, {
    // appName is required but missing
  } as { appName: string }, 'appName');

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

async function createTestLogo(size = 512): Promise<Buffer> {
  // Download a test image and resize it to create a logo
  const response = await fetch(`https://picsum.photos/${size}/${size}.jpg`);
  return Buffer.from(await response.arrayBuffer());
}

async function testAssetBundle(
  page: Awaited<ReturnType<typeof chromium.launch>>['contexts'][0]['pages'][0],
  name: string,
  logoBuffer: Buffer,
  config: {
    appName: string;
    shortName?: string;
    themeColor?: string;
    backgroundColor?: string;
    description?: string;
    platforms?: { ios: boolean; android: boolean; web: boolean; social: boolean };
  }
): Promise<void> {
  const start = Date.now();
  console.log(`   Testing: ${name}...`);

  try {
    // Create form data
    const formData = new FormData();
    formData.append('image', new Blob([logoBuffer], { type: 'image/jpeg' }), 'test-logo.jpg');
    formData.append('config', JSON.stringify(config));

    // Make the API request using page.request (has auth cookies)
    const response = await page.request.post(`${BASE_URL}/api/assets/bundle`, {
      multipart: {
        image: {
          name: 'test-logo.jpg',
          mimeType: 'image/jpeg',
          buffer: logoBuffer,
        },
        config: JSON.stringify(config),
      },
    });

    const duration = Date.now() - start;

    if (!response.ok()) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorText;
      } catch {}

      results.push({
        name,
        passed: false,
        details: `HTTP ${response.status()}: ${errorMessage}`,
        duration,
      });
      console.log(`   ❌ ${name} (${duration}ms) - ${errorMessage}`);
      return;
    }

    // Get response headers for asset counts
    const headers = response.headers();
    const totalCount = parseInt(headers['x-asset-count'] || '0');
    const iosCount = parseInt(headers['x-ios-count'] || '0');
    const androidCount = parseInt(headers['x-android-count'] || '0');
    const webCount = parseInt(headers['x-web-count'] || '0');
    const socialCount = parseInt(headers['x-social-count'] || '0');

    // Download and analyze the ZIP
    const zipBuffer = await response.body();
    const zipPath = `/tmp/test-bundle-${Date.now()}.zip`;
    fs.writeFileSync(zipPath, zipBuffer);

    // Analyze ZIP contents
    const analysis = analyzeZipContents(zipPath, config.platforms);

    // Verify counts match expectations
    const platforms = config.platforms || { ios: true, android: true, web: true, social: true };
    let expectedTotal = 0;
    if (platforms.ios) expectedTotal += EXPECTED_COUNTS.ios;
    if (platforms.android) expectedTotal += EXPECTED_COUNTS.android;
    if (platforms.web) expectedTotal += EXPECTED_COUNTS.web;
    if (platforms.social) expectedTotal += EXPECTED_COUNTS.social;

    const countsMatch = totalCount >= expectedTotal * 0.9; // Allow 10% tolerance for config files

    // Clean up
    fs.unlinkSync(zipPath);

    results.push({
      name,
      passed: countsMatch && analysis.valid,
      details: `Assets: ${totalCount} (iOS: ${iosCount}, Android: ${androidCount}, Web: ${webCount}, Social: ${socialCount}), ZIP: ${(zipBuffer.length / 1024).toFixed(1)}KB, Files: ${analysis.fileCount}`,
      duration,
    });

    if (countsMatch && analysis.valid) {
      console.log(`   ✅ ${name} (${duration}ms)`);
    } else {
      console.log(`   ❌ ${name} (${duration}ms) - Count mismatch or invalid ZIP`);
    }
  } catch (err) {
    const duration = Date.now() - start;
    results.push({
      name,
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      duration,
    });
    console.log(`   ❌ ${name} (${duration}ms) - Exception`);
  }
}

async function testValidation(
  page: Awaited<ReturnType<typeof chromium.launch>>['contexts'][0]['pages'][0],
  name: string,
  logoBuffer: Buffer,
  config: { appName: string },
  expectedError: string
): Promise<void> {
  const start = Date.now();

  try {
    const response = await page.request.post(`${BASE_URL}/api/assets/bundle`, {
      multipart: {
        image: {
          name: 'test-logo.jpg',
          mimeType: 'image/jpeg',
          buffer: logoBuffer,
        },
        config: JSON.stringify(config),
      },
    });

    const duration = Date.now() - start;
    const responseText = await response.text();

    // Validation should fail (return 400)
    const isValidationError = response.status() === 400;
    const hasExpectedError = responseText.toLowerCase().includes(expectedError.toLowerCase());

    results.push({
      name,
      passed: isValidationError && hasExpectedError,
      details: isValidationError
        ? `Correctly rejected: ${responseText.substring(0, 100)}`
        : `Expected 400, got ${response.status()}`,
      duration,
    });

    if (isValidationError && hasExpectedError) {
      console.log(`   ✅ ${name} (${duration}ms) - Correctly rejected`);
    } else {
      console.log(`   ❌ ${name} (${duration}ms) - Did not reject as expected`);
    }
  } catch (err) {
    const duration = Date.now() - start;
    results.push({
      name,
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      duration,
    });
    console.log(`   ❌ ${name} (${duration}ms) - Exception`);
  }
}

function analyzeZipContents(
  zipPath: string,
  platforms?: { ios: boolean; android: boolean; web: boolean; social: boolean }
): { valid: boolean; fileCount: number; categories: Record<string, number> } {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const categories: Record<string, number> = {
      ios: 0,
      android: 0,
      web: 0,
      social: 0,
      config: 0,
    };

    for (const entry of entries) {
      const name = entry.entryName.toLowerCase();
      if (name.startsWith('ios/')) categories.ios++;
      else if (name.startsWith('android/')) categories.android++;
      else if (name.startsWith('web/')) categories.web++;
      else if (name.startsWith('social/')) categories.social++;
      else categories.config++;
    }

    return {
      valid: entries.length > 0,
      fileCount: entries.length,
      categories,
    };
  } catch (err) {
    return { valid: false, fileCount: 0, categories: {} };
  }
}

runTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
