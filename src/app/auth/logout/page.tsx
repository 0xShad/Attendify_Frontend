"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    // Automatically logout when this page loads
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Logging out...</h2>
        <p className="text-sm text-gray-600 mt-2">Please wait while we log you out.</p>
      </div>
    </div>
  );
}
