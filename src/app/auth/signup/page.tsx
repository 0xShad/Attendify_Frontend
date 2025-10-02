"use client";

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

export default function SignUpPage() {
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

        {/* Sign Up Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-2xl font-semibold text-center">
              Create Account
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Fill in your information to get started
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">PUP Webmail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your PUP Webmail"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                className="w-full"
                required
              />
            </div>

            <Button className="w-full" size="lg">
              Create Account
            </Button>
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
