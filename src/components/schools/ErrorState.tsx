"use client";

import React from "react";
import { IconSchool } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-red-800">
          <IconSchool className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Failed to load schools</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
