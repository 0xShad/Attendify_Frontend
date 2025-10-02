import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Attendify</h1>
          <p className="mt-4 text-lg text-gray-600">
            Facial Recognition Attendance System
          </p>
        </div>

        {/* Navigation Card */}
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold text-center">Get Started</h2>
            <p className="text-sm text-gray-600 text-center">
              Choose an option to continue
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <Link href="/auth/login" className="block">
              <Button className="w-full" size="lg">
                Login
              </Button>
            </Link>

            <Link href="/auth/signup" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Sign Up
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
