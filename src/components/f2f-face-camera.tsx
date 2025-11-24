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
  // stricter detection options
  minProbability?: number; // 0-1, ignore predictions below this confidence
  minBoxWidth?: number; // pixels, ignore faces smaller than this
  minBoxHeight?: number; // pixels, ignore faces smaller than this
  consecutiveDetections?: number; // require N consecutive stable detections before triggering
  minBoxAreaRatio?: number; // fraction of frame area (0-1) minimum face area
  // spatial/shape filters to avoid edge artifacts
  centerBias?: number; // fraction (0-0.5) inset for required center region (e.g., 0.12)
  minAspectRatio?: number; // min height/width
  maxAspectRatio?: number; // max height/width
  edgeMarginRatio?: number; // fraction of frame to treat as edge margin to reject boxes touching edges
  modelsUrl?: string; // URL path where face-api models are hosted (e.g. '/models')
  tinyInputSize?: number; // face-api tiny detector input size (e.g. 224, 320)
  scoreThreshold?: number; // face-api tiny detector score threshold
  bypassFilters?: boolean; // if true, skip local filters and call onRecognized for testing
  cropPaddingRatio?: number; // fraction of box width to pad when cropping
  cropPaddingMin?: number; // minimum padding in pixels when cropping
  cropPaddingHeightMultiplier?: number; // multiplier to make vertical padding slightly larger than horizontal
}

// simple djb2 string hash for small base64 blobs
function hashString(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return String(h >>> 0);
}


