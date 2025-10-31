// src/components/use-blink-liveness.ts

// React hook for browser-based blink detection using face-api.js
//
// Install dependencies:
//   npm install @vladmandic/face-api
//
// Usage:
//   import { useBlinkLiveness } from './use-blink-liveness';
//   const { blinkDetected, livenessLoading } = useBlinkLiveness(videoRef);
//
// The hook will set blinkDetected=true when a blink is detected in the video stream.

import { useEffect, useRef, useState } from "react";



export function useBlinkLiveness(
  videoRef: React.RefObject<HTMLVideoElement>,
  streaming: boolean
) {
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [livenessLoading, setLivenessLoading] = useState(false);
  const lastEyeState = useRef<'open' | 'closed'>('open');
  const blinkCount = useRef(0);

  // Reset function to allow new blink detection
  const reset = () => {
    setBlinkDetected(false);
    lastEyeState.current = 'open';
    blinkCount.current = 0;
  };

  useEffect(() => {
    // Only run on client and when streaming is true
    if (typeof window === "undefined" || !videoRef.current || !streaming) return;
    let running = true;
    let model: any = null;
    let rafId: number;

    async function loadModelAndDetect() {
      setLivenessLoading(true);
      console.log('[BlinkLiveness] Loading face-api.js...');
      const faceapi = await import('@vladmandic/face-api');
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
      model = faceapi;
      console.log('[BlinkLiveness] Models loaded. Starting detection loop.');
      setLivenessLoading(false);
      detectLoop();
    }

    async function detectLoop() {
      if (!running || !videoRef.current || !model) return;
      // Ensure video is ready
      if (videoRef.current.readyState < 2) {
        rafId = requestAnimationFrame(detectLoop);
        return;
      }
      try {
        const detections = await model.detectAllFaces(
          videoRef.current,
          new model.TinyFaceDetectorOptions()
        ).withFaceLandmarks(true);
        console.log('[BlinkLiveness] Detections:', detections);
        if (detections && detections.length > 0) {
          const keypoints = detections[0].landmarks.positions;
          const leftEAR = eyeAspectRatio(keypoints, 36, 37, 41, 39);
          const rightEAR = eyeAspectRatio(keypoints, 42, 43, 47, 45);
          console.log('[BlinkLiveness] EAR values:', leftEAR, rightEAR);
          // Try a more sensitive threshold
          const EAR_THRESHOLD = 0.26;
          if (leftEAR < EAR_THRESHOLD && rightEAR < EAR_THRESHOLD) {
            if (lastEyeState.current === 'open') {
              blinkCount.current += 1;
              lastEyeState.current = 'closed';
              console.log('[BlinkLiveness] Blink detected!');
              if (blinkCount.current >= 1) {
                setBlinkDetected(true);
                running = false;
                return;
              }
            }
          } else {
            lastEyeState.current = 'open';
          }
        } else {
          console.log('[BlinkLiveness] No face detected.');
        }
      } catch (e) {
        console.error('[BlinkLiveness] Detection error:', e);
      }
      rafId = requestAnimationFrame(detectLoop);
    }

    loadModelAndDetect();

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (model && typeof model.dispose === "function") model.dispose();
    };
  }, [videoRef, streaming]);

  // Eye Aspect Ratio calculation helper for face-api.js landmarks
  function eyeAspectRatio(keypoints: any[], left: number, top: number, bottom: number, right: number) {
    // EAR = (||top-bottom||) / (||left-right||)
    const pt = (i: number) => keypoints[i] ? [keypoints[i].x, keypoints[i].y] : [0,0];
    const dist = (a: number[], b: number[]) => Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
    return dist(pt(top), pt(bottom)) / dist(pt(left), pt(right));
  }

  return { blinkDetected, livenessLoading, reset };
}
