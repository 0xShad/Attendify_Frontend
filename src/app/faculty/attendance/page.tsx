"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AttendancePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main faculty dashboard with attendance tab
    router.replace("/faculty/dashboard?tab=attendance");
  }, [router]);

  return null;
}
