/**
 * Asset Bundle Validation
 *
 * Zod schemas for validating asset bundle generation input.
 */

import { z } from 'zod';

/** Hex color validation regex */
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Schema for asset bundle input configuration.
 * Validates app name, colors, and optional metadata.
 */
export const assetBundleInputSchema = z.object({
  appName: z
    .string()
    .min(1, 'App name is required')
    .max(100, 'App name must be 100 characters or less')
    .regex(
      /^[a-zA-Z0-9\s\-_.]+$/,
      'App name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
    ),
  shortName: z
    .string()
    .max(12, 'Short name should be 12 characters or less for PWA')
    .optional(),
  themeColor: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Theme color must be a valid hex color (e.g., #000000)')
    .default('#000000'),
  backgroundColor: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Background color must be a valid hex color (e.g., #ffffff)')
    .default('#ffffff'),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .optional(),
  startUrl: z
    .string()
    .max(100, 'Start URL must be 100 characters or less')
    .default('/'),
});

/** Validated asset bundle input type */
export type ValidatedAssetBundleInput = z.infer<typeof assetBundleInputSchema>;

/**
 * Validate asset bundle input.
 * Returns parsed and defaulted configuration or throws ZodError.
 */
export function validateAssetBundleInput(input: unknown): ValidatedAssetBundleInput {
  return assetBundleInputSchema.parse(input);
}

/**
 * Safe validation that returns result instead of throwing.
 */
export function safeValidateAssetBundleInput(
  input: unknown
): { success: true; data: ValidatedAssetBundleInput } | { success: false; error: z.ZodError } {
  const result = assetBundleInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
