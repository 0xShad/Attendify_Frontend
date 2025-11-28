import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTokenEntry, setTokenEntry } from "@/lib/server/tokenCache";
import { VALIDATION_CONFIG } from "@/config/auth";

export async function GET() {
  try {
    const ck = await cookies();
    const token = ck.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "no_token" }, { status: 401 });

    const entry = getTokenEntry(token);
    if (entry) {
      const payload = {
        profileId: entry.profileId ?? null,
        email: entry.email ?? null,
        username: entry.username ?? null,
        full_name: entry.full_name ?? null,
        role: entry.role ?? null,
      };
      return NextResponse.json(payload);
    }

    // If cache miss, attempt to fetch profile from backend to populate cache.
    // Best-effort: call /profiles/me via backend using the token.
    // First get user id from user service
    const userRes = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = await userRes.json();
    const userId = user.id || user.user_id;
    if (!userId) return NextResponse.json({ error: "no_user_id" }, { status: 400 });

    // Try to fetch canonical profile
    const profileRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    if (profileRes.ok) {
      const profile = await profileRes.json();
      try {
        setTokenEntry(token, {
          isValid: true,
          userId,
          role: profile.role,
          profileId: profile.id ?? undefined,
          email: typeof profile.email !== 'undefined' ? profile.email : null,
          username: typeof profile.username !== 'undefined' ? profile.username : null,
          full_name:
            typeof profile.full_name !== 'undefined'
              ? profile.full_name
              : (profile.firstname || profile.lastname) ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() : null,
          expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
        });
      } catch (e) {
        // ignore cache write errors
      }

      return NextResponse.json({
        profileId: profile.id ?? null,
        email: profile.email ?? null,
        username: profile.username ?? null,
        full_name: profile.full_name ?? (profile.firstname || profile.lastname ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() : null),
        role: profile.role ?? null,
      });
    }

    // If profile 404 or other, try onboarded endpoint to get enrichment
    const onboardRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/profiles/onboarded`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VALIDATION_CONFIG.REQUEST_TIMEOUT_MS),
    });

    if (onboardRes.ok) {
      const onboardData = await onboardRes.json();
      try {
        setTokenEntry(token, {
          isValid: true,
          userId,
          profileId: onboardData.profile_id ?? undefined,
          email: typeof onboardData.email !== 'undefined' ? onboardData.email : null,
          username: typeof onboardData.username !== 'undefined' ? onboardData.username : null,
          full_name: typeof onboardData.full_name !== 'undefined' ? onboardData.full_name : null,
          expiresAt: Date.now() + VALIDATION_CONFIG.CACHE_TTL_MS,
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        profileId: onboardData.profile_id ?? null,
        email: onboardData.email ?? null,
        username: onboardData.username ?? null,
        full_name: onboardData.full_name ?? null,
        role: null,
      });
    }

    return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch (err) {
    console.error("/api/session/enrichment error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
