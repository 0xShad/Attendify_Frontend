import React, { useRef, useState } from "react";
import { useBlinkLiveness } from "./use-blink-liveness";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";


interface FaceCameraProps {
  onCapture: (dataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

export default function FaceCamera({ onCapture, width = 320, height = 240, className = "" }: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null); // last submitted
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [faceDetection, setFaceDetection] = useState<null | { success: boolean; message: string; faces?: any[] }>(null);
  const [boxedImage, setBoxedImage] = useState<string | null>(null); // last submitted
  // For retake, hold temporary state until new detection is done
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingBoxed, setPendingBoxed] = useState<string | null>(null);
  const [pendingDetection, setPendingDetection] = useState<null | { success: boolean; message: string; faces?: any[] }>(null);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [livenessResult, setLivenessResult] = useState<null | { success: boolean; message: string }>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [livenessLocked, setLivenessLocked] = useState(false);
  const { blinkDetected, livenessLoading, reset: resetBlink } = useBlinkLiveness(videoRef, streaming && !livenessLocked);

  const startCamera = async () => {
    setError(null);
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera access.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };



  // Top-level countdown/capture effect: handles blink, countdown, and photo capture
  React.useEffect(() => {
    // Debug: log state transitions
    console.log('[FaceCamera] useEffect triggered', { blinkDetected, detecting, countdown });
    // Start countdown when blink is detected and not already counting down or detecting
    if (blinkDetected && !detecting && countdown === null && !livenessLocked) {
      console.log('[FaceCamera] Blink detected, starting countdown');
      setCountdown(3);
      return;
    }
    // Handle countdown
    if (countdown !== null) {
      if (countdown > 0) {
        console.log(`[FaceCamera] Countdown: ${countdown}`);
        const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
        return () => clearTimeout(timer);
  } else if (countdown === 0 && !detecting && !livenessLocked) {
        // Prevent double execution
        console.log('[FaceCamera] Countdown reached 0, capturing photo and running liveness test');
  setDetecting(true);
  setLivenessLocked(true); // lock further detection until retry
        // Capture and send to anti-spoofing API
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, width, height);
            const dataUrl = canvasRef.current.toDataURL("image/png");
            setPendingImage(dataUrl);
            setPendingBoxed(null);
            setPendingDetection(null);
            // Do NOT close modal yet
            stopCamera();
            setTimeout(async () => {
              try {
                console.log('[FaceCamera] Sending image to /api/vision-face-liveness-test');
                const response = await fetch("/api/vision-face-liveness-test", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image: dataUrl, width, height }),
                });
                const livenessResult = await response.json();
                console.log('[FaceCamera] Liveness API response:', livenessResult);
                setLivenessResult({ success: livenessResult.passed, message: livenessResult.passed ? "Liveness check passed." : (livenessResult.message || "Liveness check failed.") });
                setLivenessPassed(!!livenessResult.passed);
                if (livenessResult.passed) {
                  console.log('[FaceCamera] Liveness passed, closing modal and calling onCapture');
                  setOpen(false);
                  onCapture(dataUrl);
                  // Camera already stopped, livenessLocked remains true
                }
                // Optionally, you can also send to face detection API if liveness passed
                if (livenessResult.passed) {
                  const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
                  console.log('[FaceCamera] Sending image to /api/vision-face-detect');
                  const response2 = await fetch("/api/vision-face-detect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64 }),
                  });
                  const result2 = await response2.json();
                  console.log('[FaceCamera] Face detection API response:', result2);
                  const faces = result2.faces;
                  if (faces && faces.length === 1) {
                    setPendingDetection({ success: true, message: `Face detected!`, faces });
                    const img = new window.Image();
                    img.onload = () => {
                      const tempCanvas = document.createElement("canvas");
                      tempCanvas.width = width;
                      tempCanvas.height = height;
                      const tempCtx = tempCanvas.getContext("2d");
                      if (tempCtx) {
                        tempCtx.drawImage(img, 0, 0, width, height);
                        faces.forEach((face: any) => {
                          if (face.boundingPoly && face.boundingPoly.vertices) {
                            const v = face.boundingPoly.vertices;
                            const x = v[0]?.x || 0;
                            const y = v[0]?.y || 0;
                            const w = (v[1]?.x || 0) - x;
                            const h = (v[2]?.y || 0) - y;
                            tempCtx.save();
                            tempCtx.strokeStyle = "#22c55e";
                            tempCtx.lineWidth = 3;
                            tempCtx.strokeRect(x, y, w, h);
                            tempCtx.restore();
                          }
                        });
                        setPendingBoxed(tempCanvas.toDataURL("image/png"));
                      }
                    };
                    img.src = dataUrl;
                  } else if (faces && faces.length > 1) {
                    setPendingDetection({ success: false, message: "Multiple faces detected. Please ensure only your face is visible and try again." });
                    setPendingBoxed(null);
                  } else {
                    setPendingDetection({ success: false, message: "No face detected. Please try again." });
                    setPendingBoxed(null);
                  }
                }
              } catch (err) {
                console.error('[FaceCamera] Liveness API error:', err);
                setLivenessResult({ success: false, message: "Liveness API error. Please try again." });
                setPendingDetection({ success: false, message: "Face detection failed. Please try again." });
                setPendingBoxed(null);
              }
              setDetecting(false);
            }, 300);
          }
        }
  setCountdown(null);
      }
    }
    // eslint-disable-next-line
  }, [blinkDetected, countdown, detecting, width, height, onCapture]);

  // Reset livenessPassed when dialog is closed for repeated use
  React.useEffect(() => {
    if (!open) {
      setLivenessPassed(false);
    }
  }, [open]);


  const handleOpen = () => {
    setLivenessPassed(false);
    setLivenessResult(null);
    setCountdown(null);
    setCaptured(null);
    setPendingImage(null);
    setPendingBoxed(null);
    setPendingDetection(null);
    setFaceDetection(null);
    setBoxedImage(null);
    setOpen(true);
    setTimeout(() => {
      startCamera();
    }, 200);
  } 

  const handleClose = () => {
    setOpen(false);
    stopCamera();
    setError(null);
    setLivenessPassed(false);
    setLivenessResult(null);
    setCountdown(null);
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {(pendingImage || captured) && (
        <div className="flex flex-col items-center gap-2 relative">
          <img src={pendingBoxed || boxedImage || pendingImage || captured!} alt="Captured face" className="rounded-lg border shadow w-full max-w-xs" />
          {detecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </div>
          )}
          {(pendingDetection || faceDetection) && (
            <div className={(pendingDetection || faceDetection)!.success ? "text-green-700 text-sm flex flex-col items-center" : "text-red-600 text-sm flex flex-col items-center"}>
              {(pendingDetection || faceDetection)!.success ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="font-semibold">Face detected!</span>
                  </div>
                  <ul className="mt-1 text-xs text-left">
                    {(pendingDetection || faceDetection)!.faces.map((face: any, idx: number) => (
                      <li key={idx} className="mb-1">
                        <span className="font-semibold">Detection confidence:</span> <span className="font-mono">{face.detectionConfidence ? (face.detectionConfidence * 100).toFixed(1) : "-"}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  {(pendingDetection || faceDetection)!.message === "Multiple faces detected. Please ensure only your face is visible and try again." && (
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                      <span className="font-semibold">Multiple faces detected!</span>
                    </div>
                  )}
                  <span>{(pendingDetection || faceDetection)!.message}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
      <Button
        type="button"
        onClick={() => {
          if (!detecting) {
            // Reset all state for a new capture attempt
            setLivenessResult(null);
            setLivenessPassed(false);
            setCountdown(null);
            setCaptured(null);
            setPendingImage(null);
            setPendingBoxed(null);
            setPendingDetection(null);
            setFaceDetection(null);
            setBoxedImage(null);
            setLivenessLocked(false);
            resetBlink();
            setOpen(true);
            setTimeout(() => {
              startCamera();
            }, 200);
          }
        }}
        className="mb-2"
        disabled={detecting}
      >
        {captured || pendingImage ? "Retake Face" : "Capture Face"}
      </Button>
      <Dialog open={open} onOpenChange={val => { if (!val) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Face Liveness & Capture</DialogTitle>
          </DialogHeader>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {livenessResult && !livenessResult.success && (
            <div className="text-red-600 text-sm mb-2">{livenessResult.message}
              <Button type="button" size="sm" className="ml-2" onClick={() => {
                // Reset for retry
                setLivenessResult(null);
                setLivenessPassed(false);
                setCountdown(null);
                setPendingImage(null);
                setPendingBoxed(null);
                setPendingDetection(null);
                setFaceDetection(null);
                setBoxedImage(null);
                setLivenessLocked(false); // allow detection again
                resetBlink(); // reset blink detection for new session
                setTimeout(() => {
                  startCamera();
                }, 200);
              }}>Retry</Button>
            </div>
          )}
          <div className="flex flex-col items-center gap-2">
            {livenessPassed && countdown !== null && countdown > 0 && (
              <div className="text-6xl font-bold text-blue-700 animate-pulse select-none mb-2">
                {countdown}
              </div>
            )}
            <video ref={videoRef} width={width} height={height} className="rounded-lg border shadow" autoPlay muted playsInline />
            <canvas ref={canvasRef} width={width} height={height} style={{ display: "none" }} />
            {!blinkDetected && !livenessPassed && (
              <div className="text-blue-700 font-semibold text-center mt-2">Please blink your eyes naturally.<br/>We are verifying liveness...</div>
            )}
            {livenessLoading && (
              <div className="text-xs text-gray-500 mt-1">Detecting blink...</div>
            )}
            {livenessResult && (
              <div className={livenessResult.success ? "text-green-700 text-sm mt-2" : "text-red-600 text-sm mt-2"}>
                {livenessResult.message}
              </div>
            )}
            {livenessPassed && countdown !== null && (
              <div className="text-blue-700 font-bold text-lg mt-2">Capturing photo in {countdown}...</div>
            )}
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            </DialogClose>

            {/* Debug panel for development */}
            <div style={{ fontSize: 12, color: '#888', marginTop: 12, background: '#f3f4f6', borderRadius: 6, padding: 8, width: '100%' }}>
              <div><b>Debug State</b></div>
              <div>Blink detected: <b>{String(blinkDetected)}</b></div>
              <div>Liveness passed: <b>{String(livenessPassed)}</b></div>
              <div>Countdown: <b>{String(countdown)}</b></div>
              <div>Detecting: <b>{String(detecting)}</b></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
