/**
 * ICO Generator
 *
 * Creates multi-resolution .ico files from a source image.
 * Uses png-to-ico to combine multiple PNG sizes into a single ICO.
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { ensureSquare } from './image-generator';

/** Standard ICO sizes to include */
const ICO_SIZES = [16, 32, 48] as const;

/**
 * Create a multi-resolution ICO file containing 16x16, 32x32, and 48x48 icons.
 *
 * @param sourceBuffer - The source image buffer (should be square, ideally 512x512+)
 * @returns Buffer containing the ICO file
 */
export async function createIcoFile(sourceBuffer: Buffer): Promise<Buffer> {
  // Ensure square source
  const squareSource = await ensureSquare(sourceBuffer);

  // Generate PNG buffers for each size
  const pngBuffers = await Promise.all(
    ICO_SIZES.map(async (size) => {
      return sharp(squareSource)
        .resize(size, size, { fit: 'contain' })
        .png()
        .toBuffer();
    })
  );

  // Combine into ICO
  const icoBuffer = await pngToIco(pngBuffers);

  return icoBuffer;
}
