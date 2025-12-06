import sharp from 'sharp';

/**
 * Color spectrum analysis using color distribution and saturation
 * @param imageBuffer - Buffer containing the image data
 * @returns Promise<number> - Color spectrum score (0-1, higher = more natural colors)
 */
export async function analyzeColorSpectrum(imageBuffer: Buffer): Promise<number> {
  // Get RGB data (not grayscale)
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  const channels = info.channels; // Should be 4 (RGBA)
  
  // 1. Calculate color variance (real skin has natural color variation)
  // Screens often have uniform/artificial color distribution
  let rSum = 0, gSum = 0, bSum = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data.length; i += channels) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
    pixelCount++;
  }
  
  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;
  
  let rVariance = 0, gVariance = 0, bVariance = 0;
  
  for (let i = 0; i < data.length; i += channels) {
    rVariance += Math.pow(data[i] - rMean, 2);
    gVariance += Math.pow(data[i + 1] - gMean, 2);
    bVariance += Math.pow(data[i + 2] - bMean, 2);
  }
  
  rVariance /= pixelCount;
  gVariance /= pixelCount;
  bVariance /= pixelCount;
  
  const avgColorVariance = (rVariance + gVariance + bVariance) / 3;
  const normalizedColorVariance = Math.sqrt(avgColorVariance) / 255; // 0-1
  
  // 2. Analyze saturation (screens often have oversaturated or undersaturated colors)
  // Real skin has moderate, natural saturation
  let totalSaturation = 0;
  let saturationCount = 0;
  
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    // Calculate saturation (HSV model)
    const saturation = max === 0 ? 0 : delta / max;
    totalSaturation += saturation;
    saturationCount++;
  }
  
  const avgSaturation = totalSaturation / saturationCount;
  
  // 3. Skin tone detection (real faces should have skin-like colors)
  // Typical skin tone ranges in RGB
  let skinTonePixels = 0;
  
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Simplified skin tone detection rules
    // Real skin typically has: R > G > B, with specific ranges
    const isSkinTone = (
      r > 95 && g > 40 && b > 20 &&
      r > g && r > b &&
      Math.abs(r - g) > 15 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15
    );
    
    if (isSkinTone) {
      skinTonePixels++;
    }
  }
  
  const skinToneRatio = skinTonePixels / pixelCount;
  
  // 4. Color channel correlation (screens have artificial channel relationships)
  // Real faces have natural R-G-B correlations
  let rgCorrelation = 0;
  
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i] - rMean;
    const g = data[i + 1] - gMean;
    rgCorrelation += r * g;
  }
  
  rgCorrelation /= (pixelCount * Math.sqrt(rVariance * gVariance));
  const normalizedRGCorrelation = (rgCorrelation + 1) / 2; // Normalize from [-1,1] to [0,1]
  
  // Combine metrics:
  // - Color variance: moderate is good (0.2-0.5 range is natural)
  const varianceScore = Math.min(normalizedColorVariance * 3, 1); // 0-1
  
  // - Saturation: moderate is good (0.2-0.6 is natural for faces)
  const saturationScore = avgSaturation > 0.1 && avgSaturation < 0.7 ? 1 : 0.5;
  
  // - Skin tone presence: higher is better
  const skinToneScore = Math.min(skinToneRatio * 3, 1); // 0-1
  
  // - Channel correlation: moderate correlation is natural
  const correlationScore = normalizedRGCorrelation > 0.3 && normalizedRGCorrelation < 0.9 ? 1 : 0.5;
  
  // Combined color spectrum score (0-1, higher is better)
  const colorScore = (varianceScore * 0.3) + (saturationScore * 0.2) + (skinToneScore * 0.4) + (correlationScore * 0.1);
  
  return colorScore;
}
