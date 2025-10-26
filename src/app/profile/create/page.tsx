"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
// import { toast } from "@/components/ui/sonner"; // Fix this import if needed

export default function ProfileCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    bio: "",
    avatar_url: "",
    face_image: "",
    program: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Replace with actual API call to create profile
      await new Promise((res) => setTimeout(res, 1000));
      // toast.success("Profile created!");
      router.push("/profile");
    } catch (err) {
      // toast.error("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Create Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              value={form.avatar_url}
              onChange={handleChange}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="face_image">Face Image URL</Label>
            <Input
              id="face_image"
              name="face_image"
              value={form.face_image}
              onChange={handleChange}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="program">Program / Department</Label>
            <Input
              id="program"
              name="program"
              value={form.program}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? "Creating..." : "Create Profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
