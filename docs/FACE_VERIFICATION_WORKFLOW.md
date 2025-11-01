# Face Verification Workflow Examples

## Workflow: Face-Camera → Liveness/Cloud Vision → Face Matcher

This document shows how to chain multiple validation steps and optionally return processed images.

---

## Example 1: Profile Creation with Liveness Check

**Flow**: Capture → Liveness API → Save to Profile

```tsx
import FaceCamera from "@/components/face-camera";
import { useState } from "react";

function ProfileCreation() {
  const [faceValidated, setFaceValidated] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleFaceCapture = (dataUrl: string) => {
    setFaceValidated(true);
    setProfileImage(dataUrl);
    // Image has already passed liveness checks
    // You can now save to database
  };

  const handleRetake = () => {
    setFaceValidated(false);
    setProfileImage(null);
  };

  return (
    <FaceCamera
      onCapture={handleFaceCapture}
      onRetake={handleRetake}
      // Uses default /api/vision-face-liveness-test
    />
  );
}
```

---

## Example 2: Attendance with Liveness + Face Matching

**Flow**: Capture → Liveness API → Face Matcher API → Mark Attendance

```tsx
import FaceCamera from "@/components/face-camera";
import { useState } from "react";

function AttendanceCheckIn() {
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  // Custom validation: Liveness + Face Detection + Face Matching
  const handleAttendanceValidation = async (
    dataUrl: string, 
    width: number, 
    height: number
  ) => {
    try {
      // Step 1: Liveness Check (anti-spoofing)
      const livenessResponse = await fetch("/api/vision-face-liveness-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, width, height }),
      });
      const livenessResult = await livenessResponse.json();

      if (!livenessResult.passed) {
        return {
          passed: false,
          message: "Liveness check failed: " + (livenessResult.message || "Anti-spoofing detection triggered")
        };
      }

      // Step 2: Face Detection (Google Cloud Vision)
      const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
      const detectionResponse = await fetch("/api/vision-face-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const detectionResult = await detectionResponse.json();

      if (!detectionResult.faces || detectionResult.faces.length !== 1) {
        return {
          passed: false,
          message: detectionResult.faces?.length > 1 
            ? "Multiple faces detected" 
            : "No face detected"
        };
      }

      // Step 3: Face Matching (compare with enrolled students)
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

      // All checks passed!
      return {
        passed: true,
        message: `Welcome ${matchResult.studentName}! Attendance marked (${(matchResult.confidence * 100).toFixed(1)}% match)`,
        metadata: {
          studentId: matchResult.studentId,
          studentName: matchResult.studentName,
          confidence: matchResult.confidence,
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
    // Attendance already marked in the validation step
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

## Example 3: Login with Liveness + Face Matching + Cropped Face Return

**Flow**: Capture → Liveness API → Face Detect → Return Cropped Face → Face Matcher → Login

This example shows how to return a processed/cropped image from validation.

```tsx
import FaceCamera from "@/components/face-camera";
import { useState } from "react";

