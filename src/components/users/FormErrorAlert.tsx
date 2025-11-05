"use client";

import React from "react";
import { IconAlertCircle } from "@tabler/icons-react";

interface FormErrorAlertProps {
  error: string | null;
}

export function FormErrorAlert({ error }: FormErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-2">
        <IconAlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold text-red-900">Error</h4>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    </div>
  );
}


