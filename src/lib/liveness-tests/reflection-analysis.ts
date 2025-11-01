import sharp from 'sharp';

/**
 * Reflection/lighting analysis using brightness distribution and highlights
 * @param imageBuffer - Buffer containing the image data
 * @returns Promise<number> - Reflection score (0-1, higher = more natural lighting)
 */
export async function analyzeReflection(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale and get raw pixel data
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  const totalPixels = width * height;
  
  // 1. Detect specular highlights (very bright pixels)
  // Screens/photos often have artificial specular highlights
  let highlightCount = 0;
  const highlightThreshold = 240; // Very bright pixels
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] > highlightThreshold) {
      highlightCount++;
    }
  }
  
  const highlightRatio = highlightCount / totalPixels;
  
  // 2. Calculate brightness variance across the image
  // Real faces have natural lighting gradients
  // Screens/photos may have more uniform lighting
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const mean = sum / data.length;
  
  let variance = 0;
  for (let i = 0; i < data.length; i++) {
    variance += Math.pow(data[i] - mean, 2);
  }
  variance /= data.length;
  const normalizedVariance = variance / (255 * 255); // Normalize to 0-1
  
  // 3. Detect local brightness anomalies (grid pattern detection)
  // Divide image into blocks and check for uniform brightness patterns
  const blockSize = 16;
  const blocksX = Math.floor(width / blockSize);
  const blocksY = Math.floor(height / blockSize);
  const blockMeans: number[] = [];
  
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let blockSum = 0;
      let blockCount = 0;
      
      for (let y = by * blockSize; y < (by + 1) * blockSize && y < height; y++) {
        for (let x = bx * blockSize; x < (bx + 1) * blockSize && x < width; x++) {
          blockSum += data[y * width + x];
          blockCount++;
        }
      }
      
      if (blockCount > 0) {
        blockMeans.push(blockSum / blockCount);
      }
    }
  }
  
  // Calculate variance of block means (screen patterns have lower variance)
  let blockMeanSum = 0;
  for (const bm of blockMeans) {
    blockMeanSum += bm;
  }
  const blockMeanAvg = blockMeanSum / blockMeans.length;
  
  let blockVariance = 0;
  for (const bm of blockMeans) {
    blockVariance += Math.pow(bm - blockMeanAvg, 2);
  }
  blockVariance /= blockMeans.length;
  const normalizedBlockVariance = blockVariance / (255 * 255);
  
  // Combine metrics:
  // - Lower highlight ratio is better (fewer artificial highlights)
  // - Higher brightness variance is better (natural lighting)
  // - Higher block variance is better (non-uniform, natural)
  
  // Penalize excessive highlights
  const highlightScore = 1 - Math.min(highlightRatio * 10, 1); // 0-1, higher is better
  
  // Reward natural brightness variation
  const varianceScore = Math.min(normalizedVariance * 2, 1); // 0-1
  
  // Reward non-uniform block patterns
  const blockScore = Math.min(normalizedBlockVariance * 2, 1); // 0-1
  
  // Combined reflection score (0-1, lower values indicate potential spoofing)
  const reflectionScore = (highlightScore * 0.4) + (varianceScore * 0.3) + (blockScore * 0.3);
  
  return reflectionScore;
}
