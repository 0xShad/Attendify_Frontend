/**
 * Example: Protected Route Component
 * Shows how to protect a page and check authentication
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api/auth";
import { Loader2 } from "lucide-react";

export default function ProtectedPageExample() {
  const router = useRouter();
  const isAuthenticated = authAPI.isAuthenticated();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Your protected content here */}
      <h1>Protected Dashboard</h1>
    </div>
  );
}
