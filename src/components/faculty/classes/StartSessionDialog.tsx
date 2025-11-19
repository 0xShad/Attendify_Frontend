"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { startSession, StartSessionIn } from "@/lib/api/attendance";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string | number | null;
  onCreated?: (session: any) => void;
}

export default function StartSessionDialog({ open, onOpenChange, classId, onCreated }: Props) {
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

  const handleSetup = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const payload: StartSessionIn = { class_id: Number(classId), phase: "setup" };
      if (overrideMode) payload.override_mode = overrideMode as any;
      const res = await startSession(payload);
      toast({ title: "Setup confirmed", description: "Schedule setup confirmed" });
      setMatchedInfo(res ?? matchedInfo);
    } catch (err: any) {
      toast({ title: "Setup failed", description: String(err?.message ?? err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

      // For online/face_to_face, do not send geolocation
      if (effectiveMode && effectiveMode !== 'hybrid') {
        // ensure we don't include coords
        // nothing to do — payload has no latitude/longitude unless hybrid
      }

      const res = await startSession(payload);
      // creation success -> return session object
      toast({ title: "Session started", description: `Session created (id: ${res?.id ?? 'unknown'})` });
      setCreatedSession(res);
      if (onCreated) onCreated(res);
      // keep dialog open and show inline confirmation for better UX
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

  const effectiveMode = (overrideMode as string) || (matchedInfo && matchedInfo.schedule_mode) || null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!initialChecked ? (
            <div>Checking schedule for current time…</div>
          ) : matched === false && matchedInfo?.session_conflict ? (
            <div className="text-sm text-destructive">{matchedInfo?.detail ?? 'A session is already active for this class and schedule.'}</div>
          ) : matched === false ? (
            <div className="text-sm text-muted-foreground">No active schedule found for this class at the current time.</div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm">Matched schedule:</div>
              <div className="bg-stone-100 p-2 rounded text-sm">
                <div><strong>Type:</strong> {matchedInfo?.schedule_type ?? 'regular'}</div>
                <div><strong>Schedule ID:</strong> {matchedInfo?.schedule_id ?? matchedInfo?.schedule_special_id ?? '—'}</div>
                <div><strong>Mode:</strong> {matchedInfo?.schedule_mode ?? 'not set'}</div>
              </div>

              {createdSession && (
                <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">
                  <div className="text-sm font-medium">Session created</div>
                  <div className="text-sm">ID: {createdSession?.id ?? 'unknown'}</div>
                  {createdSession?.start_time && <div className="text-sm">Time: {createdSession.start_time} — {createdSession.end_time}</div>}
                </div>
              )}

              <div>
                <div className="text-sm mb-1">Override Mode (optional)</div>
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

              {/* Show effective mode and geolocation UI for hybrid */}
              <div className="pt-2">
                <div className="text-sm text-muted-foreground">Schedule mode: <span className="font-medium">{(overrideMode ?? (matchedInfo?.schedule_mode ?? 'unknown'))}</span></div>
                {((overrideMode ?? matchedInfo?.schedule_mode) === 'hybrid') && (
                  <div className="mt-2 space-y-2">
                    <div className="text-sm">Hybrid mode requires location. Current status:</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        {geoStatus === 'idle' && 'Location not obtained'}
                        {geoStatus === 'requesting' && 'Requesting location…'}
                        {geoStatus === 'granted' && coords && `Lat ${coords.latitude.toFixed(6)}, Lon ${coords.longitude.toFixed(6)}`}
                        {geoStatus === 'denied' && `Denied: ${geoError ?? 'permission denied'}`}
                        {geoStatus === 'error' && `Error: ${geoError ?? 'unknown'}`}
                      </div>
                      <div>
                        <Button size="sm" onClick={requestLocation} disabled={geoStatus === 'requesting'}>Get location</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
            <div className="flex gap-2">
            {!createdSession ? (
              <>
                {!matchedInfo?.session_conflict ? (
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                ) : null}
                {matched && (
                  <>
                    <Button onClick={handleSetup} disabled={loading}>Confirm Setup</Button>
                    <Button onClick={handleStart} disabled={loading || (effectiveMode === 'hybrid' && !coords)}>Start Session</Button>
                  </>
                )}
              </>
            ) : (
              <Button onClick={() => { setCreatedSession(null); onOpenChange(false); }}>Done</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
