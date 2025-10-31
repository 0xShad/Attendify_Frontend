import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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
  const [captured, setCaptured] = useState<string | null>(null);

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

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setCaptured(dataUrl);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {!streaming && !captured && (
        <Button type="button" onClick={startCamera} className="mb-2">Open Camera</Button>
      )}
      {streaming && (
        <div className="flex flex-col items-center gap-2">
          <video ref={videoRef} width={width} height={height} className="rounded-lg border shadow" />
          <div className="flex gap-2 mt-2">
            <Button type="button" onClick={handleCapture} className="bg-blue-600 hover:bg-blue-700">Capture</Button>
            <Button type="button" variant="outline" onClick={stopCamera}>Cancel</Button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} width={width} height={height} style={{ display: "none" }} />
      {captured && (
        <div className="flex flex-col items-center gap-2">
          <img src={captured} alt="Captured face" className="rounded-lg border shadow w-full max-w-xs" />
          <Button type="button" variant="outline" onClick={() => setCaptured(null)}>Retake</Button>
        </div>
      )}
    </div>
  );
}
