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
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900">
          <AvatarImage src={avatarPreview} alt="Avatar" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="w-full flex flex-col items-center gap-2">
          <Label htmlFor="avatar_file" className="font-semibold mb-1">Avatar Image</Label>
          <label htmlFor="avatar_file" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow cursor-pointer transition-all duration-150 focus:ring-2 focus:ring-blue-300">
            <CameraIcon size={18} className="mr-1" />
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
          {avatarFile && <span className="text-xs text-muted-foreground mt-1">{avatarFile.name}</span>}
        </div>
      </div>
      <div>
        <Label htmlFor="bio" className="font-semibold">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          value={form.bio}
          onChange={onChange}
          placeholder="Tell us about yourself..."
          className="mt-2 min-h-20 rounded-xl shadow-inner"
        />
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onNext} className="rounded-xl px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700">
          Next
        </Button>
      </div>
    </div>
  );
}
