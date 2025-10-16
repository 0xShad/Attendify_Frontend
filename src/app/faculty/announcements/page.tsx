"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnnouncementsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main faculty dashboard with announcements tab
    router.replace("/faculty/dashboard?tab=announcements");
  }, [router]);

  return null;
}
