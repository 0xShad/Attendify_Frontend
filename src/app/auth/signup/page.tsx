"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type FormData = {
  fullName: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  email: string;
  otp: string;
};

type ValidationErrors = {
  fullName: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  email: string;
  otp: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    email: "",
    otp: "",
  });
  const [emailEntered, setEmailEntered] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({
    fullName: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    email: "",
    otp: "",
  });
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Validation functions
  const validateFullName = (name: string): string => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name))
      return "Name can only contain letters and spaces";
    return "";
  };

  const validateDateOfBirth = (date: string): string => {
    if (!date) return "Date of birth is required";
    const today = new Date();
    const birthDate = new Date(date);
    const age = today.getFullYear() - birthDate.getFullYear();
    if (birthDate > today) return "Date cannot be in the future";
    if (age < 13) return "You must be at least 13 years old";
    if (age > 100) return "Please enter a valid date";
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password))
      return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password))
      return "Password must contain at least one number";
    return "";
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string
  ): string => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateOTP = (otp: string): string => {
    if (!otp) return "Verification code is required";
    if (otp.length !== 6) return "Verification code must be 6 digits";
    if (!/^\d+$/.test(otp))
      return "Verification code must contain only numbers";
    return "";
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation
    let error = "";
    switch (field) {
      case "fullName":
        error = validateFullName(value);
        break;
      case "dateOfBirth":
        error = validateDateOfBirth(value);
        break;
      case "password":
        error = validatePassword(value);
        // Also revalidate confirm password if it exists
        if (formData.confirmPassword) {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: validateConfirmPassword(
              formData.confirmPassword,
              value
            ),
          }));
        }
        break;
      case "confirmPassword":
        error = validateConfirmPassword(value, formData.password);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "otp":
        error = validateOTP(value);
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleNextStep = () => {
    // Validate all fields for step 1
    const newErrors = {
      fullName: validateFullName(formData.fullName),
      dateOfBirth: validateDateOfBirth(formData.dateOfBirth),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      ),
      email: "",
      otp: "",
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (hasErrors) {
      return;
    }

    setCurrentStep(2);
  };

  const handleBackStep = () => {
    setCurrentStep(1);
    setEmailEntered(false);
    setOtpSent(false);
  };

  const handleEmailSubmit = () => {
    const emailError = validateEmail(formData.email);
    setErrors((prev) => ({ ...prev, email: emailError }));

    if (emailError) {
      return;
    }

    setEmailEntered(true);
    setOtpSent(true);
    setCanResend(false);
    setResendTimer(60);
    // Here you would typically send OTP to the email
  };

  const handleResendOTP = () => {
    if (!canResend) return;

    // Resend OTP logic
    setOtpSent(true);
    setCanResend(false);
    setResendTimer(60);
    alert("OTP sent to your email!");
  };

  const handleCreateAccount = () => {
    const otpError = validateOTP(formData.otp);
    setErrors((prev) => ({ ...prev, otp: otpError }));

    if (otpError) {
      return;
    }

    // Create account logic
    alert("Account created successfully!");
    // Redirect to dashboard
    router.push("/dashboard");
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

        {/* Multi-Step Sign Up Card */}
        <Card className="w-full">
          <CardHeader className="space-y-4 pb-4">
            {currentStep === 1 ? (
              <>
                <h2 className="text-2xl font-semibold text-center">
                  Create Account
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Step 1 of 2: Personal Information
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-center">
                  Verify Your Email
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Step 2 of 2: Email Verification
                </p>
              </>
            )}

            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-2">
              {/* Step 1 */}
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentStep === 1
                      ? "bg-blue-600 ring-2 ring-blue-200"
                      : currentStep > 1
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span className="ml-2 text-xs font-medium text-gray-600 hidden sm:inline">
                  Personal Info
                </span>
              </div>

              {/* Connector Line */}
              <div className="flex-1 max-w-12">
                <div
                  className={`h-0.5 transition-all duration-300 ${
                    currentStep > 1 ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>

              {/* Step 2 */}
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentStep === 2
                      ? "bg-blue-600 ring-2 ring-blue-200"
                      : currentStep > 2
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span className="ml-2 text-xs font-medium text-gray-600 hidden sm:inline">
                  Email Verification
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {currentStep === 1 ? (
              // Step 1: Personal Information
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className={`w-full ${
                      errors.fullName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    required
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className={`w-full ${
                      errors.dateOfBirth
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                    required
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    className={`w-full ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className={`w-full ${
                      errors.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button className="w-full" size="lg" onClick={handleNextStep}>
                  Next
                </Button>
              </>
            ) : (
              // Step 2: Email Verification
              <>
                {!emailEntered ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className={`w-full ${
                          errors.email
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 order-2 sm:order-1"
                        onClick={handleBackStep}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 order-1 sm:order-2"
                        onClick={handleEmailSubmit}
                      >
                        Send OTP
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-4">
                      <p className="text-sm text-gray-600">
                        We've sent a 6-digit verification code to
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.email}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-center block">
                        Enter Verification Code
                      </Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={formData.otp}
                          onChange={(value) => handleInputChange("otp", value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot
                              index={0}
                              className={errors.otp ? "border-red-500" : ""}
                            />
                            <InputOTPSlot
                              index={1}
                              className={errors.otp ? "border-red-500" : ""}
                            />
                            <InputOTPSlot
                              index={2}
                              className={errors.otp ? "border-red-500" : ""}
                            />
                            <InputOTPSlot
                              index={3}
                              className={errors.otp ? "border-red-500" : ""}
                            />
                            <InputOTPSlot
                              index={4}
                              className={errors.otp ? "border-red-500" : ""}
                            />
                            <InputOTPSlot
                              index={5}
                              className={errors.otp ? "border-red-500" : ""}
                            />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      {errors.otp && (
                        <p className="text-sm text-red-500 text-center">
                          {errors.otp}
                        </p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Didn't receive the code?{" "}
                        <button
                          onClick={handleResendOTP}
                          disabled={!canResend}
                          className={`font-medium transition-colors ${
                            canResend
                              ? "text-blue-600 hover:text-blue-500 cursor-pointer"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {canResend
                            ? "Resend OTP"
                            : `Resend in ${resendTimer}s`}
                        </button>
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 order-2 sm:order-1"
                        onClick={handleBackStep}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 order-1 sm:order-2"
                        onClick={handleCreateAccount}
                      >
                        Verify & Create Account
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
