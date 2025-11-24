import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface FaceBox { x: number; y: number; width: number; height: number }

interface F2FFaceCameraProps {
  onRecognized: (dataUrl: string, box: FaceBox, faceHash: string) => Promise<boolean | void> | boolean | void;
  debounceMinutes?: number; // minutes to skip the same face after success
  width?: number;
  height?: number;
  className?: string;
  initialDelayMs?: number; // milliseconds to wait after mount before calling onRecognized
  requestIntervalMs?: number; // minimum milliseconds between successive onRecognized calls
}

// simple djb2 string hash for small base64 blobs
function hashString(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return String(h >>> 0);
}

export default function F2FFaceCamera({ onRecognized, debounceMinutes = 5, width = 420, height = 320, className = "", initialDelayMs = 0, requestIntervalMs = 0 }: F2FFaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedBox, setDetectedBox] = useState<FaceBox | null>(null);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'success'>('idle');
  const recentRef = useRef<Record<string, number>>({}); // faceHash -> timestamp
  const runningRef = useRef(false);
  const mountedAtRef = useRef<number>(Date.now());
  const lastRequestAtRef = useRef<number>(0);
  const successTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    runningRef.current = true;
    const start = async () => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch {}
          setStreaming(true);
        }
      } catch (err: any) {
        setError('Unable to access camera.');
      }
    };
    start();

    return () => {
      runningRef.current = false;
      // clear any pending success timeout
      if (successTimeoutRef.current) {
        try { window.clearTimeout(successTimeoutRef.current as number); } catch (e) {}
        successTimeoutRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // detection loop
  useEffect(() => {
    let detector: any = null;
    let interval: any = null;

    const detectLoop = async () => {
      if (!runningRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        if (!detector && 'FaceDetector' in window) {
          // @ts-ignore
          detector = new (window as any).FaceDetector();
        }

        // draw current frame to canvas
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        let faces: any[] = [];
        if (detector) {
          try {
            faces = await detector.detect(videoRef.current as HTMLVideoElement);
          } catch (e) {
            // detection failed, fallback to server detect below
            faces = [];
          }
        }

        // fallback: server-side detect if FaceDetector not available or returned empty
        if ((!faces || faces.length === 0) && !('FaceDetector' in window)) {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
            const resp = await fetch('/api/vision-face-detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }) });
            if (resp.ok) {
              const j = await resp.json();
              faces = j.faces || [];
            }
          } catch (e) {
            // ignore
          }
        }

        if (faces && faces.length > 0) {
          // show detecting state while a face is present
          setStatus('detecting');
          // pick largest face
          let face = faces[0];
          if (faces.length > 1) {
            face = faces.reduce((a, b) => ((a.boundingBox?.width || a.boundingBox?.box?.width || 0) > (b.boundingBox?.width || b.boundingBox?.box?.width || 0) ? a : b));
          }

          // Normalise bounding box depending on API shape
          let box: FaceBox = { x: 0, y: 0, width: width, height: height };
          if (face.boundingBox) {
            const bb = face.boundingBox;
            // FaceDetector API provides x, y, width, height
            box = { x: bb.x || 0, y: bb.y || 0, width: bb.width || width, height: bb.height || height };
          } else if (face.box) {
            const bb = face.box;
            box = { x: bb.x || 0, y: bb.y || 0, width: bb.width || width, height: bb.height || height };
          } else if (face.bounding_poly || face.boundingPoly || face.boundingBox) {
            // google/others: try vertices
            const v = face.boundingPoly?.vertices || face.bounding_poly?.vertices || [];
            if (v && v.length >= 4) {
              const xs = v.map((p: any) => p.x || 0);
              const ys = v.map((p: any) => p.y || 0);
              const minX = Math.max(0, Math.min(...xs));
              const minY = Math.max(0, Math.min(...ys));
              const maxX = Math.min(width, Math.max(...xs));
              const maxY = Math.min(height, Math.max(...ys));
              box = { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
            }
          }

          setDetectedBox(box);

          // crop face
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = box.width; cropCanvas.height = box.height;
          const cctx = cropCanvas.getContext('2d');
          if (cctx) cctx.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
          const faceDataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
          const faceHash = hashString(faceDataUrl.slice(-200)); // small hash portion

          const now = Date.now();
          const skipUntil = recentRef.current[faceHash] || 0;
          const debounceMs = (debounceMinutes || 5) * 60 * 1000;
          if (skipUntil && now < skipUntil) {
            // skip recognition for this face
            return;
          }

          // call onRecognized (respect initial delay and request interval)
          const sinceMount = Date.now() - (mountedAtRef.current || 0);
          if (initialDelayMs && sinceMount < initialDelayMs) {
            // skip calling recognition until delay has passed
            return;
          }

          const sinceLastReq = Date.now() - (lastRequestAtRef.current || 0);
          if (requestIntervalMs && sinceLastReq < requestIntervalMs) {
            // respect global request interval
            return;
          }

          try {
            // mark request timestamp immediately to enforce interval even if call hangs
            lastRequestAtRef.current = Date.now();
            const res = await onRecognized(faceDataUrl, box, faceHash);
            const success = typeof res === 'boolean' ? res : (res === undefined ? false : Boolean(res));
            if (success) {
              // mark as recognized until debounceMs passes
              recentRef.current[faceHash] = now + debounceMs;
              // show success state briefly
              setStatus('success');
              if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current);
              // revert to idle/detecting after 1200ms
              // store numeric timeout id
              successTimeoutRef.current = window.setTimeout(() => {
                successTimeoutRef.current = null;
                setStatus('idle');
              }, 1200) as unknown as number;
            }
          } catch (e) {
            // swallow
          }
        } else {
          setDetectedBox(null);
        }
      } catch (err) {
        // ignore transient detect errors
      }
    };

    // run every 800ms
    interval = setInterval(() => { void detectLoop(); }, 800);

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRecognized, width, height, debounceMinutes]);

  const handleRetry = () => {
    setDetectedBox(null);
    setError(null);
    if (videoRef.current && videoRef.current.paused) {
      try { videoRef.current.play(); } catch {}
    }
  };

  return (
    <div className={`f2f-face-camera ${className}`}>
      <div style={{ width, maxWidth: '100%' }} className="relative rounded-lg overflow-hidden border">
        <video ref={videoRef} width={width} height={height} className="w-full h-auto" autoPlay muted playsInline />
        {detectedBox && (
          <div
            style={{
              position: 'absolute',
              left: detectedBox.x,
              top: detectedBox.y,
              width: detectedBox.width,
              height: detectedBox.height,
              border: '3px solid',
              borderColor: status === 'idle' ? '#dc2626' /* red */ : status === 'detecting' ? '#f97316' /* orange */ : '#16a34a' /* green */,
              boxShadow: status === 'idle' ? '0 0 8px rgba(220,38,38,0.25)' : status === 'detecting' ? '0 0 12px rgba(249,115,22,0.25)' : '0 0 12px rgba(22,163,74,0.25)'
            }}
          />
        )}
        {error && <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 bg-white/60">{error}</div>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="ghost" onClick={handleRetry}>Retry</Button>
      </div>
    </div>
  );
}
