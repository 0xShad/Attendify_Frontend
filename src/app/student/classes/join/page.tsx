"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import JoinClassDrawer from "@/components/student-portal/classes/JoinClassDrawer";

export default function JoinClassPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Join a Class</h1>
          <p className="text-muted-foreground">Enter a class code or browse available classes</p>
        </div>
        <div>
          <Button onClick={() => setOpen(true)}>Open Join Dialog</Button>
        </div>
      </div>

      <JoinClassDrawer open={open} onOpenChange={setOpen} />
    </div>
  );
}
