/**
 * useAuth Hook
 * Custom hook for managing authentication state and operations
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  authAPI, 
  type User, 
  type LoginInitiateRequest, 
  type LoginVerifyRequest,
  type RegisterInitiateRequest, 
  type RegisterVerifyRequest,
  type CheckAvailabilityRequest,
  type CheckAvailabilityResponse,
} from "@/lib/api/auth";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  // Registration flow
  registerInitiate: (userData: RegisterInitiateRequest) => Promise<{ success: boolean; email?: string }>;
  registerVerify: (otpData: RegisterVerifyRequest) => Promise<boolean>;
  checkAvailability: (data: CheckAvailabilityRequest) => Promise<CheckAvailabilityResponse>;
  
  // Login flow
  loginInitiate: (credentials: LoginInitiateRequest) => Promise<{ success: boolean; requiresOTP?: boolean; email?: string }>;
  loginVerify: (otpData: LoginVerifyRequest) => Promise<boolean>;
  
  // Other operations
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const user = await authAPI.getCurrentUser();
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: error instanceof Error ? error.message : "Failed to initialize auth",
        });
      }
    };

    initAuth();
  }, []);

  // ==================== REGISTRATION FLOW ====================

  /**
   * Step 1: Initiate registration
   * Sends OTP to user's email
   */
  const registerInitiate = useCallback(async (
    userData: RegisterInitiateRequest
  ): Promise<{ success: boolean; email?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authAPI.registerInitiate(userData);
      
      // Backend returns 200 OK with message, no "success" field
      // If we get here without error, it was successful
      setState((prev) => ({ ...prev, isLoading: false }));
      
      toast.success("OTP sent!", {
        description: response.message || "Please check your email for the verification code.",
      });

      return { success: true, email: userData.email };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast.error("Registration failed", {
        description: errorMessage,
      });

      return { success: false };
    }
  }, []);

  /**
   * Step 2: Verify OTP and complete registration
   */
  const registerVerify = useCallback(async (
    otpData: RegisterVerifyRequest
  ): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authAPI.registerVerify(otpData);
      
      // Backend returns user object on success (no "success" field)
      if (response.user) {
        setState((prev) => ({ ...prev, isLoading: false }));
        
        toast.success("Account created!", {
          description: response.message || "Your account has been successfully created. Please login.",
        });

        // Redirect to login page
        router.push("/auth/login");
        return true;
      }

      throw new Error(response.message || "OTP verification failed");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OTP verification failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast.error("Verification failed", {
        description: errorMessage,
      });

      return false;
    }
  }, [router]);

  // ==================== LOGIN FLOW ====================

  /**
   * Step 1: Initiate login
   * Either completes login immediately or sends OTP
   */
  const loginInitiate = useCallback(async (
    credentials: LoginInitiateRequest
  ): Promise<{ success: boolean; requiresOTP?: boolean; email?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authAPI.loginInitiate(credentials);
      
      if (response.success) {
        // Check if OTP is required
        if (response.data?.requiresOTP) {
          setState((prev) => ({ ...prev, isLoading: false }));
          
          toast.info("OTP Required", {
            description: "Please check your email for the verification code.",
          });

          return { 
            success: true, 
            requiresOTP: true, 
            email: response.data.email 
          };
        }

        // Login complete - tokens already stored by authAPI
        if (response.data?.user) {
          setState({
            user: response.data.user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
          
          toast.success("Login successful!", {
            description: `Welcome back, ${response.data.user.username}!`,
          });

          router.push("/dashboard");
          return { success: true, requiresOTP: false };
        }
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast.error("Login failed", {
        description: errorMessage,
      });

      return { success: false };
    }
  }, [router]);

  /**
   * Step 2: Verify OTP for login (if required)
   */
  const loginVerify = useCallback(async (
    otpData: LoginVerifyRequest
  ): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authAPI.loginVerify(otpData);
      
      if (response.success && response.data) {
        setState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        
        toast.success("Login successful!", {
          description: `Welcome back, ${response.data.user.username}!`,
        });

        router.push("/dashboard");
        return true;
      }

      throw new Error(response.message || "OTP verification failed");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OTP verification failed";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast.error("Verification failed", {
        description: errorMessage,
      });

      return false;
    }
  }, [router]);

  // ==================== OTHER OPERATIONS ====================

  // Logout
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await authAPI.logout();
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if API call fails
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      router.push("/auth/login");
    }
  }, [router]);

  // Forgot Password
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authAPI.forgotPassword({ email });
      
      if (response.success) {
        setState((prev) => ({ ...prev, isLoading: false }));
        
        toast.success("Email sent!", {
          description: "Password reset instructions have been sent to your email.",
        });

        return true;
      }

      throw new Error(response.message || "Failed to send reset email");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast.error("Request failed", {
        description: errorMessage,
      });

      return false;
    }
  }, []);

  // Reset Password
  const resetPassword = useCallback(async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authAPI.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });
      
      if (response.success) {
        setState((prev) => ({ ...prev, isLoading: false }));
        
        toast.success("Password reset successful!", {
          description: "You can now login with your new password.",
        });

        router.push("/auth/login");
        return true;
      }

      throw new Error(response.message || "Failed to reset password");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      toast.error("Reset failed", {
        description: errorMessage,
      });

      return false;
    }
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!authAPI.isAuthenticated()) return;

    try {
      const user = await authAPI.getCurrentUser();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails due to invalid token, logout
      await logout();
    }
  }, [logout]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    registerInitiate,
    registerVerify,
    loginInitiate,
    loginVerify,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
    clearError,
    checkAvailability: authAPI.checkAvailability.bind(authAPI),
  };
}
