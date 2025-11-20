"use client";
import React from "react";
import { Wifi, MapPin, Video, BookOpen } from "lucide-react";

export const getNextSessionTime = (nextSession: Date) => {
  const now = new Date();
  const timeDiff = nextSession.getTime() - now.getTime();

  if (timeDiff < 0) return "Session ended";

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 1) return `in ${minutes}m`;
  if (hours < 24) return `in ${hours}h ${minutes}m`;

  return nextSession.toLocaleDateString();
};

export const getModeIcon = (mode: string) => {
  switch (mode) {
    case "Online":
      return <Wifi className="w-4 h-4" />;
    case "In-Person":
      return <MapPin className="w-4 h-4" />;
    case "Hybrid":
      return <Video className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

export const getModeColor = (mode: string) => {
  switch (mode) {
    case "Online":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "In-Person":
      return "bg-green-100 text-green-700 border-green-200";
    case "Hybrid":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};
