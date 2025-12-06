import sharp from 'sharp';

/**
 * Texture analysis using edge density and standard deviation
 * @param imageBuffer - Buffer containing the image data
 * @returns Promise<number> - Texture score (0-1, higher = more natural texture)
 */
export async function analyzeTexture(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale and get raw pixel data
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  
  // Calculate standard deviation (texture variation)
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    count++;
  }
  const mean = sum / count;
  
  let variance = 0;
  for (let i = 0; i < data.length; i++) {
    variance += Math.pow(data[i] - mean, 2);
  }
  variance /= count;
  const stdDev = Math.sqrt(variance);
  
  // Calculate edge density using simple gradient (Sobel-like)
  let edgeCount = 0;
  const threshold = 30; // Edge detection threshold
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Horizontal gradient
      const gx = -data[idx - 1] + data[idx + 1];
      // Vertical gradient
      const gy = -data[idx - width] + data[idx + width];
      // Gradient magnitude
      const gradient = Math.sqrt(gx * gx + gy * gy);
      
      if (gradient > threshold) {
        edgeCount++;
      }
    }
  }
  
  const edgeDensity = edgeCount / ((width - 2) * (height - 2));
  
  // Combine metrics: normalized standard deviation + edge density
  // Real faces have texture variation (higher stdDev) and natural edges
  // Printed photos tend to have uniform texture and fewer natural edges
  const normalizedStdDev = stdDev / 255; // Normalize to 0-1
  const textureScore = (normalizedStdDev * 0.6) + (edgeDensity * 0.4);
  
  return textureScore;
}
