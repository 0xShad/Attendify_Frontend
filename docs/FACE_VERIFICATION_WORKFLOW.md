# Face Verification Workflow Examples

## Layered Security Architecture

This document shows the complete face verification workflow with our layered security approach:

**Layer 1: Frontend Anti-Spoofing** (6 liveness tests)
- Blur Detection
- Texture Analysis
- Reflection Analysis
- Color Spectrum Analysis
- Depth Estimation
- Eye Detection (BlazeFace ML)

**Layer 2:Face Validation API Call** (Google Cloud Vision)
- Single face verification
- Detection confidence > 90%
- Face quality checks
- Facial landmark extraction

**Layer 3: Identity Verification** (Optional - Face Matcher)
- Face encoding comparison
- Confidence threshold matching
- Database lookup

---

## Default Workflow: Profile Creation

**Flow**: Capture → Layer 1 (Frontend Liveness) → Layer 2 (Google Vision) → Save Profile

```tsx
import FaceCamera from "@/components/face-camera";
import { useState } from "react";

function ProfileCreation() {
  const [faceValidated, setFaceValidated] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleFaceCapture = (dataUrl: string) => {
    setFaceValidated(true);
    setProfileImage(dataUrl);
    // Image has passed:
    // ✅ Layer 1: All 6 liveness tests
    // ✅ Layer 2: Google Cloud Vision validation
    // Ready to save to database
  };

  const handleRetake = () => {
    setFaceValidated(false);
    setProfileImage(null);
  };

  return (
    <FaceCamera
      onCapture={handleFaceCapture}
      onRetake={handleRetake}
      // No onValidate prop = Uses default layered workflow:
      // 1. Frontend: /api/vision-face-liveness-test (6 tests)
      // 2. Backend: Google Cloud Vision (already called in liveness API)
    />
  );
}
```

**Backend API (`/api/vision-face-liveness-test`)** handles both layers:

```typescript
// src/app/api/vision-face-liveness-test/route.ts
export async function POST(req: NextRequest) {
  const { image, width, height } = await req.json();
  const buffer = Buffer.from(image.replace(/^data:image\/(png|jpeg);base64,/, ""), "base64");

  // LAYER 1: Frontend Anti-Spoofing Tests
  const [blur, texture, reflection, colorSpectrum, depth, eyesOpen] = await Promise.all([
    calculateBlur(buffer),
    analyzeTexture(buffer),
    analyzeReflection(buffer),
    analyzeColorSpectrum(buffer),
    estimateFaceDepth(buffer),
    detectEyesOpen(buffer),
  ]);

  const results = {
    blur: { value: blur, passes: blur > LIVENESS_THRESHOLDS.blur },
    texture: { value: texture, passes: texture > LIVENESS_THRESHOLDS.texture },
    reflection: { value: reflection, passes: reflection > LIVENESS_THRESHOLDS.reflection },
    colorSpectrum: { value: colorSpectrum, passes: colorSpectrum > LIVENESS_THRESHOLDS.colorSpectrum },
    depth: { value: depth, passes: depth > LIVENESS_THRESHOLDS.depth },
    eyesOpen: { value: eyesOpen, passes: eyesOpen },
  };

  const allPassed = Object.values(results).every(r => r.passes);

  if (!allPassed) {
    return NextResponse.json({ passed: false, message: "Liveness tests failed", results });
  }

  // LAYER 2: Google Cloud Vision Validation
  const base64 = image.replace(/^data:image\/(png|jpeg);base64,/, "");
  const visionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/vision-face-detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!visionResponse.ok) {
    const error = await visionResponse.json();
    return NextResponse.json({ passed: false, message: error.error || "Face validation failed" });
  }

  const visionResult = await visionResponse.json();

  return NextResponse.json({ 
    passed: true, 
    message: "All security checks passed",
    results,
    faceData: visionResult.faces[0]
  });
}
```

---

## Extended Workflow: Attendance with Face Matching

**Flow**: Capture → Layer 1 (Liveness) → Layer 2 (Vision) → Layer 3 (Face Matcher) → Mark Attendance

