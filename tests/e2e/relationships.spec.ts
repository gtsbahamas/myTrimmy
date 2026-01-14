/**
 * Relationship & Foreign Key Tests - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * These tests verify:
 * - Foreign key constraints are enforced
 * - Cascade behaviors work correctly
 * - Orphan prevention is active
 * - Relationship queries return correct data
 *
 * Run with: npx playwright test tests/relationships.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_USER_EMAIL = 'e2e-test@example.com';
const TEST_USER_PASSWORD = 'e2e-test-password-123';

let authToken: string;

test.beforeAll(async ({ request }) => {
  // Login once for all relationship tests
  const loginResponse = await request.post('/api/auth/login', {
    data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }
  });
  const { session } = await loginResponse.json();
  authToken = session.access_token;
});

// ============================================================
// FOREIGN KEY CONSTRAINT TESTS
// ============================================================

test.describe('Foreign Key Constraints', () => {
  test('Imag. should reject invalid User reference', async ({ request }) => {
    // Attempt to create Imag with non-existent User ID
    const response = await request.post('/api/imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : '00000000-0000-0000-0000-000000000000', // Non-existent
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('Preset. should reject invalid User reference', async ({ request }) => {
    // Attempt to create Preset with non-existent User ID
    const response = await request.post('/api/preset', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : '00000000-0000-0000-0000-000000000000', // Non-existent
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('BatchJob. should reject invalid User reference', async ({ request }) => {
    // Attempt to create BatchJob with non-existent User ID
    const response = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : '00000000-0000-0000-0000-000000000000', // Non-existent
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('BatchImag. should reject invalid BatchJob reference', async ({ request }) => {
    // Attempt to create BatchImag with non-existent BatchJob ID
    const response = await request.post('/api/batch-imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : '00000000-0000-0000-0000-000000000000', // Non-existent
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('BatchJob. should reject invalid Preset reference', async ({ request }) => {
    // Attempt to create BatchJob with non-existent Preset ID
    const response = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : '00000000-0000-0000-0000-000000000000', // Non-existent
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('BatchImage. should reject invalid Image reference', async ({ request }) => {
    // Attempt to create BatchImage with non-existent Image ID
    const response = await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : '00000000-0000-0000-0000-000000000000', // Non-existent
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('BatchImage. should reject invalid BatchJob reference', async ({ request }) => {
    // Attempt to create BatchImage with non-existent BatchJob ID
    const response = await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : '00000000-0000-0000-0000-000000000000', // Non-existent
      }
    });

    // Should be rejected (400 or 422)
    expect([400, 422]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

});

// ============================================================
// CASCADE DELETE TESTS
// ============================================================

test.describe('Cascade Delete Behavior', () => {
});

// ============================================================
// RESTRICT DELETE TESTS
// ============================================================

test.describe('Restrict Delete Behavior', () => {
  test('deleting User should be blocked when Imag references it', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (Imag) linked to parent
    await request.post('/api/imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Attempt to delete parent (should be blocked)
    const deleteResponse = await request.delete(`/api/user/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be rejected (409 Conflict or 400)
    expect([400, 409]).toContain(deleteResponse.status());
    const body = await deleteResponse.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toMatch(/foreign key|referenced|constraint/i);
  });
  test('deleting User should be blocked when Preset references it', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (Preset) linked to parent
    await request.post('/api/preset', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Attempt to delete parent (should be blocked)
    const deleteResponse = await request.delete(`/api/user/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be rejected (409 Conflict or 400)
    expect([400, 409]).toContain(deleteResponse.status());
    const body = await deleteResponse.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toMatch(/foreign key|referenced|constraint/i);
  });
  test('deleting User should be blocked when BatchJob references it', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchJob) linked to parent
    await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Attempt to delete parent (should be blocked)
    const deleteResponse = await request.delete(`/api/user/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be rejected (409 Conflict or 400)
    expect([400, 409]).toContain(deleteResponse.status());
    const body = await deleteResponse.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toMatch(/foreign key|referenced|constraint/i);
  });
  test('deleting BatchJob should be blocked when BatchImag references it', async ({ request }) => {
    // Create parent (BatchJob)
    const parentResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImag) linked to parent
    await request.post('/api/batch-imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Attempt to delete parent (should be blocked)
    const deleteResponse = await request.delete(`/api/batch-job/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be rejected (409 Conflict or 400)
    expect([400, 409]).toContain(deleteResponse.status());
    const body = await deleteResponse.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toMatch(/foreign key|referenced|constraint/i);
  });
  test('deleting Preset should be blocked when BatchJob references it', async ({ request }) => {
    // Create parent (Preset)
    const parentResponse = await request.post('/api/preset', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchJob) linked to parent
    await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Attempt to delete parent (should be blocked)
    const deleteResponse = await request.delete(`/api/preset/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be rejected (409 Conflict or 400)
    expect([400, 409]).toContain(deleteResponse.status());
    const body = await deleteResponse.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toMatch(/foreign key|referenced|constraint/i);
  });
  test('deleting Image should be blocked when BatchImage references it', async ({ request }) => {
    // Create parent (Image)
    const parentResponse = await request.post('/api/image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImage) linked to parent
    await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Attempt to delete parent (should be blocked)
    const deleteResponse = await request.delete(`/api/image/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be rejected (409 Conflict or 400)
    expect([400, 409]).toContain(deleteResponse.status());
    const body = await deleteResponse.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toMatch(/foreign key|referenced|constraint/i);
  });
  test('deleting BatchJob should be blocked when BatchImage references it', async ({ request }) => {
    // Create parent (BatchJob)
    const parentResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImage) linked to parent
    await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Attempt to delete parent (should be blocked)
    const deleteResponse = await request.delete(`/api/batch-job/${parent.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Should be rejected (409 Conflict or 400)
    expect([400, 409]).toContain(deleteResponse.status());
    const body = await deleteResponse.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toMatch(/foreign key|referenced|constraint/i);
  });
});

// ============================================================
// RELATIONSHIP QUERY TESTS
// ============================================================

test.describe('Relationship Queries', () => {
  test('should include Imag when querying User with include', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (Imag) linked to parent
    await request.post('/api/imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Query parent with include
    const queryResponse = await request.get(`/api/user/${parent.id}?include=imag`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Imag
    expect(data.imag).toBeDefined();
    expect(Array.isArray(data.imag) ? data.imag.length : 1).toBeGreaterThanOrEqual(1);
  });

  test('should include User when querying Imag', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (Imag) linked to parent
    const childResponse = await request.post('/api/imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });
    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/imag/${child.id}?include=user`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related User
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(parent.id);
  });
  test('should include Preset when querying User with include', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (Preset) linked to parent
    await request.post('/api/preset', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Query parent with include
    const queryResponse = await request.get(`/api/user/${parent.id}?include=preset`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Preset
    expect(data.preset).toBeDefined();
    expect(Array.isArray(data.preset) ? data.preset.length : 1).toBeGreaterThanOrEqual(1);
  });

  test('should include User when querying Preset', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (Preset) linked to parent
    const childResponse = await request.post('/api/preset', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });
    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/preset/${child.id}?include=user`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related User
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(parent.id);
  });
  test('should include BatchJob when querying User with include', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchJob) linked to parent
    await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Query parent with include
    const queryResponse = await request.get(`/api/user/${parent.id}?include=batchJob`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related BatchJob
    expect(data.batchJob).toBeDefined();
    expect(Array.isArray(data.batchJob) ? data.batchJob.length : 1).toBeGreaterThanOrEqual(1);
  });

  test('should include User when querying BatchJob', async ({ request }) => {
    // Create parent (User)
    const parentResponse = await request.post('/api/user', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchJob) linked to parent
    const childResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });
    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/batch-job/${child.id}?include=user`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related User
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(parent.id);
  });
  test('should include BatchImag when querying BatchJob with include', async ({ request }) => {
    // Create parent (BatchJob)
    const parentResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImag) linked to parent
    await request.post('/api/batch-imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Query parent with include
    const queryResponse = await request.get(`/api/batch-job/${parent.id}?include=batchImag`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related BatchImag
    expect(data.batchImag).toBeDefined();
    expect(Array.isArray(data.batchImag) ? data.batchImag.length : 1).toBeGreaterThanOrEqual(1);
  });

  test('should include BatchJob when querying BatchImag', async ({ request }) => {
    // Create parent (BatchJob)
    const parentResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImag) linked to parent
    const childResponse = await request.post('/api/batch-imag', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });
    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/batch-imag/${child.id}?include=batchJob`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related BatchJob
    expect(data.batchJob).toBeDefined();
    expect(data.batchJob.id).toBe(parent.id);
  });
  test('should include BatchJob when querying Preset with include', async ({ request }) => {
    // Create parent (Preset)
    const parentResponse = await request.post('/api/preset', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchJob) linked to parent
    await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Query parent with include
    const queryResponse = await request.get(`/api/preset/${parent.id}?include=batchJob`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related BatchJob
    expect(data.batchJob).toBeDefined();
    expect(Array.isArray(data.batchJob) ? data.batchJob.length : 1).toBeGreaterThanOrEqual(1);
  });

  test('should include Preset when querying BatchJob', async ({ request }) => {
    // Create parent (Preset)
    const parentResponse = await request.post('/api/preset', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchJob) linked to parent
    const childResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });
    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/batch-job/${child.id}?include=preset`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Preset
    expect(data.preset).toBeDefined();
    expect(data.preset.id).toBe(parent.id);
  });
  test('should include BatchImage when querying Image with include', async ({ request }) => {
    // Create parent (Image)
    const parentResponse = await request.post('/api/image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImage) linked to parent
    await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Query parent with include
    const queryResponse = await request.get(`/api/image/${parent.id}?include=batchImage`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related BatchImage
    expect(data.batchImage).toBeDefined();
    expect(Array.isArray(data.batchImage) ? data.batchImage.length : 1).toBeGreaterThanOrEqual(1);
  });

  test('should include Image when querying BatchImage', async ({ request }) => {
    // Create parent (Image)
    const parentResponse = await request.post('/api/image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImage) linked to parent
    const childResponse = await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });
    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/batch-image/${child.id}?include=image`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related Image
    expect(data.image).toBeDefined();
    expect(data.image.id).toBe(parent.id);
  });
  test('should include BatchImage when querying BatchJob with include', async ({ request }) => {
    // Create parent (BatchJob)
    const parentResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImage) linked to parent
    await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });

    // Query parent with include
    const queryResponse = await request.get(`/api/batch-job/${parent.id}?include=batchImage`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related BatchImage
    expect(data.batchImage).toBeDefined();
    expect(Array.isArray(data.batchImage) ? data.batchImage.length : 1).toBeGreaterThanOrEqual(1);
  });

  test('should include BatchJob when querying BatchImage', async ({ request }) => {
    // Create parent (BatchJob)
    const parentResponse = await request.post('/api/batch-job', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
      }
    });
    const { data: parent } = await parentResponse.json();

    // Create child (BatchImage) linked to parent
    const childResponse = await request.post('/api/batch-image', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        : parent.id,
      }
    });
    const { data: child } = await childResponse.json();

    // Query child with include
    const queryResponse = await request.get(`/api/batch-image/${child.id}?include=batchJob`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(queryResponse.status()).toBe(200);
    const { data } = await queryResponse.json();

    // Should have related BatchJob
    expect(data.batchJob).toBeDefined();
    expect(data.batchJob.id).toBe(parent.id);
  });
});

// ============================================================
// ORPHAN PREVENTION TESTS
// ============================================================

test.describe('Orphan Prevention', () => {
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
