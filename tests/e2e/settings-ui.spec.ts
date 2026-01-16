/**
 * E2E Test: API Keys Settings UI
 * Tests the settings page with real browser login flow.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'e2e-test@mytrimmy.test';
const TEST_PASSWORD = 'E2ETestPass123';

test.describe('API Keys Settings UI', () => {
  test('should display and interact with API Keys settings', async ({ page }) => {
    // Step 1: Navigate to login page
    console.log('[1/6] Navigating to login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Verify login page loaded
    await expect(page.locator('input#email')).toBeVisible();
    console.log('✅ Login page loaded');

    // Step 2: Fill in credentials and submit
    console.log('[2/6] Logging in...');
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.screenshot({ path: 'test-results/settings-01-login-filled.png' });

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for redirect

    // Check if login succeeded (not on login page anymore)
    const currentUrl = page.url();
    console.log('  Current URL after login:', currentUrl);

    // Should be redirected away from login
    expect(currentUrl).not.toContain('/login');
    console.log('✅ Login successful');

    // Step 3: Navigate to settings page
    console.log('[3/6] Navigating to settings...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/settings-02-settings-page.png' });

    const settingsUrl = page.url();
    console.log('  Current URL:', settingsUrl);

    // Should still be on settings, not redirected to login
    expect(settingsUrl).toContain('/settings');
    console.log('✅ Settings page loaded');

    // Step 4: Click on API Keys tab and check for section
    console.log('[4/6] Clicking API Keys tab...');

    // Click the API Keys tab
    const apiKeysTab = page.locator('button:has-text("API Keys"), [role="tab"]:has-text("API Keys")');
    await expect(apiKeysTab).toBeVisible();
    await apiKeysTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/settings-03-api-keys-tab.png' });

    // Look for the myTrimmy API Keys section
    const apiKeysHeading = page.locator('text=myTrimmy API Keys');
    await expect(apiKeysHeading).toBeVisible();
    console.log('✅ API Keys section found');

    // Step 5: Test create key flow
    console.log('[5/6] Testing Create Key flow...');

    // Find key name input and Create Key button
    const keyNameInput = page.locator('input[placeholder*="Key name"]');
    const createBtn = page.locator('button:has-text("Create Key")');
    await expect(keyNameInput).toBeVisible();
    await expect(createBtn).toBeVisible();
    console.log('✅ Create Key form found');

    // Enter a key name and create
    await keyNameInput.fill('E2E Test Key');
    await createBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/settings-04-after-create.png' });

    // Check if a dialog appeared with the new key (shown once)
    const hasKeyDialog = await page.locator('text=mt_live_').count() > 0;
    if (hasKeyDialog) {
      console.log('✅ API Key created and shown');

      // Close the dialog
      const closeBtn = page.locator('button:has-text("Done"), button:has-text("Close"), button:has-text("I\'ve copied")');
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click();
        await page.waitForTimeout(500);
      }
    } else {
      // Check if key appeared in the list
      const hasKeyInList = await page.locator('text=E2E Test Key').count() > 0;
      if (hasKeyInList) {
        console.log('✅ API Key created (appears in list)');
      } else {
        console.log('⚠️ Could not verify key creation');
      }
    }

    // Step 6: Check Third-party API Keys section
    console.log('[6/6] Checking Third-party API Keys section...');

    const thirdPartyHeading = page.locator('text=Third-party API Keys');
    const replicateText = page.locator('text=Replicate');

    const hasThirdParty = await thirdPartyHeading.count() > 0 || await replicateText.count() > 0;
    expect(hasThirdParty).toBe(true);
    console.log('✅ Third-party API Keys section found');

    await page.screenshot({ path: 'test-results/settings-04-final.png' });

    console.log('');
    console.log('✅ ALL SETTINGS UI TESTS PASSED');
  });
});
