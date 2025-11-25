"use client";
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Session = {
  id: string;
  name: string;
  mode?: string;
  nextSession?: string | Date | null;
  location?: string | null;
};

type Props = {
  sessions: Session[];
};

export default function DashboardUpcomingSessions({ sessions }: Props) {
  return (
    <Card className="border shadow-sm bg-stone-50/40 supports-backdrop-filter:backdrop-blur-md border-stone-200/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No classes today</p>
            <p className="text-sm">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 4).map((cls) => {
              const sessionTime = cls.nextSession ? new Date(cls.nextSession) : null;
              const timeUntil = sessionTime
                ? Math.floor((sessionTime.getTime() - new Date().getTime()) / (1000 * 60))
                : 0;

              return (
                <div
                  key={cls.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-stone-200/50 hover:bg-white/70 transition-colors"
                >
                  <div className="shrink-0">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        cls.mode === "Online"
                          ? "bg-blue-500"
                          : cls.mode === "In-Person"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{cls.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {sessionTime
                          ? sessionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "TBD"}
                      </span>
                      {cls.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{cls.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <Badge variant="outline" className="text-xs">
                      {timeUntil > 60
                        ? `${Math.floor(timeUntil / 60)}h ${timeUntil % 60}m`
                        : `${timeUntil}m`}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {sessions.length > 4 && (
              <Link href="/student/classes">
                <Button variant="ghost" className="w-full">
                  View All Classes
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
