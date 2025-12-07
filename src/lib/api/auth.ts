/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

import { z } from "zod";

// ==================== API Configuration ====================
// Read at runtime instead of build time
function getAuthApiBaseUrl() {
  // Try to read from window.__ENV__ first (injected at runtime in layout)
  if (typeof window !== "undefined" && (window as any).__ENV__?.NEXT_PUBLIC_AUTH_API_URL) {
    console.log('🔑 [AUTH] Using window.__ENV__ AUTH_API_URL:', (window as any).__ENV__.NEXT_PUBLIC_AUTH_API_URL);
    return (window as any).__ENV__.NEXT_PUBLIC_AUTH_API_URL;
  }
  const fallback = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:8000/api/v1/auth";
  console.log('🔑 [AUTH] Using fallback AUTH_API_URL:', fallback, 'process.env:', process.env.NEXT_PUBLIC_AUTH_API_URL);
  return fallback;
}

function getApiBaseUrl() {
  // Try to read from window.__ENV__ first (injected at runtime in layout)
  if (typeof window !== "undefined" && (window as any).__ENV__?.NEXT_PUBLIC_USER_API_URL) {
    return (window as any).__ENV__.NEXT_PUBLIC_USER_API_URL;
  }
  return process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:8000/api/v1/users";
}

const AUTH_ENDPOINTS = {
  // Registration endpoints
  REGISTER_INITIATE: "/register/initiate",
  REGISTER_VERIFY: "/register/verify",
  CHECK_AVAILABILITY: "/check-availability",
  
  // Login endpoints
  LOGIN_INITIATE: "/login/initiate",
  LOGIN_VERIFY: "/login/verify",
  
  // Other auth endpoints
  LOGOUT: "/logout",
  REFRESH_TOKEN: "/refresh",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

const getUserEndpoints = () => ({
  ME: `${getApiBaseUrl()}/users/me`,
});

// ==================== Request/Response Types ====================

// Registration Types - Step 1: Initiate
export const registerInitiateSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  middlename: z.string().optional().nullable(),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterInitiateRequest = z.infer<typeof registerInitiateSchema>;

export interface RegisterInitiateResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    message: string;
  };
}

// Registration Types - Step 2: Verify OTP
export const registerVerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export type RegisterVerifyRequest = z.infer<typeof registerVerifySchema>;

export interface RegisterVerifyResponse {
  message: string;
  user: {
    id: number;
    email: string;
    username: string;
    firstname: string;
    middlename: string | null;
    lastname: string;
    is_active: boolean;
    is_email_verified: boolean;
    is_superuser: boolean;
    created_at: string;
  };
}

// Availability Check Types
export const checkAvailabilitySchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  student_number: z.string().optional(),
});

export type CheckAvailabilityRequest = z.infer<typeof checkAvailabilitySchema>;

export interface CheckAvailabilityResponse {
  email_available: boolean | null;
  username_available: boolean | null;
  student_number_available: boolean | null;
  message: string;
}