export default function F2FFaceCamera({ onRecognized, debounceMinutes = 5, width = 420, height = 320, className = "", initialDelayMs = 0, requestIntervalMs = 3000, minProbability = 0.75, minBoxWidth = 30, minBoxHeight = 30, consecutiveDetections = 1, minBoxAreaRatio = 0.005, centerBias = 0.04, minAspectRatio = 0.45, maxAspectRatio = 2.2, edgeMarginRatio = 0.02, modelsUrl = '/models', tinyInputSize = 320, scoreThreshold = 0.5, bypassFilters = false, cropPaddingRatio = 0.35, cropPaddingMin = 20, cropPaddingHeightMultiplier = 1.15 }: F2FFaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedBox, setDetectedBox] = useState<FaceBox | null>(null);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'success'>('idle');
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const recentRef = useRef<Record<string, number>>({}); // faceHash -> timestamp
  const runningRef = useRef(false);
  const mountedAtRef = useRef<number>(Date.now());
  const lastRequestAtRef = useRef<number>(0);
  const successTimeoutRef = useRef<number | null>(null);
  // stability helpers: require consecutive stable detections before firing
  const lastPredBoxRef = useRef<FaceBox | null>(null);
  const consecutiveRef = useRef<number>(0);

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
    let faceapi: any = null;
    let modelsLoaded = false;
    let loadingModels = false;
    let interval: any = null;

    const detectLoop = async () => {
      if (!runningRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        if (!faceapi && !loadingModels) {
          loadingModels = true;
          setModelLoading(true);
          setModelError(null);
          try {
            faceapi = await import('@vladmandic/face-api');
            // load tiny face detector + tiny landmarks (fast)
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
              faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsUrl)
            ]);
            modelsLoaded = true;
            setModelLoaded(true);
            
            // face-api models loaded
          } catch (e) {
            
            setModelError(String(e?.message || e));
            setModelLoaded(false);
            faceapi = null;
          } finally {
            loadingModels = false;
            setModelLoading(false);
          }
        }

        // draw current frame to canvas (map from video's displayed size -> fixed canvas size)
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // compute displayed video size and scaling so we can map detection boxes into canvas coords
        const videoEl = videoRef.current as HTMLVideoElement | null;
        let displayWidth = width;
        let displayHeight = height;
        if (videoEl) {
          try {
            const rect = videoEl.getBoundingClientRect();
            displayWidth = rect.width || width;
            displayHeight = rect.height || height;
          } catch (e) {
            displayWidth = videoEl.videoWidth || width;
            displayHeight = videoEl.videoHeight || height;
          }
        }
        const xScale = width / Math.max(1, displayWidth);
        const yScale = height / Math.max(1, displayHeight);

        // draw the video into the canvas sized to the video's displayed pixel size
        const canvasW = Math.max(1, Math.round(displayWidth));
        const canvasH = Math.max(1, Math.round(displayHeight));
        canvas.width = canvasW;
        canvas.height = canvasH;
        try {
          ctx.drawImage(videoRef.current as HTMLVideoElement, 0, 0, canvasW, canvasH);
        } catch (e) {
          try { ctx.drawImage(videoRef.current as HTMLVideoElement, 0, 0); } catch {}
        }

        let faces: any[] = [];
        if (faceapi && modelsLoaded) {
          try {
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: tinyInputSize, scoreThreshold });
            // run detection on the canvas we just drew into so coordinates match the canvas/display pixels
            const results = await faceapi.detectAllFaces(canvas, options).withFaceLandmarks(true);
            if (!results || results.length === 0) {
              // no predictions this frame
            } else {
            }
            faces = (results || []).map((r: any) => {
              const b = r.detection?.box || r.box || { x: 0, y: 0, width: canvasW, height: canvasH };
              // detection results are in canvas/display pixel coordinates now
              const bx = Math.max(0, Math.round(b.x || 0));
              const by = Math.max(0, Math.round(b.y || 0));
              const bw = Math.max(1, Math.round(b.width || canvasW));
              const bh = Math.max(1, Math.round(b.height || canvasH));
              return { boundingBox: { x: bx, y: by, width: bw, height: bh }, probability: r.detection?.score ?? (r.score ?? 1), landmarks: r.landmarks?.positions || [] };
            });
          } catch (e) {
            faces = [];
          }
        }

        // Note: No server-side Google Vision fallback for this component.
        // We rely solely on the in-browser face-api.js model and strict filters above.

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
            box = { x: bb.x || 0, y: bb.y || 0, width: bb.width || width, height: bb.height || height };
          } else if (face.box) {
            const bb = face.box;
            box = { x: bb.x || 0, y: bb.y || 0, width: bb.width || width, height: bb.height || height };
          } else if (face.bounding_poly || face.boundingPoly || face.boundingBox) {
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

          // apply stricter filters: probability, minimum size (can be bypassed for testing)
          const probRaw = Array.isArray((face as any).probability) ? (face as any).probability[0] : (face as any).probability;
          const prob = typeof probRaw === 'number' ? probRaw : 1;
          // always apply strict local filters before calling onRecognized
          if (prob < minProbability) {
            return;
          }
          if (box.width < minBoxWidth || box.height < minBoxHeight) {
            return;
          }
          // require minimum box area relative to the canvas/frame we ran detection on
          const frameArea = canvasW * canvasH;
          const boxArea = box.width * box.height;
          if (boxArea < frameArea * minBoxAreaRatio) {
            return;
          }
          // require a minimum number of landmarks if provided by detector
          if ((face as any).landmarks && Array.isArray((face as any).landmarks) && (face as any).landmarks.length < 6) {
            return;
          }
          // reject boxes that are too close to frame edges (likely artefacts) — use canvas dimensions
          const leftThreshold = canvasW * edgeMarginRatio;
          const topThreshold = canvasH * edgeMarginRatio;
          const rightThreshold = canvasW * (1 - edgeMarginRatio);
          const bottomThreshold = canvasH * (1 - edgeMarginRatio);
          const boxRight = box.x + box.width;
          const boxBottom = box.y + box.height;
          if (box.x < leftThreshold || box.y < topThreshold || boxRight > rightThreshold || boxBottom > bottomThreshold) {
            return;
          }
          // require aspect ratio roughly like a face (height/width)
          const aspect = box.height / Math.max(1, box.width);
          if (aspect < minAspectRatio || aspect > maxAspectRatio) {
            return;
          }
          // require center to be within central region (avoid bottom-left/edge detections)
          const cxNorm = (box.x + box.width / 2) / canvasW;
          const cyNorm = (box.y + box.height / 2) / canvasH;
          if (cxNorm < centerBias || cxNorm > (1 - centerBias) || cyNorm < centerBias || cyNorm > (1 - centerBias)) {
            return;
          }

          // require stability across consecutive frames: compare centers
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          const last = lastPredBoxRef.current;
          let stable = false;
          if (!last) {
            consecutiveRef.current = 1;
          } else {
            const lastCx = last.x + last.width / 2;
            const lastCy = last.y + last.height / 2;
            const dx = Math.abs(cx - lastCx);
            const dy = Math.abs(cy - lastCy);
            const maxDim = Math.max(width, height);
            // if center moved less than 10% of frame width/height, consider stable
            if (dx < maxDim * 0.15 && dy < maxDim * 0.15) {
              consecutiveRef.current = Math.min(consecutiveRef.current + 1, consecutiveDetections);
            } else {
              consecutiveRef.current = 1;
            }
          }
          lastPredBoxRef.current = box;
          if (consecutiveRef.current < consecutiveDetections) {
            // wait for more stable frames
            return;
          }

          setDetectedBox(box);

          // crop face — add padding so we don't send an overly tight crop
          const padX = Math.round(Math.max(cropPaddingMin, box.width * cropPaddingRatio));
          const padY = Math.round(Math.max(cropPaddingMin, box.height * cropPaddingRatio * cropPaddingHeightMultiplier));
          const cropX = Math.max(0, box.x - padX);
          const cropY = Math.max(0, box.y - padY);
          const cropW = Math.min(canvasW - cropX, box.width + padX * 2);
          const cropH = Math.min(canvasH - cropY, box.height + padY * 2);
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW; cropCanvas.height = cropH;
          const cctx = cropCanvas.getContext('2d');
          if (cctx) cctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          const faceDataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
          const faceHash = hashString(faceDataUrl.slice(-200)); // small hash portion

          // keep the UI overlay as the raw detected box (smaller)
          setDetectedBox(box);

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
