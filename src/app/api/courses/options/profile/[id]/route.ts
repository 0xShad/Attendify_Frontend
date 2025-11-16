import { NextResponse } from 'next/server';

// Deprecated proxy route: profile-scoped course options are removed.
// This route now returns 410 Gone so callers are encouraged to use
// `/api/courses/options/me` (server-side resolved from the authenticated user).
export async function GET() {
  return NextResponse.json({ detail: 'Profile-scoped course options removed. Use /api/courses/options/me instead.' }, { status: 410 });
}