// Login Types - Step 1: Initiate
export const loginInitiateSchema = z.object({
  username_or_email: z.string().min(3, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInitiateRequest = z.infer<typeof loginInitiateSchema>;

// Response when OTP is enabled
export interface LoginInitiateOTPResponse {
  message: string;
  email: string;
  expires_in_minutes: number;
  remaining_attempts: number;
}

// Response when OTP is disabled (direct token)
export interface LoginInitiateTokenResponse {
  access_token: string;
  token_type: string;
}

export type LoginInitiateResponse = LoginInitiateOTPResponse | LoginInitiateTokenResponse;

// Login Types - Step 2: Verify OTP (if required)
export const loginVerifySchema = z.object({
  username_or_email: z.string().min(1, "Username or email is required"),
  code: z.string().length(6, "Code must be 6 digits"),
});

export type LoginVerifyRequest = z.infer<typeof loginVerifySchema>;

export interface LoginVerifyResponse {
  access_token: string;
  token_type: string;
}

// User Type
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  studentNumber?: string;
  contactNumber?: string;
  dateOfBirth: string;
  isVerified: boolean;
  role: "student" | "admin" | "teacher";
  createdAt: string;
  updatedAt: string;
}

// Forgot Password Types
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

// Reset Password Types
export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

// ==================== API Error Handling ====================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ==================== HTTP Client ====================

class HttpClient {
  private getBaseURL: () => string;

  constructor(getBaseURL: () => string) {
    this.getBaseURL = getBaseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseURL()}${endpoint}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add existing headers from options
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Add auth token if available
    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log('🌐 [HTTP CLIENT] Request:', {
      method: options.method,
      url,
      headers,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      console.log('🌐 [HTTP CLIENT] Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: JSON.stringify(data, null, 2),
      });

      if (!response.ok) {
        console.error('❌ [HTTP CLIENT] Error response:', JSON.stringify(data, null, 2));
        
        // Extract error message from various possible fields
        const errorMessage = 
          data.message || 
          data.detail || 
          data.error?.message || 
          data.error || 
          "An error occurred";
        
        throw new ApiError(
          response.status,
          errorMessage,
          data.error?.code,
          data.error?.details
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or parsing errors
      console.error('❌ [HTTP CLIENT] Network/Parse error:', error);
      
      // Provide user-friendly error messages for common network errors
      let errorMessage = "Network error occurred";
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new ApiError(500, errorMessage);
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  // Token management
  private getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }
}

// ==================== Auth API Class ====================

class AuthAPI {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(() => getAuthApiBaseUrl());
  }

  // ==================== REGISTRATION FLOW ====================

  /**
   * Step 1: Initiate registration
   * Sends OTP to user's email
   */
  async registerInitiate(userData: RegisterInitiateRequest): Promise<RegisterInitiateResponse> {
    console.log('🔍 [AUTH API] registerInitiate - Input data:', {
      ...userData,
      password: '***REDACTED***',
      confirmPassword: '***REDACTED***',
    });

    // Validate input
    try {
      registerInitiateSchema.parse(userData);
      console.log('✅ [AUTH API] Validation passed');
    } catch (error) {
      console.error('❌ [AUTH API] Validation failed:', error);
      throw error;
    }

    // Remove confirmPassword before sending to API (backend doesn't need it)
    const { confirmPassword: _confirmPassword, ...apiData } = userData;

    console.log('📤 [AUTH API] Sending to backend:', {
      endpoint: AUTH_ENDPOINTS.REGISTER_INITIATE,
      url: `${getAuthApiBaseUrl()}${AUTH_ENDPOINTS.REGISTER_INITIATE}`,
      data: {
        ...apiData,
        password: '***REDACTED***',
      },
    });

    const response = await this.client.post<RegisterInitiateResponse>(
      AUTH_ENDPOINTS.REGISTER_INITIATE,
      apiData
    );

    console.log('📥 [AUTH API] Response received:', JSON.stringify(response, null, 2));

    return response;
  }

  /**
   * Check availability of email, username, or student_number
   */
  async checkAvailability(data: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse> {
    // Validate input
    checkAvailabilitySchema.parse(data);

    const response = await this.client.post<CheckAvailabilityResponse>(
      AUTH_ENDPOINTS.CHECK_AVAILABILITY,
      data
    );

    return response;
  }

  /**
   * Step 2: Verify OTP and complete registration
   * Creates the actual user account
   */
  async registerVerify(otpData: RegisterVerifyRequest): Promise<RegisterVerifyResponse> {
    // Validate input
    registerVerifySchema.parse(otpData);

    const response = await this.client.post<RegisterVerifyResponse>(
      AUTH_ENDPOINTS.REGISTER_VERIFY,
      otpData
    );

    return response;
  }

  // ==================== LOGIN FLOW ====================

  /**
   * Step 1: Initiate login
   * Either returns JWT directly or sends OTP (based on REQUIRE_LOGIN_OTP setting)
   */
  async loginInitiate(credentials: LoginInitiateRequest): Promise<LoginInitiateResponse> {
    // Validate input
    loginInitiateSchema.parse(credentials);

    console.log('🔐 [API] Sending login initiate request:', { 
      username_or_email: credentials.username_or_email 
    });

    const response = await this.client.post<LoginInitiateResponse>(
      AUTH_ENDPOINTS.LOGIN_INITIATE,
      credentials
    );

    console.log('🔐 [API] Login initiate response:', response);

    // Check if we got a token directly (OTP disabled)
    if ('access_token' in response) {
      console.log('🔐 [API] Token received directly, storing token');
      await this.setTokens(response.access_token, response.access_token); // Backend uses single token
    } else if ('message' in response && 'email' in response) {
      console.log('🔐 [API] OTP response received:', {
        message: response.message,
        email: response.email,
        expires_in_minutes: response.expires_in_minutes
      });
    }

    return response;
  }

  /**
   * Step 2: Verify OTP for login (only if REQUIRE_LOGIN_OTP is enabled)
   * Returns JWT tokens after successful verification
   */
  async loginVerify(otpData: LoginVerifyRequest): Promise<LoginVerifyResponse> {
    // Validate input
    loginVerifySchema.parse(otpData);

    console.log('🔐 [API] Sending login verify request:', { 
      username_or_email: otpData.username_or_email 
    });

    const response = await this.client.post<LoginVerifyResponse>(
      AUTH_ENDPOINTS.LOGIN_VERIFY,
      otpData
    );

    console.log('🔐 [API] Login verify response:', response);

    // Store token after successful OTP verification
    await this.setTokens(response.access_token, response.access_token);

    return response;
  }

  // ==================== OTHER AUTH OPERATIONS ====================

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new ApiError(401, "No refresh token available");
    }

    const response = await this.client.post<ApiResponse<{ accessToken: string }>>(
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken }
    );

    if (response.success && response.data) {
      this.setAccessToken(response.data.accessToken);
      return response.data;
    }

    throw new ApiError(401, "Failed to refresh token");
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    forgotPasswordSchema.parse(data);

    const response = await this.client.post<ApiResponse>(
      AUTH_ENDPOINTS.FORGOT_PASSWORD,
      data
    );

    return response;
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    resetPasswordSchema.parse(data);

    const response = await this.client.post<ApiResponse>(
      AUTH_ENDPOINTS.RESET_PASSWORD,
      data
    );

    return response;
  }

  /**
   * Change password for currently authenticated user
   * Calls PUT /users/me/password on the configured AUTH API base URL
   */
  async changePassword(payload: {
    current_password: string;
    new_password: string;
    confirm_password?: string | null;
  }): Promise<any> {
    if (!payload?.current_password || !payload?.new_password) {
      throw new ApiError(400, "current_password and new_password are required");
    }

    // Use same-origin proxy to reach the users service password endpoint.
    // This ensures the request goes through Next.js API route which handles cookies/authorization.
    try {
      const res = await fetch(`/api/users/me/password`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = text;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch (_) {}

      if (!res.ok) {
        const msg = data?.message || data?.detail || `HTTP ${res.status}`;
        throw new ApiError(res.status, msg, data?.error?.code, data?.error?.details ?? data);
      }

      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, (err as Error)?.message || 'Failed to change password');
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    // Use full URL for /users/me endpoint
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    
    if (!token) {
      throw new ApiError(401, "No authentication token");
    }

    const response = await fetch(getUserEndpoints().ME, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        error.detail || error.message || "Failed to get user data"
      );
    }

    const user = await response.json();
    return user;
  }

  // ==================== Token Management ====================

  private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    // Send tokens to our API route which will set HTTP-only cookies
    await fetch('/api/auth/set-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
  }

  private async setAccessToken(accessToken: string): Promise<void> {
    // For refresh token flow, we need to get the existing refresh token
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.setTokens(accessToken, refreshToken);
    }
  }

  private getRefreshToken(): string | null {
    // Note: We can't directly read HTTP-only cookies from client-side
    // This will be handled server-side during token refresh
    return null;
  }

  /**
   * Clear authentication tokens from cookies
   */
  async clearTokens(): Promise<void> {
    await fetch('/api/auth/clear-tokens', {
      method: 'POST',
    });
  }

  /**
   * Check if user is authenticated
   * Note: In HTTP-only cookie setup, authentication is primarily handled by middleware.
   * This method is kept for backwards compatibility but always returns true on client.
   * The middleware will redirect unauthenticated users before they reach protected pages.
   */
  isAuthenticated(): boolean {
    // With HTTP-only cookies and server-side middleware protection,
    // if the client code is running on a protected page, user is authenticated.
    // Middleware blocks access before the page loads if not authenticated.
    return true;
  }

  /**
   * Get access token (not directly accessible due to HTTP-only cookies)
   * This is kept for API compatibility but returns null
   * Token is automatically sent with requests via cookies
   */
  getAccessToken(): string | null {
    // HTTP-only cookies are automatically sent with fetch requests
    // No need to manually include the token
    return null;
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();

// Export class for testing or custom instances
export { AuthAPI };

/**
 * Lightweight check to verify current session/auth status.
 * Returns `true` when the /users/me endpoint returns OK, `false` otherwise.
 * Uses credentials (cookies) and will include a localStorage Bearer token if present.
 */
export async function checkAuth(force = false): Promise<boolean> {
  // If called on server (no window), we cannot perform client-side check
  if (typeof window === "undefined") return false;

  const url = getUserEndpoints().ME;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Try to include any locally-stored token if available (best-effort)
  try {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("authToken");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {
    // ignore localStorage errors
  }

  try {
    const res = await fetch(url, { method: "GET", credentials: "include", headers });
    if (res.ok) return true;
    if (res.status === 401 || res.status === 403) return false;
    // treat other non-OK as not authenticated
    return false;
  } catch (err) {
    // network error -> conservatively treat as not authenticated
    return false;
  }
}

// ------------------------------------------------------------------
// Helper: changeMyPassword
// ------------------------------------------------------------------
/**
 * changeMyPassword
 * Calls same-origin proxy at `/api/users/me/password` which forwards to the auth service.
 */
export async function changeMyPassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password?: string | null;
}) {
  // Delegate to centralized authAPI instance which uses HttpClient (logging, headers)
  return authAPI.changePassword(payload);
}

