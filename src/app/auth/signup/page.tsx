"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";

type FormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | undefined;
  contactNumber: string;
  studentNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
};

type ValidationErrors = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  contactNumber: string;
  studentNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSubStep, setCurrentSubStep] = useState(1); // Sub-steps within registration
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: undefined,
    contactNumber: "",
    studentNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    contactNumber: "",
    studentNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
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
  const validateFirstName = (name: string): string => {
    if (!name.trim()) return "First name is required";
    if (name.trim().length < 2)
      return "First name must be at least 2 characters";
    if (!/^[a-zA-Z]+$/.test(name)) return "First name can only contain letters";
    return "";
  };

  const validateLastName = (name: string): string => {
    if (!name.trim()) return "Last name is required";
    if (name.trim().length < 2)
      return "Last name must be at least 2 characters";
    if (!/^[a-zA-Z]+$/.test(name)) return "Last name can only contain letters";
    return "";
  };

  const validateContactNumber = (contact: string): string => {
    if (!contact.trim()) return "Contact number is required";
    if (!/^\d{11}$/.test(contact))
      return "Contact number must be exactly 11 digits";
    return "";
  };

  const validateStudentNumber = (studentNum: string): string => {
    if (!studentNum.trim()) return "Student number is required";
    if (studentNum.trim().length < 5)
      return "Student number must be at least 5 characters";
    return "";
  };

  const validateDateOfBirth = (date: Date | undefined): string => {
    if (!date) return "Date of birth is required";
    const today = new Date();
    const monthDiff = today.getMonth() - date.getMonth();
    let age = today.getFullYear() - date.getFullYear();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }
    if (date > today) return "Date cannot be in the future";
    if (age < 17) return "You must be at least 17 years old";
    if (age > 100) return "Please enter a valid date";
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[A-Z])/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password))
      return "Password must contain at least one number";
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password))
      return "Password must contain at least one special character";
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
    const emailRegex = /^[^\s@]+@iskolarngbayan\.pup\.edu\.ph$/;
    if (!emailRegex.test(email))
      return "Email must be a valid @iskolarngbayan.pup.edu.ph address";
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
      case "firstName":
        error = validateFirstName(value);
        break;
      case "lastName":
        error = validateLastName(value);
        break;
      case "contactNumber":
        error = validateContactNumber(value);
        break;
      case "studentNumber":
        error = validateStudentNumber(value);
        break;
      case "email":
        error = validateEmail(value);
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
      case "otp":
        error = validateOTP(value);
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleNextSubStep = () => {
    let fieldsToValidate: string[] = [];
    let hasErrors = false;

    // Validate current sub-step fields
    if (currentSubStep === 1) {
      fieldsToValidate = ["firstName", "lastName", "dateOfBirth"];
      const firstNameError = validateFirstName(formData.firstName);
      const lastNameError = validateLastName(formData.lastName);
      const dateError = validateDateOfBirth(formData.dateOfBirth);

      setErrors((prev) => ({
        ...prev,
        firstName: firstNameError,
        lastName: lastNameError,
        dateOfBirth: dateError,
      }));

      hasErrors = !!(firstNameError || lastNameError || dateError);
    } else if (currentSubStep === 2) {
      fieldsToValidate = ["contactNumber", "studentNumber", "email"];
      const contactError = validateContactNumber(formData.contactNumber);
      const studentError = validateStudentNumber(formData.studentNumber);
      const emailError = validateEmail(formData.email);

      setErrors((prev) => ({
        ...prev,
        contactNumber: contactError,
        studentNumber: studentError,
        email: emailError,
      }));

      hasErrors = !!(contactError || studentError || emailError);
    } else if (currentSubStep === 3) {
      fieldsToValidate = ["password", "confirmPassword"];
      const passwordError = validatePassword(formData.password);
      const confirmError = validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      );

      setErrors((prev) => ({
        ...prev,
        password: passwordError,
        confirmPassword: confirmError,
      }));

      hasErrors = !!(passwordError || confirmError);
    }

    if (hasErrors) {
      return;
    }

    if (currentSubStep < 3) {
      setCurrentSubStep(currentSubStep + 1);
    } else {
      // Move to email verification step
      setCurrentStep(2);
    }
  };

  const handlePreviousSubStep = () => {
    if (currentSubStep > 1) {
      setCurrentSubStep(currentSubStep - 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setCurrentSubStep(3); // Go back to the last sub-step
      setOtpSent(false);
    }
  };

  const handleEmailSubmit = () => {
    // Email is already validated in step 1
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
                  {currentSubStep === 1 && "Personal Information"}
                  {currentSubStep === 2 && "Contact Details"}
                  {currentSubStep === 3 && "Security Setup"}
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Step {currentSubStep} of 3: Create Your Account
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-center">
                  Verify Your Email
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Final Step: Email Verification
                </p>
              </>
            )}

            {currentStep === 1 ? (
              <div className="w-full max-w-xs mx-auto">
                {/* Progress Bar Background */}
                <div className="relative">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(currentSubStep / 3) * 100}%` }}
                    />
                  </div>

                  {/* Step Numbers */}
                  <div className="flex justify-between absolute -top-1 w-full">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="relative">
                        <div
                          className={`w-4 h-4 rounded-full border-2 bg-white transition-all duration-300 flex items-center justify-center ${
                            currentSubStep >= step
                              ? "border-blue-500 text-blue-600"
                              : "border-gray-300 text-gray-400"
                          }`}
                        >
                          {currentSubStep > step ? (
                            <svg
                              className="w-2.5 h-2.5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-xs font-semibold">
                              {step}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Labels */}
                <div className="flex justify-between mt-6 text-xs">
                  <span
                    className={`font-medium ${
                      currentSubStep >= 1 ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    Personal
                  </span>
                  <span
                    className={`font-medium ${
                      currentSubStep >= 2 ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    Contact
                  </span>
                  <span
                    className={`font-medium ${
                      currentSubStep >= 3 ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    Security
                  </span>
                </div>
              </div>
            ) : (
              // Email Verification Step
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-blue-600">
                    Email Verification
                  </span>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {currentStep === 1 ? (
              // Registration Steps
              <>
                {/* Sub-Step 1: Personal Information */}
                {currentSubStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        className={`w-full border-[#e1eaef] placeholder:text-gray-400 placeholder:text-sm ${
                          errors.firstName
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        required
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-500">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        className={`w-full placeholder:text-gray-400 placeholder:text-sm ${
                          errors.lastName
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        required
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-500">
                          {errors.lastName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <DatePicker
                        date={formData.dateOfBirth}
                        onDateChange={(date) => {
                          setFormData((prev) => ({
                            ...prev,
                            dateOfBirth: date,
                          }));
                          // Validate immediately
                          const error = validateDateOfBirth(date);
                          setErrors((prev) => ({
                            ...prev,
                            dateOfBirth: error,
                          }));
                        }}
                        label="Date of Birth"
                        placeholder="Pick your date of birth"
                        error={!!errors.dateOfBirth}
                      />
                      {errors.dateOfBirth && (
                        <p className="text-sm text-red-500">
                          {errors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleNextSubStep}
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {/* Sub-Step 2: Contact Information */}
                {currentSubStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        type="tel"
                        placeholder="09123456789"
                        maxLength={11}
                        className={`w-full placeholder:text-gray-400 placeholder:text-sm ${
                          errors.contactNumber
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        value={formData.contactNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                          handleInputChange("contactNumber", value);
                        }}
                        required
                      />
                      {errors.contactNumber && (
                        <p className="text-sm text-red-500">
                          {errors.contactNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentNumber">Student Number</Label>
                      <Input
                        id="studentNumber"
                        type="text"
                        placeholder="Enter your student number"
                        className={`w-full placeholder:text-gray-400 placeholder:text-sm ${
                          errors.studentNumber
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        value={formData.studentNumber}
                        onChange={(e) =>
                          handleInputChange("studentNumber", e.target.value)
                        }
                        required
                      />
                      {errors.studentNumber && (
                        <p className="text-sm text-red-500">
                          {errors.studentNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="yourname@iskolarngbayan.pup.edu.ph"
                        className={`w-full placeholder:text-gray-400 placeholder:text-sm ${
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

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handlePreviousSubStep}
                      >
                        Back
                      </Button>
                      <Button className="flex-1" onClick={handleNextSubStep}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sub-Step 3: Security Information */}
                {currentSubStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a secure password"
                          className={`w-full pr-10 placeholder:text-gray-400 placeholder:text-sm ${
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
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className={`w-full pr-10 placeholder:text-gray-400 placeholder:text-sm ${
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
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handlePreviousSubStep}
                      >
                        Back
                      </Button>
                      <Button className="flex-1" onClick={handleNextSubStep}>
                        Continue to Verification
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Step 2: Email Verification
              <>
                {!otpSent ? (
                  <>
                    <div className="text-center space-y-4">
                      <p className="text-sm text-gray-600">
                        We will send a 6-digit verification code to
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.email}
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
