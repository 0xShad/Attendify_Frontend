"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main faculty dashboard with reports tab
    router.replace("/faculty/dashboard?tab=reports");
  }, [router]);

  return null;
}
