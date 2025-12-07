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

    console.log('🍪 [SET-TOKENS] Setting tokens, accessToken present:', !!accessToken, 'refreshToken present:', !!refreshToken);

    if (!accessToken) {
      console.error('🍪 [SET-TOKENS] ERROR: Missing accessToken');
      return NextResponse.json(
        { success: false, message: 'Missing accessToken' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = getCookieOptions(isProduction);

    console.log('🍪 [SET-TOKENS] Cookie options:', { ...cookieOptions, isProduction });

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

    console.log('🍪 [SET-TOKENS] Access token cookie set:', COOKIE_CONFIG.ACCESS_TOKEN.name);

    // Set refresh token if provided
    if (refreshToken) {
      cookieStore.set(
        COOKIE_CONFIG.REFRESH_TOKEN.name,
        refreshToken,
        {
          ...cookieOptions,
          maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
        }
      );
      console.log('🍪 [SET-TOKENS] Refresh token cookie set:', COOKIE_CONFIG.REFRESH_TOKEN.name);
    }

    console.log('🍪 [SET-TOKENS] SUCCESS: Tokens set successfully');
    return NextResponse.json({
      success: true,
      message: 'Tokens set successfully',
    });
  } catch (error) {
    console.error('🍪 [SET-TOKENS] ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set tokens' },
      { status: 500 }
    );
  }
}
