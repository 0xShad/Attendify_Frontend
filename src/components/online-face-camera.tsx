import React, { useRef, useState, useEffect } from "react";
import { useBlinkLiveness } from "./use-blink-liveness";
import { Button } from "@/components/ui/button";

interface OnlineFaceCameraProps {
  onCapture: (dataUrl: string) => void;
  onRetake?: () => void;
  onValidate?: (dataUrl: string, width: number, height: number) => Promise<{
    passed: boolean;
    message?: string;
    processedImage?: string;
    metadata?: any;
  }>;
  skipFaceDetect?: boolean;
  skipLivenessCheck?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export default function OnlineFaceCamera({
  onCapture,
  onRetake,
  onValidate,
  skipFaceDetect = false,
  skipLivenessCheck = false,
  width = 320,
  height = 240,
  className = "",
}: OnlineFaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingBoxed, setPendingBoxed] = useState<string | null>(null);
  const [pendingDetection, setPendingDetection] = useState<null | { success: boolean; message: string; faces?: any[] }>(null);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [livenessResult, setLivenessResult] = useState<null | { success: boolean; message: string }>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [livenessLocked, setLivenessLocked] = useState(false);
  const [checkingLiveness, setCheckingLiveness] = useState(false);
  const { blinkDetected, livenessLoading, reset: resetBlink } = useBlinkLiveness(videoRef, streaming && !livenessLocked);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch {}
        setStreaming(true);
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera access.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  // start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // blink -> countdown -> capture flow (copied logic simplified)
  useEffect(() => {
    if (blinkDetected && !detecting && countdown === null && !livenessLocked) {
      setCountdown(3);
      return;
    }
    if (countdown !== null) {
      if (countdown > 0) {
        const t = setTimeout(() => setCountdown((c) => (c != null ? c - 1 : null)), 1000);
        return () => clearTimeout(t);
      } else if (countdown === 0 && !detecting && !livenessLocked) {
        setDetecting(true);
        setLivenessLocked(true);
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            try { ctx.drawImage(videoRef.current, 0, 0, width, height); } catch (e) { console.warn('drawImage failed', e); }
            const dataUrl = canvasRef.current.toDataURL('image/png');
            setPendingImage(dataUrl);
            setPendingBoxed(null);
            setPendingDetection(null);
            stopCamera();
            setTimeout(async () => {
              try {
                setCheckingLiveness(true);
                let validationResult: any;
                if (skipLivenessCheck) {
                  validationResult = { passed: true, message: 'Validation skipped' };
                } else if (onValidate) {
                  validationResult = await onValidate(dataUrl, width, height);
                } else {
                  const resp = await fetch('/api/vision-face-liveness-test', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: dataUrl, width, height }),
                  });
                  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
                  validationResult = await resp.json();
                }
                setCheckingLiveness(false);
                setLivenessResult({ success: validationResult.passed, message: validationResult.passed ? 'Validation passed.' : (validationResult.message || 'Validation failed.') });
                setLivenessPassed(!!validationResult.passed);
                if (validationResult.passed) {
                  if (skipFaceDetect) {
                    setPendingDetection({ success: true, message: 'Face detection skipped', faces: [{ detectionConfidence: 1 }] });
                    setPendingBoxed(validationResult.processedImage || dataUrl);
                  }
                  const imageToReturn = validationResult.processedImage || dataUrl;
                  onCapture(imageToReturn);
                }

                if (validationResult.passed && !skipFaceDetect) {
                  // run face-detect as before
                  const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
                  const r2 = await fetch('/api/vision-face-detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }) });
                  const res2 = await r2.json();
                  const faces = res2.faces;
                  if (faces && faces.length === 1) {
                    setPendingDetection({ success: true, message: 'Face detected!', faces });
                    const img = new window.Image();
                    img.onload = () => {
                      const tempCanvas = document.createElement('canvas');
                      tempCanvas.width = width; tempCanvas.height = height;
                      const tctx = tempCanvas.getContext('2d');
                      if (tctx) {
                        tctx.drawImage(img, 0, 0, width, height);
                        faces.forEach((face: any) => {
                          if (face.boundingPoly && face.boundingPoly.vertices) {
                            const v = face.boundingPoly.vertices; const x = v[0]?.x || 0; const y = v[0]?.y || 0;
                            const w = (v[1]?.x || 0) - x; const h = (v[2]?.y || 0) - y;
                            tctx.save(); tctx.strokeStyle = '#22c55e'; tctx.lineWidth = 3; tctx.strokeRect(x, y, w, h); tctx.restore();
                          }
                        });
                        setPendingBoxed(tempCanvas.toDataURL('image/png'));
                      }
                    };
                    img.src = dataUrl;
                  } else if (faces && faces.length > 1) {
                    setPendingDetection({ success: false, message: 'Multiple faces detected. Please ensure only your face is visible and try again.' });
                    setPendingBoxed(null);
                  } else {
                    setPendingDetection({ success: false, message: 'No face detected. Please try again.' });
                    setPendingBoxed(null);
                  }
                }
              } catch (err: any) {
                console.error('Validation error', err);
                setCheckingLiveness(false);
                let msg = 'Validation error. Please try again.';
                if (err instanceof Error) msg = err.message || msg;
                setLivenessResult({ success: false, message: msg });
                setLivenessPassed(false);
              }
              setDetecting(false);
            }, 300);
          }
        }
        setCountdown(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blinkDetected, countdown, detecting, width, height, onCapture]);

  const handleRetake = () => {
    // Clear previous result and reset detection locks so blink detection can run again
    setLivenessResult(null);
    setLivenessPassed(false);
    setCountdown(null);
    setPendingImage(null);
    setPendingBoxed(null);
    setPendingDetection(null);
    setDetecting(false);
    setCheckingLiveness(false);
    setLivenessLocked(false);
    resetBlink();
    if (onRetake) onRetake();
    // Restart camera and detection
    startCamera();
  };

  return (
    <div className={className}>
      {/* top preview removed - main preview will display the captured/boxed image to avoid duplicate UI */}

      <div className="relative">
        {(pendingBoxed || pendingImage) ? (
          <img src={pendingBoxed || pendingImage} width={width} height={height} className="rounded-lg border shadow" alt="Captured face" />
        ) : (
          <video ref={videoRef} width={width} height={height} className="rounded-lg border shadow" autoPlay muted playsInline />
        )}
        {checkingLiveness && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg text-white">
            <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <div className="text-white font-semibold text-center mt-3">Verifying liveness...</div>
          </div>
        )}
      </div>
      {/* pending detection / boxed image message */}
      {pendingDetection && (
        <div className="mt-3">
          <div className={pendingDetection.success ? 'text-green-700 text-sm' : 'text-red-600 text-sm'}>{pendingDetection.message}</div>
        </div>
      )}
      <canvas ref={canvasRef} width={width} height={height} style={{ display: 'none' }} />
      {!blinkDetected && !livenessPassed && !checkingLiveness && (
        <div className="text-blue-700 font-semibold text-center mt-2">Please blink your eyes naturally.<br/>We are verifying liveness...</div>
      )}
      {livenessLoading && !checkingLiveness && <div className="text-xs text-gray-500 mt-1">Detecting blink...</div>}
      {livenessResult && <div className={livenessResult.success ? 'text-green-700 text-sm mt-2' : 'text-red-600 text-sm mt-2'}>{livenessResult.message}</div>}
      <div className="flex gap-2 mt-3">
        <Button variant="outline" onClick={handleRetake}>Retry</Button>
      </div>
    </div>
  );
}
