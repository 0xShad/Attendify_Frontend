import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface FaceBox { x: number; y: number; width: number; height: number }

export interface F2FFaceCameraProps {
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
  debounceStorageKey?: string; // optional localStorage key suffix to persist debounce map (e.g. `${classId}_${sessionId}`)
  debug?: boolean; // enable debug logging for troubleshooting
  active?: boolean; // if false, camera/detection should be stopped
}

// simple djb2 string hash for small base64 blobs
function hashString(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return String(h >>> 0);
}


export default function F2FFaceCamera({ onRecognized, debounceMinutes = 5, width = 420, height = 320, className = "", initialDelayMs = 0, requestIntervalMs = 3000, minProbability = 0.75, minBoxWidth = 30, minBoxHeight = 30, consecutiveDetections = 1, minBoxAreaRatio = 0.005, centerBias = 0.04, minAspectRatio = 0.45, maxAspectRatio = 2.2, edgeMarginRatio = 0.02, modelsUrl = '/models', tinyInputSize = 320, scoreThreshold = 0.5, bypassFilters = false, cropPaddingRatio = 0.35, cropPaddingMin = 20, cropPaddingHeightMultiplier = 1.15, debounceStorageKey, debug = false, active = true }: F2FFaceCameraProps) {
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
  const processingRef = useRef<boolean>(false);
  const descriptorToIdRef = useRef<Record<string, string>>({}); // descriptorKey -> serverId mapping
  const descriptorVectorsRef = useRef<Array<{ id: string; vec: number[] }>>([]); // stored rounded descriptor vectors for confirmed ids
  const perPersonLastRequestRef = useRef<Record<string, number>>({}); // personKey -> last request timestamp

  // localStorage key for debounce persistence (if provided)
  const storageKey = debounceStorageKey ? `f2f_recent:${debounceStorageKey}` : null;

  useEffect(() => {
    // load persisted debounce map if available
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw || '{}');
          const now = Date.now();
          // restore only non-expired entries
          Object.keys(parsed.recent || {}).forEach(k => {
            if (parsed.recent[k] > now) recentRef.current[k] = parsed.recent[k];
          });
          descriptorToIdRef.current = parsed.map || {};
        }
      } catch (e) {
        // ignore localStorage errors
      }
    }
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
      if (processingRef.current) {
        return; // avoid overlapping runs
      }
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      processingRef.current = true;

      try {
        if (!faceapi && !loadingModels) {
          loadingModels = true;
          setModelLoading(true);
          setModelError(null);
          try {
            faceapi = await import('@vladmandic/face-api');
            // load tiny face detector + tiny landmarks + recognition net (fast)
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
              faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsUrl),
              faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
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
            // request landmarks and face descriptors so we can compute a stable debounce key
            // use tiny landmarks explicitly (true) and request descriptors
            const results = await faceapi.detectAllFaces(canvas, options).withFaceLandmarks(true).withFaceDescriptors();
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
              return {
                boundingBox: { x: bx, y: by, width: bw, height: bh },
                probability: r.detection?.score ?? (r.score ?? 1),
                landmarks: r.landmarks?.positions || [],
                descriptor: r.descriptor || null,
              };
            });
          } catch (e) {
            
          }
        }

        if (faces && faces.length > 0) {
          // show detecting state while faces are present
          setStatus('detecting');
          // pick largest face for the UI overlay
          let largest = faces[0];
          if (faces.length > 1) {
            largest = faces.reduce((a, b) => ((a.boundingBox?.width || 0) > (b.boundingBox?.width || 0) ? a : b));
          }
          // set overlay box to largest face
          const lb = largest.boundingBox || { x: 0, y: 0, width: width, height: height };
          setDetectedBox({ x: lb.x, y: lb.y, width: lb.width, height: lb.height });

          // process each detected face independently (still single detectLoop run)
          const now = Date.now();
          const debounceMs = (debounceMinutes || 5) * 60 * 1000;
          for (const f of faces) {
            try {
              const faceBox = f.boundingBox || f.box || { x: 0, y: 0, width: canvasW, height: canvasH };
              const bx = Math.max(0, Math.round(faceBox.x || 0));
              const by = Math.max(0, Math.round(faceBox.y || 0));
              const bw = Math.max(1, Math.round(faceBox.width || canvasW));
              const bh = Math.max(1, Math.round(faceBox.height || canvasH));
              const box: FaceBox = { x: bx, y: by, width: bw, height: bh };

              // local filters (keep these to avoid sending bad crops)
              const probRaw = Array.isArray((f as any).probability) ? (f as any).probability[0] : (f as any).probability;
              const prob = typeof probRaw === 'number' ? probRaw : 1;
              if (prob < minProbability) continue;
              if (box.width < minBoxWidth || box.height < minBoxHeight) continue;
              const frameArea = canvasW * canvasH;
              if (box.width * box.height < frameArea * minBoxAreaRatio) continue;
              if ((f as any).landmarks && Array.isArray((f as any).landmarks) && (f as any).landmarks.length < 6) continue;
              const leftThreshold = canvasW * edgeMarginRatio;
              const topThreshold = canvasH * edgeMarginRatio;
              const rightThreshold = canvasW * (1 - edgeMarginRatio);
              const bottomThreshold = canvasH * (1 - edgeMarginRatio);
              if (box.x < leftThreshold || box.y < topThreshold || (box.x + box.width) > rightThreshold || (box.y + box.height) > bottomThreshold) continue;
              const aspect = box.height / Math.max(1, box.width);
              if (aspect < minAspectRatio || aspect > maxAspectRatio) continue;

              // crop per-face
              const padX = Math.round(Math.max(cropPaddingMin, box.width * cropPaddingRatio));
              const padY = Math.round(Math.max(cropPaddingMin, box.height * cropPaddingRatio * cropPaddingHeightMultiplier));
              const cropX = Math.max(0, box.x - padX);
              const cropY = Math.max(0, box.y - padY);
              const cropW = Math.min(canvasW - cropX, box.width + padX * 2);
              const cropH = Math.min(canvasH - cropY, box.height + padY * 2);
              const cropCanvas = document.createElement('canvas');
              cropCanvas.width = cropW; cropCanvas.height = cropH;
              const cctx = cropCanvas.getContext('2d');
              if (!cctx) continue;
              cctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
              const faceDataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
              const faceHash = hashString(faceDataUrl.slice(-200));

              // descriptor -> stable key and vector similarity check
              let descriptorKey: string | null = null;
              let descriptorRounded: number[] | null = null;
              if ((f as any).descriptor && (f as any).descriptor.length) {
                descriptorRounded = Array.from((f as any).descriptor as Float32Array).map((n: number) => Math.round(n * 10000));
                const s = descriptorRounded.join(',');
                descriptorKey = hashString(s);
              }
              // default personKey uses descriptorKey or fallback face hash
              let personKey = descriptorKey ? `desc:${descriptorKey}` : `hash:${faceHash}`;
              // If we have an exact descriptor->id mapping, prefer it
              if (descriptorKey && descriptorToIdRef.current && descriptorToIdRef.current[descriptorKey]) {
                personKey = `id:${descriptorToIdRef.current[descriptorKey]}`;
              }
              // If the descriptor varies between frames, try similarity against stored confirmed descriptor vectors
              if (descriptorRounded && descriptorVectorsRef.current.length > 0) {
                try {
                  const THRESHOLD = 0.45; // same matching threshold used by server (lower is closer)
                  const limit = (THRESHOLD * 10000);
                  const limitSq = limit * limit;
                  for (const entry of descriptorVectorsRef.current) {
                    if (!entry.vec || entry.vec.length !== descriptorRounded.length) continue;
                    let sumSq = 0;
                    for (let i = 0; i < descriptorRounded.length; i++) {
                      const diff = (descriptorRounded[i] - entry.vec[i]);
                      sumSq += diff * diff;
                      if (sumSq > limitSq) break;
                    }
                    if (sumSq <= limitSq) {
                      // treat as same person (id match)
                      personKey = `id:${entry.id}`;
                      break;
                    }
                  }
                } catch (e) {
                  
                }
              }
              

              // enforce per-person debounce (skip API calls) but continue detecting
              const skipUntil = recentRef.current[personKey] || 0;
              if (skipUntil && now < skipUntil) {
                continue;
              }

              // enforce per-person request interval to avoid bursts; fall back to global lastRequestAtRef if needed
              const lastReqForPerson = perPersonLastRequestRef.current[personKey] || 0;
              const sinceLastForPerson = Date.now() - lastReqForPerson;
              if (requestIntervalMs && sinceLastForPerson < requestIntervalMs) {
                continue;
              }

              // respect initial delay since mount
              const sinceMount = Date.now() - (mountedAtRef.current || 0);
              if (initialDelayMs && sinceMount < initialDelayMs) continue;

              // call onRecognized for this face
              try {
                perPersonLastRequestRef.current[personKey] = Date.now();
                const res = await onRecognized(faceDataUrl, box, faceHash);
                // prefer structured response checks — only treat as "attendance marked" when the backend explicitly indicates marking
                const maybeResObj = (res && typeof res === 'object') ? (res as any) : null;
                // Consider attendance "marked" only when backend explicitly indicates it.
                // Match the server shape you provided: status:'present', matched_profile_id/profile_id, match_info.matched, or note:'recently_marked'.
                const attendanceMarked = Boolean(maybeResObj && (
                  maybeResObj.attendance_marked === true ||
                  maybeResObj.marked === true ||
                  maybeResObj.note === 'recently_marked' ||
                  maybeResObj.status === 'marked' ||
                  maybeResObj.status === 'present' ||
                  maybeResObj.was_marked === true ||
                  // presence of canonical ids implies a matched/marked response
                  !!maybeResObj.matched_profile_id ||
                  !!maybeResObj.profile_id ||
                  // explicit match_info indicating a match
                  (maybeResObj.match_info && maybeResObj.match_info.matched === true)
                ));
                
                if (attendanceMarked) {
                  const then = Date.now();
                  recentRef.current[personKey] = then + debounceMs;
                  try {
                    const maybeId = maybeResObj
                      ? (maybeResObj.matched_profile_id || maybeResObj.profile_id || maybeResObj.match_info?.student_id || maybeResObj.student_id || maybeResObj.id || maybeResObj.match_info?.id)
                      : null;
                    if (maybeId) {
                      const idKey = `id:${maybeId}`;
                      recentRef.current[idKey] = then + debounceMs;
                      if (descriptorKey) descriptorToIdRef.current[descriptorKey] = String(maybeId);
                      // store rounded descriptor vector for future similarity checks
                      if (descriptorRounded) {
                        try {
                          const existing = descriptorVectorsRef.current.find(d => d.id === String(maybeId));
                          if (!existing) {
                            descriptorVectorsRef.current.push({ id: String(maybeId), vec: descriptorRounded });
                          } else {
                            // optionally refresh/replace existing vector with latest
                            existing.vec = descriptorRounded;
                          }
                        } catch (e) { /* ignore */ }
                      }
                    }
                    if (maybeResObj && maybeResObj.note === 'recently_marked' && descriptorKey) {
                      recentRef.current[`desc:${descriptorKey}`] = then + debounceMs;
                    }
                    if (storageKey) {
                      try { localStorage.setItem(storageKey, JSON.stringify({ recent: recentRef.current, map: descriptorToIdRef.current })); } catch (e) {}
                    }
                  } catch (e) {}
                  // show transient success only for overlay
                  setStatus('success');
                  if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current);
                  successTimeoutRef.current = window.setTimeout(() => { successTimeoutRef.current = null; setStatus('idle'); }, 1200) as unknown as number;
                } else {
                }
              } catch (err) {
                
              }
            } catch (e) {
              
            }
          }
          processingRef.current = false;
        } else {
          setDetectedBox(null);
          processingRef.current = false;
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
