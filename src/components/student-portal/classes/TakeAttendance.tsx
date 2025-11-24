"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FaceCamera from "@/components/online-face-camera";
import F2FFaceCamera from "@/components/f2f-face-camera";
import { markPresent, markPresentF2F } from '@/lib/api/attendance';
import { useToast } from '@/hooks/use-toast';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classItem?: any;
  sessionInfo?: any | null;
  onCapture?: (dataUrl: string) => void;
  onRetake?: () => void;
  onRecorded?: (record?: any) => void;
};

export default function TakeAttendance({ open, onOpenChange, classItem, sessionInfo = null, onCapture, onRetake, onRecorded }: Props) {
  const [faceValidated, setFaceValidated] = React.useState(false);
  const [lastCaptured, setLastCaptured] = React.useState<string | null>(null);
  const [lat, setLat] = React.useState<string | null>(null);
  const [lon, setLon] = React.useState<string | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [locationConfirmed, setLocationConfirmed] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleFaceCapture = (dataUrl: string) => {
    setFaceValidated(true);
    setLastCaptured(dataUrl);
  };

  const handleRetake = () => {
    setFaceValidated(false);
    setLastCaptured(null);
    if (typeof onRetake === 'function') {
      try { onRetake(); } catch (e) { console.warn('onRetake callback threw', e); }
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const handleRecord = async () => {
    if (!lastCaptured) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      // determine modes
      const modesRaw = Array.isArray(sessionInfo?.current_schedule_modes) && sessionInfo.current_schedule_modes.length > 0
        ? sessionInfo.current_schedule_modes
        : sessionInfo?.current_schedule?.modes ?? null;
      const modes = Array.isArray(modesRaw) ? modesRaw.map((m: any) => String(m ?? '').toLowerCase()) : [];

      const isOnline = modes.includes('online');
      const isHybrid = modes.includes('hybrid');

      // validations
      if ((isOnline || isHybrid) && !lastCaptured) {
        setSubmitError('No face capture available');
        setSubmitting(false);
        return;
      }
      if (isHybrid && !(lat && lon)) {
        setSubmitError('Location is required for hybrid mode');
        setSubmitting(false);
        return;
      }

      const classId = sessionInfo?.class?.id ?? classItem?.id ?? null;
      const sessionId = sessionInfo?.active_session_id ?? sessionInfo?.session_id ?? null;
      if (!classId || !sessionId) {
        setSubmitError('Missing class or session id');
        setSubmitting(false);
        return;
      }

      // convert lastCaptured dataURL to blob
      const blob = dataURLtoBlob(lastCaptured);

      const resp = await markPresent({
        class_id: Number(classId),
        session_id: Number(sessionId),
        latitude: lat ?? undefined,
        longitude: lon ?? undefined,
        face_file: blob,
      });
      // Parse MATCH_INFO from remarks (if present) and show user feedback
      try {
        const remarks: string = resp?.remarks || '';
        let matchInfo: any = null;
        const marker = 'MATCH_INFO:';
        const idx = remarks.indexOf(marker);
        if (idx >= 0) {
          const jsonPart = remarks.slice(idx + marker.length).trim();
          try { matchInfo = JSON.parse(jsonPart); } catch (e) { /* ignore parse errors */ }
        }

        if (matchInfo) {
          const THRESHOLD = 0.45;
          const rawScore = typeof matchInfo.score === 'number' ? matchInfo.score : Number(matchInfo.score);
          const hasScore = !Number.isNaN(rawScore) && rawScore != null;
          const scoreStr = hasScore ? rawScore.toFixed(4) : null;

          if (hasScore) {
            // lower scores are better (distance/cosine where smaller indicates a closer match)
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
                  <div className="text-xs text-muted-foreground">Try again or retake the photo.</div>
                </div>
              ), variant: 'destructive' });
            }
          } else {
            if (matchInfo.matched) {
              toast({ title: 'Attendance recorded', description: 'Face matched — attendance recorded.' });
            } else {
              toast({ title: 'Face recognition failed', description: 'Face recognition did not match our records.', variant: 'destructive' });
            }
          }
        } else {
          toast({ title: 'Attendance recorded', description: 'Your attendance was recorded successfully.' });
        }
      } catch (e) {
        // If something in the UI parsing fails, still continue with callbacks
      }

      // success callbacks
      if (typeof onCapture === 'function') {
        try { onCapture(lastCaptured); } catch (e) { console.warn('onCapture callback threw', e); }
      }
      if (typeof onRecorded === 'function') {
        try { onRecorded(resp); } catch (e) { console.warn('onRecorded callback threw', e); }
      }
      onOpenChange(false);
    } catch (err: any) {
      // Handle structured hybrid distance errors and other 403 details
      const status = err?.status;
      const body = err?.body ?? {};
      try {
        if (status === 403 && body && typeof body === 'object' && body.distance_km != null && body.threshold_km != null) {
          const distanceKm = Number(body.distance_km);
          const thresholdKm = Number(body.threshold_km);
          const distanceM = Math.round(distanceKm * 1000);
          const thresholdM = Math.round(thresholdKm * 1000);
          const diffM = Math.max(0, distanceM - thresholdM);
          const msg = body.error || 'You are outside the allowed area for this hybrid session.';
          toast({ title: 'Location not allowed', description: (
            <div>
              <div>{msg}</div>
              <div className="text-xs text-muted-foreground">Measured: {distanceM} m • Allowed: {thresholdM} m</div>
              {diffM > 0 && <div className="text-xs">Try moving closer by ~{diffM} m.</div>}
            </div>
          ), variant: 'destructive' });
          setSubmitError(msg);
        } else if (status === 403) {
          // Face recognition or generic forbidden detail. Provide more helpful guidance
          const rawMsg = (body && (body.detail || body.error || body.message)) || err?.message || 'Action forbidden';
          const lc = String(rawMsg).toLowerCase();
          if (lc.includes('face recognition failed') || lc.includes('face not matched') || lc.includes('face_match')) {
            const msg = 'Face recognition failed. Your photo did not match our records.';
            toast({ title: 'Face recognition failed', description: (
              <div>
                <div>{msg}</div>
                <ul className="text-xs mt-2 list-disc list-inside text-muted-foreground">
                  <li>Ensure good lighting</li>
                  <li>Remove sunglasses</li>
                  <li>Make sure only your face is visible</li>
                  <li>Look directly in the camera</li>
                </ul>
              </div>
            ), variant: 'destructive' });
            setSubmitError(msg);
          } else {
            const msg = rawMsg || 'Action forbidden';
            toast({ title: 'Attendance rejected', description: msg, variant: 'destructive' });
            setSubmitError(msg);
          }
        } else {
          // Fallback: generic error handling. Sanitize sensitive server traces
          const raw = err?.message ?? err?.body ?? String(err);
          const rawStr = String(raw || '');
          const sensitivePatterns = ['psycopg2', 'InvalidTextRepresentation', 'invalid input syntax', 'SQL:', 'Traceback', 'stacktrace'];
          const containsSensitive = sensitivePatterns.some(p => rawStr.toLowerCase().includes(p.toLowerCase()));
          const safeMessage = containsSensitive
            ? 'Failed to record attendance due to a server error. Please try again later or contact support.'
            : rawStr || 'An unexpected error occurred.';

          // Log full raw error for developers/telemetry, but show safe message to users
          try { console.error('Attendance submission error (raw):', err); } catch (e) {}

          toast({ title: 'Error', description: safeMessage, variant: 'destructive' });
          setSubmitError(safeMessage);
        }
      } catch (parseErr) {
        const message = err?.message ?? String(err);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for face-to-face recognition callbacks from F2FFaceCamera
  const handleF2FRecognized = async (dataUrl: string, box: any, faceHash: string) => {
    // Avoid duplicate UI submissions
    if (!sessionInfo) return false;
    const classId = sessionInfo?.class?.id ?? classItem?.id ?? null;
    const sessionId = sessionInfo?.active_session_id ?? sessionInfo?.session_id ?? null;
    if (!classId || !sessionId) return false;

    // Small UI state: show verifying
    setSubmitting(true);
    setSubmitError(null);
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
        latitude: lat ?? undefined,
        longitude: lon ?? undefined,
        face_file: blob,
      });

      // Provide feedback similar to existing flow
      try {
        const remarks: string = resp?.remarks || '';
        let matchInfo: any = null;
        const marker = 'MATCH_INFO:';
        const idx = remarks.indexOf(marker);
        if (idx >= 0) {
          const jsonPart = remarks.slice(idx + marker.length).trim();
          try { matchInfo = JSON.parse(jsonPart); } catch (e) { /* ignore */ }
        }

        if (matchInfo) {
          const THRESHOLD = 0.45;
          const rawScore = typeof matchInfo.score === 'number' ? matchInfo.score : Number(matchInfo.score);
          const hasScore = !Number.isNaN(rawScore) && rawScore != null;
          const scoreStr = hasScore ? rawScore.toFixed(4) : null;

          if (hasScore) {
            const passed = rawScore >= THRESHOLD;
            if (passed) {
              toast({ title: 'Attendance recorded', description: (
                <div>
                  <div>Match score: {scoreStr} (threshold: {THRESHOLD.toFixed(2)}) — Verified</div>
                  <div className="text-xs text-muted-foreground">Model: {matchInfo.model} • Metric: {matchInfo.metric}</div>
                </div>
              ) });
            } else {
              toast({ title: 'Face recognition below threshold', description: (
                <div>
                  <div>Match score: {scoreStr} (threshold: {THRESHOLD.toFixed(2)}) — Not verified</div>
                  <div className="text-xs text-muted-foreground">Ensure good lighting and try again.</div>
                </div>
              ), variant: 'destructive' });
            }
          } else {
            if (matchInfo.matched) {
              toast({ title: 'Attendance recorded', description: 'Face matched — attendance recorded.' });
            } else {
              toast({ title: 'Face recognition failed', description: 'Face recognition did not match our records.', variant: 'destructive' });
            }
          }
        } else {
          toast({ title: 'Attendance recorded', description: 'Your attendance was recorded successfully.' });
        }
      } catch (e) {
        // ignore
      }

      if (typeof onRecorded === 'function') {
        try { onRecorded(resp); } catch (e) { console.warn('onRecorded callback threw', e); }
      }

      // keep the UI briefly then close
      setTimeout(() => {
        setSubmitting(false);
        onOpenChange(false);
      }, 700);

      // return true to indicate success for debounce
      return true;
    } catch (err: any) {
      setSubmitting(false);
      const msg = err?.message ?? String(err);
      setSubmitError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Take Attendance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <Label className="font-semibold text-lg mb-2">Face Verification</Label>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-lg">Use the camera to capture a clear photo of the attendee. Blink when asked to prove liveness. The system will validate the capture before recording attendance.</p>

              {/* Class & session details (from sessionInfo) */}
              {sessionInfo && (
                <div className="w-full mb-4 rounded-md border p-3 bg-muted/5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{sessionInfo?.class?.course_name ?? sessionInfo?.class?.class_code ?? 'Class'}</div>
                      <div className="text-xs text-muted-foreground">{sessionInfo?.class?.course_code ? `${sessionInfo.class.course_code} • ${sessionInfo.class.program_id ? sessionInfo.class.program_id : ''}` : sessionInfo?.class?.program_name ?? ''}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Room: {sessionInfo?.class?.room ?? 'TBA'}</div>
                      <div>Instructor: {sessionInfo?.class?.assigned_faculty_name ?? 'TBA'}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="font-medium">Active Schedule</div>
                      {sessionInfo?.current_schedule ? (
                        <div className="text-muted-foreground">
                          {sessionInfo.current_schedule.date ? (
                            <div>{new Date(sessionInfo.current_schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })}</div>
                          ) : (
                            <div>{sessionInfo.current_schedule.day_of_week ?? 'TBA'}</div>
                          )}
                          <div>{sessionInfo.current_schedule.start_time ? `${sessionInfo.current_schedule.start_time} - ${sessionInfo.current_schedule.end_time ?? ''}` : 'Time TBA'}</div>
                          <div>Modes: {(Array.isArray(sessionInfo.current_schedule.modes) && sessionInfo.current_schedule.modes.length) ? sessionInfo.current_schedule.modes.join(', ') : (Array.isArray(sessionInfo.current_schedule_modes) && sessionInfo.current_schedule_modes.length) ? sessionInfo.current_schedule_modes.join(', ') : 'unknown'}</div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No active schedule</div>
                      )}
                    </div>

                    <div>
                      <div className="font-medium">Session</div>
                      <div className="text-muted-foreground">Status: {sessionInfo?.session_active ? <span className="text-red-600">Live</span> : <span>Not Active</span>}</div>
                      <div className="text-muted-foreground">Session ID: {sessionInfo?.active_session_id ?? '—'}</div>
                      <div className="text-muted-foreground">Schedule ID: {sessionInfo?.current_schedule_id ?? '—'}</div>
                    </div>
                  </div>
                </div>
              )}
              {/* If the session is inactive, show the session_message (if provided) and hide the camera. */}
              {sessionInfo && sessionInfo.session_active === false ? (
                <div className="w-full p-6 rounded-md border bg-yellow-50 text-sm text-amber-800">
                  <div className="font-medium">Session not active</div>
                  <div className="mt-2">{sessionInfo.session_message ?? 'Session has not started yet for this class. Please inform your professor or secretary.'}</div>
                </div>
              ) : (
                /* Only use the online camera when the active schedule/mode is explicitly 'online'.
                   In other cases (face_to_face, hybrid) show a placeholder until other variants are implemented. */
                (() => {
                  const modesRaw = Array.isArray(sessionInfo?.current_schedule_modes) && sessionInfo.current_schedule_modes.length > 0
                    ? sessionInfo.current_schedule_modes
                    : sessionInfo?.current_schedule?.modes ?? null;
                  const modes = Array.isArray(modesRaw) ? modesRaw.map((m: any) => String(m ?? '').toLowerCase()) : [];
                  const isOnline = modes.includes('online');
                  const isHybrid = modes.includes('hybrid');
                  if (isOnline) {
                    return <FaceCamera onCapture={handleFaceCapture} onRetake={handleRetake} skipFaceDetect={true} />;
                  }

                  if (modes.includes('face_to_face') || modes.includes('f2f') ) {
                    // For face-to-face mode, use the F2F detector which auto-submits on recognition
                    return (
                      <div className="w-full">
                        <F2FFaceCamera onRecognized={handleF2FRecognized} debounceMinutes={5} width={420} height={320} bypassFilters={true} />
                        <div className="text-xs text-muted-foreground mt-2">Face-to-face mode: camera will automatically scan and record attendance when a face is recognized.</div>
                      </div>
                    );
                  }

                  if (isHybrid) {
                    return (
                      <div className="w-full">
                        <div className="mb-4 text-sm text-muted-foreground">This session requires location confirmation. Please provide your latitude and longitude, or use your device's location.</div>
                        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                          <div className="flex-1">
                            <label className="text-xs font-medium">Latitude</label>
                            <input type="text" value={lat ?? ''} onChange={(e) => { setLat(e.target.value); setLocationConfirmed(false); }} className="w-full border rounded px-2 py-1 mt-1" placeholder="e.g. 14.5995" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium">Longitude</label>
                            <input type="text" value={lon ?? ''} onChange={(e) => { setLon(e.target.value); setLocationConfirmed(false); }} className="w-full border rounded px-2 py-1 mt-1" placeholder="e.g. 120.9842" />
                          </div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <button className="btn btn-outline px-3 py-1 rounded border" onClick={async () => {
                              if (!('geolocation' in navigator)) { setLocationError('Geolocation not supported by this browser'); return; }
                              setLocating(true); setLocationError(null);
                              navigator.geolocation.getCurrentPosition((pos) => {
                                setLocating(false);
                                setLat(String(pos.coords.latitude));
                                setLon(String(pos.coords.longitude));
                                setLocationConfirmed(true);
                              }, (err) => {
                                setLocating(false);
                                setLocationError(err.message || 'Unable to get location');
                              }, { enableHighAccuracy: true, timeout: 10000 });
                            }} disabled={locating}>
                              {locating ? 'Locating...' : 'Use my location'}
                            </button>
                            <button className="btn btn-primary px-3 py-1 rounded bg-blue-600 text-white" onClick={() => {
                              // confirm manual coordinates
                              if (lat && lon) { setLocationConfirmed(true); setLocationError(null); } else { setLocationError('Please enter both latitude and longitude'); }
                            }}>Confirm</button>
                          </div>
                        </div>
                        {locationError && <div className="text-red-600 text-sm mt-2">{locationError}</div>}

                        {/* Show camera after location confirmed */}
                        {locationConfirmed ? (
                          <div className="mt-4">
                            <FaceCamera onCapture={handleFaceCapture} onRetake={handleRetake} skipFaceDetect={true} />
                          </div>
                        ) : (
                          <div className="mt-4 text-xs text-muted-foreground">Camera will be available after location is confirmed.</div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Attendance for this class is not yet supported for the selected mode.
                      <div className="mt-2">Mode: {modes.length ? modes.join(', ') : 'unknown'}</div>
                    </div>
                  );
                })()
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleRecord} disabled={
              !faceValidated || 
              (sessionInfo && sessionInfo.session_active === false) ||
              // if hybrid mode, require location confirmed
              ((() => {
                const modesRaw = Array.isArray(sessionInfo?.current_schedule_modes) && sessionInfo.current_schedule_modes.length > 0
                  ? sessionInfo.current_schedule_modes
                  : sessionInfo?.current_schedule?.modes ?? null;
                const modes = Array.isArray(modesRaw) ? modesRaw.map((m: any) => String(m ?? '').toLowerCase()) : [];
                return modes.includes('hybrid') && !locationConfirmed;
              })())
            }>
              {submitting ? 'Recording...' : 'Record Attendance'}
            </Button>
          </div>
          {submitError && <div className="text-sm text-red-600 mt-2">{submitError}</div>}
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
