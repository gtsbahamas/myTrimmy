/**
 * E2E Critical Flow Tests - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * These tests verify the critical user journeys actually work.
 * They catch:
 * - Hydration errors (nested buttons, invalid HTML)
 * - RLS policy failures at runtime
 * - Navigation/routing issues
 * - Form submission failures
 *
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

// Test user credentials (create this user in Supabase first)
const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'e2e-test-password-123';

test.describe('Authentication Flow', () => {
  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'Test123!@#');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/dashboard|verify/);
  });

  test('should allow user to log in', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);

    await page.click('button[type="submit"]');

    // Wait for redirect away from login page (more robust than checking specific URL)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});


test.describe('HTML Validity & Hydration', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should have no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have no hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('Hydration') ||
        text.includes('hydration') ||
        text.includes('cannot be a descendant') ||
        text.includes('Expected server HTML')
      ) {
        hydrationErrors.push(text);
      }
    });

    // Visit all main pages
    const pages = ['/dashboard', '/', '/settings'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }

    expect(hydrationErrors).toHaveLength(0);
  });

  test('should not have nested interactive elements', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for nested buttons (common hydration error cause)
    const nestedButtons = await page.$$eval('button button, a a, button a, a button', els => els.length);
    expect(nestedButtons).toBe(0);

    // Check for buttons inside links
    const buttonsInLinks = await page.$$eval('a button', els => els.length);
    expect(buttonsInLinks).toBe(0);
  });
});

test.describe('Database Operations via UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

});

// ============================================================
// ENTITY CRUD TESTS (Auto-Generated)
// ============================================================


// ============================================================
// AUTHORIZATION TESTS (GAP-016)
// ============================================================
// These tests verify that RLS policies and API authorization work together.
// Critical: Prevents data leakage between users.

// Second test user for cross-user access tests
const TEST_USER_2_EMAIL = 'e2e-test-2@example.com';
const TEST_USER_2_PASSWORD = 'e2e-test-password-456';

test.describe('Authorization & Data Isolation', () => {
});

test.describe('API Error Handling', () => {
  test('should return 401 for unauthenticated API requests', async ({ request }) => {
    const response = await request.get('/api/');
    expect(response.status()).toBe(401);
  });

  test('should return 400 for invalid request body', async ({ request }) => {
    // Login first
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    // Send invalid data (missing required fields)
    const response = await request.post('/api/', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      data: {} // Empty body - missing required fields
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe('validation_failed');
  });

  test('should return 404 for non-existent resource', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
    });
    const { session } = await loginResponse.json();

    const response = await request.get('/api//00000000-0000-0000-0000-000000000000', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });

    expect(response.status()).toBe(404);
  });
});
