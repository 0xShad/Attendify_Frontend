"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServiceUnavailablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const message = searchParams.get("message") || "Authentication service is temporarily unavailable.";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      router.push("/auth/login");
      router.refresh();
    }
  }, [countdown, router]);

  const handleRetry = () => {
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <IconAlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Service Unavailable</CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>What happened?</strong>
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
              We couldn't connect to the authentication service. This might be due to:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
              <li>Temporary server maintenance</li>
              <li>Network connectivity issues</li>
              <li>Service downtime</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              className="w-full"
              size="lg"
            >
              <IconRefresh className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Automatically retrying in <span className="font-semibold text-primary">{countdown}</span> seconds
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              If this problem persists, please contact your system administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
