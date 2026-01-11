"use client";
import React, { useEffect, useState } from "react";
import { listMyStudentClasses } from "@/lib/api/classes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutGrid,
} from "lucide-react";

type EnrolledClass = {
  course_name?: string | null;
  course_code?: string | null;
  enrolled_at?: string | null;
};

type AcademicResponse = {
  program_name?: string | null;
  current_academic_year?: string | null;
  current_semester?: string | null;
  enrolled_classes?: EnrolledClass[];
};

export default function AcademicInfo() {
  const [data, setData] = useState<AcademicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // debug state removed

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const json = await listMyStudentClasses();
        if (!mounted) return;
        // Normalize and sort enrolled classes by enrolled_at (descending: latest first)
        const rawClasses = Array.isArray(json?.enrolled_classes)
          ? json.enrolled_classes.slice()
          : [];
        rawClasses.sort((a: any, b: any) => {
          const ta = a?.enrolled_at ? Date.parse(a.enrolled_at) : 0;
          const tb = b?.enrolled_at ? Date.parse(b.enrolled_at) : 0;
          return tb - ta; // newest first
        });

        setData({
          program_name: json?.program_name ?? null,
          current_academic_year: json?.current_academic_year ?? null,
          current_semester: json?.current_semester ?? null,
          enrolled_classes: rawClasses,
        });
      } catch (err) {
        console.error("Failed to load academic info", err);
        if (mounted)
          setData({
            program_name: null,
            current_academic_year: null,
            current_semester: null,
            enrolled_classes: [],
          });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const programName = loading ? "—" : data?.program_name ?? "No program";
  const year = loading ? "—" : data?.current_academic_year ?? "N/A";
  const semester = loading ? "—" : data?.current_semester ?? "N/A";
  const classes = data?.enrolled_classes ?? [];

  // Helper: format ISO timestamp into Asia/Manila date string
  const formatManilaDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const fmt = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      return fmt.format(d);
    } catch (e) {
      return new Date(iso).toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-2xl">
        <CardHeader className="border-b border-slate-700/50 pb-5 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-900/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Academic Program
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Current degree and term details
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 lg:p-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="md:col-span-2 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Program / Major
              </Label>
              <div className="flex items-center w-full min-h-12 px-5 py-3 rounded-xl border border-slate-600 bg-gradient-to-br from-slate-700/40 to-slate-700/20 text-slate-100 shadow-sm hover:border-slate-500 transition-colors">
                <span className="font-semibold text-lg wrap-break-word">
                  {programName}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Academic Year
              </Label>
              <div className="flex items-center w-full min-h-12 px-5 py-3 rounded-xl border border-slate-600 bg-slate-700/40 text-slate-100 shadow-sm gap-3 hover:border-slate-500 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <CalendarDays className="h-4 w-4 text-blue-400 shrink-0" />
                </div>
                <span className="font-medium wrap-break-word">{year}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Semester
              </Label>
              <div className="flex items-center w-full min-h-12 px-5 py-3 rounded-xl border border-slate-600 bg-slate-700/40 text-slate-100 shadow-sm gap-3 hover:border-slate-500 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <LayoutGrid className="h-4 w-4 text-emerald-400 shrink-0" />
                </div>
                <span className="font-medium wrap-break-word">{semester}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-2xl">
        <CardHeader className="border-b border-slate-700/50 pb-5 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/30">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  Enrolled Classes
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  {loading
                    ? "Loading…"
                    : `${classes.length} active ${
                        classes.length === 1 ? "subject" : "subjects"
                      }`}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold px-4 py-1.5"
            >
              Enrolled
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-700/50">
            {loading ? (
              // Loading skeleton
              [...Array(3)].map((_, idx) => (
                <div key={idx} className="p-7 flex items-center gap-6">
                  <div className="h-14 w-28 rounded-xl bg-slate-700/30 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-3/4 rounded bg-slate-700/30 animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-slate-700/20 animate-pulse" />
                  </div>
                  <div className="h-10 w-24 rounded bg-slate-700/20 animate-pulse" />
                </div>
              ))
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/30 mb-4">
                  <BookOpen className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  No enrolled classes yet.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Your enrolled subjects will appear here.
                </p>
              </div>
            ) : (
              classes.map((cls, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col justify-between gap-4 p-7 transition-all hover:bg-slate-700/30 sm:flex-row sm:items-center border-l-4 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center gap-6 w-full">
                    <div className="flex h-16 w-28 flex-none items-center justify-center">
                      <Badge
                        variant="secondary"
                        className="h-14 w-28 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700/60 to-slate-700/40 text-slate-200 border border-slate-600 text-base font-bold tracking-wide px-2 shadow-sm"
                      >
                        {(cls.course_code ?? "").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-xl mb-1 truncate">
                        {cls.course_name ?? "Untitled"}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium">
                        Course Code: {(cls.course_code ?? "N/A").toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 bg-slate-700/30 px-2 py-1 rounded">
                      Enrolled
                    </span>
                    <span className="text-sm font-semibold text-slate-300">
                      {formatManilaDate(cls.enrolled_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* debug preview removed */}
    </div>
  );
}
