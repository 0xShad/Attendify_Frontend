# Google Cloud Vision API Integration

This document describes the Google Cloud Vision API integration for face detection and validation in the Attendify application.

## Overview

The application uses Google Cloud Vision API's Face Detection feature to:
- Detect faces in images
- Validate face quality and confidence
- Extract facial landmarks and features
- Assess image quality (blur, exposure)
- Analyze facial expressions and attributes

## API Endpoint

**Endpoint**: `/api/vision-face-detect`  
**Method**: `POST`  
**Location**: `src/app/api/vision-face-detect/route.ts`

### Request Format

```typescript
POST /api/vision-face-detect
Content-Type: application/json

{
  "imageBase64": "base64-encoded-image-string"
}
```

**Note**: The `imageBase64` should be the base64 content **without** the data URL prefix (e.g., without `data:image/png;base64,`).

### Response Format

#### Success Response (200)
```json
{
  "faces": [
    {
      "detectionConfidence": 0.98,
      "landmarkingConfidence": 0.95,
      "rollAngle": 2.3,
      "panAngle": -1.2,
      "tiltAngle": 0.8,
      "boundingPoly": {
        "vertices": [
          { "x": 100, "y": 80 },
          { "x": 220, "y": 80 },
          { "x": 220, "y": 220 },
          { "x": 100, "y": 220 }
        ]
      },
      "landmarks": [...],
      "joyLikelihood": "VERY_LIKELY",
      "sorrowLikelihood": "VERY_UNLIKELY",
      "angerLikelihood": "VERY_UNLIKELY",
      "surpriseLikelihood": "UNLIKELY",
      "blurredLikelihood": "VERY_UNLIKELY",
      "underExposedLikelihood": "VERY_UNLIKELY",
      "headwearLikelihood": "VERY_UNLIKELY"
    }
  ]
}
```

#### Error Responses

**No Image Provided (400)**
```json
{
  "error": "No image provided"
}
```

**No Face Detected (400)**
```json
{
  "error": "No face detected"
}
```

**Multiple Faces Detected (400)**
```json
{
  "error": "Multiple faces detected"
}
```

**Low Detection Confidence (400)**
```json
{
  "error": "Face detection confidence too low",
  "confidence": 0.75
}
```

**API Error (500)**
```json
{
  "error": "Vision API error"
}
```

## Validation Rules

The API performs strict validation checks:

### 1. Single Face Requirement
- **Rule**: Exactly one face must be detected
- **Failure**: Returns error if 0 or 2+ faces detected
- **Purpose**: Ensure only the intended person is in the frame

### 2. Detection Confidence Threshold
- **Rule**: `detectionConfidence >= 0.9` (90%)
- **Failure**: Returns error if confidence is below threshold
- **Purpose**: Ensure high-quality face detection

### 3. Eye Detection (Removed)
- **Previous Rule**: Both eyes must be open (VERY_LIKELY or LIKELY)
- **Status**: Removed per user request
- **Reason**: Now handled by custom eye detection module (`src/lib/liveness-tests/eye-detection.ts`)

## Face Annotation Data

The API returns detailed face annotation data from Google Cloud Vision:

### Core Metrics
| Field | Type | Description |
|-------|------|-------------|
| `detectionConfidence` | number (0-1) | Confidence that a face was detected |
| `landmarkingConfidence` | number (0-1) | Confidence in facial landmark positions |

### Face Pose Angles
| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `rollAngle` | number | -180° to 180° | Rotation around Z-axis (head tilt left/right) |
| `panAngle` | number | -180° to 180° | Rotation around Y-axis (head turn left/right) |
| `tiltAngle` | number | -180° to 180° | Rotation around X-axis (head tilt up/down) |

**Ideal frontal face values:**
- Roll: -5° to 5°
- Pan: -10° to 10°
- Tilt: -10° to 10°

### Bounding Polygon
```typescript
boundingPoly: {
  vertices: [
    { x: number, y: number },  // Top-left
    { x: number, y: number },  // Top-right
    { x: number, y: number },  // Bottom-right
    { x: number, y: number }   // Bottom-left
  ]
}
```

### Facial Landmarks
Array of landmark positions (68+ points) including:
- Eyes (left/right, pupils, corners)
- Eyebrows (left/right, multiple points)
- Nose (tip, bridge, base)
- Mouth (corners, upper/lower lip)
- Ears (left/right tragion)
- Chin contour

Each landmark has:
```typescript
{
  type: "LEFT_EYE" | "RIGHT_EYE" | "NOSE_TIP" | ...,
  position: { x: number, y: number, z: number }
}
```

### Likelihood Enums
All likelihood fields use these values (in order of likelihood):
- `UNKNOWN`
- `VERY_UNLIKELY`
- `UNLIKELY`
- `POSSIBLE`
- `LIKELY`
- `VERY_LIKELY`

