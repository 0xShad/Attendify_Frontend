"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Loader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30">
      {/* Background animated circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-primary/3 rounded-full animate-pulse delay-300"></div>
      </div>

      {/* Main loader content */}
      <div className="relative z-10 text-center">
        {/* Logo with animation */}
        <div className="mb-8 relative">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {/* Animated ring around logo */}
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div
              className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"
              style={{ animationDuration: "1s" }}
            ></div>

            {/* Logo */}
            <div className="absolute inset-2 flex items-center justify-center bg-background rounded-full shadow-lg">
              <Image
                src="/logo_blue.png"
                alt="Attendify Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain animate-pulse"
              />
            </div>
          </div>

          {/* Brand name with typing effect */}
          <h1 className="text-2xl font-bold text-foreground mb-2">Attendify</h1>
          <p className="text-sm text-muted-foreground">
            Facial Recognition Attendance System
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto mb-6">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Loading... {progress}%
          </div>
        </div>

        {/* Loading dots animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
        </div>
      </div>

      {/* Scanning line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan"></div>
      </div>
    </div>
  );
}
