"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main Animated Blue Blobs */}
        <div className="absolute top-1/4 -left-24 md:-left-12 lg:left-0 w-72 md:w-80 lg:w-96 h-72 md:h-80 lg:h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 -right-24 md:-right-12 lg:right-0 w-64 md:w-72 lg:w-80 h-64 md:h-72 lg:h-80 bg-primary/30 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-2/3 -left-20 md:left-1/4 w-56 md:w-64 lg:w-72 h-56 md:h-64 lg:h-72 bg-blue-400/15 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

        {/* Floating Geometric Shapes */}
        <div className="absolute top-1/4 right-4 md:right-1/4 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-4 md:left-1/4 w-16 md:w-24 h-16 md:h-24 bg-primary/15 rounded-full blur-lg animate-pulse delay-700"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(var(--primary)) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Branding */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center space-x-3 group">
            <Image
              src="/logo_blue.png"
              alt="Attendify Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain transition-transform group-hover:scale-110"
            />
            <span className="text-3xl font-bold text-foreground">Attendify</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Facial Recognition Attendance System
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full shadow-xl border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-2xl font-bold text-center text-foreground">
              {showOtpInput ? "Verify Your Identity" : "Welcome Back"}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {showOtpInput 
                ? `Enter the 6-digit code sent to your email`
                : "Sign in to access your account"
              }
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {connectionError && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                  {connectionError}
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                  {(() => {
                    // Try to parse if it's a JSON string
                    try {
                      const parsed = JSON.parse(error);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return (
                          <ul className="list-disc list-inside space-y-1">
                            {parsed.map((err: { message: string }, index: number) => (
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
                    <Label htmlFor="username" className="text-foreground">Username or Email</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username or email"
                      className="w-full placeholder:text-sm text-sm placeholder:text-muted-foreground bg-background/50 border-border focus:border-primary focus:ring-primary"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="w-full placeholder:text-sm placeholder:text-muted-foreground pr-10 text-sm bg-background/50 border-border focus:border-primary focus:ring-primary"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
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

                  <div className="text-xs text-right">
                    <Link href="/auth/forgot-password" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        We sent a verification code to:
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {userEmail}
                      </p>
                    </div>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="border-border" />
                        <InputOTPSlot index={1} className="border-border" />
                        <InputOTPSlot index={2} className="border-border" />
                        <InputOTPSlot index={3} className="border-border" />
                        <InputOTPSlot index={4} className="border-border" />
                        <InputOTPSlot index={5} className="border-border" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300" 
                size="lg"
                disabled={isLoading || (!showOtpInput && (!username || !password)) || (showOtpInput && otp.length !== 6)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {showOtpInput ? "Verifying..." : "Signing In..."}
                  </>
                ) : (
                  showOtpInput ? "Verify & Sign In" : "Sign In"
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col space-y-4">
            <Separator className="bg-border/50" />
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Create Account
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
