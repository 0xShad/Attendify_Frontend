import sharp from 'sharp';

/**
 * Monocular depth estimation using gradient and focus analysis
 * @param imageBuffer - Buffer containing the image data
 * @returns Promise<number> - Depth score (0-1, higher = more 3D characteristics)
 */
export async function estimateFaceDepth(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale for depth analysis
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  
  // 1. Gradient magnitude map (sharp edges indicate closer/in-focus regions)
  // Real 3D faces have varying sharpness across depth (nose closer than ears)
  // Flat photos/screens have uniform focus across entire image
  const gradientMap = new Float32Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Sobel operator for gradient
      const gx = (
        -data[idx - width - 1] - 2 * data[idx - 1] - data[idx + width - 1] +
        data[idx - width + 1] + 2 * data[idx + 1] + data[idx + width + 1]
      );
      const gy = (
        -data[idx - width - 1] - 2 * data[idx - width] - data[idx - width + 1] +
        data[idx + width - 1] + 2 * data[idx + width] + data[idx + width + 1]
      );
      gradientMap[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  // 2. Divide image into regions and analyze gradient variance
  // Real faces: center (nose) has higher gradients than edges (ears, background)
  // Flat images: uniform gradient distribution
  const centerRegion = { x: Math.floor(width * 0.25), y: Math.floor(height * 0.25), w: Math.floor(width * 0.5), h: Math.floor(height * 0.5) };
  const edgeRegionTop = { x: 0, y: 0, w: width, h: Math.floor(height * 0.2) };
  const edgeRegionBottom = { x: 0, y: Math.floor(height * 0.8), w: width, h: Math.floor(height * 0.2) };
  
  // Calculate average gradient for center region
  let centerGradientSum = 0;
  let centerCount = 0;
  for (let y = centerRegion.y; y < centerRegion.y + centerRegion.h; y++) {
    for (let x = centerRegion.x; x < centerRegion.x + centerRegion.w; x++) {
      centerGradientSum += gradientMap[y * width + x];
      centerCount++;
    }
  }
  const centerGradient = centerGradientSum / centerCount;
  
  // Calculate average gradient for edge regions
  let edgeGradientSum = 0;
  let edgeCount = 0;
  
  // Top edge
  for (let y = edgeRegionTop.y; y < edgeRegionTop.y + edgeRegionTop.h; y++) {
    for (let x = edgeRegionTop.x; x < edgeRegionTop.x + edgeRegionTop.w; x++) {
      edgeGradientSum += gradientMap[y * width + x];
      edgeCount++;
    }
  }
  
  // Bottom edge
  for (let y = edgeRegionBottom.y; y < edgeRegionBottom.y + edgeRegionBottom.h; y++) {
    for (let x = edgeRegionBottom.x; x < edgeRegionBottom.x + edgeRegionBottom.w; x++) {
      edgeGradientSum += gradientMap[y * width + x];
      edgeCount++;
    }
  }
  
  const edgeGradient = edgeGradientSum / edgeCount;
  
  // 3. Calculate center-to-edge gradient ratio
  // Real faces: center has MORE detail/sharpness (ratio > 1)
  // Flat images: uniform sharpness (ratio ≈ 1)
  const gradientRatio = centerGradient / (edgeGradient + 1); // +1 to avoid division by zero
  
  // 4. Analyze local gradient variance (texture depth cues)
  // Real faces have varying local gradients due to 3D structure
  // Flat images have more uniform local gradients
  let gradientVariance = 0;
  const overallMean = (centerGradientSum + edgeGradientSum) / (centerCount + edgeCount);
  
  for (let i = 0; i < gradientMap.length; i++) {
    gradientVariance += Math.pow(gradientMap[i] - overallMean, 2);
  }
  gradientVariance /= gradientMap.length;
  const normalizedGradientVariance = Math.sqrt(gradientVariance) / 255;
  
  // 5. Edge coherence analysis
  // Real 3D faces have coherent edge structures that follow facial contours
  // Flat images may have artificial edge patterns
  let coherentEdges = 0;
  const edgeThreshold = 30;
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const idx = y * width + x;
      if (gradientMap[idx] > edgeThreshold) {
        // Check if neighboring pixels also have edges (coherence)
        const neighbors = [
          gradientMap[idx - 1],
          gradientMap[idx + 1],
          gradientMap[idx - width],
          gradientMap[idx + width]
        ];
        const coherentNeighbors = neighbors.filter(n => n > edgeThreshold).length;
        if (coherentNeighbors >= 2) {
          coherentEdges++;
        }
      }
    }
  }
  
  const coherenceRatio = coherentEdges / ((width - 4) * (height - 4));
  
  // Combine metrics:
  // - Gradient ratio: higher is better (center sharper than edges)
  const ratioScore = Math.min(gradientRatio / 1.5, 1); // 0-1, expect ratio ~1.2-1.8 for real faces
  
  // - Gradient variance: higher is better (3D structure variation)
  const varianceScore = Math.min(normalizedGradientVariance * 3, 1); // 0-1
  
  // - Edge coherence: moderate is good (natural facial contours)
  const coherenceScore = coherenceRatio > 0.05 && coherenceRatio < 0.3 ? 1 : 0.5;
  
  // Combined depth score (0-1, higher indicates more 3D-like characteristics)
  const depthScore = (ratioScore * 0.4) + (varianceScore * 0.4) + (coherenceScore * 0.2);
  
  return depthScore;
}
