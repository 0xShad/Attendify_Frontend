import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_CONFIG, getCookieOptions } from '@/config/auth';

/**
 * POST /api/auth/set-tokens
 * Sets authentication tokens as HTTP-only cookies
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Missing tokens' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = getCookieOptions(isProduction);

    // Set HTTP-only cookies for tokens
    // These cookies cannot be accessed via JavaScript (more secure)
    cookieStore.set(
      COOKIE_CONFIG.ACCESS_TOKEN.name,
      accessToken,
      {
        ...cookieOptions,
        maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
      }
    );

    cookieStore.set(
      COOKIE_CONFIG.REFRESH_TOKEN.name,
      refreshToken,
      {
        ...cookieOptions,
        maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Tokens set successfully',
    });
  } catch (error) {
    console.error('Error setting tokens:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set tokens' },
      { status: 500 }
    );
  }
}
