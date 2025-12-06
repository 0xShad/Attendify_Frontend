"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Camera, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import StartSessionDialog from "@/components/student-portal/classes/StartSessionDialog";
import TakeAttendanceF2F from "@/components/student-portal/attendance/TakeAttendanceF2F";
import TakeAttendance from "@/components/student-portal/attendance/TakeAttendance";
import { getMyClassSession } from '@/lib/api/classes';
import { useToast } from '@/hooks/use-toast';

type Session = {
  id: string;
  classId?: string;
  className?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  isSecretary?: boolean;
  sessionId?: string | number | null;
  mode?: string;
  location?: string;
  requiresFaceRecognition?: boolean;
  allowOnlineMode?: boolean;
  cutoffTime?: number;
};

export default function DashboardActiveSessions({ sessions, currentSession, onRefresh, currentUserIsSecretary }: { sessions: Session[]; currentSession?: Session; onRefresh?: () => Promise<void> | void; currentUserIsSecretary?: boolean }) {
  const { toast } = useToast();
  const displaySessions: Session[] = React.useMemo(() => {
    const list = Array.isArray(sessions) ? [...sessions] : [];
    if (currentSession) {
      const exists = list.some((s) => String(s.id) === String(currentSession.id));
      if (!exists) list.unshift(currentSession);
    }
    return list;
  }, [sessions, currentSession]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogSession, setDialogSession] = React.useState<Session | null>(null);
  const [f2fOpen, setF2fOpen] = React.useState(false);
  const [f2fClassItem, setF2fClassItem] = React.useState<any | null>(null);
  const [f2fSessionInfo, setF2fSessionInfo] = React.useState<any | null>(null);
  const [takeOpen, setTakeOpen] = React.useState(false);
  const [takeClassItem, setTakeClassItem] = React.useState<any | null>(null);
  const [takeSessionInfo, setTakeSessionInfo] = React.useState<any | null>(null);

  const openStartDialog = (s: Session) => {
    setDialogSession(s);
    setDialogOpen(true);
  };

  const closeStartDialog = () => {
    setDialogOpen(false);
    setDialogSession(null);
  };

  const openF2FDialog = async (s: Session) => {
    // Prepare class item
    const classItem = { id: s.classId ?? s.id, course_name: s.className ?? s.className };
    setF2fClassItem(classItem);
    // Try to fetch session details from the backend for this class so we can
    // detect whether attendance has already been taken (backend may return
    // `session_message` or similar). If fetch fails, fall back to minimal info.
    const classIdNum = Number(s.classId ?? s.id);
    if (!Number.isNaN(classIdNum) && classIdNum) {
      try {
        const resp = await getMyClassSession(classIdNum);
        // If backend provided a session_message (e.g., already submitted), don't open dialog
        const msg = resp?.session_message ?? resp?.message ?? null;
        // Determine if current user should be allowed to open the F2F scanner
        const rawMode = String(s.mode ?? "");
        const normMode = rawMode.toLowerCase().replace(/[-\s]+/g, '_');
        const modeIsF2F = /f2f/.test(normMode) || normMode.includes('face') || /face|f2f/i.test(rawMode);
        const userIsSecretaryForSession = typeof currentUserIsSecretary === 'boolean' ? currentUserIsSecretary : !!s.isSecretary;

        if (msg) {
          // Allow secretaries to open the F2F scanner even if attendance was
          // already submitted, but only when this is a face-to-face session
          // and the session is active. Otherwise, show the server message
          // and prevent opening.
          if (!(userIsSecretaryForSession && modeIsF2F && !!s.isActive)) {
            try { toast({ title: 'Session', description: String(msg) }); } catch (e) {}
            return;
          }
          // Otherwise, log informational toast but continue and open dialog
          try { toast({ title: 'Session', description: String(msg) }); } catch (e) {}
        }
        // pass resp directly as sessionInfo so TakeAttendanceF2F can read active_session_id/session_id
        setF2fSessionInfo(resp ?? (s.sessionId ? { active_session_id: s.sessionId, session_id: s.sessionId, class: { id: classItem.id } } : { class: { id: classItem.id } }));
        setF2fOpen(true);
        return;
      } catch (err) {
        // fallback: still open the dialog but sessionInfo may be null and the camera will show missing id
        if (s.sessionId) {
          setF2fSessionInfo({ active_session_id: s.sessionId, session_id: s.sessionId, class: { id: classItem.id } });
        } else {
          setF2fSessionInfo({ class: { id: classItem.id } });
        }
        setF2fOpen(true);
        return;
      }
    }

    // No class id available; open with minimal info (will likely show missing id message)
    setF2fSessionInfo({ class: { id: null } });
    setF2fOpen(true);
  };

  const closeF2FDialog = () => {
    setF2fOpen(false);
    setF2fClassItem(null);
    setF2fSessionInfo(null);
  };

  const openTakeDialog = async (s: Session) => {
    const classItem = { id: s.classId ?? s.id, course_name: s.className ?? s.className };
    setTakeClassItem(classItem);
    // Fetch latest session info so we can prevent opening the dialog when
    // attendance has already been taken. If fetch fails, fall back to prior behavior.
    const classIdNum = Number(s.classId ?? s.id);
    if (!Number.isNaN(classIdNum) && classIdNum) {
      try {
        const resp = await getMyClassSession(classIdNum);
        const msg = resp?.session_message ?? resp?.message ?? null;
        if (msg) {
          try { toast({ title: 'Session', description: String(msg) }); } catch (e) {}
          return;
        }
        setTakeSessionInfo(resp ?? (s.sessionId ? { active_session_id: s.sessionId, session_id: s.sessionId, class: { id: classItem.id } } : null));
        setTakeOpen(true);
        return;
      } catch (err) {
        if (s.sessionId) {
          setTakeSessionInfo({ active_session_id: s.sessionId, session_id: s.sessionId, class: { id: classItem.id } });
        } else {
          setTakeSessionInfo(null);
        }
        setTakeOpen(true);
        return;
      }
    }

    // No class id available; open and let the child component fetch on mount
    if (s.sessionId) {
      setTakeSessionInfo({ active_session_id: s.sessionId, session_id: s.sessionId, class: { id: classItem.id } });
    } else {
      setTakeSessionInfo(null);
    }
    setTakeOpen(true);
  };

  const closeTakeDialog = () => {
    setTakeOpen(false);
    setTakeClassItem(null);
    setTakeSessionInfo(null);
  };

  return (
    <Card className="lg:col-span-2 border shadow-sm bg-stone-50/40 supports-backdrop-filter:backdrop-blur-md border-stone-200/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Active Sessions</CardTitle>
          <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {displaySessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active sessions</p>
            <p className="text-sm">Sessions will appear here when they start</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displaySessions.map((session) => {
              const rawMode = String(session.mode ?? "");
              const normMode = rawMode.toLowerCase().replace(/[-\s]+/g, '_');
              const modeLabel = normMode === 'face_to_face' ? 'Face-to-face' : normMode === 'online' ? 'Online' : normMode === 'hybrid' ? 'Hybrid' : (rawMode ? rawMode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null);
              const modeIsF2F = /f2f/.test(normMode) || normMode.includes('face') || /face|f2f/i.test(rawMode);
              const userIsSecretary = typeof currentUserIsSecretary === 'boolean' ? currentUserIsSecretary : !!session.isSecretary;

              return (
              <div key={session.id} className="p-4 rounded-lg border bg-linear-to-r from-green-50 to-blue-50 border-green-200">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <h4 className="font-medium truncate">{session.className}</h4>
                    </div>
                    {modeLabel && (
                      <Badge variant="outline" className="text-xs ml-2 whitespace-nowrap" aria-label={`Mode: ${modeLabel}`}>
                        {modeLabel}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
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

                    {session.isActive ? (
                      // Active session: show regular attendee actions only
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch mt-2 sm:mt-0 w-full sm:w-auto">
                        {(session.requiresFaceRecognition || session.isActive) && (() => {
                          // If this is a face-to-face session and the user is NOT a secretary,
                          // hide the camera button and show an informational message instead.
                          if (modeIsF2F && !userIsSecretary) {
                            return (
                              <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">
                                Face to face attendance has to be taken on your professor&apos;s or class secretary&apos;s device.
                              </div>
                            );
                          }

                          // Secretary + F2F -> open F2F scanner
                          if (userIsSecretary && modeIsF2F) {
                            return (
                              <Button size="sm" className="w-full sm:w-auto sm:whitespace-nowrap" onClick={async () => { try { await openF2FDialog(session); } catch (e) { } }}>
                                <Camera className="w-3 h-3 mr-1" />
                                Face Scan
                              </Button>
                            );
                          }

                          // Otherwise (non-F2F or hybrid/online), open the attendee TakeAttendance dialog
                          return (
                            <Button size="sm" className="w-full sm:w-auto sm:whitespace-nowrap" onClick={async () => { try { await openTakeDialog(session); } catch (e) { } }}>
                              <Camera className="w-3 h-3 mr-1" />
                              Face Scan
                            </Button>
                          );
                        })()}
                      </div>
                    ) : (
                      // session is not active: secretaries can start, others see an informational message
                      session.isSecretary ? (
                        <div className="mt-2 sm:mt-0">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto bg-gray-100 text-gray-800 border-gray-200" onClick={() => openStartDialog(session)}>
                            Start Session
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">
                          The attendance session for this class has not been started by your professor or class secretary yet
                        </div>
                      )
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
            );
            })}
          </div>
        )}
      </CardContent>
        <StartSessionDialog
          open={dialogOpen}
          onOpenChange={async (v) => {
            setDialogOpen(Boolean(v));
            if (!v) {
              // If a face-to-face session was created and the dialog is now
              // closing, refresh the parent dashboard. We intentionally avoid
              // refreshing immediately when the session is created because
              // that would unmount the dialog and the camera; waiting until
              // the dialog is closed preserves the scanning UI.
              if (dialogSession && ((dialogSession as any).f2f_activated || (dialogSession as any).f2fActivated || (dialogSession as any).schedule_mode === 'face_to_face')) {
                if (typeof onRefresh === 'function') {
                  try { await onRefresh(); } catch (e) { }
                }
              }
              setDialogSession(null);
            }
          }}
          // dialogSession may be either a local class descriptor (with `id`/`classId`)
          // or a created ClassSession object returned from the server which uses
          // snake_case fields like `class_id` and `class_code`. Prefer the
          // canonical class id when available (classId | class_id), otherwise
          // fall back to the session id.
          classId={
            dialogSession?.classId ?? (dialogSession as any)?.class_id ?? dialogSession?.id ?? null
          }
          classCode={
            (dialogSession as any)?.class_code ?? dialogSession?.className ?? null
          }
          onCreated={async (s: any) => {
            try {
              // If backend activated face-to-face scanning, keep the dialog open
              // so StartSessionDialog can show the scanner. Store the created
              // session object in `dialogSession` so the dialog can rehydrate
              // its internal state if the parent refreshes/unmounts it.
              if (s && (s.f2f_activated || s.f2fActivated || s.schedule_mode === 'face_to_face')) {
                try { setDialogSession(s); } catch (e) {}
                // Don't refresh immediately for F2F sessions — wait until the
                // dialog is closed so the camera remains mounted for scanning.
                return;
              }

              // Non-F2F: close dialog then refresh parent dashboard
              closeStartDialog();
              if (typeof onRefresh === 'function') {
                try { await onRefresh(); } catch (e) { }
              }
            } catch (e) {}
          }}
          isSecretary={dialogSession?.isSecretary ?? false}
          // Only forward `initialSession` when the parent stored object looks
          // like a created ClassSession (has `created_at`, `attendance_taken`,
          // or an explicit `f2f_activated` flag). We must avoid treating the
          // initial class descriptor (which often has `id` as the class id)
          // as a created session because that causes the dialog to skip the
          // `phase=initial` backend check.
          initialSession={
            dialogSession && (
              ((dialogSession as any).created_at !== undefined && (dialogSession as any).created_at !== null) ||
              ((dialogSession as any).attendance_taken !== undefined) ||
              ((dialogSession as any).f2f_activated)
            ) ? dialogSession : null
          }
        />
        <TakeAttendanceF2F
          open={f2fOpen}
          onOpenChange={async (v) => {
            setF2fOpen(Boolean(v));
            if (!v) {
              setF2fClassItem(null);
              setF2fSessionInfo(null);
              if (typeof onRefresh === 'function') {
                try { await onRefresh(); } catch (e) { }
              }
            }
          }}
          classItem={f2fClassItem ?? undefined}
          sessionInfo={f2fSessionInfo ?? undefined}
          onRecorded={() => { /* no-op by default; parent may refresh if needed */ }}
        />
        <TakeAttendance
          open={takeOpen}
          onOpenChange={async (v) => {
            setTakeOpen(Boolean(v));
            if (!v) {
              closeTakeDialog();
              if (typeof onRefresh === 'function') {
                try { await onRefresh(); } catch (e) { }
              }
            }
          }}
          classItem={takeClassItem ?? undefined}
          sessionInfo={takeSessionInfo ?? undefined}
          onRecorded={() => { /* no-op */ }}
        />
    </Card>
  );
}
