"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClassesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main faculty dashboard with classes tab
    router.replace("/faculty/dashboard?tab=classes");
  }, [router]);

  return null;
}