```tsx
import FaceCamera from "@/components/face-camera";
import { useState } from "react";

function AttendanceCheckIn() {
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  // Custom validation: All 3 layers
  const handleAttendanceValidation = async (
    dataUrl: string, 
    width: number, 
    height: number
  ) => {
    try {
      // LAYER 1 + 2: Combined liveness and face validation
      const livenessResponse = await fetch("/api/vision-face-liveness-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, width, height }),
      });
      const livenessResult = await livenessResponse.json();

      if (!livenessResult.passed) {
        // Check which specific test failed
        const failedTests = Object.entries(livenessResult.results || {})
          .filter(([_, test]: any) => !test.passes)
          .map(([name]) => name);
        
        return {
          passed: false,
          message: `Security check failed: ${failedTests.join(", ")}`
        };
      }

      // LAYER 3: Face Matching (compare with enrolled students)
      const matchResponse = await fetch("/api/attendance/face-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          faceImage: dataUrl,
          classId: "CS101",
          sessionId: "SESSION123",
          timestamp: new Date().toISOString()
        }),
      });
      const matchResult = await matchResponse.json();

      if (!matchResult.matched || matchResult.confidence < 0.85) {
        return {
          passed: false,
          message: `Face not recognized (${(matchResult.confidence * 100).toFixed(1)}% confidence). Please contact your instructor.`
        };
      }

      // All 3 layers passed!
      return {
        passed: true,
        message: `Welcome ${matchResult.studentName}! Attendance marked (${(matchResult.confidence * 100).toFixed(1)}% match)`,
        metadata: {
          studentId: matchResult.studentId,
          studentName: matchResult.studentName,
          confidence: matchResult.confidence,
          livenessResults: livenessResult.results,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error("Attendance validation error:", error);
      return {
        passed: false,
        message: "System error. Please try again or contact support."
      };
    }
  };

  const handleAttendanceSuccess = (dataUrl: string) => {
    setAttendanceMarked(true);
    console.log("Attendance marked successfully!");
  };

  return (
    <div>
      <h2>Check In - CS101</h2>
      {!attendanceMarked ? (
        <FaceCamera
          onCapture={handleAttendanceSuccess}
          onValidate={handleAttendanceValidation}
        />
      ) : (
        <div className="success-message">
          ✅ Attendance marked successfully!
        </div>
      )}
    </div>
  );
}
```

---

## Login Workflow with Face Matching

**Flow**: Capture → Layer 1 (Liveness) → Layer 2 (Vision) → Layer 3 (Face Matcher) → Login

```tsx
import FaceCamera from "@/components/face-camera";
import { useState } from "react";

function FaceLogin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleLoginValidation = async (
    dataUrl: string, 
    width: number, 
    height: number
  ) => {
    try {
      // LAYER 1 + 2: Liveness + Google Vision
      const livenessResponse = await fetch("/api/vision-face-liveness-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, width, height }),
      });
      const livenessResult = await livenessResponse.json();

      if (!livenessResult.passed) {
        return {
          passed: false,
          message: "Anti-spoofing check failed. Please ensure you're using a live camera."
        };
      }

      // LAYER 3: Face Matching with enrolled users
      const matchResponse = await fetch("/api/auth/face-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          faceImage: dataUrl,
          faceData: livenessResult.faceData // Pass face landmarks for better matching
        }),
      });
      const matchResult = await matchResponse.json();

      if (!matchResult.matched) {
        return {
          passed: false,
          message: "Face not recognized. Please register first."
        };
      }

      if (matchResult.confidence < 0.90) {
        return {
          passed: false,
          message: `Confidence too low (${(matchResult.confidence * 100).toFixed(1)}%). Please try again in better lighting.`
        };
      }

      // All layers passed!
      return {
        passed: true,
        message: `Welcome back, ${matchResult.user.name}!`,
        metadata: {
          userId: matchResult.user.id,
          userName: matchResult.user.name,
          userRole: matchResult.user.role,
          confidence: matchResult.confidence,
          loginTimestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error("Login validation error:", error);
      return {
        passed: false,
        message: "Authentication service unavailable"
      };
    }
  };

  const handleLoginSuccess = (imageDataUrl: string) => {
    setLoggedIn(true);
    console.log("User logged in successfully");
    // Redirect to dashboard
  };

  return (
    <div>
      <h1>Secure Face Login</h1>
      {!loggedIn ? (
        <FaceCamera
          onCapture={handleLoginSuccess}
          onValidate={handleLoginValidation}
        />
      ) : (
        <div>Welcome! Redirecting to dashboard...</div>
      )}
    </div>
  );
}
```

---

## Layered Security Details

### Layer 1: Frontend Anti-Spoofing (6 Tests)

**Location**: `/api/vision-face-liveness-test` (runs server-side but called from frontend)

