"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { startSession, startSessionMultipart, StartSessionIn } from "@/lib/api/attendance";
import OnlineFaceCamera from "@/components/online-face-camera";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string | number | null;
  classCode?: string | null;
  onCreated?: (session: any) => void;
  isSecretary?: boolean;
}

export default function StartSessionDialog({ open, onOpenChange, classId, classCode, onCreated, isSecretary = false }: Props) {
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
        // If backend returns 403 it indicates a session is already active for this class+schedule
        if (err?.status === 403) {
          const msg = String(err?.message ?? err?.body?.detail ?? 'A session is already active for this class');
          toast({ title: 'Session active', description: msg, variant: 'destructive' });
          setMatched(false);
          setMatchedInfo({ session_conflict: true, detail: msg, raw: err?.body ?? null });
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
      if (overrideMode) payload.override_mode = overrideMode as any;
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
    try {
      const payload: StartSessionIn = { class_id: Number(classId), phase: "face_recognition" };
      if (overrideMode) payload.override_mode = overrideMode as any;

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
        try { onOpenChange(false); } catch (e) {}
        setCreatedSession(null);
        setCapturedDataUrl(null);
        setCapturedFile(null);
        setLoading(false);
        return;
      }

      // Non-secretary or no-file flow: JSON API
      const res = await startSession(payload);
      // creation success -> return session object
      if (onCreated) onCreated(res);
      try { onOpenChange(false); } catch (e) {}
      setCreatedSession(null);
    } catch (err: any) {
      toast({ title: "Start failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setLoading(false);
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
    try {
      setCapturedDataUrl(dataUrl);
      // convert dataURL to blob
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const file = new File([blob], 'secretary.jpg', { type: blob.type || 'image/jpeg' });
      setCapturedFile(file);

      const payload: StartSessionIn = { class_id: Number(classId), phase: 'face_recognition' };
      if (overrideMode) payload.override_mode = overrideMode as any;
      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }

      const mPayload: any = { ...payload };
      // include schedule hints when available
      if (matchedInfo?.schedule_id) mPayload.schedule_id = matchedInfo.schedule_id;
      if (matchedInfo?.schedule_special_id) mPayload.schedule_special_id = matchedInfo.schedule_special_id;
      mPayload.face_file = file;

      const res = await startSessionMultipart(mPayload);
      if (onCreated) onCreated(res);
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Session</DialogTitle>
        </DialogHeader>

        <div className="py-3">
          {!initialChecked ? (
            <div className="text-sm text-muted-foreground">Checking schedule for current time…</div>
          ) : matched === false && matchedInfo?.session_conflict ? (
            <div className="rounded-md bg-red-50 border border-red-100 p-3 text-red-700 text-sm">{matchedInfo?.detail ?? 'A session is already active for this class and schedule.'}</div>
          ) : matched === false ? (
            <div className="rounded-md bg-gray-50 border border-gray-100 p-3 text-sm text-muted-foreground">No active schedule found for this class at the current time.</div>
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
                  {((overrideMode ?? matchedInfo?.schedule_mode) === 'hybrid') && (
                    <div className="mt-2 space-y-2 bg-gray-50 border border-gray-100 p-3 rounded-md">
                      <div className="text-sm font-medium">Hybrid mode requires location</div>
                      <div className="text-sm text-muted-foreground">
                        {geoStatus === 'idle' && 'Location will be requested automatically for hybrid mode.'}
                        {geoStatus === 'requesting' && 'Requesting location…'}
                        {geoStatus === 'granted' && coords && `Lat ${coords.latitude.toFixed(6)}, Lon ${coords.longitude.toFixed(6)}`}
                        {geoStatus === 'denied' && `Denied: ${geoError ?? 'permission denied'}`}
                        {geoStatus === 'error' && `Error: ${geoError ?? 'unknown'}`}
                      </div>
                    </div>
                  )}
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
