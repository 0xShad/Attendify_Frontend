"use client";

import { redirect } from "next/navigation";

export default function StudentRootPage() {
  // Redirect to dashboard by default
  redirect("/student/dashboard");
}
