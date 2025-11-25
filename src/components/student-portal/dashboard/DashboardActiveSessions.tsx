"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Camera, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

type Session = {
  id: string;
  classId?: string;
  className?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  mode?: string;
  location?: string;
  requiresFaceRecognition?: boolean;
  allowOnlineMode?: boolean;
  cutoffTime?: number;
};

export default function DashboardActiveSessions({ sessions }: { sessions: Session[] }) {
  return (
    <Card className="lg:col-span-2 border shadow-sm bg-stone-50/40 supports-backdrop-filter:backdrop-blur-md border-stone-200/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Active Sessions</CardTitle>
          <Badge className="bg-green-100 text-green-700 border-green-200">{sessions.length} Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active sessions</p>
            <p className="text-sm">Sessions will appear here when they start</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 rounded-lg border bg-linear-to-r from-green-50 to-blue-50 border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <h4 className="font-medium truncate">{session.className}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.startTime} - {session.endTime}
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {session.allowOnlineMode && (
                      <Button size="sm" variant="outline" className="whitespace-nowrap">
                        <Wifi className="w-3 h-3 mr-1" />
                        Join Online
                      </Button>
                    )}
                    {session.requiresFaceRecognition && (
                      <Button size="sm" className="whitespace-nowrap">
                        <Camera className="w-3 h-3 mr-1" />
                        Face Scan
                      </Button>
                    )}
                  </div>
                </div>

                {session.cutoffTime && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-600" viewBox="0 0 24 24" fill="none"><path d="M12 8v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg>
                    <span className="text-yellow-700">Attendance closes {session.cutoffTime} minutes after start time</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
