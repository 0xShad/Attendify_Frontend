import sharp from 'sharp';

/**
 * Calculate image blur using Laplacian variance (focus measure) with sharp (Node.js)
 * @param imageBuffer - Buffer containing the image data
 * @returns Promise<number> - Blur score (higher = sharper/less blurry)
 */
export async function calculateBlur(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale and get raw pixel data
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  // Laplacian kernel (3x3)
  const kernel = [
    0,  1, 0,
    1, -4, 1,
    0,  1, 0
  ];
  // Apply Laplacian filter
  const laplacian = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;
          const pixel = data[py * width + px];
          const kval = kernel[(ky + 1) * 3 + (kx + 1)];
          sum += pixel * kval;
        }
      }
      laplacian[y * width + x] = sum;
    }
  }
  // Compute variance of Laplacian
  let mean = 0;
  let count = 0;
  for (let i = 0; i < laplacian.length; i++) {
    mean += laplacian[i];
    count++;
  }
  mean /= count;
  let variance = 0;
  for (let i = 0; i < laplacian.length; i++) {
    variance += Math.pow(laplacian[i] - mean, 2);
  }
  variance /= count;
  return variance;
}
