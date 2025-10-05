"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { loginInitiate, loginVerify, isLoading, error } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [connectionError, setConnectionError] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setConnectionError(""); // Clear previous connection errors

    if (showOtpInput) {
      // Step 2: Verify OTP - must use same username_or_email as initiate
      console.log('🔐 [LOGIN] Verifying OTP with:', { username_or_email: username });
      await loginVerify({ username_or_email: username, code: otp });
    } else {
      // Step 1: Initiate login
      console.log('🔐 [LOGIN] Initiating login with:', { username_or_email: username });
      const result = await loginInitiate({ username_or_email: username, password });
      
      console.log('🔐 [LOGIN] Initiate result:', result);
      
      if (result.success && result.requiresOTP) {
        console.log('🔐 [LOGIN] OTP required, showing OTP input');
        setShowOtpInput(true);
        setUserEmail(result.email || "");
      } else {
        console.log('🔐 [LOGIN] No OTP required or login failed');
      }
      // If no OTP required, user will be automatically redirected to dashboard
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Attendify</h1>
          <p className="mt-2 text-sm text-gray-600">
            Facial Recognition Attendance System
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full bg-card text-card-foreground">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-2xl font-bold text-center">
              {showOtpInput ? "Verify OTP" : "Login"}
            </h2>
            <p className="text-sm text-gray-600 text-center">
              {showOtpInput 
                ? `Enter the 6-digit code sent to ${userEmail}`
                : "Enter your credentials to access your account"
              }
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {connectionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {connectionError}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {(() => {
                    // Try to parse if it's a JSON string
                    try {
                      const parsed = JSON.parse(error);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return (
                          <ul className="list-disc list-inside space-y-1">
                            {parsed.map((err: any, index: number) => (
                              <li key={index}>{err.message}</li>
                            ))}
                          </ul>
                        );
                      }
                    } catch {
                      // Not JSON, display as is
                    }
                    return error;
                  })()}
                </div>
              )}
              
              {!showOtpInput ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username or Email</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username or email"
                      className="w-full placeholder:text-sm text-sm placeholder:text-gray-400"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="w-full placeholder:text-sm placeholder:text-gray-400 pr-10 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-right font-semibold text-blue-600 hover:text-blue-500 cursor-pointer">
                    <p>Forgot your password?</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit verification code sent to:
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {userEmail}
                    </p>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                    disabled={isLoading}
                  >
                    Back to Login
                  </Button>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading || (!showOtpInput && (!username || !password)) || (showOtpInput && otp.length !== 6)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {showOtpInput ? "Verifying OTP..." : "Signing In..."}
                  </>
                ) : (
                  showOtpInput ? "Verify OTP" : "Sign In"
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            <p className="text-sm text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
