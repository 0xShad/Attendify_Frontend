"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { startSession, startSessionMultipart, StartSessionIn } from "@/lib/api/attendance";
import OnlineFaceCamera from "@/components/online-face-camera";
import F2FFaceCamera from "@/components/f2f-face-camera";
import { markPresentF2F } from '@/lib/api/attendance';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string | number | null;
  classCode?: string | null;
  onCreated?: (session: any) => void;
  isSecretary?: boolean;
  initialSession?: any | null;
}

export default function StartSessionDialog({ open, onOpenChange, classId, classCode, onCreated, isSecretary = false, initialSession = null }: Props) {
  // Use `initialSession` (if provided) to pre-populate `createdSession` and skip setup flows.
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialChecked, setInitialChecked] = useState(false);
  const [matched, setMatched] = useState<boolean | null>(null);
  const [matchedInfo, setMatchedInfo] = useState<any>(null);
  const [createdSession, setCreatedSession] = useState<any | null>(null);
  const [overrideMode, setOverrideMode] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "error">("idle");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [setupDone, setSetupDone] = useState(false);
  // awaitingCapture removed: camera opens immediately for secretaries
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!classId) return;
    // If parent provided an initialSession (e.g., secretary + f2f already active),
    // use it to pre-populate the dialog and skip the remote initial check.
    if (initialSession) {
      try {
        setCreatedSession(initialSession ?? null);
        setMatchedInfo(initialSession ?? null);
        setMatched(Boolean(initialSession?.matched ?? true));
        setOverrideMode(initialSession?.schedule_mode ?? null);
        setInitialChecked(true);
        setSetupDone(true);
        // initialSession provided by parent (no debug logs emitted)
        return;
      } catch (e) {
        // fallthrough to normal check
      }
    }

    // run initial check
    (async () => {
      setLoading(true);
      setInitialChecked(false);
      try {
        const payload: StartSessionIn = { class_id: Number(classId), phase: "initial" };
        const res = await startSession(payload);
        // expected res: { matched: boolean, ... }
        setMatched(Boolean(res?.matched));
        setMatchedInfo(res ?? null);
        setOverrideMode(res?.schedule_mode ?? null);
      } catch (err: any) {
        // If backend returns 403 it indicates a session conflict for this class+schedule.
        if (err?.status === 403) {
          const detail = String(err?.body?.detail ?? err?.message ?? 'A session is already active for this class');
          // Detect phrases indicating the session has already been ended earlier today
          const endedLike = /ended|already ended|session ended|closed earlier|already closed/i.test(detail || '');
          const msg = detail;
          toast({ title: endedLike ? 'Session already ended' : 'Session active', description: msg, variant: 'destructive' });
          setMatched(false);
          setMatchedInfo({ session_conflict: true, session_already_ended: Boolean(endedLike), detail: msg, raw: err?.body ?? null });
        } else {
          toast({ title: "Start check failed", description: String(err?.message ?? err), variant: "destructive" });
          setMatched(null);
          setMatchedInfo(null);
        }
      } finally {
        setInitialChecked(true);
        setLoading(false);
      }
    })();
  }, [open, classId]);

  // createdSession changes (no debug logs emitted)
  useEffect(() => {
    // intentionally left blank for side-effects if needed in future
  }, [createdSession]);

  // Log createdF2F value when it changes so we can confirm rendering decision
  /* createdF2F is declared later - move its debug effect below its declaration */

  // utility to request geolocation
  function getCurrentPositionAsync(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator || !navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        options,
      );
    });
  }

  const handleSetup = async (): Promise<boolean> => {
    if (!classId) return false;
    setLoading(true);
    try {
      const payload: StartSessionIn = { class_id: Number(classId), phase: "setup" };
      if (overrideMode) {
        const norm = String(overrideMode).toLowerCase().replace(/[-\s]+/g, '_');
        payload.override_mode = norm as any;
      }
      const res = await startSession(payload);
      // Prefer explicit `classCode` prop if provided, otherwise use matchedInfo
      const resolvedCode =
        (classCode as string) ||
        (matchedInfo?.class_code as string) ||
        (matchedInfo?.class?.code as string) ||
        (matchedInfo?.class?.class_code as string) ||
        `Class ${classId}`;
      toast({ title: `Session for ${resolvedCode} has started` });
      setMatchedInfo(res ?? matchedInfo);
      setSetupDone(true);
      return true;
    } catch (err: any) {
      toast({ title: "Setup failed", description: String(err?.message ?? err), variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Run setup first; only proceed to start if setup succeeded
    if (!setupDone) {
      const ok = await handleSetup();
      if (!ok) return;
    }

    await handleStart();
  };

  const handleStart = async () => {
    if (!classId) return;
    setLoading(true);
    // Friendly class label for toasts
    const resolvedCode =
      (classCode as string) ||
      (matchedInfo?.class_code as string) ||
      (matchedInfo?.class?.code as string) ||
      (matchedInfo?.class?.class_code as string) ||
      `Class ${classId}`;
    try {
      const payload: StartSessionIn = { class_id: Number(classId), phase: "face_recognition" };
      if (overrideMode) {
        const norm = String(overrideMode).toLowerCase().replace(/[-\s]+/g, '_');
        payload.override_mode = norm as any;
      }

      // determine effective mode (override takes precedence)
      const effectiveMode = (overrideMode as string) || (matchedInfo && (matchedInfo.schedule_mode ?? matchedInfo.schedule_mode)) || null;

      // If hybrid, ensure we have geolocation coordinates
      if (effectiveMode === 'hybrid') {
        // if coords already obtained, use them; otherwise try to request
        if (!coords) {
          try {
            setGeoStatus('requesting');
            const pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
            const { latitude, longitude } = pos.coords;
            setCoords({ latitude, longitude });
            setGeoStatus('granted');
            payload.latitude = Number(latitude);
            payload.longitude = Number(longitude);
          } catch (err: any) {
            setGeoStatus('denied');
            const msg = err?.message || String(err || 'Failed to obtain location');
            setGeoError(msg);
            toast({ title: 'Location required', description: 'Hybrid sessions require geolocation. Please allow location access and try again.', variant: 'destructive' });
            setLoading(false);
            return;
          }
        } else {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
        }
      }

      // If caller is a secretary we must perform face verification with an uploaded file.
      if (!capturedFile && isSecretary) {
        // Camera is open by default in the dialog; just bail and wait for capture.
        setLoading(false);
        return;
      }

      // If we have a capturedFile (secretary flow), use multipart upload
      if (capturedFile) {
        const mPayload: StartSessionIn & { face_file?: File } = { ...payload } as any;
        if (payload.override_mode) mPayload.override_mode = payload.override_mode;
        if (payload.latitude != null) mPayload.latitude = payload.latitude;
        if (payload.longitude != null) mPayload.longitude = payload.longitude;
        mPayload.face_file = capturedFile;

        const res = await startSessionMultipart(mPayload);
        if (onCreated) onCreated(res);
        // If backend activated f2f scanning for this session, keep the dialog open
        if (res?.f2f_activated) {
          setCreatedSession(res);
          // clear captured preview/file so camera can be used for f2f
          setCapturedDataUrl(null);
          setCapturedFile(null);
          setLoading(false);
          toast({ title: 'Session created', description: 'Face-to-face session active — scanning for attendees.' });
          return;
        }
        // Non-F2F successful creation -> notify and close
        try { toast({ title: `Session for ${resolvedCode} has started` }); } catch (e) {}
        try { onOpenChange(false); } catch (e) {}
        setCreatedSession(null);
        setCapturedDataUrl(null);
        setCapturedFile(null);
      }

      // Non-secretary or no-file flow: JSON API
      const res = await startSession(payload);
      // creation success -> return session object
      if (onCreated) onCreated(res);
      // if backend activated F2F scanning, keep dialog open and render scanner
      if (res?.f2f_activated) {
        setCreatedSession(res);
        toast({ title: 'Session created', description: 'Face-to-face session active — scanning for attendees.' });
      } else {
        // Non-F2F successful creation -> notify and close
        try { toast({ title: `Session for ${resolvedCode} has started` }); } catch (e) {}
        try { onOpenChange(false); } catch (e) {}
        setCreatedSession(null);
      }
    } catch (err: any) {
      toast({ title: "Start failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Handler for face-to-face recognition callbacks from F2FFaceCamera
  const handleF2FRecognized = async (dataUrl: string, box: any, faceHash: string) => {
    if (!classId || !createdSession) return false;
    const sessionId = createdSession?.id ?? null;
    if (!sessionId) return false;

    setLoading(true);
    try {
      // convert dataURL to blob
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      const blob = new Blob([u8arr], { type: mime });

      const resp = await markPresentF2F({
        class_id: Number(classId),
        session_id: Number(sessionId),
        latitude: coords?.latitude ?? undefined,
        longitude: coords?.longitude ?? undefined,
        face_file: blob,
      });

      // Prefer structured `match_info` returned by the endpoint, fallback to legacy remarks parsing
      let matchInfo: any = resp?.match_info ?? null;
      if (!matchInfo) {
        try {
          const remarks: string = resp?.remarks || '';
          const marker = 'MATCH_INFO:';
          const idx = remarks.indexOf(marker);
          if (idx >= 0) {
            const jsonPart = remarks.slice(idx + marker.length).trim();
            matchInfo = JSON.parse(jsonPart);
          }
        } catch (e) {
          /* ignore parse errors */
        }
      }

      if (matchInfo) {
        const THRESHOLD = 0.45;
        // normalize score to number when possible
        const rawScore = typeof matchInfo.score === 'number' ? matchInfo.score : Number(matchInfo.score);
        const hasScore = !Number.isNaN(rawScore) && rawScore != null;
        const scoreStr = hasScore ? rawScore.toFixed(4) : null;

        if (hasScore) {
          // Note: lower score is better (distance/cosine where lower indicates closer match)
          const passed = rawScore < THRESHOLD;
          if (passed) {
            toast({ title: 'Attendance recorded', description: (
              <div>
                <div>Match score: {scoreStr} (threshold: {THRESHOLD.toFixed(2)}) — Verified</div>
                <div className="text-xs text-muted-foreground">Model: {matchInfo.model} • Metric: {matchInfo.metric}</div>
              </div>
            ) });
          } else {
            toast({ title: 'Face recognition above threshold', description: (
              <div>
                <div>Match score: {scoreStr} (threshold: {THRESHOLD.toFixed(2)}) — Not verified</div>
                <div className="text-xs text-muted-foreground">Try again with better lighting or remove face occlusions.</div>
              </div>
            ), variant: 'destructive' });
          }
        } else {
          // no numeric score provided — fall back to matched boolean when available
          if (matchInfo.matched) {
            toast({ title: 'Attendance recorded', description: 'Face matched — attendance recorded.' });
          } else {
            toast({ title: 'Face recognition failed', description: 'Face recognition did not match our records.', variant: 'destructive' });
          }
        }
      } else {
        toast({ title: 'Attendance recorded', description: 'An attendee was recorded.' });
      }

      setLoading(false);
      // Return the server response object so the caller (F2FFaceCamera)
      // can examine match_info/status and decide whether to debounce.
      return resp;
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message ?? String(err);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  const requestLocation = async () => {
    setGeoError(null);
    setGeoStatus('requesting');
    try {
      const pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      const { latitude, longitude } = pos.coords;
      setCoords({ latitude, longitude });
      setGeoStatus('granted');
      toast({ title: 'Location obtained', description: `Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}` });
    } catch (err: any) {
      setGeoStatus('denied');
      const msg = err?.message || String(err || 'Failed to obtain location');
      setGeoError(msg);
      toast({ title: 'Location error', description: msg, variant: 'destructive' });
    }
  };

  // Automatically request geolocation when the effective mode becomes hybrid
  useEffect(() => {
    const eff = (overrideMode ?? matchedInfo?.schedule_mode) as string | null;
    if (!open) return;
    if (eff === 'hybrid') {
      // If we already have coords or permission granted/requesting, don't repeat
      if (coords || geoStatus === 'granted' || geoStatus === 'requesting') return;
      // fire-and-forget request
      requestLocation();
    }
    // only trigger when overrideMode or matchedInfo change or dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideMode, matchedInfo, open]);

  const submitCapturedFace = async (dataUrl: string) => {
    if (!classId) return;
    setLoading(true);
    // Friendly class label for toasts
    const resolvedCode =
      (classCode as string) ||
      (matchedInfo?.class_code as string) ||
      (matchedInfo?.class?.code as string) ||
      (matchedInfo?.class?.class_code as string) ||
      `Class ${classId}`;
    try {
      setCapturedDataUrl(dataUrl);
      // convert dataURL to blob
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const file = new File([blob], 'secretary.jpg', { type: blob.type || 'image/jpeg' });
      setCapturedFile(file);

      // If an override mode is selected, submit as `phase='setup'` so
      // the backend will process the override (override only runs in setup).
      // Otherwise, perform face verification via 'face_recognition'.
      const payload: StartSessionIn = { class_id: Number(classId), phase: (overrideMode ? 'setup' : 'face_recognition') };
      if (overrideMode) {
        const norm = String(overrideMode).toLowerCase().replace(/[-\s]+/g, '_');
        payload.override_mode = norm as any;
      }
      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }

      const mPayload: any = { ...payload };
      // include schedule hints when available
      if (matchedInfo?.schedule_id) mPayload.schedule_id = matchedInfo.schedule_id;
      if (matchedInfo?.schedule_special_id) mPayload.schedule_special_id = matchedInfo.schedule_special_id;
      mPayload.face_file = file;

      // Two-step flow: if overrideMode selected, first call setup to apply override,
      // then perform face recognition in a separate face_recognition request with the file.
      if (overrideMode) {
        try {
          toast({ title: 'Applying override', description: `Applying override: ${overrideMode}` });
        } catch (e) {}
        // Build setup payload (no face file)
        const setupPayload: StartSessionIn = { class_id: Number(classId), phase: 'setup' };
        if (overrideMode) setupPayload.override_mode = String(overrideMode).toLowerCase().replace(/[-\s]+/g, '_') as any;
        if (coords) {
          setupPayload.latitude = coords.latitude;
          setupPayload.longitude = coords.longitude;
        }
        if (matchedInfo?.schedule_id) (setupPayload as any).schedule_id = matchedInfo.schedule_id;
        if (matchedInfo?.schedule_special_id) (setupPayload as any).schedule_special_id = matchedInfo.schedule_special_id;

        // setup attempt (no debug logs emitted)
        let setupRes: any = null;
        try {
          setupRes = await startSession(setupPayload);
          // setup result (no debug logs emitted)
        } catch (e: any) {
          // log and rethrow so outer handler can show toast
          // eslint-disable-next-line no-console
          console.error('startSession (setup) failed', e);
          throw e;
        }
        // If setup activated F2F, inform the user and continue to perform
        // face_recognition so the backend can create the actual session.
        if (setupRes?.f2f_activated) {
          try { toast({ title: 'Override applied', description: 'Face-to-face mode enabled — verifying face to create session.' }); } catch (e) {}
          // do not return here; proceed to recognition phase to create the session
        }

        // Now perform face recognition phase with multipart upload
        const recogPayload: any = { class_id: Number(classId), phase: 'face_recognition' };
        if (coords) {
          recogPayload.latitude = coords.latitude;
          recogPayload.longitude = coords.longitude;
        }
        if (matchedInfo?.schedule_id) recogPayload.schedule_id = matchedInfo.schedule_id;
        if (matchedInfo?.schedule_special_id) recogPayload.schedule_special_id = matchedInfo.schedule_special_id;
        recogPayload.face_file = file;

        try {
          toast({ title: 'Uploading face', description: 'Uploading face for verification...' });
        } catch (e) {}
        // recognition payload prepared
        let res: any = null;
        try {
          res = await startSessionMultipart(recogPayload);
        } catch (e: any) {
          // eslint-disable-next-line no-console
          console.error('startSessionMultipart (recognition) failed', e);
          throw e;
        }
        if (onCreated) onCreated(res);
        if (res?.f2f_activated) {
          setCreatedSession(res);
          setCapturedDataUrl(null);
          setCapturedFile(null);
          setLoading(false);
          toast({ title: 'Session created', description: 'Face-to-face session active — scanning for attendees.' });
          return;
        }
        // Non-F2F successful creation -> notify and close
        try { toast({ title: `Session for ${resolvedCode} has started` }); } catch (e) {}
        try { onOpenChange(false); } catch (e) {}
        setCreatedSession(null);
        setCapturedDataUrl(null);
        setCapturedFile(null);
        return;
      }

      // No override selected: single-step recognition upload
      try {
        toast({ title: 'Uploading face', description: 'Uploading face for verification...' });
      } catch (e) {}
      // helpful debug when troubleshooting network/no-send issues
      // multipart payload prepared for upload
      const res = await startSessionMultipart(mPayload);
      if (onCreated) onCreated(res);
      // If backend activated f2f scanning for this session, keep the dialog open
      if (res?.f2f_activated) {
        setCreatedSession(res);
        // clear captured preview/file so camera can be used for f2f
        setCapturedDataUrl(null);
        setCapturedFile(null);
        setLoading(false);
        toast({ title: 'Session created', description: 'Face-to-face session active — scanning for attendees.' });
        return;
      }
      // Non-F2F successful creation -> notify and close
      try { toast({ title: `Session for ${resolvedCode} has started` }); } catch (e) {}
      try { onOpenChange(false); } catch (e) {}
      setCreatedSession(null);
      setCapturedDataUrl(null);
      setCapturedFile(null);
    } catch (err: any) {
      // If face verification failed, allow retry
      if (err?.status === 403) {
        const msg = String(err?.message ?? err?.body?.detail ?? 'Face verification failed');
        toast({ title: 'Face verification failed', description: msg, variant: 'destructive' });
        // allow retry: clear captured data so camera can capture again
        setCapturedDataUrl(null);
        setCapturedFile(null);
        return;
      }
      toast({ title: 'Start failed', description: String(err?.message ?? err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const effectiveMode = (overrideMode as string) || (matchedInfo && matchedInfo.schedule_mode) || null;
  // tolerant computation of whether this dialog should show the F2F scanner
  const createdF2F = Boolean(
    createdSession && (
      ((createdSession as any).f2f_activated) ||
      ((createdSession as any).f2fActivated) ||
      ((createdSession as any).schedule_mode === 'face_to_face') ||
      (createdSession?.mode && /face|f2f/i.test(String(createdSession.mode)))
    )
  );

  // createdF2F value changed (no debug logs emitted)
  useEffect(() => {}, [createdF2F]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{(createdF2F || initialSession) ? 'Face-to-face scanner' : 'Start Session'}</DialogTitle>
        </DialogHeader>

        <div className="py-3">
          {!initialChecked ? (
            <div className="text-sm text-muted-foreground">Checking schedule for current time…</div>
          ) : matched === false && matchedInfo?.session_conflict ? (
            <div className="rounded-md bg-red-50 border border-red-100 p-3 text-red-700 text-sm">{matchedInfo?.detail ?? 'A session is already active for this class and schedule.'}</div>
          ) : matched === false ? (
            <div className="rounded-md bg-gray-50 border border-gray-100 p-3 text-sm text-muted-foreground">No active schedule found for this class at the current time.</div>
          ) : (
            createdF2F ? (
              <div className="space-y-3">
                <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
                  <div className="text-sm font-medium mb-2">Face-to-face scanner</div>
                  <div className="rounded-md overflow-hidden bg-gray-50 p-3 flex items-center justify-center">
                    <F2FFaceCamera
                      onRecognized={handleF2FRecognized}
                      debounceMinutes={5}
                      width={420}
                      height={320}
                      initialDelayMs={3000}
                      requestIntervalMs={3000}
                      bypassFilters={false}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Face-to-face mode: camera will automatically scan and record attendance when a face is recognized.</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Matched schedule</div>
                  <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Type</div>
                        <div className="font-medium">{matchedInfo?.schedule_type ?? 'regular'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Schedule</div>
                        <div className="font-medium">{matchedInfo?.schedule_id ?? matchedInfo?.schedule_special_id ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Mode</div>
                        <div className="inline-block px-2 py-0.5 text-xs rounded-md bg-blue-50 text-blue-700 font-medium">{matchedInfo?.schedule_mode ?? 'not set'}</div>
                      </div>
                    </div>
                  </div>

                  {createdSession && (
                    <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-100 p-3 text-emerald-900">
                      <div className="text-sm font-medium">Session created</div>
                      <div className="text-sm">ID: {createdSession?.id ?? 'unknown'}</div>
                      {createdSession?.start_time && <div className="text-sm">Time: {createdSession.start_time} — {createdSession.end_time}</div>}
                    </div>
                  )}

                  <div>
                    <div className="text-sm mb-2">Override Mode (optional)</div>
                    <Select onValueChange={(v) => setOverrideMode(v === 'none' ? null : v)} value={overrideMode ?? "none"}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder={overrideMode ?? "Use schedule mode"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Use schedule mode</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="face_to_face">Face to face</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground">Schedule mode: <span className="font-medium">{(overrideMode ?? (matchedInfo?.schedule_mode ?? 'unknown'))}</span></div>
                    <div className="mt-2 space-y-2 bg-gray-50 border border-gray-100 p-3 rounded-md">
                      {matchedInfo?.session_already_ended ? (
                        <div className="text-sm text-destructive">A session for this class and schedule was already started and ended earlier today. {matchedInfo?.detail ? <span className="block text-xs text-muted-foreground mt-1">{matchedInfo.detail}</span> : null}</div>
                      ) : (
                        <div className="text-sm text-destructive">{matchedInfo?.detail ?? 'A session is already active for this class and schedule.'}</div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        {geoStatus === 'idle' && 'Location will be requested automatically for hybrid mode.'}
                        {geoStatus === 'requesting' && 'Requesting location…'}
                        {geoStatus === 'granted' && coords && `Lat ${coords.latitude.toFixed(6)}, Lon ${coords.longitude.toFixed(6)}`}
                        {geoStatus === 'denied' && `Denied: ${geoError ?? 'permission denied'}`}
                        {geoStatus === 'error' && `Error: ${geoError ?? 'unknown'}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {isSecretary && (
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
                      <div className="text-sm font-medium mb-2">Secretary verification</div>
                      <div className="text-sm text-muted-foreground mb-3">Follow the instructions and blink naturally to capture your face.</div>
                      <div className="rounded-md overflow-hidden bg-gray-50 p-3 flex items-center justify-center">
                        <OnlineFaceCamera onCapture={submitCapturedFace} />
                      </div>
                      {/* Capture auto-submits; controls removed for secretary flow */}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Secretary camera is rendered in the right column card above; duplicate removed. */}

        <DialogFooter>
          <div className="flex gap-2">
            {!isSecretary && !createdSession ? (
              <>
                {!matchedInfo?.session_conflict ? (
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                ) : null}
                {matched && (
                  <Button onClick={handleNext} disabled={loading || (setupDone && effectiveMode === 'hybrid' && !coords)}>Start</Button>
                )}
              </>
            ) : createdSession ? (
              <Button onClick={() => { setCreatedSession(null); onOpenChange(false); }}>Done</Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