### Expression Likelihoods
| Field | Description |
|-------|-------------|
| `joyLikelihood` | Likelihood of joyful expression |
| `sorrowLikelihood` | Likelihood of sorrowful expression |
| `angerLikelihood` | Likelihood of angry expression |
| `surpriseLikelihood` | Likelihood of surprised expression |

### Quality Attributes
| Field | Description |
|-------|-------------|
| `blurredLikelihood` | Image blur detection |
| `underExposedLikelihood` | Image exposure quality |
| `headwearLikelihood` | Presence of headwear (hat, helmet, etc.) |

## Integration Examples

### Basic Face Detection
```typescript
const base64 = imageDataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

const response = await fetch("/api/vision-face-detect", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageBase64: base64 }),
});

const result = await response.json();

if (result.error) {
  console.error("Face detection failed:", result.error);
} else {
  console.log("Face detected:", result.faces[0]);
}
```

### With Bounding Box Rendering
```typescript
const result = await response.json();

if (result.faces && result.faces.length === 1) {
  const face = result.faces[0];
  const vertices = face.boundingPoly.vertices;
  
  // Draw bounding box on canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  const x = vertices[0].x;
  const y = vertices[0].y;
  const width = vertices[1].x - x;
  const height = vertices[2].y - y;
  
  ctx.strokeStyle = "#22c55e"; // Green
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
}
```

### Face Quality Validation
```typescript
const face = result.faces[0];

// Check image quality
const isBlurred = ["LIKELY", "VERY_LIKELY"].includes(face.blurredLikelihood);
const isUnderExposed = ["LIKELY", "VERY_LIKELY"].includes(face.underExposedLikelihood);
const hasHeadwear = ["LIKELY", "VERY_LIKELY"].includes(face.headwearLikelihood);

if (isBlurred) {
  console.error("Image is too blurry");
}

if (isUnderExposed) {
  console.error("Image is under-exposed");
}

if (hasHeadwear) {
  console.warn("Headwear detected - please remove for verification");
}
```

### Frontal Face Check
```typescript
const face = result.faces[0];

const isFrontal = 
  Math.abs(face.rollAngle) < 10 &&
  Math.abs(face.panAngle) < 15 &&
  Math.abs(face.tiltAngle) < 15;

if (!isFrontal) {
  console.error("Please face the camera directly");
}
```

## Configuration

### Google Cloud Setup

1. **Create Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to IAM & Admin → Service Accounts
   - Create new service account with Vision API permissions

2. **Enable Vision API**:
   - Navigate to APIs & Services → Library
   - Search for "Cloud Vision API"
   - Click "Enable"

3. **Download Credentials**:
   - In Service Accounts, click on your account
   - Go to Keys tab
   - Add Key → Create new key → JSON
   - Save as `google_api.json`

4. **Place Credentials (Local development)**:
  - Create `keys/` directory in project root
  - Move `google_api.json` to `keys/google_api.json`

5. **Place Credentials (Production - Recommended)**:
  - Do not store credentials in source control.
  - Use **Google Secret Manager** to store the `google_api.json` JSON securely and reference the secret in your Cloud Run deployment using `--set-secrets` (see CI/CD config and cloudbuild.yaml).
  - Steps (high-level):
    1. Minify the JSON and add it as a secret in Secret Manager (see commands below).
    2. Grant `roles/secretmanager.secretAccessor` to the Cloud Run service account.
    3. Update your Cloud Build trigger to set `_GOOGLE_SECRET_NAME` to the secret id and ensure `cloudbuild.yaml` uses `--set-secrets` to map it.

  - Example commands (PowerShell / CLI):
  ```powershell
  # Minify credentials locally
  $min = Get-Content "keys/google_api.json" -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
  $min | Out-File -FilePath google_api.min.json -Encoding utf8

  # Create the secret in Secret Manager (one-time)
  gcloud secrets create attendify-google-api-key --data-file=google_api.min.json --replication-policy=automatic

  # Grant the Cloud Run service account access to read the secret
  SERVICE_NAME="attendify-frontend-forked"
  REGION="asia-southeast1"
  PROJECT_ID="$(gcloud config get-value project)"
  SA_NAME=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(spec.template.spec.serviceAccountName)')
  SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
  gcloud secrets add-iam-policy-binding attendify-google-api-key --member=serviceAccount:$SA_EMAIL --role=roles/secretmanager.secretAccessor

  # Add substitution _GOOGLE_SECRET_NAME=attendify-google-api-key in your Cloud Build trigger
  ```

### File Location
```
project-root/
├── keys/
│   └── google_api.json  ← Place credentials here
├── src/
│   └── app/
│       └── api/
│           └── vision-face-detect/
│               └── route.ts  ← API implementation
```

### Environment Variables (Optional)
You can configure credentials using environment variables (local development or CI). Options:

**Path to a JSON key file (development only)**
```bash
GOOGLE_APPLICATION_CREDENTIALS_PATH=keys/google_api.json
```

