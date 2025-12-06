import { toast as sonnerToast } from "sonner";

import React from "react";

type ToastProps = {
  title?: string;
  // allow React nodes so callers can pass JSX (for newlines / lists)
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

export const useToast = () => {
  const toast = React.useCallback(({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      // For errors, show the description as the main message if provided
      sonnerToast.error(description || title || "An error occurred");
    } else {
      // For success, show the description as the main message if provided
      sonnerToast.success(description || title || "Success");
    }
  }, []);

  return { toast };
};
