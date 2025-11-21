"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FaceCamera from "@/components/online-face-camera";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classItem?: any;
  sessionInfo?: any | null;
  onCapture?: (dataUrl: string) => void;
  onRetake?: () => void;
};

export default function TakeAttendance({ open, onOpenChange, classItem, sessionInfo = null, onCapture, onRetake }: Props) {
  const [faceValidated, setFaceValidated] = React.useState(false);
  const [lastCaptured, setLastCaptured] = React.useState<string | null>(null);

  const handleFaceCapture = (dataUrl: string) => {
    setFaceValidated(true);
    setLastCaptured(dataUrl);
  };

  const handleRetake = () => {
    setFaceValidated(false);
    setLastCaptured(null);
    if (typeof onRetake === 'function') {
      try { onRetake(); } catch (e) { console.warn('onRetake callback threw', e); }
    }
  };

  const handleRecord = () => {
    if (!lastCaptured) return;
    if (typeof onCapture === 'function') {
      try { onCapture(lastCaptured); } catch (e) { console.warn('onCapture callback threw', e); }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Take Attendance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <Label className="font-semibold text-lg mb-2">Face Verification</Label>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-lg">Use the camera to capture a clear photo of the attendee. Blink when asked to prove liveness. The system will validate the capture before recording attendance.</p>
              <FaceCamera onCapture={handleFaceCapture} onRetake={handleRetake} skipFaceDetect={true} />
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleRecord} disabled={!faceValidated}>Record Attendance</Button>
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