**Full minified JSON credentials (use Secret Manager or CI substitutions in production)**
```bash
# Not recommended as a plain string in production; prefer Secret Manager
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account", ... }'
```

## Performance Characteristics

### Response Times
- **Typical**: 200-500ms per request
- **First call**: May be slower due to initialization (~1-2s)
- **Batch processing**: Not recommended (use sequential calls)

### Rate Limits
- **Free tier**: 1,000 requests/month
- **Paid tier**: Custom limits based on quota
- **Recommendation**: Implement client-side rate limiting

### Image Size Recommendations
- **Minimum**: 640x480 pixels
- **Recommended**: 1280x720 pixels (720p)
- **Maximum**: 4096x4096 pixels
- **File size**: < 4MB for optimal performance

## Error Handling Best Practices

```typescript
async function detectFace(imageDataUrl: string) {
  try {
    const base64 = imageDataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
    
    const response = await fetch("/api/vision-face-detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64 }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific errors
      if (error.error === "No face detected") {
        return { success: false, message: "No face found. Please center your face in the frame." };
      }
      
      if (error.error === "Multiple faces detected") {
        return { success: false, message: "Multiple faces detected. Please ensure only you are visible." };
      }
      
      if (error.error === "Face detection confidence too low") {
        return { success: false, message: "Face not clear. Please improve lighting and try again." };
      }
      
      return { success: false, message: "Face detection failed. Please try again." };
    }
    
    const result = await response.json();
    return { success: true, faces: result.faces };
    
  } catch (error) {
    console.error("Vision API error:", error);
    return { success: false, message: "Service temporarily unavailable." };
  }
}
```

## Console Logging

The API logs detailed face detection information to the console:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 Google Vision Face Detection Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Detection Confidence: 98.5%
✓ Landmarking Confidence: 95.2%
✓ Face Pose:
  - Roll Angle: 2.3°
  - Pan Angle: -1.2°
  - Tilt Angle: 0.8°
✓ Facial Features Detected: 68 landmarks
✓ Quality Checks:
  - Blurred: VERY_UNLIKELY
  - Under Exposed: VERY_UNLIKELY
  - Headwear: VERY_UNLIKELY
✓ Expressions:
  - Joy: LIKELY
  - Sorrow: VERY_UNLIKELY
  - Anger: VERY_UNLIKELY
  - Surprise: UNLIKELY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Security Considerations

### 1. API Key Protection
- ✅ Keep `google_api.json` in `.gitignore`
- ✅ Never commit credentials to version control
- ✅ Use environment variables in production
- ✅ Rotate keys periodically

### 2. Input Validation
- ✅ Validate image format and size before sending
- ✅ Sanitize base64 input
- ✅ Implement rate limiting per user

### 3. Response Handling
- ✅ Don't expose raw API errors to users
- ✅ Log failures for monitoring
- ✅ Implement retry logic with exponential backoff

### 4. Privacy
- ✅ Don't store raw images longer than necessary
- ✅ Store face encodings instead of images when possible
- ✅ Comply with GDPR/privacy regulations
- ✅ Get user consent for face data processing

## Related Documentation

- [Anti-Spoofing Guide](./ANTI-SPOOFING.md) - Custom liveness detection tests
- [Liveness Tests README](../src/lib/liveness-tests/README.md) - Detailed test documentation
- [Face Camera Usage](../src/components/FACE_CAMERA_USAGE_EXAMPLES.md) - Component integration examples
- [Face Verification Workflow](./FACE_VERIFICATION_WORKFLOW.md) - Complete workflow examples

## Troubleshooting

### "No face detected" errors
- Ensure face is centered and well-lit
- Check image resolution (minimum 640x480)
- Verify face occupies at least 20% of frame
- Remove obstructions (hands, objects covering face)

### "Multiple faces detected" errors
- Ensure only one person in frame
- Check for reflections in background
- Remove photos/posters of faces from background

### "Face detection confidence too low" errors
- Improve lighting conditions
- Ensure camera is in focus
- Increase image resolution
- Face camera directly (avoid extreme angles)

### API authentication errors
- Verify `google_api.json` exists in `keys/` directory
- Check service account has Vision API enabled
- Ensure credentials file is valid JSON
- Verify Vision API is enabled in Google Cloud Console

## Cost Optimization

### Tips to Reduce API Costs
1. **Client-side validation first**: Check image quality before API call
2. **Caching**: Cache results for duplicate images (testing/development)
3. **Batch processing**: Process multiple images in single request when possible
4. **Image optimization**: Resize images to recommended size before sending
5. **Error handling**: Don't retry immediately on failures (use exponential backoff)

### Monitoring Usage
- Set up billing alerts in Google Cloud Console
- Monitor daily/monthly request counts
- Track error rates and optimize validation flow
- Use development/staging quotas separate from production
