"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  UserCheck,
  Settings,
  Video,
  MapPin,
  Globe,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Settings,
      title: "Admin Portal",
      description:
        "Complete administrative control with user management, analytics, and system configuration",
    },
    {
      icon: GraduationCap,
      title: "Professor Portal",
      description:
        "Faculty dashboard for class management, attendance tracking, and student analytics",
    },
    {
      icon: UserCheck,
      title: "Student Portal",
      description:
        "Student-friendly interface for attendance history, class schedules, and profile management",
    },
    {
      icon: MapPin,
      title: "Face-to-Face Classes",
      description:
        "In-person attendance tracking with physical presence verification",
    },
    {
      icon: Video,
      title: "Hybrid Classes",
      description:
        "Flexible attendance for both physical and remote student participation",
    },
    {
      icon: Globe,
      title: "Online Classes",
      description:
        "Virtual classroom attendance with remote facial recognition verification",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image
                src="/logo_blue.png"
                alt="Attendify Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-foreground">
                Attendify
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-foreground">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Join up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Main Animated Blue Blobs - Positioned on sides with mobile support */}
          <div className="absolute top-1/4 -left-24 md:-left-12 lg:left-0 w-72 md:w-80 lg:w-96 h-72 md:h-80 lg:h-96 bg-blue-500/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-1/4 -right-24 md:-right-12 lg:right-0 w-64 md:w-72 lg:w-80 h-64 md:h-72 lg:h-80 bg-primary/40 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-2/3 -left-20 md:left-1/4 w-56 md:w-64 lg:w-72 h-56 md:h-64 lg:h-72 bg-blue-400/25 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
          
          {/* Floating Geometric Shapes - Mobile responsive */}
          <div className="absolute top-1/4 right-4 md:right-1/4 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-4 md:left-1/4 w-16 md:w-24 h-16 md:h-24 bg-primary/15 rounded-full blur-lg animate-pulse delay-700"></div>
          <div className="absolute top-3/4 right-6 md:right-1/3 w-28 md:w-40 h-28 md:h-40 bg-accent/20 rounded-full blur-2xl animate-pulse delay-300"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="h-full w-full" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(var(--primary)) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div
            className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-tight mb-6">
              Say Goodbye to{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent animate-pulse">
                Manual Roll Calls
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
              Transform your institution with cutting-edge facial recognition technology. 
              Instant, accurate, and secure attendance tracking.
            </p>
            
            {/* CTA Button with enhanced styling */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  <span className="mr-2">Try it out</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <div className="w-1 h-8 bg-primary/30 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Attendify provides comprehensive solutions for modern educational
              institutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`p-8 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-0">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Image
                src="/logo_blue.png"
                alt="Attendify Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-bold text-foreground">
                Attendify
              </span>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground mb-2">
                © 2024 Attendify. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground">
                Advanced facial recognition attendance system
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
