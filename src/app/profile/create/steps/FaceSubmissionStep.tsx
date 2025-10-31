import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";

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
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Label htmlFor="face_image" className="font-semibold">Face Image URL</Label>
        <Input
          id="face_image"
          name="face_image"
          value={form.face_image}
          onChange={onChange}
          placeholder="https://..."
          className="mt-2 rounded-xl shadow-inner"
        />
        <p className="text-xs text-muted-foreground mt-2">(Face submission coming soon. For now, paste a photo URL.)</p>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl px-8 py-2 text-base font-semibold">
          Back
        </Button>
        <Button type="submit" onClick={onSubmit} className="rounded-xl px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700" disabled={loading || !form.face_image}>
          {loading ? "Creating..." : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}
