"use client";
import React, { useEffect, useState } from "react";
import { listMyStudentClasses } from "@/lib/api/classes";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CalendarDays, GraduationCap, LayoutGrid } from "lucide-react";

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
        const rawClasses = Array.isArray(json?.enrolled_classes) ? json.enrolled_classes.slice() : [];
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
        console.error('Failed to load academic info', err);
        if (mounted) setData({ program_name: null, current_academic_year: null, current_semester: null, enrolled_classes: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const programName = loading ? '—' : data?.program_name ?? 'No program';
  const year = loading ? '—' : data?.current_academic_year ?? 'N/A';
  const semester = loading ? '—' : data?.current_semester ?? 'N/A';
  const classes = data?.enrolled_classes ?? [];

  // Helper: format ISO timestamp into Asia/Manila date string
  const formatManilaDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const fmt = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric' });
      return fmt.format(d);
    } catch (e) {
      return new Date(iso).toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-white">Academic Program</CardTitle>
              <CardDescription className="text-slate-400">Current degree and term details</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 lg:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2.5">
              <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Program / Major</Label>
              <div className="flex items-center w-full h-11 px-4 rounded-lg border border-slate-600 bg-slate-700/40 text-slate-100 shadow-sm">
                <span className="font-medium truncate">{programName}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Academic Year</Label>
              <div className="flex items-center w-full h-11 px-4 rounded-lg border border-slate-600 bg-slate-700/40 text-slate-100 shadow-sm gap-3">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <span>{year}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Current Semester</Label>
              <div className="flex items-center w-full h-11 px-4 rounded-lg border border-slate-600 bg-slate-700/40 text-slate-100 shadow-sm gap-3">
                <LayoutGrid className="h-4 w-4 text-slate-500" />
                <span>{semester}</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

        <Card className="w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-white">Enrolled Classes</CardTitle>
                <CardDescription className="text-slate-400">{loading ? 'Loading…' : `${classes.length} active subjects`}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Enrolled</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-700/50">
            {classes.length === 0 && !loading ? (
              <div className="p-6 text-sm text-slate-400">No enrolled classes.</div>
            ) : (
              classes.map((cls, idx) => (
                <div key={idx} className="group flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-slate-700/20 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-6 w-full">
                    <div className="flex h-14 w-24 flex-none items-center justify-center">
                      <Badge variant="secondary" className="h-12 w-24 flex items-center justify-center rounded-md bg-slate-700/50 text-slate-300 border-0 text-sm tracking-wide px-1">
                        {(cls.course_code ?? '').toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="flex-1 font-semibold text-slate-100 group-hover:text-blue-400 transition-colors text-lg lg:text-xl truncate">{cls.course_name ?? 'Untitled'}</h4>
                  </div>

                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Enrolled</span>
                    <span className="text-sm font-medium text-slate-300">{formatManilaDate(cls.enrolled_at)}</span>
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