| Test | Purpose | Threshold | What It Detects |
|------|---------|-----------|-----------------|
| Blur Detection | Image sharpness | 120 | Photos of photos, blurry images |
| Texture Analysis | Skin texture | 0.20 | Flat printed photos vs real skin |
| Reflection Analysis | Lighting patterns | 0.28 | Screen glare, artificial highlights |
| Color Spectrum | Skin tones | 0.40 | Unnatural colors, screen artifacts |
| Depth Estimation | 3D structure | 0.50 | Flat 2D images vs 3D faces |
| Eye Detection | Eyes open & frontal | Min: 650, Balance: 0.40 | Closed/squinted eyes, wrong pose |

**Technologies**:
- Pure JavaScript ML (TensorFlow.js + BlazeFace)
- Sharp library for image processing
- Node.js compatible (no native dependencies)

---

### Layer 2: Backend Face Validation (Google Cloud Vision)

**Location**: `/api/vision-face-detect`

**Checks**:
- ✅ Exactly one face detected
- ✅ Detection confidence ≥ 90%
- ✅ Face quality checks (blur, exposure)
- ✅ Facial landmarks extraction (68+ points)

**Returns**:
```json
{
  "faces": [{
    "detectionConfidence": 0.98,
    "boundingPoly": { "vertices": [...] },
    "landmarks": [...],
    "blurredLikelihood": "VERY_UNLIKELY",
    "underExposedLikelihood": "VERY_UNLIKELY"
  }]
}
```

---

### Layer 3: Identity Verification (Optional - Face Matcher)

**Location**: Your custom API (e.g., `/api/attendance/face-match`, `/api/auth/face-match`)

**Implementations**:
1. **Database Lookup**: Compare face encoding with stored encodings
2. **Third-party Service**: Use services like AWS Rekognition, Azure Face API
3. **Custom ML Model**: Use libraries like face-api.js, dlib, FaceNet

**Example Backend (Face Matcher)**:
```typescript
// src/app/api/attendance/face-match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { compareFaces } from "@/lib/face-matcher"; // Your implementation

export async function POST(req: NextRequest) {
  const { faceImage, classId, sessionId } = await req.json();

  // 1. Extract face encoding from captured image
  const capturedEncoding = await extractFaceEncoding(faceImage);

  // 2. Get enrolled students for this class
  const enrolledStudents = await db.query(
    "SELECT id, name, face_encoding FROM students WHERE class_id = $1",
    [classId]
  );

  // 3. Compare with each enrolled student
  let bestMatch = null;
  let highestConfidence = 0;

  for (const student of enrolledStudents) {
    const confidence = await compareFaces(
      capturedEncoding,
      student.face_encoding
    );

    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      bestMatch = student;
    }
  }

  // 4. Check confidence threshold
  if (highestConfidence < 0.85) {
    return NextResponse.json({
      matched: false,
      confidence: highestConfidence
    });
  }

  // 5. Mark attendance
  await db.query(
    "INSERT INTO attendance (student_id, session_id, timestamp) VALUES ($1, $2, NOW())",
    [bestMatch.id, sessionId]
  );

  return NextResponse.json({
    matched: true,
    studentId: bestMatch.id,
    studentName: bestMatch.name,
    confidence: highestConfidence
  });
}
```

---

## Complete API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: FaceCamera Component                              │
├─────────────────────────────────────────────────────────────┤
│ 1. User blinks (passive liveness)                           │
│ 2. Countdown (3, 2, 1)                                      │
│ 3. Capture photo                                            │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Frontend Anti-Spoofing                             │
│ POST /api/vision-face-liveness-test                         │
├─────────────────────────────────────────────────────────────┤
│ ✓ Blur Detection (variance > 120)                           │
│ ✓ Texture Analysis (score > 0.20)                           │
│ ✓ Reflection Analysis (score > 0.28)                        │
│ ✓ Color Spectrum (score > 0.40)                             │
│ ✓ Depth Estimation (score > 0.50)                           │
│ ✓ Eye Detection (variance > 650, balance > 0.40)            │
└─────────────────────┬───────────────────────────────────────┘
                      ↓ (if all pass)
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Backend Face Validation                            │
│ POST /api/vision-face-detect (Google Cloud Vision)          │
├─────────────────────────────────────────────────────────────┤
│ ✓ Single face check (exactly 1 face)                        │
│ ✓ Detection confidence ≥ 90%                                │
│ ✓ Face quality (blur, exposure)                             │
│ ✓ Extract facial landmarks                                  │
└─────────────────────┬───────────────────────────────────────┘
                      ↓ (if valid)
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Identity Verification (Optional)                   │
│ POST /api/[attendance|auth]/face-match                      │
├─────────────────────────────────────────────────────────────┤
│ ✓ Extract face encoding                                     │
│ ✓ Compare with database                                     │
│ ✓ Find best match                                           │
│ ✓ Check confidence threshold (≥ 85%)                        │
│ ✓ Return match result                                       │
└─────────────────────┬───────────────────────────────────────┘
                      ↓ (if matched)