function FaceLogin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Custom validation that returns a cropped face image
  const handleLoginValidation = async (
    dataUrl: string, 
    width: number, 
    height: number
  ) => {
    try {
      // Step 1: Liveness + Face Detection in one API call
      const validateResponse = await fetch("/api/auth/validate-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: dataUrl, 
          width, 
          height,
          returnCroppedFace: true // Request cropped face image
        }),
      });
      const validateResult = await validateResponse.json();

      if (!validateResult.livenessCheck.passed) {
        return {
          passed: false,
          message: "Liveness verification failed"
        };
      }

      if (!validateResult.faceDetected) {
        return {
          passed: false,
          message: "No face detected"
        };
      }

      // Step 2: Match the cropped face with enrolled users
      const matchResponse = await fetch("/api/auth/face-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          // Use the cropped face for better matching accuracy
          faceImage: validateResult.croppedFace || dataUrl,
          faceEncoding: validateResult.faceEncoding // Optional: pre-computed encoding
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

      // Success! Return cropped face and user data
      return {
        passed: true,
        message: `Welcome back, ${matchResult.user.name}!`,
        processedImage: validateResult.croppedFace, // Return cropped face instead of original
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
    // imageDataUrl will be the cropped face if processedImage was returned
    setLoggedIn(true);
    console.log("User logged in with face:", imageDataUrl);
    
    // You can now:
    // 1. Store session token
    // 2. Redirect to dashboard
    // 3. Update user context
  };

  return (
    <div>
      <h1>Face Login</h1>
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

## Example 4: Return Boxed Face Image

**Flow**: Capture → Liveness → Face Detect → Draw Bounding Box → Return Boxed Image

```tsx
const handleValidationWithBox = async (
  dataUrl: string, 
  width: number, 
  height: number
) => {
  // Step 1: Liveness
  const livenessRes = await fetch("/api/vision-face-liveness-test", {
    method: "POST",
    body: JSON.stringify({ image: dataUrl, width, height }),
  });
  const livenessResult = await livenessRes.json();

  if (!livenessResult.passed) {
    return { passed: false, message: "Liveness failed" };
  }

  // Step 2: Face Detection
  const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
  const detectRes = await fetch("/api/vision-face-detect", {
    method: "POST",
    body: JSON.stringify({ imageBase64: base64 }),
  });
  const detectResult = await detectRes.json();

  if (!detectResult.faces || detectResult.faces.length !== 1) {
    return { passed: false, message: "Face detection failed" };
  }

  // Step 3: Draw bounding box on image
  const face = detectResult.faces[0];
  const boxedImage = await drawBoundingBox(dataUrl, face.boundingPoly.vertices, width, height);

  return {
    passed: true,
    message: "Face verified successfully",
    processedImage: boxedImage, // Return image with bounding box
    metadata: {
      faceCoordinates: face.boundingPoly.vertices,
      detectionConfidence: face.detectionConfidence
    }
  };
};

// Helper function to draw bounding box
async function drawBoundingBox(
  imageDataUrl: string, 
  vertices: any[], 
  width: number, 
  height: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      
      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Draw bounding box
      const x = vertices[0]?.x || 0;
      const y = vertices[0]?.y || 0;
      const w = (vertices[1]?.x || 0) - x;
      const h = (vertices[2]?.y || 0) - y;
      
      ctx.strokeStyle = "#22c55e"; // Green
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      
      // Return as data URL
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = imageDataUrl;
  });
}
```

---

## API Response Format

Your validation function should return:

```typescript
{
  passed: boolean;              // Required: true = success, false = fail
  message?: string;             // Optional: User-friendly message
  processedImage?: string;      // Optional: Base64 data URL of processed image
  metadata?: any;               // Optional: Additional data to pass along
}
```

### Example Success Response (Simple)
```json
{
  "passed": true,
  "message": "Verification successful"
}
```

### Example Success Response (With Processed Image)
```json
{
  "passed": true,
  "message": "Face verified and cropped",
  "processedImage": "data:image/png;base64,iVBORw0KG...",
  "metadata": {
    "faceCoordinates": { "x": 100, "y": 80, "width": 120, "height": 140 },
    "confidence": 0.96,
    "studentId": "ST12345"
  }
}
```

### Example Failure Response
```json
{
  "passed": false,
  "message": "Multiple faces detected. Please ensure only your face is visible."
}
```

---

## How `processedImage` Works

1. **If validation returns `processedImage`**:
   - `onCapture(processedImage)` is called with the processed image
   - Original image is not passed to parent component

2. **If validation doesn't return `processedImage`**:
   - `onCapture(originalDataUrl)` is called with the original captured image

3. **Example Use Cases**:
   - Return cropped face for better matching accuracy
   - Return image with bounding box for display
   - Return normalized/enhanced image for storage
   - Return face encoding instead of raw image

---

## Complete Backend API Structure

### `/api/vision-face-liveness-test` (Default)
```typescript
POST /api/vision-face-liveness-test
Body: { image: string, width: number, height: number }
Response: { passed: boolean, message: string }
```

### `/api/vision-face-detect` (Google Cloud Vision)
```typescript
POST /api/vision-face-detect
Body: { imageBase64: string }
Response: { 
  faces: Array<{
    boundingPoly: { vertices: Array<{x, y}> },
    detectionConfidence: number
  }>
}
```

### `/api/attendance/face-match` (Custom)
```typescript
POST /api/attendance/face-match
Body: { 
  faceImage: string, 
  classId: string, 
  sessionId: string,
  timestamp: string
}
Response: { 
  matched: boolean,
  studentId?: string,
  studentName?: string,
  confidence?: number
}
```

---

## Summary

**Your Workflow Works! ✅**

```
User Opens Camera
      ↓
Blink Detection
      ↓
Countdown & Capture
      ↓
[onValidate Function]
      ↓
Step 1: Liveness Check (/api/vision-face-liveness-test)
      ↓ (if passed)
Step 2: Face Detection (/api/vision-face-detect)
      ↓ (if detected)
Step 3: Face Matching (/api/face-match)
      ↓ (if matched)
Return: { passed: true, processedImage?: croppedFace, metadata }
      ↓
onCapture(processedImage || originalImage)
      ↓
Success! Use image for attendance/login/etc.
```

**Key Points**:
- ✅ You can chain multiple API calls in `onValidate`
- ✅ You can return a processed/cropped image via `processedImage`
- ✅ You can pass metadata (student info, coordinates, etc.)
- ✅ Component is fully backward compatible
- ✅ Each validation step can fail independently with custom messages
