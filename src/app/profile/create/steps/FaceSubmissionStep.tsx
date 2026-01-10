import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FaceCamera from "@/components/face-camera";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

interface FaceSubmissionStepProps {
  form: any;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FaceSubmissionStep({
  form,
  loading,
  onChange,
  onBack,
  onSubmit,
}: FaceSubmissionStepProps) {
  const [faceValidated, setFaceValidated] = useState(false);

  const handleFaceCapture = (dataUrl: string) => {
    // Face has passed all liveness checks if this callback is triggered
    setFaceValidated(true);
    onChange({
      target: { name: "face_image", value: dataUrl }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleRetake = () => {
    // Reset validation when user clicks retake
    setFaceValidated(false);
    onChange({
      target: { name: "face_image", value: "" }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="space-y-6">
      <div className="bg-accent/50 border border-border rounded-lg p-6 flex flex-col items-center">
        <Label htmlFor="face_image" className="text-base font-semibold text-foreground mb-2">Face Verification</Label>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          Please capture a clear photo of your face and look directly at the camera. This will be used for profile verification and security. Make sure your face is well-lit and centered in the frame. 
        </p>
        <FaceCamera
          onCapture={handleFaceCapture}
          onRetake={handleRetake}
        />
      </div>
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="px-8 font-medium">
          Back
        </Button>
        <Button type="submit" onClick={onSubmit} className="px-8 font-medium" disabled={loading || !faceValidated}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}
