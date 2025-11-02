import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const useToast = () => {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      // For errors, show the description as the main message if provided
      sonnerToast.error(description || title || "An error occurred");
    } else {
      // For success, show the description as the main message if provided
      sonnerToast.success(description || title || "Success");
    }
  };

  return { toast };
};
