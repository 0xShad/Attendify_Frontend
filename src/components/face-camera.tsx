import React, { useRef, useState } from "react";
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

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setPendingImage(dataUrl);
        setPendingBoxed(null);
        setDetecting(true);
        setPendingDetection(null);
        setOpen(false); // Close modal immediately after capture
        stopCamera();
        // Do detection after modal closes
        setTimeout(async () => {
          try {
            // Remove the data URL prefix to get base64
            const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
            const response = await fetch("/api/vision-face-detect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: base64 }),
            });
            const result = await response.json();
            const faces = result.faces;
            if (faces && faces.length === 1) {
              setPendingDetection({ success: true, message: `Face detected!`, faces });
              // Draw bounding box for the single face
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
          } catch (err) {
            setPendingDetection({ success: false, message: "Face detection failed. Please try again." });
            setPendingBoxed(null);
          }
          setDetecting(false);
        }, 300);
      }
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const handleClose = () => {
    setOpen(false);
    stopCamera();
    setError(null);
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
            setOpen(true);
            setTimeout(() => {
              startCamera();
            }, 200);
            // Only update state if a new detection is successful (handled in Retake logic below)
          }
        }}
        className="mb-2"
        disabled={detecting}
      >
        {captured || pendingImage ? "Retake" : "Capture"}
      </Button>
      <Dialog open={open} onOpenChange={val => { if (!val) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Capture Face Image</DialogTitle>
          </DialogHeader>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <div className="flex flex-col items-center gap-2">
            <video ref={videoRef} width={width} height={height} className="rounded-lg border shadow" />
            <canvas ref={canvasRef} width={width} height={height} style={{ display: "none" }} />
            <div className="flex gap-2 mt-2">
              <Button type="button" onClick={handleCapture} className="bg-blue-600 hover:bg-blue-700">Capture</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
