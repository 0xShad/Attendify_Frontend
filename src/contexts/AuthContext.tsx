/**
 * AuthContext
 * Provides authentication state and methods throughout the application
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { User, LoginInitiateRequest, LoginVerifyRequest, RegisterInitiateRequest, RegisterVerifyRequest } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Registration flow
  registerInitiate: (userData: RegisterInitiateRequest) => Promise<{ success: boolean; email?: string }>;
  registerVerify: (otpData: RegisterVerifyRequest) => Promise<boolean>;
  
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  
  return context;
}
