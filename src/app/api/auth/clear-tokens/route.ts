import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_CONFIG } from '@/config/auth';

/**
 * POST /api/auth/clear-tokens
 * Clears authentication cookies (logout)
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // Delete authentication cookies
    cookieStore.delete(COOKIE_CONFIG.ACCESS_TOKEN.name);
    cookieStore.delete(COOKIE_CONFIG.REFRESH_TOKEN.name);

    return NextResponse.json({
      success: true,
      message: 'Tokens cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing tokens:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear tokens' },
      { status: 500 }
    );
  }
}