┌─────────────────────────────────────────────────────────────┐
│ SUCCESS: Action Completed                                   │
├─────────────────────────────────────────────────────────────┤
│ • Profile Created (save to database)                        │
│ • Attendance Marked (insert record)                         │
│ • User Logged In (create session)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## API Response Formats

### Layer 1 Response (`/api/vision-face-liveness-test`)

**Success**:
```json
{
  "passed": true,
  "message": "All security checks passed",
  "results": {
    "blur": { "value": 245.8, "passes": true },
    "texture": { "value": 0.32, "passes": true },
    "reflection": { "value": 0.41, "passes": true },
    "colorSpectrum": { "value": 0.58, "passes": true },
    "depth": { "value": 0.67, "passes": true },
    "eyesOpen": { "value": true, "passes": true }
  },
  "faceData": { /* Google Vision data */ }
}
```

**Failure**:
```json
{
  "passed": false,
  "message": "Liveness tests failed",
  "results": {
    "blur": { "value": 85.2, "passes": false },
    "texture": { "value": 0.15, "passes": false },
    /* ... */
  }
}
```

### Layer 2 Response (`/api/vision-face-detect`)

**Success**:
```json
{
  "faces": [{
    "detectionConfidence": 0.98,
    "boundingPoly": { "vertices": [...] },
    "landmarks": [...],
    "blurredLikelihood": "VERY_UNLIKELY"
  }]
}
```

**Failure**:
```json
{
  "error": "Multiple faces detected"
}
```

### Layer 3 Response (Custom Face Matcher)

**Success**:
```json
{
  "matched": true,
  "studentId": "ST12345",
  "studentName": "John Doe",
  "confidence": 0.94
}
```

**Failure**:
```json
{
  "matched": false,
  "confidence": 0.67
}
```

---

## Best Practices

### 1. Profile Creation
**Use**: Layer 1 + Layer 2 (no face matching needed)
```tsx
<FaceCamera onCapture={saveProfile} />
// Default behavior: Liveness + Google Vision
```

### 2. Attendance
**Use**: All 3 Layers (need to identify student)
```tsx
<FaceCamera onCapture={markAttendance} onValidate={attendanceValidation} />
// Custom validation: Liveness + Vision + Face Match
```

### 3. Login/Authentication
**Use**: All 3 Layers (need to identify user)
```tsx
<FaceCamera onCapture={loginUser} onValidate={loginValidation} />
// Custom validation: Liveness + Vision + Face Match
```

### 4. Quick Photo Capture (Testing)
**Use**: Skip all layers
```tsx
<FaceCamera onCapture={save} skipLivenessCheck={true} />
// ⚠️ Only for development/testing!
```

---

## Security Considerations

### Defense in Depth
Each layer provides independent security:
- **Layer 1 fails**: Prevents photos, screens, masks
- **Layer 2 fails**: Ensures face quality and validity  
- **Layer 3 fails**: Prevents unauthorized access

### Bypass Protection
- ❌ Cannot bypass Layer 1 (server-side processing)
- ❌ Cannot bypass Layer 2 (Google Cloud validation)
- ❌ Cannot bypass Layer 3 (database-backed matching)

### Failure Handling
- **Any layer fails** → Entire validation fails
- **Clear error messages** → User knows what to fix
- **Retry mechanism** → User can attempt again

---

## Related Documentation

- [Liveness Tests README](../src/lib/liveness-tests/README.md) - Layer 1 detailed documentation
- [Google Cloud Vision Guide](./GOOGLE-CLOUD-VISION.md) - Layer 2 API documentation
- [Face Camera Usage](../src/components/FACE_CAMERA_USAGE_EXAMPLES.md) - Component integration
- [Anti-Spoofing Guide](./ANTI-SPOOFING.md) - Security overview

---

## Summary

✅ **Default Workflow** (Profile Creation):
```
Capture → Layer 1 (6 tests) → Layer 2 (Google Vision) → Save
```

✅ **Extended Workflow** (Attendance/Login):
```
Capture → Layer 1 (6 tests) → Layer 2 (Google Vision) → Layer 3 (Face Match) → Action
```

✅ **All workflows**:
- Start with passive liveness (blink detection)
- Include countdown for user preparation
- Run anti-spoofing tests (Layer 1)
- Validate face with Google (Layer 2)
- Optionally match identity (Layer 3)
- Return clear success/failure messages
