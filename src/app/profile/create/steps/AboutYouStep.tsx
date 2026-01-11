import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "lucide-react";
import React from "react";

interface AboutYouStepProps {
  form: any;
  avatarFile: File | null;
  avatarPreview: string;
  loading: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
}

export default function AboutYouStep({
  form,
  avatarFile,
  avatarPreview,
  loading,
  onChange,
  onAvatarChange,
  onNext,
}: AboutYouStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-4">
        <Avatar className="w-28 h-28 shadow-md ring-2 ring-primary/20">
          <AvatarImage src={avatarPreview} alt="Avatar" />
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
            ?
          </AvatarFallback>
        </Avatar>
        <div className="w-full flex flex-col items-center gap-2">
          <Label
            htmlFor="avatar_file"
            className="text-sm font-medium text-foreground"
          >
            Avatar Image (Optional)
          </Label>
          <label
            htmlFor="avatar_file"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm cursor-pointer transition-colors"
          >
            <CameraIcon size={18} />
            {avatarFile ? "Change Image" : "Upload Image"}
            <Input
              id="avatar_file"
              name="avatar_file"
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
          </label>
          {avatarFile && (
            <span className="text-xs text-muted-foreground mt-1">
              {avatarFile.name}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-sm font-medium text-foreground">
          Bio (Optional)
        </Label>
        <Textarea
          id="bio"
          name="bio"
          value={form.bio}
          onChange={onChange}
          placeholder="Tell us about yourself..."
          className="min-h-[100px] resize-none bg-background/50 border-border focus:border-primary focus:ring-primary"
        />
      </div>
      <div className="flex justify-end pt-4">
        <Button type="button" onClick={onNext} className="px-8 font-medium">
          Next
        </Button>
      </div>
    </div>
  );
}
