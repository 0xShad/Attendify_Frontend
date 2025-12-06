import { NextRequest, NextResponse } from "next/server";

// Support NEXT_PUBLIC_AUTH_API_URL values that may include or omit a trailing '/auth'.
const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:8000/api/v1/auth").replace(/\/auth\/?$/, "");

export async function PUT(req: NextRequest) {
  try {
    const upstream = `${AUTH_URL.replace(/\/$/, "")}/users/me/password`;

    // Build headers from incoming request, but omit host
    const headers: Record<string, string> = {};
    for (const [k, v] of req.headers.entries()) {
      if (k.toLowerCase() === "host") continue;
      headers[k] = v;
    }

    // If no Authorization header present, attempt to read access_token cookie
    if (!headers["authorization"]) {
      const cookie = req.headers.get("cookie") || "";
      const m = cookie.match(/(?:^|; )access_token=([^;]+)/);
      if (m) headers["authorization"] = `Bearer ${decodeURIComponent(m[1])}`;
    }

    const body = await req.arrayBuffer();

    const res = await fetch(upstream, {
      method: "PUT",
      headers,
      body: body.byteLength ? Buffer.from(body) : undefined,
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": contentType },
    });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || String(err) }, { status: 500 });
  }
}
